// Makerdu Vectorizer Engine v6.0 - Pixel Perfect Alignment, Zoom/Pan & Inkscape Bezier Handles

let extrusionMode = 'calado';
let showVectorOverlay = true;
let isEditNodesMode = false;
let curveLevel = 2;
let currentViewMode = 'split';
let currentMesh = null;
let videoStream = null;
let originalImg = null;

// Zoom & Pan
let zoomLevel = 1.0;
let panX = 0;
let panY = 0;
let isPanning = false;
let panStartX = 0;
let panStartY = 0;

// Tema
let isDarkMode = true;
const btnThemeToggle = document.getElementById('btnThemeToggle');
const themeIcon = document.getElementById('themeIcon');

function setTheme(dark) {
    isDarkMode = dark;
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
        if (themeIcon) themeIcon.innerText = '☀️';
        if (scene) scene.background = new THREE.Color(0x020617);
    } else {
        document.documentElement.classList.remove('dark');
        if (themeIcon) themeIcon.innerText = '🌙';
        if (scene) scene.background = new THREE.Color(0xf1f5f9);
    }
    if (typeof drawVectorCanvas === 'function') drawVectorCanvas();
}

if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => setTheme(!isDarkMode));
}

try {
    if (window.parent && window.parent.document && window.parent.document.documentElement.classList.contains('dark') !== undefined) {
        setTheme(window.parent.document.documentElement.classList.contains('dark'));
    }
} catch (e) {}

// Geometría normalizada (0.0 a 1.0 relativo a originalImg)
// Cada nodo: { u: float, v: float, h1u: float, h1v: float, h2u: float, h2v: float, isCorner: boolean }
let currentPoints = [];
let innerHoles = [];
let initialModelScale = 1.0;
let baseSpanU = 1.0;

// Selección y arrastre
let selectedNode = null; // { type: 'outer'|'hole', holeIdx: number, pointIdx: number }
let draggedElement = null; // { type: 'point'|'h1'|'h2', node: object }

// Dimensiones objetivo (mm)
let targetDimX = 50;
let targetDimY = 50;
let targetDimZ = 10;

// DOM Elements
const col2D = document.getElementById('col2D');
const col3D = document.getElementById('col3D');
const canvasWrapper = document.getElementById('canvasWrapper');

const btnViewSplit = document.getElementById('btnViewSplit');
const btnView2D = document.getElementById('btnView2D');
const btnView3D = document.getElementById('btnView3D');

const videoFeed = document.getElementById('videoFeed');
const processCanvas = document.getElementById('processCanvas');
const cameraPrompt = document.getElementById('cameraPrompt');
const btnStartCamera = document.getElementById('btnStartCamera');
const btnSnap = document.getElementById('btnSnap');
const fileInput = document.getElementById('fileInput');
const btnResetZoom = document.getElementById('btnResetZoom');

const btnToggleOverlay = document.getElementById('btnToggleOverlay');
const btnEditNodes = document.getElementById('btnEditNodes');
const nodeEditHelp = document.getElementById('nodeEditHelp');
const btnModeHoles = document.getElementById('btnModeHoles');
const btnModeSolid = document.getElementById('btnModeSolid');

const thresholdSlider = document.getElementById('thresholdSlider');
const thresholdVal = document.getElementById('thresholdVal');
const curveSlider = document.getElementById('curveSlider');
const curveVal = document.getElementById('curveVal');

const dimXInput = document.getElementById('dimXInput');
const dimYInput = document.getElementById('dimYInput');
const dimZInput = document.getElementById('dimZInput');
const checkHole = document.getElementById('checkHole');

const btnResetCamera = document.getElementById('btnResetCamera');
const threeContainer = document.getElementById('threeContainer');
const threePlaceholder = document.getElementById('threePlaceholder');
const dimInfo = document.getElementById('dimInfo');
const volInfo = document.getElementById('volInfo');
const costInfo = document.getElementById('costInfo');

const btnSendToLms = document.getElementById('btnSendToLms');
const btnDownloadStl = document.getElementById('btnDownloadStl');

