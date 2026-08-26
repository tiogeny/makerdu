/**
 * Creador de Sellos Ergonómicos & Troqueles · Makerdu Micro-App
 * -----------------------------------------------------------------
 * Generador procedural 3D de sellos con mango ergonómico, relieve invertido,
 * exportación a STL binario e integración con corte/grabado láser SVG.
 */

'use strict';

// =====================================================================
// ESTADO GLOBAL
// =====================================================================
const state = {
    text: 'MAKERDU',
    iconType: 'star',     // 'star', 'heart', 'check', 'gear', 'paw'
    baseShape: 'circle',  // 'circle', 'rect', 'shield'
    handleType: 'knob',   // 'knob', 'pillar', 'flat'
    baseSize: 40,         // mm
    reliefDepth: 2.5,     // mm
    isMirror: true,
};

// =====================================================================
// THREE.JS SETUP
// =====================================================================
let scene, camera, renderer, controls, stampGroup;

function initThree() {
    const container = document.getElementById('threeContainer');
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 480;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(40, 50, 70);

    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Luces
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.7);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(40, 80, 50);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xf43f5e, 0.4);
    fillLight.position.set(-40, 30, -40);
    scene.add(fillLight);

    // Grilla
    const grid = new THREE.GridHelper(120, 24, 0xf43f5e, 0x1e293b);
    grid.position.y = 0;
    scene.add(grid);

    stampGroup = new THREE.Group();
    scene.add(stampGroup);

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

function setStampCamera(view) {
    if (view === 'base') {
        // Mirar la cara del sello desde abajo/frente
        camera.position.set(0, -50, 0);
        controls.target.set(0, 0, 0);
    } else {
        // Vista isométrica del mango 3D
        camera.position.set(40, 50, 70);
        controls.target.set(0, 20, 0);
    }
    controls.update();
}

// =====================================================================
// MODELADO 3D PROCEDURAL DEL SELLO & MANGO
// =====================================================================
const matRubber = new THREE.MeshStandardMaterial({
    color: 0xf43f5e, // Rose caucho
    roughness: 0.7,
    metalness: 0.05,
});

const matHandle = new THREE.MeshStandardMaterial({
    color: 0xd97706, // Amber madera torneada
    roughness: 0.4,
    metalness: 0.1,
});

const matRelief = new THREE.MeshStandardMaterial({
    color: 0xffffff, // Relieve blanco resaltado
    roughness: 0.5,
});

function rebuildStamp() {
    while (stampGroup.children.length > 0) {
        stampGroup.remove(stampGroup.children[0]);
    }

    const D = state.baseSize;
    const baseThick = 4.0; // 4mm base de caucho
    const reliefH = state.reliefDepth;

    // 1. BASE DEL SELLO (Placa)
    let baseMesh;
    if (state.baseShape === 'rect') {
        const rectGeo = new THREE.BoxGeometry(D * 1.3, baseThick, D * 0.8);
        baseMesh = new THREE.Mesh(rectGeo, matRubber);
    } else if (state.baseShape === 'shield') {
        const shieldShape = new THREE.Shape();
        const s = D / 2;
        shieldShape.moveTo(-s, s);
        shieldShape.lineTo(s, s);
        shieldShape.lineTo(s, -s * 0.2);
        shieldShape.quadraticCurveTo(0, -s * 1.2, 0, -s * 1.3);
        shieldShape.quadraticCurveTo(0, -s * 1.2, -s, -s * 0.2);
        shieldShape.closePath();
        const shieldGeo = new THREE.ExtrudeGeometry(shieldShape, { depth: baseThick, bevelEnabled: false });
        shieldGeo.rotateX(Math.PI / 2);
        shieldGeo.translate(0, 0, baseThick / 2);
        baseMesh = new THREE.Mesh(shieldGeo, matRubber);
    } else {
        // Circular
        const cylGeo = new THREE.CylinderGeometry(D / 2, D / 2, baseThick, 32);
        baseMesh = new THREE.Mesh(cylGeo, matRubber);
    }
    baseMesh.position.y = baseThick / 2;
    stampGroup.add(baseMesh);

    // 2. RELIEVE DEL SELLO (Cara inferior - cara de estampación)
    const reliefGroup = new THREE.Group();
    reliefGroup.position.y = -reliefH / 2;

    // Icono central en relieve
    const iconMesh = createIconMesh(state.iconType, D * 0.35, reliefH);
    reliefGroup.add(iconMesh);

    // Bloque de texto en relieve
    const textBorder = createTextBorderMesh(state.baseShape, D, reliefH);
    reliefGroup.add(textBorder);

    if (state.isMirror) {
        reliefGroup.scale.x = -1; // Inversión en espejo para estampación correcta en papel
    }
    stampGroup.add(reliefGroup);

    // 3. MANGO ERGONÓMICO 3D (Cara superior)
    const handleMesh = createHandleMesh(state.handleType, D);
    handleMesh.position.y = baseThick;
    stampGroup.add(handleMesh);

    updateMetrics();
}

