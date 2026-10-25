/**
 * Event-day check-in rules. Exceptions are reported to the staff member, who decides; nothing is
 * silently fixed (spec §17). Partial check-in: confirmed 4 → 2 now (2/4) → 2 later (4/4).
 */
import type { CheckInException, CheckInStatus, InvitationParty } from './types';

export interface CheckInAssessment {
  expected: number;            // confirmed headcount, or allowed size if the guest never replied
  remaining: number;           // expected − already checked in (never below 0)
  suggested: number;           // the number the counter starts at
  exceptions: CheckInException[];
}

export function assessCheckIn(p: InvitationParty, arrivingNow?: number): CheckInAssessment {
  const confirmed = p.rsvpStatus === 'confirmed' ? p.confirmedPartySize ?? p.maxPartySize : 0;
  const expected = p.rsvpStatus === 'confirmed' ? confirmed : p.maxPartySize;
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
  const expected = p.rsvpStatus === 'confirmed' ? p.confirmedPartySize ?? p.maxPartySize : p.maxPartySize;
  return newTotal >= expected ? 'checked_in' : 'partial';
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