// VISTAS
function setViewMode(mode) {
    currentViewMode = mode;
    if (btnViewSplit) btnViewSplit.className = 'px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 ' + (mode === 'split' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white');
    if (btnView2D) btnView2D.className = 'px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 ' + (mode === '2d' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white');
    if (btnView3D) btnView3D.className = 'px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 ' + (mode === '3d' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white');

    if (mode === '2d') {
        col2D.className = 'col-span-12 flex flex-col h-full min-h-0 bg-slate-900/70 border border-slate-800 rounded-2xl p-2.5 overflow-hidden shadow-xl';
        col3D.classList.add('hidden');
    } else if (mode === '3d') {
        col2D.classList.add('hidden');
        col3D.className = 'col-span-12 flex flex-col h-full min-h-0 bg-slate-900/70 border border-slate-800 rounded-2xl p-2.5 overflow-hidden shadow-xl';
        col3D.classList.remove('hidden');
    } else {
        col2D.className = 'col-span-12 lg:col-span-7 flex flex-col h-full min-h-0 bg-slate-900/70 border border-slate-800 rounded-2xl p-2.5 overflow-hidden shadow-xl';
        col2D.classList.remove('hidden');
        col3D.className = 'col-span-12 lg:col-span-5 flex flex-col h-full min-h-0 bg-slate-900/70 border border-slate-800 rounded-2xl p-2.5 overflow-hidden shadow-xl';
        col3D.classList.remove('hidden');
    }

    setTimeout(() => {
        syncCanvasResolution();
        onResizeThree();
        drawVectorCanvas();
    }, 60);
}

btnViewSplit.addEventListener('click', () => setViewMode('split'));
btnView2D.addEventListener('click', () => setViewMode('2d'));
btnView3D.addEventListener('click', () => setViewMode('3d'));

// THREE.JS SETUP
let scene, camera, renderer, controls;
function initThree() {
    const w = threeContainer.clientWidth || 400;
    const h = threeContainer.clientHeight || 340;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    camera = new THREE.PerspectiveCamera(45, w / h, 1, 1000);
    camera.position.set(0, -65, 95);

    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(w, h);
    threeContainer.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dir1 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dir1.position.set(50, 50, 100);
    scene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0xf59e0b, 0.8);
    dir2.position.set(-50, -50, 60);
    scene.add(dir2);

    const grid = new THREE.GridHelper(100, 20, 0x1e293b, 0x0f172a);
    grid.rotation.x = Math.PI / 2;
    scene.add(grid);

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', onResizeThree);
}

function onResizeThree() {
    if (!renderer || !camera || !threeContainer) return;
    const w = threeContainer.clientWidth || 400;
    const h = threeContainer.clientHeight || 340;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}
initThree();

btnResetCamera.addEventListener('click', () => {
    camera.position.set(0, -65, 95);
    controls.target.set(0, 0, 0);
    controls.update();
});

// CALCULO DEL ENCUADRE DE LA IMAGEN EN EL CANVAS (100% COMPARTIDO CON VECTORES)
function getImageLayout() {
    if (!originalImg || !processCanvas.width || !processCanvas.height) {
        return { ox: 0, oy: 0, scale: 1, w: processCanvas.width || 500, h: processCanvas.height || 400 };
    }
    // Ajuste proporcional manteniendo aspecto 1:1
    const baseFitScale = Math.min(processCanvas.width / originalImg.width, processCanvas.height / originalImg.height);
    const scale = baseFitScale * zoomLevel;
    const w = originalImg.width * scale;
    const h = originalImg.height * scale;
    const ox = ((processCanvas.width - w) / 2) + panX;
    const oy = ((processCanvas.height - h) / 2) + panY;
    return { ox, oy, scale, w, h };
}

// Convertir de coordenadas normalizadas (0 a 1) a pantalla (pixels)
function normToCanvas(u, v, layout) {
    return {
        x: layout.ox + u * layout.w,
        y: layout.oy + v * layout.h
    };
}

// Convertir de pantalla a normalizadas (0 a 1)
function canvasToNorm(x, y, layout) {
    return {
        u: (x - layout.ox) / layout.w,
        v: (y - layout.oy) / layout.h
    };
}

function syncCanvasResolution() {
    if (!canvasWrapper || !processCanvas) return;
    const rect = canvasWrapper.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (w > 50 && h > 50 && (processCanvas.width !== w || processCanvas.height !== h)) {
        processCanvas.width = w;
        processCanvas.height = h;
    }
}
window.addEventListener('resize', () => {
    syncCanvasResolution();
    drawVectorCanvas();
});

// ZOOM Y PAN
processCanvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (!originalImg) return;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.max(0.6, Math.min(6.0, zoomLevel * zoomFactor));

    const rect = processCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom centrado en la posición del ratón
    const layout = getImageLayout();
    const uMouse = (mouseX - layout.ox) / layout.w;
    const vMouse = (mouseY - layout.oy) / layout.h;

    zoomLevel = newZoom;
    const newLayout = getImageLayout();
    panX += (mouseX - (newLayout.ox + uMouse * newLayout.w));
    panY += (mouseY - (newLayout.oy + vMouse * newLayout.h));

    drawVectorCanvas();
}, { passive: false });

btnResetZoom.addEventListener('click', () => {
    zoomLevel = 1.0;
    panX = 0;
    panY = 0;
    drawVectorCanvas();
});

// CONTROLES UI
btnModeHoles.addEventListener('click', () => {
    extrusionMode = 'calado';
    btnModeHoles.className = 'flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold transition bg-cyan-500 text-slate-950 shadow text-center truncate';
    btnModeSolid.className = 'flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold transition text-slate-400 bg-slate-900 hover:text-white text-center truncate';
    extrude3D();
    drawVectorCanvas();
});

btnModeSolid.addEventListener('click', () => {
    extrusionMode = 'solido';
    btnModeSolid.className = 'flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold transition bg-cyan-500 text-slate-950 shadow text-center truncate';
    btnModeHoles.className = 'flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold transition text-slate-400 bg-slate-900 hover:text-white text-center truncate';
    extrude3D();
    drawVectorCanvas();
});

btnToggleOverlay.addEventListener('click', () => {
    showVectorOverlay = !showVectorOverlay;
    btnToggleOverlay.className = showVectorOverlay
        ? 'px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold transition'
        : 'px-2 py-1 rounded-lg bg-slate-800 text-slate-500 border border-slate-700 text-[10px] font-bold transition';
    drawVectorCanvas();
});

btnEditNodes.addEventListener('click', () => {
    isEditNodesMode = !isEditNodesMode;
    btnEditNodes.className = isEditNodesMode
        ? 'px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-[10px] transition shadow-md'
        : 'px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-slate-950 text-[10px] font-bold transition';
    if (nodeEditHelp) nodeEditHelp.classList.toggle('hidden', !isEditNodesMode);
    if (!isEditNodesMode) selectedNode = null;
    drawVectorCanvas();
});

