

// ─── Toast Notifications ───────────────────────────────────────
function createToastContainer() {
  if (document.getElementById('toast-container')) return;
  const container = document.createElement('div');
  container.id = 'toast-container';
  document.body.appendChild(container);
}

function showToast(message, type = 'info', duration = 3000) {
  createToastContainer();
  const container = document.getElementById('toast-container');

  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span style="font-size:1rem;flex-shrink:0;">${icons[type] || icons.info}</span>
    <span>${message}</span>
    <button onclick="this.parentElement.remove()"
            style="margin-left:auto;background:none;border:none;cursor:pointer;
                   font-size:1rem;color:inherit;opacity:0.5;padding:0 2px;
                   transition:opacity 0.15s;flex-shrink:0;"
            onmouseover="this.style.opacity=1"
            onmouseout="this.style.opacity=0.5">×</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Convenience methods
function toastSuccess(msg) { showToast(msg, 'success'); }
function toastError(msg)   { showToast(msg, 'error', 4000); }
function toastInfo(msg)    { showToast(msg, 'info'); }
function toastWarn(msg)    { showToast(msg, 'warning', 4000); }

// Modal System 
function showModal({ title, content, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
                     onConfirm, onCancel, danger = false }) {
  removeModal();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-overlay';

  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-header">
        <h3 id="modal-title">${title}</h3>
        <button class="modal-close" onclick="removeModal()" aria-label="Close">×</button>
      </div>
      <div class="modal-body" style="margin-bottom:1.5rem;color:var(--text-mid);font-size:0.95rem;line-height:1.6;">
        ${content}
      </div>
      <div class="modal-footer" style="display:flex;gap:10px;justify-content:flex-end;">
        <button id="modal-cancel"
                style="padding:10px 20px;border:1.5px solid var(--warm);background:transparent;
                       border-radius:8px;cursor:pointer;font-size:0.9rem;font-family:'Outfit',sans-serif;
                       color:var(--text-mid);transition:all 0.2s;"
                onmouseover="this.style.borderColor='var(--cognac)';this.style.color='var(--cognac)'"
                onmouseout="this.style.borderColor='var(--warm)';this.style.color='var(--text-mid)'">
          ${cancelLabel}
        </button>
        <button id="modal-confirm"
                style="padding:10px 22px;border:none;
                       background:${danger ? 'var(--error)' : 'var(--cognac)'};
                       color:white;border-radius:8px;cursor:pointer;
                       font-size:0.9rem;font-family:'Outfit',sans-serif;font-weight:600;
                       transition:all 0.2s;"
                onmouseover="this.style.opacity=0.85;this.style.transform='translateY(-1px)'"
                onmouseout="this.style.opacity=1;this.style.transform='none'">
          ${confirmLabel}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('modal-cancel').onclick = () => {
    if (onCancel) onCancel();
    removeModal();
  };
  document.getElementById('modal-confirm').onclick = () => {
    if (onConfirm) onConfirm();
    removeModal();
  };

  // Close on overlay click
  overlay.addEventListener('click', e => {
    if (e.target === overlay) removeModal();
  });

  // Close on Escape
  document.addEventListener('keydown', onModalEscape);

  // Focus confirm button
  setTimeout(() => document.getElementById('modal-confirm')?.focus(), 50);
}

function removeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.remove();
  document.removeEventListener('keydown', onModalEscape);
}

function onModalEscape(e) {
  if (e.key === 'Escape') removeModal();
}

// Simple confirm wrapper
function confirmAction(message, onConfirm, danger = false) {
  showModal({
    title:         danger ? '⚠ Confirm Delete' : '✓ Confirm Action',
    content:       message,
    confirmLabel:  danger ? 'Delete' : 'Confirm',
    cancelLabel:   'Cancel',
    onConfirm,
    danger,
  });
}

// ─── Loading Spinner ───────────────────────────────────────────
function showLoader(message = 'Loading...') {
  removeLoader();
  const loader = document.createElement('div');
  loader.id = 'global-loader';
  loader.style.cssText = `
    position: fixed; inset: 0;
    background: rgba(247,242,234,0.85);
    backdrop-filter: blur(4px);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    z-index: 9998;
    animation: fadeIn 0.2s ease;
  `;
  loader.innerHTML = `
    <div style="
      width: 48px; height: 48px;
      border: 3px solid var(--warm);
      border-top-color: var(--cognac);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 16px;
    "></div>
    <p style="color:var(--text-mid);font-size:0.95rem;font-weight:300;">${message}</p>
  `;
  document.body.appendChild(loader);
}

