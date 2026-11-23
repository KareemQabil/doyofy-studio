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

/** static card face markup (300×420) with the given invitation content, in the face's own number system */
export function cardFaceHtml(cardId: string, invitation: unknown): string {
  const card = CardRegistry.has(cardId) ? CardRegistry.get(cardId) : CardRegistry.get(FALLBACK_CARD);
  return card.render(deriveContent(invitation, { digits: card.digits }).c);
}

/**
 * The lines a card face prints for the event's names, its date and its place, in that face's number system — the
 * editor finds them on the drawn face to make each one a «tap to edit» target. Empty and one-letter strings are left out.
 */
export function cardFaceTexts(cardId: string, invitation: unknown): Record<'names' | 'date' | 'venue', string[]> {
  const card = CardRegistry.has(cardId) ? CardRegistry.get(cardId) : CardRegistry.get(FALLBACK_CARD);
  const c = deriveContent(invitation, { digits: card.digits }).c as Record<string, unknown>;
  const pick = (...keys: string[]) => [...new Set(keys.map((k) => String(c[k] ?? '').replace(/\s+/g, ' ').trim()).filter((s) => s.length > 1))];
  return {
    names: pick('arA', 'arB', 'enA', 'enB', 'enAU', 'enBU'),
    date: pick('dateAr', 'dayAr', 'dateNum', 'dateShort', 'timeAr', 'monthAr', 'yearAr', 'dateEn', 'dayEn', 'timeEn', 'dateEnU', 'dayEnU', 'monthEnU'),
    venue: pick('venueAr', 'cityAr', 'venueEn', 'venueEnU', 'cityEn', 'cityEnU'),
  };
}

export function cardIds(): string[] { return CardRegistry.list().map((c) => c.id); }
/** a 2D setting (390×844 phone stage) as static markup — the gallery lays the card on it */
export function sceneArtHtml(sceneId: string): string {
  return flatSceneHtml(sceneId);
}
