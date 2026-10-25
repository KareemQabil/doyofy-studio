# Five directions and gesture pass — 10 October 2026

Historical first pass. The current site adds a sixth direction with an independent UX; see [`ORBIT_EXPERIENCE.md`](ORBIT_EXPERIENCE.md) and the current `PROTOTYPE_STATUS.md`. Counts below describe the earlier five-direction snapshot.

This update responds to the request for substantial UI work, distinct directions, gestures and attractive assets. Review `/prototype/design-directions`, then use each direction's try button to open the real organizer home. The persistent appearance picker is available on home, workspace, focused flows and the invitation editor.

| Direction | Concrete differences |
|---|---|
| الورق والعاج | Amiri display headings, editorial hierarchy, warm paper and gold, tilted arched card |
| حديقة هادئة | Organic arches, softer geometry, sage actions, stone and olive studio imagery |
| فرحة وردية | Blush/lilac palette, asymmetric corners, playful ribbon composition |
| حبر ومساحة | Sharp geometry, strong black text, reversed hero columns, architectural paper and drawn occasion art |
| بعد الغروب | Dark surfaces with readable semantic colors, panoramic hero, amber light and navy silk |

The homepage, creation heading, occasion cards, gallery heading, workspace navigation, phone tabs, editor surfaces and preview dialog were reworked. Five miniature layouts in the appearance picker give quick context; the directions studio exposes larger comparisons and six occasion illustrations. Comparison sample cards are clearly separate from the canonical invitation engine.

## Artwork and delivery

Eleven original raster assets were generated: five material worlds and six transparent occasion still lifes (rings/envelope, cake, cap/diploma, baby booties, lantern/crescent, coffee service). They appear in actual interface surfaces, with lazily loaded below-fold images. Ink uses the existing 13-item double-line illustration family for a coherent minimal look. Six new objects supplement that collection rather than replacing unsupported occasions with misleading pictures.

`GENERATED_ASSETS.json` preserves every prompt, path, byte count and hash. Original PNGs remain in `design-source/generated/`; lossless WebP delivery variants are tracked in `public/assets`. No crop, resize or content edit was performed. `tools/encode-ui-art.mjs` reproduces the encoding; builds use committed output and require no encoder. Existing invitation assets, cards, scenes and engine are retained.

## Gestures

Preview opens on the personalized lightweight poster. A deliberate horizontal swipe navigates RTL: left for next, right for previous. Vertical scroll and cancelled gestures never change the preset. Previous/next buttons, keyboard arrows and a scrollable preset rail provide alternatives. “شاهد التجربة” starts the real engine and sound after an explicit action.

Phone editor handles support half/full snapping and click/keyboard toggling. Drawer and appearance-dialog handles allow deliberate downward dismissal. Pointer capture starts after axis intent is established; gestures exclude inputs and links. Busy actions block dismissal/navigation, cancelled drags reset displacement, and reduced-motion users avoid decorative movement.

## Fresh verification

- Application and unit TypeScript pass.
- 28 domain/service tests pass, including intent thresholds and RTL ordering.
- 12 DOM behavior tests pass, including theme persistence without invitation mutation, cancelled swipes, disabled interactions and phone editor snapping.
- 17 route mounts pass, including the new studio.
- 130 text/action/status token contrast pairs across five appearances meet 4.5:1. This is a token check, not rendered accessibility QA.
- Production build and shipped asset checks are recorded in `PROTOTYPE_STATUS.md`.

Browser/device visual QA, WebGL behavior, real touch feel and screenshots remain unverified: the required Sites control-browser capability is unavailable. jsdom proves component behavior only. Publication preserves the existing owner-private audience; local prototype data and mock-service boundaries are unchanged.
