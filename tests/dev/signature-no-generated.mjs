// dev check: walk every «توقيع» route (organizer, guest, reception, reviewer) and list any request for generated
// imagery (assets/occasions/*.webp, assets/directions/*-world.webp, assets/wizard/*). Expect none.
import { need, chromiumPath } from '../../tools/lib.mjs';
import { startServer } from '../../tools/serve.mjs';
const { chromium } = need('playwright');
const server = await startServer(5398);
const b = await chromium.launch({ executablePath: chromiumPath() });
const hits = new Set();
const W = '/app/events/evt_wedding';
const routes = ['/app/events', '/app/events/new', `${W}/overview`, `${W}/invitation`, `${W}/invitation/design`, `${W}/invitation/templates`, `${W}/guests`, `${W}/guests/import`, `${W}/rsvp`, `${W}/seating`, `${W}/check-in`, `${W}/settings`, `${W}/summary`, '/check-in/evt_wedding', '/i/noura-faisal', '/prototype/signature-directions', '/app/nope'];
for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  const p = await b.newPage({ viewport: vp });
  await p.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
  p.on('request', (r) => { const u = r.url(); if (/assets\/(occasions\/|wizard\/|directions\/(?!signature)[a-z]+-world\.webp)/.test(u)) hits.add(`${p.url().replace(/^https?:\/\/[^/]+/, '')} → ${u.replace(/^https?:\/\/[^/]+\//, '')}`); });
  for (const r of routes) { await p.goto(`http://localhost:5398${r}?theme=signature`); await p.waitForTimeout(900); await p.mouse.wheel(0, 3000); await p.waitForTimeout(500); }
  await p.goto(`http://localhost:5398/app/events/new?theme=signature`); await p.waitForTimeout(800);
  await p.getByRole('button', { name: /قائمة وبحث/ }).click().catch(() => {}); await p.waitForTimeout(800);
  await p.close();
}
console.log(hits.size ? [...hits].join('\n') : 'no legacy occasion/wizard imagery requested on signature routes; editorial assets are allowed');
await b.close(); server.close();
