/**
 * Event Overview logic (spec §8–9): setup checklist, the ONE next action for the current stage,
 * and "needs attention" items. Everything is derived from current data — nothing stored.
 */
import type { CheckInRecord, Event, InvitationParty, PublishState, RSVPResponse, Table, Tone } from './types';
import { countParties, type PartyCounts } from './parties';
import { eventPhase, type EventPhase } from './event';
import { seatingWarnings } from './seating';
import { copyFor, countOf, fill, type Dialect, type Noun } from './copy';

/** the organizer's words for one input (modern Arabic unless the input carries a voice) */
const voice = (i: OverviewInput) => {
  const d = i.dialect ?? 'ar', c = copyFor(d);
  return { c, f: fill, k: (n: number, noun: Noun, oblique = false) => countOf(d, n, noun, oblique) };
};

/** where a checklist item / attention item / CTA leads (resolved to a URL by the app layer) */
export type Target =
  | { to: 'settings'; focus?: 'map' }
  | { to: 'invitation' }
  | { to: 'design' }
  | { to: 'guests'; filter?: string; share?: 'unsent' }
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
  /** the organizer's voice for the lines below */
  dialect?: Dialect;
}

export interface ChecklistItem { id: string; label: string; detail: string; done: boolean; optional?: boolean; progress?: [number, number]; target: Target }

export function checklist(i: OverviewInput, c: PartyCounts = countParties(i.parties)): ChecklistItem[] {
  const shared = c.parties - c.notShared - c.failed;
  const replied = c.parties - c.pendingParties;
  const seated = c.confirmedParties - c.unassignedConfirmed;
  const { c: w, f, k } = voice(i);
  return [
    { id: 'details', optional: true, label: w.ovMapLabel, detail: i.event.venue.mapUrl ? w.ovMapDone : w.ovMapHint, done: !!i.event.venue.mapUrl, target: { to: 'settings', focus: 'map' } },
    { id: 'invitation', label: w.ovInvLabel, detail: i.publish === 'published' || i.publish === 'changed' ? w.ovInvPublished : i.publish === 'draft' ? w.ovInvDraft : w.ovInvNone, done: i.publish === 'published' || i.publish === 'changed', target: { to: 'invitation' } },
    { id: 'guests', label: w.ovGuestsLabel, detail: c.parties ? f(w.ovGuestsDetail, { invitations: k(c.parties, 'invitation'), people: k(c.maxSeats, 'person', true) }) : w.ovGuestsHint, done: c.parties > 0, target: { to: 'guests' } },
    { id: 'share', label: w.ovShareLabel, detail: c.parties ? f(w.ovShareDetail, { n: shared, of: c.parties }) : w.ovAfterGuests, done: c.parties > 0 && shared === c.parties, progress: c.parties ? [shared, c.parties] : undefined, target: { to: 'guests', filter: 'not_shared' } },
    { id: 'rsvp', label: w.ovRsvpLabel, detail: c.parties ? f(w.ovRsvpDetail, { n: replied, pending: c.pendingParties }) : w.ovRsvpHint, done: c.parties > 0 && c.pendingParties === 0, progress: c.parties ? [replied, c.parties] : undefined, target: { to: 'rsvp' } },
    { id: 'seating', optional: true, label: w.ovSeatLabel, detail: i.tables.length ? f(w.ovSeatDetail, { n: seated, of: c.confirmedParties }) : w.ovSeatHint, done: i.tables.length > 0 && c.confirmedParties > 0 && c.unassignedConfirmed === 0, progress: c.confirmedParties && i.tables.length ? [seated, c.confirmedParties] : undefined, target: { to: 'seating' } },
    { id: 'checkin', label: w.ovCheckinLabel, detail: i.event.checkInPreparedAt ? w.ovCheckinDone : w.ovCheckinHint, done: !!i.event.checkInPreparedAt, target: { to: 'checkin' } },
  ];
}

export interface NextAction { label: string; reason: string; target: Target }

