/** snake_case database rows (0001_doyofy_init.sql) → domain entities (src/domain/types.ts) and back. */
import type {
  CheckInException, CheckInRecord, Event, EventActivity, InvitationDesign, InvitationDesignContent, InvitationParty,
  RSVPResponse, Table, UpdateEventInput,
} from '../../domain/types';

type Nullable<T> = { [K in keyof T]: T[K] | null };

export type EventRow = {
  id: string; owner_id: string; type: Event['type']; title: string; names: Event['names']; date: string; time: string;
  time_zone: string; duration_hours: number | string; venue: Event['venue']; slug: string; default_party_size: number;
  reveal_table_to_guests: boolean; allow_general_link: boolean; check_in_prepared_at: string | null; archived_at: string | null;
  created_at: string; updated_at: string;
};
export type DesignRow = {
  id: string; event_id: string; draft: InvitationDesignContent; draft_revision: number; draft_saved_at: string;
  published: InvitationDesignContent | null; published_at: string | null; published_version: number;
};
export type PartyRow = {
  id: string; event_id: string; code: string; primary_guest_name: string; max_party_size: number;
  delivery_status: InvitationParty['delivery']['status']; rsvp_status: InvitationParty['rsvpStatus'];
  check_in_status: InvitationParty['checkInStatus']; checked_in_count: number; source: InvitationParty['source'];
  created_at: string; updated_at: string;
} & Nullable<{
  phone: string; companion_names: string[]; notes: string; side: string;
  delivery_source: NonNullable<InvitationParty['delivery']['source']>; delivery_at: string; delivery_opened_at: string;
  delivery_reminder_at: string; delivery_failure_reason: NonNullable<InvitationParty['delivery']['failureReason']>;
  confirmed_party_size: number; responded_at: string; guest_note: string; table_id: string;
}>;
export type ResponseRow = {
  id: string; event_id: string; party_id: string | null; name: string; attending: boolean; count: number;
  companion_names: string[] | null; note: string | null; channel: RSVPResponse['channel']; at: string;
  resolution: RSVPResponse['resolution'] | null;
};
export type TableRow = { id: string; event_id: string; name: string; capacity: number; sort_order: number };
export type CheckInRow = {
  id: string; event_id: string; party_id: string; count: number; method: 'qr' | 'search'; at: string; by_label: string;
  exceptions: CheckInException[]; staff_note: string | null; undone_at: string | null;
};
export type ActivityRow = {
  id: string; event_id: string; kind: EventActivity['kind']; at: string; actor: EventActivity['actor'];
  party_id: string | null; data: EventActivity['data'] | null;
};

/** null → undefined (domain optional fields) */
const opt = <T>(v: T | null | undefined): T | undefined => (v == null ? undefined : v);
/** Postgres timestamptz text → the ISO shape the domain sorts with localeCompare */
export const iso = (v: string): string => new Date(v).toISOString();
const isoOpt = (v: string | null | undefined): string | undefined => (v == null ? undefined : iso(v));

export function toEvent(r: EventRow): Event {
  return {
    id: r.id, ownerId: r.owner_id, type: r.type, title: r.title, names: r.names, date: r.date, time: r.time.slice(0, 5),
    timeZone: r.time_zone, durationHours: Number(r.duration_hours), venue: r.venue, slug: r.slug,
    settings: { defaultPartySize: r.default_party_size, revealTableToGuests: r.reveal_table_to_guests, allowGeneralLink: r.allow_general_link },
    checkInPreparedAt: isoOpt(r.check_in_prepared_at), archivedAt: isoOpt(r.archived_at),
    createdAt: iso(r.created_at), updatedAt: iso(r.updated_at),
  };
}

/** UpdateEventInput → PATCH body (settings are flattened into columns) */
export function eventPatch(input: UpdateEventInput): Record<string, unknown> {
  const { settings, timeZone, durationHours, ...rest } = input;
  const out: Record<string, unknown> = { ...rest };
  if (timeZone !== undefined) out.time_zone = timeZone;
  if (durationHours !== undefined) out.duration_hours = durationHours;
  if (settings?.defaultPartySize !== undefined) out.default_party_size = settings.defaultPartySize;
  if (settings?.revealTableToGuests !== undefined) out.reveal_table_to_guests = settings.revealTableToGuests;
  if (settings?.allowGeneralLink !== undefined) out.allow_general_link = settings.allowGeneralLink;
  return out;
}

export function toDesign(r: DesignRow): InvitationDesign {
  return {
    id: r.id, eventId: r.event_id, draft: r.draft, draftSavedAt: iso(r.draft_saved_at),
    published: opt(r.published), publishedAt: isoOpt(r.published_at),
  };
}

export function toParty(r: PartyRow): InvitationParty {
  return {
    id: r.id, eventId: r.event_id, code: r.code, primaryGuestName: r.primary_guest_name, phone: opt(r.phone),
    maxPartySize: r.max_party_size, companionNames: opt(r.companion_names), notes: opt(r.notes), side: opt(r.side),
    delivery: {
      status: r.delivery_status, source: opt(r.delivery_source), at: isoOpt(r.delivery_at), openedAt: isoOpt(r.delivery_opened_at),
      reminderAt: isoOpt(r.delivery_reminder_at), failureReason: opt(r.delivery_failure_reason),
    },
    rsvpStatus: r.rsvp_status, confirmedPartySize: opt(r.confirmed_party_size), respondedAt: isoOpt(r.responded_at),
    guestNote: opt(r.guest_note), tableId: opt(r.table_id), checkInStatus: r.check_in_status, checkedInCount: r.checked_in_count,
    source: r.source, createdAt: iso(r.created_at), updatedAt: iso(r.updated_at),
  };
}

export function toResponse(r: ResponseRow): RSVPResponse {
  return {
    id: r.id, eventId: r.event_id, partyId: opt(r.party_id), name: r.name, attending: r.attending, count: r.count,
    companionNames: opt(r.companion_names), note: opt(r.note), channel: r.channel, at: iso(r.at), resolution: opt(r.resolution),
  };
}

export const toTable = (r: TableRow): Table => ({ id: r.id, eventId: r.event_id, name: r.name, capacity: r.capacity, order: r.sort_order });

export function toCheckIn(r: CheckInRow): CheckInRecord {
  return {
    id: r.id, eventId: r.event_id, partyId: r.party_id, count: r.count, method: r.method, at: iso(r.at), by: r.by_label,
    exceptions: r.exceptions, staffNote: opt(r.staff_note), undone: r.undone_at != null,
  };
}

export function toActivity(r: ActivityRow): EventActivity {
  return { id: r.id, eventId: r.event_id, kind: r.kind, at: iso(r.at), actor: r.actor, partyId: opt(r.party_id), data: r.data ?? {} };
}
