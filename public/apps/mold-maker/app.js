/**
 * Generador de Moldes & Matrices 3D · Makerdu Micro-App
 * --------------------------------------------------------
 * Motor procedural 3D en Three.js con cálculo de ángulos de salida
 * (Draft Angle) para vaciado en silicona y exportador binario STL.
 */

'use strict';

// =====================================================================
// ESTADO GLOBAL
// =====================================================================
const state = {
    moldType: 'cavity',   // 'cavity', 'matrix'
    shape: 'medallion',   // 'medallion', 'soap', 'star'
    draftDeg: 6,          // 2 a 15 deg
    size: 50,             // mm
    depth: 18,            // mm
    wallThickness: 4.0,   // mm
};

// =====================================================================
// THREE.JS SETUP
// =====================================================================
let scene, camera, renderer, controls, moldGroup;

function initThree() {
    const container = document.getElementById('threeContainer');
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 480;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(60, 70, 90);

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
    dirLight.position.set(50, 100, 70);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x06b6d4, 0.4);
    fillLight.position.set(-50, 30, -50);
    scene.add(fillLight);

    // Grilla
    const grid = new THREE.GridHelper(150, 15, 0xf43f5e, 0x1e293b);
    grid.position.y = 0;
    scene.add(grid);

    moldGroup = new THREE.Group();
    scene.add(moldGroup);

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
// MODELADO 3D PROCEDURAL DEL MOLDE CON DRAFT ANGLE
// =====================================================================
const matMold = new THREE.MeshStandardMaterial({
    color: 0xf43f5e, // Rose Silicona Platino
    roughness: 0.4,
    metalness: 0.1,
    side: THREE.DoubleSide,
});

const matChoc = new THREE.MeshStandardMaterial({
    color: 0x451a03, // Marrón Chocolate fino
    roughness: 0.3,
    metalness: 0.2,
});

function rebuildMold() {
    while (moldGroup.children.length > 0) {
        moldGroup.remove(moldGroup.children[0]);
    }

    const { size, depth, wallThickness, draftDeg, moldType } = state;
    const draftRad = (draftDeg * Math.PI) / 180;
    const taperDelta = Math.tan(draftRad) * depth; // Ensanchamiento en la boca

    const outerSize = size + 2 * wallThickness + 2 * taperDelta;
    const outerH = depth + wallThickness;

    if (moldType === 'cavity') {
        // 1. Caja Exterior del Molde
        const boxGeo = new THREE.BoxGeometry(outerSize, outerH, outerSize);
        boxGeo.translate(0, outerH / 2, 0);
        const boxMesh = new THREE.Mesh(boxGeo, matMold);
        moldGroup.add(boxMesh);

        // 2. Cavidad Interior Cónica (Corte con ángulo de desmolde)
        const cavGeo = new THREE.CylinderGeometry((size + 2 * taperDelta) / 2, size / 2, depth, 32);
        cavGeo.translate(0, depth / 2 + wallThickness, 0);
        const cavMesh = new THREE.Mesh(cavGeo, new THREE.MeshStandardMaterial({ color: 0x020617 }));
        moldGroup.add(cavMesh);

        // 3. Emblema en el fondo de la cavidad
        const emblemGeo = new THREE.CylinderGeometry(size * 0.25, size * 0.25, 1.5, 8);
        emblemGeo.translate(0, wallThickness + 0.75, 0);
        const emblem = new THREE.Mesh(emblemGeo, matMold);
        moldGroup.add(emblem);

    } else {
        // MATRIZ POSITIVA (Para Termoformado al Vacío)
        const posGeo = new THREE.CylinderGeometry(size / 2, (size + 2 * taperDelta) / 2, depth, 32);
        posGeo.translate(0, depth / 2, 0);
        const posMesh = new THREE.Mesh(posGeo, matChoc);
        moldGroup.add(posMesh);

        // Base de montaje
        const baseGeo = new THREE.BoxGeometry(outerSize, 4, outerSize);
        baseGeo.translate(0, -2, 0);
        const baseMesh = new THREE.Mesh(baseGeo, matMold);
        moldGroup.add(baseMesh);
    }

    updateMetrics();
}

// =====================================================================
// MÉTRICAS & PRE-FLIGHT
// =====================================================================
function updateMetrics() {
    const { size, depth } = state;
    const volMl = (Math.PI * Math.pow(size / 20, 2) * (depth / 10)).toFixed(0);
    document.getElementById('valVolume').textContent = `~${volMl} ml (Chocolate / Jabón)`;

    const fc = Math.max(12, Math.round(volMl * 0.6 + 6));
    document.getElementById('valFabcoins').textContent = `${fc} FC`;
}

