/**
 * Pixel & Voxel Art Studio · Makerdu Micro-App
 * ----------------------------------------------------
 * Editor interactivo de Pixel Art 2D con extrusión volumétrica 3D,
 * simetría, exportador vectorial SVG para corte láser y STL 3D.
 */

'use strict';

// =====================================================================
// ESTADO GLOBAL
// =====================================================================
const state = {
    gridSize: 16,        // 8, 16, 24
    pixelSizeMm: 4.0,    // mm por píxel
    thicknessMm: 3.0,    // espesor 3D (mm)
    currentColor: '#ec4899',
    currentTool: 'pencil', // 'pencil', 'eraser', 'bucket'
    hasSymmetry: false,
    hasBackplate: true,
    hasKeyring: false,
    grid: [],            // matriz de colores [y][x]
};

// =====================================================================
// THREE.JS SETUP
// =====================================================================
let scene, camera, renderer, controls, voxelGroup;

function initThree() {
    const container = document.getElementById('threeContainer');
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 450;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // slate-950

    camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(40, 50, 70);

    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Iluminación
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.7);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(40, 80, 50);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xec4899, 0.4);
    fillLight.position.set(-40, 30, -40);
    scene.add(fillLight);

    // Grilla Maker
    const gridHelper = new THREE.GridHelper(120, 24, 0xec4899, 0x1e293b);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);

    voxelGroup = new THREE.Group();
    scene.add(voxelGroup);

    window.addEventListener('resize', onWindowResize);

    animateThree();
}

function onWindowResize() {
    const container = document.getElementById('threeContainer');
    if (!container || !renderer) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animateThree() {
    requestAnimationFrame(animateThree);
    controls.update();
    renderer.render(scene, camera);
}

function reset3DCamera() {
    camera.position.set(40, 50, 70);
    controls.target.set(0, 0, 0);
    controls.update();
}

// =====================================================================
// INICIALIZACIÓN DE LA GRILLA 2D
// =====================================================================
function initGrid(size) {
    state.gridSize = size;
    state.grid = [];
    for (let y = 0; y < size; y++) {
        const row = [];
        for (let x = 0; x < size; x++) {
            row.push(null); // transparente
        }
        state.grid.push(row);
    }
}

// Dibuja un personaje demo inicial al cargar
function loadDefaultDemo() {
    initGrid(16);
    // Cara de robot / alien retro
    const pink = '#ec4899';
    const cyan = '#22d3ee';
    const white = '#ffffff';
    const dark = '#0f172a';

    const p = [
        [5,3,pink],[10,3,pink],[5,4,pink],[10,4,pink],
        [4,5,pink],[5,5,pink],[6,5,pink],[7,5,pink],[8,5,pink],[9,5,pink],[10,5,pink],[11,5,pink],
        [3,6,pink],[4,6,pink],[5,6,cyan],[6,6,pink],[7,6,pink],[8,6,pink],[9,6,cyan],[10,6,pink],[11,6,pink],[12,6,pink],
        [3,7,pink],[4,7,pink],[5,7,dark],[6,7,pink],[7,7,pink],[8,7,pink],[9,7,dark],[10,7,pink],[11,7,pink],[12,7,pink],
        [3,8,pink],[4,8,pink],[5,8,pink],[6,8,pink],[7,8,pink],[8,8,pink],[9,8,pink],[10,8,pink],[11,8,pink],[12,8,pink],
        [4,9,pink],[5,9,pink],[6,9,white],[7,9,white],[8,9,white],[9,9,white],[10,9,pink],[11,9,pink],
        [5,10,pink],[6,10,pink],[7,10,pink],[8,10,pink],[9,10,pink],[10,10,pink],
        [4,11,cyan],[5,11,pink],[10,11,pink],[11,11,cyan],
        [3,12,cyan],[4,12,cyan],[11,12,cyan],[12,12,cyan],
    ];

    p.forEach(([x, y, color]) => {
        if (state.grid[y] && state.grid[y][x] !== undefined) {
            state.grid[y][x] = color;
        }
    });
}

function render2DGrid() {
    const gridEl = document.getElementById('pixelGrid');
    gridEl.innerHTML = '';
    const size = state.gridSize;

    gridEl.style.gridTemplateColumns = `repeat(${size}, minmax(0, 1fr))`;
    gridEl.style.width = size === 8 ? '240px' : size === 16 ? '320px' : '360px';
    gridEl.style.height = gridEl.style.width;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const cell = document.createElement('div');
            cell.className = 'pixel-cell w-full h-full bg-slate-900 border border-slate-800/40';
            cell.dataset.x = x;
            cell.dataset.y = y;

            const color = state.grid[y][x];
            if (color) {
                cell.style.backgroundColor = color;
            }

            cell.addEventListener('mousedown', () => onPixelClick(x, y));
            cell.addEventListener('mouseenter', (e) => {
                if (e.buttons === 1) onPixelClick(x, y);
            });

            gridEl.appendChild(cell);
        }
    }

    rebuild3DModel();
    updateMetrics();
}

