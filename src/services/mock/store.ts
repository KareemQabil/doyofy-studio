/**
 * The mock "server": collections persisted in browser storage, with simulated latency, an
 * optional offline mode (to show error states) and change notifications. Other tabs see changes
 * through the `storage` event — so a guest RSVP in one tab updates the organizer's tab live.
 *
 * Only services/mock/* may touch this. Screens never call storage (spec §4).
 */
import type { CheckInRecord, Event, EventActivity, InvitationDesign, InvitationParty, RSVPResponse, Table } from '../../domain/types';
import { AppError } from '../errors';
import { resolveDesign } from '../../domain/invitation';

export interface DbShape {
  version: 1;
  scenario: ScenarioId;
  seededAt: string;
  events: Event[];
  designs: InvitationDesign[];
  parties: InvitationParty[];
  responses: RSVPResponse[];
  tables: Table[];
  checkIns: CheckInRecord[];
  activity: EventActivity[];
}

export type ScenarioId = 'before' | 'event_day';

export interface PrototypeSettings {
  latencyMs: number;
  offline: boolean;
  clockOffsetMs: number;
  role: 'organizer' | 'coordinator';
  /** organizer appearance: light · dark · follow the device (the invitation keeps its own palette) */
  appearance: import('../../domain/appearance').Appearance;
}

const DB_KEY = 'doyofy:db:v1';
const SETTINGS_KEY = 'doyofy:prototype:v1';
export const DEFAULT_SETTINGS: PrototypeSettings = { latencyMs: 180, offline: false, clockOffsetMs: 0, role: 'organizer', appearance: 'light' };

function safeStorage(): Storage | null {
  try {
    const s = window.localStorage;
    const k = '__doyofy_probe__';
    s.setItem(k, '1'); s.removeItem(k);
    return s;
  } catch { return null; }
}

export class MockStore {
  private db!: DbShape;
  private listeners = new Set<() => void>();
  readonly storage = safeStorage();
  settings: PrototypeSettings;

  constructor(private seed: (now: Date, scenario: ScenarioId) => DbShape) {
    // older builds stored a visual theme and a chooser variant; one identity remains, so those keys are dropped
    const { theme: _t, occasionChooser: _c, ...saved } = this.readJSON<Partial<PrototypeSettings> & { theme?: unknown; occasionChooser?: unknown }>(SETTINGS_KEY) ?? {};
    this.settings = { ...DEFAULT_SETTINGS, ...saved };
    const stored = this.readJSON<DbShape>(DB_KEY);
    if (stored && stored.version === 1) this.db = migrateFaces(stored);
    else this.reset('before');
    window.addEventListener('storage', (e) => {
      if (e.key === DB_KEY) { const d = this.readJSON<DbShape>(DB_KEY); if (d) { this.db = migrateFaces(d); this.emit(); } }
      if (e.key === SETTINGS_KEY) { this.settings = { ...DEFAULT_SETTINGS, ...this.readJSON<Partial<PrototypeSettings>>(SETTINGS_KEY) }; this.emit(); }
    });
  }

  get persistent(): boolean { return !!this.storage; }

  now(): Date { return new Date(Date.now() + this.settings.clockOffsetMs); }

  read(): Readonly<DbShape> { return this.db; }

  /** apply a change, persist, notify. The callback mutates a draft copy. */
  write<T>(fn: (db: DbShape) => T): T {
    const draft = structuredClone(this.db);
    const out = fn(draft);
    this.db = draft;
    this.persist();
    this.emit();
    return out;
  }

  reset(scenario: ScenarioId, clockOffsetMs?: number) {
    if (clockOffsetMs != null) this.updateSettings({ clockOffsetMs });
    this.db = this.seed(this.now(), scenario);
    this.persist();
    this.emit();
  }

  updateSettings(patch: Partial<PrototypeSettings>) {
    this.settings = { ...this.settings, ...patch };
    try { this.storage?.setItem(SETTINGS_KEY, JSON.stringify(this.settings)); } catch { /* quota/private mode */ }
    this.emit();
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  /** every repository call goes through here: latency + offline simulation */
  async request<T>(fn: () => T, kind: 'read' | 'write' = 'read'): Promise<T> {
    const ms = this.settings.latencyMs * (kind === 'write' ? 1.4 : 1) * (0.7 + Math.random() * 0.6);
    if (ms > 0) await new Promise((r) => setTimeout(r, ms));
    if (this.settings.offline) throw new AppError('network', 'لا يوجد اتصال الآن. لم يتم حفظ أي تغيير — أعد المحاولة بعد عودة الاتصال.');
    return fn();
  }

  private persist() {
    if (!this.storage) return;
    try { this.storage.setItem(DB_KEY, JSON.stringify(this.db)); }
    catch { /* storage full or blocked: keep working in memory */ }
  }

  private emit() { for (const l of [...this.listeners]) l(); }

  private readJSON<T>(key: string): T | null {
    try { const s = this.storage?.getItem(key); return s ? (JSON.parse(s) as T) : null; } catch { return null; }
  }
}

/** invitations saved before the single card family keep working: a retired face opens as its occasion's face */
function migrateFaces(db: DbShape): DbShape {
  for (const d of db.designs) {
    const type = db.events.find((e) => e.id === d.eventId)?.type;
    if (!type) continue;
    d.draft = resolveDesign(d.draft, type);
    if (d.published) d.published = resolveDesign(d.published, type);
  }
  return db;
}
