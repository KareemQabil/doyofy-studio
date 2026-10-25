/**
 * Card registration.
 *  - Built-in layered pack (flagship) is bundled from its meta.json.
 *  - HTML templates register from templates.js.
 *  - Extra packs dropped into assets/cards/ are discovered at runtime from
 *    assets/cards/index.json (see loadCardManifest) — no code change needed.
 */
import { CardRegistry } from '../engine/registries.js';
import { registerLayeredPack } from './layered.js';
import flagship from '../../public/assets/cards/arabic-botanical-01/meta.json';
import './templates.js';

registerLayeredPack(flagship);

export async function loadCardManifest(assets) {
  try {
    const index = await assets.json('cards/index.json');
    for (const entry of index.packs || []) {
      if (entry.source !== 'layered' || CardRegistry.has(entry.template || entry.id)) continue;
      const meta = await assets.json(`cards/${entry.id}/meta.json`);
      registerLayeredPack(meta);
    }
  } catch (e) { console.warn('[cards] no runtime manifest', e.message); }
}
