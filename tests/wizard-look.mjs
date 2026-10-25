// node tests/wizard-look.mjs [viewports] [prefix] — screenshots of every wizard step → qa/screenshots/wizard/
import fs from 'node:fs';
import { need, chromiumPath, ROOT } from '../tools/lib.mjs';
import { startServer } from '../tools/serve.mjs';
import { VIEWPORTS } from './capture.mjs';
const { chromium } = need('playwright');
const [vps = 'desk,m390', prefix = 'wz', query = ''] = process.argv.slice(2);
const OUT = `${ROOT}/qa/screenshots/wizard`;
fs.mkdirSync(OUT, { recursive: true });
const server = await startServer(5360);
const browser = await chromium.launch({ executablePath: chromiumPath(), args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
for (const vp of vps.split(',')) {
  const [w, h] = VIEWPORTS[vp];
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_TUNNEL/.test(m.text())) errors.push(m.text()); });
  await page.goto(`http://localhost:5360/?view=wizard&${query}`, { waitUntil: 'commit' });
  await page.waitForFunction(() => window.__wizard);
  const shot = async (n) => { await page.waitForTimeout(1200); await page.screenshot({ path: `${OUT}/${prefix}-${vp}-${n}.png`, timeout: 180000, fullPage: vp !== 'desk' && vp !== 'fhd' }); };
  await shot('1-experience');
  await page.click('[data-dim="2d"]'); await shot('1b-experience-2d');
  await page.click('[data-wz="next"]'); await shot('2-card');
  await page.click('[data-card="emerald"]');
  await page.click('[data-wz="next"]'); await shot('3-scene');
  await page.click('[data-scene="garden"]');
  await page.click('[data-wz="next"]');
  await page.fill('input[name="aAr"]', 'ليلى'); await page.fill('input[name="aEn"]', 'Layla');
  await page.fill('input[name="bAr"]', 'عمر'); await page.fill('input[name="bEn"]', 'Omar');
  await page.fill('input[name="date"]', '2027-03-18');
  await shot('4-details');
  await page.click('[data-wz="next"]'); await shot('5-share');
  if (vp !== 'desk') { await page.click('[data-wz="show-preview"]'); await page.waitForTimeout(3000); await page.screenshot({ path: `${OUT}/${prefix}-${vp}-6-preview.png`, timeout: 180000 }); }
  console.log(vp, errors.length ? errors.join(' | ') : 'no errors', await page.evaluate(() => window.__studio?.debug?.sceneRenderer));
  await page.close();
}
await browser.close(); server.close();
