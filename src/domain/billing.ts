import type { InvitationParty } from './types';
import { plural, P } from './format';

/** Demo entitlement only. A production adapter must obtain this from the server. */
export const GUEST_PLANS = [{ limit: 100, price: 0 }, { limit: 250, price: 49 }, { limit: 500, price: 89 }, { limit: 1000, price: 149 }] as const;
export const FREE_GUEST_LIMIT = 100;
/** Share of the capacity at which the organizer is warned, before the limit blocks a write. */
export const CAPACITY_WARNING_RATIO = 0.9;
const KEY = 'doyofy:guest-capacity:v1';
const RECEIPTS_KEY = 'doyofy:guest-receipts:v1';
const DECLINE_KEY = 'doyofy:pay-decline';
let memory: Record<string, number> = {};
let receiptMemory: Receipt[] = [];

/** A demo receipt: nothing is charged; the reference only identifies the simulated purchase. */
export interface Receipt {
  ref: string; eventId: string; at: string;
  fromLimit: number; limit: number;
  /** full price of the new capacity, what earlier receipts already covered, and the difference charged now */
  price: number; credit: number; charged: number;
}
export interface UpgradeQuote { limit: number; price: number; credit: number; charge: number }

function limits(): Record<string, number> {
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(KEY) || '{}');
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const saved = Object.fromEntries(Object.entries(raw).filter(([, n]) => typeof n === 'number' && Number.isSafeInteger(n) && n >= FREE_GUEST_LIMIT)) as Record<string, number>;
      // A quota-limited browser may still read stale persisted data after a successful session upgrade.
      return Object.fromEntries([...new Set([...Object.keys(saved), ...Object.keys(memory)])].map(id => [id, Math.max(saved[id] ?? FREE_GUEST_LIMIT, memory[id] ?? FREE_GUEST_LIMIT)]));
    }
  } catch { /* private browsers can complete the demo in this session */ }
  return memory;
}
function storedReceipts(): Receipt[] {
  let saved: Receipt[] = [];
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(RECEIPTS_KEY) || '[]');
    if (Array.isArray(raw)) saved = raw.filter((r): r is Receipt => !!r && typeof r === 'object' && typeof (r as Receipt).ref === 'string' && typeof (r as Receipt).eventId === 'string' && Number.isFinite((r as Receipt).charged));
  } catch { /* session memory below */ }
  const known = new Set(saved.map(r => r.ref));
  return [...saved, ...receiptMemory.filter(r => !known.has(r.ref))];
}
export function guestLimit(eventId: string): number { return limits()[eventId] ?? FREE_GUEST_LIMIT; }
export function allocatedGuests(parties: readonly Pick<InvitationParty, 'maxPartySize'>[]): number { return parties.reduce((sum, p) => sum + p.maxPartySize, 0); }
export type CapacityLevel = 'ok' | 'near' | 'full' | 'over';
/** Calm, proactive state for meters and forms: `near` from 90% of the limit, `full` when nothing is left. */
export function capacityLevel(used: number, limit: number): CapacityLevel {
  return used > limit ? 'over' : used === limit ? 'full' : used >= Math.ceil(limit * CAPACITY_WARNING_RATIO) ? 'near' : 'ok';
}
/** Preserve existing demo data when introducing limits; new events keep the starter capacity. No receipt: nothing was bought. */
export function initializeGuestCapacity(eventId: string, current: readonly Pick<InvitationParty, 'maxPartySize'>[]): void {
  if (limits()[eventId] !== undefined) return;
  const used = allocatedGuests(current);
  if (used > FREE_GUEST_LIMIT) grant(eventId, recommendedPlan(used).limit);
}
export class GuestLimitError extends Error {
  readonly additional: number;
  constructor(readonly eventId: string, readonly required: number, readonly limit: number, additional = 0) {
    super(`لم تكتمل العملية: تحتاج ${plural(required, P.person)} وحد مناسبتك ${plural(limit, P.person)} (يشمل المرافقين). زِد السعة لإكمالها، أو قلّل العدد.`);
    this.name = 'GuestLimitError';
    this.additional = additional;
  }
}
export function assertGuestCapacity(eventId: string, current: readonly Pick<InvitationParty, 'maxPartySize'>[], additional: number): void {
  if (additional <= 0) return;
  const required = allocatedGuests(current) + additional, limit = guestLimit(eventId);
  if (required > limit) throw new GuestLimitError(eventId, required, limit, additional);
}
export function recommendedPlan(required: number): { limit: number; price: number } {
  return GUEST_PLANS.find(p => p.limit >= required && p.price > 0) ?? { limit: Math.ceil(required / 1000) * 1000, price: Math.ceil(required / 1000) * 149 };
}
/** Full demo price of a capacity: a listed tier, or 149 per started thousand beyond the largest tier. */
export function planPrice(limit: number): number {
  return GUEST_PLANS.find(p => p.limit === limit)?.price ?? Math.ceil(limit / 1000) * 149;
}
/** every demo receipt on this device, newest first (the account's payments list) */
export function allReceipts(): Receipt[] { return storedReceipts().sort((a, b) => b.at.localeCompare(a.at)); }
export function receiptsFor(eventId: string): Receipt[] {
  return storedReceipts().filter(r => r.eventId === eventId).sort((a, b) => b.at.localeCompare(a.at));
}
/** What this event's receipts already paid for; upgrading again charges only the difference. */
export function amountPaid(eventId: string): number { return receiptsFor(eventId).reduce((sum, r) => sum + r.charged, 0); }
export function upgradeQuote(eventId: string, limit: number): UpgradeQuote {
  const price = planPrice(limit), credit = Math.min(price, amountPaid(eventId));
  return { limit, price, credit, charge: price - credit };
}

