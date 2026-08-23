// Makerdu Standalone 3D WebGL Viewer v3.0

let scene, camera, renderer, controls, currentMesh;
let isWireframe = false;
let currentStlBlob = null;
let currentStlName = 'diseno_3d.stl';

const viewport = document.getElementById('viewport');
const stlFileInput = document.getElementById('stlFileInput');
const stlDimensions = document.getElementById('stlDimensions');
const stlVol = document.getElementById('stlVol');
const btnWireframe = document.getElementById('btnWireframe');
const btnResetView = document.getElementById('btnResetView');
const btnSendToLms = document.getElementById('btnSendToLms');

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(0, -80, 100);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    viewport.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0x06b6d4, 1.2);
    sun.position.set(60, 60, 120);
    scene.add(sun);

    const backLight = new THREE.DirectionalLight(0xa855f7, 0.8);
    backLight.position.set(-60, -60, 60);
    scene.add(backLight);

    // Bed Grid
    const grid = new THREE.GridHelper(120, 24, 0x1e293b, 0x0f172a);
    grid.rotation.x = Math.PI / 2;
    scene.add(grid);

    // Default Demo Cube / Sello
    loadDemoGeometry();

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Listen for postMessage payload from LMS
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'LOAD_STL_URL') {
            loadStlFromUrl(event.data.url);
        }
    });
}

function loadDemoGeometry() {
    const geo = new THREE.CylinderGeometry(20, 20, 8, 32);
    const mat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.3, metalness: 0.2 });
    currentMesh = new THREE.Mesh(geo, mat);
    currentMesh.rotation.x = Math.PI / 2;
    scene.add(currentMesh);
    updateDimensions(geo);
}

function updateDimensions(geometry) {
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    const sizeX = (box.max.x - box.min.x).toFixed(1);
    const sizeY = (box.max.y - box.min.y).toFixed(1);
    const sizeZ = (box.max.z - box.min.z).toFixed(1);

    stlDimensions.innerText = `${sizeX} x ${sizeY} x ${sizeZ} mm`;
    const approxVol = ((sizeX * sizeY * sizeZ) / 1000 * 0.7).toFixed(1);
    stlVol.innerText = `${approxVol} cm³`;
}

stlFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    currentStlBlob = file;
    currentStlName = file.name;

    const reader = new FileReader();
    reader.onload = (ev) => {
        const loader = new THREE.STLLoader();
        const geometry = loader.parse(ev.target.result);
        geometry.center();

        if (currentMesh) scene.remove(currentMesh);

        const material = new THREE.MeshStandardMaterial({
            color: 0x06b6d4,
            roughness: 0.3,
            metalness: 0.2,
            wireframe: isWireframe
        });

        currentMesh = new THREE.Mesh(geometry, material);
        scene.add(currentMesh);
        updateDimensions(geometry);
    };
    reader.readAsArrayBuffer(file);
});

btnWireframe.addEventListener('click', () => {
    isWireframe = !isWireframe;
    if (currentMesh) currentMesh.material.wireframe = isWireframe;
    btnWireframe.className = isWireframe
        ? 'px-2.5 py-1 rounded-lg bg-purple-950 text-purple-300 border border-purple-800 text-[11px] font-bold'
        : 'px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold';
});

btnResetView.addEventListener('click', () => {
    controls.reset();
});

btnSendToLms.addEventListener('click', () => {
    const payload = {
        type: 'MAKERDU_MICROAPP_ASSET',
        appName: 'viewer-3d',
        fileType: 'stl',
        fileName: currentStlName,
        stlDimensions: stlDimensions.innerText,
    };

    if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, '*');
    } else {
        alert('Visor 3D en modo Standalone: El modelo está centrado y listo.');
    }
});

init();
