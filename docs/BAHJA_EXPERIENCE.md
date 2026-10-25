# بهجة — final polish and simpler organizer journey

10 October 2026. Open `/app/events?theme=bahja`; compare all seven appearances at `/prototype/design-directions`. Existing data and appearance selection remain per-browser.

## Simpler shared journey

Occasion → names/date/place → a relevant invitation ready to review → publish → add/share with guests → reception. Creation no longer forces a template-gallery decision. Occasion links carry the selected type and skip redundant selection. All thirteen types receive a distinct recommended real-engine preset, appropriate Arabic/English invitation copy and an editable program. Saved designs are preserved.

The gallery is optional, ordered by the occasion, and contains 32 presets using actual card/scene recommendations (30 recommended 2D combinations and two existing 3D variants). Every type has at least two primary looks. Cards suppress absent partner names, separators and wedding labels for single-name occasions. Calendar metadata uses the event label. Narrow Arabesque name typography shrinks for longer names and permits wrapping.

Overview presents three core stages, one next action, and five required readiness items. Map links and table distribution are optional. An event without tables is never redirected to seating simply because confirmed guests have no table. Once tables exist, real seating problems remain visible. Workspace shows essential destinations; table/settings/summary access is disclosed. Mobile always has reception, with extras under More. Program edits and manual card/scene choices are collapsed. Import starts with one file-upload path, with paste/sample options disclosed below.

## Bahja visual and interaction system

Cream ground, violet text/actions, coral/cobalt/citron accents, large Arabic typography, glossy sculptural invitation hero, decorative moving type, rotating occasion posters, focused event story, horizontal native RTL discovery strip, workspace with four essential links and optional details. A stacked invitation salon offers RTL keys/swipes, visible controls, cancellation and pending-state handling. Vertical scrolling wins over horizontal gestures. Buttons/inputs do not initiate surface gestures; intentional drawer/editor grips opt in. Preview keys are scoped to the preview stage. Live invitation playback begins only on explicit preview in Bahja and Orbit. Presentation movement responds to `prefers-reduced-motion`.

## Assets

Seven new transparent raster occasion objects: engagement, marriage contract, henna, conference, opening, corporate and other. One new 1536×1024 hero. Together with six existing objects, all thirteen occasions have imagery; Ink retains its original line-art language. Nine original inline SVG journey illustrations cover invitation, guests, reply, seating, reception, celebration, upload, search and offline states, connected to empty/error/import/reception/summary screens.

Built-in image generation produced the eight new bitmap originals. PNG originals, exact prompts and alpha metadata are under `design-source/bahja/manifest.json`. WebP uses alpha-preserving `exact=True`, quality87. Eleven old WebPs were reencoded from unchanged original PNGs, repairing transparent-pixel artifacts including the white wedding rectangle. Reencoding reduced the eleven files from about13MB to about2.3MB; new eight files total about1.9MB. `existing-assets-reencode.json` records exact sizes.

## Verification and limits

TypeScript and build pass. 37 domain/service tests, 24 DOM behavior tests, 17 existing / 14 Orbit / 14 Bahja route mounts, 111 shipped asset references, and182 token contrast pairs pass. DOM checks verify direct creation, occasion defaults, optional editor controls, template selection, publication, guest routing and gesture behavior. They do not verify pixels or device feel. Original images and converted WebPs were inspected; no browser screenshots or device/WebGL visual QA were run because the required Sites browser capability is unavailable in this managed environment.

The site remains a review prototype with browser-local storage. Separate devices do not share events or RSVP changes; auth/roles, automatic delivery, reminders, thank-you and camera scanning remain mocked. Deployment does not change those boundaries.
