/**
 * Card motion — one choreographed entrance per face (GSAP 3, loaded on demand in the engine chunk only).
 * Shared rhythm, after the owner's «دعوة تتحرّك» reference:
 *   backplate → frame/arch drawn in → motifs grow from their stems → sparks → title → names → details → one idle breath
 * Faces with flat motion art (data-motion="wedding" …) get their own artwork beats; every other face gets the
 * shared text entrance plus its layers settling in. Every word is live text and is only moved/faded, never redrawn.
 * Reduced motion (or the organizer's «static» experience): nothing moves — the face is shown in its final state.
 * Preset timelines only: there is no user-facing animation editor (GSAP licence, owner decision Q2).
 */
let gsapP = null;
const loadGsap = () => (gsapP ??= import('gsap').then((m) => m.gsap || m.default));

/** the shared beats (seconds) — every face uses the same rhythm so the family feels like one */
export const BEATS = { plate: 0, frame: 0.15, motifs: 0.7, sparks: 1.1, title: 1.35, names: 1.8, details: 2.3, rest: 2.9, idle: 3.4 };

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function art(tl, q, kind) {
  const from = (sel, vars, at) => { const a = q(sel); if (a.length) tl.from(a, vars, at); };
  const draw = (sel, at, d = 1) => q(sel).forEach((n, i) => {
    const len = typeof n.getTotalLength === 'function' ? n.getTotalLength() : 0;
    if (len) tl.fromTo(n, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: d, ease: 'power2.inOut' }, at + i * 0.08);
  });
  from('.mo-backplate', { opacity: 0, duration: 0.3 }, BEATS.plate);
  switch (kind) {
    case 'wedding':
      from('.mo-arch', { scaleY: 0, transformOrigin: '50% 100%', duration: 0.9 }, BEATS.frame);
      draw('.mo-draw', BEATS.frame + 0.1, 1.2);
      from('.mo-leaf', { scale: 0, rotation: -30, transformOrigin: '100% 100%', stagger: 0.08 }, BEATS.motifs);
      from('.mo-flower', { scale: 0, rotation: -45, transformOrigin: '50% 50%', stagger: 0.16, ease: 'back.out(1.3)', duration: 0.9 }, BEATS.motifs + 0.2);
      break;
    case 'engagement':
      from('.mo-ribbon-a', { x: -150, duration: 1.1 }, 0); from('.mo-ribbon-b', { x: 150, duration: 1.1 }, 0.1);
      from('.mo-halo', { scale: 0, transformOrigin: '50% 50%', ease: 'power2.inOut', duration: 1 }, BEATS.frame);
      from('.mo-ring-a', { x: -110, rotation: -50, opacity: 0, transformOrigin: '50% 50%', duration: 1.3, ease: 'power3.inOut' }, BEATS.frame + 0.15);
      from('.mo-ring-b', { x: 110, rotation: 50, opacity: 0, transformOrigin: '50% 50%', duration: 1.3, ease: 'power3.inOut' }, BEATS.frame + 0.3);
      draw('.mo-draw', BEATS.motifs + 0.4, 1.1);
      break;
    case 'birthday':
      draw('.mo-draw', 0.1, 0.9);
      from('.mo-flags path', { scaleY: 0, transformOrigin: '50% 0%', stagger: 0.1, ease: 'back.out(1.8)' }, 0.5);
      from('.mo-balloon', { y: 220, rotation: -15, opacity: 0, stagger: 0.2, duration: 1.4, ease: 'back.out(1.1)', transformOrigin: '50% 100%' }, 0.15);
      from('.mo-cake', { scaleY: 0, transformOrigin: '50% 100%', ease: 'back.out(1.3)', duration: 0.9 }, BEATS.motifs + 0.3);
      from('.mo-candle', { y: 25, opacity: 0, stagger: 0.1 }, BEATS.motifs + 0.8);
      from('.mo-confetti', { scale: 0, y: -40, rotation: 35, transformOrigin: '50% 50%', stagger: 0.02, duration: 0.9, ease: 'back.out(1.6)' }, 0.4);
      break;
    case 'graduation':
      from('.mo-panel-a', { x: 600, duration: 0.9 }, 0); from('.mo-panel-b', { x: -600, duration: 0.9 }, 0.1);
      draw('.mo-draw', BEATS.frame + 0.2, 1);
      from('.mo-laurel', { scale: 0, rotation: 40, transformOrigin: '50% 100%', stagger: 0.05, duration: 0.55 }, BEATS.motifs);
      from('.mo-cap', { y: -140, rotation: -20, opacity: 0, transformOrigin: '50% 50%', duration: 1.3, ease: 'back.out(1.2)' }, BEATS.frame + 0.1);
      tl.to(q('.mo-cap'), { y: -10, rotation: 2, duration: 0.6, ease: 'sine.inOut' }, BEATS.idle).to(q('.mo-cap'), { y: 0, rotation: 0, duration: 0.6, ease: 'sine.inOut' }, BEATS.idle + 0.6);
      break;
    case 'iftar':
      from('.mo-arch', { scaleY: 0, transformOrigin: '50% 100%', duration: 1 }, BEATS.frame);
      draw('.mo-draw', BEATS.frame, 1.3);
      from('.mo-moon', { rotation: -50, scale: 0.2, opacity: 0, transformOrigin: '50% 50%', duration: 1.2 }, BEATS.motifs);
      from('.mo-lantern', { y: -90, opacity: 0, rotation: -18, transformOrigin: '50% 0%', stagger: 0.18, duration: 1.3, ease: 'back.out(1.3)' }, BEATS.frame + 0.1);
      tl.to(q('.mo-lantern'), { rotation: 3, transformOrigin: '50% 0%', duration: 0.9, ease: 'sine.inOut', stagger: 0.1 }, BEATS.idle).to(q('.mo-lantern'), { rotation: 0, duration: 0.9, ease: 'sine.inOut' }, BEATS.idle + 1);
      break;
    case 'newborn':
      from('.mo-halo', { scale: 0, transformOrigin: '50% 50%', ease: 'power2.inOut', duration: 1.1 }, BEATS.frame);
      from('.mo-moon', { rotation: -60, scale: 0.5, opacity: 0, transformOrigin: '50% 50%', duration: 1.2 }, BEATS.frame + 0.3);
      from('.mo-cloud', { x: -110, opacity: 0, stagger: 0.25, duration: 1.5, ease: 'power2.inOut' }, BEATS.frame + 0.2);
      from('.mo-hill-a', { y: 180, duration: 1.1 }, BEATS.frame + 0.2); from('.mo-hill-b', { y: 130, duration: 1.1 }, BEATS.frame + 0.45);
      tl.to(q('.mo-cloud'), { x: 9, y: -4, duration: 1.3, ease: 'sine.inOut' }, BEATS.idle).to(q('.mo-cloud'), { x: 0, y: 0, duration: 1.2, ease: 'sine.inOut' }, BEATS.idle + 1.3);
      break;
    default: {
      // faces with raster/vector layers: the layers settle in from slightly larger, one after another
      from('.kc-img, .oc-layer, .kc-arch, .kc-band', { opacity: 0, scale: 1.04, transformOrigin: '50% 50%', stagger: 0.12, duration: 0.9, ease: 'power2.out' }, BEATS.plate);
      from('.kc-seal, .kc-year, .kc-vlabel', { opacity: 0, y: -10, duration: 0.7 }, BEATS.motifs);
    }
  }
  from('.mo-spark', { scale: 0, rotation: 45, transformOrigin: '50% 50%', stagger: 0.12, ease: 'back.out(1.8)', duration: 0.6 }, BEATS.sparks);
}

