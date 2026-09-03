// Makerdu Vectorizer & 3D Extruder Engine v5.0 (Bézier Handles & STLExporter)

let extrusionMode = 'calado';
let showVectorOverlay = true;
let isEditNodesMode = false;
let curveLevel = 2;
let currentViewMode = 'split';
let currentMesh = null;
let videoStream = null;
let originalImg = null;
let baseAspectRatio = 1.0;

// Geometria 2D con Tiradores Bezier (Estilo Inkscape)
// Cada nodo: { canvasX, canvasY, h1x, h1y, h2x, h2y, x, y }
let currentPoints = [];
let innerHoles = [];

// Interaccion de Nodos y Tiradores
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
    }, 50);
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

// SYNC CANVAS RESOLUTION
function syncCanvasResolution() {
    if (!canvasWrapper || !processCanvas) return;
    const rect = canvasWrapper.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);

    if (w > 50 && h > 50 && (processCanvas.width !== w || processCanvas.height !== h)) {
        const oldW = processCanvas.width || w;
        const oldH = processCanvas.height || h;
        processCanvas.width = w;
        processCanvas.height = h;

        if (oldW && oldH && oldW !== w && currentPoints.length > 0) {
            const rx = w / oldW;
            const ry = h / oldH;
            const updateNode = (p) => {
                p.canvasX *= rx; p.canvasY *= ry;
                if (p.h1x) { p.h1x *= rx; p.h1y *= ry; }
                if (p.h2x) { p.h2x *= rx; p.h2y *= ry; }
            };
            currentPoints.forEach(updateNode);
            innerHoles.forEach(hArr => hArr.forEach(updateNode));
            recompute3DCoordinates();
        }
    }
}
window.addEventListener('resize', syncCanvasResolution);

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
    if (baseAspectRatio > 0) {
        targetDimY = Math.round(targetDimX / baseAspectRatio);
        dimYInput.value = targetDimY;
    }
    extrude3D();
});

dimYInput.addEventListener('input', () => {
    targetDimY = Math.max(10, Math.min(180, parseFloat(dimYInput.value) || 50));
    if (baseAspectRatio > 0) {
        targetDimX = Math.round(targetDimY * baseAspectRatio);
        dimXInput.value = targetDimX;
    }
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
        syncCanvasResolution();
        if (cameraPrompt) cameraPrompt.classList.add('hidden');
        processCanvas.classList.remove('hidden');
        applyThresholdAndVectorize();
    };
    img.src = initialImageUrl;
}

// CALCULO DE TIRADORES BEZIER (ESTILO INKSCAPE)
function updateAllBezierHandles() {
    updateLoopHandles(currentPoints);
    innerHoles.forEach(updateLoopHandles);
}

function updateLoopHandles(pts) {
    const n = pts.length;
    if (n < 3) return;
    const tension = [0, 0.15, 0.3, 0.45, 0.6][curveLevel] || 0.3;

    for (let i = 0; i < n; i++) {
        const prev = pts[(i - 1 + n) % n];
        const cur = pts[i];
        const next = pts[(i + 1) % n];

        const tanX = (next.canvasX - prev.canvasX) * tension;
        const tanY = (next.canvasY - prev.canvasY) * tension;

        cur.h1x = cur.canvasX - tanX;
        cur.h1y = cur.canvasY - tanY;
        cur.h2x = cur.canvasX + tanX;
        cur.h2y = cur.canvasY + tanY;
    }
}

