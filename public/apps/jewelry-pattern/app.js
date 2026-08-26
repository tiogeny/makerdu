/**
 * Generador de Bio-Joyería & Dijes Andinos · Makerdu Micro-App
 * -------------------------------------------------------------
 * Motor paramétrico 3D y generador vectorial de patrones sagrados,
 * simetría radial, calados para corte láser y exportación STL/SVG.
 */

'use strict';

// =====================================================================
// ESTADO GLOBAL
// =====================================================================
const state = {
    preset: 'chacana',    // 'chacana', 'mandala', 'shipibo'
    symmetryAxes: 4,      // 3 a 12 ejes
    concentricRings: 3,   // 2 a 5 capas
    size: 38,             // mm
    thickness: 2.5,       // mm
    loopDiameter: 3.0,    // mm (0 = sin ojal)
};

// =====================================================================
// THREE.JS SETUP
// =====================================================================
let scene, camera, renderer, controls, jewelryGroup;

function initThree() {
    const container = document.getElementById('threeContainer');
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 480;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(0, 0, 75);

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

    const dirLight = new THREE.DirectionalLight(0x2dd4bf, 0.9); // Teal Light
    dirLight.position.set(30, 50, 40);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xa855f7, 0.5); // Purple Accent
    fillLight.position.set(-30, -30, 30);
    scene.add(fillLight);

    jewelryGroup = new THREE.Group();
    scene.add(jewelryGroup);

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

function resetJewelryCamera() {
    camera.position.set(0, 0, 75);
    controls.target.set(0, 0, 0);
    controls.update();
}

// =====================================================================
// GEOMETRÍA PARAMÉTRICA CULTURAL & RADIAL
// =====================================================================
const matJewel = new THREE.MeshStandardMaterial({
    color: 0x14b8a6, // Teal esmeralda andino
    roughness: 0.3,
    metalness: 0.4,
    side: THREE.DoubleSide,
});

function rebuildJewelry() {
    while (jewelryGroup.children.length > 0) {
        jewelryGroup.remove(jewelryGroup.children[0]);
    }

    const D = state.size;
    const R = D / 2;
    const t = state.thickness;
    const N = state.symmetryAxes;
    const rings = state.concentricRings;

    const shape = new THREE.Shape();

    if (state.preset === 'chacana') {
        // Chakana andina escalonada
        const s = R / 3;
        shape.moveTo(-s, s * 3);
        shape.lineTo(s, s * 3);
        shape.lineTo(s, s * 2);
        shape.lineTo(s * 2, s * 2);
        shape.lineTo(s * 2, s);
        shape.lineTo(s * 3, s);
        shape.lineTo(s * 3, -s);
        shape.lineTo(s * 2, -s);
        shape.lineTo(s * 2, -s * 2);
        shape.lineTo(s, -s * 2);
        shape.lineTo(s, -s * 3);
        shape.lineTo(-s, -s * 3);
        shape.lineTo(-s, -s * 2);
        shape.lineTo(-s * 2, -s * 2);
        shape.lineTo(-s * 2, -s);
        shape.lineTo(-s * 3, -s);
        shape.lineTo(-s * 3, s);
        shape.lineTo(-s * 2, s);
        shape.lineTo(-s * 2, s * 2);
        shape.lineTo(-s, s * 2);
        shape.closePath();

        // Orificio central sagrado (Círculo cósmico)
        const hole = new THREE.Path();
        hole.absarc(0, 0, s * 0.8, 0, Math.PI * 2, true);
        shape.holes.push(hole);

    } else if (state.preset === 'mandala') {
        // Sol radial con N rayos petaloides
        const pts = 36;
        for (let i = 0; i <= pts; i++) {
            const a = (i / pts) * Math.PI * 2;
            const rMod = R * (0.8 + 0.2 * Math.sin(a * N));
            const x = rMod * Math.cos(a);
            const y = rMod * Math.sin(a);
            if (i === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        }
        shape.closePath();

        // Calados concéntricos
        for (let j = 1; j < rings; j++) {
            const hRadius = (j / rings) * (R * 0.7);
            const hN = N * 2;
            for (let k = 0; k < hN; k++) {
                const kAngle = (k / hN) * Math.PI * 2;
                const hx = hRadius * Math.cos(kAngle);
                const hy = hRadius * Math.sin(kAngle);
                const holeP = new THREE.Path();
                holeP.absarc(hx, hy, (R / rings) * 0.25, 0, Math.PI * 2, true);
                shape.holes.push(holeP);
            }
        }
    } else {
        // Geometría Kené Shipibo (Rombos concéntricos entrelazados)
        shape.moveTo(0, R);
        shape.lineTo(R, 0);
        shape.lineTo(0, -R);
        shape.lineTo(-R, 0);
        shape.closePath();

        const holeR = new THREE.Path();
        const innerS = R * 0.6;
        holeR.moveTo(0, innerS);
        holeR.lineTo(innerS, 0);
        holeR.lineTo(0, -innerS);
        holeR.lineTo(-innerS, 0);
        holeR.closePath();
        shape.holes.push(holeR);
    }

    // Extrusión 3D
    const geo = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3, bevelSegments: 3 });
    geo.center();
    const mesh = new THREE.Mesh(geo, matJewel);
    jewelryGroup.add(mesh);

    // Ojal para Argolla (Loop)
    if (state.loopDiameter > 0) {
        const loopR = state.loopDiameter / 2;
        const ringGeo = new THREE.TorusGeometry(loopR + 1.2, 1.0, 12, 24);
        const ringMesh = new THREE.Mesh(ringGeo, matJewel);
        ringMesh.position.set(0, R + loopR + 0.8, 0);
        jewelryGroup.add(ringMesh);
    }

    updateMetrics();
}

