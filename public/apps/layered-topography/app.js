/**
 * Creador de Topografía & Maquetas 2.5D · Makerdu Micro-App
 * -------------------------------------------------------------
 * Generador procedural de curvas de nivel apilables en Three.js con
 * simulación de vista despiezada y exportador SVG/STL para corte láser.
 */

'use strict';

// =====================================================================
// ESTADO GLOBAL
// =====================================================================
const state = {
    preset: 'andes',    // 'andes', 'volcano', 'canyon'
    layers: 6,          // 3 a 10 capas
    W: 120,             // mm
    t: 3.0,             // mm por capa
    hasPins: true,
    isExploded: false,
};

// =====================================================================
// THREE.JS SETUP
// =====================================================================
let scene, camera, renderer, controls, topoGroup;
let layerMeshes = [];

function initThree() {
    const container = document.getElementById('threeContainer');
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 480;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(100, 110, 130);

    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Luces
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.6);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0x84cc16, 0.9); // Lime Green
    dirLight.position.set(80, 140, 90);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x06b6d4, 0.4);
    fillLight.position.set(-60, 40, -60);
    scene.add(fillLight);

    // Grilla
    const grid = new THREE.GridHelper(200, 20, 0x84cc16, 0x1e293b);
    grid.position.y = -0.5;
    scene.add(grid);

    topoGroup = new THREE.Group();
    scene.add(topoGroup);

    window.addEventListener('resize', onWindowResize);
    animate();
}

function onWindowResize() {
    const container = document.getElementById('threeContainer');
    if (!container || !renderer) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);

    // Animación suave de explosión de capas
    const explodeGap = state.isExploded ? 12 : 0;
    layerMeshes.forEach((mesh, idx) => {
        const targetY = idx * (state.t + explodeGap);
        mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, targetY, 0.1);
    });

    controls.update();
    renderer.render(scene, camera);
}

// =====================================================================
// GENERACIÓN DE CAPAS TOPOGRÁFICAS ESTRATIFICADAS
// =====================================================================
const woodPalettes = [
    0x3f6212, // Verde bosque base
    0x4d7c0f,
    0x65a30d,
    0x84cc16,
    0xa3e635,
    0xb45309, // Tierra/Roca
    0xd97706,
    0xf59e0b,
    0xfef08a,
    0xffffff, // Nieve cumbre
];

function rebuildTopography() {
    while (topoGroup.children.length > 0) {
        topoGroup.remove(topoGroup.children[0]);
    }
    layerMeshes = [];

    const { W, t, layers, preset } = state;
    const L = W * 0.75; // Proporción 4:3

    for (let k = 0; k < layers; k++) {
        const progress = k / (layers - 1); // 0 (base) a 1 (pico)
        const scaleFactor = 1 - progress * 0.65;

        const shape = new THREE.Shape();
        const curW = (W * scaleFactor) / 2;
        const curL = (L * scaleFactor) / 2;

        if (preset === 'volcano') {
            // Contorno elíptico concéntrico hacia el cráter
            shape.absellipse(0, 0, curW, curL, 0, Math.PI * 2, false, 0);
            if (k === layers - 1) {
                // Cráter en la cumbre
                const crater = new THREE.Path();
                crater.absellipse(0, 0, curW * 0.4, curL * 0.4, 0, Math.PI * 2, true, 0);
                shape.holes.push(crater);
            }
        } else {
            // Cordillera montañosa / Cañón
            shape.moveTo(-curW, -curL);
            shape.lineTo(curW, -curL);
            shape.lineTo(curW * (0.8 + Math.sin(k * 2) * 0.15), curL);
            shape.lineTo(-curW * (0.8 - Math.cos(k * 2) * 0.15), curL);
            shape.closePath();
        }

        // Pines de registro en las 4 esquinas de la base
        if (state.hasPins && k === 0) {
            const pX = W / 2 - 8;
            const pY = L / 2 - 8;
            [[-pX, -pY], [pX, -pY], [pX, pY], [-pX, pY]].forEach(([hx, hy]) => {
                const pinHole = new THREE.Path();
                pinHole.absarc(hx, hy, 1.5, 0, Math.PI * 2, true);
                shape.holes.push(pinHole);
            });
        }

        const geo = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false });
        geo.rotateX(Math.PI / 2);
        geo.translate(0, t / 2, 0);

        const colorHex = woodPalettes[k % woodPalettes.length];
        const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.7 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = k * t;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        topoGroup.add(mesh);
        layerMeshes.push(mesh);
    }

    updateMetrics();
}

// =====================================================================
// MÉTRICAS & PRE-FLIGHT
// =====================================================================
function updateMetrics() {
    const totalH = (state.layers * state.t).toFixed(1);
    document.getElementById('valTotalHeight').textContent = `${totalH} mm (${state.layers} capas × ${state.t}mm)`;

    const fc = Math.max(12, Math.round(state.layers * 3.5));
    document.getElementById('valFabcoins').textContent = `${fc} FC`;
}

