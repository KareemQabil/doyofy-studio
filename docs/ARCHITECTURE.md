# Architecture

The product is the canonical **Invitation Studio** flow. Underneath, a small composable engine separates every layer, so cards, scenes, reveals, finales and audio are LEGO pieces.

```
InvitationData ──derive──▶ content c (names, Intl dates in the event time zone, links, program)
                                      │
Registries ─────────────────────────▶ Studio (src/studio/Studio.js)
  Card · Scene(renderers) · Page ·      ├─ virtual 390×844 stage, contain-fit to any viewport (_fit)
  Reveal · Motion · Interaction ·       ├─ StateMachine (canonical states + timings, data table)
  Camera · FX · Audio · Finale ·        ├─ card surfaces (face, back, edges, sheet theme, envelope)
  Preset                                ├─ scene renderer: DOM placeholder now → best renderer crossfades in
                                        ├─ pages + RSVP adapter + finale + switcher + controls
                                        └─ AudioEngine (event → cue)
```

## Folders

| Path | Layer |
|---|---|
| `src/data/` | **Content.** `invitation.js` (InvitationData), `derive.js` (canonical content shape, Intl, countdown, calendar/map links), `strings.js` (bilingual UI copy) |
| `src/engine/` | `Registry.js`, `registries.js`, `StateMachine.js`, `AudioEngine.js`, `Quality.js`, `rsvp.js` |
| `src/cards/` | **Card templates.** `index.js` (registry entries, metadata, THEMES) and `canon/generated.js` (10 faces generated from the canonical CardFace) |
| `src/scenes/` | **Environments.** `index.js` (registry, renderer lists), `css/` (canonical DOM/SVG renderer, generated), `three/candlelit-hall.js` (Three.js) |
| `src/pages/` | **Storytelling pages.** Invitation, Date, Program, Venue, RSVP |
| `src/camera/framing.js` | WebGL camera framing from the stage rect |
| `src/audio/` | Audio pack (event → cues), per-scene ambience |
| `src/modules.js` | Reveal / motion / interaction / camera / FX / finale / preset registrations (timing and metadata) |
| `src/studio/` | Studio controller, static markup port, switcher |
| `src/wizard/` | **Customer wizard**: `Wizard.js` (5 steps, live embedded Studio preview, draft in localStorage), `config.js` (design config ↔ `?i=` base64url guest link, time zones), `wizard.css` |
| `src/styles/` | `canon-motion.css` (generated copy of the canonical motion language) and `studio.css` (production layer) |
| `canonical/` | Source of truth (Design-canvas components) |
| `tools/` | Build, serve, canonical port generator, P0 installer, asset check/index, derived variants |
| `tests/` | `baseline.mjs` (original), `capture.mjs` (16-state capture), `qa.mjs` (functional + visual matrix), `look.mjs` |

## Registry contract

Every module is `defineModule(kind, def)` with:

- **identity:** `id`, `name`, `tags`;
- **behaviour metadata:** `renderMode`, `assets`, `compat { recommended, compatible, incompatible, requires }`, `quality { min, heavy }`, `mobile`, `reducedMotion`;
- **lifecycle hooks:** optional `setup / enter / idle / interact / exit / destroy`.

Nothing in the Studio branches on a specific card or scene id. Behaviour comes from metadata, renderer lists and registry timings.

## Render modes

| Mode | Where | Notes |
|---|---|---|
| DOM/CSS + SVG | all 10 cards, all 10 scenes (canonical renderers), pages, envelope | generated 1:1 from the canonical source |
| Canvas | — | supported by the contract; not needed by the canonical scenes |
| Three/WebGL | **Candlelit Hall** | real Three.js r170: PBR, GLB, PMREM HDRI, ACES, shadows |
| Video | — | the contract allows a `video` renderer; the P0 plates are Mediterranean and unused by the canonical scenes |
| Hybrid | Candlelit Hall | WebGL room behind a DOM card, pages and finale (crisp Arabic type, accessible forms) |

