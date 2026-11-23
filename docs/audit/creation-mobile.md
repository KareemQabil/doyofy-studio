# Creation, design discovery and mobile audit

Date: 21 November 2026. Baseline: `main` / `bd6000a`, which already includes `v2/final`.

This pass inspected the actual creation, home, template and editor implementations. The earlier five-step wizard described in the old root handoff was obsolete: the shipped creation flow already used two steps. That shorter flow is preserved.

## Findings and changes

| Severity | Baseline evidence | Result in this change |
| --- | --- | --- |
| P1 | `SignatureHome.tsx` rendered the main phone card at 168px. It competed with a long description and another event panel. | The front card uses 66% of the phone width, up to 280px; the home places the card immediately after the heading. Side cards remain visible as navigation cues. Desktop cards also grow. |
| P1 | `SignatureTemplateLibrary.tsx` rendered phone cards at 116px in a two-column grid. `TemplatePreview.tsx` only supported a horizontal pager. | Phones open on a native vertical scroll feed with one snap point per design. Up/down buttons and keyboard arrows, Page Up/Down, Home/End provide alternatives. Only the current design and its neighbours mount card artwork. The optional grid has one large card per phone row. |
| P1 | Template previews had separate scene and design rails, playing controls and repeated navigation. There was no shareable catalogue destination. | A full-height preview keeps design selection and full invitation playback distinct. Backgrounds are an optional disclosure. A share action uses the device share sheet and falls back to copying a link, with a manual copy field if needed. |
| P1 | `EditorWorkbench.tsx` removed 64px horizontally and 72px vertically before fitting the card; the mobile editor initially reserved nearly half the viewport for its controls. | The editor starts with a small controls panel, uses tighter adaptive card margins and gives the poster the remaining stage space. A labelled expand action opens a larger card. Focusing an input still expands the editing panel for typing. |
| P1 | An event-only edit did not affect the design publish state. The publish action either required an earlier manual event save or still said “إلى الضيوف”. | Event edits now make the published invitation show an unpublished-changes action. Publishing validates the event, saves valid event changes and then snapshots the design in one user action. Invalid fields stay uncommitted and receive focus and field feedback. |
| P1 | Creation placed its preview after every form field on phones. | A preview disclosure now appears before the essential fields. It shows the actual selected template, including a design chosen from a shared link. No extra creation step was added. |
| P2 | The full editor and template previews started at the card, while the guest preview started at the invitation opening. | Full previews now start at the opening. Playing the face animation in the editing canvas remains a separate action. |
| P2 | Creation state lived only in React state, so a reload discarded typed essentials. | The unfinished creation draft is saved per local account, automatically resumed and can be explicitly discarded. Successful creation clears it. A selected shared template is retained through this recovery. |
| P2 | “مختارة لمناسبتك” appended the entire catalogue after the recommendations. | The recommended view contains suitable designs; the separate all-designs filter exposes the catalogue. |

## Share contract

Catalogue sharing produces `/app/events/new?type=…&template=…&preview=1`. It carries only an occasion and catalogue template identifier. It does not include event names, guest identities, guest links, attendance or table information. Opening the link can show the selected template with labelled example content before creating an event. Choosing the design retains it through the two-step form and editor autosave.

The native share sheet does not mark any guest message as delivered. No outbound messaging integration was added in this workstream.

## Verification and limits

Focused DOM checks cover:

- Vertical feed keyboard navigation, settled scroll selection, busy-state blocking and no application merely from browsing.
- A shared template destination without an existing event ID; explicit selection; creation draft recovery; preservation of the selected design after creation; clearing the completed draft.
- A published invitation with event-only edits: one publish saves the changed venue; an unsafe map URL prevents saving and focuses the invalid field.
- The existing editor autosave, preview and explicit template-use checks, updated for the new feed and initial mobile panel position.

Validation on the combined working tree passed: `node tests/dom.mjs` (45 behavior cases, 34 light/dark route mounts and missing/malformed route checks), `npm run typecheck`, `npm run build`, and `git diff --check`. The DOM run emits React `act` warnings from asynchronous cross-store updates; it reports no failed assertions. DOM checks verify behavior, not layout, actual touch scrolling or card readability. Local browser execution is blocked by the environment; phone sizes, scroll snap, safe-area spacing, long Arabic names and reduced-motion presentation still require the browser/preview checks before release. No visual measurements are claimed here.

The feed uses native scrolling, bounds artwork mounting, cleans pending timers on unmount even without ResizeObserver, and provides button/keyboard alternatives. Gesture hints play only a few cycles and respect reduced motion.

### Browser evidence follow-up

The first CI phone-home capture showed crowded Arabic metadata on the wedding face. The collection's metadata now uses the readable UI Arabic font with explicit line spacing and minimum row heights, rather than inheriting the decorative face typography. This correction is in `src/cards/collection.js` and applies to the face itself in the gallery and guest engine as well as thumbnails. Generated canonical files are untouched. A subsequent browser capture must confirm the visual result; unit/DOM tests cannot establish text geometry.
