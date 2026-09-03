
// Lienzo Maker 2D - Motor Unificado (Plumón, Armador Digitoys, Pixel Art)

const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const statusEl = document.getElementById('canvas-status');
const guideOverlay = document.getElementById('base-guide-overlay');

// Estado global
let currentMode = 'brush'; // 'brush' | 'builder' | 'pixel'
let currentTool = 'pen'; // 'pen' | 'eraser'
let brushSize = 14;
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let history = [];
let historyIndex = -1;
let showGuide = true;

// Grid Pixel Art (24 x 24)
const PIXEL_COLS = 24;
const PIXEL_ROWS = 24;
let pixelGrid = Array.from({ length: PIXEL_ROWS }, () => Array(PIXEL_COLS).fill(0));
let pixelTool = 'pen'; // 'pen' | 'eraser'

// Catálogo Digitoys (Inspirado en DIGITOYS-construccion.pdf)
const DIGITOYS_CATALOG = {
  bodies: [
    { id: 'dino', name: 'Dino Feliz', icon: '🦖', draw: drawDinoBody },
    { id: 'robot', name: 'Robot Maker', icon: '🤖', draw: drawRobotBody },
    { id: 'monster', name: 'Monstruo Redondo', icon: '👾', draw: drawMonsterBody },
    { id: 'alien', name: 'Marciano Antena', icon: '👽', draw: drawAlienBody },
    { id: 'bear', name: 'Oso Robusto', icon: '🐻', draw: drawBearBody }
  ],
  eyes: [
    { id: 'circle_pupil', name: 'Ojo con Pupila', icon: '👁️', draw: drawEyePupil },
    { id: 'wink', name: 'Guiño Feliz', icon: '😉', draw: drawEyeWink },
    { id: 'triangle', name: 'Ojo Triángulo', icon: '🔺', draw: drawEyeTriangle },
    { id: 'cross', name: 'Ojo en Cruz', icon: '✖️', draw: drawEyeCross }
  ],
  mouths: [
    { id: 'smile_open', name: 'Sonrisa Abierta', icon: '😃', draw: drawMouthOpen },
    { id: 'crescent', name: 'Sonrisa Media Luna', icon: '🌙', draw: drawMouthCrescent },
    { id: 'square', name: 'Boca Cuadrada', icon: '🟩', draw: drawMouthSquare },
    { id: 'fangs', name: 'Sonrisa Colmillos', icon: '🧛', draw: drawMouthFangs }
  ]
};

// ==========================================
// INICIALIZACIÓN
// ==========================================
function init() {
  clearCanvas(false);
  saveState();
  initEvents();
  renderBuilderCatalog('bodies');
  syncTheme();
}

function clearCanvas(save = true) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 0, canvas.width, canvas.height);
  pixelGrid = Array.from({ length: PIXEL_ROWS }, () => Array(PIXEL_COLS).fill(0));
  if (save) saveState();
}

// Guardar estado en historial
function saveState() {
  if (historyIndex < history.length - 1) {
    history = history.slice(0, historyIndex + 1);
  }
  history.push(canvas.toDataURL());
  historyIndex = history.length - 1;
  statusEl.textContent = 'Trazo guardado (' + (historyIndex + 1) + ')';
}

function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      statusEl.textContent = 'Deshacer aplicado';
    };
    img.src = history[historyIndex];
  }
}

// ==========================================
// EVENTOS Y PESTAÑAS DE MODO
// ==========================================
function initEvents() {
  // Tabs de modo
  document.getElementById('tab-brush').onclick = () => switchMode('brush');
  document.getElementById('tab-builder').onclick = () => switchMode('builder');
  document.getElementById('tab-pixel').onclick = () => switchMode('pixel');

  // Herramientas de Plumón
  document.getElementById('tool-pen').onclick = () => setBrushTool('pen');
  document.getElementById('tool-eraser').onclick = () => setBrushTool('eraser');

  // Selector de tamaños
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      brushSize = parseInt(btn.dataset.size);
    };
  });

  // Selector de categorías del Armador
  document.querySelectorAll('.builder-cat-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.builder-cat-btn').forEach(b => {
        b.classList.remove('active', 'bg-cyan-500', 'text-slate-950');
        b.classList.add('text-slate-400');
      });
      btn.classList.add('active', 'bg-cyan-500', 'text-slate-950');
      btn.classList.remove('text-slate-400');
      renderBuilderCatalog(btn.dataset.cat);
    };
  });

  // Pixel Art Tools
  document.getElementById('pixel-tool-draw').onclick = () => setPixelTool('pen');
  document.getElementById('pixel-tool-erase').onclick = () => setPixelTool('eraser');

  // Botones de acción general
  document.getElementById('btn-undo').onclick = undo;
  document.getElementById('btn-clear').onclick = () => clearCanvas(true);
  document.getElementById('btn-toggle-guide').onclick = toggleGuide;
  document.getElementById('btn-theme-toggle').onclick = toggleTheme;
  document.getElementById('btn-export').onclick = exportBoceto;

  // Eventos de dibujo en Canvas (Ratón y Touch)
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseleave', stopDrawing);

  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', stopDrawing);

  // Atajos de teclado (Ctrl+Z)
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      undo();
    }
  });
}

function switchMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + mode).classList.add('active');

  document.getElementById('tools-brush').classList.toggle('hidden', mode !== 'brush');
  document.getElementById('tools-builder').classList.toggle('hidden', mode !== 'builder');
  document.getElementById('tools-pixel').classList.toggle('hidden', mode !== 'pixel');

  if (mode === 'pixel') {
    renderPixelGridOnCanvas();
  }
}

function setBrushTool(tool) {
  currentTool = tool;
  document.querySelectorAll('#tools-brush .tool-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tool-' + tool).classList.add('active');
}

function setPixelTool(tool) {
  pixelTool = tool;
  document.querySelectorAll('#tools-pixel .tool-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('pixel-tool-' + (tool === 'pen' ? 'draw' : 'erase')).classList.add('active');
}

function toggleGuide() {
  showGuide = !showGuide;
  guideOverlay.style.opacity = showGuide ? '1' : '0';
}

// ==========================================
// DIBUJO CON PLUMÓN LIBRE
// ==========================================
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

function startDrawing(e) {
  if (currentMode === 'pixel') {
    paintPixel(e);
    isDrawing = true;
    return;
  }

  isDrawing = true;
  const pos = getPos(e);
  lastX = pos.x;
  lastY = pos.y;
}

function draw(e) {
  if (!isDrawing) return;

  if (currentMode === 'pixel') {
    paintPixel(e);
    return;
  }

  const pos = getPos(e);

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(pos.x, pos.y);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = brushSize;
  ctx.strokeStyle = currentTool === 'pen' ? '#000000' : '#ffffff';
  ctx.stroke();

  lastX = pos.x;
  lastY = pos.y;
}

function stopDrawing() {
  if (isDrawing) {
    isDrawing = false;
    saveState();
  }
}

function handleTouchStart(e) {
  e.preventDefault();
  const touch = e.touches[0];
  startDrawing(touch);
}

function handleTouchMove(e) {
  e.preventDefault();
  const touch = e.touches[0];
  draw(touch);
}

// ==========================================
// MODO PIXEL ART
// ==========================================
function paintPixel(e) {
  const pos = getPos(e);
  const cellW = canvas.width / PIXEL_COLS;
  const cellH = canvas.height / PIXEL_ROWS;

  const col = Math.floor(pos.x / cellW);
  const row = Math.floor(pos.y / cellH);

  if (col >= 0 && col < PIXEL_COLS && row >= 0 && row < PIXEL_ROWS) {
    pixelGrid[row][col] = pixelTool === 'pen' ? 1 : 0;
    renderPixelGridOnCanvas();
  }
}

function renderPixelGridOnCanvas() {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cellW = canvas.width / PIXEL_COLS;
  const cellH = canvas.height / PIXEL_ROWS;

  ctx.fillStyle = '#000000';
  for (let r = 0; r < PIXEL_ROWS; r++) {
    for (let c = 0; c < PIXEL_COLS; c++) {
      if (pixelGrid[r][c] === 1) {
        ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
      }
    }
  }
}

// ==========================================
// MODO ARMADOR DIGITOYS (FIGURAS DE CANVA)
// ==========================================
function renderBuilderCatalog(cat) {
  const container = document.getElementById('builder-items-grid');
  container.innerHTML = '';

  const items = DIGITOYS_CATALOG[cat] || [];
  items.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-400 hover:bg-slate-800 transition flex flex-col items-center gap-1.5 cursor-pointer text-center';
    btn.innerHTML = `
      <span class="text-2xl">${item.icon}</span>
      <span class="text-[10px] font-bold text-slate-200 block truncate w-full">${item.name}</span>
    `;
    btn.onclick = () => {
      item.draw(ctx);
      saveState();
      statusEl.textContent = 'Añadido: ' + item.name;
    };
    container.appendChild(btn);
  });
}

