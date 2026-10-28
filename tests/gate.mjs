// Release gate — the checks every batch must pass before it merges. Run: npm run gate  (builds first)
//   node tests/gate.mjs [--shots] [--only=<substring>] [--appearance=light|dark|both]
// Per route × viewport: no horizontal scroll · no tap target under 24×24 · no page/console errors ·
// phone bars within budget · focus never fully hidden under a fixed bar · text contrast (light and dark).
// --shots writes qa/gate/<appearance>/<viewport>/<route>.png (git-ignored) for before/after review.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { startServer } from '../tools/serve.mjs';
import { chromiumPath, ROOT } from '../tools/lib.mjs';
import { distEntries } from '../tools/dist-entries.mjs';

const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}`))?.split('=')[1] ?? (process.argv.includes(`--${k}`) ? true : undefined);
const SHOTS = !!arg('shots');
const ONLY = arg('only');
const APPEARANCES = { light: ['light'], dark: ['dark'], both: ['light', 'dark'] }[arg('appearance') || 'both'] || ['light'];

/** budgets — the acceptance numbers from docs/handoff/FINAL_PHASE_PLAN_2026-10-28.md */
const BUDGET = { phoneBars: 104, minTarget: 24 };

const VIEWPORTS = {
  p320: { width: 320, height: 640, phone: true },
  p375: { width: 375, height: 812, phone: true },
  p390: { width: 390, height: 844, phone: true },
  d1366: { width: 1366, height: 768 },
  d1440: { width: 1440, height: 900 },
};
const ROUTES = [
  '/app/welcome', '/app/events', '/app/events/new', '/app/events/new?view=list',
  '/app/events/evt_engagement/invitation/templates?first=1', '/app/events/evt_wedding/invitation/templates',
  '/app/events/evt_wedding/invitation/design', '/app/events/evt_wedding/invitation/design?section=design',
  '/app/events/evt_wedding/invitation/design?section=event',
  '/app/events/evt_wedding/overview', '/app/events/evt_wedding/invitation',
  '/app/events/evt_wedding/guests', '/app/events/evt_wedding/guests?view=food', '/app/events/evt_wedding/guests/import',
  '/app/events/evt_wedding/rsvp', '/app/events/evt_wedding/seating',
  '/app/events/evt_wedding/check-in', '/app/events/evt_wedding/settings', '/app/events/evt_katb/summary', '/app/events/evt_wedding/more',
  '/check-in/evt_wedding', '/app/account',
  'GUEST', // the seeded guest hub link (code is generated per seed)
];

// bundle budget: the first-load script never carries GSAP, the Lottie player or three.js (all load on demand)
{
  const app = fs.readFileSync(path.join(ROOT, 'dist', distEntries().app), 'utf8');
  for (const [name, mark] of [['GSAP', 'GreenSock'], ['three.js', 'WebGLRenderer'], ['Lottie', 'bodymovin']]) if (app.includes(mark)) { console.log(`FAIL  bundle: ${name} is inside dist/app.js`); process.exitCode = 1; }
}
const server = await startServer(5411);
const BASE = `http://localhost:${server.address().port}`;
const browser = await chromium.launch({ executablePath: chromiumPath(), args: ['--enable-unsafe-swiftshader'] });
const failures = [];
let checked = 0;

