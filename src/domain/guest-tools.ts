import type { InvitationParty, PublishState, Table } from './types';
import { csvCell } from './guest-experience';
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

/** Food and private notes are intentionally excluded from a general guest export. */
export function guestsCsv(parties: readonly InvitationParty[], tables: readonly Table[], includePhones = false): string {
  const head = ['الضيف', ...(includePhones ? ['الجوال'] : []), 'القسم', 'العدد المسموح', 'الرد', 'العدد المؤكد', 'الطاولة', 'الوصول', 'عدد الواصلين'];
  const rows = parties.map((p) => [p.primaryGuestName, ...(includePhones ? [p.phone || ''] : []), p.side || '', p.maxPartySize,
    RSVP_STATUS[p.rsvpStatus].label, p.confirmedPartySize ?? '', tables.find((t) => t.id === p.tableId)?.name || '',
    CHECKIN_STATUS[p.checkInStatus].label, p.checkedInCount]);
  return '\uFEFF' + [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
}

export type GuestNextAction = 'publish' | 'phone' | 'share' | 'remind' | 'seat' | 'arrival' | 'details';
export function guestNextAction(p: InvitationParty, publish: PublishState, seatingEnabled: boolean): GuestNextAction {
  if (p.rsvpStatus === 'declined' || p.checkInStatus === 'checked_in') return 'details';
  if (p.rsvpStatus === 'confirmed') return seatingEnabled && !p.tableId ? 'seat' : 'arrival';
  if (publish === 'none' || publish === 'draft') return 'publish';
  if (!p.phone) return 'phone';
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
