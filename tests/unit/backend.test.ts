// The Vercel backend (api/router.ts) against its in-memory storage — no network, no Blob store — plus the client side:
// the public snapshot (privacy), merging remote replies into the mock store, the sync loop, and the fallbacks when the
// backend is off (which is what every other suite runs with: the sandbox has no BLOB_READ_WRITE_TOKEN).
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { createApi, memoryStorage, LIMITS, type ApiDeps } from '../../api/router';

const mem = new Map<string, string>();
before(() => {
  (globalThis as unknown as { window: unknown }).window = { localStorage: { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) }, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; } };
});

const KEY = 'k'.repeat(40), OTHER = 'o'.repeat(40);
const ORIGIN = 'https://doyofy.test';
function api(extra: Partial<ApiDeps> = {}) {
  const storage = memoryStorage();
  let clock = new Date('2030-01-01T10:00:00Z');
  const handle = createApi({ storage, secret: 'server-secret', now: () => clock, ...extra });
  const call = async (method: string, path: string, body?: unknown, headers: Record<string, string> = {}) => {
    const r = await handle(new Request(`${ORIGIN}${path}`, { method, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body) }));
    return { status: r.status, body: await r.json() as Record<string, any>, headers: r.headers };
  };
  return { storage, call, setNow: (d: string) => { clock = new Date(d); } };
}
const owner = (key = KEY) => ({ Authorization: `Bearer ${key}` });

function snapshot(slug = 'sara-ahmed-x7k2pq', extra: Record<string, unknown> = {}) {
  return {
    v: 1,
    event: { id: 'evt_1', slug, type: 'wedding', title: 'زفاف سارة وأحمد', names: { a: 'سارة', b: 'أحمد' }, date: '2030-02-01', time: '20:00', timeZone: 'Asia/Riyadh', durationHours: 5, venue: { name: 'قاعة الورد', city: 'الرياض', mapUrl: 'javascript:alert(1)' } },
    startsAt: '2030-02-01T17:00:00.000Z', endsAt: '2030-02-01T22:00:00.000Z',
    design: { experience: { dimension: '2d', motion: 'animated' }, cardId: 'wedding-classic', sceneId: 'garden', displayNames: {}, message: { ar: 'يسعدنا', en: '' }, program: [], audio: { mode: 'library', trackId: 'audio_1', trackUrl: 'https://evil.example/x.mp3' } },
    general: { allowed: true, maxGuests: 2 },
    experience: { revision: 3, meals: { enabled: true, required: false, options: [{ id: 'fish', label: 'سمك' }, { id: 'old', label: 'قديم', archived: true }] }, dietary: { enabled: true }, gifts: { enabled: false, afterDecline: false, items: [] } },
    guests: [
      { code: 'ABC12', name: 'عائلة الدوسري', max: 4, status: 'pending', phone: '+966551203344', notes: 'VIP — call his cousin', side: 'أهل العريس' },
      { code: 'XYZ89', name: 'ريم', max: 1, status: 'confirmed', count: 1, at: '2029-12-01T10:00:00.000Z' },
    ],
    ownerPhone: '+966500000000',
    ...extra,
  };
}

test('backend off: health says so and every other route answers 503', async () => {
  const { call } = api({ storage: null });
  assert.deepEqual((await call('GET', '/api/health')).body, { backend: false });
  assert.equal((await call('GET', '/api/invite/sara-ahmed-x7k2pq/ABC12')).status, 503);
  assert.equal((await call('PUT', '/api/events/sara-ahmed-x7k2pq', snapshot(), owner())).status, 503);
  const on = api();
  assert.deepEqual((await on.call('GET', '/api/health')).body, { backend: true });
  // the vercel.json rewrite form (?route=) and the direct path are the same route
  assert.deepEqual((await on.call('GET', '/api/router?route=health')).body, { backend: true });
});

