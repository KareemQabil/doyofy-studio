/**
 * Mock implementations of every contract in services/contracts.ts. They behave like the future
 * API: validation, activity entries, consistent state changes across entities.
 */
import type {
  ActivityRepository, CheckInRepository, EventRepository, GuestApi, GuestView, InvitationRepository, PartyRepository,
  RsvpRepository, SeatingRepository,
} from '../contracts';
import type { Event, InvitationParty, PartyInput } from '../../domain/types';
import { makeCode, makeId, makeSlug, normaliseCode } from '../../domain/ids';
import { defaultDesign, publishState } from '../../domain/invitation';
import { applyRsvp, validateRsvp, RSVP_ERROR_TEXT } from '../../domain/parties';
import { eventPhase, eventStart, suggestTitle, validateEssentials, todayFor } from '../../domain/event';
import { normalisePhone } from '../../domain/phone';
import { statusAfter, EXCEPTION_TEXT } from '../../domain/checkin';
import { validateTable } from '../../domain/seating';
import { checkAnswers, cleanAnswers, experienceOf, safeExternalUrl, validatePolicy } from '../../domain/guest-experience';
import type { GuestExperience, RsvpInput } from '../../domain/types';
import { AppError } from '../errors';
import { findEvent, findParty, log, touch, type Ctx } from './helpers';

const clone = <T>(v: T): T => structuredClone(v);

function cleanPartyInput(input: Partial<PartyInput>): Partial<PartyInput> {
  const out: Partial<PartyInput> = { ...input };
  if (input.primaryGuestName != null) {
    out.primaryGuestName = input.primaryGuestName.replace(/\s+/g, ' ').trim();
    if (!out.primaryGuestName) throw new AppError('validation', 'اكتب اسم الضيف أو العائلة.', 'primaryGuestName');
  }
  if (input.phone != null) {
    if (!input.phone.trim()) out.phone = undefined;
    else {
      const r = normalisePhone(input.phone);
      if (!r.ok) throw new AppError('validation', 'رقم الجوال غير صحيح. مثال: 0551234567 أو ‎+966551234567', 'phone');
      out.phone = r.e164;
    }
  }
  if (input.maxPartySize != null && (!Number.isInteger(input.maxPartySize) || input.maxPartySize < 1 || input.maxPartySize > 20)) {
    throw new AppError('validation', 'العدد المسموح بين 1 و20.', 'maxPartySize');
  }
  if (input.companionNames) out.companionNames = input.companionNames.map((s) => s.trim()).filter(Boolean);
  return out;
}