// COORDENADAS 3D
function recompute3DCoordinates() {
    if (currentPoints.length < 3) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of currentPoints) {
        minX = Math.min(minX, p.canvasX);
        maxX = Math.max(maxX, p.canvasX);
        minY = Math.min(minY, p.canvasY);
        maxY = Math.max(maxY, p.canvasY);
    }

    const spanX = Math.max(1, maxX - minX);
    const spanY = Math.max(1, maxY - minY);
    baseAspectRatio = spanX / spanY;

    const midCanvasX = (minX + maxX) / 2;
    const midCanvasY = (minY + maxY) / 2;
    const scaleFactor = 50 / Math.max(spanX, spanY);

    for (const p of currentPoints) {
        p.x = (p.canvasX - midCanvasX) * scaleFactor;
        p.y = -(p.canvasY - midCanvasY) * scaleFactor;
    }
    for (const hole of innerHoles) {
        for (const p of hole) {
            p.x = (p.canvasX - midCanvasX) * scaleFactor;
            p.y = -(p.canvasY - midCanvasY) * scaleFactor;
        }
    }
}

// VECTORIZACION
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

    const fitScale = Math.min((processCanvas.width * 0.85) / w, (processCanvas.height * 0.85) / h);
    const offsetX = (processCanvas.width - (w * fitScale)) / 2;
    const offsetY = (processCanvas.height - (h * fitScale)) / 2;

    currentPoints = simplifiedOuter.map(p => ({
        canvasX: p.x * fitScale + offsetX,
        canvasY: p.y * fitScale + offsetY,
        h1x: 0, h1y: 0, h2x: 0, h2y: 0,
        x: 0, y: 0
    }));

    innerHoles = simplifiedHoles.map(hole => hole.map(p => ({
        canvasX: p.x * fitScale + offsetX,
        canvasY: p.y * fitScale + offsetY,
        h1x: 0, h1y: 0, h2x: 0, h2y: 0,
        x: 0, y: 0
    })));

    updateAllBezierHandles();
    recompute3DCoordinates();

    if (!dimXInput.dataset.modified) {
        if (baseAspectRatio >= 1) {
            targetDimX = 50;
            targetDimY = Math.round(50 / baseAspectRatio);
        } else {
            targetDimY = 50;
            targetDimX = Math.round(50 * baseAspectRatio);
        }
        dimXInput.value = targetDimX;
        dimYInput.value = targetDimY;
        dimXInput.dataset.modified = "true";
    }

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

function getSignedArea(pts) {
    let area = 0;
    for (let i = 0; i < pts.length; i++) {
        const j = (i + 1) % pts.length;
        area += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
    }
    return area / 2;
}

