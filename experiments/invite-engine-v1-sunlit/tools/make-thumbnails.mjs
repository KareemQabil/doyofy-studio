// Renders every registered card through the real engine and writes, per pack:
//   assets/cards/<id>/thumbnail.webp  (Studio / catalogue preview)
//   assets/cards/<id>/meta.json       (HTML template packs; layered packs keep their own)
// and regenerates assets/cards/index.json (the runtime manifest).
import fs from 'node:fs';
import path from 'node:path';
import { need, ROOT, ensureDir, chromiumPath, pub } from './lib.mjs';
import { startServer } from './serve.mjs';

const { chromium } = need('playwright');
const sharp = need('sharp');

const port = 5231;
const server = await startServer(port);
const browser = await chromium.launch({ executablePath: chromiumPath() });
const page = await browser.newPage({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 1 });
await page.goto(`http://localhost:${port}/`);
await page.waitForFunction(() => window.__engine?.m);
const cards = await page.evaluate(async () => {
  const E = window.__engine;
  const list = [];
  const reg = E.compat.reg.card;
  for (const def of reg.list()) list.push({ id: def.id, title: def.meta.title, tags: def.tags, source: def.source, pack: def.meta.pack?.id || def.id, compat: def.compat });
  return list;
});

const index = { version: 1, generated: new Date().toISOString(), packs: [] };
for (const c of cards) {
  await page.evaluate(async (id) => {
    const E = window.__engine;
    await E.load({ ...E.getConfig(), card: { template: id }, flow: ['hero'], fx: { pack: 'none' } });
    document.querySelector('.studio')?.remove();
  }, c.id);
  await page.waitForTimeout(900);
  const info = await page.evaluate(() => {
    const E = window.__engine; const m = E.m; const card = m.card;
    const r = m.stage.card.anchor.getBoundingClientRect();
    return { rect: { x: r.x, y: r.y, width: r.width, height: r.height }, palette: card.palette, design: card.design, fonts: card.fontFaces?.map((f) => f.family) };
  });
  const dir = ensureDir(pub('cards', c.pack));
  const png = await page.screenshot({ clip: info.rect });
  await sharp(png).resize({ width: 360 }).webp({ quality: 82 }).toFile(path.join(dir, 'thumbnail.webp'));
  if (c.source === 'html') {
    const meta = {
      id: c.id, template: c.id, title: c.title, source: 'html', category: 'html-template',
      tags: c.tags, compat: c.compat, colorPalette: info.palette,
      recommendedScenes: [], recommendedMotion: [], recommendedAudio: [],
      aspectRatio: +(info.design.w / info.design.h).toFixed(6), designSize: [info.design.w, info.design.h],
      supportedLanguages: ['ar', 'en'], rtlSupport: true, fonts: info.fonts, thumbnail: 'thumbnail.webp',
    };
    fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');
  }
  index.packs.push({ id: c.pack, template: c.id, source: c.source, title: c.title, thumbnail: `cards/${c.pack}/thumbnail.webp` });
  console.log('  thumb', c.pack);
}
// recommendations for template packs, computed with the engine's own compatibility scorer
const recs = await page.evaluate(() => {
  const E = window.__engine; const out = {};
  for (const card of E.compat.reg.card.list()) {
    const base = { card: card.id };
    const top = (slot, n) => E.compat.rank(slot, base).slice(0, n).map((r) => r.id);
    out[card.id] = { scene: top('scene', 3), motion: top('motion', 2), audio: top('audio', 2) };
  }
  return out;
});
for (const p of index.packs.filter((x) => x.source === 'html')) {
  const f = pub('cards', p.id, 'meta.json');
  const meta = JSON.parse(fs.readFileSync(f, 'utf8'));
  Object.assign(meta, { recommendedScenes: recs[p.template].scene, recommendedMotion: recs[p.template].motion, recommendedAudio: recs[p.template].audio });
  fs.writeFileSync(f, JSON.stringify(meta, null, 2) + '\n');
}
fs.writeFileSync(pub('cards', 'index.json'), JSON.stringify(index, null, 2) + '\n');
console.log(`[thumbs] ${index.packs.length} packs → assets/cards/index.json`);
await browser.close(); server.close();