// ------------------------------------------------------------------ events
export function mockEvents({ store, now }: Ctx): EventRepository {
  return {
    list: () => store.request(() => clone(store.read().events).sort((a, b) => a.date.localeCompare(b.date))),
    get: (id) => store.request(() => clone(findEvent(store.read(), id))),
    create: (input) => store.request(() => {
      const t = now();
      const timeZone = input.timeZone || 'Asia/Riyadh';
      const errors = validateEssentials(input, todayFor({ timeZone }, t));
      const first = Object.entries(errors)[0];
      if (first) throw new AppError('validation', first[1]!, first[0]);
      return store.write((db) => {
        const ev: Event = {
          id: makeId('evt'), ownerId: 'usr_owner', type: input.type,
          title: input.title?.trim() || suggestTitle(input.type, input.names),
          names: { a: input.names.a.trim(), b: input.names.b?.trim() || undefined, aEn: input.names.aEn?.trim() || undefined, bEn: input.names.bEn?.trim() || undefined },
          date: input.date, time: input.time, timeZone, durationHours: 5,
          venue: { ...input.venue, name: input.venue.name.trim(), city: input.venue.city.trim() },
          slug: makeSlug([input.names.aEn, input.names.bEn], new Set(db.events.map((e) => e.slug))),
          settings: { defaultPartySize: 2, revealTableToGuests: false, allowGeneralLink: false },
          createdAt: t.toISOString(), updatedAt: t.toISOString(),
        };
        db.events.push(ev);
        log(db, t, ev.id, 'event_created');
        return clone(ev);
      });
    }, 'write'),
    update: (id, input) => store.request(() => store.write((db) => {
      const t = now();
      const ev = findEvent(db, id);
      const { settings, ...rest } = input;
      Object.assign(ev, rest);
      if (input.names) ev.names = { ...input.names };
      if (settings) ev.settings = { ...ev.settings, ...settings };
      if (!ev.title.trim()) ev.title = suggestTitle(ev.type, ev.names);
      touch(ev, t);
      log(db, t, ev.id, 'event_updated', { what: Object.keys(input).includes('venue') ? 'المكان' : Object.keys(input).includes('date') || Object.keys(input).includes('time') ? 'الموعد' : settings ? 'الإعدادات' : undefined });
      return clone(ev);
    }), 'write'),
    updateExperience: (id, draft, expectedRevision) => store.request(() => store.write((db) => {
      const ev = findEvent(db, id);
      const cur = experienceOf(ev);
      if (cur.revision !== expectedRevision) throw new AppError('conflict', 'عُدّلت هذه الإعدادات من نافذة أخرى. حمّلنا آخر نسخة — راجعها ثم احفظ.');
      const problem = validatePolicy(draft);
      if (problem) throw new AppError('validation', problem.message, problem.field);
      // an answered option is archived, never removed: its id keeps meaning what the guest chose
      const answered = new Set<string>();
      for (const p of db.parties) if (p.eventId === id) p.meals?.forEach((a) => answered.add(a.optionId));
      for (const r of db.responses) if (r.eventId === id) r.meals?.forEach((a) => answered.add(a.optionId));
      const kept = new Set(draft.meals.options.map((o) => o.id));
      const options = [
        ...draft.meals.options.map((o) => ({ id: o.id || makeId('meal'), label: o.label.replace(/\s+/g, ' ').trim(), ...(o.archived ? { archived: true } : {}) })),
        ...cur.meals.options.filter((o) => !kept.has(o.id) && answered.has(o.id)).map((o) => ({ ...o, archived: true })),
      ];
      const items = draft.gifts.items.map((g) => ({
        id: g.id || makeId('gift'), kind: g.kind, title: g.title.trim(), note: g.note?.trim() || undefined,
        url: safeExternalUrl(g.url) ?? undefined, linkLabel: g.linkLabel?.trim() || undefined, ...(g.archived ? { archived: true } : {}),
      }));
      const next: GuestExperience = {
        revision: cur.revision + 1,
        meals: { enabled: draft.meals.enabled, required: draft.meals.required, options },
        dietary: { enabled: draft.dietary.enabled },
        gifts: { enabled: draft.gifts.enabled, afterDecline: draft.gifts.enabled && draft.gifts.afterDecline, intro: draft.gifts.intro?.trim() || undefined, items },
      };
      ev.guestExperience = next;
      const t = now();
      touch(ev, t);
      log(db, t, ev.id, 'event_updated', { what: 'تجربة الضيف' });
      return clone(ev);
    }), 'write'),
    markCheckInPrepared: (id) => store.request(() => store.write((db) => {
      const ev = findEvent(db, id);
      ev.checkInPreparedAt ??= now().toISOString();
      return clone(ev);
    }), 'write'),
    archive: (id) => store.request(() => store.write((db) => {
      const t = now();
      const ev = findEvent(db, id);
      ev.archivedAt = t.toISOString(); touch(ev, t);
      log(db, t, ev.id, 'event_archived');
      return clone(ev);
    }), 'write'),
    restore: (id) => store.request(() => store.write((db) => {
      const ev = findEvent(db, id);
      delete ev.archivedAt; touch(ev, now());
      return clone(ev);
    }), 'write'),
  };
}

// ------------------------------------------------------------------ invitation design
export function mockInvitations({ store, now }: Ctx): InvitationRepository {
  return {
    get: (eventId) => store.request(() => clone(store.read().designs.find((d) => d.eventId === eventId) ?? null)),
    saveDraft: (eventId, content) => store.request(() => store.write((db) => {
      findEvent(db, eventId);
      const t = now().toISOString();
      let d = db.designs.find((x) => x.eventId === eventId);
      if (!d) { d = { id: makeId('dsg'), eventId, draft: content, draftSavedAt: t }; db.designs.push(d); }
      else { d.draft = content; d.draftSavedAt = t; }
      return clone(d);
    }), 'write'),
    publish: (eventId) => store.request(() => store.write((db) => {
      const ev = findEvent(db, eventId);
      const t = now();
      let d = db.designs.find((x) => x.eventId === eventId);
      if (!d) { d = { id: makeId('dsg'), eventId, draft: defaultDesign(ev), draftSavedAt: t.toISOString() }; db.designs.push(d); }
      const first = !d.published;
      d.published = clone(d.draft); d.publishedAt = t.toISOString();
      log(db, t, eventId, 'invitation_published', { first });
      return clone(d);
    }), 'write'),
  };
}

