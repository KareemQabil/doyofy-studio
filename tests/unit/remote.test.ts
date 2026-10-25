// MOCKED CONTRACT TESTS — NOT INTEGRATION TESTS.
// They run the Supabase adapter (src/services/remote) against a fake `fetch` and check request shape,
// auth headers, AppError mapping and idempotency-key handling. No network, no Supabase project.
// The SQL side is smoke-tested separately: backend/supabase/tests/run_local.sh (local Postgres only).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRemoteServices, createSupabaseAuth, remoteConfigFromEnv, validateRemoteConfig } from '../../src/services/remote/index';
import type { RemoteConfig } from '../../src/services/remote/config';
import { AppError } from '../../src/services/errors';
import type { InvitationDesignContent } from '../../src/domain/types';

const URL_BASE = 'https://proj-ref.supabase.co';
const ANON = 'anon-public-key';
const EVENT_ID = '11111111-1111-4111-8111-111111111111';
const PARTY_ID = '22222222-2222-4222-8222-222222222222';
const RECORD_ID = '33333333-3333-4333-8333-333333333333';

interface Call { url: string; method: string; headers: Record<string, string>; body: unknown }
type Reply = Response | Error | ((c: Call) => Response | Error | Promise<Response>);

function fakeFetch(...replies: Reply[]) {
  const calls: Call[] = [];
  const fn = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const c: Call = {
      url: String(input), method: init?.method ?? 'GET', headers: { ...(init?.headers as Record<string, string>) },
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    };
    calls.push(c);
    const r = replies[Math.min(calls.length - 1, replies.length - 1)];
    if (!r) throw new Error('no reply configured');
    const out = typeof r === 'function' ? await r(c) : r;
    if (out instanceof Error) throw out;
    return out.clone();
  };
  return { fetch: fn as typeof fetch, calls };
}
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const pgErr = (status: number, reason: string, code: string) => json(status, { code: `PT${status}`, message: reason, details: '', hint: code });

function setup(replies: Reply[], extra: Partial<RemoteConfig> = {}) {
  const f = fakeFetch(...replies);
  let n = 0;
  const s = createRemoteServices({
    url: URL_BASE, anonKey: ANON, fetch: f.fetch, getAccessToken: () => 'user-jwt',
    makeKey: () => `generated-key-${++n}`, ...extra,
  });
  return { s, calls: f.calls };
}
const rejectsWith = async (p: Promise<unknown>, code: string, msg?: RegExp, field?: string) => {
  await assert.rejects(p, (e: unknown) => {
    assert.ok(e instanceof AppError, `expected AppError, got ${String(e)}`);
    assert.equal(e.code, code);
    if (msg) assert.match(e.message, msg);
    if (field) assert.equal(e.field, field);
    return true;
  });
};

const eventRow = {
  id: EVENT_ID, owner_id: 'u1', type: 'wedding', title: 'زفاف سارة وأحمد', names: { a: 'سارة', b: 'أحمد' }, date: '2026-11-01',
  time: '20:00:00', time_zone: 'Asia/Riyadh', duration_hours: 5, venue: { name: 'قاعة', city: 'الرياض' }, slug: 'sara-ahmed',
  default_party_size: 2, reveal_table_to_guests: false, allow_general_link: true, check_in_prepared_at: null, archived_at: null,
  created_at: '2026-10-10T08:00:00.123456+00:00', updated_at: '2026-10-10T08:00:00+00:00',
};
const partyRow = {
  id: PARTY_ID, event_id: EVENT_ID, code: 'ABC234', primary_guest_name: 'عائلة الدوسري', phone: '+966551203344', max_party_size: 4,
  companion_names: null, notes: null, side: null, delivery_status: 'opened', delivery_source: 'platform', delivery_at: null,
  delivery_opened_at: '2026-10-10T09:00:00+00:00', delivery_reminder_at: null, delivery_failure_reason: null, rsvp_status: 'confirmed',
  confirmed_party_size: 4, responded_at: '2026-10-10T09:01:00+00:00', guest_note: null, table_id: null, check_in_status: 'partial',
  checked_in_count: 2, source: 'manual', created_at: '2026-10-10T08:00:00+00:00', updated_at: '2026-10-10T09:05:00+00:00',
};
const recordRow = {
  id: RECORD_ID, event_id: EVENT_ID, party_id: PARTY_ID, count: 2, method: 'qr', at: '2026-10-10T19:00:00+00:00', by_label: 'بوابة 1',
  exceptions: ['no_table'], staff_note: null, undone_at: null,
};
const design: InvitationDesignContent = {
  experience: { dimension: '3d', motion: 'animated' }, cardId: 'lace', sceneId: 'candlelit', displayNames: {}, message: { ar: 'أهلًا', en: 'Welcome' }, program: [],
};
const designRow = (rev: number) => ({ id: 'd1', event_id: EVENT_ID, draft: design, draft_revision: rev, draft_saved_at: '2026-10-10T08:00:00+00:00', published: null, published_at: null, published_version: 0 });
const guestView = { event: { id: EVENT_ID, slug: 'sara-ahmed' }, design, party: null, canEdit: true, maxGuests: 2, phase: 'before' };