test('owner key: the first write registers it (hash only), later writes need the same key', async () => {
  const { call, storage } = api();
  assert.equal((await call('PUT', '/api/events/sara-ahmed-x7k2pq', snapshot())).status, 401, 'no key');
  assert.equal((await call('PUT', '/api/events/sara-ahmed-x7k2pq', snapshot(), owner('short'))).status, 401, 'malformed key');
  assert.equal((await call('PUT', '/api/events/sara-ahmed-x7k2pq', snapshot(), owner())).status, 200);
  assert.equal((await call('PUT', '/api/events/sara-ahmed-x7k2pq', snapshot(), owner(OTHER))).status, 401, 'another device cannot overwrite');
  assert.equal((await call('PUT', '/api/events/sara-ahmed-x7k2pq', snapshot(), owner())).status, 200);
  const all = [...storage.dump().entries()];
  assert.ok(all.every(([, v]) => !v.includes(KEY)), 'the key itself is never stored');
  assert.ok(all.every(([k]) => !k.includes('sara-ahmed')), 'data pathnames are HMACs, not guessable from the slug');
  assert.equal(all.filter(([k]) => k.includes('/s/')).length, 2, 'snapshot versions are pruned to two');
  assert.equal((await call('GET', '/api/replies/sara-ahmed-x7k2pq')).status, 401, 'reading replies needs the key');
  assert.equal((await call('GET', '/api/replies/sara-ahmed-x7k2pq', undefined, owner(OTHER))).status, 401);
});

test('privacy: the server stores and serves only the public whitelist', async () => {
  const { call, storage } = api();
  await call('PUT', '/api/events/sara-ahmed-x7k2pq', snapshot(), owner());
  const stored = [...storage.dump().values()].join('\n');
  for (const secret of ['+966551203344', 'VIP', 'cousin', 'أهل العريس', '+966500000000', 'evil.example', 'javascript:']) assert.ok(!stored.includes(secret), `stored data leaks ${secret}`);
  const view = (await call('GET', '/api/invite/sara-ahmed-x7k2pq/ABC12')).body;
  assert.equal(view.party.name, 'عائلة الدوسري');
  assert.equal(view.party.maxPartySize, 4);
  assert.equal(view.maxGuests, 4);
  assert.equal(view.canEdit, true);
  assert.equal(view.phase, 'before');
  assert.equal(view.design.audio.trackUrl, undefined, 'only this store\'s audio URLs are kept');
  assert.deepEqual(view.experience.meals.options.map((o: { id: string }) => o.id), ['fish'], 'archived choices stay out of sight');
  assert.equal(JSON.stringify(view).includes('XYZ89'), false, 'one guest never sees another guest');
  const general = (await call('GET', '/api/invite/sara-ahmed-x7k2pq')).body;
  assert.equal(general.party, null);
  assert.equal(general.maxGuests, 2);
  assert.equal(JSON.stringify(general).includes('ABC12'), false);
  assert.equal((await call('GET', '/api/invite/sara-ahmed-x7k2pq/NOPE1')).status, 404);
  assert.equal((await call('GET', '/api/invite/other-event-123')).status, 404);
  // the client snapshot itself never carries private fields either (services/mock/cloud-bridge.ts)
  const { buildSeed } = await import('../../src/services/mock/seed');
  const { eventSnapshot } = await import('../../src/services/mock/cloud-bridge');
  const db = buildSeed(new Date('2026-11-01T10:00:00Z'), 'before');
  const snap = eventSnapshot(db, 'evt_wedding', { slug: 'noura-faisal-abcdef', dialect: 'ar-EG' })!;
  const text = JSON.stringify(snap);
  for (const p of db.parties.filter((x) => x.eventId === 'evt_wedding')) {
    if (p.phone) assert.ok(!text.includes(p.phone), 'phone leaked');
    if (p.notes) assert.ok(!text.includes(p.notes), 'organizer note leaked');
  }
  assert.ok(!/"phone"|"notes"|"side"|"delivery"|"ownerId"/.test(text));
  assert.equal(snap.dialect, 'ar-EG');
  assert.equal(snap.event.slug, 'noura-faisal-abcdef');
  // and the real seed snapshot is accepted by the real server as is
  const real = api();
  assert.equal((await real.call('PUT', '/api/events/noura-faisal-abcdef', snap, owner())).status, 200);
});

