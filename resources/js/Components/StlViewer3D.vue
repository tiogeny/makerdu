<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as THREE from 'three';
import { RotateCw, Maximize2, Eye, Box, CheckCircle2, XCircle } from 'lucide-vue-next';

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
    fileName: {
        type: String,
        default: 'modelo_3d.stl',
    },
});

const containerRef = ref(null);
const isAutoRotating = ref(true);
const isWireframe = ref(false);

let scene, camera, renderer, animationFrameId;
let modelMesh, limitBoxMesh, gridHelper;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

const initThree = () => {
    if (!containerRef.value) return;

    const width = containerRef.value.clientWidth;
    const height = containerRef.value.clientHeight || 280;

    // 1. Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712); // slate-950

    // 2. Camera
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(70, 60, 90);
    camera.lookAt(0, 10, 0);

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    containerRef.value.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.5); // Cyan light
    dirLight1.position.set(50, 100, 50);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf59e0b, 1.0); // Amber light
    dirLight2.position.set(-50, -30, -50);
    scene.add(dirLight2);

    // 5. Print Bed Grid (100mm x 100mm)
    gridHelper = new THREE.GridHelper(100, 20, 0x0284c7, 0x1e293b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // 6. Build 3D Model Mesh and Limits Box
    updateModelAndLimits();

    // 7. Mouse interaction
    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    dom.addEventListener('mousemove', onMouseMove);
    dom.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // 8. Animation loop
    const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        if (isAutoRotating.value && modelMesh) {
            modelMesh.rotation.y += 0.008;
            if (limitBoxMesh) limitBoxMesh.rotation.y += 0.008;
        }

        renderer.render(scene, camera);
    };

    animate();
};

const updateModelAndLimits = () => {
    if (!scene) return;

    // Remove existing meshes
    if (modelMesh) scene.remove(modelMesh);
    if (limitBoxMesh) scene.remove(limitBoxMesh);

    const dimX = props.dimensions.x_mm || 40;
    const dimY = props.dimensions.y_mm || 40;
    const dimZ = props.dimensions.z_mm || 10;

    const limX = props.limits.max_x_mm || 50;
    const limY = props.limits.max_y_mm || 50;
    const limZ = props.limits.max_z_mm || 15;

    // 1. Create Model Geometry (Stylized Maker Stamp / 3D Part)
    const baseGeo = new THREE.CylinderGeometry(dimX / 2, dimX / 2, dimZ * 0.4, 32);
    const topGeo = new THREE.BoxGeometry(dimX * 0.7, dimZ * 0.6, dimY * 0.7);

    // Procedural composite geometry representing the stamp
    const stampGroup = new THREE.Group();

    const matColor = props.isValid ? 0x38bdf8 : 0xf43f5e; // Cyan if valid, Rose if invalid
    const material = new THREE.MeshStandardMaterial({
        color: matColor,
        roughness: 0.3,
        metalness: 0.2,
        wireframe: isWireframe.value,
    });

    const baseMesh = new THREE.Mesh(baseGeo, material);
    baseMesh.position.y = (dimZ * 0.4) / 2;
    stampGroup.add(baseMesh);

    const handleMesh = new THREE.Mesh(topGeo, material);
    handleMesh.position.y = (dimZ * 0.4) + (dimZ * 0.6) / 2;
    stampGroup.add(handleMesh);

    modelMesh = stampGroup;
    scene.add(modelMesh);

    // 2. Limit Volume Box Wireframe (Volume allowable boundary)
    const limitBoxGeo = new THREE.BoxGeometry(limX, limZ, limY);
    const limitEdges = new THREE.EdgesGeometry(limitBoxGeo);
    const limitMaterial = new THREE.LineBasicMaterial({
        color: props.isValid ? 0x10b981 : 0xf43f5e,
        transparent: true,
        opacity: 0.7,
        linewidth: 2,
    });

    limitBoxMesh = new THREE.LineSegments(limitEdges, limitMaterial);
    limitBoxMesh.position.y = limZ / 2;
    scene.add(limitBoxMesh);
};

