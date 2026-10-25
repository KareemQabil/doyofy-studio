# Routes and flows

Locally (`npm start`) these are real paths; the dev server falls back to `index.html`. On static hosting (the published artifact) the same paths live after `#`, e.g. `…/artifact#/app/events`.

| Route | Screen | Layout | Spec |
|---|---|---|---|
| `/app` → `/app/events` | Events home: empty state with one CTA, or upcoming + past events | AppShell | §8, screens 1–2 |
| `/app/events/new[?type=]` | Create event: 1 occasion (Coverflow or Editorial Rail, prototype A/B) → 2 essentials beside a live event card → create → template gallery | Focus | §8, screens 3–5 · UI/UX brief §7–8 |
| `/app/events/:id` → `…/overview` | Overview: next action, key counts, needs attention, checklist, activity | Workspace | §9, screens 6–8 |
| `/app/events/:id/invitation` | Invitation: design, state, links, publish / share | Workspace | §10, screen 9 |
| `/app/events/:id/invitation/templates[?first=1]` | Template gallery: curated presets rendered with the event's names, style chips, preview dialog, «استخدم هذا القالب». `first=1` after creating an event (with «سأختار لاحقًا») | Focus (full) | UI/UX brief §9–10 |
| `/app/events/:id/invitation/design[?section=content\|design\|motion\|event]` | Invitation editor: live preview + 4 sections, autosave, publish, preview as guest, change template. Phone: poster + bottom sheet / live preview | Editor | screens 10–15 · UI/UX brief §11 |
| `/app/events/:id/invitation/preview` | Full-screen guest preview of the draft (replies not recorded) | Full | screen 16 |
| `/app/events/:id/guests[?filter=&party=&q=]` | Guest list, filters, bulk share, details drawer (`?party=`) | Workspace | §11, screens 17–18 |
| `/app/events/:id/guests/import` | Import: source → columns → review/resolve → result | Focus | §11, screens 19–22 |
| `/app/events/:id/rsvp[?tab=pending\|recent\|unmatched]` | Replies: who to nudge, recent replies, general-link matching | Workspace | §14–15, screen 23 |
| `/app/events/:id/seating` | Tables, unassigned pool, assign/move/unassign, warnings | Workspace | §16, screens 26–28 |
| `/app/events/:id/check-in` | Organizer: prepare the gate; live arrivals, partial parties, exceptions | Workspace | §17 |
| `/app/events/:id/settings[?focus=map]` | Basics, date/time, venue/map, reply rules, table visibility, publish state, archive | Workspace | §19, screen 33 |
| `/app/events/:id/summary` | Invited vs confirmed vs attended, thank-you (simulated), archive | Workspace | §20, screen 34 |
| `/app/events/:id/more` | Phone-only list of the sections not in the tab bar | Workspace | — |
| `/i/:slug/:code` | Guest: cinematic invitation + RSVP, then the event hub (status, QR, edit reply, directions, program, table) | Guest | §14, §18, screens 24–25 |
| `/i/:slug` | General link (when enabled): invitation + RSVP with a name | Guest | D-013 |
| `/check-in/:id` | Gate mode: scan (simulated) or search → party → full/partial check-in → undo | Gate | §17, screens 29–32 |
| `/prototype/design-review[?theme=&chooser=]` | Owner review entry: theme A/B, chooser A/B, shortcuts (prototype only; linked only from the prototype tools) | — | UI/UX brief §25 |
| `/?view=invite[&i=…]`, `/?view=wizard` | Legacy standalone Invitation Studio (kept for its QA and old links) | — | §2 |

## Journey A — first-time organizer (spec §8, UI/UX brief §8)

1. Events home → **إنشاء مناسبة** → choose the occasion → **متابعة**.
2. Essentials only (names, date, time, venue); the event card takes shape beside the form → **أنشئ المناسبة**.
3. The **template gallery** opens with «أُنشئت …». Preview any template (the real invitation plays with the couple's names) → **استخدم هذا القالب**. Or **سأختار لاحقًا** → overview.
4. **Editor**:
   - المحتوى: names on the card, message, program;
   - التصميم: template, card, setting;
   - الحركة والصوت: 2D/3D, animated/static, preview sound;
   - تفاصيل المناسبة: date, time, venue, map, party size, saved to the event.

   Autosaved; **انشر الدعوة** publishes.
5. **معاينة كضيف** at any time; closing returns to the same section. **تغيير القالب** returns to the gallery without losing texts.
6. Overview: the invitation is checked off and the next action becomes **أضف الضيوف**.

## Journey B — guest management (spec §11)

1. Guests (empty) → add one guest (name, phone, allowed size), or **استيراد من ملف**.
2. Import:
   1. upload `.xlsx`/`.csv`, paste from Excel, or use the sample file;
   2. columns are auto-matched and can be corrected;
   3. review: rows that need a decision come first (missing name, malformed phone, duplicate in file or list); fix inline, skip, import without phone, or import anyway;
   4. **أضف N ضيفًا** → result → **شارك الدعوات الجديدة**.
3. Share:
   - from the drawer, per guest: WhatsApp link, simulated send, mark contacted manually, copy the personal link;
   - from the list: bulk select → simulated send, manual, or reminder.

## Journey C — guest RSVP (spec §14, §18)

1. The guest opens `/i/<slug>/<code>`. The platform records **opened**.
2. The cinematic invitation plays. On the RSVP page the name is fixed from the link and the count is bounded by the party's allowance.
3. Seal & send: the envelope finale, then **تفاصيل حضوركم** opens the hub.
4. The hub shows the confirmed or declined state, count, QR + code, table (if revealed), date/countdown, directions, calendar and program. **Edit reply** is available until the event starts.
5. The organizer's overview, guest list and replies update immediately (in the same browser, even in another tab).

## Journey D — seating (spec §16)

1. No tables: quick setup (count × seats, suggested from the confirmed headcount).
2. Unassigned confirmed parties on one side and tables on the other: **اختر طاولة**, or drag and drop.
3. A party that doesn't fit asks for confirmation. Over-capacity and "declined but seated" are shown as banners, with the fix one tap away.

## Journey E — event-day check-in (spec §17)

1. The organizer: الدخول → **افتح وضع الدخول**, or shares the gate link with staff.
2. Gate: **مسح رمز QR** (simulated) or search by name, phone or code.
3. The party card shows confirmed, arrived and table, plus any exceptions. Staff choose how many are entering now:
   - full check-in, **or**
   - partial check-in ("سيبقى N يصلون لاحقًا").
4. Confirmation screen with the table → **الضيف التالي** or **تراجع**.
5. Exceptions need "I confirmed with the organizer" and a note; they appear on the organizer's check-in page and in the overview.

## Post-event (spec §20)

After the event ends, the overview's next action is **اعرض ملخص المناسبة**: attendance bars, a thank-you message (simulated), and archive.

## Current simplified creation (10 October 2026)

`/app/events/new?type=<occasion>` → essential form → `/app/events/:id/invitation/design?first=1` with occasion-specific default content → publish → guests. The templates route is optional via Change template. Tables and map links are optional; the overview stages are invitation, guests/replies, reception (summary after completion). See `BAHJA_EXPERIENCE.md`.
