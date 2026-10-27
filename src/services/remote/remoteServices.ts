/**
 * Supabase implementation of services/contracts.ts — a SKELETON, NOT WIRED INTO THE APP.
 *
 * services/index.ts keeps returning the browser mock. To try this adapter, call
 * createRemoteServices({ url, anonKey, getAccessToken, currentUser }) yourself (backend/README.md).
 * Verified only against a mocked fetch (tests/unit/remote.test.ts) and the SQL against a local
 * Postgres with Supabase stand-ins — never against a live Supabase project.
 *
 * Server-authoritative operations (RSVP, publish, check-in/undo, matching, import) go through the
 * SECURITY DEFINER RPCs in backend/supabase/migrations/0001_doyofy_init.sql; simple organizer CRUD
 * goes through PostgREST tables guarded by RLS + column grants.
 */
import type {
  CheckInContext, GuestRsvpInput, GuestView, Services, ShareHow,
} from '../contracts';
import type { CreateEventInput, InvitationDesign, InvitationDesignContent, PartyInput, User } from '../../domain/types';
import { AppError } from '../errors';
import { makeCode, makeSlug, normaliseCode } from '../../domain/ids';
import { suggestTitle, todayFor, validateEssentials } from '../../domain/event';
import { defaultDesign } from '../../domain/invitation';
import { normalisePhone } from '../../domain/phone';
import { validateTable } from '../../domain/seating';
import { validateRsvp, RSVP_ERROR_TEXT } from '../../domain/parties';
import { validateRemoteConfig, type RemoteConfig } from './config';
import { appError, appErrorFromEnvelope, reasonOf } from './remoteErrors';
import { eq, isNetworkError, SupabaseRest } from './supabaseRest';
import {
  eventPatch, toActivity, toCheckIn, toDesign, toEvent, toParty, toResponse, toTable,
  type ActivityRow, type CheckInRow, type DesignRow, type EventRow, type PartyRow, type ResponseRow, type TableRow,
} from './mappers';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const requireId = (id: string, reason: string): string => {
  if (!UUID.test(id)) throw appError('not_found', reason);   // e.g. a mock id like "evt_wedding" in an old URL
  return id;
};

type GuestEnvelope = { ok: true; view: GuestView; responseId?: string } | { ok: false; code?: string; reason?: string; status?: number };
type GateResult = { party: PartyRow; record: CheckInRow; counts?: Record<string, number>; replayed?: boolean };

/** same rules as the mock's cleanPartyInput (services/mock/repositories.ts); the DB re-checks them */
function cleanPartyInput(input: Partial<PartyInput>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (input.primaryGuestName !== undefined) {
    const name = input.primaryGuestName.replace(/\s+/g, ' ').trim();
    if (!name) throw new AppError('validation', 'اكتب اسم الضيف أو العائلة.', 'primaryGuestName');
    out.primary_guest_name = name;
  }
  if (input.phone !== undefined) {
    if (!input.phone || !input.phone.trim()) out.phone = null;
    else {
      const r = normalisePhone(input.phone);
      if (!r.ok) throw new AppError('validation', 'رقم الجوال غير صحيح. مثال: 0551234567 أو ‎+966551234567', 'phone');
      out.phone = r.e164;
    }
  }
  if (input.maxPartySize !== undefined) {
    if (!Number.isInteger(input.maxPartySize) || input.maxPartySize < 1 || input.maxPartySize > 20) {
      throw new AppError('validation', 'العدد المسموح بين 1 و20.', 'maxPartySize');
    }
    out.max_party_size = input.maxPartySize;
  }
  if (input.companionNames !== undefined) {
    const names = (input.companionNames ?? []).map((s) => s.trim()).filter(Boolean);
    out.companion_names = names.length ? names : null;
  }
  if (input.notes !== undefined) out.notes = input.notes?.trim() || null;
  if (input.side !== undefined) out.side = input.side?.trim() || null;
  return out;
}

export interface RemoteServices extends Services {
  /** organizer data export (organizer only) — not part of the shared contract yet */
  exportEvent(eventId: string): Promise<unknown>;
}

