# `sig-ticket` — تذكرة الفرح / Celebration Ticket

**Status: new («توقيع» pass), redesigned in identity colours.** The first draft used cobalt/coral hand-drawn shapes.

## Identity and references

| | |
|---|---|
| Stable ID | `sig-ticket` |
| Registry | `src/cards/signature-cards.js` (`designs[2]`). Tags `light signature birthday playful modern geometric`; swatch `#2EB7B7` |
| Face CSS | `.sc-ticket`, `.sc-stub`, `.sc-day`, `.sc-when` |
| Theme | paper `#FFFDF8` · ink `#262626` · muted `#5F594F` · accent `#BC4749` · aText `#A23B3D` · env `#2EB7B7` · fAr Reem Kufi |
| Presets | `sig-ticket-clay` (featured, birthday) · `sig-ticket-petals` (family) · `sig-ticket-marble` (opening) — `templates.ts:46-48` |
| Asset record | `signature.card.sig-ticket.face.v1` |
| Recipe | `CANVA_RECIPES.md` → Signature §S3 |

## Intended occasions

Birthday, family gathering, opening, other.

## Emotional idea

An admission ticket to a happy day: a row of cut-out identity shapes as the headline, the name large, and a tear-off stub that carries the date like a ticket stub.

## Composition (300 × 420)

| Zone | Geometry | Content |
|---|---|---|
| Shapes row | `svg.oc-art` viewBox 250 × 62, height 62 | charcoal pill (18, 8, 44 × 52, rx 22); red quarter-disc (76–108, 28–60); gold disc r 24 at (140, 34); turquoise triangle (178–222, 20–60); red dot r 6 at (236, 18). Flat, no text |
| Upper panel | y 0–300, `oc-inner` height forced to 300 px | heading → names (`names(c, 4)`) |
| Perforation | dashed line y 308 (5/5, 35 % charcoal); notches: beige circles r 13 at x 0 and x 300 | — |
| Stub | `path 0,300 → 300,420` ivory `#F2EAD9`; `.sc-stub` grid 86 px + 1fr, padding 12 / 22 / 14 | charcoal day tile (radius 12): day number Cormorant 600 30 px gold, month Kufi 11 px gold, year Cormorant 10 px gold. Next to it: `.sc-when` with day · date (12 px bold), time, venue, city (10.5 px) |
| Outline | `rect 8,8 284×404 rx8` 12 % charcoal | — |

## Single and couple; short and long

| Case | Behaviour |
|---|---|
| Single | One large Kufi name |
| Couple | Two names with «و» (if chosen from the full gallery) |
| Long venue | Wraps inside `.sc-when` (`overflow-wrap: anywhere`). A 60-character venue takes three lines and stays inside the 112 px stub (row 3, "single long") |

## Scenes

- **Recommended:** clay, petals, marble.
- **Avoid:** candlelit. A playful ticket in a formal dark hall is a tonal mismatch.

## Motion and blueprint

- Static face; engine storyboard.
- Code-native; the shapes are primitives. Canva master optional (§S3).
