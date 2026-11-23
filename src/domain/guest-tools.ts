import type { Event, InvitationParty, PublishState, Table } from './types';
import { csvCell } from './guest-experience';
import { eventPhase } from './event';
import { normalisePhone } from './phone';
import { formatPhone, plural, P } from './format';
import { invitationStatus, RSVP_STATUS, CHECKIN_STATUS, normaliseForSearch } from './parties';

/** `pick`: tables AND sections in one export — a guest is in when their table OR their section is ticked */
export type GuestExportScope = 'visible' | 'selected' | 'table' | 'group' | 'pick' | 'all';
export function scopedGuests(parties: readonly InvitationParty[], scope: GuestExportScope, options: {
  visibleIds?: ReadonlySet<string>; selectedIds?: ReadonlySet<string>; tableId?: string; group?: string; tableIds?: ReadonlySet<string>; groupNames?: ReadonlySet<string>;
}): InvitationParty[] {
  return parties.filter((p) => scope === 'all' || scope === 'visible' && !!options.visibleIds?.has(p.id)
    || scope === 'selected' && !!options.selectedIds?.has(p.id)
    || scope === 'table' && (options.tableIds ? options.tableIds.has(p.tableId || 'none') : options.tableId === 'none' ? !p.tableId : p.tableId === options.tableId)
    || scope === 'group' && (options.groupNames ? options.groupNames.has(p.side || '') : (p.side || '') === (options.group || ''))
    || scope === 'pick' && (!!options.tableIds?.has(p.tableId || 'none') || !!options.groupNames?.has(p.side || '')));
}

/** «+966 50 123 4567»: a plus, a country code and digit groups separated by single spaces — nothing else */
const SPACED_PHONE = /^\+\d{1,3}( \d{1,4}){2,}$/;
/**
 * A phone written the way people read it and spreadsheets keep it: spaced international format («+966 50 123 4567»).
 * The spaces keep it text in Excel, Google Sheets and LibreOffice (never 9.66E+11, never a lost leading zero), with no
 * apostrophe and no invisible mark, so it copies cleanly into WhatsApp or a dialer. Only «+», digits and single spaces
 * pass; anything else is returned as is and goes through csvCell's formula guard.
 */
export const phoneCell = (phone?: string): string => {
  if (!phone) return '';
  const n = normalisePhone(phone);
  const spaced = n.ok ? formatPhone(n.e164) : '';
  return SPACED_PHONE.test(spaced) ? spaced : phone;
};

/**
 * Food and private notes are intentionally excluded from a general guest export.
 * Rows read like a seating sheet — by table in the hall's order («بلا طاولة» last), then by name — and a totals line closes it.
 */
export function guestsCsv(parties: readonly InvitationParty[], tables: readonly Table[], includePhones = false): string {
  const head = ['الضيف', ...(includePhones ? ['الجوال'] : []), 'القسم', 'العدد المسموح', 'المرافقون', 'الرد', 'العدد المؤكد', 'الطاولة', 'الوصول', 'عدد الواصلين'];
  const order = new Map(tables.map((t) => [t.id, t.order]));
  const rank = (p: InvitationParty) => p.tableId && order.has(p.tableId) ? order.get(p.tableId)! : Number.MAX_SAFE_INTEGER;
  const sorted = [...parties].sort((a, b) => rank(a) - rank(b) || a.primaryGuestName.localeCompare(b.primaryGuestName, 'ar'));
  // a validated spaced phone is written as is (it is text, not a formula); every other cell goes through the guard
  const cell = (v: string | number | undefined) => typeof v === 'string' && SPACED_PHONE.test(v) ? v : csvCell(v);
  const rows = sorted.map((p) => [p.primaryGuestName, ...(includePhones ? [phoneCell(p.phone)] : []), p.side || '', p.maxPartySize,
    (p.companionNames ?? []).filter(Boolean).join('، '), RSVP_STATUS[p.rsvpStatus].label, p.confirmedPartySize ?? '',
    tables.find((t) => t.id === p.tableId)?.name || '', CHECKIN_STATUS[p.checkInStatus].label, p.checkedInCount]);
  const sum = (f: (p: InvitationParty) => number) => parties.reduce((n, p) => n + f(p), 0);
  const totals = [`الإجمالي: ${plural(parties.length, P.invitation)}`, ...(includePhones ? [''] : []), '', sum((p) => p.maxPartySize), '',
    `أكدوا: ${plural(parties.filter((p) => p.rsvpStatus === 'confirmed').length, P.invitation)}`, sum((p) => p.rsvpStatus === 'confirmed' ? p.confirmedPartySize ?? 0 : 0), '', '', sum((p) => p.checkedInCount)];
  return '﻿' + [...[head, ...rows].map((r) => r.map(cell).join(',')), '', totals.map(cell).join(',')].join('\r\n');
}

