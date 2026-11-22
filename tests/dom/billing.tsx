import assert from 'node:assert/strict';
import { act, useState, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ServicesProvider, useMutation } from '../../src/app/data';
import { createServices } from '../../src/services';
import { UpgradeFlow } from '../../src/features/billing/UpgradeFlow';
import { CapacityMeter } from '../../src/features/billing/CapacityMeter';
import { useParties } from '../../src/features/shared/queries';
import { guestLimit, receiptsFor, setDemoPaymentDecline, simulateCapacityPayment } from '../../src/domain/billing';
import type { PartyInput } from '../../src/domain/types';

type Attempt = { revision: string; input: PartyInput };
const attempts: Attempt[] = [];
let successes = 0;
function GuestForm({ eventId, revision }: { eventId: string; revision: string }) {
  const [name, setName] = useState('ضيف محفوظ قبل الدفع');
  const [saved, setSaved] = useState('');
  const add = useMutation((services, input: PartyInput) => {
    attempts.push({ revision, input: structuredClone(input) });
    return services.parties.create(eventId, input);
  }, { onSuccess: p => { successes++; setSaved(p.id); } });
  return <form id="guest-test" onSubmit={e => { e.preventDefault(); void add.run({ primaryGuestName: name, maxPartySize: 6 }); }}>
    <label htmlFor="guest-name">اسم الضيف</label><input id="guest-name" value={name} onChange={e => setName(e.target.value)} />
    <button type="submit" disabled={add.pending}>إضافة الضيف</button>
    <output data-pending>{String(add.pending)}</output><output data-saved>{saved}</output>{add.error && <p role="alert">{String(add.error)}</p>}
  </form>;
}
function Meter({ eventId }: { eventId: string }) {
  const parties = useParties(eventId);
  return parties.data ? <CapacityMeter eventId={eventId} parties={parties.data} /> : null;
}
export async function run() {
  let root: Root;
  let passed = 0;
  const render = async (node: ReactNode) => { await act(async () => { root.render(node); }); };
  const click = async (element: Element) => { await act(async () => { element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); }); };
  const button = (text: string) => { const node = [...document.querySelectorAll('button')].find(el => el.textContent === text); assert.ok(node, `button ${text}`); return node; };
  const submit = async () => { await act(async () => { document.querySelector('#guest-test')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); }); };
  const fill = async (value: string) => { await act(async () => { const input = document.querySelector<HTMLInputElement>('#guest-name')!; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); }); };
  const text = () => document.body.textContent ?? '';
  const check = async (name: string, fn: () => Promise<void>) => {
    window.localStorage.clear(); window.sessionStorage.clear(); setDemoPaymentDecline(false); attempts.length = 0; successes = 0;
    root = createRoot(document.querySelector('#root')!);
    try { await fn(); passed++; console.log(`✔ billing DOM: ${name}`); }
    finally { await act(async () => { root.unmount(); }); }
  };
  const setup = async () => {
    const made = createServices(); made.prototype.update({ latencyMs: 0 });
    const seed = await made.services.events.get('evt_wedding');
    const event = await made.services.events.create({ type: 'graduation', names: { a: 'اختبار السعة' }, date: seed.date, time: '20:00', venue: { name: 'قاعة', city: 'الرياض' } });
    await made.services.parties.importMany(event.id, [20, 20, 20, 20, 15].map((maxPartySize, i) => ({ primaryGuestName: `عائلة موجودة ${i}`, maxPartySize })), { source: 'test', skipped: 0 });
    const wrap = (revision = 'original') => <ServicesProvider {...made}><GuestForm eventId={event.id} revision={revision} /><Meter eventId={event.id} /><UpgradeFlow /></ServicesProvider>;
    await render(wrap());
    return { made, event, wrap };
  };
  await check('cancel upgrade retains form and writes neither guest nor entitlement', async () => {
    const { made, event } = await setup();
    await fill('اسم لا يضيع عند الإلغاء'); await submit();
    assert.ok(document.querySelector('[data-capacity-flow]'));
    assert.equal((await made.services.parties.list(event.id)).length, 5);
    assert.equal(guestLimit(event.id), 100);
    assert.equal(document.querySelector('[data-pending]')!.textContent, 'true');
    assert.ok(!text().includes('العودة للضيوف'), 'cancel is labelled by what it does');
    await click(button('إلغاء الترقية'));
    assert.equal(document.querySelector('[data-capacity-flow]'), null);
    assert.equal(document.querySelector<HTMLInputElement>('#guest-name')!.value, 'اسم لا يضيع عند الإلغاء');
    assert.equal(document.querySelector('[data-pending]')!.textContent, 'false');
    assert.equal((await made.services.parties.list(event.id)).length, 5);
    assert.equal(guestLimit(event.id), 100); assert.equal(attempts.length, 1); assert.equal(successes, 0);
    const alert = document.querySelector<HTMLElement>('#guest-test [role=alert]');
    assert.ok(alert?.textContent?.includes('لم تكتمل العملية'), 'the form explains why nothing was added');
  });
  await check('declined payment preserves pending operation; retry adds original guest exactly once', async () => {
    const { made, event } = await setup(); await submit();
    await click(button('متابعة للدفع'));
    assert.ok(!text().includes('محاكاة عملية مرفوضة') && !text().includes('تجربة تعذّر الدفع'), 'no decline toggle in the product checkout');
    assert.ok(text().includes('تجريبي — لا يتم خصم أي مبلغ'), 'demo note next to the pay button');
    setDemoPaymentDecline(true); // prototype tools / ?pay=decline
    await click(button('تأكيد الدفع التجريبي'));
    assert.ok(text().includes('لم ينجح الدفع'));
    assert.equal(document.activeElement?.classList.contains('banner'), true, 'the decline banner takes focus');
    assert.equal(guestLimit(event.id), 100); assert.equal((await made.services.parties.list(event.id)).length, 5);
    assert.equal(successes, 0); assert.equal(attempts.length, 1);
    await click(button('تأكيد الدفع التجريبي'));
    const all = await made.services.parties.list(event.id);
    assert.equal(all.length, 6); assert.equal(all.filter(p => p.primaryGuestName === 'ضيف محفوظ قبل الدفع').length, 1);
    assert.equal(guestLimit(event.id), 250); assert.equal(attempts.length, 2); assert.equal(successes, 1);
    assert.ok(document.querySelector('[data-saved]')!.textContent);
    assert.equal((await made.services.activity.list(event.id)).filter(a => a.kind === 'party_added').length, 1);
    assert.ok(text().includes('أصبح حدّ مناسبتك 250 شخصًا'), 'confirmation names the new limit');
    assert.ok(text().includes('تمت إضافة 6 أشخاص'), 'confirmation shows the resumed result');
    assert.ok(document.querySelector('[data-receipt]')?.textContent?.includes('49 ر.س'), 'confirmation shows the demo charge');
    await click(button('تم'));
    assert.equal(document.querySelector('[data-capacity-flow]'), null);
    assert.equal(receiptsFor(event.id).length, 1);
    await click(button('عرض الإيصال'));
    const receipt = document.querySelector('[data-receipt]')!.textContent!;
    assert.ok(receipt.includes('250 شخصًا') && receipt.includes('49 ر.س') && receipt.includes(receiptsFor(event.id)[0]!.ref), 'receipt reachable from the meter');
  });
  await check('retry keeps submitted input and original closure across rerender during checkout', async () => {
    const { made, event, wrap } = await setup(); await fill('الاسم الأصلي'); await submit();
    await render(wrap('changed-after-capacity-error')); await fill('تعديل لاحق لا يبدل الطلب');
    await click(button('متابعة للدفع')); await click(button('تأكيد الدفع التجريبي'));
    assert.deepEqual(attempts.map(a => a.revision), ['original', 'original']);
    assert.deepEqual(attempts.map(a => a.input.primaryGuestName), ['الاسم الأصلي', 'الاسم الأصلي']);
    const all = await made.services.parties.list(event.id);
    assert.equal(all.filter(p => p.primaryGuestName === 'الاسم الأصلي').length, 1);
    assert.equal(all.filter(p => p.primaryGuestName === 'تعديل لاحق لا يبدل الطلب').length, 0);
    assert.equal(successes, 1);
  });
  await check('capacity purchased in another tab during checkout resumes without downgrading', async () => {
    const { made, event } = await setup(); await submit(); await click(button('متابعة للدفع'));
    await act(async () => { simulateCapacityPayment(event.id, 500); });
    await click(button('تأكيد الدفع التجريبي'));
    assert.equal(guestLimit(event.id), 500); assert.equal((await made.services.parties.list(event.id)).length, 6); assert.equal(successes, 1);
  });
  await check('quota-limited entitlement writes retain in-session capacity and resume once', async () => {
    const { made, event } = await setup(); await submit(); await click(button('متابعة للدفع'));
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) { if (key.startsWith('doyofy:guest-')) throw new Error('quota exceeded'); return original.call(this, key, value); };
    try {
      await click(button('تأكيد الدفع التجريبي'));
      assert.equal(guestLimit(event.id), 250); assert.equal((await made.services.parties.list(event.id)).length, 6);
      assert.equal(attempts.length, 2); assert.equal(successes, 1);
      assert.equal(receiptsFor(event.id).length, 1, 'receipt kept in session memory');
    } finally { Storage.prototype.setItem = original; }
  });
  await check('meter warns at 90% and a proactive upgrade from a paid tier charges only the difference', async () => {
    const { made, event } = await setup();
    // setup allocates 95 of the free 100 people
    const meter = document.querySelector('[data-capacity-meter]')!;
    assert.ok(meter.className.includes('is-near') && meter.textContent!.includes('95') && meter.textContent!.includes('المتبقي 5 أشخاص'), meter.textContent!);
    await click(button('زيادة سعة الضيوف'));
    await click(button('متابعة للدفع')); await click(button('تأكيد الدفع التجريبي'));
    assert.ok(text().includes('أصبح حدّ مناسبتك 250 شخصًا'));
    await click(button('تم'));
    assert.equal(attempts.length, 0, 'nothing was pending, nothing resumed');
    assert.equal(document.querySelector('[data-capacity-meter]')!.className.includes('is-near'), false, '95 of 250 is calm');
    await act(async () => { await made.services.parties.importMany(event.id, Array.from({ length: 7 }, (_, i) => ({ primaryGuestName: `دفعة ${i}`, maxPartySize: i ? 20 : 10 })), { source: 'test', skipped: 0 }); });
    assert.equal(document.querySelector('[data-capacity-meter]')!.className.includes('is-near'), true, '225 of 250 warns');
    await click(button('زيادة سعة الضيوف'));
    const plans = document.querySelector('[data-capacity-flow]')!.textContent!;
    assert.ok(plans.includes('40 ر.س') && plans.includes('الفرق'), plans);
    await click(button('متابعة للدفع'));
    const summary = document.querySelector('.capacity-summary')!.textContent!;
    assert.ok(summary.includes('مدفوع سابقًا') && summary.includes('49 ر.س') && summary.includes('الفرق المستحق الآن') && summary.includes('40 ر.س'), summary);
    await click(button('تأكيد الدفع التجريبي'));
    assert.equal(guestLimit(event.id), 500);
    assert.deepEqual(receiptsFor(event.id).map(r => r.charged), [40, 49]);
  });
  await check('a coordinator cannot pay: the limit is explained, nothing is written', async () => {
    const { made, event } = await setup();
    await act(async () => { made.prototype.update({ role: 'coordinator' }); });
    await submit();
    assert.ok(text().includes('لصاحب المناسبة فقط'));
    assert.ok(!text().includes('تأكيد الدفع التجريبي'));
    await click(button('إغلاق'));
    assert.equal(document.querySelector('[data-capacity-flow]'), null);
    assert.equal((await made.services.parties.list(event.id)).length, 5); assert.equal(guestLimit(event.id), 100);
  });
  console.log(`Billing DOM ${passed}/${passed}`);
}
