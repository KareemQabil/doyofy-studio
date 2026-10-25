# Doyofy prototype — audit (Stage 0)

*Written 4 October 2026, before any platform code. Source of truth for the product: `DOYOFY_UX_PROTOTYPE_MASTER_SPEC.md` (repo root).*

## 1. What exists

The repository is the **Invitation Studio**: a production prototype of one interactive, Arabic-first wedding invitation. It has a customer wizard in front of it.

| Area | Where | Size | State |
|---|---|---|---|
| Studio controller: stage, state machine intro→card→opening→pages→pack→seal→fly→done, input, RSVP page, finale | `src/studio/Studio.js`, `markup.js`, `switcher.js` | ~700 lines | Working, tested |
| Registries: cards, scenes, pages, reveal, motion, finale, audio, camera, FX | `src/engine/*`, `src/modules.js` | small | Working |
| 10 cards, 10 CSS scenes (generated from the canonical `.dc.html`) | `src/cards/`, `src/scenes/css/` | generated | Working |
| Real Three.js Candlelit Hall (P0 assets) | `src/scenes/three/candlelit-hall.js` | 464 lines | Working (software WebGL in QA) |
| Content model `InvitationData` → derived content | `src/data/invitation.js`, `derive.js` | small | Working |
| RSVP adapters (`submit(response)`): Local (localStorage), REST, Supabase | `src/engine/rsvp.js` | 37 lines | Local only in use |
| 5-step customer wizard: experience → card → setting → details → share | `src/wizard/Wizard.js`, `config.js`, `wizard.css` | ~700 lines | Working, tested |
| Build (esbuild, code-split, ships only the referenced P0 assets) | `tools/build.mjs` | — | Working on Linux and Windows |
| Automated QA (Playwright, state-based waits) | `tests/qa.mjs` | 67 checks (quick), full matrix | See §4 |
| Docs | `docs/*`, `README.md`, `HANDOFF_FOR_NEXT_AGENT.md`, `qa/QA_REPORT.md` | — | Current |

The entry point is `src/main.js`. `/` opens the wizard. `?view=invite` or `?i=<base64url config>` opens the invitation.

## 2. Invitation Studio boundaries

The Studio is already a well-bounded component. That is the main reason this integration is low-risk.

- **Input:**
  ```js
  new Studio(host, { invitation, card, scene, experience, embedded, showSwitcher, muted, rsvp, params })
  ```
  `invitation` is a plain `InvitationData` object; `rsvp` is an adapter with `submit()`.
- **Output:**
  - DOM inside `host`;
  - `rsvp.submit({ name, attending, guests })`;
  - debug state on `studio.debug`;
  - `studio.destroy()`.
- **Live updates:** `setCard()`, `setScene()`, `setContent(invitation)`.
- **The wizard** wraps a Studio for preview and owns its own state: `cfg` + `form`, a draft in localStorage, and a guest link that encodes the whole design.

## 3. Coupling found (what must change to integrate)

| Coupling | Why it matters for Doyofy | Safest change |
|---|---|---|
| The wizard persists its draft in `localStorage` directly | The spec forbids screens calling storage directly; the design must belong to an Event | Add an opt-in **platform mode** with `onChange`/`onAction` callbacks; the standalone mode stays as is |
| The wizard's Details step owns date, time, venue and max guests | These are **Event** data in Doyofy; the invitation must not silently overwrite them | In platform mode, event-owned fields are read-only with a link to event settings; names, message and program stay invitation-level |
| The Share step builds a long `?i=` link | Doyofy needs short slugs `/i/sara-ahmed` backed by records | Platform mode replaces Share with a "Publish" step driven by the platform (saved / published / unpublished changes) |
| The RSVP page asks for a free-text name, with a max guest count per *invitation* | Doyofy RSVPs are per **InvitationParty**: the identity comes from the link, and the limit is the party's `maxPartySize` | Add an optional `guest` option (prefilled, locked name; party limit) and an `onDone` action button; the defaults are unchanged |
| `LocalRSVPAdapter` writes its own localStorage key | Responses must reach the organizer | The platform passes an adapter that calls the RSVP repository (the adapter contract already exists) |
| `main.js` routes `/` to the wizard | `/` becomes the Doyofy app | Keep the legacy routes: `?view=invite` and `?i=` are unchanged, and the standalone wizard moves to `?view=wizard`. QA URLs are updated (documented, intentional) |
| Global QA hooks `window.__studio` / `__wizard` | Harmless | Keep |

