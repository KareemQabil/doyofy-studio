/** Event rules: types, titles, validation of the essentials, phase over time. */
import type { CreateEventInput, Event, EventDetails, EventType, LocalDate, Tone } from './types';
import { daysBetween, localDateOf, zonedToInstant } from './format';

export type OccasionGroup = 'marriage' | 'personal' | 'family' | 'business' | 'other';

export interface EventTypeInfo {
  id: EventType;
  label: string;
  /** 2–4 words under the name on occasion cards */
  line: string;
  group: OccasionGroup;
  /** shown first (rail / start of the coverflow) */
  popular?: boolean;
  couple: boolean;
  titlePrefix: string;
  hint: string;
  /** label of the main name field(s) in the create form */
  nameLabel: string;
  nameLabelB?: string;
}

export const OCCASION_GROUPS: Array<{ id: OccasionGroup; label: string }> = [
  { id: 'marriage', label: 'زواج واحتفالات' },
  { id: 'personal', label: 'شخصية' },
  { id: 'family', label: 'عائلية وموسمية' },
  { id: 'business', label: 'أعمال' },
  { id: 'other', label: 'أخرى' },
];

/** Occasion catalogue — one list for every chooser, so A/B tests compare the interaction, not the content. */
export const EVENT_TYPES: EventTypeInfo[] = [
  { id: 'wedding', label: 'زفاف', line: 'ليلة العمر', group: 'marriage', popular: true, couple: true, titlePrefix: 'زفاف', hint: 'حفل الزفاف', nameLabel: 'اسم العروس', nameLabelB: 'اسم العريس' },
  { id: 'engagement', label: 'خطوبة', line: 'بداية الحكاية', group: 'marriage', popular: true, couple: true, titlePrefix: 'خطوبة', hint: 'حفل الخطوبة', nameLabel: 'اسم المخطوبة', nameLabelB: 'اسم الخاطب' },
  { id: 'katb_kitab', label: 'عقد قران', line: 'الملكة وكتب الكتاب', group: 'marriage', popular: true, couple: true, titlePrefix: 'عقد قران', hint: 'كتب الكتاب / الملكة', nameLabel: 'اسم العروس', nameLabelB: 'اسم العريس' },
  { id: 'henna', label: 'حنة', line: 'ليلة النقش والفرح', group: 'marriage', couple: true, titlePrefix: 'حنة', hint: 'ليلة الحنة', nameLabel: 'اسم العروس', nameLabelB: 'اسم العريس' },
  { id: 'birthday', label: 'عيد ميلاد', line: 'سنة جديدة تُحتفى', group: 'personal', popular: true, couple: false, titlePrefix: 'عيد ميلاد', hint: 'لطفل أو لكبير', nameLabel: 'اسم صاحب/ة عيد الميلاد' },
  { id: 'graduation', label: 'تخرج', line: 'فرحة الإنجاز', group: 'personal', popular: true, couple: false, titlePrefix: 'حفل تخرج', hint: 'احتفال بالتخرج', nameLabel: 'اسم الخريج/ة' },
  { id: 'newborn', label: 'مولود', line: 'أهلًا بالضيف الصغير', group: 'personal', couple: false, titlePrefix: 'استقبال المولود', hint: 'استقبال مولود جديد', nameLabel: 'اسم المولود/ة' },
  { id: 'family', label: 'تجمع عائلي', line: 'لمّة الأهل', group: 'family', couple: false, titlePrefix: 'تجمع', hint: 'عزومة أو لمة عائلة', nameLabel: 'اسم العائلة' },
  { id: 'iftar', label: 'إفطار رمضان', line: 'على مائدة واحدة', group: 'family', popular: true, couple: false, titlePrefix: 'إفطار', hint: 'إفطار أو سحور رمضاني', nameLabel: 'اسم العائلة أو الجهة' },
  { id: 'conference', label: 'مؤتمر', line: 'لقاء وحوار', group: 'business', couple: false, titlePrefix: '', hint: 'مؤتمر أو ملتقى', nameLabel: 'اسم المؤتمر' },
  { id: 'opening', label: 'افتتاح', line: 'أول الأبواب', group: 'business', couple: false, titlePrefix: 'افتتاح', hint: 'افتتاح فرع أو مكان', nameLabel: 'اسم المكان أو النشاط' },
  { id: 'corporate', label: 'مناسبة شركة', line: 'حفل أو لقاء فريق', group: 'business', couple: false, titlePrefix: '', hint: 'حفل أو لقاء لفريق العمل', nameLabel: 'اسم المناسبة' },
  { id: 'other', label: 'مناسبة أخرى', line: 'أي احتفال آخر', group: 'other', couple: false, titlePrefix: '', hint: 'أي مناسبة أخرى', nameLabel: 'اسم صاحب المناسبة' },
];

