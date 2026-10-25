# Scene `clay` — مسرح الصلصال / Clay Stage

DOM/CSS + SVG (`src/scenes/css/generated.js:165-185`; registry `src/scenes/index.js:59`, tone `light`, tags `playful pastel clay`, swatch `#F7D7E6`). Shares its prop vocabulary with the `clay` card.

## Space and camera

A toy theatre: a pastel backdrop, puffy clay clouds, and a round clay platform.

## Foreground, midground, background

- **Backdrop:** radial highlight `60% 30% at 50% 18%` over a gradient `#F7D7E6 → #FDEBCF`.
- **Background (`--pf`):** 3 clay cloud clusters (`#sc-ccloud`) at top-left (80, 150), top-right (316, 120) and top centre (200, 70); `fx-float` / `fx-float2`.
- **Midground (`--pm`):**
  - platform: shadow ellipse (195, 640) 190 × 40, body (195, 618) 176 × 36 (`#sc-plat`), top (195, 614) 158 × 28 `#FBEEDA`;
  - hearts at (52, 260) × 1.3 and (344, 300) × 1.1;
  - flowers at (44, 560) and (348, 548), spinning;
  - **14 clay dots** in 5 pastel colours across x 12–88 %, y 22–70 %.

## Light and material

Soft top light with inset highlights: a matte clay feel.

## Depth and transition

Two parallax layers. Loops: float 6 s, float2 7.5 s, spin 24 s.

## Performance and fallback

About 20 animated elements: light. `.host.rm` freezes them.

## Crop and safe zones

- Hearts at x ≈ 30–75 and 320–365 sit at y 245–315, behind the card's side edges. The card covers about 25 px of each.
- Dots appear across the card zone, behind the card.
- The platform top at y 614 sits under the card base.

## Required asset files

None.

## Captured

`faces-canonical-couple.png` (`clay-clay`), `faces-single-person.png` (`birthday-confetti-clay`).
