// Registers cards, scenes, pages, audio and modules exactly like the standalone Studio entry.
import '../../cards/index.js';
import '../../scenes/index.js';
import '../../pages/index.js';
import '../../audio/index.js';
import '../../modules.js';
import { CardRegistry, SceneRegistry } from '../../engine/registries.js';
import { deriveContent } from '../../data/derive.js';
import { SCENES, SCENE_DEFS, SCENE_ROOT } from '../../scenes/css/generated.js';
import { SCENE_VALS } from '../../scenes/css/vals.js';

export { Studio } from '../../studio/Studio.js';
import { FALLBACK_CARD } from '../../cards/index.js';

/** static card face markup (300×420) with the given invitation content */
export function cardFaceHtml(cardId: string, invitation: unknown): string {
  ensureCardDefs();
  const card = CardRegistry.has(cardId) ? CardRegistry.get(cardId) : CardRegistry.get(FALLBACK_CARD);
  return card.render(deriveContent(invitation).c);
}

/**
 * Card/scene SVG <defs> for static thumbnails. A mounted Studio carries its own copy; two copies would
 * duplicate ids, so the shared holder steps aside while a Studio is on the page and returns after it.
 */
let defsWanted = false;
let defsObserver: MutationObserver | null = null;
function syncDefs() {
  const studioDefs = document.querySelector('.host .cf-defs');
  const holder = document.getElementById('dy-card-defs');
  if (studioDefs && holder) holder.remove();
  else if (!studioDefs && !holder && defsWanted) {
    const h = document.createElement('div');
    h.id = 'dy-card-defs';
    h.setAttribute('aria-hidden', 'true');
    h.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    h.innerHTML = SCENE_DEFS;
    document.body.appendChild(h);
  }
}
export function ensureCardDefs() {
  defsWanted = true;
  syncDefs();
  if (!defsObserver) {
    defsObserver = new MutationObserver(syncDefs);
    defsObserver.observe(document.body, { childList: true, subtree: true });
  }
}

export function cardIds(): string[] { return CardRegistry.list().map((c) => c.id); }
export function sceneHas3D(sceneId: string): boolean {
  return SceneRegistry.has(sceneId) && SceneRegistry.get(sceneId).renderers.some((r) => r.mode === 'three');
}

/** a 2D setting (390×844 phone stage) as static markup — the gallery lays the card on it */
export function sceneArtHtml(sceneId: string): string {
  ensureCardDefs();
  const render = (SCENES as Record<string, (v: unknown) => string>)[sceneId] ?? (SCENES as Record<string, (v: unknown) => string>).marble!;
  return `<div ${SCENE_ROOT}>${render(SCENE_VALS)}</div>`;
}
