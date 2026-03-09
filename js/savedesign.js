
const STORAGE_KEY = 'furnispace_designs';

// Get all saved design
function getSavedDesigns(){
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : []
    } catch (error) {
        return []
    }
}

// Save a design
function saveDesign(designData) {
    const designs = getSavedDesigns();
    const user = getSessionUser();

    const design = {
    id:        designData.id || generateId(),
    name:      designData.name || 'Untitled Design',
    userId:    user ? user.id : 0,
    roomShape: designData.roomShape || 'Rectangle',
    roomColor: designData.roomColor || '#F5F0E8',
    furniture: designData.furniture || [],
    emoji:     pickEmoji(designData.roomShape),
    date:      new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }),
    timestamp: Date.now()
  };

  const idx = designs.findIndex(d => d.id === design.id);
  if(idx >= 0){
    designs[idx] = design;
  }else{
    designs.push(design);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));

  syncToBackend();
  return design;
}

// Delete a design
function deleteDesign(id){
  const designs = getSavedDesigns().filter(d => d.id !== id);
  localStorage.setItem(STORAGE_KEY,JSON.stringify(designs));

  fetch("../backend/designs/delete.php",{
    method: 'POST',
    headers : {'Content-Type': 'application/json'},
    body : JSON.stringify({id})
  }).catch(() => {});
}

// Load a single design by id
function getDesignById(id) {
  return getSavedDesigns().find(d => d.id === id) || null;
}

// Sync to backend
async function syncToBackend(design) {
  try {
    await fetch('../backend/designs/save.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(design)
    });
  } catch {
    // Silent fail — localStorage is the primary store
  }
}

// Helpers

function generateId() {
  return 'design_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

function pickEmoji(shape) {
  const map = {
    'Rectangle': '🛋️',
    'Square':    '🪑',
    'L-Shape':   '🏠',
    'Circle':    '🔵'
  };
  return map[shape] || '🛋️';
}