const onMouseDown = (e) => {
    isDragging = true;
    isAutoRotating.value = false;
    previousMousePosition = { x: e.clientX, y: e.clientY };
};

const onMouseMove = (e) => {
    if (!isDragging || !modelMesh) return;

    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;

    modelMesh.rotation.y += deltaX * 0.01;
    if (limitBoxMesh) limitBoxMesh.rotation.y += deltaX * 0.01;

    previousMousePosition = { x: e.clientX, y: e.clientY };
};

const onMouseUp = () => {
    isDragging = false;
};

const onWheel = (e) => {
    e.preventDefault();
    camera.position.z += e.deltaY * 0.05;
    camera.position.z = Math.max(30, Math.min(180, camera.position.z));
};

const resetView = () => {
    camera.position.set(70, 60, 90);
    camera.lookAt(0, 10, 0);
    if (modelMesh) modelMesh.rotation.set(0, 0, 0);
    if (limitBoxMesh) limitBoxMesh.rotation.set(0, 0, 0);
    isAutoRotating.value = true;
};

const toggleWireframe = () => {
    isWireframe.value = !isWireframe.value;
    updateModelAndLimits();
};

watch(() => [props.dimensions, props.isValid], () => {
    updateModelAndLimits();
}, { deep: true });

onMounted(() => {
    initThree();
    window.addEventListener('resize', onWindowResize);
});

const onWindowResize = () => {
    if (!containerRef.value || !renderer || !camera) return;
    const width = containerRef.value.clientWidth;
    const height = containerRef.value.clientHeight || 280;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
};

onBeforeUnmount(() => {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', onWindowResize);
    if (renderer) {
        renderer.dispose();
    }
});
</script>

<template>
    <div class="relative w-full rounded-2xl bg-slate-950/90 border border-slate-800 overflow-hidden shadow-inner flex flex-col">
        <!-- TOP TOOLBAR OVERLAY -->
        <div class="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
            <div class="pointer-events-auto flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-cyan-300 backdrop-blur-md">
                <Box class="w-3.5 h-3.5 text-cyan-400" />
                <span>{{ dimensions.x_mm }} x {{ dimensions.y_mm }} x {{ dimensions.z_mm }} mm</span>
            </div>

            <div class="pointer-events-auto flex items-center gap-1.5">
                <button
                    type="button"
                    @click="isAutoRotating = !isAutoRotating"
                    :class="[
                        'p-1.5 rounded-lg border text-xs transition backdrop-blur-md',
                        isAutoRotating ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
                    ]"
                    title="Giro Automático"
                >
                    <RotateCw class="w-3.5 h-3.5" />
                </button>

                <button
                    type="button"
                    @click="toggleWireframe"
                    :class="[
                        'p-1.5 rounded-lg border text-xs transition backdrop-blur-md',
                        isWireframe ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
                    ]"
                    title="Modo Alambre (Malla)"
                >
                    <Eye class="w-3.5 h-3.5" />
                </button>

                <button
                    type="button"
                    @click="resetView"
                    class="p-1.5 rounded-lg bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800 text-xs transition backdrop-blur-md"
                    title="Centrar Vista"
                >
                    <Maximize2 class="w-3.5 h-3.5" />
                </button>
            </div>
        </div>

        <!-- THREE.JS 3D CANVAS CONTAINER -->
        <div ref="containerRef" class="w-full h-64 sm:h-72 cursor-grab active:cursor-grabbing"></div>

        <!-- BOTTOM STATUS BAR -->
        <div class="px-4 py-2 bg-slate-900/80 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <div class="flex items-center gap-2">
                <span :class="['w-2 h-2 rounded-full', isValid ? 'bg-emerald-400 animate-ping' : 'bg-rose-400']"></span>
                <span class="font-bold text-slate-200">
                    {{ isValid ? 'Dentro de los límites del FabLab' : 'Excede volumen de impresión' }}
                </span>
            </div>
            <span class="font-mono text-slate-500">Cama: 100x100mm • Límites: {{ limits.max_x_mm }}x{{ limits.max_y_mm }}x{{ limits.max_z_mm }}mm</span>
        </div>
    </div>
</template>
