import type { InvitationParty } from './types';

/** Demo entitlement only. A production adapter must obtain this from the server. */
export const GUEST_PLANS = [{ limit: 100, price: 0 }, { limit: 250, price: 49 }, { limit: 500, price: 89 }, { limit: 1000, price: 149 }] as const;
const KEY = 'doyofy:guest-capacity:v1';
let memory: Record<string, number> = {};
function limits(): Record<string, number> {
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(KEY) || '{}');
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const saved = Object.fromEntries(Object.entries(raw).filter(([, n]) => typeof n === 'number' && Number.isSafeInteger(n) && n >= 100)) as Record<string, number>;
      // A quota-limited browser may still read stale persisted data after a successful session upgrade.
      return Object.fromEntries([...new Set([...Object.keys(saved), ...Object.keys(memory)])].map(id => [id, Math.max(saved[id] ?? 100, memory[id] ?? 100)]));
    }
  } catch { /* private browsers can complete the demo in this session */ }
  return memory;
}
export function guestLimit(eventId: string): number { return limits()[eventId] ?? 100; }
export function allocatedGuests(parties: readonly Pick<InvitationParty, 'maxPartySize'>[]): number { return parties.reduce((sum, p) => sum + p.maxPartySize, 0); }
/** Preserve existing demo data when introducing limits; new events keep the starter capacity. */
export function initializeGuestCapacity(eventId: string, current: readonly Pick<InvitationParty, 'maxPartySize'>[]): void {
  if (limits()[eventId] !== undefined) return;
  const used = allocatedGuests(current);
  if (used > 100) simulateCapacityPayment(eventId, recommendedPlan(used).limit);
}
export class GuestLimitError extends Error {
  constructor(readonly eventId: string, readonly required: number, readonly limit: number) {
    super(`هذه الإضافة تحتاج سعة ${required} ضيفًا، وحد المناسبة الحالي ${limit}. زِد السعة أو قلّل العدد.`);
    this.name = 'GuestLimitError';
  }
}
export function assertGuestCapacity(eventId: string, current: readonly Pick<InvitationParty, 'maxPartySize'>[], additional: number): void {
  if (additional <= 0) return;
  const required = allocatedGuests(current) + additional, limit = guestLimit(eventId);
  if (required > limit) throw new GuestLimitError(eventId, required, limit);
}
export function recommendedPlan(required: number): { limit: number; price: number } {
  return GUEST_PLANS.find(p => p.limit >= required && p.price > 0) ?? { limit: Math.ceil(required / 1000) * 1000, price: Math.ceil(required / 1000) * 149 };
}
export function simulateCapacityPayment(eventId: string, capacity: number): void {
  if (!Number.isSafeInteger(capacity) || capacity < guestLimit(eventId)) throw new Error('اختر سعة صحيحة أكبر من الحد الحالي.');
  memory = { ...limits(), [eventId]: capacity };
  try { window.localStorage.setItem(KEY, JSON.stringify(memory)); } catch { /* session memory remains usable */ }
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') window.dispatchEvent(new Event('doyofy:capacity'));
}
