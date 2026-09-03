// Makerdu Vectorizer & 3D Extruder Engine v4.0 (Studio Edition)

// -------------------------------------------------------------
// STATE & CONFIGURATION
// -------------------------------------------------------------
let currentMode = 'camera'; // 'camera' or 'bezier'
let extrusionMode = 'calado'; // 'calado' (con huecos) or 'solido'
let showVectorOverlay = true;
let isEditNodesMode = false;
let isAutoRotating = true;
let isRatioLocked = true;
let currentSvgString = '';
let currentMesh = null;
let videoStream = null;
let originalImg = null;
let baseAspectRatio = 1.0;

// Geometría Vectorial 2D
let currentPoints = []; // Contorno exterior [{x, y, canvasX, canvasY}]
let innerHoles = [];    // Array de arrays de huecos [[{x, y, canvasX, canvasY}], ...]
let isBezierClosed = false;

// Interacción de Nodos
let draggedNode = null; // { type: 'outer'|'hole', holeIdx: number, pointIdx: number }
let hoveredNode = null;

// Parámetros de Fabricación
let targetDimX = 50;
let targetDimY = 50;
let targetDimZ = 10;

// -------------------------------------------------------------
// DOM ELEMENTS
// -------------------------------------------------------------
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

// Herramientas Vectoriales
const btnToggleOverlay = document.getElementById('btnToggleOverlay');
const btnEditNodes = document.getElementById('btnEditNodes');
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

// Botones de Acción
const btnClearBezier = document.getElementById('btnClearBezier');
const btnSendToLms = document.getElementById('btnSendToLms');
const btnDownloadSvg = document.getElementById('btnDownloadSvg');
const btnDownloadStl = document.getElementById('btnDownloadStl');

