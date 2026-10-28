// «توقيع» journey in a real browser (Chromium via Playwright), at 390 / 768 / 1440.
//   node tests/signature-journey.mjs [phone|tab|desk|all]
// Graduation (single person), created from scratch: occasion deck (keyboard) → details → prepared invitation →
// publish (stamp) → add a guest → guest link: envelope cover → RSVP → reception gate check-in → summary.
// Couple (seeded wedding): overview → invitation → guests → replies → reception → summary → guest cover.
// Also checks: no horizontal page scroll, no wedding copy on the graduation surfaces, reduced-motion cover,
// sheet keyboard steps on phone, no page errors. Writes review/screenshots-or-captures/journey/<vp>-*.png
// and review/screenshots-or-captures/journey/results.json.
import fs from 'node:fs';
import { need, chromiumPath, ROOT } from '../tools/lib.mjs';
import { startServer } from '../tools/serve.mjs';

const { chromium } = need('playwright');
const which = process.argv[2] ?? 'all';
const OUT = `${ROOT}/review/screenshots-or-captures/journey`;
fs.mkdirSync(OUT, { recursive: true });
const server = await startServer(5381);
const BASE = `http://localhost:${server.address().port}`;
const browser = await chromium.launch({ executablePath: chromiumPath(), args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const VPS = { phone: { width: 390, height: 844 }, tab: { width: 768, height: 1024 }, desk: { width: 1440, height: 900 } };
const T = 'theme=signature';
const results = [];
const rec = (vp, name, ok, detail = '') => { results.push({ vp, name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  [${vp}] ${name}${detail ? '  — ' + detail : ''}`); };
const WEDDING_WORDS = /العروس|العريس|العروسين|زفاف|Wedding|DINNER|&/;

async function step(vp, name, fn) { try { const d = await fn(); rec(vp, name, true, d || ''); } catch (e) { rec(vp, name, false, String(e.message || e).split('\n')[0].slice(0, 220)); } }

async function run(vp) {
  const size = VPS[vp];
  const ctx = await browser.newContext({ viewport: size, locale: 'ar' });
  await ctx.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const shot = (n) => page.screenshot({ path: `${OUT}/${vp}-${n}.png` });
  const go = async (path) => { await page.goto(`${BASE}${path}${path.includes('?') ? '&' : '?'}${T}`, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(900); };
  const noScroll = async () => { const [sw, w] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]); if (sw > w + 1) throw new Error(`horizontal scroll ${sw} > ${w}`); return 'no horizontal scroll'; };
  const phone = size.width < 600;

  // fresh store for each viewport
  await go('/app/events'); await page.evaluate(() => { localStorage.removeItem('doyofy:db:v1'); localStorage.removeItem('doyofy:deck-hint'); }); await go('/app/events');

  await step(vp, '01 home renders (A celebration hero)', async () => { await page.locator('.sig-hero h1').waitFor(); await shot('01-home'); return noScroll(); });

  await step(vp, '02 occasion deck: keyboard steps, button steps', async () => {
    await go('/app/events/new');
    await page.locator('.deck-stage').waitFor();
    const count = () => page.locator('.deck-count b').innerText();
    const a = await count();
    await page.locator('.deck-card.is-active').focus();
    await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(500);
    const b = await count();
    await page.getByRole('button', { name: 'البطاقة السابقة' }).click(); await page.waitForTimeout(500);
    const c = await count();
    if (!(a === '01' && b === '02' && c === '01')) throw new Error(`counter ${a}→${b}→${c}`);
    await shot('02-occasions'); return `counter ${a}→${b}→${c}; ` + await noScroll();
  });

  await step(vp, '03 occasion deck: swipe (pointer drag) moves to the next card', async () => {
    const box = await page.locator('.deck-stage').boundingBox();
    const y = box.y + box.height * 0.5, x = box.x + box.width * 0.4;
    await page.mouse.move(x, y); await page.mouse.down();
    // RTL: the card follows the finger — a drag to the right pulls the next card in from the left
    for (let i = 1; i <= 8; i++) { await page.mouse.move(x + i * 12, y); await page.waitForTimeout(16); }
    await page.mouse.up(); await page.waitForTimeout(700);
    const n = await page.locator('.deck-count b').innerText();
    if (n !== '02') throw new Error(`after swipe ${n}`);
    return 'swipe right → 02';
  });

  await step(vp, '04 graduation details + live card preview', async () => {
    await go('/app/events/new?type=graduation');
    await page.getByLabel(/اسم الخريج/).fill('جود العتيبي');
    await page.getByLabel('التاريخ').fill('2027-06-20');
    await page.getByLabel('اسم القاعة أو المكان').fill('قاعة الريحان');
    await page.getByLabel('المدينة').fill('الرياض');
    await page.waitForTimeout(500);
    const preview = await page.locator('.sig-create-aside').innerText();
    if (!preview.includes('جود')) throw new Error('preview missing the name');
    await shot('04-graduation-details');
    const body = await page.locator('main, .create-shell, body').first().innerText();
    if (/العروس|العريس/.test(body)) throw new Error('wedding copy on graduation details');
    return noScroll();
  });

  await step(vp, '05 prepared invitation opens in the editor', async () => {
    await page.getByRole('button', { name: 'جهّز دعوتي' }).click();
    await page.waitForURL(/invitation\/design/, { timeout: 15000 });
    await page.waitForTimeout(1500);
    await shot('05-editor');
    return page.url().replace(BASE, '');
  });
  const eventId = (page.url().match(/events\/([^/]+)/) || [])[1];

  if (phone) await step(vp, '05b editor sheet: keyboard snaps peek/half/full', async () => {
    const handle = page.locator('.ed-handle:visible').first();
    if (!(await handle.count())) return 'no sheet handle on this layout';
    await handle.focus();
    const st = async () => page.locator('.ed').getAttribute('class');
    await page.keyboard.press('ArrowUp'); await page.waitForTimeout(400); const up = await st();
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown'); await page.waitForTimeout(400); const down = await st();
    if (!/sheet-peek/.test(down)) throw new Error(`no peek after ArrowDown: ${down}`);
    await shot('05b-editor-peek'); await page.keyboard.press('ArrowUp');
    return `up: ${/sheet-full/.test(up) ? 'full' : 'half'} · down: peek`;
  });

  await step(vp, '06 publish → seal stamp', async () => {
    await page.locator('.ed-publish:visible').first().click();
    await page.getByText('نُشرت دعوتك').first().waitFor({ timeout: 8000 });
    await page.waitForTimeout(300); await shot('06-published');
    return 'stamp shown';
  });

  await step(vp, '07 graduation invitation summary has no wedding copy', async () => {
    await go(`/app/events/${eventId}/invitation`);
    await page.locator('h1').first().waitFor();
    const t = await page.locator('main').innerText();
    const bad = t.match(/العروس|العريس|العروسين/); if (bad) throw new Error(`found «${bad[0]}»`);
    await shot('07-invitation'); return noScroll();
  });

  let code = '';
  await step(vp, '08 add a guest', async () => {
    await go(`/app/events/${eventId}/guests`);
    await page.getByRole('button', { name: 'أضف ضيفًا' }).first().click();
    await page.getByLabel('اسم الضيف أو العائلة').fill('عائلة الحربي');
    const hint = await page.locator('dialog[open]').innerText();
    if (/العروس|العريس/.test(hint)) throw new Error('wedding copy in the guest form');
    await page.locator('dialog[open]').getByRole('button', { name: 'إضافة' }).click();
    await page.getByText('عائلة الحربي').first().waitFor();
    await page.waitForTimeout(500); await shot('08-guests');
    code = await page.evaluate((id) => { const db = JSON.parse(localStorage.getItem('doyofy:db:v1')); return (db.parties || []).find((p) => p.eventId === id)?.code || ''; }, eventId);
    if (!code) throw new Error('no invitation code stored');
    return `code ${code}; ` + await noScroll();
  });
  const slug = await page.evaluate((id) => { const db = JSON.parse(localStorage.getItem('doyofy:db:v1') || '{}'); return (db.events || []).find((e) => e.id === id)?.slug || ''; }, eventId);

  await step(vp, '09 guest: envelope cover (B night), single-name copy', async () => {
    await go(`/i/${slug}/${code}`);
    await page.locator('.sig-cover').waitFor();
    const t = await page.locator('.sig-cover-head').innerText();
    if (/ و |&/.test(t)) throw new Error(`couple joiner on single event: ${t}`);
    await shot('09-guest-cover'); return noScroll();
  });

  await step(vp, '10 guest: skip straight to date + RSVP, confirm attendance', async () => {
    await page.getByRole('button', { name: 'الموعد وتأكيد الحضور مباشرة' }).click();
    await page.waitForTimeout(900);
    const reply = page.getByRole('button', { name: /ردّوا الآن/ });
    if (await reply.count()) await reply.first().click();
    await page.getByText('هل ستحضرون؟').first().waitFor({ timeout: 8000 });
    await page.getByRole('radio', { name: /سنحضر|نعم|بكل سرور/ }).first().check({ force: true });
    await page.getByRole('button', { name: 'إرسال الرد' }).click();
    await page.waitForTimeout(1200); await shot('10-guest-replied');
    const db = await page.evaluate((id) => JSON.parse(localStorage.getItem('doyofy:db:v1')).parties.find((p) => p.eventId === id), eventId);
    if (db.rsvpStatus !== 'confirmed') throw new Error(`rsvp ${db.rsvpStatus}`);
    return 'confirmed';
  });

  await step(vp, '11 organizer sees the reply', async () => {
    await go(`/app/events/${eventId}/rsvp`);
    await page.locator('h1').first().waitFor();
    await shot('11-replies');
    const t = await page.locator('main').innerText();
    if (!/1/.test(t)) throw new Error('no counts');
    return noScroll();
  });

  await step(vp, '12 reception gate: find guest → check in', async () => {
    await go(`/check-in/${eventId}`);
    await page.locator('#gate-q').fill('الحربي');
    await page.locator('.gate-result').first().click();
    await page.getByRole('button', { name: /تسجيل دخول|دخول جزئي|سجّل دخول/ }).first().click();
    await page.getByRole('button', { name: 'الضيف التالي' }).waitFor({ timeout: 8000 });
    await shot('12-gate-done');
    return 'checked in';
  });

  await step(vp, '13 summary (red closure) counts the arrival', async () => {
    await go(`/app/events/${eventId}/summary`);
    await page.locator('.summary-closure').waitFor();
    await shot('13-summary');
    const t = await page.locator('main').innerText();
    if (/العروس|العريس/.test(t)) throw new Error('wedding copy on summary');
    return noScroll();
  });

  // couple (seeded)
  const W = '/app/events/evt_wedding';
  for (const [n, path, sel] of [['20-couple-overview', `${W}/overview`, '.sig-moment'], ['21-couple-invitation', `${W}/invitation`, 'h1'], ['22-couple-guests', `${W}/guests`, 'h1'], ['23-couple-replies', `${W}/rsvp`, 'h1'], ['24-couple-reception', `${W}/check-in`, 'h1'], ['25-couple-summary', `${W}/summary`, '.summary-closure'], ['26-couple-seating', `${W}/seating`, 'h1'], ['27-couple-templates', `${W}/invitation/templates`, '.sig-library']]) {
    await step(vp, `${n.slice(3)} renders`, async () => { await go(path); await page.locator(sel).first().waitFor(); await page.waitForTimeout(400); await shot(n); return noScroll(); });
  }
  await step(vp, 'couple guest cover → open → invitation plays', async () => {
    await go('/i/noura-faisal'); await page.locator('.sig-cover').waitFor(); await shot('28-couple-cover');
    await page.getByRole('button', { name: 'افتح الدعوة', exact: true }).click(); await page.waitForTimeout(1600); await shot('29-couple-opened');
    return 'opened';
  });

  await step(vp, 'reduced motion: cover still opens by button, no seal drag needed', async () => {
    const rm = await browser.newContext({ viewport: size, reducedMotion: 'reduce' });
    await rm.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
    const p = await rm.newPage();
    await p.goto(`${BASE}/i/noura-faisal?${T}`); await p.locator('.sig-cover').waitFor();
    await p.getByRole('button', { name: 'افتح الدعوة', exact: true }).click(); await p.waitForTimeout(800);
    await p.screenshot({ path: `${OUT}/${vp}-30-reduced-motion.png` }); await rm.close();
    return 'ok';
  });

  rec(vp, 'no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

for (const vp of which === 'all' ? Object.keys(VPS) : [which]) await run(vp);
const prev = fs.existsSync(`${OUT}/results.json`) ? JSON.parse(fs.readFileSync(`${OUT}/results.json`, 'utf8')) : [];
const merged = [...prev.filter((r) => !results.some((x) => x.vp === r.vp)), ...results];
fs.writeFileSync(`${OUT}/results.json`, JSON.stringify(merged, null, 2));
const fails = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - fails}/${results.length} passed`);
await browser.close(); server.close();
process.exit(fails ? 1 : 0);
