# `newborn-moon` — أهلًا بالقمر / Moonlit Welcome

**Status: adapted.** The bottom cloud band (from y ≈ 397) sits under the footer and lowers its contrast (captured). Raise the footer or lower the band.

## Identity and references

| | |
|---|---|
| Stable ID | `newborn-moon` |
| Registry | `src/cards/occasion-cards.js:146-155` (tags `light newborn celestial calm pastel`; swatch `#CFDDE6`); variant `.oc-moon` (:69) |
| Theme | paper `#F9F7EF` · ink `#354D64` · muted `#586E80` · accent `#AD9158` · aText `#7D652D` · env `#8EA5B4` · fAr Amiri |
| Presets | `newborn-moon-silk` (templates.ts:51, featured; newborn starter `occasion-starters.ts:153`) · `-petals` (:52) · `-marble` (:53) |

## Intended occasions

Newborn welcome (single baby name).

## Emotional idea

A crescent moon resting on clouds, with stars on threads like a crib mobile. Gentle, sleepy, tender.

## Composition and proportions

- Padding 22 / 28 / 20, gap 7. Art band 86 px (the tallest of all occasion faces).
- **Art:** crescent `#DFC586` (stroke `#B79752`), clouds `#DCE6EB` and `#CADAE4`, stars `#AD9158`, hanging threads `#B8CBD8`.
- **Background:** a top band y 0–10 `#D9E3E9`, a bottom cloud silhouette from y ≈ 397 to 420 `#DCE6EB`, and stars at (19, 129) and (280, 210).

## Typography roles

| Role | Family | Size | Colour |
|---|---|---|---|
| Greeting | Amiri | 19 px | ink |
| Label | Cormorant | 9 px, tracking 1.2 px | muted |
| Name | Amiri | fitted | ink |
| Others | shared grid | | |

## Hierarchy

Moon mobile → «مولود» → NEWBORN CELEBRATION → name → meta → footer (on the cloud band).

## Single and couple; short and long names

Single captured («سلمى»). Long names are fitted.

## Static and reduced motion

No animation.

## Scenes

- **Recommended:** `silk`, `petals`, `marble`.
- **Avoid:** dark scenes; the card was conceived as a daylight nursery piece.

## Crop and safe regions

Content box x 28–272, y 22–400. **Footer clear zone:** the footer must end above y 392.

## Editable blueprint

**Code-native SVG.** The moon and cloud art is a strong Canva candidate (SVG export, no text).

## Asset brief references

`signature.card.newborn-moon.art.v1` · `signature.card.newborn-moon.clouds.v1` · `signature.card.newborn-moon.thumb.v1`.

## Preview

`previews/faces-single-person.png` (tile `newborn-moon-silk`).

## Untested states

`-petals` and `-marble`, long names, and the situation where parents' names are entered instead of the baby's.
