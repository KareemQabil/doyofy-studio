/**
 * Seeded particle / prop lists for the CSS/SVG scenes — a direct port of the canonical
 * Scene.dc.html renderVals() (same LCG, same seed 11, same call order) so every bokeh, star,
 * bulb, firefly, petal and reflection lands exactly where it did in the original.
 */
export const SCENE_VALS = (() => {
  let seed = 11;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const f1 = (v) => Math.round(v * 10) / 10;
  const toB = (a) => a.map(([bx, by, s, d, tt]) => ({ x: bx, y: by, s, d, t: tt }));
  const stars = [];
  for (let i = 0; i < 64; i++) stars.push({ x: Math.round(rnd() * 460), y: Math.round(rnd() * 640), r: f1(rnd() * 2 + 0.8), d: f1(rnd() * 4), t: f1(rnd() * 2.5 + 2) });
  const starsFew = stars.slice(0, 28).map((s) => ({ ...s, y: Math.round(s.y * 0.72) }));
  const bulbPts = [[22,130],[53,146],[85,159],[116,169],[148,175],[179,177],[211,177],[242,172],[274,165],[305,154],[337,139],[368,121],[27,208],[65,222],[102,232],[139,238],[176,240],[214,239],[251,233],[288,223],[325,209],[363,192]];
  const bulbs = bulbPts.map(([bx, by], i) => ({ x: bx + 40 - 3, y: by + 40 - 3, s: i < 12 ? 7 : 5, d: f1(rnd() * 3), t: f1(rnd() * 2 + 2.4) }));
  const flies = [];
  for (let i = 0; i < 12; i++) flies.push({ x: f1(rnd() * 90 + 5), y: f1(rnd() * 50 + 40), d: f1(-rnd() * 8), t: f1(rnd() * 5 + 6) });
  const pc = ['#F7B6C8', '#FAD3DC', '#FFFFFF', '#F3A6BC', '#FBE3EA'];
  const petals = [];
  for (let i = 0; i < 18; i++) { const s = Math.round(rnd() * 8 + 9); petals.push({ x: f1(rnd() * 96), s, h: Math.round(s * 0.8), c: pc[i % 5], d: f1(-rnd() * 14), t: f1(rnd() * 7 + 9) }); }
  const dc = ['#ffd5e2', '#cae7ff', '#d7ecc5', '#ffe0b8', '#fff4cf'];
  const dots = [];
  for (let i = 0; i < 14; i++) dots.push({ x: f1(12 + (i * 4.9) % 76), y: f1(22 + ((i * 17) % 48)), c: dc[i % 5], d: f1(i * 0.3) });
  const reflect = [];
  for (let i = 0; i < 16; i++) { const yy = 552 + i * 16; const w = Math.round(10 + i * 3.2 + rnd() * 10); reflect.push({ x: Math.round(150 - w / 2 + (rnd() - 0.5) * (8 + i * 2)), y: yy, w, d: f1(rnd() * 2.4) }); }
  return {
    bkFar: toB([[8,12,10,0,7],[22,30,6,1.5,9],[70,8,12,3,8],[88,26,8,.5,10],[40,18,7,2.2,11],[60,40,5,4,9],[14,58,9,1,8],[92,62,7,2.5,10]]),
    bkMid: toB([[18,20,22,.3,9],[78,16,28,1.8,11],[86,52,20,3.2,10],[6,74,26,.8,12],[50,88,18,2.6,9],[30,6,16,4,10]]),
    bkNear: toB([[0,38,74,0,12],[92,78,92,2,14],[68,96,64,4,13],[10,92,84,1,15]]),
    stars, starsFew, bulbs, flies, petals, dots, reflect,
  };
})();

/** canonical parallax: each depth layer translates against the pointer (Scene.dc.html t(dx, dy)) */
export function parallaxVars(nx, ny) {
  const t = (dx, dy) => `translate(${Math.round(-nx * dx * 10) / 10}px, ${Math.round(-ny * dy * 10) / 10}px)`;
  return { '--pf': t(8, 6), '--pm': t(20, 14), '--pn': t(40, 26) };
}
