// Makerdu Vectorizer & 3D Extruder Engine v4.7 (Full Canvas & Robust Extrusion)

// -------------------------------------------------------------
// STATE & CONFIGURATION
// -------------------------------------------------------------
let extrusionMode = 'calado'; // 'calado' (con huecos) or 'solido'
let showVectorOverlay = true;
let isEditNodesMode = false;
let isAutoRotating = false; // Desactivado por defecto
let isRatioLocked = true;
let currentViewMode = 'split'; // 'split', '2d', '3d'
let currentSvgString = '';
let currentMesh = null;
let videoStream = null;
let originalImg = null;
let baseAspectRatio = 1.0;

// GeometrÃ­a Vectorial 2D
let currentPoints = []; // Contorno exterior [{canvasX, canvasY, x, y}]
let innerHoles = [];    // Array de huecos [[{canvasX, canvasY, x, y}], ...]

// InteracciÃ³n de Nodos
let draggedNode = null;
let hoveredNode = null;

// ParÃ¡metros de FabricaciÃ³n
let targetDimX = 50;
let targetDimY = 50;
let targetDimZ = 10;

// -------------------------------------------------------------
// DOM ELEMENTS
// -------------------------------------------------------------
const col2D = document.getElementById('col2D');
const col3D = document.getElementById('col3D');
const canvasWrapper = document.getElementById('canvasWrapper');
const threeWrapper = document.getElementById('threeWrapper');

// Vistas
const btnViewSplit = document.getElementById('btnViewSplit');
const btnView2D = document.getElementById('btnView2D');
const btnView3D = document.getElementById('btnView3D');

// Captura / Archivo
const videoFeed = document.getElementById('videoFeed');
const processCanvas = document.getElementById('processCanvas');
const cameraPrompt = document.getElementById('cameraPrompt');
const btnStartCamera = document.getElementById('btnStartCamera');
const btnSnap = document.getElementById('btnSnap');
const fileInput = document.getElementById('fileInput');

// Herramientas Vectoriales
const btnToggleOverlay = document.getElementById('btnToggleOverlay');
const btnEditNodes = document.getElementById('btnEditNodes');
const nodeEditHelp = document.getElementById('nodeEditHelp');
const btnModeHoles = document.getElementById('btnModeHoles');
const btnModeSolid = document.getElementById('btnModeSolid');

// Deslizadores
const smoothSlider = document.getElementById('smoothSlider');
const smoothVal = document.getElementById('smoothVal');
const thresholdSlider = document.getElementById('thresholdSlider');
const thresholdVal = document.getElementById('thresholdVal');
const heightSlider = document.getElementById('heightSlider');
const heightVal = document.getElementById('heightVal');
const checkHole = document.getElementById('checkHole');

// Dimensiones
const dimXInput = document.getElementById('dimXInput');
const dimYInput = document.getElementById('dimYInput');
const btnLockRatio = document.getElementById('btnLockRatio');

// Visor 3D
const btnToggleRotate = document.getElementById('btnToggleRotate');
const rotateIcon = document.getElementById('rotateIcon');
const rotateText = document.getElementById('rotateText');
const btnResetCamera = document.getElementById('btnResetCamera');
const threeContainer = document.getElementById('threeContainer');
const threePlaceholder = document.getElementById('threePlaceholder');
const dimInfo = document.getElementById('dimInfo');
const volInfo = document.getElementById('volInfo');
const costInfo = document.getElementById('costInfo');

// Botones de AcciÃ³n
const btnSendToLms = document.getElementById('btnSendToLms');
const btnDownloadSvg = document.getElementById('btnDownloadSvg');
const btnDownloadStl = document.getElementById('btnDownloadStl');