// =====================================================================
// EXPORTADOR BINARIO STL 3D
// =====================================================================
function exportBinarySTL() {
    const meshes = [];
    moldGroup.traverse(child => {
        if (child.isMesh) meshes.push(child);
    });

    let totalTriangles = 0;
    meshes.forEach(m => {
        const geo = m.geometry.clone().applyMatrix4(m.matrixWorld);
        totalTriangles += geo.index ? geo.index.count / 3 : geo.attributes.position.count / 3;
    });

    const bufferLength = 80 + 4 + totalTriangles * 50;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const dataView = new DataView(arrayBuffer);

    const header = "Makerdu 3D Mold Casting STL";
    for (let i = 0; i < 80; i++) {
        dataView.setUint8(i, i < header.length ? header.charCodeAt(i) : 0);
    }
    dataView.setUint32(80, totalTriangles, true);

    let offset = 84;
    const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();
    const cb = new THREE.Vector3(), ab = new THREE.Vector3();

    meshes.forEach(m => {
        const geo = m.geometry.clone().applyMatrix4(m.matrixWorld);
        const pos = geo.attributes.position;
        const index = geo.index;
        const count = index ? index.count : pos.count;

        for (let i = 0; i < count; i += 3) {
            const i0 = index ? index.getX(i) : i;
            const i1 = index ? index.getX(i + 1) : i + 1;
            const i2 = index ? index.getX(i + 2) : i + 2;

            vA.fromBufferAttribute(pos, i0);
            vB.fromBufferAttribute(pos, i1);
            vC.fromBufferAttribute(pos, i2);

            cb.subVectors(vC, vB);
            ab.subVectors(vA, vB);
            cb.cross(ab).normalize();

            dataView.setFloat32(offset, cb.x, true); offset += 4;
            dataView.setFloat32(offset, cb.y, true); offset += 4;
            dataView.setFloat32(offset, cb.z, true); offset += 4;

            dataView.setFloat32(offset, vA.x, true); offset += 4;
            dataView.setFloat32(offset, vA.y, true); offset += 4;
            dataView.setFloat32(offset, vA.z, true); offset += 4;

            dataView.setFloat32(offset, vB.x, true); offset += 4;
            dataView.setFloat32(offset, vB.y, true); offset += 4;
            dataView.setFloat32(offset, vB.z, true); offset += 4;

            dataView.setFloat32(offset, vC.x, true); offset += 4;
            dataView.setFloat32(offset, vC.y, true); offset += 4;
            dataView.setFloat32(offset, vC.z, true); offset += 4;

            dataView.setUint16(offset, 0, true); offset += 2;
        }
    });

    return new Blob([arrayBuffer], { type: 'application/octet-stream' });
}

function downloadSTL() {
    const blob = exportBinarySTL();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `molde_${state.moldType}_${state.shape}_${state.size}mm_makerdu.stl`;
    link.click();
}

function sendToLms() {
    const blob = exportBinarySTL();
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = function() {
        const payload = {
            type: 'MAKERDU_MICROAPP_ASSET',
            appName: 'mold-maker',
            fileType: 'stl',
            fileName: `molde_${state.moldType}_${state.size}mm.stl`,
            content: reader.result,
            mold_type: state.moldType,
            shape: state.shape,
            draft_deg: state.draftDeg,
            size_mm: state.size,
            depth_mm: state.depth,
        };

        if (window.parent && window.parent !== window) {
            window.parent.postMessage(payload, '*');
            alert('✅ ¡Diseño de Molde 3D enviado a la bitácora de tu escuadra!');
        } else {
            downloadSTL();
        }
    };
}

// =====================================================================
// INIT & EVENTOS
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
    initThree();

    // Mold Types
    document.querySelectorAll('.btn-moldtype').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-moldtype').forEach(b => {
                b.classList.remove('border-rose-500/50', 'bg-rose-950/40', 'text-rose-300');
                b.classList.add('border-slate-800', 'bg-slate-900', 'text-slate-400');
            });
            btn.classList.add('border-rose-500/50', 'bg-rose-950/40', 'text-rose-300');
            state.moldType = btn.getAttribute('data-type');
            rebuildMold();
        });
    });

    // Shapes
    document.querySelectorAll('.btn-shape').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-shape').forEach(b => {
                b.classList.remove('border-rose-500/50', 'bg-rose-950/40', 'text-rose-300');
                b.classList.add('border-slate-800', 'bg-slate-900', 'text-slate-400');
            });
            btn.classList.add('border-rose-500/50', 'bg-rose-950/40', 'text-rose-300');
            state.shape = btn.getAttribute('data-shape');
            rebuildMold();
        });
    });

    // Sliders
    document.getElementById('sliderDraft').addEventListener('input', e => {
        state.draftDeg = parseInt(e.target.value);
        document.getElementById('valDraft').textContent = `${state.draftDeg}°`;
        rebuildMold();
    });

    document.getElementById('sliderSize').addEventListener('input', e => {
        state.size = parseInt(e.target.value);
        document.getElementById('valSize').textContent = `${state.size} mm`;
        rebuildMold();
    });

    document.getElementById('sliderDepth').addEventListener('input', e => {
        state.depth = parseInt(e.target.value);
        document.getElementById('valDepth').textContent = `${state.depth} mm`;
        rebuildMold();
    });

    document.getElementById('btnDownloadStl').addEventListener('click', downloadSTL);
    document.getElementById('btnSendToLms').addEventListener('click', sendToLms);

    rebuildMold();
});