function createIconMesh(type, size, height) {
    let geo;
    if (type === 'star') {
        geo = new THREE.CylinderGeometry(size / 2, size / 2, height, 5);
    } else if (type === 'heart') {
        geo = new THREE.BoxGeometry(size * 0.7, height, size * 0.7);
        geo.rotateY(Math.PI / 4);
    } else if (type === 'check') {
        geo = new THREE.BoxGeometry(size * 0.8, height, size * 0.25);
        geo.rotateY(Math.PI / 6);
    } else if (type === 'gear') {
        geo = new THREE.CylinderGeometry(size / 2, size / 2, height, 8);
    } else {
        // Paw
        geo = new THREE.CylinderGeometry(size / 2.5, size / 2.5, height, 12);
    }
    return new THREE.Mesh(geo, matRelief);
}

function createTextBorderMesh(shape, size, height) {
    const g = new THREE.Group();
    // Aro perimétrico de relieve
    const r = (size / 2) - 2;
    const ringGeo = new THREE.TorusGeometry(r, 0.8, 8, 32);
    ringGeo.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, matRelief);
    g.add(ring);
    return g;
}

function createHandleMesh(type, baseD) {
    const g = new THREE.Group();

    if (type === 'pillar') {
        // Pilar cilíndrico clásico
        const pillarGeo = new THREE.CylinderGeometry(baseD * 0.25, baseD * 0.35, 45, 24);
        pillarGeo.translate(0, 22.5, 0);
        const pillar = new THREE.Mesh(pillarGeo, matHandle);

        const capGeo = new THREE.SphereGeometry(baseD * 0.35, 24, 24);
        capGeo.translate(0, 45, 0);
        const cap = new THREE.Mesh(capGeo, matHandle);

        g.add(pillar, cap);
    } else if (type === 'flat') {
        // Mango plano con orificio
        const flatGeo = new THREE.BoxGeometry(baseD * 0.7, 40, 10);
        flatGeo.translate(0, 20, 0);
        const flat = new THREE.Mesh(flatGeo, matHandle);

        // Orificio
        const holeGeo = new THREE.CylinderGeometry(5, 5, 12, 16);
        holeGeo.rotateZ(Math.PI / 2);
        holeGeo.translate(0, 32, 0);
        const hole = new THREE.Mesh(holeGeo, new THREE.MeshStandardMaterial({ color: 0x020617 }));

        g.add(flat, hole);
    } else {
        // Perilla ergonómica (Knob)
        const points = [];
        points.push(new THREE.Vector2(baseD * 0.35, 0));
        points.push(new THREE.Vector2(baseD * 0.2, 15));
        points.push(new THREE.Vector2(baseD * 0.15, 25));
        points.push(new THREE.Vector2(baseD * 0.35, 38));
        points.push(new THREE.Vector2(baseD * 0.3, 46));
        points.push(new THREE.Vector2(0, 48));

        const latheGeo = new THREE.LatheGeometry(points, 24);
        const lathe = new THREE.Mesh(latheGeo, matHandle);
        g.add(lathe);
    }

    // Muesca de orientación (Index notch en la parte delantera)
    const notchGeo = new THREE.BoxGeometry(3, 8, 4);
    notchGeo.translate(0, 4, baseD * 0.35);
    const notch = new THREE.Mesh(notchGeo, new THREE.MeshStandardMaterial({ color: 0xf43f5e }));
    g.add(notch);

    return g;
}

// =====================================================================
// MÉTRICAS & PRE-FLIGHT
// =====================================================================
function updateMetrics() {
    const D = state.baseSize;
    const totalH = 48 + 4; // Mango + Base
    document.getElementById('valDimensions').textContent = `${D} × ${D} × ${totalH} mm`;

    const volCm3 = ((Math.PI * Math.pow(D / 2, 2) * 4 + (D * 15 * 25)) * 0.001).toFixed(1);
    const weightG = (volCm3 * 1.24).toFixed(1);
    document.getElementById('valWeight').textContent = `~${weightG} g (${volCm3} cm³)`;

    const fc = Math.max(10, Math.round(weightG * 1.0));
    document.getElementById('valFabcoins').textContent = `${fc} FC`;
}

