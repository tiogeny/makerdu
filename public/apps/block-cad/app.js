/**
 * Block CAD 3D (Tinkercad-Lite) · Makerdu Micro-App
 * ---------------------------------------------------
 * Modelador 3D por bloques primitivos en WebGL/Three.js con plano
 * de trabajo, gizmos de transformación, sólidos/huecos y exportador STL.
 */

'use strict';

// =====================================================================
// ESTADO GLOBAL
// =====================================================================
let scene, camera, renderer, orbitControls, transformControls;
let objects = [];
let selectedObject = null;
let raycaster, mouse;
let objectCounter = 0;

function initThree() {
    const container = document.getElementById('threeContainer');
    const width = container.clientWidth || 700;
    const height = container.clientHeight || 520;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // slate-950

    camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(80, 100, 120);

    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Orbit Controls
    orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.05;

    // Transform Controls (Gizmo Mover/Rotar/Escalar)
    transformControls = new THREE.TransformControls(camera, renderer.domElement);
    transformControls.size = 0.75;
    transformControls.addEventListener('dragging-changed', function (event) {
        orbitControls.enabled = !event.value;
    });
    scene.add(transformControls);

    // Raycasting para selección con clic
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    // Luces
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.6);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    dirLight.position.set(60, 120, 80);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xec4899, 0.4);
    fillLight.position.set(-60, 40, -60);
    scene.add(fillLight);

    // Plano de Trabajo (Workplane Grid 150x150 mm)
    const grid = new THREE.GridHelper(150, 30, 0x3b82f6, 0x1e293b);
    grid.position.y = 0;
    scene.add(grid);

    window.addEventListener('resize', onWindowResize);

    // Añadir cubo demo inicial
    addShape('box');

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
    orbitControls.update();
    renderer.render(scene, camera);
}

