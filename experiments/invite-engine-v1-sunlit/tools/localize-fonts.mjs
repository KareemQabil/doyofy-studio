#!/usr/bin/env node
/**
 * Downloads every Google Fonts family the engine uses into public/assets/fonts/ and writes
 * public/assets/fonts/manifest.json. Pass the manifest to the engine to drop the CDN:
 *   new ExperienceEngine(host, { remoteFonts: false, fontManifest })
 * (main.js loads the manifest automatically when it exists.)
 * Requires network access to fonts.googleapis.com / fonts.gstatic.com.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pub, ensureDir } from './lib.mjs';

const FAMILIES = {
  'Aref Ruqaa': 'Aref+Ruqaa:wght@400;700', Amiri: 'Amiri:ital,wght@0,400;0,700;1,400', 'Reem Kufi': 'Reem+Kufi:wght@400;500;600',
  'IBM Plex Sans Arabic': 'IBM+Plex+Sans+Arabic:wght@300;400;500', 'Cormorant Garamond': 'Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500',
  'Bodoni Moda': 'Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400', 'Great Vibes': 'Great+Vibes', 'IBM Plex Sans': 'IBM+Plex+Sans:wght@300;400;500',
};
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const dir = ensureDir(pub('fonts'));
const manifest = {};
let css = '';
for (const [family, q] of Object.entries(FAMILIES)) {
  const res = await fetch(`https://fonts.googleapis.com/css2?family=${q}&display=swap`, { headers: { 'User-Agent': UA } });
  if (!res.ok) { console.error('  ✗', family, res.status); continue; }
  let text = await res.text();
  const urls = [...text.matchAll(/url\((https:[^)]+\.woff2)\)/g)].map((m) => m[1]);
  for (const [i, u] of urls.entries()) {
    const file = `${family.replace(/\s+/g, '-')}-${i}.woff2`;
    fs.writeFileSync(path.join(dir, file), Buffer.from(await (await fetch(u)).arrayBuffer()));
    text = text.replace(u, `fonts/${file}`);
  }
  css += text + '\n';
  manifest[family] = `fonts/${family.replace(/\s+/g, '-')}-0.woff2`;
  console.log('  ✓', family, urls.length, 'files');
}
fs.writeFileSync(path.join(dir, 'fonts.css'), css);
fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({ css: 'fonts/fonts.css', families: manifest }, null, 2));
console.log('[fonts] localized → public/assets/fonts/ (fonts.css + manifest.json)');