function removeLoader() {
  document.getElementById('global-loader')?.remove();
}

// ─── Skeleton Loading Cards ────────────────────────────────────
function renderSkeletonCards(container, count = 3) {
  container.innerHTML = Array.from({ length: count }, () => `
    <div class="design-card">
      <div class="skeleton" style="height:150px;border-radius:0;"></div>
      <div style="padding:1rem;">
        <div class="skeleton" style="height:16px;width:70%;margin-bottom:8px;"></div>
        <div class="skeleton" style="height:12px;width:45%;margin-bottom:16px;"></div>
        <div style="display:flex;gap:7px;">
          <div class="skeleton" style="height:32px;flex:1;"></div>
          <div class="skeleton" style="height:32px;flex:1;"></div>
        </div>
      </div>
    </div>
  `).join('');
}

// ─── Onboarding Tooltip Tour ───────────────────────────────────
const tourSteps = [
  {
    selector: '#furniture-palette',
    title:    'Furniture Palette',
    text:     'Browse and click furniture items here to add them to your room.',
    position: 'right',
  },
  {
    selector: '#room-canvas',
    title:    '2D Room Canvas',
    text:     'Drag furniture items to position them. Double-click to rotate.',
    position: 'top',
  },
  {
    selector: '#btn-3d',
    title:    '3D Preview',
    text:     'Switch to a full 3D view of your room anytime.',
    position: 'bottom',
  },
  {
    selector: '.btn-save',
    title:    'Save Your Work',
    text:     'Save your design — it will be available on your dashboard.',
    position: 'bottom',
  },
];

let tourIndex = 0;
let tourActive = false;

function startTour() {
  tourIndex  = 0;
  tourActive = true;
  showTourStep();
}

function showTourStep() {
  removeTourTooltip();
  if (tourIndex >= tourSteps.length) {
    tourActive = false;
    toastSuccess('Tour complete! Happy designing 🎨');
    return;
  }

  const step    = tourSteps[tourIndex];
  const target  = document.querySelector(step.selector);
  if (!target) { tourIndex++; showTourStep(); return; }

  const rect    = target.getBoundingClientRect();
  const tooltip = document.createElement('div');
  tooltip.id    = 'tour-tooltip';

  Object.assign(tooltip.style, {
    position:    'fixed',
    zIndex:      '9997',
    background:  'var(--cognac-dk)',
    color:       'white',
    borderRadius:'12px',
    padding:     '16px 18px',
    maxWidth:    '260px',
    boxShadow:   '0 8px 32px rgba(42,26,14,0.3)',
    fontSize:    '0.88rem',
    lineHeight:  '1.6',
    animation:   'scaleIn 0.2s ease',
  });

  tooltip.innerHTML = `
    <div style="font-weight:700;font-size:1rem;margin-bottom:6px;
                font-family:'Cormorant Garamond',serif;">${step.title}</div>
    <div style="opacity:0.85;font-weight:300;">${step.text}</div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;gap:8px;">
      <span style="font-size:0.72rem;opacity:0.6;">${tourIndex + 1} / ${tourSteps.length}</span>
      <div style="display:flex;gap:6px;">
        <button onclick="endTour()"
                style="padding:6px 12px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);
                       color:white;border-radius:6px;cursor:pointer;font-size:0.78rem;">
          Skip
        </button>
        <button onclick="nextTourStep()"
                style="padding:6px 14px;background:var(--gold);border:none;
                       color:white;border-radius:6px;cursor:pointer;font-size:0.78rem;font-weight:600;">
          ${tourIndex === tourSteps.length - 1 ? 'Done ✓' : 'Next →'}
        </button>
      </div>
    </div>
  `;

  // Position tooltip
  const OFFSET = 12;
  let top, left;
  switch (step.position) {
    case 'right':
      top  = rect.top + rect.height / 2 - 80;
      left = rect.right + OFFSET;
      break;
    case 'bottom':
      top  = rect.bottom + OFFSET;
      left = rect.left + rect.width / 2 - 130;
      break;
    case 'left':
      top  = rect.top + rect.height / 2 - 80;
      left = rect.left - 280 - OFFSET;
      break;
    default: // top
      top  = rect.top - 170;
      left = rect.left + rect.width / 2 - 130;
  }

  // Keep tooltip within viewport
  top  = Math.max(10, Math.min(top,  window.innerHeight - 200));
  left = Math.max(10, Math.min(left, window.innerWidth  - 280));

  tooltip.style.top  = top  + 'px';
  tooltip.style.left = left + 'px';

  // Highlight target
  target.style.outline      = '2px solid var(--gold)';
  target.style.outlineOffset = '2px';
  target.style.borderRadius = '8px';

  document.body.appendChild(tooltip);
}

