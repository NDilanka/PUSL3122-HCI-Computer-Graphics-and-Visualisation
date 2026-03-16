// ─── Controls State ────────────────────────────────────────────
const Controls = {
  isDragging: false,
  isResizing: false,
  dragOffsetX: 0,
  dragOffsetY: 0,
  resizeHandle: null,
  resizeStartX: 0,
  resizeStartY: 0,
  resizeStartW: 0,
  resizeStartH: 0,
  snapEnabled: true,
  snapSize: 20,          // snap to 20px grid
  history: [],          // undo stack
  historyIndex: -1,
  clipboard: null,        // copied item
};

// ─── Initialise Controls ───────────────────────────────────────
function initControls() {
  const canvas = document.getElementById('room-canvas');

  canvas.addEventListener('mousedown', onControlMouseDown);
  canvas.addEventListener('mousemove', onControlMouseMove);
  canvas.addEventListener('mouseup', onControlMouseUp);
  canvas.addEventListener('dblclick', onControlDblClick);
  canvas.addEventListener('contextmenu', onControlRightClick);

  // Touch support for mobile
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd, { passive: false });

  // Keyboard shortcuts
  document.addEventListener('keydown', onKeyDown);

  // Save initial state
  saveHistory();
}

// ─── Get Canvas Position ───────────────────────────────────────
function getPos(e) {
  const canvas = document.getElementById('room-canvas');
  const rect = canvas.getBoundingClientRect();
  const wrapper = document.getElementById('canvas-wrapper');
  const offsetX = Math.max(20, (canvas.width - roomConfig.width * zoom) / 2);
  const offsetY = Math.max(20, (canvas.height - roomConfig.height * zoom) / 2);
  return {
    x: (e.clientX - rect.left - offsetX) / zoom,
    y: (e.clientY - rect.top - offsetY) / zoom,
  };
}

// ─── Hit Test ──────────────────────────────────────────────────
function hitTest(pos) {
  for (let i = furnitureItems.length - 1; i >= 0; i--) {
    const item = furnitureItems[i];
    if (pos.x >= item.x && pos.x <= item.x + item.w &&
      pos.y >= item.y && pos.y <= item.y + item.h) {
      return item;
    }
  }
  return null;
}

// ─── Resize Handle Hit Test ────────────────────────────────────
function getResizeHandle(pos, item) {
  if (!item) return null;
  const HANDLE = 10;
  const corners = {
    'se': { x: item.x + item.w, y: item.y + item.h },
    'sw': { x: item.x, y: item.y + item.h },
    'ne': { x: item.x + item.w, y: item.y },
    'nw': { x: item.x, y: item.y },
  };
  for (const [handle, corner] of Object.entries(corners)) {
    if (Math.abs(pos.x - corner.x) < HANDLE &&
      Math.abs(pos.y - corner.y) < HANDLE) {
      return handle;
    }
  }
  return null;
}

// ─── Mouse Down ────────────────────────────────────────────────
function onControlMouseDown(e) {
  if (e.button !== 0) return;
  const pos = getPos(e);

  // Delete tool
  if (currentTool === 'delete') {
    const hit = hitTest(pos);
    if (hit) {
      removeItemById(hit.id);
      saveHistory();
    }
    return;
  }

  // Check resize handle on selected item first
  if (selectedItem) {
    const handle = getResizeHandle(pos, selectedItem);
    if (handle) {
      Controls.isResizing = true;
      Controls.resizeHandle = handle;
      Controls.resizeStartX = pos.x;
      Controls.resizeStartY = pos.y;
      Controls.resizeStartW = selectedItem.w;
      Controls.resizeStartH = selectedItem.h;
      Controls.resizeItemX = selectedItem.x;
      Controls.resizeItemY = selectedItem.y;
      return;
    }
  }

  // Hit test for selection/drag
  const hit = hitTest(pos);
  if (hit) {
    if (hit.locked) {
      setStatus(`${hit.name} is locked`);
      return;
    }
    selectedItem = hit;
    Controls.isDragging = true;
    Controls.dragOffsetX = pos.x - hit.x;
    Controls.dragOffsetY = pos.y - hit.y;
    bringToFront(hit);
    updateSelectedPanel();
    updateItemsList();
  } else {
    selectedItem = null;
    updateSelectedPanel();
  }
  drawRoom();
}

