/**
 * FurniSpace — room3d.js
 * 3D Room Visualisation using Three.js
 * Member 3 — 3D View
 */

// Scene Setup 
let scene, camera, renderer;
let ambientLight, sunLight;
let roomGroup, furnitureGroup;
let gridHelper;
let shadowsEnabled = true;
let gridEnabled    = true;

// Orbit controls state
let isMouseDown  = false;
let mouseButton  = -1;
let lastMouseX   = 0;
let lastMouseY   = 0;
let cameraTheta  = 45;
let cameraPhi    = 55;
let cameraRadius = 12;
let cameraTarget = new THREE.Vector3(0, 0, 0);

// Raycaster for click selection
const raycaster  = new THREE.Raycaster();
const mouse      = new THREE.Vector2();
let selectedMesh = null;

// Room & furniture data from 2D
let roomData = {
  shape:      'rectangle',
  mWidth:     5,
  mHeight:    4,
  wallColor:  '#F5F0E8',
  floorColor: '#D4A96A'
};
let furnitureItems = [];

// Furniture colour map for 3D
const FURNITURE_COLORS = {
  'sofa':         0x8B7355,
  'armchair':     0x9B8B6E,
  'dining-table': 0x6B4F3A,
  'dining-chair': 0x8B7355,
  'coffee-table': 0x7A6045,
  'side-table':   0x9B8B6E,
  'bookshelf':    0x5C4033,
  'tv-stand':     0x4A3527,
  'bed-double':   0xA89880,
  'wardrobe':     0x6B4F3A,
  'desk':         0x8B7355,
  'plant':        0x4A7C59,
};

// Init 
window.addEventListener('load', () => {
  loadRoomData();
  initScene();
  buildRoom();
  buildFurniture();
  buildLights();
  buildGrid();
  setupOrbitControls();
  setupRaycaster();
  animate();
  hideLoadingScreen();
});

// Load Data from sessionStorage
function loadRoomData() {
  try {
    const raw = sessionStorage.getItem('furni_2d_data');
    if (raw) {
      const data = JSON.parse(raw);
      if (data.roomConfig) {
        roomData.shape      = data.roomConfig.shape      || 'rectangle';
        roomData.mWidth     = data.roomConfig.mWidth     || 5;
        roomData.mHeight    = data.roomConfig.mHeight    || 4;
        roomData.wallColor  = data.roomConfig.wallColor  || '#F5F0E8';
        roomData.floorColor = data.roomConfig.floorColor || '#D4A96A';
      }
      furnitureItems = data.furnitureItems || [];

      // Sync colour pickers
      document.getElementById('wall-color-3d').value  = roomData.wallColor;
      document.getElementById('floor-color-3d').value = roomData.floorColor;
    }
  } catch (e) {
    console.warn('Could not load room data:', e);
  }
}

//  Scene Initialisation 
function initScene() {
  const canvas = document.getElementById('three-canvas');

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB); // sky blue
  scene.fog = new THREE.Fog(0x87CEEB, 20, 50);

  // Camera
  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  updateCameraPosition();

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
  renderer.outputEncoding    = THREE.sRGBEncoding;
  renderer.toneMapping       = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Groups
  roomGroup      = new THREE.Group();
  furnitureGroup = new THREE.Group();
  scene.add(roomGroup);
  scene.add(furnitureGroup);
}

