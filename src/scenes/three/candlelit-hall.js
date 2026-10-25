/**
 * Candlelit Hall — production Three.js / WebGL renderer (render mode "three").
 *
 * Real 3D, not CSS perspective: PBR materials (Poly Haven CC0 textures), GLB props (Poly Haven CC0),
 * a Poly Haven HDRI processed through PMREM for reflections, physically based point/spot lights with
 * real-time shadows, ACES Filmic tone mapping and sRGB output. The DOM card stays a DOM element
 * (crisp Arabic type, accessible button) on top; an invisible proxy of it casts its shadow on the table.
 *
 * Layout follows the canonical Candlelit Hall (Scene.dc.html): dark warm hall, warm glow above the
 * card, a wine table whose edge sits under the card, two candle pairs in the foreground at the stage
 * edges, and three depths of bokeh. World units are metres; the 390×844 stage maps to the z = 0 plane
 * (1 stage px = 1 mm) and the camera is framed from the stage rect every resize (camera/framing.js).
 *
 * Quality tiers (engine/Quality.js):
 *   high      HDRI 2k env, all props, 2048 soft shadows, glass transmission, DPR ≤ 2
 *   balanced  HDRI 1k env (derived), props without the heavy flower set, 1024 shadows, DPR ≤ 1.5
 *   low       no HDRI/props/shadows — room, table, candles, chandelier only, DPR 1
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBMLoader } from 'three/examples/jsm/loaders/RGBMLoader.js';
import { computeFraming, applyFraming, sx, sy } from '../../camera/framing.js';

const TABLE_Y = sy(596);              // canonical table edge line (stage y 596) → world y at z = 0
const CARD = { w: 0.3, h: 0.42, cx: sx(195), cy: sy(378) };
const D0 = 1.1;                       // reference camera distance (390×844 stage, vfov 42°)
const WARM = new THREE.Color('#ffb46a'), FLAME = new THREE.Color('#ffcf8a');

/** position for an object at depth z that should appear at stage pixel (px, py) on the reference framing */
const at = (px, py, z) => new THREE.Vector3(sx(px) * (D0 - z) / D0, sy(py) * (D0 - z) / D0, z);

const ASSETS = {
  linen: { base: 'p0/materials/rough-linen/basecolor.jpg', normal: 'p0/materials/rough-linen/normal.jpg', arm: 'p0/materials/rough-linen/arm.jpg' },
  plaster: { base: 'p0/materials/plastered-wall-03/basecolor.jpg', normal: 'p0/materials/plastered-wall-03/normal.jpg', arm: 'p0/materials/plastered-wall-03/arm.jpg' },
  marble: { base: 'p0/materials/marble-01/basecolor.jpg', normal: 'p0/materials/marble-01/normal.jpg', arm: 'p0/materials/marble-01/arm.jpg' },
  // Poly Haven 'courtyard' HDRI as RGBM16 PNG (derived from p0/hdri/courtyard-2k.exr by tools/make_derived.py —
  // EXR is not a web-servable type on every host; RGBM keeps linear HDR up to 16×)
  hdri: { high: 'p0-derived/hdri/courtyard-2k-rgbm16.png', balanced: 'p0-derived/hdri/courtyard-1k-rgbm16.png' },
  // Poly Haven GLBs repackaged losslessly as glTF JSON + textures (tools/glb_to_web.py) so any static host serves them
  chandelier: 'p0-derived/models/lantern-chandelier-01/lantern-chandelier-01.gltf.json',
  goblets: 'p0-derived/models/brass-goblets/brass-goblets.gltf.json',
  vase: 'p0-derived/models/brass-vase-02/brass-vase-02.gltf.json',
  flowers: 'p0-derived/models/flower-empodium/flower-empodium.gltf.json',
  lantern: 'p0-derived/models/lantern-01/lantern-01.gltf.json',
};