function text(tl, q) {
  const from = (sel, vars, at) => { const a = q(sel); if (a.length) tl.from(a, vars, at); };
  from('.kc-mono, .kc-script, .kc-head', { y: 16, opacity: 0, duration: 0.7, stagger: 0.12 }, BEATS.title);
  from('.oc-names', { y: 26, opacity: 0, duration: 0.9 }, BEATS.names);
  from('.kc-class, .kc-rule', { opacity: 0, duration: 0.5 }, BEATS.names - 0.2);
  from('.kc-lines, .kc-info, .kc-day, .kc-when, .kc-stack, .kc-latin', { y: 14, opacity: 0, duration: 0.7, stagger: 0.12 }, BEATS.details);
}

/**
 * Play a face's entrance. `root` is the element holding the face markup (.oc-face inside).
 * Returns a handle: { replay(), revert() } — revert restores the static face (also on unmount).
 */
export function playCardMotion(root, { reduced = false, onDone } = {}) {
  const face = root?.querySelector?.('.oc-face') ?? (root?.classList?.contains('oc-face') ? root : null);
  let ctx = null, tl = null, alive = true;
  const handle = {
    replay() { tl?.restart(); },
    revert() { alive = false; ctx?.revert(); ctx = null; tl = null; },
    get timeline() { return tl; },
  };
  if (!face || reduced || reducedMotion()) { onDone?.(); return handle; }
  // hidden tabs pause the entrance instead of finishing it unseen
  loadGsap().then((gsap) => {
    if (!alive || !face.isConnected) return;
    ctx = gsap.context(() => {
      const q = (sel) => face.querySelectorAll(sel);
      tl = gsap.timeline({ defaults: { duration: 0.8, ease: 'power3.out' }, onComplete: () => onDone?.() });
      art(tl, q, face.dataset.motion || '');
      text(tl, q);
    }, face);
  }).catch(() => onDone?.());
  return handle;
}