// -------------------------------------------------------------
// THREE.JS SETUP
// -------------------------------------------------------------
let scene, camera, renderer, controls;
function initThree() {
    const width = threeContainer.clientWidth || 400;
    const height = threeContainer.clientHeight || 340;

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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight1.position.set(50, 50, 100);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf59e0b, 0.9);
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
// CONTROL DE GIRO 3D & CÁMARA
// -------------------------------------------------------------
btnToggleRotate.addEventListener('click', () => {
    isAutoRotating = !isAutoRotating;
    rotateIcon.innerText = isAutoRotating ? '⏸️' : '▶️';
    rotateText.innerText = isAutoRotating ? 'Pausar Giro' : 'Reanudar Giro';
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
// MODOS DE EXTRUSIÓN & CONTROLES
// -------------------------------------------------------------
btnModeHoles.addEventListener('click', () => {
    extrusionMode = 'calado';
    btnModeHoles.className = 'py-1.5 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 bg-cyan-500 text-slate-950 shadow-md';
    btnModeSolid.className = 'py-1.5 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 text-slate-400 bg-slate-900 hover:text-white border border-slate-800';
    extrude3D();
    drawVectorCanvas();
});

btnModeSolid.addEventListener('click', () => {
    extrusionMode = 'solido';
    btnModeSolid.className = 'py-1.5 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 bg-cyan-500 text-slate-950 shadow-md';
    btnModeHoles.className = 'py-1.5 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 text-slate-400 bg-slate-900 hover:text-white border border-slate-800';
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
    drawVectorCanvas();
});

smoothSlider.addEventListener('input', () => {
    smoothVal.innerText = `Nivel ${smoothSlider.value}`;
    applyThresholdAndVectorize();
});

thresholdSlider.addEventListener('input', () => {
    thresholdVal.innerText = thresholdSlider.value;
    applyThresholdAndVectorize();
});

heightSlider.addEventListener('input', () => {
    targetDimZ = parseFloat(heightSlider.value) || 10;
    heightVal.innerText = `${targetDimZ} mm`;
    extrude3D();
});

checkHole.addEventListener('change', () => {
    extrude3D();
});

// Control de Dimensiones Proporcionales
btnLockRatio.addEventListener('click', () => {
    isRatioLocked = !isRatioLocked;
    btnLockRatio.innerHTML = isRatioLocked ? '<span>🔒 1:1</span>' : '<span>🔓 Libre</span>';
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
// CARGA DE IMÁGENES & CÁMARA
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
        alert('No se pudo acceder a la cámara. Por favor permite los permisos o sube una foto.');
    }
});

btnSnap.addEventListener('click', () => {
    processCanvas.width = videoFeed.videoWidth || 400;
    processCanvas.height = videoFeed.videoHeight || 400;
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

// Soporte de precarga automática desde Makerdu Studio (Misión 1 ➔ Misión 2)
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
// ALGORITMO DE VECTORIZACIÓN: CONTORNO EXTERIOR + HUECOS INTERIORES
// -------------------------------------------------------------
function applyThresholdAndVectorize() {
    if (!originalImg) return;

    // Usar resolución de trabajo óptima para análisis (< 350px para 60fps)
    const workCanvas = document.createElement('canvas');
    const maxDim = 320;
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

    // Matriz binaria: 1 = negro (trazo), 0 = blanco (vacío)
    const grid = new Uint8Array(w * h);
    for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        grid[i / 4] = brightness < threshold ? 1 : 0;
    }

    // 1. Detección de fondo exterior mediante Flood Fill desde los bordes
    const visited = new Uint8Array(w * h);
    const queue = [];

    for (let x = 0; x < w; x++) {
        if (grid[x] === 0) { queue.push(x); visited[x] = 2; } // Borde superior
        const bIdx = (h - 1) * w + x;
        if (grid[bIdx] === 0) { queue.push(bIdx); visited[bIdx] = 2; } // Borde inferior
    }
    for (let y = 0; y < h; y++) {
        const lIdx = y * w;
        if (grid[lIdx] === 0 && !visited[lIdx]) { queue.push(lIdx); visited[lIdx] = 2; } // Borde izquierdo
        const rIdx = y * w + (w - 1);
        if (grid[rIdx] === 0 && !visited[rIdx]) { queue.push(rIdx); visited[rIdx] = 2; } // Borde derecho
    }

    let head = 0;
    while (head < queue.length) {
        const idx = queue[head++];
        const cx = idx % w;
        const cy = Math.floor(idx / w);

        const neighbors = [
            [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
        ];

        for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                const nIdx = ny * w + nx;
                if (grid[nIdx] === 0 && visited[nIdx] === 0) {
                    visited[nIdx] = 2; // 2 = Fondo exterior libre
                    queue.push(nIdx);
                }
            }
        }
    }

    // 2. Trazado del Contorno Exterior Principal (Moore-Neighbor Tracing)
    let startX = -1, startY = -1;
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            if (grid[y * w + x] === 1) {
                startX = x;
                startY = y;
                break;
            }
        }
        if (startX !== -1) break;
    }

    if (startX === -1) return;

    const rawOuterContour = tracePerimeter(grid, w, h, startX, startY, 1);
    if (rawOuterContour.length < 8) return;

    // 3. Detección de Huecos Interiores (Islas blancas cerradas dentro de la silueta)
    const detectedHoles = [];
    const holeVisited = new Uint8Array(w * h);

    for (let y = 2; y < h - 2; y++) {
        for (let x = 2; x < w - 2; x++) {
            const idx = y * w + x;
            // Si es blanco y NO es fondo exterior (es decir, está atrapado adentro)
            if (grid[idx] === 0 && visited[idx] !== 2 && holeVisited[idx] === 0) {
                // Medir tamaño del hueco con flood fill para filtrar ruido
                const holePixels = [];
                const hQueue = [idx];
                holeVisited[idx] = 1;

                let hHead = 0;
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
                            }
                        }
                    }
                }

                // Filtrar huecos muy pequeños (< 80 píxeles) para evitar suciedad del papel
                if (holePixels.length > 80) {
                    // Encontrar borde del hueco
                    const hStart = holePixels[0];
                    const hsX = hStart % w;
                    const hsY = Math.floor(hStart / w);
                    const rawHole = tracePerimeter(grid, w, h, hsX, hsY, 0);
                    if (rawHole.length >= 6) {
                        detectedHoles.push(rawHole);
                    }
                }
            }
        }
    }

    // 4. Suavizado Douglas-Peucker según deslizador de Smooth (Estilo 3D Builder)
    const smoothValNum = parseInt(smoothSlider.value);
    const epsilon = 0.8 + (smoothValNum * 0.45); // Nivel 1: 1.25px ... Nivel 10: 5.3px

    const simplifiedOuter = simplifyDouglasPeucker(rawOuterContour, epsilon);
    const simplifiedHoles = detectedHoles.map(hContour => simplifyDouglasPeucker(hContour, epsilon));

    // 5. Normalización y Centrado a Escala Milimétrica Maker (50 mm x 50 mm)
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of simplifiedOuter) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
    }

    const bboxW = Math.max(1, maxX - minX);
    const bboxH = Math.max(1, maxY - minY);
    baseAspectRatio = bboxW / bboxH;

    // Ajustar inputs iniciales si es primera carga
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

    const scale = 50 / Math.max(bboxW, bboxH);
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const canvasScale = processCanvas.width / w;

    currentPoints = simplifiedOuter.map(p => ({
        x: (p.x - midX) * scale,
        y: -(p.y - midY) * scale,
        canvasX: p.x * canvasScale,
        canvasY: p.y * canvasScale
    }));

    innerHoles = simplifiedHoles.map(hole => hole.map(p => ({
        x: (p.x - midX) * scale,
        y: -(p.y - midY) * scale,
        canvasX: p.x * canvasScale,
        canvasY: p.y * canvasScale
    })));

    drawVectorCanvas();
    extrude3D();
}

