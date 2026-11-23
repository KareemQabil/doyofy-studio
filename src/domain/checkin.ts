/**
 * Event-day check-in rules. Exceptions are reported to the staff member, who decides; nothing is
 * silently fixed (spec §17). Partial check-in: confirmed 4 → 2 now (2/4) → 2 later (4/4).
 */
import type { CheckInException, CheckInStatus, EventActivity, InvitationParty } from './types';

/**
 * Everyone who came in, the way the gate and the check-in page count them: every person checked in on an invitation
 * plus the people let in from outside the list (walk-ins live only in the activity log). `special` is the part let in
 * by a staff decision — a declined or unanswered invitation, or a walk-in — so the counter can say «منهم 3 بإذن خاص».
 */
export function arrivalTotals(parties: readonly InvitationParty[], activity: readonly EventActivity[]): { people: number; special: number } {
  let people = 0, special = 0;
  for (const p of parties) { people += p.checkedInCount; if (p.rsvpStatus !== 'confirmed') special += p.checkedInCount; }
  for (const a of activity) if (a.kind === 'check_in_walk_in') { const n = Number(a.data.count) || 1; people += n; special += n; }
  return { people, special };
}

export interface CheckInAssessment {
  expected: number;            // confirmed headcount, or allowed size if the guest never replied
  remaining: number;           // expected − already checked in (never below 0)
  suggested: number;           // the number the counter starts at
  exceptions: CheckInException[];
}

/**
 * How many people the gate waits for. Confirmed: what they confirmed, but never more than the invitation now allows
 * (the organizer may lower the allowance after the reply). Not replied: the allowance. Declined: nobody — whoever the
 * staff let in after checking is an exception, and the invitation never waits for «the rest».
 */
export function expectedArrivals(p: InvitationParty): number {
  if (p.rsvpStatus === 'declined') return 0;
  if (p.rsvpStatus === 'confirmed') return Math.min(p.confirmedPartySize ?? p.maxPartySize, p.maxPartySize);
  return p.maxPartySize;
}

export function assessCheckIn(p: InvitationParty, arrivingNow?: number): CheckInAssessment {
  const expected = expectedArrivals(p);
  const confirmed = p.rsvpStatus === 'confirmed' ? expected : 0;
  const remaining = Math.max(0, expected - p.checkedInCount);
  const n = arrivingNow ?? (remaining || 1);
  const ex: CheckInException[] = [];
  if (p.rsvpStatus === 'declined') ex.push('declined_arrived');
  if (p.rsvpStatus === 'pending') ex.push('pending_arrived');
  if (p.checkInStatus === 'checked_in' && remaining === 0) ex.push('already_complete');
  const after = p.checkedInCount + n;
  if (p.rsvpStatus === 'confirmed' && after > confirmed && after <= p.maxPartySize) ex.push('over_confirmed');
  if (after > p.maxPartySize) ex.push('over_allowed');
  if (p.rsvpStatus === 'confirmed' && !p.tableId) ex.push('no_table');
  return { expected, remaining, suggested: remaining || 1, exceptions: ex };
}

/** exceptions that need an explicit staff decision before recording */
export const BLOCKING: ReadonlySet<CheckInException> = new Set(['declined_arrived', 'pending_arrived', 'over_confirmed', 'over_allowed', 'already_complete']);

export const EXCEPTION_TEXT: Record<CheckInException, { title: string; body: string }> = {
  declined_arrived: { title: 'هذا الضيف اعتذر عن الحضور', body: 'سجّل دخوله فقط إذا تأكدت من المنظم أو من صاحب الدعوة.' },
  pending_arrived: { title: 'هذا الضيف لم يؤكد حضوره', body: 'الدعوة تسمح بعدد محدد. تأكد من العدد قبل التسجيل.' },
  over_confirmed: { title: 'العدد أكبر مما أكدوه', body: 'أكدوا عددًا أقل من القادمين الآن، لكنه ضمن المسموح للدعوة.' },
  over_allowed: { title: 'العدد أكبر من المسموح للدعوة', body: 'الدعوة لا تشمل هذا العدد. لا تسجّل إلا بموافقة المنظم.' },
  no_table: { title: 'لا توجد طاولة محددة', body: 'أدخلهم ووجّههم لمنسق القاعة لتحديد طاولة.' },
  already_complete: { title: 'تم تسجيل دخول هذه الدعوة بالكامل', body: 'رمز QR استُخدم من قبل. تحقق من الأسماء قبل السماح بدخول إضافي.' },
};

export function statusAfter(p: InvitationParty, newTotal: number): CheckInStatus {
  if (newTotal <= 0) return 'not_arrived';
  return newTotal >= expectedArrivals(p) ? 'checked_in' : 'partial';
}

/** QR payload → party code. Accepts the personal link (…/i/<slug>/<CODE>), "DOYOFY:<CODE>" or a bare code. */
export function codeFromScan(payload: string): string | null {
  const s = payload.trim();
  const link = s.match(/\/i\/[^/?#]+\/([A-Za-z0-9]{4,8})(?:[/?#]|$)/);
  if (link) return link[1]!.toUpperCase();
  const tagged = s.match(/^DOYOFY:([A-Za-z0-9]{4,8})$/i);
  if (tagged) return tagged[1]!.toUpperCase();
  if (/^[A-Za-z0-9]{4,8}$/.test(s)) return s.toUpperCase();
  return null;
}
