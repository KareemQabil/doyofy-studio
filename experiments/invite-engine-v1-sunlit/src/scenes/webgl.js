/**
 * WebGL environments.
 *  - liquid_chrome: a domain-warped liquid-metal field with iridescent reflections (raw WebGL).
 *  - glass_objects_3d: renderMode 'three' — uses Three.js when present, otherwise falls
 *    back to the chrome shader with a pearl tint (proves the render-mode fallback path).
 */
import { SceneRegistry } from '../engine/registries.js';
import { createShaderLayer } from '../engine/render/webgl.js';
import { loadThree, createThreeLayer } from '../engine/render/three.js';
import { put, shadow } from './helpers.js';

const CHROME = `precision mediump float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform vec3 uA; uniform vec3 uB; uniform float uIrid;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.03; a*=.5; } return v; }
float field(vec2 p){ vec2 q = vec2(fbm(p + uTime*.045), fbm(p + vec2(5.2,1.3) - uTime*.035)); return fbm(p + 1.9*q + uMouse*.25); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (gl_FragCoord.xy - .5*uRes) / min(uRes.x, uRes.y) * 2.4;
  float e = 3.0 / min(uRes.x, uRes.y);
  float h = field(p), hx = field(p + vec2(e, 0.)), hy = field(p + vec2(0., e));
  vec3 n = normalize(vec3((h - hx) * 9.0 / e * .02, (h - hy) * 9.0 / e * .02, 1.));
  vec3 l = normalize(vec3(-.35, .55, .8));
  vec3 r = reflect(vec3(0., 0., -1.), n);
  float diff = clamp(dot(n, l), 0., 1.);
  float spec = pow(clamp(dot(r, l), 0., 1.), 28.);
  vec3 env = mix(uA, uB, smoothstep(-.6, .9, r.y));
  vec3 irid = .5 + .5 * cos(6.2831 * (vec3(0., .33, .67) + h * 1.3 + r.x * .5));
  vec3 col = env * (.28 + .8 * diff) + irid * uIrid + spec * .85;
  float vig = smoothstep(1.35, .25, length(uv - .5) * 1.5);
  gl_FragColor = vec4(col * vig, 1.);
}`;

function chrome(m, tint) {
  const st = m.state;
  st.gl = createShaderLayer(m, { layer: 'far', frag: CHROME, uniforms: { uA: tint.a, uB: tint.b, uIrid: tint.irid } });
  if (!st.gl.ok) put(m, 'far', `<div class="sc-fill sc-chrome-fallback" style="--a:${tint.css[0]};--b:${tint.css[1]}"></div>`);
  put(m, 'lighting', '<div class="sc-chrome-grade"></div>');
  shadow(m, { x: 0, y: 0.025, blur: 30, opacity: 0.5, color: '0,0,0', contact: 0.5 });
}

SceneRegistry.registerMany([
  {
    id: 'liquid_chrome', meta: { title: 'Liquid chrome', description: 'Flowing liquid metal with iridescent reflections (WebGL).' },
    tags: ['futuristic', 'chrome', 'modern', 'glam', 'iridescent', 'dramatic'], compat: { prefer: ['modern', 'minimal', 'chrome', 'glam'], avoid: ['botanical', 'classic', 'arabic', 'pastel'] },
    renderMode: 'webgl', backdrop: '#0d0f14',
    setup(m) { chrome(m, { a: [0.05, 0.06, 0.09], b: [0.78, 0.8, 0.86], irid: 0.14, css: ['#1a1d24', '#a9adb8'] }); },
    destroy(m) { m.state.gl?.destroy(); },
  },
  {
    id: 'glass_objects_3d', meta: { title: 'Pearl glass (Three.js)', description: 'Floating glass forms via Three.js; pearl shader fallback.' },
    tags: ['modern', 'glam', 'iridescent', 'light', 'futuristic'], compat: { prefer: ['modern', 'minimal'], avoid: ['botanical', 'classic'] },
    renderMode: 'three', backdrop: '#e9e6ef',
    async setup(m) {
      chrome(m, { a: [0.86, 0.84, 0.9], b: [0.99, 0.98, 1.0], irid: 0.22, css: ['#dcd8e6', '#faf9fd'] });
      const THREE = await loadThree(m);
      if (!THREE || !m.stage.root.isConnected) return;
      const layer = createThreeLayer(m, THREE, { layer: 'mid' });
      m.state.three = layer;
      const mat = new THREE.MeshPhysicalMaterial({ roughness: 0.08, transmission: 1, thickness: 0.6, ior: 1.35, iridescence: 0.6, color: 0xffffff });
      const geos = [new THREE.TorusGeometry(0.35, 0.12, 32, 96), new THREE.SphereGeometry(0.22, 48, 48), new THREE.TorusKnotGeometry(0.2, 0.06, 96, 16)];
      const objs = geos.map((g, i) => { const o = new THREE.Mesh(g, mat); o.position.set([-1.3, 1.2, -0.9][i], [0.6, -0.5, -0.9][i], -0.5); layer.scene.add(o); return o; });
      layer.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
      const d = new THREE.DirectionalLight(0xffffff, 1.2); d.position.set(-1, 2, 3); layer.scene.add(d);
      m.loop((dt, t) => { objs.forEach((o, i) => { o.rotation.x = t * (0.2 + i * 0.1); o.rotation.y = t * 0.3; o.position.y += Math.sin(t + i) * 0.0008; }); layer.renderer.render(layer.scene, layer.camera); });
    },
    destroy(m) { m.state.gl?.destroy(); m.state.three?.destroy(); },
  },
]);
