/**
 * Realistic seed data (spec §22). Dates are relative to "now" so the prototype always tells the
 * same story whenever it is opened:
 *   1. زفاف نورة وفيصل — active wedding, 40 invitation parties, in 9 days (or today in the event-day scenario)
 *   2. خطوبة ريم وخالد — draft event, nothing prepared yet
 *   3. عقد قران هند ومازن — completed 20 days ago, full attendance data
 */
import type { CheckInRecord, DietaryAnswer, Event, EventActivity, GuestExperience, InvitationDesign, InvitationParty, MealAllocation, RSVPResponse, Table } from '../../domain/types';
import { addDays, localDateOf, zonedToInstant } from '../../domain/format';
import { makeId, seededRng, type Rng } from '../../domain/ids';
import { defaultDesign } from '../../domain/invitation';
import { statusAfter } from '../../domain/checkin';
import type { DbShape, ScenarioId } from './store';

type Spec = {
  name: string; phone?: string; max: number; side: string;
  rsvp?: 'c' | 'd'; count?: number; delivery?: 'none' | 'shared' | 'opened' | 'failed' | 'manual';
  table?: number; companions?: string[]; notes?: string; guestNote?: string;
  arrived?: number; // event-day scenario
};

// 40 parties. Phones are fictional (+9665… pattern). Two parties deliberately share a number,
// three have none, one confirmed more than its allowance (the organizer lowered it later).
const WEDDING: Spec[] = [
  { name: 'عائلة العتيبي — أبو سعد', phone: '+966551203410', max: 5, side: 'أهل العريس', rsvp: 'c', count: 5, delivery: 'opened', table: 1, arrived: 5 },
  { name: 'عائلة الحربي — أبو تركي', phone: '+966551234567', max: 4, side: 'أهل العريس', rsvp: 'c', count: 4, delivery: 'opened', table: 1, arrived: 2 },
  { name: 'أحمد الشهري', phone: '+966503318842', max: 2, side: 'أصدقاء العريس', rsvp: 'c', count: 2, delivery: 'opened', table: 3, arrived: 2 },
  { name: 'منى القحطاني', phone: '+966547720913', max: 2, side: 'أهل العروس', rsvp: 'c', count: 2, delivery: 'opened', table: 5, arrived: 1 },
  { name: 'عائلة الدوسري', phone: '+966562219034', max: 4, side: 'أهل العروس', rsvp: 'c', count: 3, delivery: 'opened', table: 2, companions: ['أم ناصر', 'ناصر', 'لولوة'] },
  { name: 'سارة المالكي', phone: '+966558830211', max: 2, side: 'زميلات العروس', rsvp: 'c', count: 1, delivery: 'opened', table: 6, arrived: 1 },
  { name: 'عبدالله الغامدي', phone: '+966534401276', max: 2, side: 'أصدقاء العريس', rsvp: 'c', count: 2, delivery: 'opened', table: 3 },
  { name: 'عائلة الزهراني', phone: '+966569910425', max: 5, side: 'أهل العروس', rsvp: 'c', count: 5, delivery: 'opened', table: 2, arrived: 5 },
  { name: 'نوال السبيعي', phone: '+966541187320', max: 1, side: 'زميلات العروس', rsvp: 'c', count: 1, delivery: 'opened', table: 6 },
  { name: 'محمد العنزي', phone: '+966507712093', max: 2, side: 'أصدقاء العريس', rsvp: 'c', count: 2, delivery: 'opened', table: 4, arrived: 2 },
  { name: 'عائلة الشمري', phone: '+966553390127', max: 4, side: 'أهل العريس', rsvp: 'c', count: 4, delivery: 'opened', table: 1 },
  { name: 'هند السالم', phone: '+966566102948', max: 2, side: 'أهل العروس', rsvp: 'c', count: 2, delivery: 'opened', table: 5 },
  { name: 'عمة نورة — أم خالد', phone: '+966566102948', max: 3, side: 'أهل العروس', rsvp: 'c', count: 3, delivery: 'opened', table: 5, notes: 'نفس رقم هند؟ تأكد' },
  { name: 'فيصل المطيري', phone: '+966532219904', max: 2, side: 'أصدقاء العريس', rsvp: 'c', count: 2, delivery: 'opened', table: 4 },
  { name: 'عائلة البقمي', phone: '+966559081123', max: 4, side: 'أهل العروس', rsvp: 'c', count: 5, delivery: 'opened', table: 7, notes: 'خفّضنا العدد المسموح إلى 4' },
  { name: 'ريم الجهني', phone: '+966548832270', max: 2, side: 'زميلات العروس', rsvp: 'c', count: 2, delivery: 'opened', table: 6 },
  { name: 'تركي الرشيد', phone: '+966503321187', max: 2, side: 'أصدقاء العريس', rsvp: 'c', count: 2, delivery: 'opened', table: 4 },
  { name: 'عائلة الفيفي', phone: '+966571120934', max: 5, side: 'أهل العريس', rsvp: 'c', count: 4, delivery: 'opened' },
  { name: 'لمى الحارثي', phone: '+966558823390', max: 2, side: 'زميلات العروس', rsvp: 'c', count: 2, delivery: 'opened' },
  { name: 'خالد السديري', phone: '+966560092311', max: 3, side: 'أصدقاء العريس', rsvp: 'c', count: 3, delivery: 'opened', guestNote: 'سنصل بعد الزفة بقليل' },
  { name: 'أم عبدالعزيز الشهراني', max: 3, side: 'أهل العريس', rsvp: 'c', count: 2, delivery: 'manual', notes: 'تم التواصل بالهاتف' },
  { name: 'بدر الحمدان', phone: '+966534487712', max: 2, side: 'أصدقاء العريس', rsvp: 'c', count: 2, delivery: 'opened', table: 8 },
  { name: 'وليد القرني', phone: '+966551177302', max: 2, side: 'أصدقاء العريس', rsvp: 'd', delivery: 'opened', table: 8, guestNote: 'معتذر لظرف سفر — ألف مبروك' },
  { name: 'غادة العمري', phone: '+966547709931', max: 2, side: 'زميلات العروس', rsvp: 'd', delivery: 'opened' },
  { name: 'عائلة الخثعمي', phone: '+966569920114', max: 4, side: 'أهل العروس', rsvp: 'd', delivery: 'opened', guestNote: 'نعتذر، وندعو لكم بالتوفيق' },
  { name: 'سلطان الدوسري', phone: '+966505532219', max: 1, side: 'أصدقاء العريس', rsvp: 'd', delivery: 'opened' },
  { name: 'أريج الشهري', phone: '+966556610298', max: 2, side: 'زميلات العروس', rsvp: 'd', delivery: 'opened' },
  { name: 'ماجد الحربي', phone: '+966538841175', max: 2, side: 'أصدقاء العريس', rsvp: 'd', delivery: 'opened' },
  { name: 'عائلة المحمد', phone: '+966551902283', max: 4, side: 'أهل العروس', delivery: 'opened' },
  { name: 'جواهر العتيبي', phone: '+966549920017', max: 2, side: 'زميلات العروس', delivery: 'opened' },
  { name: 'نايف الرويلي', phone: '+966504418823', max: 2, side: 'أصدقاء العريس', delivery: 'opened' },
  { name: 'عائلة القحطاني — أبو فهد', phone: '+966567700412', max: 5, side: 'أهل العريس', delivery: 'opened' },
  { name: 'شهد الزهراني', phone: '+966558849021', max: 1, side: 'زميلات العروس', delivery: 'opened' },
  { name: 'سعد المطيري', phone: '+966531109837', max: 2, side: 'أصدقاء العريس', delivery: 'shared' },
  { name: 'عائلة العسيري', phone: '+966565580931', max: 4, side: 'أهل العروس', delivery: 'shared' },
  { name: 'دانة الشمري', phone: '+966542217709', max: 2, side: 'زميلات العروس', delivery: 'shared' },
  { name: 'عبدالرحمن البلوي', phone: '+966550031184', max: 2, side: 'أصدقاء العريس', delivery: 'shared' },
  { name: 'عائلة الغامدي — أبو ريان', phone: '+9665512', max: 4, side: 'أهل العريس', delivery: 'failed', notes: 'الرقم ناقص' },
  { name: 'أم نورة — خالة العروس', max: 3, side: 'أهل العروس', delivery: 'none' },
  { name: 'يوسف الشهري', max: 2, side: 'أصدقاء العريس', delivery: 'none' },
];

