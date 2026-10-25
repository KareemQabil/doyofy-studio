# `sig-ribbon` — حروف الفرح / Monogram Letter

**Status: new («توقيع» pass), redesigned in identity colours.** The first draft was a plum satin ribbon with a drawn scallop seal; it was replaced.

## Identity and references

| | |
|---|---|
| Stable ID | `sig-ribbon` (the ID is kept for preset stability; the working name is now «حروف الفرح») |
| Registry | `src/cards/signature-cards.js` (`designs[1]`). Tags `light signature classic romantic gold warm`; swatch `#BC4749` |
| Face CSS | `.sc-ribbon`, `.sc-mono` in `SIG_STYLE` |
| Theme | paper `#FFFDF8` · ink `#262626` · muted `#5F594F` · accent `#BC4749` · aText `#A23B3D` · env `#BC4749` · fAr Aref Ruqaa |
| Presets | `sig-ribbon-candlelit` (featured, primary wedding) · `sig-ribbon-palace` (primary katb_kitab) · `sig-ribbon-silk` (primary engagement) — `templates.ts:43-45` |
| Asset record | `signature.card.sig-ribbon.face.v1` |
| Recipe | `CANVA_RECIPES.md` → Signature §S2 |

## Intended occasions

- Wedding, engagement, katb kitab and henna (couples).
- It also reads correctly for one name (a single initial).

## Emotional idea

A letter sealed with the couple's initials: the brand red as a confident header, an ivory disc with Arabic initials as the seal, and a Ruqaa hand for the names. Warm and ceremonial without any floral cliché.

## Composition (300 × 420)

| Zone | Geometry | Content |
|---|---|---|
| Band | `rect 0,0 → 300,100` red `#BC4749` | Phosphor occasion glyph Thin, 40 px, ivory `#F2EAD9`, at (150, 46) |
| Frame | same double gold frame as sig-diploma | — |
| Monogram disc | ivory circle r 31 at (150, 100); gold ring r 26 (1.2 px) and r 23 (0.6 px, 50 %) | `.sc-mono`: initials of `arA` and `arB` via `initial()`, which skips «عائلة / آل / أم / أبو» and the article «ال». Aref Ruqaa 700 19 px red |
| Text column | padding 136 / 34 / 18 / 30 | heading → names → meta → footer |

## Typography roles

| Role | Family | Size | Colour |
|---|---|---|---|
| Greeting | Aref Ruqaa | 18 px | `#A23B3D` |
| Label | Cormorant | 10 px, tracking 1.5 px | muted |
| Names | Aref Ruqaa 700 | `names(c, −34)`: 22 px couple / 31 px single start | ink |
| «و» | Aref Ruqaa | 20 px | red |
| Meta | Reem Kufi (shared) | 12/11/11/10 px | ink/muted; top border gold |

## Single and couple; short and long

| Case | Behaviour |
|---|---|
| Couple | «ن ف» in the disc; names on two rows with a red «و» |
| Couple long | Four-part names fit at the reduced size (`previews/signature-faces.png`, row 2, "couple long") |
| Single | One initial («ج»), one name row, no «و» |

## Scenes

- **Recommended:** candlelit, palace, silk.
- The red band holds against the dark candlelit hall because the ivory disc and the gold frame separate it.
- **Avoid:** petals. Pink against brand red reads muddy.

## Motion and blueprint

- Static face; engine storyboard.
- Code-native. A Canva master is optional (§S2).
