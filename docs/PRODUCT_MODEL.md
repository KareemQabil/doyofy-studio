# Product model

Entities live in `src/domain/types.ts`; rules live next to them in `src/domain/*.ts` (no React, no storage).

```text
User ─owns─▶ Event ─1:1─▶ InvitationDesign { draft, published? }
               │
               ├─1:n─▶ InvitationParty ──n:1──▶ Table          (SeatAssignment = party.tableId)
               │          │
               │          ├─1:n─▶ RSVPResponse      (history; current state on the party)
               │          └─1:n─▶ CheckInRecord     (history; current count on the party)
               ├─1:n─▶ RSVPResponse without party (general link, waiting to be matched)
               └─1:n─▶ EventActivity              (human-readable timeline)
```

## Event

- **Essentials:** type, names (one or two, plus optional English), date, time, time zone, venue name and city. Everything else is optional and never blocks creation.
- **Settings:**
  - default party size;
  - reveal the table to guests;
  - allow a general (unnamed) link.
- **Lifecycle:** derived from the clock (`eventPhase`), never stored. `archivedAt` is the only stored lifecycle field.
  - `upcoming` → `final_week` (7 days or less) → `event_day` → `completed` (3 hours after the end) / `archived`.

## InvitationDesign

The design holds **only invitation data**:
- experience (3D/2D × animated/static), card, scene;
- display-name overrides, message, program.

At render time `toInvitationData(event, design)` merges in the event's date, time and venue, so the invitation can never disagree with the event.

**Publish state** (derived):

| State | Meaning |
|---|---|
| `none` | No design yet |
| `draft` | Saved, never published |
| `published` | The draft equals the published snapshot |
| `changed` | Published, with newer unpublished edits |

## InvitationParty

The guest-management unit (spec §12): one invitation for one person, a couple or a family.

| Group | Field | Values / meaning |
|---|---|---|
| Identity | `primaryGuestName`, `phone?` (E.164), `maxPartySize`, `companionNames?`, `side?`, `notes?`, `code` | `code` is the personal link and QR |
| Delivery | `delivery.status` | `not_shared` · `shared` · `opened` · `failed` |
| | `delivery.source` | `platform` · `manual` · `simulated` |
| | `delivery.openedAt`, `delivery.reminderAt`, `delivery.failureReason` | |
| | Shown as | `draft` · `ready` · `shared` · `opened` · `failed`; `draft`/`ready` depend on the publish state |
| RSVP | `rsvpStatus`, `confirmedPartySize`, `respondedAt`, `guestNote` | `pending` · `confirmed` · `declined`. Independent of delivery |
| Seating | `tableId?` | |
| Check-in | `checkInStatus`, `checkedInCount` | `not_arrived` · `partial` · `checked_in` |

## Derived counts

Nothing is copied: `countParties(parties)` gives all of these.

- invitations, maximum seats;
- **confirmed people** (sum of confirmed party sizes), which is never the same as the number of invitations;
- declined, pending, opened-but-silent;
- not shared, failed, unassigned confirmed;
- declined-but-seated, over-allowed, missing phone, duplicate phones;
- checked-in people, arrived and partial parties.

The overview, guest list, replies, seating, gate and summary all read from it.

## Rules (with tests in `tests/unit/domain.test.ts`)

**RSVP:**
- the count must be between 1 and `maxPartySize`;
- declining keeps the table and flags it;
- editing a reply creates an activity entry;
- guests can edit until the event starts.

**Seating:**
- a party needs `confirmedPartySize` seats;
- only confirmed parties can be seated;
- "does not fit" asks before allowing over capacity;
- warnings: over capacity, unassigned confirmed, declined but seated.

**Check-in:**
- expected = confirmed size, or the allowance if the guest never replied;
- partial check-ins accumulate (2/4, then 2 more = 4/4);
- exceptions: `declined_arrived`, `pending_arrived`, `over_confirmed`, `over_allowed`, `already_complete` (all blocking), and `no_table` (informational);
- every record can be undone.

**Import:**
- rows are validated for missing name, malformed phone, duplicate in the file, duplicate in the list (by phone, or by name when there's no phone), invalid size and missing phone (a warning);
- duplicates and blocking issues need an explicit decision: fix, skip, import without the phone, or import anyway;
- nothing is written until the organizer confirms.

## Activity

**Kinds:**

| Area | Kinds |
|---|---|
| Event | `event_created`, `event_updated`, `event_archived` |
| Invitation | `invitation_published` |
| Guests | `party_added`, `parties_imported`, `party_updated`, `party_removed` |
| Delivery | `invitation_shared`, `invitation_opened`, `invitation_failed`, `reminder_sent` |
| RSVP | `rsvp_confirmed`, `rsvp_declined`, `rsvp_edited`, `rsvp_unmatched`, `rsvp_matched` |
| Seating | `table_created`, `party_seated`, `party_moved`, `party_unseated` |
| Check-in | `checked_in`, `checked_in_partial`, `check_in_exception`, `check_in_undone` |

`activityText()` turns each into short Arabic, for example "أحمد الشهري أكد الحضور — شخصان". The mock repositories create the entries, as the API will.

## Service contracts

`src/services/contracts.ts` defines the interfaces:

| Interface | Visibility |
|---|---|
| `EventRepository`, `InvitationRepository`, `PartyRepository`, `RsvpRepository`, `SeatingRepository`, `CheckInRepository`, `ActivityRepository` | Organizer |
| `GuestApi` | Public, no account |
| `SessionService`, `Clock` | Mock auth and the prototype clock |

Every method is async and fails with an `AppError` that carries a code (`not_found`, `validation`, `conflict`, `network`, `not_published`, …) and a human Arabic message. A NestJS API client implements the same interfaces; `src/services/index.ts` is the only file that chooses the implementation.