/** popular first, then the rest in catalogue order (same order everywhere) */
export const OCCASIONS_ORDERED: EventTypeInfo[] = [...EVENT_TYPES.filter((t) => t.popular), ...EVENT_TYPES.filter((t) => !t.popular)];

export const eventTypeInfo = (t: EventType): EventTypeInfo => EVENT_TYPES.find((x) => x.id === t) ?? EVENT_TYPES[EVENT_TYPES.length - 1]!;
export const isCoupleEvent = (t: EventType) => eventTypeInfo(t).couple;

/** "زفاف سارة وأحمد" · "عيد ميلاد جود" */
export function suggestTitle(type: EventType, names: { a: string; b?: string }): string {
  const info = eventTypeInfo(type);
  const who = info.couple && names.b?.trim() ? `${names.a.trim()} و${names.b.trim()}` : names.a.trim();
  return [info.titlePrefix, who].filter(Boolean).join(' ');
}

export type EssentialsErrors = Partial<Record<'a' | 'b' | 'date' | 'time' | 'venue' | 'city' | 'title', string>>;

/** minimum to create an event (spec §8 step 2). Optional details never block creation. */
export function validateEssentials(input: CreateEventInput, today: LocalDate): EssentialsErrors {
  const e: EssentialsErrors = {};
  const couple = isCoupleEvent(input.type);
  if (!input.names.a?.trim()) e.a = couple ? 'اكتب الاسم الأول' : `اكتب ${eventTypeInfo(input.type).nameLabel}`;
  if (couple && !input.names.b?.trim()) e.b = 'اكتب الاسم الثاني';
  if (input.type === 'other' && !input.title?.trim()) e.title = 'اكتب اسم المناسبة';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) e.date = 'اختر التاريخ';
  else if (daysBetween(today, input.date) < 0) e.date = 'التاريخ في الماضي — اختر تاريخًا قادمًا';
  if (!/^\d{2}:\d{2}$/.test(input.time)) e.time = 'اختر الوقت';
  if (!input.venue.name?.trim()) e.venue = 'اكتب اسم المكان';
  if (!input.venue.city?.trim()) e.city = 'اكتب المدينة';
  return e;
}

// ------------------------------------------------------------------ phase
export type EventPhase = 'upcoming' | 'final_week' | 'event_day' | 'completed' | 'archived';

export function eventStart(ev: Pick<EventDetails, 'date' | 'time' | 'timeZone'>): Date {
  return zonedToInstant(ev.date, ev.time, ev.timeZone);
}
export function eventEnd(ev: Pick<EventDetails, 'date' | 'time' | 'timeZone' | 'durationHours'>): Date {
  return new Date(eventStart(ev).getTime() + (ev.durationHours || 5) * 36e5);
}

export function todayFor(ev: Pick<EventDetails, 'timeZone'>, now: Date): LocalDate {
  return localDateOf(now, ev.timeZone);
}

export function eventPhase(ev: Event, now: Date): EventPhase {
  if (ev.archivedAt) return 'archived';
  const today = todayFor(ev, now);
  const d = daysBetween(today, ev.date);
  // the event day runs until the event's end (an event at 21:00 for 5 h ends after midnight)
  if (now.getTime() > eventEnd(ev).getTime() + 3 * 36e5) return 'completed';
  if (d <= 0) return 'event_day';
  if (d <= 7) return 'final_week';
  return 'upcoming';
}

export const PHASE_LABEL: Record<EventPhase, { label: string; tone: Tone }> = {
  upcoming: { label: 'قيد التجهيز', tone: 'info' },
  final_week: { label: 'الأسبوع الأخير', tone: 'warning' },
  event_day: { label: 'يوم المناسبة', tone: 'accent' },
  completed: { label: 'انتهت', tone: 'neutral' },
  archived: { label: 'مؤرشفة', tone: 'neutral' },
};

/** guests see the general names/title; the card needs two names for couple designs */
export function namesLine(ev: Pick<Event, 'type' | 'names'>): string {
  return isCoupleEvent(ev.type) && ev.names.b ? `${ev.names.a} و${ev.names.b}` : ev.names.a;
}