// ------------------------------------------------------------------ parties
export function mockParties({ store, now }: Ctx): PartyRepository {
  const newParty = (db: ReturnType<typeof store.read>, eventId: string, input: PartyInput, source: InvitationParty['source']): InvitationParty => {
    const t = now().toISOString();
    const taken = new Set(db.parties.filter((p) => p.eventId === eventId).map((p) => p.code));
    return {
      id: makeId('pty'), eventId, code: makeCode(taken), primaryGuestName: input.primaryGuestName, phone: input.phone,
      maxPartySize: input.maxPartySize, companionNames: input.companionNames, notes: input.notes, side: input.side,
      delivery: { status: 'not_shared' }, rsvpStatus: 'pending', checkInStatus: 'not_arrived', checkedInCount: 0,
      source, createdAt: t, updatedAt: t,
    };
  };
  return {
    list: (eventId) => store.request(() => clone(store.read().parties.filter((p) => p.eventId === eventId))),
    get: (id) => store.request(() => clone(findParty(store.read(), id))),
    create: (eventId, input) => store.request(() => {
      const clean = cleanPartyInput(input) as PartyInput;
      if (!clean.primaryGuestName) throw new AppError('validation', 'اكتب اسم الضيف أو العائلة.', 'primaryGuestName');
      return store.write((db) => {
        findEvent(db, eventId);
        const p = newParty(db, eventId, clean, 'manual');
        db.parties.push(p);
        log(db, now(), eventId, 'party_added', { name: p.primaryGuestName }, 'organizer', p.id);
        return clone(p);
      });
    }, 'write'),
    update: (id, input) => store.request(() => {
      const clean = cleanPartyInput(input);
      return store.write((db) => {
        const p = findParty(db, id);
        Object.assign(p, clean);
        if ('phone' in clean && !clean.phone) delete p.phone;
        touch(p, now());
        log(db, now(), p.eventId, 'party_updated', { name: p.primaryGuestName }, 'organizer', p.id);
        return clone(p);
      });
    }, 'write'),
    remove: (id) => store.request(() => store.write((db) => {
      const p = findParty(db, id);
      db.parties = db.parties.filter((x) => x.id !== id);
      log(db, now(), p.eventId, 'party_removed', { name: p.primaryGuestName });
    }), 'write'),
    importMany: (eventId, inputs, meta) => store.request(() => store.write((db) => {
      findEvent(db, eventId);
      const created = inputs.map((i) => {
        const p = newParty(db, eventId, cleanPartyInput(i) as PartyInput, 'import');
        db.parties.push(p);
        return p;
      });
      log(db, now(), eventId, 'parties_imported', { count: created.length, skipped: meta.skipped, source: meta.source });
      return clone(created);
    }), 'write'),
    markShared: (ids, how) => store.request(() => store.write((db) => {
      const t = now().toISOString();
      const ps = ids.map((id) => findParty(db, id));
      for (const p of ps) {
        if (p.delivery.status === 'opened') continue; // never downgrade a platform-known "opened"
        p.delivery = { ...p.delivery, status: 'shared', source: 'manual', at: t, failureReason: undefined };
        p.updatedAt = t;
      }
      if (ps[0]) log(db, now(), ps[0].eventId, 'invitation_shared', { count: ps.length, name: ps[0].primaryGuestName, how: 'manual' }, 'organizer', ps.length === 1 ? ps[0].id : undefined);
    }), 'write'),
    simulateSend: (ids) => store.request(() => store.write((db) => {
      const t = now().toISOString();
      const sent: string[] = [], failed: string[] = [];
      for (const id of ids) {
        const p = findParty(db, id);
        if (p.delivery.status === 'opened') { sent.push(id); continue; }
        if (!p.phone) { p.delivery = { ...p.delivery, status: 'failed', source: 'simulated', at: t, failureReason: 'missing_phone' }; failed.push(id); }
        else { p.delivery = { ...p.delivery, status: 'shared', source: 'simulated', at: t, failureReason: undefined }; sent.push(id); }
        p.updatedAt = t;
      }
      const first = findParty(db, ids[0]!);
      if (sent.length) log(db, now(), first.eventId, 'invitation_shared', { count: sent.length, name: findParty(db, sent[0]!).primaryGuestName, how: 'simulated' });
      if (failed.length) log(db, now(), first.eventId, 'invitation_failed', { count: failed.length, name: findParty(db, failed[0]!).primaryGuestName });
      return { sent, failed };
    }), 'write'),
    sendReminder: (ids) => store.request(() => store.write((db) => {
      const t = now().toISOString();
      const ps = ids.map((id) => findParty(db, id)).filter((p) => p.rsvpStatus === 'pending' && p.phone);
      for (const p of ps) { p.delivery = { ...p.delivery, reminderAt: t }; p.updatedAt = t; }
      if (ps[0]) log(db, now(), ps[0].eventId, 'reminder_sent', { count: ps.length, name: ps[0].primaryGuestName });
      return ps.length;
    }), 'write'),
  };
}

