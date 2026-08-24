/**
 * Makerdu Micro-App: Generador de Cajas Láser con Encastre Finger-Joint
 * -----------------------------------------------------------------------
 * Motor de generación de SVG paramétrico 100% en el navegador.
 * Exporta a SVG y DXF, e integra postMessage con el LMS Makerdu.
 */

'use strict';

// =====================================================================
// ESTADO GLOBAL
// =====================================================================
const state = {
    L: 120,   // Largo externo (mm)
    A: 80,    // Ancho externo (mm)
    H: 50,    // Alto externo (mm)
    t: 3,     // Espesor del material (mm)
    kerf: 0.1, // Compensación de ranura láser (mm)
    fingers: 5, // Número de dientes por arista
    hasLid: true,
    hasHandle: false,
    hasGrid: false,
    svgContent: '',
};

// Padding entre paneles en el SVG de plano de corte
const GAP = 8;

// =====================================================================
// UTILIDADES SVG
// =====================================================================
function mm(v) { return parseFloat(v.toFixed(4)); }

/**
 * Genera el path SVG de un panel rectangular con encastres finger-joint
 * en los bordes especificados.
 *
 * @param {number} x0 - Posición X de inicio del panel en el SVG
 * @param {number} y0 - Posición Y de inicio del panel en el SVG
 * @param {number} W  - Ancho del panel (externo)
 * @param {number} H  - Alto del panel (externo)
 * @param {object} fingers - { top: bool, bottom: bool, left: bool, right: bool }
 * @param {number} t  - Espesor del material
 * @param {number} kerf - Compensación de kerf (mm)
 * @param {number} nF - Número de dientes
 * @returns {string} - Path SVG `d` attribute string
 */
function fingerJointPanel(x0, y0, W, H, fingers, t, kerf, nF) {
    const k = kerf / 2;
    // Ancho de cada diente
    const fw_h = W / (nF * 2 - 1); // para lados horizontales
    const fw_v = H / (nF * 2 - 1); // para lados verticales
    const depth = t + k;

    let d = '';

    // Partimos desde esquina superior izquierda
    // Ajustar punto de inicio si hay fingers en top
    const startX = fingers.left ? x0 + depth : x0;
    const startY = fingers.top ? y0 : y0;

    d += `M ${mm(startX)} ${mm(startY)} `;

    // TOP edge (left to right)
    if (fingers.top) {
        // El borde top tiene encastres "macho" (dientes que sobresalen hacia arriba)
        // Para caja: el fondo no tiene dientes en top, las paredes sí
        const totalW = W - (fingers.left ? depth : 0) - (fingers.right ? depth : 0);
        const fw = totalW / (nF * 2 - 1);
        for (let i = 0; i < nF * 2 - 1; i++) {
            const seg = fw;
            if (i % 2 === 0) {
                // Diente (sobresale hacia arriba, resto permanece en y0)
                d += `h ${mm(seg)} `;
            } else {
                // Ranura (baja t)
                d += `v ${mm(-depth)} h ${mm(seg)} v ${mm(depth)} `;
            }
        }
    } else {
        d += `h ${mm(W - (fingers.left ? depth : 0) - (fingers.right ? depth : 0))} `;
    }

    // RIGHT edge (top to bottom)
    if (fingers.right) {
        const fw = H / (nF * 2 - 1);
        for (let i = 0; i < nF * 2 - 1; i++) {
            const seg = fw;
            if (i % 2 === 0) {
                d += `v ${mm(seg)} `;
            } else {
                d += `h ${mm(depth)} v ${mm(seg)} h ${mm(-depth)} `;
            }
        }
    } else {
        d += `v ${mm(H - (fingers.top ? 0 : 0) - (fingers.bottom ? 0 : 0))} `;
    }

    // BOTTOM edge (right to left)
    if (fingers.bottom) {
        const totalW = W - (fingers.left ? depth : 0) - (fingers.right ? depth : 0);
        const fw = totalW / (nF * 2 - 1);
        for (let i = 0; i < nF * 2 - 1; i++) {
            const seg = fw;
            if (i % 2 === 0) {
                d += `h ${mm(-seg)} `;
            } else {
                d += `v ${mm(depth)} h ${mm(-seg)} v ${mm(-depth)} `;
            }
        }
    } else {
        d += `h ${mm(-(W - (fingers.left ? depth : 0) - (fingers.right ? depth : 0)))} `;
    }

    // LEFT edge (bottom to top)
    if (fingers.left) {
        const fw = H / (nF * 2 - 1);
        for (let i = 0; i < nF * 2 - 1; i++) {
            const seg = fw;
            if (i % 2 === 0) {
                d += `v ${mm(-seg)} `;
            } else {
                d += `h ${mm(-depth)} v ${mm(-seg)} h ${mm(depth)} `;
            }
        }
    } else {
        d += `v ${mm(-(H))} `;
    }

    d += `Z`;
    return d;
}

