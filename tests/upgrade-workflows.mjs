// Focused acceptance for the UX upgrade. Build first, then node tests/upgrade-workflows.mjs.
// No external messages or real payments. The service hook is used only for fixture setup/state assertions.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { need, chromiumPath, ROOT } from '../tools/lib.mjs';
import { startServer } from '../tools/serve.mjs';

const OUT = `${ROOT}/qa/upgrade`;
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const server = await startServer(Number(process.env.UPGRADE_PORT) || 5392);
let browser;
const watchdog = setTimeout(() => { console.error('Upgrade acceptance exceeded its 165-second budget.'); process.exit(1); }, 165000);
const base = `http://localhost:${server.address().port}`;
const { chromium } = need('playwright');
const wav = () => {
  const count = 4410, data = Buffer.alloc(44 + count * 2);
  data.write('RIFF'); data.writeUInt32LE(data.length - 8, 4); data.write('WAVEfmt ', 8); data.writeUInt32LE(16, 16);
  data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22); data.writeUInt32LE(22050, 24); data.writeUInt32LE(44100, 28);
  data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34); data.write('data', 36); data.writeUInt32LE(count * 2, 40);
  for (let i = 0; i < count; i++) data.writeInt16LE(Math.round(Math.sin(i * 2 * Math.PI * 440 / 22050) * 1500), 44 + i * 2);
  return data;
};
async function go(page, path) {
  await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.__doyofy);
  await page.evaluate(() => window.__doyofy.prototype.update({ latencyMs: 0 }));
}
async function cleanViewport(page) {
  const widths = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  assert.ok(widths[0] <= widths[1] + 1, `horizontal overflow: ${widths.join('/')}`);
}
async function scenario(name, viewport, run) {
  const context = await browser.newContext({ viewport, locale: 'ar', reducedMotion: name === '01-phone-cards' ? 'no-preference' : 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(4500); page.setDefaultNavigationTimeout(8000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  // Accidental outgoing interactions must never send anything during acceptance.
  await context.route(/(?:wa\.me|api\.whatsapp\.com|wallet\.google\.com)/, r => r.abort());
  try {
    const detail = await run(page);
    assert.deepEqual(errors, [], 'uncaught page errors');
    await cleanViewport(page);
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
    results.push({ name, ok: true, detail }); console.log(`PASS upgrade ${name}: ${detail}`);
  } catch (e) {
    await page.screenshot({ path: `${OUT}/${name}-failed.png`, fullPage: true, timeout: 2000 }).catch(() => {});
    const error = String(e.stack || e).slice(0, 1800);
    results.push({ name, ok: false, error, pageErrors: errors }); console.error(`FAIL upgrade ${name}: ${error}`);
  } finally { await context.close(); }
}
try {
  browser = await chromium.launch({ executablePath: chromiumPath(), timeout: 30000, args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });

  await scenario('01-phone-cards', { width: 390, height: 844 }, async page => {
    await go(page, '/app/events');
    await page.locator('.sig-fan-card.is-front .card-thumb-inner').waitFor();
    const hero = await page.locator('.sig-fan-card.is-front .card-thumb').boundingBox();
    assert.ok(hero && hero.width >= 220, `hero card too small: ${hero?.width}`);
    await cleanViewport(page);
    await page.screenshot({ path: `${OUT}/01-phone-home.png`, fullPage: true });
    await go(page, '/app/events/evt_wedding/invitation/design');
    await page.locator('.ed-workbench .card-thumb-inner').first().waitFor();
    const card = await page.locator('.ed-workbench-paper .card-thumb').first().boundingBox();
    assert.ok(card && card.width >= 220, `initial editor card too small: ${card?.width}`);
    assert.ok(await page.locator('.ed-workbench-paper .oc-names').evaluate(el => Number(getComputedStyle(el).opacity) > .95), 'editor names are readable before replaying motion');
    assert.ok(card.y >= 0 && card.y + card.height <= 844, `initial poster clipped: ${JSON.stringify(card)}`);
    await page.getByRole('button', { name: 'تكبير البطاقة', exact: true }).click();
    await page.getByRole('dialog', { name: 'البطاقة بحجم أكبر' }).waitFor();
    return `hero ${Math.round(hero.width)}px; editor ${Math.round(card.width)}px; expand dialog opens`;
  });

  await scenario('02-vertical-template-feed', { width: 390, height: 844 }, async page => {
    await go(page, '/app/events/evt_wedding/invitation/templates');
    const feed = page.locator('.template-feed-scroll'); await feed.waitFor();
    await page.waitForFunction(() => document.querySelector('.tf-rail')?.getBoundingClientRect().bottom <= innerHeight && document.querySelector('.focus-foot')?.getBoundingClientRect().bottom <= innerHeight);
    const poster = await page.locator('.template-feed-slide.is-active .card-thumb').boundingBox();
    assert.ok(poster?.width >= 260, `template poster too small: ${poster?.width}`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1), 'the feed is the only scroller (no nested page scroll)');
    await feed.focus(); await page.keyboard.press('Home');
    await page.waitForFunction(() => document.querySelector('.template-feed-slide')?.classList.contains('is-active'));
    const before = await page.evaluate(async () => JSON.stringify(await window.__doyofy.services.invitations.get('evt_wedding')));
    const first = await page.locator('.tf-slide.is-active .tf-info h3').innerText();
    await feed.focus(); await page.keyboard.press('ArrowDown');
    await page.waitForFunction(title => { const heading = document.querySelector('.tf-slide.is-active .tf-info h3'); return !!heading && heading.textContent !== title; }, first);
    const second = await page.locator('.tf-slide.is-active .tf-info h3').innerText();
    const style = await feed.evaluate(el => ({ overflow: getComputedStyle(el).overflowY, snap: getComputedStyle(el).scrollSnapType }));
    assert.ok(['auto', 'scroll'].includes(style.overflow) && style.snap.includes('y'), `not a native vertical snap feed: ${JSON.stringify(style)}`);
    // Native scroll back to the first snap point must update navigation without saving a design.
    await feed.evaluate(el => { el.scrollTop = 0; });
    await page.waitForFunction(title => document.querySelector('.tf-slide.is-active .tf-info h3')?.textContent === title, first);
    const after = await page.evaluate(async () => JSON.stringify(await window.__doyofy.services.invitations.get('evt_wedding')));
    assert.equal(after, before, 'browsing auto-applied a template');
    return `keyboard ${first} → ${second}; native scroll returns; saved design unchanged`;
  });

  await scenario('03-account-audio-dialect', { width: 1440, height: 1000 }, async page => {
    await go(page, '/app/account');
    await page.getByRole('combobox', { name: 'أسلوب اللغة', exact: true }).selectOption('ar-EG');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('combobox', { name: 'طريقة الكلام', exact: true }).waitFor();
    assert.equal(await page.getByRole('combobox', { name: 'طريقة الكلام', exact: true }).inputValue(), 'ar-EG');
    await page.getByRole('combobox', { name: 'طريقة الكلام', exact: true }).selectOption('ar');
    await page.getByLabel('اسم المقطع', { exact: false }).fill('صوت اختبار القبول');
    await page.locator('input[type=file][accept*="audio/mpeg"]').setInputFiles({ name: 'acceptance.wav', mimeType: 'audio/wav', buffer: wav() });
    const audio = page.locator('.audio-library-list audio'); await audio.waitFor();
    await page.waitForFunction(() => document.querySelector('.audio-library-list audio')?.readyState >= 1);
    const metadata = await audio.evaluate(el => ({ duration: el.duration, ready: el.readyState }));
    assert.ok(metadata.duration > 0 && Number.isFinite(metadata.duration));
    // Explicitly request playback after a genuine page click; assert media state, not speaker audibility.
    await page.getByText('صوت اختبار القبول', { exact: true }).click();
    await audio.evaluate(el => el.play());
    await page.waitForFunction(() => document.querySelector('.audio-library-list audio')?.currentTime > 0);
    await audio.evaluate(el => el.pause());
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.locator('.audio-library-list audio').waitFor();
    const track = await page.evaluate(() => JSON.parse(localStorage.getItem('doyofy:audio-library:v1')).tracks[0]);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('doyofy:audio-library:v1')));
    assert.equal(saved.defaultTrackId, track.id);
    await go(page, '/app/events/evt_wedding/invitation/design?section=motion');
    const select = page.getByRole('combobox', { name: 'صوت الدعوة', exact: true }); await select.selectOption(`track:${track.id}`);
    const waitAudio = async (expected, persisted = false) => {
      try {
        // Keep the polled predicate synchronous. Playwright treats a returned Promise as
        // truthy before its boolean resolves, which otherwise skips the autosave wait.
        await page.waitForFunction(({ expected, persisted }) => {
          const store = JSON.parse(localStorage.getItem('doyofy:db:v1') || '{}');
          const stored = store.designs?.find(d => d.eventId === 'evt_wedding')?.draft.audio;
          const matches = audio => expected === 'off' ? audio?.mode === 'off' : audio?.mode === 'library' && `track:${audio.trackId}` === expected;
          const control = document.querySelector('#ed-motion select');
          return !!window.__doyofy && matches(stored) && control?.value === expected && (!persisted || document.querySelector('.save-state')?.classList.contains('is-saved'));
        }, { expected, persisted }, { timeout: 4500 });
        const savedAudio = await page.evaluate(async () => (await window.__doyofy.services.invitations.get('evt_wedding'))?.draft.audio);
        assert.equal(expected === 'off' ? savedAudio?.mode : `track:${savedAudio?.trackId}`, expected, 'service agrees with the durable audio choice');
      } catch (error) {
        const diagnostic = await page.evaluate(async () => ({
          persisted: JSON.parse(localStorage.getItem('doyofy:db:v1') || '{}').designs?.find(d => d.eventId === 'evt_wedding')?.draft.audio,
          service: window.__doyofy ? (await window.__doyofy.services.invitations.get('evt_wedding'))?.draft.audio : null,
          control: document.querySelector('#ed-motion select')?.value,
          save: document.querySelector('.save-state')?.textContent,
        }));
        throw new Error(`Audio persistence expected ${expected}: ${JSON.stringify(diagnostic)}; ${error.message}`);
      }
    };
    // A repository read can settle before React paints the autosave completion. Wait for durable
    // storage and the visible saved signal before reloading, then require the exact restored choice.
    await waitAudio(`track:${track.id}`, true);
    await page.reload({ waitUntil: 'domcontentloaded' }); await waitAudio(`track:${track.id}`);
    assert.equal(await select.inputValue(), `track:${track.id}`);
    await select.selectOption('off');
    await waitAudio('off', true);
    await page.reload({ waitUntil: 'domcontentloaded' }); await waitAudio('off');
    assert.equal(await select.inputValue(), 'off');
    return `Egyptian dialect persisted; WAV metadata ${metadata.duration.toFixed(2)}s/playback; default, chosen track and silence survived reload`;
  });

  await scenario('04-table-order', { width: 1440, height: 1000 }, async page => {
    await go(page, '/app/events/evt_wedding/seating');
    await page.getByRole('button', { name: 'ترتيب الطاولات', exact: true }).click();
    const tables = page.locator('[data-order-table]'); assert.ok(await tables.count() >= 2);
    const initial = await tables.evaluateAll(nodes => nodes.map(n => n.dataset.orderTable));
    await tables.first().focus(); await page.keyboard.press('ArrowDown');
    await page.waitForFunction(id => { const table = document.querySelector('[data-order-table]'); return !!table && table.getAttribute('data-order-table') !== id; }, initial[0]);
    const afterKey = await tables.evaluateAll(nodes => nodes.map(n => n.dataset.orderTable));
    assert.equal(afterKey[1], initial[0]);
    await page.reload({ waitUntil: 'domcontentloaded' }); await tables.first().waitFor();
    assert.deepEqual(await tables.evaluateAll(nodes => nodes.map(n => n.dataset.orderTable)), afterKey);
    await page.getByRole('button', { name: 'ترتيب الطاولات', exact: true }).click();
    await tables.nth(1).dragTo(tables.first());
    await page.waitForFunction(id => document.querySelector('[data-order-table]')?.getAttribute('data-order-table') === id, initial[0]);
    const afterDrag = await tables.evaluateAll(nodes => nodes.map(n => n.dataset.orderTable));
    await page.reload({ waitUntil: 'domcontentloaded' }); await tables.first().waitFor();
    assert.deepEqual(await tables.evaluateAll(nodes => nodes.map(n => n.dataset.orderTable)), afterDrag);
    return 'keyboard reorder and desktop drag both persisted after reload';
  });

  await scenario('05-capacity-cancel-success', { width: 1440, height: 1000 }, async page => {
    await go(page, '/app/events');
    const id = await page.evaluate(async () => {
      const s = window.__doyofy.services;
      const ev = await s.events.create({ type: 'birthday', names: { a: 'اختبار السعة' }, date: '2027-06-20', time: '20:00', venue: { name: 'قاعة الاختبار', city: 'الرياض' } });
      for (let i = 0; i < 5; i++) await s.parties.create(ev.id, { primaryGuestName: `عائلة اختبار ${i}`, maxPartySize: 20 });
      return ev.id;
    });
    // ?pay=decline is the prototype affordance for a declined payment; the checkout itself has no such toggle.
    await go(page, `/app/events/${id}/guests?pay=decline`);
    await page.locator('[data-capacity-meter].is-full').waitFor();
    await page.getByRole('button', { name: 'إضافة ضيف', exact: true }).click();
    await page.getByLabel('اسم الضيف أو العائلة', { exact: false }).fill('ضيف بعد الترقية');
    await page.getByRole('button', { name: 'إضافة', exact: true }).click();
    await page.locator('[data-capacity-flow]').waitFor();
    assert.equal(await page.getByText('محاكاة عملية مرفوضة').count(), 0, 'decline toggle hidden from the checkout');
    await page.getByRole('button', { name: 'إلغاء الترقية', exact: true }).click();
    assert.equal(await page.getByLabel('اسم الضيف أو العائلة', { exact: false }).inputValue(), 'ضيف بعد الترقية');
    // the reason is focused and on screen, not hidden above the fold
    await page.waitForFunction(() => document.activeElement?.classList.contains('banner'));
    const box = await page.evaluate(() => { const r = document.activeElement.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, h: innerHeight }; });
    assert.ok(box.top >= 0 && box.bottom <= box.h, `notice off-screen: ${JSON.stringify(box)}`);
    assert.equal(await page.evaluate(async id => (await window.__doyofy.services.parties.list(id)).length, id), 5);
    await page.getByRole('button', { name: 'إضافة', exact: true }).click();
    await page.getByRole('button', { name: 'متابعة للدفع', exact: true }).click();
    await page.getByText('تجريبي — لا يتم خصم أي مبلغ').waitFor();
    await page.getByRole('button', { name: 'تأكيد الدفع التجريبي', exact: true }).click();
    await page.getByText('لم ينجح الدفع').waitFor();
    assert.equal(await page.evaluate(async id => (await window.__doyofy.services.parties.list(id)).length, id), 5, 'decline wrote nothing');
    await page.getByRole('button', { name: 'تأكيد الدفع التجريبي', exact: true }).click();
    await page.getByText('أصبح حدّ مناسبتك 250 شخصًا').waitFor();
    await page.getByText('تمت إضافة شخصين', { exact: false }).waitFor(); // the default invitation allows 2
    await page.waitForFunction(id => JSON.parse(localStorage.getItem('doyofy:db:v1') || '{}').parties?.filter(p => p.eventId === id).length === 6, id);
    await page.getByRole('button', { name: 'تم', exact: true }).click();
    const added = await page.evaluate(async id => (await window.__doyofy.services.parties.list(id)).filter(p => p.primaryGuestName === 'ضيف بعد الترقية').length, id);
    assert.equal(added, 1); await page.reload({ waitUntil: 'domcontentloaded' });
    assert.equal(await page.evaluate(async id => (await window.__doyofy.services.parties.list(id)).length, id), 6);
    await page.getByRole('button', { name: 'عرض الإيصال', exact: true }).first().click();
    const receipt = await page.locator('[data-receipt]').innerText();
    assert.ok(receipt.includes('49 ر.س') && /DEMO-/.test(receipt), receipt);
    return 'cancel kept form, focused the notice; decline wrote nothing; demo payment resumed once; 6 rows after reload; receipt from the meter';
  });
} catch (e) {
  results.push({ name: 'runner', ok: false, error: String(e.stack || e) }); console.error(e);
} finally {
  clearTimeout(watchdog);
  fs.writeFileSync(`${OUT}/results.json`, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
  await browser?.close(); await new Promise(resolve => server.close(resolve));
}
process.exitCode = results.some(r => !r.ok) ? 1 : 0;
