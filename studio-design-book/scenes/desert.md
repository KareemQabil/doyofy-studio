# Scene `desert` — غروب الصحراء / Desert Sunset

DOM/CSS + SVG (`src/scenes/css/generated.js:109-123`; registry `src/scenes/index.js:55`, tone `warm`, tags `desert sunset warm`, swatch `#E07A6E`).

## Space and camera

An open dune landscape at sunset; a low frontal view with the horizon around y 500–520.

## Foreground, midground, background

- **Sky:** gradient `#3E2C5C → #8A4B6E 28% → #E07A6E 50% → #F6B98A 64% → #F8CFA0 70%`.
- **Background (`--pf`):**
  - sun at (195, 480): a halo r 120 `#FFE2A8` at 25 % and a core r 62 `#FFE8B8` (`fx-glow`);
  - three birds (`fx-glide`, 18 s, crossing);
  - far dune from y ≈ 480–520 `#C9826A`.
- **Midground (`--pm`):** dune from y ≈ 540–580 `#A9604A`.
- **Foreground (`--pn`):** near dune from y ≈ 600–640 `#7E3F30` with a rim highlight `rgba(255,210,160,.35)`.

## Light and material

Backlit sunset glow centred behind the card. Matte sand.

## Depth and transition

Three parallax layers. Loops: glow 3 s and glide 18 s.

## Performance and fallback

Very light. `.host.rm` stops the glow and birds.

## Crop and safe zones

- The sun sits directly behind the card's lower half (y 360–600). Only its halo shows around the card.
- The near-dune ridge at y ≈ 612–640 sits just under the card base. The hint pill sits on dune.

## Required asset files

None.

## Captured

`faces-canonical-couple.png` (`arabesque-desert`).