The Three scene never owns the invitation. The card, sheet, RSVP form and envelope stay DOM. An invisible proxy of the card in the WebGL scene casts the card's shadow on the table and follows the CSS bob and pointer tilt.

## Scene renderer contract

```js
{ mode: 'three' | 'dom' | …, label, minQuality, requires: ['webgl'], timeoutMs?,
  mount(layerEl, ctx) → Promise<{ mode, el, setPointer(nx, ny), setStage(state|'reset'), resize(stageRect), destroy(), stats?() }> }
```

`ctx` gives the renderer quality, asset base, `stageRect()`, `state()`, `card()`, `introStart()` and reducedMotion.

`SceneRegistry` entries list their renderers best-first. The Studio:

1. mounts the scene's **DOM renderer immediately**, so the stage is never blank;
2. tries heavier renderers allowed by WebGL availability, the quality tier and `?renderer=`, each with a timeout;
3. crossfades the first that succeeds over the DOM scene and destroys the DOM one;
4. on failure or timeout, keeps the DOM renderer and logs to `studio.debug.sceneErrors`;
5. destroys a renderer that resolves after its timeout, so it can't leak.

Migrating another scene to WebGL means adding one renderer in front of its DOM renderer.

## Stage and camera framing

- The DOM stage is contain-scaled: `s = min(W/390, H/844)`. Beyond it, overlays (dim, black, letterbox) extend across the viewport through a `clip-path` hole the size of the stage, so on wide screens the canonical overlays still read full-bleed. DOM scenes add a blurred, cover-scaled echo of themselves outside the stage.
- The WebGL camera is **computed, never hard-coded** (`camera/framing.js`):
  - the stage maps to the world plane z = 0 at 1 px = 1 mm;
  - `distance = max(heightDistance, widthDistance)` from the contain-fitted stage rect;
  - a lens shift (`setViewOffset`) puts the principal point on the stage's CSS perspective origin (50% 42%), so the CSS-3D card and the WebGL room share one vanishing point;
  - wider screens reveal more of the hall; the card is never cropped.

## Quality tiers (`engine/Quality.js`)

| Tier | Detection | Candlelit Hall |
|---|---|---|
| high | desktop-class | HDRI 2k (RGBM16 PNG) → PMREM, all props, 2048 PCF-soft shadows, glass transmission, DPR ≤ 2 |
| balanced | touch / small screen / ≤4 GB | HDRI 1k (RGBM16 PNG), props, 1024 shadows, transmission replaced by alpha glass, DPR ≤ 1.5 |
| low | save-data / ≤2 GB / ≤2 cores | room, table, candles, chandelier; no HDRI, props or shadows; DPR 1 |

Override with `?quality=`.

At runtime the renderer measures frame time. If 45 rendered frames average over 40 ms it steps the pixel ratio down (×0.8, floor 0.6). While the sheet covers the room (opening/pages), it renders at a third of the rate.

Without WebGL the canonical DOM renderer is used. `?renderer=dom` forces it.

## Audio

Components call `audio.emit(event)`. The pack maps each event to cues:

| Event | Recorded cue (P0 Mixkit) | Synth fallback |
|---|---|---|
| open | cinematic whoosh + relaxing chime | canonical noise + bells |
| page | page turn | noise sweep |
| click / choose | interface click / select click | short noise |
| pack | paper slide | noise |
| seal | — (no P0 stamp asset) | **canonical thump** |
| fly | fast whoosh | noise sweep |
| done | crystal chime | bell arpeggio |

- Music is the canonical synthesized bell arpeggio, playing while the pages are open.
- Scene ambience is optional: morning birds under Marble Morning only.
- Nothing is audible before the first pointer or keyboard gesture.

## Accessibility

