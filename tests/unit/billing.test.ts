import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { allocatedGuests, assertGuestCapacity, guestLimit, GuestLimitError, recommendedPlan, simulateCapacityPayment } from '../../src/domain/billing';
before(() => {
  const memory = new Map<string, string>();
  (globalThis as unknown as { window: unknown }).window = { localStorage: { getItem: (k: string) => memory.get(k) ?? null, setItem: (k: string, v: string) => void memory.set(k, v) }, dispatchEvent() {} };
});
test('capacity counts companions, blocks writes above the limit and upgrades only one event', () => {
  assert.equal(allocatedGuests([{ maxPartySize: 5 }, { maxPartySize: 2 }]), 7);
  assert.doesNotThrow(() => assertGuestCapacity('a', [{ maxPartySize: 95 }], 5));
  assert.throws(() => assertGuestCapacity('a', [{ maxPartySize: 95 }], 6), e => e instanceof GuestLimitError && e.required === 101 && e.limit === 100);
  assert.equal(guestLimit('a'), 100);
  simulateCapacityPayment('a', recommendedPlan(101).limit);
  assert.equal(guestLimit('a'), 250);
  assert.equal(guestLimit('b'), 100);
  assert.doesNotThrow(() => assertGuestCapacity('a', [{ maxPartySize: 95 }], 6));
  assert.throws(() => simulateCapacityPayment('a', 99));
});
test('reducing an over-capacity list remains possible; large imports get enough capacity', () => {
  assert.doesNotThrow(() => assertGuestCapacity('b', [{ maxPartySize: 120 }], -1));
  assert.ok(recommendedPlan(1550).limit >= 1550);
});
test('a full browser store retains a successful demo upgrade in session memory', () => {
  const store = window.localStorage;
  const set = store.setItem;
  store.setItem = () => { throw new Error('QuotaExceededError'); };
  try {
    simulateCapacityPayment('full-store', 250);
    assert.equal(guestLimit('full-store'), 250);
    assert.doesNotThrow(() => assertGuestCapacity('full-store', [{ maxPartySize: 100 }], 1));
  } finally { store.setItem = set; }
});