thresholdSlider.addEventListener('input', () => {
    thresholdVal.innerText = thresholdSlider.value;
    applyThresholdAndVectorize();
});

const curveLabels = ['Recto', 'Suave', 'Medio', 'Organico', 'Ultra Curvo'];
curveSlider.addEventListener('input', () => {
    curveLevel = parseInt(curveSlider.value);
    curveVal.innerText = curveLabels[curveLevel] || 'Medio';
    updateAllBezierHandles();
    drawVectorCanvas();
    extrude3D();
});

dimXInput.addEventListener('input', () => {
    targetDimX = Math.max(10, Math.min(180, parseFloat(dimXInput.value) || 50));
    extrude3D();
});

dimYInput.addEventListener('input', () => {
    targetDimY = Math.max(10, Math.min(180, parseFloat(dimYInput.value) || 50));
    extrude3D();
});

dimZInput.addEventListener('input', () => {
    targetDimZ = Math.max(2, Math.min(35, parseFloat(dimZInput.value) || 10));
    extrude3D();
});

checkHole.addEventListener('change', () => extrude3D());

// IMAGEN / CAMARA
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
        originalImg = img;
        zoomLevel = 1.0; panX = 0; panY = 0;
        syncCanvasResolution();
        if (cameraPrompt) cameraPrompt.classList.add('hidden');
        processCanvas.classList.remove('hidden');
        applyThresholdAndVectorize();
    };
    img.src = URL.createObjectURL(file);
});

btnStartCamera.addEventListener('click', async () => {
    try {
        if (videoStream) videoStream.getTracks().forEach(t => t.stop());
        videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        videoFeed.srcObject = videoStream;
        videoFeed.classList.remove('hidden');
        processCanvas.classList.add('hidden');
        if (cameraPrompt) cameraPrompt.classList.add('hidden');
        btnSnap.classList.remove('hidden');
    } catch (err) {
        alert('No se pudo acceder a la camara.');
    }
});

btnSnap.addEventListener('click', () => {
    syncCanvasResolution();
    const ctx = processCanvas.getContext('2d');
    ctx.drawImage(videoFeed, 0, 0, processCanvas.width, processCanvas.height);
    const img = new Image();
    img.onload = () => {
        originalImg = img;
        zoomLevel = 1.0; panX = 0; panY = 0;
        if (videoStream) videoStream.getTracks().forEach(t => t.stop());
        videoFeed.classList.add('hidden');
        btnSnap.classList.add('hidden');
        processCanvas.classList.remove('hidden');
        applyThresholdAndVectorize();
    };
    img.src = processCanvas.toDataURL('image/png');
});

const urlParams = new URLSearchParams(window.location.search);
const initialImageUrl = urlParams.get('image_url');
if (initialImageUrl) {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
        originalImg = img;
        zoomLevel = 1.0; panX = 0; panY = 0;
        syncCanvasResolution();
        if (cameraPrompt) cameraPrompt.classList.add('hidden');
        processCanvas.classList.remove('hidden');
        applyThresholdAndVectorize();
    };
    img.src = initialImageUrl;
}

// CALCULO DE TIRADORES BEZIER NORMALIZADOS
function updateAllBezierHandles() {
    updateLoopHandles(currentPoints);
    innerHoles.forEach(updateLoopHandles);
}

function updateLoopHandles(pts) {
    const n = pts.length;
    if (n < 3) return;
    const tension = [0, 0.15, 0.3, 0.45, 0.6][curveLevel] || 0.3;

    for (let i = 0; i < n; i++) {
        const cur = pts[i];
        if (cur.isCorner) continue; // Respetar esquinas cúspides con tiradores independientes

        const prev = pts[(i - 1 + n) % n];
        const next = pts[(i + 1) % n];

        const tanU = (next.u - prev.u) * tension;
        const tanV = (next.v - prev.v) * tension;

        cur.h1u = cur.u - tanU;
        cur.h1v = cur.v - tanV;
        cur.h2u = cur.u + tanU;
        cur.h2v = cur.v + tanV;
    }
}

