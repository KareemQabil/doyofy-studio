/** Presentation decisions derived from domain state; never persisted as a second source of truth. */
import type { Event, InvitationParty } from './types';
import { eventPhase, eventTypeInfo } from './event';
import { countParties } from './parties';
import type { AttentionItem, OverviewInput } from './overview';
import { copyFor, countOf, fill, type Dialect, type Noun } from './copy';

export type JourneyStage = 'prepare' | 'invite' | 'arrange' | 'welcome' | 'remember';
/** the stages in order; t(labelKey) gives each one's name */
export const JOURNEY = [
  { id: 'prepare', labelKey: 'jrPrepare' }, { id: 'invite', labelKey: 'jrInvite' },
  { id: 'arrange', labelKey: 'jrArrange' }, { id: 'welcome', labelKey: 'jrWelcome' },
  { id: 'remember', labelKey: 'jrRemember' },
] as const;

export function journeyStage(event: Event, parties: readonly InvitationParty[], now: Date): JourneyStage {
  const phase = eventPhase(event, now);
  if (phase === 'completed' || phase === 'archived') return 'remember';
  if (phase === 'event_day') return 'welcome';
  if (!parties.length) return 'prepare';
  const c = countParties(parties);
  if (phase === 'final_week' || (c.pendingParties === 0 && c.notShared + c.failed === 0)) return 'arrange';
  return 'invite';
}

export function occasionAction(type: Event['type'] | null, dialect: Dialect = 'ar'): string {
  const c = copyFor(dialect);
  return type ? fill(c.ovStartOccasion, { type: eventTypeInfo(type).label }) : c.ovChooseOccasion;
}

/**
 * A fact's counted word in the voice, so the number reads as Arabic counts do: 3 → «3 دعوات», 11 → «11 دعوة».
 * One and two are words of their own («دعوة واحدة», «دعوتان») and come back `spelled`; zero is the bare number.
 */
export function factCount(dialect: Dialect, n: number, noun: Noun): { unit: string; spelled?: string } {
  if (n === 0) return { unit: '' };
  const s = countOf(dialect, n, noun);
  const m = s.match(/^\d+\s+(.+)$/);
  return m ? { unit: m[1]! } : { unit: '', spelled: s };
}

/**
 * A calm summary uses people for attendance and invitations for unanswered replies. «بانتظار الرد» counts only
 * invitations that went out (an unsent one cannot be answered — it is the next action's job, not a reply to wait for).
 */
export function overviewFacts(i: OverviewInput) {
  const c = countParties(i.parties);
  const phase = eventPhase(i.event, i.now);
  const d = i.dialect ?? 'ar', w = copyFor(d);
  const fact = (label: string, value: number, noun: Noun, tone: string, filter: string) => ({ label, value, ...factCount(d, value, noun), tone, filter });
  if (['event_day', 'completed', 'archived'].includes(phase)) return [
    fact(w.ovArrived, c.checkedInPeople, 'person', 'success', 'checked_in'),
    fact(w.ovConfirmedFact, c.confirmedPeople, 'person', 'neutral', 'confirmed'),
    fact(phase === 'event_day' ? w.ovAwaiting : w.ovNotArrived, i.parties.reduce((n, p) => n + (p.rsvpStatus === 'confirmed' ? Math.max(0, (p.confirmedPartySize ?? 0) - p.checkedInCount) : 0), 0), 'person', 'neutral', 'confirmed'),
  ];
  return [
    fact(w.ovConfirmedFact, c.confirmedPeople, 'person', 'success', 'confirmed'),
    fact(w.ovPendingFact, c.awaitingReply, 'invitation', 'neutral', 'pending'),
    fact(w.ovListFact, c.parties, 'invitation', 'neutral', 'all'),
  ];
}

export function rankAttention(items: AttentionItem[], i: OverviewInput): AttentionItem[] {
  const phase = eventPhase(i.event, i.now);
  if (phase === 'completed' || phase === 'archived') return items.filter(x => x.id === 'checkin_exceptions');
  const late = phase === 'event_day' || phase === 'final_week';
  const priorities = late
    ? ['checkin_exceptions', 'over_allowed', 'over_capacity', 'unassigned', 'declined_assigned', 'unmatched', 'failed', 'duplicates', 'missing_phone', 'pending']
    : ['failed', 'over_allowed', 'unmatched', 'duplicates', 'missing_phone', 'over_capacity', 'declined_assigned', 'unassigned', 'pending'];
  return [...items].sort((a, b) => priorities.indexOf(a.id) - priorities.indexOf(b.id));
}
