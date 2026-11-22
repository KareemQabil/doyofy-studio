import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { allocatedGuests, amountPaid, assertGuestCapacity, capacityLevel, demoPaymentDeclineArmed, guestLimit, GuestLimitError, initializeGuestCapacity, PaymentDeclinedError, receiptsFor, recommendedPlan, setDemoPaymentDecline, simulateCapacityPayment, upgradeQuote } from '../../src/domain/billing';
before(() => {
  const memory = new Map<string, string>();
  (globalThis as unknown as { window: unknown }).window = { localStorage: { getItem: (k: string) => memory.get(k) ?? null, setItem: (k: string, v: string) => void memory.set(k, v) }, dispatchEvent() {} };
});
test('capacity counts companions, blocks writes above the limit and upgrades only one event', () => {
  assert.equal(allocatedGuests([{ maxPartySize: 5 }, { maxPartySize: 2 }]), 7);
  assert.doesNotThrow(() => assertGuestCapacity('a', [{ maxPartySize: 95 }], 5));
  assert.throws(() => assertGuestCapacity('a', [{ maxPartySize: 95 }], 6), e => e instanceof GuestLimitError && e.required === 101 && e.limit === 100 && e.additional === 6);
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

test('upgrading from a paid tier charges only the difference and keeps a demo receipt per purchase', () => {
  assert.deepEqual(upgradeQuote('tiers', 250), { limit: 250, price: 49, credit: 0, charge: 49 });
  const first = simulateCapacityPayment('tiers', 250, new Date('2026-11-01T10:00:00Z'));
  assert.equal(first.charged, 49); assert.equal(first.fromLimit, 100); assert.match(first.ref, /^DEMO-[0-9A-Z]+$/);
  assert.deepEqual(upgradeQuote('tiers', 500), { limit: 500, price: 89, credit: 49, charge: 40 });
  const second = simulateCapacityPayment('tiers', 500, new Date('2026-11-02T10:00:00Z'));
  assert.equal(second.charged, 40); assert.equal(second.credit, 49); assert.equal(second.price, 89); assert.equal(second.fromLimit, 250);
  assert.equal(amountPaid('tiers'), 89);
  assert.deepEqual(receiptsFor('tiers').map(r => r.limit), [500, 250], 'newest receipt first');
  assert.equal(receiptsFor('other-event').length, 0);
  assert.equal(upgradeQuote('tiers', 1000).charge, 149 - 89);
});
test('legacy capacity carried over from existing data is not a purchase: no receipt, full price later', () => {
  initializeGuestCapacity('legacy', [{ maxPartySize: 180 }]);
  assert.equal(guestLimit('legacy'), 250);
  assert.equal(receiptsFor('legacy').length, 0);
  assert.equal(upgradeQuote('legacy', 500).charge, 89);
});
test('a simulated decline is armed only by the prototype affordance and applies once', () => {
  assert.equal(demoPaymentDeclineArmed(), false);
  setDemoPaymentDecline(true);
  assert.throws(() => simulateCapacityPayment('decline', 250), e => e instanceof PaymentDeclinedError);
  assert.equal(guestLimit('decline'), 100); assert.equal(receiptsFor('decline').length, 0);
  assert.equal(demoPaymentDeclineArmed(), false);
  assert.equal(simulateCapacityPayment('decline', 250).charged, 49);
});
test('capacity warns calmly from 90% and distinguishes full from over', () => {
  assert.equal(capacityLevel(89, 100), 'ok');
  assert.equal(capacityLevel(90, 100), 'near');
  assert.equal(capacityLevel(100, 100), 'full');
  assert.equal(capacityLevel(101, 100), 'over');
  assert.equal(capacityLevel(449, 500), 'ok');
  assert.equal(capacityLevel(450, 500), 'near');
});
