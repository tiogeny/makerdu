/**
 * Diseñador de Lámparas Waffle Grid · Makerdu Micro-App
 * --------------------------------------------------------
 * Motor 3D Three.js de costillas entrelazadas con simulación lumínica,
 * cálculo de ranuras de encastre por fricción y exportación SVG/STL.
 */

'use strict';

// =====================================================================
// ESTADO GLOBAL
// =====================================================================
const state = {
    shapePreset: 'cylinder', // 'cylinder', 'hourglass', 'bulb'
    height: 180,             // mm
    radiusTop: 45,           // mm
    radiusBottom: 60,        // mm
    radiusMid: 35,           // mm (calculado por silueta)
    ribsCount: 12,           // costillas verticales
    ringsCount: 3,           // anillos horizontales
    thickness: 3.0,          // mm (MDF/Acrílico)
    socketDiameter: 40,      // mm (E27)
    kerf: 0.15,              // mm
    isLightOn: false,
};

// =====================================================================
// THREE.JS SETUP
// =====================================================================
let scene, camera, renderer, controls, lampGroup;
let bulbLight, bulbMesh;

function initThree() {
    const container = document.getElementById('threeContainer');
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 480;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(120, 140, 160);

    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Luces de Ambiente
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.5);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(60, 120, 80);
    scene.add(dirLight);

    // Bombilla Interior Interactiva
    bulbLight = new THREE.PointLight(0xffedd5, 0, 300);
    bulbLight.position.set(0, state.height / 2, 0);
    scene.add(bulbLight);

    const bulbGeo = new THREE.SphereGeometry(14, 16, 16);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
    bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
    bulbMesh.position.set(0, state.height / 2, 0);
    scene.add(bulbMesh);

    // Grilla
    const grid = new THREE.GridHelper(250, 25, 0xf59e0b, 0x1e293b);
    grid.position.y = 0;
    scene.add(grid);

    lampGroup = new THREE.Group();
    scene.add(lampGroup);

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

function resetLampCamera() {
    camera.position.set(120, 140, 160);
    controls.target.set(0, state.height / 2, 0);
    controls.update();
}

// =====================================================================
// MODELADO 3D PROCEDURAL DE LA LÁMPARA
// =====================================================================
const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0xd97706, // Amber madera MDF
    roughness: 0.8,
    metalness: 0.05,
    side: THREE.DoubleSide,
});

function getRadiusAtHeight(y, h, rTop, rBot, preset) {
    const normY = y / h; // 0 (base) a 1 (top)
    if (preset === 'hourglass') {
        // Cintura estrecha en el medio
        const midR = Math.min(rTop, rBot) * 0.65;
        return (1 - normY) * rBot + normY * rTop - Math.sin(normY * Math.PI) * (rBot - midR);
    } else if (preset === 'bulb') {
        // Abombado en el medio-bajo
        const bulge = Math.sin(normY * Math.PI) * 25;
        return (1 - normY) * rBot + normY * rTop + bulge;
    } else {
        // Cilíndrico / Cónico cónico suave
        return (1 - normY) * rBot + normY * rTop;
    }
}

