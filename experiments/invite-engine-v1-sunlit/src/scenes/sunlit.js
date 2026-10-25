/**
 * Flagship environment — "sunlit architectural studio" (hybrid render mode):
 *   far        lime-plaster wall (texture)
 *   background moving window + palm shadows (video light-map, multiplied onto the wall)
 *              recessed arched niche framing the card
 *   mid        sandstone ledge the card stands on · ceramic vase with dried pampas
 *   foreground out-of-focus olive branches that part during the reveal
 *   lighting   warm sun bloom + soft grade
 */
import { SceneRegistry } from '../engine/registries.js';
import { h } from '../engine/dom.js';
import { put, place, shadow } from './helpers.js';

SceneRegistry.register({
  id: 'sunlit_architectural_studio',
  meta: { title: 'Sunlit architectural studio', description: 'Warm plaster, moving window light, a sandstone ledge and olive branches.' },
  tags: ['light', 'warm', 'architectural', 'editorial', 'botanical', 'modern', 'luxury', 'sun', 'arabic'],
  compat: { prefer: ['light', 'botanical', 'editorial', 'soft', 'architectural'], avoid: ['night', 'playful', 'neon'] },
  renderMode: 'hybrid',
  backdrop: '#E9DCCB',
  assets: [
    { id: 'wall', type: 'image', src: 'textures/plaster-2000.webp', preload: true },
    { id: 'poster', type: 'image', src: 'video/sunlit-shadows-poster.webp', preload: true },
    { id: 'oliveA', type: 'image', src: 'scenes/sunlit/olive-fg-01-soft.webp', preload: true },
    { id: 'oliveB', type: 'image', src: 'scenes/sunlit/olive-fg-02-soft.webp', preload: true },
    { id: 'vase', type: 'image', src: 'scenes/sunlit/pampas-vase-640.webp', preload: false },
    { id: 'stone', type: 'image', src: 'textures/sandstone-1200.webp', preload: false },
  ],
  setup(m) {
    const A = m.assets;
    const st = m.state;
    st.wall = put(m, 'far', h('div', { class: 'sun-wall', style: `background-image:url(${A.pick({ base: 'textures/plaster', widths: [1000, 2000] }, innerWidth)})` }));
    st.video = A.video({ mp4: 'video/sunlit-shadows.mp4', webm: 'video/sunlit-shadows.webm', poster: 'video/sunlit-shadows-poster.webp', lazy: true });
    if (m.quality.reducedMotion) st.video.dataset.fallback = 'true';
    st.video.className = 'sun-light';
    st.lightWrap = put(m, 'background', h('div', { class: 'sun-lightwrap' }, st.video, h('img', { class: 'sun-light sun-light--poster', src: A.url('video/sunlit-shadows-poster.webp'), alt: '' })));
    st.niche = put(m, 'background', h('div', { class: 'sun-niche' }, h('div', { class: 'sun-niche__inner' })));
    st.ledge = put(m, 'mid', h('div', { class: 'sun-ledge', style: `--stone:url(${A.url('textures/sandstone-1200.webp')})` }, h('div', { class: 'sun-ledge__top' }), h('div', { class: 'sun-ledge__face' })));
    st.vase = put(m, 'mid', h('img', { class: 'sun-vase', src: A.pick({ base: 'scenes/sunlit/pampas-vase', widths: [320, 640] }, 260), alt: '', decoding: 'async' }));
    st.oliveA = put(m, 'foreground', h('img', { class: 'sun-olive sun-olive--a', src: A.url('scenes/sunlit/olive-fg-01-soft.webp'), alt: '' }));
    st.oliveB = put(m, 'foreground', h('img', { class: 'sun-olive sun-olive--b', src: A.url('scenes/sunlit/olive-fg-02-soft.webp'), alt: '' }));
    st.glow = put(m, 'lighting', h('div', { class: 'sun-glow' }));
    st.grade = put(m, 'overlay', h('div', { class: 'sun-grade' })); // outside the camera: the grade is a lens property
    shadow(m, { x: 0.05, y: 0.025, blur: 26, opacity: 0.3, color: '92,60,32', contact: 0.4 });
    if (st.video.dataset.fallback !== 'true') st.video.start();
  },
  layout(m) {
    const f = m.stage.fit, st = m.state;
    const nw = f.w * 1.66, nh = f.h * 1.3;
    place(st.niche, { x: f.cx - nw / 2, y: f.y + f.h - nh + f.h * 0.012, w: nw, h: nh });
    const ledgeTop = f.y + f.h - f.h * 0.012;
    place(st.ledge, { x: -f.vw * 0.6, y: ledgeTop, w: f.vw * 2.2, h: Math.max(60, f.vh - ledgeTop) + f.vh * 0.6 });
    const vh = f.h * 0.98, vw = vh * (520 / 900);
    const rtl = m.L.dir === 'rtl';
    const vx = rtl ? f.x - vw * 0.78 : f.x + f.w - vw * 0.22;
    place(st.vase, { x: vx, y: ledgeTop - vh + f.h * 0.012, w: vw, h: vh });
    st.vase.style.opacity = f.mobile ? '0.9' : '1';
    const ow = Math.max(f.vw * 0.44, 380), oh = ow * (1100 / 1400);
    place(st.oliveA, { x: f.vw - ow * 0.62, y: -oh * 0.36, w: ow, h: oh });
    const bw = Math.max(f.vw * 0.38, 320);
    place(st.oliveB, { x: -bw * 0.34, y: f.vh - bw * 0.62, w: bw, h: bw });
    m.stage.root.style.setProperty('--sun-x', `${Math.round(f.cx + f.w * 0.35)}px`);
    m.stage.root.style.setProperty('--sun-y', `${Math.round(f.y + f.h * 0.3)}px`);
  },
  enter(m, tl, at = 0) {
    const st = m.state;
    // 0.0–1.2: abstract light and architecture establish
    tl.fromTo(st.wall, { filter: 'brightness(0.78) saturate(0.9)' }, { filter: 'brightness(1) saturate(1)', duration: 1.6, ease: 'sine.out' }, at);
    tl.fromTo(st.lightWrap, { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'sine.inOut' }, at + 0.1);
    tl.fromTo(st.glow, { opacity: 0 }, { opacity: 1, duration: 1.8, ease: 'sine.out' }, at + 0.3);
    tl.fromTo([st.niche, st.ledge], { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'sine.out' }, at + 0.2);
    tl.fromTo(st.vase, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1.4, ease: 'editorial' }, at + 0.8);
    // foreground botanicals start close to centre and part aside 1.2–2.6
    const rtl = m.L.dir === 'rtl';
    tl.fromTo(st.oliveA, { x: -m.stage.fit.w * 0.2, y: m.stage.fit.h * 0.1, rotate: -6, opacity: 0.0, scale: 1.06 }, { opacity: 0.85, duration: 0.8, ease: 'sine.out' }, at + 0.2);
    tl.fromTo(st.oliveB, { x: m.stage.fit.w * 0.18, y: -m.stage.fit.h * 0.08, rotate: 5, opacity: 0.0, scale: 1.05 }, { opacity: 0.85, duration: 0.8, ease: 'sine.out' }, at + 0.3);
    tl.to(st.oliveA, { x: 0, y: 0, rotate: 0, scale: 1, duration: 1.5, ease: 'power3.inOut' }, at + 1.2);
    tl.to(st.oliveB, { x: 0, y: 0, rotate: 0, scale: 1, duration: 1.5, ease: 'power3.inOut' }, at + 1.3);
    void rtl;
  },
  idle(m) {
    if (m.quality.reducedMotion) return null;
    const st = m.state;
    return m.loop((dt, t) => {
      m.set(st.oliveA, { rotate: Math.sin(t * 0.5) * 0.8, x: Math.sin(t * 0.37) * 3 });
      m.set(st.oliveB, { rotate: Math.sin(t * 0.43 + 1) * 0.7 });
    });
  },
  destroy(m) { if (m.state.video) m.assets.releaseVideo(m.state.video); },
});