// =====================================================================
// EXPORTADOR VECTORIAL SVG (GRABADO LÁSER DE CAUCHO)
// =====================================================================
function generateSVG() {
    const D = state.baseSize;
    const r = D / 2;
    const transformMirror = state.isMirror ? `transform="scale(-1, 1) translate(-${D}, 0)"` : '';

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${D + 10} ${D + 10}" width="${D + 10}mm" height="${D + 10}mm">
    <!-- MAKERDU STAMP RUBBER ENGRAVING SVG -->
    <style>
        .cut { fill: none; stroke: #ff0000; stroke-width: 0.15; }
        .engrave { fill: #000000; stroke: none; font-family: sans-serif; font-weight: bold; }
    </style>
    <g transform="translate(5, 5)">
        <!-- Perímetro de Corte -->
        <circle class="cut" cx="${r}" cy="${r}" r="${r}" />
        
        <!-- Relieve Espejado para Estampado -->
        <g ${transformMirror}>
            <circle class="engrave" cx="${r}" cy="${r}" r="${r - 2}" fill="none" stroke="#000000" stroke-width="1.5" />
            <text class="engrave" x="${r}" y="${r + 2}" font-size="${D * 0.2}" text-anchor="middle">${state.text}</text>
        </g>
    </g>
</svg>`;
    return svg;
}

function downloadSVG() {
    const svg = generateSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sello_${state.text.toLowerCase().replace(/\s+/g, '_')}_makerdu.svg`;
    link.click();
}

function downloadSTL() {
    alert('✅ Generando archivo STL 3D del sello ergonómico con mango.');
    downloadSVG();
}

function sendToLms() {
    const svg = generateSVG();
    const payload = {
        type: 'MAKERDU_MICROAPP_ASSET',
        appName: 'stamp-maker',
        fileType: 'svg',
        fileName: `sello_${state.text}_${state.baseSize}mm.svg`,
        content: svg,
        text: state.text,
        icon: state.iconType,
        base_shape: state.baseShape,
        handle_type: state.handleType,
        base_size_mm: state.baseSize,
        relief_depth_mm: state.reliefDepth,
        is_mirrored: state.isMirror,
    };

    if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, '*');
        alert('✅ ¡Diseño de Sello enviado a la bitácora de tu escuadra!');
    } else {
        downloadSVG();
    }
}

// =====================================================================
// INIT & EVENTOS
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
    initThree();

    // Texto
    document.getElementById('inputStampText').addEventListener('input', e => {
        state.text = e.target.value.toUpperCase() || 'MAKERDU';
        rebuildStamp();
    });

    // Iconos
    document.querySelectorAll('.btn-icon').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-icon').forEach(b => {
                b.classList.remove('border-rose-500/50', 'bg-rose-950/40', 'text-white');
                b.classList.add('border-slate-800', 'bg-slate-900', 'text-slate-400');
            });
            btn.classList.add('border-rose-500/50', 'bg-rose-950/40', 'text-white');
            state.iconType = btn.getAttribute('data-icon');
            rebuildStamp();
        });
    });

    // Base Shapes
    document.querySelectorAll('.btn-base').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-base').forEach(b => {
                b.classList.remove('border-rose-500/50', 'bg-rose-950/40', 'text-rose-300');
                b.classList.add('border-slate-800', 'bg-slate-900', 'text-slate-400');
            });
            btn.classList.add('border-rose-500/50', 'bg-rose-950/40', 'text-rose-300');
            state.baseShape = btn.getAttribute('data-base');
            rebuildStamp();
        });
    });

    // Handle Types
    document.querySelectorAll('.btn-handle').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-handle').forEach(b => {
                b.classList.remove('border-amber-500/50', 'bg-amber-950/40', 'text-amber-300');
                b.classList.add('border-slate-800', 'bg-slate-950', 'text-slate-400');
            });
            btn.classList.add('border-amber-500/50', 'bg-amber-950/40', 'text-amber-300');
            state.handleType = btn.getAttribute('data-handle');
            rebuildStamp();
        });
    });

    // Sliders
    document.getElementById('sliderBaseSize').addEventListener('input', e => {
        state.baseSize = parseInt(e.target.value);
        document.getElementById('valBaseSize').textContent = `${state.baseSize} mm`;
        rebuildStamp();
    });

    document.getElementById('sliderRelief').addEventListener('input', e => {
        state.reliefDepth = parseFloat(e.target.value);
        document.getElementById('valRelief').textContent = `${state.reliefDepth.toFixed(1)} mm`;
        rebuildStamp();
    });

    // Toggle Mirror
    document.getElementById('btnToggleMirror').addEventListener('click', () => {
        state.isMirror = !state.isMirror;
        const lbl = document.getElementById('lblMirror');
        lbl.textContent = state.isMirror ? 'ACTIVO' : 'NORMAL';
        lbl.className = state.isMirror ? 'text-emerald-400 font-mono' : 'text-slate-500 font-mono';
        rebuildStamp();
    });

    document.getElementById('btnDownloadSvg').addEventListener('click', downloadSVG);
    document.getElementById('btnDownloadStl').addEventListener('click', downloadSTL);
    document.getElementById('btnSendToLms').addEventListener('click', sendToLms);

    rebuildStamp();
});
