# Style dossiers — three explorations and the «توقيع» mix

Reviewer page: **`/prototype/signature-directions`** (linked from the home closing block, «كيف بُني هذا الأسلوب»). Every theme, signature included, can be compared at `/prototype/design-directions`, or by adding `?theme=<id>` to any route.

## How we got here (honest history)

| Pass | What it was | Owner verdict | What survived |
|---|---|---|---|
| 1 | Plum/cobalt/coral "signature" with hand-drawn objects (caps, laurels, satin ribbon) and generated occasion imagery | "Don't let it look AI; don't draw icons yourself; use the identity colours" | The structure: journey, decks, envelope reveal, editor sheet |
| 2 | Identity-led beige pass: official logo, pattern and colours, mostly beige/ivory surfaces | «الـcontrast سيء جدًا ومفيش روح» — rejected | Logo, pattern extraction, Phosphor icons, contrast rules |
| 3 | Three directions on the identity: A «احتفال», B «مساء», C «تحرير» (board: `design-source/directions/direction-board.html`) | **«مزيج»** — mix them | All three, each assigned to the surfaces it serves best (below) |

## Research behind the direction

- **What reads as "AI-made".** These patterns come from default settings, not choices:
  - Inter or Roboto everywhere;
  - indigo→purple gradients (traced to Tailwind's `indigo-500` default);
  - three identical rounded cards with thin line icons;
  - a dark hero with a gradient headline;
  - interchangeable icons and vague copy.
- **The fixes.** A palette from something true about the product; a typeface chosen for feeling; asymmetry and a rhythm that breaks the three-card reflex; specific copy; and brand decisions made once and applied everywhere. Sources: [925 Studios — AI slop design tells](https://www.925studios.co/blog/ai-slop-design-tells), [prg.sh — Why your AI keeps building the same purple gradient website](https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website).
- **Gradients that help rather than decorate.** Use few, neighbouring colours; one focal point that leads the eye to the action; gentle transitions; and text kept legible, checked with a contrast tool. Source: [RNO1 — best practices for website gradients](https://blog.rno1.com/4-best-practices-for-effective-website-gradients). Our mesh rule is stricter: three to five neighbouring identity hues, one focal light, and a calm zone behind text.
- **Philosophies merged.**
  - **Swiss/editorial:** grid, scale contrast, numbered sections. This is C.
  - **Celebration poster:** one confident colour field and big type. This is A.
  - **Theatre/stage lighting:** dark field, one warm light, the object in focus. This is B.
  - **Stationery craft:** frames, discs, perforations; real cards as the hero objects in all three.

What ties them together is the Doyofy identity: six colours, the logomark, the pattern, and the brand typeface for headings.

## Shared «توقيع» rules (all modes)

**Colour.** Six identity colours only:

| Gold | Ivory | Beige | Red | Turquoise | Charcoal |
|---|---|---|---|---|---|
| `#C7A661` | `#F2EAD9` | `#E4D5B4` | `#BC4749` | `#2EB7B7` | `#262626` |

White `#FFFFFF` is the working canvas; paper is `#FFFDF8`.

Text pairs are measured (WCAG relative luminance):

| Pair | Ratio | Allowed for text |
|---|---|---|
| White on red | 5.1:1 | ✓ |
| Charcoal on gold | 6.5:1 | ✓ |
| Charcoal on turquoise | 6.2:1 | ✓ |
| Gold on charcoal | 6.5:1 | ✓ |
| Gold on white | 2.3:1 | **never** |
| White on turquoise | 2.5:1 | **never** |

Gold and turquoise are fields and shapes on white, never text. `node tools/check-theme-contrast.mjs` passes 234/234 token pairs (token check, not rendered QA).

**Type.**

| Role | Font | Weight | Size | Notes |
|---|---|---|---|---|
| Display headings (`--font-display`) | Ping AR + LT | 700 | 64–112 px | Tracking −0.025 to −0.03 em |
| Section titles | Ping AR + LT | 600 | 32–72 px | — |
| UI and body (`--font-ui`) | IBM Plex Sans Arabic | 400–600 | 15–17 px | Line height 1.85 for reading |

Ping AR + LT (brand font, TPTQ) is used **locally with the owner's permission. It needs a web licence before launch**; Readex Pro is the fallback in the stack. Invitation faces keep OFL fonts (Reem Kufi, Aref Ruqaa, Cormorant Garamond) because published invitations are public output.

**Shapes.** Four forms, all drawn from the logomark ring and the official pattern:

- the **disc with a double ring**: year disc, monogram disc, empty-state spots, seal;
- the **colour tile**: occasion posters, tickets, palette;
- the **ticket edge**: perforation and stub;
- the **double gold rule**: card frames, dialogs.

Radius is 10 px for tiles and cards, pills for actions. No glass, blobs, sparkles or "+" confetti.

**Icons.** Phosphor 2.1.1 (MIT), vendored as SVG paths:

- Regular weight for UI;
- Light weight for occasions and spots;
- Thin weight on card faces.

None is hand-drawn.

**Imagery.** None generated. Hero objects are **real rendered invitations** (`CardThumb`) built from the organizer's data or labelled samples. `tests/dev/signature-no-generated.mjs` checks 17 routes at two widths for generated files.

**Motion: "lift, settle, seal".**

- **Lift:** the drag follows the finger.
- **Settle:** snap with momentum, capped at 3 cards.
- **Seal:** one short stamp to confirm a publish or reply.

Under reduced motion every gesture becomes an instant state change. Full spec: `GESTURE_SPEC.md`.

## A · «احتفال» — entry

- **Philosophy.** A celebration poster: one confident red field, huge type, and real invitations spread like on a table. Loud for the first moment, then it steps aside.
- **Composition.** Full-bleed red mesh with five radial stops: light-red focal top-left, gold glow, deep red base, 10 % turquoise. The ivory pattern sits on it at 9 %.
  - **Copy:** h1 «كل فرحة تستاهل دعوة.» at 64–112 px; a kicker with a rule.
  - **Hero object:** a fan of three real faces you can swipe, plus a turquoise «13 مناسبة» sticker.
  - **Next step:** a white "next event" box with the real next action.
  - **Band:** an ivory band linking all 13 occasions.
- **Used on.**
  - home hero (`SignatureHome.tsx`);
  - summary closure (`.summary-closure`);
  - share preview (`public/assets/brand/share-preview.png`).
- **Avoid.** Red under small grey text; more than one focal light; red on data tables.
- **Asset list:** `assets/ASSET_BRIEFS.md` §A.

## B · «مساء» — guest, editor stage and reception

- **Philosophy.** The hall just before guests arrive: charcoal, one warm light, gold details, the invitation as the only lit object. Calm makes the invitation and staff tasks legible.
- **Composition.** Night mesh: gold glow at the top, 14 % turquoise low corner, warm charcoal core over `#1E1E1E`. The pattern field is gold at 6–8 %.
- **Used on.**
  - guest envelope cover (`SealCover.tsx`);
  - editor preview stage;
  - overview "moment" with the gold date tile;
  - reception prep card;
  - gate (scan tile in gold, search, success in turquoise);
  - reviewer end block.
- **Avoid.** Grey-on-charcoal small text; gold used as a large text block; sparkle.
- **Asset list:** §B.

## C · «تحرير» — data screens

- **Philosophy.** An editorial layout for work:
  - a white page;
  - a strong title hierarchy (Ping 600–700, numbered sections `01 02 03`);
  - colour tiles that carry real cards or real numbers;
  - a tri-colour hairline under page titles (red/gold/turquoise).

  Dense where it has to be, and never empty.
- **Used on.**
  - home sections (tickets, the 13-occasion deck, steps);
  - occasion chooser;
  - template deck;
  - invitation summary, guests, import, replies, seating, settings;
  - not-found;
  - empty states (Phosphor spots in an ivory disc with a gold double ring and a red dot).
- **Avoid.** Uniform white cards in rows of three; icons as decoration without meaning; gold text on white.
- **Asset list:** §C.

## The mix in one table

| Journey moment | Mode | Why |
|---|---|---|
| Home, first impression | A | Emotion and brand recognition |
| Choose occasion, details, templates | C (+ ivory mesh preview) | Decisions need clarity |
| Editor | C panel + B stage | Form on white, invitation lit on night |
| Publish | stamp | Short confirmation |
| Guests, import, replies, seating, settings | C | Data |
| Guest opens the link | B | Theatre around the invitation |
| Reception prep and gate | B | Focus and arm's-length legibility |
| Summary | C numbers + A closure | Work, then celebration |

## Status

| Style | Status |
|---|---|
| A «احتفال» | Complete as the entry mode; explored as a full page on the board |
| B «مساء» | Complete as the guest/reception mode |
| C «تحرير» | Complete as the data mode |
| «توقيع» (mix) | **Complete theme across the journey**, verified at 390/768/1440 (`FINAL_VERIFICATION.md`) |
| Pass 1 plum/cobalt, pass 2 beige | **Rejected**: assets replaced, nothing of them ships in «توقيع» |

## Self-review against the owner's words

- **"Focus on shapes."** Four forms only — disc, tile, ticket edge, double rule — repeated from the cards to the empty states.
- **"Don't let it look AI."** No generated imagery, no Inter, no purple, no three-card rows, no glass or blobs. Real invitations are the hero.
- **"Icons: don't draw them, use free online ones."** Phosphor (MIT) everywhere, including inside the invitation faces.
- **"Identity colours without overdoing it, not empty."**
  - Red is used only at the entry and the closure.
  - Charcoal only for guest and reception moments.
  - White for work, carried by colour tiles that hold real content.
- **"Contrast and soul."**
  - Contrast: every text pair is measured; gold and turquoise are never text on white.
  - Soul: the red hero, the night envelope and the stamp moments.
- **"Hierarchy, spacing, mesh, gestures — Awwwards level but not over."**
  - Hierarchy and spacing: numbered sections, a 64–112 px display scale, and clamp-based section spacing (72–136 px).
  - Mesh: one focal light per surface.
  - Gestures: four real gestures, each with buttons, keys and a reduced-motion version.
- **Known gaps.**
  - Newborn, iftar, conference and corporate still use non-signature card families. Two faces are planned (`sig-crescent`, `sig-agenda`; briefs in `assets/`).
  - The brand font needs a web licence.
