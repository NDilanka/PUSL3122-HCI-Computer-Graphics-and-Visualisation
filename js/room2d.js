

// Canvas Setup 
const canvas  = document.getElementById('room-canvas');
const ctx     = canvas.getContext('2d');

//  State
let roomConfig = {
  shape:      'rectangle',
  width:      500,   // pixels (5m × 100px/m)
  height:     400,   // pixels (4m × 100px/m)
  wallColor:  '#F5F0E8',
  floorColor: '#D4A96A',
  mWidth:     5,     // metres
  mHeight:    4
};

let furnitureItems = [];   // placed items on canvas
let selectedItem   = null; // currently selected item
let currentTool    = 'select';
let zoom           = 1.0;
let isDragging     = false;
let dragOffsetX    = 0;
let dragOffsetY    = 0;
let currentDesignId = null;

const SCALE = 80; // pixels per metre

// Furniture Catalogue 
const FURNITURE_CATALOGUE = [
  { type: 'sofa',          name: 'Sofa',          icon: '🛋️', w: 180, h: 80,  color: '#8B7355' },
  { type: 'armchair',      name: 'Armchair',       icon: '🪑', w: 80,  h: 80,  color: '#9B8B6E' },
  { type: 'dining-table',  name: 'Dining Table',   icon: '🍽️', w: 160, h: 100, color: '#6B4F3A' },
  { type: 'dining-chair',  name: 'Dining Chair',   icon: '🪑', w: 50,  h: 55,  color: '#8B7355' },
  { type: 'coffee-table',  name: 'Coffee Table',   icon: '☕', w: 100, h: 60,  color: '#7A6045' },
  { type: 'side-table',    name: 'Side Table',     icon: '🪵', w: 55,  h: 55,  color: '#9B8B6E' },
  { type: 'bookshelf',     name: 'Bookshelf',      icon: '📚', w: 100, h: 30,  color: '#5C4033' },
  { type: 'tv-stand',      name: 'TV Stand',       icon: '📺', w: 140, h: 40,  color: '#4A3527' },
  { type: 'bed-double',    name: 'Double Bed',     icon: '🛏️', w: 160, h: 200, color: '#A89880' },
  { type: 'wardrobe',      name: 'Wardrobe',       icon: '🚪', w: 120, h: 55,  color: '#6B4F3A' },
  { type: 'desk',          name: 'Desk',           icon: '🖥️', w: 120, h: 60,  color: '#8B7355' },
  { type: 'plant',         name: 'Plant',          icon: '🌿', w: 40,  h: 40,  color: '#4A7C59' },
];

// Init 
window.addEventListener('load', () => {
  buildFurniturePalette();
  resizeCanvas();

  const params = new URLSearchParams(window.location.search);
  const isNew  = params.get('new');

  if (isNew) {
    sessionStorage.removeItem('furni_2d_data'); // clear previous
  } else {
    restoreFromSession(); // only restore if NOT new
  }

  updateRoom();
  if (typeof initControls === 'function') {
    initControls(); // control.js replaces setupCanvasEvents and palette building
  } else {
    setupCanvasEvents();
  }
});

function restoreFromSession() {
  try {
    const raw = sessionStorage.getItem('furni_2d_data');
    if (!raw) return;

    const data = JSON.parse(raw);

    if (data.roomConfig) {
      roomConfig = data.roomConfig;

      document.getElementById('room-shape').value  = roomConfig.shape;
      document.getElementById('room-width').value  = roomConfig.mWidth;
      document.getElementById('room-height').value = roomConfig.mHeight;
      document.getElementById('wall-color').value  = roomConfig.wallColor;
      document.getElementById('floor-color').value = roomConfig.floorColor;
    }

    furnitureItems = data.furnitureItems || [];

    updateItemsList();
    updateSelectedPanel();
  } catch (e) {
    console.warn('Could not restore 2D session:', e);
  }
}

window.addEventListener('resize', () => {
  resizeCanvas();
  drawRoom();
});

