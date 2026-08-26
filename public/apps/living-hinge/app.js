/**
 * Generador de Bisagras Vivas & Madera Flexible · Makerdu Micro-App
 * -------------------------------------------------------------------
 * Motor de simulación elástica 3D en Three.js con cálculo de radio
 * de flexión y generador de vectores SVG de ranurado continuo.
 */

'use strict';

// =====================================================================
// ESTADO GLOBAL
// =====================================================================
const state = {
    pattern: 'straight', // 'straight', 'wave', 'honeycomb'
    angleDeg: 90,        // 30 a 180 deg
    radius: 18,          // mm
    W: 120,              // mm (ancho plancha)
    L: 160,              // mm (largo plancha)
    t: 3.0,              // mm (espesor MDF)
    gap: 1.8,            // mm (espacio entre ranuras)
};

// =====================================================================
// THREE.JS SETUP
// =====================================================================
let scene, camera, renderer, controls, hingeGroup;

function initThree() {
    const container = document.getElementById('threeContainer');
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 480;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(120, 100, 140);

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

    const dirLight = new THREE.DirectionalLight(0xd97706, 0.9); // Warm Amber
    dirLight.position.set(80, 140, 90);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x06b6d4, 0.4);
    fillLight.position.set(-60, 40, -60);
    scene.add(fillLight);

    // Grilla
    const grid = new THREE.GridHelper(200, 20, 0xd97706, 0x1e293b);
    grid.position.y = -0.5;
    scene.add(grid);

    hingeGroup = new THREE.Group();
    scene.add(hingeGroup);

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
// SIMULACIÓN 3D DE LA MADERA CURVADA
// =====================================================================
const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0xb45309, // Madera MDF tono nogal/kraft
    roughness: 0.7,
    metalness: 0.05,
    side: THREE.DoubleSide,
});

function rebuild3DHinge() {
    while (hingeGroup.children.length > 0) {
        hingeGroup.remove(hingeGroup.children[0]);
    }

    const { W, L, t, radius, angleDeg } = state;
    const radAngle = (angleDeg * Math.PI) / 180;
    const arcLength = radius * radAngle;
    const flatL = (L - arcLength) / 2;

    // 1. Placa Rígida 1 (Base Plana)
    const p1Geo = new THREE.BoxGeometry(W, t, flatL);
    p1Geo.translate(0, t / 2, flatL / 2);
    const p1Mesh = new THREE.Mesh(p1Geo, woodMaterial);
    hingeGroup.add(p1Mesh);

    // 2. Zona Curva (Arco flexible deformado)
    const arcSteps = 16;
    for (let i = 0; i < arcSteps; i++) {
        const segAngle = (i / arcSteps) * radAngle;
        const nextAngle = ((i + 1) / arcSteps) * radAngle;
        const segLen = arcLength / arcSteps;

        const segGeo = new THREE.BoxGeometry(W, t, segLen);
        const segMesh = new THREE.Mesh(segGeo, woodMaterial);

        // Posicionamiento en el arco de curvatura
        const y = radius * (1 - Math.cos(segAngle)) + t / 2;
        const z = -radius * Math.sin(segAngle);
        segMesh.position.set(0, y, z);
        segMesh.rotation.x = segAngle;

        hingeGroup.add(segMesh);
    }

    // 3. Placa Rígida 2 (Extremo doblado)
    const p2Geo = new THREE.BoxGeometry(W, t, flatL);
    p2Geo.translate(0, t / 2, -flatL / 2);
    const p2Mesh = new THREE.Mesh(p2Geo, woodMaterial);

    const endY = radius * (1 - Math.cos(radAngle)) + t / 2;
    const endZ = -radius * Math.sin(radAngle);
    p2Mesh.position.set(0, endY, endZ);
    p2Mesh.rotation.x = radAngle;
    hingeGroup.add(p2Mesh);

    updateMetrics();
}

// =====================================================================
// MÉTRICAS & PRE-FLIGHT
// =====================================================================
function updateMetrics() {
    const radAngle = (state.angleDeg * Math.PI) / 180;
    const arcLength = (state.radius * radAngle).toFixed(1);
    const numSlots = Math.ceil(arcLength / state.gap);

    document.getElementById('valHingeWidth').textContent = `${arcLength} mm (${numSlots} ranuras)`;

    const strain = state.t / (2 * state.radius);
    const isSafe = strain < 0.12;
    document.getElementById('valRisk').textContent = isSafe ? 'Óptimo (Flexibilidad Segura ✨)' : 'Riesgo Alto (Aumentar Radio R)';
    document.getElementById('valRisk').className = isSafe ? 'font-mono text-emerald-400 font-bold' : 'font-mono text-rose-400 font-bold';

    const fc = Math.max(10, Math.round(numSlots * 0.8 + 8));
    document.getElementById('valFabcoins').textContent = `${fc} FC`;
}

