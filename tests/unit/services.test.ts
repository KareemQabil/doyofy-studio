// Service layer end to end against the mock implementation (what the NestJS API must also satisfy).
import { test, before } from 'node:test';
import assert from 'node:assert/strict';

before(() => {
  const mem = new Map<string, string>();
  (globalThis as unknown as { window: unknown }).window = { localStorage: { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) }, addEventListener() {} };
});

test('journey: create → publish → guest → RSVP from link → seat → partial + full check-in → counts & activity', async () => {
  const { createServices } = await import('../../src/services/index');
  const { services: s, prototype } = createServices();
  prototype.update({ latencyMs: 0 });
  const today = s.clock.now();
  const date = new Date(today.getTime() + 20 * 864e5).toISOString().slice(0, 10);

  await assert.rejects(s.events.create({ type: 'wedding', names: { a: 'سارة', b: '' }, date, time: '20:00', venue: { name: 'قاعة', city: 'الرياض' } }), /اكتب اسم العريس/, 'the message names the field it sits under');
  const ev = await s.events.create({ type: 'wedding', names: { a: 'سارة', b: 'أحمد', aEn: 'Sara', bEn: 'Ahmed' }, date, time: '20:00', venue: { name: 'قاعة الورد', city: 'الرياض' } });
  assert.equal(ev.title, 'زفاف سارة وأحمد');
  assert.equal(ev.slug, 'sara-ahmed');
  // less data: the names and the date are enough — the time defaults to 8:00 PM and the place stays blank until added
  const bare = await s.events.create({ type: 'graduation', names: { a: 'جود' }, date });
  assert.equal(bare.time, '20:00');
  assert.deepEqual(bare.venue, { name: '', city: '' });
  assert.equal(bare.title, 'حفل تخرج جود');
  const placed = await s.events.update(bare.id, { venue: { ...bare.venue, name: 'قاعة الريحان', city: 'الرياض' } });
  assert.equal(placed.venue.name, 'قاعة الريحان', 'the place can be added later');
  await assert.rejects(s.events.create({ type: 'graduation', names: { a: 'جود' }, date: '' }), /اختر التاريخ/);

  // guest link fails until the invitation is published
  const p = await s.parties.create(ev.id, { primaryGuestName: 'عائلة الدوسري', phone: '0551203344', maxPartySize: 4 });
  await assert.rejects(s.guest.open(ev.slug, p.code), (e: Error & { code?: string }) => e.code === 'not_published');
  await s.invitations.publish(ev.id);

  const opened = await s.guest.open(ev.slug, p.code);
  assert.equal(opened.party?.name, 'عائلة الدوسري');
  assert.equal((await s.parties.get(p.id)).delivery.status, 'opened');

  await assert.rejects(s.guest.submitRsvp(ev.slug, p.code, { attending: true, count: 5 }), /أكبر من المسموح/);
  await s.guest.submitRsvp(ev.slug, p.code, { attending: true, count: 4 });
  let party = await s.parties.get(p.id);
  assert.equal(party.rsvpStatus, 'confirmed');
  assert.equal(party.confirmedPartySize, 4);

  const [t] = await s.seating.createTables(ev.id, [{ name: 'طاولة 1', capacity: 10 }]);
  await s.seating.assign(p.id, t!.id);
  await s.checkIn.checkIn(p.id, 2, { method: 'qr', by: 'test', exceptions: [] });
  party = await s.parties.get(p.id);
  assert.equal(party.checkInStatus, 'partial');
  const second = await s.checkIn.checkIn(p.id, 2, { method: 'search', by: 'test', exceptions: [] });
  assert.equal(second.party.checkInStatus, 'checked_in');
  assert.equal(second.party.checkedInCount, 4);
  const undone = await s.checkIn.undo(second.record.id);
  assert.equal(undone.checkedInCount, 2);
  assert.equal(undone.checkInStatus, 'partial');

  const kinds = (await s.activity.list(ev.id, 50)).map((a) => a.kind);
  for (const k of ['event_created', 'party_added', 'invitation_published', 'invitation_opened', 'rsvp_confirmed', 'party_seated', 'checked_in_partial', 'checked_in', 'check_in_undone']) assert.ok(kinds.includes(k as never), k);
});

test('general link replies wait for matching; offline mode fails with a human message', async () => {
  const { createServices } = await import('../../src/services/index');
  const { services: s, prototype } = createServices();
  prototype.update({ latencyMs: 0, offline: false });
  prototype.reset('before');
  const r = await s.guest.submitRsvp('noura-faisal', null, { name: 'ضيف جديد', attending: true, count: 2 });
  const un = (await s.rsvp.listResponses('evt_wedding')).filter((x) => !x.partyId && !x.resolution);
  assert.ok(un.some((x) => x.id === r.responseId));
  const added = await s.rsvp.addPartyFromResponse(r.responseId);
  assert.equal(added.rsvpStatus, 'confirmed');
  prototype.update({ offline: true });
  await assert.rejects(s.events.list(), /لا يوجد اتصال/);
  prototype.update({ offline: false });
});

