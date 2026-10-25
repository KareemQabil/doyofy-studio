# `clay` — صلصال باستيل / Pastel Clay

**Status: retained.** Names are fixed at 44 px (long names untested). The time pill shows the English time only.

## Identity and references

| | |
|---|---|
| Stable ID | `clay` |
| Registry | `src/cards/index.js:34` (tone `light`; tags `light playful pastel clay`; swatch `#FFD6E4`) |
| Face markup | `src/cards/canon/generated.js:283-306` |
| Shared defs used | `cf-ccloud`, `cf-cheart` (+ `cf-cheart-g`), `cf-cflower`, `cf-cpetal`, `cf-cblue`, `cf-ccenter` |
| Theme | paper `#FFF4F0` · ink `#7A4F5E` · muted `#8D6879` · accent `#F2A7BF` · aText `#A0506C` · env `#E98AAA` · fAr Aref Ruqaa |
| Presets | `clay-party` (templates.ts:69, × clay, primary birthday) · `birthday-bloom` (:74, × petals, primary birthday) · `clay-silk` (:88, × silk) |

## Intended occasions

Birthdays and newborns.

## Emotional idea

Soft modelling clay: puffy clouds, hearts and flowers on a padded pillow. Playful, tactile, child-friendly.

## Composition and proportions

- **Background:** vertical gradient `#FFD6E4 → #FFE6D2`.
- **Pillow:** inset 14, radius 24, `#FFF6EE`, with an inset highlight (top), an inset shade (bottom) and an outer drop shadow.
- **Props:**
  - clouds top-left (around (62, 52)) and bottom-right (around (246, 372));
  - hearts at (252, 60) × 1.05 and (44, 360) × 0.8, rotated −12°;
  - flowers at (222, 40) × 0.9 (pink) and (78, 384) × 0.8 (blue);
  - 4 pink dots `#FFC9D8`.
- **Text column:** x 34–266, y 74–360.

## Typography roles

| Role | Family | Size | Colour |
|---|---|---|---|
| Greeting | Amiri | 13 px | `#A0506C` |
| Names | Aref Ruqaa | 44 px | ink |
| «و» | Aref Ruqaa | 22 px | `#E58FAE` |
| English names | Cormorant italic | 18 px | `#8D6879` |
| Date pill `dayAr · dateAr` | Amiri | 13 px, pill `#FFE3EC` | ink |
| Time pill `timeEn` | Cormorant | 13 px, pill `#E3F1FF` | ink |
| Venue `venueAr — cityAr` | Amiri | 12.5 px | `#8D6879` |

## Hierarchy

Greeting → names → English names → two pills (Arabic date, English time) → Arabic venue.

## Ornament and material

Faux 3D clay made with SVG radial gradients and CSS inset shadows. Props float (`fx-float`, `fx-float2`) and the flowers spin (`fx-spin`, 24 s).

## Single and couple; short and long names

- Single: correct by code (`generated.js:297-298`). Not captured on this face.
- Long names: fixed 44 px. **Untested.**

## Static and reduced motion

All floats and spins stop under `.host.rm`.

## Scenes

- **Recommended:** `clay`, `petals`, `silk`.
- **Avoid:** `candlelit`, `palace` and `starry` (formal or night contexts).

## Crop and safe regions

Text safe area x 34–266, y 74–360. Keep it clear of the corner props (top-right flower and heart, bottom-left flower and heart).

## Editable blueprint

**Hybrid.** Clay props are a good Canva target: Canva 3D-style elements exported as transparent PNG at 2× would read more convincingly than SVG gradients. Keep the pillow, pills and text code-native.

## Asset brief references

`signature.card.clay.props.v1` (clouds, hearts, flowers; separate transparent PNGs) · `signature.card.clay.thumb.v1`.

## Preview

`previews/faces-canonical-couple.png` (tile `clay-clay`).

## Untested states

Single-person birthday content, long names, `birthday-bloom` and `clay-silk`, and an Arabic time pill.
