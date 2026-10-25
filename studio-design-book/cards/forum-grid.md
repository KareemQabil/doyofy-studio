# `forum-grid` — ملتقى الأفكار / Forum Grid

**Status: retained.** Captured with a long single-person conference name and a long venue. Everything fits.

## Identity and references

| | |
|---|---|
| Stable ID | `forum-grid` |
| Registry | `src/cards/occasion-cards.js:156-165` (tags `light corporate conference modern minimal geometric editorial`; swatch `#52C8CE`); variant `.oc-forum` (:70) |
| Theme | paper `#F2F6F5` · ink `#153C42` · muted `#48686B` · accent `#16818C` · aText `#14616B` · env `#153C42` · fAr Reem Kufi |
| Presets | `forum-grid-marble` (templates.ts:54, featured, primary conference; conference starter) · `forum-grid-sea` (:55, primary corporate; corporate starter) · `forum-grid-palace` (:56, primary corporate) |

## Intended occasions

Conference, corporate and opening events. The "name" is an event or organisation name.

## Emotional idea

A systematic conference identity: tiles, a grid, a teal accent bar. Clarity and professionalism.

## Composition and proportions

- Padding 24 / 27 / 21, text **right-aligned**, gap 8. Art band 61 px (viewBox 250 × 61).
- The label is left-aligned in Arial 8 px bold; Latin text and the footer are left-aligned.
- **Art:** a square `#153C42` with a cross `#60D5D7`; a square `#52C8CE` with a circle; a 107 × 56 grid `#8AACAD`.
- **Background:** a top band y 0–8 `#153C42`, a bottom band y 408–420 `#52C8CE`, and a vertical rule at x 291 from y 20 to 396, `#52C8CE` 2 px.

## Typography roles

| Role | Family | Size | Colour |
|---|---|---|---|
| Greeting | Reem Kufi | 17 px | ink |
| Label | Arial (fallback) | 8 px bold, tracking 1.5 px | muted |
| Name | Reem Kufi, `text-wrap: pretty` | fitted | ink |
| Others | shared grid | | |

## Hierarchy

Tiles → «مؤتمر» → CONFERENCE (left) → event name (right-aligned) → Latin name (left) → meta → footer.

## Single and couple; short and long names

Single captured: «ملتقى الرياض للابتكار» with the venue «مركز الملك عبدالعزيز الدولي للمؤتمرات». The name fits on one line at the fitted size, and the venue wraps to 2 lines. Couple usage would print «و» between two names, which is meaningless for a conference.

## Static and reduced motion

No animation.

## Scenes

- **Recommended:** `marble`, `sea`, `palace`.
- **Avoid:** `clay`, `petals` and `candlelit`.

## Crop and safe regions

Content box x 27–273, y 24–399. Keep it left of the rule at x 291.

## Editable blueprint

**Code-native SVG.** Geometric and data-driven.

## Asset brief references

`signature.card.forum-grid.art.v1` · `signature.card.forum-grid.thumb.v1`.

## Preview

`previews/faces-single-person.png` (tile `forum-grid-marble`).

## Untested states

`-sea` and `-palace`, and Latin-only event names (common for conferences: the Arabic name equals the Latin name, so the Latin line duplicates it).
