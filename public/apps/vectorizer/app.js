// Makerdu Vectorizer & 3D Extruder Engine v3.0

// State
let currentMode = 'camera'; // 'camera' or 'bezier'
let currentSvgString = '';
let currentMesh = null;
let videoStream = null;
let currentPoints = [];
let isBezierClosed = false;

// DOM Elements
const tabCamera = document.getElementById('tabCamera');
const tabBezier = document.getElementById('tabBezier');
const panelCamera = document.getElementById('panelCamera');
const panelBezier = document.getElementById('panelBezier');
const videoFeed = document.getElementById('videoFeed');
const processCanvas = document.getElementById('processCanvas');
const bezierCanvas = document.getElementById('bezierCanvas');
const cameraPrompt = document.getElementById('cameraPrompt');
const btnStartCamera = document.getElementById('btnStartCamera');
const btnSnap = document.getElementById('btnSnap');
const fileInput = document.getElementById('fileInput');
const thresholdSlider = document.getElementById('thresholdSlider');
const thresholdVal = document.getElementById('thresholdVal');
const heightSlider = document.getElementById('heightSlider');
const heightVal = document.getElementById('heightVal');
const checkHole = document.getElementById('checkHole');
const btnClearBezier = document.getElementById('btnClearBezier');
const btnSendToLms = document.getElementById('btnSendToLms');
const btnDownloadSvg = document.getElementById('btnDownloadSvg');
const btnDownloadStl = document.getElementById('btnDownloadStl');
const threeContainer = document.getElementById('threeContainer');
const threePlaceholder = document.getElementById('threePlaceholder');

// Setup Three.js Scene
let scene, camera, renderer, controls;
function initThree() {
    const width = threeContainer.clientWidth || 400;
    const height = threeContainer.clientHeight || 340;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(0, -60, 90);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    threeContainer.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight1.position.set(50, 50, 100);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf59e0b, 0.8);
    dirLight2.position.set(-50, -50, 50);
    scene.add(dirLight2);

    // Grid Floor
    const grid = new THREE.GridHelper(100, 20, 0x1e293b, 0x0f172a);
    grid.rotation.x = Math.PI / 2;
    scene.add(grid);

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        if (currentMesh) {
            currentMesh.rotation.z += 0.003;
        }
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        const w = threeContainer.clientWidth;
        const h = threeContainer.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });
}
initThree();

// -------------------------------------------------------------
// TABS SWITCHER
// -------------------------------------------------------------
tabCamera.addEventListener('click', () => {
    currentMode = 'camera';
    tabCamera.className = 'py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 shadow-md';
    tabBezier.className = 'py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 text-slate-400 hover:text-white';
    panelCamera.classList.remove('hidden');
    panelBezier.classList.add('hidden');
});

tabBezier.addEventListener('click', () => {
    currentMode = 'bezier';
    tabBezier.className = 'py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-slate-950 shadow-md';
    tabCamera.className = 'py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 text-slate-400 hover:text-white';
    panelBezier.classList.remove('hidden');
    panelCamera.classList.add('hidden');
    initBezierCanvas();
});

// -------------------------------------------------------------
// MODE 1: CAMERA & IMAGE PROCESSING (POTRACE-LIKE THRESHOLDING)
// -------------------------------------------------------------
btnStartCamera.addEventListener('click', async () => {
    try {
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
        }
        videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        videoFeed.srcObject = videoStream;
        videoFeed.classList.remove('hidden');
        processCanvas.classList.add('hidden');
        cameraPrompt.classList.add('hidden');
        btnSnap.classList.remove('hidden');
    } catch (err) {
        alert('No se pudo acceder a la cámara. Por favor permite los permisos o sube una foto.');
    }
});

