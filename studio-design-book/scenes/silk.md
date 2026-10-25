# Scene `silk` — ستائر الحرير / Silk Drapes

DOM/CSS + SVG (`src/scenes/css/generated.js:139-153`; registry `src/scenes/index.js:57`, tone `light`, tags `soft romantic fabric`, swatch `#EAD4CA`).

## Space and camera

A soft boudoir stage: two blush silk drapes frame a cylindrical pedestal that the card stands on. Frontal.

## Foreground, midground, background

- **Background:** gradient `#F4E6DF → #EAD4CA 70% → #E1C4B7`.
- **Background (`--pf`):** a trapezoid light shaft (clip-path 38/62 % → 92/8 %), white at 75 % fading out, blur 10.
- **Midground (`--pm`):**
  - left drape (svg 140 × 760 at (34, 30)) and mirrored right drape (at (256, 30)), filled with `#sc-drape` (a 7-stop `#D9A99A`–`#F8E8E1` sheen), with 3 fold lines each and a tie-back swag;
  - both drapes animate `fx-drape` (skew and scale, 8 s; the right one at −4 s);
  - the **pedestal**: a cylinder from y 612 to 742 (`#sc-ped`) with top ellipse rx 140 at y 612 (`#F9EEE9`, inner `#F3E2DA`).

## Light and material

A diffuse top light and satin sheen. Pale and low contrast.

## Depth and transition

Two parallax layers. Drape loop 8 s.

## Performance and fallback

Light. `.host.rm` stops the drapes.

## Crop and safe zones

- The drapes sit at x 34–174 and x 256–396 and overlap the card's side edges behind the card (x 45–345). Only the outer folds show.
- The card base (y 588) stands about 24 px above the pedestal top (y 612). The hint pill sits on the pedestal face.

## Required asset files

None.

## Captured

`faces-canonical-couple.png` (`blush-silk`), `faces-single-person.png` (`newborn-moon-silk`, `conf-minimal-silk`).
