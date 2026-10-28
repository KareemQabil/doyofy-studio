/**
 * Invitation design ↔ Invitation Studio content.
 * The design never stores event data (date, time, venue): `toInvitationData` merges the Event in at
 * render time, so editing the invitation can't silently change the event (spec §10).
 */
import type { Event, InvitationDesign, InvitationDesignContent, PublishState } from './types';
import { eventTypeInfo, isCoupleEvent } from './event';
import { OCCASION_LABELS_EN, OCCASION_STARTERS } from './occasion-starters';
import { presetById } from './templates';
import { offsetString } from './format';

export const CARD_NAMES: Record<string, string> = {
  'wedding-vow': 'وعد على ورق', 'engagement-rings': 'مداران للفرح', 'katb-seal': 'ميثاق وختم', 'henna-lattice': 'نقش الحنّة', 'family-table': 'على مائدة واحدة', 'iftar-arch': 'نور اللقاء', 'opening-door': 'الباب الأول', 'corporate-edition': 'العدد القادم', 'celebration-shapes': 'شكل للفرح',
  'grad-editorial': 'تخرج بأفق جديد', 'grad-campus': 'ختم الإنجاز', 'grad-constellation': 'نجمة التخرج', 'birthday-confetti': 'عيد من الألوان', 'newborn-moon': 'أهلًا بالقمر', 'forum-grid': 'ملتقى الأفكار',
  'sig-diploma': 'توقيع التخرّج', 'sig-ribbon': 'حروف الفرح', 'sig-ticket': 'تذكرة الفرح',
  'kit-rose-garden': 'حديقة الورد', 'kit-two-rings': 'خاتمان', 'kit-seal-arch': 'ميثاق وقوس', 'kit-henna-rosette': 'وردة الحنّة', 'kit-balloons': 'بالونات', 'kit-cap-diamond': 'قبعة في ماسة', 'kit-moon-cloud': 'قمر وغيمة', 'kit-dallah-olive': 'دلّة وزيتون', 'kit-lantern-night': 'فوانيس الليل', 'kit-forum-stars': 'منبر النجوم', 'kit-satin-ribbon': 'شريط الافتتاح', 'kit-laurel-gala': 'وردة الحفل', 'kit-eucalyptus': 'غصن الأوكالبتوس',
  lace: 'دانتيل عاجي', wine: 'نبيذي وذهبي', emerald: 'زمرّد آرت ديكو', sage: 'أغصان المريمية', blush: 'ألوان مائية وردية',
  midnight: 'نجوم منتصف الليل', arabesque: 'أرابيسك', minimal: 'بسيط عصري', terracotta: 'شمس التراكوتا', clay: 'صلصال باستيل',
};
export const SCENE_NAMES: Record<string, string> = {
  candlelit: 'قاعة الشموع', marble: 'صباح رخامي', garden: 'ليلة في الحديقة', desert: 'غروب الصحراء', starry: 'ليلة النجوم',
  silk: 'ستائر الحرير', petals: 'بتلات طائرة', clay: 'مسرح الصلصال', sea: 'بحر مقمر', palace: 'أقواس القصر',
};

/** A new invitation starts in its occasion's visual language, with editable relevant copy. */
export function defaultDesign(ev: Event): InvitationDesignContent {
  const starter = OCCASION_STARTERS[ev.type];
  const preset = presetById(starter.presetId)!;
  const [hours, minutes] = ev.time.split(':').map(Number);
  const start = Number.isFinite(hours) && Number.isFinite(minutes) ? hours! * 60 + minutes! : 19 * 60;
  const timeAfter = (after: number) => {
    const total = (start + after) % (24 * 60);
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  };
  return {
    experience: { ...preset.experience },
    cardId: preset.cardId,
    sceneId: preset.sceneId,
    displayNames: {},
    message: { ...starter.message },
    program: starter.program.map(({ after, ar, en }) => ({ time: timeAfter(after), ar, en })),
  };
}

export function publishState(d: InvitationDesign | null | undefined): PublishState {
  if (!d) return 'none';
  if (!d.published) return 'draft';
  return JSON.stringify(d.published) === JSON.stringify(d.draft) ? 'published' : 'changed';
}

export const PUBLISH_LABEL: Record<PublishState, { label: string; tone: 'neutral' | 'info' | 'success' | 'warning' }> = {
  none: { label: 'لم تُصمم بعد', tone: 'neutral' },
  draft: { label: 'مسودة — غير منشورة', tone: 'warning' },
  published: { label: 'منشورة', tone: 'success' },
  changed: { label: 'منشورة · تعديلات غير منشورة', tone: 'info' },
};

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
export function toInvitationData(ev: InvitationEvent, c: InvitationDesignContent, maxGuests = 2) {
  const n = resolvedNames(ev, c);
  const couple = isCoupleEvent(ev.type);
  return {
    id: `${ev.slug}`,
    locale: { primary: 'ar', secondary: 'en' },
    couple: {
      a: { ar: n.a, en: n.aEn, monogram: first(n.a), initial: first(n.aEn).toUpperCase() },
      b: { ar: couple ? n.b : '', en: couple ? n.bEn : '', monogram: couple ? first(n.b) : '', initial: couple ? first(n.bEn).toUpperCase() : '' },
    },
    event: { start: `${ev.date}T${ev.time}:00${offsetString(ev.date, ev.time, ev.timeZone)}`, timeZone: ev.timeZone, durationHours: ev.durationHours, title: ev.title, label: { ar: eventTypeInfo(ev.type).label, en: OCCASION_LABELS_EN[ev.type] } },
    venue: { ar: ev.venue.name, en: ev.venue.nameEn || ev.venue.name, city: { ar: ev.venue.city, en: ev.venue.cityEn || ev.venue.city }, mapUrl: ev.venue.mapUrl || null },
    copy: { invitation: { ar: c.message.ar, en: c.message.en } },
    program: c.program.filter((p) => p.time && (p.ar || p.en)),
    rsvp: { minGuests: 1, maxGuests: Math.max(1, maxGuests), defaultGuests: Math.min(2, Math.max(1, maxGuests)) },
    display: {},
  };
}