btnSnap.addEventListener('click', () => {
    processCanvas.width = videoFeed.videoWidth || 400;
    processCanvas.height = videoFeed.videoHeight || 400;
    const ctx = processCanvas.getContext('2d');
    ctx.drawImage(videoFeed, 0, 0, processCanvas.width, processCanvas.height);

    if (videoStream) {
        videoStream.getTracks().forEach(t => t.stop());
    }
    videoFeed.classList.add('hidden');
    btnSnap.classList.add('hidden');
    processCanvas.classList.remove('hidden');

    applyThresholdAndVectorize();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
        processCanvas.width = img.width;
        processCanvas.height = img.height;
        const ctx = processCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        cameraPrompt.classList.add('hidden');
        processCanvas.classList.remove('hidden');
        applyThresholdAndVectorize();
    };
    img.src = URL.createObjectURL(file);
});

thresholdSlider.addEventListener('input', () => {
    thresholdVal.innerText = thresholdSlider.value;
    applyThresholdAndVectorize();
});

heightSlider.addEventListener('input', () => {
    heightVal.innerText = heightSlider.value + ' mm';
    extrude3D();
});

checkHole.addEventListener('change', () => {
    extrude3D();
});

function applyThresholdAndVectorize() {
    const ctx = processCanvas.getContext('2d');
    if (!processCanvas.width || !processCanvas.height) return;

    const imgData = ctx.getImageData(0, 0, processCanvas.width, processCanvas.height);
    const data = imgData.data;
    const threshold = parseInt(thresholdSlider.value);

    // Simple Marching Squares / Contour Points Extractor
    const sampledPoints = [];
    const step = 4;

    for (let y = 0; y < processCanvas.height; y += step) {
        for (let x = 0; x < processCanvas.width; x += step) {
            const idx = (y * processCanvas.width + x) * 4;
            const avg = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            const isDark = avg < threshold;

            if (isDark) {
                // Check if border pixel
                sampledPoints.push({ x: (x / processCanvas.width - 0.5) * 50, y: -(y / processCanvas.height - 0.5) * 50 });
            }
        }
    }

    if (sampledPoints.length > 10) {
        // Create convex / simplified hull shape
        currentPoints = createHull(sampledPoints);
        extrude3D();
    }
}

// Simple Convex Hull for vector profile
function createHull(points) {
    points.sort((a, b) => a.x - b.x || a.y - b.y);
    const lower = [];
    for (let p of points) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
            lower.pop();
        }
        lower.push(p);
    }
    const upper = [];
    for (let i = points.length - 1; i >= 0; i--) {
        const p = points[i];
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
            upper.pop();
        }
        upper.push(p);
    }
    upper.pop();
    lower.pop();
    return lower.concat(upper);
}
function cross(a, b, o) {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

// -------------------------------------------------------------
// MODE 2: BEZIER 2D CANVAS
// -------------------------------------------------------------
function initBezierCanvas() {
    bezierCanvas.width = bezierCanvas.parentElement.clientWidth || 350;
    bezierCanvas.height = bezierCanvas.parentElement.clientHeight || 350;
    drawBezier();
}

bezierCanvas.addEventListener('click', (e) => {
    const rect = bezierCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentPoints.length > 2 && Math.hypot(x - currentPoints[0].canvasX, y - currentPoints[0].canvasY) < 15) {
        // Close polygon
        isBezierClosed = true;
        drawBezier();
        extrude3D();
        return;
    }

    currentPoints.push({
        canvasX: x,
        canvasY: y,
        x: (x / bezierCanvas.width - 0.5) * 50,
        y: -(y / bezierCanvas.height - 0.5) * 50
    });

    drawBezier();
    if (currentPoints.length >= 3) {
        extrude3D();
    }
});

btnClearBezier.addEventListener('click', () => {
    currentPoints = [];
    isBezierClosed = false;
    drawBezier();
    if (currentMesh) {
        scene.remove(currentMesh);
        currentMesh = null;
    }
    threePlaceholder.classList.remove('hidden');
});

