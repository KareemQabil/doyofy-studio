// Final polish: selectors updated; this browser suite was NOT executed in the managed environment.
// node tests/usability-walk.mjs [phone|desk] — walks the 7 usability tasks (docs/TEST_SCENARIOS.md) the way a
// first-time tester would: only visible text/labels, from each task's start screen. Every step saves a
// viewport screenshot (what the tester sees without scrolling) and logs whether the next target was
// visible above the fold, how many scrolls it took, and any console errors. Output: qa/usability/<vp>/.
// This is an automated walkthrough to catch journey problems early; it does not replace real testers.
import fs from 'node:fs';
import { need, chromiumPath, ROOT } from '../tools/lib.mjs';
import { startServer } from '../tools/serve.mjs';

const { chromium } = need('playwright');
const vp = process.argv[2] ?? 'phone';
/** occasion chooser under test: Coverflow (A) or Editorial Rail (B) — node tests/usability-walk.mjs phone rail */
const chooser = process.argv[3] ?? (vp === 'phone' ? 'rail' : 'coverflow');
const SIZE = vp === 'phone' ? { width: 390, height: 844 } : { width: 1366, height: 860 };
const OUT = `${ROOT}/qa/usability/${vp}-${chooser}`;
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const server = await startServer(5380);
const BASE = `http://localhost:${server.address().port}`;
const browser = await chromium.launch({ executablePath: chromiumPath(), args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const log = [];
let n = 0;

async function session(fn, scenario = 'before') {
  const ctx = await browser.newContext({ viewport: SIZE, hasTouch: vp === 'phone', isMobile: vp === 'phone' });
  await ctx.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort()); // unreachable from the sandbox; don't let screenshots wait
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_/.test(m.text())) errors.push(m.text()); });
  await page.goto(`${BASE}/app/events`);
  await page.waitForFunction(() => window.__doyofy);
  await page.evaluate(([s, c]) => { window.__doyofy.prototype.update({ latencyMs: 180, occasionChooser: c }); window.__doyofy.prototype.reset(s); }, [scenario, chooser]);
  await page.goto(`${BASE}/app/events?tools=off`);
  await page.waitForTimeout(600);
  try { await fn(page); } catch (e) { note(page, 'BLOCKED', String(e.message).split('\n')[0]); await snap(page, 'blocked'); }
  if (errors.length) note(page, 'CONSOLE', errors.slice(0, 3).join(' | '));
  await ctx.close();
}

function note(page, kind, text) { log.push({ step: n, kind, text, url: page.url().replace(BASE, '') }); console.log(`${kind.padEnd(8)} ${text}`); }
async function snap(page, label) {
  await page.waitForTimeout(500); n++;
  try { await page.screenshot({ path: `${OUT}/${String(n).padStart(2, '0')}-${label}.png`, timeout: 45000 }); }
  catch { note(page, 'NOSHOT', `${label}: screenshot skipped (software WebGL busy in the sandbox)`); }
}

/** find a target the way a person does: is it visible now? if not, scroll down screen by screen */
async function find(page, locator, what) {
  const loc = locator.first();
  await loc.waitFor({ state: 'attached', timeout: 15000 });
  let scrolls = 0;
  const inView = async () => loc.evaluate((el) => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.width > 0; }).catch(() => false);
  if (!(await inView())) {
    // look up first (headers, step rails), then scan down screen by screen
    const above = await loc.evaluate((el) => el.getBoundingClientRect().bottom < 0).catch(() => false);
    if (above) { await page.evaluate(() => window.scrollTo(0, 0)); scrolls++; await page.waitForTimeout(250); }
  }
  while (!(await inView()) && scrolls < 8) { await page.mouse.wheel(0, SIZE.height * 0.7); await page.waitForTimeout(250); scrolls++; }
  if (!(await inView())) await loc.scrollIntoViewIfNeeded();
  note(page, scrolls ? 'SCROLL' : 'SEEN', `${what}${scrolls ? ` — needed ${scrolls} scroll(s)` : ' — visible without scrolling'}`);
  return loc;
}
async function tap(page, locator, what, label) {
  const loc = await find(page, locator, what);
  await snap(page, label);
  await loc.click();
  await page.waitForTimeout(700);
}

