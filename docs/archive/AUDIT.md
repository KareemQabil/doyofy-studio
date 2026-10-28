# Forensic audit — Invitation Studio

Date: 2026-10-02/03. Everything below was traced from source, or measured from the running original. Nothing is inferred from file names.

## 0. What was supplied vs. what the brief expected

| Expected (brief) | Supplied | How it was handled |
|---|---|---|
| `01_CANONICAL_ORIGINAL/` (Studio html, CardFace, Scene, template, unpacked) | **Not in the upload.** The canonical sources exist as the live Design-canvas artifact *Animated Wedding Invitation* (page "Interactive flow"). | Read from the live artifact (version `1790931850-b3cf`) and copied to `canonical/`: `Studio.dc.html`, `CardFace.dc.html`, `Scene.dc.html`, `motion.css`, `canvas.json`. |
| `02_PRODUCTION_ENGINE/invite-engine-production-p0-v3-staged.zip` | **Not supplied.** | Not reconstructed or guessed. The earlier engine from this project (`invite-engine` v1, Sunlit flagship) was reviewed. Its reusable parts were re-implemented under the Studio contract (see §6). |
| `06_HANDOFF_NOTES/START_HERE_NEXT_AGENT.md`, runbooks, catalogs, license/asset indexes | **Not supplied.** | Indexes rebuilt from the three P0 pack manifests and the files themselves (`asset-index.json`, `license-index.json`, `docs/ASSET_PROVENANCE.md`). |
| `tools/install_p0_packs.py` | **Not supplied.** | Re-written (`tools/install_p0_packs.py`) with the same command line as the historical workflow. |
| P0 packs A1 / A2 / B | **Supplied** (3 zips, 178 MB) | Installed. `npm run assets:check` reports present **63/63**, required missing 0, READY. |

The live canonical Studio differs from the earliest local draft in exactly one design edit: the intro credit was moved to `top: 343px`. The other differences are only self-closing vs. explicit SVG tags. The edit is kept.

## 1. Canonical source files

| File | Size | Role |
|---|---|---|
| `canonical/Studio.dc.html` | 46 969 B | **The product.** The 390×844 interactive flow. It holds the whole template (scene slot, 3-D card rig, invitation sheet with the 5 pages, envelope, credit, thank-you, controls, switcher) and a `DCLogic` class: the state machine, Web Audio synth, pointer tilt, page gestures, RSVP and the THEMES table. |
| `canonical/CardFace.dc.html` | 40 054 B | The 10 card designs, as one 300×420 component switched by `design`. It has shared SVG `<defs>` (embossed roses, gold roses, leaves, watercolour filters, star pattern…). Content comes from the `content` prop, with defaults equal to the sample. |
| `canonical/Scene.dc.html` | 34 584 B | The 10 backdrops, as one 390×844 component switched by `scene`. It has 3 parallax depth layers (`pf`/`pm`/`pn` from `tiltX`/`tiltY`) and seeded particle lists (bokeh, stars, bulbs, fireflies, petals, clay dots, sea reflections). |
| `canonical/motion.css` | 18 083 B | The **motion language**: `fx-*` loops/entrances and every Studio state rule (`.s-intro … .s-done`). |
| `canonical/canvas.json` | 1 136 B | Canvas layout: page *flow* = Studio; page *library* = Gallery, CardFace, Scene; page *drafts* = Main (Ivory Lace first draft), RSVP3D. |
| Gallery / Main / RSVP3D `.dc.html` | — | Library and first drafts. They are not part of the product flow. Main and RSVP3D are superseded by Studio and stay as references in the canvas. |

Runtime: the canvas `dc-runtime.js` (bundles React 18.3.1 and ReactDOM). It renders `{{holes}}`, `<sc-if>`, `<sc-for>` and `<dc-import>` from the HTML, evaluates the `DCLogic` class, and fetches sibling components relative to the page. It is used **only** to run the unmodified original for the baseline (`tests/baseline.mjs`). It is not redistributed.

## 2. Original runtime architecture (Studio.dc.html)

