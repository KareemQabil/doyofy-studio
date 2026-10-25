# Remaining work — exact ledger

Ordered by what blocks a public launch first. Each item names the files involved and how to verify it.

## Blockers before any public deployment

| # | Item | Why | Files / action | Verify |
|---|---|---|---|---|
| 1 | **Brand font web licence** (Ping AR + LT, Shinko Sans) | Desktop licence only; the owner permitted local prototype use | Buy a TPTQ / Jolicia web licence, or delete `public/assets/fonts/brand/*.woff` and the `@font-face` block in `src/ui/styles/fonts.css`. Readex Pro takes over through `--font-display` | `node tools/check-shipped-assets.mjs`; visual check of headings |
| 2 | **Backend connection** | Data is browser storage; owner chose "prepare, create nothing" | `backend/` (migration, edge contracts, `RemoteService` adapter) is ready; see `review/PRODUCTION_GAP_MATRIX.md`. Needs a Supabase project in the owner's organisation, env vars and a deploy target | `bash backend/supabase/tests/run_local.sh` locally, then the integration steps in the matrix |
| 3 | **`3d-candlelit.webp` provenance** | Not listed in any provenance record | Confirm its origin, or replace it with a screenshot of the real candlelit-hall chunk at the same 5:7 crop (`src/features/templates/TemplateThumb.tsx:58`, `src/wizard/Wizard.js:262`) | Update `legacy.wizard.3d-candlelit-thumb.v1` in `tools/asset-briefs.mjs`, then run `node tools/asset-briefs.mjs` |
| 4 | **Absolute `og:image` URL** | Social crawlers need an absolute URL | `src/index.html` once the domain exists | Facebook / X share debugger |

## Design work still open

| # | Item | Files | Brief |
|---|---|---|---|
| 5 | `sig-crescent` face (newborn, iftar) | `src/cards/signature-cards.js`, `src/domain/templates.ts`, `src/domain/invitation.ts` (`CARD_NAMES`), `src/domain/occasion-starters.ts` | `studio-design-book/CANVA_RECIPES.md` §S4, `assets/request-batches/signature-stationery-planned-v1.json` |
| 6 | `sig-agenda` face (conference, corporate) | same files | §S5, same batch |
| 7 | Optional envelope lining | `src/features/signature/SignatureArt.tsx` `EnvelopeBack` | `assets/request-batches/signature-envelope-lining-v1.json` |
| 8 | Occasion intro copy in list mode | `src/features/signature/SignatureOccasions.tsx`: the line «اسحب البطاقات أو استخدم الأسهم…» stays visible when «قائمة وبحث» is on | Swap the line per mode |
| 9 | Live Studio pass for the other 8 signature presets | Render each preset at 390 in `?view=invite&card=…&scene=…&motion=reduced` | Add to `studio-design-book/README.md` §5 |

## Test debt

| # | Item | Files |
|---|---|---|
| 10 | Re-run DOM tests | `npm ci && npm run test:dom` on a machine with registry access (jsdom is missing here) |
| 11 | Update the legacy `tests/e2e.mjs` selectors | It waits for «مناسباتي» (now the home h1 is «كل فرحة تستاهل دعوة.» in signature, and other themes changed too) and «أنشئ المناسبة» (now «جهّز دعوتي»). Either update it or retire it in favour of `tests/signature-journey.mjs` plus per-theme variants |
| 12 | Journeys not yet automated under «توقيع» | Import problem set; general-reply matching; reception exceptions (declined, already used, over allowance, undo); slow network / offline; failed publish. Extend `tests/signature-journey.mjs`; the domain logic is already covered by unit tests |
| 13 | Real devices | iOS Safari (safe areas, the bottom tab bar, sheet drag), Android Chrome (back gesture vs deck swipe), screen readers (VoiceOver, TalkBack) |

## Nice to have

- A Canva master board for S1–S3, for marketing only. The code faces are the masters. Follow `CANVA_RECIPES.md` with no AI features.
- A signature variant of `/prototype/screen-review` that lists the journey captures.
