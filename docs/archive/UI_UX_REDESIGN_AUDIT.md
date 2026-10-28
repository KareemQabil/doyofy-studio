# UI/UX redesign audit — before "Quiet Editorial"

*9 October 2026. Inputs read before any change:*
- `DOYOFY_UI_UX_CONTINUATION_BRIEF.md`, the master prompt and the interaction addendum;
- *Doyofy – Visual Identity Guidelines* (PDF, 31 pages);
- the two owner reference screenshots;
- this repository and its docs and tests;
- recent.design. Only a text scrape could be read, which shows an image-first feed with one row of category tabs; its motion could not be inspected.

## 1. Starting point (verified)

**Test results**

| Check | Result |
|---|---|
| Type-check (app + tests) | clean |
| Unit tests | 13 / 13 |
| Acceptance journey, desktop + phone | 38 / 38 |
| Legacy Invitation Studio matrix | 74 / 74 |
| Accessibility audit | 36 / 36 screens clean |
| Scripted walkthrough T1–T7 | 7 / 7 on phone and desktop |

These come from the 4 October run. No source had changed since then when this audit was written.

**Routes.** All flows in `docs/ROUTES_AND_FLOWS.md` are live and stateful (mock repositories in browser storage). No route is a static mock-up. The one simulated part is WhatsApp sending, which is labelled as a simulation.

**Raw colours.** None of the platform UI's CSS or TSX contains a raw colour; `tokens.css` holds them all. The redesign can therefore be done mostly through tokens and primitives.

## 2. Inventory

| Layer | What is there | Verdict |
|---|---|---|
| `src/domain/` | Pure rules: event types, essentials validation, invitation ↔ Studio mapping, parties, seating, check-in, import, Arabic formatting/plurals | **Keep.** Extend `EVENT_TYPES` (8 → 13 occasions with categories). Add the `TemplatePreset` catalogue here: it is data, not UI. |
| `src/services/` | Typed contracts + mock implementation, prototype controls (scenario, latency, offline, role) | **Keep.** Add two reviewer settings (theme, occasion-chooser variant). No contract change is needed. |
| `src/ui/styles/tokens.css` | One theme: mineral neutrals + **ink-navy primary** `#283566`, brass accent, IBM Plex Sans Arabic via Google Fonts | **Replace the values, keep the role names** (features use the roles). Add Warm Editorial and Soft Sage as two value sets, a display font token and motion tokens. |
| `src/ui/primitives/` | Button, Field/Input/Select/Choice/Switch/Stepper/Search, Dialog/Drawer (native `<dialog>`), Badge/Banner/Empty/Error/Skeleton/Toast, Panel/Stat/FilterChips/KeyValue/Menu/Avatar | **Keep the APIs, restyle.** Buttons become pills with press feedback. Hover, focus and selected states are restyled. Add a `Segmented` control (editor sections, Edit/Preview) and a bottom-sheet variant. |
| `src/ui/layouts/` | AppShell, WorkspaceLayout (sidebar / bottom tabs), FocusLayout (full-screen task), PageHeader, Section | **Keep the structure.** Restyle via tokens now. Rework the shell after the owner review (Stage 6). |
| `src/features/events/CreateEvent.tsx` | 2 steps: a form-like radio grid of 8 types → essentials form → Overview | **Rebuild** as occasion chooser (2 variants) → essentials with a live event card → template gallery. |
| `src/features/invitation/InvitationDesigner.tsx` | Hosts the legacy 5-step **Wizard** (platform mode) inside FocusLayout: autosave, publish, guest preview | **Replace the shell** with a new editor. Keep its save/publish/flush logic, and drive the **Studio** engine directly for the live preview. |
| Invitation engine (`src/studio`, `src/cards`, `src/scenes`, `src/pages`, `src/engine`, `src/wizard`) | Cinematic invitation, 10 cards, 10 2D settings + the 3D candlelit hall, the standalone customer wizard | **Untouched.** It is reached only through `features/invitation/engine.ts`. The standalone wizard (`?view=wizard`) and its 74-check matrix stay as they are. |
| Guest pages (`/i/...`) and gate mode (`/check-in/...`) | Separate theme scopes (`.theme-guest`, `.theme-gate`) | **Keep.** They inherit the new type tokens; their own colour scopes stay. |
| Prototype tools | Scenario, reset, offline, latency, role, guest links | **Extend** with Theme A/B, Occasion chooser A/B and a link to `/prototype/design-review`. |

## 3. Current UX problems (priority areas)

