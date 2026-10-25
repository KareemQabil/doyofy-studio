# Owner feedback log

## Round 1 input — October 2026 (brief: `DOYOFY_UI_UX_CONTINUATION_BRIEF.md`)

| # | Feedback | What was built | Where to review |
|---|---|---|---|
| F1 | There may be many occasion types; four static cards are too limiting. Something like a carousel to discover more. | 13 occasions in 5 groups, offered two ways on the same data: **Coverflow** (one centred, neighbours peek; swipe/arrows/keyboard, no autoplay, no rotation) and **Editorial Rail + all occasions** (popular rail, plus a grouped gallery). Switch in the prototype tools. | `/prototype/design-review` → اختيار المناسبة |
| F2 | Wants to see the editor: premium and easy, controlled, not Canva. | A new editor shell around the existing invitation engine. The live invitation is the anchor, with four sections, autosave, draft/published clarity and «معاينة كضيف». Event details can be edited inside it, with a clear notice. Phone: preview-first with a bottom sheet. No free canvas, layers or dragging. | `/prototype/design-review` → محرر الدعوة |
| F3 | A real visual gallery, not a configuration form. | 13 curated **TemplatePresets** built from the engine's recommended card × setting pairings, rendered live with the event's own names. The occasion decides the order; a style chip row filters. A preview plays the real invitation before anything is applied. | `/prototype/design-review` → معرض القوالب |
| F4 | Leans toward the two reference images: warm editorial / ivory / taupe and soft sage / stone. | Two token themes, **Warm Editorial** and **Soft Sage**, on one component system, with self-hosted display/UI fonts and the official logo. Common qualities taken from the references: large radii, pill actions, whitespace, tonal surfaces instead of boxes, line icons. Not copied: their glass effects, photo heroes and KPI tiles. | Theme switch on the review page |

### What was deliberately *not* taken from the references
- **Frosted-glass panels over photos** (reference 1): the brief rules out heavy glassmorphism.
- **Stock photography heroes:** there are no licensed photos. The double-line occasion art and live invitation renders are used instead.
- **Rows of four KPI or shortcut cards:** they are the dashboard pattern the brief asks to move away from.

## Decisions needed from the owner (to unblock Stage 6)

1. **Visual direction:** Warm Editorial, Soft Sage, or a mix (for example, Warm surfaces with sage actions).
2. **Occasion chooser:** Coverflow, Rail, or a hybrid (see `docs/UX_EXPERIMENTS.md`).
3. **Gallery and editor direction:** approve as is, or list changes.
4. **Brand fonts:** if Shinko Sans / Ping AR + LT licences exist, send the web font files. They swap in through `--font-*`.

## Responses

*(record the owner's answers here, with the date, then mark the winners in `docs/UX_EXPERIMENTS.md`)*
