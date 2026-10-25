// Easing library with GSAP-compatible names ("power3.out", "expo.inOut", "back.out(1.4)")
// plus CSS cubic-bezier strings and a few named house curves.
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) { const e = sx(t) - x; const d = dx(t); if (Math.abs(e) < 1e-5 || !d) break; t -= e / d; }
    return sy(Math.min(1, Math.max(0, t)));
  };
}

const pow = (p) => ({ in: (t) => t ** p, out: (t) => 1 - (1 - t) ** p, inOut: (t) => (t < 0.5 ? (2 * t) ** p / 2 : 1 - (2 * (1 - t)) ** p / 2) });
const base = {
  none: { in: (t) => t, out: (t) => t, inOut: (t) => t },
  power1: pow(2), power2: pow(3), power3: pow(4), power4: pow(5),
  sine: { in: (t) => 1 - Math.cos((t * Math.PI) / 2), out: (t) => Math.sin((t * Math.PI) / 2), inOut: (t) => -(Math.cos(Math.PI * t) - 1) / 2 },
  expo: { in: (t) => (t === 0 ? 0 : 2 ** (10 * t - 10)), out: (t) => (t === 1 ? 1 : 1 - 2 ** (-10 * t)), inOut: (t) => (t === 0 || t === 1 ? t : t < 0.5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2) },
  circ: { in: (t) => 1 - Math.sqrt(1 - t * t), out: (t) => Math.sqrt(1 - (t - 1) ** 2), inOut: (t) => (t < 0.5 ? (1 - Math.sqrt(1 - (2 * t) ** 2)) / 2 : (Math.sqrt(1 - (-2 * t + 2) ** 2) + 1) / 2) },
};
const back = (s = 1.70158) => ({ in: (t) => (s + 1) * t ** 3 - s * t * t, out: (t) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2, inOut: (t) => { const c = s * 1.525; return t < 0.5 ? ((2 * t) ** 2 * ((c + 1) * 2 * t - c)) / 2 : ((2 * t - 2) ** 2 * ((c + 1) * (t * 2 - 2) + c) + 2) / 2; } });
const elastic = (a = 1, p = 0.4) => ({ out: (t) => (t === 0 || t === 1 ? t : a * 2 ** (-10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1), in: (t) => t, inOut: (t) => t });

const named = {
  editorial: bezier(0.22, 0.7, 0.12, 1),
  cinematic: bezier(0.6, 0.02, 0.18, 1),
  soft: bezier(0.3, 0.1, 0.2, 1),
  settle: bezier(0.16, 0.9, 0.24, 1),
};

const cache = new Map();
export function getEase(name = 'power2.out') {
  if (typeof name === 'function') return name;
  if (cache.has(name)) return cache.get(name);
  let fn;
  if (named[name]) fn = named[name];
  else if (name.startsWith('cubic-bezier')) { const n = name.match(/[-\d.]+/g).map(Number); fn = bezier(...n); }
  else {
    const m = name.match(/^(\w+)(?:\.(in|out|inOut))?(?:\(([\d.,\s]+)\))?$/);
    if (!m) fn = base.power2.out;
    else {
      const [, fam, dir = 'out', arg] = m;
      const args = arg ? arg.split(',').map(Number) : [];
      const f = fam === 'back' ? back(...args) : fam === 'elastic' ? elastic(...args) : base[fam] || base.power2;
      fn = f[dir] || f.out;
    }
  }
  cache.set(name, fn);
  return fn;
}