// VECTORIZACION PIXEL-PERFECT
function applyThresholdAndVectorize() {
    if (!originalImg) return;
    syncCanvasResolution();

    const maxDim = 320;
    const scaleFactor = Math.min(1, maxDim / Math.max(originalImg.width, originalImg.height));
    const w = Math.round(originalImg.width * scaleFactor);
    const h = Math.round(originalImg.height * scaleFactor);

    const workCanvas = document.createElement('canvas');
    workCanvas.width = w;
    workCanvas.height = h;
    const wCtx = workCanvas.getContext('2d');
    wCtx.drawImage(originalImg, 0, 0, w, h);

    const imgData = wCtx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const threshold = parseInt(thresholdSlider.value);

    const grid = new Uint8Array(w * h);
    for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        grid[i / 4] = brightness < threshold ? 1 : 0;
    }

    // Flood fill fondo exterior
    const visited = new Uint8Array(w * h);
    const queue = [];
    for (let x = 0; x < w; x++) {
        if (grid[x] === 0) { queue.push(x); visited[x] = 2; }
        const bIdx = (h - 1) * w + x;
        if (grid[bIdx] === 0) { queue.push(bIdx); visited[bIdx] = 2; }
    }
    for (let y = 0; y < h; y++) {
        const lIdx = y * w;
        if (grid[lIdx] === 0 && !visited[lIdx]) { queue.push(lIdx); visited[lIdx] = 2; }
        const rIdx = y * w + (w - 1);
        if (grid[rIdx] === 0 && !visited[rIdx]) { queue.push(rIdx); visited[rIdx] = 2; }
    }

    let head = 0;
    while (head < queue.length) {
        const idx = queue[head++];
        const cx = idx % w, cy = Math.floor(idx / w);
        const neighbors = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
        for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                const nIdx = ny * w + nx;
                if (grid[nIdx] === 0 && visited[nIdx] === 0) {
                    visited[nIdx] = 2;
                    queue.push(nIdx);
                }
            }
        }
    }

    // Mayor componente negro
    const darkVisited = new Uint8Array(w * h);
    let bestComponent = [];
    let bestStartX = -1, bestStartY = -1;

    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const idx = y * w + x;
            if (grid[idx] === 1 && darkVisited[idx] === 0) {
                const comp = [];
                const cQueue = [idx];
                darkVisited[idx] = 1;
                let cHead = 0;
                while (cHead < cQueue.length) {
                    const cIdx = cQueue[cHead++];
                    comp.push(cIdx);
                    const kx = cIdx % w, ky = Math.floor(cIdx / w);
                    const kNeigh = [[kx + 1, ky], [kx - 1, ky], [kx, ky + 1], [kx, ky - 1]];
                    for (const [nx, ny] of kNeigh) {
                        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                            const knIdx = ny * w + nx;
                            if (grid[knIdx] === 1 && darkVisited[knIdx] === 0) {
                                darkVisited[knIdx] = 1;
                                cQueue.push(knIdx);
                            }
                        }
                    }
                }
                if (comp.length > bestComponent.length) {
                    bestComponent = comp;
                    bestStartX = x;
                    bestStartY = y;
                }
            }
        }
    }

    if (bestComponent.length < 25 || bestStartX === -1) return;

    const rawOuterContour = tracePerimeter(grid, w, h, bestStartX, bestStartY, 1);
    if (rawOuterContour.length < 6) return;

    // Detección de huecos
    const detectedHoles = [];
    const holeVisited = new Uint8Array(w * h);

    for (let y = 2; y < h - 2; y++) {
        for (let x = 2; x < w - 2; x++) {
            const idx = y * w + x;
            if (grid[idx] === 0 && visited[idx] !== 2 && holeVisited[idx] === 0) {
                const holePixels = [];
                const hQueue = [idx];
                holeVisited[idx] = 1;
                let hHead = 0;
                let borderX = -1, borderY = -1;

                while (hHead < hQueue.length) {
                    const cur = hQueue[hHead++];
                    holePixels.push(cur);
                    const hx = cur % w, hy = Math.floor(cur / w);
                    const hNeigh = [[hx + 1, hy], [hx - 1, hy], [hx, hy + 1], [hx, hy - 1]];
                    for (const [hnx, hny] of hNeigh) {
                        if (hnx >= 0 && hnx < w && hny >= 0 && hny < h) {
                            const hnIdx = hny * w + hnx;
                            if (grid[hnIdx] === 0 && visited[hnIdx] !== 2 && holeVisited[hnIdx] === 0) {
                                holeVisited[hnIdx] = 1;
                                hQueue.push(hnIdx);
                            } else if (grid[hnIdx] === 1 && borderX === -1) {
                                borderX = hx; borderY = hy;
                            }
                        }
                    }
                }

                if (holePixels.length > 35 && borderX !== -1) {
                    const rawHole = tracePerimeter(grid, w, h, borderX, borderY, 0);
                    if (rawHole.length >= 6) detectedHoles.push(rawHole);
                }
            }
        }
    }

    const epsilon = 1.3;
    const simplifiedOuter = simplifyDouglasPeucker(rawOuterContour, epsilon);
    const simplifiedHoles = detectedHoles.map(h => simplifyDouglasPeucker(h, epsilon));

    // GUARDAR COORDENADAS NORMALIZADAS 0.0 A 1.0 (Exactamente sobre la imagen)
    currentPoints = simplifiedOuter.map(p => ({
        u: p.x / w,
        v: p.y / h,
        h1u: p.x / w, h1v: p.y / h,
        h2u: p.x / w, h2v: p.y / h,
        isCorner: false
    }));

    innerHoles = simplifiedHoles.map(hole => hole.map(p => ({
        u: p.x / w,
        v: p.y / h,
        h1u: p.x / w, h1v: p.y / h,
        h2u: p.x / w, h2v: p.y / h,
        isCorner: false
    })));

    updateAllBezierHandles();

    // Calcular medidas base iniciales
    let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
    for (const p of currentPoints) {
        minU = Math.min(minU, p.u); maxU = Math.max(maxU, p.u);
        minV = Math.min(minV, p.v); maxV = Math.max(maxV, p.v);
    }
    baseSpanU = Math.max(0.01, maxU - minU);
    const baseSpanV = Math.max(0.01, maxV - minV);
    const aspect = (baseSpanU * originalImg.width) / (baseSpanV * originalImg.height);

    if (!dimXInput.dataset.modified) {
        if (aspect >= 1) {
            targetDimX = 50;
            targetDimY = Math.round(50 / aspect);
        } else {
            targetDimY = 50;
            targetDimX = Math.round(50 * aspect);
        }
        dimXInput.value = targetDimX;
        dimYInput.value = targetDimY;
        dimXInput.dataset.modified = "true";
    }

    initialModelScale = targetDimX / baseSpanU;

    drawVectorCanvas();
    extrude3D();
}

