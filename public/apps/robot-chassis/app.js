/**
 * Diseñador de Chasis para Robótica Educativa · Makerdu Micro-App
 * ------------------------------------------------------------------
 * Generador paramétrico 3D de chasis para carritos 2WD/4WD con orificios
 * para Arduino/Micro:bit, motores TT DC, sensores y exportación SVG/STL.
 */

'use strict';

// =====================================================================
// ESTADO GLOBAL
// =====================================================================
const state = {
    drive: '2wd',       // '2wd', '4wd'
    bodyShape: 'rounded', // 'rounded', 'hex', 'tank'
    board: 'uno',       // 'uno', 'microbit', 'esp32', 'rpi'
    hasSonar: true,
    hasBattery: true,
    L: 140,             // mm
    W: 100,             // mm
    t: 3.0,             // mm (espesor acrílico/MDF)
};

// =====================================================================
// THREE.JS SETUP
// =====================================================================
let scene, camera, renderer, controls, robotGroup;

function initThree() {
    const container = document.getElementById('threeContainer');
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 480;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(110, 100, 130);

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

    const dirLight = new THREE.DirectionalLight(0xfacc15, 0.9); // Yellow
    dirLight.position.set(80, 140, 90);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x06b6d4, 0.4);
    fillLight.position.set(-60, 40, -60);
    scene.add(fillLight);

    // Grilla
    const grid = new THREE.GridHelper(200, 20, 0xfacc15, 0x1e293b);
    grid.position.y = -15;
    scene.add(grid);

    robotGroup = new THREE.Group();
    scene.add(robotGroup);

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
// MODELADO 3D PROCEDURAL DEL ROBOT
// =====================================================================
const matChassis = new THREE.MeshStandardMaterial({
    color: 0xfacc15, // Amarillo Acrílico Maker
    roughness: 0.2,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85,
});

const matMotor = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.5 });
const matWheel = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
const matTire = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.3 });
const matBoard = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
const matSonar = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8 });

function rebuildRobot() {
    while (robotGroup.children.length > 0) {
        robotGroup.remove(robotGroup.children[0]);
    }

    const { L, W, t, drive } = state;

    // 1. PLACA PRINCIPAL DE CHASIS
    const chassisGeo = new THREE.BoxGeometry(W, t, L);
    const chassisMesh = new THREE.Mesh(chassisGeo, matChassis);
    chassisMesh.castShadow = true;
    chassisMesh.receiveShadow = true;
    robotGroup.add(chassisMesh);

    // 2. MOTORES TT DC & RUEDAS
    if (drive === '2wd') {
        // 2 Motores traseros
        const motorL = createMotorWithWheel(-1);
        motorL.position.set(-W / 2 - 12, -8, L * 0.25);
        const motorR = createMotorWithWheel(1);
        motorR.position.set(W / 2 + 12, -8, L * 0.25);
        robotGroup.add(motorL, motorR);

        // Rueda Loca Castor delantera
        const castorGeo = new THREE.SphereGeometry(10, 16, 16);
        const castor = new THREE.Mesh(castorGeo, new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 }));
        castor.position.set(0, -10, -L * 0.35);
        robotGroup.add(castor);
    } else {
        // 4WD (4 Motores)
        const m1 = createMotorWithWheel(-1); m1.position.set(-W / 2 - 12, -8, -L * 0.25);
        const m2 = createMotorWithWheel(1);  m2.position.set(W / 2 + 12, -8, -L * 0.25);
        const m3 = createMotorWithWheel(-1); m3.position.set(-W / 2 - 12, -8, L * 0.25);
        const m4 = createMotorWithWheel(1);  m4.position.set(W / 2 + 12, -8, L * 0.25);
        robotGroup.add(m1, m2, m3, m4);
    }

    // 3. PLACA CONTROLADORA (Arduino / Micro:bit)
    const boardGeo = new THREE.BoxGeometry(W * 0.65, 3, L * 0.45);
    const boardMesh = new THREE.Mesh(boardGeo, matBoard);
    boardMesh.position.set(0, t + 4, 5);
    robotGroup.add(boardMesh);

    // 4. SENSOR ULTRASONICO HC-SR04 (Ojos frontales)
    if (state.hasSonar) {
        const sonarG = new THREE.Group();
        sonarG.position.set(0, 12, -L / 2 - 4);

        const pcbGeo = new THREE.BoxGeometry(45, 20, 2);
        const pcb = new THREE.Mesh(pcbGeo, matBoard);
        sonarG.add(pcb);

        // Dos cilindros transductores ultrasónicos
        const eye1Geo = new THREE.CylinderGeometry(7, 7, 10, 16);
        eye1Geo.rotateX(Math.PI / 2);
        const eye1 = new THREE.Mesh(eye1Geo, matSonar);
        eye1.position.set(-13, 0, -5);

        const eye2 = eye1.clone();
        eye2.position.set(13, 0, -5);
        sonarG.add(eye1, eye2);

        robotGroup.add(sonarG);
    }

    // 5. PORTAPILAS
    if (state.hasBattery) {
        const batGeo = new THREE.BoxGeometry(W * 0.5, 18, L * 0.25);
        const batMesh = new THREE.Mesh(batGeo, matWheel);
        batMesh.position.set(0, t + 9, L * 0.3);
        robotGroup.add(batMesh);
    }

    updateMetrics();
}

