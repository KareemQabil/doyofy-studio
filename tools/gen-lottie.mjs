// Generates the brand Lottie animations in src/ui/lottie/*.json (run: node tools/gen-lottie.mjs).
// Hand-authored vector only, no imagery: every path below is built from the official logomark geometry
// (src/ui/brand.tsx, guideline p. 9) or simple strokes, in brand gold / ivory / red.
//   loader    the double-line «d» draws itself, then undraws from its start (loops, 1.6 s)
//   success   a ring closes, a check draws, eight sparks burst (plays once, 1.2 s)
//   envelope  an envelope draws, its flap opens and a card rises (loops, 2.4 s)
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('src/ui/lottie');
fs.mkdirSync(OUT, { recursive: true });
const FR = 60;
const GOLD = [0.78, 0.651, 0.38, 1];
const RED = [0.737, 0.278, 0.286, 1];
const IVORY = [0.984, 0.965, 0.925, 1];

const ease = { i: { x: [0.33], y: [1] }, o: { x: [0.67], y: [0] } };
/** an animated scalar: [[frame, value], ...] */
const anim = (keys) => ({ a: 1, k: keys.map(([t, v], n) => ({ t, s: [v].flat(), ...(n < keys.length - 1 ? ease : {}) })) });
const still = (v) => ({ a: 0, k: v });
const K = 0.5523;

/** bezier path: points [{v:[x,y], i:[dx,dy], o:[dx,dy]}] */
const bez = (pts, closed = false) => ({ c: closed, v: pts.map((p) => p.v), i: pts.map((p) => p.i || [0, 0]), o: pts.map((p) => p.o || [0, 0]) });
const shapePath = (p) => ({ ty: 'sh', ks: p.a ? p : still(p) });
const stroke = (c, w) => ({ ty: 'st', c: still(c), o: still(100), w: still(w), lc: 2, lj: 2, ml: 4 });
const fill = (c) => ({ ty: 'fl', c: still(c), o: still(100), r: 1 });
const trim = (s, e) => ({ ty: 'tm', s: s.a !== undefined ? s : still(s), e: e.a !== undefined ? e : still(e), o: still(0), m: 1 });
const tr = (o = {}) => ({ ty: 'tr', p: o.p || still([0, 0]), a: o.a || still([0, 0]), s: o.s || still([100, 100]), r: o.r || still(0), o: o.o || still(100), sk: still(0), sa: still(0) });
const group = (items, t) => ({ ty: 'gr', it: [...items, tr(t)] });
const layer = (nm, shapes, op, ks = {}) => ({
  ddd: 0, ind: 1, ty: 4, nm, sr: 1, ip: 0, op, st: 0, bm: 0,
  ks: { o: ks.o || still(100), r: ks.r || still(0), p: ks.p || still([0, 0, 0]), a: ks.a || still([0, 0, 0]), s: ks.s || still([100, 100, 100]) },
  shapes,
});
const comp = (nm, w, h, op, layers) => ({ v: '5.7.4', fr: FR, ip: 0, op, w, h, nm, ddd: 0, assets: [], layers: layers.map((l, i) => ({ ...l, ind: i + 1 })) });

// ------------------------------------------------------------------ the logomark as two centre-line strokes
function dLine({ cx, cy, r, flick, flickO, stemX, top, end, curve }) {
  const k = r * K;
  return bez([
    { v: flick, o: flickO },
    { v: [cx, cy - r], i: [-flickO[0] * 1.4, 0], o: [-k, 0] },
    { v: [cx - r, cy], i: [0, -k], o: [0, k] },
    { v: [cx, cy + r], i: [-k, 0], o: [k, 0] },
    { v: [stemX, cy], i: [0, k] },
    { v: [stemX, top], o: [0, -curve] },
    { v: end, i: [-curve, 0] },
  ]);
}
const inner = dLine({ cx: 629.35, cy: 584.93, r: 55.2, flick: [664.5, 541.4], flickO: [-9, -8], stemX: 684.6, top: 460.7, end: [736, 409.3], curve: 25.9 });
const outer = dLine({ cx: 629.5, cy: 584, r: 76.5, flick: [671.6, 522.3], flickO: [-12, -10], stemX: 705.9, top: 461.7, end: [736, 431.6], curve: 16.6 });

function loader() {
  const op = 96;
  const line = (p, d) => group([shapePath(p), trim(anim([[d + 52, 0], [d + 92, 100]]), anim([[d, 0], [d + 44, 100]])), stroke(GOLD, 9)]);
  const mark = layer('logomark', [line(inner, 0), line(outer, 6)], op, {
    a: still([642.3, 535, 0]), p: still([120, 140, 0]),
  });
  return comp('doyofy-loader', 240, 280, op, [mark]);
}