//  Build Room
function buildRoom() {
  roomGroup.clear();

  const W = roomData.mWidth;
  const H = roomData.mHeight;
  const WALL_HEIGHT = 2.8;
  const WALL_THICK  = 0.1;

  const wallColor  = new THREE.Color(roomData.wallColor);
  const floorColor = new THREE.Color(roomData.floorColor);

  // Floor
  const floorGeo = new THREE.BoxGeometry(W, 0.1, H);
  const floorMat = new THREE.MeshLambertMaterial({ color: floorColor });
  const floor    = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set(0, -0.05, 0);
  floor.receiveShadow = true;
  floor.name = 'floor';
  roomGroup.add(floor);

  // Ceiling (semi-transparent)
  const ceilGeo = new THREE.BoxGeometry(W, 0.05, H);
  const ceilMat = new THREE.MeshLambertMaterial({
    color: 0xFFFFFF,
    transparent: true,
    opacity: 0.3
  });
  const ceil = new THREE.Mesh(ceilGeo, ceilMat);
  ceil.position.set(0, WALL_HEIGHT, 0);
  roomGroup.add(ceil);

  const wallMat = new THREE.MeshLambertMaterial({ color: wallColor, side: THREE.FrontSide });

  if (roomData.shape === 'lshape') {
    buildLShapeRoom(W, H, WALL_HEIGHT, WALL_THICK, wallMat, floorColor);
  } else {
    // Back wall
    addWall(0, WALL_HEIGHT/2, -H/2,  W, WALL_HEIGHT, WALL_THICK, wallMat);
    // Front wall (with opening feel - shorter)
    addWall(0, WALL_HEIGHT/2,  H/2,  W, WALL_HEIGHT, WALL_THICK, wallMat);
    // Left wall
    addWall(-W/2, WALL_HEIGHT/2, 0,  WALL_THICK, WALL_HEIGHT, H, wallMat);
    // Right wall
    addWall( W/2, WALL_HEIGHT/2, 0,  WALL_THICK, WALL_HEIGHT, H, wallMat);
  }

  // Skirting boards
  addSkirtingBoards(W, H, WALL_HEIGHT);

  // Reposition camera target to room centre
  cameraTarget.set(0, WALL_HEIGHT / 2, 0);
  cameraRadius = Math.max(W, H) * 1.8;
  updateCameraPosition();
}

function addWall(x, y, z, w, h, d, mat) {
  const geo  = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  mesh.castShadow    = true;
  mesh.name = 'wall';
  roomGroup.add(mesh);
}

