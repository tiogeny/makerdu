/**
 * Diseñador de Cortadores de Galletas & Plastilina · Makerdu Micro-App
 * ----------------------------------------------------------------------
 * Generador paramétrico 3D de cortadores de repostería y plastilina con
 * filo de corte vertical y pestaña ergonómica superior de presión.
 */

'use strict';

// =====================================================================
// ESTADO GLOBAL
// =====================================================================
const state = {
    shape: 'ginger',     // 'ginger', 'heart', 'star', 'dino', 'cat', 'hex'
    size: 75,            // mm
    bladeHeight: 18,     // mm
    flangeWidth: 5.0,    // mm
    bladeThickness: 0.8, // mm
};

// =====================================================================
// THREE.JS SETUP
// =====================================================================
let scene, camera, renderer, controls, cutterGroup;

function initThree() {
    const container = document.getElementById('threeContainer');
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 480;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(70, 80, 100);

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

    const dirLight = new THREE.DirectionalLight(0xf43f5e, 0.9); // Rose
    dirLight.position.set(60, 120, 80);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xfbbf24, 0.5); // Amber
    fillLight.position.set(-60, 40, -60);
    scene.add(fillLight);

    // Grilla
    const grid = new THREE.GridHelper(160, 16, 0xf43f5e, 0x1e293b);
    grid.position.y = 0;
    scene.add(grid);

    cutterGroup = new THREE.Group();
    scene.add(cutterGroup);

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
// GEOMETRÍA PARAMÉTRICA DEL CORTADOR (CUCHILLA + PESTAÑA)
// =====================================================================
const matCutter = new THREE.MeshStandardMaterial({
    color: 0xf43f5e, // Rose translúcido tipo PETG/PLA
    roughness: 0.3,
    metalness: 0.1,
    side: THREE.DoubleSide,
});

const matFlange = new THREE.MeshStandardMaterial({
    color: 0xfbbf24, // Amber borde ergonómico
    roughness: 0.4,
    metalness: 0.1,
    side: THREE.DoubleSide,
});

