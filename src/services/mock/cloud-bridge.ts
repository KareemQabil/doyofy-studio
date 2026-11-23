/**
 * The mock store's two touch points with the backend sync (services/cloud/sync.ts):
 *  - eventSnapshot(): the PUBLIC copy of one event — event info, the latest saved design, the organizer's voice, the guest
 *    questions and, per guest, only code · name · allowance · reply state · revealed table. Never a phone number,
 *    organizer note, section, delivery history or account data (the server rebuilds the same whitelist again).
 *  - applyRemoteReplies(): guests' replies from other devices, merged as if they had replied here (activity, counts,
 *    seating and check-in all see them). Each reply is applied once, in arrival order; the latest one wins.
 */
import type { DbShape, MockStore } from './store';
import type { InvitationDesignContent, RSVPResponse } from '../../domain/types';
import type { RemoteReply } from '../cloud/api';
import type { Dialect } from '../../domain/copy';
import { portableView } from '../../domain/portable-invite';
import { liveDesign } from '../../domain/invitation';
import { eventEnd, eventStart } from '../../domain/event';
import { applyRsvp } from '../../domain/parties';
import { checkAnswers, cleanAnswers, experienceOf } from '../../domain/guest-experience';
import { normaliseCode } from '../../domain/ids';
import { log } from './helpers';

export interface PublicSnapshot {
  v: 1;
  event: ReturnType<typeof portableView>['event'];
  startsAt: string; endsAt: string;
  design: InvitationDesignContent & { audio?: InvitationDesignContent['audio'] & { trackUrl?: string; trackStart?: number; trackFade?: number; voiceUrl?: string } };
  dialect?: Dialect;
  experience?: ReturnType<typeof portableView>['experience'];
  general: { allowed: boolean; maxGuests: number };
  guests: Array<{ code: string; name: string; max: number; status: 'pending' | 'confirmed' | 'declined'; count?: number; companions?: string[]; note?: string; meals?: Array<{ optionId: string; count: number }>; dietary?: { answered: boolean; needs: string[]; affectedCount?: number; note?: string }; table?: string; checkedIn?: number; at?: string }>;
  archived?: boolean;
}

const clamp = (n: unknown, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(Number(n) || 0)));

/** null = no such event */
export function eventSnapshot(db: Readonly<DbShape>, eventId: string, opts: { slug: string; dialect: Dialect; audio?: (a: PublicSnapshot['design']['audio']) => PublicSnapshot['design']['audio'] }): PublicSnapshot | null {
  const ev = db.events.find((e) => e.id === eventId);
  if (!ev) return null;
  // the invitation is always live: guests get the latest saved design (the occasion's default before the first save)
  const content = liveDesign(db.designs.find((d) => d.eventId === eventId), ev);
  const base = portableView({ ...ev, slug: opts.slug }, content, undefined, opts.dialect);
  const tables = new Map(db.tables.filter((t) => t.eventId === ev.id).map((t) => [t.id, t.name]));
  const guests = db.parties.filter((p) => p.eventId === ev.id).map((p) => {
    const max = clamp(p.maxPartySize, 1, 50);
    const confirmed = p.rsvpStatus === 'confirmed';
    const meals = confirmed ? p.meals?.filter((m) => m.count > 0).map((m) => ({ optionId: m.optionId, count: clamp(m.count, 1, max) })) : undefined;
    return {
      code: p.code, name: p.primaryGuestName.slice(0, 120), max, status: p.rsvpStatus,
      ...(confirmed ? { count: clamp(p.confirmedPartySize || 1, 1, max) } : {}),
      ...(p.companionNames?.length ? { companions: p.companionNames.map((n) => n.slice(0, 80)).slice(0, max - 1) } : {}),
      ...(p.guestNote ? { note: p.guestNote.slice(0, 1000) } : {}),
      ...(meals?.length ? { meals } : {}),
      ...(confirmed && p.dietary ? { dietary: { answered: p.dietary.answered, needs: [...p.dietary.needs], ...(p.dietary.affectedCount ? { affectedCount: clamp(p.dietary.affectedCount, 1, max) } : {}), ...(p.dietary.note ? { note: p.dietary.note.slice(0, 300) } : {}) } } : {}),
      ...(ev.settings.revealTableToGuests && p.tableId && tables.get(p.tableId) ? { table: tables.get(p.tableId)! } : {}),
      ...(p.checkedInCount ? { checkedIn: clamp(p.checkedInCount, 0, 50) } : {}),
      ...(p.respondedAt ? { at: p.respondedAt } : {}),
    };
  });
  const audio = base.design.audio && opts.audio ? opts.audio(base.design.audio) : base.design.audio;
  return {
    v: 1, event: base.event, startsAt: eventStart(ev).toISOString(), endsAt: eventEnd(ev).toISOString(),
    design: { ...base.design, ...(audio ? { audio } : {}) }, ...(base.dialect ? { dialect: base.dialect } : {}), ...(base.experience ? { experience: base.experience } : {}),
    general: { allowed: ev.settings.allowGeneralLink, maxGuests: clamp(ev.settings.defaultPartySize, 1, 50) }, guests,
    ...(ev.archivedAt ? { archived: true } : {}),
  };
}

