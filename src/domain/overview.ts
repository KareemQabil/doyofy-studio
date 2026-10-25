/**
 * Event Overview logic (spec §8–9): setup checklist, the ONE next action for the current stage,
 * and "needs attention" items. Everything is derived from current data — nothing stored.
 */
import type { CheckInRecord, Event, InvitationParty, PublishState, RSVPResponse, Table, Tone } from './types';
import { countParties, type PartyCounts } from './parties';
import { eventPhase, type EventPhase } from './event';
import { seatingWarnings } from './seating';
import { P, plural, pluralOf } from './format';

/** where a checklist item / attention item / CTA leads (resolved to a URL by the app layer) */
export type Target =
  | { to: 'settings'; focus?: 'map' }
  | { to: 'invitation' }
  | { to: 'design' }
  | { to: 'guests'; filter?: string }
  | { to: 'import' }
  | { to: 'rsvp'; tab?: string }
  | { to: 'seating' }
  | { to: 'checkin' }
  | { to: 'gate' }
  | { to: 'summary' };

export interface OverviewInput {
  event: Event;
  publish: PublishState;
  parties: readonly InvitationParty[];
  tables: readonly Table[];
  responses: readonly RSVPResponse[];
  checkIns: readonly CheckInRecord[];
  now: Date;
}

export interface ChecklistItem { id: string; label: string; detail: string; done: boolean; optional?: boolean; progress?: [number, number]; target: Target }

export function checklist(i: OverviewInput, c: PartyCounts = countParties(i.parties)): ChecklistItem[] {
  const shared = c.parties - c.notShared - c.failed;
  const replied = c.parties - c.pendingParties;
  const seated = c.confirmedParties - c.unassignedConfirmed;
  return [
    { id: 'details', optional: true, label: 'أضف رابط الخريطة', detail: i.event.venue.mapUrl ? 'الموقع على الخريطة مضاف' : 'أضف رابط موقع القاعة ليصل الضيوف بسهولة', done: !!i.event.venue.mapUrl, target: { to: 'settings', focus: 'map' } },
    { id: 'invitation', label: 'جهز الدعوة', detail: i.publish === 'published' || i.publish === 'changed' ? 'الدعوة منشورة' : i.publish === 'draft' ? 'المسودة محفوظة — انشرها عندما تكون جاهزة' : 'قالب مناسب جاهز بالأسماء — راجعه وانشره', done: i.publish === 'published' || i.publish === 'changed', target: { to: 'invitation' } },
    { id: 'guests', label: 'أضف الضيوف', detail: c.parties ? `${plural(c.parties, P.invitation)} · حتى ${pluralOf(c.maxSeats, P.person)}` : 'أضف ضيفًا أو استورد قائمة من ملف', done: c.parties > 0, target: { to: 'guests' } },
    { id: 'share', label: 'شارك الدعوات', detail: c.parties ? `تمت مشاركة ${shared} من ${c.parties}` : 'بعد إضافة الضيوف', done: c.parties > 0 && shared === c.parties, progress: c.parties ? [shared, c.parties] : undefined, target: { to: 'guests', filter: 'not_shared' } },
    { id: 'rsvp', label: 'تابع الردود', detail: c.parties ? `${replied} ردوا · ${c.pendingParties} بانتظار الرد` : 'تظهر الردود هنا', done: c.parties > 0 && c.pendingParties === 0, progress: c.parties ? [replied, c.parties] : undefined, target: { to: 'rsvp' } },
    { id: 'seating', optional: true, label: 'وزّع الطاولات (اختياري)', detail: i.tables.length ? `${seated} من ${c.confirmedParties} دعوة مؤكدة على طاولات` : 'لو مناسبتك بطاولات، أضفها ووزّع الضيوف. يمكنك المتابعة بدونها.', done: i.tables.length > 0 && c.confirmedParties > 0 && c.unassignedConfirmed === 0, progress: c.confirmedParties && i.tables.length ? [seated, c.confirmedParties] : undefined, target: { to: 'seating' } },
    { id: 'checkin', label: 'جهز الدخول', detail: i.event.checkInPreparedAt ? 'وضع الدخول جاهز لفريق الاستقبال' : 'جرّب وضع الدخول وشارك رابطه مع فريق الاستقبال', done: !!i.event.checkInPreparedAt, target: { to: 'checkin' } },
  ];
}

export interface NextAction { label: string; reason: string; target: Target }

export function nextAction(i: OverviewInput, c: PartyCounts = countParties(i.parties)): NextAction {
  const phase = eventPhase(i.event, i.now);
  if (phase === 'completed' || phase === 'archived') return { label: 'اعرض ملخص المناسبة', reason: 'انتهت المناسبة', target: { to: 'summary' } };
  if (phase === 'event_day') return { label: 'افتح وضع الدخول', reason: 'اليوم يوم المناسبة', target: { to: 'gate' } };
  if (i.publish === 'none' || i.publish === 'draft') return { label: 'راجع وانشر دعوتك', reason: 'قالب مناسب جاهز بالأسماء والموعد — راجعه قبل المشاركة', target: { to: 'design' } };
  if (c.parties === 0) return { label: 'أضف الضيوف', reason: 'الدعوة جاهزة — أضف من ستدعوهم', target: { to: 'guests' } };
  if (c.notShared + c.failed > 0 && c.notShared + c.failed >= c.parties / 2) return { label: 'ابدأ المشاركة', reason: `${plural(c.notShared + c.failed, P.invitation)} لم تُشارك بعد`, target: { to: 'guests', filter: 'not_shared' } };
  if (phase === 'final_week' && i.tables.length > 0 && c.unassignedConfirmed > 0) return { label: 'راجع الجلوس', reason: c.unassignedConfirmed ? `${plural(c.unassignedConfirmed, P.invitation)} مؤكدة بلا طاولة` : 'المناسبة قريبة', target: { to: 'seating' } };
  if (c.notShared + c.failed > 0) return { label: 'أكمل المشاركة', reason: `${plural(c.notShared + c.failed, P.invitation)} لم تُشارك بعد`, target: { to: 'guests', filter: 'not_shared' } };
  if (c.pendingParties > 0) return { label: 'تابع الردود', reason: `${plural(c.pendingParties, P.invitation)} بانتظار الرد`, target: { to: 'rsvp' } };
  if (i.tables.length > 0 && c.unassignedConfirmed > 0) return { label: 'راجع الجلوس', reason: `${plural(c.unassignedConfirmed, P.invitation)} مؤكدة بلا طاولة`, target: { to: 'seating' } };
  return { label: 'جهز الدخول', reason: 'كل شيء جاهز تقريبًا', target: { to: 'checkin' } };
}