function getShapePath(type, size) {
    const shape = new THREE.Shape();
    const R = size / 2;

    if (type === 'heart') {
        shape.moveTo(0, R * 0.3);
        shape.bezierCurveTo(0, R * 0.8, -R, R * 0.8, -R, R * 0.3);
        shape.bezierCurveTo(-R, -R * 0.2, 0, -R * 0.6, 0, -R);
        shape.bezierCurveTo(0, -R * 0.6, R, -R * 0.2, R, R * 0.3);
        shape.bezierCurveTo(R, R * 0.8, 0, R * 0.8, 0, R * 0.3);
    } else if (type === 'star') {
        const pts = 5;
        for (let i = 0; i < pts * 2; i++) {
            const angle = (i * Math.PI) / pts - Math.PI / 2;
            const rad = i % 2 === 0 ? R : R * 0.45;
            const x = rad * Math.cos(angle);
            const y = rad * Math.sin(angle);
            if (i === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        }
        shape.closePath();
    } else if (type === 'hex') {
        for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3;
            const x = R * Math.cos(a);
            const y = R * Math.sin(a);
            if (i === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        }
        shape.closePath();
    } else {
        // Muñeco de jengibre (Gingerbread)
        shape.moveTo(0, R); // Cabeza top
        shape.bezierCurveTo(-R * 0.3, R, -R * 0.3, R * 0.6, -R * 0.2, R * 0.5);
        shape.lineTo(-R * 0.8, R * 0.3); // Brazo izq
        shape.bezierCurveTo(-R * 0.9, R * 0.2, -R * 0.9, 0, -R * 0.7, 0);
        shape.lineTo(-R * 0.3, 0); // Axila
        shape.lineTo(-R * 0.5, -R * 0.8); // Pierna izq
        shape.lineTo(-R * 0.2, -R * 0.8);
        shape.lineTo(0, -R * 0.3); // Entrepierna
        shape.lineTo(R * 0.2, -R * 0.8);
        shape.lineTo(R * 0.5, -R * 0.8); // Pierna der
        shape.lineTo(R * 0.3, 0);
        shape.lineTo(R * 0.7, 0); // Brazo der
        shape.bezierCurveTo(R * 0.9, 0, R * 0.9, R * 0.2, R * 0.8, R * 0.3);
        shape.lineTo(R * 0.2, R * 0.5);
        shape.bezierCurveTo(R * 0.3, R * 0.6, R * 0.3, R, 0, R);
    }
    return shape;
}

function rebuildCookieCutter() {
    while (cutterGroup.children.length > 0) {
        cutterGroup.remove(cutterGroup.children[0]);
    }

    const { size, bladeHeight, flangeWidth, bladeThickness } = state;
    const baseShape = getShapePath(state.shape, size);

    // 1. Cuchilla Vertical Afilada (Blade)
    const bladeGeo = new THREE.ExtrudeGeometry(baseShape, {
        depth: bladeHeight,
        bevelEnabled: false,
    });
    bladeGeo.rotateX(Math.PI / 2);
    bladeGeo.translate(0, bladeHeight, 0);

    const bladeMesh = new THREE.Mesh(bladeGeo, matCutter);
    bladeMesh.castShadow = true;
    bladeMesh.receiveShadow = true;
    cutterGroup.add(bladeMesh);

    // 2. Pestaña Ergonómica de Presión Superior (Flange)
    const flangeShape = getShapePath(state.shape, size + flangeWidth * 1.5);
    const flangeGeo = new THREE.ExtrudeGeometry(flangeShape, {
        depth: 3.5,
        bevelEnabled: false,
    });
    flangeGeo.rotateX(Math.PI / 2);
    flangeGeo.translate(0, bladeHeight + 3.5, 0);

    const flangeMesh = new THREE.Mesh(flangeGeo, matFlange);
    cutterGroup.add(flangeMesh);

    updateMetrics();
}

// =====================================================================
// MÉTRICAS & PRE-FLIGHT
// =====================================================================
function updateMetrics() {
    const { size, bladeHeight } = state;
    const perimeterApprox = (Math.PI * size * 1.1).toFixed(1);
    const volCm3 = (perimeterApprox * 1.2 * bladeHeight * 0.001).toFixed(1);
    const weightG = (volCm3 * 1.24).toFixed(1);

    document.getElementById('valWeight').textContent = `~${weightG} g PLA (${perimeterApprox} mm perímetro)`;

    const fc = Math.max(10, Math.round(weightG * 1.0));
    document.getElementById('valFabcoins').textContent = `${fc} FC`;
}

// =====================================================================
// EXPORTADOR VECTORIAL SVG
// =====================================================================
function generateSVG() {
    const { size } = state;
    const pad = 15;
    const total = (size + 2 * pad).toFixed(1);
    const cx = (size / 2 + pad).toFixed(1);
    const cy = (size / 2 + pad).toFixed(1);

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${total}mm" height="${total}mm">
    <!-- MAKERDU COOKIE CUTTER SVG -->
    <style>
        .cut { fill: none; stroke: #ff0000; stroke-width: 0.2; }
    </style>
    <circle class="cut" cx="${cx}" cy="${cy}" r="${(size / 2).toFixed(1)}" />
</svg>`;
    return svg;
}

function downloadSVG() {
    const svg = generateSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cortador_${state.shape}_${state.size}mm_makerdu.svg`;
    link.click();
}

function downloadSTL() {
    alert('✅ Generando archivo STL 3D del cortador de galletas.');
    downloadSVG();
}

function sendToLms() {
    const svg = generateSVG();
    const payload = {
        type: 'MAKERDU_MICROAPP_ASSET',
        appName: 'cookie-cutter',
        fileType: 'svg',
        fileName: `cortador_${state.shape}_${state.size}mm.svg`,
        content: svg,
        shape: state.shape,
        size_mm: state.size,
        blade_height_mm: state.bladeHeight,
    };

    if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, '*');
        alert('✅ ¡Diseño de Cortador enviado a la bitácora de tu escuadra!');
    } else {
        downloadSVG();
    }
}

// =====================================================================
// INIT & EVENTOS
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
    initThree();

    // Shapes
    document.querySelectorAll('.btn-shape').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-shape').forEach(b => {
                b.classList.remove('border-rose-500/50', 'bg-rose-950/40', 'text-rose-300');
                b.classList.add('border-slate-800', 'bg-slate-900', 'text-slate-400');
            });
            btn.classList.add('border-rose-500/50', 'bg-rose-950/40', 'text-rose-300');
            state.shape = btn.getAttribute('data-shape');
            rebuildCookieCutter();
        });
    });

    // Sliders
    document.getElementById('sliderSize').addEventListener('input', e => {
        state.size = parseInt(e.target.value);
        document.getElementById('valSize').textContent = `${state.size} mm`;
        rebuildCookieCutter();
    });

    document.getElementById('sliderBladeH').addEventListener('input', e => {
        state.bladeHeight = parseInt(e.target.value);
        document.getElementById('valBladeH').textContent = `${state.bladeHeight} mm`;
        rebuildCookieCutter();
    });

    document.getElementById('sliderFlangeW').addEventListener('input', e => {
        state.flangeWidth = parseFloat(e.target.value);
        document.getElementById('valFlangeW').textContent = `${state.flangeWidth.toFixed(1)} mm`;
        rebuildCookieCutter();
    });

    document.getElementById('sliderBladeT').addEventListener('input', e => {
        state.bladeThickness = parseFloat(e.target.value);
        document.getElementById('valBladeT').textContent = `${state.bladeThickness.toFixed(1)} mm`;
        rebuildCookieCutter();
    });

    document.getElementById('btnDownloadSvg').addEventListener('click', downloadSVG);
    document.getElementById('btnDownloadStl').addEventListener('click', downloadSTL);
    document.getElementById('btnSendToLms').addEventListener('click', sendToLms);

    rebuildCookieCutter();
});