function canvasTexture(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const softDisc = () => canvasTexture(128, 128, (g, w) => {
  const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, w, w);
});
const flameTex = () => canvasTexture(64, 160, (g, w, h) => {
  // teardrop: hot white core → amber → transparent
  g.translate(w / 2, h * 0.78);
  const grad = g.createRadialGradient(0, -h * 0.12, 1, 0, -h * 0.18, h * 0.5);
  grad.addColorStop(0, 'rgba(255,252,236,1)'); grad.addColorStop(0.25, 'rgba(255,220,140,.95)'); grad.addColorStop(0.55, 'rgba(255,150,60,.55)'); grad.addColorStop(1, 'rgba(255,110,30,0)');
  g.fillStyle = grad;
  g.beginPath(); g.moveTo(0, -h * 0.74); g.bezierCurveTo(w * 0.42, -h * 0.34, w * 0.36, h * 0.06, 0, h * 0.12); g.bezierCurveTo(-w * 0.36, h * 0.06, -w * 0.42, -h * 0.34, 0, -h * 0.74); g.fill();
});
const waxGlow = () => canvasTexture(4, 128, (g, w, h) => {
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgb(255,196,120)'); grad.addColorStop(0.1, 'rgb(170,90,36)'); grad.addColorStop(0.35, 'rgb(70,32,12)'); grad.addColorStop(1, 'rgb(34,15,6)'); // fake subsurface: wax glows near the flame
  g.fillStyle = grad; g.fillRect(0, 0, w, h);
});

