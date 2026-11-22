import type { Event, InvitationParty, PublishState, Table } from './types';
import { csvCell } from './guest-experience';
import { eventPhase } from './event';
import { normalisePhone } from './phone';
import { invitationStatus, RSVP_STATUS, CHECKIN_STATUS, normaliseForSearch } from './parties';

export type GuestExportScope = 'visible' | 'selected' | 'table' | 'group' | 'all';
export function scopedGuests(parties: readonly InvitationParty[], scope: GuestExportScope, options: {
  visibleIds?: ReadonlySet<string>; selectedIds?: ReadonlySet<string>; tableId?: string; group?: string; tableIds?: ReadonlySet<string>; groupNames?: ReadonlySet<string>;
}): InvitationParty[] {
  return parties.filter((p) => scope === 'all' || scope === 'visible' && !!options.visibleIds?.has(p.id)
    || scope === 'selected' && !!options.selectedIds?.has(p.id)
    || scope === 'table' && (options.tableIds ? options.tableIds.has(p.tableId || 'none') : options.tableId === 'none' ? !p.tableId : p.tableId === options.tableId)
    || scope === 'group' && (options.groupNames ? options.groupNames.has(p.side || '') : (p.side || '') === (options.group || '')));
}

/**
 * A phone written as text that opens cleanly in Excel, Google Sheets and LibreOffice: a left-to-right mark (U+200E)
 * before the normalised number. The cell no longer starts with «+», so it is neither a formula nor a number
 * (no visible apostrophe, no 9.66E+11, no lost leading zero), and it reads left to right in an Arabic sheet.
 * Only «+» and digits pass, so nothing executable can follow the mark; anything else goes through csvCell's guard.
 */
export const phoneCell = (phone?: string) => phone && /^\+?\d{6,16}$/.test(phone) ? `‎${phone}` : phone || '';

/** Food and private notes are intentionally excluded from a general guest export. */
export function guestsCsv(parties: readonly InvitationParty[], tables: readonly Table[], includePhones = false): string {
  const head = ['الضيف', ...(includePhones ? ['الجوال'] : []), 'القسم', 'العدد المسموح', 'المرافقون', 'الرد', 'العدد المؤكد', 'الطاولة', 'الوصول', 'عدد الواصلين'];
  const rows = parties.map((p) => [p.primaryGuestName, ...(includePhones ? [phoneCell(p.phone)] : []), p.side || '', p.maxPartySize,
    (p.companionNames ?? []).filter(Boolean).join('، '), RSVP_STATUS[p.rsvpStatus].label, p.confirmedPartySize ?? '',
    tables.find((t) => t.id === p.tableId)?.name || '', CHECKIN_STATUS[p.checkInStatus].label, p.checkedInCount]);
  return '\uFEFF' + [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
}

/** «not yet invited»: never shared, or the last attempt failed — the same set as the «لم تُشارك بعد» counter. */
export const isUnsent = (p: InvitationParty) => p.delivery.status === 'not_shared' || p.delivery.status === 'failed';

/** Arrival is recorded from the event day on (event time zone, store clock incl. the prototype offset), never days before. */
export const arrivalOpen = (event: Event, now: Date) => ['event_day', 'completed'].includes(eventPhase(event, now));

/**
 * One primary action per guest, aware of state and time. «details» adds nothing to the card: the name opens them.
 * «unseat»: the guest declined but still holds a table.
 */
export type GuestNextAction = 'publish' | 'phone' | 'share' | 'remind' | 'seat' | 'unseat' | 'arrival' | 'details';
export function guestNextAction(p: InvitationParty, publish: PublishState, seatingEnabled: boolean, arrivalTime = false): GuestNextAction {
  if (p.checkInStatus === 'checked_in') return 'details';
  if (p.rsvpStatus === 'declined') return p.tableId ? 'unseat' : 'details';
  if (p.rsvpStatus === 'confirmed') return seatingEnabled && !p.tableId ? 'seat' : arrivalTime ? 'arrival' : 'details';
  if (publish === 'none' || publish === 'draft') return 'publish';
  if (!normalisePhone(p.phone).ok) return 'phone';
  return ['shared', 'opened'].includes(invitationStatus(p, publish)) ? 'remind' : 'share';
}

export function duplicateDestinationNames(incoming: readonly InvitationParty[], target: readonly InvitationParty[]): string[] {
  const phones = new Set(target.map((p) => p.phone).filter(Boolean));
  const names = new Set(target.map((p) => normaliseForSearch(p.primaryGuestName)));
  const duplicates: string[] = [];
  for (const p of incoming) {
    const name = normaliseForSearch(p.primaryGuestName);
    if (p.phone && phones.has(p.phone) || names.has(name)) duplicates.push(p.primaryGuestName);
    if (p.phone) phones.add(p.phone);
    names.add(name);
  }
  return duplicates;
}