- The card is a real `<button>` with an aria-label; the sheet is a labelled `<section>`.
- Focus moves to the sheet on open, back to the card on close, and to "Watch again" on done.
- The sheet is `inert` when hidden.
- Navigation: page dots carry `aria-current`; keyboard ArrowUp/Down and PageUp/Down change page; Escape closes.
- RSVP feedback: the hint is `aria-live`, invalid fields get `aria-invalid`, and the guest count is an `<output>`.
- Reduced motion (OS setting or `?motion=reduced`):
  - the flow starts settled on the card;
  - idle loops are removed and entrances become fades;
  - the state machine and finale keep working.

## URL options

`?card=<id>&scene=<id>` · `?start=intro|card|pages|rsvp|done` · `?quality=high|balanced|low` · `?renderer=auto|three|dom` · `?motion=reduced|full` · `?author=1` (switcher shows the active renderer and any fallbacks)

## Customer wizard and experiences

`main.js` routes `/` to the **Wizard** and `?view=invite` / `?i=` to the invitation.

The wizard builds a config, `{ v: 1, experience: { dimension: '3d'|'2d', motion: 'animated'|'static' }, card, scene, invitation }`, and previews it with an **embedded Studio**: `new Studio(host, { embedded: true, showSwitcher: false, muted: true, experience, … })`.

| Change in the wizard | What the preview does |
|---|---|
| card | `setCard()`, in place |
| setting | `setScene()`, in place |
| details | `setContent(invitation)`, in place (debounced) |
| experience | rebuild the preview |

The guest link encodes the config as base64url JSON (`wizard/config.js`).

How `experience` maps onto the engine:

| Experience | Engine effect |
|---|---|
| `2d` | `quality.renderer = 'dom'`: the canonical illustrated renderers only |
| `3d` | renderer `auto`: the best renderer per scene. The wizard lists only scenes with a `three` renderer |
| `static` | `quality.reducedMotion = quality.static = true`: no intro, CSS idle loops off, fades instead of travel. The Three scene renders a settled, fully lit still and then only re-renders when something changes (no flicker, no camera motion, no pointer parallax) |

Wizard actions use `data-wz` attributes, and clicks/inputs inside the embedded invitation are ignored by the wizard. That keeps the two UIs independent.

## Doyofy platform layers (October 2026)

The Invitation Studio is now one feature of the Doyofy prototype. Platform code is layered:

| Layer | Folder | Depends on | Notes |
|---|---|---|---|
| Domain | `src/domain/` | nothing | Entities (`types.ts`) and pure rules: parties/counts, RSVP, seating, check-in, import, overview, activity text, Arabic formatting |
| Services | `src/services/` | domain | `contracts.ts` = the API the backend must implement. `mock/` = browser-persisted implementation with latency, offline simulation, cross-tab sync and seed data. `index.ts` picks the implementation |
| UI kit | `src/ui/` | — | `styles/tokens.css` (all raw colours; `.theme-guest`, `.theme-gate` re-themes), primitives (Button, Field, Dialog/Drawer on native `<dialog>`, Badge, Banner, EmptyState, Toast, FilterChips, Stepper, Menu…), layouts (AppShell, WorkspaceLayout, PageHeader, FocusLayout) |
| Features | `src/features/<journey>/` | domain, services (via hooks), ui | Screens and feature components. No storage calls, no raw colours |
| App | `src/app/` | all | Entry, router (history or hash mode, navigation blocking), data hooks (`useQuery` / `useMutation`), route table |

**The Studio's integration boundary** is `src/features/invitation/engine.ts`, which lazy-loads `engine-impl.ts`. It's the only import path into `studio/`, `wizard/`, `cards/`, `scenes/` and `data/`. Three opt-in options:

| Option | What it does |
|---|---|
| `Studio` `guest` | The party from a personal link: locked name, allowance as the max count, prefilled reply |
| `Studio` `doneAction` | An extra button on the thank-you screen |
| `Wizard` `platform` | Initial state, `toInvitation()` (event data merged in), `onChange` (autosave), `onAction` (publish / preview / edit event / done), `status()` |

The legacy standalone routes (`?view=invite`, `?view=wizard`, `?i=`) still run `src/main.js` unchanged.
