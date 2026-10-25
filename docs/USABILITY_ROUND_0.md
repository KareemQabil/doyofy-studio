# Usability round 0 — scripted walkthrough (4 October 2026)

**What this is.** This round was an automated, first-time-tester walkthrough, run before real people use the prototype. A browser script (`tests/usability-walk.mjs`) gets the seven tasks in `docs/TEST_SCENARIOS.md`, worded as a moderator would read them. It then uses only what is visible on screen:
- it finds the control a newcomer would look for, by its visible Arabic label;
- it records whether that control was visible without scrolling;
- it completes the task;
- it captures a screenshot at every step.

It ran on a 390 × 844 phone and a 1440 × 900 desktop. Alongside it ran:
- an accessibility audit of 18 screens on both sizes (`tests/a11y.mjs`);
- a horizontal-overflow check on phones;
- the acceptance journey (`tests/e2e.mjs`);
- the legacy Invitation Studio matrix (`tests/qa.mjs`).

**What it is not.** It is not a test with real organizers or gate staff. A script can't tell whether wording is understood, whether someone hesitates, or what they expected to happen. It only checks that the path exists, is visible, is labelled the way the task is phrased, and produces the right result. Round 1 with people (5 organizers + 2 gate staff) is still the next step.

Screenshots: `qa/usability/phone/` and `qa/usability/desk/` (one numbered image per step, plus `log.json`).

## Results

| Task | Phone | Desktop | Notes |
|---|---|---|---|
| T1 Create an event (date + venue) | ✓ | ✓ | Every control visible without scrolling. Lands on the overview with one next action: «جهّز الدعوة». |
| T2 Pick an invitation, edit names, preview as a guest | ✓ | ✓ | Was **blocked on the phone** in the first pass: the hidden 3D preview kept rendering (finding 9). Passes after the fix. |
| T3 Import 20 guests, handle a duplicate number | ✓ | ✓ | The duplicate row is visible on the review screen. «لا تضفه مرتين» resolves it. Result: 19 guests added. |
| T4 Find who hasn't replied, open one | ✓ | ✓ | Overview «12 دعوة لم ترد بعد» → filtered list → drawer. |
| T5 Seat a confirmed guest | ✓ | ✓ | «اختر طاولة» is visible on the first unseated party. |
| T6 Check in a guest who came with two others | ✓ | ✓ | Gate counter starts at 3; button «تسجيل دخول 3 أشخاص». |
| T7 Partial arrival, the rest later | ✓ | ✓ | «الباقون يصلون لاحقًا: شخصان». Second visit: «تسجيل دخول شخصين» → 4 of 4. |

## Findings and fixes

Each finding was fixed in this round and re-verified with the full suite.

| # | Finding | Where | Severity | Fix |
|---|---|---|---|---|
| 1 | The look choice (3D / 2D) showed the sample couple «سارة وأحمد» instead of the organizer's names. A first-time organizer could think the names were wrong. | Designer, step 1 | Medium | The tiles show the live card with the event's names. |
| 2 | The page scrolled sideways on phones: the footer label «التالي: المراجعة والنشر» and the evening-program inputs were too wide. | Designer, phone | Medium | Short label on small screens; inputs shrink. No horizontal overflow on any of 17 routes at 390 px. |
| 3 | Faint text and the guest accent were below 4.5 : 1 contrast. | Tokens | Medium | Darkened `--c-text-3`, the guest `--c-text-3` and the guest accent. |
| 4 | Screen readers couldn't name the switches, and the gate screen had no main heading. | Settings, prototype tools, gate | Medium | Switches are labelled and described; the gate has an `h1`. |
| 5 | Opening a guest selected the personal-link field. On phones that can open the keyboard over the drawer. | Guest drawer | Low | Drawers start focus on the close button. |
| 6 | Grammar: counts after a verb or preposition used the nominative dual («تسجيل دخول شخصان»). | Gate, guest hub, import, overview | Low (reads as a bug to Arabic speakers) | `pluralOf` / `peopleOf` use the oblique dual where grammar needs it («شخصين», «دعوتين»). Covered by unit tests. |
| 7 | `?tools=off` hid the prototype tools only on the first page. After one navigation, testers saw the tools button again. | Prototype tools | Low (moderators only) | The setting lasts for the browser session (`?tools=on` brings the tools back). |
| 8 | Delete and reset dialogs put focus on the destructive button, so a stray Enter would delete. | Confirm dialogs | Medium | Destructive dialogs start focus on «تراجع». |
| 9 | On phones the live 3D preview rendered all the time behind the hidden Preview sheet. In the walkthrough (software WebGL) T2 stalled. On a mid-range phone this costs battery and makes typing sluggish. | Designer, phone | High on low-end phones | The preview mounts only while the sheet is open and is freed when it closes or the step changes. The desktop is unchanged. Covered by the E2E and legacy tests. |
| 10 | Duplicate SVG id `cf-cheart` (a gradient and a heart shape) in the card art. A duplicate id resolves to the first match, so the heart could render wrong. | Card art | Low | The gradient is now `cf-cheart-g`. The fix is in the generator (`tools/port-canon.mjs`), so regenerating keeps it. |
| 11 | The «event created» toast covered the designer's «التالي» button on phones for about four seconds. | Designer, phone | Low | Toasts sit above sticky action bars (designer, create flow, settings save bar). |

## Verification after the fixes

| Check | Result |
|---|---|
| Type-check (app + tests) | clean |
| Unit tests (domain + services) | 13 / 13 |
| Acceptance journey, desktop + phone (`npm run test:e2e`) | 38 / 38 |
| Legacy Invitation Studio, full matrix (`npm run test:studio`) | 74 / 74 (one check added for finding 9) |
| Accessibility audit, 18 screens × 2 sizes | 36 / 36 clean |
| Walkthrough T1–T7 | phone 7 / 7, desktop 7 / 7 |

Two test-harness problems surfaced during the re-runs. Neither was an app defect.
- **A legacy check timed out once.** «details update the live preview» failed once and passed when re-run. The names had reached the preview, just after the 8-second wait under software WebGL. That timeout is now 20 s.
- **E2E failed intermittently because of font requests.** The sandbox can't reach Google Fonts, and font requests hang instead of failing, which stalled screenshots and slowed steps 8–10. The E2E harness now aborts those requests, as the walkthrough and accessibility harnesses already did. Failing steps now report which wait timed out, and the seating step reports the page state. Three desktop runs and one phone run since then passed 19/19 each.

## Still unverified — needs real devices or people

- **Comprehension and hesitation.** Do organizers understand:
  - «جاهزة / أُرسلت / فُتحت» versus the reply states;
  - draft versus published;
  - invitations versus people in the header counts?

  Only round 1 can answer this. The questions to watch are listed per task in `docs/TEST_SCENARIOS.md`.
- **3D preview on real phones.** Frame rate, heat and battery are unmeasured; the sandbox only has software WebGL. Test on one low-end Android phone and one iPhone.
- **Fonts.** The sandbox can't load Google Fonts, so screenshots use a fallback Arabic font. Check line breaks with IBM Plex Sans Arabic on a device.
- **Cross-device RSVP.** The mock store is per browser (D-015). For moderated sessions, use one device or tabs in one browser.
- **Screen readers.** The audit checks names, roles, headings, contrast and focus order automatically. Nobody has used it with VoiceOver or TalkBack yet.