// ------------------------------------------------------------------ U1 create a wedding (owner test task 1)
const d60 = new Date(Date.now() + 60 * 864e5).toISOString().slice(0, 10);
const d75 = new Date(Date.now() + 75 * 864e5).toISOString().slice(0, 10);
await session(async (page) => {
  note(page, 'TASK', `U1 «أنشئ مناسبة زفاف جديدة.» (chooser: ${chooser})`);
  const t0 = Date.now();
  await tap(page, page.locator('a:visible', { hasText: 'مناسبة جديدة' }), 'CTA مناسبة جديدة', 'u1-home');
  await snap(page, 'u1-chooser');
  if (chooser === 'rail') await tap(page, page.getByRole('radio', { name: /^زفاف/ }), 'wedding card on the rail', 'u1-rail');
  else note(page, 'LOOK', `focused occasion: ${await page.locator('.cf-item.is-focused .occ-name').textContent()}`);
  note(page, 'LOOK', `footer: ${(await page.locator('.create-picked').textContent()).trim()}`);
  await tap(page, page.getByRole('button', { name: /^ابدأ تجهيز/ }), 'متابعة', 'u1-picked');
  await page.getByLabel('اسم العروس').fill('دانة');
  await page.getByLabel('اسم العريس').fill('يوسف');
  await find(page, page.getByLabel('التاريخ'), 'date field');
  await page.getByLabel('التاريخ').fill(d60);
  await page.getByLabel('الوقت').fill('19:30');
  await find(page, page.getByLabel('اسم القاعة أو المكان'), 'venue field');
  await page.getByLabel('اسم القاعة أو المكان').fill('قاعة الريم');
  await page.getByLabel('المدينة').fill('جدة');
  note(page, 'LOOK', `event card preview: ${(await page.locator('.ep-title').textContent()).trim()}`);
  await tap(page, page.getByRole('button', { name: 'أنشئ المناسبة' }), 'أنشئ المناسبة (sticky footer)', 'u1-filled');
  await page.waitForURL(/invitation\/templates/);
  await snap(page, 'u1-gallery');
  note(page, 'DONE', `U1 event created in ${Math.round((Date.now() - t0) / 1000)} s of scripted time; lands on: ${await page.locator('h2.t-display').first().textContent()}`);

  // ---------------------------------------------------------------- U3 pick a template and see it full size
  note(page, 'TASK', 'U3 «اختار قالب يعجبك واعرضه بالحجم الكامل.»');
  note(page, 'LOOK', `chips: ${(await page.locator('.tg-chips .chip').allTextContents()).join(' | ')}`);
  await tap(page, page.getByRole('button', { name: 'معاينة قالب أقواس القصر' }), 'template «أقواس القصر»', 'u3-tile');
  await page.locator('dialog[open]').getByRole('heading', { name: 'أقواس القصر' }).waitFor();
  await page.waitForFunction(() => window.__studio?.sm?.state, null, { timeout: 60000 });
  await page.waitForTimeout(2500);
  await snap(page, 'u3-preview');
  await tap(page, page.getByRole('button', { name: 'استخدم هذا القالب' }), 'استخدم هذا القالب', 'u3-use');
  await page.waitForURL(/invitation\/design/);
  await page.getByText('تم الحفظ').first().waitFor({ timeout: 15000 });
  await snap(page, 'u3-editor');
  note(page, 'DONE', 'U3 template previewed with the couple’s names, then applied');

  // ---------------------------------------------------------------- U4 names, date, style → view as guest
  note(page, 'TASK', 'U4 «غيّر الأسماء والتاريخ والستايل ثم اعرض الدعوة كضيف.»');
  note(page, 'LOOK', `editor sections: ${(await page.getByRole('tab').allTextContents()).join(' | ')}`);
  const nameField = await find(page, page.getByLabel('اسم العروس'), 'name on the card (المحتوى)');
  await nameField.fill('دانة الحربي');
  await page.getByText('تم الحفظ').first().waitFor({ timeout: 15000 });
  await tap(page, page.getByRole('tab', { name: /المناسبة/ }), 'tab تفاصيل المناسبة (the date lives here?)', 'u4-tabs');
  await page.getByLabel('التاريخ').fill(d75);
  await snap(page, 'u4-date');
  await tap(page, page.getByRole('button', { name: 'احفظ بيانات المناسبة' }), 'احفظ بيانات المناسبة', 'u4-date-save');
  await page.locator('.ed-saved').waitFor({ timeout: 15000 });
  await tap(page, page.getByRole('tab', { name: /الشكل/ }), 'tab التصميم', 'u4-design');
  await tap(page, page.getByRole('radio', { name: /ألوان مائية وردية/ }), 'card «ألوان مائية وردية»', 'u4-card');
  await page.getByText('تم الحفظ').first().waitFor({ timeout: 15000 });
  if (vp === 'phone') {
    await tap(page, page.locator('.ed-dock').getByRole('button', { name: /معاينة/ }), 'mode معاينة (dock)', 'u4-mode');
    await tap(page, page.locator('.ed-stage-tools').getByRole('button', { name: 'كضيف' }), 'كضيف', 'u4-live');
  } else {
    await tap(page, page.getByRole('button', { name: 'معاينة كضيف' }), 'معاينة كضيف (top bar)', 'u4-before-preview');
  }
  await page.getByText('معاينة — هكذا يراها الضيف').waitFor();
  await page.waitForFunction(() => window.__studio?.sm?.state, null, { timeout: 60000 });
  await page.waitForTimeout(2500);
  await snap(page, 'u4-guest');
  const credit = await page.evaluate(() => document.querySelector('.st-credit, .st-face-slot')?.textContent?.replace(/\s+/g, ' ').trim() ?? '');
  note(page, 'DONE', `U4 guest preview shows: ${credit.slice(0, 60)}`);
  await tap(page, page.getByRole('link', { name: 'إغلاق المعاينة' }), 'إغلاق المعاينة', 'u4-close');
  await page.waitForSelector('.ed');

  // ---------------------------------------------------------------- U5 change template without losing data
  note(page, 'TASK', 'U5 «ارجع وغير القالب من غير ما تضيع بيانات المناسبة.»');
  if (vp === 'phone') await page.locator('.ed-dock').getByRole('button', { name: /تعديل/ }).click();
  await tap(page, page.getByRole('tab', { name: /الشكل/ }), 'tab التصميم', 'u5-design');
  await tap(page, page.getByRole('button', { name: 'تغيير القالب' }), 'تغيير القالب', 'u5-change');
  await page.waitForURL(/invitation\/templates/);
  note(page, 'LOOK', `gallery says: ${(await page.locator('.tg-sub').textContent()).trim()}`);
  await tap(page, page.getByRole('button', { name: 'معاينة قالب ليلة النجوم' }), 'template «ليلة النجوم»', 'u5-gallery');
  await tap(page, page.getByRole('button', { name: 'استخدم هذا القالب' }), 'استخدم هذا القالب', 'u5-use');
  await page.waitForURL(/invitation\/design/);
  const id = page.url().split('/events/')[1].split('/')[0];
  const kept = await page.evaluate(async (eid) => {
    const s = window.__doyofy.services; const d = (await s.invitations.get(eid)).draft; const e = await s.events.get(eid);
    return { name: d.displayNames.a, card: d.cardId, date: e.date };
  }, id);
  await snap(page, 'u5-editor');
  note(page, kept.name === 'دانة الحربي' && kept.date === d75 ? 'DONE' : 'ISSUE', `U5 after the switch: card ${kept.card}, name on card «${kept.name}», event date ${kept.date}`);
});

