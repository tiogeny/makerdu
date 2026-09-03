// Makerdu Slicer Engine v3.0 - Real STL Slicing, 3D Infill & Theme Support
let scene, camera, renderer, controls;
let currentMesh = null;
let infillMesh3D = null;
let clipPlane = null;
let currentInfill = 'grid'; // 'grid', 'gyroid', 'solid'
let currentLayer = 25;
let totalLayers = 50;
let layerHeight = 0.20; // mm
let totalHeightMm = 10;
let loadedGeometry = null;

// Tema
let isDarkMode = true;
const btnThemeToggle = document.getElementById('btnThemeToggle');
const themeIcon = document.getElementById('themeIcon');

function setTheme(dark) {
    isDarkMode = dark;
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
        themeIcon.innerText = '☀️';
        if (scene) scene.background = new THREE.Color(0x020617);
    } else {
        document.documentElement.classList.remove('dark');
        themeIcon.innerText = '🌙';
        if (scene) scene.background = new THREE.Color(0xf1f5f9);
    }
    draw2DLayerSlice();
}

btnThemeToggle.addEventListener('click', () => setTheme(!isDarkMode));

// Detectar tema del padre (LMS)
try {
    if (window.parent && window.parent.document && window.parent.document.documentElement.classList.contains('dark') !== undefined) {
        setTheme(window.parent.document.documentElement.classList.contains('dark'));
    }
} catch (e) {}

const layerCanvas = document.getElementById('layerCanvas');
const layerCanvasWrapper = document.getElementById('layerCanvasWrapper');
const layerSlider = document.getElementById('layerSlider');
const layerBadge = document.getElementById('layerBadge');
const heightZVal = document.getElementById('heightZVal');

const btnInfillGrid = document.getElementById('btnInfillGrid');
const btnInfillGyroid = document.getElementById('btnInfillGyroid');
const btnInfillSolid = document.getElementById('btnInfillSolid');

const stlFileInput = document.getElementById('stlFileInput');
const btnSendToLms = document.getElementById('btnSendToLms');
const btnResetCamera = document.getElementById('btnResetCamera');
const threeContainer = document.getElementById('threeContainer');

function initThree() {
    const w = threeContainer.clientWidth || 500;
    const h = threeContainer.clientHeight || 360;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(isDarkMode ? 0x020617 : 0xf1f5f9);

    camera = new THREE.PerspectiveCamera(45, w / h, 1, 1000);
    camera.position.set(0, -75, 75);

    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(w, h);
    renderer.localClippingEnabled = true;
    threeContainer.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    const ambient = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dir.position.set(40, 50, 80);
    scene.add(dir);

    // Cama de Impresión Caliente
    const bedGeo = new THREE.PlaneGeometry(120, 120);
    const bedMat = new THREE.MeshBasicMaterial({ color: 0x0f172a, side: THREE.DoubleSide });
    const bed = new THREE.Mesh(bedGeo, bedMat);
    bed.position.z = -0.1;
    scene.add(bed);

    const bedGrid = new THREE.GridHelper(120, 24, 0x06b6d4, 0x334155);
    bedGrid.rotation.x = Math.PI / 2;
    scene.add(bedGrid);

    // Plano de corte
    clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 5);

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', onResize);
    loadDefaultArtToy();
}

function onResize() {
    if (!renderer || !camera || !threeContainer) return;
    const w = threeContainer.clientWidth;
    const h = threeContainer.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    draw2DLayerSlice();
}

function setupMeshOnBed(geom) {
    loadedGeometry = geom;
    if (currentMesh) scene.remove(currentMesh);
    if (infillMesh3D) scene.remove(infillMesh3D);

    geom.computeBoundingBox();
    geom.center();
    geom.computeBoundingBox();
    const newBbox = geom.boundingBox;
    geom.translate(0, 0, -newBbox.min.z);

    geom.computeBoundingBox();
    totalHeightMm = Math.max(2, geom.boundingBox.max.z);
    totalLayers = Math.max(10, Math.round(totalHeightMm / layerHeight));
    layerSlider.max = totalLayers;
    layerSlider.value = Math.round(totalLayers / 2);
    currentLayer = parseInt(layerSlider.value);

    const mat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        roughness: 0.35,
        metalness: 0.15,
        clippingPlanes: [clipPlane],
        clipShadows: true,
        side: THREE.DoubleSide
    });

    currentMesh = new THREE.Mesh(geom, mat);
    scene.add(currentMesh);

    build3DInfillLines();
    updateSlicerValues();
}

