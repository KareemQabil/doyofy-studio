/**
 * Runtime motion helpers: a rAF spring animator, reduced-motion check and haptic taps.
 * Haptics use the Vibration API where it exists (Android browsers); elsewhere they are silent.
 * Nothing here is required to complete a task — it only acknowledges one.
 */
import { SPRING, springSettled, springStep, type SpringConfig, type SpringState } from '../../domain/motion';

export const prefersReducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

type Haptic = 'tick' | 'snap' | 'select' | 'success' | 'warning';
const PATTERN: Record<Haptic, number | number[]> = { tick: 6, snap: 10, select: 14, success: [10, 40, 16], warning: [18, 60, 18] };
let lastHaptic = 0;
/** a short physical acknowledgement on phones; throttled so a fast drag never buzzes continuously */
export function haptic(kind: Haptic = 'tick') {
  if (!coarse() || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  const now = performance.now();
  if (kind === 'tick' && now - lastHaptic < 70) return;
  lastHaptic = now;
  try { navigator.vibrate(PATTERN[kind]); } catch { /* blocked by the browser: silent */ }
}

/**
 * animate(from → to) on a spring, starting with the release velocity (units per second).
 * Returns a cancel function. Reduced motion jumps straight to the target.
 */
export function springTo(from: number, to: number, opts: { velocity?: number; config?: SpringConfig; precision?: number; onUpdate: (x: number) => void; onRest?: () => void }): () => void {
  const { velocity = 0, config = SPRING.snap, precision = 0.5, onUpdate, onRest } = opts;
  if (prefersReducedMotion() || typeof requestAnimationFrame !== 'function') { onUpdate(to); onRest?.(); return () => {}; }
  let s: SpringState = { x: from, v: velocity }, last = performance.now(), raf = 0, live = true;
  const tick = (t: number) => {
    if (!live) return;
    // fixed sub-steps keep the spring stable on slow frames
    let dt = Math.min(0.064, (t - last) / 1000); last = t;
    while (dt > 0) { const h = Math.min(dt, 1 / 120); s = springStep(s, to, h, config); dt -= h; }
    if (springSettled(s, to, precision)) { onUpdate(to); live = false; onRest?.(); return; }
    onUpdate(s.x);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => { live = false; cancelAnimationFrame(raf); };
}
