/**
 * Digitoy Studio 3D · Generador Paramétrico de Figuras Articuladas Makerdu
 * -------------------------------------------------------------------------
 * Motor WebGL en Three.js con generación de mallas procedurales,
 * simulación cinemática en vivo y exportador a formato binario STL.
 */

'use strict';

// =====================================================================
// ESTADO DE LA FIGURA
// =====================================================================
const state = {
    archetype: 'robot',       // 'robot', 'otorongo', 'dragon'
    headShape: 'cube',        // 'cube', 'sphere', 'helmet'
    accessory: 'none',        // 'none', 'ears', 'horns', 'antenna'
    headSize: 24,             // mm
    chestEmblem: 'gear',      // 'gear', 'heart', 'zap', 'star'
    torsoWidth: 30,           // mm
    bodySegments: 3,          // número de vértebras
    handType: 'claw',         // 'claw', 'fist', 'peg'
    armLength: 28,            // mm
    legLength: 32,            // mm
    jointMode: 'print_in_place', // 'print_in_place', 'snap_fit'
    tolerance: 0.35,          // mm (holgura PLA)
    isAnimating: false,
    stlBuffer: null,
};

// =====================================================================
// THREE.JS SETUP
// =====================================================================
let scene, camera, renderer, controls, figureGroup;
let limbJoints = []; // referencias para animación cinemática
let animClock = 0;

function initThree() {
    const container = document.getElementById('threeContainer');
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // slate-950

    camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(60, 60, 100);

    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // no mirar desde abajo del piso

    // Luces
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.7);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0x10b981, 0.8);
    dirLight.position.set(50, 80, 50);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x06b6d4, 0.4);
    fillLight.position.set(-50, 40, -50);
    scene.add(fillLight);

    // Grilla Maker (Cama de impresión 3D 150x150mm)
    const grid = new THREE.GridHelper(150, 30, 0x10b981, 0x1e293b);
    grid.position.y = -1;
    scene.add(grid);

    // Grupo de la figura
    figureGroup = new THREE.Group();
    scene.add(figureGroup);

    window.addEventListener('resize', onWindowResize);

    animate();
}

function onWindowResize() {
    const container = document.getElementById('threeContainer');
    if (!container || !renderer) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// =====================================================================
// GENERACIÓN PROCEDURAL DE LA FIGURA 3D
// =====================================================================
const matBody = new THREE.MeshStandardMaterial({
    color: 0x10b981, // Emerald Maker
    roughness: 0.35,
    metalness: 0.15,
});

const matAccent = new THREE.MeshStandardMaterial({
    color: 0x06b6d4, // Cyan Accent
    roughness: 0.4,
    metalness: 0.2,
});

const matJoint = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, // Amber articulación
    roughness: 0.5,
});

