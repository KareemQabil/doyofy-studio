/**
 * Doyofy domain entities (prototype level). No React, no storage, no styling here.
 * The unit of guest management is the InvitationParty — one invitation that may cover one person,
 * a couple or a family (spec §12). Current state lives on the party; history lives in
 * RSVPResponse / CheckInRecord / EventActivity.
 */

export type ISODateTime = string; // 2026-10-04T18:30:00.000Z
export type LocalDate = string;   // 2026-10-13 (in the event's time zone)
export type LocalTime = string;   // 20:30

// ------------------------------------------------------------------ users / session (mock auth)
export type Role = 'organizer' | 'coordinator';
export interface User {
  id: string;
  name: string;
  role: Role;
}

// ------------------------------------------------------------------ event
export type EventType =
  | 'wedding' | 'engagement' | 'katb_kitab' | 'henna'
  | 'birthday' | 'graduation' | 'newborn'
  | 'family' | 'iftar'
  | 'conference' | 'opening' | 'corporate'
  | 'other';

export interface Venue {
  name: string;        // Arabic display name
  city: string;
  nameEn?: string;
  cityEn?: string;
  mapUrl?: string;
}

/** Who the event is for. Couple events use both names; others use `a` only. */
export interface EventNames {
  a: string;
  b?: string;
  aEn?: string;
  bEn?: string;
}

export interface EventSettings {
  /** default allowed party size for new guests */
  defaultPartySize: number;
  /** guests see their table in the event hub once the organizer allows it */
  revealTableToGuests: boolean;
  /** a single public link (no party identity) is allowed; replies then need matching */
  allowGeneralLink: boolean;
}

export interface EventDetails {
  type: EventType;
  title: string;
  names: EventNames;
  date: LocalDate;
  time: LocalTime;
  timeZone: string;
  durationHours: number;
  venue: Venue;
}

