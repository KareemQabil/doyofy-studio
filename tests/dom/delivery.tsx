import assert from 'node:assert/strict';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ServicesProvider } from '../../src/app/data';
import { RouterProvider } from '../../src/app/router';
import { createServices } from '../../src/services';
import { ShareQueue } from '../../src/features/guests/ShareQueue';
import { GuestInvite } from '../../src/features/guest/GuestInvite';
import { FollowUpSheet } from '../../src/features/guest/GuestExtras';
import { portableView, encodePortableView } from '../../src/domain/portable-invite';
import { defaultDesign } from '../../src/domain/invitation';
import { setDialect } from '../../src/data/copy-preference.js';
import { currentStrings, setStringsVoice } from '../../src/data/strings.js';
import { Studio } from '../../src/studio/Studio.js';
import { studioMarkup } from '../../src/studio/markup.js';
import { copyFor } from '../../src/domain/copy';

export async function run() {
  const made = createServices(); made.prototype.update({ latencyMs: 0 }); made.prototype.reset('before');
  const event = await made.services.events.get('evt_wedding');
  const p = await made.services.parties.create(event.id, { primaryGuestName: 'ضيف تجربة مشاركة', phone: '+966559876543', maxPartySize: 2 });
  const missing = await made.services.parties.create(event.id, { primaryGuestName: 'ضيف بلا رقم', maxPartySize: 1 });
  const root = createRoot(document.getElementById('root')!);
  const wrap = (node: React.ReactNode) => <ServicesProvider {...made}><RouterProvider mode="history">{node}</RouterProvider></ServicesProvider>;
  const render = async (node: React.ReactNode) => { await act(async () => root.render(wrap(node))); };
  const click = async (el: Element | undefined | null) => { assert.ok(el); await act(async () => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))); };
  const button = (text: string) => [...document.querySelectorAll('button')].find(x => x.textContent?.includes(text));
  const settle = async () => { for (let i = 0; i < 5; i++) await act(async () => { await new Promise(r => setTimeout(r, 10)); }); };
  const linkFor = (x: typeof p) => `https://doyofy.test/i/${event.slug}/${x.code}`;
  await render(<ShareQueue event={event} parties={[p, missing]} urlFor={() => undefined} linkFor={linkFor} onClose={() => {}} />);
  await click(button('نسخ روابط المحددين'));
  const copy = document.querySelector<HTMLTextAreaElement>('textarea');
  assert.ok(copy?.value.includes(missing.primaryGuestName), 'copy includes selected guests without phones');
  assert.ok(document.body.textContent?.includes('بلا رقم'));
  // one short line explains the queue — no stack of disclaimers
  assert.equal(document.querySelectorAll('dialog[open] .stack > p.faint, dialog[open] .sq-note').length, 0, 'no extra disclaimers');
  await click(button('رسالة نصية'));
  const sms = document.querySelector<HTMLAnchorElement>('a[href^="sms:"]'); assert.ok(sms); sms.addEventListener('click', e => e.preventDefault());
  await click(sms); assert.equal((await made.services.parties.get(p.id)).delivery.status, 'not_shared');
  await click(button('أرسلت الرسالة'));
  assert.equal((await made.services.parties.get(p.id)).delivery.status, 'shared');
  assert.equal((await made.services.parties.get(missing.id)).delivery.status, 'not_shared');
  console.log('PASS DOM selected sharing: channels, missing phone, SMS compose, explicit manual confirmation');

  // WhatsApp queue: «أرسلتها، افتح التالي» records THIS guest (explicit) and opens the next composer in the same tap;
  // the next guest is never marked because its composer opened. Guests without numbers get a way out at the end.
  const q = await Promise.all(['أول', 'ثان', 'ثالث'].map((n, i) => made.services.parties.create(event.id, { primaryGuestName: `ضيف ${n}`, phone: `+96655000000${i}`, maxPartySize: 1 })));
  const status = async (id: string) => (await made.services.parties.get(id)).delivery.status;
  let addPhone = '';
  await render(<ShareQueue key="whatsapp-chain" event={event} parties={[...q, missing]} urlFor={() => undefined} linkFor={linkFor} onClose={() => {}} onAddPhone={(id) => { addPhone = id; }} />);
  await click(button('واتساب'));
  assert.ok(document.body.textContent?.includes('1 / 3'), 'progress n/N');
  const open = document.querySelector<HTMLAnchorElement>('a.sq-open'); assert.ok(open?.href.startsWith('https://wa.me/966550000000')); open!.addEventListener('click', e => e.preventDefault());
  await click(open); assert.equal(await status(q[0]!.id), 'not_shared', 'opening a composer is not sending');
  let chain = document.querySelector<HTMLAnchorElement>('a.sq-confirm'); assert.ok(chain?.href.startsWith('https://wa.me/966550000001'), 'confirm opens the NEXT guest');
  chain!.addEventListener('click', e => e.preventDefault()); await click(chain); await settle();
  assert.equal(await status(q[0]!.id), 'shared'); assert.equal(await status(q[1]!.id), 'not_shared');
  assert.ok(document.body.textContent?.includes(`هل أرسلت الرسالة إلى ${q[1]!.primaryGuestName}`), 'the next guest asks for its own confirmation');
  chain = document.querySelector<HTMLAnchorElement>('a.sq-confirm'); assert.ok(chain?.href.startsWith('https://wa.me/966550000002'));
  chain!.addEventListener('click', e => e.preventDefault()); await click(chain); await settle();
  assert.equal(await status(q[1]!.id), 'shared'); assert.equal(await status(q[2]!.id), 'not_shared');
  assert.equal(document.querySelector('a.sq-confirm'), null, 'the last guest has no «next»');
  await click(button('أرسلت الرسالة')); await settle();
  assert.equal(await status(q[2]!.id), 'shared');
  assert.ok(document.querySelector('.sq-done .sq-missing'), 'guests without numbers get a way out');
  await click(document.querySelector('.sq-missing-list button')); assert.equal(addPhone, missing.id);
  assert.equal(await status(missing.id), 'not_shared');
  // the clipboard refuses (no permission): the links show to copy by hand and nothing is recorded until «أرسلتها»
  await click(button('انسخ روابطها وسجّلها مُرسلة')); await settle();
  assert.ok(document.querySelector<HTMLTextAreaElement>('.sq-done textarea')?.value.includes(missing.primaryGuestName));
  assert.equal(await status(missing.id), 'not_shared', 'a failed copy records nothing');
  assert.ok(button('أرسلتها، سجّلها مُرسلة'));
  // with a working clipboard, copying their links and recording them is ONE tap (the button says both)
  const nav = globalThis.navigator as Navigator & { clipboard?: unknown };
  Object.defineProperty(nav, 'clipboard', { value: { writeText: async () => {} }, configurable: true });
  const linkOnly = await made.services.parties.create(event.id, { primaryGuestName: 'ضيف رابط فقط', maxPartySize: 1 });
  await render(<ShareQueue key="links-only" event={event} parties={[linkOnly]} urlFor={() => undefined} linkFor={linkFor} onClose={() => {}} />);
  assert.equal(button('واتساب'), undefined, 'no dead «واتساب · 0» when nobody has a number');
  await click(button('انسخ روابطها وسجّلها مُرسلة')); await settle();
  assert.equal(await status(linkOnly.id), 'shared');
  assert.ok(document.body.textContent?.includes('وسجّلناها مُرسلة'));
  delete (nav as { clipboard?: unknown }).clipboard;
  console.log('PASS DOM WhatsApp queue: confirm + open next in one tap, n/N progress, no-number way out');
  // reminders: the same queue in «remind» mode — reminder text, and a guest counts as reminded only after «أرسلت التذكير»
  const r = await made.services.parties.create(event.id, { primaryGuestName: 'ضيف تذكير', phone: '+966550000009', maxPartySize: 1 });
  await made.services.parties.markShared([r.id], 'manual');
  const reminded = async () => (await made.services.parties.get(r.id)).delivery.reminderAt;
  await render(<ShareQueue key="remind" mode="remind" event={event} parties={[r]} urlFor={() => undefined} linkFor={linkFor} onClose={() => {}} />);
  assert.ok(document.querySelector('dialog[open]')?.textContent?.includes('تذكير بالرد'), 'the sheet says it is a reminder');
  await click(button('واتساب'));
  const remindOpen = document.querySelector<HTMLAnchorElement>('a.sq-open'); assert.ok(remindOpen);
  assert.ok(decodeURIComponent(remindOpen!.href).includes('تذكير لطيف'), 'the reminder text, not the invitation');
  remindOpen!.addEventListener('click', e => e.preventDefault()); await click(remindOpen); await settle();
  assert.equal(await reminded(), undefined, 'opening WhatsApp is not a reminder');
  assert.ok(document.body.textContent?.includes('هل أرسلت التذكير إلى'));
  await click(button('أرسلت التذكير')); await settle();
  assert.ok(await reminded(), 'recorded after the explicit confirmation');
  assert.equal((await made.services.parties.get(r.id)).delivery.status, 'shared', 'delivery unchanged');
  assert.ok(document.querySelector('.sq-done')?.textContent?.includes('ذكّرت'));
  console.log('PASS DOM reminder queue: reminder text, explicit «أرسلت التذكير», no simulated reminder');
  await act(async () => root.unmount());

  const freshRoot = createRoot(document.getElementById('root')!);
  const snapshot = portableView({ ...event, date: '2099-08-12', guestExperience: undefined }, defaultDesign(event), p);
  const token = encodePortableView(snapshot);
  history.replaceState(null, '', `/i/${event.slug}/${p.code}?d=${token}`);
  const before = JSON.stringify(await made.services.parties.get(p.id));
  await act(async () => freshRoot.render(wrap(<GuestInvite slug={event.slug} code={p.code} />))); await settle();
  assert.ok(document.querySelector('.sig-cover'));
  await click(button('الموعد وتأكيد الحضور مباشرة')); await settle();
  const demoNote = () => document.querySelector('.guest-demo')?.textContent ?? '';
  assert.ok(demoNote().includes('لا يصل إلى صاحب المناسبة'), 'demo note is honest before the reply');
  assert.ok(!demoNote().includes('رمز الدخول'), 'no admission code is promised before a confirmed reply');
  await click(document.querySelector('input[type="radio"][value="yes"]'));
  await click(button('إرسال الرد')); await settle();
  // the success state: the entry pass leads the page and takes focus, the QR inside it
  const first = document.querySelector('.hub > section');
  assert.ok(first?.classList.contains('hub-pass') && first.querySelector('svg.qr'), 'confirmed personal reply leads with its QR pass');
  assert.equal(document.activeElement?.id, 'hub-status', 'focus moves to the reply result');
  assert.ok(demoNote().includes('رمز الدخول هنا للتجربة'));
  assert.ok(!/المنظّم|المنظم/.test(document.querySelector('main')!.textContent!), 'guests never see organizer vocabulary');
  // Google Wallet: the official-looking button opens a preview that says nothing was added
  const gw = document.querySelector<HTMLButtonElement>('.gw-btn');
  assert.equal(gw?.textContent, 'أضف إلى Google Wallet');
  assert.ok(gw?.querySelector('svg.gw-mark'), 'the Wallet mark is inline SVG');
  await click(gw);
  const pass = document.querySelector('dialog[open] .wpass');
  assert.ok(pass, 'Wallet preview shows the pass');
  for (const text of [event.title, p.primaryGuestName, p.code, 'العدد', 'المكان']) assert.ok(pass!.textContent!.includes(text), `pass shows ${text}`);
  assert.ok(document.querySelector('dialog[open]')?.textContent?.includes('لم تُضف أي بطاقة إلى Google Wallet'));
  assert.equal(JSON.stringify(await made.services.parties.get(p.id)), before, 'portable reply never alters organizer guest');
  await click(button('العودة إلى رمز الدخول'));
  // a decline: no pass, no Wallet, no admission code in the note
  await click(button('تعديل الرد')); await settle();
  await click(document.querySelector('input[type="radio"][value="no"]'));
  await click(button('إرسال الرد')); await settle();
  assert.ok(document.body.textContent?.includes('سجّلنا اعتذاركم'));
  assert.ok(!document.querySelector('.hub-qr, .gw-btn, svg.qr'), 'declined replies get neither QR nor Wallet');
  assert.ok(!demoNote().includes('رمز الدخول'));
  console.log('PASS DOM portable guest: direct reply → QR pass first → Wallet button + truthful preview; decline has no pass; organizer unchanged');
  await act(async () => freshRoot.unmount());

  // both paths ask the same questions: the direct form and the cinematic follow-up sheet share one set
  const withFood = portableView({ ...event, date: '2099-08-12' }, defaultDesign(event), p);
  assert.ok(withFood.experience, 'the seeded wedding asks food');
  const labels = () => [...document.querySelectorAll('legend, .field-label, label')].map((x) => x.textContent?.replace(/\s+/g, ' ').trim()).filter((x) => x && !/هل ستحضرون|عدد الحضور|سنحضر بكل سرور|نعتذر/.test(x)).sort();
  const sheetRoot = createRoot(document.getElementById('root')!);
  await act(async () => sheetRoot.render(wrap(<FollowUpSheet view={withFood} attending count={2} onSend={async () => null} onBack={() => {}} />))); await settle();
  const cinematic = labels();
  await act(async () => sheetRoot.unmount());
  history.replaceState(null, '', `/i/${event.slug}/${p.code}?d=${encodePortableView(withFood)}`);
  localStorage.clear();
  const hubRoot = createRoot(document.getElementById('root')!);
  await act(async () => hubRoot.render(wrap(<GuestInvite slug={event.slug} code={p.code} />))); await settle();
  await click(button('الموعد وتأكيد الحضور مباشرة')); await settle();
  await click(document.querySelector('input[type="radio"][value="yes"]')); await settle();
  const direct = labels();
  assert.ok(cinematic.some((x) => x!.includes('أسماء المرافقين')) && cinematic.some((x) => x!.includes('رسالة لصاحب المناسبة')) && document.querySelector('.gx-meals'), 'companions, food and message are asked');
  assert.deepEqual(direct, cinematic, 'cinematic and direct paths ask the same follow-up questions');
  console.log('PASS DOM same questions on both paths (companions, food, message)');
  await act(async () => hubRoot.unmount());

  // the organizer's voice travels in the link: a guest device that prefers modern Arabic still reads the Egyptian invitation
  setDialect('ar'); localStorage.clear();
  const egyptian = portableView({ ...event, date: '2099-08-12', guestExperience: undefined }, defaultDesign(event), p, 'ar-EG');
  assert.equal(egyptian.dialect, 'ar-EG');
  history.replaceState(null, '', `/i/${event.slug}/${p.code}?d=${encodePortableView(egyptian)}`);
  const voiceRoot = createRoot(document.getElementById('root')!);
  await act(async () => voiceRoot.render(wrap(<GuestInvite slug={event.slug} code={p.code} />))); await settle();
  assert.ok(button('الميعاد وتأكيد الحضور على طول'), 'the cover speaks the organizer\'s voice');
  assert.ok(button('افتحوا الدعوة'), 'guests are addressed in the plural');
  await click(button('الميعاد وتأكيد الحضور على طول')); await settle();
  const pageText = () => document.querySelector('main')?.textContent ?? '';
  assert.ok(pageText().includes('هنيجي إن شاء الله') && pageText().includes('هتشرّفونا؟'), 'reply choices in the organizer\'s voice');
  await click(document.querySelector('input[type="radio"][value="yes"]'));
  await click(button('ابعتوا الرد')); await settle();
  assert.ok(pageText().includes('حضوركم اتأكد'), 'success line in the organizer\'s voice');
  assert.equal(currentStrings('ar-SA').accept.ar, 'بنحضر بإذن الله', 'the invitation engine uses the same reply words');
  await act(async () => voiceRoot.unmount());
  console.log('PASS DOM dialect: carried in the guest link payload and applied on the guest pages, whatever the device prefers');

  // a fresh device opening a guest link that carries its invitation: the organizer's demo store is never seeded there
  localStorage.clear();
  history.replaceState(null, '', `/i/${event.slug}/${p.code}?d=${encodePortableView(snapshot)}`);
  const guestDevice = createServices(); guestDevice.prototype.update({ latencyMs: 0 });
  assert.equal(localStorage.getItem('doyofy:db:v1'), null, 'no organizer database on the guest device');
  assert.equal((await guestDevice.services.events.list()).length, 0, 'no organizer events in memory either');
  const deviceRoot = createRoot(document.getElementById('root')!);
  await act(async () => deviceRoot.render(<ServicesProvider {...guestDevice}><RouterProvider mode="history"><GuestInvite slug={event.slug} code={p.code} /></RouterProvider></ServicesProvider>)); await settle();
  await click(button('الموعد وتأكيد الحضور مباشرة')); await settle();
  await click(document.querySelector('input[type="radio"][value="yes"]'));
  await click(button('إرسال الرد')); await settle();
  assert.ok(document.querySelector('.hub-pass'), 'the reply works without the organizer store');
  assert.equal(localStorage.getItem('doyofy:db:v1'), null, 'replying does not seed it either');
  assert.ok(!Object.keys(localStorage).some((k) => k.startsWith('doyofy:db')), 'no organizer data of any version');
  await act(async () => deviceRoot.unmount());
  // the organizer's own routes still seed their demo
  history.replaceState(null, '', '/app/events');
  createServices();
  assert.ok(localStorage.getItem('doyofy:db:v1'), 'organizer routes keep the demo');
  console.log('PASS DOM guest-link visit on a fresh device seeds no organizer data; organizer routes still do');

  // the general link keeps this device's reply: after a reload the page shows it (summary + «تعديل الرد»), not an empty
  // form, and a correction replaces it
  localStorage.clear();
  const general = portableView({ ...event, date: '2099-08-12', guestExperience: undefined, settings: { ...event.settings, allowGeneralLink: true, defaultPartySize: 3 } }, defaultDesign(event));
  history.replaceState(null, '', `/i/${event.slug}?d=${encodePortableView(general)}`);
  const guestPhone = createServices(); guestPhone.prototype.update({ latencyMs: 0 });
  const onPhone = (node: React.ReactNode) => <ServicesProvider {...guestPhone}><RouterProvider mode="history">{node}</RouterProvider></ServicesProvider>;
  const typeInto = async (el: HTMLInputElement | null | undefined, value: string) => {
    assert.ok(el);
    const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
    await act(async () => { set.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); });
  };
  const genRoot = createRoot(document.getElementById('root')!);
  await act(async () => genRoot.render(onPhone(<GuestInvite slug={event.slug} />))); await settle();
  await click(button('الموعد وتأكيد الحضور مباشرة')); await settle();
  await typeInto(document.querySelector<HTMLInputElement>('main input[autocomplete="name"]'), 'سلمى العتيبي');
  await click(document.querySelector('input[type="radio"][value="yes"]')); await settle();
  // more than one person: the general link asks the companions' names too (as a personal link does)
  assert.ok([...document.querySelectorAll('legend')].some((x) => x.textContent?.includes('أسماء المرافقين')), 'general link asks companions');
  await typeInto(document.querySelector<HTMLInputElement>('input[aria-label^="اسم المرافق"]'), 'نوف');
  await click(button('إرسال الرد')); await settle();
  const hubText = () => document.querySelector('main')?.textContent ?? '';
  assert.ok(hubText().includes('سلمى العتيبي') && hubText().includes('سنحضر بكل سرور') && hubText().includes('نوف'), 'the reply is summarised');
  await act(async () => genRoot.unmount());
  // «reload»: a new page on the same device, same link
  const reloadRoot = createRoot(document.getElementById('root')!);
  await act(async () => reloadRoot.render(onPhone(<GuestInvite slug={event.slug} />))); await settle();
  assert.ok(!document.querySelector('.sig-cover'), 'a guest who replied comes back to the reply, not the cover');
  assert.ok(hubText().includes('سلمى العتيبي') && hubText().includes('سنحضر بكل سرور'), 'the reply survives a reload');
  assert.ok(!document.querySelector('main input[autocomplete="name"]'), 'no empty form after a reload');
  assert.equal((hubText().match(/حُفظ ردكم/g) ?? []).length + (hubText().match(/حُفظ ردّكم/g) ?? []).length, 1, 'the saved line is said once');
  await click(button('تعديل الرد')); await settle();
  assert.equal(document.querySelector<HTMLInputElement>('main input[autocomplete="name"]')?.value, 'سلمى العتيبي', 'editing starts from the saved reply');
  await click(document.querySelector('input[type="radio"][value="no"]'));
  await click(button('إرسال الرد')); await settle();
  await act(async () => reloadRoot.unmount());
  const again = createRoot(document.getElementById('root')!);
  await act(async () => again.render(onPhone(<GuestInvite slug={event.slug} />))); await settle();
  assert.ok(hubText().includes('نعتذر عن الحضور') && !hubText().includes('سنحضر بكل سرور'), 'the correction replaced the reply');
  await act(async () => again.unmount());
  console.log('PASS DOM general link: the reply persists across a reload with its summary and «تعديل الرد»; a correction replaces it');

  // the same memory on the organizer's own demo service (no ?d=): this device's unhandled general reply comes back
  const demo = createServices(); demo.prototype.update({ latencyMs: 0 }); demo.prototype.reset('before');
  const wedding = await demo.services.events.get('evt_wedding');
  assert.equal((await demo.services.guest.open(wedding.slug)).reply, undefined);
  const firstReply = await demo.services.guest.submitRsvp(wedding.slug, null, { name: 'ريم', attending: true, count: 2, companionNames: ['هند'] });
  const back = await demo.services.guest.open(wedding.slug);
  assert.deepEqual(back.reply && [back.reply.id, back.reply.name, back.reply.count, back.reply.companionNames], [firstReply.responseId, 'ريم', 2, ['هند']]);
  await demo.services.guest.submitRsvp(wedding.slug, null, { name: 'ريم', attending: false, count: 0, replaces: firstReply.responseId });
  assert.equal((await demo.services.rsvp.listResponses(wedding.id)).filter((r) => r.name === 'ريم').length, 1, 'a correction stays one reply');
  const target = (await demo.services.parties.list(wedding.id)).find((x) => x.rsvpStatus === 'pending')!;
  await demo.services.rsvp.matchResponse(firstReply.responseId, target.id);
  assert.equal((await demo.services.guest.open(wedding.slug)).reply, undefined, 'once the organizer handled it, the general page starts fresh');
  console.log('PASS DOM demo service: the device remembers its own unhandled general reply');

  // the invitation engine, on its own markup (jsdom: behaviour only)
  type Fake = Record<string, unknown> & { host: HTMLElement; sm: { state: string; send: (e: string) => void } };
  const proto = Studio.prototype as unknown as Record<string, (this: Fake, ...a: unknown[]) => unknown>;
  const stage = (voice: 'ar' | 'ar-EG' | 'ar-SA'): Fake => {
    setStringsVoice(voice);
    const host = document.createElement('div'); host.innerHTML = studioMarkup(); document.body.append(host);
    const sent: string[] = [];
    return { host, sent, voice, cleanups: [], embedded: false, swOpen: false, page: 4, leaving: false, stageRect: { scale: 1 },
      sm: { state: 'pages', send: (e: string) => { sent.push(e); } }, audio: { unlock: () => false, emit: () => {} },
      el: { sheet: host.querySelector('.st-sheet'), page: host.querySelector('.st-page'), done: host.querySelector('.st-done') },
      rsvp: { name: '', attending: 'yes', guests: 2, receipt: { demo: true } }, data: { c: { enAU: 'NOURA', arA: 'نورة', dateShort: '12.08' }, digits: 'arab' },
      theme: { fAr: 'serif' }, doneAction: null, _labelDoneAction: proto._labelDoneAction };
  };
  const esc = () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  // Escape while the follow-up sheet (a dialog above the invitation) is open is the sheet's: the reply page stays
  const keys = stage('ar');
  proto._wireInput.call(keys);
  const sheet = document.createElement('dialog'); sheet.setAttribute('open', ''); document.body.append(sheet);
  esc();
  assert.deepEqual(keys.sent, [], 'Escape on an open dialog leaves the invitation on its reply page');
  sheet.remove();
  esc();
  assert.deepEqual(keys.sent, ['close'], 'with no dialog open, Escape still closes the pages');
  for (const f of keys.cleanups as Array<() => void>) f();
  keys.host.remove();
  // the demo's honesty line and the screen-reader labels speak the organizer's voice
  for (const voice of ['ar', 'ar-EG', 'ar-SA'] as const) {
    const done = stage(voice), k = copyFor(voice);
    proto._renderDone.call(done);
    const line = done.host.querySelector('.done-demo');
    assert.equal(line?.textContent, k.demoOnly, `${voice}: the demo line is voiced`);
    assert.equal(line?.hasAttribute('hidden'), false);
    assert.ok(done.host.querySelector('.st-done-said')?.textContent?.includes(k.demoOnly), `${voice}: focus lands on the thanks with the demo line`);
    assert.equal(done.host.querySelector('[data-act="close"]')?.getAttribute('aria-label'), k.engBackToCard, `${voice}: the close label is voiced`);
    assert.ok(!done.host.querySelector('.st-done')?.hasAttribute('role'), 'the done screen is no live region (focus carries it)');
    done.host.remove();
  }
  setStringsVoice(null);
  assert.equal(copyFor('ar-EG').demoOnly, 'في النسخة دي ردكم بيتحفظ على الجهاز ده بس ومش بيوصل لصاحب المناسبة.');
  console.log('PASS DOM engine: Escape on the follow-up sheet keeps the reply page; the demo line and SR labels are voiced');
}

