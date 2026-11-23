/** Public, self-contained demo snapshot. It carries no organizer notes, phone numbers or account data.
 * Replies to this snapshot stay on the guest's device; they never mutate the organizer's store. */
import type { Event, InvitationDesignContent, InvitationParty } from './types';
import type { GuestApi, GuestGeneralReply, GuestView, GuestRsvpInput } from '../services/contracts';
import { validateRsvp, RSVP_ERROR_TEXT } from './parties';
import { checkAnswers, cleanAnswers } from './guest-experience';
import { EVENT_TYPES, eventEnd, eventStart } from './event';
import { localDateOf } from './format';
import { resolveAudioSelection } from './audio-library';
import { AppError } from '../services/errors';
import { parseDialect, type Dialect } from './copy';

export type PortableParty = Pick<InvitationParty, 'code' | 'primaryGuestName' | 'maxPartySize'>;
/** Version 2 avoids duplicating the full invitation as both engine data and platform data. */
export function encodePortableView(view: GuestView): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify({ v: 2, platform: view })))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function decodePortableView(token: string, slug: string, code?: string): GuestView | null {
  try {
    if (token.length > 30000 || !/^[A-Za-z0-9_-]+$/.test(token)) return null;
    const config = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(token.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)))) as { v?: number; platform?: unknown };
    return config.v === 2 || config.v === 1 ? readPortableView(config.platform, slug, code) : null;
  } catch { return null; }
}
/** `dialect`: the organizer's voice, carried in the link so the guest's device speaks it (see GuestView.dialect) */
export function portableView(event: Event, design: InvitationDesignContent, party?: PortableParty, dialect: Dialect = 'ar'): GuestView {
  const { id, slug, type, title, names, date, time, timeZone, durationHours, venue } = event;
  return {
    event: { id, slug, type, title, names, date, time, timeZone, durationHours, venue }, design: { ...design, audio: resolveAudioSelection(design.audio) },
    party: party ? { code: party.code, name: party.primaryGuestName, maxPartySize: party.maxPartySize, rsvpStatus: 'pending', checkedInCount: 0 } : null,
    maxGuests: party?.maxPartySize ?? event.settings.defaultPartySize, canEdit: true, phase: 'before',
    ...(dialect !== 'ar' ? { dialect } : {}),
    experience: event.guestExperience ? { ...event.guestExperience, meals: { ...event.guestExperience.meals, options: event.guestExperience.meals.options.filter(x => !x.archived) }, gifts: { ...event.guestExperience.gifts, items: event.guestExperience.gifts.items.filter(x => !x.archived) } } : undefined,
  };
}

