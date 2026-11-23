/**
 * Service container. `createServices()` is the ONE place that decides which implementation the
 * app talks to. Swap the mock for an API client here when the NestJS backend exists.
 */
import { demoProfileName } from '../domain/account';
import { initializeGuestCapacity } from '../domain/billing';
import type { Services } from './contracts';
import { MockStore, type PrototypeSettings, type ScenarioId } from './mock/store';
import { buildSeed, DEMO_SLUGS } from './mock/seed';
import { mockActivity, mockCheckIn, mockEvents, mockGuest, mockInvitations, mockParties, mockRsvp, mockSeating } from './mock/repositories';
import { CloudState } from './cloud/state';
import { startCloudSync } from './cloud/sync';
import { withRemoteFallback } from './cloud/guest';

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

/**
 * A short guest link (/i/<public slug>[/<code>]) that this prototype's demo data does not contain: on a device with no
 * organizer data it is a guest's own visit, answered by the backend (services/cloud/guest.ts), so nothing is seeded either.
 */
export function isRemoteGuestEntry(loc: Pick<Location, 'pathname' | 'search' | 'hash'> | undefined = typeof location === 'undefined' ? undefined : location): boolean {
  if (!loc) return false;
  const route = loc.hash.startsWith('#/') ? loc.hash.slice(1) : loc.pathname;
  const slug = /^\/i\/([^/?]+)(\/[^/?]+)?\/?(\?.*)?$/.exec(route)?.[1];
  return !!slug && !DEMO_SLUGS.includes(decodeURIComponent(slug));
}

export function createServices(opts: { seedDemo?: boolean } = {}): { services: Services; prototype: PrototypeControls } {
  const guestVisit = isPortableGuestEntry() || isRemoteGuestEntry();
  const store = new MockStore(buildSeed, { seedDemo: opts.seedDemo ?? !guestVisit });
  for (const event of store.read().events) initializeGuestCapacity(event.id, store.read().parties.filter(p => p.eventId === event.id));
  const now = () => store.now();
  const ctx = { store, now };
  // the organizer's device syncs with the backend (when one is connected); a guest's visit never does
  const cloud = new CloudState(store.storage);
  if (!guestVisit && typeof window !== 'undefined') startCloudSync(store, cloud);
  const services: Services = {
    events: mockEvents(ctx),
    invitations: mockInvitations(ctx),
    parties: mockParties(ctx),
    rsvp: mockRsvp(ctx),
    seating: mockSeating(ctx),
    checkIn: mockCheckIn(ctx),
    activity: mockActivity(ctx),
    guest: withRemoteFallback(mockGuest(ctx)),
    session: {
      currentUser: () => store.settings.role === 'organizer'
        ? { id: 'usr_owner', name: demoProfileName() || 'نورة', role: 'organizer' }
        : store.settings.role === 'caterer'
          ? { id: 'usr_caterer', name: demoProfileName() || 'فريق الضيافة', role: 'caterer' }
          : { id: 'usr_coord', name: demoProfileName() || 'منسقة الحفل', role: 'coordinator' },
    },
    clock: { now },
    cloud,
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