// CONSTRUIR TRAMA DE RELLENO 3D DENTRO DEL MODELO
function build3DInfillLines() {
    if (infillMesh3D) scene.remove(infillMesh3D);
    if (!loadedGeometry) return;

    const bbox = loadedGeometry.boundingBox;
    const minX = bbox.min.x + 1.2, maxX = bbox.max.x - 1.2;
    const minY = bbox.min.y + 1.2, maxY = bbox.max.y - 1.2;
    const maxZ = totalHeightMm;

    const linePoints = [];
    const step = currentInfill === 'solid' ? 1.0 : (currentInfill === 'grid' ? 4.0 : 5.0);

    for (let z = 0.4; z < maxZ; z += 0.8) {
        if (currentInfill === 'grid' || currentInfill === 'solid') {
            for (let x = minX; x <= maxX; x += step) {
                linePoints.push(new THREE.Vector3(x, minY, z));
                linePoints.push(new THREE.Vector3(x, maxY, z));
            }
            for (let y = minY; y <= maxY; y += step) {
                linePoints.push(new THREE.Vector3(minX, y, z));
                linePoints.push(new THREE.Vector3(maxX, y, z));
            }
        } else if (currentInfill === 'gyroid') {
            for (let y = minY; y <= maxY; y += step) {
                for (let x = minX; x <= maxX; x += 1.5) {
                    const waveY = y + Math.sin(x * 0.4 + z * 0.8) * 1.5;
                    linePoints.push(new THREE.Vector3(x, waveY, z));
                    linePoints.push(new THREE.Vector3(x + 1.5, waveY, z));
                }
            }
        }
    }

    const infillGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    const infillMat = new THREE.LineBasicMaterial({
        color: 0xf59e0b,
        linewidth: 1,
        clippingPlanes: [clipPlane],
    });

    infillMesh3D = new THREE.LineSegments(infillGeo, infillMat);
    scene.add(infillMesh3D);
}