function success() {
  const op = 72;
  const ring = group([
    shapePath(bez([{ v: [0, -60], i: [-33, 0], o: [33, 0] }, { v: [60, 0], i: [0, -33], o: [0, 33] }, { v: [0, 60], i: [33, 0], o: [-33, 0] }, { v: [-60, 0], i: [0, 33], o: [0, -33] }], true)),
    trim(0, anim([[0, 0], [24, 100]])), stroke(GOLD, 7),
  ]);
  const check = group([
    shapePath(bez([{ v: [-26, 2] }, { v: [-8, 20] }, { v: [28, -18] }])),
    trim(0, anim([[18, 0], [38, 100]])), stroke(RED, 9),
  ]);
  const sparks = Array.from({ length: 8 }, (_, n) => {
    const a = (n / 8) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    return group([
      shapePath(bez([{ v: [c * 76, s * 76] }, { v: [c * 100, s * 100] }])),
      trim(anim([[34, 0], [52, 100]]), anim([[30, 0], [44, 100]])), stroke(n % 2 ? RED : GOLD, 5),
    ]);
  });
  const badge = layer('seal', [check, ring, ...sparks], op, {
    p: still([120, 120, 0]),
    s: anim([[0, [86, 86, 100]], [26, [106, 106, 100]], [40, [100, 100, 100]]]),
  });
  return comp('doyofy-success', 240, 240, op, [badge]);
}

function envelope() {
  const op = 144;
  const W = 150, H = 96, x0 = -75, y0 = -28;
  const body = group([
    shapePath(bez([{ v: [x0, y0] }, { v: [x0 + W, y0] }, { v: [x0 + W, y0 + H] }, { v: [x0, y0 + H] }], true)),
    trim(0, anim([[0, 0], [30, 100]])), stroke(GOLD, 5),
  ]);
  const pocket = group([
    shapePath(bez([{ v: [x0, y0 + H] }, { v: [0, y0 + 50] }, { v: [x0 + W, y0 + H] }])),
    trim(0, anim([[16, 0], [40, 100]])), stroke(GOLD, 5),
  ]);
  const flapDown = bez([{ v: [x0, y0] }, { v: [0, y0 + 52] }, { v: [x0 + W, y0] }]);
  const flapUp = bez([{ v: [x0, y0] }, { v: [0, y0 - 52] }, { v: [x0 + W, y0] }]);
  const flapKeys = (frames) => ({ a: 1, k: frames.map(([t, p], n) => ({ t, s: [p], ...(n < frames.length - 1 ? ease : {}) })) });
  const flap = group([
    { ty: 'sh', ks: flapKeys([[0, flapDown], [44, flapDown], [70, flapUp], [118, flapUp], [138, flapDown]]) },
    trim(0, anim([[8, 0], [34, 100]])), stroke(GOLD, 5),
  ]);
  const card = group([
    { ty: 'rc', d: 1, s: still([112, 74]), p: still([0, 0]), r: still(6) },
    fill(IVORY), stroke(RED, 4),
    { ty: 'gr', it: [shapePath(bez([{ v: [-30, -8] }, { v: [30, -8] }])), stroke(RED, 4), tr()] },
    { ty: 'gr', it: [shapePath(bez([{ v: [-20, 10] }, { v: [20, 10] }])), stroke(GOLD, 4), tr()] },
  ], { p: anim([[56, [0, 14]], [88, [0, -52]], [116, [0, -52]], [136, [0, 14]]]), o: anim([[54, 0], [60, 100], [130, 100], [136, 0]]) });
  // painter's order: pocket front, card, body, flap at the back (lottie draws the first shape on top)
  const env = layer('envelope', [pocket, card, body, flap], op, { p: still([120, 150, 0]) });
  return comp('doyofy-envelope', 240, 240, op, [env]);
}

for (const [name, data] of Object.entries({ loader: loader(), success: success(), envelope: envelope() })) {
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(data));
  console.log(`src/ui/lottie/${name}.json  ${JSON.stringify(data).length} bytes`);
}

// the same centre lines as SVG paths, for the pre-JavaScript boot mark in src/index.html
const svgD = (b) => b.v.map((v, n) => n === 0 ? `M${v.join(' ')}` : `C${(b.v[n - 1][0] + b.o[n - 1][0]).toFixed(1)} ${(b.v[n - 1][1] + b.o[n - 1][1]).toFixed(1)} ${(v[0] + b.i[n][0]).toFixed(1)} ${(v[1] + b.i[n][1]).toFixed(1)} ${v.join(' ')}`).join('');
console.log('boot mark inner:', svgD(inner));
console.log('boot mark outer:', svgD(outer));
