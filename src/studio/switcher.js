/**
 * Card / scene switcher — the canonical bottom sheet (10 cards × 10 scenes = 100 combinations).
 * Compatibility is metadata-driven: scenes the current card recommends (and vice versa) get a small
 * ✦ marker; nothing is hidden, every combination stays reachable.
 */
const e = (v) => String(v ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

export function compatScore(card, scene) {
  let s = 0;
  if (card.compat.recommended.includes(scene.id)) s += 2;
  if (scene.compat.recommended?.includes(card.id)) s += 2;
  if (card.compat.incompatible?.includes(scene.id) || scene.compat.incompatible?.includes(card.id)) s -= 4;
  if (card.tone === scene.tone && card.tone === 'light') s -= 0.5; // pale card on pale scene: lower contrast
  return s;
}

export function renderSwitcher({ cards, scenes, cardId, sceneId, debug }) {
  const card = cards.find((c) => c.id === cardId);
  const scene = scenes.find((s) => s.id === sceneId);
  const chip = (k, on, attr, mark) => `<button type="button" class="st-chip ${on ? 'on' : ''}" ${attr}="${k.id}" aria-pressed="${on}"><span class="st-sw" style="background: ${k.swatch}"></span>${e(k.name)}${mark ? '<span class="st-rec" title="Recommended pairing" aria-label="recommended">✦</span>' : ''}</button>`;
  return `<div class="st-switch" dir="ltr" role="dialog" aria-label="Choose card and scene">
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 16px 6px">
      <span style="font-size: 12px; letter-spacing: 0.3em; color: #E3C58C">CARD DESIGN</span>
      <button type="button" class="st-icon" data-act="switcher" aria-label="Close chooser" style="width: 44px; height: 44px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg></button>
    </div>
    <div class="st-chiprow">${cards.map((k) => chip(k, k.id === cardId, 'data-pick-card', compatScore(k, scene) >= 2)).join('')}</div>
    <div style="padding: 10px 16px 6px"><span style="font-size: 12px; letter-spacing: 0.3em; color: #E3C58C">3D SCENE</span></div>
    <div class="st-chiprow">${scenes.map((k) => chip(k, k.id === sceneId, 'data-pick-scene', compatScore(card, k) >= 2)).join('')}</div>
    ${debug ? `<div class="st-author" dir="ltr">renderer: <b>${e(debug.sceneRenderer)}</b>${debug.sceneErrors.length ? ' · fallbacks: ' + e(debug.sceneErrors.join('; ')) : ''}</div>` : ''}
  </div>`;
}
