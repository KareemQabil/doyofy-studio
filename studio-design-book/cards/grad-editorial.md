# `grad-editorial` — تخرج بأفق جديد / Graduation Editorial

**Status: adapted.** The face is the default graduation starter (`occasion-starters.ts:148`). The 1 px bottom rule at y 397 runs through the footer text (captured). Move the rule or raise the footer.

## Identity and references

| | |
|---|---|
| Stable ID | `grad-editorial` |
| Registry | `src/cards/occasion-cards.js:105-114`, registered at :168-173 (`renderMode svg`, `reducedMotion static`, `mobile true`, `source src/cards/occasion-cards.js`). Tags `light graduation modern editorial geometric`; swatch `#2E49BF` |
| Shared occasion layout | `STYLE` (:59-71), `names()` (:78-96), `content()` (:97-99), `face()` (:100-102). Variant class `.oc-editorial` (:65) |
| Theme | paper `#FFF9EF` · ink `#172B67` · muted `#4E5C79` · accent `#2E49BF` · aText `#2E49BF` · env `#2E49BF` · fAr Reem Kufi |
| Presets | `grad-editorial-marble` (templates.ts:39, featured) · `-silk` (:40) · `-sea` (:41) — all primary graduation |

## Intended occasions

Graduation, for a single graduate.

## Emotional idea

A confident editorial announcement in cobalt: a cap-and-diploma "cover image" over clean Kufi type. Achievement, a new horizon.

## Composition and proportions (shared occasion grid)

- `.oc-inner`: a flex column with padding 18 (top, editorial override) / 23 / 17 and gap 9, centred.
- From top to bottom:
  - **art band**, 74 px tall;
  - **heading**: greeting 17 px in accent, plus an Arial 9 px bold label tracked 2 px;
  - **names**, which take the remaining height;
  - **meta**: a 2-column grid `1fr auto` with the date in column 1 and the time in column 2, then venue and city as full rows, all aligned right, under a top border;
  - **footer**, left-aligned.
- **Art:** viewBox 250 × 80, fitted ("meet") into ≈ 254 × 74. It contains:
  - a cobalt block `#2E49BF` 250 × 78, rx 3;
  - a mortarboard `cap(125, 32, 0.82, '#FFF8E7', '#F2D374')`;
  - a diploma rotated −17° at (179, 56), paper `#FFF8E7`, ribbon `#B45C42`;
  - corner brackets `#A7BAF6`.
- **Background layer:** a bottom bar y 407–420 `#2E49BF` and a 1 px rule at y 397.

## Typography roles

| Role | Family | Size | Colour |
|---|---|---|---|
| Greeting `greetingAr` (event label for singles) | Reem Kufi | 17 px | accent `#2E49BF` |
| Label `eventLabelEnU` | Arial, sans-serif (**not bundled**; system fallback) | 9 px bold, tracking 2 px | muted |
| Name(s) | Reem Kufi 400 | fitted: starts at 31 px (single) or 22 px (couple), steps down to fit, min 8 | ink |
| «و» | Reem Kufi | 12 px | accent |
| Latin names | Cormorant Garamond | 10 px (8 px when total length > 110) | ink |
| Date | Reem Kufi | 12 px | ink |
| Time / city | Reem Kufi | 11 / 10 px | muted |
| Footer `cardFooterEnU` | Cormorant | 8 px, tracking 1.1 px | muted |

## Hierarchy

Art → event label (AR, then EN caps) → name → Latin name → meta (date · time · venue · city) → footer.

## Single and couple; short and long names

- Single: one name block (captured: «ليان», `previews/faces-single-person.png`).
- Couple: A «و» B, and the greeting switches to «بكل الحب» / WEDDING / `DINNER · CELEBRATION · RSVP`. That reads as wedding copy on graduation art (`previews/long-grad-editorial.png`, README §6 C1).
- Long names: the `names()` fitting loop shrinks the size and keeps everything inside; no ellipsis. Captured with a long couple: it fits.

## Static and reduced motion

The face has no animation by design ("Decorative vectors contain no … animation", :50-51). Only stage motion applies.

## Scenes

- **Recommended:** `marble`, `silk`, `sea`.
- **Avoid:** `clay` and `petals` (light on pastel, and playful); `candlelit` (formal and dark, though the contrast is fine).

## Crop and safe regions

Inner content box x 23–277, y 18–403. **Footer collision:** the footer baseline sits around y 395–403 and the rule is at y 397. Keep the footer above y 392, or move the rule to y ≥ 404.

## Editable blueprint

**Code-native SVG.** The flex layout and the fitting loop are the value of this face. The cap and diploma art could be redrawn in Canva and exported as SVG (no text inside).

## Asset brief references

`signature.card.grad-editorial.art.v1` (cap and diploma band) · `signature.card.grad-editorial.thumb.v1`.

## Preview

`previews/faces-single-person.png` (tile `grad-editorial-marble`), `previews/long-grad-editorial.png`, `previews/single-grad-page-invitation.png`, `previews/single-grad-page-date.png`, `previews/single-grad-done.png`.

## Untested states

`-silk` and `-sea`, Latin-only names, very long venue names, and how the Arial fallback renders on iOS and Android.