/** in-page audit; returns a list of issue strings */
async function audit({ phone, budget }) {
  const issues = [];
  const vis = (el) => { const b = el.getBoundingClientRect(); const cs = getComputedStyle(el); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05; };
  const label = (el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''} «${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 18)}»`;
  const skip = (el) => el.closest('.host, .card-thumb, .st-root, [data-gate-skip], [inert]');
  // 1 · horizontal overflow
  const sw = document.documentElement.scrollWidth, iw = window.innerWidth;
  if (sw > iw + 1) {
    const wide = [...document.querySelectorAll('body *')].filter((e) => { const b = e.getBoundingClientRect(); return vis(e) && (b.right > iw + 1 || b.left < -1) && !e.closest('[data-scroll-x], .deck, .chips, .hscroll') && getComputedStyle(e).position !== 'fixed'; }).slice(0, 3).map(label);
    issues.push(`overflow: page ${sw}px on ${iw}px — ${wide.join(', ')}`);
  }
  // 2 · target size (WCAG 2.5.8), inline links inside a sentence are exempt
  const small = [];
  for (const el of document.querySelectorAll('button, a[href], [role=button], [role=tab], [role=switch], [role=radio], [role=checkbox], [role=menuitem], input[type=checkbox], input[type=radio], select')) {
    if (!vis(el) || skip(el) || el.dataset.hit === 'expanded') continue;
    const b = el.getBoundingClientRect();
    if (b.width >= budget.minTarget && b.height >= budget.minTarget) continue;
    // a checkbox/radio wrapped in its label: the label is the target
    const lab = el.matches('input') && el.closest('label'); if (lab) { const lb = lab.getBoundingClientRect(); if (lb.width >= budget.minTarget && lb.height >= budget.minTarget) continue; }
    if (el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.parentElement && el.parentElement.textContent.trim().length > el.textContent.trim().length + 10) continue;
    if (b.bottom < 0 || b.top > innerHeight * 4) continue;
    small.push(`${label(el)} ${Math.round(b.width)}×${Math.round(b.height)}`);
  }
  if (small.length) issues.push(`targets<${budget.minTarget}: ${small.length} — ${small.slice(0, 4).join(', ')}`);
  // 3 · fixed bars on phones
  const bars = [...document.querySelectorAll('body *')].filter((e) => { const cs = getComputedStyle(e); if (!(cs.position === 'fixed' || cs.position === 'sticky') || !vis(e)) return false; const b = e.getBoundingClientRect(); return b.width >= innerWidth * 0.8 && b.height < innerHeight * 0.4 && (b.top <= 1 || b.bottom >= innerHeight - 1); });
  const outer = bars.filter((b) => !bars.some((o) => o !== b && o.contains(b)));
  const barH = outer.reduce((s, e) => s + e.getBoundingClientRect().height, 0);
  if (phone && barH > budget.phoneBars) issues.push(`bars: ${Math.round(barH)}px fixed on a phone (budget ${budget.phoneBars}) — ${outer.map(label).join(', ')}`);
  // 4 · contrast — background resolves through ancestors and their ::before/::after plates; unknown (image/gradient) is skipped
  const parse = (c) => { const m = c && c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [r, g, b, a]; };
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const plate = (e) => { for (const p of ['::before', '::after']) { const cs = getComputedStyle(e, p); if (cs.content === 'none' || cs.position !== 'absolute') continue; if (cs.backgroundImage !== 'none') return 'unknown'; const c = parse(cs.backgroundColor); if (c && c[3] > 0.9 && parseFloat(cs.width || '0') >= e.clientWidth * 0.8 && parseFloat(cs.height || '0') >= e.clientHeight * 0.8) return c; } return null; };
  const bgOf = (el) => { let e = el; while (e && e !== document.documentElement) { const cs = getComputedStyle(e); if (cs.backgroundImage !== 'none') return null; const c = parse(cs.backgroundColor); if (c && c[3] > 0.9) return c; const p = plate(e); if (p === 'unknown') return null; if (p) return p; e = e.parentElement; } return parse(getComputedStyle(document.body).backgroundColor) || [255, 255, 255, 1]; };
  // what is actually painted under the text: the hit-test stack at the text's centre (covers sliding indicators and pseudo plates)
  const under = (el) => {
    let b = el.getBoundingClientRect();
    if (b.top < 0 || b.bottom > innerHeight) { el.scrollIntoView({ block: 'center', behavior: 'instant' }); return 'scroll'; }
    const x = b.left + b.width / 2, y = b.top + b.height / 2;
    if (y < 0 || y > innerHeight || x < 0 || x > innerWidth) return bgOf(el);
    for (const e of document.elementsFromPoint(x, y)) {
      if (el.contains(e) && e !== el) continue;
      const cs = getComputedStyle(e); if (cs.backgroundImage !== 'none') return null;
      const p = plate(e); if (p === 'unknown') return null; if (p) return p;
      const c = parse(cs.backgroundColor); if (c && c[3] > 0.9) return c;
    }
    return bgOf(el);
  };
  // hit-test everything while measuring: decorative indicators are usually pointer-events:none
  const probe = document.createElement('style'); probe.textContent = '*{pointer-events:auto!important}'; document.head.append(probe);
  const low = new Set();
  for (const el of document.querySelectorAll('body *')) {
    if (skip(el) || el.closest('svg, [aria-hidden="true"]') || !vis(el)) continue;
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const cs = getComputedStyle(el); const fg = parse(cs.color);
    if (!fg || fg[3] < 0.5 || el.closest('button:disabled, [aria-disabled="true"]')) continue;
    const size = parseFloat(cs.fontSize), bold = Number(cs.fontWeight) >= 600;
    const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
    const rat = (bg) => { const L1 = lum(fg), L2 = lum(bg); return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); };
    // a failure must hold for both readings of the background: the ancestor chain and the painted stack
    const a = bgOf(el); if (!a || rat(a) >= need) continue;
    let b2 = under(el);
    // brought into view: let sticky layout, observers and indicator transitions settle, then read the painted stack
    if (b2 === 'scroll') { await new Promise((r) => setTimeout(r, 320)); b2 = under(el); if (b2 === 'scroll') b2 = null; }
    if (!b2 || rat(b2) >= need) continue;
    const bg = a, ratio = rat(a);
    if (ratio < need) low.add(`${ratio.toFixed(2)}<${need} «${el.textContent.trim().slice(0, 16)}» ${cs.color} on rgb(${bg.slice(0, 3).join(',')})`);
  }
  probe.remove();
  if (low.size) issues.push(`contrast: ${[...low].slice(0, 4).join(' | ')}`);
  return issues;
}

/** tab through the page: a focused element must never be entirely covered by a fixed/sticky bar (WCAG 2.4.11) */
async function focusObscured(page) {
  return page.evaluate(async () => {
    const bars = [...document.querySelectorAll('body *')].filter((e) => { const p = getComputedStyle(e).position; return p === 'fixed' || p === 'sticky'; });
    const hidden = [];
    const focusables = [...document.querySelectorAll('a[href], button:not([disabled]), input:not([type=hidden]), select, textarea, [tabindex="0"]')].filter((e) => e.getBoundingClientRect().height > 0 && !e.closest('[inert], .host')).slice(0, 60);
    for (const el of focusables) {
      if (bars.some((b) => b.contains(el))) continue;
      el.focus({ preventScroll: false });
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const r = el.getBoundingClientRect();
      for (const b of bars) {
        const q = b.getBoundingClientRect();
        if (q.height === 0 || getComputedStyle(b).visibility === 'hidden') continue;
        if (r.top >= q.top && r.bottom <= q.bottom && r.left >= q.left && r.right <= q.right && !el.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2))) { hidden.push(`${el.tagName.toLowerCase()} «${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 18)}» under ${String(b.className).split(' ')[0]}`); break; }
      }
    }
    return hidden;
  });
}

for (const appearance of APPEARANCES) {
  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: !!vp.phone, isMobile: !!vp.phone, colorScheme: appearance === 'dark' ? 'dark' : 'light' });
    await ctx.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(`${BASE}/app/events`);
    await page.waitForFunction(() => window.__doyofy);
    const code = await page.evaluate((a) => {
      const p = window.__doyofy.prototype; p.update({ latencyMs: 0, appearance: a }); p.reset('before');
      return JSON.parse(localStorage.getItem('doyofy:db:v1')).parties.find((x) => x.id === 'pty_w03').code;
    }, appearance);
    for (const r0 of ROUTES) {
      const route = r0 === 'GUEST' ? `/i/noura-faisal/${code}` : r0;
      if (ONLY && !route.includes(ONLY)) continue;
      errors.length = 0;
      await page.goto(BASE + route);
      await page.waitForTimeout(700);
      await page.evaluate(() => document.fonts.ready.then(() => new Promise((r) => setTimeout(r, 350))));
      const issues = await page.evaluate(audit, { phone: !!vp.phone, budget: BUDGET });
      if (vpName === 'p375' || vpName === 'd1366') issues.push(...(await focusObscured(page)).slice(0, 3).map((h) => `focus hidden: ${h}`));
      const errs = errors.filter((e) => !/favicon|ERR_ABORTED|fonts\.g/.test(e));
      if (errs.length) issues.push(`errors: ${errs.slice(0, 2).join(' | ').slice(0, 200)}`);
      checked++;
      const key = `${appearance}/${vpName} ${route}`;
      if (issues.length) { failures.push([key, issues]); console.log(`FAIL  ${key}`); issues.forEach((i) => console.log(`      - ${i}`)); }
      else console.log(`ok    ${key}`);
      if (SHOTS && (vpName === 'p375' || vpName === 'd1366')) {
        const file = path.join(ROOT, 'qa', 'gate', appearance, vpName, `${route.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '_') || 'root'}.png`);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: file });
      }
    }
    await ctx.close();
  }
}

// Q1 — a shared link opens on another device (empty storage) from the copy it carries, and its reply never claims to be sent
{
  const org = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await org.newPage();
  await page.goto(`${BASE}/app/events`); await page.waitForFunction(() => window.__doyofy);
  await page.evaluate(() => { window.__doyofy.prototype.update({ latencyMs: 0 }); window.__doyofy.prototype.reset('before'); });
  await page.goto(`${BASE}/app/events/evt_wedding/guests`); await page.waitForTimeout(900);
  await page.locator('.g2-name').first().click(); await page.waitForTimeout(600);
  const link = await page.evaluate(() => [...document.querySelectorAll('input, a')].map((e) => e.value || e.href || '').find((v) => /\/i\/[^/]+\/[A-Z0-9]+\?d=/.test(v)));
  await org.close();
  const fresh = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const guest = await fresh.newPage();
  let issue = '';
  if (!link) issue = 'no self-contained link in the guest drawer';
  else if (link.length > 2600) issue = `link is ${link.length} chars`;
  else {
    await guest.goto(link.replace(/^https?:\/\/[^/]+/, BASE));
    const ok = await guest.waitForFunction(() => window.__studio, null, { timeout: 15000 }).then(() => true).catch(() => false);
    if (!ok || !guest.url().includes('?i=')) issue = 'did not open the carried copy';
    else {
      await guest.waitForFunction(() => window.__studio.sm.state === 'card', null, { timeout: 15000 }).catch(() => {});
      await guest.evaluate(() => window.__studio.sm.send('open'));
      await guest.waitForFunction(() => window.__studio.sm.state === 'pages', null, { timeout: 15000 }).catch(() => {});
      const receipt = await guest.evaluate(async () => { const s = window.__studio; s.rsvp.name = 'ضيف'; s.rsvp.attending = 'yes'; await s.submit(); return s.rsvp.receipt; });
      if (!receipt?.demo) issue = 'reply from a carried copy was not marked as a demo';
    }
  }
  checked++;
  if (issue) { failures.push(['Q1 shared link', [issue]]); console.log(`FAIL  Q1 shared link — ${issue}`); } else console.log(`ok    Q1 shared link (${link.length} chars) opens on a fresh device; reply is a demo`);
  await fresh.close();
}

await browser.close();
server.close();
console.log(`\nRelease gate: ${checked - failures.length}/${checked} screens clean.`);
process.exit(failures.length || process.exitCode ? 1 : 0);