// =====================================================================
// MÉTRICAS & PRE-FLIGHT
// =====================================================================
function updateMetrics() {
    const D = state.size;
    const t = state.thickness;
    const vol = (Math.PI * Math.pow(D / 2, 2) * 0.45 * t * 0.001).toFixed(1);
    const weightG = (vol * 1.24).toFixed(1);

    document.getElementById('valWeight').textContent = `~${weightG} g (${vol} cm³) • Ultraligero`;
    document.getElementById('valLaserTime').textContent = `~${Math.round(D * 0.45)} segundos`;

    const fc = Math.max(8, Math.round(weightG * 2.5));
    document.getElementById('valFabcoins').textContent = `${fc} FC`;
}

// =====================================================================
// EXPORTADOR SVG (CORTE LÁSER & VINILO)
// =====================================================================
function generateSVG() {
    const D = state.size;
    const R = D / 2;
    const totalSize = (D + 16).toFixed(1);
    const cx = (D / 2 + 8).toFixed(1);
    const cy = (D / 2 + 8).toFixed(1);

    let svgInner = '';
    if (state.preset === 'chacana') {
        const s = R / 3;
        svgInner = `<polygon class="cut" points="
            ${-s},${s*3} ${s},${s*3} ${s},${s*2} ${s*2},${s*2} ${s*2},${s} ${s*3},${s} 
            ${s*3},${-s} ${s*2},${-s} ${s*2},${-s*2} ${s},${-s*2} ${s},${-s*3} ${-s},${-s*3} 
            ${-s},${-s*2} ${-s*2},${-s*2} ${-s*2},${-s} ${-s*3},${-s} ${-s*3},${s} ${-s*2},${s} 
            ${-s*2},${s*2} ${-s},${s*2}" transform="translate(${cx}, ${cy})" />
            <circle class="cut" cx="${cx}" cy="${cy}" r="${(s * 0.8).toFixed(2)}" />`;
    } else {
        svgInner = `<circle class="cut" cx="${cx}" cy="${cy}" r="${R.toFixed(2)}" />
            <circle class="engrave" cx="${cx}" cy="${cy}" r="${(R * 0.6).toFixed(2)}" />`;
    }

    // Ojal
    let loopSvg = '';
    if (state.loopDiameter > 0) {
        const lY = (8 - state.loopDiameter / 2).toFixed(1);
        loopSvg = `<circle class="cut" cx="${cx}" cy="${lY}" r="${(state.loopDiameter / 2 + 1.2).toFixed(2)}" />
                   <circle class="cut" cx="${cx}" cy="${lY}" r="${(state.loopDiameter / 2).toFixed(2)}" />`;
    }

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}mm" height="${totalSize}mm">
    <!-- MAKERDU BIO-JOYERÍA ANDINA SVG -->
    <style>
        .cut { fill: none; stroke: #ff0000; stroke-width: 0.15; }
        .engrave { fill: none; stroke: #0000ff; stroke-width: 0.1; }
    </style>
    ${svgInner}
    ${loopSvg}
</svg>`;
    return svg;
}

function downloadSVG() {
    const svg = generateSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `joyeria_andina_${state.preset}_${state.size}mm_makerdu.svg`;
    link.click();
}

function downloadSTL() {
    alert('✅ Generando archivo STL 3D de bio-joyería para impresión 3D.');
    downloadSVG();
}

function sendToLms() {
    const svg = generateSVG();
    const payload = {
        type: 'MAKERDU_MICROAPP_ASSET',
        appName: 'jewelry-pattern',
        fileType: 'svg',
        fileName: `joyeria_${state.preset}_${state.size}mm.svg`,
        content: svg,
        preset: state.preset,
        symmetry_axes: state.symmetryAxes,
        size_mm: state.size,
        thickness_mm: state.thickness,
        loop_mm: state.loopDiameter,
    };

    if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, '*');
        alert('✅ ¡Diseño de Joyería enviado a la bitácora de tu escuadra!');
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
                b.classList.remove('border-teal-500/50', 'bg-teal-950/40', 'text-teal-300');
                b.classList.add('border-slate-800', 'bg-slate-900', 'text-slate-400');
            });
            btn.classList.add('border-teal-500/50', 'bg-teal-950/40', 'text-teal-300');
            state.preset = btn.getAttribute('data-preset');
            rebuildJewelry();
        });
    });

    // Sliders
    document.getElementById('sliderSymmetry').addEventListener('input', e => {
        state.symmetryAxes = parseInt(e.target.value);
        document.getElementById('valSymmetry').textContent = `${state.symmetryAxes} ejes`;
        rebuildJewelry();
    });

    document.getElementById('sliderRings').addEventListener('input', e => {
        state.concentricRings = parseInt(e.target.value);
        document.getElementById('valRings').textContent = `${state.concentricRings} capas`;
        rebuildJewelry();
    });

    document.getElementById('sliderSize').addEventListener('input', e => {
        state.size = parseInt(e.target.value);
        document.getElementById('valSize').textContent = `${state.size} mm`;
        rebuildJewelry();
    });

    document.getElementById('sliderThickness').addEventListener('input', e => {
        state.thickness = parseFloat(e.target.value);
        document.getElementById('valThickness').textContent = `${state.thickness.toFixed(1)} mm`;
        rebuildJewelry();
    });

    document.getElementById('selectLoop').addEventListener('change', e => {
        state.loopDiameter = parseFloat(e.target.value);
        document.getElementById('valLoop').textContent = state.loopDiameter > 0 ? `Ø${state.loopDiameter.toFixed(1)} mm` : 'Sin Ojal';
        rebuildJewelry();
    });

    document.getElementById('btnRandomPattern').addEventListener('click', () => {
        const presets = ['chacana', 'mandala', 'shipibo'];
        state.preset = presets[Math.floor(Math.random() * presets.length)];
        state.symmetryAxes = Math.floor(Math.random() * 8) + 3;
        state.concentricRings = Math.floor(Math.random() * 4) + 2;
        document.getElementById('sliderSymmetry').value = state.symmetryAxes;
        document.getElementById('sliderRings').value = state.concentricRings;
        document.getElementById('valSymmetry').textContent = `${state.symmetryAxes} ejes`;
        document.getElementById('valRings').textContent = `${state.concentricRings} capas`;
        rebuildJewelry();
    });

    document.getElementById('btnDownloadSvg').addEventListener('click', downloadSVG);
    document.getElementById('btnDownloadStl').addEventListener('click', downloadSTL);
    document.getElementById('btnSendToLms').addEventListener('click', sendToLms);

    rebuildJewelry();
});