// -------------------------------------------------------------
// CONTROL DE VISTAS (PANTALLA COMPLETA 2D / 3D / DIVIDIDA)
// -------------------------------------------------------------
function setViewMode(mode) {
    currentViewMode = mode;

    if (btnViewSplit) btnViewSplit.className = 'px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 text-[11px] ' + (mode === 'split' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white');
    if (btnView2D) btnView2D.className = 'px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 text-[11px] ' + (mode === '2d' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white');
    if (btnView3D) btnView3D.className = 'px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 text-[11px] ' + (mode === '3d' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white');

    if (mode === '2d') {
        col2D.className = 'lg:col-span-12 flex flex-col gap-3 w-full';
        col3D.classList.add('hidden');
        if (canvasWrapper) canvasWrapper.className = 'relative w-full h-[620px] bg-slate-950 rounded-2xl border-2 border-slate-800 overflow-hidden flex items-center justify-center';
    } else if (mode === '3d') {
        col2D.classList.add('hidden');
        col3D.className = 'lg:col-span-12 flex flex-col gap-4 w-full';
        col3D.classList.remove('hidden');
        if (threeContainer) threeContainer.style.minHeight = '620px';
    } else {
        // Modo split normal (2D dominante)
        col2D.className = 'lg:col-span-7 flex flex-col gap-3';
        col2D.classList.remove('hidden');
        col3D.className = 'lg:col-span-5 flex flex-col gap-4';
        col3D.classList.remove('hidden');
        if (canvasWrapper) canvasWrapper.className = 'relative w-full h-[480px] sm:h-[540px] bg-slate-950 rounded-2xl border-2 border-slate-800 overflow-hidden flex items-center justify-center';
        if (threeContainer) threeContainer.style.minHeight = '360px';
    }

    setTimeout(() => {
        onResizeThree();
        drawVectorCanvas();
    }, 50);
}

if (btnViewSplit) btnViewSplit.addEventListener('click', () => setViewMode('split'));
if (btnView2D) btnView2D.addEventListener('click', () => setViewMode('2d'));
if (btnView3D) btnView3D.addEventListener('click', () => setViewMode('3d'));

// -------------------------------------------------------------
// THREE.JS SETUP
// -------------------------------------------------------------
let scene, camera, renderer, controls;
function initThree() {
    const width = threeContainer.clientWidth || 400;
    const height = threeContainer.clientHeight || 360;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(0, -60, 95);

    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    threeContainer.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight1.position.set(50, 50, 100);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf59e0b, 0.8);
    dirLight2.position.set(-50, -50, 60);
    scene.add(dirLight2);

    // Suelo de Rejilla Maker
    const grid = new THREE.GridHelper(100, 20, 0x1e293b, 0x0f172a);
    grid.rotation.x = Math.PI / 2;
    scene.add(grid);

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        if (currentMesh && isAutoRotating) {
            currentMesh.rotation.z += 0.004;
        }
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', onResizeThree);
}

function onResizeThree() {
    if (!renderer || !camera || !threeContainer) return;
    const w = threeContainer.clientWidth || 400;
    const h = threeContainer.clientHeight || 360;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}
initThree();

// -------------------------------------------------------------
// CONTROL DE GIRO 3D & CÃMARA
// -------------------------------------------------------------
btnToggleRotate.addEventListener('click', () => {
    isAutoRotating = !isAutoRotating;
    rotateIcon.innerText = isAutoRotating ? 'â¸ï¸' : 'â–¶ï¸';
    rotateText.innerText = isAutoRotating ? 'Pausar Giro' : 'Girar 3D';
});

btnResetCamera.addEventListener('click', () => {
    camera.position.set(0, -60, 95);
    controls.target.set(0, 0, 0);
    controls.update();
    if (currentMesh) {
        currentMesh.rotation.set(0, 0, 0);
    }
});

// -------------------------------------------------------------
// MODOS DE EXTRUSIÃ“N & CONTROLES
// -------------------------------------------------------------
btnModeHoles.addEventListener('click', () => {
    extrusionMode = 'calado';
    btnModeHoles.className = 'py-1 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 bg-cyan-500 text-slate-950 shadow-md';
    btnModeSolid.className = 'py-1 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 text-slate-400 bg-slate-900 hover:text-white border border-slate-800';
    extrude3D();
    drawVectorCanvas();
});

btnModeSolid.addEventListener('click', () => {
    extrusionMode = 'solido';
    btnModeSolid.className = 'py-1 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 bg-cyan-500 text-slate-950 shadow-md';
    btnModeHoles.className = 'py-1 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 text-slate-400 bg-slate-900 hover:text-white border border-slate-800';
    extrude3D();
    drawVectorCanvas();
});

btnToggleOverlay.addEventListener('click', () => {
    showVectorOverlay = !showVectorOverlay;
    btnToggleOverlay.className = showVectorOverlay
        ? 'px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold flex items-center gap-1 transition'
        : 'px-2.5 py-1 rounded-lg bg-slate-800 text-slate-500 border border-slate-700 text-[11px] font-bold flex items-center gap-1 transition';
    drawVectorCanvas();
});

btnEditNodes.addEventListener('click', () => {
    isEditNodesMode = !isEditNodesMode;
    btnEditNodes.className = isEditNodesMode
        ? 'px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-[11px] flex items-center gap-1 transition shadow-md'
        : 'px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:text-white text-[11px] font-bold flex items-center gap-1 transition';
    
    if (nodeEditHelp) {
        nodeEditHelp.classList.toggle('hidden', !isEditNodesMode);
    }
    drawVectorCanvas();
});

smoothSlider.addEventListener('input', () => {
    smoothVal.innerText = 'Nivel ' + smoothSlider.value;
    applyThresholdAndVectorize();
});

thresholdSlider.addEventListener('input', () => {
    thresholdVal.innerText = thresholdSlider.value;
    applyThresholdAndVectorize();
});

heightSlider.addEventListener('input', () => {
    targetDimZ = parseFloat(heightSlider.value) || 10;
    heightVal.innerText = targetDimZ + ' mm';
    extrude3D();
});

checkHole.addEventListener('change', () => {
    extrude3D();
});

btnLockRatio.addEventListener('click', () => {
    isRatioLocked = !isRatioLocked;
    btnLockRatio.innerHTML = isRatioLocked ? '<span>ðŸ”’ 1:1</span>' : '<span>ðŸ”“ Libre</span>';
    btnLockRatio.className = isRatioLocked
        ? 'px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-300 text-[10px] font-bold transition flex items-center gap-1'
        : 'px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-bold transition flex items-center gap-1';
});

dimXInput.addEventListener('input', () => {
    targetDimX = Math.max(10, Math.min(180, parseFloat(dimXInput.value) || 50));
    if (isRatioLocked && baseAspectRatio > 0) {
        targetDimY = Math.round(targetDimX / baseAspectRatio);
        dimYInput.value = targetDimY;
    }
    extrude3D();
});

dimYInput.addEventListener('input', () => {
    targetDimY = Math.max(10, Math.min(180, parseFloat(dimYInput.value) || 50));
    if (isRatioLocked && baseAspectRatio > 0) {
        targetDimX = Math.round(targetDimY * baseAspectRatio);
        dimXInput.value = targetDimX;
    }
    extrude3D();
});

// -------------------------------------------------------------
// CARGA DE IMÃGENES & CÃMARA
// -------------------------------------------------------------
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
        originalImg = img;
        processCanvas.width = img.width;
        processCanvas.height = img.height;
        if (cameraPrompt) cameraPrompt.classList.add('hidden');
        processCanvas.classList.remove('hidden');
        applyThresholdAndVectorize();
    };
    img.src = URL.createObjectURL(file);
});

