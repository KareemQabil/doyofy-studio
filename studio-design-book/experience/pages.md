# Stage `pages` — the invitation sheet (Invitation · Date · Program · Venue · RSVP)

**State:** `pages` (`close → card`, `submit → pack`). **Pages:** `src/pages/index.js` (`PAGE_ORDER = ['invitation','date','program','venue','rsvp']`). **Controller:** `Studio._renderPage`, `go`, `_tickCountdown`, `_syncRsvp`, `submit` (`src/studio/Studio.js:363-428`). **Sheet markup:** `markup.js:64-74`. **CSS:** `canon-motion.css:117-135`, `studio.css:225-244`.

## Shared frame

- **Sheet:** 354 × 728 at stage (18, 58), radius 18, `background: var(--paper)`, `color: var(--ink)`. An inner frame at inset 10, 1 px accent, 55 % opacity.
- **Top:** the monogram line `monoA · monoB` in `--far`, colour `--atext`.
- **Close:** top-left, 44 px round, "Back to the card".
- **Page area:** inset 26 left and right, 64 top, 92 bottom. Centred column; `aria-live="polite"`.
- **Nav** (bottom 22, LTR): previous chevron, 5 dot buttons (18 × 44 hit area; active dot 20 px wide), next chevron.
- **Entrance:** each element rises with `fx-rise` (16 px, blur 6 → 0, 1 s) staggered by `fx-d1…d6` (0.12–1.1 s).
- **Page change:** `leaving` (opacity 0, −16 px, blur 5, 340 ms), then a fresh render.

### Controls (all pages)

- Swipe vertically more than 50 stage px (dominant axis), ignored on inputs.
- Wheel with |deltaY| ≥ 24 and a 900 ms debounce.
- Arrow Up/Down and Page Up/Down; dots; chevrons.
- Escape closes. Inside the wizard, keys only act when the preview has focus (`Studio.js:484-514`).

### Sound

- The bell-arpeggio music starts on entering `pages`: four chords, 340 ms steps, gain 0.04 × 0.22 (`AudioEngine.startMusic`). It stops on `close` or `pack`.
- Page change emits `page` (page-turn MP3 at 0.5).

### Reduced motion

`fx-rise` becomes a 0.5 s fade (`studio.css:259`). Page leave is opacity only (0.2 s). The sheet fades without scale.

---

## 1. Invitation (`invitation`, `pages/index.js:174-185`)

- **Purpose:** names and personal message.
- **Hierarchy:**
  - kicker «بكل الحب / WITH LOVE» (16 px Amiri + 10.5 px tracked, `aText`);
  - `arA` at 70 px in `fAr`, «و» at 30 px in accent, `arB` at 70 px;
  - `enA & enB` in 25 px italic muted;
  - a 130 px accent rule;
  - the Arabic message (16 px Amiri, line-height 1.85, max 270);
  - the English message (15.5 px italic, max 260).
- **Gaps:**
  - The kicker, «و», `arB` and «&» are **unconditional**. A single person gets an orphan «و» and «Layan &» (captured `previews/single-grad-page-invitation.png`; README §6 A1).
  - At 70 px there is no fitting, so long names wrap to many lines (untested).

## 2. Date (`date`, :189-210)

- **Hierarchy:**
  - kicker «احفظوا الموعد / SAVE THE DATE»;
  - a row of day name (AR/EN) | `dayNum` at 96 px weight 300 | month (AR) and month-year (EN), split by 60 px accent rules;
  - time (AR 16 px, EN 14 px italic);
  - a rule;
  - «باقٍ على الفرح / COUNTING DOWN»;
  - a 4-cell countdown grid (280 px; days, hours, minutes, seconds; the seconds cell in `aText`), updated every second while this page is open (`Studio.js:376-384`);
  - the CTA «أضف إلى التقويم / Add to calendar», a Google Calendar template link built in `derive.js:54-56`.
- **Accessibility:** `role="timer"` with `aria-label="Time until the wedding"`.
- **Gaps:**
  - The «الفرح» wording and the "wedding" label are used for every occasion (captured `previews/single-grad-page-date.png`; README §6 A3).
  - Only Google Calendar is offered (no .ics file).

## 3. Program (`program`, :212-224)

- **Hierarchy:**
  - kicker «برنامج الأمسية / THE EVENING»;
  - an ordered list where each row has the time (11.5 px tracked, `aText`), the Arabic item (25 px `fAr`), the English item (15 px italic) and a diamond connector (hidden after the last row);
  - row stagger 0.25 + 0.22 s × index.
- **Limit:** up to 6 items. With 6 items the list approaches the 572 px page area: 6 × ≈ 100 px is taller than the area, so the page may clip. Untested.
- **Gaps:** "The evening" is misleading for daytime events (README §6 A7). There is no scroll if it overflows.

## 4. Venue (`venue`, :226-248)

- **Hierarchy:**
  - kicker «مكان الحفل / THE VENUE»;
  - an illustrated arch-shaped "map" (250 × 240): abstract roads in ink, a river in accent, a pin in `env` with a pulsing halo (`fx-pulse`), `role="img"` with an English aria-label;
  - `venueAr` at 26 px in `fAr`;
  - `venueEn · cityEn` in 17 px italic;
  - the CTA «الاتجاهات / Directions» → `mapHref` (the custom map URL, or a Google Maps search).
- **Gaps:**
  - The map is decorative and not the real location; that is stated in its aria-label.
  - The `st-mapclip` id is re-declared on every venue render. There is one sheet, so this is harmless.

## 5. RSVP (`rsvp`, :250-284)

- **Hierarchy:**
  - title «تأكيد الحضور» (38 px `fAr`) and KINDLY REPLY;
  - name field (label AR/EN, placeholder «اكتب اسمك · Type your name»; `readonly` and dotted when the guest link locks the name);
  - attendance pills «سأحضر بكل سرور / Joyfully accepts» and «أعتذر عن الحضور / Regretfully declines» (`aria-pressed`; selected = ink fill, paper text);
  - guest stepper (−/+, `output aria-live`, bounded by `rsvp.minGuests` and `maxGuests`; the guest link's `maxGuests` caps it, `Studio.js:79`);
  - submit «اختم وأرسل / Seal & send»;
  - the error line «نرجو كتابة الاسم واختيار الرد · Add your name and a reply» (`aria-live="assertive"`, its space reserved so the layout does not jump).
- **Behaviour:**
  - Validation needs a name and a choice. On failure the field gets `aria-invalid` and a 2 px underline.
  - On success, `sent = true` (once per run), the state goes to `pack`, and the adapter's `submit` runs: `LocalRSVPAdapter` writes `localStorage` by default (`src/engine/rsvp.js`). Declining sends `guests: 0`.
  - Sound: `choose` on a pill, `click` on the stepper.
- **Fast access:** `?start=rsvp` opens straight on page 5 (`Studio.js:143`).
- **Gaps:**
  - The guest count is shown even after a decline (not disabled).
  - The submit button has no busy state, and the adapter result is not surfaced: errors are stored in `r.receipt` and never shown.
  - Aria labels on the steppers and nav are English only.
