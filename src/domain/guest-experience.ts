/**
 * Guest experience beyond yes/no (F047–F071): host-defined meal choices counted per person, dietary
 * needs kept apart from meal choices, and an external-link wishlist that never blocks or follows the reply.
 * One source for every total: guests list, table view, food report and export all derive from here.
 */
import type {
  DietaryAnswer, DietaryNeed, GiftItem, GiftKind, GuestExperience, InvitationParty, MealAllocation, MealOption, RSVPResponse, RsvpInput,
} from './types';

export const EMPTY_EXPERIENCE: GuestExperience = {
  revision: 0,
  meals: { enabled: false, required: false, options: [] },
  dietary: { enabled: false },
  gifts: { enabled: false, afterDecline: false, items: [] },
};

export const experienceOf = (ev: { guestExperience?: GuestExperience }): GuestExperience => ev.guestExperience ?? EMPTY_EXPERIENCE;
export const activeMeals = (x: GuestExperience): MealOption[] => x.meals.options.filter((o) => !o.archived);
export const activeGifts = (x: GuestExperience): GiftItem[] => x.gifts.items.filter((g) => !g.archived);
/** the guest is asked something after "attending" only when the host switched it on and it has content */
export const asksMeals = (x: GuestExperience) => x.meals.enabled && activeMeals(x).length > 0;
export const asksAfterAttending = (x: GuestExperience) => asksMeals(x) || x.dietary.enabled;
export const showsWishlist = (x: GuestExperience) => x.gifts.enabled && activeGifts(x).length > 0;
export const showsAfterDecline = (x: GuestExperience) => showsWishlist(x) && x.gifts.afterDecline;

// ------------------------------------------------------------------ dietary vocabulary (simple, not medical)
export const DIETARY: Record<DietaryNeed, { label: string; group: 'allergy' | 'diet' | 'other' }> = {
  nuts: { label: 'مكسرات', group: 'allergy' },
  dairy: { label: 'حليب ومشتقاته', group: 'allergy' },
  gluten: { label: 'قمح / جلوتين', group: 'allergy' },
  eggs: { label: 'بيض', group: 'allergy' },
  seafood: { label: 'مأكولات بحرية', group: 'allergy' },
  halal: { label: 'حلال فقط', group: 'diet' },
  vegetarian: { label: 'نباتي', group: 'diet' },
  vegan: { label: 'نباتي صرف', group: 'diet' },
  other: { label: 'شيء آخر', group: 'other' },
};
export const DIETARY_ORDER = Object.keys(DIETARY) as DietaryNeed[];
export const isAllergy = (n: DietaryNeed) => DIETARY[n].group === 'allergy';
export const hasAllergy = (d?: DietaryAnswer) => !!d?.needs.some(isAllergy);
/** short label for chips and table cards: «حساسية مكسرات · حلال فقط» */
export function dietaryLabel(d: DietaryAnswer): string {
  const allergies = d.needs.filter(isAllergy).map((n) => DIETARY[n].label);
  const rest = d.needs.filter((n) => !isAllergy(n) && n !== 'other').map((n) => DIETARY[n].label);
  const parts = [...(allergies.length ? [`حساسية ${allergies.join('، ')}`] : []), ...rest];
  if (d.needs.includes('other')) parts.push(d.note?.trim() || 'احتياج آخر');
  return parts.join(' · ');
}

export const GIFT_KIND: Record<GiftKind, { label: string; hint: string; link: string }> = {
  gift: { label: 'هدية', hint: 'شيء يتمنونه بعينه', link: 'عرض الهدية' },
  contribution: { label: 'مساهمة', hint: 'مشاركة في هدية أكبر أو نقوط', link: 'المساهمة' },
  flowers: { label: 'ورد', hint: 'باقة تصل في يومهم', link: 'إرسال ورد' },
};

// ------------------------------------------------------------------ links (T39)
/** https only, no credentials, a real host. Anything else (javascript:, data:, http:, relative) is refused. */
export function safeExternalUrl(raw: string | undefined): string | null {
  const s = raw?.trim();
  if (!s) return null;
  let u: URL;
  try { u = new URL(s); } catch { return null; }
  if (u.protocol !== 'https:' || u.username || u.password) return null;
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(u.hostname) && !/^xn--/i.test(u.hostname)) return null;
  return u.href;
}
export const linkHost = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } };

// ------------------------------------------------------------------ policy edits
export type ExperienceDraft = Omit<GuestExperience, 'revision'>;
export type PolicyProblem = { field: string; message: string };

/** validate what the host saved; options/items with answers are archived by the service, never dropped */
export function validatePolicy(d: ExperienceDraft): PolicyProblem | null {
  const meals = d.meals.options.filter((o) => !o.archived);
  if (d.meals.options.some((o) => !o.label.trim())) return { field: 'meals', message: 'اكتب اسمًا لكل خيار طعام أو احذفه.' };
  const seen = new Set<string>();
  for (const o of meals) { const k = o.label.trim().replace(/\s+/g, ' '); if (seen.has(k)) return { field: 'meals', message: `الخيار «${k}» مكرر.` }; seen.add(k); }
  if (meals.length > 6) return { field: 'meals', message: 'يكفي ستة خيارات على الأكثر، ليبقى الاختيار سهلًا.' };
  if (d.meals.enabled && meals.length < 2) return { field: 'meals', message: 'أضف خيارين على الأقل، أو أوقف سؤال الطعام.' };
  for (const g of d.gifts.items.filter((x) => !x.archived)) {
    if (!g.title.trim()) return { field: 'gifts', message: 'اكتب عنوانًا لكل رغبة أو احذفها.' };
    if (g.url?.trim() && !safeExternalUrl(g.url)) return { field: 'gifts', message: `رابط «${g.title.trim()}» غير مقبول. استخدم رابطًا كاملًا يبدأ بـ https://` };
  }
  if (d.gifts.enabled && !d.gifts.items.some((x) => !x.archived)) return { field: 'gifts', message: 'أضف رغبة واحدة على الأقل، أو أوقف قائمة الرغبات.' };
  return null;
}

// ------------------------------------------------------------------ guest answers
export type MealError = 'unknown_option' | 'duplicate' | 'not_whole' | 'sum_mismatch' | 'sum_over';
export const MEAL_ERROR_TEXT: Record<MealError, string> = {
  unknown_option: 'أحد خيارات الطعام لم يعد متاحًا. راجعوا الوجبات.',
  duplicate: 'الخيار نفسه مكرر.',
  not_whole: 'الأعداد يجب أن تكون صحيحة وغير سالبة.',
  sum_mismatch: 'وزّعوا الوجبات على عدد الحضور كاملًا.',
  sum_over: 'عدد الوجبات أكبر من عدد الحضور.',
};
export const mealSum = (m?: MealAllocation[]) => (m ?? []).reduce((s, a) => s + a.count, 0);

/** the invariants in DATA_AND_SERVICES §ثوابت العدد, against the policy the answer must match */
export function validateMeals(x: GuestExperience, count: number, meals: MealAllocation[] | undefined): MealError | null {
  if (!asksMeals(x)) return null;
  const list = meals ?? [];
  const ids = new Set<string>();
  const open = new Set(activeMeals(x).map((o) => o.id));
  for (const a of list) {
    if (!Number.isInteger(a.count) || a.count < 0) return 'not_whole';
    if (ids.has(a.optionId)) return 'duplicate';
    ids.add(a.optionId);
    if (a.count > 0 && !open.has(a.optionId)) return 'unknown_option';
  }
  const sum = mealSum(list);
  if (sum > count) return 'sum_over';
  if (x.meals.required && sum !== count) return 'sum_mismatch';
  return null;
}

export type DietaryError = 'affected_range' | 'other_needs_note' | 'needs_without_answer';
export const DIETARY_ERROR_TEXT: Record<DietaryError, string> = {
  affected_range: 'عدد من تخصهم الحاجة بين واحد وعدد الحضور.',
  other_needs_note: 'اكتبوا الحاجة الأخرى بكلمات قليلة.',
  needs_without_answer: 'اختاروا «لا شيء» أو حددوا الحاجة.',
};
export function validateDietary(count: number, d: DietaryAnswer | undefined): DietaryError | null {
  if (!d) return null;
  if (!d.answered && d.needs.length) return 'needs_without_answer';
  if (d.affectedCount != null && (!Number.isInteger(d.affectedCount) || d.affectedCount < 1 || d.affectedCount > count)) return 'affected_range';
  if (d.needs.includes('other') && !d.note?.trim()) return 'other_needs_note';
  return null;
}

