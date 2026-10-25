# Scene `candlelit` — قاعة الشموع / Candlelit Hall

The only scene with two renderers: **Three.js/WebGL** first, then the canonical **DOM/CSS + SVG** fallback (`src/scenes/index.js:18-27, 42-52`; `renderMode: 'hybrid'`, `heavy: true`, `mobileFallback: 'dom'`). It recommends the cards `wine`, `emerald` and `arabesque` back. Tone `dark`; swatch `#3A1A1F`.

## Space and camera

- **DOM** (`src/scenes/css/generated.js:39-61`): a frontal 390 × 844 tableau. A dark warm hall (`#140B0C`) with a warm glow above the card position (radial `62% 40% at 50% 26%`, `rgba(255,205,150,.22)`). Camera = the CSS stage perspective of 1100 px at 50 % 42 % (`canon-motion.css:64`; `CameraRegistry css-perspective`, `src/modules.js:229`).
- **WebGL** (`src/scenes/three/candlelit-hall.js`): a real room in metres where 1 stage px = 1 mm at z = 0. Perspective camera with a 42° vertical field of view, framed from the stage rectangle on every resize, with a lens shift so the principal point sits at the stage's perspective origin (50 %, 42 %) (`src/camera/framing.js`). Wider screens reveal more room, and the card is never cropped. Intro dolly-in settles at 4.7 s; pointer parallax is ±0.05 / 0.035 m; stage offsets for pages (+) and fly/done (−).

## Foreground, midground, background

| Depth | DOM | WebGL |
|---|---|---|
| Background | `#140B0C` field, warm glow; far bokeh (8 discs, `--pf` parallax 8/6 px, blur 0.6) | plaster walls with arches and columns (PBR `plastered-wall-03`, tinted `#8a5c4c`), fog `#120809` 1.6–6.5 m, a hanging lantern chandelier (GLB), far bokeh sprites at z −2.4 |
| Midground | mid bokeh (6 discs, `--pm` 20/14, blur 2.5); the table: a polygon from y 596 down to 844, gradient `#3A1A1F → #130809`, an edge line at y 596 and a halo ellipse at (195, 612) | a table covered in wine linen (PBR `rough-linen`, `#3e0a15`, sheen `#5a1626`) with its edge under the card at stage y 596; brass goblets, a brass vase with flowers, a glass lantern (GLBs, not on the low tier); a marble floor (PBR `marble-01`) |
| Foreground | 4 candles at the stage edges (x 12–60 and 326–374, tops at y 560–640) with flame and halo (`#sc-candleg`, `fx-flicker` / `fx-glow`); near bokeh (4 large discs, blur 9, `--pn` 40/26) | candle pairs with flames, wax-glow gradient and flicker point lights; near bokeh at z 0.62 (not on the low tier); a vignette overlay `.candlelit-vignette` |

## Light and material

Warm candle light at `#ffb46a` / `#ffcf8a`, with a key spot light `#ffc888` (3.2, or 2.2 on low; casts shadows except on low) and a chandelier light that breathes ±3 %. The reflection environment is the Poly Haven courtyard HDRI (daylight), tinted and dimmed and never shown as a background (`candlelit-hall.js:142-150`; a known limitation in `docs/STUDIO_OVERVIEW.md` §10). ACES Filmic tone mapping, exposure 0.72. An invisible card proxy casts the DOM card's shadow on the table (`:324-329`).

## Depth and transition

- **Intro:** exposure rises from 25 % to 100 % over 0.6–3.2 s, candles ignite at 1.4 s + 0.12 s × index, dolly-in settles at 4.7 s.
- **Pages / opening:** the room renders at one third of the frame rate (`:386-387`).
- **Crossfade:** DOM scene → WebGL `scene-in` 0.9 s; the DOM scene and its ambient echo are destroyed 1 s later (`Studio._swapScene`).
- **Timeout:** 20 s (`Studio.js:305`), then the DOM scene stays.
- **Replay:** `setStage('reset')` puts the candles out and resets the camera.

## Performance tier and fallback

| Tier | WebGL content | DPR cap |
|---|---|---|
| high | 2k HDRI, all props including flowers, 2048 shadows, glass transmission | 2 |
| balanced | 1k HDRI, props, 1024 shadows, no transmission | 1.5 |
| low | no HDRI, props or shadows, no near bokeh — room, table, candles, chandelier only | 1 |

Adaptive resolution steps the DPR down by ×0.8 (to no lower than 0.6) when 45 frames average over 40 ms (`:371-377`). The **2D/static fallback** is the DOM renderer, which is mounted first so the stage is never blank. It is used for the `2d` experience, `?renderer=dom`, no WebGL, or load failure or timeout. **Static** experience: the WebGL renders about 40 warm-up frames, then only when dirty (`:388`).

## Crop and safe zones

- Card zone: x 45–345, y 168–588 on the stage. Candles stay at x < 60 and x > 326. The table edge at y 596 sits just below the card.
- Hint pill at y 622: in DOM the candle flames at y ≈ 534–614 stay outside x 60–326.
- Desktop: DOM gets the ambient echo; WebGL is full-bleed and fills the viewport naturally (captured: `previews/desktop-wine-candlelit-3d-low.png`).

## Required asset files (real paths under `public/assets/`)

- Declared on the scene (`src/scenes/index.js:45-51`):
  - `p0-derived/models/lantern-chandelier-01/lantern-chandelier-01.gltf.json`
  - `p0-derived/models/brass-vase-02/brass-vase-02.gltf.json`
  - `p0-derived/models/brass-goblets/brass-goblets.gltf.json`
  - `p0-derived/models/lantern-01/lantern-01.gltf.json`
  - `p0-derived/hdri/courtyard-2k-rgbm16.png`
- Loaded but **not declared** on the scene, so they are invisible to `tools/check_assets.mjs` through this list (`candlelit-hall.js:33-46`):
  - `p0-derived/models/flower-empodium/flower-empodium.gltf.json`
  - `p0-derived/hdri/courtyard-1k-rgbm16.png` (balanced)
  - `p0/materials/rough-linen/{basecolor,normal,arm}.jpg`
  - `p0/materials/plastered-wall-03/{basecolor,normal,arm}.jpg`
  - `p0/materials/marble-01/{basecolor,normal,arm}.jpg`

All exist (verified). Gallery thumbnails for 3D presets use the photo `wizard/3d-candlelit.webp` (`src/features/templates/TemplateThumb.tsx:57`). The DOM renderer needs no files. No ambience sound.

## Captured

`canon-wine-candlelit` (DOM, in `faces-canonical-couple.png`), `long-wine-candlelit.png` (DOM), `desktop-wine-candlelit-3d-low.png` (WebGL low tier, software rendering, reduced motion). The high and balanced tiers and the animated intro were not captured.
