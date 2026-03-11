// Preset colour swatches
const COLOR_PRESETS = [
  '#8B7355', '#9B8B6E', '#6B4F3A', '#4A3527', '#C4A882',
  '#A89880', '#7A6045', '#5C4033', '#D4A96A', '#F5F0E8',
  '#4A7C59', '#C49A4A', '#2C3E50', '#7F8C8D', '#E74C3C',
  '#3498DB', '#9B59B6', '#1ABC9C', '#F39C12', '#222222',
];

// Build Enhanced Selected Panel
function updateSelectedPanel() {
  const panel = document.getElementById('selected-panel');
  if (!panel) return;

  if (!selectedItem) {
    panel.innerHTML = `
      <div class="selected-empty">
        <div style="font-size:1.8rem;margin-bottom:8px">👆</div>
        <p>Click a furniture item in the room to edit it</p>
        <div style="margin-top:12px;font-size:0.75rem;color:var(--text-lt);">
          <div>Double-click → Rotate 45°</div>
          <div>Right-click → More options</div>
          <div>Arrow keys → Nudge position</div>
          <div>Del → Delete item</div>
          <div>Ctrl+D → Duplicate</div>
          <div>Ctrl+Z → Undo</div>
        </div>
      </div>`;
    return;
  }

  const swatches = COLOR_PRESETS.map(c => `
    <div class="color-swatch ${c === selectedItem.color ? 'active' : ''}"
         style="background:${c}"
         onclick="applyPresetColor('${c}')"
         title="${c}">
    </div>
  `).join('');

  panel.innerHTML = `
    <div class="selected-controls">

      <div class="sel-item-header">
        <span class="sel-item-icon">${selectedItem.icon}</span>
        <div>
          <div class="sel-item-name">${selectedItem.name}</div>
          <div class="sel-item-pos">
            ${(selectedItem.x / 80).toFixed(1)}m, ${(selectedItem.y / 80).toFixed(1)}m
            · ${selectedItem.rotation || 0}°
          </div>
        </div>
        <button class="sel-lock-btn ${selectedItem.locked ? 'locked' : ''}"
                onclick="toggleItemLock()"
                title="${selectedItem.locked ? 'Unlock' : 'Lock position'}">
          ${selectedItem.locked ? '🔒' : '🔓'}
        </button>
      </div>

      <hr style="border:none;border-top:1px solid var(--warm);margin:8px 0"/>

      <div class="ctrl-section">
        <label class="ctrl-label">Colour</label>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <input type="color" id="item-color-picker"
                 value="${selectedItem.color}"
                 oninput="applyCustomColor(this.value)"
                 style="width:40px;height:36px;border:1.5px solid var(--warm);
                        border-radius:6px;padding:2px;cursor:pointer;"/>
          <span style="font-size:0.78rem;color:var(--text-mid);font-family:monospace;">
            ${selectedItem.color}
          </span>
        </div>
        <div class="color-swatches">${swatches}</div>
      </div>

      <div class="ctrl-section">
        <label class="ctrl-label">
          Shade &nbsp;
          <span id="shade-pct">${selectedItem.shade || 0}%</span>
        </label>
        <input type="range" min="0" max="100"
               value="${selectedItem.shade || 0}"
               oninput="applyShade(this.value)"
               style="width:100%;accent-color:var(--brown);"/>
        <div style="display:flex;justify-content:space-between;font-size:0.7rem;color:var(--text-lt);">
          <span>None</span><span>Dark</span>
        </div>
      </div>

      <div class="ctrl-section">
        <label class="ctrl-label">
          Opacity &nbsp;
          <span id="opacity-pct">${Math.round((selectedItem.opacity || 1) * 100)}%</span>
        </label>
        <input type="range" min="10" max="100"
               value="${Math.round((selectedItem.opacity || 1) * 100)}"
               oninput="applyOpacity(this.value)"
               style="width:100%;accent-color:var(--brown);"/>
      </div>

      <div class="ctrl-section">
        <label class="ctrl-label">Rotation: ${selectedItem.rotation || 0}°</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;">
          <button class="ctrl-mini-btn" onclick="rotateBy(-90)">↺ -90°</button>
          <button class="ctrl-mini-btn" onclick="rotateBy(-45)">↺ -45°</button>
          <button class="ctrl-mini-btn" onclick="rotateBy(45)">↻ +45°</button>
          <button class="ctrl-mini-btn" onclick="rotateBy(90)">↻ +90°</button>
        </div>
        <button class="ctrl-mini-btn" onclick="rotateBy(0, true)"
                style="width:100%;margin-top:5px;">⊙ Reset Rotation</button>
      </div>

      <div class="ctrl-section">
        <label class="ctrl-label">Size (px)</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;">
          <div>
            <label style="font-size:0.7rem;color:var(--text-lt);">Width</label>
            <input type="number" min="20" max="400"
                   value="${selectedItem.w}"
                   onchange="resizeItem('w', this.value)"
                   style="width:100%;padding:5px 8px;border:1.5px solid var(--warm);
                          border-radius:5px;font-size:0.8rem;"/>
          </div>
          <div>
            <label style="font-size:0.7rem;color:var(--text-lt);">Depth</label>
            <input type="number" min="20" max="400"
                   value="${selectedItem.h}"
                   onchange="resizeItem('h', this.value)"
                   style="width:100%;padding:5px 8px;border:1.5px solid var(--warm);
                          border-radius:5px;font-size:0.8rem;"/>
          </div>
        </div>
      </div>

      <hr style="border:none;border-top:1px solid var(--warm);margin:8px 0"/>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;">
        <button class="ctrl-mini-btn" onclick="duplicateSelected()">⧉ Duplicate</button>
        <button class="ctrl-mini-btn" onclick="bringToFront(selectedItem);drawRoom()">⬆ Front</button>
        <button class="ctrl-mini-btn" onclick="sendToBack(selectedItem);drawRoom()">⬇ Back</button>
        <button class="ctrl-mini-btn danger" onclick="removeItemById(selectedItem.id);saveHistory()">🗑 Delete</button>
      </div>

    </div>
  `;

  addColorPickerStyles();
}

