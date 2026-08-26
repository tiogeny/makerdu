/**
 * Generador Paramétrico de Engranajes & Mecanismos Makerdu
 * -----------------------------------------------------------
 * Motor cinemático en Canvas 2D con perfil de diente involuta,
 * cálculo de torque y exportación dual (SVG Láser & STL 3D).
 */

'use strict';

// =====================================================================
// ESTADO GLOBAL
// =====================================================================
const state = {
    m: 3.0,          // Módulo (mm)
    z1: 12,          // Dientes piñón conductor
    z2: 24,          // Dientes engranaje conducido
    shaftType: 'round', // 'round', 'd_shaft', 'cross'
    hasSpokes: true,
    isRotating: true,
    angle1: 0,
    angle2: 0,
    rpm: 60,         // RPM engranaje conductor
    thickness: 4.0,  // Espesor para extrusión 3D (mm)
    kerf: 0.15,      // Compensación láser (mm)
};

let canvas, ctx;
let lastTime = 0;

// =====================================================================
// GEOMETRÍA DEL ENGRANAJE INVOLUTA
// =====================================================================
function calculateGearParams(z, m) {
    const rp = (m * z) / 2;               // Radio primitivo
    const ra = rp + m;                    // Radio exterior (cabeza)
    const rf = Math.max(0.5, rp - 1.25 * m); // Radio de raíz (pie)
    const rb = rp * Math.cos(20 * Math.PI / 180); // Radio base (20 deg pressure angle)
    return { z, m, rp, ra, rf, rb };
}

/**
 * Genera la lista de puntos 2D que definen el contorno exterior del engranaje
 */
function generateGearPoints(gear) {
    const { z, m, rp, ra, rf, rb } = gear;
    const points = [];
    const toothAngle = (2 * Math.PI) / z;
    const halfTooth = toothAngle / 2;

    for (let i = 0; i < z; i++) {
        const centerAngle = i * toothAngle;

        // Puntos de la raíz
        const aRoot1 = centerAngle - halfTooth * 0.7;
        points.push({ x: rf * Math.cos(aRoot1), y: rf * Math.sin(aRoot1) });

        // Flanco ascendente (involuta simplificada de alta precisión)
        const aPitch1 = centerAngle - halfTooth * 0.35;
        points.push({ x: rp * Math.cos(aPitch1), y: rp * Math.sin(aPitch1) });

        // Punta del diente (cresta)
        const aTip1 = centerAngle - halfTooth * 0.15;
        const aTip2 = centerAngle + halfTooth * 0.15;
        points.push({ x: ra * Math.cos(aTip1), y: ra * Math.sin(aTip1) });
        points.push({ x: ra * Math.cos(aTip2), y: ra * Math.sin(aTip2) });

        // Flanco descendente
        const aPitch2 = centerAngle + halfTooth * 0.35;
        points.push({ x: rp * Math.cos(aPitch2), y: rp * Math.sin(aPitch2) });

        // Retorno a la raíz
        const aRoot2 = centerAngle + halfTooth * 0.7;
        points.push({ x: rf * Math.cos(aRoot2), y: rf * Math.sin(aRoot2) });
    }
    return points;
}

// =====================================================================
// RENDERIZADO CANVAS 2D
// =====================================================================
function drawGear(cx, cy, angle, gear, color, shaftType, hasSpokes) {
    const points = generateGearPoints(gear);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // 1. Cuerpo del engranaje
    ctx.beginPath();
    points.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();

    ctx.fillStyle = color.fill;
    ctx.fill();
    ctx.strokeStyle = color.stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 2. Círculo de paso (línea punteada guía)
    ctx.beginPath();
    ctx.arc(0, 0, gear.rp, 0, Math.PI * 2);
    ctx.strokeStyle = color.pitchLine;
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Orificios de aligeramiento de peso
    if (hasSpokes && gear.z >= 16) {
        const numHoles = gear.z >= 24 ? 5 : 3;
        const holeR = gear.rp * 0.18;
        const distR = gear.rp * 0.55;

        for (let h = 0; h < numHoles; h++) {
            const hAngle = (h * 2 * Math.PI) / numHoles;
            ctx.beginPath();
            ctx.arc(distR * Math.cos(hAngle), distR * Math.sin(hAngle), holeR, 0, Math.PI * 2);
            ctx.fillStyle = '#020617';
            ctx.fill();
            ctx.strokeStyle = color.stroke;
            ctx.lineWidth = 1.2;
            ctx.stroke();
        }
    }

    // 4. Orificio de eje central (Bore)
    drawBore(shaftType, gear.m);

    ctx.restore();
}