// DIBUJO DE CANVAS 2D CON TIRADORES BEZIER ESTILO INKSCAPE
function drawVectorCanvas() {
    const ctx = processCanvas.getContext('2d');
    if (!ctx || !processCanvas.width) return;

    ctx.clearRect(0, 0, processCanvas.width, processCanvas.height);

    if (originalImg) {
        ctx.save();
        ctx.globalAlpha = isEditNodesMode ? 0.35 : 0.85;
        const fitScale = Math.min(processCanvas.width / originalImg.width, processCanvas.height / originalImg.height);
        const ox = (processCanvas.width - (originalImg.width * fitScale)) / 2;
        const oy = (processCanvas.height - (originalImg.height * fitScale)) / 2;
        ctx.drawImage(originalImg, ox, oy, originalImg.width * fitScale, originalImg.height * fitScale);
        ctx.restore();
    }

    if (!showVectorOverlay || currentPoints.length < 3) return;

    // Contorno Exterior
    ctx.beginPath();
    drawBezierPath(ctx, currentPoints);
    ctx.closePath();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.20)';
    ctx.fill();

    // Huecos
    if (extrusionMode === 'calado') {
        innerHoles.forEach((hole) => {
            if (hole.length < 3) return;
            ctx.beginPath();
            drawBezierPath(ctx, hole);
            ctx.closePath();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.fillStyle = 'rgba(245, 158, 11, 0.30)';
            ctx.fill();
        });
    }

    // MODO EDICION: NODOS Y TIRADORES DE DIRECCION
    if (isEditNodesMode) {
        currentPoints.forEach((p, idx) => {
            const isSel = (selectedNode && selectedNode.type === 'outer' && selectedNode.pointIdx === idx);
            drawNodePoint(ctx, p.canvasX, p.canvasY, isSel ? '#38bdf8' : '#06b6d4', isSel ? 7 : 5);
        });

        if (extrusionMode === 'calado') {
            innerHoles.forEach((hole, hIdx) => {
                hole.forEach((p, pIdx) => {
                    const isSel = (selectedNode && selectedNode.type === 'hole' && selectedNode.holeIdx === hIdx && selectedNode.pointIdx === pIdx);
                    drawNodePoint(ctx, p.canvasX, p.canvasY, isSel ? '#fde047' : '#f59e0b', isSel ? 6 : 4.5);
                });
            });
        }

        // Tiradores Bezier del nodo seleccionado
        if (selectedNode) {
            let pNode = null;
            if (selectedNode.type === 'outer' && currentPoints[selectedNode.pointIdx]) {
                pNode = currentPoints[selectedNode.pointIdx];
            } else if (selectedNode.type === 'hole' && innerHoles[selectedNode.holeIdx]?.[selectedNode.pointIdx]) {
                pNode = innerHoles[selectedNode.holeIdx][selectedNode.pointIdx];
            }

            if (pNode && curveLevel > 0) {
                // Tirador 1 (Rosa)
                ctx.beginPath();
                ctx.moveTo(pNode.canvasX, pNode.canvasY);
                ctx.lineTo(pNode.h1x, pNode.h1y);
                ctx.strokeStyle = '#f43f5e';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(pNode.h1x, pNode.h1y, 5, 0, Math.PI * 2);
                ctx.fillStyle = '#f43f5e';
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Tirador 2 (Verde Esmeralda)
                ctx.beginPath();
                ctx.moveTo(pNode.canvasX, pNode.canvasY);
                ctx.lineTo(pNode.h2x, pNode.h2y);
                ctx.strokeStyle = '#10b981';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(pNode.h2x, pNode.h2y, 5, 0, Math.PI * 2);
                ctx.fillStyle = '#10b981';
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.stroke();
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

function drawBezierPath(ctx, pts) {
    if (pts.length < 3) return;
    if (curveLevel === 0) {
        ctx.moveTo(pts[0].canvasX, pts[0].canvasY);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].canvasX, pts[i].canvasY);
        return;
    }

    ctx.moveTo(pts[0].canvasX, pts[0].canvasY);
    const n = pts.length;
    for (let i = 0; i < n; i++) {
        const cur = pts[i];
        const next = pts[(i + 1) % n];
        ctx.bezierCurveTo(cur.h2x, cur.h2y, next.h1x, next.h1y, next.canvasX, next.canvasY);
    }
}

// INTERACCION RATON (1:1 PIXEL MATCHING)
function getCanvasCoords(e) {
    const rect = processCanvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

processCanvas.addEventListener('mousedown', (e) => {
    if (!isEditNodesMode) return;
    const { x, y } = getCanvasCoords(e);
    const hitRadius = 14;

    // 1. Verificar clic en tiradores del nodo seleccionado
    if (selectedNode && curveLevel > 0) {
        let pNode = (selectedNode.type === 'outer') 
            ? currentPoints[selectedNode.pointIdx] 
            : innerHoles[selectedNode.holeIdx]?.[selectedNode.pointIdx];

        if (pNode) {
            if (Math.hypot(pNode.h1x - x, pNode.h1y - y) < hitRadius) {
                draggedElement = { type: 'h1', node: pNode };
                return;
            }
            if (Math.hypot(pNode.h2x - x, pNode.h2y - y) < hitRadius) {
                draggedElement = { type: 'h2', node: pNode };
                return;
            }
        }
    }

    // 2. Clic en nodo exterior
    for (let i = 0; i < currentPoints.length; i++) {
        if (Math.hypot(currentPoints[i].canvasX - x, currentPoints[i].canvasY - y) < hitRadius) {
            selectedNode = { type: 'outer', pointIdx: i };
            draggedElement = { type: 'point', node: currentPoints[i] };
            drawVectorCanvas();
            return;
        }
    }

    // 3. Clic en nodo de hueco
    for (let h = 0; h < innerHoles.length; h++) {
        for (let p = 0; p < innerHoles[h].length; p++) {
            if (Math.hypot(innerHoles[h][p].canvasX - x, innerHoles[h][p].canvasY - y) < hitRadius) {
                selectedNode = { type: 'hole', holeIdx: h, pointIdx: p };
                draggedElement = { type: 'point', node: innerHoles[h][p] };
                drawVectorCanvas();
                return;
            }
        }
    }

    // 4. Clic en arista para añadir nuevo nodo
    for (let i = 0; i < currentPoints.length; i++) {
        const p1 = currentPoints[i];
        const p2 = currentPoints[(i + 1) % currentPoints.length];
        if (distToSegment({ x, y }, { x: p1.canvasX, y: p1.canvasY }, { x: p2.canvasX, y: p2.canvasY }) < 12) {
            const newNode = { canvasX: x, canvasY: y, h1x: x, h1y: y, h2x: x, h2y: y, x: 0, y: 0 };
            currentPoints.splice(i + 1, 0, newNode);
            updateAllBezierHandles();
            recompute3DCoordinates();
            selectedNode = { type: 'outer', pointIdx: i + 1 };
            draggedElement = { type: 'point', node: newNode };
            drawVectorCanvas();
            extrude3D();
            return;
        }
    }
});

processCanvas.addEventListener('mousemove', (e) => {
    if (!isEditNodesMode) return;
    const { x, y } = getCanvasCoords(e);

    if (draggedElement) {
        if (draggedElement.type === 'point') {
            const dx = x - draggedElement.node.canvasX;
            const dy = y - draggedElement.node.canvasY;
            draggedElement.node.canvasX = x;
            draggedElement.node.canvasY = y;
            draggedElement.node.h1x += dx;
            draggedElement.node.h1y += dy;
            draggedElement.node.h2x += dx;
            draggedElement.node.h2y += dy;
        } else if (draggedElement.type === 'h1') {
            draggedElement.node.h1x = x;
            draggedElement.node.h1y = y;
            const dx = x - draggedElement.node.canvasX;
            const dy = y - draggedElement.node.canvasY;
            draggedElement.node.h2x = draggedElement.node.canvasX - dx;
            draggedElement.node.h2y = draggedElement.node.canvasY - dy;
        } else if (draggedElement.type === 'h2') {
            draggedElement.node.h2x = x;
            draggedElement.node.h2y = y;
            const dx = x - draggedElement.node.canvasX;
            const dy = y - draggedElement.node.canvasY;
            draggedElement.node.h1x = draggedElement.node.canvasX - dx;
            draggedElement.node.h1y = draggedElement.node.canvasY - dy;
        }

        recompute3DCoordinates();
        drawVectorCanvas();
        extrude3D();
    }
});

window.addEventListener('mouseup', () => {
    draggedElement = null;
});

processCanvas.addEventListener('dblclick', (e) => {
    if (!isEditNodesMode) return;
    const { x, y } = getCanvasCoords(e);
    const hitRadius = 14;

    for (let i = 0; i < currentPoints.length; i++) {
        if (Math.hypot(currentPoints[i].canvasX - x, currentPoints[i].canvasY - y) < hitRadius) {
            if (currentPoints.length > 4) {
                currentPoints.splice(i, 1);
                selectedNode = null;
                updateAllBezierHandles();
                recompute3DCoordinates();
                drawVectorCanvas();
                extrude3D();
            }
            return;
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

// EXTRUSION 3D
function extrude3D() {
    if (!currentPoints || currentPoints.length < 3) return;

    try {
        if (threePlaceholder) threePlaceholder.classList.add('hidden');
        if (currentMesh) {
            scene.remove(currentMesh);
            if (currentMesh.geometry) currentMesh.geometry.dispose();
            currentMesh = null;
        }

        let outerPts = [...currentPoints];
        if (getSignedArea(outerPts) < 0) outerPts.reverse();

        let final3DPts = outerPts;
        if (curveLevel > 0) {
            const vec3List = outerPts.map(p => new THREE.Vector3(p.x, p.y, 0));
            const curve = new THREE.CatmullRomCurve3(vec3List, true, 'catmullrom', 0.25);
            final3DPts = curve.getPoints(outerPts.length * (curveLevel + 1));
        }

        const shape = new THREE.Shape();
        shape.moveTo(final3DPts[0].x, final3DPts[0].y);
        for (let i = 1; i < final3DPts.length; i++) shape.lineTo(final3DPts[i].x, final3DPts[i].y);
        shape.closePath();

        if (extrusionMode === 'calado' && innerHoles.length > 0) {
            innerHoles.forEach((holePts) => {
                if (holePts.length < 3) return;
                let hCopy = [...holePts];
                if (getSignedArea(hCopy) > 0) hCopy.reverse();

                let finalHolePts = hCopy;
                if (curveLevel > 0) {
                    const hVec3 = hCopy.map(p => new THREE.Vector3(p.x, p.y, 0));
                    const hCurve = new THREE.CatmullRomCurve3(hVec3, true, 'catmullrom', 0.25);
                    finalHolePts = hCurve.getPoints(hCopy.length * 2);
                }

                const holePath = new THREE.Path();
                holePath.moveTo(finalHolePts[0].x, finalHolePts[0].y);
                for (let i = 1; i < finalHolePts.length; i++) holePath.lineTo(finalHolePts[i].x, finalHolePts[i].y);
                holePath.closePath();
                shape.holes.push(holePath);
            });
        }

        if (checkHole && checkHole.checked) {
            const ojal = new THREE.Path();
            ojal.absarc(0, 20, 2.5, 0, Math.PI * 2, true);
            shape.holes.push(ojal);
        }

        const depth = parseFloat(dimZInput?.value) || 10;
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
        } catch (extrudeErr) {
            shape.holes = [];
            geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        }

        geometry.center();
        geometry.computeBoundingBox();
        const bbox = geometry.boundingBox;
        const currentW = Math.max(0.1, bbox.max.x - bbox.min.x);
        const currentH = Math.max(0.1, bbox.max.y - bbox.min.y);

        const safeDimX = Math.max(10, parseFloat(dimXInput?.value) || targetDimX || 50);
        const safeDimY = Math.max(10, parseFloat(dimYInput?.value) || targetDimY || 50);
        geometry.scale(safeDimX / currentW, safeDimY / currentH, 1);

        const material = new THREE.MeshStandardMaterial({
            color: 0x06b6d4,
            roughness: 0.35,
            metalness: 0.2
        });

        currentMesh = new THREE.Mesh(geometry, material);
        currentMesh.position.z = depth / 2;
        scene.add(currentMesh);

        const estVolCm3 = (safeDimX * safeDimY * depth * 0.52) / 1000;
        const weightGrams = Math.max(2, Math.round(estVolCm3 * 1.24 * 0.7));
        const estFabCoins = Math.max(3, Math.round(weightGrams * 0.28));

        if (dimInfo) dimInfo.innerText = safeDimX + 'x' + safeDimY + 'x' + depth + 'mm';
        if (volInfo) volInfo.innerText = '~' + weightGrams + 'g PLA';
        if (costInfo) costInfo.innerText = estFabCoins + ' FC';
    } catch (err) {
        console.error('Error en extrude3D:', err);
    }
}

// EXPORTACION STL CON THREE.STLExporter (CONSERVA 100% DE HUECOS Y FACES)
function getValidStlString() {
    if (!currentMesh) return '';
    try {
        if (THREE.STLExporter) {
            const exporter = new THREE.STLExporter();
            return exporter.parse(currentMesh);
        }
    } catch (e) {
        console.warn('STLExporter fallback:', e);
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