/**
 * Prototype/test affordance, never shown in the product checkout: the next demo payment is declined once.
 * Armed from the prototype tools panel, or by opening a page with `?pay=decline`.
 */
let declineArmed = false, urlDeclineUsed = false;
function urlAsksDecline(): boolean {
  try { return !urlDeclineUsed && new URLSearchParams(window.location?.search ?? '').get('pay') === 'decline'; } catch { return false; }
}
export function demoPaymentDeclineArmed(): boolean {
  try { if (window.sessionStorage?.getItem(DECLINE_KEY) === '1') return true; } catch { /* memory flag below */ }
  return declineArmed || urlAsksDecline();
}
export function setDemoPaymentDecline(on: boolean): void {
  declineArmed = on;
  if (!on) urlDeclineUsed = true;
  try { if (on) window.sessionStorage?.setItem(DECLINE_KEY, '1'); else window.sessionStorage?.removeItem(DECLINE_KEY); } catch { /* memory flag is enough */ }
}
export class PaymentDeclinedError extends Error {
  constructor() { super('رُفضت عملية الدفع التجريبية. لم تتغير السعة أو قائمة الضيوف.'); this.name = 'PaymentDeclinedError'; }
}

function grant(eventId: string, capacity: number): void {
  memory = { ...limits(), [eventId]: capacity };
  try { window.localStorage.setItem(KEY, JSON.stringify(memory)); } catch { /* session memory remains usable */ }
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') window.dispatchEvent(new Event('doyofy:capacity'));
}
const demoRef = (at: Date) => `DEMO-${at.getTime().toString(36).toUpperCase().slice(-6)}${Math.floor(Math.random() * 36 ** 2).toString(36).toUpperCase().padStart(2, '0')}`;
/** Simulated purchase: raises the event's capacity, charges only the difference, and returns its demo receipt. */
export function simulateCapacityPayment(eventId: string, capacity: number, at: Date = new Date()): Receipt {
  const fromLimit = guestLimit(eventId);
  if (!Number.isSafeInteger(capacity) || capacity < fromLimit) throw new Error('اختر سعة صحيحة أكبر من الحد الحالي.');
  if (demoPaymentDeclineArmed()) { setDemoPaymentDecline(false); throw new PaymentDeclinedError(); }
  const quote = upgradeQuote(eventId, capacity);
  const receipt: Receipt = { ref: demoRef(at), eventId, at: at.toISOString(), fromLimit, limit: capacity, price: quote.price, credit: quote.credit, charged: quote.charge };
  receiptMemory = [...receiptMemory, receipt];
  try { window.localStorage.setItem(RECEIPTS_KEY, JSON.stringify([...storedReceipts()])); } catch { /* kept in session memory */ }
  grant(eventId, capacity);
  return receipt;
}
