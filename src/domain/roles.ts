import type { EventActivity, Role } from './types';
import { copyFor, type Dialect } from './copy';

/**
 * Who may do what (owner decision, FINAL_POLISH_PLAN «الأدوار»):
 *   صاحب المناسبة (organizer)  everything.
 *   المنسق (coordinator)        add, edit, share/send, remind, seat (auto-seating and table order too), check-in —
 *                               never delete guests, transfer them between events, export files, pay/upgrade,
 *                               or create or archive events.
 *   مزود الضيافة (caterer)      the food report, the menu settings and a read-only view of guests and tables.
 * The UI hides or explains what a role cannot do; the mock services refuse it too (services/mock/repositories.ts).
 * A production API must enforce the same table.
 */
export type Permission =
  | 'guests.add' | 'guests.edit' | 'guests.share' | 'guests.remind'
  | 'guests.delete' | 'guests.transfer' | 'guests.export'
  | 'seating' | 'checkin' | 'food'
  | 'billing' | 'event.create' | 'event.archive';

/** the actions the owner keeps for themselves */
const OWNER_ONLY: ReadonlySet<Permission> = new Set(['guests.delete', 'guests.transfer', 'guests.export', 'billing', 'event.create', 'event.archive']);

export function can(role: Role, action: Permission): boolean {
  if (action === 'food') return role === 'caterer';
  if (role === 'organizer') return true;
  if (role === 'coordinator') return !OWNER_ONLY.has(action);
  return false; // caterer: food only
}

/** short reason shown next to a visible but unavailable action — the modern wording; screens use t('ownerOnlyNote') in the voice */
export const OWNER_ONLY_NOTE = 'متاح لصاحب المناسبة';

/** the service-side refusal, one sentence per blocked action */
export const FORBIDDEN_TEXT: Record<Permission, string> = {
  'guests.add': 'إضافة الضيوف متاحة لفريق التنظيم.',
  'guests.edit': 'تعديل الضيوف متاح لفريق التنظيم.',
  'guests.share': 'مشاركة الدعوات متاحة لفريق التنظيم.',
  'guests.remind': 'التذكير متاح لفريق التنظيم.',
  'guests.delete': 'حذف الضيوف متاح لصاحب المناسبة فقط.',
  'guests.transfer': 'نقل الضيوف بين المناسبات متاح لصاحب المناسبة فقط.',
  'guests.export': 'تصدير الملفات متاح لصاحب المناسبة فقط.',
  seating: 'التوزيع على الطاولات متاح لفريق التنظيم.',
  checkin: 'تسجيل الوصول متاح لفريق التنظيم والاستقبال.',
  food: 'تقارير الطعام متاحة لمزود الضيافة.',
  billing: 'الدفع وترقية الباقة متاحان لصاحب المناسبة فقط.',
  'event.create': 'إنشاء مناسبة جديدة متاح لصاحب المناسبة فقط.',
  'event.archive': 'أرشفة المناسبة متاحة لصاحب المناسبة فقط.',
};

export const canViewFood = (role: Role): boolean => can(role, 'food');
export const canManageGuests = (role: Role): boolean => can(role, 'guests.edit');

/** the activity-log actor for something the signed-in staff member did */
export const actorFor = (role: Role): EventActivity['actor'] => role;

/** who did it, when it was not the owner: «المنسق» / «فريق الضيافة» (activity feed) */
export function actorLabel(actor: EventActivity['actor'], dialect: Dialect = 'ar'): string | null {
  const c = copyFor(dialect);
  return actor === 'coordinator' ? c.acByCoordinator : actor === 'caterer' ? c.acByCaterer : null;
}