// the wedding hosts switched on a simple menu, dietary needs and a wishlist (F050–F052, F061).
// Links point at example.com on purpose: the prototype never pretends to be a real shop or wallet.
const WEDDING_EXPERIENCE: GuestExperience = {
  revision: 1,
  meals: { enabled: true, required: false, options: [
    { id: 'meal_meat', label: 'كبسة لحم' }, { id: 'meal_chicken', label: 'دجاج مشوي' },
    { id: 'meal_fish', label: 'سمك هامور' }, { id: 'meal_veg', label: 'طبق نباتي' },
  ] },
  dietary: { enabled: true },
  gifts: { enabled: true, afterDecline: true, intro: 'حضوركم أجمل هدية. ولمن أحب أن يشاركنا فرحتنا من قريب أو بعيد:', items: [
    { id: 'gift_watch', kind: 'contribution', title: 'ساعة لفيصل', note: 'اخترناها معًا — المشاركة بأي مبلغ تُسعدنا', url: 'https://example.com/wishlist/watch', linkLabel: 'المساهمة في الساعة' },
    { id: 'gift_flowers', kind: 'flowers', title: 'باقة ورد لنورة', note: 'تصل إلى القاعة يوم الزفاف', url: 'https://example.com/flowers/noura' },
    { id: 'gift_coffee', kind: 'gift', title: 'ركن القهوة لبيتنا الجديد', note: 'آلة قهوة وفناجين', url: 'https://example.com/wishlist/coffee-corner' },
  ] },
};
/** meals by WEDDING index: [meat, chicken, fish, veg]; parties not listed have not chosen (shown as «بلا اختيار») */
const WEDDING_MEALS: Record<number, [number, number, number, number]> = {
  0: [3, 1, 1, 0], 1: [2, 2, 0, 0], 2: [1, 0, 1, 0], 3: [0, 1, 0, 1], 4: [1, 1, 1, 0], 5: [0, 0, 0, 1],
  6: [2, 0, 0, 0], 7: [2, 2, 1, 0], 9: [1, 1, 0, 0], 10: [2, 0, 2, 0], 11: [0, 2, 0, 0], 13: [1, 0, 1, 0], 16: [2, 0, 0, 0],
};
const WEDDING_DIETARY: Record<number, DietaryAnswer> = {
  0: { answered: true, needs: [] }, 1: { answered: true, needs: [] }, 2: { answered: true, needs: [] },
  3: { answered: true, needs: ['nuts'], affectedCount: 1, note: 'حساسية شديدة من الفول السوداني' },
  4: { answered: true, needs: ['dairy'], affectedCount: 1, note: 'لولوة — حساسية حليب' },
  5: { answered: true, needs: ['vegetarian'], affectedCount: 1 },
  7: { answered: true, needs: ['gluten'] },
  9: { answered: true, needs: [] }, 10: { answered: true, needs: ['seafood'], affectedCount: 1 }, 13: { answered: true, needs: [] },
};
const allocation = (m: [number, number, number, number]): MealAllocation[] =>
  (['meal_meat', 'meal_chicken', 'meal_fish', 'meal_veg'] as const).map((optionId, i) => ({ optionId, count: m[i]! })).filter((a) => a.count > 0);