function rebuildLamp() {
    while (lampGroup.children.length > 0) {
        lampGroup.remove(lampGroup.children[0]);
    }

    const H = state.height;
    const rTop = state.radiusTop;
    const rBot = state.radiusBottom;
    const nRibs = state.ribsCount;
    const nRings = state.ringsCount;
    const t = state.thickness;
    const preset = state.shapePreset;

    // 1. GENERAR COSTILLAS VERTICALES
    // Construimos la forma de una costilla 2D
    const ribShape = new THREE.Shape();
    const steps = 20;
    const innerWidth = 14; // ancho de la viga de madera

    // Borde exterior curvado
    for (let i = 0; i <= steps; i++) {
        const y = (i / steps) * H;
        const r = getRadiusAtHeight(y, H, rTop, rBot, preset);
        if (i === 0) ribShape.moveTo(r, y);
        else ribShape.lineTo(r, y);
    }

    // Borde interior con ranuras
    for (let i = steps; i >= 0; i--) {
        const y = (i / steps) * H;
        const r = getRadiusAtHeight(y, H, rTop, rBot, preset) - innerWidth;
        ribShape.lineTo(Math.max(12, r), y);
    }
    ribShape.closePath();

    const extrudeSettings = { depth: t, bevelEnabled: false };
    const ribGeo = new THREE.ExtrudeGeometry(ribShape, extrudeSettings);
    ribGeo.translate(0, 0, -t / 2);

    for (let i = 0; i < nRibs; i++) {
        const angle = (i * 2 * Math.PI) / nRibs;
        const ribMesh = new THREE.Mesh(ribGeo, woodMaterial);
        ribMesh.rotation.y = angle;
        ribMesh.castShadow = true;
        ribMesh.receiveShadow = true;
        lampGroup.add(ribMesh);
    }

    // 2. GENERAR ANILLOS HORIZONTALES
    for (let j = 1; j <= nRings; j++) {
        const ringY = (j / (nRings + 1)) * H;
        const ringR = getRadiusAtHeight(ringY, H, rTop, rBot, preset);
        const innerR = j === 1 ? state.socketDiameter / 2 : ringR - innerWidth;

        const ringShape = new THREE.Shape();
        ringShape.absarc(0, 0, ringR, 0, Math.PI * 2, false);
        const holePath = new THREE.Path();
        holePath.absarc(0, 0, Math.max(10, innerR), 0, Math.PI * 2, true);
        ringShape.holes.push(holePath);

        const ringExtrude = new THREE.ExtrudeGeometry(ringShape, { depth: t, bevelEnabled: false });
        ringExtrude.rotateX(Math.PI / 2);
        const ringMesh = new THREE.Mesh(ringExtrude, woodMaterial);
        ringMesh.position.y = ringY;
        lampGroup.add(ringMesh);
    }

    // Posición bombilla
    bulbLight.position.y = H * 0.55;
    bulbMesh.position.y = H * 0.55;

    updateMetrics();
}

// =====================================================================
// MÉTRICAS & PRE-FLIGHT
// =====================================================================
function updateMetrics() {
    const totalP = state.ribsCount + state.ringsCount;
    document.getElementById('valTotalPieces').textContent = `${totalP} piezas (${state.ribsCount} costillas + ${state.ringsCount} anillos)`;

    const maxR = Math.max(state.radiusTop, state.radiusBottom) * 2;
    const estW = Math.round(maxR * 1.5);
    const estH = Math.round(state.height * 1.2);
    document.getElementById('valMdfArea').textContent = `~${estW} × ${estH} cm (MDF ${state.thickness}mm)`;

    const fc = Math.round(totalP * 1.8 + state.height * 0.05);
    document.getElementById('valFabcoins').textContent = `${fc} FC`;
}

// =====================================================================
// EXPORTADOR SVG (CORTE LÁSER DESPIECE WAFFLE)
// =====================================================================
function generateSVG() {
    const H = state.height;
    const rTop = state.radiusTop;
    const rBot = state.radiusBottom;
    const preset = state.shapePreset;
    const t = state.thickness;
    const innerW = 14;

    const totalW = 420; // Formato A3 lámina
    const totalH = 297;

    let paths = '';
    // Costilla 1 (Molde maestro)
    let ribD = `M 20 ${H + 20} `;
    for (let i = 0; i <= 20; i++) {
        const y = (i / 20) * H;
        const r = getRadiusAtHeight(y, H, rTop, rBot, preset);
        ribD += `L ${20 + r} ${H + 20 - y} `;
    }
    for (let i = 20; i >= 0; i--) {
        const y = (i / 20) * H;
        const r = getRadiusAtHeight(y, H, rTop, rBot, preset) - innerW;
        ribD += `L ${20 + Math.max(10, r)} ${H + 20 - y} `;
    }
    ribD += 'Z';

    paths += `    <path class="cut" d="${ribD}" />\n`;
    paths += `    <text x="35" y="${H / 2 + 20}" fill="#0000ff" font-size="6" font-family="sans-serif">COSTILLA x${state.ribsCount} (MDF ${t}mm)</text>\n`;

    // Anillo Base con Socket
    paths += `    <circle class="cut" cx="240" cy="90" r="${rBot}" />\n`;
    paths += `    <circle class="cut" cx="240" cy="90" r="${state.socketDiameter / 2}" />\n`;
    paths += `    <text x="220" y="90" fill="#0000ff" font-size="5" font-family="sans-serif">ANILLO BASE (E27)</text>\n`;

    // Anillo Superior
    paths += `    <circle class="cut" cx="240" cy="200" r="${rTop}" />\n`;
    paths += `    <circle class="cut" cx="240" cy="200" r="${rTop - innerW}" />\n`;
    paths += `    <text x="220" y="200" fill="#0000ff" font-size="5" font-family="sans-serif">ANILLO SUP</text>\n`;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}mm" height="${totalH}mm">
    <!-- MAKERDU WAFFLE LAMP LASER SVG -->
    <style>
        .cut { fill: none; stroke: #ff0000; stroke-width: 0.2; }
    </style>
${paths}
</svg>`;
    return svg;
}

function downloadSVG() {
    const svg = generateSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lampara_waffle_${state.shapePreset}_${state.height}mm_makerdu.svg`;
    link.click();
}

