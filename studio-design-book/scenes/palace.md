# Scene `palace` — أقواس القصر / Palace Arches

DOM/CSS + SVG (`src/scenes/css/generated.js:201-226`; registry `src/scenes/index.js:61`, tone `warm`, tags `arabic architectural warm`, swatch `#D6B27A`). The docs name it as the next 3D candidate (`docs/STUDIO_OVERVIEW.md` §11).

## Space and camera

A one-point-perspective corridor of six nested pointed arches receding to a vanishing point at (195, 430), with a tiled floor. A strong central perspective frames the card like a mihrab.

## Foreground, midground, background

- **Background:** gradient `#F2E0BF → #E6C999 → #D6B27A`.
- **Background (`--pf`):** a glowing doorway light at (175–295, 350–530), radial `rgba(255,247,222,.95)`, blur 4.
- **Midground (`--pm`):**
  - floor perspective lines converging on (195, 430) and horizontal tile lines at y 500, 560, 640 and 740 (`rgba(120,80,40,.2)`);
  - **six arches**, strokes from `#B89060` 2 px (innermost, apex y 381) to `#8A6234` 9 px (outermost, apex y 210, sides x 30 and 360);
  - floor shadow ellipse (195, 614).
- **Foreground (`--pn`):**
  - two gold columns at x −40–12 and 378–430 (`#sc-col` `#B8925A → #E8CE9C → #A67E48`);
  - **two hanging lanterns**: left at (54, 118–164), right at (336, 168–214), each with a halo, `fx-sway` and a `fx-glow` flame.

## Light and material

Warm, glowing sandstone and brass. The light comes from the far doorway behind the card.

## Depth and transition

Three parallax layers. The strongest depth illusion of the 2D scenes. Loops: sway 5 s and glow 3 s.

## Performance and fallback

Light. `.host.rm` stops the lanterns.

## Crop and safe zones

- The right lantern (x 324–348, y 168–214) overlaps the card's top-right corner (the card ends at x 345). It sits behind the card, so only its left half shows.
- The outer arch sides (x 30 / 360) frame the card's sides.
- Columns sit at the stage edges and are cropped on narrow phones.

## Required asset files

None.

## Captured

`faces-canonical-couple.png` (`terracotta-palace`), `long-arabesque-palace.png`.