// ------------------------------------------------------------------ U2 see the other occasion types, pick a different one
await session(async (page) => {
  note(page, 'TASK', `U2 «شوف باقي أنواع المناسبات واختار مناسبة مختلفة.» (chooser: ${chooser})`);
  await tap(page, page.locator('a:visible', { hasText: 'مناسبة جديدة' }), 'CTA مناسبة جديدة', 'u2-home');
  if (chooser === 'rail') {
    await tap(page, page.getByRole('button', { name: /عرض كل المناسبات/ }), 'عرض كل المناسبات', 'u2-rail');
    await snap(page, 'u2-sheet');
    const groups = await page.locator('dialog[open] .rl-group-h').allTextContents();
    note(page, 'LOOK', `groups: ${groups.join(' | ')}`);
    await tap(page, page.locator('dialog[open]').getByRole('radio', { name: /مولود/ }), 'مولود (in the sheet)', 'u2-pick');
  } else {
    let steps = 0;
    while (steps < 14 && (await page.locator('.cf-item.is-focused .occ-name').textContent()) !== 'مولود') {
      await page.getByRole('button', { name: 'المناسبة التالية' }).click(); await page.waitForTimeout(420); steps++;
      if (steps === 3) await snap(page, 'u2-browsing');
    }
    note(page, steps < 14 ? 'LOOK' : 'ISSUE', `reached «مولود» after ${steps} taps on «المناسبة التالية» (or swipes)`);
  }
  note(page, 'LOOK', `footer: ${(await page.locator('.create-picked').textContent()).trim()}`);
  await tap(page, page.getByRole('button', { name: /^ابدأ تجهيز/ }), 'متابعة', 'u2-picked');
  const label = await page.locator('.field-label').first().textContent();
  await snap(page, 'u2-essentials');
  note(page, 'DONE', `U2 occasion changed; first field now asks for: ${label.replace('*', '').trim()}`);
});