// Apply Colour Changes 
function applyCustomColor(color) {
  if (!selectedItem) return;
  selectedItem.color = color;
  // Update swatch highlights
  document.querySelectorAll('.color-swatch').forEach(s => {
    s.classList.toggle('active', s.style.background === color ||
      hexToRgb(s.style.background) === hexToRgb(color));
  });
  drawRoom();
}

function applyPresetColor(color) {
  if (!selectedItem) return;
  selectedItem.color = color;
  const picker = document.getElementById('item-color-picker');
  if (picker) picker.value = color;
  document.querySelectorAll('.color-swatch').forEach(s =>
    s.classList.toggle('active', s.style.background === color ||
      normalizeHex(s.style.background) === color)
  );
  drawRoom();
}

function applyShade(val) {
  if (!selectedItem) return;
  selectedItem.shade = parseInt(val);
  const el = document.getElementById('shade-pct');
  if (el) el.textContent = val + '%';
  drawRoom();
}

function applyOpacity(val) {
  if (!selectedItem) return;
  selectedItem.opacity = val / 100;
  const el = document.getElementById('opacity-pct');
  if (el) el.textContent = val + '%';
  drawRoom();
}

function rotateBy(deg, reset = false) {
  if (!selectedItem || selectedItem.locked) return;
  selectedItem.rotation = reset ? 0 : ((selectedItem.rotation || 0) + deg + 360) % 360;
  saveHistory();
  drawRoom();
  updateSelectedPanel();
  setStatus(`${selectedItem.name}: ${selectedItem.rotation}°`);
}

function resizeItem(dimension, value) {
  if (!selectedItem || selectedItem.locked) return;
  const val = Math.max(20, Math.min(400, parseInt(value)));
  selectedItem[dimension] = val;
  saveHistory();
  drawRoom();
  setStatus(`${selectedItem.name} resized`);
}

