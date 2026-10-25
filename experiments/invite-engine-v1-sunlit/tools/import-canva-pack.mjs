#!/usr/bin/env node
/**
 * Canva → card pack importer.
 *
 *   node tools/import-canva-pack.mjs <exportFolder> <pack-id> [--title "..."] [--tags a,b,c]
 *
 * <exportFolder> holds files exported from Canva (PNG/JPG/WebP/SVG). Name the files after
 * their role — the importer maps them by prefix:
 *   front.*          card front artwork (flattened) or paper background
 *   inside-01.*      inside pages (multi-page invitations)
 *   back.*           card back
 *   frame.svg        recolourable frame (used as a mask, tinted with the palette)
 *   ornament-*.png   transparent ornaments placed on the card
 *   decor-*.png      transparent pieces that settle *around* the card
 *   overlay.*        texture overlay (multiplied)
 *   mask.svg         optional clip mask
 *
 * Output: public/assets/cards/<pack-id>/ with responsive WebP variants (…-600/-1200.webp),
 * a meta.json scaffold (edit boxes/animation, then reload — no code changes) and an entry
 * in cards/index.json so the engine registers it at runtime.
 *
 * Production rule: never reference live Canva URLs. Everything is copied locally here.
 */
import fs from 'node:fs';
import path from 'node:path';
import { need, pub, ensureDir } from './lib.mjs';

const sharp = need('sharp');
const [src, id, ...rest] = process.argv.slice(2);
if (!src || !id) { console.error('usage: import-canva-pack <exportFolder> <pack-id> [--title "…"] [--tags a,b]'); process.exit(1); }
const arg = (k) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : null; };
const out = ensureDir(pub('cards', id));
const files = fs.readdirSync(src).filter((f) => /\.(png|jpe?g|webp|svg)$/i.test(f));
const role = (f) => f.replace(/\.[^.]+$/, '').toLowerCase();
const written = {};

async function variants(file, base, widths) {
  const img = sharp(path.join(src, file));
  const { width } = await img.metadata();
  for (const w of widths) {
    await sharp(path.join(src, file)).resize({ width: Math.min(w, width) }).webp({ quality: 84, alphaQuality: 90 }).toFile(path.join(out, `${base}-${w}.webp`));
  }
  return { base, widths };
}

for (const f of files) {
  const r = role(f);
  if (f.endsWith('.svg')) { fs.copyFileSync(path.join(src, f), path.join(out, `${r}.svg`)); written[r] = `${r}.svg`; continue; }
  if (/^(front|back|inside-\d+|overlay)$/.test(r)) written[r] = await variants(f, r, [600, 1200]);
  else if (/^(ornament|decor)-/.test(r)) written[r] = await variants(f, r, [400, 800]);
  console.log('  ✓', f, '→', r);
}

const firstThumb = written.front ? `${written.front.base}-600.webp` : null;
if (firstThumb) await sharp(path.join(out, firstThumb)).resize({ width: 360 }).webp({ quality: 82 }).toFile(path.join(out, 'thumbnail.webp'));

const ornaments = Object.keys(written).filter((k) => k.startsWith('ornament-'));
const decor = Object.keys(written).filter((k) => k.startsWith('decor-'));
const metaPath = path.join(out, 'meta.json');
const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : {
  id, template: id.replace(/-/g, '_'), title: arg('--title') || id, category: 'canva', description: 'Imported from Canva.',
  tags: (arg('--tags') || 'arabic,light').split(','), compat: { prefer: [], avoid: [] },
  colorPalette: { paper: '#F6F1E8', ink: '#2E2A24', muted: '#6B6158', accent: '#8C7A62', accentText: '#6B5A44', frame: '#6B5A44', env: '#6B5A44' },
  variants: {}, recommendedScenes: [], recommendedMotion: [], recommendedAudio: [],
  aspectRatio: 0.7142857, designSize: [500, 700], supportedLanguages: ['ar', 'en'], rtlSupport: true,
  fontSet: 'editorial', tone: 'light', sheetTexture: 'textures/paper-cotton-1400.webp', thumbnail: 'thumbnail.webp',
  faces: {
    front: {
      background: written.front ? { base: 'front', widths: [600, 1200] } : undefined,
      layers: [
        ...(written.frame ? [{ id: 'frame', type: 'mask', src: 'frame.svg', color: 'frame', box: [0, 0, 100, 100] }] : []),
        ...ornaments.map((k, i) => ({ id: k, src: `${k}-800.webp`, box: [20, 6 + i * 70, 60, null], enter: { from: { opacity: 0, y: -8 }, to: { opacity: 1, y: 0 }, duration: 1.3, delay: i * 0.15 } })),
      ],
      // Canva exports with baked-in text: set "text": null. For live, translatable text keep a layout name.
      text: 'botanical-editorial',
    },
    back: written.back ? { background: { base: 'back', widths: [600, 1200] } } : undefined,
    inside: Object.keys(written).filter((k) => k.startsWith('inside-')).map((k) => ({ background: { base: k, widths: [600, 1200] } })),
  },
  decor: decor.map((k, i) => ({ id: k, src: { base: k, widths: [400, 800] }, place: i % 2 ? 'front' : 'back', box: i % 2 ? [64, 70, 56, 50] : [-40, -20, 78, 78],
    enter: { from: { opacity: 0, x: i % 2 ? 30 : -30, y: i % 2 ? 24 : -24 }, to: { opacity: 1, x: 0, y: 0 }, duration: 1.6, delay: 0.1 + i * 0.2 } })),
};
fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n');

const idxPath = pub('cards', 'index.json');
const index = fs.existsSync(idxPath) ? JSON.parse(fs.readFileSync(idxPath, 'utf8')) : { version: 1, packs: [] };
index.packs = index.packs.filter((p) => p.id !== id);
index.packs.push({ id, template: meta.template, source: 'layered', title: meta.title, thumbnail: `cards/${id}/thumbnail.webp` });
fs.writeFileSync(idxPath, JSON.stringify(index, null, 2) + '\n');
console.log(`[canva] pack "${id}" ready → public/assets/cards/${id}/ (edit meta.json to place layers)`);