export function createRemoteServices(config: RemoteConfig): RemoteServices {
  validateRemoteConfig(config);
  const db = new SupabaseRest(config);
  const now = config.now ?? (() => new Date());
  const makeKey = config.makeKey ?? (() => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `k-${Date.now()}-${Math.random().toString(36).slice(2)}`));
  const listeners = new Set<() => void>();
  const changed = <T>(v: T): T => { for (const l of [...listeners]) l(); return v; };
  /** last draft revision this tab has seen, per event (optimistic concurrency for saveDraft/publish) */
  const revisions = new Map<string, number>();
  const rememberDesign = (r: DesignRow): InvitationDesign => { revisions.set(r.event_id, r.draft_revision); return toDesign(r); };

  const anonymousUser: User = { id: 'anonymous', name: '', role: 'coordinator' };

  const guestCall = async (fn: string, args: Record<string, unknown>): Promise<{ view: GuestView; responseId?: string }> => {
    const env = await db.rpc<GuestEnvelope>(fn, args, { auth: 'anon' });
    if (!env || env.ok !== true) throw appErrorFromEnvelope(env ?? {});
    return { view: env.view, responseId: env.responseId };
  };

  const services: RemoteServices = {
    // ---------------------------------------------------------------- events
    events: {
      list: async () => (await db.select<EventRow>('events', [['select', '*'], ['order', 'date.asc']])).map(toEvent),
      get: async (id) => toEvent(await db.selectOne<EventRow>('events', [['select', '*'], ['id', eq(requireId(id, 'event_not_found'))]])),
      create: async (input: CreateEventInput) => {
        const timeZone = input.timeZone || 'Asia/Riyadh';
        const first = Object.entries(validateEssentials(input, todayFor({ timeZone }, now())))[0];
        if (first) throw new AppError('validation', first[1]!, first[0]);
        const base = makeSlug([input.names.aEn, input.names.bEn], new Set());
        const row = {
          type: input.type, title: input.title?.trim() || suggestTitle(input.type, input.names),
          names: { a: input.names.a.trim(), b: input.names.b?.trim() || undefined, aEn: input.names.aEn?.trim() || undefined, bEn: input.names.bEn?.trim() || undefined },
          date: input.date, time: input.time, time_zone: timeZone, duration_hours: 5,
          venue: { ...input.venue, name: input.venue.name.trim(), city: input.venue.city.trim() },
        };
        // slugs are globally unique and other owners' slugs are invisible (RLS): retry with a suffix on conflict
        for (let attempt = 0; attempt < 4; attempt++) {
          const slug = attempt === 0 ? base : `${base}-${makeCode(new Set(), Math.random, 4).toLowerCase()}`.slice(0, 48);
          try {
            const [created] = await db.insert<EventRow>('events', { ...row, slug });
            return changed(toEvent(created!));
          } catch (e) {
            if (reasonOf(e) !== 'conflict') throw e;   // 23505 unique violation (slug)
          }
        }
        throw appError('conflict', 'slug_taken');
      },
      update: async (id, input) => {
        const [r] = await db.update<EventRow>('events', [['id', eq(requireId(id, 'event_not_found'))]], eventPatch(input));
        if (!r) throw appError('not_found', 'event_not_found');
        return changed(toEvent(r));
      },
      markCheckInPrepared: async (id) => {
        await db.update<EventRow>('events', [['id', eq(requireId(id, 'event_not_found'))], ['check_in_prepared_at', 'is.null']], { check_in_prepared_at: now().toISOString() });
        return changed(await services.events.get(id));
      },
      // the shared schema has no guest-experience tables yet (P06/P11): refuse honestly instead of dropping the edit
      updateExperience: async () => {
        throw new AppError('forbidden', 'إعداد الطعام والهدايا متاح في نسخة التجربة فقط حتى تُربط الخدمة المشتركة.');
      },
      archive: async (id) => {
        const [r] = await db.update<EventRow>('events', [['id', eq(requireId(id, 'event_not_found'))]], { archived_at: now().toISOString() });
        if (!r) throw appError('not_found', 'event_not_found');
        return changed(toEvent(r));
      },
      restore: async (id) => {
        const [r] = await db.update<EventRow>('events', [['id', eq(requireId(id, 'event_not_found'))]], { archived_at: null });
        if (!r) throw appError('not_found', 'event_not_found');
        return changed(toEvent(r));
      },
    },

    // ---------------------------------------------------------------- invitation design (draft / published)
    invitations: {
      get: async (eventId) => {
        const r = await db.maybeOne<DesignRow>('invitation_designs', [['select', '*'], ['event_id', eq(requireId(eventId, 'event_not_found'))]]);
        return r ? rememberDesign(r) : null;
      },
      saveDraft: async (eventId, content: InvitationDesignContent) => {
        const r = await db.rpc<DesignRow>('save_invitation_draft', {
          p_event_id: requireId(eventId, 'event_not_found'), p_content: content, p_base_revision: revisions.get(eventId) ?? null,
        });
        return changed(rememberDesign(r));
      },
      publish: async (eventId) => {
        requireId(eventId, 'event_not_found');
        try {
          return changed(rememberDesign(await db.rpc<DesignRow>('publish_invitation', { p_event_id: eventId, p_expected_revision: revisions.get(eventId) ?? null })));
        } catch (e) {
          // mock parity: publishing before any save publishes the occasion's default design
          if (reasonOf(e) !== 'nothing_to_publish') throw e;
          const ev = await services.events.get(eventId);
          await services.invitations.saveDraft(eventId, defaultDesign(ev));
          return changed(rememberDesign(await db.rpc<DesignRow>('publish_invitation', { p_event_id: eventId, p_expected_revision: revisions.get(eventId) ?? null })));
        }
      },
    },

    // ---------------------------------------------------------------- parties
    parties: {
      list: async (eventId) => (await db.selectAll<PartyRow>('parties', [['select', '*'], ['event_id', eq(requireId(eventId, 'event_not_found'))], ['order', 'created_at.asc,id.asc']])).map(toParty),
      get: async (id) => toParty(await db.selectOne<PartyRow>('parties', [['select', '*'], ['id', eq(requireId(id, 'party_not_found'))]])),
      create: async (eventId, input) => {
        const clean = cleanPartyInput(input);
        if (!clean.primary_guest_name) throw new AppError('validation', 'اكتب اسم الضيف أو العائلة.', 'primaryGuestName');
        const [r] = await db.insert<PartyRow>('parties', { event_id: requireId(eventId, 'event_not_found'), ...clean });
        return changed(toParty(r!));
      },
      update: async (id, input) => {
        const [r] = await db.update<PartyRow>('parties', [['id', eq(requireId(id, 'party_not_found'))]], cleanPartyInput(input));
        if (!r) throw appError('not_found', 'party_not_found');
        return changed(toParty(r));
      },
      remove: async (id) => { await db.remove('parties', [['id', eq(requireId(id, 'party_not_found'))]]); changed(undefined); },
      importMany: async (eventId, inputs, meta) => {
        const rows = inputs.map((i) => cleanPartyInput(i));
        const r = await db.rpc<PartyRow[]>('import_parties', { p_event_id: requireId(eventId, 'event_not_found'), p_rows: rows, p_skipped: meta.skipped, p_source: meta.source });
        return changed(r.map(toParty));
      },
      markShared: async (ids: string[], _how: ShareHow) => {
        if (!ids.length) return;
        await db.rpc<number>('mark_parties_shared', { p_party_ids: ids.map((id) => requireId(id, 'party_not_found')) });
        changed(undefined);
      },
      // No WhatsApp Business provider yet: refuse honestly instead of pretending delivery (D-008/D-031).
      simulateSend: async () => { throw appError('forbidden', 'messaging_not_configured'); },
      sendReminder: async () => { throw appError('forbidden', 'messaging_not_configured'); },
    },

    // ---------------------------------------------------------------- RSVP (organizer side)
    rsvp: {
      listResponses: async (eventId) => (await db.selectAll<ResponseRow>('rsvp_responses', [['select', '*'], ['event_id', eq(requireId(eventId, 'event_not_found'))], ['order', 'at.desc,id.desc']])).map(toResponse),
      setByOrganizer: async (partyId, input) => changed(toParty(await db.rpc<PartyRow>('set_rsvp_by_organizer', {
        p_party_id: requireId(partyId, 'party_not_found'), p_attending: input.attending, p_count: input.attending ? input.count : null,
        p_companion_names: input.companionNames ?? null, p_note: input.note ?? null,
      }))),
      matchResponse: async (responseId, partyId) => {
        await db.rpc<null>('match_rsvp_response', { p_response_id: requireId(responseId, 'response_not_found'), p_party_id: requireId(partyId, 'party_not_found') });
        changed(undefined);
      },
      addPartyFromResponse: async (responseId) => changed(toParty(await db.rpc<PartyRow>('add_party_from_response', { p_response_id: requireId(responseId, 'response_not_found') }))),
      dismissResponse: async (responseId) => {
        await db.rpc<null>('dismiss_rsvp_response', { p_response_id: requireId(responseId, 'response_not_found') });
        changed(undefined);
      },
    },

    // ---------------------------------------------------------------- seating
    seating: {
      listTables: async (eventId) => (await db.select<TableRow>('seating_tables', [['select', '*'], ['event_id', eq(requireId(eventId, 'event_not_found'))], ['order', 'sort_order.asc']])).map(toTable),
      createTables: async (eventId, tables) => {
        for (const t of tables) { const e = Object.values(validateTable(t))[0]; if (e) throw new AppError('validation', e); }
        const existing = await services.seating.listTables(eventId);
        let order = Math.max(0, ...existing.map((t) => t.order));
        const rows = tables.map((t) => ({ event_id: eventId, name: t.name.trim(), capacity: t.capacity, sort_order: ++order }));
        return changed((await db.insert<TableRow>('seating_tables', rows)).map(toTable));
      },
      updateTable: async (id, patch) => {
        const body: Record<string, unknown> = {};
        if (patch.name !== undefined) body.name = patch.name.trim();
        if (patch.capacity !== undefined) body.capacity = patch.capacity;
        const [r] = await db.update<TableRow>('seating_tables', [['id', eq(requireId(id, 'not_found'))]], body);
        if (!r) throw appError('not_found', 'not_found');
        return changed(toTable(r));
      },
      deleteTable: async (id) => { await db.remove('seating_tables', [['id', eq(requireId(id, 'not_found'))]]); changed(undefined); },
      assign: async (partyId, tableId) => {
        const [r] = await db.update<PartyRow>('parties', [['id', eq(requireId(partyId, 'party_not_found'))]], { table_id: tableId ? requireId(tableId, 'not_found') : null });
        if (!r) throw appError('not_found', 'party_not_found');
        return changed(toParty(r));
      },
    },

    // ---------------------------------------------------------------- check-in (gate)
    checkIn: {
      list: async (eventId) => (await db.selectAll<CheckInRow>('check_ins', [['select', '*'], ['event_id', eq(requireId(eventId, 'event_not_found'))], ['order', 'at.desc,id.desc']])).map(toCheckIn),
      findByCode: async (eventId, code) => {
        if (!UUID.test(eventId)) return null;
        const c = normaliseCode(code);
        if (!/^[A-Z0-9]{4,8}$/.test(c)) return null;
        const r = await db.maybeOne<PartyRow>('parties', [['select', '*'], ['event_id', eq(eventId)], ['code', eq(c)]]);
        return r ? toParty(r) : null;
      },
      checkIn: async (partyId, count, ctx: CheckInContext) => {
        if (!Number.isInteger(count) || count < 1) throw appError('validation', 'check_in_count_invalid');
        const args = {
          p_event_id: null, p_party_id: requireId(partyId, 'party_not_found'), p_count: count,
          p_idempotency_key: ctx.idempotencyKey ?? makeKey(), p_method: ctx.method, p_exceptions: ctx.exceptions,
          p_note: ctx.staffNote ?? null, p_by: ctx.by,
        };
        let r: GateResult;
        try {
          r = await db.rpc<GateResult>('check_in_party', args);
        } catch (e) {
          // the request may have reached the server: retry ONCE with the SAME key (server replays, never double counts)
          if (!isNetworkError(e)) throw e;
          r = await db.rpc<GateResult>('check_in_party', args);
        }
        return changed({ party: toParty(r.party), record: toCheckIn(r.record) });
      },
      undo: async (recordId) => {
        const r = await db.rpc<GateResult>('undo_check_in', { p_check_in_id: requireId(recordId, 'check_in_not_found') });
        return changed(toParty(r.party));
      },
    },

    activity: {
      list: async (eventId, limit = 30) => (await db.select<ActivityRow>('event_activity', [['select', '*'], ['event_id', eq(requireId(eventId, 'event_not_found'))], ['order', 'at.desc'], ['limit', String(limit)]])).map(toActivity),
    },

    // ---------------------------------------------------------------- public guest API (anon key only)
    guest: {
      open: async (slug, code) => (await guestCall('get_public_invitation', { p_slug: slug, p_code: code ?? null })).view,
      submitRsvp: async (slug, code, input: GuestRsvpInput) => {
        if (input.attending) {
          // fast client-side feedback only; the server enforces the real allowance
          const err = validateRsvp(input, 20);
          if (err) throw new AppError('validation', RSVP_ERROR_TEXT[err], 'count');
        }
        const r = code
          ? await guestCall('submit_rsvp', {
              p_slug: slug, p_code: code, p_attending: input.attending, p_count: input.attending ? input.count : null,
              p_companion_names: input.companionNames ?? null, p_note: input.note ?? null,
            })
          : await guestCall('submit_general_rsvp', {
              p_slug: slug, p_name: input.name ?? '', p_attending: input.attending, p_count: input.attending ? input.count : null, p_note: input.note ?? null,
            });
        return changed({ ...r.view, responseId: r.responseId ?? '' });
      },
    },

    session: { currentUser: () => config.currentUser?.() ?? anonymousUser },
    clock: { now },
    /** fires after this tab's own successful writes. Cross-device live updates need Supabase Realtime (not implemented). */
    onChange: (fn) => { listeners.add(fn); return () => { listeners.delete(fn); }; },

    exportEvent: (eventId) => db.rpc<unknown>('export_event_data', { p_event_id: requireId(eventId, 'event_not_found') }),
  };
  return services;
}

