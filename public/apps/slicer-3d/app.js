// Makerdu 3D Slicer & Infill Simulator Engine v1.0
let scene, camera, renderer, controls;
let currentMesh = null;
let clipPlane = null;
let currentInfill = 'grid'; // 'grid', 'gyroid', 'solid'
let currentLayer = 25;
let totalLayers = 50;
let layerHeight = 0.20; // mm
let totalHeightMm = 10;

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

// Init Three.js with Clipping Plane
function initThree() {
    const w = threeContainer.clientWidth || 500;
    const h = threeContainer.clientHeight || 360;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    camera = new THREE.PerspectiveCamera(45, w / h, 1, 1000);
    camera.position.set(0, -70, 85);

    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(w, h);
    renderer.localClippingEnabled = true;
    threeContainer.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    // Iluminación
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dir.position.set(40, 50, 80);
    scene.add(dir);

    // Cama de Impresión Caliente Estilo Taller (120x120mm)
    const bedGeo = new THREE.PlaneGeometry(120, 120);
    const bedMat = new THREE.MeshBasicMaterial({ color: 0x0f172a, side: THREE.DoubleSide });
    const bed = new THREE.Mesh(bedGeo, bedMat);
    bed.position.z = -0.1;
    scene.add(bed);

    const bedGrid = new THREE.GridHelper(120, 24, 0x06b6d4, 0x1e293b);
    bedGrid.rotation.x = Math.PI / 2;
    scene.add(bedGrid);

    // Plano de corte de laminado horizontal (en eje Z)
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

function loadDefaultArtToy() {
    const shape = new THREE.Shape();
    shape.moveTo(-20, -25);
    shape.lineTo(-20, 20);
    shape.quadraticCurveTo(-20, 25, -15, 25);
    shape.lineTo(15, 25);
    shape.quadraticCurveTo(20, 25, 20, 20);
    shape.lineTo(20, -25);
    shape.lineTo(10, -25);
    shape.lineTo(5, -12);
    shape.lineTo(-5, -12);
    shape.lineTo(-10, -25);
    shape.closePath();

    const hole = new THREE.Path();
    hole.moveTo(-10, 0);
    hole.lineTo(-10, 14);
    hole.lineTo(-5, 14);
    hole.lineTo(-5, 5);
    hole.lineTo(5, 5);
    hole.lineTo(5, 14);
    hole.lineTo(10, 14);
    hole.lineTo(10, 0);
    hole.closePath();
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
    geom.center();
    geom.computeBoundingBox();
    totalHeightMm = 10;
    totalLayers = Math.round(totalHeightMm / layerHeight);

    const mat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        roughness: 0.4,
        metalness: 0.15,
        clippingPlanes: [clipPlane],
        clipShadows: true,
        side: THREE.DoubleSide
    });

    currentMesh = new THREE.Mesh(geom, mat);
    currentMesh.position.z = 5;
    scene.add(currentMesh);

    updateSlicerValues();
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
    btnInfillGyroid.className = 'py-1 px-1.5 rounded-lg text-[10px] font-bold transition text-slate-400 bg-slate-950 hover:text-white border border-slate-800 text-center';
    btnInfillSolid.className = 'py-1 px-1.5 rounded-lg text-[10px] font-bold transition text-slate-400 bg-slate-950 hover:text-white border border-slate-800 text-center';
    draw2DLayerSlice();
});

btnInfillGyroid.addEventListener('click', () => {
    currentInfill = 'gyroid';
    btnInfillGyroid.className = 'py-1 px-1.5 rounded-lg text-[10px] font-bold transition bg-amber-500 text-slate-950 shadow text-center';
    btnInfillGrid.className = 'py-1 px-1.5 rounded-lg text-[10px] font-bold transition text-slate-400 bg-slate-950 hover:text-white border border-slate-800 text-center';
    btnInfillSolid.className = 'py-1 px-1.5 rounded-lg text-[10px] font-bold transition text-slate-400 bg-slate-950 hover:text-white border border-slate-800 text-center';
    draw2DLayerSlice();
});

