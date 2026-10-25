# Doyofy — UX prototype (with the Invitation Studio)

**Doyofy** is an Arabic-first event and guest-management product. This repository is its stateful UX prototype. One coherent journey covers:

**create event → invitation → guests / import → share → RSVP → seating → check-in → event summary**

It is built around the existing **Invitation Studio** (the cinematic invitation engine). Inside Doyofy it is reached through an occasion chooser, a curated template gallery and a new editor.

> **Final polish / simpler journey, 10 October 2026.** Open `/app/events?theme=bahja` for **بهجة**, the seventh appearance: expressive art and a simpler organizer workspace. New invitations go directly from essentials to a relevant ready-made design; changing the template is optional. 32 real presets cover all 13 occasions, each with dedicated artwork and starter copy. Checks: 37 domain/service tests, 24 DOM behaviors, 17 existing + 14 Orbit + 14 Bahja route mounts, 182 token contrast pairs, clean TypeScript and 111 shipped asset references. **Browser/device visual QA and screenshots were not run.** See [`docs/BAHJA_EXPERIENCE.md`](docs/BAHJA_EXPERIENCE.md) and `docs/PROTOTYPE_STATUS.md`.

- **Start here:**
  - [`docs/PROTOTYPE_STATUS.md`](docs/PROTOTYPE_STATUS.md): what works, what's next;
  - [`docs/ROUTES_AND_FLOWS.md`](docs/ROUTES_AND_FLOWS.md): every screen and journey;
  - [`docs/TEST_SCENARIOS.md`](docs/TEST_SCENARIOS.md): run usability tests.
- **Product source of truth:** [`DOYOFY_UX_PROTOTYPE_MASTER_SPEC.md`](DOYOFY_UX_PROTOTYPE_MASTER_SPEC.md).
- **Model & decisions:** [`docs/PRODUCT_MODEL.md`](docs/PRODUCT_MODEL.md), [`docs/UX_DECISIONS.md`](docs/UX_DECISIONS.md), [`docs/PROTOTYPE_AUDIT.md`](docs/PROTOTYPE_AUDIT.md).

```bash
npm install
npm start               # → http://localhost:5173  (Doyofy; seeded with 3 realistic Arabic events)
npm run typecheck && npm run test:unit && npm run test:dom
npm run build && npm run assets:shipped:check
# Browser suites: run only in an environment with the supported browser QA capability.
```

### Code layout

```text
src/
  domain/      entities, rules, validation, derived counts — no React, no storage
  services/    typed contracts (contracts.ts) · mock implementation + seed (mock/) · file reading
  features/    one folder per journey (events, occasions, templates, editor, overview, invitation, guests, rsvp, seating, check-in, guest, settings, summary, prototype)
  ui/          design tokens (the only raw colours) · primitives · layouts — swap these to reskin
  app/         entry, router, data hooks, route table
  studio/ engine/ cards/ scenes/ pages/ wizard/ data/   the Invitation Studio engine (unchanged API; opt-in platform options)
```

The organizer's top-level routes:
- `/app/events`;
- `/app/events/:id/{overview,invitation,guests,rsvp,seating,check-in,settings,summary}`.

Guest links are `/i/:slug/:code`; gate mode is `/check-in/:id`. In the prototype, **أدوات التجربة** (enabled from the reviewer hub or `?tools=on`) switches scenarios (before the event / event day), resets data, and simulates offline mode.

---

# Invitation Studio — production prototype

The canonical **"Invitation Studio — full interactive flow"**, productionized:

- the same 390×844 mobile-first experience;
- the same state flow: intro → card → opening → pages → pack → seal → fly → done;
- the same five pages, envelope finale and 10 cards × 10 scenes switcher.

Underneath sits a modular engine. The default **Wine & Gold + Candlelit Hall** runs on a real Three.js room built from production assets.

Inside Doyofy the Studio is opened from an event (`/app/events/:id/invitation`). The standalone **customer wizard** is still available at `/?view=wizard`, and the standalone invitation at `/?view=invite&i=…`. Read [`docs/STUDIO_OVERVIEW.md`](docs/STUDIO_OVERVIEW.md).

