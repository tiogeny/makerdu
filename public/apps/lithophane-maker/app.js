/**
 * Generador de Litofanías 3D & Cajas de Luz · Makerdu Micro-App
 * ---------------------------------------------------------------
 * Motor WebGL en Three.js que transforma el mapa de luminancia de una
 * fotografía en una malla 3D milimétrica y exporta a formato binario STL.
 */

'use strict';

// =====================================================================
// ESTADO GLOBAL
// =====================================================================
const state = {
    shape: 'flat',       // 'flat', 'arc', 'cylinder'
    widthMm: 100,        // mm
    minThickness: 0.8,   // mm (blancos)
    maxThickness: 3.2,   // mm (negros)
    hasFrame: true,
    isBacklightOn: false,
    imageSource: null,   // HTMLImageElement
};

// =====================================================================
// THREE.JS SETUP
// =====================================================================
let scene, camera, renderer, controls, lithoMesh, backLight;

function initThree() {
    const container = document.getElementById('threeContainer');
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 480;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(0, 0, 140);

    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Luces
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.4);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(50, 80, 80);
    scene.add(dirLight);

    // Contraluz Trasero
    backLight = new THREE.PointLight(0xfef08a, 0, 200);
    backLight.position.set(0, 0, -40);
    scene.add(backLight);

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
// PROCESAMIENTO DE IMAGEN & LUMINANCIA
// =====================================================================
function createDemoImage(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 100, 100);

    if (type === 'robot') {
        // Cara de robot en tonos de gris
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(20, 20, 60, 60);
        ctx.fillStyle = '#000000';
        ctx.fillRect(30, 35, 12, 12);
        ctx.fillRect(58, 35, 12, 12);
        ctx.fillRect(35, 60, 30, 8);
    } else {
        // Montaña / Andes
        const grad = ctx.createLinearGradient(0, 0, 0, 100);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(1, '#222222');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, 100);
        ctx.lineTo(50, 20);
        ctx.lineTo(100, 100);
        ctx.fill();
    }

    const img = new Image();
    img.src = canvas.toDataURL();
    img.onload = () => {
        state.imageSource = img;
        rebuildLithophane();
    };
}

// =====================================================================
// GENERACIÓN PROCEDURAL DE LA LITOFANÍA 3D
// =====================================================================
const matPla = new THREE.MeshStandardMaterial({
    color: 0xf8fafc, // Blanco marfil PLA
    roughness: 0.6,
    metalness: 0.05,
    side: THREE.DoubleSide,
});

function rebuildLithophane() {
    if (lithoMesh) scene.remove(lithoMesh);
    if (!state.imageSource) return;

    const img = state.imageSource;
    const resX = 64;
    const resY = 64;

    const canvas = document.createElement('canvas');
    canvas.width = resX;
    canvas.height = resY;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, resX, resY);
    const imgData = ctx.getImageData(0, 0, resX, resY).data;

    const W = state.widthMm;
    const H = (W * (img.height / img.width));
    const minT = state.minThickness;
    const maxT = state.maxThickness;

    const geo = new THREE.PlaneGeometry(W, H, resX - 1, resY - 1);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
        const u = i % resX;
        const v = Math.floor(i / resX);
        const pixelIdx = (v * resX + u) * 4;

        const r = imgData[pixelIdx];
        const g = imgData[pixelIdx + 1];
        const b = imgData[pixelIdx + 2];
        const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        // Donde es blanco el plástico es delgado (pasa luz), donde es negro es grueso
        const thickness = minT + (1 - brightness) * (maxT - minT);

        if (state.shape === 'arc') {
            // Curvatura en arco cilíndrico
            const normX = (pos.getX(i) / (W / 2)); // -1 a 1
            const angle = normX * (Math.PI / 4);
            const radius = W * 1.2;
            const newX = radius * Math.sin(angle);
            const newZ = radius * (1 - Math.cos(angle)) + thickness;
            pos.setXYZ(i, newX, pos.getY(i), newZ);
        } else {
            pos.setZ(i, thickness);
        }
    }

    geo.computeVertexNormals();
    lithoMesh = new THREE.Mesh(geo, matPla);
    lithoMesh.castShadow = true;
    lithoMesh.receiveShadow = true;
    scene.add(lithoMesh);

    updateMetrics(W, H);
}

