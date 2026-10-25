# Claude handoff — Doyofy / ضيوفي

You are taking over a functioning Arabic-first invitation and event-management prototype. Work directly in the attached complete project. Implement the changes, test them, and return a runnable updated project and review evidence. Do not stop at a proposal, mood board, or textual audit.

## Owner's brief — this is the direction to satisfy

The owner says:

> عاوز برومبت handoff هخلي كلود يكمل polishment للUX ويخلي الUI أفضل ويضيف عناصر اكتر ويعمل enrichment ويحاول يعمل ثيم فيه الحلو من كل حاجة لأن كل الموجود حاليًا تحسه هادي وخفيف اكتر من اللازم ومفيهوش لعب الgestures ده خالص ولا اشكال حلوة بجد.

Earlier requirements remain: simplify the journey and reduce decisions; respect RTL very strongly; design genuinely new assets and occasion templates, including graduation; aim for the craft, visual presence and interaction quality of an outstanding Awwwards-style site; inspect everything from the hero to the final guest/reception/summary screen.

The current UI feels too quiet, too sparse, too flat and insufficiently playful to the owner. Existing gesture code is not proof that the experience communicates or delivers that playfulness. Treat this feedback as a real design problem. Make the quality visible in the product itself.

## Start with the actual project

Read `START_HERE.md`, `ASSET_COMPLETENESS.md`, `docs/PROTOTYPE_STATUS.md`, `docs/HORIZON_REVIEW.md`, `docs/PRODUCT_MODEL.md`, `docs/ROUTES_AND_FLOWS.md`, `docs/UX_DECISIONS.md`, and the relevant sections of `DOYOFY_UX_PROTOTYPE_MASTER_SPEC.md`. Older handoff files and production/checkpoint labels are historical. The current source snapshot is commit `74a41fd34cea6c6718316d3c6e2598e204ed1835`; this archive adds export instructions and integrity files around it.

Run the included build and tests before changing things. Launch the project locally and inspect real screens if your environment permits browser use. If browser access is unavailable or forbidden, state that limitation and distinguish source/DOM checks from visual evidence. Do not present jsdom as a browser or fabricated screenshots as proof.

### Architecture and important contracts

- React 19 + TypeScript, custom hash/history router, esbuild static output; this is not a Next.js app. See `src/app/App.tsx`, `router.tsx`, `paths.ts`, `data.tsx`, `review.ts`.
- Domain rules are in `src/domain/`; typed service contracts in `src/services/contracts.ts`; browser-local mock repositories, store and seeds in `src/services/mock/`.
- Screens are in `src/features/`; UI tokens/primitives/layouts in `src/ui/`.
- Organizer theme preference is separate from invitation design. Switching themes must never rewrite the invitation, names, guest data or publish state. Theme catalogue: `src/domain/themes.ts`.
- Invitation engine: `src/engine/`, `studio/`, `cards/`, `scenes/`, `pages/`, `data/`. Preserve its intro → card → opening → pages → pack → seal → fly → done capabilities, guest fast access and 2D/static fallback.
- Card registry: `src/cards/index.js`, canonical faces, and six newer native DOM/SVG faces in `src/cards/occasion-cards.js`. New cards implement the real 300×420 face/theme/compatibility contract. They use actual derived event data, escaped text, dynamic dates, and single/couple handling.
- Curated presets: `src/domain/templates.ts`; per-occasion starter designs/copy/programs: `src/domain/occasion-starters.ts`; data adaptation: `src/domain/invitation.ts`, `src/data/derive.js`. Template changes affect the look only; they must preserve text, names and program.
- Existing interaction primitives: `src/ui/hooks/usePointerGesture.ts`, `src/domain/gestures.ts`, `src/features/orbit/useSpatialView.ts`, and Orbit/Bahja feature components. Reuse and improve them where useful; examine actual discoverability and behavior.
- All original UI image sources in `design-source/`; runtime files/fonts/licenses/audio/3D assets in `public/assets/`. Build assets are in `dist/`. The exported snapshot includes every current tracked file and every runtime-required asset.

## Main deliverable: a new coherent signature theme

Create an additional organizer theme, working name **«توقيع ضيوفي / Signature»**, with a single visual language combining the strongest qualities of the current directions. Choose a better Arabic name if it improves the concept. Keep existing themes accessible for comparison. Implement the theme across the full journey, with an explicit URL entry and reviewer route. Avoid a palette-only reskin or a collage of incompatible styles.

Borrow selectively:

| Current direction | Useful quality | What the new theme must improve |
|---|---|---|
| Bahja / بهجة | Bold Arabic hero, vivid sculptural occasion assets, festive presence, poster salon | Richer authored composition and tactile interaction; less empty space and generic repetition |
| Orbit / مدار | Spatial board, draggable elements, pan/pinch, focused browsing | Discoverable gestures, clear reading order and useful button/keyboard alternatives |
| Horizon / أفق | Editorial clarity, cobalt detail, restrained task chrome, new graduation stationery | Much stronger visual depth, materials, shapes and transitions |
| Warm / Sage / Rose / Night / Ink | Paper texture, botanical detail, celebratory colors, lighting and contrast | Use a deliberate hierarchy and consistent art direction instead of mixing every color/style |

Art direction should feel crafted: bold Arabic typography, distinctive shapes, dimensional invitation objects, layered paper/light/shadow, meaningful motifs, and a clear rhythm between expressive moments and task-focused controls. The hero should have a strong visual signature and a convincing composition on both desktop and phone. Cards and occasion assets should look authored and materially different; avoid turning the whole product into identical rounded white tiles with tiny icons.

Use extra visual elements to add character and context: event-specific tableaux, invitation stationery, seals/ribbons, graduation cap/diploma/laurel, illustrated empty states, expressive section transitions and celebratory success moments. Create real production assets when needed, with optimized runtime variants and retained editable/source files and licenses. Use native SVG/CSS for precise scalable elements; use image generation only if available and appropriate for imagery. Maintain cohesion and performance.

Do not mechanically mirror Arabic lettering or shapes to create RTL. Typography must remain readable and natural. Test long Arabic names and mixed Arabic/English dates, guest codes, phones and numbers. Generic English “WEDDING” text must not leak onto graduation or other single-person occasions.

## Gesture and motion work must be concrete and noticeable

Build a small set of polished interactions that give the interface a physical, playful feel and help people understand the journey. At minimum, deliver meaningful gesture behavior in the occasion/template discovery experience, invitation preview, and a focused editor/drawer surface. Spatial interaction may be added to the organizer home only if its basic tasks remain immediately clear.

Candidate interactions to assess and implement deliberately:

- Tactile invitation/poster deck with momentum-aware horizontal swipe, snap, drag progress, visible neighboring cards and clear active selection; optional preview remains a deliberate action.
- Tilt/depth on hero or stationery for fine pointers, with a suitable touch alternative and static reduced-motion composition.
- Native-feeling bottom sheet with useful snap heights, a clear handle, drag feedback, cancel restoration, and safe scroll boundaries.
- Invitation reveal/open interaction with understandable affordance, a direct details/RSVP shortcut and a fast/static fallback.
- Controlled drag/pan/pinch for spatial browsing where it adds value; reset/zoom buttons and keyboard controls must work.
- Short, authored transition and success feedback on creation, publishing, RSVP and arrival; never delay the next action behind a long animation.

Show affordances and teach an unfamiliar gesture once, contextually. A gesture hidden behind an invisible drag area is not sufficient. Buttons, keyboard and assistive technologies must provide the same outcomes. Handle pointer cancellation, multitouch, focus, busy state and interruption. Vertical scrolling must remain natural. Do not hijack controls, browser back gestures or the whole page's scrolling; do not perform deletion, archive or bulk edits through accidental gestures. Respect `prefers-reduced-motion` and coarse vs fine pointers. Use transform/opacity and defer heavy rendering where possible.

## Enrich the product while reducing decisions

Preserve this primary journey: **choose occasion → essential details → relevant invitation already prepared → review/publish → guests → replies → reception → summary**. The template gallery, manual scene/card settings and seating are optional refinements. Improve discovery and preview rather than adding an obligatory setup step.

Make each screen's next useful action obvious. Use progressive disclosure for low-frequency controls. Dense functionality can live behind a clear secondary entry. Keep confirmation, loading, error, offline and dirty-state feedback understandable. Visual richness must not require people to make more choices, read more setup text or hunt for their current task.

Review the entire surface inventory:

| Stage | Screens | States/interactions to verify |
|---|---|---|
| Entry | Hero, events, active/past/empty list, occasion chooser | New and returning owner, all 13 types, touch/keyboard discovery, RTL |
| Creation | Event details and direct occasion link | Required validation, couple/single names, time zone, direct ready design |
| Invitation | Summary, editor, gallery, template preview, guest preview | No draft, dirty/saving/saved/error/retry, published/changed, content preservation, motion/static fallback |
| Guests | List, search/filter, details drawer, import | Independent delivery/reply/arrival states; valid files, mapping when needed, duplicates, blocked rows, review-before-commit |
| Replies | Organizer RSVP and general-link matching | Confirmed, declined, pending, unmatched; no automatic matching or fake delivery |
| Guest | General/personal invitation, details, RSVP, QR | Actual event copy, allowance limits, editing before start, confirmed/declined, unknown/unpublished/archived link, directions/calendar/program |
| Reception | Preparation, gate search, simulated QR, arrival | Partial/full arrival, duplicate/over-limit/declined/pending decisions, undo, no forced missing-table warning without seating |
| Extras/closure | Seating, more, settings, summary/archive | Capacity, safe changes, dirty-navigation guard, accurate partial-family counts, archive/restore and clear prototype messages |