// SILUETAS BASE EN NEGRO SÓLIDO (FONDO BLANCO)
function drawDinoBody(context) {
  context.fillStyle = '#000000';
  context.beginPath();
  // Cabeza y cuerpo redondeado con base plana en Y=440
  context.arc(230, 200, 110, Math.PI * 0.7, Math.PI * 2.2);
  context.lineTo(380, 240);
  context.arc(380, 310, 80, -Math.PI * 0.4, Math.PI * 0.5);
  // Cola hacia la derecha
  context.lineTo(460, 370);
  context.lineTo(400, 420);
  // Base plana ancha inferior (autoportante)
  context.lineTo(360, 440);
  context.lineTo(160, 440);
  // Patas delanteras
  context.lineTo(130, 360);
  context.lineTo(170, 340);
  context.closePath();
  context.fill();

  // Crestas dorsales de dinosaurio
  for (let i = 0; i < 4; i++) {
    context.beginPath();
    const cx = 310 + i * 25;
    const cy = 180 + i * 35;
    context.arc(cx, cy, 22, 0, Math.PI * 2);
    context.fill();
  }
}

function drawRobotBody(context) {
  context.fillStyle = '#000000';
  // Cabeza con esquinas redondeadas
  roundRect(context, 166, 120, 180, 130, 20);
  context.fill();
  // Antena
  context.fillRect(250, 70, 12, 50);
  context.beginPath();
  context.arc(256, 65, 16, 0, Math.PI * 2);
  context.fill();
  // Cuello
  context.fillRect(236, 250, 40, 20);
  // Torso
  roundRect(context, 146, 270, 220, 170, 16);
  context.fill();
  // Brazos
  context.fillRect(96, 290, 40, 90);
  context.fillRect(376, 290, 40, 90);
}

function drawMonsterBody(context) {
  context.fillStyle = '#000000';
  context.beginPath();
  // Cuerpo gordito tipo domo con base plana
  context.moveTo(130, 440);
  context.bezierCurveTo(100, 180, 412, 180, 382, 440);
  context.closePath();
  context.fill();

  // Cuernos
  context.beginPath();
  context.moveTo(180, 210);
  context.lineTo(150, 130);
  context.lineTo(210, 180);
  context.closePath();
  context.fill();

  context.beginPath();
  context.moveTo(332, 210);
  context.lineTo(362, 130);
  context.lineTo(302, 180);
  context.closePath();
  context.fill();
}

function drawAlienBody(context) {
  context.fillStyle = '#000000';
  // Cabeza ovalada alien
  context.beginPath();
  context.ellipse(256, 190, 130, 100, 0, 0, Math.PI * 2);
  context.fill();
  // Antenas
  context.fillRect(190, 70, 10, 50);
  context.beginPath(); context.arc(195, 65, 14, 0, Math.PI * 2); context.fill();
  context.fillRect(312, 70, 10, 50);
  context.beginPath(); context.arc(317, 65, 14, 0, Math.PI * 2); context.fill();
  // Cuerpo con base acampanada
  context.beginPath();
  context.moveTo(216, 280);
  context.lineTo(146, 440);
  context.lineTo(366, 440);
  context.lineTo(296, 280);
  context.closePath();
  context.fill();
}

function drawBearBody(context) {
  context.fillStyle = '#000000';
  // Orejas
  context.beginPath(); context.arc(176, 130, 40, 0, Math.PI * 2); context.fill();
  context.beginPath(); context.arc(336, 130, 40, 0, Math.PI * 2); context.fill();
  // Cabeza
  context.beginPath(); context.arc(256, 210, 110, 0, Math.PI * 2); context.fill();
  // Torso sólido y base plana
  roundRect(context, 146, 290, 220, 150, 30);
  context.fill();
}

// OJOS EN BLANCO SÓLIDO (#ffffff) PARA RECORTAR EN EL SÓLIDO
function drawEyePupil(context) {
  // Ojo blanco con pupila negra
  context.fillStyle = '#ffffff';
  context.beginPath();
  context.arc(200, 190, 30, 0, Math.PI * 2);
  context.arc(280, 190, 30, 0, Math.PI * 2);
  context.fill();

  // Pupilas negras (conectadas o internas)
  context.fillStyle = '#000000';
  context.beginPath();
  context.arc(205, 195, 14, 0, Math.PI * 2);
  context.arc(285, 195, 14, 0, Math.PI * 2);
  context.fill();
}

