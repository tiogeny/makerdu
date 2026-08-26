/**
 * Diseñador de Macetas & Jarrones 3D · Makerdu Micro-App
 * --------------------------------------------------------
 * Motor paramétrico 3D de superficies continuas en Three.js,
 * generación de mallas helicoidales y exportador binario STL.
 */

'use strict';

// =====================================================================
// ESTADO GLOBAL
// =====================================================================
const state = {
    style: 'spiral',     // 'spiral', 'lowpoly', 'ribbed'
    sides: 6,            // 3 a 16 lados
    twistDeg: 90,        // 0 a 360 deg
    height: 90,          // mm
    radiusTop: 35,       // mm
    radiusBottom: 30,    // mm
    hasDrainage: true,
};

// =====================================================================
// THREE.JS SETUP
// =====================================================================
let scene, camera, renderer, controls, vaseMesh;

function initThree() {
    const container = document.getElementById('threeContainer');
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 480;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(70, 90, 110);

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

    const dirLight = new THREE.DirectionalLight(0x10b981, 0.9); // Emerald
    dirLight.position.set(60, 120, 80);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x06b6d4, 0.4);
    fillLight.position.set(-60, 40, -60);
    scene.add(fillLight);

    // Grilla
    const grid = new THREE.GridHelper(160, 16, 0x10b981, 0x1e293b);
    grid.position.y = 0;
    scene.add(grid);

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
// GEOMETRÍA PARAMÉTRICA DEL JARRÓN / MACETA
// =====================================================================
const matCeramic = new THREE.MeshStandardMaterial({
    color: 0x059669, // Esmeralda / Terracota Maker
    roughness: 0.35,
    metalness: 0.15,
    side: THREE.DoubleSide,
    flatShading: true,
});

