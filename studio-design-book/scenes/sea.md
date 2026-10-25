# Scene `sea` — بحر مقمر / Moonlit Sea

DOM/CSS + SVG (`src/scenes/css/generated.js:186-200`; registry `src/scenes/index.js:60`, tone `dark`, tags `night sea calm`, swatch `#1B2B58`).

## Space and camera

A sea horizon at night with a moon path. The horizon sits at stage y 506, so the camera is at eye level with the card's middle.

## Foreground, midground, background

- **Sky:** gradient `#081230 → #1B2B58 48% → #3A4B7C 60%`.
- **Background (`--pf`):**
  - 28 stars (the first 28 of the seeded set, y compressed ×0.72), `fx-twinkle`;
  - a moon at (118–182, 168–232) with a halo of 140 px at (80, 130).
- **Midground (`--pm`):**
  - water rect from y 506 (`#sc-sea` `#15264D → #040915`) and a horizon line;
  - **16 moon-path shimmer bars** `#F6EDD2` from y 552 to 792, centred on x 150 (`fx-shimmer`);
  - 3 wave lines (`fx-wave`, translating 80 px).
- **Foreground (`--pn`):** a near shore silhouette from y ≈ 740–760 `#0A0E1E` and a rock at the right `#070A16`.

## Light and material

Cool moonlight. The reflective water is the only bright element below the card.

## Depth and transition

Three parallax layers. Loops: twinkle, shimmer 2.4 s, wave 6 s.

## Performance and fallback

28 + 16 animated spans plus a wave svg: light to medium. `.host.rm` freezes them.

## Crop and safe zones

- The **moon sits behind the card's top-left corner** and peeks above it (captured `minimal-sea`).
- The shimmer path (x ≈ 120–180, y 552–792) runs from under the card down through the hint pill (y 622). The bars visibly cross behind the pill, a small legibility cost (captured).
- The horizon at y 506 cuts behind the card's lower third.

## Required asset files

None.

## Captured

`faces-canonical-couple.png` (`minimal-sea`).