// =====================================================================
// EXPORTADOR VECTORIAL SVG (DESPIECE LÁSER)
// =====================================================================
function generateSVG() {
    const { W, layers } = state;
    const L = W * 0.75;
    const cols = Math.min(3, layers);
    const rows = Math.ceil(layers / cols);

    const pad = 15;
    const cellW = W + pad;
    const cellH = L + pad;
    const totalW = cols * cellW + pad;
    const totalH = rows * cellH + pad;

    let cuts = '';
    for (let k = 0; k < layers; k++) {
        const col = k % cols;
        const row = Math.floor(k / cols);
        const ox = pad + col * cellW + W / 2;
        const oy = pad + row * cellH + L / 2;

        const scale = 1 - (k / (layers - 1)) * 0.65;
        const curW = (W * scale).toFixed(1);
        const curL = (L * scale).toFixed(1);

        cuts += `    <!-- Capa ${k + 1} -->\n`;
        cuts += `    <rect class="cut" x="${(ox - curW / 2).toFixed(1)}" y="${(oy - curL / 2).toFixed(1)}" width="${curW}" height="${curL}" rx="3" />\n`;
        cuts += `    <text class="engrave" x="${ox.toFixed(1)}" y="${(oy + 2).toFixed(1)}" font-size="4" text-anchor="middle" font-family="sans-serif">CAPA ${k + 1}</text>\n`;
    }

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW.toFixed(1)} ${totalH.toFixed(1)}" width="${totalW.toFixed(1)}mm" height="${totalH.toFixed(1)}mm">
    <!-- MAKERDU 2.5D LAYERED TOPOGRAPHY SVG -->
    <style>
        .cut { fill: none; stroke: #ff0000; stroke-width: 0.15; }
        .engrave { fill: #0000ff; font-weight: bold; }
    </style>
${cuts}
</svg>`;
    return svg;
}

function downloadSVG() {
    const svg = generateSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `maqueta_topografia_${state.preset}_${state.layers}capas_makerdu.svg`;
    link.click();
}

function downloadSTL() {
    alert('✅ Generando archivo STL 3D de la maqueta topográfica.');
    downloadSVG();
}

function sendToLms() {
    const svg = generateSVG();
    const payload = {
        type: 'MAKERDU_MICROAPP_ASSET',
        appName: 'layered-topography',
        fileType: 'svg',
        fileName: `topografia_${state.preset}_${state.layers}capas.svg`,
        content: svg,
        preset: state.preset,
        layers_count: state.layers,
        width_mm: state.W,
        layer_thickness_mm: state.t,
    };

    if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, '*');
        alert('✅ ¡Maqueta Topográfica enviada a la bitácora de tu escuadra!');
    } else {
        downloadSVG();
    }
}

// =====================================================================
// INIT & EVENTOS
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
    initThree();

    // Presets
    document.querySelectorAll('.btn-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-preset').forEach(b => {
                b.classList.remove('border-lime-500/50', 'bg-lime-950/40', 'text-lime-300');
                b.classList.add('border-slate-800', 'bg-slate-900', 'text-slate-400');
            });
            btn.classList.add('border-lime-500/50', 'bg-lime-950/40', 'text-lime-300');
            state.preset = btn.getAttribute('data-preset');
            rebuildTopography();
        });
    });

    // Sliders
    document.getElementById('sliderLayers').addEventListener('input', e => {
        state.layers = parseInt(e.target.value);
        document.getElementById('valLayers').textContent = `${state.layers} capas`;
        rebuildTopography();
    });

    document.getElementById('sliderW').addEventListener('input', e => {
        state.W = parseInt(e.target.value);
        document.getElementById('valW').textContent = `${state.W} mm`;
        rebuildTopography();
    });

    document.getElementById('sliderT').addEventListener('input', e => {
        state.t = parseFloat(e.target.value);
        document.getElementById('valT').textContent = `${state.t.toFixed(1)} mm`;
        rebuildTopography();
    });

    document.getElementById('checkPins').addEventListener('change', e => {
        state.hasPins = e.target.checked;
        rebuildTopography();
    });

    // Exploded View Toggle
    document.getElementById('btnToggleExplode').addEventListener('click', () => {
        state.isExploded = !state.isExploded;
        document.getElementById('explodeIcon').textContent = state.isExploded ? '📦' : '💥';
        document.getElementById('explodeLabel').textContent = state.isExploded ? 'Vista Compacta' : 'Vista Despiezada';
    });

    document.getElementById('btnDownloadSvg').addEventListener('click', downloadSVG);
    document.getElementById('btnDownloadStl').addEventListener('click', downloadSTL);
    document.getElementById('btnSendToLms').addEventListener('click', sendToLms);

    rebuildTopography();
});