export function nextAction(i: OverviewInput, c: PartyCounts = countParties(i.parties)): NextAction {
  const phase = eventPhase(i.event, i.now);
  const { c: w, f, k } = voice(i);
  if (phase === 'completed' || phase === 'archived') return { label: w.ovSummary, reason: w.ovEnded, target: { to: 'summary' } };
  if (phase === 'event_day') return { label: w.ovOpenGate, reason: w.ovEventDay, target: { to: 'gate' } };
  if (i.publish === 'none' || i.publish === 'draft') return { label: w.ovReview, reason: w.ovReviewWhy, target: { to: 'design' } };
  if (c.parties === 0) return { label: w.ovGuestsLabel, reason: w.ovAddWhy, target: { to: 'guests' } };
  if (c.notShared + c.failed > 0 && c.notShared + c.failed >= c.parties / 2) return { label: w.ovStartShare, reason: f(w.ovNotShared, { invitations: k(c.notShared + c.failed, 'invitation') }), target: { to: 'guests', filter: 'not_shared', share: 'unsent' } };
  if (phase === 'final_week' && i.tables.length > 0 && c.unassignedConfirmed > 0) return { label: w.ovSeating, reason: c.unassignedConfirmed ? f(w.ovNoTable, { invitations: k(c.unassignedConfirmed, 'invitation') }) : w.ovSoon, target: { to: 'seating' } };
  if (c.notShared + c.failed > 0) return { label: w.ovContinueShare, reason: f(w.ovNotShared, { invitations: k(c.notShared + c.failed, 'invitation') }), target: { to: 'guests', filter: 'not_shared', share: 'unsent' } };
  if (c.pendingParties > 0) return { label: w.ovRsvpLabel, reason: f(w.ovPending, { invitations: k(c.pendingParties, 'invitation') }), target: { to: 'rsvp' } };
  if (i.tables.length > 0 && c.unassignedConfirmed > 0) return { label: w.ovSeating, reason: f(w.ovNoTable, { invitations: k(c.unassignedConfirmed, 'invitation') }), target: { to: 'seating' } };
  return { label: w.ovCheckinLabel, reason: w.ovAlmost, target: { to: 'checkin' } };
}

export interface AttentionItem { id: string; tone: Tone; text: string; action: string; target: Target; count: number }

export function needsAttention(i: OverviewInput, c: PartyCounts = countParties(i.parties)): AttentionItem[] {
  const out: AttentionItem[] = [];
  const phase: EventPhase = eventPhase(i.event, i.now);
  const add = (x: AttentionItem) => { if (x.count > 0) out.push(x); };
  const unmatched = i.responses.filter((r) => !r.partyId && !r.resolution).length;
  const sw = seatingWarnings(i.tables, i.parties);
  const exceptions = i.checkIns.filter((r) => !r.undone && r.exceptions.some((e) => e !== 'no_table')).length;
  const { c: w, f, k } = voice(i);
  const inv = (count: number) => ({ invitations: k(count, 'invitation') });

  if (i.publish === 'changed') add({ id: 'unpublished', tone: 'info', count: 1, text: w.ovUnpublished, action: w.ovReviewPublish, target: { to: 'invitation' } });
  if ((i.publish === 'none' || i.publish === 'draft') && c.parties > 0) add({ id: 'not_published', tone: 'warning', count: 1, text: w.ovNotPublished, action: w.ovInvLabel, target: { to: 'invitation' } });
  if (phase !== 'completed') {
    add({ id: 'pending', tone: 'warning', count: c.pendingParties, text: f(w.ovNotReplied, { ...inv(c.pendingParties), opened: c.openedNoReply ? f(w.ovOpenedOf, { n: c.openedNoReply }) : '' }), action: w.ovShow, target: { to: 'guests', filter: 'pending' } });
    add({ id: 'unmatched', tone: 'warning', count: unmatched, text: f(w.ovToMatch, inv(unmatched)), action: w.ovMatch, target: { to: 'rsvp', tab: 'unmatched' } });
    add({ id: 'failed', tone: 'danger', count: c.failed, text: f(w.ovFailed, { invitations: k(c.failed, 'invitation', true) }), action: w.retry, target: { to: 'guests', filter: 'not_shared' } });
  }
  add({ id: 'missing_phone', tone: 'warning', count: c.missingPhone, text: f(w.ovNoPhone, inv(c.missingPhone)), action: w.ovFillPhones, target: { to: 'guests', filter: 'attention' } });
  add({ id: 'duplicates', tone: 'warning', count: c.duplicatePhones, text: f(w.ovDupPhones, inv(c.duplicatePhones)), action: w.ovCheckDup, target: { to: 'guests', filter: 'attention' } });
  add({ id: 'over_allowed', tone: 'danger', count: c.overAllowed, text: f(w.ovOverAllowed, inv(c.overAllowed)), action: w.ovReviewShort, target: { to: 'guests', filter: 'attention' } });
  add({ id: 'unassigned', tone: phase === 'final_week' || phase === 'event_day' ? 'warning' : 'info', count: i.tables.length ? sw.unassigned.length : 0, text: f(w.ovUnseated, { guests: k(sw.unassigned.reduce((n, p) => n + (p.confirmedPartySize ?? 0), 0), 'guest') }), action: w.ovSeatThem, target: { to: 'seating' } });
  add({ id: 'declined_assigned', tone: 'warning', count: sw.declinedAssigned.length, text: f(w.ovDeclinedSeated, inv(sw.declinedAssigned.length)), action: w.ovSeating, target: { to: 'seating' } });
  add({ id: 'over_capacity', tone: 'danger', count: sw.overCapacity.length, text: f(w.ovOverTables, { tables: k(sw.overCapacity.length, 'table') }), action: w.ovSeating, target: { to: 'seating' } });
  add({ id: 'checkin_exceptions', tone: 'info', count: exceptions, text: f(w.ovExceptions, inv(exceptions)), action: w.ovShow, target: { to: 'checkin' } });
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