const answersFrom = (r: { attending: boolean; meals?: InvitationParty['meals']; dietary?: InvitationParty['dietary']; experienceRevision?: number }) =>
  r.attending ? { meals: r.meals, dietary: r.dietary, experienceRevision: r.experienceRevision } : { meals: undefined, dietary: undefined, experienceRevision: undefined };

/** answers checked against the policy now in force; a stale policy that no longer fits is a conflict to review */
function guestAnswers(ev: Event, input: RsvpInput) {
  const x = experienceOf(ev);
  const check = checkAnswers(x, input);
  if (!check.ok) throw new AppError(check.conflict ? 'conflict' : 'validation', check.message, check.field);
  return { ...cleanAnswers(x, input), experienceRevision: input.attending ? x.revision : undefined };
}
/** what the guest page shows: archived menu choices and wishes stay out of sight */
function publicExperience(ev: Event): GuestExperience | undefined {
  const x = ev.guestExperience;
  if (!x) return undefined;
  return { ...x, meals: { ...x.meals, options: x.meals.options.filter((o) => !o.archived) }, gifts: { ...x.gifts, items: x.gifts.items.filter((g) => !g.archived) } };
}

// ------------------------------------------------------------------ RSVP (organizer side)
export function mockRsvp({ store, now }: Ctx): RsvpRepository {
  return {
    listResponses: (eventId) => store.request(() => clone(store.read().responses.filter((r) => r.eventId === eventId)).sort((a, b) => b.at.localeCompare(a.at))),
    setByOrganizer: (partyId, input) => store.request(() => store.write((db) => {
      const p = findParty(db, partyId);
      const err = validateRsvp(input, p.maxPartySize);
      if (err) throw new AppError('validation', RSVP_ERROR_TEXT[err], 'count');
      const t = now();
      const edited = p.rsvpStatus !== 'pending';
      Object.assign(p, applyRsvp(p, input, t.toISOString()));
      // a decline clears food (invariant 5); a changed headcount keeps the guest's answer and the report flags a misfit
      if (!input.attending) { p.meals = undefined; p.dietary = undefined; p.experienceRevision = undefined; }
      db.responses.push({ id: makeId('rsp'), eventId: p.eventId, partyId: p.id, name: p.primaryGuestName, attending: input.attending, count: input.attending ? input.count : 0, companionNames: input.companionNames, note: input.note, channel: 'organizer', at: t.toISOString() });
      log(db, t, p.eventId, edited ? 'rsvp_edited' : input.attending ? 'rsvp_confirmed' : 'rsvp_declined', { name: p.primaryGuestName, count: input.count, attending: input.attending, by: 'organizer' }, 'organizer', p.id);
      return clone(p);
    }), 'write'),
    matchResponse: (responseId, partyId) => store.request(() => store.write((db) => {
      const r = db.responses.find((x) => x.id === responseId);
      if (!r) throw new AppError('not_found', 'لم نجد هذا الرد.');
      const p = findParty(db, partyId);
      if (r.attending && r.count > p.maxPartySize) throw new AppError('validation', `الرد لـ${r.count} أشخاص، والدعوة تسمح بـ${p.maxPartySize}. عدّل العدد المسموح أولًا.`);
      const t = now();
      Object.assign(p, applyRsvp(p, { attending: r.attending, count: r.count, note: r.note, companionNames: r.companionNames }, t.toISOString()));
      // the answers move with the reply (D10): the response is resolved, so they are counted once, on the party
      Object.assign(p, answersFrom(r));
      r.partyId = p.id; r.resolution = 'matched';
      log(db, t, p.eventId, 'rsvp_matched', { name: r.name }, 'organizer', p.id);
    }), 'write'),
    addPartyFromResponse: (responseId) => store.request(() => store.write((db) => {
      const r = db.responses.find((x) => x.id === responseId);
      if (!r) throw new AppError('not_found', 'لم نجد هذا الرد.');
      const t = now();
      const taken = new Set(db.parties.filter((p) => p.eventId === r.eventId).map((p) => p.code));
      const p: InvitationParty = {
        id: makeId('pty'), eventId: r.eventId, code: makeCode(taken), primaryGuestName: r.name, maxPartySize: Math.max(1, r.count),
        delivery: { status: 'opened', source: 'platform', at: r.at, openedAt: r.at }, rsvpStatus: 'pending', checkInStatus: 'not_arrived', checkedInCount: 0,
        source: 'general_link', createdAt: t.toISOString(), updatedAt: t.toISOString(),
      };
      Object.assign(p, applyRsvp(p, { attending: r.attending, count: Math.max(1, r.count), note: r.note }, r.at));
      Object.assign(p, answersFrom(r));
      db.parties.push(p);
      r.partyId = p.id; r.resolution = 'added';
      log(db, t, r.eventId, 'party_added', { name: p.primaryGuestName }, 'organizer', p.id);
      return clone(p);
    }), 'write'),
    dismissResponse: (responseId) => store.request(() => store.write((db) => {
      const r = db.responses.find((x) => x.id === responseId);
      if (r) r.resolution = 'dismissed';
    }), 'write'),
  };
}

