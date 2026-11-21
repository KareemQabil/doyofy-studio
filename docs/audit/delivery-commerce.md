# Delivery, guest pass and commerce audit — 21 November 2026

Scope: sharing, bulk delivery, portable guest completion, QR, Google Wallet and the connections to capacity/payment and account audio. The delivery work below is a browser-local prototype; it sends no messages automatically and issues no real Wallet pass.

## Findings and decisions

| Severity | Evidence before this change | Decision and resulting behavior |
| --- | --- | --- |
| P0 | `shared/share-link.ts` emitted a carried `?d=` link, but `guest/GuestInvite.tsx` redirected it to the old `?i=` engine. Shared guests never reached the platform completion hub. | New v2 public snapshot stays on the guest route. A separate device-only guest API completes RSVP → personal QR → Wallet preview; a banner and cinematic receipt explicitly say the reply does not reach the organizer. |
| P1 | `guests/share.ts` supported WhatsApp only; `ShareQueue.tsx` accepted only WhatsApp-ready recipients. | One selected audience now offers WhatsApp, SMS, copying all selected personal links, and native device sharing when supported. SMS/WhatsApp validate and normalize the number; guests without one remain in copy/native share. |
| P1 | QR existed only in the local guest hub. There was no Wallet action. | Confirmed personal invitations show a short `DOYOFY:<code>` QR, accepted by the existing reception parser. Wallet preview appears next to the QR. It clearly says no Google Wallet card was added and requires a real issuing service for production. General responses and declined guests get neither pass nor QR. |
| P1 | Event capacity/payments had no implementation. | Capacity/payment belongs to the separate `domain/billing` and `features/billing` work. The intended handoff is an in-context capacity upgrade, with input retained after cancellation; this report does not claim a real payment provider. |
| P1 | The account had no audio library; the editor toggled preview audio only. | Account audio is implemented in the separate audio work. Portable snapshots resolve the creator's audio selection before sharing and carry a reference, never upload bytes. An unavailable local upload uses the engine's truthful fallback. |
| P2 | Sharing controls were fragmented, and a guest-list footnote incorrectly said carried links only opened on the creator's device. | The existing immediate WhatsApp action remains, with SMS and native sharing in the same guest drawer. Bulk channels live together; the guest-list owner updates the footnote. Shared snapshot comments now explain device-local demo replies precisely. |

## Workflow details

- **WhatsApp/SMS:** select guests → choose channel → open one prepared message → explicitly confirm “sent” → next. Opening a composer never updates delivery. Skip, pause/resume, errors and missing numbers remain visible.
- **Copy/native share:** all selected names and their unique links, including guests without phone numbers. Neither copying nor closing the native share sheet counts as delivery. Clipboard failure exposes selectable text; user cancellation of native share is quiet.
- **Guest:** personal portable link → addressed envelope → invitation or direct practical RSVP → confirmed personal QR → clearly labelled Wallet preview. A saved local reply is recovered on that same device. General links do not invent a personal admission identity.
- **Data boundary:** portable payloads include the public event, published invitation, guest name/code/allowance, and public guest questions. They omit owner IDs, guest phone numbers, organizer notes and the organizer store. Reply persistence uses a separate guest-demo key. Snapshot identity and basic structure are validated before rendering; malformed new tokens show a useful invalid-link state. Legacy v1 links remain compatible.
- **Capacity/commerce boundary:** QR in a carried demo is a demonstrator, not proof of a paid reservation. Bulk automated sending, provider delivery receipts, real payment processing and real Google Wallet issuance still require their services.

## Validation

- `node tests/unit.mjs`: passed with delivery coverage for Arabic snapshot roundtrip/privacy, mismatched-token rejection, local reply persistence and isolation, allowance/integer validation, decline/general identity, SMS normalization/iOS syntax, copied no-phone recipients and outgoing Egyptian/Saudi copy.
- `node tests/delivery-dom.mjs`: passed. Checks actual component interaction for SMS compose and explicit manual confirmation, then portable cover → RSVP → personal QR → truthful Wallet preview with organizer data unchanged. DOM tests do not prove touch, rendering or live provider operation.
- `npm run build`: passed during implementation.
- `tests/gate.mjs` Q1 now verifies the full fresh-context portable flow, local reply recovery after reload, Wallet honesty and organizer-store isolation. Its old redirect/engine-internals assertion is removed because it described the incomplete journey. The URL budget is 12,000 characters, accommodating public questions and wishes; QR contains the short admission code, not the entire snapshot. SMS explains that the demo link can make a long message.
- Local Chromium could not launch because the host denies its Unix socket (`socket() failed: Operation not permitted`). Browser gate execution is therefore deferred to the supported CI/browser environment; no visual or device pass is claimed here.
