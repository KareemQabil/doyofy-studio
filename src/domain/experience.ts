/** Presentation decisions derived from domain state; never persisted as a second source of truth. */
import type { Event, InvitationParty, PublishState } from './types';
import { eventPhase, eventTypeInfo } from './event';
import { countParties } from './parties';
import type { AttentionItem, OverviewInput } from './overview';

export type JourneyStage = 'prepare' | 'invite' | 'arrange' | 'welcome' | 'remember';
export const JOURNEY = [
  { id: 'prepare', label: 'التجهيز' }, { id: 'invite', label: 'الدعوات' },
  { id: 'arrange', label: 'الترتيبات' }, { id: 'welcome', label: 'الاستقبال' },
  { id: 'remember', label: 'الذكريات' },
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

export function occasionAction(type: Event['type'] | null): string {
  return type ? `ابدأ تجهيز ${eventTypeInfo(type).label}` : 'اختر مناسبتك للمتابعة';
}

/** A calm summary uses people for attendance and invitations for unanswered replies. */
export function overviewFacts(i: OverviewInput) {
  const c = countParties(i.parties);
  const phase = eventPhase(i.event, i.now);
  if (['event_day', 'completed', 'archived'].includes(phase)) return [
    { label: 'وصلوا', value: c.checkedInPeople, unit: 'شخص', tone: 'success', filter: 'checked_in' },
    { label: 'أكدوا الحضور', value: c.confirmedPeople, unit: 'شخص', tone: 'neutral', filter: 'confirmed' },
    { label: phase === 'event_day' ? 'ننتظر وصولهم' : 'لم يُسجَّل وصولهم', value: i.parties.reduce((n, p) => n + (p.rsvpStatus === 'confirmed' ? Math.max(0, (p.confirmedPartySize ?? 0) - p.checkedInCount) : 0), 0), unit: 'شخص', tone: 'neutral', filter: 'confirmed' },
  ];
  return [
    { label: 'أكدوا الحضور', value: c.confirmedPeople, unit: 'شخص', tone: 'success', filter: 'confirmed' },
    { label: 'بانتظار الرد', value: c.pendingParties, unit: 'دعوة', tone: 'neutral', filter: 'pending' },
    { label: 'قائمة ضيوفك', value: c.parties, unit: 'دعوة', tone: 'neutral', filter: 'all' },
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
