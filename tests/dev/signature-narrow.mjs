// dev check: horizontal overflow on «توقيع» routes at a narrow 360 px phone, and 200 % text zoom at 1440 (font-size 32px root).
import { need, chromiumPath } from '../../tools/lib.mjs';
import { startServer } from '../../tools/serve.mjs';
const { chromium } = need('playwright');
const server = await startServer(5399);
const b = await chromium.launch({ executablePath: chromiumPath() });
const W = '/app/events/evt_wedding';
const routes = ['/app/events', '/app/events/new', '/app/events/new?type=graduation', `${W}/overview`, `${W}/invitation`, `${W}/invitation/templates`, `${W}/guests`, `${W}/guests/import`, `${W}/rsvp`, `${W}/seating`, `${W}/check-in`, `${W}/settings`, `${W}/summary`, '/check-in/evt_wedding', '/i/noura-faisal', '/prototype/signature-directions'];
const out = [];
for (const [label, vp, zoom] of [['360', { width: 360, height: 740 }, false], ['1440-zoom200', { width: 1440, height: 900 }, true]]) {
  const p = await b.newPage({ viewport: vp });
  await p.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
  for (const r of routes) {
    await p.goto(`http://localhost:5399${r}${r.includes('?') ? '&' : '?'}theme=signature`); await p.waitForTimeout(800);
    if (zoom) await p.addStyleTag({ content: 'html{font-size:200% !important}' });
    const [sw, w] = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    out.push(`${sw > w + 1 ? 'OVERFLOW' : 'ok      '} ${label} ${r} (${sw}/${w})`);
  }
  await p.screenshot({ path: `review/screenshots-or-captures/journey/narrow-${label}-last.png` });
  await p.close();
}
console.log(out.join('\n'));
await b.close(); server.close();
