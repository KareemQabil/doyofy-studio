/**
 * Service container. `createServices()` is the ONE place that decides which implementation the
 * app talks to. Swap the mock for an API client here when the NestJS backend exists.
 */
import { demoProfileName } from '../domain/account';
import { initializeGuestCapacity } from '../domain/billing';
import type { Services } from './contracts';
import { MockStore, type PrototypeSettings, type ScenarioId } from './mock/store';
import { buildSeed } from './mock/seed';
import { mockActivity, mockCheckIn, mockEvents, mockGuest, mockInvitations, mockParties, mockRsvp, mockSeating } from './mock/repositories';

export interface PrototypeControls {
  settings(): PrototypeSettings;
  update(patch: Partial<PrototypeSettings>): void;
  reset(scenario: ScenarioId): void;
  scenario(): ScenarioId;
  persistent(): boolean;
  /** called after any prototype or data change */
  subscribe(fn: () => void): () => void;
}

/**
 * A guest link that carries its own invitation (/i/<slug>[/<code>]?d=…, history or hash routing). It needs nothing from
 * the organizer's store, so a guest's device is never seeded with the demo organizer's events, guest list and phone numbers.
 */
export function isPortableGuestEntry(loc: Pick<Location, 'pathname' | 'search' | 'hash'> | undefined = typeof location === 'undefined' ? undefined : location): boolean {
  if (!loc) return false;
  const route = loc.hash.startsWith('#/') ? loc.hash.slice(1) : `${loc.pathname}${loc.search}`;
  const [path = '', query = ''] = route.split('?');
  return /^\/i\/[^/]+(\/[^/]+)?\/?$/.test(path) && new URLSearchParams(query).has('d');
}

export function createServices(opts: { seedDemo?: boolean } = {}): { services: Services; prototype: PrototypeControls } {
  const store = new MockStore(buildSeed, { seedDemo: opts.seedDemo ?? !isPortableGuestEntry() });
  for (const event of store.read().events) initializeGuestCapacity(event.id, store.read().parties.filter(p => p.eventId === event.id));
  const now = () => store.now();
  const ctx = { store, now };
  const services: Services = {
    events: mockEvents(ctx),
    invitations: mockInvitations(ctx),
    parties: mockParties(ctx),
    rsvp: mockRsvp(ctx),
    seating: mockSeating(ctx),
    checkIn: mockCheckIn(ctx),
    activity: mockActivity(ctx),
    guest: mockGuest(ctx),
    session: {
      currentUser: () => store.settings.role === 'organizer'
        ? { id: 'usr_owner', name: demoProfileName() || 'نورة', role: 'organizer' }
        : store.settings.role === 'caterer'
          ? { id: 'usr_caterer', name: demoProfileName() || 'فريق الضيافة', role: 'caterer' }
          : { id: 'usr_coord', name: demoProfileName() || 'منسقة الحفل', role: 'coordinator' },
    },
    clock: { now },
    onChange: (fn) => store.subscribe(fn),
  };
  const prototype: PrototypeControls = {
    settings: () => store.settings,
    update: (patch) => store.updateSettings(patch),
    reset: (scenario) => store.reset(scenario, 0),
    scenario: () => store.read().scenario,
    persistent: () => store.persistent,
    subscribe: (fn) => store.subscribe(fn),
  };
  return { services, prototype };
}

export type { Services } from './contracts';