btnStartCamera.addEventListener('click', async () => {
    try {
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
        }
        videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        videoFeed.srcObject = videoStream;
        videoFeed.classList.remove('hidden');
        processCanvas.classList.add('hidden');
        if (cameraPrompt) cameraPrompt.classList.add('hidden');
        btnSnap.classList.remove('hidden');
    } catch (err) {
        alert('No se pudo acceder a la cÃ¡mara. Por favor permite los permisos o sube una foto.');
    }
});

btnSnap.addEventListener('click', () => {
    processCanvas.width = videoFeed.videoWidth || 600;
    processCanvas.height = videoFeed.videoHeight || 600;
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

// Soporte de precarga automÃ¡tica desde Makerdu Studio (MisiÃ³n 1 -> MisiÃ³n 2)
const urlParams = new URLSearchParams(window.location.search);
const initialImageUrl = urlParams.get('image_url');
if (initialImageUrl) {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
        originalImg = img;
        processCanvas.width = img.width;
        processCanvas.height = img.height;
        if (cameraPrompt) cameraPrompt.classList.add('hidden');
        processCanvas.classList.remove('hidden');
        applyThresholdAndVectorize();
    };
    img.src = initialImageUrl;
}

// -------------------------------------------------------------
// RECOMPUTACIÃ“N BIDIRECCIONAL CONGRUENTE 2D <-> 3D
// -------------------------------------------------------------
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

// -------------------------------------------------------------
// ALGORITMO ROBUSTO DE VECTORIZACIÃ“N (DETECCIÃ“N DEL DIBUJO PRINCIPAL)
// -------------------------------------------------------------
function applyThresholdAndVectorize() {
    if (!originalImg) return;

    const workCanvas = document.createElement('canvas');
    const maxDim = 380;
    const scaleFactor = Math.min(1, maxDim / Math.max(originalImg.width, originalImg.height));
    const w = Math.round(originalImg.width * scaleFactor);
    const h = Math.round(originalImg.height * scaleFactor);

    workCanvas.width = w;
    workCanvas.height = h;
    const wCtx = workCanvas.getContext('2d');
    wCtx.drawImage(originalImg, 0, 0, w, h);

    const imgData = wCtx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const threshold = parseInt(thresholdSlider.value);

    // Matriz binaria: 1 = trazo oscuro, 0 = fondo claro
    const grid = new Uint8Array(w * h);
    for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        grid[i / 4] = brightness < threshold ? 1 : 0;
    }

    // 1. DetecciÃ³n de fondo exterior mediante Flood Fill desde los 4 bordes
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
        const cx = idx % w;
        const cy = Math.floor(idx / w);

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

    // 2. BUSCAR EL COMPONENTE NEGRO MÃS GRANDE (Para ignorar motas de polvo o sombras de papel)
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
                    const kx = cIdx % w;
                    const ky = Math.floor(cIdx / w);

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

    if (bestComponent.length < 30 || bestStartX === -1) {
        console.warn('No se detectÃ³ un dibujo con suficiente contraste.');
        return;
    }

    // Trazar el perÃ­metro del componente principal
    const rawOuterContour = tracePerimeter(grid, w, h, bestStartX, bestStartY, 1);
    if (rawOuterContour.length < 6) return;

    // 3. DetecciÃ³n de Huecos Interiores (Islas blancas cerradas dentro de la silueta)
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

                let holeBorderX = -1, holeBorderY = -1;

                while (hHead < hQueue.length) {
                    const cur = hQueue[hHead++];
                    holePixels.push(cur);
                    const hx = cur % w;
                    const hy = Math.floor(cur / w);

                    const hNeigh = [[hx + 1, hy], [hx - 1, hy], [hx, hy + 1], [hx, hy - 1]];
                    for (const [hnx, hny] of hNeigh) {
                        if (hnx >= 0 && hnx < w && hny >= 0 && hny < h) {
                            const hnIdx = hny * w + hnx;
                            if (grid[hnIdx] === 0 && visited[hnIdx] !== 2 && holeVisited[hnIdx] === 0) {
                                holeVisited[hnIdx] = 1;
                                hQueue.push(hnIdx);
                            } else if (grid[hnIdx] === 1 && holeBorderX === -1) {
                                holeBorderX = hx;
                                holeBorderY = hy;
                            }
                        }
                    }
                }

                if (holePixels.length > 50 && holeBorderX !== -1) {
                    const rawHole = tracePerimeter(grid, w, h, holeBorderX, holeBorderY, 0);
                    if (rawHole.length >= 6) {
                        detectedHoles.push(rawHole);
                    }
                }
            }
        }
    }

    // 4. Suavizado Douglas-Peucker
    const smoothValNum = parseInt(smoothSlider.value);
    const epsilon = 0.8 + (smoothValNum * 0.45);

    const simplifiedOuter = simplifyDouglasPeucker(rawOuterContour, epsilon);
    const simplifiedHoles = detectedHoles.map(hContour => simplifyDouglasPeucker(hContour, epsilon));

    const canvasScale = processCanvas.width / w;

    currentPoints = simplifiedOuter.map(p => ({
        canvasX: p.x * canvasScale,
        canvasY: p.y * canvasScale,
        x: 0,
        y: 0
    }));

    innerHoles = simplifiedHoles.map(hole => hole.map(p => ({
        canvasX: p.x * canvasScale,
        canvasY: p.y * canvasScale,
        x: 0,
        y: 0
    })));

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
    const neighbors = [
        [-1, 0], [-1, -1], [0, -1], [1, -1],
        [1, 0], [1, 1], [0, 1], [-1, 1]
    ];

    const contour = [];
    let curX = startX, curY = startY;
    let backtrackDir = 0;
    const maxSteps = 4000;
    let steps = 0;

    const isMatch = (x, y) => {
        if (x < 0 || x >= w || y < 0 || y >= h) return false;
        return grid[y * w + x] === targetVal;
    };

    do {
        contour.push({ x: curX, y: curY });
        let nextX = -1, nextY = -1;
        let foundDir = -1;

        for (let i = 0; i < 8; i++) {
            const checkDir = (backtrackDir + i) % 8;
            const nx = curX + neighbors[checkDir][0];
            const ny = curY + neighbors[checkDir][1];

            if (isMatch(nx, ny)) {
                nextX = nx;
                nextY = ny;
                foundDir = checkDir;
                break;
            }
        }

        if (foundDir === -1) break;

        backtrackDir = (foundDir + 5) % 8;
        curX = nextX;
        curY = nextY;
        steps++;
    } while ((curX !== startX || curY !== startY) && steps < maxSteps);

    return contour;
}

