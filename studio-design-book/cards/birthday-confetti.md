# `birthday-confetti` — عيد من الألوان / Confetti Birthday

**Status: retained.** Captured with single-person content. The label uses Arial, which is not bundled.

## Identity and references

| | |
|---|---|
| Stable ID | `birthday-confetti` |
| Registry | `src/cards/occasion-cards.js:136-145` (tags `light birthday playful pastel modern`; swatch `#F4B4C5`); variant `.oc-confetti` (:68) |
| Theme | paper `#FFF7EF` · ink `#24345E` · muted `#606482` · accent `#EC7157` · aText `#B53D29` · env `#EE9CAF` · fAr Reem Kufi |
| Presets | `birthday-confetti-clay` (templates.ts:48, featured; birthday starter `occasion-starters.ts:143`) · `-petals` (:49) · `-silk` (:50) |

## Intended occasions

Birthdays (children and adults).

## Emotional idea

A party: a three-candle cake, confetti, a yellow sticker label. Bright, cheerful, modern.

## Composition and proportions

- Padding 22 / 25 / 18. Art band 63 px. Heading gap 6.
- **Greeting** is a pill: padding 5 / 12, radius 24, background `#F9E15F`, text `#24345E` 15 px.
- **Meta** has a 2 px dashed top border. Names use weight 500.
- **Art:**
  - cake body `#F3B2C4`, frosting `#FFF0B5`, plate line `#24345E`;
  - candles `#3D62BD` with flames `#EC7157`;
  - stars `#3D62BD` and `#F1BF49`, sprinkles.
- **Background:** six confetti strokes `#EC7157` at the edges, dots (`#3D62BD`, `#D5BE60`, `#EE9CAF`), and a bottom band y 410–420 `#F4B4C5`.

## Typography roles

| Role | Family | Size | Colour |
|---|---|---|---|
| Greeting pill | Reem Kufi | 15 px | `#24345E` on `#F9E15F` |
| Label | Arial (fallback) | 8 px, tracking 1.1 px | muted |
| Name | Reem Kufi 500 | fitted (31 px start) | ink |
| Others | shared grid | | |

## Hierarchy

Cake → «عيد ميلاد» sticker → BIRTHDAY → name → Latin name → dashed rule → meta → footer.

## Single and couple; short and long names

Single captured («يوسف»). Long names are fitted.

## Static and reduced motion

No animation.

## Scenes

- **Recommended:** `clay`, `petals`, `silk`.
- **Avoid:** `candlelit`, `palace` and `starry`.

## Crop and safe regions

Content box x 25–275, y 22–402. The bottom band starts at y 410.

## Editable blueprint

**Code-native SVG.** The cake art is a good Canva illustration candidate (SVG export).

## Asset brief references

`signature.card.birthday-confetti.art.v1` · `signature.card.birthday-confetti.confetti.v1` · `signature.card.birthday-confetti.thumb.v1`.

## Preview

`previews/faces-single-person.png` (tile `birthday-confetti-clay`).

## Untested states

`-petals` and `-silk`, a child's name with a long patronymic, and the Arial fallback on device.
