# Prototype status

*Updated 9 October 2026: UI/UX iteration «Quiet Editorial», stopped at the owner-review checkpoint (brief Stage 5).*

## Done — usable now

| Stage | What works | Verified by |
|---|---|---|
| 0 Audit | `docs/PROTOTYPE_AUDIT.md`; the legacy Invitation Studio matrix 73/73 before any change | `npm run test:studio` |
| 1 Foundation | Layers `domain/` · `services/` (typed contracts + mock + seed) · `features/` · `ui/` (tokens, primitives, layouts) · `app/` (router, data hooks). RTL-native shell: sidebar on desktop, bottom tabs on phones. Seed: active wedding (40 parties, 8 tables), draft engagement, completed katb kitab | type-check, unit tests |
| 2 Event + invitation | 2-step create flow (validation, unsaved-changes guard) → overview with setup checklist and ONE next action. Invitation section: card thumbnail, state (draft / published / unpublished changes), links. Existing wizard in **platform mode** (autosave, event data read-only, names as invitation overrides, Publish step, guest preview) | E2E steps 2–5 |
| 3 Guests + RSVP | Guest list:<br>• header counts (invitations ≠ people);<br>• search (Arabic-aware);<br>• 8 filters with counts;<br>• bulk send, mark manual, remind;<br>• add/edit dialog (duplicate-phone warning);<br>• details drawer (delivery vs RSVP, source labels, WhatsApp link, simulated send/retry, record a reply, delete).<br><br>Import: `.xlsx` / `.csv` / paste / sample → column matching → review (missing name, malformed phone, duplicates in file/list, missing phone) with fix / skip / import without phone / import anyway → result.<br><br>Replies: nudge list (opened-silent first), recent replies, general-link matching.<br><br>Guest link: cinematic invitation with RSVP wired to the party (name locked, count bounded) → event hub (status, QR, edit reply, directions, calendar, program, table) | E2E 6–9, unit tests |
| 4 Seating | Quick setup, add/edit/delete tables, unassigned pool, assign/move/unassign with buttons (drag and drop optional), search highlight. Warnings: over capacity, doesn't fit (confirm), declined but seated, seats fewer than confirmed | E2E 10, unit tests |
| 5 Check-in, settings, summary | Gate mode (dark, high contrast): simulated QR scan with test cases, search, full/partial check-in, 5 blocking exceptions + no-table notice, staff note, undo. Organizer check-in page (prepare, live arrivals, partial, exceptions). Settings (basics, date, venue/map, reply rules, table visibility, archive). Post-event summary (bars, simulated thank-you, archive) | E2E 11–14, unit tests |
| 6 Polish & tests | Phone pass at 390 px. Loading, empty, error, offline and no-results states. Unsaved-changes guards. Prototype tools (scenarios, reset, offline, latency, role, guest links). Docs | 38/38 E2E (desktop + phone), 13 unit, 74/74 legacy |
| Usability round 0 | Scripted first-time-tester walkthrough of tasks T1–T7 on phone and desktop, plus an accessibility audit and a phone overflow check. 11 findings, all fixed: names on the look tiles, phone overflow, contrast, switch labels, drawer focus, Arabic dual grammar, tools flag, safe focus in delete dialogs, the phone 3D preview running while hidden, a duplicate SVG id, and a toast covering Next. See `docs/USABILITY_ROUND_0.md` | walkthrough 7/7 on both sizes; a11y 36/36 screens clean |

**Bugs found and fixed by the tests:**
- the router treated a page that blocks navigation on mount as a back-button press;
- `useMutation` used stale closures (the gate recorded the old head count);
- phone sheets pinned to the top;
- a save-then-navigate race in the designer.

## UI/UX iteration (October 2026), at the owner-review checkpoint

Review entry: **`/prototype/design-review`**, linked from the prototype tools (bottom corner, «نموذج»).

| Stage | What exists now | Verified by |
|---|---|---|
| 0 Audit | `docs/UI_UX_REDESIGN_AUDIT.md` | — |
| 1 Design system A/B | **Warm Editorial** and **Soft Sage** on one token set (`tokens.css`).<br>Self-hosted Readex Pro + IBM Plex Sans Arabic; official logo (vectors from the guidelines PDF).<br>Restyled primitives (pill buttons, press/focus/selected states, `Segmented` with a moving indicator); motion tokens.<br>Theme switch in prototype tools, the review page or `?theme=`. | a11y + contrast audit **104/104** (26 routes × phone/desktop × both themes) |
| 2 Occasion chooser A/B | 13 occasions in 5 groups with original double-line art.<br>**Coverflow** (snap scrolling, arrows, keyboard, no autoplay) and **Editorial Rail** + grouped «كل المناسبات» sheet, on the same data.<br>New create flow: occasion → essentials with a live event card → template gallery. | E2E 2a–2b (Coverflow on desktop, Rail on phone); walkthrough U1–U2 |
| 3 Template gallery | 13 curated `TemplatePreset`s (real engine pairings) rendered live with the event's names; suited first; style chips; preview dialog/sheet playing the real invitation; «استخدم هذا القالب» keeps all texts. | E2E 3; unit tests (presets valid, order complete, applying keeps text); walkthrough U3, U5 |
| 4 Editor | New shell around the unchanged engine: live preview with in-place updates; sections المحتوى · التصميم · الحركة والصوت · تفاصيل المناسبة; autosave; draft/published clarity; preview as guest (returns to the same section); change template; event data editable with a shared-data notice. Phone: poster + half/full bottom sheet, «معاينة» live mode, publish in the dock. | E2E 4a–5c; walkthrough U4–U5 |
| 5 Review checkpoint | Review page, docs (`DESIGN_SYSTEM_V2`, `UX_EXPERIMENTS`, `OWNER_FEEDBACK`, `INTERACTION_SYSTEM`) | this table |