function rebuildFigure() {
    // Limpiar geometrías previas
    while (figureGroup.children.length > 0) {
        const obj = figureGroup.children[0];
        figureGroup.remove(obj);
    }
    limbJoints = [];

    const hSize = state.headSize;
    const tWidth = state.torsoWidth;
    const tDepth = 18;
    const segs = state.bodySegments;

    // 1. TORSO & VÉRTEBRAS
    const spineGroup = new THREE.Group();
    const segHeight = 14;
    const totalTorsoHeight = segs * segHeight;

    for (let i = 0; i < segs; i++) {
        const segWidth = tWidth * (1 - (i * 0.08));
        const segGeo = new THREE.BoxGeometry(segWidth, segHeight - 2, tDepth);
        const segMesh = new THREE.Mesh(segGeo, matBody);
        segMesh.position.y = (segs - 1 - i) * segHeight;
        segMesh.castShadow = true;
        segMesh.receiveShadow = true;
        spineGroup.add(segMesh);

        // Bisagra Print-in-Place entre vértebras
        if (i < segs - 1) {
            const jointHinge = createHingeJoint(segWidth * 0.4, 4);
            jointHinge.position.set(0, (segs - 1 - i) * segHeight - segHeight / 2, 0);
            spineGroup.add(jointHinge);
        }

        // Emblema en el pecho (solo vértebra superior)
        if (i === 0) {
            const emblem = createEmblemMesh(state.chestEmblem);
            emblem.position.set(0, (segs - 1) * segHeight, tDepth / 2 + 1);
            spineGroup.add(emblem);
        }
    }
    figureGroup.add(spineGroup);

    // 2. CABEZA
    const headGroup = new THREE.Group();
    headGroup.position.set(0, totalTorsoHeight + hSize / 2 + 3, 0);

    let headGeo;
    if (state.headShape === 'sphere') {
        headGeo = new THREE.SphereGeometry(hSize / 2, 24, 24);
    } else if (state.headShape === 'helmet') {
        headGeo = new THREE.CylinderGeometry(hSize / 2.2, hSize / 2, hSize, 8);
    } else {
        headGeo = new THREE.BoxGeometry(hSize, hSize, hSize);
    }
    const headMesh = new THREE.Mesh(headGeo, matBody);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Ojos / Visor
    const eyeGeo = new THREE.BoxGeometry(hSize * 0.6, hSize * 0.22, 3);
    const eyeMesh = new THREE.Mesh(eyeGeo, matAccent);
    eyeMesh.position.set(0, hSize * 0.1, hSize / 2 + 1);
    headGroup.add(eyeMesh);

    // Accesorio de cabeza
    if (state.accessory === 'ears') {
        const earL = createEarMesh();
        earL.position.set(-hSize / 2.2, hSize / 2, 0);
        const earR = createEarMesh();
        earR.position.set(hSize / 2.2, hSize / 2, 0);
        earR.scale.x = -1;
        headGroup.add(earL, earR);
    } else if (state.accessory === 'horns') {
        const hornL = createHornMesh();
        hornL.position.set(-hSize / 2.5, hSize / 2, 0);
        const hornR = createHornMesh();
        hornR.position.set(hSize / 2.5, hSize / 2, 0);
        hornR.scale.x = -1;
        headGroup.add(hornL, hornR);
    } else if (state.accessory === 'antenna') {
        const ant = createAntennaMesh();
        ant.position.set(0, hSize / 2, 0);
        headGroup.add(ant);
    }

    // Cuello articulado
    const neckJoint = createHingeJoint(hSize * 0.3, 3);
    neckJoint.position.set(0, totalTorsoHeight + 1.5, 0);
    figureGroup.add(neckJoint);
    figureGroup.add(headGroup);

    // 3. BRAZOS (IZQUIERDO & DERECHO)
    const armLen = state.armLength;
    const armL = createLimbArm(-1, armLen, tWidth, totalTorsoHeight);
    const armR = createLimbArm(1, armLen, tWidth, totalTorsoHeight);
    figureGroup.add(armL, armR);
    limbJoints.push({ obj: armL, axis: 'x', amp: 0.35, speed: 2.5, phase: 0 });
    limbJoints.push({ obj: armR, axis: 'x', amp: 0.35, speed: 2.5, phase: Math.PI });

    // 4. PIERNAS
    const legLen = state.legLength;
    const legL = createLimbLeg(-1, legLen, tWidth);
    const legR = createLimbLeg(1, legLen, tWidth);
    figureGroup.add(legL, legR);
    limbJoints.push({ obj: legL, axis: 'x', amp: 0.4, speed: 2.5, phase: Math.PI });
    limbJoints.push({ obj: legR, axis: 'x', amp: 0.4, speed: 2.5, phase: 0 });

    // Centrar la figura en la base de la grilla
    figureGroup.position.y = legLen;

    updateMetrics();
}

// Helpers de Partes Geométricas
function createHingeJoint(width, radius) {
    const group = new THREE.Group();
    const cylGeo = new THREE.CylinderGeometry(radius, radius, width, 16);
    cylGeo.rotateZ(Math.PI / 2);
    const cyl = new THREE.Mesh(cylGeo, matJoint);
    group.add(cyl);
    return group;
}

function createEarMesh() {
    const geo = new THREE.ConeGeometry(5, 10, 4);
    geo.rotateZ(-Math.PI / 6);
    return new THREE.Mesh(geo, matAccent);
}

function createHornMesh() {
    const geo = new THREE.ConeGeometry(4, 14, 8);
    geo.rotateZ(-Math.PI / 4);
    return new THREE.Mesh(geo, matAccent);
}

function createAntennaMesh() {
    const g = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 12, 8), matAccent);
    stem.position.y = 6;
    const ball = new THREE.Mesh(new THREE.SphereGeometry(3.5, 12, 12), matJoint);
    ball.position.y = 12;
    g.add(stem, ball);
    return g;
}

