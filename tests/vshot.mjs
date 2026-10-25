// viewport screenshots with actions (dev/review helper): node tests/vshot.mjs out WxH name "route|action;..." ...
import fs from 'node:fs';
import { need, chromiumPath } from '../tools/lib.mjs';
import { startServer } from '../tools/serve.mjs';
const { chromium } = need('playwright');
const [out, vp, ...jobs] = process.argv.slice(2);
const [w, h] = vp.split('x').map(Number);
fs.mkdirSync(out, { recursive: true });
const server = await startServer(5392);
const browser = await chromium.launch({ executablePath: chromiumPath(), args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: w, height: h } });
await page.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
for (const job of jobs) {
  const [name, route, action] = job.split('|');
  await page.goto(`http://localhost:5392${route}`, { waitUntil: 'commit' }); await page.waitForTimeout(1500);
  for (const a of (action || '').split(';').filter(Boolean)) {
    if (a.startsWith('click:')) await page.click(a.slice(6));
    else if (a.startsWith('wait:')) await page.waitForTimeout(Number(a.slice(5)));
    else if (a.startsWith('fill:')) { const [sel, v] = a.slice(5).split('='); await page.fill(sel, v); }
    else if (a.startsWith('key:')) await page.keyboard.press(a.slice(4));
    else if (a.startsWith('scroll:')) await page.mouse.wheel(0, Number(a.slice(7)));
  }
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/${name}.png`, timeout: 45000 });
  console.log(name);
}
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
await browser.close(); server.close();