test('[mocked] config: https only, never a service-role or secret key; env helper needs both values', () => {
  assert.throws(() => validateRemoteConfig({ url: 'http://proj.supabase.co', anonKey: ANON }), /https/);
  assert.doesNotThrow(() => validateRemoteConfig({ url: 'http://127.0.0.1:54321', anonKey: ANON }));
  const serviceJwt = `x.${btoa(JSON.stringify({ role: 'service_role' })).replace(/=+$/, '')}.y`;
  assert.throws(() => validateRemoteConfig({ url: URL_BASE, anonKey: serviceJwt }), /service-role/);
  assert.throws(() => validateRemoteConfig({ url: URL_BASE, anonKey: 'sb_secret_abc' }), /service-role/);
  assert.equal(remoteConfigFromEnv({ DOYOFY_SUPABASE_URL: URL_BASE }), null);
  assert.deepEqual(remoteConfigFromEnv({ DOYOFY_SUPABASE_URL: ` ${URL_BASE} `, DOYOFY_SUPABASE_ANON_KEY: ANON }), { url: URL_BASE, anonKey: ANON });
});

test('[mocked] default runtime stays on the mock: services/index.ts does not import the remote adapter', () => {
  const src = fs.readFileSync(path.join(process.cwd(), 'src', 'services', 'index.ts'), 'utf8');
  assert.doesNotMatch(src, /remote/);
});

test('[mocked] events.list: PostgREST GET with apikey + user bearer; rows mapped to domain Event', async () => {
  const { s, calls } = setup([json(200, [eventRow])]);
  const [ev] = await s.events.list();
  assert.equal(calls[0]!.method, 'GET');
  assert.equal(calls[0]!.url, `${URL_BASE}/rest/v1/events?select=*&order=date.asc`);
  assert.equal(calls[0]!.headers.apikey, ANON);
  assert.equal(calls[0]!.headers.Authorization, 'Bearer user-jwt');
  assert.equal(ev!.time, '20:00');
  assert.deepEqual(ev!.settings, { defaultPartySize: 2, revealTableToGuests: false, allowGeneralLink: true });
  assert.equal(ev!.createdAt, '2026-10-10T08:00:00.123Z');
  assert.equal(ev!.archivedAt, undefined);
});

