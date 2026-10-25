# Scene `marble` — صباح رخامي / Marble Morning

DOM/CSS + SVG only (`src/scenes/css/generated.js:62-89`; registry `src/scenes/index.js:53`, tone `light`, tags `morning bright classic`, swatch `#EDE7E0`). The only scene with an ambience loop.

## Space and camera

A bright interior corner at morning: a wall gradient (`#F1ECE6 → #E6DED4` to 64 %), a floor line at stage y 540, and a marble floor below. Frontal view; CSS perspective 1100 px at 50 % 42 %.

## Foreground, midground, background

- **Background (`--pf` 8/6):**
  - a blurred plant shadow (svg 260 × 360 at (10, 20), blur 5 px, opacity 0.5, `fx-sway`);
  - three diagonal light beams (`fx-beam`, 9 s, rotated 24°): x 60 (70 px wide), x 190 (46 px), x 300 (60 px), white fading to transparent, blur 8.
- **Midground (static):**
  - floor rect from y 540 `#F3EEE8`;
  - 5 marble veins `#CBC1B5` at 70 %;
  - a skirting line at y 540;
  - contact shadow ellipse (195, 614) 150 × 22.
- **Foreground (`--pn` 40/26):** 6 rose petals scattered on the floor (`#F3C6CB`, `#FBE0E4`, `#F7D6C8`) at x 46–330, y 650–790.

## Light and material

Soft white morning light from upper left, through a window implied by the beams. Polished pale marble.

## Depth and transition

Pointer parallax on 2 layers. Loops: sway 5 s and beams 9 s.

## Performance and fallback

Light: 3 blurred beams and 1 blurred svg. `.host.rm` stops the sway and beams (static still). This DOM renderer is itself the 2D/static version.

## Crop and safe zones

- Card x 45–345, y 168–588 sits against the wall, with its base just above the floor shadow at y 614.
- Petals sit at y ≥ 650 and never meet the card. The hint pill (y 622) sits over the floor.
- Desktop: the ambient echo is a blurred, darkened clone. At 1440 × 900 it reads as dark flanks with a grey band beside a bright stage (captured `desktop-lace-marble-dom`, not copied into `previews/`). A **visible seam** for light scenes.

## Required asset files

None for visuals. Ambience: `public/assets/p0/audio/sfx_morning_birds.mp3` at gain 0.07 (`src/audio/index.js:197-199`).

## Captured

`faces-canonical-couple.png` (`lace-marble`), `faces-single-person.png` (`grad-editorial-marble`, `forum-grid-marble`, `grad-lace-marble`), `long-lace-marble.png`, `long-grad-editorial.png`.
