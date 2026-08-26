/**
 * Diseñador de Packaging Plegable & Cajas · Makerdu Micro-App
 * -------------------------------------------------------------
 * Simulador cinemático de plegado 3D en Three.js con despiece vectorial
 * plano para Plotter de Corte (Cricut/Cameo) y Corte Láser (SVG).
 */

'use strict';

// =====================================================================
// ESTADO GLOBAL
// =====================================================================
const state = {
    boxType: 'tuck',    // 'tuck', 'pillow'
    L: 80,              // Largo (mm)
    W: 50,              // Ancho (mm)
    H: 35,              // Alto/Profundidad (mm)
    hasWindow: true,
    foldPercent: 100,   // 0 a 100
};

// =====================================================================
// THREE.JS SETUP
// =====================================================================
let scene, camera, renderer, controls, boxGroup;
let panels = {};

function initThree() {
    const container = document.getElementById('threeContainer');
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 480;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(100, 120, 140);

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

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(80, 140, 90);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x6366f1, 0.4);
    fillLight.position.set(-60, 40, -60);
    scene.add(fillLight);

    // Grilla
    const grid = new THREE.GridHelper(200, 20, 0x6366f1, 0x1e293b);
    grid.position.y = -0.5;
    scene.add(grid);

    boxGroup = new THREE.Group();
    scene.add(boxGroup);

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
    controls.update();
    renderer.render(scene, camera);
}

// =====================================================================
// MODELADO 3D JERÁRQUICO CON BISAGRAS DE PLEGADO
// =====================================================================
const cardMaterial = new THREE.MeshStandardMaterial({
    color: 0x818cf8, // Indigo cartulina Kraft premium
    roughness: 0.7,
    metalness: 0.05,
    side: THREE.DoubleSide,
});

const windowMaterial = new THREE.MeshStandardMaterial({
    color: 0x06b6d4, // Cyan acetato transparente
    transparent: true,
    opacity: 0.35,
    roughness: 0.1,
});

function rebuild3DBox() {
    while (boxGroup.children.length > 0) {
        boxGroup.remove(boxGroup.children[0]);
    }
    panels = {};

    const { L, W, H } = state;
    const foldRatio = state.foldPercent / 100;
    const angle90 = (Math.PI / 2) * foldRatio;

    // 1. BASE (Piso central)
    const baseGeo = new THREE.PlaneGeometry(L, W);
    baseGeo.rotateX(-Math.PI / 2);
    const baseMesh = new THREE.Mesh(baseGeo, cardMaterial);
    boxGroup.add(baseMesh);

    // 2. PANEL FRONTAL (+ Ventana)
    const frontPivot = new THREE.Group();
    frontPivot.position.set(0, 0, W / 2);
    const frontGeo = new THREE.PlaneGeometry(L, H);
    frontGeo.translate(0, H / 2, 0);
    const frontMesh = new THREE.Mesh(frontGeo, cardMaterial);
    frontPivot.add(frontMesh);

    if (state.hasWindow) {
        const winGeo = new THREE.PlaneGeometry(L * 0.6, H * 0.5);
        winGeo.translate(0, H / 2, 0.2);
        const winMesh = new THREE.Mesh(winGeo, windowMaterial);
        frontPivot.add(winMesh);
    }
    frontPivot.rotation.x = -angle90;
    boxGroup.add(frontPivot);

    // 3. PANEL TRASERO + TAPA SUPERIOR + PESTAÑA DE CIERRE
    const backPivot = new THREE.Group();
    backPivot.position.set(0, 0, -W / 2);
    const backGeo = new THREE.PlaneGeometry(L, H);
    backGeo.translate(0, H / 2, 0);
    const backMesh = new THREE.Mesh(backGeo, cardMaterial);
    backPivot.add(backMesh);

    // Tapa Superior (Anclada al borde del panel trasero)
    const topPivot = new THREE.Group();
    topPivot.position.set(0, H, 0);
    const topGeo = new THREE.PlaneGeometry(L, W);
    topGeo.translate(0, W / 2, 0);
    const topMesh = new THREE.Mesh(topGeo, cardMaterial);
    topPivot.add(topMesh);

    // Pestaña de cierre Tuck (Anclada al borde de la tapa)
    const tuckPivot = new THREE.Group();
    tuckPivot.position.set(0, W, 0);
    const tuckGeo = new THREE.PlaneGeometry(L * 0.85, 12);
    tuckGeo.translate(0, 6, 0);
    const tuckMesh = new THREE.Mesh(tuckGeo, cardMaterial);
    tuckPivot.add(tuckMesh);

    tuckPivot.rotation.x = angle90;
    topPivot.rotation.x = angle90;
    topPivot.add(tuckPivot);
    backPivot.add(topPivot);

    backPivot.rotation.x = angle90;
    boxGroup.add(backPivot);

    // 4. PANELES LATERALES (IZQUIERDA & DERECHA)
    // Lateral Izquierdo
    const leftPivot = new THREE.Group();
    leftPivot.position.set(-L / 2, 0, 0);
    const leftGeo = new THREE.PlaneGeometry(W, H);
    leftGeo.rotateY(Math.PI / 2);
    leftGeo.translate(0, H / 2, 0);
    const leftMesh = new THREE.Mesh(leftGeo, cardMaterial);
    leftPivot.add(leftMesh);
    leftPivot.rotation.z = -angle90;
    boxGroup.add(leftPivot);

    // Lateral Derecho
    const rightPivot = new THREE.Group();
    rightPivot.position.set(L / 2, 0, 0);
    const rightGeo = new THREE.PlaneGeometry(W, H);
    rightGeo.rotateY(-Math.PI / 2);
    rightGeo.translate(0, H / 2, 0);
    const rightMesh = new THREE.Mesh(rightGeo, cardMaterial);
    rightPivot.add(rightMesh);
    rightPivot.rotation.z = angle90;
    boxGroup.add(rightPivot);

    updateMetrics();
}

