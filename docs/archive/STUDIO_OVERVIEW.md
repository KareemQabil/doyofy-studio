# Invitation Studio — overview

*Status as of 3 October 2026.*

Invitation Studio makes interactive, Arabic-first wedding invitations for the web. A couple designs their invitation in a short guided wizard. Their guests open a link to a cinematic invitation: they tap the card to open it, read the details across five pages, and reply. The reply is sealed in an envelope that flies away.

It has two sides:

| Who | What they see | Where |
|---|---|---|
| **The couple (customer)** | The **wizard**. They choose the experience, card, setting and details, with a live phone preview, then get a link. | the default page `/` |
| **Their guests** | The **invitation**: a full-screen experience with RSVP. | the link `/?view=invite&i=…` |

---

## 1. The customer wizard

Five steps. A live preview of the real invitation sits beside the steps on desktop, and behind a **Preview** button on phones.

| Step | The customer chooses | Notes |
|---|---|---|
| ١ **Experience** · التجربة | **3D or 2D**, then **animated or static** | Changing the experience rebuilds the preview immediately. |
| ٢ **Card** · البطاقة | one of 10 card designs | Every design is shown **with the couple's own names**. Cards that suit the chosen setting are marked "يليق بـ…". |
| ٣ **Setting** · المكان | where the card is presented | Every setting is shown **with the chosen card placed in it**. 3D offers the 3D settings only. |
| ٤ **Details** · التفاصيل | names (Arabic + English), date, time, time zone, venue, city, map link, invitation message (Arabic + English), evening program (up to 6 items), max guests per reply | Required: both Arabic names, date and time. Everything updates the preview as they type. |
| ٥ **Share** · المشاركة | — | A summary with **Edit** links back to each step, the **guest link** with a copy button, **Open full screen**, and **Start a new design**. |

The design direction is an atelier:

- rose-ivory paper, wine-black ink, oxblood and antique gold;
- Arabic calligraphy (Aref Ruqaa) for the step titles, with English beneath;
- arch-topped choice tiles that echo the invitations;
- a small gold wax seal marking each selection.

Bilingual labels throughout: Arabic first, English second. RTL layout. Fully usable on phones.

The wizard keeps a draft in the customer's own browser, so reopening the page continues where they left off.

## 2. The four experiences

|  | **Animated** | **Static** |
|---|---|---|
| **3D** | A real lit 3D room. Cinematic opening: black, the couple's names, the card flying in from depth. Candles flicker, the room shifts subtly with the pointer, the envelope seals and flies away, music plays on the pages. | The same 3D room as a calm, fully lit still. Opens straight on the card, no camera or candle motion, fades instead of movement. |
| **2D** | The hand-drawn settings with their gentle loops (bokeh, fireflies, falling petals, waves). Same cinematic opening and envelope finale. | The hand-drawn setting, perfectly still. Opens straight on the card. |

Every experience keeps the complete guest journey: card, five pages, RSVP, envelope, thank-you.

**3D availability today:** the **Candlelit Hall** is the 3D setting. Choosing 3D offers it (with any of the 10 cards); the other nine settings are 2D for now. If a guest's device can't run 3D (no WebGL, or the room fails to load in time), the invitation shows the 2D Candlelit Hall instead, never a blank screen.

## 3. What guests experience

1. **Opening** (≈ 4.7 s, animated only): black screen, the couple's names in gold, the card arriving from depth, letterbox bars lifting.
2. **The card**: it floats gently and tilts with the pointer. "Tap the card to open."
3. **Five pages**, swiped up/down or navigated with arrows, dots or the keyboard:
   - **Invitation**: names and message;
   - **Date**: day and date in Arabic and English, a live countdown, *Add to calendar*;
   - **Program**: the timeline of the evening;
   - **Venue**: an illustrated map card and *Directions* (Google Maps);
   - **RSVP**: name, accept/decline, number of guests.
4. **Finale**: the card drops into an envelope, the flap closes, a wax seal stamps with the couple's monogram, the envelope flies away.
5. **Thank-you**: a personal line ("بانتظاركم" or "سنفتقدكم") with the guest's name and party size, and *Watch again*.

Controls on every screen: **replay** and **sound on/off**. Sound only starts after the guest's first tap.

## 4. Design library

### Cards (10)

| Card | Arabic | Character | Suits these settings |
|---|---|---|---|
| Ivory Lace | دانتيل عاجي | embossed ivory roses, arched frame | Marble, Silk, Palace |
| **Wine & Gold** (default) | نبيذي وذهبي | burgundy, gold crest and roses | Candlelit, Palace, Starry |
| Emerald Deco | زمرّد آرت ديكو | deep green, gold Art Deco | Garden, Palace, Candlelit |
| Sage Botanical | أغصان المريمية | eucalyptus, script names | Garden, Marble, Petals |
| Blush Watercolor | ألوان مائية وردية | soft watercolour peonies | Petals, Silk, Marble |
| Midnight Stars | نجوم منتصف الليل | navy, moon, twinkling stars | Starry, Sea, Desert |
| Arabesque | أرابيسك | star pattern, lantern in an arch | Palace, Desert, Candlelit |
| Modern Minimal | بسيط عصري | large initials, editorial type | Marble, Silk, Sea |
| Terracotta Sun | شمس التراكوتا | sunset arch, dunes | Desert, Palace, Garden |
| Pastel Clay | صلصال باستيل | puffy clay hearts and flowers | Clay, Petals, Silk |

