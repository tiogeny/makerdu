<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { RotateCw, Maximize2, Eye, Box, CheckCircle2, XCircle, RefreshCw } from 'lucide-vue-next';

const props = defineProps({
    dimensions: {
        type: Object,
        default: () => ({ x_mm: 40, y_mm: 40, z_mm: 10 }),
    },
    limits: {
        type: Object,
        default: () => ({ max_x_mm: 50, max_y_mm: 50, max_z_mm: 15 }),
    },
    isValid: {
        type: Boolean,
        default: true,
    },
    file: {
        type: [Object, File],
        default: null,
    },
    fileUrl: {
        type: String,
        default: '',
    },
    fileName: {
        type: String,
        default: 'modelo_3d.stl',
    },
});

const containerRef = ref(null);
const isAutoRotating = ref(false);
const isWireframe = ref(false);
const isLoading = ref(false);

let scene, camera, renderer, controls, animationFrameId;
let modelMesh, limitBoxMesh, gridHelper;

const initThree = () => {
    if (!containerRef.value) return;

    const width = containerRef.value.clientWidth;
    const height = containerRef.value.clientHeight || 300;

    // 1. Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // slate-950

    // 2. Camera
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(65, 55, 80);

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    containerRef.value.appendChild(renderer.domElement);

    // 4. OrbitControls (Rotación 360° total, Zoom y Paneo suave)
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 8, 0);
    controls.maxDistance = 250;
    controls.minDistance = 15;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // Permite ver hasta ras del suelo

    // 5. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.6); // Cyan
    dirLight1.position.set(60, 100, 60);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf59e0b, 1.1); // Amber
    dirLight2.position.set(-60, 40, -60);
    scene.add(dirLight2);

    // 6. Cama de Impresión Calibrada (100mm x 100mm con cuadrícula)
    gridHelper = new THREE.GridHelper(100, 20, 0x0ea5e9, 0x1e293b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // 7. Cargar Geometría
    loadCurrentGeometry();

    // 8. Animation loop
    const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        controls.update();

        if (isAutoRotating.value && modelMesh) {
            modelMesh.rotation.y += 0.008;
            if (limitBoxMesh) limitBoxMesh.rotation.y += 0.008;
        }

        renderer.render(scene, camera);
    };

    animate();
};

const loadCurrentGeometry = () => {
    if (props.file instanceof File) {
        // Cargar archivo real del cliente
        isLoading.value = true;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loader = new STLLoader();
                const geometry = loader.parse(e.target.result);
                buildMeshFromGeometry(geometry);
            } catch (err) {
                console.warn('Error parseando STL real, usando fallback procedural:', err);
                buildProceduralMesh();
            } finally {
                isLoading.value = false;
            }
        };
        reader.readAsArrayBuffer(props.file);
    } else if (props.fileUrl && props.fileUrl.endsWith('.stl')) {
        // Cargar por URL
        isLoading.value = true;
        const loader = new STLLoader();
        loader.load(props.fileUrl, (geometry) => {
            buildMeshFromGeometry(geometry);
            isLoading.value = false;
        }, undefined, () => {
            buildProceduralMesh();
            isLoading.value = false;
        });
    } else {
        // Procedural basado en dimensiones
        buildProceduralMesh();
    }
};

const buildMeshFromGeometry = (geometry) => {
    if (!scene) return;

    if (modelMesh) scene.remove(modelMesh);
    if (limitBoxMesh) scene.remove(limitBoxMesh);

    geometry.computeVertexNormals();
    geometry.center(); // Centra en (0,0,0)

    // Calcular altura para apoyarlo en la cama Y = 0
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox;
    const sizeZ = bbox.max.z - bbox.min.z;
    const sizeY = bbox.max.y - bbox.min.y;
    const sizeX = bbox.max.x - bbox.min.x;

    const matColor = props.isValid ? 0x38bdf8 : 0xf43f5e;
    const material = new THREE.MeshStandardMaterial({
        color: matColor,
        roughness: 0.35,
        metalness: 0.25,
        wireframe: isWireframe.value,
    });

    const mesh = new THREE.Mesh(geometry, material);
    // Orientación estándar: en STL a menudo Z es la altura
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = (sizeZ > sizeY ? sizeZ : sizeY) / 2;

    modelMesh = mesh;
    scene.add(modelMesh);

    buildLimitBox();
};

const buildProceduralMesh = () => {
    if (!scene) return;

    if (modelMesh) scene.remove(modelMesh);
    if (limitBoxMesh) scene.remove(limitBoxMesh);

    const dimX = props.dimensions.x_mm || 40;
    const dimY = props.dimensions.y_mm || 40;
    const dimZ = props.dimensions.z_mm || 10;

    const stampGroup = new THREE.Group();
    const matColor = props.isValid ? 0x38bdf8 : 0xf43f5e;
    const material = new THREE.MeshStandardMaterial({
        color: matColor,
        roughness: 0.35,
        metalness: 0.25,
        wireframe: isWireframe.value,
    });

    // Base del sello / arete
    const baseGeo = new THREE.CylinderGeometry(dimX / 2, dimX / 2, dimZ * 0.4, 32);
    const baseMesh = new THREE.Mesh(baseGeo, material);
    baseMesh.position.y = (dimZ * 0.4) / 2;
    stampGroup.add(baseMesh);

    // Mango / relieve superior
    const topGeo = new THREE.BoxGeometry(dimX * 0.6, dimZ * 0.6, dimY * 0.6);
    const topMesh = new THREE.Mesh(topGeo, material);
    topMesh.position.y = (dimZ * 0.4) + (dimZ * 0.6) / 2;
    stampGroup.add(topMesh);

    modelMesh = stampGroup;
    scene.add(modelMesh);

    buildLimitBox();
};