// Moore-Neighbor Tracing en 8 direcciones
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

// Ramer-Douglas-Peucker
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

// -------------------------------------------------------------
// RENDERIZADO DEL CANVAS 2D CON SUPERPOSICIÓN VECTORIAL
// -------------------------------------------------------------
function drawVectorCanvas() {
    const ctx = processCanvas.getContext('2d');
    if (!ctx || !processCanvas.width) return;

    ctx.clearRect(0, 0, processCanvas.width, processCanvas.height);

    // 1. Dibujar Foto original al fondo
    if (originalImg) {
        ctx.save();
        if (isEditNodesMode) {
            ctx.globalAlpha = 0.45; // Atenuar como papel cebolla
        }
        ctx.drawImage(originalImg, 0, 0, processCanvas.width, processCanvas.height);
        ctx.restore();
    }

    if (!showVectorOverlay || currentPoints.length < 3) return;

    // 2. Dibujar Contorno Exterior (Cian #06b6d4)
    ctx.beginPath();
    ctx.moveTo(currentPoints[0].canvasX, currentPoints[0].canvasY);
    for (let i = 1; i < currentPoints.length; i++) {
        ctx.lineTo(currentPoints[i].canvasX, currentPoints[i].canvasY);
    }
    ctx.closePath();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.fill();

    // 3. Dibujar Huecos Interiores (Ámbar #f59e0b)
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
            ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
            ctx.fill();
        });
    }

    // 4. Dibujar Nodos Editables si el Modo Edición está activo
    if (isEditNodesMode) {
        // Nodos del contorno exterior
        currentPoints.forEach((p, idx) => {
            ctx.beginPath();
            ctx.arc(p.canvasX, p.canvasY, 5, 0, Math.PI * 2);
            ctx.fillStyle = (hoveredNode && hoveredNode.type === 'outer' && hoveredNode.pointIdx === idx) ? '#38bdf8' : '#06b6d4';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });

        // Nodos de los huecos
        if (extrusionMode === 'calado') {
            innerHoles.forEach((hole, hIdx) => {
                hole.forEach((p, pIdx) => {
                    ctx.beginPath();
                    ctx.arc(p.canvasX, p.canvasY, 4.5, 0, Math.PI * 2);
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
// INTERACCIÓN DE RATÓN / ARRASTRE DE NODOS EN ProcesoCanvas
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
    const hitRadius = 12 * (processCanvas.width / processCanvas.clientWidth);

    // 1. Buscar en contorno exterior
    for (let i = 0; i < currentPoints.length; i++) {
        if (Math.hypot(currentPoints[i].canvasX - x, currentPoints[i].canvasY - y) < hitRadius) {
            draggedNode = { type: 'outer', pointIdx: i };
            return;
        }
    }

    // 2. Buscar en huecos
    for (let h = 0; h < innerHoles.length; h++) {
        for (let p = 0; p < innerHoles[h].length; p++) {
            if (Math.hypot(innerHoles[h][p].canvasX - x, innerHoles[h][p].canvasY - y) < hitRadius) {
                draggedNode = { type: 'hole', holeIdx: h, pointIdx: p };
                return;
            }
        }
    }
});

processCanvas.addEventListener('mousemove', (e) => {
    if (!isEditNodesMode) return;
    const { x, y } = getCanvasCoords(e);

    if (draggedNode) {
        // Actualizar nodo arrastrado
        const scale3D = 50 / processCanvas.width;
        const midCanvasX = processCanvas.width / 2;
        const midCanvasY = processCanvas.height / 2;

        if (draggedNode.type === 'outer') {
            currentPoints[draggedNode.pointIdx].canvasX = x;
            currentPoints[draggedNode.pointIdx].canvasY = y;
            currentPoints[draggedNode.pointIdx].x = (x - midCanvasX) * scale3D;
            currentPoints[draggedNode.pointIdx].y = -(y - midCanvasY) * scale3D;
        } else if (draggedNode.type === 'hole') {
            innerHoles[draggedNode.holeIdx][draggedNode.pointIdx].canvasX = x;
            innerHoles[draggedNode.holeIdx][draggedNode.pointIdx].canvasY = y;
            innerHoles[draggedNode.holeIdx][draggedNode.pointIdx].x = (x - midCanvasX) * scale3D;
            innerHoles[draggedNode.holeIdx][draggedNode.pointIdx].y = -(y - midCanvasY) * scale3D;
        }

        drawVectorCanvas();
        extrude3D();
    } else {
        // Hover sobre nodos
        const hitRadius = 12 * (processCanvas.width / processCanvas.clientWidth);
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

// -------------------------------------------------------------
// EXTRUSIÓN 3D WEBGL (CALADO & SILUETA)
// -------------------------------------------------------------
function extrude3D() {
    if (currentPoints.length < 3) return;

    if (threePlaceholder) threePlaceholder.classList.add('hidden');

    if (currentMesh) {
        scene.remove(currentMesh);
    }

    // 1. Crear Silueta Exterior
    const shape = new THREE.Shape();
    shape.moveTo(currentPoints[0].x, currentPoints[0].y);
    for (let i = 1; i < currentPoints.length; i++) {
        shape.lineTo(currentPoints[i].x, currentPoints[i].y);
    }
    shape.closePath();

    // 2. Perforar Huecos Interiores (Modo Calado)
    if (extrusionMode === 'calado' && innerHoles.length > 0) {
        innerHoles.forEach((hole) => {
            if (hole.length < 3) return;
            const holePath = new THREE.Path();
            holePath.moveTo(hole[0].x, hole[0].y);
            for (let i = 1; i < hole.length; i++) {
                holePath.lineTo(hole[i].x, hole[i].y);
            }
            holePath.closePath();
            shape.holes.push(holePath);
        });
    }

    // 3. Ojal de Llavero si está marcado
    if (checkHole.checked) {
        const ojalPath = new THREE.Path();
        ojalPath.absarc(0, 20, 2.5, 0, Math.PI * 2, true);
        shape.holes.push(ojalPath);
    }

    const depth = parseFloat(heightSlider.value) || 10;
    const extrudeSettings = {
        steps: 1,
        depth: depth,
        bevelEnabled: true,
        bevelThickness: 0.6,
        bevelSize: 0.4,
        bevelSegments: 3
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();

    // Escalar según Dimensiones Exactas del Estudiante (Ancho X / Alto Y en mm)
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox;
    const currentW = Math.max(0.1, bbox.max.x - bbox.min.x);
    const currentH = Math.max(0.1, bbox.max.y - bbox.min.y);

    const scaleX = targetDimX / currentW;
    const scaleY = targetDimY / currentH;
    geometry.scale(scaleX, scaleY, 1);

    const material = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        roughness: 0.35,
        metalness: 0.2,
        wireframe: false
    });

    currentMesh = new THREE.Mesh(geometry, material);
    currentMesh.position.z = depth / 2;
    scene.add(currentMesh);

    // Actualizar Tarjetas Técnicas
    const estVol = Math.round((targetDimX * targetDimY * targetDimZ * 0.55) / 1000 * 10) / 10;
    const estFabCoins = Math.max(5, Math.round(estVol * 1.1));

    if (dimInfo) dimInfo.innerText = `${targetDimX} x ${targetDimY} x ${targetDimZ} mm`;
    if (volInfo) volInfo.innerText = `${estVol} cm³`;
    if (costInfo) costInfo.innerText = `${estFabCoins} FC`;

    buildSvgString();
}

// -------------------------------------------------------------
// CONSTRUCCIÓN DE SVG VECTORIAL
// -------------------------------------------------------------
function buildSvgString() {
    if (currentPoints.length < 3) return;

    let pathOuter = `M ${currentPoints[0].x + 25} ${-currentPoints[0].y + 25} `;
    for (let i = 1; i < currentPoints.length; i++) {
        pathOuter += `L ${currentPoints[i].x + 25} ${-currentPoints[i].y + 25} `;
    }
    pathOuter += 'Z ';

    let pathHoles = '';
    if (extrusionMode === 'calado' && innerHoles.length > 0) {
        innerHoles.forEach(hole => {
            if (hole.length < 3) return;
            pathHoles += `M ${hole[0].x + 25} ${-hole[0].y + 25} `;
            for (let i = 1; i < hole.length; i++) {
                pathHoles += `L ${hole[i].x + 25} ${-hole[i].y + 25} `;
            }
            pathHoles += 'Z ';
        });
    }

    let ojalSvg = checkHole.checked ? '<circle cx="25" cy="5" r="2.5" stroke="#ff0000" stroke-width="0.1" fill="none"/>' : '';

    currentSvgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="${targetDimX}mm" height="${targetDimY}mm">
    <path d="${pathOuter}${pathHoles}" fill-rule="evenodd" stroke="#ff0000" stroke-width="0.1" fill="#000000" />
    ${ojalSvg}
</svg>`;
}

// -------------------------------------------------------------
// GENERADOR DE ARCHIVO STL (ESTÁNDAR PARA IMPRESIÓN 3D)
// -------------------------------------------------------------
function generateAsciiStl(mesh) {
    if (!mesh || !mesh.geometry) return '';
    const geom = mesh.geometry.clone();
    geom.applyMatrix4(mesh.matrixWorld);
    const pos = geom.attributes.position;
    if (!pos) return '';

    let stl = 'solid makerdu_art_toy\n';
    for (let i = 0; i < pos.count; i += 3) {
        const ax = pos.getX(i), ay = pos.getY(i), az = pos.getZ(i);
        const bx = pos.getX(i + 1), by = pos.getY(i + 1), bz = pos.getZ(i + 1);
        const cx = pos.getX(i + 2), cy = pos.getY(i + 2), cz = pos.getZ(i + 2);

        // Vector normal
        const ux = bx - ax, uy = by - ay, uz = bz - az;
        const vx = cx - ax, vy = cy - ay, vz = cz - az;
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        const len = Math.hypot(nx, ny, nz);
        if (len > 0) { nx /= len; ny /= len; nz /= len; }

        stl += `  facet normal ${nx.toFixed(4)} ${ny.toFixed(4)} ${nz.toFixed(4)}\n`;
        stl += '    outer loop\n';
        stl += `      vertex ${ax.toFixed(3)} ${ay.toFixed(3)} ${az.toFixed(3)}\n`;
        stl += `      vertex ${bx.toFixed(3)} ${by.toFixed(3)} ${bz.toFixed(3)}\n`;
        stl += `      vertex ${cx.toFixed(3)} ${cy.toFixed(3)} ${cz.toFixed(3)}\n`;
        stl += '    endloop\n';
        stl += '  endfacet\n';
    }
    stl += 'endsolid makerdu_art_toy\n';
    return stl;
}

// -------------------------------------------------------------
// ENVÍO A BITÁCORA LMS & DESCARGAS
// -------------------------------------------------------------
btnSendToLms.addEventListener('click', () => {
    if (!currentMesh || currentPoints.length < 3) {
        alert('Por favor vectoriza un boceto antes de enviar a la bitácora.');
        return;
    }

    buildSvgString();
    const stlString = generateAsciiStl(currentMesh);

    const payload = {
        type: 'MAKERDU_MICROAPP_ASSET',
        appName: 'vectorizer',
        fileType: 'stl',
        fileName: 'art_toy_2.5d.stl',
        stlContent: stlString,
        content: currentSvgString,
        depth_mm: targetDimZ,
        dim_x: targetDimX,
        dim_y: targetDimY,
        has_hook_hole: checkHole.checked,
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

// -------------------------------------------------------------
// MODO 2: TRAZADOR BÉZIER LIBRE
// -------------------------------------------------------------
tabCamera.addEventListener('click', () => {
    currentMode = 'camera';
    tabCamera.className = 'py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 shadow-md';
    tabBezier.className = 'py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 text-slate-400 hover:text-white';
    panelCamera.classList.remove('hidden');
    panelBezier.classList.add('hidden');
    drawVectorCanvas();
});

tabBezier.addEventListener('click', () => {
    currentMode = 'bezier';
    tabBezier.className = 'py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-slate-950 shadow-md';
    tabCamera.className = 'py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 text-slate-400 hover:text-white';
    panelBezier.classList.remove('hidden');
    panelCamera.classList.add('hidden');
    initBezierCanvas();
});

function initBezierCanvas() {
    bezierCanvas.width = bezierCanvas.parentElement.clientWidth || 350;
    bezierCanvas.height = bezierCanvas.parentElement.clientHeight || 350;
    drawBezierCanvas();
}

btnClearBezier.addEventListener('click', () => {
    currentPoints = [];
    innerHoles = [];
    isBezierClosed = false;
    drawBezierCanvas();
    if (currentMesh) {
        scene.remove(currentMesh);
        currentMesh = null;
        if (threePlaceholder) threePlaceholder.classList.remove('hidden');
    }
});

bezierCanvas.addEventListener('click', (e) => {
    if (currentMode !== 'bezier' || isBezierClosed) return;
    const rect = bezierCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentPoints.length > 2) {
        const p0 = currentPoints[0];
        if (Math.hypot(p0.canvasX - x, p0.canvasY - y) < 15) {
            isBezierClosed = true;
            drawBezierCanvas();
            extrude3D();
            return;
        }
    }

    const scale = 50 / bezierCanvas.width;
    currentPoints.push({
        canvasX: x,
        canvasY: y,
        x: (x - bezierCanvas.width / 2) * scale,
        y: -(y - bezierCanvas.height / 2) * scale
    });

    drawBezierCanvas();
});

function drawBezierCanvas() {
    const ctx = bezierCanvas.getContext('2d');
    ctx.clearRect(0, 0, bezierCanvas.width, bezierCanvas.height);

    if (currentPoints.length < 1) return;

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
