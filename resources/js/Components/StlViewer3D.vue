<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import {
    RotateCw, Maximize2, Eye, Box, Layers, RefreshCw, Sliders, Camera
} from 'lucide-vue-next';

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

const emit = defineEmits(['snapshot-ready']);

const containerRef = ref(null);
const isAutoRotating = ref(false);
const isWireframe = ref(false);
const showSlicer = ref(false);
const layerProgress = ref(100); // 0 a 100% de capas
const isLoading = ref(false);
const totalHeightMm = ref(15);

let scene, camera, renderer, controls, animationFrameId;
let modelMesh, limitBoxMesh, gridHelper, clippingPlane;

const initThree = () => {
    if (!containerRef.value) return;

    const width = containerRef.value.clientWidth;
    const height = containerRef.value.clientHeight || 320;

    // 1. Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // slate-950

    // 2. Camera
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(65, 55, 80);

    // 3. Renderer with local clipping enabled for slicing simulation
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.localClippingEnabled = true;
    renderer.shadowMap.enabled = true;
    containerRef.value.appendChild(renderer.domElement);

    // 4. OrbitControls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 8, 0);
    controls.maxDistance = 250;
    controls.minDistance = 15;
    controls.maxPolarAngle = Math.PI / 2 + 0.08;

    // 5. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.7); // Cyan
    dirLight1.position.set(60, 100, 60);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf59e0b, 1.2); // Amber
    dirLight2.position.set(-60, 40, -60);
    scene.add(dirLight2);

    // 6. Cama de Impresión Calibrada (100x100mm)
    gridHelper = new THREE.GridHelper(100, 20, 0x0ea5e9, 0x1e293b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // 7. Clipping plane para el simulador de capas
    clippingPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 100);

    // 8. Cargar Geometría
    loadCurrentGeometry();

    // 9. Animation loop
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
        isLoading.value = true;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loader = new STLLoader();
                const geometry = loader.parse(e.target.result);
                buildMeshFromGeometry(geometry);
            } catch (err) {
                console.warn('Error parseando STL real:', err);
                buildProceduralMesh();
            } finally {
                isLoading.value = false;
            }
        };
        reader.readAsArrayBuffer(props.file);
    } else if (props.fileUrl && props.fileUrl.endsWith('.stl')) {
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
        buildProceduralMesh();
    }
};

/**
 * APOYO MAGNÉTICO AL SUELO Y CENTRADO MATEMÁTICO PERFECTO (Y = 0)
 */
const buildMeshFromGeometry = (geometry) => {
    if (!scene) return;

    if (modelMesh) scene.remove(modelMesh);
    if (limitBoxMesh) scene.remove(limitBoxMesh);

    // 1. Orientación estándar de STL: rotar -90 deg en X
    geometry.rotateX(-Math.PI / 2);
    geometry.computeVertexNormals();

    // 2. Calcular caja envolvente exacta de la geometría rotada
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox;

    const centerX = (bbox.max.x + bbox.min.x) / 2;
    const centerZ = (bbox.max.z + bbox.min.z) / 2;
    const minY = bbox.min.y;
    const height = bbox.max.y - bbox.min.y;
    totalHeightMm.value = Math.max(5, Math.round(height * 10) / 10);

    // 3. Trasladar geometría: Centrado en X/Z, y apoyado exactamente en Y = 0 (Suelo magnético)
    geometry.translate(-centerX, -minY, -centerZ);

    const matColor = props.isValid ? 0x38bdf8 : 0xf43f5e;
    const material = new THREE.MeshStandardMaterial({
        color: matColor,
        roughness: 0.35,
        metalness: 0.25,
        wireframe: isWireframe.value,
        clippingPlanes: showSlicer.value ? [clippingPlane] : [],
        clipShadows: true,
        side: THREE.DoubleSide,
    });

    modelMesh = new THREE.Mesh(geometry, material);
    scene.add(modelMesh);

    buildLimitBox();
    updateClippingPlane();

    // Ajustar foco de cámara al centro del objeto
    controls.target.set(0, height / 2, 0);
};