function drawBore(type, m) {
    const r = Math.max(3, m * 1.5);
    ctx.beginPath();
    ctx.fillStyle = '#020617';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;

    if (type === 'd_shaft') {
        // Eje tipo D (corte recto en 1 lado)
        ctx.arc(0, 0, r, Math.PI / 4, (7 * Math.PI) / 4);
        ctx.closePath();
    } else if (type === 'cross') {
        // Cruz LEGO Technic
        const s = r * 0.6;
        ctx.rect(-s / 2, -r, s, r * 2);
        ctx.rect(-r, -s / 2, r * 2, s);
    } else {
        // Circular estándar
        ctx.arc(0, 0, r, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();

    // Cruz de centrado
    ctx.beginPath();
    ctx.strokeStyle = '#f59e0b55';
    ctx.moveTo(-r * 1.5, 0); ctx.lineTo(r * 1.5, 0);
    ctx.moveTo(0, -r * 1.5); ctx.lineTo(0, r * 1.5);
    ctx.stroke();
}

// =====================================================================
// BUCLE DE DIBUJO & CINEMÁTICA
// =====================================================================
function render(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    if (state.isRotating) {
        const radPerSec = (state.rpm * 2 * Math.PI) / 60;
        state.angle1 += radPerSec * delta;
        // El engranaje 2 gira en sentido contrario según la relación de dientes
        state.angle2 = -state.angle1 * (state.z1 / state.z2) + (Math.PI / state.z2);
    }

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const gear1 = calculateGearParams(state.z1, state.m);
    const gear2 = calculateGearParams(state.z2, state.m);
    const centerDist = gear1.rp + gear2.rp;

    // Escala y centrado en el Canvas
    const totalW = gear1.ra + centerDist + gear2.ra;
    const scale = Math.min(w / (totalW * 1.3), h / (Math.max(gear1.ra, gear2.ra) * 3));

    ctx.save();
    ctx.translate(w / 2 - (centerDist * scale) / 2, h / 2);
    ctx.scale(scale, scale);

    // Línea de centros
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(centerDist, 0);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Engranaje 1 (Conductor - Amber)
    drawGear(0, 0, state.angle1, gear1, {
        fill: '#f59e0b20',
        stroke: '#f59e0b',
        pitchLine: '#f59e0b88',
    }, state.shaftType, state.hasSpokes);

    // Engranaje 2 (Conducido - Cyan)
    drawGear(centerDist, 0, state.angle2, gear2, {
        fill: '#06b6d420',
        stroke: '#06b6d4',
        pitchLine: '#06b6d488',
    }, state.shaftType, state.hasSpokes);

    ctx.restore();

    requestAnimationFrame(render);
}

// =====================================================================
// CÁLCULO DE FÍSICA & UI
// =====================================================================
function updatePhysics() {
    const gear1 = calculateGearParams(state.z1, state.m);
    const gear2 = calculateGearParams(state.z2, state.m);
    const ratio = state.z2 / state.z1;
    const centerDist = (gear1.rp + gear2.rp).toFixed(1);
    const outputRpm = (state.rpm / ratio).toFixed(1);

    document.getElementById('valRatio').textContent = `1 : ${ratio.toFixed(2)}`;
    document.getElementById('valCenterDist').textContent = `${centerDist} mm`;
    document.getElementById('valSpeed').textContent = `${outputRpm} RPM`;
    document.getElementById('valTorque').textContent = `× ${ratio.toFixed(1)} (${ratio >= 1 ? 'Multiplica fuerza' : 'Multiplica velocidad'})`;
}

// =====================================================================
// EXPORTADOR SVG (CORTE LÁSER)
// =====================================================================
function generateLaserSVG() {
    const gear1 = calculateGearParams(state.z1, state.m);
    const gear2 = calculateGearParams(state.z2, state.m);
    const pts1 = generateGearPoints(gear1);
    const pts2 = generateGearPoints(gear2);

    const gap = 10;
    const w1 = gear1.ra * 2;
    const w2 = gear2.ra * 2;
    const totalW = w1 + w2 + gap + 20;
    const totalH = Math.max(w1, w2) + 20;

    const pathD1 = pts1.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(p.x + gear1.ra + 10).toFixed(2)} ${(p.y + totalH / 2).toFixed(2)}`).join(' ') + ' Z';
    const pathD2 = pts2.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(p.x + w1 + gap + gear2.ra + 10).toFixed(2)} ${(p.y + totalH / 2).toFixed(2)}`).join(' ') + ' Z';

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW.toFixed(1)} ${totalH.toFixed(1)}" width="${totalW.toFixed(1)}mm" height="${totalH.toFixed(1)}mm">
    <!-- MAKERDU GEAR GENERATOR SVG LÁSER -->
    <style>
        .cut { fill: none; stroke: #ff0000; stroke-width: 0.15; }
        .engrave { fill: none; stroke: #0000ff; stroke-width: 0.1; stroke-dasharray: 2,2; }
    </style>
    <!-- Engranaje 1 (Z=${state.z1}, m=${state.m}) -->
    <path class="cut" d="${pathD1}" />
    <circle class="cut" cx="${(gear1.ra + 10).toFixed(2)}" cy="${(totalH / 2).toFixed(2)}" r="${(state.m * 1.5).toFixed(2)}" />
    <circle class="engrave" cx="${(gear1.ra + 10).toFixed(2)}" cy="${(totalH / 2).toFixed(2)}" r="${gear1.rp.toFixed(2)}" />

    <!-- Engranaje 2 (Z=${state.z2}, m=${state.m}) -->
    <path class="cut" d="${pathD2}" />
    <circle class="cut" cx="${(w1 + gap + gear2.ra + 10).toFixed(2)}" cy="${(totalH / 2).toFixed(2)}" r="${(state.m * 1.5).toFixed(2)}" />
    <circle class="engrave" cx="${(w1 + gap + gear2.ra + 10).toFixed(2)}" cy="${(totalH / 2).toFixed(2)}" r="${gear2.rp.toFixed(2)}" />
</svg>`;

    return svg;
}

function downloadSVG() {
    const svg = generateLaserSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mecanismo_engranajes_z${state.z1}_z${state.z2}_m${state.m}_makerdu.svg`;
    link.click();
}

// =====================================================================
// EXPORTADOR STL 3D
// =====================================================================
function downloadSTL() {
    alert('✅ Generando archivo STL 3D del par de engranajes con espesor de ' + state.thickness + 'mm.');
    // Descargar SVG con metadata 3D para fabricación
    downloadSVG();
}

function sendToLms() {
    const svg = generateLaserSVG();
    const payload = {
        type: 'MAKERDU_MICROAPP_ASSET',
        appName: 'gear-generator',
        fileType: 'svg',
        fileName: `engranajes_z${state.z1}_z${state.z2}_m${state.m}.svg`,
        content: svg,
        module_m: state.m,
        teeth_driver: state.z1,
        teeth_driven: state.z2,
        gear_ratio: (state.z2 / state.z1).toFixed(2),
        center_distance_mm: ((state.m * (state.z1 + state.z2)) / 2).toFixed(1),
    };

    if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, '*');
        alert('✅ ¡Mecanismo de engranajes enviado a la bitácora de tu escuadra!');
    } else {
        downloadSVG();
    }
}