test('less data: an event with only names + date (blank place, or none sent) is accepted and served as such', async () => {
  const { call } = api();
  const base = snapshot('jood-bday-abc123');
  const bare = { ...base, event: { ...base.event, venue: { name: '', city: '' } } };
  assert.equal((await call('PUT', '/api/events/jood-bday-abc123', bare, owner())).status, 200);
  const view = (await call('GET', '/api/invite/jood-bday-abc123/ABC12')).body;
  assert.deepEqual([view.event.venue.name, view.event.venue.city], ['', '']);
  const { venue: _v, time: _t, ...noPlace } = base.event;
  assert.equal((await call('PUT', '/api/events/jood-bday-abc123', { ...base, event: noPlace }, owner())).status, 200);
  const again = (await call('GET', '/api/invite/jood-bday-abc123/ABC12')).body;
  assert.equal(again.event.time, '20:00', 'the default time');
  assert.equal(again.event.venue.name, '');
});

test('replies: allowance, names, questions, closing time and the naive rate limit', async () => {
  const { call, setNow } = api();
  await call('PUT', '/api/events/sara-ahmed-x7k2pq', snapshot(), owner());
  const post = (path: string, body: unknown, headers?: Record<string, string>) => call('POST', `/api/replies/sara-ahmed-x7k2pq${path}`, body, headers);
  assert.equal((await post('/ABC12', { attending: true, count: 5 })).status, 422, 'over the allowance');
  assert.equal((await post('/ABC12', { attending: true, count: 0 })).status, 422);
  assert.equal((await post('/ABC12', { attending: true, count: 2, meals: [{ optionId: 'old', count: 1 }] })).status, 422, 'archived meal');
  assert.equal((await post('/ABC12', { attending: true, count: 2, dietary: { answered: true, needs: ['nuts', 'rocks'] } })).status, 422);
  assert.equal((await post('', { attending: true, count: 1 })).status, 422, 'the general link needs a name');
  assert.equal((await post('/NOPE1', { attending: false, count: 0 })).status, 404);
  assert.equal((await post('/ABC12', 'not json', { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await post('/ABC12', { attending: false, count: 0, note: 'x'.repeat(LIMITS.replyBytes) })).status, 413);
  assert.equal((await post('/ABC12', { attending: false, count: 0 }, { 'Sec-Fetch-Site': 'cross-site' })).status, 403, 'same-origin only');
  assert.equal((await post('/ABC12', { attending: false, count: 0 }, { Origin: 'https://evil.example' })).status, 403);

  const ok = await post('/ABC12', { attending: true, count: 3, companionNames: ['سلمى', 'خالد', 'زائد', 'أكثر'], meals: [{ optionId: 'fish', count: 2 }], note: 'مبروك', phone: '+966511111111' });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.reply.count, 3);
  assert.deepEqual(ok.body.reply.companionNames, ['سلمى', 'خالد'], 'companions are capped at the party size');
  assert.equal(ok.body.reply.phone, undefined);
  assert.equal(ok.body.view.party.rsvpStatus, 'confirmed');
  assert.equal(ok.body.view.party.confirmedPartySize, 3);
  // the latest reply wins and the guest's link shows it from any device
  await post('/ABC12', { attending: false, count: 0 });
  assert.equal((await call('GET', '/api/invite/sara-ahmed-x7k2pq/ABC12')).body.party.rsvpStatus, 'declined');

  let last = 0;
  for (let i = 0; i < LIMITS.repliesPerWindow + 2; i++) last = (await post('/XYZ89', { attending: true, count: 1 })).status;
  assert.equal(last, 429);
  setNow('2030-02-01T18:00:00Z');
  assert.equal((await post('/ABC12', { attending: true, count: 1 })).status, 409, 'replies close when the event starts');
  assert.equal((await call('GET', '/api/invite/sara-ahmed-x7k2pq/ABC12')).body.canEdit, false);
  assert.equal((await call('GET', '/api/invite/sara-ahmed-x7k2pq/ABC12')).body.phase, 'event_day');
});

test('general link: a correction replaces its own reply; the organizer pulls replies with a cursor', async () => {
  const { call, setNow } = api();
  await call('PUT', '/api/events/sara-ahmed-x7k2pq', snapshot(), owner());
  const first = (await call('POST', '/api/replies/sara-ahmed-x7k2pq', { name: ' منى ', attending: true, count: 2 })).body.reply;
  assert.equal(first.name, 'منى');
  assert.equal(first.code, null);
  assert.match(first.id, /^[a-z0-9]{20}$/);
  setNow('2030-01-01T10:05:00Z');
  const fixed = (await call('POST', '/api/replies/sara-ahmed-x7k2pq', { name: 'منى', attending: true, count: 1, replaces: first.id })).body.reply;
  assert.equal(fixed.id, first.id, 'same reply, corrected');
  const forged = (await call('POST', '/api/replies/sara-ahmed-x7k2pq', { name: 'X', attending: false, count: 0, replaces: 'zzzzzzzzzzzzzzzzzzzz' })).body.reply;
  assert.notEqual(forged.id, 'zzzzzzzzzzzzzzzzzzzz', 'an unknown id is a new reply, never someone else\'s');
  assert.equal((await call('GET', `/api/invite/sara-ahmed-x7k2pq?reply=${first.id}`)).body.reply.count, 1, 'this device sees its own reply again');

  const pulled = (await call('GET', '/api/replies/sara-ahmed-x7k2pq?since=0', undefined, owner())).body;
  assert.equal(pulled.replies.length, 2, 'one entry per reply: the corrected one replaced the first');
  assert.ok(pulled.replies.some((r: { id: string; count: number }) => r.id === first.id && r.count === 1));
  const again = (await call('GET', `/api/replies/sara-ahmed-x7k2pq?since=${pulled.cursor}`, undefined, owner())).body;
  assert.equal(again.replies.length, 0);
  setNow('2030-01-01T10:10:00Z');
  await call('POST', '/api/replies/sara-ahmed-x7k2pq/ABC12', { attending: true, count: 2 });
  const next = (await call('GET', `/api/replies/sara-ahmed-x7k2pq?since=${pulled.cursor}`, undefined, owner())).body;
  assert.deepEqual(next.replies.map((r: { code: string }) => r.code), ['ABC12']);
  // a general link the organizer turned off stops taking replies
  await call('PUT', '/api/events/sara-ahmed-x7k2pq', snapshot(undefined, { general: { allowed: false, maxGuests: 2 } }), owner());
  assert.equal((await call('POST', '/api/replies/sara-ahmed-x7k2pq', { name: 'منى', attending: false, count: 0 })).status, 404);
  assert.equal((await call('GET', '/api/invite/sara-ahmed-x7k2pq')).status, 404);
  // an archived event disappears for guests
  await call('PUT', '/api/events/sara-ahmed-x7k2pq', snapshot(undefined, { archived: true }), owner());
  assert.equal((await call('GET', '/api/invite/sara-ahmed-x7k2pq/ABC12')).status, 404);
});

test('upload: owner key, the event\'s own path, audio types and 8 MB only', async () => {
  const seen: Record<string, unknown>[] = [];
  const { call } = api({
    token: 'vercel_blob_rw_store_secret',
    upload: async ({ body, onBeforeGenerateToken }) => {
      const p = (body as { payload: { pathname: string; clientPayload: string } }).payload;
      seen.push(await onBeforeGenerateToken(p.pathname, p.clientPayload));
      return { type: 'blob.generate-client-token', clientToken: 'client-token' };
    },
  });
  await call('PUT', '/api/events/sara-ahmed-x7k2pq', snapshot(), owner());
  const body = (pathname: string, slug = 'sara-ahmed-x7k2pq') => ({ type: 'blob.generate-client-token', payload: { pathname, clientPayload: JSON.stringify({ slug }), multipart: false } });
  assert.equal((await call('POST', '/api/upload', body('a/sara-ahmed-x7k2pq/audio_1.mp3'))).status, 401);
  assert.equal((await call('POST', '/api/upload', body('a/sara-ahmed-x7k2pq/audio_1.mp3'), owner(OTHER))).status, 401);
  assert.equal((await call('POST', '/api/upload', body('a/another-event-12/audio_1.mp3'), owner())).status, 400, 'only under its own event');
  assert.equal((await call('POST', '/api/upload', body('e/../owner.json'), owner())).status, 400);
  const ok = await call('POST', '/api/upload', body('a/sara-ahmed-x7k2pq/audio_1.mp3'), owner());
  assert.equal(ok.status, 200);
  assert.equal(ok.body.clientToken, 'client-token');
  assert.equal(seen[0]!.maximumSizeInBytes, 8 * 1024 * 1024);
  assert.ok((seen[0]!.allowedContentTypes as string[]).every((t) => t.startsWith('audio/')));
  const del = await call('DELETE', '/api/upload', { slug: 'sara-ahmed-x7k2pq', url: 'https://store.public.blob.vercel-storage.com/a/another-event-12/x.mp3' }, owner());
  assert.equal(del.status, 400, 'cannot delete another event\'s file');
  assert.equal((await api().call('POST', '/api/upload', body('a/sara-ahmed-x7k2pq/a.mp3'), owner())).status, 501, 'no upload handshake without a token');
});

test('merging remote replies into the mock store: applied once, counted like any reply', async () => {
  const { MockStore } = await import('../../src/services/mock/store');
  const { buildSeed } = await import('../../src/services/mock/seed');
  const { applyRemoteReplies } = await import('../../src/services/mock/cloud-bridge');
  mem.clear();
  const store = new MockStore(buildSeed);
  const p = store.read().parties.find((x) => x.eventId === 'evt_wedding' && x.rsvpStatus === 'pending')!;
  const applied: Record<string, string> = {};
  const at = new Date().toISOString();
  const replies = [
    { id: 'r1aaaaaaaaaaaaaaaaaa', code: p.code, name: 'ignored', attending: true, count: Math.min(2, p.maxPartySize), note: 'جايين', at },
    { id: 'g1aaaaaaaaaaaaaaaaaa', code: null, name: 'ضيف من الرابط العام', attending: true, count: 1, at },
  ];
  assert.equal(applyRemoteReplies(store, 'evt_wedding', replies, applied), 2);
  const after = store.read().parties.find((x) => x.id === p.id)!;
  assert.equal(after.rsvpStatus, 'confirmed');
  assert.equal(after.guestNote, 'جايين');
  assert.equal(after.primaryGuestName, p.primaryGuestName, 'a reply never renames the guest');
  assert.equal(after.delivery.status, 'opened');
  const general = store.read().responses.filter((r) => r.name === 'ضيف من الرابط العام');
  assert.equal(general.length, 1);
  assert.equal(general[0]!.channel, 'general_link');
  assert.ok(store.read().activity.some((a) => a.kind === 'rsvp_unmatched' && a.actor === 'guest'));
  assert.equal(applyRemoteReplies(store, 'evt_wedding', replies, applied), 0, 'the same replies are not applied twice');
  // a correction of the general reply updates it in place
  applyRemoteReplies(store, 'evt_wedding', [{ ...replies[1]!, count: 2, at: new Date(Date.now() + 1000).toISOString() }], applied);
  assert.equal(store.read().responses.filter((r) => r.name === 'ضيف من الرابط العام').length, 1);
  assert.equal(store.read().responses.find((r) => r.name === 'ضيف من الرابط العام')!.count, 2);
  // over the allowance (the organizer lowered it meanwhile) is held to the allowance
  applyRemoteReplies(store, 'evt_wedding', [{ ...replies[0]!, count: 40, at: new Date(Date.now() + 2000).toISOString() }], applied);
  assert.equal(store.read().parties.find((x) => x.id === p.id)!.confirmedPartySize, p.maxPartySize);
});

test('sync: off → nothing is sent and links stay portable; on → snapshot sent, short link, replies merged', async () => {
  const { MockStore } = await import('../../src/services/mock/store');
  const { buildSeed } = await import('../../src/services/mock/seed');
  const { CloudState } = await import('../../src/services/cloud/state');
  const { startCloudSync } = await import('../../src/services/cloud/sync');
  mem.clear();
  const store = new MockStore(buildSeed);
  const sent: Array<{ slug: string; snap: { guests: Array<{ code: string }> } }> = [];
  const calls = {
    putEvent: async (slug: string, _key: string, snap: unknown) => { sent.push({ slug, snap: snap as never }); return 'ok' as const; },
    fetchReplies: async () => ({ replies: [], cursor: 0, more: false }),
    uploadAudio: async () => 'https://s.public.blob.vercel-storage.com/a/x/y.mp3',
    deleteAudio: async () => true,
  };
  const off = new CloudState(null);
  const stopOff = startCloudSync(store, off, { isOn: async () => false, calls, debounceMs: 1 });
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(sent.length, 0);
  assert.equal(off.status(), false);
  const party = store.read().parties.find((p) => p.eventId === 'evt_wedding')!;
  assert.equal(off.guestPath('evt_wedding', party.code), null, 'off: the portable ?d= link is used');
  stopOff();

  const on = new CloudState(null);
  let pulls = 0;
  const pending = store.read().parties.find((p) => p.eventId === 'evt_wedding' && p.rsvpStatus === 'pending')!;
  const stop = startCloudSync(store, on, {
    isOn: async () => true, debounceMs: 1, pullEveryMs: 60000,
    calls: { ...calls, fetchReplies: async () => (pulls++ ? { replies: [], cursor: 5, more: false } : { replies: [{ id: 'r2aaaaaaaaaaaaaaaaaa', code: pending.code, name: '', attending: false, count: 0, at: new Date().toISOString() }], cursor: 5, more: false }) },
  });
  await new Promise((r) => setTimeout(r, 80));
  const wedding = sent.find((s) => s.snap.guests.some((g) => g.code === party.code))!;
  assert.ok(wedding, 'the wedding snapshot was sent');
  assert.match(wedding.slug, /^noura-faisal-[a-z2-9]{6}$/);
  assert.equal(on.guestPath('evt_wedding', party.code), `/i/${wedding.slug}/${party.code}`);
  assert.equal(on.guestPath('evt_wedding', 'NOTSYNCED'), null, 'a guest not in the last snapshot keeps the portable link');
  assert.equal(store.read().parties.find((p) => p.id === pending.id)!.rsvpStatus, 'declined', 'a reply from another device reached the organizer');
  const count = sent.length;
  await new Promise((r) => setTimeout(r, 50));
  // the merged reply changed the event once; nothing changes after that, so nothing more is sent
  const settled = sent.length;
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(sent.length, settled);
  assert.ok(settled >= count);
  stop();
});

test('guest side: local first, the backend only for links this device does not know, and only when it is on', async () => {
  const { withRemoteFallback } = await import('../../src/services/cloud/guest');
  const { AppError } = await import('../../src/services/errors');
  const local = { open: async () => { throw new AppError('not_found', 'محلي'); }, submitRsvp: async () => { throw new Error('local submit'); } };
  const remoteView = { event: { slug: 's-abcdef' }, design: {}, party: null } as never;
  const remote = { open: async () => remoteView, submitRsvp: async () => ({ ...(remoteView as object), responseId: 'x' }) as never };
  const off = withRemoteFallback(local, remote, async () => false);
  await assert.rejects(off.open('s-abcdef'), /محلي/, 'off: the local answer stands');
  const on = withRemoteFallback(local, remote, async () => true);
  assert.equal(await on.open('s-abcdef'), remoteView);
  assert.equal((await on.submitRsvp('s-abcdef', null, { attending: false, count: 0 })).responseId, 'x', 'the reply goes where the invitation came from');
  const missing = withRemoteFallback(local, { ...remote, open: async () => { throw new AppError('not_found', 'بعيد'); } }, async () => true);
  await assert.rejects(missing.open('s-abcdef'), /محلي/, 'unknown on both sides: this device\'s message');

  const { isRemoteGuestEntry } = await import('../../src/services/index');
  const at = (u: string) => { const x = new URL(u); return { pathname: x.pathname, search: x.search, hash: x.hash }; };
  assert.equal(isRemoteGuestEntry(at('https://d.test/i/sara-ahmed-x7k2pq/ABC12')), true, 'a real short link seeds no demo data');
  assert.equal(isRemoteGuestEntry(at('https://d.test/i/noura-faisal/TTXKJ')), false, 'the prototype\'s demo links still open the demo');
  assert.equal(isRemoteGuestEntry(at('https://d.test/app/events')), false);

  const { backendStatus, resetBackendStatus } = await import('../../src/services/cloud/api');
  resetBackendStatus();
  const html = async () => new Response('<!doctype html>', { status: 200, headers: { 'Content-Type': 'text/html' } });
  assert.equal(await backendStatus(html as never), false, 'a static host answering index.html means off');
  resetBackendStatus();
  assert.equal(await backendStatus((async () => { throw new TypeError('no network'); }) as never), false);
  resetBackendStatus();
  assert.equal(await backendStatus((async () => new Response('{"backend":true}', { headers: { 'Content-Type': 'application/json' } })) as never), true);
  resetBackendStatus();
});

test('audio on guests\' devices: the uploaded copy travels with the invitation, only from the Blob host', async () => {
  const { resolveAudioSelection, isRemoteAudioUrl, loadAudioTrackBlob } = await import('../../src/domain/audio-library');
  const { memoryAudioStore } = await import('../../src/domain/audio-store');
  const url = 'https://abc123.public.blob.vercel-storage.com/a/noura-faisal-abcdef/audio_1-Xy9.mp3';
  assert.ok(isRemoteAudioUrl(url));
  assert.ok(!isRemoteAudioUrl('https://evil.example/a/x/y.mp3'));
  const empty = { tracks: [] };
  const guest = resolveAudioSelection({ mode: 'library', trackId: 'audio_1', trackName: 'زفة', trackUrl: url, trackStart: 12, trackFade: 1.5, voiceId: 'audio_2', voiceUrl: url }, empty);
  assert.equal(guest.trackUrl, url);
  assert.equal(guest.trackStart, 12);
  assert.equal(guest.voiceUrl, url);
  assert.equal(resolveAudioSelection({ mode: 'library', trackId: 'audio_1', trackUrl: 'https://evil.example/x.mp3' }, empty).trackUrl, undefined);
  const realFetch = globalThis.fetch;
  try {
    globalThis.fetch = (async (u: string) => { assert.equal(u, url); return new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': 'audio/mpeg' } }); }) as never;
    const blob = await loadAudioTrackBlob('audio_1', memoryAudioStore(), url);
    assert.equal(blob?.size, 3);
    assert.equal(await loadAudioTrackBlob('audio_1', memoryAudioStore(), 'https://evil.example/x.mp3'), null);
  } finally { globalThis.fetch = realFetch; }
});