```bash
npm install
# once: install the P0 asset packs (not included in the source zip — 178 MB)
npm run assets:p0:install -- path/to/invite-engine-p0-pack-a1-3d-hdri-pbr.zip path/to/invite-engine-p0-pack-a2-images-audio-canva.zip path/to/invite-engine-p0-pack-b-video.zip
npm run assets:check # present 63/63 · required missing 0 · READY
npm start            # build + serve → http://localhost:5173 (Doyofy) · /?view=wizard · /?view=invite
npm run dev          # same, rebuilds on change
npm run build        # → dist/ (static; deploy anywhere)
npm run test:studio  # full Invitation Studio QA matrix (needs: npx playwright install chromium)
npm run test:quick   # flow + WebGL + fallback, one viewport
```

Works on Windows, macOS and Linux. Open it over `http://localhost`, not as a file.

## URL options

| Option | Effect |
|---|---|
| `?view=invite` | The standalone invitation (all options below apply to it) |
| `?view=wizard` | The standalone customer wizard |
| `?i=<config>` | A design from the wizard's guest link |
| `?card=wine&scene=candlelit` | Any of the 100 combinations (card ids: lace wine emerald sage blush midnight arabesque minimal terracotta clay · scene ids: candlelit marble garden desert starry silk petals clay sea palace) |
| `?start=intro\|card\|pages\|rsvp\|done` | Deep link into a state |
| `?quality=high\|balanced\|low` | Force a quality tier |
| `?renderer=auto\|three\|dom` | `dom` = the canonical CSS/SVG scenes only |
| `?motion=reduced` | Reduced-motion mode |
| `?author=1` | The switcher shows the active renderer and any fallbacks |

## Change the invitation

Edit **one object**: `src/data/invitation.js`, or pass `invitation` to `new Studio(host, { invitation })`.

- Names, monograms, date and time zone, venue, map link, copy, program and RSVP limits all live there.
- Dates are formatted with Intl in the event's time zone.
- Optional `display.*` strings override them (the canonical sample uses the spelled-out "السابعة مساءً").

## Docs

| Doc | What's in it |
|---|---|
| [`docs/STUDIO_OVERVIEW.md`](docs/STUDIO_OVERVIEW.md) | **Start here.** The studio in plain language: wizard, experiences, library, status |
| [`docs/AUDIT.md`](docs/AUDIT.md) | What was supplied, the original architecture traced from source, and the original → production map |
| [`docs/BASELINE.md`](docs/BASELINE.md) | The unmodified original run and measured (states, timings, geometry) |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Registries, renderer contract, framing, quality tiers, audio, accessibility |
| [`docs/ASSET_PROVENANCE.md`](docs/ASSET_PROVENANCE.md) | All 63 assets: source, licence, verification, usage |
| [`docs/PRODUCTION_STATUS.md`](docs/PRODUCTION_STATUS.md) | What's production-grade, what's fallback, what's next |
| [`qa/QA_REPORT.md`](qa/QA_REPORT.md) | Test results and screenshots |
| [`HANDOFF_FOR_NEXT_AGENT.md`](HANDOFF_FOR_NEXT_AGENT.md) | Handoff notes |

## Adding things

- **A card:** add a design in `canonical/CardFace.dc.html`, run `npm run port:canon`, then add its metadata row (theme, tone, tags, recommended scenes) in `src/cards/index.js`.
- **A scene:** add it in `canonical/Scene.dc.html` and run `npm run port:canon`, then register it in `src/scenes/index.js`. It gets the DOM renderer automatically.
- **A heavier renderer for any scene:** put `{ mode: 'three', requires: ['webgl'], mount(layer, ctx) }` in front of that scene's renderers. It loads after the DOM version is up, crossfades in, and falls back automatically.
- **Assets:** install packs with `npm run assets:p0:install -- <zips>`, reference them by literal `p0/…` paths, then run `npm run assets:index` and `npm run assets:check`. The build ships only the referenced files.

## Credits

- 3D models, PBR textures and HDRI: [Poly Haven](https://polyhaven.com) (CC0).
- Sound effects: [Mixkit](https://mixkit.co) (Mixkit Sound Effects Free License).
- Three.js (MIT).
- Card and scene designs: the canonical Invitation Studio.