// ------------------------------------------------------------------ seating
export function mockSeating({ store, now }: Ctx): SeatingRepository {
  return {
    listTables: (eventId) => store.request(() => clone(store.read().tables.filter((t) => t.eventId === eventId)).sort((a, b) => a.order - b.order)),
    createTables: (eventId, tables) => store.request(() => {
      for (const t of tables) { const e = Object.values(validateTable(t))[0]; if (e) throw new AppError('validation', e); }
      return store.write((db) => {
        findEvent(db, eventId);
        let order = Math.max(0, ...db.tables.filter((t) => t.eventId === eventId).map((t) => t.order));
        const made = tables.map((t) => ({ id: makeId('tbl'), eventId, name: t.name.trim(), capacity: t.capacity, order: ++order }));
        db.tables.push(...made);
        if (made.length === 1) log(db, now(), eventId, 'table_created', { name: made[0]!.name, capacity: made[0]!.capacity });
        else log(db, now(), eventId, 'table_created', { name: `${made.length} طاولات`, capacity: made.reduce((n, t) => n + t.capacity, 0) });
        return clone(made);
      });
    }, 'write'),
    updateTable: (id, patch) => store.request(() => store.write((db) => {
      const t = db.tables.find((x) => x.id === id);
      if (!t) throw new AppError('not_found', 'لم نجد هذه الطاولة.');
      const next = { name: patch.name ?? t.name, capacity: patch.capacity ?? t.capacity };
      const e = Object.values(validateTable(next))[0];
      if (e) throw new AppError('validation', e);
      Object.assign(t, { name: next.name.trim(), capacity: next.capacity });
      return clone(t);
    }), 'write'),
    deleteTable: (id) => store.request(() => store.write((db) => {
      const t = db.tables.find((x) => x.id === id);
      if (!t) return;
      for (const p of db.parties) if (p.tableId === id) { delete p.tableId; touch(p, now()); }
      db.tables = db.tables.filter((x) => x.id !== id);
    }), 'write'),
    assign: (partyId, tableId) => store.request(() => store.write((db) => {
      const p = findParty(db, partyId);
      const from = db.tables.find((t) => t.id === p.tableId);
      const to = tableId ? db.tables.find((t) => t.id === tableId) : undefined;
      if (tableId && !to) throw new AppError('not_found', 'لم نجد هذه الطاولة.');
      if (to && p.rsvpStatus !== 'confirmed') throw new AppError('validation', 'يمكن توزيع الدعوات المؤكدة فقط.');
      if (to) p.tableId = to.id; else delete p.tableId;
      touch(p, now());
      if (to && from && from.id !== to.id) log(db, now(), p.eventId, 'party_moved', { name: p.primaryGuestName, table: to.name }, 'organizer', p.id);
      else if (to && !from) log(db, now(), p.eventId, 'party_seated', { name: p.primaryGuestName, table: to.name }, 'organizer', p.id);
      else if (!to && from) log(db, now(), p.eventId, 'party_unseated', { name: p.primaryGuestName, table: from.name }, 'organizer', p.id);
      return clone(p);
    }), 'write'),
  };
}