No business rules are mixed into rendering: cards, scenes and pages consume derived content only.

## 4. Baseline test run

- `node tests/qa.mjs --quick` passed **67/67**, on 3 October and again at the start of this audit.
- The full matrix `node tests/qa.mjs` passed **73/73** as the Stage 0 baseline, before any platform code.

## 5. Environment constraints (affect choices, not the product)

- The npm registry is **blocked** in this build sandbox (HTTP 403 by policy), so `npm install` of new packages is impossible here.
- These are available offline: React 19.2.6, react-dom, TypeScript 6.0.3 (global installs). Official `@types/react` and `@types/react-dom` were taken from DefinitelyTyped and `csstype` from its repository, both via git.
- The QR encoder is Project Nayuki's MIT `qrcodegen.ts`, vendored from GitHub.
- **No other libraries.** There is no router package, no query library, no headless UI kit and no spreadsheet library. These are written in-repo, small and replaceable, or use platform features:
  - native `<dialog>` for modals and drawers;
  - `DecompressionStream` for reading `.xlsx`.
- On a normal machine `npm install` fetches the declared versions as usual.

## 6. Stack decision

The spec names **Next.js + TypeScript** as the target frontend. For this prototype:

- **React 19 + TypeScript (strict)**, bundled by the existing esbuild pipeline.
- **A single-page app with a small router.** The route table mirrors the spec's information architecture one-to-one (`/app/events/:eventId/guests` …) and maps 1:1 to Next.js App Router folders later.
- **Why not Next.js now:**
  1. It cannot be installed in this sandbox.
  2. The prototype must also run as a static page (shareable artifact for usability tests on phones), which Next's dynamic routes don't support without a server.
- **Pages are thin.** Domain, services and features are framework-agnostic or plain React, so moving to Next.js means moving route files, not rewriting flows.
- Recorded as reversible decision **D-001** in `docs/UX_DECISIONS.md`.

## 7. Safest implementation path

1. **Don't move the engine.** `src/studio`, `src/engine`, `src/cards`, `src/scenes`, `src/pages`, `src/wizard` and `src/data` stay where they are, so the generator and the tests keep working. Platform code reaches them through one facade, `src/features/invitation/engine.ts`.
2. **Add the layers next to it:**
   - `src/domain`: types, rules, validation, derived counts, no React;
   - `src/services`: repository interfaces, a mock implementation over a persisted store, seed data, a prototype clock;
   - `src/features/*`: one folder per journey;
   - `src/ui`: tokens, primitives, layouts;
   - `src/app`: entry, router, providers.
3. **Make only opt-in changes to the engine:**
   - Studio: `guest`, `onDone`;
   - Wizard: platform mode.
   Defaults stay identical, so the existing 67 checks still apply.
4. **Build the journey end to end before polish:** create event → overview → invitation (save/publish/preview) → guests/import → share states → guest RSVP → organizer sees it → seating → check-in → summary.
5. **Add domain unit tests and a Playwright acceptance journey** (desktop + 390 px phone) alongside the legacy QA.

## 8. Risks

- **Two-name assumption:** the Studio's cards are written for two names (couples). Non-couple events (birthday, graduation…) can be created and managed, but their invitation still renders two name slots. This is recorded as a known limitation, not hidden.
- **Big WebGL scene inside the workspace:** previews use one Studio at a time, and the overview uses card thumbnails, not live Studios.
- **Browser storage as the mock "server":** it's per-browser. A guest RSVP on a *different* device won't reach the organizer in the prototype. Same-browser tabs sync live (storage events). A real API replaces the mock repositories behind the same interfaces.