```
.st (390×844, perspective 1100px @ 50% 42%, class s-<stage> [+ no-intro])
├─ svg defs (st-wax gradient, st-grain filter)
├─ .st-layer ─ <dc-import Scene scene tilt-x tilt-y>        z auto
├─ .st-dim (opening/pages/done 1, pack/seal/fly .35)          z 8
├─ .st-shadow (blurred ellipse at y 600)                      z 5
├─ .st-rig (45,168 300×420) › .st-tilt (rx,ry) › .st-bob (7 s) › .st-intro (fly-in 2.2 s→4.8 s) › .st-flip
│    ├─ 4 edges (accent gradients)  ├─ front: <dc-import CardFace design content> + .st-glint
│    ├─ back (env colour, monogram, date)  └─ .st-cardbtn (Open the invitation)     z 6
├─ .st-hint (tap to open, from 4.8 s)                         z 9
├─ .st-sheet (18/58, 354×728, r 18) › close · monogram · .st-page (one of 5) · nav (prev, 5 dots, next)   z 10
├─ .st-streak, .st-env › .st-shake › .st-envbox (back, mini-card, 3 pockets, flap, flash, wax seal)        z 11–12
├─ .st-credit (top 343)  z 19 · .st-done z 21 · .st-black z 18 · grain z 17 · .st-bar top/bot z 20
├─ .st-ctrls (palette | replay, sound)                         z 24
└─ .st-switch (bottom sheet: 10 card chips, 10 scene chips)    z 30
```

### State machine (from `componentDidMount`, `openCard`, `submit`, `replay`)

| From | Event | To | Source | Measured on the running original |
|---|---|---|---|---|
| intro | timer 4700 ms | card | `componentDidMount → later(…, 4700)` | **4 705 ms** |
| card | tap card | opening | `openCard` | — |
| opening | timer 950 ms | pages (page 0, music starts) | `openCard → later(…, 950)` | **945 ms** |
| pages | close (×) | card | `closeSheet` | — |
| pages | submit (valid) | pack | `submit` | — |
| pack | +1750 ms | seal (thump at +1.25 s into seal) | `submit` | **1 752 ms** |
| seal | +1750 ms (3500 from submit) | fly | `submit` | **3 499 ms** |
| fly | +1450 ms (4950 from submit) | done | `submit` | **4 953 ms** |
| any | replay | unmount 40 ms → intro | `replay` | — |

Page change: `leaving` is held for 340 ms, then the next page renders with staggered `fx-rise`. Swipe needs |dy| > 50 px with dy dominant (ignored on INPUT). Wheel needs |deltaY| ≥ 24, debounced 900 ms. Tilt is active only in intro/card: `rx = −ny·16°`, `ry = nx·20°`, rAF-throttled.

### Card rendering

`CardFace` renders the selected design. Content is a flat object (`arA, arB, enA, monoA, dayAr, dateEn, dateNum, venueEnU…`); in the Studio it is hard-coded inside `renderVals()`. The Studio's **THEMES** table colours everything around the card: paper, ink, muted, accent, aText, env, fAr for the sheet, back, edges and envelope.

### Scene rendering

`Scene` renders one of 10 DOM/SVG compositions. Pointer → `t(dx,dy)` translates three layers (8/6, 20/14, 40/26 px). All particles come from a seeded LCG (seed 11), so positions are deterministic.

### Audio

All audio is synthesized with Web Audio:

- **Bell:** sine partials 1/2/4.01.
- **Noise sweep:** band-pass.
- **Thump:** 120→42 Hz plus click.
- **Music:** a bell arpeggio over 4 chords at 340 ms steps, playing while the pages are open.

The master gain is 0.22. The AudioContext is created on the first tap of the card. The sound toggle mutes everything and stops the music.

### RSVP

There's a name field and yes/no pills; guests go 1–8 with a default of 2. Validation requires a name **and** an answer, and a hint line appears below the submit button. Submission only changes the stage; **nothing is persisted**. The thank-you text depends on the answer and the guest count.

### Envelope finale

The mini card drops into the envelope (pack), the flap closes, the wax seal stamps with shake and flash (seal), the envelope launches up with a gold streak and the letterbox closes (fly), then the thank-you appears.

## 3. Original → production map