const buildLimitBox = () => {
    const limX = props.limits.max_x_mm || 50;
    const limY = props.limits.max_y_mm || 50;
    const limZ = props.limits.max_z_mm || 15;

    const limitBoxGeo = new THREE.BoxGeometry(limX, limZ, limY);
    const limitEdges = new THREE.EdgesGeometry(limitBoxGeo);
    const limitMaterial = new THREE.LineBasicMaterial({
        color: props.isValid ? 0x10b981 : 0xf43f5e,
        transparent: true,
        opacity: 0.75,
        linewidth: 2,
    });

    limitBoxMesh = new THREE.LineSegments(limitEdges, limitMaterial);
    limitBoxMesh.position.y = limZ / 2;
    scene.add(limitBoxMesh);
};

const resetView = () => {
    camera.position.set(65, 55, 80);
    if (controls) {
        controls.target.set(0, 8, 0);
        controls.update();
    }
    isAutoRotating.value = false;
};

const toggleWireframe = () => {
    isWireframe.value = !isWireframe.value;
    if (modelMesh) {
        if (modelMesh.material) {
            modelMesh.material.wireframe = isWireframe.value;
        } else if (modelMesh.children) {
            modelMesh.children.forEach(c => {
                if (c.material) c.material.wireframe = isWireframe.value;
            });
        }
    }
};

watch(() => [props.file, props.fileUrl, props.dimensions, props.isValid], () => {
    loadCurrentGeometry();
}, { deep: true });

onMounted(() => {
    initThree();
    window.addEventListener('resize', onWindowResize);
});

const onWindowResize = () => {
    if (!containerRef.value || !renderer || !camera) return;
    const width = containerRef.value.clientWidth;
    const height = containerRef.value.clientHeight || 300;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
};

onBeforeUnmount(() => {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', onWindowResize);
    if (controls) controls.dispose();
    if (renderer) renderer.dispose();
});
</script>

<template>
    <div class="relative w-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
        <!-- TOP TOOLBAR OVERLAY -->
        <div class="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
            <div class="pointer-events-auto flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-cyan-300 backdrop-blur-md shadow-md">
                <Box class="w-3.5 h-3.5 text-cyan-400" />
                <span class="font-bold">{{ dimensions.x_mm }} x {{ dimensions.y_mm }} x {{ dimensions.z_mm }} mm</span>
            </div>

            <div class="pointer-events-auto flex items-center gap-1.5">
                <button
                    type="button"
                    @click="isAutoRotating = !isAutoRotating"
                    :class="[
                        'p-2 rounded-xl border text-xs transition backdrop-blur-md shadow-md',
                        isAutoRotating ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white'
                    ]"
                    title="Giro Automático 360°"
                >
                    <RotateCw class="w-3.5 h-3.5" />
                </button>

                <button
                    type="button"
                    @click="toggleWireframe"
                    :class="[
                        'p-2 rounded-xl border text-xs transition backdrop-blur-md shadow-md',
                        isWireframe ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white'
                    ]"
                    title="Modo Alambre / Malla"
                >
                    <Eye class="w-3.5 h-3.5" />
                </button>

                <button
                    type="button"
                    @click="resetView"
                    class="p-2 rounded-xl bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800 text-xs transition backdrop-blur-md shadow-md"
                    title="Centrar Perspectiva"
                >
                    <Maximize2 class="w-3.5 h-3.5" />
                </button>
            </div>
        </div>

        <!-- THREE.JS 3D CANVAS -->
        <div ref="containerRef" class="w-full h-72 sm:h-80 cursor-grab active:cursor-grabbing"></div>

        <!-- SPINNER CARGANDO STL -->
        <div v-if="isLoading" class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-20">
            <RefreshCw class="w-6 h-6 text-cyan-400 animate-spin" />
            <span class="text-xs font-bold text-cyan-300">Cargando malla 3D real...</span>
        </div>

        <!-- BOTTOM STATUS BAR -->
        <div class="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <div class="flex items-center gap-2">
                <span :class="['w-2.5 h-2.5 rounded-full', isValid ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400']"></span>
                <span class="font-bold text-slate-200">
                    {{ isValid ? 'Dentro del volumen máximo de fabricación' : 'Excede el volumen máximo permitido' }}
                </span>
            </div>
            <span class="font-mono text-slate-400 font-semibold">
                Cama: 100x100mm • Límites: {{ limits.max_x_mm }}x{{ limits.max_y_mm }}x{{ limits.max_z_mm }}mm
            </span>
        </div>
    </div>
</template>