// ------------------------------------------------------------------ T3 import 20 guests, handle duplicate
await session(async (page) => {
  note(page, 'TASK', 'T3 «أضف 20 ضيفًا من ملف، وتعامل مع مشكلة رقم مكرر.» (start: wedding guests)');
  await page.goto(`${BASE}/app/events/evt_wedding/guests?tools=off`);
  await page.waitForSelector('.guest-table');
  await tap(page, page.locator('a:visible', { hasText: 'استيراد من ملف' }), 'استيراد من ملف', 't3-guests');
  await tap(page, page.getByRole('button', { name: 'استخدم الملف النموذجي' }), 'sample file button', 't3-source');
  await snap(page, 't3-mapping');
  if (await page.getByRole('button', { name: 'راجع الأسماء' }).isVisible()) await tap(page, page.getByRole('button', { name: 'راجع الأسماء' }), 'راجع الأسماء', 't3-mapping-ok');
  await snap(page, 't3-review');
  const dupRow = page.locator('.import-row', { hasText: 'مكرر' });
  await find(page, dupRow, 'the duplicate-number row');
  await snap(page, 't3-dup-row');
  await tap(page, dupRow.getByRole('button', { name: /لا تضفه مرتين/ }), 'decision: لا تضفه مرتين', 't3-dup-decide');
  const existing = page.locator('.import-row.is-blocked', { hasText: 'موجود في القائمة' });
  if (await existing.count()) await existing.getByRole('button', { name: /لا تضفه مرتين/ }).click();
  const r12 = page.locator('.import-row.is-blocked', { hasText: 'الاسم فارغ' });
  if (await r12.count()) { await r12.getByLabel('اكتب الاسم').fill('رنا العتيبي'); await r12.getByLabel('اكتب الاسم').press('Enter'); }
  const r15 = page.locator('.import-row.is-blocked', { hasText: 'رقم غير صحيح' });
  if (await r15.count()) await r15.getByRole('button', { name: 'استورد بدون رقم' }).click();
  await page.waitForTimeout(400);
  await snap(page, 't3-resolved');
  const confirm = page.getByRole('button', { name: /أضف \d+/ });
  note(page, 'LOOK', `confirm button: «${(await confirm.textContent()).trim()}» disabled=${await confirm.isDisabled()}`);
  await confirm.click();
  await page.getByRole('heading', { name: /تمت إضافة/ }).waitFor();
  await snap(page, 't3-result');
  note(page, 'DONE', `T3 ${await page.getByRole('heading', { name: /تمت إضافة/ }).textContent()}`);
});

// ------------------------------------------------------------------ T4 who hasn't replied, open one
await session(async (page) => {
  note(page, 'TASK', 'T4 «اعرف مين لسه ما ردش، وافتح بيانات ضيف منهم.» (start: wedding overview)');
  await page.goto(`${BASE}/app/events/evt_wedding/overview?tools=off`);
  await page.waitForSelector('.hero');
  await snap(page, 't4-overview');
  const counts = await page.locator('.counts .stat').allTextContents();
  note(page, 'LOOK', `counts: ${counts.map((c) => c.replace(/\s+/g, ' ')).join(' | ')}`);
  const item = page.locator('.attention-item', { hasText: 'لم ترد بعد' });
  await tap(page, item.getByRole('link'), 'attention: «12 دعوة لم ترد بعد» → اعرض', 't4-attention');
  await page.waitForSelector('.guest-table');
  await snap(page, 't4-pending-list');
  note(page, 'LOOK', `active filter: ${await page.locator('.chip.is-on').textContent()}`);
  await tap(page, page.locator('.gt-open').first(), 'first pending guest', 't4-list');
  await snap(page, 't4-drawer');
  note(page, 'DONE', `T4 drawer: ${await page.locator('dialog[open] .dialog-title').textContent()}`);
});

