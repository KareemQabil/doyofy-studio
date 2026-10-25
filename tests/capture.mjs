// Drives the production Studio through the same states as the canonical baseline (tests/baseline.mjs)
// and writes qa/screenshots/<label>/<viewport>-<state>.png.
//   node tests/capture.mjs [label] [query] [viewports]      e.g.  node tests/capture.mjs dom "renderer=dom" m390,desk
import fs from 'node:fs';
import { need, chromiumPath, ROOT } from '../tools/lib.mjs';
import { startServer } from '../tools/serve.mjs';

const { chromium } = need('playwright');
export const VIEWPORTS = { m390: [390, 844], m393: [393, 852], m412: [412, 915], tab: [820, 1180], desk: [1440, 900], fhd: [1920, 1080], ultra: [2560, 1080] };

export async function capture({ label = 'parity', query = '', viewports = ['m390'], port = 5320, gl = true } = {}) {
  const out = `${ROOT}/qa/screenshots/${label}`;
  fs.mkdirSync(out, { recursive: true });
  const server = await startServer(port);
  const browser = await chromium.launch({ executablePath: chromiumPath(), args: gl ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : [] });
  const results = {};
  for (const vp of viewports) {
    const [w, h] = VIEWPORTS[vp];
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_TUNNEL/.test(m.text())) errors.push(m.text()); });
    page.on('requestfailed', (r) => { if (!/fonts\.g/.test(r.url())) errors.push('FAILED ' + r.url()); });
    await page.goto(`http://localhost:${port}/?view=invite&${query}`, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.__studio?.debug.states.length);
    // align to the intro start (state machine clock), like the baseline aligns to the runtime's first render
    const sinceIntro = () => page.evaluate(() => performance.now() - window.__studio.debug.states[0][1]);
    const at = async (ms) => { const d = ms - (await sinceIntro()); if (d > 0) await page.waitForTimeout(d); };
    const shot = (name) => page.screenshot({ path: `${out}/${vp}-${name}.png` });
    const t = (ms) => page.waitForTimeout(ms);
    const click = (s) => page.click(s, { force: true });
    await at(900); await shot('01-intro-credit');
    await at(3000); await shot('02-intro-card-arrives');
    await at(6000); await shot('03-card-settled');
    await click('.st-cardbtn'); await t(450); await shot('04-opening');
    await t(1500);
    const pages = ['invitation', 'date', 'program', 'venue', 'rsvp'];
    for (let i = 0; i < 5; i++) {
      if (i > 0) { await click('[data-act="next"]'); await t(1700); }
      await shot(`05-page-${i + 1}-${pages[i]}`);
    }
    await click('button[type=submit]'); await t(400); await shot('06-rsvp-validation');
    await page.fill('#st-name', 'Layla Hassan'); await click('[data-attend="yes"]');
    await click('[data-guests="1"]'); await t(300); await shot('07-rsvp-filled');
    await click('button[type=submit]'); await t(900); await shot('08-pack');
    await t(1950); await shot('09-seal');
    await t(1050); await shot('10-fly');
    await t(3300); await shot('11-done');
    await click('[data-act="switcher"]'); await t(600); await shot('12-switcher');
    results[vp] = { errors, renderer: await page.evaluate(() => window.__studio.debug) };
    await page.close();
  }
  await browser.close(); server.close();
  return results;
}

if (process.argv[1].endsWith('capture.mjs')) {
  const [label = 'parity', query = '', vps = 'm390'] = process.argv.slice(2);
  const r = await capture({ label, query, viewports: vps.split(',') });
  console.log(JSON.stringify(r, null, 1));
}