// =====================================================================
// CREACIÓN DE FORMAS PRIMITIVAS
// =====================================================================
function addShape(type) {
    objectCounter++;
    let geo;
    const defaultColor = 0x3b82f6; // Blue Maker

    if (type === 'cylinder') {
        geo = new THREE.CylinderGeometry(10, 10, 20, 32);
        geo.translate(0, 10, 0);
    } else if (type === 'sphere') {
        geo = new THREE.SphereGeometry(10, 32, 32);
        geo.translate(0, 10, 0);
    } else if (type === 'cone') {
        geo = new THREE.ConeGeometry(10, 20, 32);
        geo.translate(0, 10, 0);
    } else if (type === 'roof') {
        geo = new THREE.CylinderGeometry(10, 10, 20, 3);
        geo.rotateZ(Math.PI / 2);
        geo.translate(0, 10, 0);
    } else if (type === 'ring') {
        geo = new THREE.TorusGeometry(10, 3, 16, 32);
        geo.rotateX(Math.PI / 2);
        geo.translate(0, 3, 0);
    } else {
        // Box
        geo = new THREE.BoxGeometry(20, 20, 20);
        geo.translate(0, 10, 0);
    }

    const mat = new THREE.MeshStandardMaterial({
        color: defaultColor,
        roughness: 0.3,
        metalness: 0.1,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = `${type.toUpperCase()} #${objectCounter}`;
    mesh.userData = {
        shapeType: type,
        isHole: false,
        originalColor: defaultColor,
    };
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Posición ligeramente desfasada para no encimarse
    mesh.position.set((Math.random() - 0.5) * 40, 0, (Math.random() - 0.5) * 40);

    scene.add(mesh);
    objects.push(mesh);

    selectObject(mesh);
    updateMetrics();
}

// =====================================================================
// SELECCIÓN & MANIPULACIÓN CON GIZMO
// =====================================================================
function onPointerDown(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(objects, false);

    if (intersects.length > 0) {
        selectObject(intersects[0].object);
    }
}

function selectObject(obj) {
    selectedObject = obj;
    transformControls.attach(obj);

    document.getElementById('selectedLabel').textContent = obj.name;

    // Actualizar estado sólido/hueco
    const isHole = obj.userData.isHole;
    document.getElementById('btnSolid').className = !isHole ? 'p-2 rounded-xl text-xs font-bold border border-blue-500/50 bg-blue-950/40 text-blue-300' : 'p-2 rounded-xl text-xs font-bold border border-slate-800 bg-slate-950 text-slate-400';
    document.getElementById('btnHole').className = isHole ? 'p-2 rounded-xl text-xs font-bold border border-rose-500/50 bg-rose-950/40 text-rose-300' : 'p-2 rounded-xl text-xs font-bold border border-slate-800 bg-slate-950 text-slate-400';
}

function setHoleMode(isHole) {
    if (!selectedObject) return;
    selectedObject.userData.isHole = isHole;

    if (isHole) {
        selectedObject.material.transparent = true;
        selectedObject.material.opacity = 0.35;
        selectedObject.material.color.setHex(0x94a3b8);
    } else {
        selectedObject.material.transparent = false;
        selectedObject.material.opacity = 1.0;
        selectedObject.material.color.setHex(selectedObject.userData.originalColor);
    }
    selectObject(selectedObject);
}

function setBlockColor(hexStr) {
    if (!selectedObject || selectedObject.userData.isHole) return;
    const hex = parseInt(hexStr.replace('#', '0x'));
    selectedObject.userData.originalColor = hex;
    selectedObject.material.color.setHex(hex);
}

function setGizmoMode(mode) {
    transformControls.setMode(mode);
    ['gizmoTranslate', 'gizmoRotate', 'gizmoScale'].forEach(id => {
        const b = document.getElementById(id);
        b.className = 'py-1.5 rounded-xl bg-slate-950 text-slate-400 hover:text-white border border-slate-800';
    });
    if (mode === 'translate') document.getElementById('gizmoTranslate').className = 'py-1.5 rounded-xl bg-blue-600 text-white font-bold';
    if (mode === 'rotate') document.getElementById('gizmoRotate').className = 'py-1.5 rounded-xl bg-blue-600 text-white font-bold';
    if (mode === 'scale') document.getElementById('gizmoScale').className = 'py-1.5 rounded-xl bg-blue-600 text-white font-bold';
}

function deleteSelected() {
    if (!selectedObject) return;
    transformControls.detach();
    scene.remove(selectedObject);
    objects = objects.filter(o => o !== selectedObject);
    selectedObject = objects.length > 0 ? objects[objects.length - 1] : null;
    if (selectedObject) selectObject(selectedObject);
    else document.getElementById('selectedLabel').textContent = 'Ninguna figura';
    updateMetrics();
}

function duplicateSelected() {
    if (!selectedObject) return;
    objectCounter++;
    const clone = selectedObject.clone();
    clone.name = `${selectedObject.userData.shapeType.toUpperCase()} #${objectCounter}`;
    clone.position.x += 10;
    clone.position.z += 10;
    clone.material = selectedObject.material.clone();
    clone.userData = { ...selectedObject.userData };

    scene.add(clone);
    objects.push(clone);
    selectObject(clone);
    updateMetrics();
}

function setBlockCamera(view) {
    if (view === 'top') camera.position.set(0, 150, 0);
    else if (view === 'front') camera.position.set(0, 30, 150);
    else camera.position.set(80, 100, 120);
    orbitControls.target.set(0, 10, 0);
    orbitControls.update();
}

// =====================================================================
// MÉTRICAS & PRE-FLIGHT
// =====================================================================
function updateMetrics() {
    const count = objects.length;
    document.getElementById('valTotalObjects').textContent = `${count} figura${count === 1 ? '' : 's'}`;
    const fc = Math.max(10, Math.round(count * 5));
    document.getElementById('valFabcoins').textContent = `${fc} FC`;
}

// =====================================================================
// EXPORTADOR BINARIO STL 3D
// =====================================================================
function exportBinarySTL() {
    const solidMeshes = objects.filter(o => !o.userData.isHole);
    if (solidMeshes.length === 0) return null;

    let totalTriangles = 0;
    solidMeshes.forEach(m => {
        const geo = m.geometry.clone().applyMatrix4(m.matrixWorld);
        totalTriangles += geo.index ? geo.index.count / 3 : geo.attributes.position.count / 3;
    });

    const bufferLength = 80 + 4 + totalTriangles * 50;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const dataView = new DataView(arrayBuffer);

    const header = "Makerdu Block CAD 3D Binary STL";
    for (let i = 0; i < 80; i++) {
        dataView.setUint8(i, i < header.length ? header.charCodeAt(i) : 0);
    }
    dataView.setUint32(80, totalTriangles, true);

    let offset = 84;
    const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();
    const cb = new THREE.Vector3(), ab = new THREE.Vector3();

    solidMeshes.forEach(m => {
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
    if (!blob) { alert('No hay figuras sólidas para exportar.'); return; }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `modelo_block_cad_makerdu.stl`;
    link.click();
}

function sendToLms() {
    const blob = exportBinarySTL();
    if (!blob) { alert('No hay figuras sólidas para exportar.'); return; }
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = function() {
        const payload = {
            type: 'MAKERDU_MICROAPP_ASSET',
            appName: 'block-cad',
            fileType: 'stl',
            fileName: `modelo_block_cad_${objects.length}_figuras.stl`,
            content: reader.result,
            objects_count: objects.length,
        };

        if (window.parent && window.parent !== window) {
            window.parent.postMessage(payload, '*');
            alert('✅ ¡Diseño 3D enviado a la bitácora de tu escuadra!');
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

    // Add shapes
    document.querySelectorAll('.btn-add-shape').forEach(btn => {
        btn.addEventListener('click', () => {
            addShape(btn.getAttribute('data-shape'));
        });
    });

    // Solid / Hole
    document.getElementById('btnSolid').addEventListener('click', () => setHoleMode(false));
    document.getElementById('btnHole').addEventListener('click', () => setHoleMode(true));

    // Gizmo modes
    document.getElementById('gizmoTranslate').addEventListener('click', () => setGizmoMode('translate'));
    document.getElementById('gizmoRotate').addEventListener('click', () => setGizmoMode('rotate'));
    document.getElementById('gizmoScale').addEventListener('click', () => setGizmoMode('scale'));

    // Colors
    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('ring-2', 'ring-white', 'scale-110'));
            dot.classList.add('ring-2', 'ring-white', 'scale-110');
            setBlockColor(dot.getAttribute('data-color'));
        });
    });

    document.getElementById('btnDuplicate').addEventListener('click', duplicateSelected);
    document.getElementById('btnDelete').addEventListener('click', deleteSelected);

    document.getElementById('btnDownloadStl').addEventListener('click', downloadSTL);
    document.getElementById('btnSendToLms').addEventListener('click', sendToLms);
});
