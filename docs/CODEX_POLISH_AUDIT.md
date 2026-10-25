# Doyofy — polish audit · 9 October 2026

## What was supplied
- Latest attachment: compiled JavaScript/CSS, assets and a final-polish handoff.
- Recovered maintainable source: `doyofy-prototype-source.zip`, the earlier Quiet Editorial checkpoint (17 unit tests), not the later 21-test checkpoint described in the latest status.
- The source is the implementation base. The attached build is preserved as a reference; no minified bundle is patched.
- Baseline: TypeScript and all 17 unit/service tests pass. The build succeeds but reports 18 missing audio/material assets, present in the attached build; these are restored before any visual changes.

## Verification constraint
The Sites managed environment does not provide its required control-browser capability. Per Sites guidance, no preview server or alternative browser automation is started. Browser screenshots, real-device touch/keyboard, layout overflow and WebGL frame-rate checks are explicitly NOT claimed. Source-level responsive review, domain/service regression, compilation and asset verification are performed. The previous checkpoint screenshot/tests are not presented as current results.

## Route and state map
All routes in `ROUTES_AND_FLOWS.md` remain supported: events → create → templates → editor → preview → invitation → guests/import/replies → seating → reception/gate → settings/summary, plus `/i/:slug/:code`, general invitation, legacy studio, and reviewer hub. Data remains the typed browser-local mock store. Invitation delivery, RSVP and arrival remain three separate states. No backend/WhatsApp production migration is in scope.

## Prioritized findings and implementation decisions
| Priority | Surface | User goal / observed source issue | Resolution |
|---|---|---|---|
| P0 | Invitation assets | Source export omits required sounds/materials. | Recover exact assets from latest attached build; fail build on missing references. |
| P1 | Editor save | Concurrent autosaves may finish out of order; a completed old save can imply a newer edit is saved. | Serialize saves and track edited revisions before publish/navigation. |
| P1 | Dialogs | Conditional unmount can leave the page scroll-locked. | Explicit close on cleanup, preserve focus and remaining dialogs. |
| P1 | Sharing | Opening WhatsApp marks a message shared even if canceled; reminding records simulated sending automatically. | Opening a composer does not prove sending; explicit organizer confirmation. |
| P1 | Navigation | Seven equally weighted destinations, Replies separated from Guests, reception hidden on event day. | Group preparation/day sections, put Replies alongside guest list, adaptive phone reception tab. |
| P1 | Overview | KPI card row and long unranked exceptions obscure the next step. | Event identity + one next action + lifecycle rail + three relevant facts + prioritized attention. |
| P1 | Home | Rows resemble a CRM; identity and next action weak. | Invitation-led event cards and a focused upcoming-event composition. |
| P2 | Create | Browsing hides less common occasions; carousel dominates; form below preview on phone. | Default direct visual catalogue with search/categories; form first on phone. Preserve experiments for review. |
| P2 | Gallery | All technical variants at equal weight. | Curated collection; artwork and concise descriptions lead; technical badge removed. |
| P2 | Guests | Four boxed counts and eight simultaneous filters compete; statuses are all badges. | Compact facts, list/replies views, primary filters + progressive advanced filters; independent text states. |
| P2 | Guest details | All operations equally prominent and several nested overlays. | Clear guest summary, one contextual action, secondary operations under more; avoid stacked dialogs. |
| P2 | Reception | Arrival statistics appear before event even with no arrivals. | Preparation checklist first; live summary only when appropriate. |
| P2 | Summary | Generic analytics; empty confirmations imply everyone arrived. | Human closure, accurate counts including partial arrivals; safe no-data states. |
| P2 | Typography | Remote font requests despite local UI fonts; guest display font missing locally. | Self-host UI and invitation faces with OFL licenses; remove remote font dependency. |
| P2 | Error recovery | Several mutation failures remain in state without visible feedback. | Inline actionable errors where actions take place. |
| P3 | System | Oversized pill controls, too many surfaces, duplicate page styles. | Consolidated token geometry, section composition and calmer action hierarchy. |

## Source-level responsive review
Target compositions: 360, 390, 430, 768, 1024, 1440 px. Phone guests use stacked rows; editor keeps a separate preview; focus flows preserve sticky controls and safe areas. Breakpoints are reviewed in CSS; visual results require the owner/device round in OWNER_REVIEW_GUIDE.md.
