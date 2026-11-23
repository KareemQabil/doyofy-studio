/** Presentation decisions derived from domain state; never persisted as a second source of truth. */
import type { Event, InvitationParty, PublishState } from './types';
import { eventPhase, eventTypeInfo } from './event';
import { countParties } from './parties';
import type { AttentionItem, OverviewInput } from './overview';
import { copyFor, fill, type Dialect } from './copy';

export type JourneyStage = 'prepare' | 'invite' | 'arrange' | 'welcome' | 'remember';
/** the stages in order; t(labelKey) gives each one's name */
export const JOURNEY = [
  { id: 'prepare', labelKey: 'jrPrepare' }, { id: 'invite', labelKey: 'jrInvite' },
  { id: 'arrange', labelKey: 'jrArrange' }, { id: 'welcome', labelKey: 'jrWelcome' },
  { id: 'remember', labelKey: 'jrRemember' },
] as const;

export function journeyStage(event: Event, publish: PublishState, parties: readonly InvitationParty[], now: Date): JourneyStage {
  const phase = eventPhase(event, now);
  if (phase === 'completed' || phase === 'archived') return 'remember';
  if (phase === 'event_day') return 'welcome';
  if (publish === 'none' || publish === 'draft' || !parties.length) return 'prepare';
  const c = countParties(parties);
  if (phase === 'final_week' || (c.pendingParties === 0 && c.notShared + c.failed === 0)) return 'arrange';
  return 'invite';
}

export function occasionAction(type: Event['type'] | null, dialect: Dialect = 'ar'): string {
  const c = copyFor(dialect);
  return type ? fill(c.ovStartOccasion, { type: eventTypeInfo(type).label }) : c.ovChooseOccasion;
}

/** A calm summary uses people for attendance and invitations for unanswered replies. */
export function overviewFacts(i: OverviewInput) {
  const c = countParties(i.parties);
  const phase = eventPhase(i.event, i.now);
  const w = copyFor(i.dialect ?? 'ar');
  if (['event_day', 'completed', 'archived'].includes(phase)) return [
    { label: w.ovArrived, value: c.checkedInPeople, unit: w.ovUnitPerson, tone: 'success', filter: 'checked_in' },
    { label: w.ovConfirmedFact, value: c.confirmedPeople, unit: w.ovUnitPerson, tone: 'neutral', filter: 'confirmed' },
    { label: phase === 'event_day' ? w.ovAwaiting : w.ovNotArrived, value: i.parties.reduce((n, p) => n + (p.rsvpStatus === 'confirmed' ? Math.max(0, (p.confirmedPartySize ?? 0) - p.checkedInCount) : 0), 0), unit: w.ovUnitPerson, tone: 'neutral', filter: 'confirmed' },
  ];
  return [
    { label: w.ovConfirmedFact, value: c.confirmedPeople, unit: w.ovUnitPerson, tone: 'success', filter: 'confirmed' },
    { label: w.ovPendingFact, value: c.pendingParties, unit: w.ovUnitInvitation, tone: 'neutral', filter: 'pending' },
    { label: w.ovListFact, value: c.parties, unit: w.ovUnitInvitation, tone: 'neutral', filter: 'all' },
  ];
}

export function rankAttention(items: AttentionItem[], i: OverviewInput): AttentionItem[] {
  const phase = eventPhase(i.event, i.now);
  if (phase === 'completed' || phase === 'archived') return items.filter(x => x.id === 'checkin_exceptions');
  const late = phase === 'event_day' || phase === 'final_week';
  const priorities = late
    ? ['checkin_exceptions', 'over_allowed', 'over_capacity', 'unassigned', 'declined_assigned', 'unmatched', 'unpublished', 'failed', 'not_published', 'duplicates', 'missing_phone', 'pending']
    : ['not_published', 'unpublished', 'failed', 'over_allowed', 'unmatched', 'duplicates', 'missing_phone', 'over_capacity', 'declined_assigned', 'unassigned', 'pending'];
  return [...items].sort((a, b) => priorities.indexOf(a.id) - priorities.indexOf(b.id));
}