function drawEyeWink(context) {
  context.strokeStyle = '#ffffff';
  context.lineWidth = 12;
  context.lineCap = 'round';
  // Ojo normal
  context.fillStyle = '#ffffff';
  context.beginPath();
  context.arc(200, 190, 26, 0, Math.PI * 2);
  context.fill();
  // Guiño arqueado
  context.beginPath();
  context.arc(280, 200, 28, Math.PI * 1.1, Math.PI * 1.9);
  context.stroke();
}

function drawEyeTriangle(context) {
  context.fillStyle = '#ffffff';
  // Ojo triángulo izquierdo
  context.beginPath();
  context.moveTo(170, 215);
  context.lineTo(210, 150);
  context.lineTo(250, 215);
  context.closePath();
  context.fill();

  // Ojo triángulo derecho
  context.beginPath();
  context.moveTo(270, 215);
  context.lineTo(310, 150);
  context.lineTo(350, 215);
  context.closePath();
  context.fill();
}

function drawEyeCross(context) {
  context.strokeStyle = '#ffffff';
  context.lineWidth = 14;
  context.lineCap = 'round';
  // Cruz izquierda
  context.beginPath();
  context.moveTo(180, 175); context.lineTo(220, 215);
  context.moveTo(220, 175); context.lineTo(180, 215);
  context.stroke();

  // Cruz derecha
  context.beginPath();
  context.moveTo(280, 175); context.lineTo(320, 215);
  context.moveTo(320, 175); context.lineTo(280, 215);
  context.stroke();
}

// BOCAS EN BLANCO SÓLIDO (#ffffff)
function drawMouthOpen(context) {
  context.fillStyle = '#ffffff';
  context.beginPath();
  context.arc(256, 270, 50, 0, Math.PI);
  context.closePath();
  context.fill();
}

function drawMouthCrescent(context) {
  context.strokeStyle = '#ffffff';
  context.lineWidth = 14;
  context.lineCap = 'round';
  context.beginPath();
  context.arc(256, 260, 45, Math.PI * 0.15, Math.PI * 0.85);
  context.stroke();
}

function drawMouthSquare(context) {
  context.fillStyle = '#ffffff';
  roundRect(context, 216, 260, 80, 45, 10);
  context.fill();
}

function drawMouthFangs(context) {
  context.fillStyle = '#ffffff';
  context.beginPath();
  context.arc(256, 260, 45, 0, Math.PI);
  context.fill();
  // Colmillos negros
  context.fillStyle = '#000000';
  context.beginPath();
  context.moveTo(230, 260); context.lineTo(240, 280); context.lineTo(250, 260);
  context.moveTo(262, 260); context.lineTo(272, 280); context.lineTo(282, 260);
  context.closePath();
  context.fill();
}

// Utilidad para rectángulos redondeados
function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

// ==========================================
// EXPORTAR AL PASO 2 (POSTMESSAGE)
// ==========================================
function exportBoceto() {
  // Asegurar que la imagen no tenga transparencias
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  const expCtx = exportCanvas.getContext('2d');

  // Fondo blanco garantizado
  expCtx.fillStyle = '#ffffff';
  expCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  expCtx.drawImage(canvas, 0, 0);

  const dataUrl = exportCanvas.toDataURL('image/png');

  statusEl.textContent = 'Enviando boceto al Estudio...';

  // Notificar al componente padre de Inertia (Studio.vue y MicroAppOverlay.vue)
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({
      type: 'MAKERDU_MICROAPP_ASSET',
      assetType: 'image',
      dataUrl: dataUrl,
      image_snapshot: dataUrl,
      fileName: 'boceto_maker_2d.png',
      source: 'sketch-pad'
    }, '*');
  } else {
    // Modo standalone: descargar imagen
    const a = document.createElement('a');
    a.download = 'boceto_maker_2d.png';
    a.href = dataUrl;
    a.click();
  }
}

// ==========================================
// TEMA CLARO / OSCURO
// ==========================================
function syncTheme() {
  try {
    const parentIsDark = window.parent && window.parent.document && window.parent.document.documentElement.classList.contains('dark');
    if (parentIsDark) {
      document.body.classList.remove('light');
      document.getElementById('theme-icon').textContent = '☀️';
    } else {
      document.body.classList.add('light');
      document.getElementById('theme-icon').textContent = '🌙';
    }
  } catch (e) {
    // Si hay restricciones de iframe cross-origin
  }
}

function toggleTheme() {
  document.body.classList.toggle('light');
  const isLight = document.body.classList.contains('light');
  document.getElementById('theme-icon').textContent = isLight ? '🌙' : '☀️';
}

// Iniciar app al cargar
window.addEventListener('DOMContentLoaded', init);
