import test from 'node:test';
import assert from 'node:assert/strict';
import { BEATS, BREATH, EASES, cubicBezier, scatter, settle, playCardMotion } from '../../src/cards/card-motion.js';

const sample = (fn: (p: number) => number, n = 400) => Array.from({ length: n + 1 }, (_, i) => fn(i / n));

test('cubicBezier matches the CSS curve: linear stays linear, endpoints are exact, monotonic in x', () => {
  const lin = cubicBezier(0, 0, 1, 1);
  for (const p of [0.1, 0.33, 0.5, 0.9]) assert.ok(Math.abs(lin(p) - p) < 1e-4, `linear at ${p}`);
  const ease = cubicBezier(0.25, 0.1, 0.25, 1); // CSS "ease": known value at 0.5 ≈ 0.8024
  assert.ok(Math.abs(ease(0.5) - 0.8024) < 2e-3, `ease(0.5) = ${ease(0.5)}`);
  for (const fn of [EASES['dy-in']!, EASES['dy-ink']!, EASES['dy-draw']!]) {
    assert.equal(fn(0), 0); assert.equal(fn(1), 1);
    const v = sample(fn);
    for (let i = 1; i < v.length; i++) assert.ok(v[i]! >= v[i - 1]! - 1e-9, 'never runs backwards');
  }
});

test('settle eases land exactly on 1 with a small, physical give', () => {
  for (const [name, maxOver] of [['dy-settle', 0.03], ['dy-drop', 0.1]] as const) {
    const fn = EASES[name]!;
    assert.equal(fn(0), 0); assert.equal(fn(1), 1);
    const peak = Math.max(...sample(fn));
    assert.ok(peak > 1 && peak - 1 <= maxOver, `${name} overshoots ${((peak - 1) * 100).toFixed(1)} %`);
    assert.ok(Math.abs(fn(0.97) - 1) < 0.02, `${name} has settled by the end`);
  }
  // a softer spring (more damping) swings less
  const soft = Math.max(...sample(settle(8, 0.8))), hard = Math.max(...sample(settle(3, 0.8)));
  assert.ok(soft < hard);
});

test('the shared rhythm: names readable by ~1.8 s, the whole entrance within 2.5–3.5 s, a short idle breath', () => {
  const nameInk = BEATS.names! + 0.2 + 0.7; // second name starts 0.2 s after the first and inks in 0.7 s
  assert.ok(nameInk <= 1.9, `names complete at ${nameInk}s`);
  assert.ok(BEATS.title! < BEATS.names! && BEATS.names! < BEATS.details! && BEATS.details! < BEATS.foil!);
  assert.ok(BEATS.rest! >= 2.5 && BEATS.rest! <= 3.5);
  assert.ok(BREATH.cycles >= 2 && BREATH.cycles <= 4 && BREATH.cycle * BREATH.cycles <= 12, 'the breath stops after a few cycles');
});

test('scatter spreads sparks over the window without a visible sweep', () => {
  const order = Array.from({ length: 8 }, (_, i) => scatter(i, 8));
  assert.ok(order.every((v) => v >= 0 && v < 1));
  assert.equal(new Set(order.map((v) => v.toFixed(3))).size, 8);
  const sorted = [...order].sort((a, b) => a - b);
  assert.notDeepEqual(order, sorted, 'not in document order');
  assert.equal(scatter(0, 1), 0);
});

test('reduced motion / no face: the final state at once, with a stable handle', () => {
  let done = 0;
  const h = playCardMotion(null, { onDone: () => { done++; } });
  assert.equal(done, 1);
  for (const k of ['replay', 'finish', 'revert'] as const) assert.equal(typeof h[k], 'function');
  h.replay(); h.finish(); h.revert();
  assert.equal(h.timeline, null);
});
