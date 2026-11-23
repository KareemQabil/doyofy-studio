/**
 * Event Overview logic (spec §8–9): the ONE next action for the current stage (design → add guests → send →
 * follow replies → reception) and "needs attention" items. Everything is derived from current data — nothing stored.
 * The invitation is always live, so nothing here waits on a publish step.
 */
import type { CheckInRecord, Event, InvitationParty, RSVPResponse, Table, Tone } from './types';
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
  /** a design has been saved for this event (a fresh event shows its occasion's default design until then) */
  designed: boolean;
  parties: readonly InvitationParty[];
  tables: readonly Table[];
  responses: readonly RSVPResponse[];
  checkIns: readonly CheckInRecord[];
  now: Date;
  /** the organizer's voice for the lines below */
  dialect?: Dialect;
}

export interface NextAction { label: string; reason: string; target: Target }

export function nextAction(i: OverviewInput, c: PartyCounts = countParties(i.parties)): NextAction {
  const phase = eventPhase(i.event, i.now);
  const { c: w, f, k } = voice(i);
  if (phase === 'completed' || phase === 'archived') return { label: w.ovSummary, reason: w.ovEnded, target: { to: 'summary' } };
  if (phase === 'event_day') return { label: w.ovOpenGate, reason: w.ovEventDay, target: { to: 'gate' } };
  // design is a suggestion, never a gate: the default design already works, and once guests exist it is skipped
  if (!i.designed && c.parties === 0) return { label: w.ovReview, reason: w.ovReviewWhy, target: { to: 'design' } };
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