// =====================================================================
// HERRAMIENTAS DE DIBUJO
// =====================================================================
function onPixelClick(x, y) {
    if (state.currentTool === 'bucket') {
        floodFill(x, y, state.currentColor);
    } else {
        const color = state.currentTool === 'eraser' ? null : state.currentColor;
        setPixel(x, y, color);

        if (state.hasSymmetry) {
            const symX = state.gridSize - 1 - x;
            setPixel(symX, y, color);
        }
    }
    render2DGrid();
}

function setPixel(x, y, color) {
    if (y >= 0 && y < state.gridSize && x >= 0 && x < state.gridSize) {
        state.grid[y][x] = color;
    }
}

function floodFill(startX, startY, newColor) {
    const targetColor = state.grid[startY][startX];
    if (targetColor === newColor) return;

    const queue = [[startX, startY]];
    const size = state.gridSize;

    while (queue.length > 0) {
        const [x, y] = queue.pop();
        if (x < 0 || x >= size || y < 0 || y >= size) continue;
        if (state.grid[y][x] === targetColor) {
            state.grid[y][x] = newColor;
            queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
    }
}

// =====================================================================
// RECONSTRUCCIÓN 3D VOXEL EN THREE.JS
// =====================================================================
function rebuild3DModel() {
    while (voxelGroup.children.length > 0) {
        voxelGroup.remove(voxelGroup.children[0]);
    }

    const s = state.pixelSizeMm;
    const h = state.thicknessMm;
    const size = state.gridSize;
    const offset = (size * s) / 2;

    const materials = {};

    // 1. Vóxeles de cada píxel activo
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const color = state.grid[y][x];
            if (color) {
                if (!materials[color]) {
                    materials[color] = new THREE.MeshStandardMaterial({
                        color: new THREE.Color(color),
                        roughness: 0.35,
                        metalness: 0.1,
                    });
                }

                const geo = new THREE.BoxGeometry(s - 0.1, h, s - 0.1);
                const mesh = new THREE.Mesh(geo, materials[color]);
                mesh.position.set(x * s - offset + s / 2, h / 2, y * s - offset + s / 2);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                voxelGroup.add(mesh);
            }
        }
    }

    // 2. Base de unión sólida (Backplate)
    if (state.hasBackplate) {
        let minX = size, maxX = 0, minY = size, maxY = 0, hasPixels = false;
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (state.grid[y][x]) {
                    hasPixels = true;
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }

        if (hasPixels) {
            const bpW = (maxX - minX + 1.4) * s;
            const bpH = (maxY - minY + 1.4) * s;
            const bpDepth = 1.2; // 1.2mm base
            const bpGeo = new THREE.BoxGeometry(bpW, bpDepth, bpH);
            const bpMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
            const bpMesh = new THREE.Mesh(bpGeo, bpMat);
            const bpCenterX = (minX + (maxX - minX) / 2) * s - offset + s / 2;
            const bpCenterY = (minY + (maxY - minY) / 2) * s - offset + s / 2;
            bpMesh.position.set(bpCenterX, -bpDepth / 2, bpCenterY);
            voxelGroup.add(bpMesh);
        }
    }

    // 3. Ojal para Llavero
    if (state.hasKeyring) {
        const ringMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.5 });
        const ringGeo = new THREE.TorusGeometry(3.5, 1.2, 12, 24);
        ringGeo.rotateX(Math.PI / 2);
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.set(0, h / 2, -offset - 3.5);
        voxelGroup.add(ringMesh);
    }
}

