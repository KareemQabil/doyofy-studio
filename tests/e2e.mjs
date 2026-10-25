// Final polish: selectors updated; this browser suite was NOT executed in the managed environment.
// node tests/e2e.mjs [desk|phone|all] — Doyofy acceptance journey (spec §38) in a real browser.
// Create a wedding → overview → design & publish the invitation (Invitation Studio) → add + import guests
// → open the guest link → RSVP in the invitation → organizer sees it → tables → gate: partial + full check-in
// → counts & activity update. Results: qa/e2e-results.json, screenshots in qa/screenshots/e2e/.
import fs from 'node:fs';
import { need, chromiumPath, ROOT } from '../tools/lib.mjs';
import { startServer } from '../tools/serve.mjs';

const { chromium } = need('playwright');
const which = process.argv[2] ?? 'all';
const OUT = `${ROOT}/qa/screenshots/e2e`;
fs.mkdirSync(OUT, { recursive: true });
const server = await startServer(5370);
const BASE = `http://localhost:${server.address().port}`;
const browser = await chromium.launch({ executablePath: chromiumPath(), args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const results = [];
const IGNORE = /fonts\.g|ERR_TUNNEL|ERR_CONNECTION|wa\.me|calendar\.google|maps\.google/;

function record(vp, name, ok, detail = '') { results.push({ vp, name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  [${vp}] ${name}${detail ? '  — ' + detail : ''}`); }

async function journey(vp, size) {
  const ctx = await browser.newContext({ viewport: size, permissions: ['clipboard-read', 'clipboard-write'] });
  await ctx.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort()); // unreachable from the sandbox; a hanging font request stalls screenshots
  const page = await ctx.newPage();
  const errors = [];
  const watch = (p) => { p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && !IGNORE.test(m.text()) && !IGNORE.test(m.location()?.url ?? '')) errors.push(m.text()); }); };
  watch(page);
  const shot = (n) => page.screenshot({ path: `${OUT}/${vp}-${n}.png`, fullPage: false });
  const phone = size.width < 600;
  const nav = async (label) => { if(label==='نظرة عامة')label=phone?'المناسبة':'نظرة عامة'; await page.locator('a:visible', { hasText: label }).first().click(); };
  const step = async (name, fn) => { try { const d = await fn(); record(vp, name, true, d ?? ''); } catch (e) { { const m = String(e.message || e); record(vp, name, false, m.split('\n')[0] + ((m.match(/waiting for (.+)/) || [])[1] ? ` (waiting for ${m.match(/waiting for (.+)/)[1]})` : '')); } await shot(`fail-${results.length}`); } };
  const date = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);

  // 1-3 · open Doyofy, create a wedding, land on the overview
  await step('1. open Doyofy: events home', async () => {
    await page.goto(`${BASE}/`);
    await page.getByRole('heading', { name: 'مناسباتي' }).waitFor();
    return `${await page.locator('.occasion-event').count()} seeded events`;
  });
  let eventId = '';
  // desktop tests the Coverflow chooser, the phone tests the Editorial Rail (same catalogue)
  const chooser = phone ? 'rail' : 'coverflow';
  await step(`2a. choose the occasion (${chooser})`, async () => {
    await page.goto(`${BASE}/app/events?chooser=${chooser}`);
    await page.locator('a:visible', { hasText: 'مناسبة جديدة' }).first().click();
    await page.getByRole('heading', { name: 'كل فرحة تبدأ من هنا.' }).waitFor();
    if (chooser === 'coverflow') {
      const track = page.getByRole('listbox', { name: 'أنواع المناسبات' });
      if (await track.getByRole('option').count() < 12) throw new Error('fewer than 12 occasions');
      await track.focus();
      await page.keyboard.press('ArrowLeft');                                   // RTL: ← = next occasion
      await page.waitForFunction(() => document.querySelector('[role=option][aria-selected=true]')?.id === 'occ-engagement');
      await page.keyboard.press('ArrowRight');
      await page.waitForFunction(() => document.querySelector('[role=option][aria-selected=true]')?.id === 'occ-wedding');
    } else {
      await page.getByRole('button', { name: /عرض كل المناسبات/ }).click();
      const sheet = page.locator('dialog[open]');
      if (await sheet.getByRole('radio').count() < 12) throw new Error('fewer than 12 occasions in the sheet');
      await sheet.getByRole('radio', { name: /زفاف/ }).click();
      await page.locator('dialog[open]').waitFor({ state: 'detached' }).catch(() => {});
    }
    await page.getByRole('button', { name: /^ابدأ تجهيز زفاف/ }).waitFor();
    await shot('02-occasion');
  });
  await step('2b. essentials → create → template gallery', async () => {
    await page.getByRole('button', { name: /^ابدأ تجهيز/ }).click();
    await page.getByRole('heading', { name: 'زفاف تليق بك.' }).waitFor();
    if (await page.locator('[aria-invalid="true"]').count()) throw new Error('errors shown before submitting');
    await page.getByRole('button', { name: 'أنشئ المناسبة' }).click();          // empty → validation, nothing created
    await page.getByText('اكتب الاسم الأول').waitFor();
    await page.getByLabel('اسم العروس').fill('لينا');
    await page.getByLabel('اسم العريس').fill('عمر');
    await page.getByRole('button', { name: /أضف الأسماء بالإنجليزية/ }).click();
    const en = page.getByLabel('بالإنجليزية');
    await en.nth(0).fill('Lina'); await en.nth(1).fill('Omar');
    await page.getByLabel('التاريخ').fill(date);
    await page.getByLabel('الوقت').fill('20:30');
    await page.getByLabel('اسم القاعة أو المكان').fill('قاعة النخيل');
    await page.getByLabel('المدينة').fill('الرياض');
    await page.locator('.ep-title', { hasText: 'زفاف لينا وعمر' }).waitFor();      // the event card takes shape
    await page.getByRole('button', { name: 'أنشئ المناسبة' }).click();
    await page.waitForURL(/\/invitation\/templates\?first=1$/);
    eventId = page.url().split('/events/')[1].split('/')[0];
    return eventId;
  });

  // 3-5 · gallery → preview → use template → editor (content, design, motion, event data) → publish → guest preview
  await step('3. gallery: curated presets with the event’s names; preview; use template', async () => {
    await page.getByRole('heading', { name: 'دعوة تشبه حكايتك.' }).waitFor();
    const tiles = page.locator('.tg-tile');
    if (await tiles.count() < 6) throw new Error(`tiles ${await tiles.count()}`);
    await page.waitForFunction(() => /لينا/.test(document.querySelector('.tg-tile .tpl-thumb')?.textContent || ''));
    const pick = phone ? 'دانتيل الصباح' : 'ليلة الشموع';
    await page.getByRole('button', { name: `معاينة قالب ${pick}` }).click();
    await page.locator('dialog[open]').getByRole('heading', { name: pick }).waitFor();
    await page.getByRole('button', { name: 'شاهد التجربة' }).click();
    await page.waitForFunction(() => window.__studio?.sm?.state, null, { timeout: 60000 });
    await shot('03-preview');
    await page.getByRole('button', { name: 'استخدم هذا القالب' }).click();
    await page.waitForURL(/\/invitation\/design$/);
    await page.getByText('تم الحفظ').first().waitFor({ timeout: 15000 });
    return pick;
  });
  await step('4a. editor · content: the message autosaves', async () => {
    await page.getByRole('tab', { name: /المحتوى/ }).click();
    await page.getByLabel('بالعربية').fill('يسعدنا حضوركم ليلة فرحنا.');
    await page.getByText('تم الحفظ').first().waitFor({ timeout: 15000 });
    const saved = await page.evaluate(async (id) => (await window.__doyofy.services.invitations.get(id))?.draft.message.ar, eventId);
    if (saved !== 'يسعدنا حضوركم ليلة فرحنا.') throw new Error(`draft message: ${saved}`);
  });
  await step('4b. editor · design + motion: card changes in place; experience switch', async () => {
    await page.getByRole('tab', { name: /الشكل/ }).click();
    await page.getByRole('radio', { name: /زمرّد آرت ديكو/ }).click();
    await page.getByText('تم الحفظ').first().waitFor({ timeout: 15000 });
    await page.getByRole('tab', { name: /التجربة/ }).click();
    if (phone) { await page.getByRole('radio', { name: /رسوم مسطّحة/ }).click(); await page.getByRole('radio', { name: /ثابتة/ }).click(); }
    await page.getByText('تم الحفظ').first().waitFor({ timeout: 15000 });
    const d = await page.evaluate(async (id) => (await window.__doyofy.services.invitations.get(id))?.draft, eventId);
    if (d.cardId !== 'emerald') throw new Error(`card ${d.cardId}`);
    if (phone && (d.experience.dimension !== '2d' || d.experience.motion !== 'static')) throw new Error(JSON.stringify(d.experience));
    if (d.message.ar !== 'يسعدنا حضوركم ليلة فرحنا.') throw new Error('template/design change lost the text');
  });
  await step('4c. editor · event details: saved to the EVENT (with notice)', async () => {
    await page.getByRole('tab', { name: /المناسبة/ }).click();
    await page.getByText('هذه بيانات المناسبة نفسها').waitFor();
    await page.getByLabel('الوقت').fill('21:00');
    await page.getByLabel(/رابط الخريطة/).fill('https://maps.google.com/?q=Riyadh');
    await page.getByRole('button', { name: 'احفظ بيانات المناسبة' }).click();
    await page.locator('.ed-saved').waitFor({ timeout: 15000 });
    const ev = await page.evaluate(async (id) => await window.__doyofy.services.events.get(id), eventId);
    if (ev.time !== '21:00' || !ev.venue.mapUrl) throw new Error(`event ${ev.time} ${ev.venue.mapUrl}`);
  });
  await step('5a. publish from the editor', async () => {
    await page.locator('.ed-publish:visible').click();
    await page.locator('.ed-publish:visible', { hasText: 'إلى الضيوف' }).waitFor({ timeout: 15000 });
    await shot('05-published');
  });
  await step('5b. preview as guest, back to the same section, close', async () => {
    if (phone) { await page.getByRole('button', { name: /معاينة/ }).last().click(); await page.locator('.ed-stage-tools').getByRole('button', { name: 'كضيف' }).click(); }
    else await page.getByRole('button', { name: 'معاينة كضيف' }).click();
    await page.getByText('معاينة — هكذا يراها الضيف').waitFor();
    await page.waitForFunction(() => window.__studio?.sm?.state, null, { timeout: 60000 });
    await page.getByRole('link', { name: 'إغلاق المعاينة' }).click();
    await page.waitForSelector('.ed');
    await page.getByRole('button', { name: 'حفظ وإغلاق المحرر' }).click();
    await page.getByRole('heading', { name: 'الدعوة', exact: true }).waitFor();
    await page.getByText('منشورة', { exact: true }).first().waitFor();
    const slug = await page.evaluate(async (id) => (await window.__doyofy.services.events.get(id)).slug, eventId);
    if (slug !== 'lina-omar') throw new Error(`guest link slug ${slug}`);
    return `/i/${slug}`;
  });
  await step('5c. overview: next action moves on to guests', async () => {
    await nav('نظرة عامة');
    await page.getByRole('heading', { name: 'زفاف لينا وعمر' }).waitFor();
    const cta = page.locator('.moment-copy .btn');
    if ((await cta.textContent()).trim() !== 'أضف الضيوف') throw new Error(await cta.textContent());
    if (await page.locator('.check-item').count() !== 7) throw new Error('checklist items');
    await shot('05-overview');
  });

  // 6 · guests: add one, import the sample file with issues
  await step('6a. add a guest', async () => {
    await nav('الضيوف');
    await page.getByRole('heading', { name: 'لا ضيوف بعد' }).waitFor();
    await page.getByRole('button', { name: 'أضف ضيفًا' }).first().click();
    await page.getByLabel(/اسم الضيف أو العائلة/).fill('عائلة الشهري');
    await page.getByLabel(/رقم الجوال/).fill('0559876543');
    await page.getByRole('button', { name: 'زيادة العدد المسموح' }).click();
    await page.getByRole('button', { name: 'إضافة', exact: true }).click();
    await page.locator('.gt-open', { hasText: 'عائلة الشهري' }).waitFor();
  });
  await step('6b. import sample file: issues highlighted, resolved, imported', async () => {
    await page.locator('a:visible', { hasText: 'استيراد من ملف' }).first().click();
    await page.getByRole('button', { name: 'استخدم الملف النموذجي' }).click();
    if (await page.getByRole('button', { name: 'راجع الأسماء' }).isVisible()) await page.getByRole('button', { name: 'راجع الأسماء' }).click();
    const blocked = Number(await page.locator('.import-summary .is-blocked strong').textContent());
    if (blocked < 3) throw new Error(`blocked ${blocked}`);
    if (!(await page.getByRole('button', { name: /أضف \d+/ }).isDisabled())) throw new Error('confirm should be disabled');
    // resolve: fix the missing name, skip the duplicate, drop the malformed phone
    const row12 = page.locator('.import-row', { hasText: 'صف 12' });
    await row12.getByLabel('اكتب الاسم').fill('رنا العتيبي'); await row12.getByLabel('اكتب الاسم').press('Enter');
    await page.locator('.import-row', { hasText: 'صف 7' }).getByRole('button', { name: /لا تضفه مرتين/ }).click();
    await page.locator('.import-row', { hasText: 'صف 15' }).getByRole('button', { name: 'استورد بدون رقم' }).click();
    await page.getByRole('button', { name: 'تخطَّ كل ما يحتاج قرارًا' }).click().catch(() => {});
    await shot('06-import-review');
    await page.getByRole('button', { name: /أضف \d+/ }).click();
    await page.getByRole('heading', { name: /تمت إضافة/ }).waitFor();
    const h = await page.getByRole('heading', { name: /تمت إضافة/ }).textContent();
    await page.getByRole('link', { name: 'اعرض قائمة الضيوف' }).click();
    return h;
  });

  // 7-9 · guest opens their link, RSVPs inside the invitation, organizer sees it
  let guestLink = '';
  await step('7. open the guest’s personal link (drawer) and share (simulated)', async () => {
    await page.locator('.gt-open', { hasText: 'عائلة الشهري' }).click();
    guestLink = await page.locator('dialog[open] .copy-input').inputValue();
    await page.getByText('خيارات المشاركة والمتابعة', { exact: true }).click();
    await page.getByRole('button', { name: /جرّب الإرسال/ }).click();
    await page.getByText('تم الإرسال (محاكاة)', { exact: true }).first().waitFor();
    await page.keyboard.press('Escape');
    return guestLink;
  });
  const guest = await ctx.newPage(); watch(guest);
  await step('8. guest: invitation → RSVP (name from link, count bounded) → hub with QR', async () => {
    let at = 'goto';
    try {
    await guest.goto(guestLink);
    at = 'intro-or-card'; await guest.waitForFunction(() => ['card', 'intro'].includes(window.__studio?.sm?.state), null, { timeout: 60000 });
    at = 'card'; await guest.waitForFunction(() => window.__studio.sm.state === 'card', null, { timeout: 30000 });
    await guest.click('.st-cardbtn', { force: true });
    at = 'pages'; await guest.waitForFunction(() => window.__studio.sm.state === 'pages', null, { timeout: 20000 });
    for (let i = 0; i < 4; i++) { await guest.click('[data-act="next"]', { force: true }); await guest.waitForTimeout(450); }
    if ((await guest.inputValue('#st-name')) !== 'عائلة الشهري') throw new Error('name not prefilled');
    await guest.click('[data-attend="yes"]', { force: true });
    for (let i = 0; i < 5; i++) await guest.click('[data-guests="1"]', { force: true });
    const shown = await guest.textContent('.rsvp-guests');
    if (shown !== '3') throw new Error(`count not bounded: ${shown}`);
    await guest.click('.st-page button[type="submit"]', { force: true });
    at = 'done'; await guest.waitForFunction(() => window.__studio.sm.state === 'done', null, { timeout: 30000 });
    await guest.click('[data-act="done-action"]', { force: true });
    await guest.getByRole('heading', { name: 'حضوركم مؤكد' }).waitFor();
    await guest.locator('svg.qr').waitFor();
    at = 'screenshot'; await guest.screenshot({ path: `${OUT}/${vp}-08-hub.png`, fullPage: true });
    } catch (e) { throw new Error(`[at ${at}; state ${await guest.evaluate(() => window.__studio?.sm?.state).catch(() => '?')}] ${e.message}`); }
  });
  await step('9. organizer sees the reply without reloading', async () => {
    await page.bringToFront();
    await nav('نظرة عامة');
    await page.locator('.timeline-item', { hasText: 'عائلة الشهري أكد الحضور' }).waitFor({ timeout: 10000 });
    const v = await page.locator('.event-facts dd strong').first().textContent();
    if (v.trim() !== '3') throw new Error(`confirmed people ${v}`);
    await shot('09-overview-after-rsvp');
  });

  // 10 · seating
  await step('10. create tables and seat the confirmed guest', async () => {
    await nav('الطاولات');
    await page.getByRole('button', { name: /أضف طاولة واحدة|أضف \d/ }).click();
    await page.locator('.pool-item', { hasText: 'عائلة الشهري' }).getByRole('button', { name: 'اختر طاولة' }).click();
    await page.locator('dialog[open] .pick-item', { hasText: 'طاولة 1' }).click();
    await page.getByText('تم توزيع كل الضيوف المؤكدين').waitFor({ timeout: 15000 }).catch(async (e) => {
      const dump = await page.evaluate(() => ({ dialog: !!document.querySelector('dialog[open]'), pool: [...document.querySelectorAll('.pool-item')].map((x) => x.textContent.trim().slice(0, 60)), toasts: [...document.querySelectorAll('.toast')].map((x) => x.textContent), banners: [...document.querySelectorAll('.banner')].map((x) => x.textContent.slice(0, 80)) }));
      throw new Error(`${e.message.split('\n')[0]} DUMP ${JSON.stringify(dump)}`);
    });
    await shot('10-seating');
  });

  // 11-13 · gate mode: find by search, partial, then scan code for the rest; exception: unknown code
  const code = guestLink.split('/').pop();
  await step('11. open check-in mode (gate)', async () => {
    await page.goto(`${BASE}/app/events/${eventId}/check-in`);
    await page.locator('a:visible', { hasText: 'افتح الاستقبال' }).first().click();
    await page.getByText('مسح رمز QR').waitFor();
  });
  await step('12-13a. search the guest; partial check-in 2 of 3', async () => {
    await page.fill('#gate-q', 'الشهري');
    await page.locator('.gate-result', { hasText: 'عائلة الشهري' }).click();
    await page.getByRole('button', { name: 'إنقاص كم شخصًا يدخل الآن؟' }).click();
    await page.getByRole('button', { name: /دخول جزئي/ }).click();
    await page.getByText(/الباقون لاحقًا/).waitFor();
    await shot('13-partial');
    await page.getByRole('button', { name: 'الضيف التالي' }).click();
  });
  await step('13b. scan the QR code later: remaining 1 → complete', async () => {
    await page.click('.gate-scan');
    await page.locator('dialog[open] input').fill(code);
    await page.getByRole('button', { name: 'تحقق' }).click();
    await page.getByRole('button', { name: /تسجيل دخول شخص واحد/ }).click();
    await page.getByRole('heading', { name: 'أهلًا وسهلًا' }).waitFor();
  });
  await step('13c. exception: unknown code is not silently accepted', async () => {
    await page.getByRole('button', { name: 'الضيف التالي' }).click();
    await page.click('.gate-scan');
    await page.getByRole('button', { name: 'رمز غير موجود' }).click();
    await page.getByRole('heading', { name: 'لم نجد هذا الرمز' }).waitFor();
  });
  await step('14. overview counts and activity reflect check-in', async () => {
    await page.goto(`${BASE}/app/events/${eventId}/overview`);
    const v = await page.evaluate(async id => (await window.__doyofy.services.parties.list(id)).reduce((n,p)=>n+p.checkedInCount,0),eventId);
    if (v !== 3) throw new Error(`checked in ${v}`);
    await page.locator('.timeline-item', { hasText: 'عائلة الشهري' }).first().waitFor();
    await shot('14-overview-final');
  });
  await step('no console errors during the journey', async () => { if (errors.length) throw new Error(errors.slice(0, 3).join(' | ')); });
  await ctx.close();
}

if (which === 'all' || which === 'desk') await journey('desk', { width: 1366, height: 900 });
if (which === 'all' || which === 'phone') await journey('phone', { width: 390, height: 844 });

fs.writeFileSync(`${ROOT}/qa/e2e-results.json`, JSON.stringify({ at: new Date().toISOString(), passed: results.filter((r) => r.ok).length, total: results.length, results }, null, 2));
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} passed`);
await browser.close(); server.close();
process.exit(results.every((r) => r.ok) ? 0 : 1);