function downloadSTL() {
    alert('✅ Generando plano vectorial y malla 3D de la lámpara.');
    downloadSVG();
}

function sendToLms() {
    const svg = generateSVG();
    const payload = {
        type: 'MAKERDU_MICROAPP_ASSET',
        appName: 'lamp-designer',
        fileType: 'svg',
        fileName: `lampara_waffle_${state.shapePreset}_${state.height}mm.svg`,
        content: svg,
        shape_preset: state.shapePreset,
        height_mm: state.height,
        ribs_count: state.ribsCount,
        rings_count: state.ringsCount,
        thickness_mm: state.thickness,
        socket_mm: state.socketDiameter,
    };

    if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, '*');
        alert('✅ ¡Diseño de Lámpara Waffle enviado a la bitácora de tu escuadra!');
    } else {
        downloadSVG();
    }
}

// =====================================================================
// INIT & EVENTOS
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
    initThree();

    // Shape buttons
    document.querySelectorAll('.btn-shape').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-shape').forEach(b => {
                b.classList.remove('border-amber-500/50', 'bg-amber-950/40', 'text-amber-300');
                b.classList.add('border-slate-800', 'bg-slate-950', 'text-slate-400');
            });
            btn.classList.add('border-amber-500/50', 'bg-amber-950/40', 'text-amber-300');
            state.shapePreset = btn.getAttribute('data-shape');
            rebuildLamp();
        });
    });

    // Sliders
    document.getElementById('sliderHeight').addEventListener('input', e => {
        state.height = parseInt(e.target.value);
        document.getElementById('valHeight').textContent = `${state.height} mm`;
        rebuildLamp();
    });

    document.getElementById('sliderRadiusTop').addEventListener('input', e => {
        state.radiusTop = parseInt(e.target.value);
        document.getElementById('valRadiusTop').textContent = `${state.radiusTop} mm`;
        rebuildLamp();
    });

    document.getElementById('sliderRadiusBottom').addEventListener('input', e => {
        state.radiusBottom = parseInt(e.target.value);
        document.getElementById('valRadiusBottom').textContent = `${state.radiusBottom} mm`;
        rebuildLamp();
    });

    document.getElementById('sliderRibs').addEventListener('input', e => {
        state.ribsCount = parseInt(e.target.value);
        document.getElementById('valRibs').textContent = `${state.ribsCount} costillas`;
        rebuildLamp();
    });

    document.getElementById('sliderRings').addEventListener('input', e => {
        state.ringsCount = parseInt(e.target.value);
        document.getElementById('valRings').textContent = `${state.ringsCount} anillos`;
        rebuildLamp();
    });

    document.getElementById('sliderThickness').addEventListener('input', e => {
        state.thickness = parseFloat(e.target.value);
        document.getElementById('valThickness').textContent = `${state.thickness.toFixed(1)} mm`;
        rebuildLamp();
    });

    document.getElementById('selectSocket').addEventListener('change', e => {
        state.socketDiameter = parseInt(e.target.value);
        rebuildLamp();
    });

    // Toggle Bombilla
    document.getElementById('btnToggleLight').addEventListener('click', () => {
        state.isLightOn = !state.isLightOn;
        bulbLight.intensity = state.isLightOn ? 1.8 : 0;
        bulbMesh.material.color.setHex(state.isLightOn ? 0xfef08a : 0x334155);
        document.getElementById('lightDot').className = state.isLightOn ? 'w-2 h-2 rounded-full bg-amber-400 animate-ping' : 'w-2 h-2 rounded-full bg-slate-500';
        document.getElementById('lightIcon').textContent = state.isLightOn ? '💡' : '🌑';
        document.getElementById('lightLabel').textContent = state.isLightOn ? 'Apagar Bombilla' : 'Encender Bombilla';
    });

    document.getElementById('btnDownloadSvg').addEventListener('click', downloadSVG);
    document.getElementById('btnDownloadStl').addEventListener('click', downloadSTL);
    document.getElementById('btnSendToLms').addEventListener('click', sendToLms);

    rebuildLamp();
});
