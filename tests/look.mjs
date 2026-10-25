// Quick look: node tests/look.mjs "<query>" <viewports> <waitMs> [outPrefix]
// Writes qa/screenshots/look/<prefix>-<vp>.png and prints errors + renderer stats.
import fs from 'node:fs';
import { need, chromiumPath, ROOT } from '../tools/lib.mjs';
import { startServer } from '../tools/serve.mjs';
import { VIEWPORTS } from './capture.mjs';
const { chromium } = need('playwright');
const [query = 'start=card', vps = 'm390,desk', wait = '9000', prefix = 'look'] = process.argv.slice(2);
fs.mkdirSync(`${ROOT}/qa/screenshots/look`, { recursive: true });
const server = await startServer(5340);
const browser = await chromium.launch({ executablePath: chromiumPath(), args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
for (const vp of vps.split(',')) {
  const [w, h] = VIEWPORTS[vp];
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/fonts\.g|ERR_TUNNEL|GPU stall|swiftshader|SwiftShader|Automatic fallback/i.test(m.text())) errors.push(m.type() + ': ' + m.text().slice(0, 300)); });
  page.on('requestfailed', (r) => { if (!/fonts\.g/.test(r.url())) errors.push('FAILED ' + r.url()); });
  const t0 = Date.now();
  await page.goto(`http://localhost:5340/?view=invite&${query}`, { waitUntil: 'commit' });
  await page.waitForTimeout(Number(wait));
  await page.screenshot({ timeout: 180000, path: `${ROOT}/qa/screenshots/look/${prefix}-${vp}.png` });
  const info = await page.evaluate(() => ({ dbg: window.__studio.debug, stats: window.__studio.scene?.stats?.(), loading: document.querySelector('.host').dataset.loading || null }));
  console.log(vp, `${Date.now() - t0}ms`, JSON.stringify({ renderer: info.dbg.sceneRenderer, sceneErrors: info.dbg.sceneErrors, loading: info.loading, stats: info.stats }), errors.length ? '\n  ' + errors.join('\n  ') : '');
  await page.close();
}
await browser.close(); server.close();
