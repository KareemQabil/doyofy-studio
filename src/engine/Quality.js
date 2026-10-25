/**
 * Quality tiers: high | balanced | low.  Override with ?quality=high|balanced|low.
 *   high      desktop-class GPU: full GLB set, HDRI env, soft shadows, DPR ≤ 2
 *   balanced  phones / integrated GPUs: lighter props, 1k env, one shadow caster, DPR ≤ 1.5
 *   low       save-data / ≤2 GB / ≤2 cores: minimal props, no shadows, DPR 1 (Three) — and the DOM
 *             renderer when WebGL is unavailable
 * Reduced motion (OS setting or ?motion=reduced) is independent of the tier.
 */
const ORDER = ['low', 'balanced', 'high'];
export const tierAtLeast = (q, min) => ORDER.indexOf(q) >= ORDER.indexOf(min || 'low');

export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    const ok = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return ok;
  } catch { return false; }
}

export function detectQuality(params = new URLSearchParams(location.search)) {
  const mq = (q) => typeof matchMedia === 'function' && matchMedia(q).matches;
  const touch = mq('(pointer: coarse)');
  const mem = navigator.deviceMemory || 4, cores = navigator.hardwareConcurrency || 4;
  const saveData = !!navigator.connection?.saveData;
  let tier = 'high';
  if (touch || Math.min(screen.width, screen.height) < 600 || mem <= 4) tier = 'balanced';
  if (saveData || mem <= 2 || cores <= 2) tier = 'low';
  const forced = params.get('quality');
  if (ORDER.includes(forced)) tier = forced;
  const webgl = params.get('renderer') === 'dom' ? false : hasWebGL();
  return {
    tier, webgl, touch, saveData,
    reducedMotion: params.get('motion') === 'reduced' || (params.get('motion') !== 'full' && mq('(prefers-reduced-motion: reduce)')),
    renderer: params.get('renderer') || 'auto', // auto | three | dom
    dprCap: { high: 2, balanced: 1.5, low: 1 }[tier],
  };
}