function createEmblemMesh(type) {
    let geo;
    if (type === 'heart') {
        geo = new THREE.BoxGeometry(8, 8, 3);
        geo.rotateZ(Math.PI / 4);
    } else if (type === 'zap') {
        geo = new THREE.CylinderGeometry(1, 4, 10, 3);
    } else if (type === 'star') {
        geo = new THREE.CylinderGeometry(5, 5, 2.5, 5);
    } else {
        // Gear
        geo = new THREE.CylinderGeometry(5, 5, 2.5, 8);
    }
    return new THREE.Mesh(geo, matAccent);
}

function createLimbArm(side, length, torsoWidth, shoulderY) {
    const armGroup = new THREE.Group();
    armGroup.position.set(side * (torsoWidth / 2 + 5), shoulderY - 2, 0);

    // Hombro
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(4.5, 12, 12), matJoint);
    armGroup.add(shoulder);

    // Brazo
    const armGeo = new THREE.CylinderGeometry(3.5, 3, length, 12);
    armGeo.translate(0, -length / 2, 0);
    const arm = new THREE.Mesh(armGeo, matBody);
    armGroup.add(arm);

    // Mano / Pinza
    const handGroup = new THREE.Group();
    handGroup.position.y = -length;

    if (state.handType === 'claw') {
        const clawL = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 4), matAccent);
        clawL.position.set(-3, -4, 0);
        const clawR = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 4), matAccent);
        clawR.position.set(3, -4, 0);
        handGroup.add(clawL, clawR);
    } else if (state.handType === 'peg') {
        const peg = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 8, 12), matAccent);
        peg.position.y = -4;
        handGroup.add(peg);
    } else {
        // Fist
        const fist = new THREE.Mesh(new THREE.SphereGeometry(4.5, 12, 12), matAccent);
        fist.position.y = -4;
        handGroup.add(fist);
    }
    armGroup.add(handGroup);

    return armGroup;
}

function createLimbLeg(side, length, torsoWidth) {
    const legGroup = new THREE.Group();
    legGroup.position.set(side * (torsoWidth / 3.5), 0, 0);

    // Cadera
    const hip = new THREE.Mesh(new THREE.SphereGeometry(4.5, 12, 12), matJoint);
    legGroup.add(hip);

    // Pierna
    const legGeo = new THREE.CylinderGeometry(4, 3.5, length, 12);
    legGeo.translate(0, -length / 2, 0);
    const leg = new THREE.Mesh(legGeo, matBody);
    legGroup.add(leg);

    // Pie
    const footGeo = new THREE.BoxGeometry(8, 4, 14);
    footGeo.translate(0, -length - 2, 2);
    const foot = new THREE.Mesh(footGeo, matAccent);
    legGroup.add(foot);

    return legGroup;
}

// =====================================================================
// BUCLE DE ANIMACIÓN
// =====================================================================
function animate() {
    requestAnimationFrame(animate);

    if (state.isAnimating) {
        animClock += 0.05;
        limbJoints.forEach(joint => {
            const angle = Math.sin(animClock * joint.speed + joint.phase) * joint.amp;
            if (joint.axis === 'x') joint.obj.rotation.x = angle;
            if (joint.axis === 'y') joint.obj.rotation.y = angle;
        });
        figureGroup.position.y = state.legLength + Math.abs(Math.sin(animClock * 5)) * 2;
    } else {
        limbJoints.forEach(joint => {
            joint.obj.rotation.x = THREE.MathUtils.lerp(joint.obj.rotation.x, 0, 0.1);
        });
        figureGroup.position.y = THREE.MathUtils.lerp(figureGroup.position.y, state.legLength, 0.1);
    }

    controls.update();
    renderer.render(scene, camera);
}

// =====================================================================
// CÁLCULO DE MÉTRICAS & PRE-FLIGHT
// =====================================================================
function updateMetrics() {
    const h = state.headSize + (state.bodySegments * 14) + state.legLength + 10;
    const w = state.torsoWidth + (state.armLength * 1.5);
    const d = 26;

    document.getElementById('valDimensions').textContent = `${Math.round(w)} × ${Math.round(h)} × ${Math.round(d)} mm`;

    // Volumen aproximado
    const volCm3 = (w * h * d * 0.00035).toFixed(1);
    const weightG = (volCm3 * 1.24).toFixed(1); // PLA densidad ~1.24 g/cm3
    document.getElementById('valWeight').textContent = `~${weightG} g (${volCm3} cm³)`;

    const fabcoins = Math.max(15, Math.round(weightG * 1.2));
    document.getElementById('valFabcoins').textContent = `${fabcoins} FC`;
}