function addSkirtingBoards(W, H) {
  const mat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
  const h   = 0.08;
  const t   = 0.02;

  // Four skirting boards along base of walls
  const configs = [
    [0, h/2, -H/2,  W, h, t],
    [0, h/2,  H/2,  W, h, t],
    [-W/2, h/2, 0,  t, h, H],
    [ W/2, h/2, 0,  t, h, H],
  ];
  configs.forEach(([x,y,z,w,height,d]) => {
    const geo  = new THREE.BoxGeometry(w, height, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    roomGroup.add(mesh);
  });
}

function buildLShapeRoom(W, H, WALL_HEIGHT, WALL_THICK, wallMat, floorColor) {
  // L-shape: main area + extension
  const mainW = W;
  const mainH = H * 0.6;
  const extW  = W * 0.55;
  const extH  = H;

  // Two floor pieces
  [
    [mainW/2 - W/2, -0.05, mainH/2 - H/2, mainW, 0.1, mainH],
    [extW/2  - W/2, -0.05, H/2 - H/2,     extW,  0.1, extH],
  ].forEach(([x,y,z,w,h,d]) => {
    const geo  = new THREE.BoxGeometry(w, h, d);
    const mat  = new THREE.MeshLambertMaterial({ color: new THREE.Color(roomData.floorColor) });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    roomGroup.add(mesh);
  });
}

// Build Furniture
function buildFurniture() {
  furnitureGroup.clear();

  const SCALE2D = 80; // pixels per metre (must match room2d.js)
  const W = roomData.mWidth;
  const H = roomData.mHeight;

  furnitureItems.forEach(item => {
    // Convert 2D pixel coords to 3D world coords
    const worldX = (item.x / SCALE2D) - W / 2 + (item.w / SCALE2D) / 2;
    const worldZ = (item.y / SCALE2D) - H / 2 + (item.h / SCALE2D) / 2;
    const scaleX = item.w / SCALE2D;
    const scaleZ = item.h / SCALE2D;

    const mesh = buildFurnitureMesh(item, scaleX, scaleZ);
    if (!mesh) return;

    mesh.position.set(worldX, mesh.userData.yOffset || 0, worldZ);
    mesh.rotation.y = ((item.rotation || 0) * Math.PI) / 180;
    mesh.castShadow    = true;
    mesh.receiveShadow = true;
    mesh.name          = item.type;
    mesh.userData.itemId = item.id;
    mesh.userData.itemName = item.name;

    // Apply shade
    if (item.shade && item.shade > 0) {
      applyShade(mesh, item.shade);
    }

    furnitureGroup.add(mesh);
  });
}

function buildFurnitureMesh(item, scaleX, scaleZ) {
  const color = new THREE.Color(item.color || '#8B7355');
  const mat   = new THREE.MeshLambertMaterial({ color });

  let group = new THREE.Group();

  switch (item.type) {

    case 'sofa': {
      // Base
      const base = new THREE.Mesh(new THREE.BoxGeometry(scaleX, 0.4, scaleZ), mat);
      base.position.y = 0.2;
      // Back rest
      const back = new THREE.Mesh(
        new THREE.BoxGeometry(scaleX, 0.5, 0.12),
        new THREE.MeshLambertMaterial({ color: shadeThreeColor(color, -0.1) })
      );
      back.position.set(0, 0.65, -scaleZ/2 + 0.06);
      // Arm rests
      const armMat = new THREE.MeshLambertMaterial({ color: shadeThreeColor(color, -0.15) });
      [-1, 1].forEach(side => {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, scaleZ), armMat);
        arm.position.set(side * (scaleX/2 - 0.05), 0.55, 0);
        group.add(arm);
      });
      group.add(base, back);
      group.userData.yOffset = 0;
      break;
    }

    case 'armchair': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(scaleX, 0.35, scaleZ), mat);
      base.position.y = 0.175;
      const back = new THREE.Mesh(
        new THREE.BoxGeometry(scaleX, 0.5, 0.1),
        new THREE.MeshLambertMaterial({ color: shadeThreeColor(color, -0.1) })
      );
      back.position.set(0, 0.6, -scaleZ/2 + 0.05);
      group.add(base, back);
      group.userData.yOffset = 0;
      break;
    }

    case 'dining-table':
    case 'coffee-table':
    case 'side-table': {
      const height = item.type === 'coffee-table' ? 0.4 : item.type === 'side-table' ? 0.55 : 0.75;
      const topThick = 0.06;
      const legH    = height - topThick;

      // Table top
      const top = new THREE.Mesh(new THREE.BoxGeometry(scaleX, topThick, scaleZ), mat);
      top.position.y = height;

      // Four legs
      const legMat = new THREE.MeshLambertMaterial({ color: shadeThreeColor(color, -0.2) });
      const legW   = 0.05;
      [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([sx, sz]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(legW, legH, legW), legMat);
        leg.position.set(sx * (scaleX/2 - 0.07), legH/2, sz * (scaleZ/2 - 0.07));
        group.add(leg);
      });
      group.add(top);
      group.userData.yOffset = 0;
      break;
    }

    case 'dining-chair': {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(scaleX, 0.05, scaleZ), mat);
      seat.position.y = 0.45;
      const back = new THREE.Mesh(
        new THREE.BoxGeometry(scaleX, 0.4, 0.05),
        new THREE.MeshLambertMaterial({ color: shadeThreeColor(color, -0.1) })
      );
      back.position.set(0, 0.7, -scaleZ/2 + 0.025);
      const legMat = new THREE.MeshLambertMaterial({ color: shadeThreeColor(color, -0.2) });
      [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([sx,sz]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.04), legMat);
        leg.position.set(sx*(scaleX/2-0.05), 0.225, sz*(scaleZ/2-0.05));
        group.add(leg);
      });
      group.add(seat, back);
      group.userData.yOffset = 0;
      break;
    }

    case 'bookshelf':
    case 'wardrobe':
    case 'tv-stand': {
      const h = item.type === 'tv-stand' ? 0.5 : item.type === 'bookshelf' ? 1.8 : 2.0;
      const body = new THREE.Mesh(new THREE.BoxGeometry(scaleX, h, scaleZ), mat);
      body.position.y = h / 2;

      // Shelves
      if (item.type === 'bookshelf') {
        const shelfMat = new THREE.MeshLambertMaterial({ color: shadeThreeColor(color, 0.1) });
        for (let i = 1; i <= 3; i++) {
          const shelf = new THREE.Mesh(new THREE.BoxGeometry(scaleX - 0.05, 0.02, scaleZ - 0.05), shelfMat);
          shelf.position.y = (h / 4) * i;
          group.add(shelf);
        }
      }
      group.add(body);
      group.userData.yOffset = 0;
      break;
    }

    case 'bed-double': {
      // Base
      const base = new THREE.Mesh(new THREE.BoxGeometry(scaleX, 0.3, scaleZ), mat);
      base.position.y = 0.15;
      // Mattress
      const mattressMat = new THREE.MeshLambertMaterial({ color: 0xF0EBE3 });
      const mattress = new THREE.Mesh(new THREE.BoxGeometry(scaleX - 0.05, 0.2, scaleZ - 0.1), mattressMat);
      mattress.position.y = 0.4;
      // Headboard
      const headMat = new THREE.MeshLambertMaterial({ color: shadeThreeColor(color, -0.15) });
      const head = new THREE.Mesh(new THREE.BoxGeometry(scaleX, 0.7, 0.1), headMat);
      head.position.set(0, 0.65, -scaleZ/2 + 0.05);
      // Pillow
      const pillowMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
      [-0.25, 0.25].forEach(px => {
        const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.3), pillowMat);
        pillow.position.set(px * scaleX, 0.54, -scaleZ/2 + 0.25);
        group.add(pillow);
      });
      group.add(base, mattress, head);
      group.userData.yOffset = 0;
      break;
    }

    case 'desk': {
      const top = new THREE.Mesh(new THREE.BoxGeometry(scaleX, 0.04, scaleZ), mat);
      top.position.y = 0.75;
      const legMat = new THREE.MeshLambertMaterial({ color: shadeThreeColor(color, -0.2) });
      [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([sx,sz]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.75, 0.05), legMat);
        leg.position.set(sx*(scaleX/2-0.06), 0.375, sz*(scaleZ/2-0.06));
        group.add(leg);
      });
      group.add(top);
      group.userData.yOffset = 0;
      break;
    }

    case 'plant': {
      // Pot
      const potMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
      const pot    = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.2, 8), potMat);
      pot.position.y = 0.1;
      // Plant ball
      const plantMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(item.color || '#4A7C59') });
      const plant    = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), plantMat);
      plant.position.y = 0.5;
      group.add(pot, plant);
      group.userData.yOffset = 0;
      break;
    }

    default: {
      // Generic box fallback
      const box = new THREE.Mesh(new THREE.BoxGeometry(scaleX, 0.6, scaleZ), mat);
      box.position.y = 0.3;
      group.add(box);
      group.userData.yOffset = 0;
    }
  }

  return group;
}