// Canvas Sizing 
function resizeCanvas() {
  const wrapper = document.getElementById('canvas-wrapper');
  canvas.width  = wrapper.clientWidth  - 40;
  canvas.height = wrapper.clientHeight - 40;
}

// Build Furniture Palette 
function buildFurniturePalette() {
  const palette = document.getElementById('furniture-palette');
  palette.innerHTML = FURNITURE_CATALOGUE.map(f => `
    <div class="furniture-item" onclick="addFurniture('${f.type}')" title="Add ${f.name}">
      <span class="furniture-item-icon">${f.icon}</span>
      <span class="furniture-item-name">${f.name}</span>
    </div>
  `).join('');
}

//  Update Room from Controls 
function updateRoom() {
  const shape      = document.getElementById('room-shape').value;
  const mW         = parseFloat(document.getElementById('room-width').value)  || 5;
  const mH         = parseFloat(document.getElementById('room-height').value) || 4;
  const wallColor  = document.getElementById('wall-color').value;
  const floorColor = document.getElementById('floor-color').value;

  roomConfig = {
    shape,
    mWidth:     mW,
    mHeight:    mH,
    width:      Math.round(mW * SCALE),
    height:     Math.round(mH * SCALE),
    wallColor,
    floorColor
  };

  // Update colour labels
  document.getElementById('wall-color-label').textContent  = wallColor;
  document.getElementById('floor-color-label').textContent = floorColor;

  // Update info panel
  document.getElementById('info-shape').textContent = capitalize(shape);
  document.getElementById('info-size').textContent  = `${mW}m × ${mH}m`;

  drawRoom();
}

//  Main Draw Function 
function drawRoom() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();

  // Center the room on canvas
  const offsetX = Math.max(20, (canvas.width  - roomConfig.width  * zoom) / 2);
  const offsetY = Math.max(20, (canvas.height - roomConfig.height * zoom) / 2);
  ctx.translate(offsetX, offsetY);
  ctx.scale(zoom, zoom);

  // Draw room shape
  drawRoomShape();

  // Draw grid
  drawGrid();

  // Draw furniture
  furnitureItems.forEach(item => drawFurnitureItem(item));

  // Draw selection highlight
  if (selectedItem) drawSelectionBox(selectedItem);

  ctx.restore();
}

//  Draw Room Shape 
function drawRoomShape() {
  const { width, height, wallColor, floorColor, shape } = roomConfig;

  ctx.save();

  if (shape === 'lshape') {
    // L-Shape: main rect + smaller rect
    const path = new Path2D();
    path.rect(0, 0, width, height * 0.6);
    path.rect(0, 0, width * 0.55, height);

    ctx.fillStyle = floorColor;
    ctx.fill(path);
    ctx.strokeStyle = wallColor;
    ctx.lineWidth = 10;
    ctx.stroke(path);

    // Wall shading
    ctx.fillStyle = wallColor;
    ctx.fillRect(0, 0, width, 8);
    ctx.fillRect(0, 0, 8, height);

  } else {
    // Rectangle or Square
    // Floor
    ctx.fillStyle = floorColor;
    ctx.fillRect(0, 0, width, height);

    // Wall shading (top and left = walls)
    ctx.fillStyle = shadeColor(wallColor, -15);
    ctx.fillRect(0, 0, width, 10);
    ctx.fillRect(0, 0, 10, height);

    // Border
    ctx.strokeStyle = shadeColor(wallColor, -30);
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, width, height);
  }

  // Room dimensions label
  ctx.fillStyle = 'rgba(44,31,20,0.4)';
  ctx.font = '11px DM Sans, sans-serif';
  ctx.fillText(`${roomConfig.mWidth}m`, width / 2 - 12, height + 18);
  ctx.save();
  ctx.translate(-18, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(`${roomConfig.mHeight}m`, 0, 0);
  ctx.restore();

  ctx.restore();
}

// Draw Grid 
function drawGrid() {
  const { width, height } = roomConfig;
  ctx.save();
  ctx.strokeStyle = 'rgba(44,31,20,0.07)';
  ctx.lineWidth   = 0.5;

  for (let x = SCALE; x < width; x += SCALE) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = SCALE; y < height; y += SCALE) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }
  ctx.restore();
}

