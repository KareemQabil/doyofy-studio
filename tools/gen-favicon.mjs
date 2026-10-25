// Favicon + touch icon from the official Doyofy logomark (src/ui/brand.tsx MARK paths): gold mark on charcoal.
//   node tools/gen-favicon.mjs → public/assets/brand/favicon.svg, public/assets/brand/touch-icon-180.png
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, need, chromiumPath } from './lib.mjs';
const brand = fs.readFileSync(path.join(ROOT, 'src/ui/brand.tsx'), 'utf8');
const MARK = JSON.parse(brand.match(/const MARK = (\[.*?\]);/s)[1].replace(/'/g, '"'));
const s = 0.17;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#262626"/><g transform="translate(${(32 - 187.5 * s / 2).toFixed(2)} ${(32 - 260.4 * s / 2).toFixed(2)}) scale(${s}) translate(-548.53 -404.81)" fill="#C7A661">${MARK.map((d) => `<path d="${d}"/>`).join('')}</g></svg>`;
fs.writeFileSync(path.join(ROOT, 'public/assets/brand/favicon.svg'), svg);
const { chromium } = need('playwright');
const b = await chromium.launch({ executablePath: chromiumPath() });
const p = await b.newPage({ viewport: { width: 180, height: 180 } });
await p.setContent(`<body style="margin:0">${svg.replace('<svg ', '<svg width="180" height="180" ')}</body>`);
await p.screenshot({ path: path.join(ROOT, 'public/assets/brand/touch-icon-180.png'), omitBackground: true });
await b.close(); console.log('ok');
