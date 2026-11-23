/**
 * Invitation design ↔ Invitation Studio content.
 * The design never stores event data (date, time, venue): `toInvitationData` merges the Event in at
 * render time, so editing the invitation can't silently change the event (spec §10).
 */
import type { Event, InvitationDesign, InvitationDesignContent } from './types';
import { eventTypeInfo, isCoupleEvent } from './event';
import { OCCASION_LABELS_EN, OCCASION_STARTERS } from './occasion-starters';
import { CARD_NAMES, faceDigits, presetById } from './templates';
export { CARD_NAMES };
import { offsetString } from './format';
import { resolveAudioSelection } from './audio-library';

/** the flat backdrops behind the card (src/scenes/flat.js keeps the same ids) */
export const SCENE_NAMES: Record<string, string> = {
  silk: 'وردي حريري', marble: 'عاجي', petals: 'بتلات', clay: 'نقاط ملوّنة', palace: 'أقواس ذهبية',
  desert: 'غروب', candlelit: 'عنّابي دافئ', garden: 'أخضر الليل', starry: 'كحلي ونجوم', sea: 'أزرق البحر',
};

/** A face that no longer exists (designs saved before the single card family) opens as its occasion's own face. */
export function resolveDesign<T extends Pick<InvitationDesignContent, 'cardId' | 'sceneId'>>(c: T, type: Event['type']): T {
  if (CARD_NAMES[c.cardId]) return c;
  const preset = presetById(OCCASION_STARTERS[type].presetId)!;
  return { ...c, cardId: preset.cardId, sceneId: preset.sceneId };
}

/**
 * A new invitation starts in its occasion's own (featured) design with one editable Arabic line. The English line
 * and the programme start empty: guests see only what the organizer wrote (an empty programme has no page).
 */
export function defaultDesign(ev: Event): InvitationDesignContent {
  const starter = OCCASION_STARTERS[ev.type];
  const preset = presetById(starter.presetId)!;
  return {
    experience: { ...preset.experience },
    cardId: preset.cardId,
    sceneId: preset.sceneId,
    displayNames: {},
    message: { ar: starter.message, en: '' },
    program: [],
  };
}

/**
 * Whether the organizer gave this invitation any English (names, place, the message or a programme line). Without
 * it the invitation is Arabic only: the engine prints no Latin names, dates or labels and its own words are Arabic.
 */
export function hasEnglish(ev: Pick<Event, 'names' | 'venue'>, c: Pick<InvitationDesignContent, 'displayNames' | 'message' | 'program'>): boolean {
  const any = (...v: Array<string | undefined>) => v.some((x) => !!x?.trim());
  return any(ev.names.aEn, ev.names.bEn, ev.venue.nameEn, ev.venue.cityEn, c.displayNames.aEn, c.displayNames.bEn, c.message.en) || c.program.some((p) => any(p.en));
}

/**
 * The design guests get: the latest saved one, always. The invitation has no publish step — a fresh event's
 * links already work with its occasion's default design, and an older stored «published» snapshot is ignored.
 */
export function liveDesign(d: Pick<InvitationDesign, 'draft'> | null | undefined, ev: Event): InvitationDesignContent {
  return d?.draft ?? defaultDesign(ev);
}


export interface ResolvedNames { a: string; b: string; aEn: string; bEn: string; fromEvent: boolean }

export type InvitationEvent = Pick<Event, 'slug' | 'type' | 'names' | 'date' | 'time' | 'timeZone' | 'durationHours' | 'venue'> & { title?: string };

export function resolvedNames(ev: Pick<Event, 'names'>, c: InvitationDesignContent): ResolvedNames {
  const dn = c.displayNames;
  const a = dn.a?.trim() || ev.names.a;
  const b = dn.b?.trim() || ev.names.b || '';
  const aEn = dn.aEn?.trim() || ev.names.aEn || a;
  const bEn = dn.bEn?.trim() || ev.names.bEn || b;
  const fromEvent = !dn.a?.trim() && !dn.b?.trim() && !dn.aEn?.trim() && !dn.bEn?.trim();
  return { a, b, aEn, bEn, fromEvent };
}

const first = (s: string) => [...s.trim()][0] ?? '';

/**
 * Event + design → the Invitation Studio's `InvitationData` (see src/data/invitation.js).
 * `maxGuests` is the party's allowance when a party opens its own link.
 */
/** everything a self-contained guest link carries (?d=…): the design, the event as the card shows it, the guest */
export function inviteConfig(ev: InvitationEvent, c: InvitationDesignContent, maxGuests = 2, guestName?: string) {
  return { experience: { ...c.experience }, card: c.cardId, scene: c.sceneId, invitation: toInvitationData(ev, c, maxGuests), ...(guestName ? { guest: { name: guestName, maxGuests } } : {}) };
}

export function toInvitationData(ev: InvitationEvent, c: InvitationDesignContent, maxGuests = 2) {
  const n = resolvedNames(ev, c);
  const couple = isCoupleEvent(ev.type);
  return {
    id: `${ev.slug}`,
    audio: resolveAudioSelection(c.audio),
    // no English written → Arabic only (data/derive.js reads `secondary: null`)
    locale: { primary: 'ar', secondary: hasEnglish(ev, c) ? 'en' : null },
    couple: {
      a: { ar: n.a, en: n.aEn, monogram: first(n.a), initial: first(n.aEn).toUpperCase() },
      b: { ar: couple ? n.b : '', en: couple ? n.bEn : '', monogram: couple ? first(n.b) : '', initial: couple ? first(n.bEn).toUpperCase() : '' },
    },
    event: { start: `${ev.date}T${ev.time}:00${offsetString(ev.date, ev.time, ev.timeZone)}`, timeZone: ev.timeZone, durationHours: ev.durationHours, title: ev.title, label: { ar: eventTypeInfo(ev.type).label, en: OCCASION_LABELS_EN[ev.type] } },
    venue: { ar: ev.venue.name, en: ev.venue.nameEn || ev.venue.name, city: { ar: ev.venue.city, en: ev.venue.cityEn || ev.venue.city }, mapUrl: ev.venue.mapUrl || null },
    copy: { invitation: { ar: c.message.ar, en: c.message.en } },
    program: c.program.filter((p) => p.time && (p.ar || p.en)),
    rsvp: { minGuests: 1, maxGuests: Math.max(1, maxGuests), defaultGuests: Math.min(2, Math.max(1, maxGuests)) },
    // the face's number system travels with the invitation to its pages
    display: { digits: faceDigits(c.cardId) },
  };
}