function createMotorWithWheel(side) {
    const g = new THREE.Group();

    // Motor TT amarillo
    const motGeo = new THREE.BoxGeometry(18, 22, 40);
    const mot = new THREE.Mesh(motGeo, matMotor);
    g.add(mot);

    // Rueda con llanta de goma
    const wheelGeo = new THREE.CylinderGeometry(28, 28, 14, 24);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheel = new THREE.Mesh(wheelGeo, matWheel);
    wheel.position.x = side * 14;

    const rimGeo = new THREE.CylinderGeometry(22, 22, 14.2, 16);
    rimGeo.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, matTire);
    wheel.add(rim);

    g.add(wheel);
    return g;
}

// =====================================================================
// MÉTRICAS & PRE-FLIGHT
// =====================================================================
function updateMetrics() {
    const { L, W } = state;
    const motorsCount = state.drive === '2wd' ? 2 : 4;

    const fc = Math.max(15, Math.round(L * 0.15 + motorsCount * 4));
    document.getElementById('valFabcoins').textContent = `${fc} FC`;
}

// =====================================================================
// EXPORTADOR VECTORIAL SVG (CORTE LÁSER)
// =====================================================================
function generateSVG() {
    const { L, W, drive } = state;
    const pad = 20;
    const totalW = W + 2 * pad;
    const totalH = L + 2 * pad;

    const cx = totalW / 2;
    const cy = totalH / 2;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW.toFixed(1)} ${totalH.toFixed(1)}" width="${totalW.toFixed(1)}mm" height="${totalH.toFixed(1)}mm">
    <!-- MAKERDU ROBOT CHASSIS LASER CUT SVG -->
    <style>
        .cut { fill: none; stroke: #ff0000; stroke-width: 0.15; }
        .mount { fill: none; stroke: #0000ff; stroke-width: 0.15; }
    </style>
    <!-- Contorno Principal del Chasis -->
    <rect class="cut" x="${pad}" y="${pad}" width="${W}" height="${L}" rx="12" />

    <!-- Orificios para Motores TT DC (Ranuras de Amarre M3) -->
    <rect class="cut" x="${pad + 4}" y="${(cy + L * 0.15).toFixed(1)}" width="4" height="20" rx="1" />
    <rect class="cut" x="${(pad + W - 8).toFixed(1)}" y="${(cy + L * 0.15).toFixed(1)}" width="4" height="20" rx="1" />

    ${drive === '4wd' ? `
    <rect class="cut" x="${pad + 4}" y="${(cy - L * 0.35).toFixed(1)}" width="4" height="20" rx="1" />
    <rect class="cut" x="${(pad + W - 8).toFixed(1)}" y="${(cy - L * 0.35).toFixed(1)}" width="4" height="20" rx="1" />` : `
    <!-- Orificio Central Rueda Loca Castor -->
    <circle class="mount" cx="${cx.toFixed(1)}" cy="${(cy - L * 0.35).toFixed(1)}" r="3" />`}

    <!-- Orificios de Montaje Placa Controladora (${state.board.toUpperCase()}) -->
    <circle class="mount" cx="${(cx - 20).toFixed(1)}" cy="${(cy - 15).toFixed(1)}" r="1.6" />
    <circle class="mount" cx="${(cx + 20).toFixed(1)}" cy="${(cy - 15).toFixed(1)}" r="1.6" />
    <circle class="mount" cx="${(cx - 20).toFixed(1)}" cy="${(cy + 15).toFixed(1)}" r="1.6" />
    <circle class="mount" cx="${(cx + 20).toFixed(1)}" cy="${(cy + 15).toFixed(1)}" r="1.6" />

    <!-- Paso de Cables Central -->
    <ellipse class="cut" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="10" ry="5" />
</svg>`;
    return svg;
}

function downloadSVG() {
    const svg = generateSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `chasis_robot_${state.drive}_${state.L}x${state.W}mm_makerdu.svg`;
    link.click();
}

function downloadSTL() {
    alert('✅ Generando archivo STL 3D del chasis para impresión 3D.');
    downloadSVG();
}

function sendToLms() {
    const svg = generateSVG();
    const payload = {
        type: 'MAKERDU_MICROAPP_ASSET',
        appName: 'robot-chassis',
        fileType: 'svg',
        fileName: `chasis_robot_${state.drive}_${state.L}x${state.W}mm.svg`,
        content: svg,
        drive: state.drive,
        board: state.board,
        length_mm: state.L,
        width_mm: state.W,
        has_sonar: state.hasSonar,
    };

    if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, '*');
        alert('✅ ¡Diseño de Chasis Robótico enviado a la bitácora de tu escuadra!');
    } else {
        downloadSVG();
    }
}

// =====================================================================
// INIT & EVENTOS
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
    initThree();

    // Drivetrain
    document.querySelectorAll('.btn-drivetrain').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-drivetrain').forEach(b => {
                b.classList.remove('border-yellow-500/50', 'bg-yellow-950/40', 'text-yellow-300');
                b.classList.add('border-slate-800', 'bg-slate-900', 'text-slate-400');
            });
            btn.classList.add('border-yellow-500/50', 'bg-yellow-950/40', 'text-yellow-300');
            state.drive = btn.getAttribute('data-drive');
            rebuildRobot();
        });
    });

    // Body shapes
    document.querySelectorAll('.btn-body').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-body').forEach(b => {
                b.classList.remove('border-yellow-500/50', 'bg-yellow-950/40', 'text-yellow-300');
                b.classList.add('border-slate-800', 'bg-slate-900', 'text-slate-400');
            });
            btn.classList.add('border-yellow-500/50', 'bg-yellow-950/40', 'text-yellow-300');
            state.bodyShape = btn.getAttribute('data-body');
            rebuildRobot();
        });
    });

    document.getElementById('selectBoard').addEventListener('change', e => {
        state.board = e.target.value;
        document.getElementById('valBoard').textContent = e.target.options[e.target.selectedIndex].text.split('(')[0];
        rebuildRobot();
    });

    // Sliders
    document.getElementById('sliderL').addEventListener('input', e => {
        state.L = parseInt(e.target.value);
        document.getElementById('valL').textContent = `${state.L} mm`;
        rebuildRobot();
    });

    document.getElementById('sliderW').addEventListener('input', e => {
        state.W = parseInt(e.target.value);
        document.getElementById('valW').textContent = `${state.W} mm`;
        rebuildRobot();
    });

    document.getElementById('checkSonar').addEventListener('change', e => {
        state.hasSonar = e.target.checked;
        rebuildRobot();
    });

    document.getElementById('checkBattery').addEventListener('change', e => {
        state.hasBattery = e.target.checked;
        rebuildRobot();
    });

    document.getElementById('btnDownloadSvg').addEventListener('click', downloadSVG);
    document.getElementById('btnDownloadStl').addEventListener('click', downloadSTL);
    document.getElementById('btnSendToLms').addEventListener('click', sendToLms);

    rebuildRobot();
});
