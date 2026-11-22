// dev review: every collection face with its own occasion, short / long / longest content → PNG + fit report.
//   node tests/dev/collection.mjs out.png   (needs a build: dist/styles.css and dist/assets)
import { distEntries } from '../../tools/dist-entries.mjs';
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import { pathToFileURL } from 'node:url';
import { need, chromiumPath, ROOT } from '../../tools/lib.mjs';
import { startServer } from '../../tools/serve.mjs';
const esbuild = need('esbuild'); const { chromium } = need('playwright');
const out = process.argv[2] || path.join(os.tmpdir(), 'collection.png');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'col-'));
const R = ROOT.split(path.sep).join('/');
fs.writeFileSync(path.join(tmp, 'e.ts'), `import '${R}/src/cards/index.js'; import { COLLECTION } from '${R}/src/cards/collection.js'; import { CardRegistry } from '${R}/src/engine/registries.js'; import { deriveContent } from '${R}/src/data/derive.js'; import { defaultDesign, toInvitationData } from '${R}/src/domain/invitation'; import { isCoupleEvent } from '${R}/src/domain/event';
const ev = (type, a, b, aEn, bEn, venue, city) => ({ id:'t', ownerId:'t', slug:'t', type, title:'', names:{ a, b, aEn, bEn }, date:'2027-06-20', time:'19:30', timeZone:'Asia/Riyadh', durationHours:3, venue:{ name:venue, city }, settings:{ defaultPartySize:2, revealTableToGuests:false, allowGeneralLink:true }, createdAt:'', updatedAt:'' });
export function sheet() {
  let html = '';
  for (const d of COLLECTION) {
    const couple = isCoupleEvent(d.type);
    const samples = couple
      ? [['short', ev(d.type, 'نورة', 'فيصل', 'Noura', 'Faisal', 'قاعة الياسمين', 'الرياض')], ['long', ev(d.type, 'نورة عبدالله الدوسري', 'فيصل محمد القحطاني', 'Noura', 'Faisal', 'قاعة الاحتفاء الكبرى', 'جدة')], ['longest', ev(d.type, 'عبد الرحمن بن عبد الله المحتفي بإنجازه', 'جود المحتفية بهذه المناسبة الجميلة', 'Abdulrahman', 'Joud', 'قاعة مركز الملك فهد الثقافي للمؤتمرات والاحتفالات', 'المدينة المنورة')]]
      : [['short', ev(d.type, 'جود', undefined, 'Joud', undefined, 'قاعة الياسمين', 'الرياض')], ['long', ev(d.type, 'عائلة عبدالله الدوسري', undefined, 'Al Dosari family', undefined, 'استراحة الريحان', 'جدة')], ['longest', ev(d.type, 'عبدالرحمن بن سلطان بن عبدالعزيز الشهراني', undefined, undefined, undefined, 'قاعة مركز الملك فهد الثقافي للمؤتمرات والاحتفالات', 'المدينة المنورة')]];
    html += '<h2>' + d.id + ' · ' + d.type + '</h2><div class="row">';
    for (const [label, e] of samples) html += '<figure><div class="face" data-id="' + d.id + ':' + label + '">' + CardRegistry.get(d.id).render(deriveContent(toInvitationData(e, defaultDesign(e))).c) + '</div><figcaption>' + label + '</figcaption></figure>';
    html += '</div>';
  }
  return html;
}`);
await esbuild.build({ entryPoints: [path.join(tmp, 'e.ts')], bundle: true, format: 'esm', platform: 'node', outfile: path.join(tmp, 'e.mjs'), logLevel: 'error' });
const { sheet } = await import(pathToFileURL(path.join(tmp, 'e.mjs')).href);
fs.writeFileSync(path.join(ROOT, 'dist', '_collection.html'), `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><base href="/"><link rel="stylesheet" href="/${distEntries().styles}"><script>window.fitReport=()=>[...document.querySelectorAll('.face')].map((f)=>{const inner=f.querySelector('.oc-inner'),box=f.getBoundingClientRect();const out=[...f.querySelectorAll('.oc-inner *')].filter((n)=>!n.closest('svg')&&[...n.childNodes].some((t)=>t.nodeType===3&&t.textContent.trim())).filter((n)=>{const r=n.getBoundingClientRect();return r.top<box.top-.5||r.bottom>box.bottom+.5||r.left<box.left-.5||r.right>box.right+.5}).length;return [f.dataset.id,inner.scrollHeight-inner.clientHeight,out,[...f.querySelectorAll('.oc-name')].map((n)=>parseFloat(n.style.fontSize)).join('/'),[...f.querySelectorAll('img')].filter((i)=>!i.naturalWidth).length].join(' ')}).join('
');</script><style>body{background:#e9e3d8;font-family:sans-serif;margin:16px}.grid{display:grid;grid-template-columns:repeat(2,auto);gap:4px 28px;justify-content:start}.row{display:flex;gap:12px}figure{margin:0}.face{width:300px;height:420px;box-shadow:0 6px 20px rgba(0,0,0,.2)}h2{font:600 13px sans-serif;margin:12px 0 6px;grid-column:span 1}figcaption{font-size:11px;text-align:center}</style></head><body>${sheet()}</body></html>`);
if (process.argv.includes('--html')) { console.log('wrote dist/_collection.html (open it on the dev server; run window.fitReport() for the fit check)'); process.exit(0); }
const server = await startServer(5395);
const browser = await chromium.launch({ executablePath: chromiumPath() });
const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });
await page.goto('http://localhost:5395/_collection.html'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(800);
// fit: content must not overflow the inner box, and no text may leave the 300×420 face
const report = await page.evaluate(() => [...document.querySelectorAll('.face')].map((f) => {
  const inner = f.querySelector('.oc-inner'); const box = f.getBoundingClientRect();
  const over = inner.scrollHeight - inner.clientHeight;
  const out = [...f.querySelectorAll('.oc-inner *')].filter((n) => !n.closest('svg') && n.childNodes.length && [...n.childNodes].some((t) => t.nodeType === 3 && t.textContent.trim())).filter((n) => { const r = n.getBoundingClientRect(); return r.top < box.top - 0.5 || r.bottom > box.bottom + 0.5 || r.left < box.left - 0.5 || r.right > box.right + 0.5; }).length;
  const names = [...f.querySelectorAll('.oc-name')].map((n) => parseFloat(n.style.fontSize));
  const broken = [...f.querySelectorAll('img')].filter((i) => !i.complete || !i.naturalWidth).length;
  // overlap: the glyph boxes of every two text runs on the face (line by line, via Range) never intersect
  const runs = []; const walk = document.createTreeWalker(f.querySelector('.oc-inner') ?? f, NodeFilter.SHOW_TEXT);
  for (let t = walk.nextNode(); t; t = walk.nextNode()) {
    if (!t.textContent.trim() || t.parentElement.closest('svg, style')) continue;
    const r = document.createRange(); r.selectNodeContents(t);
    // a run's box is its line box: a tall font's content area (Amiri's deep descent) is trimmed to the CSS line-height
    const lh = parseFloat(getComputedStyle(t.parentElement).lineHeight);
    for (const x of r.getClientRects()) {
      if (x.width <= 0.5 || x.height <= 0.5) continue;
      const cut = lh > 0 && x.height > lh ? (x.height - lh) / 2 : 0;
      runs.push({ t: t.textContent.trim().slice(0, 18), b: { left: x.left, right: x.right, top: x.top + cut, bottom: x.bottom - cut, height: x.height - 2 * cut } });
    }
  }
  const overlaps = [];
  for (let i = 0; i < runs.length; i++) for (let j = i + 1; j < runs.length; j++) {
    const a = runs[i].b, b = runs[j].b;
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    // line boxes of adjacent rows may share a hairline; real collisions overlap by more than 2px both ways
    if (w > 2 && h > Math.max(2, 0.3 * Math.min(a.height, b.height)) && !(Math.abs(a.top - b.top) < 1 && Math.abs(a.bottom - b.bottom) < 1 && (a.right <= b.left + 2 || b.right <= a.left + 2))) overlaps.push(`${runs[i].t}×${runs[j].t} (${Math.round(h)}px)`);
  }
  return { id: f.dataset.id, over, out, names, broken, overlaps };
}));
for (const r of report) console.log(`${r.over > 0 || r.out || r.broken || r.overlaps.length ? '✗' : '✓'} ${r.id.padEnd(30)} overflow ${r.over}px  outside ${r.out}  names ${r.names.join('/')}px${r.broken ? `  broken images ${r.broken}` : ''}${r.overlaps.length ? `  overlaps ${r.overlaps.join(' | ')}` : ''}`);
console.log(`faces ${report.length}, problems ${report.filter((r) => r.over > 0 || r.out || r.broken || r.overlaps.length).length}`);
await page.screenshot({ path: out, fullPage: true });
await browser.close(); server.close(); fs.rmSync(path.join(ROOT, 'dist', '_collection.html'));
console.log('sheet', out);
