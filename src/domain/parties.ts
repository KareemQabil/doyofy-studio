/**
 * Invitation parties: derived states, counts, filters and RSVP rules.
 * Headcount is never copied anywhere: it is always derived from parties (spec §29).
 */
import type { CheckInStatus, InvitationParty, InvitationStatus, PublishState, RsvpInput, RsvpStatus, StateSource, Tone } from './types';
import { toArabicDigitsSafe } from './format';

// ------------------------------------------------------------------ delivery (invitation communication)
/** spec states: draft (invitation not published) · ready · shared · opened · failed */
export function invitationStatus(p: InvitationParty, publish: PublishState): InvitationStatus {
  if (p.delivery.status === 'not_shared') return publish === 'published' || publish === 'changed' ? 'ready' : 'draft';
  return p.delivery.status;
}

export const INVITATION_STATUS: Record<InvitationStatus, { label: string; tone: Tone }> = {
  draft: { label: 'غير مرسلة', tone: 'neutral' },
  ready: { label: 'جاهزة للمشاركة', tone: 'info' },
  shared: { label: 'تمت المشاركة', tone: 'info' },
  opened: { label: 'تم الفتح', tone: 'success' },
  failed: { label: 'تعذر الإرسال', tone: 'danger' },
};

export const SOURCE_LABEL: Record<StateSource, string> = {
  platform: 'سجلته المنصة',
  manual: 'حددته يدويًا',
  simulated: 'محاكاة',
};

export const RSVP_STATUS: Record<RsvpStatus, { label: string; tone: Tone }> = {
  pending: { label: 'لم يرد بعد', tone: 'warning' },
  confirmed: { label: 'أكد الحضور', tone: 'success' },
  declined: { label: 'اعتذر', tone: 'neutral' },
};

export const CHECKIN_STATUS: Record<CheckInStatus, { label: string; tone: Tone }> = {
  not_arrived: { label: 'لم يصل', tone: 'neutral' },
  partial: { label: 'وصل جزء', tone: 'warning' },
  checked_in: { label: 'وصل', tone: 'success' },
};

// ------------------------------------------------------------------ counts
export interface PartyCounts {
  parties: number;
  maxSeats: number;             // sum of allowed party sizes
  confirmedParties: number;
  confirmedPeople: number;      // headcount — NOT the number of invitations
  declinedParties: number;
  pendingParties: number;
  openedNoReply: number;
  notShared: number;
  failed: number;
  unassignedConfirmed: number;
  declinedAssigned: number;
  overAllowed: number;
  missingPhone: number;
  duplicatePhones: number;      // parties sharing a phone with another party
  checkedInPeople: number;
  arrivedParties: number;       // fully or partly
  partialParties: number;
}

export const seatsFor = (p: InvitationParty) => (p.rsvpStatus === 'confirmed' ? p.confirmedPartySize ?? p.maxPartySize : 0);

export function duplicatePhoneIds(parties: readonly InvitationParty[]): Set<string> {
  const byPhone = new Map<string, string[]>();
  for (const p of parties) if (p.phone) byPhone.set(p.phone, [...(byPhone.get(p.phone) ?? []), p.id]);
  const dup = new Set<string>();
  for (const ids of byPhone.values()) if (ids.length > 1) ids.forEach((id) => dup.add(id));
  return dup;
}

export function countParties(parties: readonly InvitationParty[]): PartyCounts {
  const dup = duplicatePhoneIds(parties);
  const c: PartyCounts = {
    parties: parties.length, maxSeats: 0, confirmedParties: 0, confirmedPeople: 0, declinedParties: 0, pendingParties: 0,
    openedNoReply: 0, notShared: 0, failed: 0, unassignedConfirmed: 0, declinedAssigned: 0, overAllowed: 0,
    missingPhone: 0, duplicatePhones: dup.size, checkedInPeople: 0, arrivedParties: 0, partialParties: 0,
  };
  for (const p of parties) {
    c.maxSeats += p.maxPartySize;
    if (p.rsvpStatus === 'confirmed') {
      c.confirmedParties++;
      c.confirmedPeople += seatsFor(p);
      if (!p.tableId) c.unassignedConfirmed++;
      if ((p.confirmedPartySize ?? 0) > p.maxPartySize) c.overAllowed++;
    } else if (p.rsvpStatus === 'declined') {
      c.declinedParties++;
      if (p.tableId) c.declinedAssigned++;
    } else {
      c.pendingParties++;
      if (p.delivery.status === 'opened') c.openedNoReply++;
    }
    if (p.delivery.status === 'not_shared') c.notShared++;
    if (p.delivery.status === 'failed') c.failed++;
    if (!p.phone) c.missingPhone++;
    c.checkedInPeople += p.checkedInCount;
    if (p.checkedInCount > 0) c.arrivedParties++;
    if (p.checkInStatus === 'partial') c.partialParties++;
  }
  return c;
}

