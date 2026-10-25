# أفق — جولة شاشة بشاشة

10 October 2026. Additive eighth organizer theme. Review entry: `/prototype/screen-review?theme=horizon`; home: `/app/events?theme=horizon`.

## Design and assets

Cobalt, ink, pale paper and mint geometry. Independent two-column graduation hero with a live example poster, actual occasion list and six initially exposed occasion choices. Seven further occasions are disclosed. All 13 remain reachable. Workspace uses four essential destinations with optional details; mobile uses four bottom destinations. Logical properties preserve Arabic source/reading order; animations honor reduced motion. The current invitation design is independent of the organizer theme.

Six original 300×420 native DOM/SVG stationery faces live in `src/cards/occasion-cards.js`: graduation editorial, campus seal, graduation constellation, birthday confetti, newborn moon and forum grid. Each has three actual engine-recommended scene pairings. The catalogue now has **16 faces / 50 presets**, including **9 new graduation presets over 3 original faces**. New defaults select an occasion design automatically; saved drafts are preserved. SVG hero backdrop is shipped at `assets/directions/horizon-world.svg`. All text derives from the actual names, event, date and place; no fixed graduation year. Full names wrap; script markup is escaped.

## Review sequence

| Stage | Screens and states | Automated coverage this pass |
|---|---|---|
| Start | Hero, active/past list, all occasions, create and preselected graduation | DOM hero/navigation; create flows; service validation for all 13 occasions |
| Invitation | No draft, editor, optional gallery, preview, publication and changed design | Direct editor empty action; template/content preservation; preview route including no-WebGL fallback; autosave retry; published service snapshot |
| Guests | List/drawer, import mapping/review, replies and general-link matching | Drawer/dialog behavior; sample import blocks ambiguous rows before approval; duplicate/parser tests; personal/general reply services |
| Guest | Cinematic entry, immediate details, RSVP, confirmed QR, unknown invitation | Direct personal hub/QR and general RSVP form; human unknown-link screen; actual invitation data |
| Reception | Preparation, search, code simulator, partial/full arrival, exceptions, undo | Reception search → partial arrival → undo with no seating warnings; domain exception decisions; full/partial services across all occasions |
| Closure | Optional tables, settings, archive, summary, more | Route mounts; invalid map blocks save; archive cancel; archive/restore services; accurate remaining-person counts |

## Corrections found while testing

- No-draft invitation no longer asks for a template before showing the prepared design or claims that single-name occasion cards are unavailable.
- Guest program uses “برنامج المناسبة”; reception subtitle is no longer duplicated.
- Settings date minimum uses the event timezone.
- Reception only warns about missing tables when tables are actually used.
- Failed sound preloads are handled; their cues use synth fallback rather than leaving an unhandled rejection. Dedicated regression test covers offline preload and emit.

## Verification boundaries

TypeScript, 40 domain/service tests, 32 jsdom behavior checks, 20 general route mounts plus 16 each in Orbit, Bahja and Horizon, 112 shipped asset references, 208 token contrast pairs and production build pass. React review: hooks stay unconditional, current data subscriptions are reused, expensive engine remains dynamically loaded, decorative vectors are hidden from assistive technology, focus/navigation are keyboard reachable, and no stored invitation changes when switching themes.

jsdom explicitly has no WebGL context. Preview route mounting verifies its DOM/fallback path, **not rendering, timing, sound playback or device performance**. No browser or screenshots were run: in this managed Sites environment the required control-browser capability is unavailable and the Sites skill disallows substitute browser QA. Manual review still needs 390/768/1440 widths, iOS/Android touch and safe areas, actual 2D/3D playback, reduced motion, long Arabic names, focus visibility and the live guest-to-reception flow.

Events, replies and reception remain browser-local prototype data. No cross-device backend, real authentication, real message delivery or camera scan was added.
