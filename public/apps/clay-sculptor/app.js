/**
 * Clay Sculptor 3D (SculptGL-Lite) · Makerdu Micro-App
 * -------------------------------------------------------
 * Motor de escultura digital en WebGL puro con deformación dinámica
 * de vértices, simetría en tiempo real y exportador binario STL.
 */

'use strict';

// =====================================================================
// ESTADO GLOBAL
// =====================================================================
const state = {
    brush: 'sculpt',       // 'sculpt', 'pinch', 'smooth', 'flatten'
    brushRadius: 14,       // mm
    intensity: 0.4,        // 0.1 a 1.0
    hasSymmetry: true,
    isSubtract: false,
    material: 'terracotta', // 'terracotta', 'plastilina', 'marble'
};

let scene, camera, renderer, controls, clayMesh, brushHelper;
let raycaster, mouse;
let isSculpting = false;

// =====================================================================
// THREE.JS SETUP
// =====================================================================
function initThree() {
    const container = document.getElementById('threeContainer');
    const width = container.clientWidth || 700;
    const height = container.clientHeight || 520;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(0, 0, 90);

    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    // Permitir rotación solo con clic derecho o botón medio
    controls.mouseButtons = {
        LEFT: null, // Reservado para esculpir
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE,
    };

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Luces de Escultura
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.6);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffedd5, 0.9);
    keyLight.position.set(40, 60, 50);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 0.4);
    rimLight.position.set(-40, -30, -40);
    scene.add(rimLight);

    // Indicador visual del radio del pincel
    const brushGeo = new THREE.RingGeometry(state.brushRadius - 0.5, state.brushRadius, 32);
    const brushMat = new THREE.MeshBasicMaterial({ color: 0xf97316, side: THREE.DoubleSide });
    brushHelper = new THREE.Mesh(brushGeo, brushMat);
    brushHelper.visible = false;
    scene.add(brushHelper);

    initClayMesh();

    // Eventos del ratón para escultura
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    window.addEventListener('resize', onWindowResize);
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
    controls.update();
    renderer.render(scene, camera);
}

// =====================================================================
// MALLA DE ARCILLA DIGITAL
// =====================================================================
const materials = {
    terracotta: new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.7, metalness: 0.05 }),
    plastilina: new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.1 }),
    marble: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.2 }),
};

function initClayMesh() {
    if (clayMesh) scene.remove(clayMesh);

    // Esfera Icosaédrica de alta resolución
    const geo = new THREE.IcosahedronGeometry(22, 4);
    geo.computeVertexNormals();

    clayMesh = new THREE.Mesh(geo, materials[state.material]);
    clayMesh.castShadow = true;
    clayMesh.receiveShadow = true;
    scene.add(clayMesh);
}

// =====================================================================
// ALGORITMOS DE DEFORMACIÓN DEL PINCEL DE ESCULTURA
// =====================================================================
function onPointerDown(event) {
    if (event.button === 0) { // Clic izquierdo
        isSculpting = true;
        sculptAtPointer(event);
    }
}

function onPointerMove(event) {
    updateBrushHelper(event);
    if (isSculpting) {
        sculptAtPointer(event);
    }
}

function onPointerUp(event) {
    if (event.button === 0) {
        isSculpting = false;
    }
}

function updateBrushHelper(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(clayMesh);

    if (intersects.length > 0) {
        const hit = intersects[0];
        brushHelper.position.copy(hit.point);
        brushHelper.lookAt(hit.point.clone().add(hit.face.normal));
        brushHelper.visible = true;
    } else {
        brushHelper.visible = false;
    }
}

function sculptAtPointer(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(clayMesh);

    if (intersects.length > 0) {
        const hit = intersects[0];
        applyBrushDeformation(hit.point, hit.face.normal);

        if (state.hasSymmetry) {
            const symCenter = new THREE.Vector3(-hit.point.x, hit.point.y, hit.point.z);
            const symNormal = new THREE.Vector3(-hit.face.normal.x, hit.face.normal.y, hit.face.normal.z);
            applyBrushDeformation(symCenter, symNormal);
        }

        clayMesh.geometry.computeVertexNormals();
        clayMesh.geometry.attributes.position.needsUpdate = true;
    }
}