export interface Event extends EventDetails {
  id: string;
  ownerId: string;
  slug: string;           // short guest link: /i/<slug>
  settings: EventSettings;
  checkInPreparedAt?: ISODateTime;
  /** what guests are asked beyond attending (meals, dietary needs) and the wishlist they see; absent = all off */
  guestExperience?: GuestExperience;
  archivedAt?: ISODateTime;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export type CreateEventInput = Pick<EventDetails, 'type' | 'names' | 'date' | 'time' | 'venue'> & { title?: string; timeZone?: string };
export type UpdateEventInput = Partial<EventDetails> & { settings?: Partial<EventSettings> };

// ------------------------------------------------------------------ guest experience (meals, dietary, wishlist)
/** a menu choice the host defines (fish, meat…). Never deleted once answered: archived, so old answers keep their meaning. */
export interface MealOption { id: string; label: string; archived?: boolean }
/** allergies and diets are different things (D09): an allergy is a risk to follow up, a diet is a requirement to cater */
export type DietaryNeed = 'nuts' | 'dairy' | 'gluten' | 'eggs' | 'seafood' | 'halal' | 'vegetarian' | 'vegan' | 'other';
export type GiftKind = 'gift' | 'contribution' | 'flowers';
/** a wish with an external link (D14). No payment state: opening the link proves nothing (D16). */
export interface GiftItem {
  id: string;
  kind: GiftKind;
  title: string;
  note?: string;
  url?: string;
  linkLabel?: string;
  archived?: boolean;
}
export interface GuestExperience {
  /** bumps on every saved change; a reply carries the revision it was answered against */
  revision: number;
  meals: { enabled: boolean; required: boolean; options: MealOption[] };
  dietary: { enabled: boolean };
  /** enabled = wishlist on the guest page whatever the reply; afterDecline = offered gently right after a decline */
  gifts: { enabled: boolean; afterDecline: boolean; intro?: string; items: GiftItem[] };
}
/** people per menu choice inside one reply (D08): a family of 4 can be 2 meat + 1 fish + 1 vegetarian */
export interface MealAllocation { optionId: string; count: number }
export interface DietaryAnswer {
  /** false = the question was not answered; true with no needs = "nothing to note" (T31) */
  answered: boolean;
  needs: DietaryNeed[];
  /** how many of the party it concerns, when the guest says; absent = unknown, never zero */
  affectedCount?: number;
  note?: string;
}

// ------------------------------------------------------------------ invitation design
export type Dimension = '3d' | '2d';
export type Motion = 'animated' | 'static';

export interface ProgramItem { time: LocalTime; ar: string; en: string }

/** Everything about the invitation that is NOT event data. Event data (date, venue…) is merged in at render time. */
export interface InvitationDesignContent {
  experience: { dimension: Dimension; motion: Motion };
  cardId: string;
  sceneId: string;
  /** names as printed on the card; empty = use the event's names */
  displayNames: { a?: string; b?: string; aEn?: string; bEn?: string };
  message: { ar: string; en: string };
  program: ProgramItem[];
}

export interface InvitationDesign {
  id: string;
  eventId: string;
  draft: InvitationDesignContent;
  draftSavedAt: ISODateTime;
  /** snapshot guests see; absent until first publish */
  published?: InvitationDesignContent;
  publishedAt?: ISODateTime;
}

export type PublishState = 'none' | 'draft' | 'published' | 'changed';

// ------------------------------------------------------------------ guests
/** platform delivery state as stored; `draft`/`ready` are derived from the invitation's publish state */
export type DeliveryStatus = 'not_shared' | 'shared' | 'opened' | 'failed';
/** spec §12/§13 states as shown to the organizer */
export type InvitationStatus = 'draft' | 'ready' | 'shared' | 'opened' | 'failed';
/** who knows the state: the platform saw it, the organizer marked it, or the prototype simulated it */
export type StateSource = 'platform' | 'manual' | 'simulated';

export type RsvpStatus = 'pending' | 'confirmed' | 'declined';
export type CheckInStatus = 'not_arrived' | 'partial' | 'checked_in';

export interface Delivery {
  status: DeliveryStatus;
  source?: StateSource;
  at?: ISODateTime;
  openedAt?: ISODateTime;
  reminderAt?: ISODateTime;
  failureReason?: 'missing_phone' | 'invalid_phone' | 'not_delivered';
}

export interface InvitationParty {
  id: string;
  eventId: string;
  code: string;                 // personal link + QR code
  primaryGuestName: string;
  phone?: string;               // normalised E.164 (+9665…), may be absent
  maxPartySize: number;
  companionNames?: string[];
  notes?: string;
  side?: string;                // optional grouping label (أهل العريس…)
  delivery: Delivery;
  rsvpStatus: RsvpStatus;
  confirmedPartySize?: number;
  respondedAt?: ISODateTime;
  guestNote?: string;           // the guest's own note from the RSVP
  meals?: MealAllocation[];     // active answer; cleared on decline
  dietary?: DietaryAnswer;
  experienceRevision?: number;  // policy revision the active answer was given against
  tableId?: string;
  checkInStatus: CheckInStatus;
  checkedInCount: number;
  source: 'manual' | 'import' | 'seed' | 'general_link';
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface PartyInput {
  primaryGuestName: string;
  phone?: string;
  maxPartySize: number;
  companionNames?: string[];
  notes?: string;
  side?: string;
}

// ------------------------------------------------------------------ RSVP
export type RsvpChannel = 'guest_link' | 'general_link' | 'organizer';
export interface RSVPResponse {
  id: string;
  eventId: string;
  partyId?: string;             // absent = reply through the general link, not yet matched
  name: string;
  attending: boolean;
  count: number;
  companionNames?: string[];
  note?: string;
  meals?: MealAllocation[];
  dietary?: DietaryAnswer;
  experienceRevision?: number;
  channel: RsvpChannel;
  at: ISODateTime;
  /** for unmatched general-link replies */
  resolution?: 'matched' | 'added' | 'dismissed';
}
export interface RsvpInput {
  attending: boolean;
  count: number;
  companionNames?: string[];
  note?: string;
  meals?: MealAllocation[];
  dietary?: DietaryAnswer;
  /** the policy revision the guest saw; a changed policy that invalidates the answer is a conflict, not a silent swap */
  expectedExperienceRevision?: number;
}

// ------------------------------------------------------------------ seating
export interface Table {
  id: string;
  eventId: string;
  name: string;
  capacity: number;
  order: number;
}
/** prototype: a party sits at one table; the assignment is `party.tableId` (one place of truth) */
export interface SeatAssignment {
  partyId: string;
  tableId: string;
  seats: number;
}

// ------------------------------------------------------------------ check-in
export type CheckInException =
  | 'declined_arrived'
  | 'pending_arrived'
  | 'over_confirmed'
  | 'over_allowed'
  | 'no_table'
  | 'already_complete';

export interface CheckInRecord {
  id: string;
  eventId: string;
  partyId: string;
  count: number;
  method: 'qr' | 'search';
  at: ISODateTime;
  by: string;                   // user/staff label
  exceptions: CheckInException[];
  staffNote?: string;
  undone?: boolean;
}

// ------------------------------------------------------------------ activity
export type ActivityKind =
  | 'event_created' | 'event_updated'
  | 'invitation_saved' | 'invitation_published'
  | 'party_added' | 'parties_imported' | 'party_updated' | 'party_removed'
  | 'invitation_shared' | 'invitation_opened' | 'invitation_failed' | 'reminder_sent'
  | 'rsvp_confirmed' | 'rsvp_declined' | 'rsvp_edited' | 'rsvp_unmatched' | 'rsvp_matched'
  | 'table_created' | 'party_seated' | 'party_moved' | 'party_unseated'
  | 'checked_in' | 'checked_in_partial' | 'check_in_exception' | 'check_in_undone'
  | 'event_archived';

export interface EventActivity {
  id: string;
  eventId: string;
  kind: ActivityKind;
  at: ISODateTime;
  actor: 'organizer' | 'guest' | 'gate' | 'system';
  partyId?: string;
  data: Record<string, string | number | boolean | undefined>;
}

// ------------------------------------------------------------------ tone (semantic, mapped to tokens by ui/)
export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent';
