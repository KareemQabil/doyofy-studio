/**
 * Demo entry: registers every module library, boots the engine with the flagship preset
 * (or the preset named in the URL hash, e.g. #candlelit-wine-crest) and mounts the Studio.
 */
import './cards/index.js';
import './scenes/index.js';
import './reveals/index.js';
import './motions/index.js';
import './interactions/index.js';
import './camera/index.js';
import './fx/index.js';
import './audio/index.js';
import './finales/index.js';
import './pages/index.js';
import './presets/index.js';
import { loadCardManifest } from './cards/index.js';
import { ExperienceEngine } from './engine/ExperienceEngine.js';
import { PresetRegistry } from './engine/registries.js';
import { Studio } from './studio/Studio.js';

async function boot() {
  const app = document.getElementById('app');
  const stage = app.querySelector('.app-stage');
  // Fonts: local files when `npm run fonts:localize` has been run, otherwise Google Fonts as an
  // enhancement (the bundled Arabic face always renders, so text is never missing).
  let fontManifest = null;
  if (typeof __LOCAL_FONTS__ !== 'undefined' && __LOCAL_FONTS__) {
    fontManifest = await fetch('assets/fonts/manifest.json').then((r) => r.json()).catch(() => null);
  }
  const engine = new ExperienceEngine(stage, { rsvp: { type: 'local' }, assetBase: 'assets/', remoteFonts: !fontManifest, fontManifest });
  await loadCardManifest(engine.assets);
  const fromHash = decodeURIComponent(location.hash.slice(1));
  const preset = PresetRegistry.has(fromHash) ? fromHash : 'sunlit-architectural-botanical';
  await engine.load({ preset });
  new Studio(engine, app);
  window.__engine = engine; // handy for debugging and the e2e tests
  window.addEventListener('hashchange', () => { const p = decodeURIComponent(location.hash.slice(1)); if (PresetRegistry.has(p)) engine.load({ preset: p }); });
}

boot().catch((e) => console.error('[boot]', e));
