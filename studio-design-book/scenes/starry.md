# Scene `starry` — ليلة النجوم / Starry Night

DOM/CSS + SVG (`src/scenes/css/generated.js:124-138`; registry `src/scenes/index.js:56`, tone `dark`, tags `night celestial`, swatch `#121B45`).

## Space and camera

A night sky over low hills. Frontal; deep perspective implied by star density.

## Foreground, midground, background

- **Sky:** gradient `#050919 → #121B45 58% → #2B2F63`.
- **Background (`--pf`):**
  - a Milky Way band (520 × 140, rotated −32°, `rgba(200,190,255,.1)`, blur 24);
  - **64 stars** `#FFF7E0` (seeded, seed 11, 0.8–2.8 px), `fx-twinkle`.
- **Midground (`--pm`):**
  - a moon at (310–380, 130–200) with halo and craters (`#sc-moon` gradient `#FFFBEE → #E7DCBC`);
  - a shooting star (`fx-shoot`, every 7 s after 2 s).
- **Foreground (`--pn`):** a ground haze band at y 600 and two hill silhouettes (`#0B1030` from y ≈ 620–660; `#070B1E` from y ≈ 690–720).

## Light and material

Cool moonlight. No direct light on the card.

## Depth and transition

Three parallax layers. Loops: twinkle and shoot.

## Performance and fallback

64 twinkling spans plus 2 large blurred spans: medium cost. `.host.rm` freezes them.

## Crop and safe zones

- The moon sits top-right, partly overlapping the card's top-right corner (x 310–345, y 168–200). The card covers part of the moon (captured).
- Hills start at y 620, below the card.

## Required asset files

None.

## Captured

`faces-canonical-couple.png` (`midnight-starry`), `faces-single-person.png` (`grad-constellation-starry`, `grad-midnight-starry`).