// =====================================================================
// GENERADOR DE SVG PRINCIPAL
// =====================================================================
function generateSVG(s) {
    const { L, A, H, t, kerf, fingers: nF, hasLid, hasHandle, hasGrid } = s;
    const k = kerf / 2;
    const depth = t + k;

    // Layout de paneles en la plancha SVG:
    //  [BASE]   [FRENTE]   [TRASERA]
    //  [IZQUIERDA]  [DERECHA]  [TAPA?]

    // Paneles:
    // 1. Base      → L x A
    // 2. Frente    → L x H (con finger-joints top/bottom con base y tapa, left/right con laterales)
    // 3. Trasera   → L x H
    // 4. Izquierda → A x H
    // 5. Derecha   → A x H
    // 6. Tapa      → L x A (si hasLid)

    const panels = [];
    let cursorX = 10;
    let cursorY = 10;
    let maxRowH = 0;

    // ---- Fila 1 ----
    // BASE (L x A) - sin fingers en todos los bordes (encastres hacia dentro)
    panels.push({
        id: 'base', label: 'BASE',
        x: cursorX, y: cursorY, W: L, H: A,
        f: { top: false, bottom: false, left: false, right: false },
        color: '#a855f7'
    });
    cursorX += L + GAP;
    maxRowH = Math.max(maxRowH, A);

    // FRENTE (L x H)
    panels.push({
        id: 'front', label: 'FRENTE',
        x: cursorX, y: cursorY, W: L, H: H,
        f: { top: true, bottom: true, left: true, right: true },
        color: '#a855f7'
    });
    cursorX += L + GAP;
    maxRowH = Math.max(maxRowH, H);

    // TRASERA (L x H)
    panels.push({
        id: 'back', label: 'TRASERA',
        x: cursorX, y: cursorY, W: L, H: H,
        f: { top: true, bottom: true, left: true, right: true },
        color: '#a855f7'
    });
    maxRowH = Math.max(maxRowH, H);

    // ---- Fila 2 ----
    cursorX = 10;
    cursorY += maxRowH + GAP * 2;
    maxRowH = 0;

    // IZQUIERDA (A x H)
    panels.push({
        id: 'left', label: 'IZQ',
        x: cursorX, y: cursorY, W: A, H: H,
        f: { top: false, bottom: false, left: false, right: false },
        color: '#a855f7'
    });
    cursorX += A + GAP;
    maxRowH = Math.max(maxRowH, H);

    // DERECHA (A x H)
    panels.push({
        id: 'right', label: 'DER',
        x: cursorX, y: cursorY, W: A, H: H,
        f: { top: false, bottom: false, left: false, right: false },
        color: '#a855f7'
    });
    cursorX += A + GAP;
    maxRowH = Math.max(maxRowH, H);

    // TAPA (L x A) si hasLid
    if (hasLid) {
        panels.push({
            id: 'lid', label: 'TAPA',
            x: cursorX, y: cursorY, W: L, H: A,
            f: { top: false, bottom: false, left: false, right: false },
            color: '#a855f7'
        });
        maxRowH = Math.max(maxRowH, A);
    }

    // Dimensiones del SVG canvas
    const svgW = 10 + (L + GAP) * 3 + 10;
    const svgH = cursorY + maxRowH + 20;

    // Construir SVG
    let svgPaths = '';

    for (const p of panels) {
        // Path del panel con finger-joints
        const pathD = fingerJointPanel(p.x, p.y, p.W, p.H, p.f, t, kerf, nF);
        svgPaths += `<path d="${pathD}" stroke="${p.color}" fill="none" stroke-width="0.3" class="cut" />\n`;

        // Etiqueta del panel (grabado/referencia)
        const cx = p.x + p.W / 2;
        const cy = p.y + p.H / 2;
        svgPaths += `<text x="${mm(cx)}" y="${mm(cy)}" text-anchor="middle" dominant-baseline="middle" font-size="4" fill="#f97316" font-family="monospace" class="engrave">${p.label}\n${mm(p.W)}×${mm(p.H)}mm</text>\n`;

        // Cotas (dimensiones)
        svgPaths += `<line x1="${mm(p.x)}" y1="${mm(p.y + p.H + 3)}" x2="${mm(p.x + p.W)}" y2="${mm(p.y + p.H + 3)}" stroke="#f97316" stroke-width="0.15" />\n`;
    }

    // Orificio de agarre en el FRENTE
    if (hasHandle) {
        const fp = panels.find(p => p.id === 'front');
        if (fp) {
            const hcx = fp.x + fp.W / 2;
            const hcy = fp.y + fp.H / 2;
            svgPaths += `<circle cx="${mm(hcx)}" cy="${mm(hcy)}" r="7.5" stroke="#a855f7" fill="none" stroke-width="0.3" class="cut" />\n`;
        }
    }

    // Grilla de referencia
    if (hasGrid) {
        for (let gx = 10; gx < svgW; gx += 10) {
            svgPaths += `<line x1="${gx}" y1="0" x2="${gx}" y2="${svgH}" stroke="#1e293b" stroke-width="0.1" />\n`;
        }
        for (let gy = 10; gy < svgH; gy += 10) {
            svgPaths += `<line x1="0" y1="${gy}" x2="${svgW}" y2="${gy}" stroke="#1e293b" stroke-width="0.1" />\n`;
        }
    }

    // Información de fabricación en el SVG
    const info = `Makerdu Box Generator | L:${L}×A:${A}×H:${H}mm | t:${t}mm | kerf:${kerf}mm | fingers:${nF} | ${new Date().toLocaleDateString('es-PE')}`;
    svgPaths += `<text x="10" y="${mm(svgH - 5)}" font-size="2.5" fill="#475569" font-family="monospace">${info}</text>\n`;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${mm(svgW)}mm" height="${mm(svgH)}mm"
     viewBox="0 0 ${mm(svgW)} ${mm(svgH)}"
     style="background:white;">
  <title>Caja Makerdu ${L}x${A}x${H}mm - Finger Joint Box</title>
  <desc>Generado por Makerdu Box Generator. Material: ${t}mm. Kerf: ${kerf}mm.</desc>
  ${svgPaths}
</svg>`;

    return { svg, svgW, svgH, panels };
}

// =====================================================================
// CÁLCULO DE MÉTRICAS DE FABRICACIÓN
// =====================================================================
function calcMetrics(s) {
    const { L, A, H, t, hasLid } = s;
    // Área total de corte en cm²
    const panels = [
        L * A,       // base
        L * H * 2,   // frente + trasera
        A * H * 2,   // izq + der
    ];
    if (hasLid) panels.push(L * A);
    const totalAreaMm2 = panels.reduce((a, b) => a + b, 0);
    const totalAreaCm2 = totalAreaMm2 / 100;

    // Longitud de corte estimada (perimetro total de todos los paneles)
    const perimBase = 2 * (L + A);
    const perimFB = 2 * (L + H) * 2;
    const perimLR = 2 * (A + H) * 2;
    const totalLen = perimBase + perimFB + perimLR + (hasLid ? perimBase : 0);
    const totalLenM = (totalLen / 1000).toFixed(3);

    // Material en plancha (cuadrado de material requerido mínimo)
    const sheetW = Math.max(L * 3 + 30, 200);
    const sheetH = Math.max(A + H + 40, 150);
    const sheetCm2 = (sheetW * sheetH) / 100;

    // Costo en FabCoins (base: 5 FC por cada 100cm² + 2 FC base)
    const fabCoins = Math.ceil(totalAreaCm2 / 100 * 5 + 2);

    return {
        areaCm2: totalAreaCm2.toFixed(1),
        lenM: totalLenM,
        sheetCm2: sheetCm2.toFixed(0),
        fabCoins,
    };
}

// =====================================================================
// RENDER AL DOM
// =====================================================================
function render() {
    const result = generateSVG(state);
    state.svgContent = result.svg;

    // Render en contenedor
    const container = document.getElementById('svgContainer');
    const placeholder = document.getElementById('svgPlaceholder');
    if (placeholder) placeholder.style.display = 'none';

    // Crear/actualizar visor SVG inline
    const scale = Math.min(
        (container.clientWidth - 20) / result.svgW,
        (container.clientHeight - 20 || 400) / result.svgH,
        2
    );

    container.innerHTML = `<div style="transform: scale(${scale}); transform-origin: top left;">
        ${result.svg.replace('<?xml version="1.0" encoding="UTF-8"?>', '').replace(/style="background:white;"/, 'style="background:white; display:block;"')}
    </div>`;

    // Métricas
    const m = calcMetrics(state);
    document.getElementById('metricArea').textContent = `${m.areaCm2} cm²`;
    document.getElementById('metricLen').textContent = `${m.lenM} m`;
    document.getElementById('metricMat').textContent = `${m.sheetCm2} cm²`;
    document.getElementById('metricFC').textContent = `${m.fabCoins} FC`;
}

// =====================================================================
// BINDING DE CONTROLES
// =====================================================================
function bindSlider(id, stateKey, labelId, unit = ' mm', decimals = 0) {
    const slider = document.getElementById(id);
    const label = document.getElementById(labelId);
    if (!slider || !label) return;

    slider.addEventListener('input', () => {
        const val = parseFloat(slider.value);
        state[stateKey] = val;
        label.textContent = decimals > 0 ? `${val.toFixed(decimals)} ${unit}` : `${val} ${unit}`;
        render();
    });
}

function bindCheckbox(id, stateKey) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
        state[stateKey] = el.checked;
        render();
    });
}

// Material presets
const PRESETS = {
    mdf3:  { t: 3,   kerf: 0.10 },
    mdf6:  { t: 6,   kerf: 0.15 },
    acr3:  { t: 3,   kerf: 0.08 },
    acr4:  { t: 4,   kerf: 0.10 },
    ply4:  { t: 4,   kerf: 0.12 },
    ply6:  { t: 6,   kerf: 0.18 },
    card:  { t: 2,   kerf: 0.05 },
};

document.getElementById('materialPreset').addEventListener('change', (e) => {
    const p = PRESETS[e.target.value];
    if (!p) return;
    state.t = p.t;
    state.kerf = p.kerf;
    document.getElementById('sliderT').value = p.t;
    document.getElementById('valT').textContent = `${p.t.toFixed(1)} mm`;
    document.getElementById('sliderK').value = p.kerf;
    document.getElementById('valK').textContent = `${p.kerf.toFixed(2)} mm`;
    render();
});

// =====================================================================
// EXPORTACIÓN SVG
// =====================================================================
function downloadSVG() {
    if (!state.svgContent) { alert('Genera el diseño primero.'); return; }
    const blob = new Blob([state.svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caja_makerdu_${state.L}x${state.A}x${state.H}mm.svg`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
}

