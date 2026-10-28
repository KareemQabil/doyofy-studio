// Registers cards, scenes, pages, audio and modules exactly like the standalone Studio entry.
import '../../cards/index.js';
import '../../scenes/index.js';
import '../../pages/index.js';
import '../../audio/index.js';
import '../../modules.js';
import { CardRegistry } from '../../engine/registries.js';
import { deriveContent } from '../../data/derive.js';
import { flatSceneHtml } from '../../scenes/flat.js';

export { Studio } from '../../studio/Studio.js';
export { playCardMotion } from '../../cards/card-motion.js';
import { FALLBACK_CARD } from '../../cards/index.js';

/** static card face markup (300×420) with the given invitation content */
export function cardFaceHtml(cardId: string, invitation: unknown): string {
  const card = CardRegistry.has(cardId) ? CardRegistry.get(cardId) : CardRegistry.get(FALLBACK_CARD);
  return card.render(deriveContent(invitation).c);
}

export function cardIds(): string[] { return CardRegistry.list().map((c) => c.id); }
/** a 2D setting (390×844 phone stage) as static markup — the gallery lays the card on it */
export function sceneArtHtml(sceneId: string): string {
  return flatSceneHtml(sceneId);
}