btnInfillSolid.addEventListener('click', () => {
    currentInfill = 'solid';
    btnInfillSolid.className = 'py-1 px-1.5 rounded-lg text-[10px] font-bold transition bg-amber-500 text-slate-950 shadow text-center';
    btnInfillGrid.className = 'py-1 px-1.5 rounded-lg text-[10px] font-bold transition text-slate-400 bg-slate-950 hover:text-white border border-slate-800 text-center';
    btnInfillGyroid.className = 'py-1 px-1.5 rounded-lg text-[10px] font-bold transition text-slate-400 bg-slate-950 hover:text-white border border-slate-800 text-center';
    draw2DLayerSlice();
});

btnResetCamera.addEventListener('click', () => {
    camera.position.set(0, -70, 85);
    controls.target.set(0, 0, 0);
    controls.update();
});

function draw2DLayerSlice() {
    const rect = layerCanvasWrapper.getBoundingClientRect();
    layerCanvas.width = Math.round(rect.width);
    layerCanvas.height = Math.round(rect.height);

    const ctx = layerCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, layerCanvas.width, layerCanvas.height);

    // Fondo oscuro con retícula
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    const step = 20;
    for (let x = 0; x < layerCanvas.width; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, layerCanvas.height); ctx.stroke();
    }
    for (let y = 0; y < layerCanvas.height; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(layerCanvas.width, y); ctx.stroke();
    }

    const cx = layerCanvas.width / 2;
    const cy = layerCanvas.height / 2;
    const scale = Math.min(layerCanvas.width, layerCanvas.height) * 0.015;

    ctx.save();
    ctx.translate(cx, cy);

    // Perímetro exterior
    ctx.beginPath();
    ctx.rect(-20 * scale, -22 * scale, 40 * scale, 44 * scale);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Hueco
    ctx.beginPath();
    ctx.rect(-10 * scale, -10 * scale, 20 * scale, 18 * scale);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Relleno Infill
    ctx.clip();
    if (currentInfill === 'solid') {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.fillRect(-30 * scale, -30 * scale, 60 * scale, 60 * scale);
    } else if (currentInfill === 'grid') {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        const gridGap = 12;
        for (let gx = -40 * scale; gx <= 40 * scale; gx += gridGap) {
            ctx.beginPath(); ctx.moveTo(gx, -40 * scale); ctx.lineTo(gx, 40 * scale); ctx.stroke();
        }
        for (let gy = -40 * scale; gy <= 40 * scale; gy += gridGap) {
            ctx.beginPath(); ctx.moveTo(-40 * scale, gy); ctx.lineTo(40 * scale, gy); ctx.stroke();
        }
    } else if (currentInfill === 'gyroid') {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        for (let gy = -35 * scale; gy <= 35 * scale; gy += 14) {
            ctx.beginPath();
            for (let gx = -35 * scale; gx <= 35 * scale; gx += 5) {
                const waveY = gy + Math.sin(gx * 0.15 + (currentLayer * 0.2)) * 5;
                if (gx === -35 * scale) ctx.moveTo(gx, waveY);
                else ctx.lineTo(gx, waveY);
            }
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
        geometry.center();
        geometry.computeBoundingBox();

        if (currentMesh) scene.remove(currentMesh);

        const mat = new THREE.MeshStandardMaterial({
            color: 0x06b6d4,
            roughness: 0.4,
            metalness: 0.15,
            clippingPlanes: [clipPlane],
            side: THREE.DoubleSide
        });

        currentMesh = new THREE.Mesh(geometry, mat);
        const bbox = geometry.boundingBox;
        totalHeightMm = Math.round(bbox.max.z - bbox.min.z) || 10;
        totalLayers = Math.max(10, Math.round(totalHeightMm / layerHeight));
        layerSlider.max = totalLayers;
        layerSlider.value = Math.round(totalLayers / 2);
        currentLayer = parseInt(layerSlider.value);
        currentMesh.position.z = totalHeightMm / 2;
        scene.add(currentMesh);

        updateSlicerValues();
    };
    reader.readAsArrayBuffer(file);
});

// Precarga por URL de STL
const urlParams = new URLSearchParams(window.location.search);
const stlUrl = urlParams.get('stl_url') || urlParams.get('file_url');
if (stlUrl) {
    const loader = new THREE.STLLoader();
    loader.load(stlUrl, (geometry) => {
        geometry.center();
        if (currentMesh) scene.remove(currentMesh);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x06b6d4,
            roughness: 0.4,
            clippingPlanes: [clipPlane],
            side: THREE.DoubleSide
        });
        currentMesh = new THREE.Mesh(geometry, mat);
        scene.add(currentMesh);
        updateSlicerValues();
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
