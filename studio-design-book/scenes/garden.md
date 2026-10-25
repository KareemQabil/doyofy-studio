# Scene `garden` — ليلة في الحديقة / Garden Night

DOM/CSS + SVG (`src/scenes/css/generated.js:90-108`; registry `src/scenes/index.js:54`, tone `dark`, tags `garden night botanical`, swatch `#14271C`).

## Space and camera

A garden at night under strings of festoon lights. Frontal; CSS perspective.

## Foreground, midground, background

- **Background (`--pf`):** two hedge silhouettes made of circles and rects (`#10231A` with crowns around y 430–470; `#0D1D15` around y 540–560).
- **Midground (`--pm`):**
  - two catenary wires (`#2E3A2E`, `#26322A`) from y 100–250;
  - **22 bulbs** `#FFE8AE` with glow, along the wires (12 upper bulbs at 7 px, 10 lower at 5 px), `fx-twinkle`;
  - **12 fireflies** `#E4F7A0` (x 5–95 %, y 40–90 %), `fx-firefly`.
- **Static:** a halo ellipse (195, 612) 160 × 30 at 70 %.
- **Foreground (`--pn`):** dark leaf fronds `#06100B` rising from both bottom corners (y ≥ 660).

## Light and material

Warm bulb glow `rgba(255,210,120,.55)` against a cool green-black gradient (`#0A1510 → #14271C → #0B1812`).

## Depth and transition

Three parallax layers. Loops: twinkle 2.4–4.4 s and firefly 6–11 s.

## Performance and fallback

34 animated glowing spans with box-shadows: medium cost. `.host.rm` freezes them. The DOM version is the 2D/static version.

## Crop and safe zones

- The bulb wires cross behind the card's top half (wire sag around y 170–240), so bulbs peek out around the card edges (captured).
- Fireflies may drift in front of nothing: they sit in the scene layer, behind the card.
- Fronds stay below y 660.

## Required asset files

None.

## Captured

`faces-canonical-couple.png` (`emerald-garden`), `faces-single-person.png` (`grad-campus-garden`).