**Verification on 9 October 2026:**

| Check | Result |
|---|---|
| Type-check | clean |
| Unit tests | 17 / 17 |
| E2E, desktop (Coverflow) | 22 / 22 |
| E2E, phone (Rail) | 22 / 22 |
| Legacy Invitation Studio matrix | 74 / 74 |
| Accessibility + contrast audit | 104 / 104 |
| Scripted walkthrough, U1–U5 + T3–T7 | 12 / 12 tasks: desktop with Coverflow, phone with Rail, phone with Coverflow |

One desktop E2E run hit an intermittent 30-second click timeout at step 6a (opening «الضيوف» right after the overview). The link was visible in the failure screenshot, and the rerun passed 22/22. It is noted here because it is not explained yet.

**Intentional changes to tests:**
- E2E steps 2–5 now drive the new chooser, gallery and editor instead of the old wizard. The standalone wizard keeps its own 74-check matrix (`npm run test:studio`).
- The walkthrough's T1/T2 are replaced by the owner tasks U1–U5. T3–T7 are unchanged.

**Stopped here on purpose (brief, hard checkpoint).** Events, Overview, Guests, RSVP, Seating, Check-in, Settings and Summary only *inherit* the new tokens and fonts; their layouts are not redesigned yet. That is Stage 6, after the owner chooses:
- a theme;
- a chooser;
- the gallery/editor direction (see `docs/OWNER_FEEDBACK.md`).

## In progress

- Nothing half-built. All flows in `docs/ROUTES_AND_FLOWS.md` are connected end to end.

## Next

0. **Owner review** of `/prototype/design-review` → pick the theme, chooser and editor/gallery direction → Stage 6 rollout.
1. **Usability round 1 with people**, using `docs/TEST_SCENARIOS.md`: 5 organizers and 2 gate staff, half on phones. Round 0 was scripted, so it checked only that the paths exist and are visible; see its "still unverified" list. Fix journey issues before visuals.
   - Measure the 3D preview on one low-end Android phone and one iPhone.
2. **Real camera scanning** in gate mode (BarcodeDetector where available); the parser is ready.
3. **NestJS API** implementing `services/contracts.ts`, including real cross-device RSVP. Then accounts and a staff PIN for gate links.
4. **Next.js move** (D-001): routes → `app/` folders. Domain, services, features and ui unchanged.
5. Second visual direction for the organizer UI. Spec: reskin via `tokens.css` + primitives only.

## Blocked / needs a decision

- **Cross-device testing:** the mock store is per browser (D-015). A guest replying on a different phone won't reach the organizer until a backend exists. For moderated tests, use one device, or tabs in one browser.
- **WhatsApp sending:** needs a BSP account (out of MVP scope). The UI already models shared, opened, failed, retry and reminders.
- **Non-couple invitation designs** (D-019): the cards are couple designs.

## Assumptions

All reversible ones are in `docs/UX_DECISIONS.md` (D-001 … D-030).

## Environment notes

- **Sandbox registry:** the npm registry was blocked where this was built. React 19.2, TypeScript, `@types/*` and the QR encoder came from local installs or GitHub. On a normal machine `npm install` installs the versions in `package.json`.
- **Fonts:** Google Fonts can't be reached from the test sandbox. Screens use system Arabic fonts there; real devices load IBM Plex Sans Arabic.
- **Frame rates:** 3D invitation timings in tests use software WebGL; real-device frame rates are still unmeasured (see `docs/PRODUCTION_STATUS.md`).

## Commands

```bash
npm install
npm start               # http://localhost:5173  → Doyofy (real paths)
npm run typecheck       # app + tests
npm run test:unit       # domain + service rules (17)
npm run test:e2e        # acceptance journey, desktop + phone (38 steps)
npm run test:studio     # legacy Invitation Studio matrix (74)
node tests/usability-walk.mjs phone|desk [coverflow|rail]   # scripted U1–U5 + T3–T7 walkthrough → qa/usability/
node tests/a11y.mjs [warm|sage]   # accessibility + contrast audit, 26 routes × phone/desktop × theme
npm test                # unit + e2e + studio quick
```
