# Scene `petals` — بتلات طائرة / Floating Petals

DOM/CSS + SVG (`src/scenes/css/generated.js:154-164`; registry `src/scenes/index.js:58`, tone `light`, tags `pastel romantic playful`, swatch `#F4EAFB`).

## Space and camera

An airy pastel sky with drifting clouds and falling petals. There is no ground plane, so the card floats.

## Foreground, midground, background

- **Sky:** gradient `#FDE6EE → #F4EAFB 52% → #E7F0FF`.
- **Background (`--pf`):** 3 soft clouds (white at 70–80 %, blur 14–18) at y 120, 260 and 520, `fx-cloud` 30 s drift.
- **Static:** a pink glow ellipse at the bottom (`rgba(247,196,212,.6)`).
- **Midground (`--pm`):** **18 petals** (seeded; 9–17 px; colours `#F7B6C8 #FAD3DC #FFFFFF #F3A6BC #FBE3EA`) falling with `fx-fall` (9–16 s, rotating 540°).

## Light and material

Bright, shadowless pastel air.

## Depth and transition

Two parallax layers. The petals fall continuously, including in front of where the card stands (in the scene layer, behind the card).

## Performance and fallback

18 animated spans plus 3 blurred clouds: light. `.host.rm` freezes the petals in place.

## Crop and safe zones

No ground. The petals are spread across the full width. The card's drop shadow (`.st-shadow` at y 600) is the only anchor.

## Required asset files

None.

## Captured

`faces-canonical-couple.png` (`sage-petals`), `canon-sage-petals.png`.