// Lights 
function buildLights() {
  // Ambient
  ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  // Directional (sun)
  sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
  sunLight.position.set(5, 10, 5);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width  = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near   = 0.1;
  sunLight.shadow.camera.far    = 50;
  sunLight.shadow.camera.left   = -15;
  sunLight.shadow.camera.right  = 15;
  sunLight.shadow.camera.top    = 15;
  sunLight.shadow.camera.bottom = -15;
  sunLight.shadow.bias          = -0.001;
  scene.add(sunLight);

  // Warm fill light from opposite side
  const fillLight = new THREE.DirectionalLight(0xFFE4B5, 0.3);
  fillLight.position.set(-5, 3, -5);
  scene.add(fillLight);
}

function updateLighting() {
  const ambVal = document.getElementById('ambient-light').value / 100;
  const sunVal = document.getElementById('sun-light').value / 100;
  const color  = document.getElementById('light-color').value;

  ambientLight.intensity = ambVal * 1.2;
  sunLight.intensity     = sunVal * 1.2;
  sunLight.color         = new THREE.Color(color);

  document.getElementById('ambient-val').textContent = document.getElementById('ambient-light').value;
  document.getElementById('sun-val').textContent     = document.getElementById('sun-light').value;
}

//  Grid
function buildGrid() {
  gridHelper = new THREE.GridHelper(
    Math.max(roomData.mWidth, roomData.mHeight) + 2,
    Math.max(roomData.mWidth, roomData.mHeight) + 2,
    0xAAAAAA, 0xDDDDDD
  );
  gridHelper.position.y = 0.001;
  scene.add(gridHelper);
}

function toggleShadows() {
  shadowsEnabled = !shadowsEnabled;
  renderer.shadowMap.enabled = shadowsEnabled;
  document.getElementById('shadow-btn').textContent = `Shadows: ${shadowsEnabled ? 'ON' : 'OFF'}`;
  document.getElementById('shadow-btn').classList.toggle('active', shadowsEnabled);
  // Force shadow map update
  scene.traverse(obj => { if (obj.isMesh) { obj.castShadow = shadowsEnabled; obj.receiveShadow = shadowsEnabled; } });
}

function toggleGrid() {
  gridEnabled = !gridEnabled;
  gridHelper.visible = gridEnabled;
  document.getElementById('grid-btn').textContent = `Grid: ${gridEnabled ? 'ON' : 'OFF'}`;
  document.getElementById('grid-btn').classList.toggle('active', gridEnabled);
}

// Update Room Colours 
function updateRoomColors() {
  roomData.wallColor  = document.getElementById('wall-color-3d').value;
  roomData.floorColor = document.getElementById('floor-color-3d').value;
  buildRoom();
}