// Exportación DXF básica (sólo líneas de outline, compatible con LaserGRBL)
function downloadDXF() {
    if (!state.svgContent) { alert('Genera el diseño primero.'); return; }
    const { L, A, H, t } = state;
    let dxf = `0\nSECTION\n2\nENTITIES\n`;
    // Para simplificar: exportamos la base y el frente como rectángulos DXF básicos
    const addRect = (x, y, w, h) => {
        dxf += `0\nLWPOLYLINE\n8\nCORTE\n70\n1\n90\n4\n`;
        [[x,y],[x+w,y],[x+w,y+h],[x,y+h]].forEach(([px, py]) => {
            dxf += `10\n${px.toFixed(4)}\n20\n${py.toFixed(4)}\n30\n0.0\n`;
        });
    };
    // Paneles simplificados en DXF
    addRect(0, 0, L, A);
    addRect(L + 5, 0, L, H);
    addRect((L + 5) * 2, 0, L, H);
    addRect(0, A + 5, A, H);
    addRect(A + 5, A + 5, A, H);
    if (state.hasLid) addRect((A + 5) * 2, A + 5, L, A);
    dxf += `0\nENDSEC\n0\nEOF\n`;

    const blob = new Blob([dxf], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caja_makerdu_${state.L}x${state.A}x${state.H}mm.dxf`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
}

// =====================================================================
// POSTMESSAGE → LMS MAKERDU
// =====================================================================
function sendToLms() {
    if (!state.svgContent) { alert('Genera el diseño primero ajustando los parámetros.'); return; }
    const metrics = calcMetrics(state);
    const payload = {
        type: 'MAKERDU_MICROAPP_ASSET',
        appName: 'box-generator',
        fileType: 'svg',
        fileName: `caja_makerdu_${state.L}x${state.A}x${state.H}mm.svg`,
        content: state.svgContent,
        // Parámetros de fabricación para la Bitácora
        box_L_mm: state.L,
        box_A_mm: state.A,
        box_H_mm: state.H,
        material_thickness_mm: state.t,
        kerf_mm: state.kerf,
        has_lid: state.hasLid,
        area_cm2: parseFloat(metrics.areaCm2),
        fabcoins_cost: metrics.fabCoins,
        cut_length_m: parseFloat(metrics.lenM),
    };

    if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, '*');
    } else {
        // Fallback standalone: descargar el SVG
        downloadSVG();
    }
}

// =====================================================================
// INIT
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
    bindSlider('sliderL', 'L', 'valL', 'mm');
    bindSlider('sliderA', 'A', 'valA', 'mm');
    bindSlider('sliderH', 'H', 'valH', 'mm');
    bindSlider('sliderT', 't', 'valT', 'mm', 1);
    bindSlider('sliderK', 'kerf', 'valK', 'mm', 2);
    bindSlider('sliderF', 'fingers', 'valF', '');

    bindCheckbox('checkLid', 'hasLid');
    bindCheckbox('checkHandle', 'hasHandle');
    bindCheckbox('checkGrid', 'hasGrid');

    document.getElementById('btnDownloadSvg').addEventListener('click', downloadSVG);
    document.getElementById('btnDownloadDxf').addEventListener('click', downloadDXF);
    document.getElementById('btnSendToLms').addEventListener('click', sendToLms);

    // Render inicial
    render();
});