const buildProceduralMesh = () => {
    if (!scene) return;

    if (modelMesh) scene.remove(modelMesh);
    if (limitBoxMesh) scene.remove(limitBoxMesh);

    const dimX = props.dimensions.x_mm || 40;
    const dimY = props.dimensions.y_mm || 40;
    const dimZ = props.dimensions.z_mm || 10;
    totalHeightMm.value = dimZ;

    const stampGroup = new THREE.Group();
    const matColor = props.isValid ? 0x38bdf8 : 0xf43f5e;
    const material = new THREE.MeshStandardMaterial({
        color: matColor,
        roughness: 0.35,
        metalness: 0.25,
        wireframe: isWireframe.value,
        clippingPlanes: showSlicer.value ? [clippingPlane] : [],
        side: THREE.DoubleSide,
    });

    const baseGeo = new THREE.CylinderGeometry(dimX / 2, dimX / 2, dimZ * 0.4, 32);
    const baseMesh = new THREE.Mesh(baseGeo, material);
    baseMesh.position.y = (dimZ * 0.4) / 2;
    stampGroup.add(baseMesh);

    const topGeo = new THREE.BoxGeometry(dimX * 0.6, dimZ * 0.6, dimY * 0.6);
    const topMesh = new THREE.Mesh(topGeo, material);
    topMesh.position.y = (dimZ * 0.4) + (dimZ * 0.6) / 2;
    stampGroup.add(topMesh);

    modelMesh = stampGroup;
    scene.add(modelMesh);

    buildLimitBox();
    updateClippingPlane();
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

const updateClippingPlane = () => {
    if (!clippingPlane) return;
    if (showSlicer.value) {
        const currentSliceY = (layerProgress.value / 100) * (totalHeightMm.value || 15);
        clippingPlane.constant = currentSliceY;
    } else {
        clippingPlane.constant = 500; // Sin corte
    }
};

const toggleSlicer = () => {
    showSlicer.value = !showSlicer.value;
    if (modelMesh) {
        const mat = modelMesh.material;
        if (mat) {
            mat.clippingPlanes = showSlicer.value ? [clippingPlane] : [];
            mat.needsUpdate = true;
        } else if (modelMesh.children) {
            modelMesh.children.forEach(c => {
                if (c.material) {
                    c.material.clippingPlanes = showSlicer.value ? [clippingPlane] : [];
                    c.material.needsUpdate = true;
                }
            });
        }
    }
    updateClippingPlane();
};

watch(layerProgress, () => {
    updateClippingPlane();
});

const resetView = () => {
    camera.position.set(65, 55, 80);
    if (controls) {
        controls.target.set(0, (totalHeightMm.value || 10) / 2, 0);
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

/**
 * Captura instantánea de alta resolución para enviar a Gemini Vision
 */
const getSnapshotDataUrl = () => {
    if (!renderer || !scene || !camera) return null;
    renderer.render(scene, camera);
    return renderer.domElement.toDataURL('image/png');
};

defineExpose({
    getSnapshotDataUrl,
    resetView,
});

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
    const height = containerRef.value.clientHeight || 320;
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
                <!-- Botón Simulador de Capas (Slicer) -->
                <button
                    type="button"
                    @click="toggleSlicer"
                    :class="[
                        'p-2 rounded-xl border text-xs transition backdrop-blur-md shadow-md flex items-center gap-1 font-bold',
                        showSlicer ? 'bg-purple-500/30 text-purple-300 border-purple-500/50' : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white'
                    ]"
                    title="Simulador de Capas (Slicer Preview)"
                >
                    <Layers class="w-3.5 h-3.5" />
                    <span class="text-[10px]">Capas</span>
                </button>

                <!-- Giro Automático -->
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

                <!-- Modo Malla Wireframe -->
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

                <!-- Centrar -->
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
        <div ref="containerRef" class="w-full h-80 sm:h-96 cursor-grab active:cursor-grabbing"></div>

        <!-- SLIDER FLOTANTE DE SIMULACIÓN DE CAPAS (SLICER) -->
        <div v-if="showSlicer" class="absolute bottom-12 left-4 right-4 z-10 p-3 rounded-2xl bg-slate-900/95 border border-purple-500/40 shadow-2xl backdrop-blur-md space-y-1.5 animate-fade-in">
            <div class="flex items-center justify-between text-xs font-bold text-purple-300">
                <span class="flex items-center gap-1.5">
                    <Layers class="w-4 h-4 text-purple-400 animate-pulse" />
                    Simulador de Capas (Slicer 3D): Altura {{ Math.round((layerProgress / 100) * totalHeightMm * 10) / 10 }} mm / {{ totalHeightMm }} mm
                </span>
                <span class="font-mono text-[11px] bg-purple-950 px-2 py-0.5 rounded-lg border border-purple-700/50">{{ layerProgress }}%</span>
            </div>
            <input
                type="range"
                min="5"
                max="100"
                v-model="layerProgress"
                class="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-purple-400"
            />
            <p class="text-[10px] text-slate-400 text-center">Desliza para ver la deposición de filamento capa por capa desde la base.</p>
        </div>

        <!-- SPINNER CARGANDO STL -->
        <div v-if="isLoading" class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-20">
            <RefreshCw class="w-6 h-6 text-cyan-400 animate-spin" />
            <span class="text-xs font-bold text-cyan-300">Alineando malla en cama magnética (Y=0)...</span>
        </div>

        <!-- BOTTOM STATUS BAR -->
        <div class="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <div class="flex items-center gap-2">
                <span :class="['w-2.5 h-2.5 rounded-full', isValid ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400']"></span>
                <span class="font-bold text-slate-200">
                    {{ isValid ? 'Apoyo Magnético calibrado en Y=0 (Dentro de tolerancias)' : 'Excede el volumen máximo permitido' }}
                </span>
            </div>
            <span class="font-mono text-slate-400 font-semibold">
                Cama: 100x100mm • Límites: {{ limits.max_x_mm }}x{{ limits.max_y_mm }}x{{ limits.max_z_mm }}mm
            </span>
        </div>
    </div>
</template>
