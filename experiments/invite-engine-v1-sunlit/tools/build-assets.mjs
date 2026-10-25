// Asset authoring pipeline: procedural SVG + texture masters → optimised, responsive WebP.
// Output lands in public/assets/** following the pack conventions described in README.md.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { need, ROOT, ensureDir, pub } from './lib.mjs';
import { oliveBranch, oliveCluster, pampasVase, cardFrame } from './botanicals.mjs';

const sharp = need('sharp');
const TEX = path.join(ROOT, 'tools', '.build', 'textures');

if (!fs.existsSync(path.join(TEX, 'plaster.png'))) {
  console.log('[assets] generating texture masters…');
  execFileSync('python3', [path.join(ROOT, 'tools', 'make-textures.py')], { stdio: 'inherit' });
}

const inner = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

async function webp(input, out, { width, quality = 82, blur, alpha = true } = {}) {
  ensureDir(path.dirname(out));
  let img = sharp(typeof input === 'string' && input.trim().startsWith('<svg') ? Buffer.from(input) : input, { density: 144 });
  if (width) img = img.resize({ width, withoutEnlargement: false });
  if (blur) img = img.blur(blur);
  await img.webp({ quality, alphaQuality: alpha ? 90 : 100, effort: 5 }).toFile(out);
  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log('  →', path.relative(ROOT, out), `${kb}KB`);
}

async function responsive(src, outBase, widths, opts = {}) {
  for (const w of widths) await webp(src, `${outBase}-${w}.webp`, { ...opts, width: w });
}

async function main() {
  console.log('[assets] textures');
  await responsive(path.join(TEX, 'plaster.png'), pub('textures', 'plaster'), [1000, 2000], { quality: 78 });
  await responsive(path.join(TEX, 'sandstone.png'), pub('textures', 'sandstone'), [600, 1200], { quality: 78 });
  await responsive(path.join(TEX, 'linen.png'), pub('textures', 'linen'), [800, 1600], { quality: 80 });
  await responsive(path.join(TEX, 'paper-cotton.png'), pub('textures', 'paper-cotton'), [700, 1400], { quality: 84 });
  await responsive(path.join(TEX, 'gallery-wall.png'), pub('textures', 'gallery-wall'), [600, 1200], { quality: 78 });
  await webp(path.join(TEX, 'grain.png'), pub('textures', 'grain.webp'), { quality: 55, width: 256 });

  console.log('[assets] sunlit scene botanicals');
  const fg1 = oliveCluster({ w: 1400, h: 1100, seed: 11, anchor: [1390, 1090], arms: [[140, 160], [420, 40], [60, 620]], leafLen: 170, leafW: 24 });
  await responsive(fg1, pub('scenes', 'sunlit', 'olive-fg-01'), [700, 1400]);
  await webp(fg1, pub('scenes', 'sunlit', 'olive-fg-01-soft.webp'), { width: 900, blur: 7, quality: 70 });
  const fg2 = oliveCluster({ w: 1200, h: 1200, seed: 23, anchor: [20, 1190], arms: [[1080, 200], [700, 40], [1150, 760]], leafLen: 160, leafW: 23 });
  await responsive(fg2, pub('scenes', 'sunlit', 'olive-fg-02'), [600, 1200]);
  await webp(fg2, pub('scenes', 'sunlit', 'olive-fg-02-soft.webp'), { width: 800, blur: 9, quality: 70 });
  await responsive(pampasVase({ w: 520, h: 900 }), pub('scenes', 'sunlit', 'pampas-vase'), [320, 640]);

  console.log('[assets] card pack: arabic-botanical-01');
  const pack = (...p) => pub('cards', 'arabic-botanical-01', ...p);
  await responsive(path.join(TEX, 'paper-cotton.png'), pack('front'), [600, 1200], { quality: 86 });
  fs.writeFileSync(pack('frame.svg'), cardFrame({ ink: '#5B5E45' }));
  // top ornament: a light laurel of two mirrored engraved olive sprigs
  const sprigL = oliveBranch({ w: 900, h: 300, seed: 31, base: [450, 270], tip: [70, 70], bend: -0.18, leaves: 14, leafLen: 62, leafW: 10, fruits: 1, twigs: 0, style: 'engraving' });
  const sprigR = oliveBranch({ w: 900, h: 300, seed: 37, base: [450, 270], tip: [70, 70], bend: -0.18, leaves: 14, leafLen: 62, leafW: 10, fruits: 1, twigs: 0, style: 'engraving' });
  const laurel = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="300" viewBox="0 0 900 300"><g>${inner(sprigL)}</g><g transform="translate(900 0) scale(-1 1)">${inner(sprigR)}</g></svg>`;
  await webp(laurel, pack('ornament-01.webp'), { width: 900 });
  const sprig = oliveBranch({ w: 600, h: 420, seed: 41, base: [570, 400], tip: [60, 60], bend: 0.2, leaves: 16, leafLen: 70, leafW: 11, fruits: 2, twigs: 1, style: 'engraving' });
  await webp(sprig, pack('ornament-02.webp'), { width: 600 });
  // decor that settles around the card (painted, natural)
  const d1 = oliveCluster({ w: 900, h: 900, seed: 53, anchor: [890, 890], arms: [[90, 140], [420, 30]], leafLen: 120, leafW: 17 });
  await responsive(d1, pack('decor-01'), [450, 900]);
  const d2 = oliveBranch({ w: 800, h: 700, seed: 61, base: [20, 680], tip: [760, 90], bend: -0.2, leaves: 22, leafLen: 100, leafW: 15, fruits: 2, twigs: 1 });
  await responsive(d2, pack('decor-02'), [400, 800]);

  console.log('[assets] done');
}
main().catch((e) => { console.error(e); process.exit(1); });
