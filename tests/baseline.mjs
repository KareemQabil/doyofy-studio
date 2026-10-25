// npm run baseline — drives the UNMODIFIED canonical Studio (canonical/Studio.dc.html on its own Design-canvas
// runtime) through every state and writes qa/baseline/<viewport>-<state>.png + baseline-report.json.
// Host CSS only centres/scales the fixed 390×844 artboard for non-390 viewports (as the canvas Play view does).
//
// Requires canonical/runtime/support.js = the Design canvas runtime (artifact-type/dc-runtime.js of the
// "Animated Wedding Invitation" Design artifact). It is NOT redistributed with this project: fetch it from the
// artifact and place it there. The script copies canonical/*.dc.html + motion.css next to it and serves them.
import { need, chromiumPath, ROOT } from '../tools/lib.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = need('playwright');
const RUNTIME = path.join(ROOT, 'canonical', 'runtime');
if (!fs.existsSync(path.join(RUNTIME, 'support.js'))) { console.error('canonical/runtime/support.js missing — see header.'); process.exit(1); }
for (const f of fs.readdirSync(path.join(ROOT, 'canonical'))) if (/\.(dc\.html|css)$/.test(f)) fs.copyFileSync(path.join(ROOT, 'canonical', f), path.join(RUNTIME, f));
const DIR = RUNTIME, OUT = process.env.OUT || path.join(ROOT, 'qa', 'baseline');
fs.mkdirSync(OUT, { recursive: true });
const TYPES = { '.css': 'text/css', '.js': 'text/javascript', '.html': 'text/html' };
const srv = http.createServer((q, r) => { const f = path.join(DIR, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'text/plain' }); fs.createReadStream(f).pipe(r); }).listen(5302);
const VIEWPORTS = { m390: [390, 844], m393: [393, 852], m412: [412, 915], desk: [1440, 900] };
const only = process.env.ONLY ? process.env.ONLY.split(',') : Object.keys(VIEWPORTS);
const b = await chromium.launch({ executablePath: chromiumPath() });
const report = { viewports: {}, timings: null, errors: [] };

for (const vp of only) {
  const [w, h] = VIEWPORTS[vp];
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.on('pageerror', (e) => report.errors.push(vp + ' ' + e));
  await p.addInitScript(() => {
    window.__t0 = performance.now(); window.__log = [];
    new MutationObserver(() => {
      const st = document.querySelector('.st'); if (!st) return;
      const c = st.className; if (c !== window.__last) { window.__last = c; window.__log.push([Math.round(performance.now() - window.__t0), c]); }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['class'], childList: true });
  });
  await p.goto('http://localhost:5302/Studio.dc.html');
  await p.waitForSelector('.st');
  const s = Math.min(w / 390, h / 844);
  if (vp !== 'm390') await p.addStyleTag({ content: `html,body{background:#050303}#dc-root{display:flex;align-items:center;justify-content:center;height:100vh}.st{flex:none;transform:scale(${s});transform-origin:50% 50%}` });
  const shot = async (name) => p.screenshot({ path: `${OUT}/${vp}-${name}.png` });
  const t = async (ms) => p.waitForTimeout(ms);
  await t(900); await shot('01-intro-credit');
  await t(2100); await shot('02-intro-card-arrives');      // ~3.0s
  await t(3000); await shot('03-card-settled');            // ~6.0s
  await p.click('.st-cardbtn', { force: true }); await t(450); await shot('04-opening');
  await t(1500);
  const pages = ['invitation', 'date', 'program', 'venue', 'rsvp'];
  for (let i = 0; i < 5; i++) {
    if (i > 0) { await p.click('button[aria-label="Next page"]', { force: true }); await t(1700); }
    await shot(`05-page-${i + 1}-${pages[i]}`);
  }
  await p.click('button[type=submit]', { force: true }); await t(400); await shot('06-rsvp-validation');
  await p.fill('#st-name', 'Layla Hassan'); await p.click('button[aria-pressed][class*=st-pill] >> nth=0', { force: true });
  await p.click('button[aria-label="More guests"]', { force: true }); await t(300); await shot('07-rsvp-filled');
  await p.click('button[type=submit]', { force: true }); await t(900); await shot('08-pack');
  await t(1950); await shot('09-seal');      // submit+2.85s (seal stamp lands ~2.55-3.0s)
  await t(1050); await shot('10-fly');       // ~3.9s
  await t(3300); await shot('11-done');      // ~7.2s
  await p.click('button[aria-label="Choose card design and scene"]', { force: true }); await t(600); await shot('12-switcher');
  const log = await p.evaluate(() => window.__log);
  report.viewports[vp] = { size: [w, h], scale: +s.toFixed(4), log };
  await p.close();
}
fs.writeFileSync(`${OUT}/baseline-report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.viewports[only[0]].log), report.errors);
await b.close(); srv.close();
