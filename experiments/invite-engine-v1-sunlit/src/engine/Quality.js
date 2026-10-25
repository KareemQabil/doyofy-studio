/**
 * Device + preference profile used by every layer to scale cost:
 *   level: 'high' | 'medium' | 'low', dprCap, isTouch, isMobile, reducedMotion, saveData
 */
export function detectQuality(overrides = {}) {
  const mq = (q) => typeof matchMedia === 'function' && matchMedia(q).matches;
  const isTouch = mq('(pointer: coarse)');
  const w = Math.min(window.innerWidth, window.screen?.width || window.innerWidth);
  const isMobile = isTouch || w < 760;
  const mem = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const saveData = !!navigator.connection?.saveData;
  let level = 'high';
  if (isMobile || mem <= 4 || cores <= 4) level = 'medium';
  if (saveData || mem <= 2 || cores <= 2) level = 'low';
  const clean = Object.fromEntries(Object.entries(overrides).filter(([k, v]) => v != null && !(k === 'level' && v === 'auto')));
  const q = { level, isTouch, isMobile, saveData, reducedMotion: mq('(prefers-reduced-motion: reduce)'), ...clean };
  q.dprCap = clean.dprCap ?? (q.level === 'high' ? 2 : q.level === 'medium' ? 1.75 : 1.25);
  q.fxScale = q.level === 'high' ? 1 : q.level === 'medium' ? 0.7 : 0.4;
  return q;
}