function tracePerimeter(grid, w, h, startX, startY, targetVal) {
    const neighbors = [[-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1]];
    const contour = [];
    let curX = startX, curY = startY;
    let backtrackDir = 0;
    const maxSteps = 4000;
    let steps = 0;
    const isMatch = (x, y) => (x >= 0 && x < w && y >= 0 && y < h && grid[y * w + x] === targetVal);

    do {
        contour.push({ x: curX, y: curY });
        let nextX = -1, nextY = -1;
        let foundDir = -1;
        for (let i = 0; i < 8; i++) {
            const checkDir = (backtrackDir + i) % 8;
            const nx = curX + neighbors[checkDir][0];
            const ny = curY + neighbors[checkDir][1];
            if (isMatch(nx, ny)) {
                nextX = nx; nextY = ny; foundDir = checkDir; break;
            }
        }
        if (foundDir === -1) break;
        backtrackDir = (foundDir + 5) % 8;
        curX = nextX; curY = nextY;
        steps++;
    } while ((curX !== startX || curY !== startY) && steps < maxSteps);

    return contour;
}

function simplifyDouglasPeucker(points, epsilon) {
    if (points.length <= 2) return points;
    let dmax = 0, index = 0;
    const p1 = points[0], p2 = points[points.length - 1];

    for (let i = 1; i < points.length - 1; i++) {
        const d = perpendicularDist(points[i], p1, p2);
        if (d > dmax) { index = i; dmax = d; }
    }
    if (dmax > epsilon) {
        const rec1 = simplifyDouglasPeucker(points.slice(0, index + 1), epsilon);
        const rec2 = simplifyDouglasPeucker(points.slice(index), epsilon);
        return rec1.slice(0, rec1.length - 1).concat(rec2);
    }
    return [p1, p2];
}

function perpendicularDist(p, p1, p2) {
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    if (dx === 0 && dy === 0) return Math.hypot(p.x - p1.x, p.y - p1.y);
    return Math.abs(dy * p.x - dx * p.y + p2.x * p1.y - p2.y * p1.x) / Math.hypot(dx, dy);
}

function getSignedAreaNorm(pts) {
    let area = 0;
    for (let i = 0; i < pts.length; i++) {
        const j = (i + 1) % pts.length;
        area += pts[i].u * pts[j].v - pts[j].u * pts[i].v;
    }
    return area / 2;
}

