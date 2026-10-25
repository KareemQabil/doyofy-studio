// node tests/shot.mjs <outdir> <w>x<h> <path> [<path>…] — screenshots of app routes (dev helper)
import fs from 'node:fs';
import { need, chromiumPath } from '../tools/lib.mjs';
import { startServer } from '../tools/serve.mjs';
const { chromium } = need('playwright');
const [out, vp, ...routes] = process.argv.slice(2);
const [w, h] = vp.split('x').map(Number);
fs.mkdirSync(out, { recursive: true });
const server = await startServer(5390);
const port = server.address().port;
const browser = await chromium.launch({ executablePath: chromiumPath(), args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: w, height: h } });
await page.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort()); // unreachable from the sandbox
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_TUNNEL|ERR_CONNECTION/.test(m.text())) errors.push(m.text()); });
for (const [i, r] of routes.entries()) {
  const [route, action] = r.split('|');
  await page.goto(`http://localhost:${port}${route}`, { waitUntil: 'commit' });
  await page.waitForTimeout(1500);
  if (action) { for (const a of action.split(';')) { if (a.startsWith('click:')) await page.click(a.slice(6)); else if (a.startsWith('wait:')) await page.waitForTimeout(Number(a.slice(5))); } await page.waitForTimeout(900); }
  const name = `${String(i).padStart(2, '0')}-${route.replace(/[^a-z0-9]+/gi, '_').slice(0, 60)}-${w}.png`;
  await page.screenshot({ path: `${out}/${name}`, fullPage: true });
  console.log(name);
}
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
await browser.close(); server.close();