// =====================================================================
// MÉTRICAS & PRE-FLIGHT
// =====================================================================
function updateMetrics() {
    let count = 0;
    for (let y = 0; y < state.gridSize; y++) {
        for (let x = 0; x < state.gridSize; x++) {
            if (state.grid[y][x]) count++;
        }
    }

    const totalSize = (state.gridSize * state.pixelSizeMm).toFixed(1);
    document.getElementById('valDimensions').textContent = `${totalSize} × ${totalSize} × ${state.thicknessMm} mm`;
    document.getElementById('valPixelCount').textContent = `${count} píxeles (${count > 0 ? (count * 0.12).toFixed(1) : 0} g PLA)`;

    const fabcoins = Math.max(5, Math.round(count * 0.4));
    document.getElementById('valFabcoins').textContent = `${fabcoins} FC`;
}

// =====================================================================
// EXPORTADOR VECTORIAL SVG (CORTE LÁSER & VINILO)
// =====================================================================
function generateSVG() {
    const s = state.pixelSizeMm;
    const size = state.gridSize;
    const totalW = (size * s).toFixed(1);

    let paths = '';
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const color = state.grid[y][x];
            if (color) {
                const px = (x * s).toFixed(2);
                const py = (y * s).toFixed(2);
                paths += `    <rect class="pixel" x="${px}" y="${py}" width="${s.toFixed(2)}" height="${s.toFixed(2)}" fill="${color}" stroke="#000000" stroke-width="0.15" />\n`;
            }
        }
    }

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalW}" width="${totalW}mm" height="${totalW}mm">
    <!-- MAKERDU PIXEL ART VECTOR SVG -->
    <style>
        .pixel { stroke-linejoin: round; }
    </style>
${paths}
</svg>`;
    return svg;
}

function downloadSVG() {
    const svg = generateSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pixel_art_${state.gridSize}x${state.gridSize}_makerdu.svg`;
    link.click();
}

