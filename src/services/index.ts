/**
 * Service container. `createServices()` is the ONE place that decides which implementation the
 * app talks to. Swap the mock for an API client here when the NestJS backend exists.
 */
import { demoProfileName } from '../domain/account';
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

export function createServices(): { services: Services; prototype: PrototypeControls } {
  const store = new MockStore(buildSeed);
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