test('all 13 occasions complete the simplified journey with their own starter, public replies, reception and archive', async () => {
  const { createServices } = await import('../../src/services/index');
  const { EVENT_TYPES } = await import('../../src/domain/event');
  const { defaultDesign } = await import('../../src/domain/invitation');
  const { OCCASION_STARTERS } = await import('../../src/domain/occasion-starters');
  const { presetById } = await import('../../src/domain/templates');
  const { services:s,prototype }=createServices();prototype.update({latencyMs:0,offline:false});
  const date=new Date(s.clock.now().getTime()+35*864e5).toISOString().slice(0,10);
  for(const type of EVENT_TYPES){
    const ev=await s.events.create({type:type.id,title:`مناسبة ${type.label}`,names:{a:`إنجاز ${type.label}`,aEn:`Moment ${type.id}`,...(type.couple?{b:'شريك اللحظة',bEn:'Partner'}:{})},date,time:'19:00',venue:{name:'قاعة الاحتفاء',city:'الرياض'}});
    await s.events.update(ev.id,{settings:{allowGeneralLink:true}});
    const starter=presetById(OCCASION_STARTERS[type.id].presetId)!;
    const design=await s.invitations.saveDraft(ev.id,defaultDesign(ev));assert.equal(design.draft.cardId,starter.cardId,type.id);assert.equal(design.draft.sceneId,starter.sceneId,type.id);
    assert.deepEqual(design.draft.message,defaultDesign(ev).message);
    await assert.rejects(s.guest.open(ev.slug),e=>(e as {code:string}).code==='not_published');
    const p=await s.parties.create(ev.id,{primaryGuestName:'عائلة الاختبار',maxPartySize:3});await s.invitations.publish(ev.id);
    await s.guest.open(ev.slug,p.code);await assert.rejects(s.guest.submitRsvp(ev.slug,p.code,{attending:true,count:4}));
    await s.guest.submitRsvp(ev.slug,p.code,{attending:false,count:0});assert.equal((await s.parties.get(p.id)).rsvpStatus,'declined');
    await s.guest.submitRsvp(ev.slug,p.code,{attending:true,count:3});assert.equal((await s.guest.open(ev.slug,p.code)).party?.confirmedPartySize,3);
    const reply=await s.guest.submitRsvp(ev.slug,null,{name:'ضيف الرابط العام',attending:true,count:1});
    const added=await s.rsvp.addPartyFromResponse(reply.responseId);assert.equal(added.rsvpStatus,'confirmed');
    await s.events.markCheckInPrepared(ev.id);
    assert.equal((await s.checkIn.findByCode(ev.id,p.code))?.id,p.id);
    const first=await s.checkIn.checkIn(p.id,1,{method:'search',by:'test',exceptions:[]});assert.equal(first.party.checkInStatus,'partial');
    const rest=await s.checkIn.checkIn(p.id,2,{method:'qr',by:'test',exceptions:[]});assert.equal(rest.party.checkedInCount,3);
    assert.equal((await s.checkIn.undo(rest.record.id)).checkedInCount,1);await assert.rejects(s.checkIn.undo(rest.record.id));
    await s.events.archive(ev.id);await assert.rejects(s.guest.open(ev.slug,p.code),e=>(e as {code:string}).code==='not_found');
    await s.events.restore(ev.id);assert.equal((await s.guest.open(ev.slug,p.code)).design.cardId,starter.cardId);
    assert.equal((await s.checkIn.list(ev.id)).filter(r=>!r.undone).length,1);
  }
});

test('reminders are recorded only when the organizer confirms them; nothing simulates a send', async () => {
  const { createServices } = await import('../../src/services/index');
  const { services: s } = createServices();
  const ev = (await s.events.list())[0]!;
  const p = await s.parties.create(ev.id, { primaryGuestName: 'تذكير مؤكد', phone: '0551112299', maxPartySize: 2 });
  assert.equal('sendReminder' in s.parties, false, 'no fake reminder path');
  await s.parties.markShared([p.id], 'manual');
  assert.equal((await s.parties.get(p.id)).delivery.reminderAt, undefined, 'sharing is not a reminder');
  assert.equal(await s.parties.markReminded([p.id]), 1);
  const after = await s.parties.get(p.id);
  assert.ok(after.delivery.reminderAt);
  assert.equal(after.delivery.status, 'shared', 'the delivery state is untouched');
  const log = (await s.activity.list(ev.id)).find((a) => a.kind === 'reminder_sent' && a.partyId === p.id);
  assert.ok(log && log.data.how === 'manual');
  // a guest who already replied is not reminded
  await s.rsvp.setByOrganizer(p.id, { attending: true, count: 1 });
  assert.equal(await s.parties.markReminded([p.id]), 0);
});

test('import creates the missing tables it was asked to and keeps each guest\'s planned table, in one write', async () => {
  const { createServices } = await import('../../src/services/index');
  const { services: s } = createServices();
  const ev = await s.events.create({ type: 'birthday', names: { a: 'طاولات الملف' }, date: '2027-06-20', time: '20:00', venue: { name: 'قاعة', city: 'الرياض' } });
  await s.seating.createTables(ev.id, [{ name: 'طاولة 1', capacity: 8 }]);
  const made = await s.parties.importMany(ev.id, [
    { primaryGuestName: 'أ', maxPartySize: 2, tableName: 'طاولة 1' },
    { primaryGuestName: 'ب', maxPartySize: 2, tableName: 'الشرفة' },
    { primaryGuestName: 'ج', maxPartySize: 2 },
  ], { skipped: 0, source: 'ملف', newTables: ['الشرفة'] });
  const tables = await s.seating.listTables(ev.id);
  assert.deepEqual(tables.map((t) => t.name), ['طاولة 1', 'الشرفة']);
  assert.equal(made[0]!.tableId, tables[0]!.id);
  assert.equal(made[1]!.tableId, tables[1]!.id);
  assert.equal(made[2]!.tableId, undefined);
  assert.equal(made[1]!.rsvpStatus, 'pending', 'a planned table does not confirm anyone');
});

test('a new account starts empty (no demo events); the demo comes back on request', async () => {
  const { createServices } = await import('../../src/services/index');
  const { services: s, prototype } = createServices();
  prototype.reset('empty');
  assert.equal((await s.events.list()).length, 0);
  assert.equal(prototype.scenario(), 'empty');
  prototype.reset('before');
  assert.ok((await s.events.list()).length > 0);
});