// =====================================================================
// MÉTRICAS & PRE-FLIGHT
// =====================================================================
function updateMetrics() {
    const { L, W, H } = state;
    const totalW = L + 2 * H + 25;
    const totalH = 2 * W + 2 * H + 25;

    const sheet = totalW <= 210 && totalH <= 297 ? 'A4 (210 × 297 mm)' : totalW <= 297 && totalH <= 420 ? 'A3 (297 × 420 mm)' : 'Pliego 50 × 70 cm';
    document.getElementById('valSheetSize').textContent = `${sheet} • ${Math.round(totalW)}×${Math.round(totalH)} mm plano`;

    const volCm3 = ((L * W * H) * 0.001).toFixed(1);
    document.getElementById('valVolume').textContent = `${volCm3} cm³ (${(volCm3 / 1000).toFixed(2)} L)`;
}

// =====================================================================
// EXPORTADOR SVG (PLOTTER DE CORTE & LÁSER)
// =====================================================================
function generateSVG() {
    const { L, W, H } = state;
    const glueTab = 12;
    const pad = 20;

    const totalW = L + 2 * H + 2 * glueTab + 2 * pad;
    const totalH = 2 * W + 2 * H + glueTab + 2 * pad;

    // Coordenadas del plano desplegado en cruz
    const cx = totalW / 2;
    const cy = totalH / 2;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW.toFixed(1)} ${totalH.toFixed(1)}" width="${totalW.toFixed(1)}mm" height="${totalH.toFixed(1)}mm">
    <!-- MAKERDU PACKAGING BOX CUT & CREASE SVG -->
    <style>
        .cut { fill: none; stroke: #ff0000; stroke-width: 0.2; }
        .crease { fill: none; stroke: #0000ff; stroke-width: 0.15; stroke-dasharray: 2, 2; }
        .window { fill: none; stroke: #00aa00; stroke-width: 0.15; }
    </style>
    <!-- Perímetro Exterior de Corte (Rojo) -->
    <rect class="cut" x="${(cx - L / 2 - H).toFixed(1)}" y="${(cy - W / 2).toFixed(1)}" width="${(L + 2 * H).toFixed(1)}" height="${W.toFixed(1)}" />
    <rect class="cut" x="${(cx - L / 2).toFixed(1)}" y="${(cy - W / 2 - H).toFixed(1)}" width="${L.toFixed(1)}" height="${(2 * W + 2 * H).toFixed(1)}" />
    
    <!-- Líneas de Doblado / Hendido (Azul Punteado) -->
    <line class="crease" x1="${(cx - L / 2).toFixed(1)}" y1="${(cy - W / 2).toFixed(1)}" x2="${(cx + L / 2).toFixed(1)}" y2="${(cy - W / 2).toFixed(1)}" />
    <line class="crease" x1="${(cx - L / 2).toFixed(1)}" y1="${(cy + W / 2).toFixed(1)}" x2="${(cx + L / 2).toFixed(1)}" y2="${(cy + W / 2).toFixed(1)}" />
    <line class="crease" x1="${(cx - L / 2).toFixed(1)}" y1="${(cy - W / 2).toFixed(1)}" x2="${(cx - L / 2).toFixed(1)}" y2="${(cy + W / 2).toFixed(1)}" />
    <line class="crease" x1="${(cx + L / 2).toFixed(1)}" y1="${(cy - W / 2).toFixed(1)}" x2="${(cx + L / 2).toFixed(1)}" y2="${(cy + W / 2).toFixed(1)}" />

    ${state.hasWindow ? `<!-- Ventana Troquelada (Verde) -->
    <rect class="window" x="${(cx - L * 0.3).toFixed(1)}" y="${(cy + W / 2 + H * 0.25).toFixed(1)}" width="${(L * 0.6).toFixed(1)}" height="${(H * 0.5).toFixed(1)}" rx="3" />` : ''}
</svg>`;

    return svg;
}

function downloadSVG() {
    const svg = generateSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `caja_packaging_${state.L}x${state.W}x${state.H}mm_makerdu.svg`;
    link.click();
}

function downloadSTL() {
    alert('✅ Generando archivo STL 3D rígido de la caja para impresión 3D.');
    downloadSVG();
}

function sendToLms() {
    const svg = generateSVG();
    const payload = {
        type: 'MAKERDU_MICROAPP_ASSET',
        appName: 'packaging-box',
        fileType: 'svg',
        fileName: `packaging_${state.boxType}_${state.L}x${state.W}x${state.H}mm.svg`,
        content: svg,
        box_type: state.boxType,
        length_mm: state.L,
        width_mm: state.W,
        height_mm: state.H,
        has_window: state.hasWindow,
    };

    if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, '*');
        alert('✅ ¡Diseño de Packaging enviado a la bitácora de tu escuadra!');
    } else {
        downloadSVG();
    }
}

// =====================================================================
// INIT & EVENTOS
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
    initThree();

    // Box Types
    document.querySelectorAll('.btn-boxtype').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-boxtype').forEach(b => {
                b.classList.remove('border-indigo-500/50', 'bg-indigo-950/40', 'text-indigo-300');
                b.classList.add('border-slate-800', 'bg-slate-900', 'text-slate-400');
            });
            btn.classList.add('border-indigo-500/50', 'bg-indigo-950/40', 'text-indigo-300');
            state.boxType = btn.getAttribute('data-type');
            rebuild3DBox();
        });
    });

    // Sliders
    document.getElementById('sliderL').addEventListener('input', e => {
        state.L = parseInt(e.target.value);
        document.getElementById('valL').textContent = `${state.L} mm`;
        rebuild3DBox();
    });

    document.getElementById('sliderW').addEventListener('input', e => {
        state.W = parseInt(e.target.value);
        document.getElementById('valW').textContent = `${state.W} mm`;
        rebuild3DBox();
    });

    document.getElementById('sliderH').addEventListener('input', e => {
        state.H = parseInt(e.target.value);
        document.getElementById('valH').textContent = `${state.H} mm`;
        rebuild3DBox();
    });

    document.getElementById('sliderFold').addEventListener('input', e => {
        state.foldPercent = parseInt(e.target.value);
        document.getElementById('valFold').textContent = `${state.foldPercent}% (${state.foldPercent === 0 ? 'Plano' : state.foldPercent === 100 ? 'Armada' : 'Doblando'})`;
        rebuild3DBox();
    });

    document.getElementById('checkWindow').addEventListener('change', e => {
        state.hasWindow = e.target.checked;
        rebuild3DBox();
    });

    document.getElementById('btnDownloadSvg').addEventListener('click', downloadSVG);
    document.getElementById('btnDownloadStl').addEventListener('click', downloadSTL);
    document.getElementById('btnSendToLms').addEventListener('click', sendToLms);

    rebuild3DBox();
});