/** «not yet invited»: never shared, or the last attempt failed — the same set as the «لم تُشارك بعد» counter. */
export const isUnsent = (p: InvitationParty) => p.delivery.status === 'not_shared' || p.delivery.status === 'failed';

/** Arrival is recorded from the event day on (event time zone, store clock incl. the prototype offset), never days before. */
export const arrivalOpen = (event: Event, now: Date) => ['event_day', 'completed'].includes(eventPhase(event, now));

/**
 * A reply reminder waits this long after the invitation was sent or last reminded: a family that just got the
 * invitation (or a reminder) is not counted, queued or nudged again until then.
 */
export const REMIND_HOLD_HOURS = 48;
/** the organizer's latest contact while the hold runs («أُرسلت/ذُكّرت قبل…»), or null when a reminder may go now */
export function remindHold(p: InvitationParty, now: Date): { kind: 'sent' | 'reminded'; at: string } | null {
  const sent = p.delivery.at ? Date.parse(p.delivery.at) : NaN, reminded = p.delivery.reminderAt ? Date.parse(p.delivery.reminderAt) : NaN;
  const last = Math.max(Number.isFinite(sent) ? sent : -Infinity, Number.isFinite(reminded) ? reminded : -Infinity);
  if (!Number.isFinite(last) || now.getTime() - last >= REMIND_HOLD_HOURS * 3600_000) return null;
  return reminded === last ? { kind: 'reminded', at: p.delivery.reminderAt! } : { kind: 'sent', at: p.delivery.at! };
}
/** still waiting for a reply after the invitation reached them, and not contacted within the hold */
export const canRemind = (p: InvitationParty, now: Date): boolean =>
  p.rsvpStatus === 'pending' && (p.delivery.status === 'shared' || p.delivery.status === 'opened') && !remindHold(p, now);

/**
 * One primary action per guest, aware of state and time. «details» adds nothing to the card: the name opens them.
 * «unseat»: the guest declined but still holds a table. «wait»: a reminder would be due but the guest was just
 * invited or reminded (see remindHold) — the card says when instead of offering the reminder again.
 */
export type GuestNextAction = 'publish' | 'phone' | 'share' | 'remind' | 'wait' | 'seat' | 'unseat' | 'arrival' | 'details';
export function guestNextAction(p: InvitationParty, publish: PublishState, seatingEnabled: boolean, arrivalTime = false, now?: Date): GuestNextAction {
  if (p.checkInStatus === 'checked_in') return 'details';
  if (p.rsvpStatus === 'declined') return p.tableId ? 'unseat' : 'details';
  if (p.rsvpStatus === 'confirmed') return seatingEnabled && !p.tableId ? 'seat' : arrivalTime ? 'arrival' : 'details';
  if (publish === 'none' || publish === 'draft') return 'publish';
  if (!normalisePhone(p.phone).ok) return 'phone';
  if (!['shared', 'opened'].includes(invitationStatus(p, publish))) return 'share';
  return now && remindHold(p, now) ? 'wait' : 'remind';
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