function toggleItemLock() {
  if (!selectedItem) return;
  selectedItem.locked = !selectedItem.locked;
  updateSelectedPanel();
  drawRoom();
  setStatus(`${selectedItem.name} ${selectedItem.locked ? 'locked' : 'unlocked'}`);
}

function duplicateSelected() {
  if (!selectedItem) return;
  const d = duplicateFurnitureItem(selectedItem);
  furnitureItems.push(d);
  selectedItem = d;
  saveHistory();
  updateItemsList();
  updateSelectedPanel();
  drawRoom();
  setStatus('Duplicated ' + d.name);
}

//  Add CSS styles for color picker components
function addColorPickerStyles() {
  if (document.getElementById('colorpicker-styles')) return;
  const style = document.createElement('style');
  style.id = 'colorpicker-styles';
  style.textContent = `
    .selected-controls { padding: 2px; }

    .sel-item-header {
      display: flex; align-items: center; gap: 8px;
    }
    .sel-item-icon { font-size: 1.5rem; }
    .sel-item-name { font-size: 0.88rem; font-weight: 600; color: var(--text); }
    .sel-item-pos  { font-size: 0.72rem; color: var(--text-mid); }

    .sel-lock-btn {
      margin-left: auto; background: none; border: none;
      cursor: pointer; font-size: 1rem; padding: 4px;
      border-radius: 4px; transition: background 0.15s;
    }
    .sel-lock-btn:hover { background: var(--cream); }
    .sel-lock-btn.locked { opacity: 0.7; }

    .ctrl-section { margin-bottom: 10px; }
    .ctrl-label {
      font-size: 0.78rem; font-weight: 600;
      color: var(--text-mid); display: block; margin-bottom: 5px;
    }

    .color-swatches {
      display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px;
    }
    .color-swatch {
      width: 100%; aspect-ratio: 1;
      border-radius: 4px; cursor: pointer;
      border: 2px solid transparent;
      transition: transform 0.1s, border-color 0.1s;
    }
    .color-swatch:hover  { transform: scale(1.15); }
    .color-swatch.active { border-color: var(--brown); transform: scale(1.1); }

    .ctrl-mini-btn {
      padding: 6px 8px; border: 1.5px solid var(--warm);
      background: var(--cream); border-radius: 5px;
      cursor: pointer; font-size: 0.78rem;
      font-family: 'DM Sans', sans-serif; color: var(--text);
      transition: all 0.15s; white-space: nowrap;
    }
    .ctrl-mini-btn:hover        { background: var(--brown); color: white; border-color: var(--brown); }
    .ctrl-mini-btn.danger:hover { background: #C0392B;     color: white; border-color: #C0392B; }

    /* Category tabs in palette */
    .cat-tabs {
      display: flex; flex-wrap: wrap; gap: 4px;
      margin-bottom: 8px;
    }
    .cat-tab {
      padding: 4px 10px; border: 1.5px solid var(--warm);
      background: var(--cream); border-radius: 12px;
      cursor: pointer; font-size: 0.72rem; font-weight: 500;
      font-family: 'DM Sans', sans-serif; color: var(--text-mid);
      transition: all 0.15s; white-space: nowrap;
    }
    .cat-tab:hover  { border-color: var(--brown); color: var(--brown); }
    .cat-tab.active { background: var(--brown); color: white; border-color: var(--brown); }

    .furniture-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
      max-height: 260px; overflow-y: auto;
    }
  `;
  document.head.appendChild(style);
}

// Helpers
function hexToRgb(hex) {
  // Handles both #rrggbb and rgb(r,g,b) formats
  if (hex.startsWith('rgb')) return hex;
  return hex;
}

function normalizeHex(rgb) {
  // Convert browser rgb() to hex for comparison
  const m = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!m) return rgb;
  return '#' + [m[1], m[2], m[3]]
    .map(v => parseInt(v).toString(16).padStart(2, '0')).join('');
}