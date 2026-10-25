/**
 * Service contracts. Feature code depends ONLY on these interfaces (spec §3/§4).
 * Today they are implemented by the mock layer (services/mock/*) over a browser-persisted store;
 * a NestJS API client implements the same interfaces later — no feature/UI change required.
 *
 * Every method is async and may reject with an AppError (services/errors.ts).
 */
import type {
  CheckInException, CheckInRecord, CreateEventInput, Event, EventActivity, InvitationDesign, InvitationDesignContent,
  InvitationParty, PartyInput, RSVPResponse, RsvpInput, Table, UpdateEventInput, User,
} from '../domain/types';

export interface EventRepository {
  list(): Promise<Event[]>;
  get(id: string): Promise<Event>;
  create(input: CreateEventInput): Promise<Event>;
  update(id: string, input: UpdateEventInput): Promise<Event>;
  markCheckInPrepared(id: string): Promise<Event>;
  archive(id: string): Promise<Event>;
  restore(id: string): Promise<Event>;
}

export interface InvitationRepository {
  /** null = no design yet */
  get(eventId: string): Promise<InvitationDesign | null>;
  saveDraft(eventId: string, content: InvitationDesignContent): Promise<InvitationDesign>;
  publish(eventId: string): Promise<InvitationDesign>;
}

export type ShareHow = 'manual' | 'link_copied';

export interface PartyRepository {
  list(eventId: string): Promise<InvitationParty[]>;
  get(id: string): Promise<InvitationParty>;
  create(eventId: string, input: PartyInput): Promise<InvitationParty>;
  update(id: string, input: Partial<PartyInput>): Promise<InvitationParty>;
  remove(id: string): Promise<void>;
  importMany(eventId: string, inputs: PartyInput[], meta: { skipped: number; source: string }): Promise<InvitationParty[]>;
  /** organizer shared the link themselves (copy / share sheet / "contacted manually") */
  markShared(ids: string[], how: ShareHow): Promise<void>;
  /** prototype stand-in for WhatsApp sending: numbers that are missing/invalid fail (simulated) */
  simulateSend(ids: string[]): Promise<{ sent: string[]; failed: string[] }>;
  sendReminder(ids: string[]): Promise<number>;
}

export interface RsvpRepository {
  listResponses(eventId: string): Promise<RSVPResponse[]>;
  /** organizer records a reply they received by phone etc. */
  setByOrganizer(partyId: string, input: RsvpInput): Promise<InvitationParty>;
  /** general-link replies */
  matchResponse(responseId: string, partyId: string): Promise<void>;
  addPartyFromResponse(responseId: string): Promise<InvitationParty>;
  dismissResponse(responseId: string): Promise<void>;
}

export interface SeatingRepository {
  listTables(eventId: string): Promise<Table[]>;
  createTables(eventId: string, tables: Array<{ name: string; capacity: number }>): Promise<Table[]>;
  updateTable(id: string, patch: { name?: string; capacity?: number }): Promise<Table>;
  /** parties at the table become unassigned */
  deleteTable(id: string): Promise<void>;
  assign(partyId: string, tableId: string | null): Promise<InvitationParty>;
}

export interface CheckInContext {
  method: 'qr' | 'search'; by: string; exceptions: CheckInException[]; staffNote?: string;
  /** optional: one key per staff confirmation, reused on retry, so a retried request never counts twice.
   *  Ignored by the mock; the remote adapter (services/remote) generates one when absent. */
  idempotencyKey?: string;
}

export interface CheckInRepository {
  list(eventId: string): Promise<CheckInRecord[]>;
  findByCode(eventId: string, code: string): Promise<InvitationParty | null>;
  checkIn(partyId: string, count: number, ctx: CheckInContext): Promise<{ party: InvitationParty; record: CheckInRecord }>;
  undo(recordId: string): Promise<InvitationParty>;
}

export interface ActivityRepository {
  list(eventId: string, limit?: number): Promise<EventActivity[]>;
}

// ------------------------------------------------------------------ public guest API (no account)
export interface GuestParty {
  code: string;
  name: string;
  maxPartySize: number;
  rsvpStatus: InvitationParty['rsvpStatus'];
  confirmedPartySize?: number;
  companionNames?: string[];
  guestNote?: string;
  tableName?: string;          // only when the organizer reveals tables
  checkedInCount: number;
}
export interface GuestView {
  event: Pick<Event, 'id' | 'slug' | 'type' | 'title' | 'names' | 'date' | 'time' | 'timeZone' | 'durationHours' | 'venue'>;
  design: InvitationDesignContent;
  party: GuestParty | null;
  canEdit: boolean;            // replies can change until the event starts
  /** RSVP allowance: the party's size, or the event default on the general link */
  maxGuests: number;
  phase: 'before' | 'event_day' | 'after';
}
export interface GuestRsvpInput extends RsvpInput { name?: string }

export interface GuestApi {
  /** records "opened" for personal links (not for organizer previews) */
  open(slug: string, code?: string): Promise<GuestView>;
  submitRsvp(slug: string, code: string | null, input: GuestRsvpInput): Promise<GuestView & { responseId: string }>;
}

// ------------------------------------------------------------------ session / prototype plumbing
export interface SessionService {
  currentUser(): User;
}
export interface Clock { now(): Date }

export interface Services {
  events: EventRepository;
  invitations: InvitationRepository;
  parties: PartyRepository;
  rsvp: RsvpRepository;
  seating: SeatingRepository;
  checkIn: CheckInRepository;
  activity: ActivityRepository;
  guest: GuestApi;
  session: SessionService;
  clock: Clock;
  /** cache invalidation channel: fires after any data change (local or other tab) */
  onChange(fn: () => void): () => void;
}
