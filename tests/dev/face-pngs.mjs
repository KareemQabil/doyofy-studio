// dev: render individual card faces to PNG (for direction boards). node tests/dev/face-pngs.mjs outdir id:type:a[:b] ...
import { distEntries } from '../../tools/dist-entries.mjs';
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { need, chromiumPath, ROOT } from '../../tools/lib.mjs';
import { startServer } from '../../tools/serve.mjs';
const esbuild = need('esbuild'); const { chromium } = need('playwright');
const [out, ...specs] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fp-'));
fs.writeFileSync(path.join(tmp, 'e.ts'), `import '${ROOT}/src/cards/index.js'; import { CardRegistry } from '${ROOT}/src/engine/registries.js'; import { deriveContent } from '${ROOT}/src/data/derive.js'; import { defaultDesign, toInvitationData } from '${ROOT}/src/domain/invitation';
export function face(id, type, a, b){ const e={id:'t',ownerId:'t',slug:'t',type,title:'',names:{a,b},date:'2027-06-20',time:'20:00',timeZone:'Asia/Riyadh',durationHours:3,venue:{name:'قاعة الياسمين',city:'الرياض'},settings:{defaultPartySize:2,revealTableToGuests:false,allowGeneralLink:true},createdAt:'',updatedAt:''}; return CardRegistry.get(id).render(deriveContent(toInvitationData(e, defaultDesign(e))).c); }`);
await esbuild.build({ entryPoints: [path.join(tmp, 'e.ts')], bundle: true, format: 'esm', platform: 'node', outfile: path.join(tmp, 'e.mjs'), logLevel: 'error' });
const { face } = await import(path.join(tmp, 'e.mjs'));
const server = await startServer(5394);
const browser = await chromium.launch({ executablePath: chromiumPath() });
const page = await browser.newPage({ viewport: { width: 300, height: 420 }, deviceScaleFactor: 2 });
for (const s of specs) {
  const [id, type, a, b] = s.split(':');
  fs.writeFileSync(path.join(ROOT, 'dist', '_face.html'), `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><link rel="stylesheet" href="/${distEntries().styles}"><style>body{margin:0}</style></head><body>${face(id, type, a, b)}</body></html>`);
  await page.goto('http://localhost:5394/_face.html'); await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(out, `${id}.png`), clip: { x: 0, y: 0, width: 300, height: 420 } });
}
fs.rmSync(path.join(ROOT, 'dist', '_face.html')); await browser.close(); server.close(); console.log('ok');
