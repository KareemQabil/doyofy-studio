# Historical engine checkpoint

These labels describe the earlier engine checkpoint, not verification of the current published app. Current evidence and prototype limits are in `PROTOTYPE_STATUS.md` and `HORIZON_REVIEW.md`.

Honest labels: **production** = built with the target technique and assets and visually verified; **canonical** = the original design ported 1:1 (DOM/CSS/SVG); **fallback** = used only when something better can't run.

## Canonical flow

| Part | Status | Implementation |
|---|---|---|
| 390×844 stage, scaled to any viewport | production | DOM, contain-fit, overlays extended full-bleed |
| Intro (black, credit, card from depth, letterbox) | canonical | CSS (canonical motion.css); WebGL room joins the intro clock (exposure lift, dolly, candles igniting) |
| Card (10 designs) | canonical | DOM + inline SVG generated from CardFace.dc.html. This is the production card: crisp type, accessible button |
| Pointer tilt + parallax | canonical / production | CSS tilt; DOM scenes use the canonical 3-layer translate; WebGL uses real camera parallax plus a card-proxy shadow |
| Opening → pages | canonical | CSS flip + sheet; 950 ms |
| 5 pages (Invitation, Date + countdown + calendar, Program, Venue + directions, RSVP) | production | DOM, data-driven from InvitationData; live values updated in place |
| RSVP | production | validation, yes/no, guests 1–8, submit-once guard, LocalRSVPAdapter (REST/Supabase adapters provided, **not wired to a backend**) |
| Envelope → seal → fly → done | canonical | CSS; timings from FinaleRegistry (+1.75 / +3.5 / +4.95 s measured) |
| Replay, sound toggle, switcher (10×10) | production | replay resets cleanly; card swap keeps the scene and vice versa |
| Reduced motion | production | starts on the card; idle loops off; fades instead of travel |

## Scenes

| Scene | Renderer | Status |
|---|---|---|
| **Candlelit Hall** | **Three.js r170 (WebGL)**, with canonical DOM as fallback | **production**. PBR linen/plaster/marble (Poly Haven); GLB chandelier, goblets, brass vase + bloom, lantern (Poly Haven); HDRI → PMREM reflections; ACES Filmic at exposure 0.72; PCF-soft shadows; physically based candle, sconce and chandelier lights; computed framing; 3 quality tiers plus adaptive DPR |
| Marble Morning | DOM/CSS + SVG | canonical (+ morning-birds ambience from P0) |
| Garden Night, Desert Sunset, Starry Night, Silk Drapes, Floating Petals, Clay Stage, Moonlit Sea, Palace Arches | DOM/CSS + SVG | canonical |

Scenes other than Candlelit are **not** WebGL. They are the canonical CSS/SVG scenes, and the renderer contract lets each one migrate independently.

## Audio

| Cue | Status |
|---|---|
| open, page, click, choose, pack, fly, done | production: P0 Mixkit recordings (local), with a synth fallback per cue |
| seal | canonical synthesized thump (no P0 recording exists for a wax stamp) |
| music during pages | canonical synthesized bell arpeggio |
| ambience | Marble Morning only (P0 morning birds) |

## Performance

The build code-splits so three.js and the scene load only when the WebGL renderer is chosen: app 128 KB + CSS 21 KB, Three chunk 622 KB min.

| Tier | Shipped assets for Candlelit |
|---|---|
| high | ≈ 21 MB (2k RGBM HDRI 4.9 MB + models + PBR maps) |
| balanced | ≈ 17 MB (1k RGBM HDRI 1.3 MB) |
| low | ≈ 4 MB (no HDRI, no props) |

- The DOM scene shows immediately; the WebGL room crossfades in when loaded (timeout 20 s → stays DOM).
- The render loop pauses when the tab is hidden and runs at ⅓ rate while the sheet covers the room. Pixel ratio adapts if frames exceed 40 ms.
- All GPU resources are disposed on scene switch or teardown; the context is force-lost.
- **Not measured on real hardware.** The QA sandbox renders WebGL in software (SwiftShader), so frame rates measured here aren't meaningful. On-device profiling is the top next step.

## Customer wizard

| Item | Status |
|---|---|
| Route `/` → wizard; `?view=invite` / `?i=` → invitation | Done |
| Step 1: 3D/2D × animated/static | Done. 2D forces the DOM renderers; static = reduced motion + frozen 3D frame |
| Steps 2–3: 10 cards (live faces with the couple's names), settings with the chosen card | Done. 3D lists Candlelit Hall only (the only Three scene) |
| Step 4: details form → `InvitationData`, live preview via `Studio.setContent()` | Done |
| Step 5: summary, guest link (`?i=` base64url config), copy, full screen | Done. Links are long, with no server-side storage |
| Draft autosave (localStorage) | Done, per browser |
| Mobile: preview as a bottom sheet | Done |


## Known limitations

- **Canva:** the exact original Canva export (DAHWaLT4OLI) is not in the packs. The canonical SVG CardFace designs are the cards; no replacement was fabricated.
- **Fonts:** no font files are bundled (licences unverified in this handoff). Google Fonts load online, with system fallbacks offline.
- **Web packaging:** models ship as lossless glTF JSON and the HDRI as RGBM16 PNG (the hosting can't serve `.glb`/`.exr`). Range above 16× is clipped in the environment.
- **HDRIs:** the P0 HDRIs are daylight, so the candlelit room uses the warm courtyard one for reflections only (tinted and dimmed). A night/interior HDRI would be a better source.
- **Unused P0 media:** the 9 videos and 12 photos (Mediterranean) aren't used by any canonical scene.
- **Card shadow:** the WebGL card-proxy shadow falls behind and right of the card. It is subtle by design, and the canonical CSS contact shadow also stays.