const COMPLETED: Array<[string, number, 'c' | 'd', number, number]> = [
  // name, max, rsvp, count, arrived
  ['عائلة باوزير', 5, 'c', 5, 5], ['عائلة الجفري', 4, 'c', 4, 4], ['سالم بن لادن', 2, 'c', 2, 2], ['عائلة باعشن', 5, 'c', 4, 4],
  ['عبير القرشي', 2, 'c', 2, 1], ['عائلة الصبان', 4, 'c', 4, 4], ['حسن المغربي', 2, 'c', 2, 2], ['أمل الحازمي', 1, 'c', 1, 1],
  ['عائلة نصيف', 5, 'c', 5, 3], ['طارق الأنصاري', 2, 'c', 2, 2], ['رنا الشريف', 2, 'c', 2, 0], ['عائلة السقاف', 4, 'c', 3, 3],
  ['ياسر العمودي', 2, 'c', 2, 2], ['عائلة كعكي', 4, 'c', 4, 4], ['مها الزهراني', 2, 'c', 1, 1], ['عائلة الحربي', 5, 'c', 5, 5],
  ['فهد اللحياني', 2, 'd', 0, 0], ['منيرة المالكي', 2, 'd', 0, 0], ['عائلة الغامدي', 4, 'c', 4, 4], ['سعود الثبيتي', 2, 'c', 2, 2],
  ['نجلاء الشنقيطي', 2, 'c', 2, 2], ['عائلة بخاري', 4, 'd', 0, 0], ['ماجد الجدعاني', 2, 'c', 2, 2], ['هيفاء العطاس', 1, 'c', 1, 1],
];