/** what is stored: nothing about food for a decline (invariant 5), zero rows dropped, unknown needs normalised */
export function cleanAnswers(x: GuestExperience, input: RsvpInput): Pick<InvitationParty, 'meals' | 'dietary'> {
  if (!input.attending) return { meals: undefined, dietary: undefined };
  const meals = asksMeals(x) ? (input.meals ?? []).filter((a) => a.count > 0).map((a) => ({ optionId: a.optionId, count: a.count })) : undefined;
  const d = x.dietary.enabled ? input.dietary : undefined;
  const dietary = d ? {
    answered: d.answered,
    needs: DIETARY_ORDER.filter((n) => d.needs.includes(n)),
    affectedCount: d.needs.length ? d.affectedCount : undefined,
    note: d.note?.trim() || undefined,
  } : undefined;
  return { meals: meals && meals.length ? meals : undefined, dietary };
}

export type AnswerCheck = { ok: true } | { ok: false; conflict: boolean; field: 'meals' | 'dietary'; message: string };
/** a reply answered against an older policy is accepted when it still fits; otherwise a conflict to review (T17) */
export function checkAnswers(x: GuestExperience, input: RsvpInput): AnswerCheck {
  if (!input.attending) return { ok: true };
  const stale = input.expectedExperienceRevision != null && input.expectedExperienceRevision !== x.revision;
  const me = validateMeals(x, input.count, input.meals);
  if (me) return { ok: false, conflict: stale, field: 'meals', message: stale ? 'تغيّرت خيارات الطعام أثناء ردكم. حدّثناها لكم — راجعوا الوجبات ثم أرسلوا.' : MEAL_ERROR_TEXT[me] };
  const de = x.dietary.enabled ? validateDietary(input.count, input.dietary) : null;
  if (de) return { ok: false, conflict: false, field: 'dietary', message: DIETARY_ERROR_TEXT[de] };
  return { ok: true };
}

// ------------------------------------------------------------------ reports (one derivation for every screen)
export interface MealRow { id: string; label: string; archived: boolean; people: number }
export interface MealReport {
  rows: MealRow[];
  confirmedPeople: number;
  specified: number;
  /** confirmed people without a meal choice: shown, never assumed (T30) */
  unspecified: number;
  /** parties whose answer no longer fits their count (organizer changed it): excluded from rows until reviewed */
  review: Array<{ partyId: string; name: string }>;
  /** general-link replies waiting for matching: a separate, provisional tally (D10, T34) */
  provisional: { people: number; byOption: Record<string, number>; unspecified: number };
}

const partySize = (p: InvitationParty) => (p.rsvpStatus === 'confirmed' ? p.confirmedPartySize ?? p.maxPartySize : 0);
/** valid = fits the current headcount and names known options (archived ones keep their history) */
export function allocationFits(x: GuestExperience, size: number, meals?: MealAllocation[]): boolean {
  const known = new Set(x.meals.options.map((o) => o.id));
  return mealSum(meals) <= size && (meals ?? []).every((a) => known.has(a.optionId));
}

export function mealReport(x: GuestExperience, parties: readonly InvitationParty[], responses: readonly RSVPResponse[] = []): MealReport {
  const per = new Map<string, number>(x.meals.options.map((o) => [o.id, 0]));
  const r: MealReport = { rows: [], confirmedPeople: 0, specified: 0, unspecified: 0, review: [], provisional: { people: 0, byOption: {}, unspecified: 0 } };
  for (const p of parties) {
    const size = partySize(p);
    if (!size) continue;
    r.confirmedPeople += size;
    if (p.meals?.length && !allocationFits(x, size, p.meals)) { r.review.push({ partyId: p.id, name: p.primaryGuestName }); r.unspecified += size; continue; }
    const s = mealSum(p.meals);
    for (const a of p.meals ?? []) per.set(a.optionId, (per.get(a.optionId) ?? 0) + a.count);
    r.specified += s; r.unspecified += size - s;
  }
  for (const resp of responses) {
    if (resp.partyId || resp.resolution || !resp.attending) continue;
    r.provisional.people += resp.count;
    const s = mealSum(resp.meals);
    for (const a of resp.meals ?? []) r.provisional.byOption[a.optionId] = (r.provisional.byOption[a.optionId] ?? 0) + a.count;
    r.provisional.unspecified += Math.max(0, resp.count - s);
  }
  r.rows = x.meals.options
    .map((o) => ({ id: o.id, label: o.label, archived: !!o.archived, people: per.get(o.id) ?? 0 }))
    .filter((row) => !row.archived || row.people > 0);
  return r;
}