### Settings (10)

| Setting | Arabic | 3D | 2D |
|---|---|---|---|
| **Candlelit Hall** (default) | قاعة الشموع | ✔ real 3D room | ✔ |
| Marble Morning | صباح رخامي | — | ✔ (with soft morning birdsong) |
| Garden Night | ليلة في الحديقة | — | ✔ |
| Desert Sunset | غروب الصحراء | — | ✔ |
| Starry Night | ليلة النجوم | — | ✔ |
| Silk Drapes | ستائر الحرير | — | ✔ |
| Floating Petals | بتلات طائرة | — | ✔ |
| Clay Stage | مسرح الصلصال | — | ✔ |
| Moonlit Sea | بحر مقمر | — | ✔ |
| Palace Arches | أقواس القصر | — | ✔ |

That's 100 card × setting combinations in 2D, and 10 in 3D (any card in the Candlelit Hall).

### The 3D Candlelit Hall

The hall is built from production assets:

- **Props (3D models):** a hanging lantern chandelier, brass goblets, a brass vase with a flower, and a glass lantern;
- **Surfaces:** a wine linen tablecloth, plaster walls with arches and columns, a marble floor;
- **Lighting:** candlelight, a chandelier and wall sconces, with real shadows; the guest's card casts its own shadow on the table.

It adapts to every screen: phones see the classic portrait composition, and wider screens reveal more of the hall around the card.

## 5. What a customer can personalise today

- Couple's names in Arabic and English. Monograms and initials are created automatically.
- Date, time and time zone (13 Arab and international cities). Dates are written correctly in Arabic and English, and the countdown and calendar link follow automatically.
- Venue and city (Arabic and English), with an optional custom map link.
- Invitation message (Arabic and English).
- Evening program, up to 6 items.
- Maximum guests per reply.
- Card, setting, 3D/2D, animated/static.

## 6. Sharing

The wizard's **Share** step produces a guest link that contains the whole design. The invitation works without an account or a server. Guests who open it see only the invitation, with no editing tools.

## 7. Under the hood (short version)

- **One engine, LEGO pieces:** cards, settings, opening, motion, finale, sound and pages are separate, interchangeable modules. Adding a card or setting doesn't touch the rest.
- **Faithful to the original Studio:** the original canvas design is the source of truth. Cards and settings are generated from it, and timings match it to within milliseconds.
- **Two kinds of rendering:** crisp page elements for the card, text and forms (perfect Arabic typography and accessibility), with real 3D (Three.js) behind them in the 3D experience.
- **Built for phones:** three quality levels picked automatically per device. 3D loads only when needed, and resolution drops automatically if a device struggles.
- **Accessibility:** keyboard navigation, screen-reader labels, visible focus, and the device's "reduce motion" setting respected (it shows the static version).

Technical detail is in `docs/ARCHITECTURE.md`; the original-to-production mapping is in `docs/AUDIT.md`.

## 8. Assets and licences

All production assets are stored with the project. Nothing is hot-linked from Canva or stock sites.

| Source | Used for | Licence |
|---|---|---|
| Poly Haven | 3D models, wall/cloth/floor textures, lighting environment | CC0 (free, no attribution) |
| Mixkit | sound effects (paper, page turn, whoosh, chimes, clicks, birdsong) | Mixkit free licence |
| Pexels / Pixabay | photos and video plates (installed, not yet used) | Pexels / Pixabay licences |
| Original Studio designs | all 10 cards and 10 settings | your own designs |

Full per-file provenance is in `docs/ASSET_PROVENANCE.md`.

## 9. Quality checks

An automated test suite exercises the real product in a browser:

- the full guest journey, every navigation method, RSVP rules, the envelope sequence and replay;
- sound, all 100 combinations, reduced motion, the no-3D fallback and the guest link;
- the whole wizard (every step, validation, live preview, share link, full screen, phone preview sheet).

**Latest result:** 67 of 67 checks pass. Screen sizes from small phones to ultra-wide monitors were also verified.

**Not yet measured:** frame rates on real phones. The test machine renders 3D in software, so real-device testing is the next step.

## 10. Current limitations

- **3D:** only the Candlelit Hall is 3D so far.
- **Replies are not stored centrally yet:** each guest's reply is saved in their own browser. A backend connection is prepared (REST or Supabase) but not wired up.
- **Shareable link:** the link carries the design inside it, which makes it long. A production platform would store designs and use short links (e.g. `/i/sara-ahmed`).
- **Fonts:** they load from Google Fonts. Without internet, the device's own Arabic fonts are used.
- **The original Canva card (DAHWaLT4OLI)** isn't among the assets, so the cards are the original Studio designs.
- **The 3D room's reflections** use a tinted daylight environment (no night-time environment was in the asset packs).

## 11. Suggested next steps

1. Test the 3D room on real mid-range phones and tune the quality levels.
2. Connect RSVP to a real backend, and give couples a guest-list dashboard.
3. Add short links and saved designs (accounts), instead of the long self-contained link.
4. Build a second 3D setting (Palace Arches or Marble Morning), using the same approach and assets already installed.
5. More personalisation: photo gallery page, dress code, custom colour accents per card.
6. Bundle the fonts locally once their licences are confirmed.

## 12. Running it

```bash
npm install
npm run assets:p0:install -- <the three P0 pack zips>   # once
npm start            # → http://localhost:5173  (wizard)  ·  /?view=invite (the default invitation)
npm test             # the full automated check
```