// ------------------------------------------------------------------ check-in
export function mockCheckIn({ store, now }: Ctx): CheckInRepository {
  return {
    list: (eventId) => store.request(() => clone(store.read().checkIns.filter((r) => r.eventId === eventId)).sort((a, b) => b.at.localeCompare(a.at))),
    findByCode: (eventId, code) => store.request(() => clone(store.read().parties.find((p) => p.eventId === eventId && p.code === normaliseCode(code)) ?? null)),
    checkIn: (partyId, count, ctx) => store.request(() => store.write((db) => {
      if (!Number.isInteger(count) || count < 1) throw new AppError('validation', 'اختر عدد القادمين الآن.');
      const p = findParty(db, partyId);
      const t = now();
      const record = { id: makeId('chk'), eventId: p.eventId, partyId, count, method: ctx.method, at: t.toISOString(), by: ctx.by, exceptions: ctx.exceptions, staffNote: ctx.staffNote };
      db.checkIns.push(record);
      p.checkedInCount += count;
      p.checkInStatus = statusAfter(p, p.checkedInCount);
      touch(p, t);
      const expected = p.rsvpStatus === 'confirmed' ? p.confirmedPartySize ?? p.maxPartySize : p.maxPartySize;
      const real = ctx.exceptions.filter((e) => e !== 'no_table');
      if (real.length) log(db, t, p.eventId, 'check_in_exception', { name: p.primaryGuestName, reason: EXCEPTION_TEXT[real[0]!].title }, 'gate', p.id);
      else if (p.checkInStatus === 'partial') log(db, t, p.eventId, 'checked_in_partial', { name: p.primaryGuestName, total: p.checkedInCount, expected }, 'gate', p.id);
      else log(db, t, p.eventId, 'checked_in', { name: p.primaryGuestName, count: p.checkedInCount }, 'gate', p.id);
      return { party: clone(p), record: clone(record) };
    }), 'write'),
    undo: (recordId) => store.request(() => store.write((db) => {
      const r = db.checkIns.find((x) => x.id === recordId);
      if (!r || r.undone) throw new AppError('conflict', 'تم التراجع عن هذا التسجيل من قبل.');
      const p = findParty(db, r.partyId);
      r.undone = true;
      p.checkedInCount = Math.max(0, p.checkedInCount - r.count);
      p.checkInStatus = statusAfter(p, p.checkedInCount);
      touch(p, now());
      log(db, now(), p.eventId, 'check_in_undone', { name: p.primaryGuestName }, 'gate', p.id);
      return clone(p);
    }), 'write'),
  };
}

export function mockActivity({ store }: Ctx): ActivityRepository {
  return {
    list: (eventId, limit = 30) => store.request(() => clone(store.read().activity.filter((a) => a.eventId === eventId)).sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit)),
  };
}

