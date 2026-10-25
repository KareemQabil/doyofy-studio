/** Human-readable activity lines (spec §9/§31): "أحمد أكد الحضور — شخصان". */
import type { ActivityKind, EventActivity, Tone } from './types';
import { P, people, plural, pluralOf } from './format';

const s = (v: unknown) => (v == null ? '' : String(v));
const n = (v: unknown) => Number(v) || 0;

export function activityText(a: EventActivity): string {
  const d = a.data;
  switch (a.kind) {
    case 'event_created': return 'تم إنشاء المناسبة';
    case 'event_updated': return `تم تعديل بيانات المناسبة${d.what ? ` (${s(d.what)})` : ''}`;
    case 'invitation_saved': return 'تم حفظ مسودة الدعوة';
    case 'invitation_published': return d.first ? 'تم نشر الدعوة' : 'تم نشر تعديلات الدعوة';
    case 'party_added': return `تمت إضافة ${s(d.name)}`;
    case 'parties_imported': return `تمت إضافة ${pluralOf(n(d.count), P.guest)} من ملف${n(d.skipped) ? ` (تم تخطي ${pluralOf(n(d.skipped), P.row)})` : ''}`;
    case 'party_updated': return `تم تعديل بيانات ${s(d.name)}`;
    case 'party_removed': return `تم حذف ${s(d.name)} من القائمة`;
    case 'invitation_shared': return n(d.count) > 1 ? `تمت مشاركة ${pluralOf(n(d.count), P.invitation)}${d.how === 'simulated' ? ' (محاكاة)' : ''}` : `تمت مشاركة دعوة ${s(d.name)}${d.how === 'manual' ? ' يدويًا' : d.how === 'simulated' ? ' (محاكاة)' : ''}`;
    case 'invitation_opened': return `${s(d.name)} فتح الدعوة`;
    case 'invitation_failed': return n(d.count) > 1 ? `تعذر إرسال ${pluralOf(n(d.count), P.invitation)} (محاكاة)` : `تعذر إرسال دعوة ${s(d.name)} (محاكاة)`;
    case 'reminder_sent': return n(d.count) > 1 ? `تم إرسال تذكير إلى ${pluralOf(n(d.count), P.invitation)} (محاكاة)` : `تم إرسال تذكير إلى ${s(d.name)} (محاكاة)`;
    case 'rsvp_confirmed': return `${s(d.name)} أكد الحضور — ${people(n(d.count))}`;
    case 'rsvp_declined': return `${s(d.name)} اعتذر عن الحضور`;
    case 'rsvp_edited': return d.attending ? `${s(d.name)} عدّل رده — ${people(n(d.count))}` : `${s(d.name)} عدّل رده إلى الاعتذار`;
    case 'rsvp_unmatched': return `رد من الرابط العام باسم «${s(d.name)}» يحتاج مطابقة`;
    case 'rsvp_matched': return `تمت مطابقة رد «${s(d.name)}»`;
    case 'table_created': return `تمت إضافة ${s(d.name)} (${plural(n(d.capacity), P.seat)})`;
    case 'party_seated': return `تم توزيع ${s(d.name)} على ${s(d.table)}`;
    case 'party_moved': return `تم نقل ${s(d.name)} إلى ${s(d.table)}`;
    case 'party_unseated': return `تمت إزالة ${s(d.name)} من ${s(d.table)}`;
    case 'checked_in': return `${s(d.name)} وصل — ${people(n(d.count))}`;
    case 'checked_in_partial': return `${s(d.name)}: وصل ${n(d.total)} من ${n(d.expected)}`;
    case 'check_in_exception': return `دخول باستثناء: ${s(d.name)} — ${s(d.reason)}`;
    case 'check_in_undone': return `تم التراجع عن تسجيل دخول ${s(d.name)}`;
    case 'event_archived': return 'تمت أرشفة المناسبة';
  }
}

export function activityTone(kind: ActivityKind): Tone {
  if (kind === 'rsvp_confirmed' || kind === 'checked_in' || kind === 'invitation_published') return 'success';
  if (kind === 'invitation_failed' || kind === 'check_in_exception' || kind === 'rsvp_unmatched') return 'warning';
  if (kind === 'rsvp_declined' || kind === 'party_removed') return 'neutral';
  if (kind === 'invitation_opened' || kind === 'checked_in_partial') return 'info';
  return 'neutral';
}