| Original feature | Original file / function | New engine subsystem | Production implementation | Fallback |
|---|---|---|---|---|
| 390×844 stage, perspective 1100 @ 50% 42% | `.st` (motion.css) | Studio stage + `_fit()` | Same element tree and classes, contain-scaled into any viewport (`src/studio/Studio.js`, `markup.js`) | — |
| State machine and timings | `componentDidMount`, `openCard`, `submit`, `replay` | `engine/StateMachine.js` (`TRANSITIONS`, `CANONICAL_TIMING`) | Data-driven table; durations from RevealRegistry and FinaleRegistry | — |
| Motion language | `motion.css` | `styles/canon-motion.css` (generated copy) | Unchanged CSS, plus production layer `styles/studio.css` | Reduced-motion overrides in `studio.css` |
| 10 card designs | `CardFace.dc.html` | `CardRegistry` (`src/cards`) | Markup generated 1:1 by `tools/port-canon.mjs` → `cards/canon/generated.js` | — (SVG/DOM is the production card) |
| THEMES table | `Studio renderVals THEMES` | Card metadata `theme` | `cards/index.js` | — |
| 10 scenes | `Scene.dc.html` | `SceneRegistry` (`src/scenes`) with ordered renderers | Candlelit: **Three.js** `scenes/three/candlelit-hall.js`. Others: DOM/SVG generated `scenes/css/generated.js` | Every scene ends with its canonical DOM renderer |
| Scene parallax | `Scene renderVals t()` | Renderer `setPointer(nx, ny)` | DOM: CSS vars `--pf/--pm/--pn`. Three: camera parallax plus card-proxy tilt | — |
| Content (names, date, venue, program) | literals in `renderVals` (Studio and CardFace) | `InvitationData` | `data/invitation.js` → `data/derive.js` (Intl, time zone, overrides) | `display.*` overrides |
| 5 pages | Studio `<sc-if p0…p4>` | `PageRegistry` (`src/pages`) | Same markup; live values updated in place | — |
| Countdown | `setInterval → forceUpdate` | Studio `_tickCountdown` | Text nodes updated, no re-render | — |
| RSVP | Studio state + `submit` | Studio RSVP + `engine/rsvp.js` adapters | Same validation; **persisted** via LocalRSVPAdapter (REST/Supabase adapters provided) | In-memory if storage is blocked |
| Envelope finale | `.st-env` CSS + `submit` timers | `FinaleRegistry('envelope')` | Same markup and CSS; timings from the registry | Reduced-motion fades |
| Audio | `bell/noise/thump/startMusic` | `engine/AudioEngine.js` + `AudioRegistry('studio')` | Real P0 Mixkit cues mapped to events; canonical bell music | Canonical synth voice per cue if its file fails; the seal thump stays synth (no P0 stamp asset) |
| Switcher 10×10 | `.st-switch`, `cardChips`, `sceneChips` | `studio/switcher.js` + compatibility metadata | Same sheet; ✦ marks recommended pairings; card swap keeps the scene and vice versa | — |
| Replay | `replay` (alive=false 40 ms) | Studio `replay()` | Timers cleared, stage subtree re-inserted (animation restart), scene `setStage('reset')` | — |
| Sound toggle | `toggleSound` | Studio `toggleSound` | Same labels and aria | — |

## 4. Real assets

63 logical P0 assets: 17 GLB, 3 HDRI, 9 PBR sets, 9 video, 12 images, 12 audio, 1 Canva. Details and licences are in `docs/ASSET_PROVENANCE.md`.

Used by production (`asset-index.json` › `usedBy`):

| Group | Assets |
|---|---|
| Models (5) | chandelier, goblets, brass vase, flower (empodium), lantern |
| HDRI | courtyard (2k on high; derived 1k on balanced) |
| PBR | rough linen, plastered wall 03, marble 01 |
| Audio (9) | Mixkit cues |

Installed but **not used** by the canonical product:

- the 9 Mediterranean videos (curtains, courtyard, window light);
- the 12 Mediterranean photos;
- the remaining 12 GLBs and 6 PBR sets;
- 2 HDRIs;
- the Mediterranean Canva card.

They are available to future scene renderers and documented as unused, never presented as integrated.

## 5. Missing / not available

- **The exact original Canva export (DAHWaLT4OLI)** is not in the packs. Per the brief, the canonical CardFace SVG/CSS designs remain the cards. No "exact" replacement was fabricated.
- **A wax-stamp/impact recording** is absent, so the seal keeps the canonical synthesized thump.
- **Font binaries:** none are bundled (licences unverified in this handoff). The Studio loads the same Google Fonts as the original. Without network the browser's Arabic and serif fallbacks are used. The QA sandbox cannot reach Google Fonts, so all baseline and QA screenshots on both sides use fallback fonts.

## 6. Duplicated systems / dead code / experiments

- **Duplicated in the original:** the content object exists twice (Studio `renderVals` and CardFace `base`). It is now one `InvitationData`.
- **Canonical quirks fixed deliberately:**
  - the RSVP validation hint used to shift the form when it appeared; the line is now reserved;
  - focus is now managed (sheet on open, card button on close, "Watch again" on done);
  - reopening the card starts at page 1, as in the canonical code;
  - replay now also resets the RSVP form (the canonical kept the typed name).
- **Experiments that stay isolated:**
  - `invite-engine` v1 (Sunlit Architectural Botanical flagship, built earlier in this project). It replaced the Studio's default pairing, which is the same class of mistake the brief warns about. It is **not** part of this product. Its reusable ideas (registry contract, adaptive quality tiers, audio-event engine, RSVP adapters, asset pipeline, stage-fit framing) were re-implemented here under the Studio contract.
  - The Mediterranean P0 material and Canva sample: installed and indexed, but not used by the canonical flow.
- **Dead code:** none shipped. Gallery, Main and RSVP3D from the canvas are not ported (library and drafts only).
