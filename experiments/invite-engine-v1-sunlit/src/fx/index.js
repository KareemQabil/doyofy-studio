/**
 * FX modules. Canvas modules implement update/draw; DOM modules manage their own elements.
 * Common params: intensity, density, speed, opacity (+ module specific).
 */
import { FXRegistry, FXPackRegistry } from '../engine/registries.js';
import { h, seeded } from '../engine/dom.js';

const rand = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;

/** Region helper: params.region = { x, y, w, h } in 0–1 of the stage, optional feather. */
function inRegion(p, r, w, h) { if (!r) return 1; const x = p.x / w, y = p.y / h; const f = r.feather ?? 0.08; const dx = Math.min(x - r.x, r.x + r.w - x), dy = Math.min(y - r.y, r.y + r.h - y); return Math.max(0, Math.min(1, Math.min(dx, dy) / f)); }

FXRegistry.registerMany([
  {
    id: 'dust', renderMode: 'canvas', tags: ['light', 'warm', 'subtle', 'sun'],
    meta: { title: 'Sun dust', description: 'Slow motes that glint only inside the light.' },
    params: { density: 0.5, speed: 1, opacity: 0.8, color: '255,248,232', region: null, size: [0.6, 1.9] },
    create(m) {
      const P = m.params; let parts = [];
      const make = (w, h) => ({ x: rand(0, w), y: rand(0, h), r: rand(...P.size), vx: rand(-4, 6), vy: rand(-7, -1), ph: rand(0, TAU), tw: rand(0.4, 1.3) });
      return {
        resize(w, h) { const n = m.fx.count(P.density * P.intensity, 26); parts = Array.from({ length: n }, () => make(w, h)); },
        update(dt, t) { for (const p of parts) { p.x += (p.vx + Math.sin(t * 0.4 + p.ph) * 3) * dt * P.speed; p.y += p.vy * dt * P.speed; if (p.y < -10) { p.y = m.fx.h + 10; p.x = rand(0, m.fx.w); } if (p.x > m.fx.w + 10) p.x = -10; if (p.x < -10) p.x = m.fx.w + 10; } },
        draw(ctx, w, h, t) {
          for (const p of parts) {
            const a = (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * p.tw + p.ph))) * P.opacity * inRegion(p, P.region, w, h);
            if (a < 0.02) continue;
            ctx.fillStyle = `rgba(${P.color},${a.toFixed(3)})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
          }
        },
      };
    },
  },
  {
    id: 'bokeh', renderMode: 'canvas', tags: ['warm', 'night', 'cinematic', 'luxury'],
    meta: { title: 'Bokeh', description: 'Out-of-focus light discs at three depths.' },
    params: { density: 0.5, speed: 1, opacity: 0.7, color: '255,208,150', size: [6, 42] },
    create(m) {
      const P = m.params; let parts = [];
      return {
        resize(w, h) { const n = m.fx.count(P.density * P.intensity, 3); parts = Array.from({ length: n }, () => ({ x: rand(0, w), y: rand(0, h), r: rand(...P.size), ph: rand(0, TAU), sp: rand(0.2, 0.6) })); },
        update(dt, t) { for (const p of parts) { p.y -= p.sp * 6 * dt * P.speed; if (p.y < -60) p.y = m.fx.h + 60; } },
        draw(ctx, w, h, t) {
          const px = Number(getComputedStyle(m.stage.root).getPropertyValue('--px')) || 0;
          for (const p of parts) {
            const a = (0.35 + 0.35 * Math.sin(t * p.sp + p.ph)) * P.opacity;
            const x = p.x - px * p.r * 0.8;
            const g = ctx.createRadialGradient(x, p.y, 0, x, p.y, p.r);
            g.addColorStop(0, `rgba(${P.color},${(a * 0.9).toFixed(3)})`); g.addColorStop(0.6, `rgba(${P.color},${(a * 0.35).toFixed(3)})`); g.addColorStop(1, `rgba(${P.color},0)`);
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, p.y, p.r, 0, TAU); ctx.fill();
          }
        },
      };
    },
  },
  {
    id: 'petals', renderMode: 'canvas', tags: ['romantic', 'pastel', 'floral', 'light'],
    meta: { title: 'Petals', description: 'Falling petals with flutter and spin.' },
    params: { density: 0.4, speed: 1, opacity: 0.9, colors: ['#F7B6C8', '#FAD3DC', '#FFFFFF', '#F3A6BC'] },
    create(m) {
      const P = m.params; let parts = [];
      const make = (w, h, top) => ({ x: rand(-40, w), y: top ? rand(-h, 0) : rand(0, h), s: rand(6, 12), rot: rand(0, TAU), vr: rand(-1.4, 1.4), vy: rand(22, 48), sw: rand(0.6, 1.6), ph: rand(0, TAU), c: P.colors[Math.floor(rand(0, P.colors.length))] });
      return {
        resize(w, h) { const n = m.fx.count(P.density * P.intensity, 4); parts = Array.from({ length: n }, () => make(w, h, false)); },
        update(dt, t) { for (const p of parts) { p.y += p.vy * dt * P.speed; p.x += Math.sin(t * p.sw + p.ph) * 18 * dt + 10 * dt; p.rot += p.vr * dt; if (p.y > m.fx.h + 20) Object.assign(p, make(m.fx.w, m.fx.h, true), { y: -20 }); } },
        draw(ctx) {
          ctx.globalAlpha = P.opacity;
          for (const p of parts) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.sin(p.rot * 1.3))); ctx.fillStyle = p.c; ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * 0.62, 0.6, 0, TAU); ctx.fill(); ctx.restore(); }
        },
      };
    },
  },
  {
    id: 'stars', renderMode: 'canvas', tags: ['night', 'celestial', 'calm'],
    meta: { title: 'Stars', description: 'Twinkling star field.' },
    params: { density: 0.6, speed: 1, opacity: 0.9, color: '255,247,224', region: { x: 0, y: 0, w: 1, h: 0.62, feather: 0.12 } },
    create(m) {
      const P = m.params; let parts = [];
      return {
        resize(w, h) { const n = m.fx.count(P.density * P.intensity, 22); const R = seeded(9); parts = Array.from({ length: n }, () => ({ x: R() * w, y: R() * h, r: R() * 1.2 + 0.3, ph: R() * TAU, sp: R() * 1.5 + 0.5 })); },
        draw(ctx, w, h, t) { for (const p of parts) { const a = (0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * p.sp * P.speed + p.ph))) * P.opacity * inRegion(p, P.region, w, h); if (a < 0.03) continue; ctx.fillStyle = `rgba(${P.color},${a.toFixed(3)})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } },
      };
    },
  },
  {
    id: 'fireflies', renderMode: 'canvas', tags: ['garden', 'night', 'organic'],
    meta: { title: 'Fireflies', description: 'Wandering glows with soft pulses.' },
    params: { density: 0.35, speed: 1, opacity: 1, color: '214,244,140' },
    create(m) {
      const P = m.params; let parts = [];
      return {
        resize(w, h) { const n = m.fx.count(P.density * P.intensity, 2.2); parts = Array.from({ length: n }, () => ({ x: rand(0, w), y: rand(h * 0.35, h), a: rand(0, TAU), ph: rand(0, TAU), sp: rand(8, 22) })); },
        update(dt, t) { for (const p of parts) { p.a += (Math.sin(t * 0.7 + p.ph) * 1.2) * dt; p.x += Math.cos(p.a) * p.sp * dt * P.speed; p.y += Math.sin(p.a) * p.sp * dt * P.speed; if (p.x < 0 || p.x > m.fx.w) p.a = Math.PI - p.a; if (p.y < m.fx.h * 0.25 || p.y > m.fx.h) p.a = -p.a; } },
        draw(ctx, w, h, t) { for (const p of parts) { const a = Math.max(0, Math.sin(t * 1.6 + p.ph)) * P.opacity; if (a < 0.03) continue; const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 9); g.addColorStop(0, `rgba(${P.color},${a})`); g.addColorStop(1, `rgba(${P.color},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, TAU); ctx.fill(); } },
      };
    },
  },
  {
    id: 'sparkles', renderMode: 'canvas', tags: ['festive', 'glam', 'playful'],
    meta: { title: 'Sparkles', description: 'Four-point glints that pop and fade.' },
    params: { density: 0.25, speed: 1, opacity: 0.9, color: '255,236,200' },
    create(m) {
      const P = m.params; let parts = []; let bursts = [];
      const star = (ctx, x, y, s) => { ctx.beginPath(); ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x, y, x + s, y); ctx.quadraticCurveTo(x, y, x, y + s); ctx.quadraticCurveTo(x, y, x - s, y); ctx.quadraticCurveTo(x, y, x, y - s); ctx.fill(); };
      return {
        resize(w, h) { const n = m.fx.count(P.density * P.intensity, 1.4); parts = Array.from({ length: n }, () => ({ x: rand(0, w), y: rand(0, h), s: rand(3, 7), ph: rand(0, TAU), sp: rand(0.5, 1.2) })); },
        burst({ x = m.fx.w / 2, y = m.fx.h / 2, n = 18 } = {}) { for (let i = 0; i < n; i++) bursts.push({ x, y, vx: rand(-120, 120), vy: rand(-140, 40), s: rand(3, 7), life: 1 }); },
        update(dt) { for (const b of bursts) { b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 90 * dt; b.life -= dt * 0.8; } bursts = bursts.filter((b) => b.life > 0); },
        draw(ctx, w, h, t) {
          for (const p of parts) { const a = Math.max(0, Math.sin(t * p.sp * P.speed + p.ph)) ** 6 * P.opacity; if (a < 0.03) continue; ctx.fillStyle = `rgba(${P.color},${a})`; star(ctx, p.x, p.y, p.s); }
          for (const b of bursts) { ctx.fillStyle = `rgba(${P.color},${b.life})`; star(ctx, b.x, b.y, b.s); }
        },
      };
    },
  },
  {
    id: 'confetti', renderMode: 'canvas', tags: ['festive', 'playful', 'finale'],
    meta: { title: 'Confetti', description: 'Physics confetti burst (finale).' },
    params: { density: 0, speed: 1, opacity: 1, colors: ['#F2A7BF', '#FFD6A5', '#BDE0FE', '#CDEAC0', '#FFFFFF'] },
    create(m) {
      const P = m.params; let parts = [];
      return {
        burst({ x = m.fx.w / 2, y = m.fx.h * 0.45, n = 90 } = {}) { const c = Math.round(n * m.quality.fxScale); for (let i = 0; i < c; i++) parts.push({ x, y, vx: rand(-260, 260), vy: rand(-420, -120), w: rand(5, 9), h: rand(8, 14), rot: rand(0, TAU), vr: rand(-8, 8), c: P.colors[i % P.colors.length], life: rand(2.5, 4) }); },
        update(dt) { for (const p of parts) { p.vy += 380 * dt; p.vx *= 0.99; p.x += p.vx * dt; p.y += p.vy * dt * 0.55; p.rot += p.vr * dt; p.life -= dt; } parts = parts.filter((p) => p.life > 0 && p.y < m.fx.h + 40); },
        draw(ctx) { for (const p of parts) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = Math.min(1, p.life) * P.opacity; ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot))); ctx.restore(); } },
      };
    },
  },
  // ---------------------------------------------------------------- DOM effects
  {
    id: 'paper_grain', renderMode: 'dom', tags: ['texture', 'editorial', 'subtle'],
    meta: { title: 'Paper grain', description: 'Fine grain over the whole frame.' },
    params: { opacity: 0.35 },
    create(m) {
      const el = h('div', { class: 'fx-grain', style: `opacity:${m.params.opacity * Math.min(1, m.params.intensity + 0.3)};background-image:url(${m.assets.url('textures/grain.webp')})` });
      m.stage.layers.overlay.append(el);
      return { destroy() { el.remove(); } };
    },
  },
  {
    id: 'film_overlay', renderMode: 'dom', tags: ['cinematic', 'film', 'moody'],
    meta: { title: 'Film overlay', description: 'Vignette + animated grain + faint flicker.' },
    params: { opacity: 0.5, vignette: 0.55 },
    create(m) {
      const el = h('div', { class: 'fx-film', style: `--vig:${m.params.vignette * m.params.intensity + 0.1};opacity:${m.params.opacity}` },
        h('div', { class: 'fx-film__grain', style: `background-image:url(${m.assets.url('textures/grain.webp')})` }));
      m.stage.layers.overlay.append(el);
      return { destroy() { el.remove(); } };
    },
  },
  {
    id: 'light_rays', renderMode: 'dom', tags: ['light', 'airy', 'sun', 'soft'],
    meta: { title: 'Light rays', description: 'Soft volumetric beams that drift.' },
    params: { opacity: 0.45, angle: 24, count: 3, color: '255,250,236' },
    create(m) {
      const P = m.params;
      const el = h('div', { class: 'fx-rays', style: `--ray-angle:${P.angle}deg;opacity:${P.opacity * Math.min(1, P.intensity + 0.2)}` });
      for (let i = 0; i < P.count; i++) el.append(h('span', { style: `--i:${i};--c:${P.color};left:${12 + i * 30}%;width:${10 + (i % 2) * 8}%;animation-delay:${-i * 3}s` }));
      m.stage.layers.lighting.append(el);
      return { destroy() { el.remove(); } };
    },
  },
  {
    id: 'fog', renderMode: 'dom', tags: ['mist', 'moody', 'soft', 'sea'],
    meta: { title: 'Fog', description: 'Low drifting haze banks.' },
    params: { opacity: 0.5, color: '255,255,255', height: 0.35 },
    create(m) {
      const P = m.params;
      const el = h('div', { class: 'fx-fog', style: `--fog:${P.color};--fog-h:${P.height * 100}%;opacity:${P.opacity * P.intensity}` }, h('span'), h('span'), h('span'));
      m.stage.layers.foreground.append(el);
      return { destroy() { el.remove(); } };
    },
  },
  {
    id: 'reflection_sweep', renderMode: 'dom', tags: ['luxury', 'glossy', 'editorial'],
    meta: { title: 'Reflection sweep', description: 'A slow specular sweep across the card.' },
    params: { opacity: 0.5, every: 7 },
    create(m) {
      const el = h('div', { class: 'fx-sweep', style: `opacity:${m.params.opacity * Math.min(1, m.params.intensity + 0.3)};--every:${m.params.every}s` });
      m.stage.card.front.append(el);
      return { destroy() { el.remove(); } };
    },
  },
  {
    id: 'holographic', renderMode: 'dom', tags: ['futuristic', 'iridescent', 'chrome', 'modern'],
    meta: { title: 'Holographic shimmer', description: 'Iridescent foil that follows the tilt.' },
    params: { opacity: 0.35 },
    create(m) {
      const el = h('div', { class: 'fx-holo', style: `opacity:${m.params.opacity * m.params.intensity}` });
      m.stage.card.front.append(el);
      return { destroy() { el.remove(); } };
    },
  },
  {
    id: 'shadow_drift', renderMode: 'dom', tags: ['light', 'architectural', 'sun'],
    meta: { title: 'Shadow drift', description: 'Slow leaf-shadow movement over the scene (no video needed).' },
    params: { opacity: 0.18 },
    create(m) {
      const el = h('div', { class: 'fx-shadowdrift', style: `opacity:${m.params.opacity * m.params.intensity}` });
      m.stage.layers.lighting.append(el);
      return { destroy() { el.remove(); } };
    },
  },
]);

// ---------------------------------------------------------------- packs (compositions)
FXPackRegistry.registerMany([
  { id: 'none', meta: { title: 'No effects' }, tags: ['minimal', 'calm'], modules: [] },
  { id: 'soft_sun_dust', meta: { title: 'Soft sun dust', description: 'Motes in the sunbeam + paper grain' }, tags: ['light', 'warm', 'sun', 'editorial', 'subtle', 'architectural'],
    modules: [{ id: 'dust', params: { density: 0.55, opacity: 0.75, region: { x: 0.34, y: 0.02, w: 0.62, h: 0.8, feather: 0.14 } } }, { id: 'paper_grain', params: { opacity: 0.28 } }] },
  { id: 'candle_bokeh_film', meta: { title: 'Candle bokeh + film', description: 'Warm discs, vignette, film grain' }, tags: ['warm', 'night', 'cinematic', 'luxury', 'moody'],
    modules: [{ id: 'bokeh', params: { density: 0.5 } }, { id: 'film_overlay', params: { opacity: 0.55 } }, { id: 'reflection_sweep', params: { opacity: 0.4 } }] },
  { id: 'garden_fireflies', meta: { title: 'Garden fireflies' }, tags: ['garden', 'night', 'organic', 'romantic'],
    modules: [{ id: 'fireflies', params: { density: 0.45 } }, { id: 'paper_grain', params: { opacity: 0.2 } }] },
  { id: 'night_stars', meta: { title: 'Night stars' }, tags: ['night', 'celestial', 'calm', 'sea'],
    modules: [{ id: 'stars', params: { density: 0.55 } }, { id: 'fog', params: { opacity: 0.35, height: 0.22 } }] },
  { id: 'petal_breeze', meta: { title: 'Petal breeze' }, tags: ['romantic', 'pastel', 'floral', 'light', 'playful'],
    modules: [{ id: 'petals', params: { density: 0.35 } }, { id: 'light_rays', params: { opacity: 0.35 } }] },
  { id: 'clay_pop', meta: { title: 'Clay pop' }, tags: ['playful', 'pastel', 'festive', 'clay'],
    modules: [{ id: 'sparkles', params: { density: 0.25, color: '255,255,255' } }, { id: 'confetti' }] },
  { id: 'chrome_prism', meta: { title: 'Chrome prism' }, tags: ['futuristic', 'chrome', 'iridescent', 'modern', 'glam'],
    modules: [{ id: 'holographic', params: { opacity: 0.45 } }, { id: 'reflection_sweep', params: { opacity: 0.6, every: 5 } }, { id: 'sparkles', params: { density: 0.15 } }] },
  { id: 'editorial_clean', meta: { title: 'Editorial clean' }, tags: ['editorial', 'minimal', 'modern', 'subtle', 'light'],
    modules: [{ id: 'paper_grain', params: { opacity: 0.22 } }, { id: 'reflection_sweep', params: { opacity: 0.3, every: 9 } }] },
  { id: 'desert_haze', meta: { title: 'Desert haze' }, tags: ['warm', 'sun', 'desert', 'arabic'],
    modules: [{ id: 'dust', params: { density: 0.4, color: '255,226,190', opacity: 0.6 } }, { id: 'fog', params: { opacity: 0.25, color: '255,226,200', height: 0.3 } }] },
  { id: 'palace_glow', meta: { title: 'Palace lantern glow' }, tags: ['warm', 'night', 'arabic', 'luxury'],
    modules: [{ id: 'bokeh', params: { density: 0.3, color: '255,214,150' } }, { id: 'sparkles', params: { density: 0.12 } }, { id: 'paper_grain', params: { opacity: 0.2 } }] },
]);