// =====================================================================
// EXPORTADOR BINARIO STL 3D
// =====================================================================
function exportBinarySTL() {
    const meshes = [];
    figureGroup.traverse(child => {
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

    // Header 80 bytes
    const header = "Makerdu Digitoy Studio 3D Binary STL";
    for (let i = 0; i < 80; i++) {
        dataView.setUint8(i, i < header.length ? header.charCodeAt(i) : 0);
    }

    // Number of triangles
    dataView.setUint32(80, totalTriangles, true);

    let offset = 84;
    const vA = new THREE.Vector3();
    const vB = new THREE.Vector3();
    const vC = new THREE.Vector3();
    const cb = new THREE.Vector3();
    const ab = new THREE.Vector3();

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

            // Normal
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
    link.download = `digitoy_${state.archetype}_${state.headShape}_makerdu.stl`;
    link.click();
}

function sendToLms() {
    const blob = exportBinarySTL();
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = function() {
        const base64data = reader.result;
        const payload = {
            type: 'MAKERDU_MICROAPP_ASSET',
            appName: 'digitoy-studio',
            fileType: 'stl',
            fileName: `digitoy_${state.archetype}_articulado.stl`,
            content: base64data,
            archetype: state.archetype,
            head_shape: state.headShape,
            body_segments: state.bodySegments,
            joint_mode: state.jointMode,
            tolerance_mm: state.tolerance,
        };

        if (window.parent && window.parent !== window) {
            window.parent.postMessage(payload, '*');
            alert('✅ ¡Digitoy exportado y enviado a la bitácora de tu escuadra!');
        } else {
            downloadSTL();
        }
    };
}

// =====================================================================
// INTERACCIÓN UI & TABS
// =====================================================================
function setTab(tabName) {
    const tabs = ['head', 'torso', 'limbs', 'joints'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab${t.charAt(0).toUpperCase() + t.slice(1)}`);
        const sec = document.getElementById(`sec${t.charAt(0).toUpperCase() + t.slice(1)}`);
        if (t === tabName) {
            btn.classList.add('active', 'text-slate-950');
            btn.classList.remove('text-slate-400');
            sec.classList.remove('hidden');
        } else {
            btn.classList.remove('active', 'text-slate-950');
            btn.classList.add('text-slate-400');
            sec.classList.add('hidden');
        }
    });
}

function setHeadShape(shape) {
    state.headShape = shape;
    document.getElementById('lblHeadShape').textContent = shape.toUpperCase();
    document.querySelectorAll('.btn-opt').forEach(b => {
        b.classList.remove('border-emerald-500/50', 'bg-emerald-950/40', 'text-emerald-300');
        b.classList.add('border-slate-800', 'bg-slate-900', 'text-slate-400');
    });
    event.target.classList.add('border-emerald-500/50', 'bg-emerald-950/40', 'text-emerald-300');
    rebuildFigure();
}

function setAccessory(acc) {
    state.accessory = acc;
    document.querySelectorAll('.btn-opt-acc').forEach(b => {
        b.classList.remove('border-emerald-500/50', 'bg-emerald-950/40', 'text-white');
        b.classList.add('border-slate-800', 'bg-slate-900', 'text-slate-400');
    });
    event.target.classList.add('border-emerald-500/50', 'bg-emerald-950/40', 'text-white');
    rebuildFigure();
}

function setChestEmblem(emb) {
    state.chestEmblem = emb;
    document.querySelectorAll('.btn-opt-emb').forEach(b => {
        b.classList.remove('border-emerald-500/50', 'bg-emerald-950/40', 'text-white');
        b.classList.add('border-slate-800', 'bg-slate-900', 'text-slate-400');
    });
    event.target.classList.add('border-emerald-500/50', 'bg-emerald-950/40', 'text-white');
    rebuildFigure();
}

function setHandType(h) {
    state.handType = h;
    document.querySelectorAll('.btn-opt-hand').forEach(b => {
        b.classList.remove('border-emerald-500/50', 'bg-emerald-950/40', 'text-emerald-300');
        b.classList.add('border-slate-800', 'bg-slate-900', 'text-slate-400');
    });
    event.target.classList.add('border-emerald-500/50', 'bg-emerald-950/40', 'text-emerald-300');
    rebuildFigure();
}

function setJointMode(mode) {
    state.jointMode = mode;
    document.querySelectorAll('.btn-opt-mode').forEach(b => {
        b.classList.remove('border-emerald-500/50', 'bg-emerald-950/40', 'text-emerald-300');
        b.classList.add('border-slate-800', 'bg-slate-900', 'text-slate-400');
    });
    event.currentTarget.classList.add('border-emerald-500/50', 'bg-emerald-950/40', 'text-emerald-300');
    rebuildFigure();
}

function resetCamera(view) {
    if (view === 'front') {
        camera.position.set(0, 40, 110);
    } else if (view === 'top') {
        camera.position.set(0, 140, 0);
    } else {
        camera.position.set(60, 60, 100);
    }
    controls.target.set(0, 35, 0);
    controls.update();
}

// =====================================================================
// INIT
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
    initThree();

    // Archetypes
    document.querySelectorAll('.archetype-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.archetype-btn').forEach(b => {
                b.classList.remove('bg-emerald-950/40', 'border-emerald-500/50', 'text-white');
                b.classList.add('bg-slate-950', 'border-slate-800', 'text-slate-400');
            });
            btn.classList.add('bg-emerald-950/40', 'border-emerald-500/50', 'text-white');
            const arch = btn.getAttribute('data-arch');
            state.archetype = arch;

            if (arch === 'otorongo') {
                state.headShape = 'sphere';
                state.accessory = 'ears';
                state.bodySegments = 4;
                state.handType = 'claw';
            } else if (arch === 'dragon') {
                state.headShape = 'helmet';
                state.accessory = 'horns';
                state.bodySegments = 6;
                state.handType = 'claw';
            } else {
                state.headShape = 'cube';
                state.accessory = 'antenna';
                state.bodySegments = 3;
                state.handType = 'claw';
            }
            rebuildFigure();
        });
    });

    // Sliders
    document.getElementById('sliderHeadSize').addEventListener('input', e => {
        state.headSize = parseInt(e.target.value);
        document.getElementById('lblHeadSize').textContent = `${state.headSize} mm`;
        rebuildFigure();
    });

    document.getElementById('sliderTorsoWidth').addEventListener('input', e => {
        state.torsoWidth = parseInt(e.target.value);
        document.getElementById('lblTorsoWidth').textContent = `${state.torsoWidth} mm`;
        rebuildFigure();
    });

    document.getElementById('sliderBodySegments').addEventListener('input', e => {
        state.bodySegments = parseInt(e.target.value);
        document.getElementById('lblBodySegments').textContent = `${state.bodySegments} vértebras`;
        rebuildFigure();
    });

    document.getElementById('sliderArmLength').addEventListener('input', e => {
        state.armLength = parseInt(e.target.value);
        document.getElementById('lblArmLength').textContent = `${state.armLength} mm`;
        rebuildFigure();
    });

    document.getElementById('sliderLegLength').addEventListener('input', e => {
        state.legLength = parseInt(e.target.value);
        document.getElementById('lblLegLength').textContent = `${state.legLength} mm`;
        rebuildFigure();
    });

    document.getElementById('sliderTolerance').addEventListener('input', e => {
        state.tolerance = parseFloat(e.target.value);
        document.getElementById('lblTolerance').textContent = `${state.tolerance} mm`;
        rebuildFigure();
    });

    // Botón de Animación
    document.getElementById('btnAnimate').addEventListener('click', () => {
        state.isAnimating = !state.isAnimating;
        document.getElementById('animIcon').textContent = state.isAnimating ? '⏸️' : '▶️';
        document.getElementById('animLabel').textContent = state.isAnimating ? 'Pausar Movimiento' : 'Probar Movimiento';
    });

    document.getElementById('btnDownloadStl').addEventListener('click', downloadSTL);
    document.getElementById('btnSendToLms').addEventListener('click', sendToLms);

    rebuildFigure();
});