// =====================================================================
// EXPORTADOR BINARIO STL 3D
// =====================================================================
function exportBinarySTL() {
    const meshes = [];
    voxelGroup.traverse(child => {
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

    const header = "Makerdu Pixel Voxel Studio 3D STL";
    for (let i = 0; i < 80; i++) {
        dataView.setUint8(i, i < header.length ? header.charCodeAt(i) : 0);
    }
    dataView.setUint32(80, totalTriangles, true);

    let offset = 84;
    const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();
    const cb = new THREE.Vector3(), ab = new THREE.Vector3();

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
    link.download = `pixel_art_${state.gridSize}x${state.gridSize}_3d_makerdu.stl`;
    link.click();
}

function sendToLms() {
    const blob = exportBinarySTL();
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = function() {
        const payload = {
            type: 'MAKERDU_MICROAPP_ASSET',
            appName: 'pixel-art-studio',
            fileType: 'stl',
            fileName: `pixel_art_${state.gridSize}x${state.gridSize}.stl`,
            content: reader.result,
            grid_size: state.gridSize,
            pixel_size_mm: state.pixelSizeMm,
            thickness_mm: state.thicknessMm,
            has_backplate: state.hasBackplate,
            has_keyring: state.hasKeyring,
        };

        if (window.parent && window.parent !== window) {
            window.parent.postMessage(payload, '*');
            alert('✅ ¡Diseño Pixel Art enviado a la bitácora de tu escuadra!');
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
    loadDefaultDemo();
    render2DGrid();

    // Grid Sizes
    document.querySelectorAll('.btn-grid-size').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-grid-size').forEach(b => {
                b.classList.remove('bg-pink-500', 'text-slate-950', 'font-black', 'shadow-md');
                b.classList.add('text-slate-400');
            });
            btn.classList.add('bg-pink-500', 'text-slate-950', 'font-black', 'shadow-md');
            const sz = parseInt(btn.getAttribute('data-size'));
            initGrid(sz);
            render2DGrid();
        });
    });

    // Tools
    function selectTool(tool, activeBtn) {
        state.currentTool = tool;
        ['toolPencil', 'toolEraser', 'toolBucket'].forEach(id => {
            const b = document.getElementById(id);
            b.classList.remove('bg-slate-800', 'text-white');
            b.classList.add('text-slate-400');
        });
        activeBtn.classList.add('bg-slate-800', 'text-white');
        activeBtn.classList.remove('text-slate-400');
    }

    document.getElementById('toolPencil').addEventListener('click', e => selectTool('pencil', e.currentTarget));
    document.getElementById('toolEraser').addEventListener('click', e => selectTool('eraser', e.currentTarget));
    document.getElementById('toolBucket').addEventListener('click', e => selectTool('bucket', e.currentTarget));

    // Simetría
    document.getElementById('btnSymmetry').addEventListener('click', () => {
        state.hasSymmetry = !state.hasSymmetry;
        const lbl = document.getElementById('lblSymmetry');
        lbl.textContent = state.hasSymmetry ? 'ON ✨' : 'OFF';
        lbl.className = state.hasSymmetry ? 'text-pink-400 font-bold font-mono' : 'text-slate-500 font-mono';
    });

    // Paleta de Colores
    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('ring-2', 'ring-white', 'scale-110'));
            dot.classList.add('ring-2', 'ring-white', 'scale-110');
            state.currentColor = dot.getAttribute('data-color');
            selectTool('pencil', document.getElementById('toolPencil'));
        });
    });

    document.getElementById('customColorPicker').addEventListener('input', e => {
        state.currentColor = e.target.value;
        selectTool('pencil', document.getElementById('toolPencil'));
    });

    // Sliders
    document.getElementById('sliderPixelSize').addEventListener('input', e => {
        state.pixelSizeMm = parseFloat(e.target.value);
        document.getElementById('lblPixelSize').textContent = `${state.pixelSizeMm.toFixed(1)} mm`;
        rebuild3DModel();
        updateMetrics();
    });

    document.getElementById('sliderThickness').addEventListener('input', e => {
        state.thicknessMm = parseFloat(e.target.value);
        document.getElementById('lblThickness').textContent = `${state.thicknessMm.toFixed(1)} mm`;
        rebuild3DModel();
        updateMetrics();
    });

    // Checkboxes
    document.getElementById('checkBackplate').addEventListener('change', e => {
        state.hasBackplate = e.target.checked;
        rebuild3DModel();
    });

    document.getElementById('checkKeyring').addEventListener('change', e => {
        state.hasKeyring = e.target.checked;
        rebuild3DModel();
    });

    document.getElementById('btnClearGrid').addEventListener('click', () => {
        if (confirm('¿Limpiar todo el lienzo?')) {
            initGrid(state.gridSize);
            render2DGrid();
        }
    });

    document.getElementById('btnDownloadSvg').addEventListener('click', downloadSVG);
    document.getElementById('btnDownloadStl').addEventListener('click', downloadSTL);
    document.getElementById('btnSendToLms').addEventListener('click', sendToLms);
});