export interface AttentionItem { id: string; tone: Tone; text: string; action: string; target: Target; count: number }

export function needsAttention(i: OverviewInput, c: PartyCounts = countParties(i.parties)): AttentionItem[] {
  const out: AttentionItem[] = [];
  const phase: EventPhase = eventPhase(i.event, i.now);
  const add = (x: AttentionItem) => { if (x.count > 0) out.push(x); };
  const unmatched = i.responses.filter((r) => !r.partyId && !r.resolution).length;
  const sw = seatingWarnings(i.tables, i.parties);
  const exceptions = i.checkIns.filter((r) => !r.undone && r.exceptions.some((e) => e !== 'no_table')).length;

  if (i.publish === 'changed') add({ id: 'unpublished', tone: 'info', count: 1, text: 'في الدعوة تعديلات غير منشورة — الضيوف يرون النسخة السابقة', action: 'راجع وانشر', target: { to: 'invitation' } });
  if ((i.publish === 'none' || i.publish === 'draft') && c.parties > 0) add({ id: 'not_published', tone: 'warning', count: 1, text: 'الدعوة غير منشورة — لا يمكن مشاركة الروابط بعد', action: 'جهز الدعوة', target: { to: 'invitation' } });
  if (phase !== 'completed') {
    add({ id: 'pending', tone: 'warning', count: c.pendingParties, text: `${plural(c.pendingParties, P.invitation)} لم ترد بعد${c.openedNoReply ? ` (منها ${c.openedNoReply} فتحت الدعوة)` : ''}`, action: 'اعرض', target: { to: 'guests', filter: 'pending' } });
    add({ id: 'unmatched', tone: 'warning', count: unmatched, text: `${plural(unmatched, P.invitation)} من الرابط العام تحتاج مطابقة`, action: 'طابق الردود', target: { to: 'rsvp', tab: 'unmatched' } });
    add({ id: 'failed', tone: 'danger', count: c.failed, text: `تعذر إرسال ${pluralOf(c.failed, P.invitation)}`, action: 'أعد المحاولة', target: { to: 'guests', filter: 'not_shared' } });
  }
  add({ id: 'missing_phone', tone: 'warning', count: c.missingPhone, text: `${plural(c.missingPhone, P.invitation)} بلا رقم جوال`, action: 'أكمل الأرقام', target: { to: 'guests', filter: 'attention' } });
  add({ id: 'duplicates', tone: 'warning', count: c.duplicatePhones, text: `${plural(c.duplicatePhones, P.invitation)} تشترك في رقم جوال واحد`, action: 'راجع التكرار', target: { to: 'guests', filter: 'attention' } });
  add({ id: 'over_allowed', tone: 'danger', count: c.overAllowed, text: `${plural(c.overAllowed, P.invitation)} عددها المؤكد أكبر من المسموح`, action: 'راجع', target: { to: 'guests', filter: 'attention' } });
  add({ id: 'unassigned', tone: phase === 'final_week' || phase === 'event_day' ? 'warning' : 'info', count: i.tables.length ? sw.unassigned.length : 0, text: `${plural(sw.unassigned.reduce((n, p) => n + (p.confirmedPartySize ?? 0), 0), P.guest)} مؤكدون بلا طاولة`, action: 'وزّعهم', target: { to: 'seating' } });
  add({ id: 'declined_assigned', tone: 'warning', count: sw.declinedAssigned.length, text: `${plural(sw.declinedAssigned.length, P.invitation)} اعتذرت وما زالت على طاولات`, action: 'راجع الجلوس', target: { to: 'seating' } });
  add({ id: 'over_capacity', tone: 'danger', count: sw.overCapacity.length, text: `${plural(sw.overCapacity.length, P.table)} فوق السعة`, action: 'راجع الجلوس', target: { to: 'seating' } });
  add({ id: 'checkin_exceptions', tone: 'info', count: exceptions, text: `${plural(exceptions, P.invitation)} دخلت باستثناء يحتاج مراجعتك`, action: 'اعرض', target: { to: 'checkin' } });
  return out;
}

/** "who is coming" summary row for the overview header */
export function keyCounts(i: OverviewInput, c: PartyCounts = countParties(i.parties)) {
  const phase = eventPhase(i.event, i.now);
  return {
    invitations: c.parties,
    invitedPeople: c.maxSeats,
    confirmedPeople: c.confirmedPeople,
    declined: c.declinedParties,
    pending: c.pendingParties,
    checkedIn: c.checkedInPeople,
    showCheckIn: phase === 'event_day' || phase === 'completed' || c.checkedInPeople > 0,
  };
}