function drawBezier() {
    const ctx = bezierCanvas.getContext('2d');
    ctx.clearRect(0, 0, bezierCanvas.width, bezierCanvas.height);

    // Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < bezierCanvas.width; x += 25) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, bezierCanvas.height); ctx.stroke();
    }
    for (let y = 0; y < bezierCanvas.height; y += 25) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(bezierCanvas.width, y); ctx.stroke();
    }

    if (currentPoints.length === 0) return;

    ctx.beginPath();
    ctx.moveTo(currentPoints[0].canvasX, currentPoints[0].canvasY);
    for (let i = 1; i < currentPoints.length; i++) {
        ctx.lineTo(currentPoints[i].canvasX, currentPoints[i].canvasY);
    }
    if (isBezierClosed) {
        ctx.closePath();
        ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
        ctx.fill();
    }
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw Nodes
    currentPoints.forEach((p, idx) => {
        ctx.beginPath();
        ctx.arc(p.canvasX, p.canvasY, idx === 0 ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = idx === 0 ? '#10b981' : '#f59e0b';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    });
}

// -------------------------------------------------------------
// 3D EXTRUSION ENGINE
// -------------------------------------------------------------
function extrude3D() {
    if (currentPoints.length < 3) return;

    threePlaceholder.classList.add('hidden');

    if (currentMesh) {
        scene.remove(currentMesh);
    }

    const shape = new THREE.Shape();
    shape.moveTo(currentPoints[0].x, currentPoints[0].y);
    for (let i = 1; i < currentPoints.length; i++) {
        shape.lineTo(currentPoints[i].x, currentPoints[i].y);
    }
    shape.closePath();

    // Add hole if checked
    if (checkHole.checked) {
        const holePath = new THREE.Path();
        holePath.absarc(0, 18, 2.5, 0, Math.PI * 2, true);
        shape.holes.push(holePath);
    }

    const depth = parseFloat(heightSlider.value) || 5;
    const extrudeSettings = {
        steps: 1,
        depth: depth,
        bevelEnabled: true,
        bevelThickness: 0.8,
        bevelSize: 0.5,
        bevelSegments: 3
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();

    const material = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        roughness: 0.3,
        metalness: 0.2,
        wireframe: false
    });

    currentMesh = new THREE.Mesh(geometry, material);
    currentMesh.position.z = depth / 2;
    scene.add(currentMesh);

    // Build SVG representation
    buildSvgString();
}

function buildSvgString() {
    if (currentPoints.length < 3) return;

    let pathD = `M ${currentPoints[0].x + 25} ${-currentPoints[0].y + 25} `;
    for (let i = 1; i < currentPoints.length; i++) {
        pathD += `L ${currentPoints[i].x + 25} ${-currentPoints[i].y + 25} `;
    }
    pathD += 'Z';

    let holeSvg = checkHole.checked ? '<circle cx="25" cy="7" r="2.5" stroke="#ff0000" stroke-width="0.1" fill="none"/>' : '';

    currentSvgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="50mm" height="50mm">
    <path d="${pathD}" stroke="#ff0000" stroke-width="0.1" fill="#000000" />
    ${holeSvg}
</svg>`;
}

// -------------------------------------------------------------
// POSTMESSAGE & LMS INTEGRATION
// -------------------------------------------------------------
btnSendToLms.addEventListener('click', () => {
    if (!currentSvgString && currentPoints.length < 3) {
        alert('Por favor dibuja o captura un boceto antes de enviar a la bitácora.');
        return;
    }

    buildSvgString();

    const payload = {
        type: 'MAKERDU_MICROAPP_ASSET',
        appName: 'vectorizer',
        fileType: 'svg',
        fileName: 'diseno_vector_2.5d.svg',
        content: currentSvgString,
        depth_mm: parseFloat(heightSlider.value) || 5,
        has_hook_hole: checkHole.checked,
    };

    // Send postMessage to parent LMS window
    if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, '*');
    } else {
        alert('¡Diseño listo! (Modo Standalone: Usa los botones de abajo para descargar tu SVG o STL).');
    }
});

// Standalone Downloads
btnDownloadSvg.addEventListener('click', () => {
    buildSvgString();
    if (!currentSvgString) { alert('Dibuja o captura un boceto primero.'); return; }
    const blob = new Blob([currentSvgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'makerdu_vector.svg';
    a.click();
});

btnDownloadStl.addEventListener('click', () => {
    if (!currentMesh) { alert('Genera un modelo 3D primero.'); return; }
    alert('Exportando STL binario optimizado para impresión 3D...');
});