function nextTourStep() {
  // Remove highlight from current target
  const step   = tourSteps[tourIndex];
  const target = document.querySelector(step.selector);
  if (target) {
    target.style.outline      = '';
    target.style.outlineOffset = '';
  }
  tourIndex++;
  showTourStep();
}

function endTour() {
  removeTourTooltip();
  // Remove all highlights
  tourSteps.forEach(s => {
    const t = document.querySelector(s.selector);
    if (t) { t.style.outline = ''; t.style.outlineOffset = ''; }
  });
  tourActive = false;
}

function removeTourTooltip() {
  document.getElementById('tour-tooltip')?.remove();
}

// ─── Keyboard Shortcuts Help Overlay ──────────────────────────
function showShortcutsHelp() {
  showModal({
    title: '⌨ Keyboard Shortcuts',
    content: `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;font-size:0.85rem;">
        ${[
          ['Arrow Keys',  'Nudge item (hold Shift = 10px)'],
          ['R',           'Rotate item 45°'],
          ['Delete / ⌫', 'Delete selected item'],
          ['Ctrl + Z',    'Undo'],
          ['Ctrl + Y',    'Redo'],
          ['Ctrl + C',    'Copy item'],
          ['Ctrl + V',    'Paste item'],
          ['Ctrl + D',    'Duplicate item'],
          ['S',           'Toggle snap to grid'],
          ['+ / -',       'Zoom in / out'],
          ['0',           'Reset zoom'],
          ['Esc',         'Deselect item'],
        ].map(([key, desc]) => `
          <div style="display:contents;">
            <div style="font-family:monospace;background:var(--cream);
                        padding:3px 8px;border-radius:4px;font-size:0.8rem;
                        border:1px solid var(--warm);text-align:center;
                        white-space:nowrap;height:fit-content;">
              ${key}
            </div>
            <div style="color:var(--text-mid);padding:3px 0;">${desc}</div>
          </div>
        `).join('')}
      </div>
    `,
    confirmLabel: 'Got it!',
    cancelLabel: '',
    onConfirm: () => {},
  });

  // Hide cancel button in this modal
  setTimeout(() => {
    const cancel = document.getElementById('modal-cancel');
    if (cancel) cancel.style.display = 'none';
  }, 10);
}

// ─── Page Transition ───────────────────────────────────────────
function navigateTo(url) {
  document.body.style.opacity    = '0';
  document.body.style.transform  = 'translateY(8px)';
  document.body.style.transition = 'all 0.25s ease';
  setTimeout(() => { window.location.href = url; }, 250);
}

// Fade in on page load
document.addEventListener('DOMContentLoaded', () => {
  document.body.style.opacity   = '0';
  document.body.style.transform = 'translateY(10px)';
  requestAnimationFrame(() => {
    document.body.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    document.body.style.opacity    = '1';
    document.body.style.transform  = 'translateY(0)';
  });
});

// ─── Input Validation Helpers ──────────────────────────────────
function validateField(input, rule) {
  const valid = rule(input.value);
  input.style.borderColor = valid ? '' : 'var(--error)';
  if (!valid) {
    input.style.boxShadow = '0 0 0 3px rgba(184,50,50,0.1)';
  } else {
    input.style.boxShadow = '';
  }
  return valid;
}

// ─── Auto-hide messages ────────────────────────────────────────
function autoHideMessage(elementId, delay = 4000) {
  setTimeout(() => {
    const el = document.getElementById(elementId);
    if (el && !el.classList.contains('hidden')) {
      el.style.transition = 'opacity 0.4s ease';
      el.style.opacity    = '0';
      setTimeout(() => el.classList.add('hidden'), 400);
    }
  }, delay);
}

// ─── Copy to Clipboard ─────────────────────────────────────────
async function copyToClipboard(text, successMsg = 'Copied!') {
  try {
    await navigator.clipboard.writeText(text);
    toastSuccess(successMsg);
  } catch {
    // Fallback
    const textarea   = document.createElement('textarea');
    textarea.value   = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity  = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    toastSuccess(successMsg);
  }
}