// ------------------------------------------------------------------ T5 seat a confirmed guest
await session(async (page) => {
  note(page, 'TASK', 'T5 «وزّع ضيفًا مؤكدًا على طاولة.» (start: wedding overview)');
  await page.goto(`${BASE}/app/events/evt_wedding/overview?tools=off`);
  await page.waitForSelector('.hero');
  await tap(page, page.locator('a:visible', { hasText: 'الطاولات' }), 'nav الجلوس', 't5-overview');
  await snap(page, 't5-seating');
  const pool = page.locator('.pool-item').first();
  const who = await pool.locator('.t-bold').textContent();
  await tap(page, pool.getByRole('button', { name: 'اختر طاولة' }), `اختر طاولة for ${who}`, 't5-pool');
  await snap(page, 't5-pick');
  await page.locator('dialog[open] .pick-item', { hasText: 'طاولة 6' }).click();
  await page.waitForTimeout(800);
  await snap(page, 't5-after');
  note(page, 'DONE', `T5 ${who} seated: ${await page.locator('.table-card', { hasText: who }).count() > 0}`);
});

// ------------------------------------------------------------------ T6 + T7 event day
await session(async (page) => {
  note(page, 'TASK', 'T6 «ضيف وصل ومعاه شخصان. سجّل دخولهم.» (event-day scenario; guest: عائلة الدوسري)');
  await page.goto(`${BASE}/app/events/evt_wedding/overview?tools=off`);
  await page.waitForSelector('.hero');
  await tap(page, page.locator('.moment-copy .btn'), 'next action افتح الاستقبال', 't6-overview');
  await snap(page, 't6-gate');
  await page.fill('#gate-q', 'الدوسري');
  await page.waitForTimeout(400);
  await snap(page, 't6-search');
  await tap(page, page.locator('.gate-result', { hasText: 'عائلة الدوسري' }), 'result عائلة الدوسري', 't6-results');
  await snap(page, 't6-party');
  note(page, 'LOOK', `counter starts at ${await page.locator('.stepper-value').textContent()}; button «${(await page.locator('.gate-actions .btn').first().textContent()).trim()}»`);
  await page.locator('.gate-actions .btn').first().click();
  await page.waitForTimeout(800);
  await snap(page, 't6-done');
  note(page, 'DONE', `T6 ${await page.locator('.gate-h').textContent()} · ${await page.locator('.gate-done-line').textContent()}`);

  note(page, 'TASK', 'T7 «الضيف حضر جزء من مجموعته والباقي هييجي بعدين.» (عائلة الشمري: 4 confirmed, 2 now)');
  await page.getByRole('button', { name: 'الضيف التالي' }).click();
  await page.fill('#gate-q', 'الشمري');
  await page.waitForTimeout(400);
  await snap(page, 't7-search');
  await page.locator('.gate-result', { hasText: 'عائلة الشمري' }).click();
  await page.waitForTimeout(500);
  const minus = page.getByRole('button', { name: /إنقاص/ });
  await minus.click(); await minus.click();
  await snap(page, 't7-two-now');
  note(page, 'LOOK', `hint: ${await page.locator('.gate-hint').textContent().catch(() => '—')} · button «${(await page.locator('.gate-actions .btn').first().textContent()).trim()}»`);
  await page.locator('.gate-actions .btn').first().click();
  await page.waitForTimeout(800);
  await snap(page, 't7-partial-done');
  await page.getByRole('button', { name: 'الضيف التالي' }).click();
  await page.fill('#gate-q', 'الشمري');
  await page.waitForTimeout(400);
  await snap(page, 't7-later-search');
  await page.locator('.gate-result', { hasText: 'عائلة الشمري' }).click();
  await page.waitForTimeout(500);
  await snap(page, 't7-later-party');
  note(page, 'LOOK', `later: counter ${await page.locator('.stepper-value').textContent()} · button «${(await page.locator('.gate-actions .btn').first().textContent()).trim()}»`);
  await page.locator('.gate-actions .btn').first().click();
  await page.waitForTimeout(800);
  await snap(page, 't7-complete');
  note(page, 'DONE', `T7 ${await page.locator('.gate-done-line').textContent()}`);
}, 'event_day');

fs.writeFileSync(`${OUT}/log.json`, JSON.stringify(log, null, 2));
await browser.close(); server.close();
