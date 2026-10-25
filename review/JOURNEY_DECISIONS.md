# Journey decisions — «توقيع»

**Target journey:**

1. occasion
2. details
3. prepared invitation
4. publish
5. guests
6. replies
7. reception
8. summary

Every step below is the shipped behaviour, verified in `tests/signature-journey.mjs` (graduation from scratch and the seeded couple, at 390/768/1440). Numbers in brackets are entries in `docs/UX_DECISIONS.md`.

## The journey, step by step

| # | Step | What the organizer sees | Decisions it removes |
|---|---|---|---|
| 1 | **Occasion** `/app/events/new` | «ما المناسبة؟» Tactile deck of 13 posters. Each poster is a colour tile, a Phosphor glyph and a real invitation of that type. The first card is pre-selected, so «ابدأ تجهيز زفاف» is active immediately. «قائمة وبحث» switches to a searchable grid | No empty "choose something" state; the occasion name sits on the action button |
| 2 | **Details** `?type=graduation` | Only the essentials: name(s), date, time, venue, city. A **live card** beside the form (stacked on phone) uses the occasion's starter design and fills in as you type; missing fields show labelled placeholders. Couple events ask for two names, single events for one, with the right labels («اسم الخريج/ة», «العروسان» vs «صاحب المناسبة») | No design choice before the invitation exists; no wedding wording on single events |
| 3 | **Prepared invitation** `…/invitation/design?first=1` | «جهّز دعوتي» creates the event **and** a draft invitation with the occasion starter (graduation → `sig-diploma-marble`), the occasion's greeting, program and message. The editor opens on «المحتوى» with the live preview | The template gallery is optional (it used to be the forced next step, D-030) |
| 4 | **Publish** | A single primary button. The stamp «نُشرت دعوتك» confirms, and the banner «دعوتك جاهزة للضيوف · أضف الضيوف» gives the next action. After publishing the button becomes «إلى الضيوف» | The publish state is visible in the top bar («منشورة / تم الحفظ») |
| 5 | **Guests** | Add one party (name, phone optional, allowance), import a file, or share the general link. Side labels are neutral («الأهل، الأصدقاء، زملاء العمل»), never «أهل العروس» | No wedding-only grouping copy |
| 6 | **Replies** | «الردود والمتابعة»: will attend / declined / pending, the response rate, the parties to remind (simulated), unmatched general replies to match | Reply follow-up lives next to guests, not as a separate destination |
| 7 | **Reception** | Prep page with the three-step staff guide and the staff link, then a dark gate: scan tile, search, party check-in with allowance, partial entry, undo | The staff screen has no navigation chrome, only the task |
| 8 | **Summary** | Facts (seats, confirmed, arrived) on white, then a red closure with the real arrival count and a thank-you message to send | The summary is an ending, not another dashboard |

## Workspace navigation

- **Rail.** On desktop the event rail shows the **four essential stages** with seal numerals:
  1. نظرة عامة
  2. الدعوة
  3. الضيوف والردود
  4. الاستقبال
- **Optional details.** Seating and event settings sit under «تفاصيل إضافية». Seating is marked «اختياري». The section stays open while one of its pages is active.
- **Phone.** The same stages plus «المزيد» appear as a bottom tab bar (safe-area aware).
- **Reading order.** It follows the Arabic source order. Nothing is re-ordered for visual balance.

## Guest side

- **Envelope first, two exits.** The link opens on the envelope (B «مساء»). There are two exits:
  - lift the seal or press «افتح الدعوة», for the full invitation;
  - «الموعد وتأكيد الحضور مباشرة», straight to date, place, QR and RSVP.

  Nobody is forced through the animation [D-038].
- **Personal links.** They greet the party by name («دعوة خاصة إلى عائلة الحربي»). Single-person events never show «و» or «&» on the cover or the invitation.
- **RSVP confirmation.** The stamp confirms; the hub then shows the QR entry code, the date and place, and calendar/maps actions.

## Single-person events (graduation, birthday, newborn, conference, opening, corporate, other)

| Was | Now | Where |
|---|---|---|
| Invitation page joined names with «و» / «&» even for one person | Single-name layout, event label as heading | `src/pages/index.js` |
| Countdown used the couple phrasing | `countingDownSingle` «باقٍ على الموعد» | `src/pages/index.js`, `src/data/strings.js` |
| Program title «The Evening» / dinner wording | «برنامج المناسبة» / THE PROGRAM | `src/data/strings.js` |
| Card footer `… · DINNER · RSVP` | `${label} · CELEBRATION · RSVP` | `src/data/derive.js` |
| Studio credit, monogram, mini card, done line assumed two names | Handle one name | `src/studio/Studio.js` |
| Latin line repeated the Arabic name when no English name was typed | Skipped | `src/cards/occasion-cards.js names()` |
| Guest-form hint «أهل العروس، أصدقاء العريس» | «الأهل، الأصدقاء، زملاء العمل» | `src/features/guests/PartyForm.tsx` |
| Import sample sides «أهل العريس / زميلات العروس» | «الأهل / الأقارب / الأصدقاء» | `src/domain/import.ts` |

Verified by the browser journey. It checks that the graduation details page, the invitation summary, the guest form, the guest cover and the summary contain no «العروس / العريس / العروسين» and no couple joiner.

## Graduation and other occasions

- **Graduation.** The starter is the new `sig-diploma`: charcoal band, Phosphor graduation cap, a gold disc carrying the **event's real year** (`c.year`, never baked in), Kufi type. Three presets: marble, palace, silk.
- **Couple ceremonies.** Wedding, engagement, katb kitab and henna get `sig-ribbon` «حروف الفرح», with Arabic initials in an ivory disc.
- **Playful occasions.** Birthday, family, opening and other get `sig-ticket` «تذكرة الفرح», with a date stub.
- **Still on other families.** Newborn, iftar, conference and corporate keep their existing families (`newborn-moon`, canon faces, `forum-grid`). Two signature faces are briefed (`sig-crescent`, `sig-agenda`; see `assets/ASSET_BRIEFS.md`).
- **Occasion identity.** All 13 occasions keep a distinct glyph and tile colour across the home band, deck posters, the list chooser, the workspace event art and the overview moment.

## Honest prototype limits shown in the UI

- **Data.** Browser storage; no accounts.
- **Messaging.** Sending is simulated: «تذكيرهم (محاكاة)», and delivery is never marked on opening WhatsApp [D-031].
- **Reception before the event day.** The gate warns «المناسبة بعد 9 أيام. أي تسجيل الآن يُحتسب، ويمكن التراجع عنه.»
- **Summary before the event.** It says «المناسبة لم تنتهِ بعد. هذه أرقام اللحظة…».
- **Backend.** Prepared, not connected (`review/PRODUCTION_GAP_MATRIX.md`, `backend/`).