export interface DietaryEntry { partyId: string; name: string; tableId?: string; needs: DietaryNeed[]; affectedCount?: number; note?: string; allergy: boolean }
export interface DietaryReport {
  entries: DietaryEntry[];
  /** answered "nothing to note" vs never answered: two different states (T31) */
  answeredNone: number;
  notAnswered: number;
  byNeed: Array<{ need: DietaryNeed; parties: number; people: number; unknownPeople: number }>;
}
export function dietaryReport(parties: readonly InvitationParty[]): DietaryReport {
  const out: DietaryReport = { entries: [], answeredNone: 0, notAnswered: 0, byNeed: [] };
  const by = new Map<DietaryNeed, { parties: number; people: number; unknownPeople: number }>();
  for (const p of parties) {
    if (p.rsvpStatus !== 'confirmed') continue;
    const d = p.dietary;
    if (!d?.answered) { out.notAnswered++; continue; }
    if (!d.needs.length) { out.answeredNone++; continue; }
    out.entries.push({ partyId: p.id, name: p.primaryGuestName, tableId: p.tableId, needs: d.needs, affectedCount: d.affectedCount, note: d.note, allergy: hasAllergy(d) });
    for (const n of d.needs) {
      const b = by.get(n) ?? { parties: 0, people: 0, unknownPeople: 0 };
      b.parties++;
      if (d.affectedCount != null) b.people += d.affectedCount; else b.unknownPeople++;
      by.set(n, b);
    }
  }
  out.entries.sort((a, b) => Number(b.allergy) - Number(a.allergy) || a.name.localeCompare(b.name, 'ar'));
  out.byNeed = DIETARY_ORDER.filter((n) => by.has(n)).map((need) => ({ need, ...by.get(need)! }));
  return out;
}

/** «٢ لحم · ١ سمك» for a party card; empty when nothing was chosen */
export function mealSummary(x: GuestExperience, meals?: MealAllocation[]): string {
  if (!meals?.length) return '';
  const label = new Map(x.meals.options.map((o) => [o.id, o.label]));
  return meals.filter((a) => a.count > 0).map((a) => `${a.count} ${label.get(a.optionId) ?? 'خيار محذوف'}`).join(' · ');
}

// ------------------------------------------------------------------ export (T36)
/** a cell a spreadsheet will never execute: formulas are neutralised, quotes escaped */
export function csvCell(v: string | number | undefined): string {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
export function foodCsv(x: GuestExperience, parties: readonly InvitationParty[], tableName: (id?: string) => string, stamp: string): string {
  const meals = x.meals.options;
  const head = ['الدعوة', 'الطاولة', 'الحضور', ...meals.map((o) => o.label + (o.archived ? ' (مؤرشف)' : '')), 'بلا اختيار', 'قيود الطعام', 'تخص', 'ملاحظة'];
  const rows = parties.filter((p) => p.rsvpStatus === 'confirmed').map((p) => {
    const size = partySize(p);
    const fits = allocationFits(x, size, p.meals);
    const per = meals.map((o) => (fits ? p.meals?.find((a) => a.optionId === o.id)?.count ?? 0 : ''));
    const d = p.dietary;
    return [p.primaryGuestName, tableName(p.tableId), size, ...per, fits ? size - mealSum(p.meals) : 'يحتاج مراجعة',
      !d?.answered ? 'لم يُجب' : d.needs.length ? d.needs.map((n) => DIETARY[n].label).join('، ') : 'لا شيء',
      d?.affectedCount ?? '', d?.note ?? ''];
  });
  return [[`تقرير الطعام — ${stamp} — إصدار الإعداد ${x.revision}`], head, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
}