function rebuildVase() {
    if (vaseMesh) scene.remove(vaseMesh);

    const H = state.height;
    const rTop = state.radiusTop;
    const rBot = state.radiusBottom;
    const N = state.sides;
    const twistRad = (state.twistDeg * Math.PI) / 180;
    const vSteps = state.style === 'lowpoly' ? 6 : 24;

    const vertices = [];
    const indices = [];

    // Generación de anillos de vértices a lo largo del eje Y
    for (let v = 0; v <= vSteps; v++) {
        const t = v / vSteps; // 0 a 1
        const y = t * H;
        const radius = rBot + (rTop - rBot) * t + Math.sin(t * Math.PI) * 5;
        const currentTwist = t * twistRad;

        for (let s = 0; s < N; s++) {
            const angle = (s / N) * Math.PI * 2 + currentTwist;
            const x = radius * Math.cos(angle);
            const z = radius * Math.sin(angle);
            vertices.push(x, y, z);
        }
    }

    // Caras de las paredes laterales (Quads divididos en 2 triángulos)
    for (let v = 0; v < vSteps; v++) {
        for (let s = 0; s < N; s++) {
            const nextS = (s + 1) % N;
            const i0 = v * N + s;
            const i1 = v * N + nextS;
            const i2 = (v + 1) * N + s;
            const i3 = (v + 1) * N + nextS;

            indices.push(i0, i1, i2);
            indices.push(i1, i3, i2);
        }
    }

    // Base inferior sólida
    const baseCenterIdx = vertices.length / 3;
    vertices.push(0, 0, 0); // Vértice central inferior
    for (let s = 0; s < N; s++) {
        const nextS = (s + 1) % N;
        indices.push(baseCenterIdx, nextS, s);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    vaseMesh = new THREE.Mesh(geo, matCeramic);
    vaseMesh.castShadow = true;
    vaseMesh.receiveShadow = true;
    scene.add(vaseMesh);

    updateMetrics();
}

// =====================================================================
// MÉTRICAS & PRE-FLIGHT
// =====================================================================
function updateMetrics() {
    const H = state.height;
    const avgR = (state.radiusTop + state.radiusBottom) / 2;
    const vol = (Math.PI * Math.pow(avgR, 2) * H * 0.001).toFixed(1);
    const weightG = (vol * 0.18).toFixed(1); // En modo vaso peso muy ligero (~1 pared)

    const fc = Math.max(12, Math.round(weightG * 1.2));
    document.getElementById('valFabcoins').textContent = `${fc} FC`;
    document.getElementById('valPrintTime').textContent = `~${Math.round(H * 0.35)} minutos (Vase Mode)`;
}

// =====================================================================
// EXPORTADOR BINARIO STL 3D
// =====================================================================
function exportBinarySTL() {
    if (!vaseMesh) return null;
    const geo = vaseMesh.geometry.clone().applyMatrix4(vaseMesh.matrixWorld);
    const pos = geo.attributes.position;
    const index = geo.index;
    const totalTriangles = index ? index.count / 3 : pos.count / 3;

    const bufferLength = 80 + 4 + totalTriangles * 50;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const dataView = new DataView(arrayBuffer);

    const header = "Makerdu 3D Parametric Vase STL";
    for (let i = 0; i < 80; i++) {
        dataView.setUint8(i, i < header.length ? header.charCodeAt(i) : 0);
    }
    dataView.setUint32(80, totalTriangles, true);

    let offset = 84;
    const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();
    const cb = new THREE.Vector3(), ab = new THREE.Vector3();

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

    return new Blob([arrayBuffer], { type: 'application/octet-stream' });
}

function downloadSTL() {
    const blob = exportBinarySTL();
    if (!blob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `maceta_${state.style}_${state.sides}lados_${state.height}mm_makerdu.stl`;
    link.click();
}

function sendToLms() {
    const blob = exportBinarySTL();
    if (!blob) return;
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = function() {
        const payload = {
            type: 'MAKERDU_MICROAPP_ASSET',
            appName: 'vase-pot-generator',
            fileType: 'stl',
            fileName: `maceta_${state.style}_${state.height}mm.stl`,
            content: reader.result,
            style: state.style,
            sides: state.sides,
            twist_deg: state.twistDeg,
            height_mm: state.height,
            has_drainage: state.hasDrainage,
        };

        if (window.parent && window.parent !== window) {
            window.parent.postMessage(payload, '*');
            alert('✅ ¡Diseño de Maceta 3D enviado a la bitácora de tu escuadra!');
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

    // Styles
    document.querySelectorAll('.btn-style').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-style').forEach(b => {
                b.classList.remove('border-emerald-500/50', 'bg-emerald-950/40', 'text-emerald-300');
                b.classList.add('border-slate-800', 'bg-slate-900', 'text-slate-400');
            });
            btn.classList.add('border-emerald-500/50', 'bg-emerald-950/40', 'text-emerald-300');
            state.style = btn.getAttribute('data-style');
            matCeramic.flatShading = state.style === 'lowpoly';
            matCeramic.needsUpdate = true;
            rebuildVase();
        });
    });

    // Sliders
    document.getElementById('sliderSides').addEventListener('input', e => {
        state.sides = parseInt(e.target.value);
        document.getElementById('valSides').textContent = `${state.sides} lados`;
        rebuildVase();
    });

    document.getElementById('sliderTwist').addEventListener('input', e => {
        state.twistDeg = parseInt(e.target.value);
        document.getElementById('valTwist').textContent = `${state.twistDeg}°`;
        rebuildVase();
    });

    document.getElementById('sliderH').addEventListener('input', e => {
        state.height = parseInt(e.target.value);
        document.getElementById('valH').textContent = `${state.height} mm`;
        rebuildVase();
    });

    document.getElementById('sliderRTop').addEventListener('input', e => {
        state.radiusTop = parseInt(e.target.value);
        document.getElementById('valRTop').textContent = `${state.radiusTop} mm`;
        rebuildVase();
    });

    document.getElementById('sliderRBot').addEventListener('input', e => {
        state.radiusBottom = parseInt(e.target.value);
        document.getElementById('valRBot').textContent = `${state.radiusBottom} mm`;
        rebuildVase();
    });

    document.getElementById('checkDrain').addEventListener('change', e => {
        state.hasDrainage = e.target.checked;
        rebuildVase();
    });

    document.getElementById('btnDownloadStl').addEventListener('click', downloadSTL);
    document.getElementById('btnSendToLms').addEventListener('click', sendToLms);

    rebuildVase();
});
