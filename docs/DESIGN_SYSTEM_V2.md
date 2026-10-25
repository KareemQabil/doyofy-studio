# Design System v2 — "Quiet Editorial"

*October 2026. Source of truth: `src/ui/styles/tokens.css` (values), `src/ui/styles/fonts.css` (type), `src/ui/primitives/*` (components).*

The organizer product should feel like a calm consumer product with powerful operations inside it, not an admin dashboard in wedding colours. The invitation itself stays cinematic. The platform stays quiet.

## 1. One component system, two reviewer themes

Both themes use the **same role names**. Features never read the theme: it is applied once, as `<html data-theme="warm|sage">` (`src/app/review.tsx`). Switch it in the prototype tools, on `/prototype/design-review`, or with `?theme=warm|sage` on any link.

| Role | A · Warm Editorial (default) | B · Soft Sage | Use |
|---|---|---|---|
| `--c-canvas` | `#F7F3EC` warm ivory | `#F3F4EF` warm off-white | page |
| `--c-surface` | `#FFFDF9` | `#FBFBF8` | content surfaces |
| `--c-surface-elevated` | `#FFFFFF` | `#FFFFFF` | sheets, dialogs, menus |
| `--c-surface-subtle` | `#EFE8DC` sand | `#E7EBE3` stone-sage | quiet blocks, tracks, segmented controls |
| `--c-hairline` / `-strong` | `#E6DED0` / `#D3C8B5` | `#DEE3D8` / `#C7CFC1` | separators / input borders |
| `--c-text` / `-2` / `-3` | `#262626` / `#57514A` / `#6B645B` | `#262626` / `#525A52` / `#5F685F` | brand charcoal; every text tone ≥ 4.7:1 on every surface |
| `--c-primary` | `#2B2622` warm charcoal ink | `#46584A` deep sage | primary actions |
| `--c-accent` | `#C7A661` brand gold | `#8DA088` muted sage | **decorative only** |
| `--c-accent-strong` | `#7E5F25` | `#566A52` | the accent as text or icon (≥ 4.5:1) |
| `--c-selected` | `#9C7A36` | `#5B6E57` | selection ring and check (≥ 3:1) |
| `--c-focus` | `#262626` | `#262626` | focus ring (always ink) |
| `--c-logo` | `#B8954F` | `#3E4A40` | logo colour |
| `--art-1…6`, `--art-ink` | sand / blush / sage tints | stone / sage tints | occasion art grounds and line colour |
| semantic | success `#2F6B4A`, warning `#875A10`, danger `#A63E40` (brand red, darkened), info `#1E6E70` (brand turquoise, darkened) | same | statuses |

**How the brand palette is used.**
- Charcoal is the text colour.
- Ivory and beige are the foundations.
- Gold appears in small amounts: the logo, art, selected details. It is never used as text and never as the only signal of a state.
- Red and turquoise appear only, darkened, as danger and info.

**Theme scopes that stay specialised** (not part of the A/B):
- `.theme-guest`: guest hub, invitation-flavoured.
- `.theme-gate`: dark, high-contrast check-in.

Both inherit the new type and motion tokens.

**Compatibility.** The old role names (`--c-bg`, `--c-line`, `--c-surface-sunken`) remain as aliases of the new ones, so existing screens re-theme without code changes.

## 2. Typography

| Token | Family | Role |
|---|---|---|
| `--font-display` | **Readex Pro** (variable 160–700) | Page and section titles, occasion and template names. Geometric, with Arabic and Latin designed together: the closest open match to the brand's Shinko Sans / Ping AR + LT. |
| `--font-ui` | **IBM Plex Sans Arabic** 400/500/600/700 | Everything else; legible in dense guest lists. |

- **Self-hosted** in `public/assets/fonts/`, subset to Arabic + Latin, as WOFF. Licences: `OFL-*.txt`.
- The brand fonts are not licensed for this prototype and are not hot-linked. Swapping them in later means editing `fonts.css` and the two tokens.
- **Scale:** 13 · 14 · 16 · 18 · 22 · 28 · 36, plus display `--fs-4xl` at 36–52 (fluid).
- **Leading:** body 1.75 for Arabic; headings 1.2–1.3.
- **Weights:** display headlines use 500, because the display face reads heavier.
- Invitation templates keep their own expressive faces (Aref Ruqaa, Amiri, Cormorant…), still loaded from Google Fonts as before.

## 3. Shape, space, depth

- **Radius:**
  - controls: 10–14 px;
  - surfaces: 20–28 px;
  - art and cards: 24 px (`--r-art`);
  - buttons: pills.
- **Spacing:** 4-based, up to 80 px; editorial pages use 40–64 px vertical rhythm.
- **Depth:** hairlines and tonal surfaces first. Shadows are rare and warm-tinted:
  - `--shadow-2` for lifted cards;
  - `--shadow-pop` for sheets and dialogs;
  - `--shadow-art` under invitation art.
- **Containers:**
  - `--container` 1120 px;
  - `--container-wide` 1280 px (gallery);
  - `--container-narrow` 720 px (forms).

## 4. Brand assets

- **Logomark and logotype** come from the guidelines PDF as vectors (`src/ui/brand.tsx`: `Logo` and `LogoMark`) and are coloured with `currentColor` (`--c-logo`).
- **Occasion art** (`src/features/occasions/OccasionArt.tsx`) is 13 original line illustrations in the brand's **double-line** stroke, the same language as the logomark and the brand pattern: one path stroked twice, a thick ink line with a thin ground-coloured line inside. The grounds are muted theme tints. There is no stock imagery.
- **Template art** is the product itself: real cards standing in real settings, rendered with the event's names (`TemplateThumb`).

## 5. Components touched in this iteration

| Component | Change |
|---|---|
| `Button` | Pill shape; tonal hover; 0.98 press scale; a pressed tone for the primary button. |
| Inputs | 48 px tall; ink focus border with a soft halo. |
| `ChoiceGroup`, `Switch` | Use the selection tokens. |
| `Dialog` | Larger radius; new `xl` size; `className` hook. Phones get the bottom sheet as before. |
| `Panel`, chips | Softer radius; chips have press feedback. |
| **New `Segmented`** | Tabs and segmented control with a moving indicator. Keyboard follows reading direction (RTL: ← is next), plus Home/End. |
| **New `Logo` / `LogoMark`** | Official brand mark. |

## 6. Re-skinning after the owner review

1. Choose A or B. Delete the other block in `tokens.css`, or keep both as user themes.
2. Optionally swap the fonts in `fonts.css` and `--font-*`.
3. Roll the layouts (Events → Overview → Guests → …) onto the system; this is Stage 6 of the brief.

Feature code needs no change for steps 1 and 2.
