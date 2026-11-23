// node tests/backend-e2e.mjs — the backend path end to end, locally: dist/ + the real api/router.ts handlers over
// in-memory storage (tools/dev-api.mjs). Build first (npm run build).
//   organizer device: the demo wedding syncs → the guest drawer offers a SHORT link (/i/<slug>/<code>, no ?d=)
//   a fresh guest device: opens it (no demo data seeded) → replies → the hub shows the reply, no demo note
//   organizer device: pulls the reply → the guest is confirmed and the reply is in the replies page
import assert from 'node:assert/strict';
import { need, chromiumPath } from '../tools/lib.mjs';
import { startDevApi } from '../tools/dev-api.mjs';

const { server, port } = await startDevApi(Number(process.env.BACKEND_PORT) || 4841);
const BASE = `http://localhost:${port}`;
const { chromium } = need('playwright');
const browser = await chromium.launch({ executablePath: chromiumPath() });
const watchdog = setTimeout(() => { console.error('backend e2e exceeded 120 s'); process.exit(1); }, 120000);
const results = [];
const step = async (name, run) => {
  try { const detail = await run(); results.push({ name, ok: true }); console.log(`PASS  ${name}${detail ? `  — ${detail}` : ''}`); }
  catch (e) { results.push({ name, ok: false }); console.log(`FAIL  ${name}  — ${String(e.message || e).split('\n')[0]}`); throw e; }
};

const org = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ar' });
const page = await org.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
let code = '', partyId = '', link = '';
try {
  await step('organizer: the backend is on and the event syncs', async () => {
    await page.goto(`${BASE}/app/events`); await page.waitForFunction(() => window.__doyofy);
    await page.evaluate(() => { localStorage.setItem('doyofy:demo-bar-dismissed', '1'); window.__doyofy.prototype.update({ latencyMs: 0 }); });
    const party = await page.evaluate(async () => (await window.__doyofy.services.parties.list('evt_wedding')).find((p) => p.rsvpStatus === 'pending'));
    code = party.code; partyId = party.id;
    await page.waitForFunction((c) => window.__doyofy.services.cloud.guestPath('evt_wedding', c), code, { timeout: 15000 });
    return `status ${await page.evaluate(() => window.__doyofy.services.cloud.status())}`;
  });

  await step('organizer: the guest drawer shows the short link', async () => {
    await page.goto(`${BASE}/app/events/evt_wedding/guests?party=${partyId}`);
    await page.waitForFunction(() => [...document.querySelectorAll('input')].some((e) => /\/i\/[^/]+\/[A-Z0-9]+$/.test(e.value)), null, { timeout: 8000 });
    link = await page.evaluate(() => [...document.querySelectorAll('input')].map((e) => e.value).find((v) => /\/i\/[^/]+\/[A-Z0-9]+$/.test(v)));
    assert.ok(link.endsWith(`/${code}`), link);
    assert.ok(!link.includes('?d='), 'no portable payload');
    assert.ok(link.length < 100, `short: ${link.length} chars`);
    return link.replace(BASE, '');
  });

  const fresh = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ar' });
  const guest = await fresh.newPage();
  const guestErrors = [];
  guest.on('pageerror', (e) => guestErrors.push(e.message));
  await step('guest (fresh device): the short link opens the invitation', async () => {
    await guest.goto(link);
    await guest.locator('.sig-cover').waitFor({ timeout: 15000 });
    const seeded = await guest.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('doyofy:db') || k.startsWith('doyofy:cloud')));
    assert.deepEqual(seeded, [], 'no organizer data on the guest device');
    return 'cover shown';
  });

  await step('guest: replies; the hub shows it without a demo note', async () => {
    await guest.getByRole('button', { name: 'الموعد وتأكيد الحضور مباشرة', exact: true }).click();
    await guest.getByText('سنحضر بكل سرور', { exact: true }).click();
    await guest.getByRole('button', { name: 'إرسال الرد', exact: true }).click();
    await guest.locator('.hub-qr svg.qr').waitFor({ timeout: 10000 });
    assert.equal(await guest.locator('.guest-demo').count(), 0, 'a real reply is not labelled as a demo');
    // reload: the reply comes back from the backend, not from this device's memory
    await guest.reload();
    await guest.locator('.hub-qr').waitFor({ timeout: 10000 });
    assert.deepEqual(guestErrors, []);
    return 'confirmed, QR on screen after a reload';
  });
  await fresh.close();

  await step('organizer: the reply arrives (pull on focus) and counts', async () => {
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.waitForFunction(async (id) => (await window.__doyofy.services.parties.get(id)).rsvpStatus === 'confirmed', partyId, { timeout: 15000, polling: 300 });
    const responses = await page.evaluate(async () => (await window.__doyofy.services.rsvp.listResponses('evt_wedding')).filter((r) => r.channel === 'guest_link'));
    assert.ok(responses.length >= 1, 'the reply is in the replies list');
    const activity = await page.evaluate(async () => (await window.__doyofy.services.activity.list('evt_wedding', 5)).map((a) => `${a.kind}/${a.actor}`));
    assert.ok(activity.includes('rsvp_confirmed/guest'), activity.join(', '));
    await page.goto(`${BASE}/app/events/evt_wedding/rsvp`);
    await page.locator('h1').first().waitFor();
    assert.deepEqual(errors, []);
    return 'confirmed on the organizer device';
  });

  await step('a link for an unknown code says so', async () => {
    const other = await (await browser.newContext()).newPage();
    await other.goto(link.replace(/\/[A-Z0-9]+$/, '/ZZZZZ'));
    await other.getByText(/غير موجودة|غير صحيح/).first().waitFor({ timeout: 10000 });
    await other.context().close();
  });
} catch { process.exitCode = 1; }
finally {
  clearTimeout(watchdog);
  await browser.close();
  server.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  if (failed) process.exitCode = 1;
}