// Draw a Furniture Item 
function drawFurnitureItem(item) {
  ctx.save();
  ctx.translate(item.x + item.w / 2, item.y + item.h / 2);
  ctx.rotate((item.rotation || 0) * Math.PI / 180);

  const hw = item.w / 2;
  const hh = item.h / 2;

  // Shadow
  ctx.shadowColor   = 'rgba(44,31,20,0.25)';
  ctx.shadowBlur    = 8;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;

  // Body
  ctx.fillStyle = item.color || '#8B7355';
  ctx.beginPath();
  roundRect(ctx, -hw, -hh, item.w, item.h, 6);
  ctx.fill();

  // Shade overlay
  if (item.shade) {
    ctx.fillStyle = `rgba(0,0,0,${item.shade / 100 * 0.6})`;
    ctx.beginPath();
    roundRect(ctx, -hw, -hh, item.w, item.h, 6);
    ctx.fill();
  }

  ctx.shadowColor = 'transparent';

  // Outline
  ctx.strokeStyle = shadeColor(item.color || '#8B7355', -25);
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  roundRect(ctx, -hw, -hh, item.w, item.h, 6);
  ctx.stroke();

  // Icon
  ctx.font      = `${Math.min(item.w, item.h) * 0.4}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(item.icon || '🪑', 0, 0);

  ctx.restore();
}

//  Draw Selection Box 
function drawSelectionBox(item) {
  ctx.save();
  ctx.translate(item.x + item.w / 2, item.y + item.h / 2);
  ctx.rotate((item.rotation || 0) * Math.PI / 180);

  const hw = item.w / 2 + 5;
  const hh = item.h / 2 + 5;

  ctx.strokeStyle = '#C49A4A';
  ctx.lineWidth   = 2;
  ctx.setLineDash([5, 3]);
  ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);
  ctx.setLineDash([]);

  // Corner handles
  [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].forEach(([cx,cy]) => {
    ctx.fillStyle = '#C49A4A';
    ctx.fillRect(cx - 4, cy - 4, 8, 8);
  });

  ctx.restore();
}

// Add Furniture to Canvas 
function addFurniture(type) {
  const def = FURNITURE_CATALOGUE.find(f => f.type === type);
  if (!def) return;

  const item = {
    id:       'item_' + Date.now(),
    type:     def.type,
    name:     def.name,
    icon:     def.icon,
    x:        Math.max(15, Math.random() * (roomConfig.width  - def.w - 30)),
    y:        Math.max(15, Math.random() * (roomConfig.height - def.h - 30)),
    w:        def.w,
    h:        def.h,
    color:    def.color,
    rotation: 0,
    shade:    0
  };

  furnitureItems.push(item);
  selectedItem = item;
  updateItemsList();
  updateSelectedPanel();
  drawRoom();
  setStatus(`Added ${def.name}`);
}

//  Canvas Mouse Events 
function setupCanvasEvents() {
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup',   onMouseUp);
  canvas.addEventListener('dblclick',  onDblClick);
}

function getCanvasPos(e) {
  const rect    = canvas.getBoundingClientRect();
  const wrapper = document.getElementById('canvas-wrapper');
  const offsetX = Math.max(20, (canvas.width  - roomConfig.width  * zoom) / 2);
  const offsetY = Math.max(20, (canvas.height - roomConfig.height * zoom) / 2);
  return {
    x: (e.clientX - rect.left - offsetX) / zoom,
    y: (e.clientY - rect.top  - offsetY) / zoom
  };
}

function hitTest(pos) {
  // Iterate in reverse so top items are picked first
  for (let i = furnitureItems.length - 1; i >= 0; i--) {
    const item = furnitureItems[i];
    if (pos.x >= item.x && pos.x <= item.x + item.w &&
        pos.y >= item.y && pos.y <= item.y + item.h) {
      return item;
    }
  }
  return null;
}

function onMouseDown(e) {
  const pos = getCanvasPos(e);
  const hit = hitTest(pos);

  if (currentTool === 'delete' && hit) {
    furnitureItems = furnitureItems.filter(i => i.id !== hit.id);
    selectedItem   = null;
    updateItemsList();
    updateSelectedPanel();
    drawRoom();
    setStatus('Item deleted');
    return;
  }

  if (hit) {
    selectedItem  = hit;
    isDragging    = true;
    dragOffsetX   = pos.x - hit.x;
    dragOffsetY   = pos.y - hit.y;
    canvas.style.cursor = 'grabbing';
  } else {
    selectedItem = null;
  }

  updateSelectedPanel();
  drawRoom();
}

function onMouseMove(e) {
  if (!isDragging || !selectedItem) return;
  const pos = getCanvasPos(e);

  // Clamp inside room bounds
  selectedItem.x = Math.max(0, Math.min(pos.x - dragOffsetX, roomConfig.width  - selectedItem.w));
  selectedItem.y = Math.max(0, Math.min(pos.y - dragOffsetY, roomConfig.height - selectedItem.h));

  drawRoom();
}

function onMouseUp() {
  isDragging          = false;
  canvas.style.cursor = 'default';
}

function onDblClick(e) {
  const pos = getCanvasPos(e);
  const hit = hitTest(pos);
  if (hit && currentTool === 'rotate') {
    hit.rotation = ((hit.rotation || 0) + 45) % 360;
    drawRoom();
    setStatus(`Rotated ${hit.name} to ${hit.rotation}°`);
  }
}

//  Tools 
function setTool(tool) {
  currentTool = tool;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`tool-${tool}`)?.classList.add('active');

  const cursors = { select: 'default', move: 'move', rotate: 'crosshair', delete: 'not-allowed' };
  canvas.style.cursor = cursors[tool] || 'default';
  setStatus(`Tool: ${capitalize(tool)}`);
}

// Rotate Selected Item
function rotateSelected(deg) {
  if (!selectedItem) return;
  selectedItem.rotation = ((selectedItem.rotation || 0) + deg) % 360;
  drawRoom();
  updateSelectedPanel();
}

// Zoom 
function zoomIn()    { setZoom(zoom + 0.1); }
function zoomOut()   { setZoom(zoom - 0.1); }
function resetZoom() { setZoom(1.0); }

function setZoom(val) {
  zoom = Math.min(2.5, Math.max(0.3, val));
  document.getElementById('zoom-label').textContent  = Math.round(zoom * 100) + '%';
  document.getElementById('scale-slider').value      = Math.round(zoom * 100);
  document.getElementById('scale-value').textContent = Math.round(zoom * 100) + '%';
  drawRoom();
}

function setZoomFromSlider(val) {
  setZoom(val / 100);
}

// Clear All 
function clearAll() {
  if (!furnitureItems.length) return;
  if (confirm('Remove all furniture from the room?')) {
    furnitureItems = [];
    selectedItem   = null;
    updateItemsList();
    updateSelectedPanel();
    drawRoom();
    setStatus('Room cleared');
  }
}

// Items List Panel
function updateItemsList() {
  const list   = document.getElementById('items-list');
  const infoEl = document.getElementById('info-items');

  infoEl.textContent = furnitureItems.length;
  document.getElementById('item-count').textContent = `Items: ${furnitureItems.length}`;

  if (!furnitureItems.length) {
    list.innerHTML = '<p class="panel-hint">No items added yet</p>';
    return;
  }

  list.innerHTML = furnitureItems.map(item => `
    <div class="item-row" onclick="selectItemById('${item.id}')">
      <div class="item-row-left">
        <span>${item.icon}</span>
        <span>${item.name}</span>
      </div>
      <button class="item-del-btn" onclick="removeItem(event,'${item.id}')">✕</button>
    </div>
  `).join('');
}


function selectItemById(id) {
  selectedItem = furnitureItems.find(i => i.id === id) || null;
  updateSelectedPanel();
  drawRoom();
}

function removeItem(e, id) {
  e.stopPropagation();
  furnitureItems = furnitureItems.filter(i => i.id !== id);
  if (selectedItem?.id === id) selectedItem = null;
  updateItemsList();
  updateSelectedPanel();
  drawRoom();
}

// Selected Item Panel
function updateSelectedPanel() {
  const panel = document.getElementById('selected-panel');
  if (!selectedItem) {
    panel.innerHTML = '<p class="selected-empty">Click a furniture item in the room to edit it</p>';
    return;
  }

  panel.innerHTML = `
    <div class="selected-controls">
      <div>
        <label>Colour</label>
        <input type="color" value="${selectedItem.color}"
               onchange="changeItemColor(this.value)"/>
      </div>
      <div>
        <label>Shade: <span id="shade-val">${selectedItem.shade || 0}%</span></label>
        <input type="range" min="0" max="100" value="${selectedItem.shade || 0}"
               oninput="changeItemShade(this.value)"/>
      </div>
      <div>
        <label>Rotation: ${selectedItem.rotation || 0}°</label>
        <div style="display:flex;gap:6px;margin-top:4px;">
          <button class="tool-btn" onclick="rotateSelected(-45)" style="flex:1">↺ -45°</button>
          <button class="tool-btn" onclick="rotateSelected(45)"  style="flex:1">↻ +45°</button>
        </div>
      </div>
    </div>
  `;
}

function changeItemColor(color) {
  if (!selectedItem) return;
  selectedItem.color = color;
  drawRoom();
}

function changeItemShade(val) {
  if (!selectedItem) return;
  selectedItem.shade = parseInt(val);
  document.getElementById('shade-val').textContent = val + '%';
  drawRoom();
}


// Save Design
function saveCurrentDesign() {
  try {
    const name = document.getElementById('design-name').value || 'My Room Design';
    const design = saveDesign({
      id:         currentDesignId,
      name,
      roomShape:  capitalize(roomConfig.shape),
      roomColor:  roomConfig.wallColor,
      furniture:  furnitureItems,
      roomConfig
    });
    currentDesignId = design.id;
    setStatus('Design saved successfully ✓');
    alert('Design saved successfully!');
  } catch (error) {
    console.log(error);
  }
}

// Load Design into canvas
function loadDesignIntoCanvas(id) {
  const design = getDesignById(id);
  if (!design) return;

  currentDesignId = id;
  document.getElementById('design-name').value = design.name;

  if (design.roomConfig) {
    document.getElementById('room-shape').value  = design.roomConfig.shape  || 'rectangle';
    document.getElementById('room-width').value  = design.roomConfig.mWidth || 5;
    document.getElementById('room-height').value = design.roomConfig.mHeight || 4;
    document.getElementById('wall-color').value  = design.roomConfig.wallColor  || '#F5F0E8';
    document.getElementById('floor-color').value = design.roomConfig.floorColor || '#D4A96A';
  }

  furnitureItems = design.furniture || [];
  updateRoom();
  updateItemsList();
  setStatus(`Loaded: ${design.name}`);
}

// View Switch (2D ↔ 3D)
function switchView(mode) {
  document.getElementById('btn-2d').classList.toggle('active', mode === '2d');
  document.getElementById('btn-3d').classList.toggle('active', mode === '3d');

  if (mode === '3d') {
    // Save current 2D data for 3D view to read
    sessionStorage.setItem('furni_2d_data', JSON.stringify({
      roomConfig,
      furnitureItems
    }));
    window.location.href = 'room3d.html';
  }
}
// Helpers
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x,     y + h, x,     y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x,     y,     x + r, y);
  ctx.closePath();
}

function shadeColor(color, percent) {
  const num = parseInt(color.replace('#',''), 16);
  const r   = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g   = Math.min(255, Math.max(0, ((num >> 8) & 0xFF) + percent));
  const b   = Math.min(255, Math.max(0, (num & 0xFF) + percent));
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function setStatus(msg) {
  document.getElementById('status-text').textContent = msg;
}
