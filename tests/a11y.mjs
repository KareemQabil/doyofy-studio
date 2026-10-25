// node tests/a11y.mjs — accessibility sweep of every Doyofy screen (phone + desktop):
// unnamed buttons/links, unlabelled form fields, images without alt, duplicate ids, h1 count,
// and WCAG text contrast (computed colour vs the nearest opaque background). Output: qa/a11y-results.json
import fs from 'node:fs';
import { need, chromiumPath, ROOT } from '../tools/lib.mjs';
import { startServer } from '../tools/serve.mjs';

const { chromium } = need('playwright');
const server = await startServer(5381);
const BASE = `http://localhost:${server.address().port}`;
const browser = await chromium.launch({ executablePath: chromiumPath(), args: ['--enable-unsafe-swiftshader'] });
const ROUTES = [
  '/app/events', '/app/events/new?chooser=coverflow', '/app/events/new?chooser=rail', '/prototype/design-review',
  '/app/events/evt_engagement/invitation/templates?first=1', '/app/events/evt_wedding/invitation/templates',
  '/app/events/evt_wedding/invitation/design', '/app/events/evt_wedding/invitation/design?section=design',
  '/app/events/evt_wedding/invitation/design?section=motion', '/app/events/evt_wedding/invitation/design?section=event',
  '/app/events/evt_wedding/overview', '/app/events/evt_wedding/invitation',
  '/app/events/evt_wedding/guests', '/app/events/evt_wedding/guests?party=pty_w29', '/app/events/evt_wedding/guests/import',
  '/app/events/evt_wedding/rsvp', '/app/events/evt_wedding/rsvp?tab=unmatched', '/app/events/evt_wedding/seating',
  '/app/events/evt_wedding/check-in', '/app/events/evt_wedding/settings', '/app/events/evt_katb/summary', '/app/events/evt_wedding/more',
  '/check-in/evt_wedding', '/app/events/evt_engagement/overview', '/app/events/evt_engagement/invitation',
];
const results = [];
const THEMES = (process.argv[2] ? [process.argv[2]] : ['warm', 'sage']);
for (const theme of THEMES) for (const [vpBase, size] of [['phone', { width: 375, height: 812 }], ['desk', { width: 1366, height: 900 }]]) {
  const vpName = `${vpBase}/${theme}`;
  const ctx = await browser.newContext({ viewport: size });
  await ctx.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
  const page = await ctx.newPage();
  await page.goto(`${BASE}/app/events`);
  await page.waitForFunction(() => window.__doyofy);
  await page.evaluate((t) => { window.__doyofy.prototype.update({ latencyMs: 0, theme: t }); window.__doyofy.prototype.reset('before'); }, theme);
  const routes = [...ROUTES];
  // a guest hub link (confirmed party)
  const code = await page.evaluate(() => JSON.parse(localStorage.getItem('doyofy:db:v1')).parties.find((p) => p.id === 'pty_w03').code);
  routes.push(`/i/noura-faisal/${code}`);
  for (const r of routes) {
    await page.goto(BASE + r);
    await page.waitForTimeout(1200);
    const res = await page.evaluate(() => {
      const issues = [];
      const vis = (el) => { const b = el.getBoundingClientRect(); const cs = getComputedStyle(el); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
      const name = (el) => (el.getAttribute('aria-label') || el.getAttribute('title') || (el.getAttribute('aria-labelledby') && el.getAttribute('aria-labelledby').split(' ').map((id) => document.getElementById(id)?.textContent || '').join(' ')) || el.textContent || '').trim();
      for (const el of document.querySelectorAll('button, a[href], [role="button"], [role="menuitem"], [role="radio"], [role="switch"]')) {
        if (el.closest('.host, .wz')) continue;
        if (vis(el) && !name(el)) issues.push(`unnamed ${el.tagName.toLowerCase()}.${String(el.className).slice(0, 30)}`);
      }
      for (const el of document.querySelectorAll('input:not([type=hidden]), select, textarea')) {
        if (el.closest('.host, .wz')) continue;
        const labelled = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) || el.closest('label');
        if (!labelled) issues.push(`unlabelled ${el.tagName.toLowerCase()}[${el.type || ''}] ${el.name || el.className}`);
      }
      for (const el of document.querySelectorAll('img')) if (!el.hasAttribute('alt') && !el.closest('.host')) issues.push('img without alt');
      const ids = [...document.querySelectorAll('[id]')].map((e) => e.id).filter((id) => id);
      const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
      if (dup.length) issues.push(`duplicate ids: ${[...new Set(dup)].slice(0, 3).join(',')}`);
      const h1 = [...document.querySelectorAll('h1')].filter(vis).length;
      if (h1 === 0) issues.push('no visible h1');
      // contrast
      const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [r, g, b, a]; };
      const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const bgOf = (el) => { let e = el; while (e) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c[3] > 0.9) return c; if (getComputedStyle(e).backgroundImage !== 'none') return null; e = e.parentElement; } return [255, 255, 255, 1]; };
      const low = [];
      for (const el of document.querySelectorAll('body *')) {
        if (el.closest('.host, svg, .wz, .card-thumb, [aria-hidden="true"]') || !vis(el)) continue;
        const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (!own) continue;
        const cs = getComputedStyle(el);
        const fg = parse(cs.color), bg = bgOf(el);
        if (!fg || !bg || fg[3] < 0.5) continue;
        const L1 = lum(fg), L2 = lum(bg);
        const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
        const size = parseFloat(cs.fontSize), bold = Number(cs.fontWeight) >= 600;
        const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
        const disabled = el.closest('button:disabled, [aria-disabled="true"]');
        if (ratio < need && !disabled) low.push(`${ratio.toFixed(2)}<${need} "${el.textContent.trim().slice(0, 24)}" ${cs.color} on rgb(${bg.slice(0, 3).join(',')})`);
      }
      if (low.length) issues.push(...[...new Set(low)].slice(0, 6).map((l) => `contrast ${l}`));
      return issues;
    });
    results.push({ vp: vpName, route: r, issues: res });
    console.log(`${res.length ? 'ISSUES' : 'ok    '} [${vpName}] ${r}${res.length ? '\n   - ' + res.join('\n   - ') : ''}`);
  }
  await ctx.close();
}
fs.writeFileSync(`${ROOT}/qa/a11y-results.json`, JSON.stringify(results, null, 2));
console.log(`\n${results.filter((r) => !r.issues.length).length}/${results.length} screens clean`);
await browser.close(); server.close();
