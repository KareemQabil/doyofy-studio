/**
 * Invitation faces — one family, «الطقم»: every face is 300×420 DOM + inline SVG with live text,
 * id-free (faces repeat on a page) and without external resources beyond its own small WebP layers.
 *   collection.js   the thirteen Designer Kit faces, one per occasion
 * Each face registers itself in CardRegistry; nothing here binds a face to a scene.
 */
import './collection.js';

/** shown when a saved invitation names a face that no longer exists */
export const FALLBACK_CARD = 'kit-rose-garden';
