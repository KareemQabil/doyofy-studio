// Generates the «توقيع» theme thumbnail (ThemePicker / design-directions) from brand geometry only:
// the mixed direction's three fields (A red · C ivory · B charcoal), the official pattern bloom, the logomark,
// and flat silhouettes of the three real signature card faces. No raster, no generated imagery.
//   node tools/gen-signature-world.mjs   → public/assets/directions/signature-world.svg (+ design-source copy)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';
const brand = fs.readFileSync(path.join(ROOT, 'src/ui/brand.tsx'), 'utf8');
const MARK = JSON.parse(brand.match(/const MARK = (\[.*?\]);/s)[1].replace(/'/g, '"'));
const bloom = fs.readFileSync(path.join(ROOT, 'public/assets/brand/motif-bloom.svg'), 'utf8').match(/<path[\s\S]*?\/>/g).join('');
const mark = (x, y, s, fill) => `<g transform="translate(${x} ${y}) scale(${s}) translate(-548 -404)" fill="${fill}">${MARK.map((d) => `<path d="${d}"/>`).join('')}</g>`;
const face = (x, y, r, band, disc, ring) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect width="150" height="210" rx="4" fill="#FFFDF8"/><rect width="150" height="${band}" fill="${ring}"/><rect x="6" y="6" width="138" height="198" rx="2" fill="none" stroke="#C7A661" stroke-width="1"/><circle cx="75" cy="${band}" r="15" fill="${disc}"/><rect x="40" y="${band + 34}" width="70" height="9" rx="4.5" fill="#262626"/><rect x="52" y="${band + 52}" width="46" height="5" rx="2.5" fill="#262626" opacity=".35"/><rect x="28" y="${band + 72}" width="94" height="1" fill="#C7A661"/><rect x="48" y="${band + 84}" width="54" height="4" rx="2" fill="#262626" opacity=".3"/><rect x="56" y="${band + 94}" width="38" height="4" rx="2" fill="#262626" opacity=".3"/></g>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><title>توقيع</title>
<defs>
<radialGradient id="mr1" cx=".88" cy=".08" r=".7"><stop offset="0" stop-color="#D46A66"/><stop offset="1" stop-color="#BC4749" stop-opacity="0"/></radialGradient>
<radialGradient id="mr2" cx=".2" cy=".95" r=".7"><stop offset="0" stop-color="#8F3034"/><stop offset="1" stop-color="#BC4749" stop-opacity="0"/></radialGradient>
<radialGradient id="mr3" cx=".18" cy=".2" r=".5"><stop offset="0" stop-color="#C7A661" stop-opacity=".4"/><stop offset="1" stop-color="#C7A661" stop-opacity="0"/></radialGradient>
<radialGradient id="mn1" cx=".85" cy="0" r=".7"><stop offset="0" stop-color="#C7A661" stop-opacity=".32"/><stop offset="1" stop-color="#1E1E1E" stop-opacity="0"/></radialGradient>
<radialGradient id="mn2" cx=".1" cy=".95" r=".6"><stop offset="0" stop-color="#2EB7B7" stop-opacity=".16"/><stop offset="1" stop-color="#1E1E1E" stop-opacity="0"/></radialGradient>
<filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="14" stdDeviation="12" flood-color="#000" flood-opacity=".32"/></filter>
<clipPath id="cr"><rect x="0" y="0" width="800" height="330"/></clipPath>
</defs>
<rect width="800" height="600" fill="#FFFFFF"/>
<g clip-path="url(#cr)"><rect width="800" height="330" fill="#BC4749"/><rect width="800" height="330" fill="url(#mr1)"/><rect width="800" height="330" fill="url(#mr2)"/><rect width="800" height="330" fill="url(#mr3)"/>
<g transform="translate(560 -40) scale(.62)" fill="#F2EAD9" opacity=".14">${bloom.replace(/fill="[^"]*"/g, '')}</g></g>
<rect x="0" y="330" width="420" height="270" fill="#1E1E1E"/><rect x="0" y="330" width="420" height="270" fill="url(#mn1)"/><rect x="0" y="330" width="420" height="270" fill="url(#mn2)"/>
<circle cx="120" cy="465" r="58" fill="#C7A661"/><circle cx="120" cy="465" r="50" fill="none" stroke="#1E1E1E" stroke-width="1.5"/>${mark(120 - 28, 465 - 39, 0.3, '#1E1E1E')}
<rect x="450" y="372" width="300" height="2" fill="#262626"/><rect x="450" y="400" width="210" height="16" rx="8" fill="#262626"/><rect x="450" y="430" width="150" height="10" rx="5" fill="#262626" opacity=".35"/>
<rect x="450" y="470" width="88" height="88" rx="6" fill="#2EB7B7"/><rect x="548" y="470" width="88" height="88" rx="6" fill="#C7A661"/><rect x="646" y="470" width="88" height="88" rx="6" fill="#F2EAD9"/>
<g filter="url(#sh)">${face(250, 70, -9, 64, '#C7A661', '#262626')}${face(470, 60, 7, 48, '#FFFDF8', '#BC4749')}${face(360, 40, -1, 56, '#C7A661', '#262626')}</g>
</svg>`;
fs.writeFileSync(path.join(ROOT, 'public/assets/directions/signature-world.svg'), svg);
fs.writeFileSync(path.join(ROOT, 'design-source/signature/signature-world.svg'), svg);
console.log('ok', svg.length);
