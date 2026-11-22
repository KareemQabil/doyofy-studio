/**
 * Card motion — one choreographed entrance per face (GSAP 3, loaded on demand in the engine chunk only).
 * One rhythm for the whole collection, after the owner's «دعوة تتحرّك» reference, written like fine stationery
 * rather than a cartoon:
 *   paper → frames drawn in → art settles in layers (2D parallax: nearer layers travel further) → title inked in
 *   → names inked in (readable by ~1.8 s) → details rise line by line → sparks settle → one foil sweep → rest,
 *   then a short idle «breath» (three slow cycles; paused while the tab is hidden or the face is off screen).
 * One easing family (EASES): every tween uses dy-in, dy-ink, dy-draw, dy-settle, dy-drop or dy-breath.
 * Faces with flat motion art (data-motion="wedding" …) get their own artwork beats; every other face declares its
 * layers by role (data-mo="corner-bl", "hang", "stamp" … in collection.js) and the roles share one choreography,
 * so every face feels related but moves after its own art.
 * Every word is live text: lines are only moved, faded or masked (a soft right-to-left ink mask per line, never per
 * letter — Arabic shaping stays intact) and the foil sweep is a moving gradient clipped to the live glyphs.
 * Reduced motion (or the organizer's «static» experience): nothing moves — the face is shown in its final state.
 * Preset timelines only: there is no user-facing animation editor (GSAP licence, owner decision Q2).
 */
let gsapP = null;
const loadGsap = () => (gsapP ??= import('gsap').then((m) => {
  const g = m.gsap || m.default;
  for (const [name, fn] of Object.entries(EASES)) g.registerEase(name, fn);
  return g;
}));