function applyBrushDeformation(center, normal) {
    const pos = clayMesh.geometry.attributes.position;
    const count = pos.count;
    const r = state.brushRadius;
    const force = state.intensity * (state.isSubtract ? -1 : 1);
    const brushType = state.brush;

    const v = new THREE.Vector3();

    for (let i = 0; i < count; i++) {
        v.fromBufferAttribute(pos, i);
        const dist = v.distanceTo(center);

        if (dist < r) {
            // Curva de caída suave (Falloff cosenoidal)
            const falloff = Math.cos((dist / r) * (Math.PI / 2));

            if (brushType === 'pinch') {
                // Mueve vértices hacia el centro del pincel
                const dir = center.clone().sub(v).normalize();
                v.add(dir.multiplyScalar(force * falloff * 0.8));
            } else if (brushType === 'smooth') {
                // Promedio hacia la posición del centro
                v.lerp(center, force * falloff * 0.15);
            } else if (brushType === 'flatten') {
                // Proyecta en el plano tangente
                const planeDist = v.clone().sub(center).dot(normal);
                v.sub(normal.clone().multiplyScalar(planeDist * falloff * 0.5));
            } else {
                // Sculpt / Inflate along normal
                v.add(normal.clone().multiplyScalar(force * falloff * 0.9));
            }

            pos.setXYZ(i, v.x, v.y, v.z);
        }
    }
}

// =====================================================================
// EXPORTADOR BINARIO STL 3D
// =====================================================================
function exportBinarySTL() {
    if (!clayMesh) return null;
    const geo = clayMesh.geometry.clone().applyMatrix4(clayMesh.matrixWorld);
    const pos = geo.attributes.position;
    const index = geo.index;
    const totalTriangles = index ? index.count / 3 : pos.count / 3;

    const bufferLength = 80 + 4 + totalTriangles * 50;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const dataView = new DataView(arrayBuffer);

    const header = "Makerdu Clay Sculptor 3D STL";
    for (let i = 0; i < 80; i++) {
        dataView.setUint8(i, i < header.length ? header.charCodeAt(i) : 0);
    }
    dataView.setUint32(80, totalTriangles, true);

    let offset = 84;
    const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();
    const cb = new THREE.Vector3(), ab = new THREE.Vector3();

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

    return new Blob([arrayBuffer], { type: 'application/octet-stream' });
}

function downloadSTL() {
    const blob = exportBinarySTL();
    if (!blob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `escultura_arcilla_makerdu.stl`;
    link.click();
}

function sendToLms() {
    const blob = exportBinarySTL();
    if (!blob) return;
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = function() {
        const payload = {
            type: 'MAKERDU_MICROAPP_ASSET',
            appName: 'clay-sculptor',
            fileType: 'stl',
            fileName: `escultura_arcilla.stl`,
            content: reader.result,
            material: state.material,
        };

        if (window.parent && window.parent !== window) {
            window.parent.postMessage(payload, '*');
            alert('✅ ¡Escultura 3D enviada a la bitácora de tu escuadra!');
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

    // Brushes
    document.querySelectorAll('.btn-brush').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-brush').forEach(b => {
                b.classList.remove('border-orange-500/50', 'bg-orange-950/40', 'text-orange-300');
                b.classList.add('border-slate-800', 'bg-slate-950', 'text-slate-400');
            });
            btn.classList.add('border-orange-500/50', 'bg-orange-950/40', 'text-orange-300');
            state.brush = btn.getAttribute('data-brush');
        });
    });

    // Materials
    document.querySelectorAll('.btn-mat').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-mat').forEach(b => {
                b.classList.remove('border-orange-500/50', 'bg-orange-950/40', 'text-orange-300');
                b.classList.add('border-slate-800', 'bg-slate-950', 'text-slate-400');
            });
            btn.classList.add('border-orange-500/50', 'bg-orange-950/40', 'text-orange-300');
            state.material = btn.getAttribute('data-mat');
            clayMesh.material = materials[state.material];
        });
    });

    // Sliders
    document.getElementById('sliderRadius').addEventListener('input', e => {
        state.brushRadius = parseInt(e.target.value);
        document.getElementById('valRadius').textContent = `${state.brushRadius} mm`;
        brushHelper.geometry = new THREE.RingGeometry(state.brushRadius - 0.5, state.brushRadius, 32);
    });

    document.getElementById('sliderIntensity').addEventListener('input', e => {
        state.intensity = parseInt(e.target.value) / 100;
        document.getElementById('valIntensity').textContent = `${e.target.value}%`;
    });

    document.getElementById('checkSymmetry').addEventListener('change', e => {
        state.hasSymmetry = e.target.checked;
    });

    document.getElementById('checkSubtract').addEventListener('change', e => {
        state.isSubtract = e.target.checked;
    });

    document.getElementById('btnResetMesh').addEventListener('click', () => {
        if (confirm('¿Reiniciar la arcilla digital al estado inicial?')) {
            initClayMesh();
        }
    });

    document.getElementById('btnDownloadStl').addEventListener('click', downloadSTL);
    document.getElementById('btnSendToLms').addEventListener('click', sendToLms);
});