function at(base: Date, minutesAgo: number) { return new Date(base.getTime() - minutesAgo * 60000).toISOString(); }

export function buildSeed(now: Date, scenario: ScenarioId): DbShape {
  const rng: Rng = seededRng(20261004);
  const tz = 'Asia/Riyadh';
  const today = localDateOf(now, tz);
  const iso = now.toISOString();
  const events: Event[] = [];
  const designs: InvitationDesign[] = [];
  const parties: InvitationParty[] = [];
  const responses: RSVPResponse[] = [];
  const tables: Table[] = [];
  const checkIns: CheckInRecord[] = [];
  const activity: EventActivity[] = [];
  const act = (eventId: string, kind: EventActivity['kind'], minutesAgo: number, data: EventActivity['data'] = {}, actor: EventActivity['actor'] = 'organizer', partyId?: string) =>
    activity.push({ id: makeId('act', rng), eventId, kind, at: at(now, minutesAgo), actor, partyId, data });
  const codes = new Set<string>();
  const code = () => { let c = ''; do { c = Array.from({ length: 5 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(rng() * 31)]).join(''); } while (codes.has(c)); codes.add(c); return c; };

  // ------------------------------------------------------------ 1. active wedding
  const weddingDate = scenario === 'event_day' ? today : addDays(today, 9);
  const e1: Event = {
    id: 'evt_wedding', ownerId: 'usr_owner', type: 'wedding', title: 'زفاف نورة وفيصل',
    names: { a: 'نورة', b: 'فيصل', aEn: 'Noura', bEn: 'Faisal' },
    date: weddingDate, time: '21:00', timeZone: tz, durationHours: 5,
    venue: { name: 'قاعة ليالي الياسمين', city: 'الرياض', nameEn: 'Layali Al Yasmin Hall', cityEn: 'Riyadh', mapUrl: 'https://maps.google.com/?q=Riyadh+wedding+hall' },
    slug: 'noura-faisal',
    settings: { defaultPartySize: 2, revealTableToGuests: true, allowGeneralLink: true },
    checkInPreparedAt: scenario === 'event_day' ? at(now, 60 * 20) : undefined,
    guestExperience: structuredClone(WEDDING_EXPERIENCE),
    createdAt: at(now, 60 * 24 * 41), updatedAt: at(now, 60 * 24 * 3),
  };
  events.push(e1);
  const d1 = defaultDesign(e1);
  d1.program = [{ time: '21:00', ar: 'استقبال الضيوف', en: 'Welcome of guests' }, { time: '22:00', ar: 'الزفّة', en: 'The Zaffa' }, { time: '23:00', ar: 'العشاء', en: 'Dinner' }, { time: '00:30', ar: 'قطع الكيك', en: 'Cake' }];
  designs.push({ id: 'dsg_wedding', eventId: e1.id, draft: d1, draftSavedAt: at(now, 60 * 24 * 30), published: structuredClone(d1), publishedAt: at(now, 60 * 24 * 30) });

  const tableCaps = [12, 10, 10, 10, 10, 10, 10, 10];
  tableCaps.forEach((cap, i) => tables.push({ id: `tbl_w${i + 1}`, eventId: e1.id, name: i === 0 ? 'طاولة 1 — كبار العائلة' : `طاولة ${i + 1}`, capacity: cap, order: i + 1 }));

  act(e1.id, 'event_created', 60 * 24 * 41);
  act(e1.id, 'invitation_published', 60 * 24 * 30, { first: true });
  act(e1.id, 'parties_imported', 60 * 24 * 29, { count: 38, skipped: 2 });
  act(e1.id, 'invitation_shared', 60 * 24 * 28, { count: 35, how: 'simulated' });
  act(e1.id, 'table_created', 60 * 24 * 6, { name: '8 طاولات', capacity: 82 });

  WEDDING.forEach((s, i) => {
    const id = `pty_w${String(i + 1).padStart(2, '0')}`;
    const created = at(now, 60 * 24 * 29 - i);
    const respondedMin = 60 * 24 * (20 - (i % 18)) - i * 7;
    const opened = s.delivery === 'opened';
    const p: InvitationParty = {
      id, eventId: e1.id, code: code(), primaryGuestName: s.name, phone: s.phone && /^\+9665\d{8}$/.test(s.phone) ? s.phone : undefined,
      maxPartySize: s.max, companionNames: s.companions, notes: s.notes, side: s.side,
      delivery: s.delivery === 'none' ? { status: 'not_shared' }
        : s.delivery === 'failed' ? { status: 'failed', source: 'simulated', at: at(now, 60 * 24 * 28), failureReason: 'invalid_phone' }
        : s.delivery === 'manual' ? { status: 'shared', source: 'manual', at: at(now, 60 * 24 * 27) }
        : s.delivery === 'shared' ? { status: 'shared', source: 'simulated', at: at(now, 60 * 24 * 28) }
        : { status: 'opened', source: 'platform', at: at(now, 60 * 24 * 28), openedAt: at(now, respondedMin + 30) },
      rsvpStatus: s.rsvp === 'c' ? 'confirmed' : s.rsvp === 'd' ? 'declined' : 'pending',
      confirmedPartySize: s.rsvp === 'c' ? s.count : s.rsvp === 'd' ? 0 : undefined,
      respondedAt: s.rsvp ? at(now, respondedMin) : undefined,
      guestNote: s.guestNote,
      tableId: s.table ? `tbl_w${s.table}` : undefined,
      checkInStatus: 'not_arrived', checkedInCount: 0, source: 'seed', createdAt: created, updatedAt: created,
    };
    if (s.phone && !p.phone) p.notes = s.notes; // failed number kept out of the phone field
    if (s.rsvp === 'c' && WEDDING_MEALS[i]) p.meals = allocation(WEDDING_MEALS[i]!);
    if (s.rsvp === 'c' && WEDDING_DIETARY[i]) p.dietary = structuredClone(WEDDING_DIETARY[i]);
    if (p.meals || p.dietary) p.experienceRevision = 1;
    parties.push(p);
    if (s.rsvp) {
      responses.push({ id: `rsp_w${i + 1}`, eventId: e1.id, partyId: id, name: s.name, attending: s.rsvp === 'c', count: s.rsvp === 'c' ? s.count ?? 1 : 0, note: s.guestNote, meals: p.meals, dietary: p.dietary, experienceRevision: p.experienceRevision, channel: s.delivery === 'manual' ? 'organizer' : 'guest_link', at: p.respondedAt! });
      if (opened) act(e1.id, 'invitation_opened', respondedMin + 30, { name: s.name }, 'guest', id);
      act(e1.id, s.rsvp === 'c' ? 'rsvp_confirmed' : 'rsvp_declined', respondedMin, { name: s.name, count: s.count ?? 0 }, s.delivery === 'manual' ? 'organizer' : 'guest', id);
    } else if (opened) act(e1.id, 'invitation_opened', 60 * 24 * (3 + (i % 5)), { name: s.name }, 'guest', id);
    if (s.table) act(e1.id, 'party_seated', 60 * 24 * 5 - i, { name: s.name, table: tables[s.table - 1]!.name }, 'organizer', id);
  });
  // recent, human activity on top of the timeline
  act(e1.id, 'rsvp_confirmed', 42, { name: 'أحمد الشهري', count: 2 }, 'guest', 'pty_w03');
  act(e1.id, 'party_moved', 95, { name: 'منى القحطاني', table: 'طاولة 5' }, 'organizer', 'pty_w04');
  act(e1.id, 'reminder_sent', 60 * 20, { count: 9 });
  // two replies through the general link that need matching
  responses.push({ id: 'rsp_g1', eventId: e1.id, name: 'ياسر الدوسري', attending: true, count: 2, meals: [{ optionId: 'meal_meat', count: 1 }, { optionId: 'meal_fish', count: 1 }], dietary: { answered: true, needs: [] }, experienceRevision: 1, channel: 'general_link', at: at(now, 60 * 5) });
  responses.push({ id: 'rsp_g2', eventId: e1.id, name: 'أم سلمان العتيبي', attending: true, count: 3, note: 'وصلتني الدعوة من أم سعد', channel: 'general_link', at: at(now, 60 * 26) });
  act(e1.id, 'rsvp_unmatched', 60 * 5, { name: 'ياسر الدوسري' }, 'guest');
  act(e1.id, 'rsvp_unmatched', 60 * 26, { name: 'أم سلمان العتيبي' }, 'guest');

  if (scenario === 'event_day') {
    const doorsOpen = zonedToInstant(weddingDate, '21:00', tz);
    WEDDING.forEach((s, i) => {
      if (!s.arrived) return;
      const p = parties.find((x) => x.id === `pty_w${String(i + 1).padStart(2, '0')}`)!;
      const when = new Date(Math.min(now.getTime() - (40 - i) * 60000, doorsOpen.getTime() + i * 5 * 60000)).toISOString();
      checkIns.push({ id: `chk_w${i + 1}`, eventId: e1.id, partyId: p.id, count: s.arrived, method: i % 3 ? 'qr' : 'search', at: when, by: 'الاستقبال — بوابة 1', exceptions: p.tableId ? [] : ['no_table'] });
      p.checkedInCount = s.arrived;
      p.checkInStatus = statusAfter(p, s.arrived);
      activity.push({ id: makeId('act', rng), eventId: e1.id, kind: p.checkInStatus === 'partial' ? 'checked_in_partial' : 'checked_in', at: when, actor: 'gate', partyId: p.id, data: { name: p.primaryGuestName, count: s.arrived, total: s.arrived, expected: p.confirmedPartySize ?? p.maxPartySize } });
    });
    // an exception the organizer should review: a declined guest arrived and was let in by staff
    const w = parties.find((x) => x.id === 'pty_w24')!;
    const when = at(now, 12);
    checkIns.push({ id: 'chk_wx', eventId: e1.id, partyId: w.id, count: 1, method: 'search', at: when, by: 'الاستقبال — بوابة 1', exceptions: ['declined_arrived'], staffNote: 'قالت إن ظروفها تغيرت — سمحنا بالدخول' });
    w.checkedInCount = 1; w.checkInStatus = 'partial';
    activity.push({ id: makeId('act', rng), eventId: e1.id, kind: 'check_in_exception', at: when, actor: 'gate', partyId: w.id, data: { name: w.primaryGuestName, reason: 'هذا الضيف اعتذر عن الحضور' } });
  }

  // ------------------------------------------------------------ 2. draft engagement
  const e2: Event = {
    id: 'evt_engagement', ownerId: 'usr_owner', type: 'engagement', title: 'خطوبة ريم وخالد',
    names: { a: 'ريم', b: 'خالد', aEn: 'Reem', bEn: 'Khaled' },
    date: addDays(today, 74), time: '20:00', timeZone: tz, durationHours: 4,
    venue: { name: 'استراحة الندى', city: 'الخبر', cityEn: 'Khobar' },
    slug: 'reem-khaled', settings: { defaultPartySize: 2, revealTableToGuests: false, allowGeneralLink: false },
    createdAt: at(now, 60 * 24 * 2), updatedAt: at(now, 60 * 24 * 2),
  };
  events.push(e2);
  act(e2.id, 'event_created', 60 * 24 * 2);

  // ------------------------------------------------------------ 3. completed katb kitab
  const e3Date = addDays(today, -20);
  const e3: Event = {
    id: 'evt_katb', ownerId: 'usr_owner', type: 'katb_kitab', title: 'عقد قران هند ومازن',
    names: { a: 'هند', b: 'مازن', aEn: 'Hind', bEn: 'Mazen' },
    date: e3Date, time: '19:30', timeZone: tz, durationHours: 4,
    venue: { name: 'دار الضيافة', city: 'جدة', nameEn: 'Dar Al Diyafa', cityEn: 'Jeddah', mapUrl: 'https://maps.google.com/?q=Jeddah' },
    slug: 'hind-mazen', settings: { defaultPartySize: 2, revealTableToGuests: true, allowGeneralLink: false },
    checkInPreparedAt: at(now, 60 * 24 * 21), createdAt: at(now, 60 * 24 * 70), updatedAt: at(now, 60 * 24 * 19),
  };
  events.push(e3);
  const d3 = { ...defaultDesign(e3), cardId: 'emerald', sceneId: 'palace', experience: { dimension: '2d' as const, motion: 'animated' as const } };
  designs.push({ id: 'dsg_katb', eventId: e3.id, draft: d3, draftSavedAt: at(now, 60 * 24 * 60), published: structuredClone(d3), publishedAt: at(now, 60 * 24 * 60) });
  [10, 10, 10, 12].forEach((cap, i) => tables.push({ id: `tbl_k${i + 1}`, eventId: e3.id, name: `طاولة ${i + 1}`, capacity: cap, order: i + 1 }));
  const start3 = zonedToInstant(e3Date, '19:30', tz);
  let seatIdx = 0;
  COMPLETED.forEach(([name, max, r, count, arrived], i) => {
    const id = `pty_k${String(i + 1).padStart(2, '0')}`;
    const t = new Date(start3.getTime() - 86400000 * (30 - (i % 20))).toISOString();
    const p: InvitationParty = {
      id, eventId: e3.id, code: code(), primaryGuestName: name, phone: `+96655${String(4100000 + i * 7919).padStart(7, '0')}`, maxPartySize: max,
      delivery: { status: 'opened', source: 'platform', at: t, openedAt: t }, rsvpStatus: r === 'c' ? 'confirmed' : 'declined', confirmedPartySize: count, respondedAt: t,
      tableId: r === 'c' ? `tbl_k${(seatIdx++ % 4) + 1}` : undefined, checkInStatus: 'not_arrived', checkedInCount: 0, source: 'seed', createdAt: t, updatedAt: t,
    };
    if (arrived) {
      p.checkedInCount = arrived; p.checkInStatus = statusAfter(p, arrived);
      checkIns.push({ id: `chk_k${i + 1}`, eventId: e3.id, partyId: id, count: arrived, method: 'qr', at: new Date(start3.getTime() + i * 4 * 60000).toISOString(), by: 'الاستقبال', exceptions: [] });
    }
    parties.push(p);
    responses.push({ id: `rsp_k${i + 1}`, eventId: e3.id, partyId: id, name, attending: r === 'c', count, channel: 'guest_link', at: t });
  });
  activity.push({ id: makeId('act', rng), eventId: e3.id, kind: 'event_created', at: e3.createdAt, actor: 'organizer', data: {} });
  activity.push({ id: makeId('act', rng), eventId: e3.id, kind: 'checked_in', at: new Date(start3.getTime() + 95 * 60000).toISOString(), actor: 'gate', data: { name: 'آخر الضيوف', count: 2 } });

  return { version: 1, scenario, seededAt: iso, events, designs, parties, responses, tables, checkIns, activity };
}