const keyOf = (r: RemoteReply) => r.code ? `c-${normaliseCode(r.code)}` : `g-${r.id}`;
const validReply = (r: RemoteReply) => !!r && typeof r.id === 'string' && typeof r.name === 'string' && typeof r.attending === 'boolean'
  && Number.isInteger(r.count) && r.count >= 0 && r.count <= 50 && Number.isFinite(Date.parse(r.at));

/**
 * `applied` (reply key → reply time) is the sync's memory and is updated in place; returns how many replies changed the store.
 * A guest whose invitation was removed meanwhile is skipped; answers that no longer fit the questions keep the attendance.
 */
export function applyRemoteReplies(store: MockStore, eventId: string, replies: RemoteReply[], applied: Record<string, string>): number {
  const fresh = replies.filter((r) => validReply(r) && !(applied[keyOf(r)] && applied[keyOf(r)]! >= r.at)).sort((a, b) => a.at.localeCompare(b.at));
  if (!fresh.length || !store.read().events.some((e) => e.id === eventId)) return 0;
  return store.write((db) => {
    const ev = db.events.find((e) => e.id === eventId)!;
    const x = experienceOf(ev);
    let changed = 0;
    for (const r of fresh) {
      applied[keyOf(r)] = r.at;
      const at = new Date(r.at);
      const input = { attending: r.attending, count: r.attending ? Math.max(1, r.count) : 0, companionNames: r.companionNames, note: r.note, meals: r.meals, dietary: r.dietary };
      const answers = r.attending && checkAnswers(x, input).ok ? { ...cleanAnswers(x, input), experienceRevision: x.revision } : { meals: undefined, dietary: undefined, experienceRevision: undefined };
      if (r.code) {
        const p = db.parties.find((q) => q.eventId === eventId && q.code === normaliseCode(r.code!));
        if (!p) continue;
        const edited = p.rsvpStatus !== 'pending';
        const count = r.attending ? Math.min(p.maxPartySize, input.count) : 0;
        Object.assign(p, applyRsvp(p, { ...input, count }, r.at), answers);
        if (p.delivery.status !== 'opened') p.delivery = { ...p.delivery, status: 'opened', source: 'platform', openedAt: p.delivery.openedAt ?? r.at, at: p.delivery.at ?? r.at };
        db.responses.push({ id: `rsp_r${r.id.slice(0, 12)}${at.getTime().toString(36)}`, eventId, partyId: p.id, name: p.primaryGuestName, attending: r.attending, count, companionNames: r.companionNames, note: r.note, ...answers, channel: 'guest_link', at: r.at });
        log(db, at, eventId, edited ? 'rsvp_edited' : r.attending ? 'rsvp_confirmed' : 'rsvp_declined', { name: p.primaryGuestName, count, attending: r.attending }, 'guest', p.id);
        changed++;
        continue;
      }
      // general link: a correction updates its own reply while the organizer has not handled it; after that it is a new one
      const reply: Omit<RSVPResponse, 'id' | 'eventId'> = { name: r.name.trim().slice(0, 80) || '—', attending: r.attending, count: r.attending ? input.count : 0, ...(r.companionNames?.length ? { companionNames: r.companionNames } : {}), note: r.note, ...answers, channel: 'general_link', at: r.at };
      const prefix = `rsp_g${r.id}`;
      const open = db.responses.find((q) => q.eventId === eventId && q.id.startsWith(prefix) && !q.resolution);
      if (open) {
        for (const k of ['companionNames', 'note', 'meals', 'dietary', 'experienceRevision'] as const) delete open[k];
        Object.assign(open, reply);
      } else {
        const n = db.responses.filter((q) => q.id.startsWith(prefix)).length;
        db.responses.push({ id: n ? `${prefix}_${n}` : prefix, eventId, ...reply });
        log(db, at, eventId, 'rsvp_unmatched', { name: reply.name }, 'guest');
      }
      changed++;
    }
    return changed;
  });
}
