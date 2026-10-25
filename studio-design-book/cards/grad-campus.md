# `grad-campus` — ختم الإنجاز / Campus Laureate

**Status: retained.** Captured with single-person content. The layout fits.

## Identity and references

| | |
|---|---|
| Stable ID | `grad-campus` |
| Registry | `src/cards/occasion-cards.js:115-125` (tags `light graduation classic botanical calm`; swatch `#486557`); variant `.oc-campus` (:66) |
| Theme | paper `#F5F1E4` · ink `#294839` · muted `#526355` · accent `#61734D` · aText `#415738` · env `#486557` · fAr Amiri |
| Presets | `grad-campus-garden` (templates.ts:42, featured) · `-marble` (:43) · `-palace` (:44) |

## Intended occasions

Graduation, in a classic academic register.

## Emotional idea

A diploma-like certificate: a laurel wreath around a mortarboard, a double rule frame, a serif Arabic face. Tradition and honour.

## Composition and proportions

- Padding 25 / 29 / 22, gap 7. Art band 74 px.
- **Art:**
  - ellipse (125, 40) 49 × 36, stroke `#B5B99A`;
  - laurel arcs `#748461`;
  - 6 leaf pairs `#83916A`;
  - mortarboard `cap(125, 30, 0.62, '#365344', '#B49A5B')`;
  - a star at (125, 73) `#AD9357`.
- **Background:**
  - frame rects inset 14 (`#788468`, 1 px) and inset 19 (`#C9CAB4`, 0.7 px);
  - corner brackets `#9DA785` from 7 to 28 px.

## Typography roles

| Role | Family | Size | Colour |
|---|---|---|---|
| Greeting | Amiri | 18 px | ink |
| Label | Cormorant | 9 px, tracking 2 px | muted |
| Name(s) | Amiri, line-height 1.35 | fitted, 31 → min 8 (single) | ink |
| Latin / meta / footer | as the shared grid (Cormorant / Reem Kufi) | 10 / 11–12 / 8 px | ink / muted |

## Hierarchy

Laurel crest → «تخرج» → GRADUATION → name → Latin name → rule → meta → footer.

## Single and couple; short and long names

Single captured («ليان»). Couple and long names are handled by `names()`, and wedding copy appears for couples (README §6 C1).

## Static and reduced motion

No face animation.

## Scenes

- **Recommended:** `garden`, `marble`, `palace`.
- **Avoid:** `clay` and `petals`.

## Crop and safe regions

Content box x 29–271, y 25–398. Keep it inside the inner frame (inset 19).

## Editable blueprint

**Code-native SVG.** The laurel and cap could be authored in Canva (SVG export).

## Asset brief references

`signature.card.grad-campus.crest.v1` · `signature.card.grad-campus.frame.v1` · `signature.card.grad-campus.thumb.v1`.

## Preview

`previews/faces-single-person.png` (tile `grad-campus-garden`).

## Untested states

`-marble` and `-palace`, long names, and couple usage.