test('[mocked] events.get: non-uuid id → not_found without a request; PGRST116 (406) → not_found', async () => {
  const { s, calls } = setup([json(406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' })]);
  await rejectsWith(s.events.get('evt_wedding'), 'not_found', /لم نجد هذه المناسبة/);
  assert.equal(calls.length, 0);
  await rejectsWith(s.events.get(EVENT_ID), 'not_found');
  assert.equal(calls[0]!.headers.Accept, 'application/vnd.pgrst.object+json');
});

test('[mocked] events.create retries with a new slug on a unique violation (slugs are global)', async () => {
  const { s, calls } = setup([json(409, { code: '23505', message: 'duplicate key value violates unique constraint "events_slug_key"' }), json(201, [eventRow])]);
  const date = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  await s.events.create({ type: 'wedding', names: { a: 'سارة', b: 'أحمد', aEn: 'Sara', bEn: 'Ahmed' }, date, time: '20:00', venue: { name: 'قاعة', city: 'الرياض' } });
  assert.equal(calls.length, 2);
  assert.equal((calls[0]!.body as { slug: string }).slug, 'sara-ahmed');
  assert.match((calls[1]!.body as { slug: string }).slug, /^sara-ahmed-[a-z0-9]{4}$/);
  assert.equal(calls[1]!.headers.Prefer, 'return=representation');
});

test('[mocked] guest.open: RPC with anon key only (never the organizer token) and envelope unwrapped', async () => {
  const { s, calls } = setup([json(200, { ok: true, view: guestView })]);
  const v = await s.guest.open('sara-ahmed', 'abc234');
  assert.equal(calls[0]!.url, `${URL_BASE}/rest/v1/rpc/get_public_invitation`);
  assert.equal(calls[0]!.method, 'POST');
  assert.deepEqual(calls[0]!.body, { p_slug: 'sara-ahmed', p_code: 'abc234' });
  assert.equal(calls[0]!.headers.Authorization, `Bearer ${ANON}`);
  assert.equal(v.maxGuests, 2);
});

test('[mocked] guest envelopes map to AppError: unpublished, unknown code, general link disabled, throttled', async () => {
  const { s } = setup([
    json(200, { ok: false, code: 'not_published', reason: 'not_published', status: 404 }),
    json(200, { ok: false, code: 'not_found', reason: 'unknown_code', status: 404 }),
    json(200, { ok: false, code: 'not_found', reason: 'personal_only', status: 404 }),
    json(200, { ok: false, code: 'rate_limited', reason: 'too_many_wrong_codes', status: 429 }),
  ]);
  await rejectsWith(s.guest.open('sara-ahmed', 'X'), 'not_published', /غير متاحة بعد/);
  await rejectsWith(s.guest.open('sara-ahmed', 'X'), 'not_found', /رابط الدعوة غير صحيح/);
  await rejectsWith(s.guest.open('sara-ahmed'), 'not_found', /هذه الدعوة شخصية/);
  await rejectsWith(s.guest.open('sara-ahmed', 'X'), 'conflict', /محاولات كثيرة/);
});

test('[mocked] submitRsvp: personal → submit_rsvp, general → submit_general_rsvp, declines send no count, server validation mapped', async () => {
  const { s, calls } = setup([
    json(200, { ok: true, view: guestView, responseId: 'r1' }),
    json(200, { ok: true, view: guestView, responseId: 'r2' }),
    json(200, { ok: false, code: 'validation', reason: 'count_exceeds_allowed', status: 400 }),
    json(200, { ok: false, code: 'conflict', reason: 'rsvp_closed', status: 409 }),
  ]);
  const r = await s.guest.submitRsvp('sara-ahmed', 'ABC234', { attending: true, count: 3, companionNames: ['أحمد'], note: 'نراكم' });
  assert.equal(r.responseId, 'r1');
  assert.deepEqual(calls[0]!.body, { p_slug: 'sara-ahmed', p_code: 'ABC234', p_attending: true, p_count: 3, p_companion_names: ['أحمد'], p_note: 'نراكم' });
  await s.guest.submitRsvp('sara-ahmed', null, { name: 'ضيف', attending: false, count: 0 });
  assert.match(calls[1]!.url, /rpc\/submit_general_rsvp$/);
  assert.deepEqual(calls[1]!.body, { p_slug: 'sara-ahmed', p_name: 'ضيف', p_attending: false, p_count: null, p_note: null });
  await rejectsWith(s.guest.submitRsvp('sara-ahmed', 'ABC234', { attending: true, count: 9 }), 'validation', /أكبر من المسموح/, 'count');
  await rejectsWith(s.guest.submitRsvp('sara-ahmed', 'ABC234', { attending: false, count: 0 }), 'conflict', /انتهى وقت الرد/);
  await rejectsWith(s.guest.submitRsvp('sara-ahmed', 'ABC234', { attending: true, count: 0 }), 'validation', undefined, 'count');
  assert.equal(calls.length, 4, 'invalid count rejected client-side without a request');
});

test('[mocked] checkIn passes the caller idempotency key, exceptions, note and staff label to check_in_party', async () => {
  const { s, calls } = setup([json(200, { party: partyRow, record: recordRow, counts: { checkedInPeople: 2 }, replayed: false })]);
  const out = await s.checkIn.checkIn(PARTY_ID, 2, { method: 'qr', by: 'بوابة 1', exceptions: ['over_confirmed'], staffNote: 'وافق المنظم', idempotencyKey: 'scan-7f3a-0001' });
  assert.equal(calls[0]!.url, `${URL_BASE}/rest/v1/rpc/check_in_party`);
  assert.equal(calls[0]!.headers.Authorization, 'Bearer user-jwt');
  assert.deepEqual(calls[0]!.body, {
    p_event_id: null, p_party_id: PARTY_ID, p_count: 2, p_idempotency_key: 'scan-7f3a-0001', p_method: 'qr',
    p_exceptions: ['over_confirmed'], p_note: 'وافق المنظم', p_by: 'بوابة 1',
  });
  assert.equal(out.party.checkInStatus, 'partial');
  assert.equal(out.record.by, 'بوابة 1');
  assert.equal(out.record.undone, false);
});

test('[mocked] checkIn retries once after a network failure with the SAME generated key', async () => {
  const { s, calls } = setup([new TypeError('Failed to fetch'), json(200, { party: partyRow, record: recordRow, replayed: true })]);
  await s.checkIn.checkIn(PARTY_ID, 2, { method: 'search', by: 'x', exceptions: [] });
  assert.equal(calls.length, 2);
  const k0 = (calls[0]!.body as { p_idempotency_key: string }).p_idempotency_key;
  assert.equal(k0, 'generated-key-1');
  assert.equal((calls[1]!.body as { p_idempotency_key: string }).p_idempotency_key, k0);
});

test('[mocked] checkIn conflicts map to Arabic, recoverable AppErrors; validation errors are not retried', async () => {
  const { s, calls } = setup([pgErr(409, 'exceptions_not_acknowledged', 'conflict'), pgErr(400, 'check_in_count_invalid', 'validation')]);
  await rejectsWith(s.checkIn.checkIn(PARTY_ID, 2, { method: 'qr', by: 'x', exceptions: [] }), 'conflict', /تغيرت حالة هذه الدعوة/);
  await rejectsWith(s.checkIn.checkIn(PARTY_ID, 2, { method: 'qr', by: 'x', exceptions: [] }), 'validation', /عدد القادمين/, 'count');
  assert.equal(calls.length, 2);
  await rejectsWith(s.checkIn.checkIn(PARTY_ID, 0, { method: 'qr', by: 'x', exceptions: [] }), 'validation');
  assert.equal(calls.length, 2);
});

test('[mocked] undo → undo_check_in RPC; second undo maps to conflict "already undone"', async () => {
  const { s, calls } = setup([json(200, { party: { ...partyRow, checked_in_count: 0, check_in_status: 'not_arrived' }, record: { ...recordRow, undone_at: '2026-10-10T19:01:00Z' } }), pgErr(409, 'already_undone', 'conflict')]);
  const p = await s.checkIn.undo(RECORD_ID);
  assert.deepEqual(calls[0]!.body, { p_check_in_id: RECORD_ID });
  assert.equal(p.checkedInCount, 0);
  await rejectsWith(s.checkIn.undo(RECORD_ID), 'conflict', /تم التراجع عن هذا التسجيل من قبل/);
});

test('[mocked] invitations: saveDraft sends the last seen revision; stale revision → conflict', async () => {
  const { s, calls } = setup([json(200, [designRow(3)]), json(200, designRow(4)), json(200, designRow(5)), pgErr(409, 'draft_revision_conflict', 'conflict')]);
  assert.equal((await s.invitations.get(EVENT_ID))?.draft.cardId, 'lace');
  await s.invitations.saveDraft(EVENT_ID, design);
  assert.equal((calls[1]!.body as { p_base_revision: number }).p_base_revision, 3);
  await s.invitations.saveDraft(EVENT_ID, design);
  assert.equal((calls[2]!.body as { p_base_revision: number }).p_base_revision, 4);
  await rejectsWith(s.invitations.saveDraft(EVENT_ID, design), 'conflict', /من جهاز آخر/);
});

test('[mocked] invitations.publish with no design yet saves the occasion default, then publishes (mock parity)', async () => {
  const published = { ...designRow(1), published: design, published_at: '2026-10-10T10:00:00Z', published_version: 1 };
  const { s, calls } = setup([pgErr(409, 'nothing_to_publish', 'conflict'), json(200, eventRow), json(200, designRow(1)), json(200, published)]);
  const d = await s.invitations.publish(EVENT_ID);
  assert.deepEqual(calls.map((c) => c.url.replace(URL_BASE, '').split('?')[0]), [
    '/rest/v1/rpc/publish_invitation', '/rest/v1/events', '/rest/v1/rpc/save_invitation_draft', '/rest/v1/rpc/publish_invitation',
  ]);
  assert.equal((calls[3]!.body as { p_expected_revision: number }).p_expected_revision, 1);
  assert.ok(d.published);
});

test('[mocked] parties: list mapping, constraint errors → field-level validation, messaging refused without a request', async () => {
  const { s, calls } = setup([
    json(200, [partyRow]),
    json(400, { code: '23514', message: 'new row for relation "parties" violates check constraint "parties_phone_check"', details: null, hint: null }),
  ]);
  const [p] = await s.parties.list(EVENT_ID);
  assert.equal(calls[0]!.url, `${URL_BASE}/rest/v1/parties?select=*&event_id=eq.${EVENT_ID}&order=created_at.asc%2Cid.asc&limit=1000&offset=0`);
  assert.equal(p!.delivery.status, 'opened');
  assert.equal(p!.delivery.openedAt, '2026-10-10T09:00:00.000Z');
  assert.equal(p!.tableId, undefined);
  await rejectsWith(s.parties.create(EVENT_ID, { primaryGuestName: 'x', maxPartySize: 2 }), 'validation', /رقم الجوال/, 'phone');
  await rejectsWith(s.parties.create(EVENT_ID, { primaryGuestName: 'x', phone: '0551', maxPartySize: 2 }), 'validation', undefined, 'phone');
  await rejectsWith(s.parties.simulateSend([PARTY_ID]), 'forbidden', /غير مفعّل/);
  assert.equal(calls.length, 2);
});

test('[mocked] transport failures: offline/timeout → network, 401 → forbidden (session), 5xx → network, 403 RLS → forbidden', async () => {
  const hang = (c: Call) => new Promise<Response>((_, reject) => { void c; setTimeout(() => reject(new DOMException('aborted', 'AbortError')), 200); });
  const offline = setup([new TypeError('Failed to fetch')]);
  await rejectsWith(offline.s.events.list(), 'network', /لا يوجد اتصال/);
  const slow = fakeFetch(hang);
  const s2 = createRemoteServices({ url: URL_BASE, anonKey: ANON, timeoutMs: 20, fetch: ((i: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    void slow.fetch(i, init).then(resolve, () => undefined);
  })) as typeof fetch });
  await rejectsWith(s2.events.list(), 'network');
  const { s } = setup([json(401, { code: 'PGRST301', message: 'JWT expired' }), json(503, {}), json(403, { code: '42501', message: 'permission denied for table parties' })]);
  await rejectsWith(s.events.list(), 'forbidden', /انتهت الجلسة/);
  await rejectsWith(s.events.list(), 'network', /غير متاحة مؤقتًا/);
  await rejectsWith(s.events.list(), 'forbidden');
});

test('[mocked] onChange fires after successful writes only', async () => {
  const { s } = setup([json(200, [eventRow]), pgErr(403, 'organizer_only', 'forbidden')]);
  let n = 0;
  s.onChange(() => { n++; });
  await s.events.archive(EVENT_ID);
  await rejectsWith(s.events.archive(EVENT_ID), 'forbidden', /لصاحب المناسبة فقط/);
  assert.equal(n, 1);
});

test('[mocked] auth helper: OTP request/verify shapes and session mapping', async () => {
  const f = fakeFetch(json(200, {}), json(200, { access_token: 'at', refresh_token: 'rt', expires_at: 1_900_000_000, user: { id: 'u1', phone: '966551203344' } }));
  const auth = createSupabaseAuth({ url: URL_BASE, anonKey: ANON, fetch: f.fetch });
  await auth.requestPhoneCode('+966551203344');
  assert.equal(f.calls[0]!.url, `${URL_BASE}/auth/v1/otp`);
  assert.deepEqual(f.calls[0]!.body, { phone: '+966551203344', create_user: true, channel: 'sms' });
  assert.equal(f.calls[0]!.headers.apikey, ANON);
  const session = await auth.verifyPhoneCode('+966551203344', ' 123456 ');
  assert.deepEqual(f.calls[1]!.body, { type: 'sms', phone: '+966551203344', token: '123456' });
  assert.deepEqual(session, { accessToken: 'at', refreshToken: 'rt', expiresAt: 1_900_000_000_000, userId: 'u1', email: undefined, phone: '966551203344' });
});

test('[mocked] long lists page past the 1000-row PostgREST cap', async () => {
  const page = Array.from({ length: 1000 }, (_, i) => ({ ...partyRow, id: `${PARTY_ID.slice(0, -4)}${String(i).padStart(4, '0')}` }));
  const { s, calls } = setup([json(200, page), json(200, page.slice(0, 5))]);
  assert.equal((await s.parties.list(EVENT_ID)).length, 1005);
  assert.match(calls[1]!.url, /limit=1000&offset=1000$/);
});