// ─── Mouse Move ────────────────────────────────────────────────
function onControlMouseMove(e) {
  const pos = getPos(e);
  const canvas = document.getElementById('room-canvas');

  // Update cursor based on hover
  if (!Controls.isDragging && !Controls.isResizing) {
    const hit = hitTest(pos);
    const handle = selectedItem ? getResizeHandle(pos, selectedItem) : null;

    if (handle) {
      const cursors = { se: 'se-resize', sw: 'sw-resize', ne: 'ne-resize', nw: 'nw-resize' };
      canvas.style.cursor = cursors[handle];
    } else if (hit) {
      canvas.style.cursor = hit.locked ? 'not-allowed' : 'grab';
    } else {
      canvas.style.cursor = 'default';
    }
    return;
  }

  // Resizing
  if (Controls.isResizing && selectedItem) {
    let dx = pos.x - Controls.resizeStartX;
    let dy = pos.y - Controls.resizeStartY;

    if (Controls.snapEnabled) {
      dx = Math.round(dx / Controls.snapSize) * Controls.snapSize;
      dy = Math.round(dy / Controls.snapSize) * Controls.snapSize;
    }

    const MIN = 30;

    switch (Controls.resizeHandle) {
      case 'se':
        selectedItem.w = Math.max(MIN, Controls.resizeStartW + dx);
        selectedItem.h = Math.max(MIN, Controls.resizeStartH + dy);
        break;
      case 'sw':
        selectedItem.w = Math.max(MIN, Controls.resizeStartW - dx);
        selectedItem.x = Controls.resizeItemX + (Controls.resizeStartW - selectedItem.w);
        selectedItem.h = Math.max(MIN, Controls.resizeStartH + dy);
        break;
      case 'ne':
        selectedItem.w = Math.max(MIN, Controls.resizeStartW + dx);
        selectedItem.h = Math.max(MIN, Controls.resizeStartH - dy);
        selectedItem.y = Controls.resizeItemY + (Controls.resizeStartH - selectedItem.h);
        break;
      case 'nw':
        selectedItem.w = Math.max(MIN, Controls.resizeStartW - dx);
        selectedItem.x = Controls.resizeItemX + (Controls.resizeStartW - selectedItem.w);
        selectedItem.h = Math.max(MIN, Controls.resizeStartH - dy);
        selectedItem.y = Controls.resizeItemY + (Controls.resizeStartH - selectedItem.h);
        break;
    }

    drawRoom();
    return;
  }

  // Dragging
  if (Controls.isDragging && selectedItem) {
    canvas.style.cursor = 'grabbing';
    let nx = pos.x - Controls.dragOffsetX;
    let ny = pos.y - Controls.dragOffsetY;

    selectedItem.x = nx;
    selectedItem.y = ny;

    if (Controls.snapEnabled) snapItem(selectedItem);

    // Clamp inside room
    selectedItem.x = Math.max(0, Math.min(selectedItem.x, roomConfig.width - selectedItem.w));
    selectedItem.y = Math.max(0, Math.min(selectedItem.y, roomConfig.height - selectedItem.h));

    // Show position in status bar
    const mx = (selectedItem.x / 80).toFixed(1);
    const my = (selectedItem.y / 80).toFixed(1);
    setStatus(`${selectedItem.name} — Position: ${mx}m, ${my}m`);

    drawRoom();
  }
}

// ─── Mouse Up ──────────────────────────────────────────────────
function onControlMouseUp() {
  if (Controls.isDragging || Controls.isResizing) {
    saveHistory();
  }
  Controls.isDragging = false;
  Controls.isResizing = false;
  document.getElementById('room-canvas').style.cursor = 'default';
}

// ─── Double Click: Rotate 45° ──────────────────────────────────
function onControlDblClick(e) {
  const pos = getPos(e);
  const hit = hitTest(pos);
  if (hit && !hit.locked) {
    hit.rotation = ((hit.rotation || 0) + 45) % 360;
    saveHistory();
    drawRoom();
    updateSelectedPanel();
    setStatus(`${hit.name} rotated to ${hit.rotation}°`);
  }
}