// ── the easing family (pure: unit-tested in tests/unit/card-motion.test.ts) ──────────────────────────
/** CSS cubic-bezier(x1, y1, x2, y2) as a function of progress (Newton steps, bisection fallback) */
export function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t, sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (p) => {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    let t = p;
    for (let i = 0; i < 8; i++) {
      const err = sx(t) - p, d = dx(t);
      if (Math.abs(err) < 1e-7 || Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    if (!(t >= 0 && t <= 1) || Math.abs(sx(t) - p) > 1e-5) {
      let lo = 0, hi = 1;
      t = p;
      for (let i = 0; i < 40; i++) { if (sx(t) < p) lo = t; else hi = t; t = (lo + hi) / 2; }
    }
    return sy(t);
  };
}

/** a damped settle that lands exactly on 1 (a light physical «give»): more damping = less swing past the end */
export function settle(damping, turns) {
  const w = Math.PI * 2 * turns, end = 1 - Math.exp(-damping) * Math.cos(w);
  return (p) => (p <= 0 ? 0 : p >= 1 ? 1 : (1 - Math.exp(-damping * p) * Math.cos(w * p)) / end);
}

export const EASES = {
  'dy-in': cubicBezier(0.22, 1, 0.36, 1),      // arrivals: a quick start and a long, soft landing
  'dy-ink': cubicBezier(0.5, 0, 0.18, 1),      // text masks: ink spreading along the line
  'dy-draw': cubicBezier(0.65, 0, 0.35, 1),    // strokes and the foil sweep
  'dy-settle': settle(7, 0.75),                // art pieces: land with a ~2 % give
  'dy-drop': settle(6.5, 1.1),                 // sparks, confetti, the wax seal: lighter, one small bounce (~8 %)
  'dy-breath': (p) => (1 - Math.cos(Math.PI * p)) / 2,
};

/** the shared beats (seconds) — every face uses the same rhythm so the family feels like one */
export const BEATS = { plate: 0, frame: 0.1, motifs: 0.4, title: 0.65, names: 0.95, sparks: 1.25, details: 1.45, foil: 2.05, rest: 3.1, idle: 3.3 };

/** idle breath: three slow cycles after the entrance, then rest */
export const BREATH = { cycle: 2.6, cycles: 3 };

/** scattered but deterministic stagger order (golden-ratio walk), so sparks never pop in a visible sweep */
export const scatter = (i, n) => (n > 1 ? ((i * 0.618034) % 1) : 0);

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const canFoil = () => typeof CSS !== 'undefined' && CSS.supports?.('color', 'color-mix(in srgb, currentColor 40%, #fff)')
  && (CSS.supports?.('-webkit-background-clip', 'text') || CSS.supports?.('background-clip', 'text'));

// ── building blocks ────────────────────────────────────────────────────────────────────────────────
function kit(tl, gsap) {
  const list = (t) => (t ? (typeof t.length === 'number' ? [...t] : [t]) : []);
  const from = (els, vars, at) => { const a = list(els); if (a.length) tl.from(a, vars, at); return a; };
  /** a value relative to what the element already has (images keep their own flips and rotations) */
  const rel = (prop, delta = 0, mul = 1) => (i, el) => (Number(gsap.getProperty(el, prop)) || (prop.startsWith('scale') ? 1 : 0)) * mul + delta;
  /** stroke-only shapes draw themselves in (the stagger is capped: a tiled border has dozens of strokes) */
  const draw = (els, at, d = 1.2, gap = 0.08) => list(els).forEach((n, i) => {
    const len = typeof n.getTotalLength === 'function' ? Math.ceil(n.getTotalLength()) + 2 : 0;
    if (!len) return;
    tl.fromTo(n, { strokeDasharray: len, strokeDashoffset: len }, { strokeDasharray: len, strokeDashoffset: 0, duration: d, ease: 'dy-draw', immediateRender: true }, at + Math.min(i * gap, 0.45))
      .set(n, { clearProps: 'strokeDasharray,strokeDashoffset' }, at + Math.min(i * gap, 0.45) + d);
  });
  /** a soft right-to-left (or left-to-right for Latin) ink mask over a whole line of live text */
  const ink = (els, at, { dur = 0.8, gap = 0.14, y = 7 } = {}) => list(els).forEach((el, i) => {
    const t = at + i * gap;
    const side = getComputedStyle(el).direction === 'ltr' ? 'right' : 'left';
    const mask = `linear-gradient(to ${side}, #000 calc(var(--dy-ink) - 28%), transparent var(--dy-ink))`;
    tl.set(el, { WebkitMaskImage: mask, maskImage: mask, willChange: 'transform' }, t)
      .fromTo(el, { '--dy-ink': '0%' }, { '--dy-ink': '128%', duration: dur, ease: 'dy-ink', immediateRender: false }, t)
      .from(el, { y, duration: dur + 0.2, ease: 'dy-in' }, t)
      .from(el, { opacity: 0, duration: 0.3, ease: 'none' }, t)
      .set(el, { clearProps: 'WebkitMaskImage,maskImage,willChange' }, t + dur);
  });
  /** a line rises a few pixels into place */
  const rise = (els, at, { dur = 0.75, gap = 0.085, y = 10 } = {}) => from(els, { y, opacity: 0, duration: dur, ease: 'dy-in', stagger: gap }, at);
  /** one foil sweep across the glyphs of a gold line: a moving gradient clipped to the live text */
  const foil = (els, at, dur = 1.25) => {
    if (!canFoil()) return;
    const sheen = 'linear-gradient(100deg, currentColor 40%, color-mix(in srgb, currentColor 30%, #FFF7E2) 50%, currentColor 60%)';
    list(els).forEach((el, i) => {
      const t = at + i * 0.12;
      tl.set(el, { backgroundImage: sheen, backgroundSize: '300% 100%', backgroundRepeat: 'no-repeat', backgroundPosition: '0% 0%', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }, t)
        .to(el, { backgroundPosition: '100% 0%', duration: dur, ease: 'dy-draw' }, t)
        .set(el, { clearProps: 'backgroundImage,backgroundSize,backgroundRepeat,backgroundPosition,WebkitBackgroundClip,backgroundClip,WebkitTextFillColor' }, t + dur);
    });
  };
  /** sparks settle in a scattered order */
  const sparks = (els, at, { scale = 0, rotation = 40 } = {}) => {
    const a = list(els);
    a.forEach((el, i) => tl.from(el, { scale, rotation, opacity: 0, transformOrigin: '50% 50%', duration: 0.75, ease: 'dy-drop' }, at + scatter(i, a.length) * 0.5));
  };
  return { from, rel, draw, ink, rise, foil, sparks, list };
}

/** the light catching the foil once: a soft band crossing the art (above the art, below the text) */
function sheen(tl, face) {
  const art = face.querySelectorAll(':scope > .oc-layer, :scope > .kc-img, :scope > .kc-band, :scope > .kc-arch');
  if (!art.length) return null;
  const el = document.createElement('i');
  el.className = 'dy-sheen';
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText = 'position:absolute;inset:-6% -70%;z-index:-1;pointer-events:none;mix-blend-mode:soft-light;'
    + 'background:linear-gradient(105deg,rgba(255,250,236,0) 42%,rgba(255,250,236,.75) 50%,rgba(255,250,236,0) 58%);opacity:0';
  art[art.length - 1].after(el);
  tl.fromTo(el, { xPercent: 40, opacity: 1 }, { xPercent: -40, duration: 1.5, ease: 'dy-draw', immediateRender: false }, BEATS.foil - 0.1)
    .set(el, { opacity: 0 }, BEATS.foil + 1.4);
  return el;
}

// ── artwork ───────────────────────────────────────────────────────────────────────────────────────
const CORNER = { tl: [-1, -1], tr: [1, -1], bl: [-1, 1], br: [1, 1] };

/** faces composed from kit motifs, raster layers and frames: every layer declares its role (data-mo) */
function roleArt(tl, q, k, face) {
  const { from, rel, draw } = k;
  from(q('[data-mo="paper"]'), { opacity: 0, duration: 0.8, ease: 'dy-in' }, BEATS.plate);
  // frames: every stroke-only shape of the art layer draws itself in (rules, ovals, arches, square frames)
  const strokes = [...face.querySelectorAll(':scope > .oc-layer :is(rect, path, ellipse, circle, line, polyline)')]
    .filter((n) => n.getAttribute('fill') === 'none' && n.getAttribute('stroke') !== 'none');
  draw(strokes, BEATS.frame, 1.4, 0.1);
  // the small filled stars that sit on a frame's corners land once their frame has been drawn
  k.sparks([...face.querySelectorAll(':scope > .oc-layer polygon')].filter((n) => !n.closest('[data-mo]')), BEATS.motifs + 0.55);
  from(q('.kc-arch'), { opacity: 0, scaleY: 0.92, transformOrigin: '50% 100%', duration: 1.3, ease: 'dy-in' }, BEATS.frame);
  from(q('.kc-vrule'), { scaleY: 0, transformOrigin: '50% 0%', duration: 1.3, ease: 'dy-draw' }, BEATS.frame);
  from(q('.kc-band'), { scaleX: 0, transformOrigin: '50% 50%', duration: 1.1, ease: 'dy-draw' }, BEATS.frame + 0.15);
  // tiled borders slide in from their edge (far: small travel)
  from(q('[data-mo="edge-top"]'), { opacity: 0, y: -8, duration: 1.1, ease: 'dy-in' }, BEATS.frame);
  from(q('[data-mo="edge-bottom"]'), { opacity: 0, y: 8, duration: 1.1, ease: 'dy-in' }, BEATS.frame + 0.1);
  from(q('[data-mo="side"]'), { opacity: 0, x: -12, duration: 1.1, ease: 'dy-in' }, BEATS.plate);
  // corner art grows in from its corner (near: the largest travel)
  for (const [c, [sx, sy]] of Object.entries(CORNER)) {
    from(q(`[data-mo="corner-${c}"]`), {
      opacity: 0, x: rel('x', sx * 14), y: rel('y', sy * 14), scaleX: rel('scaleX', 0, 0.9), scaleY: rel('scaleY', 0, 0.9),
      rotation: rel('rotation', sx * sy * 6), transformOrigin: '50% 50%', duration: 1.35, ease: 'dy-settle', stagger: 0.12,
    }, BEATS.motifs - 0.15);
  }
  // hanging art (lanterns, drapes) swings down from its cord and settles
  from(q('[data-mo="hang"]'), { opacity: 0, y: rel('y', -26), rotation: rel('rotation', 5), transformOrigin: '50% 0%', duration: 1.6, ease: 'dy-settle', stagger: 0.14 }, BEATS.motifs - 0.1);
  // balloons float up into place
  from(q('[data-mo="float"]'), { opacity: 0, y: rel('y', 46), rotation: rel('rotation', -4), transformOrigin: '50% 100%', duration: 1.7, ease: 'dy-settle', stagger: 0.18 }, BEATS.motifs - 0.15);
  // flowers and buildings at the foot of the card bloom upward
  from(q('[data-mo="bloom"]'), { opacity: 0, y: rel('y', 22), scaleX: rel('scaleX', 0, 0.96), scaleY: rel('scaleY', 0, 0.96), transformOrigin: '50% 100%', duration: 1.4, ease: 'dy-settle', stagger: 0.09 }, BEATS.motifs);
  // clouds drift in
  from(q('[data-mo="drift"]'), { opacity: 0, x: rel('x', -18), duration: 1.8, ease: 'dy-in', stagger: 0.2 }, BEATS.motifs - 0.1);
  // the occasion's emblem (rings, cap, coffee pot, rosette) settles at the centre
  from(q('[data-mo="emblem"]'), { opacity: 0, y: rel('y', 10), scaleX: rel('scaleX', 0, 0.88), scaleY: rel('scaleY', 0, 0.88), transformOrigin: '50% 50%', duration: 1.25, ease: 'dy-settle', stagger: 0.1 }, BEATS.motifs + 0.05);
  // confetti and petals fall a little and settle, as if they had just landed on the paper
  from(q('[data-mo="confetti"]'), { opacity: 0, y: rel('y', -34), rotation: rel('rotation', -5), duration: 1.5, ease: 'dy-drop', stagger: 0.12 }, BEATS.motifs - 0.1);
  // the wax seal / bow is pressed on, then its initials appear
  const stamps = from(q('[data-mo="stamp"]'), { opacity: 0, scaleX: rel('scaleX', 0, 1.35), scaleY: rel('scaleY', 0, 1.35), rotation: rel('rotation', -8), transformOrigin: '50% 50%', duration: 0.8, ease: 'dy-drop' }, BEATS.motifs + 0.25);
  if (stamps.length) from(q('.kc-seal'), { opacity: 0, scale: 0.86, duration: 0.6, ease: 'dy-in' }, BEATS.motifs + 0.75);
  else from(q('.kc-seal'), { opacity: 0, duration: 0.6 }, BEATS.motifs);
  from(q('.kc-vlabel'), { opacity: 0, y: 18, duration: 1.2, ease: 'dy-in' }, BEATS.frame + 0.2);
  k.sparks(q('[data-mo="spark"]'), BEATS.sparks - 0.2);
}

/** the six flat motion faces (motion-art.js): their own artwork beats in the same language */
function motionArt(tl, q, k, kind) {
  const { from, draw } = k;
  from(q('.mo-backplate'), { opacity: 0, duration: 0.6, ease: 'dy-in' }, BEATS.plate);
  switch (kind) {
    case 'wedding':
      from(q('.mo-arch'), { opacity: 0, scaleY: 0.9, transformOrigin: '50% 100%', duration: 1.3, ease: 'dy-in' }, BEATS.frame);
      draw(q('.mo-draw'), BEATS.frame, 1.5, 0.1);
      from(q('.mo-leaf'), { scale: 0, rotation: -24, transformOrigin: '100% 100%', duration: 1, ease: 'dy-settle', stagger: 0.07 }, BEATS.motifs);
      from(q('.mo-flower'), { scale: 0, rotation: -60, transformOrigin: '50% 50%', duration: 1.2, ease: 'dy-settle', stagger: 0.13 }, BEATS.motifs + 0.15);
      break;
    case 'engagement':
      from(q('.mo-ribbon-a'), { x: -120, opacity: 0, duration: 1.3, ease: 'dy-in' }, BEATS.plate);
      from(q('.mo-ribbon-b'), { x: 90, opacity: 0, duration: 1.3, ease: 'dy-in' }, BEATS.plate + 0.1);
      from(q('.mo-halo'), { scale: 0.6, opacity: 0, transformOrigin: '50% 50%', duration: 1.3, ease: 'dy-in' }, BEATS.frame);
      from(q('.mo-ring-a'), { x: -90, rotation: -40, opacity: 0, transformOrigin: '50% 50%', duration: 1.5, ease: 'dy-settle' }, BEATS.frame + 0.15);
      from(q('.mo-ring-b'), { x: 90, rotation: 40, opacity: 0, transformOrigin: '50% 50%', duration: 1.5, ease: 'dy-settle' }, BEATS.frame + 0.3);
      draw(q('.mo-draw'), BEATS.motifs + 0.4, 1.2);
      break;
    case 'birthday': {
      draw(q('.mo-draw'), BEATS.frame, 1.1);
      from(q('.mo-flags path'), { scaleY: 0, transformOrigin: '50% 0%', duration: 0.8, ease: 'dy-drop', stagger: 0.08 }, BEATS.frame + 0.45);
      from(q('.mo-balloon'), { y: 180, rotation: -10, opacity: 0, transformOrigin: '50% 100%', duration: 1.8, ease: 'dy-settle', stagger: 0.2 }, BEATS.plate + 0.1);
      from(q('.mo-cake'), { y: 40, opacity: 0, duration: 1.2, ease: 'dy-settle' }, BEATS.motifs + 0.1);
      from(q('.mo-candle'), { y: 14, opacity: 0, duration: 0.7, ease: 'dy-in', stagger: 0.08 }, BEATS.motifs + 0.55);
      from(q('.mo-flame'), { scale: 0, transformOrigin: '50% 100%', duration: 0.6, ease: 'dy-drop', stagger: 0.08 }, BEATS.motifs + 0.9);
      // confetti falls a short way with a scattered start and lands with a little bounce
      const bits = k.list(q('.mo-confetti'));
      bits.forEach((el, i) => tl.from(el, { y: -50 - (i % 5) * 10, rotation: (i % 2 ? 1 : -1) * 70, opacity: 0, transformOrigin: '50% 50%', duration: 1.3, ease: 'dy-drop' }, BEATS.frame + scatter(i, bits.length) * 0.7));
      break;
    }
    case 'graduation':
      from(q('.mo-panel-a'), { x: 220, opacity: 0, duration: 1.2, ease: 'dy-in' }, BEATS.plate);
      from(q('.mo-panel-b'), { x: -220, opacity: 0, duration: 1.2, ease: 'dy-in' }, BEATS.plate + 0.1);
      draw(q('.mo-draw'), BEATS.frame + 0.1, 1.2);
      from(q('.mo-laurel'), { scale: 0, rotation: 30, transformOrigin: '50% 100%', duration: 0.8, ease: 'dy-settle', stagger: 0.045 }, BEATS.motifs);
      from(q('.mo-cap'), { y: -110, rotation: -14, opacity: 0, transformOrigin: '50% 50%', duration: 1.6, ease: 'dy-settle' }, BEATS.frame + 0.1);
      break;
    case 'iftar':
      from(q('.mo-arch'), { opacity: 0, scaleY: 0.92, transformOrigin: '50% 100%', duration: 1.3, ease: 'dy-in' }, BEATS.frame);
      draw(q('.mo-draw'), BEATS.frame, 1.6);
      from(q('.mo-moon'), { rotation: -40, scale: 0.6, opacity: 0, transformOrigin: '50% 50%', duration: 1.4, ease: 'dy-settle' }, BEATS.motifs);
      from(q('.mo-lantern'), { y: -80, rotation: -9, opacity: 0, transformOrigin: '50% 0%', duration: 1.7, ease: 'dy-settle', stagger: 0.16 }, BEATS.frame + 0.05);
      break;
    case 'newborn':
      from(q('.mo-halo'), { scale: 0.7, opacity: 0, transformOrigin: '50% 50%', duration: 1.4, ease: 'dy-in' }, BEATS.frame);
      from(q('.mo-moon'), { rotation: -40, scale: 0.6, opacity: 0, transformOrigin: '50% 50%', duration: 1.4, ease: 'dy-settle' }, BEATS.frame + 0.25);
      from(q('.mo-cloud'), { x: -70, opacity: 0, duration: 1.8, ease: 'dy-in', stagger: 0.25 }, BEATS.frame + 0.15);
      // parallax: the far hill rises less and earlier than the near one
      from(q('.mo-hill-a'), { y: 70, duration: 1.4, ease: 'dy-in' }, BEATS.frame + 0.1);
      from(q('.mo-hill-b'), { y: 120, duration: 1.4, ease: 'dy-in' }, BEATS.frame + 0.3);
      break;
    default:
  }
  k.sparks(q('.mo-spark'), BEATS.sparks - 0.2);
}

/** the text, line by line: title and names are inked in, the details rise; the gold title catches the light once */
function text(tl, q, k, face) {
  const { from, ink, rise, foil } = k;
  const namesBox = face.querySelector('.oc-names');
  const before = (el) => namesBox && (namesBox.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING);
  ink(q('.kc-mono, .kc-script'), BEATS.title - 0.2, { dur: 0.9 });
  rise(q('.kc-greet'), BEATS.title - 0.1, { y: 8 });
  ink(q('.kc-title'), BEATS.title, { dur: 0.85 });
  rise(q('.kc-class'), BEATS.title + 0.3, { y: 6 });
  from(q('.kc-rule'), { scaleX: 0, opacity: 0, transformOrigin: '50% 50%', duration: 1, ease: 'dy-draw' }, BEATS.names - 0.2);
  ink(q('.oc-name'), BEATS.names, { dur: 0.7, gap: 0.2, y: 8 });
  from(q('.oc-join'), { opacity: 0, scale: 0.6, transformOrigin: '50% 50%', duration: 0.7, ease: 'dy-settle' }, BEATS.names + 0.2);
  rise(q('.oc-latin'), BEATS.names + 0.55, { y: 6 });
  const lines = [...q('.kc-lines > div, .kc-row, .kc-venue, .kc-day, .kc-when, .kc-stack > div, .oc-inner > .kc-latin, .kc-year')];
  rise(lines.filter(before), BEATS.title + 0.35, { y: 6 });
  rise(lines.filter((el) => !before(el)), BEATS.details);
  from(q('.kc-day b'), { scale: 0.9, transformOrigin: '50% 60%', duration: 1, ease: 'dy-settle' }, BEATS.details + 0.05);
  foil(q('.kc-title, .kc-mono'), BEATS.foil);
}

/** the idle breath: a few slow cycles, nearer art moving a little more (2D parallax), then rest */
function breathe(gsap, face, kind) {
  const q = (s) => [...face.querySelectorAll(s)];
  const idle = gsap.timeline({ paused: true, defaults: { ease: 'dy-breath', duration: BREATH.cycle / 2, repeat: BREATH.cycles * 2 - 1, yoyo: true } });
  const add = (els, vars, at = 0) => { if (els.length) idle.to(els, vars, at); };
  switch (kind) {
    case 'wedding': add(q('.mo-flower'), { rotation: 4, transformOrigin: '50% 50%', stagger: 0.2 }); break;
    case 'engagement': add(q('.mo-ring-a'), { rotation: -3, transformOrigin: '50% 50%' }); add(q('.mo-ring-b'), { rotation: 3, transformOrigin: '50% 50%' }); add(q('.mo-halo'), { scale: 1.02, transformOrigin: '50% 50%' }); break;
    case 'birthday': add(q('.mo-balloon'), { y: -6, stagger: 0.4 }); add(q('.mo-flame'), { scaleY: 1.12, transformOrigin: '50% 100%', duration: 0.32, repeat: Math.round(BREATH.cycle * BREATH.cycles / 0.32) | 1, stagger: 0.1 }); break;
    case 'graduation': add(q('.mo-cap'), { y: -7, rotation: 1.5, transformOrigin: '50% 50%' }); break;
    case 'iftar': add(q('.mo-lantern'), { rotation: 2, transformOrigin: '50% 0%', stagger: 0.35 }); break;
    case 'newborn': add(q('.mo-cloud'), { x: 8, stagger: 0.5 }); add(q('.mo-moon'), { rotation: 3, transformOrigin: '50% 50%' }); break;
    default:
      add(q('[data-mo="hang"]'), { rotation: '+=1.4', transformOrigin: '50% 0%', stagger: 0.3 });
      add(q('[data-mo="float"]'), { y: '-=5', stagger: 0.4 });
      add(q('[data-mo="drift"]'), { x: '+=6', stagger: 0.5 });
      add(q('[data-mo^="corner-"], [data-mo="bloom"]'), { y: '-=1.5', stagger: 0.2 });
      add(q('[data-mo="emblem"]'), { y: '-=2' });
  }
  add([...q('[data-mo="spark"]'), ...q('.mo-spark')], { opacity: 0.55, stagger: { each: 0.25, from: 'random' } });
  return idle.getChildren().length ? idle : null;
}

/**
 * Play a face's entrance. `root` is the element holding the face markup (.oc-face inside).
 * Options: reduced (show the final state), onDone (the entrance has finished), delay (seconds before it starts;
 * the face waits hidden in its first frame — the guest intro starts it while the card flies in).
 * Returns a handle: { replay(), finish(), revert() } — revert restores the static face (also on unmount).
 */
export function playCardMotion(root, { reduced = false, onDone, delay = 0 } = {}) {
  const face = root?.querySelector?.('.oc-face') ?? (root?.classList?.contains('oc-face') ? root : null);
  let ctx = null, tl = null, idle = null, alive = true, done = false, skip = false, io = null, onVis = null, seen = true;
  const stopIdle = () => { idle?.kill(); idle = null; io?.disconnect(); io = null; if (onVis) document.removeEventListener('visibilitychange', onVis); onVis = null; };
  const handle = {
    replay() { stopIdle(); done = false; tl?.restart(true); },
    /** jump to the final frame (the guest tapped through the intro) */
    finish() { skip = true; if (tl && !done) tl.progress(1); },
    revert() { alive = false; stopIdle(); ctx?.revert(); ctx = null; tl = null; },
    get timeline() { return tl; },
  };
  if (!face || reduced || reducedMotion()) { onDone?.(); return handle; }
  loadGsap().then((gsap) => {
    if (!alive || !face.isConnected) return;
    ctx = gsap.context(() => {
      const q = (sel) => face.querySelectorAll(sel);
      const kind = face.dataset.motion || '';
      tl = gsap.timeline({ delay, defaults: { duration: 0.8, ease: 'dy-in' } });
      const k = kit(tl, gsap);
      if (kind) motionArt(tl, q, k, kind); else roleArt(tl, q, k, face);
      text(tl, q, k, face);
      const glow = sheen(tl, face);
      tl.call(() => {
        done = true;
        stopIdle();
        onDone?.();
        // the breath: only while it can be seen (hidden tabs and off-screen faces pause it)
        ctx?.add(() => { idle = breathe(gsap, face, kind); });
        if (!idle) return;
        const sync = () => { if (!idle) return; if (seen && !document.hidden) idle.resume(); else idle.pause(); };
        onVis = sync;
        document.addEventListener('visibilitychange', onVis);
        if (typeof IntersectionObserver === 'function') {
          io = new IntersectionObserver(([en]) => { seen = !!en?.isIntersecting; sync(); });
          io.observe(face);
        }
        sync();
      }, null, Math.max(tl.duration(), BEATS.rest));
      return () => glow?.remove();
    }, face);
    if (skip) tl.progress(1);
  }).catch(() => onDone?.());
  return handle;
}