// ------------------------------------------------------------------ public guest API
export function mockGuest({ store, now }: Ctx): GuestApi {
  const view = (slug: string, code: string | undefined | null, recordOpen: boolean): GuestView => {
    const db = store.read();
    const ev = db.events.find((e) => e.slug === slug && !e.archivedAt);
    if (!ev) throw new AppError('not_found', 'هذه الدعوة غير موجودة. تأكد من الرابط مع صاحب الدعوة.');
    const design = db.designs.find((d) => d.eventId === ev.id);
    if (!design?.published) throw new AppError('not_published', 'الدعوة غير متاحة بعد. سيشاركها صاحب المناسبة قريبًا.');
    let party: InvitationParty | undefined;
    if (code) {
      party = db.parties.find((p) => p.eventId === ev.id && p.code === normaliseCode(code));
      if (!party) throw new AppError('not_found', 'رابط الدعوة غير صحيح أو أُلغي. تواصل مع صاحب الدعوة.');
      if (recordOpen && (party.delivery.status !== 'opened')) {
        store.write((w) => {
          const p = findParty(w, party!.id);
          const t = now().toISOString();
          p.delivery = { ...p.delivery, status: 'opened', source: 'platform', openedAt: t, at: p.delivery.at ?? t };
          log(w, now(), ev.id, 'invitation_opened', { name: p.primaryGuestName }, 'guest', p.id);
        });
        party = findParty(store.read(), party.id);
      }
    } else if (!ev.settings.allowGeneralLink) {
      throw new AppError('not_found', 'هذه الدعوة شخصية. استخدم الرابط الذي وصلك من صاحب الدعوة.');
    }
    const phase = eventPhase(ev, now());
    const table = party?.tableId && ev.settings.revealTableToGuests ? db.tables.find((t) => t.id === party!.tableId)?.name : undefined;
    return clone({
      event: { id: ev.id, slug: ev.slug, type: ev.type, title: ev.title, names: ev.names, date: ev.date, time: ev.time, timeZone: ev.timeZone, durationHours: ev.durationHours, venue: ev.venue },
      design: publishState(design) === 'none' ? design.draft : design.published,
      party: party ? { code: party.code, name: party.primaryGuestName, maxPartySize: party.maxPartySize, rsvpStatus: party.rsvpStatus, confirmedPartySize: party.confirmedPartySize, companionNames: party.companionNames, guestNote: party.guestNote, meals: party.meals, dietary: party.dietary, tableName: table, checkedInCount: party.checkedInCount } : null,
      canEdit: phase === 'upcoming' || phase === 'final_week' || (phase === 'event_day' && now() < eventStart(ev)),
      phase: phase === 'completed' || phase === 'archived' ? 'after' : phase === 'event_day' ? 'event_day' : 'before',
      maxGuests: party?.maxPartySize ?? ev.settings.defaultPartySize,
      experience: publicExperience(ev),
    });
  };
  return {
    open: (slug, code) => store.request(() => view(slug, code, true)),
    submitRsvp: (slug, code, input) => store.request(() => {
      const before = view(slug, code, false);
      if (!before.canEdit) throw new AppError('conflict', 'انتهى وقت الرد على هذه الدعوة.');
      return store.write((db) => {
        const t = now();
        const ev = db.events.find((e) => e.slug === slug)!;
        if (code) {
          const p = db.parties.find((x) => x.eventId === ev.id && x.code === normaliseCode(code))!;
          const err = validateRsvp(input, p.maxPartySize);
          if (err) throw new AppError('validation', RSVP_ERROR_TEXT[err], 'count');
          const edited = p.rsvpStatus !== 'pending';
          const answers = guestAnswers(ev, input);
          Object.assign(p, applyRsvp(p, input, t.toISOString()), answers);
          if (p.delivery.status !== 'opened') p.delivery = { ...p.delivery, status: 'opened', source: 'platform', openedAt: t.toISOString() };
          const id = makeId('rsp');
          db.responses.push({ id, eventId: ev.id, partyId: p.id, name: p.primaryGuestName, attending: input.attending, count: input.attending ? input.count : 0, companionNames: input.companionNames, note: input.note, ...answers, channel: 'guest_link', at: t.toISOString() });
          log(db, t, ev.id, edited ? 'rsvp_edited' : input.attending ? 'rsvp_confirmed' : 'rsvp_declined', { name: p.primaryGuestName, count: input.count, attending: input.attending }, 'guest', p.id);
          return { id };
        }
        const name = input.name?.trim();
        if (!name) throw new AppError('validation', 'اكتب اسمك ليعرف صاحب الدعوة من رد.', 'name');
        const err = validateRsvp(input, ev.settings.defaultPartySize);
        if (err) throw new AppError('validation', RSVP_ERROR_TEXT[err], 'count');
        const answers = guestAnswers(ev, input);
        const id = makeId('rsp');
        db.responses.push({ id, eventId: ev.id, name, attending: input.attending, count: input.attending ? input.count : 0, note: input.note, ...answers, channel: 'general_link', at: t.toISOString() });
        log(db, t, ev.id, 'rsvp_unmatched', { name }, 'guest');
        return { id };
      });
    }, 'write').then(({ id }) => ({ ...view(slug, code, false), responseId: id })),
  };
}
