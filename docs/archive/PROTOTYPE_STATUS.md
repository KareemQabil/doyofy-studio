# ضيوفي — حالة النسخة المصقولة

Updated 10 October 2026. This is the authoritative status for this source version. Previous checkpoint results are historical in `PROTOTYPE_STATUS_CHECKPOINT.md` and must not be attributed to this version.

## Implemented

| Journey | Current behavior |
|---|---|
| Home and workspace | Invitation-led event composition, quiet archive, one next action, three visible journey stages (invitation → guests/replies → reception/summary), three contextual facts, ranked attention, recent activity. Essential navigation keeps invitation, guests and reception visible; tables/settings/summary are disclosed as extra details. Tables and map links do not count against required readiness. |
| Create | Direct catalogue of 13 occasions with categories, Arabic search and RTL keyboard selection. Contextual CTA, validation and phone form-first composition. Occasion links skip repeated selection; creation enters the editor with occasion-specific design, message and program ready. Previous Coverflow and Rail remain reviewer options. |
| Invitation | 59 curated presets across 19 original card faces covering all 13 occasions, six initial posters, explicit show-more, preserved texts on template change, real preview and guest preview. Optional program and manual card/scene pickers are collapsed. Four editor sections, serial coalescing autosave with retry, explicit publish states and next-step confirmation. |
| Guests / import / replies | Three compact facts, primary/advanced filters, preserved search, independent delivery/reply/arrival states, drawer contextual action, Excel/CSV/paste review, duplicate decisions, manual response and general-link matching. |
| Guest | Existing cinematic experience plus immediate date/RSVP access. Named replies retain allowance validation, QR and editing rules. General replies can be submitted directly and await organizer matching. |
| Tables / reception | Existing assignment, warnings and overcapacity confirmation; seat decoration bounded for large tables. Preparation-first reception, partial/full arrivals, explicit exceptions, undo and simulated code scanning. |
| Settings / closure | Section-based event details and reply rules, safe archive, accurate partially arrived counts, copyable thank-you with simulated sending secondary. |
| Review / tools | Nine appearances (including independent Orbit, Bahja and Horizon UX) and nineteen raster images plus code-native orbital artwork connected in `/prototype/design-directions`; all main routes connected in `/prototype/design-review` and a six-stage screen index in `/prototype/screen-review`; tools hidden until enabled or offline recovery. Existing scenarios, roles, latency, offline and reset controls retained. |
| Orbit | Spatial task map with pan/two-pointer pinch and per-event node layout, chapter creation, focused template desk, explicit editor preview, selectable table atlas, reply lenses, command search and keyboard/button alternatives. See `ORBIT_EXPERIENCE.md`. |
| Bahja | Large typographic hero, sculptural coral/cobalt/citron assets, focused event story, occasion posters, four essential workspace destinations and optional extras; RTL keyboard/swipe template salon, intentional playback and reduced-motion support. See `BAHJA_EXPERIENCE.md`. |
| Horizon | Cobalt editorial graduation hero, all 13 occasion entry points, focused four-step workspace and disclosed extras. Six new native stationery faces; automatic occasion defaults. See `HORIZON_REVIEW.md` for the screen sequence and verification boundaries. |
| **«توقيع» (signature, theme 9)** | The owner-chosen mix of three modes: A «احتفال» (red mesh hero with a swipeable fan of real invitations), C «تحرير» (editorial data screens, colour tiles, Phosphor spots), B «مساء» (envelope reveal, editor stage, reception). Official logo, pattern and colours; the Ping AR + LT brand font is used locally with permission only. Three new faces (sig-diploma, sig-ribbon «حروف الفرح», sig-ticket) with 9 presets; the graduation starter is sig-diploma. Tactile deck, seal reveal and three-stop editor sheet, each with keyboard, button and reduced-motion equivalents. Reviewer page `/prototype/signature-directions`. No generated imagery. Evidence: `review/FINAL_VERIFICATION.md`. |
| Assets | Nineteen original worlds/occasion objects shipped as optimized transparent WebP with original PNGs retained in source. Missing audio/material assets recovered from attached latest build. UI and invitation fonts self-hosted with licenses. Required P0 assets fail the build if missing and are tracked in source. |

## Checks actually run for this version

**«توقيع» pass (latest):** typecheck pass; unit **64/64**; build pass; shipped assets **121/121**; token contrast **234/234**. Real-browser signature journey **73/73** at 390/768/1440. Narrow 360 and enlarged-text overflow **32/32**. No generated imagery on signature routes. DOM (jsdom) **not re-run**: the registry is blocked. Details: `review/FINAL_VERIFICATION.md`. The table below is the earlier Horizon-pass record.

Current detailed results and remaining manual review are in `HORIZON_REVIEW.md`.

| Check | Result |
|---|---|
| TypeScript application + unit types | Pass |
| Domain/service tests | **40/40 pass**; includes full create → publish → personal RSVP → table → partial/full arrival → undo journey, general matching and offline feedback |
| DOM component behavior (jsdom) | **32/32 pass**, plus malformed-route check: scroll-lock cleanup, safe destructive focus, RTL chooser keys, WhatsApp/manual confirmation, replacing nested dialogs, direct general RSVP, StrictMode mutation feedback; Orbit pinch/pan/cancellation and viewport restoration, layouts, catalogues, command search, creation/template save/editor routing, table focus and reply navigation; Bahja direct occasion creation → review → template change → publication → guests, salon scroll/cancel/busy handling and simplified navigation |
| DOM route mounting (jsdom) | **20/20 existing + 16/16 Orbit + 16/16 Bahja + 16/16 Horizon pass**: home, create, overview, invitation, templates, phone editor, guests/import/replies, tables, reception/gate, settings, summary, reviewer and missing-event recovery. Rendering engines/viewport observers are not simulated as visual evidence. |
| Sites production build | Pass; 25 referenced P0 assets, 27.5 MB, no missing required references |
| Shipped asset references | **112/112 present**; remote Google font dependency removed |
| Eight appearance token contrast | **208/208 text/action/status pairs ≥ 4.5:1**; static token check only |
| Browser E2E, visual accessibility, WebGL animation, device overflow / touch | **Not run** in this environment. Required Sites control-browser capability unavailable; no substitute browser or preview server used. |
| Before/after/final screenshots | **Not captured**; review-screens contains capture instructions, no fabricated images |

DOM tests do not verify layout, CSS contrast, native browser top-layer behavior, real keyboard/touch feel or rendering. Responsive CSS is implemented; actual viewport/device testing remains required.

## Prototype boundary

Data is stored in the current browser; same-browser tabs synchronize. Separate devices do not share events or replies. Authentication/roles, automatic delivery/reminders/thank-you, and camera scanning are mocked. A real QR and WhatsApp composer link are provided; opening WhatsApp never proves delivery. This is a private review prototype, not a connected production event service.

## Source provenance

The latest attached ZIP contained compiled output only. The maintainable source recovered was the earlier Quiet Editorial checkpoint with 17 passing baseline tests. It was polished directly; missing assets were recovered from the latest compiled attachment. We do not claim byte-equivalence with that later build or that its reported 21 tests were available. See `CODEX_POLISH_AUDIT.md`.