/** Reject malformed or mismatched public snapshots before they reach renderers. */
export function readPortableView(raw: unknown, slug: string, code?: string): GuestView | null {
  try {
    const v = raw as GuestView;
    if (!v || v.event.slug !== slug || (code ? v.party?.code !== code : v.party !== null)) return null;
    const ev = v.event, d = v.design;
    if (!ev.id || !EVENT_TYPES.some(t => t.id === ev.type) || typeof ev.title !== 'string' || !ev.names || typeof ev.names.a !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(ev.date) || !/^\d{2}:\d{2}$/.test(ev.time) || !Number.isFinite(eventStart(ev).getTime())) return null;
    if (!ev.venue || typeof ev.venue.name !== 'string' || typeof ev.venue.city !== 'string' || !d.experience || !d.displayNames || !d.message || typeof d.message.ar !== 'string' || !Array.isArray(d.program) || !d.program.every(x => x && typeof x.time === 'string' && typeof x.ar === 'string' && typeof x.en === 'string') || typeof d.cardId !== 'string' || typeof d.sceneId !== 'string') return null;
    if (!Number.isInteger(v.maxGuests) || v.maxGuests < 1 || v.maxGuests > 50 || (v.party && (typeof v.party.name !== 'string' || v.party.maxPartySize !== v.maxGuests))) return null;
    if (v.experience && (!v.experience.meals || !Array.isArray(v.experience.meals.options) || !v.experience.dietary || !v.experience.gifts || !Array.isArray(v.experience.gifts.items))) return null;
    const copy = structuredClone(v);
    if (copy.event.venue.mapUrl && !/^https?:\/\//i.test(copy.event.venue.mapUrl)) delete copy.event.venue.mapUrl;
    // Every newly shared snapshot starts pending. A reply is recovered only from this device's demo store.
    // an unknown voice falls back to modern; modern itself is the default and is not stored
    const dialect = parseDialect(copy.dialect);
    if (dialect === 'ar') delete copy.dialect; else copy.dialect = dialect;
    if (copy.party) copy.party = { code: copy.party.code, name: copy.party.name, maxPartySize: copy.maxGuests, rsvpStatus: 'pending', checkedInCount: 0 };
    delete copy.reply;
    copy.phase = 'before'; copy.canEdit = true;
    return copy;
  } catch { return null; }
}

export function createPortableGuestApi(initial: GuestView, storage?: Pick<Storage, 'getItem' | 'setItem'>): GuestApi {
  const key = `doyofy:guest-demo:${initial.event.slug}:${initial.party?.code ?? 'general'}:${initial.design.cardId}`;
  let current = structuredClone(initial);
  const refreshPhase = () => {
    const now = new Date();
    current.phase = now.getTime() > eventEnd(current.event).getTime() + 3 * 36e5 ? 'after' : localDateOf(now, current.event.timeZone) >= current.event.date ? 'event_day' : 'before';
    current.canEdit = now < eventStart(current.event);
    return structuredClone(current);
  };
  try {
    const saved = JSON.parse(storage?.getItem(key) ?? 'null') as { party?: GuestView['party']; reply?: GuestGeneralReply } | null;
    // the general link keeps this device's own reply (name, answer and follow-up), so a reload shows it, ready to correct
    if (!current.party && saved?.reply) { const r = readGeneralReply(saved.reply, current.maxGuests); if (r) current.reply = r; }
    if (saved?.party && current.party && saved.party.code === current.party.code && saved.party.maxPartySize === current.maxGuests && ['confirmed', 'declined'].includes(saved.party.rsvpStatus)) {
      const count = saved.party.confirmedPartySize ?? 0;
      if (saved.party.rsvpStatus === 'declined' || (Number.isInteger(count) && count > 0 && count <= current.maxGuests)) current.party = { ...current.party, ...saved.party, name: current.party.name, checkedInCount: 0 };
    }
  } catch { /* damaged/blocked storage simply starts a fresh demo reply */ }
  return {
    open: async () => refreshPhase(),
    submitRsvp: async (_slug: string, _code: string | null, input: GuestRsvpInput) => {
      refreshPhase();
      if (!current.canEdit) throw new AppError('conflict', 'انتهت فترة تعديل الرد.');
      const error = validateRsvp(input, current.maxGuests);
      if (error) throw new AppError('validation', RSVP_ERROR_TEXT[error], 'count');
      if (input.attending && !Number.isInteger(input.count)) throw new AppError('validation', 'اختاروا عددًا صحيحًا للحضور.', 'count');
      if (!current.party && !input.name?.trim()) throw new AppError('validation', 'اكتبوا الاسم قبل إرسال الرد.', 'name');
      if (current.experience && input.attending) {
        const check = checkAnswers(current.experience, input);
        if (!check.ok) throw new AppError(check.conflict ? 'conflict' : 'validation', check.message, check.field);
      }
      if (current.party) {
        current.party = { ...current.party, rsvpStatus: input.attending ? 'confirmed' : 'declined', confirmedPartySize: input.attending ? input.count : undefined, companionNames: input.companionNames, guestNote: input.note, ...(current.experience ? cleanAnswers(current.experience, input) : {}) };
        try { storage?.setItem(key, JSON.stringify({ party: current.party })); } catch { /* the current view still works without persistence */ }
      } else {
        const answers = current.experience && input.attending ? cleanAnswers(current.experience, input) : {};
        const companions = input.attending ? (input.companionNames ?? []).map((n) => n.trim()).filter(Boolean).slice(0, Math.max(0, input.count - 1)) : [];
        current.reply = { id: 'device-demo', name: input.name!.trim(), attending: input.attending, count: input.attending ? input.count : 0, ...(companions.length ? { companionNames: companions } : {}), ...answers };
        try { storage?.setItem(key, JSON.stringify({ reply: current.reply })); } catch { /* the current view still works without persistence */ }
      }
      return { ...refreshPhase(), responseId: 'device-demo' };
    },
  };
}

/** a stored general-link reply, checked before it is shown again (damaged or out-of-range entries are dropped) */
function readGeneralReply(raw: unknown, maxGuests: number): GuestGeneralReply | null {
  const r = raw as GuestGeneralReply;
  if (!r || typeof r !== 'object' || typeof r.name !== 'string' || !r.name.trim() || typeof r.attending !== 'boolean' || typeof r.id !== 'string') return null;
  if (r.attending ? !(Number.isInteger(r.count) && r.count >= 1 && r.count <= maxGuests) : r.count !== 0) return null;
  const companions = Array.isArray(r.companionNames) ? r.companionNames.filter((n): n is string => typeof n === 'string').slice(0, Math.max(0, r.count - 1)) : [];
  return {
    id: r.id, name: r.name.trim(), attending: r.attending, count: r.count, ...(companions.length ? { companionNames: companions } : {}),
    ...(Array.isArray(r.meals) ? { meals: r.meals } : {}), ...(r.dietary && typeof r.dietary === 'object' ? { dietary: r.dietary } : {}),
  };
}