// RENDERIZADO 2D: EXACTAMENTE ALINEADO CON LA IMAGEN DE FONDO
function drawVectorCanvas() {
    const ctx = processCanvas.getContext('2d');
    if (!ctx || !processCanvas.width) return;

    ctx.clearRect(0, 0, processCanvas.width, processCanvas.height);
    const layout = getImageLayout();

    if (originalImg) {
        ctx.save();
        ctx.globalAlpha = isEditNodesMode ? 0.35 : 0.85;
        ctx.drawImage(originalImg, layout.ox, layout.oy, layout.w, layout.h);
        ctx.restore();
    }

    if (!showVectorOverlay || currentPoints.length < 3) return;

    // Contorno exterior
    ctx.beginPath();
    drawBezierPath(ctx, currentPoints, layout);
    ctx.closePath();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.22)';
    ctx.fill();

    // Huecos interiores
    if (extrusionMode === 'calado') {
        innerHoles.forEach((hole) => {
            if (hole.length < 3) return;
            ctx.beginPath();
            drawBezierPath(ctx, hole, layout);
            ctx.closePath();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.fillStyle = 'rgba(245, 158, 11, 0.30)';
            ctx.fill();
        });
    }

    // Nodos y Tiradores
    if (isEditNodesMode) {
        currentPoints.forEach((p, idx) => {
            const isSel = (selectedNode && selectedNode.type === 'outer' && selectedNode.pointIdx === idx);
            const pt = normToCanvas(p.u, p.v, layout);
            drawNodePoint(ctx, pt.x, pt.y, isSel ? '#38bdf8' : '#06b6d4', isSel ? 7 : 5);
        });

        if (extrusionMode === 'calado') {
            innerHoles.forEach((hole, hIdx) => {
                hole.forEach((p, pIdx) => {
                    const isSel = (selectedNode && selectedNode.type === 'hole' && selectedNode.holeIdx === hIdx && selectedNode.pointIdx === pIdx);
                    const pt = normToCanvas(p.u, p.v, layout);
                    drawNodePoint(ctx, pt.x, pt.y, isSel ? '#fde047' : '#f59e0b', isSel ? 6 : 4.5);
                });
            });
        }

        // Tiradores Bézier
        if (selectedNode) {
            let pNode = (selectedNode.type === 'outer')
                ? currentPoints[selectedNode.pointIdx]
                : innerHoles[selectedNode.holeIdx]?.[selectedNode.pointIdx];

            if (pNode && curveLevel > 0) {
                const pt = normToCanvas(pNode.u, pNode.v, layout);
                const h1 = normToCanvas(pNode.h1u, pNode.h1v, layout);
                const h2 = normToCanvas(pNode.h2u, pNode.h2v, layout);

                // Tirador 1 (Rosa / Cúspide)
                ctx.beginPath(); ctx.moveTo(pt.x, pt.y); ctx.lineTo(h1.x, h1.y);
                ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 1.5; ctx.stroke();
                ctx.beginPath(); ctx.arc(h1.x, h1.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = '#f43f5e'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();

                // Tirador 2 (Verde Esmeralda)
                ctx.beginPath(); ctx.moveTo(pt.x, pt.y); ctx.lineTo(h2.x, h2.y);
                ctx.strokeStyle = '#10b981'; ctx.lineWidth = 1.5; ctx.stroke();
                ctx.beginPath(); ctx.arc(h2.x, h2.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = '#10b981'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
            }
        }
    }
}

function drawNodePoint(ctx, x, y, color, radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
}

function drawBezierPath(ctx, pts, layout) {
    if (pts.length < 3) return;
    const p0 = normToCanvas(pts[0].u, pts[0].v, layout);

    if (curveLevel === 0) {
        ctx.moveTo(p0.x, p0.y);
        for (let i = 1; i < pts.length; i++) {
            const p = normToCanvas(pts[i].u, pts[i].v, layout);
            ctx.lineTo(p.x, p.y);
        }
        return;
    }

    ctx.moveTo(p0.x, p0.y);
    const n = pts.length;
    for (let i = 0; i < n; i++) {
        const cur = pts[i];
        const next = pts[(i + 1) % n];
        const h2 = normToCanvas(cur.h2u, cur.h2v, layout);
        const h1Next = normToCanvas(next.h1u, next.h1v, layout);
        const nextPt = normToCanvas(next.u, next.v, layout);
        ctx.bezierCurveTo(h2.x, h2.y, h1Next.x, h1Next.y, nextPt.x, nextPt.y);
    }
}

// RATÓN: HIT-TESTING, AGREGAR, BORRAR, PAN Y ARRASTRE DE TIRADORES
function getCanvasPos(e) {
    const rect = processCanvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

processCanvas.addEventListener('mousedown', (e) => {
    const pos = getCanvasPos(e);
    const layout = getImageLayout();

    // Si hace clic derecho o rueda o pulsa espacio: Iniciar PAN
    if (e.button === 1 || e.button === 2 || e.spaceKey) {
        isPanning = true;
        panStartX = pos.x - panX;
        panStartY = pos.y - panY;
        return;
    }

    if (!isEditNodesMode) return;
    const hitRadius = 14;

    // 1. Clic en tirador Bézier (h1 o h2)
    if (selectedNode && curveLevel > 0) {
        let pNode = (selectedNode.type === 'outer')
            ? currentPoints[selectedNode.pointIdx]
            : innerHoles[selectedNode.holeIdx]?.[selectedNode.pointIdx];

        if (pNode) {
            const h1 = normToCanvas(pNode.h1u, pNode.h1v, layout);
            const h2 = normToCanvas(pNode.h2u, pNode.h2v, layout);

            if (Math.hypot(h1.x - pos.x, h1.y - pos.y) < hitRadius) {
                draggedElement = { type: 'h1', node: pNode, altKey: e.altKey || e.shiftKey };
                return;
            }
            if (Math.hypot(h2.x - pos.x, h2.y - pos.y) < hitRadius) {
                draggedElement = { type: 'h2', node: pNode, altKey: e.altKey || e.shiftKey };
                return;
            }
        }
    }

    // 2. Clic en nodo exterior (Azul)
    for (let i = 0; i < currentPoints.length; i++) {
        const pt = normToCanvas(currentPoints[i].u, currentPoints[i].v, layout);
        if (Math.hypot(pt.x - pos.x, pt.y - pos.y) < hitRadius) {
            selectedNode = { type: 'outer', pointIdx: i };
            draggedElement = { type: 'point', node: currentPoints[i] };
            drawVectorCanvas();
            return;
        }
    }

    // 3. Clic en nodo de hueco (Naranja)
    for (let h = 0; h < innerHoles.length; h++) {
        for (let p = 0; p < innerHoles[h].length; p++) {
            const pt = normToCanvas(innerHoles[h][p].u, innerHoles[h][p].v, layout);
            if (Math.hypot(pt.x - pos.x, pt.y - pos.y) < hitRadius) {
                selectedNode = { type: 'hole', holeIdx: h, pointIdx: p };
                draggedElement = { type: 'point', node: innerHoles[h][p] };
                drawVectorCanvas();
                return;
            }
        }
    }

    // 4. AGREGAR NODO en borde exterior (Azul)
    for (let i = 0; i < currentPoints.length; i++) {
        const p1 = normToCanvas(currentPoints[i].u, currentPoints[i].v, layout);
        const p2 = normToCanvas(currentPoints[(i + 1) % currentPoints.length].u, currentPoints[(i + 1) % currentPoints.length].v, layout);
        if (distToSegment(pos, p1, p2) < 10) {
            const norm = canvasToNorm(pos.x, pos.y, layout);
            const newNode = { u: norm.u, v: norm.v, h1u: norm.u, h1v: norm.v, h2u: norm.u, h2v: norm.v, isCorner: false };
            currentPoints.splice(i + 1, 0, newNode);
            updateAllBezierHandles();
            selectedNode = { type: 'outer', pointIdx: i + 1 };
            draggedElement = { type: 'point', node: newNode };
            drawVectorCanvas();
            extrude3D();
            return;
        }
    }

    // 5. AGREGAR NODO en borde de hueco interior (Naranja)
    for (let h = 0; h < innerHoles.length; h++) {
        for (let p = 0; p < innerHoles[h].length; p++) {
            const p1 = normToCanvas(innerHoles[h][p].u, innerHoles[h][p].v, layout);
            const p2 = normToCanvas(innerHoles[h][(p + 1) % innerHoles[h].length].u, innerHoles[h][(p + 1) % innerHoles[h].length].v, layout);
            if (distToSegment(pos, p1, p2) < 10) {
                const norm = canvasToNorm(pos.x, pos.y, layout);
                const newNode = { u: norm.u, v: norm.v, h1u: norm.u, h1v: norm.v, h2u: norm.u, h2v: norm.v, isCorner: false };
                innerHoles[h].splice(p + 1, 0, newNode);
                updateAllBezierHandles();
                selectedNode = { type: 'hole', holeIdx: h, pointIdx: p + 1 };
                draggedElement = { type: 'point', node: newNode };
                drawVectorCanvas();
                extrude3D();
                return;
            }
        }
    }

    // Clic en vacío: Iniciar PAN
    isPanning = true;
    panStartX = pos.x - panX;
    panStartY = pos.y - panY;
    selectedNode = null;
    drawVectorCanvas();
});

processCanvas.addEventListener('mousemove', (e) => {
    const pos = getCanvasPos(e);
    const layout = getImageLayout();

    if (isPanning) {
        panX = pos.x - panStartX;
        panY = pos.y - panStartY;
        drawVectorCanvas();
        return;
    }

    if (!draggedElement) return;

    const norm = canvasToNorm(pos.x, pos.y, layout);

    if (draggedElement.type === 'point') {
        const du = norm.u - draggedElement.node.u;
        const dv = norm.v - draggedElement.node.v;
        draggedElement.node.u = norm.u;
        draggedElement.node.v = norm.v;
        draggedElement.node.h1u += du;
        draggedElement.node.h1v += dv;
        draggedElement.node.h2u += du;
        draggedElement.node.h2v += dv;
    } else if (draggedElement.type === 'h1') {
        draggedElement.node.h1u = norm.u;
        draggedElement.node.h1v = norm.v;

        // Si se mantiene Alt o Shift: Tirador independiente
        if (e.altKey || e.shiftKey || draggedElement.altKey) {
            draggedElement.node.isCorner = true;
        } else if (!draggedElement.node.isCorner) {
            // Tirador simétrico suave
            const du = norm.u - draggedElement.node.u;
            const dv = norm.v - draggedElement.node.v;
            draggedElement.node.h2u = draggedElement.node.u - du;
            draggedElement.node.h2v = draggedElement.node.v - dv;
        }
    } else if (draggedElement.type === 'h2') {
        draggedElement.node.h2u = norm.u;
        draggedElement.node.h2v = norm.v;

        if (e.altKey || e.shiftKey || draggedElement.altKey) {
            draggedElement.node.isCorner = true;
        } else if (!draggedElement.node.isCorner) {
            const du = norm.u - draggedElement.node.u;
            const dv = norm.v - draggedElement.node.v;
            draggedElement.node.h1u = draggedElement.node.u - du;
            draggedElement.node.h1v = draggedElement.node.v - dv;
        }
    }

    drawVectorCanvas();
    extrude3D();
});

window.addEventListener('mouseup', () => {
    isPanning = false;
    draggedElement = null;
});

// DOBLE CLIC: ELIMINAR NODO (Funciona en contornos Azules y Huecos Naranjas)
processCanvas.addEventListener('dblclick', (e) => {
    if (!isEditNodesMode) return;
    const pos = getCanvasPos(e);
    const layout = getImageLayout();
    const hitRadius = 14;

    // 1. Eliminar de borde exterior
    for (let i = 0; i < currentPoints.length; i++) {
        const pt = normToCanvas(currentPoints[i].u, currentPoints[i].v, layout);
        if (Math.hypot(pt.x - pos.x, pt.y - pos.y) < hitRadius) {
            if (currentPoints.length > 4) {
                currentPoints.splice(i, 1);
                selectedNode = null;
                updateAllBezierHandles();
                drawVectorCanvas();
                extrude3D();
            }
            return;
        }
    }

    // 2. Eliminar de huecos interiores (Naranjas)
    for (let h = 0; h < innerHoles.length; h++) {
        for (let p = 0; p < innerHoles[h].length; p++) {
            const pt = normToCanvas(innerHoles[h][p].u, innerHoles[h][p].v, layout);
            if (Math.hypot(pt.x - pos.x, pt.y - pos.y) < hitRadius) {
                if (innerHoles[h].length > 3) {
                    innerHoles[h].splice(p, 1);
                } else {
                    innerHoles.splice(h, 1);
                }
                selectedNode = null;
                updateAllBezierHandles();
                drawVectorCanvas();
                extrude3D();
                return;
            }
        }
    }
});

function distToSegment(p, v, w) {
    const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

// EXTRUSIÓN 3D UNIFORME (No se achata al mover nodos)
function extrude3D() {
    if (!currentPoints || currentPoints.length < 3) return;

    try {
        if (threePlaceholder) threePlaceholder.classList.add('hidden');
        if (currentMesh) {
            scene.remove(currentMesh);
            if (currentMesh.geometry) currentMesh.geometry.dispose();
            currentMesh = null;
        }

        // Centroide de referencia inicial
        let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
        for (const p of currentPoints) {
            minU = Math.min(minU, p.u); maxU = Math.max(maxU, p.u);
            minV = Math.min(minV, p.v); maxV = Math.max(maxV, p.v);
        }
        const centerU = (minU + maxU) / 2;
        const centerV = (minV + maxV) / 2;

        // Escalar de normalizado a mm físicos uniformemente
        const imgAspect = originalImg ? (originalImg.width / originalImg.height) : 1;
        const mmScale = initialModelScale || (targetDimX / baseSpanU);

        const to3D = (u, v) => ({
            x: (u - centerU) * mmScale,
            y: -(v - centerV) * mmScale * (1 / imgAspect)
        });

        let outer3D = currentPoints.map(p => to3D(p.u, p.v));
        if (getSignedAreaNorm(currentPoints) > 0) outer3D.reverse();

        let finalOuter = outer3D;
        if (curveLevel > 0) {
            const vec3List = outer3D.map(p => new THREE.Vector3(p.x, p.y, 0));
            const curve = new THREE.CatmullRomCurve3(vec3List, true, 'catmullrom', 0.25);
            finalOuter = curve.getPoints(outer3D.length * (curveLevel + 1));
        }

        const shape = new THREE.Shape();
        shape.moveTo(finalOuter[0].x, finalOuter[0].y);
        for (let i = 1; i < finalOuter.length; i++) shape.lineTo(finalOuter[i].x, finalOuter[i].y);
        shape.closePath();

        if (extrusionMode === 'calado' && innerHoles.length > 0) {
            innerHoles.forEach((hole) => {
                if (hole.length < 3) return;
                let hole3D = hole.map(p => to3D(p.u, p.v));
                if (getSignedAreaNorm(hole) < 0) hole3D.reverse();

                let finalHole = hole3D;
                if (curveLevel > 0) {
                    const hVec3 = hole3D.map(p => new THREE.Vector3(p.x, p.y, 0));
                    const hCurve = new THREE.CatmullRomCurve3(hVec3, true, 'catmullrom', 0.25);
                    finalHole = hCurve.getPoints(hole3D.length * 2);
                }

                const holePath = new THREE.Path();
                holePath.moveTo(finalHole[0].x, finalHole[0].y);
                for (let i = 1; i < finalHole.length; i++) holePath.lineTo(finalHole[i].x, finalHole[i].y);
                holePath.closePath();
                shape.holes.push(holePath);
            });
        }

        if (checkHole && checkHole.checked) {
            const ojal = new THREE.Path();
            ojal.absarc(0, 20, 2.5, 0, Math.PI * 2, true);
            shape.holes.push(ojal);
        }

        const depth = parseFloat(dimZInput?.value) || targetDimZ || 10;
        const extrudeSettings = {
            steps: 1,
            depth: depth,
            bevelEnabled: true,
            bevelThickness: 0.5,
            bevelSize: 0.35,
            bevelSegments: 2
        };

        let geometry;
        try {
            geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        } catch (e) {
            shape.holes = [];
            geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        }

        geometry.computeBoundingBox();
        const bbox = geometry.boundingBox;
        const modelW = Math.round(bbox.max.x - bbox.min.x);
        const modelH = Math.round(bbox.max.y - bbox.min.y);

        const material = new THREE.MeshStandardMaterial({
            color: 0x06b6d4,
            roughness: 0.35,
            metalness: 0.2
        });

        currentMesh = new THREE.Mesh(geometry, material);
        currentMesh.position.z = depth / 2;
        scene.add(currentMesh);

        const estVolCm3 = (modelW * modelH * depth * 0.52) / 1000;
        const weightGrams = Math.max(2, Math.round(estVolCm3 * 1.24 * 0.7));
        const estFabCoins = Math.max(3, Math.round(weightGrams * 0.28));

        if (dimInfo) dimInfo.innerText = modelW + 'x' + modelH + 'x' + depth + 'mm';
        if (volInfo) volInfo.innerText = '~' + weightGrams + 'g PLA';
        if (costInfo) costInfo.innerText = estFabCoins + ' FC';
    } catch (err) {
        console.error('Error en extrude3D:', err);
    }
}

// EXPORTACION STL CON STLEXPORTER
function getValidStlString() {
    if (!currentMesh) return '';
    try {
        if (THREE.STLExporter) {
            const exporter = new THREE.STLExporter();
            return exporter.parse(currentMesh);
        }
    } catch (e) {
        console.warn('STLExporter error:', e);
    }
    return '';
}

// ENVIO A BITACORA LMS
btnSendToLms.addEventListener('click', () => {
    if (!currentMesh || currentPoints.length < 3) {
        alert('Por favor vectoriza un boceto antes de enviar a la bitacora.');
        return;
    }

    const stlString = getValidStlString();

    let renderSnapshot = '';
    try {
        renderer.render(scene, camera);
        renderSnapshot = renderer.domElement.toDataURL('image/png');
    } catch (e) {
        console.warn('No se pudo capturar render 3D:', e);
    }

    const payload = {
        type: 'MAKERDU_MICROAPP_ASSET',
        appName: 'vectorizer',
        fileType: 'stl',
        fileName: 'art_toy_2.5d.stl',
        stlContent: stlString,
        image_snapshot: renderSnapshot,
        depth_mm: targetDimZ,
        dim_x: targetDimX,
        dim_y: targetDimY,
        has_hook_hole: (checkHole && checkHole.checked),
    };

    if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, '*');
    } else {
        const blob = new Blob([stlString], { type: 'model/stl' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'art_toy_2.5d.stl';
        a.click();
    }
});

btnDownloadStl.addEventListener('click', () => {
    if (!currentMesh) { alert('Genera un modelo 3D primero.'); return; }
    const stlString = getValidStlString();
    const blob = new Blob([stlString], { type: 'model/stl' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'art_toy_2.5d.stl';
    a.click();
});