// ─── Right Click Context Menu ──────────────────────────────────
function onControlRightClick(e) {
  e.preventDefault();
  const pos = getPos(e);
  const hit = hitTest(pos);
  if (hit) {
    selectedItem = hit;
    showContextMenu(e.clientX, e.clientY, hit);
    drawRoom();
  }
}

// ─── Context Menu ──────────────────────────────────────────────
function showContextMenu(x, y, item) {
  removeContextMenu();

  const menu = document.createElement('div');
  menu.id = 'context-menu';
  menu.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    background: white;
    border: 1.5px solid #E8DDD0;
    border-radius: 10px;
    padding: 6px;
    z-index: 9999;
    min-width: 170px;
    box-shadow: 0 8px 24px rgba(44,31,20,0.15);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.85rem;
  `;

  const actions = [
    { icon: '↻', label: 'Rotate 45°', fn: () => { item.rotation = ((item.rotation || 0) + 45) % 360; saveHistory(); drawRoom(); updateSelectedPanel(); } },
    { icon: '↺', label: 'Rotate -45°', fn: () => { item.rotation = ((item.rotation || 0) - 45 + 360) % 360; saveHistory(); drawRoom(); updateSelectedPanel(); } },
    { icon: '⧉', label: 'Duplicate', fn: () => { const d = duplicateFurnitureItem(item); furnitureItems.push(d); selectedItem = d; saveHistory(); updateItemsList(); drawRoom(); } },
    { icon: '⬆', label: 'Bring to Front', fn: () => { bringToFront(item); drawRoom(); } },
    { icon: '⬇', label: 'Send to Back', fn: () => { sendToBack(item); drawRoom(); } },
    { icon: item.locked ? '🔓' : '🔒', label: item.locked ? 'Unlock' : 'Lock Position', fn: () => { item.locked = !item.locked; setStatus(item.locked ? `${item.name} locked` : `${item.name} unlocked`); drawRoom(); } },
    { icon: '📋', label: 'Copy', fn: () => { Controls.clipboard = duplicateFurnitureItem(item); setStatus('Copied ' + item.name); } },
    { sep: true },
    { icon: '🗑', label: 'Delete', fn: () => { removeItemById(item.id); saveHistory(); }, danger: true },
  ];

  actions.forEach(a => {
    if (a.sep) {
      const sep = document.createElement('div');
      sep.style.cssText = 'height:1px;background:#E8DDD0;margin:4px 0;';
      menu.appendChild(sep);
      return;
    }
    const btn = document.createElement('button');
    btn.style.cssText = `
      display: flex; align-items: center; gap: 8px;
      width: 100%; padding: 7px 10px;
      background: none; border: none; border-radius: 6px;
      cursor: pointer; text-align: left;
      color: ${a.danger ? '#C0392B' : '#2C1F14'};
      font-family: 'DM Sans', sans-serif; font-size: 0.85rem;
    `;
    btn.innerHTML = `<span>${a.icon}</span><span>${a.label}</span>`;
    btn.onmouseover = () => btn.style.background = a.danger ? '#FEF0EE' : '#F5F0E8';
    btn.onmouseout = () => btn.style.background = 'none';
    btn.onclick = () => { a.fn(); removeContextMenu(); };
    menu.appendChild(btn);
  });

  document.body.appendChild(menu);
  document.addEventListener('click', removeContextMenu, { once: true });
}

function removeContextMenu() {
  const m = document.getElementById('context-menu');
  if (m) m.remove();
}

// ─── Touch Support ─────────────────────────────────────────────
function getTouchPos(e) {
  const touch = e.touches[0];
  return getPos(touch);
}

function onTouchStart(e) {
  e.preventDefault();
  const pos = getTouchPos(e);
  const hit = hitTest(pos);
  if (hit && !hit.locked) {
    selectedItem = hit;
    Controls.isDragging = true;
    Controls.dragOffsetX = pos.x - hit.x;
    Controls.dragOffsetY = pos.y - hit.y;
    bringToFront(hit);
    updateSelectedPanel();
    drawRoom();
  }
}

function onTouchMove(e) {
  e.preventDefault();
  if (!Controls.isDragging || !selectedItem) return;
  const pos = getTouchPos(e);
  selectedItem.x = Math.max(0, Math.min(pos.x - Controls.dragOffsetX, roomConfig.width - selectedItem.w));
  selectedItem.y = Math.max(0, Math.min(pos.y - Controls.dragOffsetY, roomConfig.height - selectedItem.h));
  if (Controls.snapEnabled) snapItem(selectedItem);
  drawRoom();
}

function onTouchEnd(e) {
  e.preventDefault();
  if (Controls.isDragging) saveHistory();
  Controls.isDragging = false;
}

// ─── Keyboard Shortcuts ────────────────────────────────────────
function onKeyDown(e) {
  // Ignore if typing in an input
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

  const MOVE = e.shiftKey ? 10 : 2;

  switch (e.key) {
    // Arrow keys: nudge selected item
    case 'ArrowLeft':
      if (selectedItem && !selectedItem.locked) {
        selectedItem.x = Math.max(0, selectedItem.x - MOVE);
        drawRoom(); saveHistory();
      }
      e.preventDefault();
      break;
    case 'ArrowRight':
      if (selectedItem && !selectedItem.locked) {
        selectedItem.x = Math.min(roomConfig.width - selectedItem.w, selectedItem.x + MOVE);
        drawRoom(); saveHistory();
      }
      e.preventDefault();
      break;
    case 'ArrowUp':
      if (selectedItem && !selectedItem.locked) {
        selectedItem.y = Math.max(0, selectedItem.y - MOVE);
        drawRoom(); saveHistory();
      }
      e.preventDefault();
      break;
    case 'ArrowDown':
      if (selectedItem && !selectedItem.locked) {
        selectedItem.y = Math.min(roomConfig.height - selectedItem.h, selectedItem.y + MOVE);
        drawRoom(); saveHistory();
      }
      e.preventDefault();
      break;

    // R: rotate selected
    case 'r':
    case 'R':
      if (selectedItem && !selectedItem.locked) {
        selectedItem.rotation = ((selectedItem.rotation || 0) + 45) % 360;
        drawRoom(); saveHistory(); updateSelectedPanel();
        setStatus(`${selectedItem.name} rotated to ${selectedItem.rotation}°`);
      }
      break;

    // Delete / Backspace: delete selected
    case 'Delete':
    case 'Backspace':
      if (selectedItem) {
        removeItemById(selectedItem.id);
        saveHistory();
        e.preventDefault();
      }
      break;

    // Ctrl+Z: undo
    case 'z':
    case 'Z':
      if (e.ctrlKey || e.metaKey) { undo(); e.preventDefault(); }
      break;

    // Ctrl+Y: redo
    case 'y':
    case 'Y':
      if (e.ctrlKey || e.metaKey) { redo(); e.preventDefault(); }
      break;

    // Ctrl+C: copy
    case 'c':
    case 'C':
      if ((e.ctrlKey || e.metaKey) && selectedItem) {
        Controls.clipboard = duplicateFurnitureItem(selectedItem);
        setStatus('Copied ' + selectedItem.name);
        e.preventDefault();
      }
      break;

    // Ctrl+V: paste
    case 'v':
    case 'V':
      if ((e.ctrlKey || e.metaKey) && Controls.clipboard) {
        const item = duplicateFurnitureItem(Controls.clipboard);
        furnitureItems.push(item);
        selectedItem = item;
        saveHistory();
        updateItemsList();
        updateSelectedPanel();
        drawRoom();
        setStatus('Pasted ' + item.name);
        e.preventDefault();
      }
      break;

    // Ctrl+D: duplicate
    case 'd':
    case 'D':
      if ((e.ctrlKey || e.metaKey) && selectedItem) {
        const d = duplicateFurnitureItem(selectedItem);
        furnitureItems.push(d);
        selectedItem = d;
        saveHistory();
        updateItemsList();
        updateSelectedPanel();
        drawRoom();
        setStatus('Duplicated ' + d.name);
        e.preventDefault();
      }
      break;

    // Escape: deselect
    case 'Escape':
      selectedItem = null;
      updateSelectedPanel();
      drawRoom();
      break;

    // S: toggle snap
    case 's':
    case 'S':
      if (!e.ctrlKey) {
        Controls.snapEnabled = !Controls.snapEnabled;
        setStatus(`Snap: ${Controls.snapEnabled ? 'ON' : 'OFF'}`);
        updateSnapBtn();
      }
      break;

    // +/-: zoom
    case '+': case '=': zoomIn(); break;
    case '-': zoomOut(); break;
    case '0': resetZoom(); break;
  }
}

// ─── Snap to Grid ──────────────────────────────────────────────
function snapItem(item) {
  const s = Controls.snapSize;
  item.x = Math.round(item.x / s) * s;
  item.y = Math.round(item.y / s) * s;
}

function toggleSnap() {
  Controls.snapEnabled = !Controls.snapEnabled;
  setStatus(`Snap to grid: ${Controls.snapEnabled ? 'ON' : 'OFF'}`);
  updateSnapBtn();
}

function updateSnapBtn() {
  const btn = document.getElementById('snap-btn');
  if (btn) {
    btn.textContent = `⊞ Snap: ${Controls.snapEnabled ? 'ON' : 'OFF'}`;
    btn.classList.toggle('active', Controls.snapEnabled);
  }
}

// ─── Layer Order ───────────────────────────────────────────────
function bringToFront(item) {
  furnitureItems = furnitureItems.filter(i => i.id !== item.id);
  furnitureItems.push(item);
}

function sendToBack(item) {
  furnitureItems = furnitureItems.filter(i => i.id !== item.id);
  furnitureItems.unshift(item);
}

// ─── Remove Item ───────────────────────────────────────────────
function removeItemById(id) {
  furnitureItems = furnitureItems.filter(i => i.id !== id);
  if (selectedItem?.id === id) selectedItem = null;
  updateItemsList();
  updateSelectedPanel();
  drawRoom();
}

// ─── Undo / Redo ───────────────────────────────────────────────
function saveHistory() {
  // Trim redo stack
  Controls.history = Controls.history.slice(0, Controls.historyIndex + 1);
  Controls.history.push({
    items: JSON.parse(JSON.stringify(furnitureItems)),
    selected: selectedItem?.id || null
  });
  // Limit history to 30 states
  if (Controls.history.length > 30) Controls.history.shift();
  Controls.historyIndex = Controls.history.length - 1;
  updateUndoRedoBtns();
}

function undo() {
  if (Controls.historyIndex <= 0) return;
  Controls.historyIndex--;
  restoreHistory();
  setStatus('Undo');
}

function redo() {
  if (Controls.historyIndex >= Controls.history.length - 1) return;
  Controls.historyIndex++;
  restoreHistory();
  setStatus('Redo');
}

function restoreHistory() {
  const state = Controls.history[Controls.historyIndex];
  furnitureItems = JSON.parse(JSON.stringify(state.items));
  selectedItem = furnitureItems.find(i => i.id === state.selected) || null;
  updateItemsList();
  updateSelectedPanel();
  drawRoom();
  updateUndoRedoBtns();
}

function updateUndoRedoBtns() {
  const undoBtn = document.getElementById('undo-btn');
  const redoBtn = document.getElementById('redo-btn');
  if (undoBtn) undoBtn.disabled = Controls.historyIndex <= 0;
  if (redoBtn) redoBtn.disabled = Controls.historyIndex >= Controls.history.length - 1;
}

// ─── Build Category Palette ────────────────────────────────────
function buildCategoryPalette() {
  const palette = document.getElementById('furniture-palette');
  if (!palette) return;

  const categories = getFurnitureCategories();

  // Build category tabs
  const tabsHtml = categories.map((cat, i) => `
    <button class="cat-tab ${i === 0 ? 'active' : ''}"
            onclick="filterPalette('${cat}', this)">
      ${cat}
    </button>
  `).join('');

  palette.innerHTML = `
    <div class="cat-tabs" id="cat-tabs">${tabsHtml}</div>
    <div class="furniture-grid" id="furniture-grid"></div>
  `;

  renderPaletteItems('All');
}

function filterPalette(category, btn) {
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderPaletteItems(category);
}

function renderPaletteItems(category) {
  const grid = document.getElementById('furniture-grid');
  if (!grid) return;
  const items = getFurnitureByCategory(category);

  grid.innerHTML = items.map(f => `
    <div class="furniture-item"
         onclick="addFurniture('${f.type}')"
         title="${f.description}">
      <span class="furniture-item-icon">${f.icon}</span>
      <span class="furniture-item-name">${f.name}</span>
    </div>
  `).join('');
}