# Guests, seating, roles and data portability

Audit and implementation: 21 November 2026. Baseline: `main` at `bd6000a` (which already includes `v2/final`).

## Findings and decisions

| Priority | Baseline evidence | User impact | Resolution in this upgrade |
| --- | --- | --- | --- |
| P0 | `src/domain/types.ts` had only organizer/coordinator; `GuestsPage` always rendered food, `FoodReport` and `SeatingPage` showed allergies without a role policy | Organizer was distracted by food operations; catering had no focused view | Added caterer presentation role; organizer/coordinator hide food; caterer gets food totals, read-only seating and dedicated food-only menu settings, with no private messaging or editable guest list. Account switches the presentation role. |
| P1 | `HallMap` buttons accepted guest drops but tables had no reorder API | Requested table drag gesture was absent | Explicit “ترتيب الطاولات” mode adds mouse drag, touch pointer drag and RTL keyboard arrow ordering. Table menu supplies previous/next order actions. Complete ordered IDs are persisted atomically. This remains a list arrangement, not a measured floor plan. |
| P1 | `GuestsPage` page and selection actions had no export; only `FoodReport` exported whole food CSV | Could not hand off selected guests, tables or departments | CSV dialog exports current filtered results, selected parties, multiple chosen tables, multiple chosen departments, or all guests. Checkboxes show scope counts. Table menus preselect that table. Phone numbers opt in; organizer notes and dietary data stay out of general exports. |
| P1 | `PartyRepository` had no transfer operation | Guests could not be reused between occasions | Atomic copy/move to a different active event, duplicate phone/name detection, destination quota validation and explicit move confirmation. Creates fresh IDs/codes and resets delivery, RSVP, seating, arrival and food state. Copy retains the source. Move removes source replies and refuses checked-in parties. |
| P1 | Guest rows always emphasized WhatsApp, even after confirmation/arrival | User needed to decide the next operation every time | State-aware primary action: publish, add phone, share, remind, assign table, record arrival, or details. Drawer continues to expose secondary operations. |
| P1 | Touch guest hit testing targeted only dock buttons | Dragging directly onto a visible hall table did not work on touch | Hall tables now expose the same guest drop target as the dock. Drop resolves at release coordinates, and the visible “اختر طاولة” path remains available. |
| P2 | Alternate grouped panels mixed a fixed pale brand color with dark surfaces; bulk primary button used dark text on theme-sensitive surface | Readability could deteriorate in dark mode | Group surfaces use semantic surface/border tokens; bulk primary uses a fixed ivory/charcoal pair. Mobile selection bar resets its inherited top position, reserves list space, and the seat dock clears the bottom navigation. |
| P2 | Guest list footer claimed links worked on only one device | Contradicted the portable invitation implementation | Footer now explains portable preview links and demo replies from another device. |

## Workflow contract

- The manageable entity is an invitation party. Its allowed headcount includes companions; transfer capacity checks sum `maxPartySize`, not invitation rows.
- Copy is the safe default. Move requires a concrete destination and a separate confirmation explaining source removal and new links.
- A duplicate or quota conflict aborts the whole transfer. No partial batch is presented as complete.
- Table order changes do not change assignments, table identity or names. Stale/missing/foreign/duplicate order IDs abort atomically.
- A guest cannot be assigned to a table from another event (a previously unchecked service invariant).
- Food visibility is a **prototype presentation policy**, not authentication or server authorization. The existing remote adapter explicitly refuses transfer/reorder until transactional backend endpoints are implemented; it never pretends to persist those operations.
- The caterer workspace shows catering reports, read-only tables and a dedicated menu configuration page. The settings route renders only meal/dietary controls for caterer and never mounts general event settings or wishlist controls. A global presentation guard also blocks direct import, editor, template, preview, creation and reception routes, with recovery links; its event home omits creation actions. The role switch remains reachable in account settings.

## Acceptance and verification

`tests/unit/guest-tools.test.ts` covers:

1. Selected/current/table/department scopes, multi-table and multi-department unions without duplicate rows, zero selected scopes, spreadsheet formula neutralization and default export privacy.
2. Guest next actions through draft, missing phone, unsent, shared, confirmed/unseated, seated and declined states, plus caterer-only food policy.
3. Copy resets event-specific state while preserving the source; duplicate rejection leaves both collections unchanged.
4. Move clears source response history; checked-in moves and destination quota overflow are rejected without removing the source.
5. Reorder persistence, stale/duplicate order validation, and foreign-event seating rejection.

The latest unit suite passed 101/101, including these cases. The existing DOM food test now explicitly selects caterer and restores organizer. Additional DOM assertions verify the caterer has no editable guest rows/private messaging and organizer list/settings hide food while preserving wishlist controls. `node tests/roles-dom.mjs` adds five focused cases for direct-route blocking, a read-only event home, food/seating presentation, food-only menu setup, owner wishlist preservation, public guest/account access and live role switching, including closing open editing tools and removing warning actions when switching to catering. DOM tests do not constitute physical-device touch QA.

## Remaining production dependencies

- Server-backed event/role permissions, scoped export authorization and privacy policies.
- Transactional server endpoints for transfer and complete table-order updates, enforcing destination quotas, duplicates, access and concurrent changes.
- Physical iOS/Android touch validation and assistive-technology validation; browser pointer/keyboard verification cannot establish all device behavior.
- Free-form hall geometry is outside this upgrade: table arrangement is ordered, not stored as x/y positions or venue measurements.