export async function mountCandlelitHall(layer, ctx) {
  const q = ctx.quality, tier = q.tier;
  const base = ctx.assetBase;
  const disposables = new Set();
  const track = (o) => { if (o) disposables.add(o); return o; };

  // ---------------------------------------------------------------- renderer
  const canvas = document.createElement('canvas');
  canvas.className = 'candlelit-gl';
  canvas.setAttribute('aria-hidden', 'true');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: tier !== 'low', alpha: false, powerPreference: 'high-performance', stencil: false });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const EXPOSURE = 0.72;
  renderer.toneMappingExposure = EXPOSURE;
  renderer.shadowMap.enabled = tier !== 'low';
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, q.dprCap));

  const scene = new THREE.Scene();
  const BG = new THREE.Color('#120809');
  scene.background = BG;
  scene.fog = new THREE.Fog(BG, 1.6, 6.5);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.02, 30);

  // ---------------------------------------------------------------- loading
  const manager = new THREE.LoadingManager();
  const texLoader = new THREE.TextureLoader(manager);
  const gltfLoader = new GLTFLoader(manager);
  const tex = (path, { srgb = false, repeat = [1, 1] } = {}) => new Promise((res, rej) => texLoader.load(base + path, (t) => {
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat);
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    res(track(t));
  }, undefined, () => rej(new Error('texture ' + path))));
  const pbr = async (set, repeat, extra = {}, Mat = THREE.MeshStandardMaterial) => {
    const [map, normalMap, arm] = await Promise.all([tex(set.base, { srgb: true, repeat }), tex(set.normal, { repeat }), tex(set.arm, { repeat })]);
    // ARM = AO (R) · roughness (G) · metalness (B) — the glTF channel convention three.js reads
    return track(new Mat({ map, normalMap, aoMap: arm, roughnessMap: arm, metalnessMap: arm, metalness: 1, roughness: 1, ...extra }));
  };
  const glb = (path) => new Promise((res, rej) => gltfLoader.load(base + path, (g) => res(g.scene), undefined, () => rej(new Error('model ' + path))));
  const optional = (p) => p.catch((e) => { console.warn('[candlelit] optional asset failed', e.message); return null; });

  const wantProps = tier !== 'low';
  const [cloth, plaster, marble, envTex, chandelier, goblets, vase, flowers, lantern, diya] = await Promise.all([
    // wine tablecloth: woven linen PBR + a coloured sheen and low dielectric specular, so the cloth keeps
    // its colour at the grazing angle the table is seen at (plain F0 = 0.04 reads grey-tan there)
    pbr(ASSETS.linen, [7, 4], { color: new THREE.Color('#3e0a15'), envMapIntensity: 0.15, normalScale: new THREE.Vector2(0.9, 0.9),
      specularIntensity: 0.15, sheen: 0.7, sheenColor: new THREE.Color('#5a1626'), sheenRoughness: 0.6 }, THREE.MeshPhysicalMaterial),
    pbr(ASSETS.plaster, [3, 1.6], { color: new THREE.Color('#8a5c4c'), normalScale: new THREE.Vector2(1.2, 1.2) }),
    pbr(ASSETS.marble, [2, 2], { color: new THREE.Color('#6d5550') }),
    tier === 'low' ? null : optional(new Promise((res, rej) => new RGBMLoader(manager).setMaxRange(16).load(base + ASSETS.hdri[tier === 'high' ? 'high' : 'balanced'], res, undefined, () => rej(new Error('hdri'))))),
    glb(ASSETS.chandelier),
    wantProps ? optional(glb(ASSETS.goblets)) : null,
    wantProps ? optional(glb(ASSETS.vase)) : null,
    wantProps ? optional(glb(ASSETS.flowers)) : null,
    wantProps ? optional(glb(ASSETS.lantern)) : null,
    null, // brass diya lantern is a hanging piece (chain) — not placed on this table; kept in the library
  ]);

  // ---------------------------------------------------------------- environment (HDRI → warm PMREM)
  const pmrem = new THREE.PMREMGenerator(renderer);
  if (envTex) {
    // The only HDRIs in the P0 packs are daylight; the courtyard one is warm and soft. It is used for
    // reflections only — tinted to candle temperature and dimmed — never as a visible background.
    track(envTex);
    const envScene = new THREE.Scene();
    envTex.colorSpace = THREE.LinearSRGBColorSpace;
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(10, 48, 24), new THREE.MeshBasicMaterial({ map: envTex, side: THREE.BackSide, color: new THREE.Color(1.0, 0.62, 0.36).multiplyScalar(0.55) }));
    envScene.add(sphere);
    const rt = pmrem.fromScene(envScene, 0.02);
    scene.environment = rt.texture;
    scene.environmentIntensity = 0.38;
    disposables.add(rt);
    sphere.geometry.dispose(); sphere.material.dispose();
  }
  pmrem.dispose();

  const prep = (root, { cast = true, receive = true } = {}) => {
    root.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = cast && tier !== 'low'; o.receiveShadow = receive;
      const mats = [].concat(o.material);
      for (const m of mats) {
        track(m);
        if (m.transmission > 0 && tier !== 'high') { m.transmission = 0; m.transparent = true; m.opacity = 0.28; m.roughness = 0.08; m.depthWrite = false; }
        for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap']) if (m[k]) track(m[k]);
      }
      track(o.geometry);
    });
    return root;
  };

  const flameT = track(flameTex()), discT = track(softDisc()), glowT = track(waxGlow());

  // ---------------------------------------------------------------- room
  const room = new THREE.Group(); scene.add(room);

  // table + cloth (top surface exactly at the canonical table line)
  const tableGeo = track(new THREE.BoxGeometry(3.4, 0.05, 1.8));
  const table = new THREE.Mesh(tableGeo, cloth);
  table.position.set(0, TABLE_Y - 0.025, -0.1);   // spans z −1.0…0.8: its back edge hides behind the card
  table.receiveShadow = true;
  room.add(table);
  // cloth drop at the front edge (visible on short/landscape screens)
  const drop = new THREE.Mesh(track(new THREE.PlaneGeometry(3.4, 0.5)), cloth);
  drop.position.set(0, TABLE_Y - 0.27, 0.75); drop.receiveShadow = true;
  room.add(drop);

  // hall: back wall with arched niches + pilasters, marble floor far below/behind
  const wallZ = -3.4;
  const wall = new THREE.Mesh(track(new THREE.PlaneGeometry(14, 6)), plaster);
  wall.position.set(0, 1.2, wallZ); wall.receiveShadow = true;
  room.add(wall);
  const archShape = (w, h) => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0); s.lineTo(-w / 2, h - w / 2); s.absarc(0, h - w / 2, w / 2, Math.PI, 0, true); s.lineTo(w / 2, 0); s.lineTo(-w / 2, 0);
    return s;
  };
  const nicheMat = track(new THREE.MeshStandardMaterial({ color: '#1a0c0d', roughness: 0.95 }));
  const trimMat = plaster.clone(); trimMat.color = new THREE.Color('#8a6a52'); track(trimMat);
  const archXs = [-3.2, -1.6, 0, 1.6, 3.2];
  for (const x of archXs) {
    const niche = new THREE.Mesh(track(new THREE.ShapeGeometry(archShape(1.0, 2.6), 24)), nicheMat);
    niche.position.set(x, -0.9, wallZ + 0.01); room.add(niche);
    const ring = archShape(1.18, 2.72); ring.holes.push(archShape(1.0, 2.6));
    const trim = new THREE.Mesh(track(new THREE.ExtrudeGeometry(ring, { depth: 0.08, bevelEnabled: false, curveSegments: 24 })), trimMat);
    trim.position.set(x, -0.9, wallZ); trim.receiveShadow = true; room.add(trim);
  }
  for (const x of [-2.4, -0.8, 0.8, 2.4]) {
    const col = new THREE.Mesh(track(new THREE.CylinderGeometry(0.13, 0.15, 4.2, 24)), trimMat);
    col.position.set(x, 0.9, wallZ + 0.35); col.receiveShadow = true; room.add(col);
  }
  // sconces between the arches: warm wash on the back wall so the hall reads in depth
  for (const x of [-2.4, -0.8, 0.8, 2.4]) {
    const sc = new THREE.PointLight(WARM, 1.1, 3.2, 2);
    sc.position.set(x, 0.55, wallZ + 0.7);
    room.add(sc);
    const glow = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: discT, color: '#ffb46a', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.5 })));
    glow.userData.sconce = true; glow.position.set(x, 0.55, wallZ + 0.72); glow.scale.setScalar(0.18);
    room.add(glow);
  }
  const floor = new THREE.Mesh(track(new THREE.PlaneGeometry(14, 8)), marble);
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, -1.0, -1.5); floor.receiveShadow = true;
  room.add(floor);

  // ---------------------------------------------------------------- chandelier (warm glow above the card)
  prep(chandelier, { cast: false });
  const chBox = new THREE.Box3().setFromObject(chandelier);
  const chS = 0.62 / (chBox.max.y - chBox.min.y);
  chandelier.scale.setScalar(chS);
  const chPos = at(195, 70, -0.95);
  chandelier.position.set(chPos.x, chPos.y - chBox.min.y * chS, chPos.z);
  chandelier.traverse((o) => { if (o.isMesh && o.material.emissive && o.material.name?.includes('lamp')) { o.material.emissive = new THREE.Color('#ffb85c'); o.material.emissiveIntensity = 6; } });
  room.add(chandelier);
  const chLight = new THREE.PointLight(WARM, 2.2, 5, 2);
  chLight.position.set(chPos.x, chPos.y + 0.14, chPos.z);
  room.add(chLight);

  // key light from the chandelier: the one shadow caster (card proxy, props)
  const key = new THREE.SpotLight('#ffc888', tier === 'low' ? 2.2 : 3.2, 4, 0.5, 0.95, 2);
  // soft key from above-front-left: grounds props and drops the card proxy's shadow back-right onto the cloth
  key.position.set(-0.55, 0.85, 0.75);
  key.target.position.set(0.04, TABLE_Y, -0.15);
  key.castShadow = tier !== 'low';
  key.shadow.mapSize.setScalar(tier === 'high' ? 2048 : 1024);
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 6;
  key.shadow.camera.near = 0.2; key.shadow.camera.far = 3;
  room.add(key, key.target);

  // faint cool fill so the dark side of the room is not crushed to pure black
  room.add(new THREE.HemisphereLight('#3a2a40', '#120608', 0.35));

  // ---------------------------------------------------------------- candles
  const waxMat = track(new THREE.MeshStandardMaterial({ color: '#f4e8d4', roughness: 0.55, emissive: '#ffffff', emissiveMap: glowT, emissiveIntensity: 1.25 }));
  const brassMat = track(new THREE.MeshStandardMaterial({ color: '#b8925a', metalness: 1, roughness: 0.32 }));
  const candles = [];
  const addCandle = (pos, height, radius, { light = 0, shadow = false, flameScale = 1 } = {}) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(track(new THREE.CylinderGeometry(radius, radius * 1.04, height, 28)), waxMat);
    body.position.y = height / 2; body.castShadow = tier !== 'low'; body.receiveShadow = true;
    const dish = new THREE.Mesh(track(new THREE.CylinderGeometry(radius * 1.9, radius * 2.1, 0.006, 32)), brassMat);
    dish.position.y = 0.003; dish.receiveShadow = true;
    const wick = new THREE.Mesh(track(new THREE.CylinderGeometry(0.0007, 0.0007, 0.008, 6)), track(new THREE.MeshBasicMaterial({ color: '#2a1a10' })));
    wick.position.y = height + 0.004;
    const flame = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: flameT, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false })));
    flame.center.set(0.5, 0.18);
    flame.position.y = height + 0.002;
    const halo = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: discT, color: '#ff9a40', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.38, fog: false })));
    halo.position.y = height + 0.016;
    g.add(body, dish, wick, flame, halo);
    g.position.copy(pos);
    room.add(g);
    let pl = null;
    if (light) {
      pl = new THREE.PointLight(FLAME, light, 2.2, 2);
      pl.position.set(pos.x, pos.y + height + 0.05, pos.z);
      pl.castShadow = shadow && tier === 'high';
      if (pl.castShadow) { pl.shadow.mapSize.setScalar(512); pl.shadow.bias = -0.002; pl.shadow.radius = 4; }
      room.add(pl);
    }
    candles.push({ flame, halo, pl, baseLight: light, seed: Math.random() * 100, flameScale, scale: 0, ignite: 0 });
  };
  // foreground pairs at the canonical stage positions (Scene.dc.html candles), standing on the table
  const zF = 0.38, kF = (D0 - zF) / D0;   // bases land at stage y ≈ 723 like the canonical candles
  const fg = [[23, 170, 11], [51, 110, 9], [363, 150, 11], [334.5, 90, 8.5]];
  fg.forEach(([px, hpx, rpx], i) => {
    const p = at(px, 596, zF);
    p.y = TABLE_Y;
    addCandle(p, hpx * 0.001 * kF, rpx * 0.001 * kF * 1.15, { light: i % 2 === 0 ? 0.07 : 0.045, flameScale: kF });
  });
  // mid/back clusters (depth, bokeh sources, wider screens see more)
  const back = [[-0.62, -0.55, 0.16], [-0.7, -0.62, 0.1], [-0.56, -0.7, 0.12], [0.6, -0.6, 0.18], [0.7, -0.5, 0.11], [0.52, -0.72, 0.13], [-1.15, -1.1, 0.2], [1.2, -1.05, 0.22]];
  back.forEach(([x, z, h], i) => addCandle(new THREE.Vector3(x, TABLE_Y, z), h, 0.016, { light: i === 0 || i === 3 ? 0.45 : 0 }));

  // ---------------------------------------------------------------- props (frame the card, never cover it)
  const placeOnTable = (obj, x, z, height, rotY = 0) => {
    const b = new THREE.Box3().setFromObject(obj);
    const s = height / (b.max.y - b.min.y);
    obj.scale.setScalar(s);
    obj.position.set(x, TABLE_Y - b.min.y * s, z);
    obj.rotation.y = rotY;
    room.add(obj);
  };
  if (goblets) placeOnTable(prep(goblets), -0.275, -0.42, 0.2, 0.6);
  if (vase) {
    placeOnTable(prep(vase), 0.3, -0.55, 0.3, -0.4);
    if (flowers) {
      // the GLB holds three separate blooms laid out side by side; use the first one as the bouquet
      const bloom = flowers.children.find((c) => /_a/.test(c.name)) || flowers.children[0];
      flowers.children.filter((c) => c !== bloom).forEach((c) => flowers.remove(c));
      bloom.position.set(0, 0, 0);
      prep(flowers);
      const vb = new THREE.Box3().setFromObject(vase);
      const fb = new THREE.Box3().setFromObject(flowers);
      const fs = 0.26 / (fb.max.y - fb.min.y);
      flowers.scale.setScalar(fs);
      flowers.position.set(vb.getCenter(new THREE.Vector3()).x, vb.max.y - 0.07 - fb.min.y * fs, vb.getCenter(new THREE.Vector3()).z);
      room.add(flowers);
    }
  }
  if (lantern) {
    placeOnTable(prep(lantern), -0.5, -0.9, 0.26, 0.3);
    const ll = new THREE.PointLight(FLAME, 0.5, 1.6, 2); ll.position.set(-0.5, TABLE_Y + 0.1, -0.9); room.add(ll);
  }
  if (diya) {
    placeOnTable(prep(diya), 0.42, 0.05, 0.16, 0.2);
    const dl = new THREE.PointLight(FLAME, 0.3, 1.2, 2); dl.position.set(0.42, TABLE_Y + 0.06, 0.05); room.add(dl);
  }

  // ---------------------------------------------------------------- invisible card proxy → real shadow of the DOM card
  const proxyMat = track(new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
  const proxy = new THREE.Mesh(track(new THREE.BoxGeometry(CARD.w, CARD.h, 0.003)), proxyMat);
  proxy.castShadow = tier !== 'low';
  proxy.position.set(CARD.cx, CARD.cy, 0);
  proxy.visible = false;
  room.add(proxy);

  // ---------------------------------------------------------------- bokeh (canonical bkFar / bkMid / bkNear)
  const bokeh = [];
  const addBokeh = (list, z, sizeK, opacity) => list.forEach(([xp, yp, s, d, t]) => {
    const p = at(xp / 100 * 470 - 40, yp / 100 * 924 - 40, z);
    const spr = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: discT, color: '#ffcf96', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity, fog: false })));
    const size = s * 0.001 * sizeK * (D0 - z) / D0;
    spr.scale.setScalar(size);
    spr.position.copy(p);
    room.add(spr);
    bokeh.push({ spr, base: p.clone(), d, t, opacity, amp: 0.012 * (D0 - z) / D0 });
  });
  addBokeh([[8, 12, 10, 0, 7], [22, 30, 6, 1.5, 9], [70, 8, 12, 3, 8], [88, 26, 8, 0.5, 10], [40, 18, 7, 2.2, 11], [60, 40, 5, 4, 9], [14, 58, 9, 1, 8], [92, 62, 7, 2.5, 10]], -2.4, 2.2, 0.55);
  addBokeh([[18, 20, 22, 0.3, 9], [78, 16, 28, 1.8, 11], [86, 52, 20, 3.2, 10], [6, 74, 26, 0.8, 12], [50, 88, 18, 2.6, 9], [30, 6, 16, 4, 10]], -1.3, 1.7, 0.42);
  if (tier !== 'low') addBokeh([[0, 38, 74, 0, 12], [92, 78, 92, 2, 14], [68, 96, 64, 4, 13], [10, 92, 84, 1, 15]], 0.62, 1.4, 0.14);

  // ---------------------------------------------------------------- framing + animation
  layer.append(canvas);
  const vignette = document.createElement('div');
  vignette.className = 'candlelit-vignette';
  layer.append(vignette);

  let frame = null, view = { w: 1, h: 1 };
  const resize = (stageRect = ctx.stageRect()) => {
    view = { w: stageRect.viewW, h: stageRect.viewH };
    renderer.setSize(view.w, view.h, false);
    canvas.style.width = '100%'; canvas.style.height = '100%';
    frame = computeFraming({ viewW: view.w, viewH: view.h, stageRect, vfov: 42 });
  };
  resize();

  // follow the Studio's intro clock: if the room finishes loading mid-intro it joins in sync; if it arrives
  // after the intro (slow network) it appears settled instead of replaying the fade from black
  const stage0 = ctx.state() || 'intro';
  const state = { stage: stage0, t0: performance.now(), introT0: ctx.introStart?.() ?? performance.now(), pointer: new THREE.Vector2(), cam: new THREE.Vector3(), skipIntro: ctx.reducedMotion || stage0 !== 'intro', tilt: new THREE.Vector2() };
  const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  let raf = 0, frameN = 0, last = performance.now(), running = true, stillFrames = 0, dirty = true;
  const stats = { frames: 0, slow: 0, adapt: [] };
  // adaptive resolution: if the device cannot hold ~25 fps, step the pixel ratio down (never below 0.6)
  let pr = renderer.getPixelRatio(), win = [], lastRender = 0;
  const adapt = (now) => {
    if (lastRender) win.push(now - lastRender);
    lastRender = now;
    if (win.length < 45) return;
    const avg = win.reduce((a, b) => a + b, 0) / win.length; win = [];
    if (avg > 40 && pr > 0.6) { pr = Math.max(0.6, pr * 0.8); renderer.setPixelRatio(pr); resize(); stats.adapt.push(`${Math.round(avg)}ms→dpr ${pr.toFixed(2)}`); }
  };

  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (document.hidden || !running) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    frameN++;
    // the invitation sheet covers the room while reading: render at a third of the rate
    if ((state.stage === 'pages' || state.stage === 'opening') && frameN % 3) return;
    // static experience: a settled, fully lit still — render until textures/shaders are warm, then only when dirty
    if (q.static) { if (stillFrames > 40 && !dirty) return; stillFrames++; dirty = false; }
    const t = q.static ? 7.3 : (now - state.t0) / 1000;
    const it = state.skipIntro ? 99 : (now - state.introT0) / 1000;

    // intro: exposure lift with the canonical black (0–3.2 s), dolly-in settling at 4.7 s, candles ignite 1.4–2.6 s
    renderer.toneMappingExposure = EXPOSURE * (state.skipIntro ? 1 : 0.25 + 0.75 * ease((it - 0.6) / 2.6));
    const dolly = state.skipIntro ? 0 : (1 - ease(it / 4.7));
    const stageOffset = state.stage === 'pages' || state.stage === 'opening' ? 1 : state.stage === 'done' || state.stage === 'fly' ? -1 : 0;
    state.cam.lerp(new THREE.Vector3(state.pointer.x * 0.05, -state.pointer.y * 0.035 + dolly * 0.05, dolly * 0.38 - stageOffset * 0.05), q.static ? 1 : 1 - Math.pow(0.0015, dt));
    applyFraming(camera, frame, { viewW: view.w, viewH: view.h, offset: state.cam });

    for (const [i, c] of candles.entries()) {
      const target = state.skipIntro || it > 1.4 + i * 0.12 ? 1 : 0;
      c.ignite = state.skipIntro ? 1 : c.ignite + (target - c.ignite) * Math.min(1, dt * 3);   // deep links / late loads: already lit
      const n = Math.sin(t * 13 + c.seed) * 0.5 + Math.sin(t * 23.7 + c.seed * 2) * 0.3 + Math.sin(t * 5.1 + c.seed) * 0.2;
      const flick = 1 + n * 0.09;
      const s = c.ignite * c.flameScale;
      c.flame.scale.set(0.015 * s * (1 - n * 0.04), 0.042 * s * flick, 1);
      c.flame.material.rotation = Math.sin(t * 2.3 + c.seed) * 0.05;
      c.halo.scale.setScalar(0.11 * s * (0.95 + n * 0.05));
      if (c.pl) c.pl.intensity = c.baseLight * c.ignite * flick;
    }
    chLight.intensity = 2.2 * (0.97 + Math.sin(t * 1.7) * 0.03);
    for (const b of bokeh) {
      const ph = ((t + b.d) / b.t) * Math.PI * 2;
      b.spr.position.set(b.base.x + Math.sin(ph) * b.amp * 0.5, b.base.y + (0.5 - 0.5 * Math.cos(ph)) * b.amp, b.base.z);
      b.spr.material.opacity = b.opacity * (0.55 + 0.45 * (0.5 - 0.5 * Math.cos(ph)));
    }
    // card proxy follows the CSS card: bob (7 s), pointer tilt; hidden until the card has landed
    const showProxy = (state.stage === 'card' && (state.skipIntro || it > 3.9)) || (state.stage === 'intro' && it > 3.9);
    proxy.visible = showProxy;
    if (showProxy) {
      const bob = 0.5 - 0.5 * Math.cos(((now - state.introT0) / 7000) * Math.PI * 2);
      state.tilt.lerp(new THREE.Vector2(-state.pointer.y * 16, state.pointer.x * 20), 1 - Math.pow(0.002, dt));
      proxy.position.y = CARD.cy + bob * 0.008;
      proxy.rotation.set(THREE.MathUtils.degToRad(state.tilt.x), THREE.MathUtils.degToRad(state.tilt.y), THREE.MathUtils.degToRad(bob * 0.5));
    }
    if (state.stage !== 'pages') adapt(now);
    const t1 = performance.now();
    renderer.render(scene, camera);
    stats.frames++; if (performance.now() - t1 > 40) stats.slow++;
  };

  // first frame synchronously so the crossfade starts from a real image
  applyFraming(camera, frame, { viewW: view.w, viewH: view.h, offset: state.cam });
  renderer.compile(scene, camera);
  raf = requestAnimationFrame(tick);
  const onVis = () => { last = performance.now(); };
  document.addEventListener('visibilitychange', onVis);

  return {
    mode: 'three',
    el: canvas,
    stats: () => ({ ...stats, renderer: 'three', tier, drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles, textures: renderer.info.memory.textures, geometries: renderer.info.memory.geometries, exposure: renderer.toneMappingExposure }),
    setPointer(nx, ny) { if (!q.static) state.pointer.set(nx, ny); },
    setStage(s) {
      dirty = true;
      if (s === 'reset') { candles.forEach((c) => { c.ignite = 0; }); state.cam.set(0, 0.05, 0.38); return; }
      if (s === 'intro') { state.introT0 = ctx.introStart?.() ?? performance.now(); state.skipIntro = ctx.reducedMotion; }
      if (s && s !== 'intro' && state.stage === 'intro' && s !== 'card') state.skipIntro = true;
      state.stage = s || state.stage;
      if (s !== 'card' && s !== 'intro') state.pointer.set(0, 0);
    },
    resize(r) { resize(r); dirty = true; },
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      scene.traverse((o) => { if (o.isMesh || o.isSprite) { o.geometry?.dispose?.(); } });
      disposables.forEach((d) => d.dispose?.());
      scene.environment = null;
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove(); vignette.remove();
    },
  };
}
