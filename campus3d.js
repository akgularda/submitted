import * as THREE from './vendor/three.module.js';
import { OrbitControls } from './vendor/OrbitControls.js';
import { mergeGeometries } from './vendor/BufferGeometryUtils.js';
import './campus3d-ui.js';

// Real-scale 3D TED University campus (İncesu & Aksu across Ziya Gökalp Caddesi),
// adapted from radiotedu/tedufest for SubmitTED Kariyer Zirvesi 2026.

const ready = document.readyState === 'loading'
  ? new Promise((resolve) => document.addEventListener('DOMContentLoaded', resolve, { once: true }))
  : Promise.resolve();
await ready;

const shell = document.getElementById('submitted-world');
const host = document.getElementById('world-canvas');
const loading = document.getElementById('world-loading');
const fallback = document.getElementById('world-fallback');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

if (shell && host) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute('aria-label', '3D TEDÜ kampüs planı. Döndürmek için sürükleyin.');
    initSummitCampus(renderer);
  } catch (error) {
    if (loading) loading.hidden = true;
    shell.classList.add('world-error');
    if (fallback) fallback.hidden = false;
    console.warn('3D campus fallback active:', error);
  }
}

function initSummitCampus(renderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 500);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.enablePan = false;
  controls.minDistance = 22;
  controls.maxDistance = 260;
  controls.minPolarAngle = 0.16;
  controls.maxPolarAngle = Math.PI / 2.2;
  controls.rotateSpeed = 0.55;
  controls.zoomSpeed = 0.7;
  controls.enableZoom = false;

  const hemi = new THREE.HemisphereLight(0xf4f7f5, 0x8f9a94, 2.05);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff4e2, 3.3);
  sun.position.set(-35, 65, -40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -75;
  sun.shadow.camera.right = 75;
  sun.shadow.camera.top = 65;
  sun.shadow.camera.bottom = -65;
  sun.shadow.normalBias = 0.04;
  sun.shadow.bias = -0.0003;
  sun.shadow.camera.far = 180;
  sun.shadow.radius = 3;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xd5e4ef, 1.9);
  fill.position.set(25, 18, -20);
  scene.add(fill);

  const groundShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(155, 155),
    new THREE.ShadowMaterial({ color: 0x1e2b24, opacity: 0.14 })
  );
  groundShadow.rotation.x = -Math.PI / 2;
  groundShadow.position.y = -1.1;
  groundShadow.receiveShadow = true;
  scene.add(groundShadow);

  const materials = new Map();
  function mat(color, metalness = 0, roughness = 0.65) {
    const key = [color, metalness, roughness].join();
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, metalness, roughness }));
    return materials.get(key);
  }

  const m = {
    white: mat('#fbfcfa'),
    metal: mat('#707c84', 0.74, 0.34),
    dark: mat('#222826', 0.42, 0.48),
    black: mat('#161b1e', 0.18, 0.78),
    navy: mat('#235789', 0.18, 0.38),
    green: mat('#5fa832', 0.15, 0.42),
    amber: mat('#b86e00', 0.15, 0.45),
    wood: mat('#c59268'),
    silver: mat('#d3d8dc', 0.68, 0.32)
  };

  const groups = {};
  for (const key of ['environment', 'red', 'screen', 'blue', 'tech', 'one-to-one', 'teacher-plus', 'food-beverage']) {
    groups[key] = new THREE.Group();
    groups[key].userData.zone = key === 'environment' ? null : (key === 'screen' ? 'red' : key);
    scene.add(groups[key]);
  }

  const animations = new THREE.Group();
  scene.add(animations);
  const flags = [];

  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  function mesh(geo, material, x, y, z, parent = groups.environment) {
    const object = new THREE.Mesh(geo, material);
    object.position.set(x, y, z);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function box(w, h, d, x, y, z, material, parent) {
    return mesh(new THREE.BoxGeometry(w, h, d), material, x, y, z, parent);
  }
  function cyl(r1, r2, h, x, y, z, material, parent, segments = 12) {
    return mesh(new THREE.CylinderGeometry(r1, r2, h, segments), material, x, y, z, parent);
  }
  function beam(a, b, r, material, parent) {
    const delta = b.clone().sub(a);
    const object = mesh(new THREE.CylinderGeometry(r, r, delta.length(), 8), material, 0, 0, 0, parent);
    object.position.copy(a).add(b).multiplyScalar(0.5);
    object.quaternion.setFromUnitVectors(V(0, 1, 0), delta.normalize());
    return object;
  }
  function emissive(color, intensity = 1) {
    return new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.3 });
  }

  const greenGlow = emissive('#7dc84d', 1.9);
  const blueGlow = emissive('#2b6cb0', 1.8);

  function canvasTexture(width, height, draw) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    draw(ctx, width, height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    return { canvas, ctx, texture };
  }

  function signTexture(text, bg = '#ffffff', fg = '#182024', sub = '') {
    return canvasTexture(1024, 256, (c, w, h) => {
      c.fillStyle = bg;
      c.fillRect(0, 0, w, h);
      c.textAlign = 'center';
      c.fillStyle = fg;
      c.font = '800 78px Arial';
      c.fillText(text, w / 2, sub ? 126 : 155);
      if (sub) {
        c.font = '600 32px Arial';
        c.fillText(sub, w / 2, 194);
      }
    }).texture;
  }

  function sign(text, x, y, z, w, h, parent, bg, fg, sub) {
    const material = new THREE.MeshBasicMaterial({ map: signTexture(text, bg, fg, sub), toneMapped: false });
    return mesh(new THREE.PlaneGeometry(w, h), material, x, y, z, parent);
  }

  // Main Conference & Red Zone Stage (in front of K Blok Fuaye, İncesu East)
  const stage = groups.red;
  box(17.5, 1.1, 8, 0, 0.72, -9, m.dark, stage);
  box(17.7, 0.14, 8.1, 0, 1.35, -9, mat('#343c39'), stage);
  box(17.5, 0.1, 0.1, 0, 1.46, -4.9, greenGlow, stage);

  for (const x of [-8.2, 8.2]) {
    for (const z of [-12.2, -5.8]) {
      box(1.1, 0.18, 1.1, x, 1.52, z, m.metal, stage);
      for (const dx of [-0.25, 0.25]) {
        for (const dz of [-0.25, 0.25]) {
          beam(V(x + dx, 1.6, z + dz), V(x + dx, 9.6, z + dz), 0.06, m.silver, stage);
        }
      }
    }
  }

  function horizontalTruss(x1, x2, y, z) {
    for (const dy of [-0.22, 0.22]) {
      for (const dz of [-0.22, 0.22]) {
        beam(V(x1, y + dy, z + dz), V(x2, y + dy, z + dz), 0.055, m.silver, stage);
      }
    }
  }
  horizontalTruss(-8.4, 8.4, 9.4, -5.8);
  horizontalTruss(-8.4, 8.4, 9.4, -12.2);

  // Clean flat architectural canopy
  box(18.6, 0.35, 8.8, 0, 9.85, -9, mat('#2c3431'), stage);
  sign('SUBMITTED 2026', 0, 10.1, -4.55, 8.2, 1.15, stage, '#182024', '#7dc84d');

  // Keynote LED Screen
  const screen = canvasTexture(1024, 512, () => {});
  const led = new THREE.MeshBasicMaterial({ map: screen.texture, toneMapped: false });
  box(13.2, 6, 0.24, 0, 5.1, -11.75, m.black, groups.screen);
  mesh(new THREE.PlaneGeometry(12.8, 5.6), led, 0, 5.1, -11.61, groups.screen);
  for (const x of [-6.58, 6.58]) box(0.08, 6, 0.09, x, 5.1, -11.55, greenGlow, groups.screen);
  for (const y of [2.1, 8.1]) box(13.2, 0.07, 0.09, 0, y, -11.55, blueGlow, groups.screen);

  const logoImg = new Image();
  logoImg.src = 'assets/submitted-logo-white.svg';
  let logoReady = false;
  logoImg.onload = () => {
    logoReady = true;
    drawLED(0);
  };

  function drawLED(time) {
    const c = screen.ctx;
    const w = 1024;
    const h = 512;
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#141a19');
    g.addColorStop(0.55, '#182734');
    g.addColorStop(1, '#1c2b24');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);

    c.strokeStyle = '#7dc84d';
    c.globalAlpha = 0.28;
    c.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      c.strokeRect(48 + i * 24, 34 + i * 16, w - 96 - i * 48, h - 68 - i * 32);
    }
    c.globalAlpha = 1;

    if (logoReady) {
      c.drawImage(logoImg, 250, 120, 520, 110);
    } else {
      c.fillStyle = '#ffffff';
      c.textAlign = 'center';
      c.font = '800 68px Arial';
      c.fillText('SubmitTED 2026', w / 2, 200);
    }

    c.fillStyle = '#7dc84d';
    c.textAlign = 'center';
    c.font = '700 28px Arial';
    c.fillText('KARİYER VE LİDERLİK ZİRVESİ · 20–21 EKİM 2026', w / 2, 315);
    c.fillStyle = '#d0d7dc';
    c.font = '600 21px Arial';
    const snap = window.SubmitTEDTelemetry ? window.SubmitTEDTelemetry.getSnapshot() : null;
    const totalCount = snap ? snap.totalInside : Math.round(610 + Math.sin(time * 0.8) * 3);
    const routeLine = snap && snap.routing ? `${snap.routing.speaker} → ${snap.zonesById[snap.routing.targetZoneId]?.shortName || ''}` : '6 ZONE · CANLI TELEMETRİ';
    c.fillText(`${routeLine} · TOPLAM KAMPÜS: ${totalCount} KİŞİ`, w / 2, 375);
    screen.texture.needsUpdate = true;
  }
  drawLED(0);

  groups.red.rotation.y = -Math.PI / 2;
  groups.red.position.x = 5;
  groups.screen.rotation.y = -Math.PI / 2;
  groups.screen.position.x = 5;

  function booth(x, z, color, label, category = 'red') {
    const parent = groups[category];
    box(4.3, 0.2, 3.25, x, 0.35, z, mat('#e4e7ea'), parent);
    box(4, 2.7, 0.14, x, 1.8, z - 1.35, m.white, parent);
    box(0.14, 2.7, 2.8, x - 1.95, 1.8, z, m.white, parent);
    for (const dx of [-1.96, 1.96]) {
      for (const dz of [-1.35, 1.35]) {
        beam(V(x + dx, 0.5, z + dz), V(x + dx, 3.4, z + dz), 0.045, m.silver, parent);
      }
    }
    box(4.3, 0.28, 3.2, x, 3.45, z, mat(color), parent);
    box(4.3, 0.58, 0.15, x, 3.12, z + 1.52, mat(color), parent);
    sign(label, x, 3.14, z + 1.61, 3.6, 0.42, parent, color, '#ffffff');
    box(3.4, 0.94, 0.7, x, 0.94, z + 0.95, m.white, parent);
    box(3.6, 0.09, 0.9, x, 1.46, z + 0.95, mat(color), parent);
    sign('SUBMITTED', x, 0.98, z + 1.315, 2.3, 0.44, parent, '#ffffff', color);
  }

  function table(x, z, parent = groups['food-beverage']) {
    cyl(0.75, 0.75, 0.1, x, 1.2, z, m.wood, parent, 24);
    cyl(0.07, 0.07, 1, x, 0.67, z, m.white, parent);
    for (const [dx, dz] of [[0, -1.1], [0, 1.1], [-1.1, 0], [1.1, 0]]) {
      cyl(0.26, 0.26, 0.1, x + dx, 0.68, z + dz, m.white, parent);
      beam(V(x + dx, 0.25, z + dz), V(x + dx, 0.65, z + dz), 0.06, m.wood, parent);
    }
  }

  const flagTexture = canvasTexture(256, 512, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#182734');
    g.addColorStop(0.55, '#1570EF');
    g.addColorStop(1, '#D92D20');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffffff';
    c.textAlign = 'center';
    c.save();
    c.translate(135, 255);
    c.rotate(-Math.PI / 2);
    c.font = '900 44px Arial';
    c.fillText('SUBMITTED 26', 0, 0);
    c.restore();
  }).texture;

  function flag(x, z, phase) {
    const parent = groups.red;
    box(0.65, 0.12, 0.65, x, 0.28, z, m.silver, parent);
    beam(V(x, 0.35, z), V(x, 6.4, z), 0.055, m.silver, parent);
    mesh(new THREE.SphereGeometry(0.09, 8, 6), m.white, x, 6.5, z, parent);
    const geometry = new THREE.PlaneGeometry(1.25, 3.55, 12, 18);
    geometry.translate(0.625, 0, 0);
    const cloth = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ map: flagTexture, side: THREE.DoubleSide, roughness: 0.7 })
    );
    cloth.position.set(x, 4.45, z);
    cloth.userData.zone = 'red';
    cloth.userData.phase = phase;
    cloth.userData.original = geometry.attributes.position.array.slice();
    animations.add(cloth);
    flags.push(cloth);
  }

  function tree(x, z, scale = 1) {
    const p = groups.environment;
    cyl(0.75, 0.8, 0.7, x, 0.5, z, mat('#dfe3df'), p);
    cyl(0.16, 0.22, 2.1 * scale, x, 1.5 * scale, z, m.wood, p);
    mesh(new THREE.IcosahedronGeometry(1.35 * scale, 1), mat('#7fa379'), x, 3.15 * scale, z, p);
    mesh(new THREE.IcosahedronGeometry(0.95 * scale, 1), mat('#9ebe93'), x + 0.65 * scale, 3 * scale, z + 0.35, p);
  }

  // İncesu Campus Courtyard
  const stone = mat('#e4e3dc');
  const facade = mat('#f3f3ee');
  const glass = mat('#85aab3', 0.3, 0.24);

  box(67, 1.15, 52, -1, -0.52, 0, mat('#d1d6ce'));
  box(65, 0.15, 50, -1, 0.09, 0, stone);

  function gardenOutline(inset = 0) {
    const r = 15.2 - inset;
    const cx = -8.8;
    const right = 23.2 - inset;
    const shape = new THREE.Shape();
    shape.moveTo(cx, -r);
    shape.lineTo(right, -r);
    shape.lineTo(right, r);
    shape.lineTo(cx, r);
    shape.absarc(cx, 0, r, Math.PI / 2, Math.PI * 1.5, false);
    shape.closePath();
    return shape;
  }

  function gardenSurface(shape, y, depth, material) {
    const surface = mesh(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 48 }), material, 0, y, 0);
    surface.rotation.x = -Math.PI / 2;
    return surface;
  }

  gardenSurface(gardenOutline(), 0.16, 0.22, mat('#b3bcb2'));
  gardenSurface(gardenOutline(0.35), 0.39, 0.05, mat('#8eb36b'));

  const promenade = gardenOutline(-2.25);
  promenade.holes.push(new THREE.Path(gardenOutline(-0.2).getPoints(96)));
  const promenadeMesh = mesh(new THREE.ShapeGeometry(promenade, 96), stone, 0, 0.27, 0);
  promenadeMesh.rotation.x = -Math.PI / 2;

  for (let i = 0; i < 3; i++) box(1.1, 0.1 * (i + 1), 7, -25.9 + i * 0.6, 0.16 + i * 0.05, 0, stone);

  // Career Booths & Check-in along İncesu courtyard
  box(45, 0.85, 0.5, -1, 0.7, 16, mat('#c8c5b6'));
  box(45, 0.1, 0.7, -1, 1.16, 16, mat('#a6aba4'));
  box(39, 0.12, 5.2, -5, 0.45, 13.1, stone);

  booth(-16, -17.4, '#D92D20', 'AKFEN · DENİZBANK', 'red');
  booth(-10, -17.4, '#D92D20', 'EY · COCA-COLA', 'red');
  booth(-4, -17.4, '#D92D20', 'KPMG · ANADOLU EFES', 'red');

  table(14, 13.2, groups['food-beverage']);
  table(7, 13.2, groups['food-beverage']);
  table(1.5, 13.2, groups['food-beverage']);

  // North boundary & trees
  box(57, 1.8, 0.5, -1, 1.05, -22, mat('#c8c5b6'));
  box(57, 0.15, 0.7, -1, 2, -22, mat('#a6aba4'));
  for (let x = -28; x <= 27; x += 2.8) box(0.14, 1.1, 0.14, x, 2.62, -22, m.dark);
  beam(V(-28, 3.12, -22), V(27, 3.12, -22), 0.05, m.dark);

  for (let x = -23; x < 25; x += 6) tree(x, -24.4, 0.9);
  for (const [x, z] of [[-22, 8], [-22, -8], [23, 13], [23, -13]]) tree(x, z, 0.85);
  for (const x of [-19, -13, -7]) flag(x, -11.5, x * 0.3);
  flag(-23, 2, 1);
  flag(20, 12, 2);

  function building(name, x, z, w, d, h, accent = '#b5b9b6') {
    box(w, h, d, x, h / 2 + 0.2, z, facade);
    box(w + 0.3, 0.25, d + 0.3, x, h + 0.4, z, mat(accent));
    box(w - 0.5, 0.08, d - 0.5, x, h + 0.57, z, mat('#dadcd6'));
    for (let y = 1.6; y < h - 0.4; y += 2.4) {
      for (let xx = x - w / 2 + 1.1; xx < x + w / 2 - 0.7; xx += 2.5) {
        for (const side of [-1, 1]) {
          box(1.65, 1.4, 0.065, xx, y, z + side * (d / 2 + 0.04), glass);
          box(1.85, 0.1, 0.18, xx, y - 0.76, z + side * (d / 2 + 0.09), m.white);
        }
      }
      for (let zz = z - d / 2 + 1.1; zz < z + d / 2 - 0.7; zz += 2.5) {
        for (const side of [-1, 1]) {
          box(0.065, 1.4, 1.65, x + side * (w / 2 + 0.04), y, zz, glass);
        }
      }
      box(w + 0.16, 0.15, d + 0.16, x, y + 0.95, z, m.white);
    }
    const labelTexture = signTexture(name, '#ffffff', '#263238');
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture, depthTest: false, toneMapped: false }));
    label.position.set(x, h + 2.6, z);
    label.scale.set(name.length > 9 ? 12 : 8, 2.2, 1);
    label.renderOrder = 5;
    scene.add(label);
  }

  building('A BLOK · TEACHER+', -28, 0, 7, 38, 10.5, '#6E56CF');
  building('B BLOK · TEACHER+', 0, 20, 57, 7, 10.5, '#6E56CF');
  building('K BLOK · RED ZONE (FUAYE)', 29, 0, 8, 34, 6.5, '#D92D20');
  box(6.5, 0.2, 27, 29, 6.95, 0, mat('#bdc7c4'));
  for (let z = -11; z < 12; z += 3) box(5, 0.16, 1.8, 29, 7.1, z, mat('#6c8994', 0.5, 0.3));

  // Ziya Gökalp Caddesi separating İncesu and Aksu
  box(11, 0.09, 77, -38, 0.03, 2, mat('#8c9699'));
  box(1.4, 0.18, 77, -31.8, 0.13, 2, stone);
  box(1.4, 0.18, 77, -44.2, 0.13, 2, stone);
  for (let z = -34; z < 39; z += 6) box(0.12, 0.016, 2.8, -38, 0.09, z, mat('#e8e5d6'));
  for (let x = -42.7; x < -33; x += 1.2) box(0.7, 0.02, 4, x, 0.095, 8, mat('#faf6e9'));
  const streetLabel = sign('ZİYA GÖKALP CADDESİ', -38, 0.13, -3, 23, 2, groups.environment, '#8c9699', '#ffffff');
  streetLabel.rotation.x = -Math.PI / 2;
  streetLabel.rotation.z = Math.PI / 2;

  // Aksu Campus Courtyard (C-H Blocks)
  box(46, 1.1, 51, -69, -0.52, 0, mat('#d3d8d0'));
  box(45, 0.13, 50, -69, 0.1, 0, stone);
  box(20, 0.1, 21, -69, 0.2, 0, mat('#9cb585'));

  building('D BLOK · TECH & INNOVATION', -85, 0, 7, 38, 10, '#00A847');
  building('F BLOK', -70, 20, 24, 7, 8);
  building('C BLOK', -60, 9, 8, 15, 6);
  building('G BLOK · 1:1 MEETINGS', -69, -20, 33, 7, 9, '#1D4F7C');
  building('H BLOK', -50, -10, 7, 19, 9);
  building('E BLOK · BLUE ZONE (SPOR MRK)', -50, 19, 8, 16, 7, '#1570EF');

  for (let i = 0; i < 4; i++) box(15, 0.2 * (i + 1), 0.8, -72, 0.2 + i * 0.1, 7 + i * 0.8, stone);

  // Aksu Zones: G Blok Meetings Hall, D Blok Tech Conference Hall, E Blok Blue Zone Stands, Courtyard Food&Beverage Tables
  sign('G BLOK · 1:1 MÜLAKAT SALONU', -72, 4.5, -13, 8.5, 1.4, groups['one-to-one'], '#1D4F7C', '#ffffff');
  table(-76, -3, groups['food-beverage']);
  table(-69, -3, groups['food-beverage']);
  sign('D BLOK · TECH & INNOVATION KONFERANS', -74, 4.8, 6, 10.5, 1.5, groups.tech, '#00A847', '#ffffff');
  booth(-55, 17, '#1570EF', 'BLUE ZONE · ASELSAN / TUSAŞ / MİLSOFT', 'blue');
  sign('A BLOK · TEACHER+ KONFERANS SALONU', -18, 5.2, 14, 10.5, 1.5, groups['teacher-plus'], '#6E56CF', '#ffffff');

  for (const [x, z] of [[-88, -22], [-88, 22], [-59, -13], [-80, 13]]) tree(x, z, 0.8);

  // Instanced Summit Attendees
  let seed = 27;
  function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }
  const people = [];
  for (let i = 0; i < 165; i++) {
    people.push({
      x: -20 + random() * 29,
      z: -10 + random() * 18,
      angle: random() * Math.PI * 2,
      height: 0.78 + random() * 0.22,
      color: Math.floor(random() * 5)
    });
  }
  const shirtColors = ['#182734', '#235789', '#5fa832', '#e9ecef', '#495057'];
  const temp = new THREE.Object3D();
  function instances(geometry, material, items, transform) {
    const inst = new THREE.InstancedMesh(geometry, material, items.length);
    inst.castShadow = true;
    inst.receiveShadow = true;
    items.forEach((person, i) => {
      transform(person, temp);
      temp.updateMatrix();
      inst.setMatrixAt(i, temp.matrix);
    });
    scene.add(inst);
  }
  for (let color = 0; color < shirtColors.length; color++) {
    const subset = people.filter((x) => x.color === color);
    instances(new THREE.CapsuleGeometry(0.14, 0.35, 3, 6), mat(shirtColors[color]), subset, (p, t) => {
      t.position.set(p.x, 0.83 * p.height + 0.2, p.z);
      t.rotation.set(0, p.angle, 0);
      t.scale.set(1, p.height, 1);
    });
  }
  instances(new THREE.SphereGeometry(0.135, 8, 6), mat('#c7977e'), people, (p, t) => {
    t.position.set(p.x, 1.25 * p.height + 0.2, p.z);
    t.rotation.set(0, 0, 0);
    t.scale.set(1, 1, 1);
  });

  // Merge static geometry by zone/material for smooth 60fps performance
  function optimize(group) {
    group.updateMatrixWorld(true);
    const batches = new Map();
    const originals = [];
    group.traverse((o) => {
      if (!o.isMesh || Array.isArray(o.material)) return;
      const key = o.material.uuid;
      const geometry = o.geometry.clone().applyMatrix4(o.matrixWorld);
      if (!batches.has(key)) batches.set(key, { material: o.material, geometries: [] });
      batches.get(key).geometries.push(geometry);
      originals.push(o);
    });
    for (const o of originals) {
      o.parent.remove(o);
      o.geometry.dispose();
    }
    for (const { material, geometries } of batches.values()) {
      const geometry = mergeGeometries(geometries, false);
      if (geometry) {
        const o = new THREE.Mesh(geometry, material);
        o.castShadow = true;
        o.receiveShadow = true;
        o.userData.zone = group.userData.zone;
        group.add(o);
      }
      geometries.forEach((g) => g.dispose());
    }
  }
  Object.values(groups).forEach((g) => {
    optimize(g);
    g.position.set(0, 0, 0);
    g.rotation.set(0, 0, 0);
  });

  const locations = {
    red: { target: [16, 3, 0], pin: [24, 11.5, -2], color: '#D92D20', label: 'Red Zone · Fuaye', camera: 'incesu' },
    blue: { target: [-53, 2, 17], pin: [-50, 10.5, 19], color: '#1570EF', label: 'Blue Zone · Spor Mrk.', camera: 'aksu' },
    tech: { target: [-74, 2, 6], pin: [-76, 6.5, 6], color: '#00A847', label: 'Tech&Innovation', camera: 'aksu' },
    'one-to-one': { target: [-72, 2, -13], pin: [-72, 6.5, -13], color: '#1D4F7C', label: 'One-to-One · G Blok', camera: 'interviews' },
    'teacher-plus': { target: [-18, 2, 15], pin: [-16, 8.5, 16], color: '#6E56CF', label: 'Teacher+ · A/B Blok', camera: 'incesu' },
    'food-beverage': { target: [-73, 2, -3], pin: [-73, 6, -3], color: '#D97706', label: 'Food&Beverage', camera: 'aksu' }
  };

  const pins = document.getElementById('world-hotspots');
  for (const [key, loc] of Object.entries(locations)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'world-hotspot';
    b.hidden = true;
    b.setAttribute('aria-label', loc.label + ' alanını seç');
    b.setAttribute('aria-pressed', String(key === 'red'));
    b.dataset.zone = key;
    b.style.setProperty('--pin-color', loc.color);
    b.innerHTML = `<i></i><span>${loc.label}</span><em class="pin-pct" data-pin-pct="${key}"></em>`;
    b.addEventListener('click', () => pickZone(key));
    if (pins) pins.appendChild(b);
    loc.element = b;
    loc.vector = V(...loc.pin);
  }

  function syncHotspotOccupancy() {
    if (!window.SubmitTEDTelemetry) return;
    const snap = window.SubmitTEDTelemetry.getSnapshot();
    for (const [key, loc] of Object.entries(locations)) {
      const z = snap.zonesById[key];
      const pctEl = loc.element?.querySelector('[data-pin-pct]');
      if (z && pctEl) {
        pctEl.textContent = `%${z.pct}`;
      }
    }
  }
  if (window.SubmitTEDTelemetry) {
    window.SubmitTEDTelemetry.subscribe(() => syncHotspotOccupancy());
  }

  const selection = new THREE.Mesh(
    new THREE.RingGeometry(1.4, 1.58, 64),
    new THREE.MeshBasicMaterial({ color: '#D92D20', transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false })
  );
  selection.rotation.x = -Math.PI / 2;
  selection.position.set(16, 0.6, 0);
  scene.add(selection);

  let active = 'red';
  function pickZone(key, focus = true) {
    active = key;
    const loc = locations[key];
    if (!loc) return;
    selection.position.set(loc.target[0], 0.6, loc.target[2]);
    selection.material.color.set(loc.color);
    document.dispatchEvent(new CustomEvent('summit-scene-pick', { detail: { key, focus } }));
  }

  document.addEventListener('summit-zone-selected', (e) => {
    const key = e.detail.key;
    if (locations[key]) {
      active = key;
      selection.position.set(locations[key].target[0], 0.6, locations[key].target[2]);
      selection.material.color.set(locations[key].color);
      for (const [k, l] of Object.entries(locations)) {
        if (l.element) l.element.setAttribute('aria-pressed', String(k === key));
      }
      if (e.detail.focus) setView(locations[key].camera);
    }
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pointerDown;
  const clickables = [groups.red, groups.blue, groups.tech, groups['one-to-one'], groups['teacher-plus'], groups['food-beverage'], ...flags];

  function rayAt(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(clickables, true).find((h) => h.object.userData.zone || h.object.parent?.userData.zone);
  }

  renderer.domElement.addEventListener('pointerdown', (e) => {
    pointerDown = { x: e.clientX, y: e.clientY };
  });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!pointerDown || Math.hypot(pointerDown.x - e.clientX, pointerDown.y - e.clientY) > 7) return;
    const hit = rayAt(e);
    if (hit) pickZone(hit.object.userData.zone || hit.object.parent.userData.zone);
    pointerDown = null;
  });

  let lastHover = 0;
  renderer.domElement.addEventListener('pointermove', (e) => {
    if (e.buttons || performance.now() - lastHover < 70) return;
    lastHover = performance.now();
    host.style.cursor = rayAt(e) ? 'pointer' : 'grab';
  });

  const views = {
    incesu: { position: [-32, 65, -68], target: [2, 0, 0] },
    aksu: { position: [-103, 64, -58], target: [-70, 0, 0] },
    aerial: { position: [-32, 154, -0.1], target: [-32, 0, 0] },
    campus: { position: [-88, 98, -98], target: [-32, 0, 0] },
    interviews: { position: [-54, 34, -46], target: [-72, 1, -12] }
  };

  let transition = null;
  let paused = reducedMotion.matches;
  let visible = false;
  let lastTime = 0;
  let lastLED = 0;

  function responsivePosition(p) {
    return V(...p).multiplyScalar(Math.max(1, 1.22 / (host.clientWidth / Math.max(host.clientHeight, 1))));
  }

  function setView(name, immediate = false) {
    const view = views[name];
    if (!view) return;
    const target = V(...view.target);
    const offset = V(...view.position).sub(target);
    const destination = responsivePosition(offset.toArray()).add(target);
    if (immediate || reducedMotion.matches) {
      camera.position.copy(destination);
      controls.target.copy(target);
      controls.update();
      transition = null;
    } else {
      transition = { from: camera.position.clone(), to: destination, startTarget: controls.target.clone(), target, start: performance.now() };
    }
    document.querySelectorAll('[data-camera]').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.camera === name));
    });
  }

  controls.addEventListener('start', () => {
    transition = null;
    document.querySelectorAll('[data-camera]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
  });

  function focusCampus(name) {
    setView(name);
    if (name === 'aksu' && locations[active].camera !== 'aksu') pickZone('blue', false);
    else if (name === 'incesu' && locations[active].camera === 'aksu') pickZone('red', false);
  }

  document.querySelectorAll('[data-camera]').forEach((b) => {
    b.addEventListener('click', () => focusCampus(b.dataset.camera));
  });

  const resetBtn = document.getElementById('world-reset');
  if (resetBtn) resetBtn.addEventListener('click', () => setView('campus'));

  function zoom(factor) {
    transition = null;
    const offset = camera.position.clone().sub(controls.target);
    const length = THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance);
    camera.position.copy(controls.target).add(offset.setLength(length));
    controls.update();
  }

  const zoomInBtn = document.getElementById('world-zoom-in');
  const zoomOutBtn = document.getElementById('world-zoom-out');
  const motionBtn = document.getElementById('world-motion');
  if (zoomInBtn) zoomInBtn.addEventListener('click', () => zoom(0.83));
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => zoom(1.2));

  function motionUI() {
    if (!motionBtn) return;
    motionBtn.setAttribute('aria-pressed', String(paused));
    motionBtn.setAttribute('aria-label', paused ? 'Sahne hareketini başlat' : 'Sahne hareketini duraklat');
    motionBtn.textContent = paused ? '▷' : 'Ⅱ';
  }
  if (motionBtn) {
    motionBtn.addEventListener('click', () => {
      paused = !paused;
      motionUI();
    });
    motionUI();
  }

  function resize() {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    const preset = document.querySelector('[data-camera][aria-pressed="true"]');
    if (preset) setView(preset.dataset.camera, true);
  }

  const resizer = new ResizeObserver(resize);
  resizer.observe(host);
  resize();
  setView('campus', true);

  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
  }, { rootMargin: '220px' }).observe(host);

  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    visible = false;
    if (fallback) fallback.hidden = false;
    shell.classList.add('world-error');
  });

  const projected = new THREE.Vector3();
  let animTime = 0;

  function frame(time) {
    requestAnimationFrame(frame);
    const dt = Math.min((time - lastTime) / 1000, 0.06);
    lastTime = time;
    if (!visible || document.hidden) return;

    if (transition) {
      const p = THREE.MathUtils.clamp((time - transition.start) / 900, 0, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      camera.position.lerpVectors(transition.from, transition.to, ease);
      controls.target.lerpVectors(transition.startTarget, transition.target, ease);
      if (p === 1) transition = null;
    }

    controls.update();

    if (!paused) {
      animTime += dt;
      for (const f of flags) {
        const attr = f.geometry.attributes.position;
        const original = f.userData.original;
        for (let i = 0; i < attr.count; i++) {
          const x = original[i * 3];
          attr.setZ(i, Math.sin(x * 3.5 + animTime * 2.4 + original[i * 3 + 1] * 1.2 + f.userData.phase) * 0.14 * x);
        }
        attr.needsUpdate = true;
      }
      selection.material.opacity = 0.55 + Math.sin(animTime * 2.2) * 0.2;
      if (time - lastLED > 140) {
        drawLED(animTime);
        lastLED = time;
      }
    }

    for (const [key, loc] of Object.entries(locations)) {
      if (!loc.element) continue;
      projected.copy(loc.vector).project(camera);
      const x = (projected.x * 0.5 + 0.5) * host.clientWidth;
      const y = (-projected.y * 0.5 + 0.5) * host.clientHeight;
      const compact = host.clientWidth < 520;
      const show = projected.z < 1 && x > 0 && x < host.clientWidth && y > 8 && y < host.clientHeight - 46 &&
        (!compact || key === active || (controls.target.x < -45 ? loc.camera === 'aksu' : loc.camera === 'incesu'));
      loc.element.hidden = !show;
      const px = THREE.MathUtils.clamp(x, loc.element.offsetWidth / 2 + 8, host.clientWidth - loc.element.offsetWidth / 2 - 8);
      loc.element.style.transform = `translate(-50%,-50%) translate(${px.toFixed(1)}px,${y.toFixed(1)}px)`;
      loc.element.setAttribute('aria-pressed', String(key === active));
    }

    renderer.render(scene, camera);
  }

  if (loading) loading.hidden = true;
  shell.dataset.ready = 'true';
  requestAnimationFrame(frame);
  renderer.render(scene, camera);
}