// ------------------------------------------------------------------ filters & search
export type PartyFilter = 'all' | 'pending' | 'confirmed' | 'declined' | 'not_shared' | 'unassigned' | 'checked_in' | 'attention';

export const PARTY_FILTERS: Array<{ id: PartyFilter; label: string }> = [
  { id: 'all', label: 'الكل' },
  { id: 'pending', label: 'لم يرد بعد' },
  { id: 'confirmed', label: 'أكدوا' },
  { id: 'declined', label: 'اعتذروا' },
  { id: 'not_shared', label: 'لم تُشارك' },
  { id: 'unassigned', label: 'بلا طاولة' },
  { id: 'checked_in', label: 'وصلوا' },
  { id: 'attention', label: 'تحتاج انتباه' },
];

export function partyNeedsAttention(p: InvitationParty, dupIds: ReadonlySet<string>): string[] {
  const why: string[] = [];
  if (!p.phone) why.push('بلا رقم جوال');
  if (dupIds.has(p.id)) why.push('رقم مكرر');
  if (p.delivery.status === 'failed') why.push('تعذر الإرسال');
  if (p.rsvpStatus === 'pending' && p.delivery.status === 'opened') why.push('فتح الدعوة ولم يرد');
  if (p.rsvpStatus === 'confirmed' && (p.confirmedPartySize ?? 0) > p.maxPartySize) why.push('العدد أكبر من المسموح');
  if (p.rsvpStatus === 'declined' && p.tableId) why.push('اعتذر وما زال على طاولة');
  return why;
}

export function matchesFilter(p: InvitationParty, f: PartyFilter, dupIds: ReadonlySet<string>): boolean {
  switch (f) {
    case 'all': return true;
    case 'pending': return p.rsvpStatus === 'pending';
    case 'confirmed': return p.rsvpStatus === 'confirmed';
    case 'declined': return p.rsvpStatus === 'declined';
    case 'not_shared': return p.delivery.status === 'not_shared' || p.delivery.status === 'failed';
    case 'unassigned': return p.rsvpStatus === 'confirmed' && !p.tableId;
    case 'checked_in': return p.checkedInCount > 0;
    case 'attention': return partyNeedsAttention(p, dupIds).length > 0;
  }
}

/** Arabic-aware search: ignores diacritics, hamza/alef/ya/ta-marbuta variants and digits form. */
export function normaliseForSearch(s: string): string {
  return toArabicDigitsSafe(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[ً-ٰٟـ]/g, '')   // tashkeel + tatweel
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[\s\-_.()+]/g, '');
}

export function searchParties<T extends InvitationParty>(parties: readonly T[], query: string): T[] {
  const q = normaliseForSearch(query);
  if (!q) return [...parties];
  return parties.filter((p) => {
    const hay = normaliseForSearch([p.primaryGuestName, ...(p.companionNames ?? []), p.phone ?? '', p.code, p.side ?? ''].join(' '));
    // phone numbers: allow searching "0551234567" against "+966551234567"
    const qPhone = q.replace(/^0+/, '');
    return hay.includes(q) || (qPhone.length >= 4 && /^\d+$/.test(qPhone) && hay.includes(qPhone));
  });
}

// ------------------------------------------------------------------ RSVP rules
export type RsvpError = 'count_too_low' | 'count_exceeds_allowed' | 'no_count';

export function validateRsvp(input: RsvpInput, maxPartySize: number): RsvpError | null {
  if (!input.attending) return null;
  if (!Number.isFinite(input.count)) return 'no_count';
  if (input.count < 1) return 'count_too_low';
  if (input.count > maxPartySize) return 'count_exceeds_allowed';
  return null;
}

export const RSVP_ERROR_TEXT: Record<RsvpError, string> = {
  count_too_low: 'اختر عدد الحضور (شخص واحد على الأقل).',
  count_exceeds_allowed: 'العدد أكبر من المسموح لهذه الدعوة.',
  no_count: 'اختر عدد الحضور.',
};

/** Apply a response to the party's current state. Declining never silently clears a table (spec §15: flagged). */
export function applyRsvp(p: InvitationParty, input: RsvpInput, at: string): InvitationParty {
  const companions = input.companionNames?.map((s) => s.trim()).filter(Boolean);
  return {
    ...p,
    rsvpStatus: input.attending ? 'confirmed' : 'declined',
    confirmedPartySize: input.attending ? input.count : 0,
    companionNames: companions && companions.length ? companions : p.companionNames,
    guestNote: input.note?.trim() || undefined,
    respondedAt: at,
    updatedAt: at,
  };
}

export function partyLabel(p: Pick<InvitationParty, 'primaryGuestName' | 'maxPartySize'>): string {
  return p.primaryGuestName;
}