// =====================================================================
// MÉTRICAS & PRE-FLIGHT
// =====================================================================
function updateMetrics(w, h) {
    const avgT = (state.minThickness + state.maxThickness) / 2;
    const vol = (w * h * avgT * 0.001).toFixed(1);
    const weight = (vol * 1.24).toFixed(1);

    document.getElementById('valWeight').textContent = `~${weight} g PLA (${vol} cm³)`;
    const fc = Math.max(15, Math.round(weight * 0.9));
    document.getElementById('valFabcoins').textContent = `${fc} FC`;
}

// =====================================================================
// EXPORTADOR BINARIO STL 3D
// =====================================================================
function exportBinarySTL() {
    if (!lithoMesh) return null;
    const geo = lithoMesh.geometry.clone().applyMatrix4(lithoMesh.matrixWorld);
    const pos = geo.attributes.position;
    const index = geo.index;
    const totalTriangles = index ? index.count / 3 : pos.count / 3;

    const bufferLength = 80 + 4 + totalTriangles * 50;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const dataView = new DataView(arrayBuffer);

    const header = "Makerdu Lithophane 3D STL";
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
    link.download = `litofania_${state.shape}_${state.widthMm}mm_makerdu.stl`;
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
            appName: 'lithophane-maker',
            fileType: 'stl',
            fileName: `litofania_${state.shape}_${state.widthMm}mm.stl`,
            content: reader.result,
            shape: state.shape,
            width_mm: state.widthMm,
            min_thickness_mm: state.minThickness,
            max_thickness_mm: state.maxThickness,
        };

        if (window.parent && window.parent !== window) {
            window.parent.postMessage(payload, '*');
            alert('✅ ¡Litofanía 3D enviada a la bitácora de tu escuadra!');
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
    createDemoImage('robot');

    // File Input
    document.getElementById('fileInput').addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = evt => {
            const img = new Image();
            img.src = evt.target.result;
            img.onload = () => {
                state.imageSource = img;
                rebuildLithophane();
            };
        };
        reader.readAsDataURL(file);
    });

    // Demos
    document.querySelectorAll('.btn-demo').forEach(btn => {
        btn.addEventListener('click', () => {
            createDemoImage(btn.getAttribute('data-demo'));
        });
    });

    // Shapes
    document.querySelectorAll('.btn-shape').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-shape').forEach(b => {
                b.classList.remove('border-cyan-500/50', 'bg-cyan-950/40', 'text-cyan-300');
                b.classList.add('border-slate-800', 'bg-slate-900', 'text-slate-400');
            });
            btn.classList.add('border-cyan-500/50', 'bg-cyan-950/40', 'text-cyan-300');
            state.shape = btn.getAttribute('data-shape');
            rebuildLithophane();
        });
    });

    // Sliders
    document.getElementById('sliderW').addEventListener('input', e => {
        state.widthMm = parseInt(e.target.value);
        document.getElementById('valW').textContent = `${state.widthMm} mm`;
        rebuildLithophane();
    });

    document.getElementById('sliderMinT').addEventListener('input', e => {
        state.minThickness = parseFloat(e.target.value);
        document.getElementById('valMinT').textContent = `${state.minThickness.toFixed(1)} mm`;
        rebuildLithophane();
    });

    document.getElementById('sliderMaxT').addEventListener('input', e => {
        state.maxThickness = parseFloat(e.target.value);
        document.getElementById('valMaxT').textContent = `${state.maxThickness.toFixed(1)} mm`;
        rebuildLithophane();
    });

    // Backlight Toggle
    document.getElementById('btnToggleBacklight').addEventListener('click', () => {
        state.isBacklightOn = !state.isBacklightOn;
        backLight.intensity = state.isBacklightOn ? 2.5 : 0;
        document.getElementById('lightDot').className = state.isBacklightOn ? 'w-2 h-2 rounded-full bg-yellow-400 animate-ping' : 'w-2 h-2 rounded-full bg-slate-500';
        document.getElementById('lightIcon').textContent = state.isBacklightOn ? '💡' : '🌑';
        document.getElementById('lightLabel').textContent = state.isBacklightOn ? 'Apagar Contraluz' : 'Probar Contraluz';
    });

    document.getElementById('btnDownloadStl').addEventListener('click', downloadSTL);
    document.getElementById('btnSendToLms').addEventListener('click', sendToLms);
});
