import { test } from 'node:test';
import assert from 'node:assert/strict';
import { portableView, encodePortableView, decodePortableView, createPortableGuestApi } from '../../src/domain/portable-invite';
import { defaultDesign } from '../../src/domain/invitation';
import { inviteMessage, reminderMessage, smsUrl, whatsappUrl, selectedLinks } from '../../src/features/guests/share';
import { codeFromScan } from '../../src/domain/checkin';
import type { Event } from '../../src/domain/types';

const event: Event = { id: 'evt', ownerId: 'private-owner', slug: 'test-party', type: 'wedding', title: 'زفاف نورة وفيصل', names: { a: 'نورة', b: 'فيصل' }, date: '2099-08-12', time: '20:00', timeZone: 'Asia/Riyadh', durationHours: 5, venue: { name: 'قاعة الرياض', city: 'الرياض' }, settings: { defaultPartySize: 2, allowGeneralLink: true, revealTableToGuests: false }, createdAt: '', updatedAt: '' };
const party = { code: 'ABCD1234', primaryGuestName: 'منى القحطاني', maxPartySize: 3 };
const view = () => portableView(event, defaultDesign(event), party);

test('portable personal invitation roundtrips Arabic and excludes organizer-only data', () => {
  const encoded = encodePortableView(view());
  const restored = decodePortableView(encoded, event.slug, party.code);
  assert.equal(restored?.party?.name, party.primaryGuestName);
  assert.equal(restored?.design.message.ar, defaultDesign(event).message.ar);
  assert.equal((restored?.event as unknown as Record<string, unknown>).ownerId, undefined);
  assert.equal(decodePortableView(encoded, 'other-event', party.code), null);
  assert.equal(decodePortableView(encoded, event.slug, 'OTHER'), null);
  assert.equal(decodePortableView('bad % payload', event.slug, party.code), null);
  assert.ok(encoded.length < 5000, `portable link should remain practical: ${encoded.length}`);
});

test('portable demo reply reaches confirmed QR identity, persists locally, and cannot affect input snapshot', async () => {
  const mem = new Map<string, string>();
  const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
  const initial = view(), api = createPortableGuestApi(initial, storage);
  const confirmed = await api.submitRsvp(event.slug, party.code, { attending: true, count: 2 });
  assert.equal(confirmed.party?.rsvpStatus, 'confirmed');
  assert.equal(confirmed.party?.code, party.code);
  assert.equal(initial.party?.rsvpStatus, 'pending');
  const reopened = await createPortableGuestApi(view(), storage).open(event.slug, party.code);
  assert.equal(reopened.party?.confirmedPartySize, 2);
  assert.equal(codeFromScan(`DOYOFY:${reopened.party?.code}`), party.code);
  await assert.rejects(api.submitRsvp(event.slug, party.code, { attending: true, count: 4 }));
  await assert.rejects(api.submitRsvp(event.slug, party.code, { attending: true, count: 1.5 }));
  const declined = await api.submitRsvp(event.slug, party.code, { attending: false, count: 0 });
  assert.equal(declined.party?.rsvpStatus, 'declined');
  assert.equal(declined.party?.confirmedPartySize, undefined);
});

test('general portable responses never invent a personal QR identity', async () => {
  const initial = portableView(event, defaultDesign(event));
  const api = createPortableGuestApi(initial);
  const saved = await api.submitRsvp(event.slug, null, { name: 'ضيف', attending: true, count: 1 });
  assert.equal(saved.party, null);
});

test('a general-link reply is kept on this device: a reload shows it, a correction replaces it, a damaged entry is ignored', async () => {
  const mem = new Map<string, string>();
  const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
  const general = () => portableView(event, defaultDesign(event));
  assert.equal((await createPortableGuestApi(general(), storage).open(event.slug)).reply, undefined, 'a fresh device has no reply');
  const sent = await createPortableGuestApi(general(), storage).submitRsvp(event.slug, null, { name: ' سلمى ', attending: true, count: 2, companionNames: ['نوف', 'زائد'] });
  assert.deepEqual(sent.reply && { name: sent.reply.name, count: sent.reply.count, companions: sent.reply.companionNames }, { name: 'سلمى', count: 2, companions: ['نوف'] });
  // «reload»: a new API over the same device storage
  const reopened = await createPortableGuestApi(general(), storage).open(event.slug);
  assert.equal(reopened.reply?.name, 'سلمى'); assert.equal(reopened.reply?.attending, true); assert.equal(reopened.reply?.count, 2);
  assert.equal(reopened.party, null, 'still no personal identity');
  await createPortableGuestApi(general(), storage).submitRsvp(event.slug, null, { name: 'سلمى', attending: false, count: 0, replaces: reopened.reply!.id });
  const corrected = await createPortableGuestApi(general(), storage).open(event.slug);
  assert.equal(corrected.reply?.attending, false); assert.equal(corrected.reply?.count, 0);
  // a stored reply that does not fit this invitation is dropped, never shown
  for (const bad of ['{"reply":{"id":"x","name":"","attending":true,"count":1}}', '{"reply":{"id":"x","name":"س","attending":true,"count":9}}', 'not json']) {
    const [key] = [...mem.keys()];
    mem.set(key!, bad);
    assert.equal((await createPortableGuestApi(general(), storage).open(event.slug)).reply, undefined, bad);
  }
  // a shared link never carries someone's reply
  const carried = decodePortableView(encodePortableView({ ...general(), reply: { id: 'r', name: 'غريب', attending: true, count: 1 } }), event.slug);
  assert.equal(carried?.reply, undefined);
});

test('SMS and WhatsApp encode one validated normalized recipient; copied links include guests without phone', () => {
  assert.equal(smsUrl('05 5987 6543', 'مرحبا & رابط', false), 'sms:+966559876543?body=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%20%26%20%D8%B1%D8%A7%D8%A8%D8%B7');
  assert.ok(smsUrl('+966559876543', 'رابط', true)?.startsWith('sms:+966559876543&body='));
  assert.equal(smsUrl('bad-number', 'text'), undefined);
  assert.ok(whatsappUrl('٠٥٥٩٨٧٦٥٤٣', 'دعوة').startsWith('https://wa.me/966559876543?text='));
  assert.equal(selectedLinks([party], p => `https://example.com/i/${p.code}`), `${party.primaryGuestName}\nhttps://example.com/i/${party.code}`);
  // every voice addresses the guests in the plural; the Saudi greeting is «حيّاكم الله»
  assert.match(inviteMessage(event, party, 'https://example.com', 'ar'), /دعوتكم إلى/);
  assert.match(inviteMessage(event, party, 'https://example.com', 'ar-EG'), /مستنيينكم في/);
  assert.match(inviteMessage(event, party, 'https://example.com', 'ar-SA'), /^حيّاكم الله .*\nنتشرّف بحضوركم في/);
  for (const d of ['ar', 'ar-EG', 'ar-SA'] as const) {
    const text = inviteMessage(event, party, 'https://example.com/i/x', d);
    assert.ok(text.includes(party.primaryGuestName) && text.endsWith('https://example.com/i/x') && !/\{\w+\}/.test(text), `${d}: ${text}`);
    assert.ok(!/\{\w+\}/.test(reminderMessage(event, party, 'https://example.com/i/x', d)));
  }
});