function simplifyDouglasPeucker(points, epsilon) {
    if (points.length <= 2) return points;

    let dmax = 0;
    let index = 0;
    const p1 = points[0];
    const p2 = points[points.length - 1];

    for (let i = 1; i < points.length - 1; i++) {
        const d = perpendicularDist(points[i], p1, p2);
        if (d > dmax) {
            index = i;
            dmax = d;
        }
    }

    if (dmax > epsilon) {
        const rec1 = simplifyDouglasPeucker(points.slice(0, index + 1), epsilon);
        const rec2 = simplifyDouglasPeucker(points.slice(index), epsilon);
        return rec1.slice(0, rec1.length - 1).concat(rec2);
    } else {
        return [p1, p2];
    }
}

function perpendicularDist(p, p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
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

// -------------------------------------------------------------
// RENDERIZADO DEL CANVAS 2D
// -------------------------------------------------------------
function drawVectorCanvas() {
    const ctx = processCanvas.getContext('2d');
    if (!ctx || !processCanvas.width) return;

    ctx.clearRect(0, 0, processCanvas.width, processCanvas.height);

    if (originalImg) {
        ctx.save();
        if (isEditNodesMode) {
            ctx.globalAlpha = 0.4;
        }
        ctx.drawImage(originalImg, 0, 0, processCanvas.width, processCanvas.height);
        ctx.restore();
    }

    if (!showVectorOverlay || currentPoints.length < 3) return;

    // Contorno exterior
    ctx.beginPath();
    ctx.moveTo(currentPoints[0].canvasX, currentPoints[0].canvasY);
    for (let i = 1; i < currentPoints.length; i++) {
        ctx.lineTo(currentPoints[i].canvasX, currentPoints[i].canvasY);
    }
    ctx.closePath();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.18)';
    ctx.fill();

    // Huecos interiores
    if (extrusionMode === 'calado' && innerHoles.length > 0) {
        innerHoles.forEach((hole) => {
            if (hole.length < 3) return;
            ctx.beginPath();
            ctx.moveTo(hole[0].canvasX, hole[0].canvasY);
            for (let i = 1; i < hole.length; i++) {
                ctx.lineTo(hole[i].canvasX, hole[i].canvasY);
            }
            ctx.closePath();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.fillStyle = 'rgba(245, 158, 11, 0.28)';
            ctx.fill();
        });
    }

    // Nodos editables
    if (isEditNodesMode) {
        currentPoints.forEach((p, idx) => {
            ctx.beginPath();
            ctx.arc(p.canvasX, p.canvasY, 5.5, 0, Math.PI * 2);
            ctx.fillStyle = (hoveredNode && hoveredNode.type === 'outer' && hoveredNode.pointIdx === idx) ? '#38bdf8' : '#06b6d4';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        if (extrusionMode === 'calado') {
            innerHoles.forEach((hole, hIdx) => {
                hole.forEach((p, pIdx) => {
                    ctx.beginPath();
                    ctx.arc(p.canvasX, p.canvasY, 5, 0, Math.PI * 2);
                    ctx.fillStyle = (hoveredNode && hoveredNode.type === 'hole' && hoveredNode.holeIdx === hIdx && hoveredNode.pointIdx === pIdx) ? '#fde047' : '#f59e0b';
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                });
            });
        }
    }
}

// -------------------------------------------------------------
// INTERACCIÃ“N DE RATÃ“N: ARRASTRE, ADICIÃ“N Y BORRADO DE NODOS
// -------------------------------------------------------------
function getCanvasCoords(e) {
    const rect = processCanvas.getBoundingClientRect();
    const scaleX = processCanvas.width / rect.width;
    const scaleY = processCanvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

processCanvas.addEventListener('mousedown', (e) => {
    if (!isEditNodesMode) return;
    const { x, y } = getCanvasCoords(e);
    const hitRadius = 14 * (processCanvas.width / processCanvas.clientWidth);

    for (let i = 0; i < currentPoints.length; i++) {
        if (Math.hypot(currentPoints[i].canvasX - x, currentPoints[i].canvasY - y) < hitRadius) {
            draggedNode = { type: 'outer', pointIdx: i };
            return;
        }
    }

    for (let h = 0; h < innerHoles.length; h++) {
        for (let p = 0; p < innerHoles[h].length; p++) {
            if (Math.hypot(innerHoles[h][p].canvasX - x, innerHoles[h][p].canvasY - y) < hitRadius) {
                draggedNode = { type: 'hole', holeIdx: h, pointIdx: p };
                return;
            }
        }
    }

    // Clic en lÃ­nea para agregar nodo
    for (let i = 0; i < currentPoints.length; i++) {
        const p1 = currentPoints[i];
        const p2 = currentPoints[(i + 1) % currentPoints.length];
        const dist = distToSegment({ x, y }, { x: p1.canvasX, y: p1.canvasY }, { x: p2.canvasX, y: p2.canvasY });
        if (dist < 10 * (processCanvas.width / processCanvas.clientWidth)) {
            currentPoints.splice(i + 1, 0, { canvasX: x, canvasY: y, x: 0, y: 0 });
            recompute3DCoordinates();
            drawVectorCanvas();
            extrude3D();
            draggedNode = { type: 'outer', pointIdx: i + 1 };
            return;
        }
    }
});

processCanvas.addEventListener('dblclick', (e) => {
    if (!isEditNodesMode) return;
    const { x, y } = getCanvasCoords(e);
    const hitRadius = 14 * (processCanvas.width / processCanvas.clientWidth);

    for (let i = 0; i < currentPoints.length; i++) {
        if (Math.hypot(currentPoints[i].canvasX - x, currentPoints[i].canvasY - y) < hitRadius) {
            if (currentPoints.length > 4) {
                currentPoints.splice(i, 1);
                recompute3DCoordinates();
                drawVectorCanvas();
                extrude3D();
            }
            return;
        }
    }

    for (let h = 0; h < innerHoles.length; h++) {
        for (let p = 0; p < innerHoles[h].length; p++) {
            if (Math.hypot(innerHoles[h][p].canvasX - x, innerHoles[h][p].canvasY - y) < hitRadius) {
                if (innerHoles[h].length > 3) {
                    innerHoles[h].splice(p, 1);
                } else {
                    innerHoles.splice(h, 1);
                }
                recompute3DCoordinates();
                drawVectorCanvas();
                extrude3D();
                return;
            }
        }
    }
});

processCanvas.addEventListener('mousemove', (e) => {
    if (!isEditNodesMode) return;
    const { x, y } = getCanvasCoords(e);

    if (draggedNode) {
        if (draggedNode.type === 'outer') {
            currentPoints[draggedNode.pointIdx].canvasX = x;
            currentPoints[draggedNode.pointIdx].canvasY = y;
        } else if (draggedNode.type === 'hole') {
            innerHoles[draggedNode.holeIdx][draggedNode.pointIdx].canvasX = x;
            innerHoles[draggedNode.holeIdx][draggedNode.pointIdx].canvasY = y;
        }

        recompute3DCoordinates();
        drawVectorCanvas();
        extrude3D();
    } else {
        const hitRadius = 14 * (processCanvas.width / processCanvas.clientWidth);
        let found = null;

        for (let i = 0; i < currentPoints.length; i++) {
            if (Math.hypot(currentPoints[i].canvasX - x, currentPoints[i].canvasY - y) < hitRadius) {
                found = { type: 'outer', pointIdx: i };
                break;
            }
        }
        if (!found) {
            for (let h = 0; h < innerHoles.length; h++) {
                for (let p = 0; p < innerHoles[h].length; p++) {
                    if (Math.hypot(innerHoles[h][p].canvasX - x, innerHoles[h][p].canvasY - y) < hitRadius) {
                        found = { type: 'hole', holeIdx: h, pointIdx: p };
                        break;
                    }
                }
                if (found) break;
            }
        }

        if (found !== hoveredNode) {
            hoveredNode = found;
            drawVectorCanvas();
        }
    }
});

window.addEventListener('mouseup', () => {
    draggedNode = null;
});

function distToSegment(p, v, w) {
    const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

// -------------------------------------------------------------
// EXTRUSIÃ“N 3D WEBGL (CON GARANTÃA TOTAL ANTI-CRASH)
// -------------------------------------------------------------
function extrude3D() {
    if (!currentPoints || currentPoints.length < 3) return;

    try {
        if (threePlaceholder) threePlaceholder.classList.add('hidden');

        if (currentMesh) {
            scene.remove(currentMesh);
            if (currentMesh.geometry) currentMesh.geometry.dispose();
            currentMesh = null;
        }

        // 1. Contorno Exterior garantizado Counter-Clockwise (CCW)
        let outerPoints = [...currentPoints];
        if (getSignedArea(outerPoints) < 0) {
            outerPoints.reverse();
        }

        const shape = new THREE.Shape();
        shape.moveTo(outerPoints[0].x, outerPoints[0].y);
        for (let i = 1; i < outerPoints.length; i++) {
            shape.lineTo(outerPoints[i].x, outerPoints[i].y);
        }
        shape.closePath();

        // 2. Huecos Interiores garantizados Clockwise (CW)
        if (extrusionMode === 'calado' && innerHoles.length > 0) {
            innerHoles.forEach((holePts) => {
                if (holePts.length < 3) return;
                let hCopy = [...holePts];
                if (getSignedArea(hCopy) > 0) {
                    hCopy.reverse();
                }
                const holePath = new THREE.Path();
                holePath.moveTo(hCopy[0].x, holeCopy[0].y);
                for (let i = 1; i < hCopy.length; i++) {
                    holePath.lineTo(hCopy[i].x, hCopy[i].y);
                }
                holePath.closePath();
                shape.holes.push(holePath);
            });
        }

        // 3. Ojal de Llavero si estÃ¡ marcado
        if (checkHole && checkHole.checked) {
            const ojalPath = new THREE.Path();
            ojalPath.absarc(0, 20, 2.5, 0, Math.PI * 2, true);
            shape.holes.push(ojalPath);
        }

        const depth = parseFloat(heightSlider?.value) || 10;
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
            console.warn('ExtrudeGeometry con huecos fallÃ³, generando silueta sÃ³lida sin conflicto:', extrudeErr);
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
            metalness: 0.2,
            wireframe: false
        });

        currentMesh = new THREE.Mesh(geometry, material);
        currentMesh.position.z = depth / 2;
        scene.add(currentMesh);

        // CÃ¡lculos de FabricaciÃ³n
        const estVolCm3 = (safeDimX * safeDimY * depth * 0.52) / 1000;
        const weightGrams = Math.max(2, Math.round(estVolCm3 * 1.24 * 0.7));
        const estFabCoins = Math.max(3, Math.round(weightGrams * 0.28));

        if (dimInfo) dimInfo.innerText = safeDimX + ' x ' + safeDimY + ' x ' + depth + ' mm';
        if (volInfo) volInfo.innerText = '~' + weightGrams + 'g PLA';
        if (costInfo) costInfo.innerText = estFabCoins + ' FC';

        buildSvgString();
    } catch (err) {
        console.error('Error en extrude3D:', err);
    }
}

// -------------------------------------------------------------
// CONSTRUCCIÃ“N DE SVG
// -------------------------------------------------------------
function buildSvgString() {
    if (currentPoints.length < 3) return;

    let pathOuter = 'M ' + (currentPoints[0].x + 25) + ' ' + (-currentPoints[0].y + 25) + ' ';
    for (let i = 1; i < currentPoints.length; i++) {
        pathOuter += 'L ' + (currentPoints[i].x + 25) + ' ' + (-currentPoints[i].y + 25) + ' ';
    }
    pathOuter += 'Z ';

    let pathHoles = '';
    if (extrusionMode === 'calado' && innerHoles.length > 0) {
        innerHoles.forEach(hole => {
            if (hole.length < 3) return;
            pathHoles += 'M ' + (hole[0].x + 25) + ' ' + (-hole[0].y + 25) + ' ';
            for (let i = 1; i < hole.length; i++) {
                pathHoles += 'L ' + (hole[i].x + 25) + ' ' + (-hole[i].y + 25) + ' ';
            }
            pathHoles += 'Z ';
        });
    }

    let ojalSvg = (checkHole && checkHole.checked) ? '<circle cx=\"25\" cy=\"5\" r=\"2.5\" stroke=\"#ff0000\" stroke-width=\"0.1\" fill=\"none\"/>' : '';

    currentSvgString = '<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 50 50\" width=\"' + targetDimX + 'mm\" height=\"' + targetDimY + 'mm\">\\n' +
        '<path d=\"' + pathOuter + pathHoles + '\" fill-rule=\"evenodd\" stroke=\"#ff0000\" stroke-width=\"0.1\" fill=\"#000000\" />\\n' +
        ojalSvg + '\\n</svg>';
}

function generateAsciiStl(mesh) {
    if (!mesh || !mesh.geometry) return '';
    const geom = mesh.geometry.clone();
    geom.applyMatrix4(mesh.matrixWorld);
    const pos = geom.attributes.position;
    if (!pos) return '';

    let stl = 'solid makerdu_art_toy\\n';
    for (let i = 0; i < pos.count; i += 3) {
        const ax = pos.getX(i), ay = pos.getY(i), az = pos.getZ(i);
        const bx = pos.getX(i + 1), by = pos.getY(i + 1), bz = pos.getZ(i + 1);
        const cx = pos.getX(i + 2), cy = pos.getY(i + 2), cz = pos.getZ(i + 2);

        const ux = bx - ax, uy = by - ay, uz = bz - az;
        const vx = cx - ax, vy = cy - ay, vz = cz - az;
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        const len = Math.hypot(nx, ny, nz);
        if (len > 0) { nx /= len; ny /= len; nz /= len; }

        stl += '  facet normal ' + nx.toFixed(4) + ' ' + ny.toFixed(4) + ' ' + nz.toFixed(4) + '\\n';
        stl += '    outer loop\\n';
        stl += '      vertex ' + ax.toFixed(3) + ' ' + ay.toFixed(3) + ' ' + az.toFixed(3) + '\\n';
        stl += '      vertex ' + bx.toFixed(3) + ' ' + by.toFixed(3) + ' ' + bz.toFixed(3) + '\\n';
        stl += '      vertex ' + cx.toFixed(3) + ' ' + cy.toFixed(3) + ' ' + cz.toFixed(3) + '\\n';
        stl += '    endloop\\n';
        stl += '  endfacet\\n';
    }
    stl += 'endsolid makerdu_art_toy\\n';
    return stl;
}

// -------------------------------------------------------------
// ENVÃO A BITÃCORA LMS CON CAPTURA RENDER 3D
// -------------------------------------------------------------
btnSendToLms.addEventListener('click', () => {
    if (!currentMesh || currentPoints.length < 3) {
        alert('Por favor vectoriza un boceto antes de enviar a la bitÃ¡cora.');
        return;
    }

    buildSvgString();
    const stlString = generateAsciiStl(currentMesh);

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
        content: currentSvgString,
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

btnDownloadSvg.addEventListener('click', () => {
    buildSvgString();
    if (!currentSvgString) { alert('Dibuja o captura un boceto primero.'); return; }
    const blob = new Blob([currentSvgString], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'makerdu_vector.svg';
    a.click();
});

btnDownloadStl.addEventListener('click', () => {
    if (!currentMesh) { alert('Genera un modelo 3D primero.'); return; }
    const stlString = generateAsciiStl(currentMesh);
    const blob = new Blob([stlString], { type: 'model/stl' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'art_toy_2.5d.stl';
    a.click();
});