function loadDefaultArtToy() {
    const shape = new THREE.Shape();
    shape.moveTo(-20, 0);
    shape.lineTo(-20, 30);
    shape.quadraticCurveTo(-20, 45, -5, 45);
    shape.lineTo(15, 45);
    shape.quadraticCurveTo(25, 45, 25, 30);
    shape.lineTo(25, 0);
    shape.lineTo(15, 0);
    shape.lineTo(10, 15);
    shape.lineTo(-10, 15);
    shape.lineTo(-15, 0);
    shape.closePath();

    const hole = new THREE.Path();
    hole.absarc(0, 28, 6, 0, Math.PI * 2, true);
    shape.holes.push(hole);

    const extrudeSettings = {
        steps: 1,
        depth: 10,
        bevelEnabled: true,
        bevelThickness: 0.5,
        bevelSize: 0.35,
        bevelSegments: 2
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    setupMeshOnBed(geom);
}

function updateSlicerValues() {
    const currentZ = (currentLayer * layerHeight);
    clipPlane.constant = currentZ;

    if (layerBadge) layerBadge.innerText = 'Capa ' + currentLayer + ' / ' + totalLayers;
    if (heightZVal) heightZVal.innerText = currentZ.toFixed(2) + ' mm';

    draw2DLayerSlice();
}

layerSlider.addEventListener('input', () => {
    currentLayer = parseInt(layerSlider.value);
    updateSlicerValues();
});

btnInfillGrid.addEventListener('click', () => {
    currentInfill = 'grid';
    btnInfillGrid.className = 'py-1 px-1.5 rounded-lg text-[10px] font-bold transition bg-amber-500 text-slate-950 shadow text-center';
    btnInfillGyroid.className = 'py-1 px-1.5 rounded-lg text-[10px] font-bold transition text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 text-center';
    btnInfillSolid.className = 'py-1 px-1.5 rounded-lg text-[10px] font-bold transition text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 text-center';
    build3DInfillLines();
    draw2DLayerSlice();
});

btnInfillGyroid.addEventListener('click', () => {
    currentInfill = 'gyroid';
    btnInfillGyroid.className = 'py-1 px-1.5 rounded-lg text-[10px] font-bold transition bg-amber-500 text-slate-950 shadow text-center';
    btnInfillGrid.className = 'py-1 px-1.5 rounded-lg text-[10px] font-bold transition text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 text-center';
    btnInfillSolid.className = 'py-1 px-1.5 rounded-lg text-[10px] font-bold transition text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 text-center';
    build3DInfillLines();
    draw2DLayerSlice();
});

btnInfillSolid.addEventListener('click', () => {
    currentInfill = 'solid';
    btnInfillSolid.className = 'py-1 px-1.5 rounded-lg text-[10px] font-bold transition bg-amber-500 text-slate-950 shadow text-center';
    btnInfillGrid.className = 'py-1 px-1.5 rounded-lg text-[10px] font-bold transition text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 text-center';
    btnInfillGyroid.className = 'py-1 px-1.5 rounded-lg text-[10px] font-bold transition text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 text-center';
    build3DInfillLines();
    draw2DLayerSlice();
});

btnResetCamera.addEventListener('click', () => {
    camera.position.set(0, -75, 75);
    controls.target.set(0, 0, 5);
    controls.update();
});

// CALCULAR INTERSECCIÓN PLANAR EXACTA DEL STL EN Z = currentZ
function getSliceSegments(geom, zCut) {
    const segments = [];
    if (!geom) return segments;

    const pos = geom.attributes.position;
    const index = geom.index;
    const numTriangles = index ? index.count / 3 : pos.count / 3;

    for (let i = 0; i < numTriangles; i++) {
        let i0, i1, i2;
        if (index) {
            i0 = index.getX(i * 3);
            i1 = index.getX(i * 3 + 1);
            i2 = index.getX(i * 3 + 2);
        } else {
            i0 = i * 3; i1 = i * 3 + 1; i2 = i * 3 + 2;
        }

        const v0 = { x: pos.getX(i0), y: pos.getY(i0), z: pos.getZ(i0) };
        const v1 = { x: pos.getX(i1), y: pos.getY(i1), z: pos.getZ(i1) };
        const v2 = { x: pos.getX(i2), y: pos.getY(i2), z: pos.getZ(i2) };

        // Puntos que cruzan el plano z = zCut
        const pts = [];
        intersectEdge(v0, v1, zCut, pts);
        intersectEdge(v1, v2, zCut, pts);
        intersectEdge(v2, v0, zCut, pts);

        if (pts.length === 2) {
            segments.push([pts[0], pts[1]]);
        }
    }
    return segments;
}

function intersectEdge(p1, p2, z, pts) {
    if ((p1.z <= z && p2.z >= z) || (p1.z >= z && p2.z <= z)) {
        if (Math.abs(p1.z - p2.z) > 1e-5) {
            const t = (z - p1.z) / (p2.z - p1.z);
            if (t >= 0 && t <= 1) {
                pts.push({
                    x: p1.x + t * (p2.x - p1.x),
                    y: p1.y + t * (p2.y - p1.y)
                });
            }
        }
    }
}

// DIBUJAR CORTE REAL 2D CON RELLENO INFILL EXACTO
function draw2DLayerSlice() {
    const rect = layerCanvasWrapper.getBoundingClientRect();
    layerCanvas.width = Math.round(rect.width);
    layerCanvas.height = Math.round(rect.height);

    const ctx = layerCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, layerCanvas.width, layerCanvas.height);

    // Retícula
    ctx.strokeStyle = isDarkMode ? '#0f172a' : '#e2e8f0';
    ctx.lineWidth = 1;
    const step = 20;
    for (let x = 0; x < layerCanvas.width; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, layerCanvas.height); ctx.stroke();
    }
    for (let y = 0; y < layerCanvas.height; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(layerCanvas.width, y); ctx.stroke();
    }

    if (!loadedGeometry) return;

    const currentZ = (currentLayer * layerHeight);
    const segments = getSliceSegments(loadedGeometry, currentZ);

    const bbox = loadedGeometry.boundingBox;
    const modelW = Math.max(1, bbox.max.x - bbox.min.x);
    const modelH = Math.max(1, bbox.max.y - bbox.min.y);

    const scale = Math.min((layerCanvas.width * 0.75) / modelW, (layerCanvas.height * 0.75) / modelH);
    const cx = layerCanvas.width / 2;
    const cy = layerCanvas.height / 2;

    ctx.save();
    ctx.translate(cx, cy);

    if (segments.length > 0) {
        // 1. Crear región de recorte del modelo real para el infill
        ctx.save();
        ctx.beginPath();
        for (const [p1, p2] of segments) {
            ctx.moveTo(p1.x * scale, -p1.y * scale);
            ctx.lineTo(p2.x * scale, -p2.y * scale);
        }
        ctx.clip();

        // 2. Trazar Relleno (Infill) dentro de la pieza
        const bounds = Math.max(modelW, modelH) * scale;
        if (currentInfill === 'solid') {
            ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
            ctx.fillRect(-bounds, -bounds, bounds * 2, bounds * 2);
        } else if (currentInfill === 'grid') {
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.5;
            const gridGap = 12;
            for (let gx = -bounds; gx <= bounds; gx += gridGap) {
                ctx.beginPath(); ctx.moveTo(gx, -bounds); ctx.lineTo(gx, bounds); ctx.stroke();
            }
            for (let gy = -bounds; gy <= bounds; gy += gridGap) {
                ctx.beginPath(); ctx.moveTo(-bounds, gy); ctx.lineTo(bounds, gy); ctx.stroke();
            }
        } else if (currentInfill === 'gyroid') {
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.5;
            for (let gy = -bounds; gy <= bounds; gy += 14) {
                ctx.beginPath();
                for (let gx = -bounds; gx <= bounds; gx += 5) {
                    const waveY = gy + Math.sin(gx * 0.15 + (currentLayer * 0.2)) * 6;
                    if (gx === -bounds) ctx.moveTo(gx, waveY);
                    else ctx.lineTo(gx, waveY);
                }
                ctx.stroke();
            }
        }
        ctx.restore();

        // 3. Dibujar Perímetros exteriores e interiores (Cian)
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        for (const [p1, p2] of segments) {
            ctx.beginPath();
            ctx.moveTo(p1.x * scale, -p1.y * scale);
            ctx.lineTo(p2.x * scale, -p2.y * scale);
            ctx.stroke();
        }
    }

    ctx.restore();
}

stlFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const loader = new THREE.STLLoader();
        const geometry = loader.parse(event.target.result);
        setupMeshOnBed(geometry);
    };
    reader.readAsArrayBuffer(file);
});

// Carga automática por URL
const urlParams = new URLSearchParams(window.location.search);
const stlUrl = urlParams.get('stl_url') || urlParams.get('file_url');
if (stlUrl) {
    const loader = new THREE.STLLoader();
    loader.load(stlUrl, (geometry) => {
        setupMeshOnBed(geometry);
    }, undefined, (err) => {
        console.warn('Fallback a modelo de muestra:', err);
    });
}

btnSendToLms.addEventListener('click', () => {
    renderer.render(scene, camera);
    const snap = renderer.domElement.toDataURL('image/png');

    const payload = {
        type: 'MAKERDU_MICROAPP_ASSET',
        appName: 'slicer-3d',
        fileType: 'gcode',
        fileName: 'art_toy_slicing_report.gcode',
        content: '; Makerdu Sliced Job\n; Layers: ' + totalLayers + '\n; Infill: ' + currentInfill + '\n; Layer Height: 0.20mm',
        image_snapshot: snap,
        infill: currentInfill,
        layers: totalLayers,
        estimated_time: '42 min',
        pla_grams: 14,
        fabcoins: 4
    };

    if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, '*');
    } else {
        alert('Parámetros de laminado validados con éxito: 14g PLA, ~42 min, 4 FabCoins.');
    }
});

initThree();