// Camera 
function updateCameraPosition() {
  const thetaRad = (cameraTheta * Math.PI) / 180;
  const phiRad   = (cameraPhi   * Math.PI) / 180;

  camera.position.set(
    cameraTarget.x + cameraRadius * Math.sin(phiRad) * Math.sin(thetaRad),
    cameraTarget.y + cameraRadius * Math.cos(phiRad),
    cameraTarget.z + cameraRadius * Math.sin(phiRad) * Math.cos(thetaRad)
  );
  camera.lookAt(cameraTarget);
}

function setCameraView(view) {
  const W = roomData.mWidth;
  const H = roomData.mHeight;

  switch (view) {
    case 'perspective':
      cameraTheta  = 45;
      cameraPhi    = 55;
      cameraRadius = Math.max(W, H) * 1.8;
      break;
    case 'top':
      cameraTheta  = 0;
      cameraPhi    = 5;
      cameraRadius = Math.max(W, H) * 1.5;
      break;
    case 'front':
      cameraTheta  = 0;
      cameraPhi    = 75;
      cameraRadius = Math.max(W, H) * 1.8;
      break;
    case 'corner':
      cameraTheta  = 135;
      cameraPhi    = 45;
      cameraRadius = Math.max(W, H) * 2;
      break;
  }
  updateCameraPosition();
}

function resetCamera() {
  setCameraView('perspective');
}

// Orbit Controls (manual implementation)
function setupOrbitControls() {
  const canvas = document.getElementById('three-canvas');

  canvas.addEventListener('mousedown', e => {
    isMouseDown = true;
    mouseButton = e.button;
    lastMouseX  = e.clientX;
    lastMouseY  = e.clientY;
  });

  canvas.addEventListener('mouseup',   () => { isMouseDown = false; });
  canvas.addEventListener('mouseleave',() => { isMouseDown = false; });

  canvas.addEventListener('mousemove', e => {
    if (!isMouseDown) return;
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;

    if (mouseButton === 0) {
      // Left drag: orbit
      cameraTheta -= dx * 0.4;
      cameraPhi    = Math.max(5, Math.min(89, cameraPhi - dy * 0.4));
    } else if (mouseButton === 2) {
      // Right drag: pan
      const panSpeed = cameraRadius * 0.001;
      const right    = new THREE.Vector3();
      const up       = new THREE.Vector3();
      camera.getWorldDirection(up);
      right.crossVectors(up, camera.up).normalize();
      cameraTarget.addScaledVector(right, -dx * panSpeed);
      cameraTarget.y += dy * panSpeed;
    }

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    updateCameraPosition();
  });

  canvas.addEventListener('wheel', e => {
    cameraRadius = Math.max(2, Math.min(30, cameraRadius + e.deltaY * 0.01));
    updateCameraPosition();
  });

  canvas.addEventListener('contextmenu', e => e.preventDefault());
}

//  Raycaster (click to select furniture) 
function setupRaycaster() {
  const canvas = document.getElementById('three-canvas');
  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x =  ((e.clientX - rect.left)  / rect.width)  * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const meshes = [];
    furnitureGroup.traverse(obj => { if (obj.isMesh) meshes.push(obj); });
    const hits = raycaster.intersectObjects(meshes);

    if (hits.length > 0) {
      const hit  = hits[0].object;
      const name = hit.parent?.userData?.itemName || hit.name;
      showSelectedInfo(name);
    } else {
      hideSelectedInfo();
    }
  });
}

function showSelectedInfo(name) {
  const el = document.getElementById('selected-info');
  document.getElementById('selected-name').textContent = name;
  el.classList.add('visible');
}

function hideSelectedInfo() {
  document.getElementById('selected-info').classList.remove('visible');
}

//  Apply Shade to Mesh
function applyShade(group, shadePercent) {
  const factor = 1 - (shadePercent / 100) * 0.8;
  group.traverse(obj => {
    if (obj.isMesh && obj.material) {
      const col = obj.material.color.clone();
      col.multiplyScalar(factor);
      obj.material = obj.material.clone();
      obj.material.color = col;
    }
  });
}

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// Loading Screen 
function hideLoadingScreen() {
  setTimeout(() => {
    const screen = document.getElementById('loading-screen');
    screen.style.opacity = '0';
    setTimeout(() => screen.remove(), 500);
  }, 1300);
}

// Helpers 
function shadeThreeColor(color, amount) {
  const c = color.clone();
  c.r = Math.max(0, Math.min(1, c.r + amount));
  c.g = Math.max(0, Math.min(1, c.g + amount));
  c.b = Math.max(0, Math.min(1, c.b + amount));
  return c;
}