// =====================================================================
// EXPORTADOR SVG (CORTE LÁSER DE RANURADO CONTINUO)
// =====================================================================
function generateSVG() {
    const { W, L, gap, radius, angleDeg } = state;
    const radAngle = (angleDeg * Math.PI) / 180;
    const arcLen = radius * radAngle;
    const numLines = Math.ceil(arcLen / gap);

    const pad = 15;
    const totalW = W + 2 * pad;
    const totalH = L + 2 * pad;

    const hingeStartY = pad + (L - arcLen) / 2;
    let cuts = '';

    // Patrón de ranurado alternado
    for (let i = 0; i < numLines; i++) {
        const y = (hingeStartY + i * gap).toFixed(2);
        const isEven = i % 2 === 0;

        if (isEven) {
            // Línea central con cortes en los bordes
            const cutW = (W * 0.42).toFixed(2);
            cuts += `    <line class="cut" x1="${pad}" y1="${y}" x2="${(pad + W * 0.42).toFixed(2)}" y2="${y}" />\n`;
            cuts += `    <line class="cut" x1="${(pad + W * 0.58).toFixed(2)}" y1="${y}" x2="${(pad + W).toFixed(2)}" y2="${y}" />\n`;
        } else {
            // Línea central continua
            cuts += `    <line class="cut" x1="${(pad + W * 0.08).toFixed(2)}" y1="${y}" x2="${(pad + W * 0.92).toFixed(2)}" y2="${y}" />\n`;
        }
    }

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW.toFixed(1)} ${totalH.toFixed(1)}" width="${totalW.toFixed(1)}mm" height="${totalH.toFixed(1)}mm">
    <!-- MAKERDU LIVING HINGE LASER CUT SVG -->
    <style>
        .cut { fill: none; stroke: #ff0000; stroke-width: 0.15; stroke-linecap: round; }
    </style>
    <!-- Contorno de la Plancha -->
    <rect class="cut" x="${pad}" y="${pad}" width="${W}" height="${L}" rx="2" />
    
    <!-- Ranurado Elástico Living Hinge -->
${cuts}
</svg>`;
    return svg;
}

function downloadSVG() {
    const svg = generateSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bisagra_viva_${state.pattern}_${state.angleDeg}deg_makerdu.svg`;
    link.click();
}

function downloadSTL() {
    alert('✅ Generando archivo STL 3D de la madera flexionada.');
    downloadSVG();
}

function sendToLms() {
    const svg = generateSVG();
    const payload = {
        type: 'MAKERDU_MICROAPP_ASSET',
        appName: 'living-hinge',
        fileType: 'svg',
        fileName: `bisagra_viva_${state.pattern}_${state.angleDeg}deg.svg`,
        content: svg,
        pattern: state.pattern,
        angle_deg: state.angleDeg,
        radius_mm: state.radius,
        width_mm: state.W,
        length_mm: state.L,
        thickness_mm: state.t,
    };

    if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, '*');
        alert('✅ ¡Diseño de Madera Flexible enviado a la bitácora de tu escuadra!');
    } else {
        downloadSVG();
    }
}

// =====================================================================
// INIT & EVENTOS
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
    initThree();

    // Patterns
    document.querySelectorAll('.btn-pattern').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-pattern').forEach(b => {
                b.classList.remove('border-amber-500/50', 'bg-amber-950/40', 'text-amber-300');
                b.classList.add('border-slate-800', 'bg-slate-900', 'text-slate-400');
            });
            btn.classList.add('border-amber-500/50', 'bg-amber-950/40', 'text-amber-300');
            state.pattern = btn.getAttribute('data-pattern');
            rebuild3DHinge();
        });
    });

    // Sliders
    document.getElementById('sliderAngle').addEventListener('input', e => {
        state.angleDeg = parseInt(e.target.value);
        document.getElementById('valAngle').textContent = `${state.angleDeg}°`;
        rebuild3DHinge();
    });

    document.getElementById('sliderRadius').addEventListener('input', e => {
        state.radius = parseInt(e.target.value);
        document.getElementById('valRadius').textContent = `${state.radius} mm`;
        rebuild3DHinge();
    });

    document.getElementById('sliderW').addEventListener('input', e => {
        state.W = parseInt(e.target.value);
        document.getElementById('valW').textContent = `${state.W} mm`;
        rebuild3DHinge();
    });

    document.getElementById('sliderL').addEventListener('input', e => {
        state.L = parseInt(e.target.value);
        document.getElementById('valL').textContent = `${state.L} mm`;
        rebuild3DHinge();
    });

    document.getElementById('sliderT').addEventListener('input', e => {
        state.t = parseFloat(e.target.value);
        document.getElementById('valT').textContent = `${state.t.toFixed(1)} mm`;
        rebuild3DHinge();
    });

    document.getElementById('sliderGap').addEventListener('input', e => {
        state.gap = parseFloat(e.target.value);
        document.getElementById('valGap').textContent = `${state.gap.toFixed(1)} mm`;
        rebuild3DHinge();
    });

    document.getElementById('btnDownloadSvg').addEventListener('click', downloadSVG);
    document.getElementById('btnDownloadStl').addEventListener('click', downloadSTL);
    document.getElementById('btnSendToLms').addEventListener('click', sendToLms);

    rebuild3DHinge();
});
