# Final verification — «توقيع»

**Run on:** 10 October 2026.
**Source:** the delivered tree.
**Logs:** `review/screenshots-or-captures/logs/`.
**Captures:** `review/screenshots-or-captures/journey/`, real Chromium screenshots made by the tests below. They are **actual UI**, not concept renders.

## Environment

- **Runtime:** a Linux cloud container with Node and Playwright 1.x driving the pre-installed Chromium (`/opt/pw-browsers`, software rendering).
- **Viewports:** emulated at 360, 390, 768 and 1440 CSS px. **No physical iOS or Android device was used**, and no real touch hardware: pointer gestures were driven with mouse events through Pointer Events.
- **Dependencies:** `npm ci` is impossible here; the registry is blocked (403 / ENOTFOUND). `node_modules` was assembled from local copies of the exact packages (react, react-dom, esbuild, typescript, playwright, three, types).
- **Google Fonts:** requests are aborted in every browser test. All fonts are self-hosted, so this matches production behaviour.

## Results

| Check | Command | Result |
|---|---|---|
| Typecheck (app + unit) | `npx tsc -p . && npx tsc -p tests/unit` | **pass** (`logs/typecheck.txt`) |
| Unit tests | `node tests/unit.mjs` | **64 / 64 pass** (`logs/unit.txt`). Includes 10 gesture tests (deck drag, resistance, release, fling bound, cancel, poses, sheet snap, seal) and the 9-theme list |
| Build | `node tools/build.mjs` | **pass** (`logs/build.txt`) |
| Shipped asset references | `node tools/check-shipped-assets.mjs` | **121 / 121 present**, fonts self-hosted |
| Theme token contrast | `node tools/check-theme-contrast.mjs` | **234 / 234** (token pairs only — not rendered accessibility QA) |
| Signature browser journey | `node tests/signature-journey.mjs all` | **73 / 73 pass** at 390 / 768 / 1440 (`logs/signature-journey.txt`, `journey/results.json`) |
| No generated imagery on signature routes | `node tests/dev/signature-no-generated.mjs` | 17 routes × 2 widths: **no generated files requested**. One unverified-provenance thumbnail (`assets/wizard/3d-candlelit.webp`) appears on templates/editor; recorded as `legacy.wizard.3d-candlelit-thumb.v1` (`logs/no-generated.txt`) |
| Narrow phone and enlarged text | `node tests/dev/signature-narrow.mjs` | **32 / 32**: no horizontal page scroll on 16 routes at 360 px, nor at 1440 with root font-size 200 % (`logs/narrow-and-zoom.txt`). Root-size zoom only affects rem-based sizes; browser zoom was not driven |
| Card faces, data cases | `node tests/dev/faces.mjs … sig-diploma,sig-ribbon,sig-ticket` | Visual sheet: `studio-design-book/previews/signature-faces.png`. Six cases per face (single short and long, couple short and long, opening, birthday), all inside the frame, with no «و» on single names |
| DOM tests (jsdom) | `npm run test:dom` | **Not run.** jsdom is not installable (registry blocked). The previous 32 + 68 DOM results in `docs/PROTOTYPE_STATUS.md` are historical and were not re-run on this source |
| Legacy `tests/e2e.mjs` | — | **Stale.** It waits for the old heading «مناسباتي» and the old button «أنشئ المناسبة», and failed at step 1 on this source. Replaced for this pass by `tests/signature-journey.mjs`; updating the legacy suite is listed in `REMAINING_WORK.md` |

## What the journey test proves

The data comes from the seeded store (`src/services/mock/seed.ts`, scenario "before") plus one graduation event created during the run. All of it is browser storage, reset per viewport.

**Graduation, new event, single person** (steps 01–13):

| Step | Checked |
|---|---|
| Home | Renders, no horizontal scroll |
| Occasion deck | Keyboard (ArrowLeft → 02, the «البطاقة السابقة» button → 01) and pointer swipe (left → 02) |
| Details | Live card shows the typed name; no «العروس / العريس» on the page |
| Create | «جهّز دعوتي» opens `…/invitation/design?first=1` |
| Phone sheet (390 only) | ArrowUp → full, ArrowDown → peek |
| Publish | Stamp «نُشرت دعوتك» |
| Invitation summary | No wedding wording |
| Guests | Add «عائلة الحربي»; neutral form hint; invitation code stored |
| Guest link | Envelope cover with a single name and no «و» or «&» |
| RSVP | «الموعد وتأكيد الحضور مباشرة» → reply «سنحضر» → stored as confirmed |
| Replies | Organizer replies page renders |
| Reception gate | Search «الحربي» → check-in → «الضيف التالي» |
| Summary | Red closure, no wedding wording |

**Couple, seeded wedding «نورة وفيصل».** These pages render without horizontal scroll:

- overview
- invitation
- guests
- replies
- reception
- summary
- seating
- template deck

The envelope cover then opens with «افتح الدعوة», and the invitation engine plays.

**Reduced motion.** A context with `reducedMotion: 'reduce'` opens the cover by button with no animation wait.

**Errors.** There were no page errors at any viewport.

## Visual review (by eye, on the captures)

Captures reviewed at 1440 and 390:

- home, occasions, list chooser;
- graduation details, editor, published state, invitation summary;
- guests, import, replies, seating, reception;
- gate, summary;
- guest cover and hub;
- not-found, reviewer page.

Issues found and fixed in this pass:

| Issue | Fix |
|---|---|
| Drawn journey illustrations with "+" sparkles (import, reception, summary, not-found) | Phosphor spots in an ivory disc |
| Editor stage caption: ivory text on a white pill | Translucent pill with ivory text |
| Selected segment on the phone editor bar: charcoal text on a charcoal pill | `data-on` selector added |
| Phone reception: floated art squeezed the steps | Art no longer floats on phone |
| List-and-search chooser showed generated occasion objects | Brand glyph tiles |
| Guest envelope too small on desktop | Up to 480 px |
| Card faces still plum/cobalt and hand-drawn | Redrawn in identity colours with Phosphor glyphs |
| Favicon unrelated to the brand | Logomark favicon and touch icon |

## Not verified

- Real devices: iOS safe areas, Android back gestures, true multi-touch.
- Slow-network and offline transitions under «توقيع». The prototype tools exist (`?tools=on`), but this pass did not exercise them.
- Import problem set, unmatched general replies, and reception exceptions (declined, duplicate code, over-allowance) under «توقيع». The logic is unchanged from the audited build (domain tests pass); signature only restyles these screens.
- Screen-reader output: labels and live regions are in code; no NVDA or VoiceOver pass.
- WebGL / 3D scenes with signature presets: the 9 signature presets are 2D.
- Live Studio renders of 8 of the 9 signature presets. Only `sig-diploma-marble` was seen inside the live Studio; the others were seen as faces (`previews/signature-faces.png`) or as gallery thumbnails.