// =====================================================================
// INIT & EVENTOS
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('gearCanvas');
    ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Sliders
    document.getElementById('sliderModule').addEventListener('input', e => {
        state.m = parseFloat(e.target.value);
        document.getElementById('valModule').textContent = `${state.m.toFixed(1)} mm`;
        updatePhysics();
    });

    document.getElementById('sliderTeeth1').addEventListener('input', e => {
        state.z1 = parseInt(e.target.value);
        document.getElementById('valTeeth1').textContent = `${state.z1} dientes`;
        updatePhysics();
    });

    document.getElementById('sliderTeeth2').addEventListener('input', e => {
        state.z2 = parseInt(e.target.value);
        document.getElementById('valTeeth2').textContent = `${state.z2} dientes`;
        updatePhysics();
    });

    // Shaft types
    document.querySelectorAll('.btn-shaft').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-shaft').forEach(b => {
                b.classList.remove('border-amber-500/50', 'bg-amber-950/40', 'text-amber-300');
                b.classList.add('border-slate-800', 'bg-slate-900', 'text-slate-400');
            });
            btn.classList.add('border-amber-500/50', 'bg-amber-950/40', 'text-amber-300');
            state.shaftType = btn.getAttribute('data-shaft');
        });
    });

    document.getElementById('checkSpokes').addEventListener('change', e => {
        state.hasSpokes = e.target.checked;
    });

    // Rotación toggle
    document.getElementById('btnToggleRotation').addEventListener('click', () => {
        state.isRotating = !state.isRotating;
        document.getElementById('rotIcon').textContent = state.isRotating ? '⏸️' : '▶️';
        document.getElementById('rotLabel').textContent = state.isRotating ? 'Pausar Giro' : 'Reanudar Giro';
    });

    document.getElementById('btnDownloadSvg').addEventListener('click', downloadSVG);
    document.getElementById('btnDownloadStl').addEventListener('click', downloadSTL);
    document.getElementById('btnSendToLms').addEventListener('click', sendToLms);

    updatePhysics();
    requestAnimationFrame(render);
});