All 13 occasions are: wedding, engagement, katb_kitab, henna, birthday, graduation, newborn, family, iftar, conference, opening, corporate, other. Enrich graduation especially with original visual variations, appropriate starter text/program and real date/year. Consider additional occasions' distinctive assets where the current ones feel generic. Add genuine card faces or motifs when adding templates; do not claim a new original design for a scene recolor alone.

## Behavior and data to preserve

- This is a browser-local prototype, not a connected production backend. No cross-device sync, true auth, automatic message/reminder delivery or real camera scan currently exists. Preserve honest labels; do not turn simulations into claims of real integrations.
- One invitation party may cover a family. RSVP, delivery and arrival are separate. Counts must be people-based where appropriate; partial arrival leaves remaining people.
- Opening WhatsApp is not proof of sending. Explicit organizer confirmation records delivery separately.
- New invitations prepare appropriate defaults. Published snapshots remain stable until explicit republish. Theme/template changes must not destroy user-entered content.
- Seats are optional. Do not reintroduce forced seating/map setup or missing-table warnings for occasions with no tables.
- Archive is a deliberate destructive confirmation and disables guest links; restore retains the design/data.
- Maintain serial coalescing autosave and retry behavior, safe navigation/focus restoration, offline recovery and existing service contracts.
- Sound is user-controlled and unlocks after user interaction. Failed preload has a regression fix in `src/engine/AudioEngine.js`; do not reintroduce unhandled rejections.

## Work in reviewable stages, and finish the implementation

1. Establish baseline: inspect source and actual screens, record friction and visual gaps, run integrity/build/tests. Briefly describe the chosen signature direction and key interactions.
2. Build a representative vertical slice: new hero, occasion discovery, one graduation design and template interaction, with phone/desktop compositions. Evaluate it against the owner's dissatisfaction, then apply that coherent direction throughout.
3. Improve the full organizer and guest journey, including functional states and final reception/summary screens. Create and wire the missing visual assets, not placeholder descriptions.
4. Run appropriate automated and real-browser checks, fix regressions, and provide the updated project/build and a concise review. Work autonomously on reversible implementation choices; do not repeatedly pause to ask whether to continue.

Do not spend the whole task auditing or building more theme settings. Do not migrate frameworks, redesign the domain or add a backend unless an actual requirement makes it necessary. Use this codebase's architecture and improve the product people see.

## Validation and delivery

Baseline commands:

```bash
npm ci
npm run typecheck
npm run test:unit
npm run test:dom
npm run build
npm run assets:shipped:check
node tools/check-theme-contrast.mjs
```

Update the theme contrast check if adding a theme. Add meaningful tests for new gesture/behavior failure modes rather than tests that only mirror static markup. Existing jsdom checks cover component behavior and route mounting, not pixels/WebGL/device feel. Existing browser scripts are in `tests/`; inspect and adapt assumptions that reflect older counts/designs before relying on them. Full historical `npm test`/`validate` include a legacy asset-pack audit; use the current documented checks and report that distinction.

In a permitted browser environment, inspect approximately 390px phone, 768px tablet and 1440px desktop widths; also a narrow phone and actual touch device if available. Check layout overflow, Arabic shaping, mixed-direction content, target size, focus visibility, sheet/dialog scroll/focus, pointer cancel, swipe vs vertical scroll, reduced motion, heavy scene fallback, performance and loading. Exercise a complete graduation journey and a couple-event journey through guest RSVP and partial/full reception/undo. Check empty, network-error and invalid-link screens, not only the populated hero.

Provide real screenshots or short captures for hero, template/occasion gesture, editor, guest RSVP/QR, reception and summary when your environment supports them. Clearly label anything not actually verified. Return:

- A working, integrated signature theme and its entry URL.
- Updated source and production build, all required assets and their sources/licenses.
- A short explanation of the easier journey, concrete new interactions and added artwork/templates.
- Test results, screenshots/captures, remaining limits and any deliberate tradeoffs.
- A complete ZIP, not a minimal deploy tar or a patch-only deliverable.

Success is when the owner immediately sees richer shapes, depth and personality, can discover and enjoy the gestures, and can still complete the event with fewer decisions and a natural RTL journey.