1. **Occasion choice is a form control.** It shows eight radio cards in a two-column grid (`ChoiceGroup`), with no imagery and no grouping. It cannot scale beyond eight, and it feels like settings rather than the start of a celebration.
2. **No template discovery.** After creating an event, the organizer lands on the Overview and must find "جهّز الدعوة". The designer then opens on an *experience* step (3D/2D, animated/static), which is a technical choice made before seeing any design. Card and setting are chosen separately in steps 2 and 3. The 10 × 10 combinations are never curated.
3. **The editor is a linear wizard.** Five steps (Experience → Card → Setting → Details → Publish) force an order on what is really free editing. To change the names after choosing a setting, you step through. The step bar uses technical bilingual labels.
4. **Two visual languages collide.** The designer is maroon/serif "invitation" chrome, with Cormorant + Aref Ruqaa headings and bilingual sub-labels, inside a navy/neutral admin shell.
5. **Event data cannot be edited where it is seen.** Date and venue in the designer are read-only, with a link out to Settings. The owner's test task 4 ("change the names, the date and the style, then view as a guest") needs three pages.
6. **The phone designer previews only on demand**, in a sheet. This was correct for performance (Round 0), but it is the opposite of preview-first editing.

## 4. Current visual-system problems

| Problem | Where | Change |
|---|---|---|
| Navy primary `#283566` reads as an enterprise dashboard, not as the owner's direction | `--c-primary*` | Charcoal-ink primary (Warm) / deep sage primary (Sage). Brand gold only for selection and details. |
| Small radii (8–16 px), every block a bordered card | `--r-*`, `.panel`, `.card` | Larger radii for visual surfaces (20–28 px), fewer borders, tonal surfaces and hairlines instead. |
| Small type, little hierarchy; one family for everything | `--fs-*`, `--font-*` | Larger display sizes; a geometric display face (Readex Pro, closest open match to Shinko/Ping) plus IBM Plex Sans Arabic for UI text, both **self-hosted** (OFL) instead of hot-linked. |
| Rectangular buttons with no press feedback | `primitives.css .btn` | Pill buttons, a 0.98 press scale, calm loading. |
| Hover/focus look the same as selected; no selected token | primitives | Add `--c-selected`, `--c-selected-ring` and a 2-ring focus that is clearer than hover. |
| Motion tokens exist, but there is no easing pair and no layout-transition token | `--dur*`, `--ease` | `--ease-out` for entering and `--ease-in-out` for state changes; durations of 100, 160, 220, 280 and 360 ms. |
| No brand mark (text + envelope icon) | `Brand` in Layouts | Use the official logomark and wordmark, extracted as vectors from the guidelines PDF. |

## 5. Places where styling and feature logic are coupled

- `ChoiceGroup` is used both as a form control and as the occasion picker. The new occasion chooser is its own component; `ChoiceGroup` stays for real forms.
- The Wizard renders its own HTML and CSS (`src/wizard/wizard.css`), so its look cannot follow the platform tokens. The new editor stops using it inside the platform; the standalone wizard keeps it.
- `EVENT_TYPES` lives in the domain and also carries UI copy (labels, hints). That is acceptable, because the copy is product content. Visual art per occasion lives in the feature layer (`OccasionArt`), not in the domain.

## 6. What must remain untouched

- The invitation engine and its cinematic behaviour, the guest invitation and RSVP, and gate mode logic.
- Service contracts, the mock data model and the seed.
- The standalone customer wizard (`?view=wizard`) and the legacy QA matrix.
- Domain rules: draft vs published, event data vs invitation data, invitations vs people, delivery vs RSVP.

## 7. Regression risks and how they are covered

| Risk | Mitigation |
|---|---|
| E2E step 4 drives the old wizard inside the designer | Update E2E to the new editor (documented intentional change). The standalone wizard keeps its own checks in `tests/qa.mjs`. |
| The scripted walkthrough T1/T2 uses the old create flow and wizard | Update the walkthrough to the new chooser, gallery and editor. |
| New occasion types reach screens that assume the old 8 | Types are additive. `eventTypeInfo` falls back to "other". Unit-test the new types. |
| Theme switch leaves some screens unreadable | Run the accessibility (contrast) audit in **both** themes. |
| Live 3D preview on phones (Round 0 finding) | Phone editor: an instant static card while editing; the live invitation plays in "معاينة" mode only. |
| Template switch erases the organizer's text | A preset changes only the card, setting and experience. Names, message and program stay. Unit-tested. |

## 8. Plan

The stages follow the brief:

| Stage | Work |
|---|---|
| 1 | Tokens + themes + fonts + logo + primitives |
| 2 | Occasion chooser A/B + new create flow |
| 3 | TemplatePreset gallery + preview |
| 4 | Editor |
| 5 | `/prototype/design-review`, then tests and docs |

**Stop after Stage 5** for owner direction. Events, Overview, Guests, RSVP, Seating and Check-in get the new tokens automatically, but not a layout redesign.
