# Doyofy — UX Prototype Master Spec

**Purpose:** Continue the current Invitation Studio into a complete MVP UX prototype that is easy to test, easy to understand, and deliberately easy to reskin/redesign later without rewriting the product logic.

**Audience:** Coding agent / product engineer working directly in the existing repository.

**Prototype target:** A complete, clickable, stateful, Arabic-first product prototype covering the core Doyofy customer and guest journeys. It is not the final production backend. The prototype must be architected so a later NestJS backend and a new UI direction can be connected without rebuilding the product flows.

---

## 0. Non-negotiable outcome

Do not build a collection of disconnected screens.

Build one coherent product where a user can:

1. Create an event.
2. Design its invitation using the existing Invitation Studio.
3. Build/import a guest list.
4. Manage invitations and RSVP states.
5. Organize confirmed guests into tables.
6. Run event-day check-in by QR or search.
7. See a clear event overview throughout the process.
8. Complete the guest journey from invite → RSVP → event information → check-in.
9. Test the entire journey with realistic seeded data.
10. Change the visual UI later without changing feature/domain logic.

The prototype should feel like one product, not a dashboard glued to the current Invitation Studio.

---

## 1. Product definition

Doyofy is an Arabic-first event and guest-management product.

The core product idea for the MVP is not "make an invitation". The invitation is one stage in a larger journey:

**Create event → invitation → guests → send/share → RSVP → seating → check-in → event completion**

The most important unit in the MVP is the **guest/invitation party inside an event**.

The product should reduce the organizer's mental load:
- Who did I invite?
- Who received/opened the invitation?
- Who confirmed?
- How many people are actually coming?
- Who still needs attention?
- Where will they sit?
- Have they arrived?

The MVP must answer those questions with minimal effort.

---

## 2. Current implementation — preserve and integrate

The existing repository already contains a working **Invitation Studio** and guest invitation experience.

Treat it as the current source of truth for the invitation module, not as the entire platform.

### Current customer invitation wizard
Five current steps:
1. Experience: 3D / 2D and animated / static.
2. Card: 10 card designs.
3. Setting: visual setting/environment.
4. Details: names, date/time/time zone, venue/city/map, invitation copy, event program, maximum guests.
5. Share: summary, edit links, guest link, full-screen preview, new design.

The wizard is:
- Arabic-first and RTL.
- Responsive.
- Live-preview driven.
- Currently persists its draft in the browser.

### Current guest invitation experience
The guest can:
- Open the cinematic invitation.
- Browse the invitation pages.
- See date/countdown/calendar.
- See event program.
- See venue/directions.
- RSVP with name, accept/decline and party size.
- Reach a thank-you/finale experience.

Current limitations that the platform prototype must conceptually solve:
- RSVP is not centrally stored.
- Designs are encoded in long share links instead of platform records/short links.
- There is no complete customer platform around the Invitation Studio yet.
- There is no real guest-management dashboard, seating workflow, or event-day operating flow around it.

### Preservation rule
Do not casually rewrite or visually redesign the Invitation Studio while building the platform.

First:
- isolate it as a product feature,
- integrate it into the larger event flow,
- preserve its working behavior/tests,
- then make only UX changes that are necessary to connect it to the platform.

---

## 3. Prototype vs production

This phase is a **UX/product prototype with realistic product behavior**.

### Target production direction
- Frontend: Next.js + TypeScript.
- Backend target later: NestJS.
- Infrastructure candidate later: GCP.

### For this prototype
Prioritize user flows over backend/infrastructure work.

Build the frontend against typed service/repository interfaces and realistic mock data so that a NestJS API can replace the mock layer later.

Example principle:

```ts
interface EventRepository {
  getEvent(id: string): Promise<Event>
  createEvent(input: CreateEventInput): Promise<Event>
  updateEvent(id: string, input: UpdateEventInput): Promise<Event>
}
```

Feature code must depend on the interface, not on localStorage directly.

A local/mock implementation can persist prototype state using browser storage/IndexedDB or a lightweight mock data store.

Do **not** spend MVP-prototype time on:
- production GCP infrastructure,
- production-grade authentication,
- payment gateways,
- real WhatsApp BSP integration,
- complex multi-tenant backend,
unless explicitly requested later.

---

## 4. Architecture requirement: make UI replaceable

This is critical.

The product logic, domain state, navigation, validation and data access must not be coupled to the current visual design.

Use four clear layers:

```text
domain/
  product entities, states, rules, validation

services/
  repositories, mock API adapters, side-effect interfaces

features/
  event-create
  invitation
  guests
  rsvp
  seating
  check-in
  event-overview

ui/
  primitives
  components
  theme
  tokens
  layouts
```

### Rules
- No business rules buried inside visual components.
- No raw hard-coded brand colors throughout feature pages.
- No route-specific duplicated UI primitives.
- No direct localStorage calls from screens.
- No one giant global store.
- No styling assumptions inside domain logic.
- No invitation-specific visual language forced onto operational screens.

### Theme / design-token layer
All visual styling must flow through reusable tokens:
- color roles,
- background/surface roles,
- border,
- typography,
- radius,
- spacing,
- shadows,
- motion,
- container widths.

Changing the prototype from one visual direction to another should mostly require editing tokens, primitives and layouts — not product feature logic.

Use accessible headless primitives where helpful.

---

## 5. UX principles

### Arabic-first
- `dir="rtl"` is the default.
- Arabic is the primary language.
- English can appear as secondary text only where useful.
- Do not design LTR and flip it at the end.
- Icons, arrows, drawers, pagination, steppers and directional motion must make sense in RTL.

### Mobile first
Many organizers will use Doyofy from phones.

Every main task must be comfortably usable on a phone:
- create event,
- edit invitation,
- add guest,
- review RSVP,
- search a guest,
- perform check-in.

Desktop can expose richer layouts, but mobile cannot be a reduced afterthought.

### Progressive disclosure
Do not ask for everything at once.
Show the minimum needed for the current decision, and expose advanced options only when relevant.

### One clear next action
Each important page should answer:
- Where am I?
- What is the current state?
- What should I do next?

Avoid screens with five competing primary CTAs.

### Operational, not "admin dashboard"
Do not make the event page a wall of charts.
Prioritize tasks, exceptions, people needing attention, clear counts and next actions.

### Fast first-value
The first-time organizer should be able to create a basic event in approximately 3 minutes before being asked to configure optional details.

### Guest friction must be near zero
Guests should not create an account to view invitation, RSVP, view event details, access directions or present QR.

---

## 6. MVP actors

Build for these actors only:

1. **Organizer / event owner** — creates and manages the event.
2. **Event coordinator** — can help manage guests/seating/check-in; prototype permissions may stay simple.
3. **Guest** — receives invitation and responds without an account.
4. **Gate / check-in staff** — uses a focused event-day interface.

Do not build a complex enterprise permission builder in this phase.

---

## 7. Information architecture / routes

The exact URL structure can change, but the product should have the equivalent of:

```text
/app
/app/events
/app/events/new
/app/events/[eventId]
/app/events/[eventId]/overview
/app/events/[eventId]/invitation
/app/events/[eventId]/guests
/app/events/[eventId]/guests/import
/app/events/[eventId]/rsvp
/app/events/[eventId]/seating
/app/events/[eventId]/check-in
/app/events/[eventId]/settings
/i/[inviteSlug]
/check-in/[eventId]
```

The existing invitation preview must be integrated behind the event's Invitation section rather than feeling like a separate unrelated product.

---

## 8. Primary journey A — first-time organizer

This is the most important UX journey.

### Entry
If there is no event:
- calm empty state,
- one primary CTA: **إنشاء مناسبة**.

Prototype authentication may be mocked.

### Create-event flow
Keep it short.

#### Step 1 — event type
Examples:
- زفاف
- خطوبة
- عقد قران
- حنة
- عيد ميلاد
- تخرج
- تجمع عائلي
- مناسبة أخرى

Do not ask for advanced event rules here.

#### Step 2 — essentials
Minimum:
- event name / couple names,
- date,
- time,
- venue,
- city.

Optional information must not block creation.

#### Step 3 — create
Create the event and enter its workspace.

Do not force the organizer to finish invitation design, guest import, seating and settings in onboarding.

### After creation
Land on Event Overview.

Show a simple setup checklist:
1. أكمل تفاصيل المناسبة
2. جهز الدعوة
3. أضف الضيوف
4. شارك الدعوات
5. تابع الردود
6. جهز الجلوس
7. جهز الدخول

Checklist items deep-link to the exact task.

---

## 9. Event Overview UX

This is the organizer's operational home.

Avoid generic analytics-dashboard patterns.

### Top section
- event title,
- date / countdown,
- status,
- one primary CTA appropriate to current stage.

### Key counts
Only useful counts:
- total invited,
- confirmed people,
- declined,
- waiting/no response,
- checked in when event day starts.

### Needs attention
This is more important than charts.

Examples:
- 18 guests have not replied.
- 4 imported rows have missing phone numbers.
- 3 invitation parties exceed allowed size.
- 12 confirmed guests are not assigned to tables.
- 2 guests were checked in manually.

Use realistic seeded examples.

### Recent activity
Human-readable activity:
- "أحمد أكد الحضور — شخصان"
- "تم نقل منى إلى طاولة 7"
- "تمت إضافة 24 ضيفًا من ملف"

### Contextual next step
- Before invitation: "جهز الدعوة"
- After design: "أضف الضيوف"
- After guest list: "ابدأ المشاركة"
- Near event date: "راجع الجلوس"
- Event day: "افتح وضع الدخول"

---

## 10. Invitation Studio integration

The existing studio stays a strong feature.

Inside an event, the organizer opens **الدعوة**.

### Invitation section should expose
- current selected design,
- edit design,
- preview as guest,
- invitation status (draft/published),
- guest link/short-link placeholder,
- share/copy actions.

### Existing wizard integration
Retain current capabilities, but adapt to platform context:
- event details prefill from Event,
- invitation-specific edits do not unexpectedly overwrite Event data,
- Save writes to prototype repository rather than only local wizard draft,
- Share/publish attaches an InvitationDesign to Event,
- use a short prototype slug such as `/i/sara-ahmed`.

### UX requirement
Organizer always knows:
- am I editing the event or the invitation?
- is this saved?
- is this published?
- what will guests see?

---

## 11. Primary journey B — guest management

Guest management is core MVP.

### Guest list page

#### Header counts
- total invitation parties,
- total expected max seats,
- confirmed headcount,
- no-response count.

#### Main list
Desktop can show:
- guest / party name,
- phone,
- max party size,
- invitation status,
- RSVP status,
- confirmed party size,
- table,
- check-in status.

Mobile uses compact stacked rows/cards with only essential data visible.

#### Filters
- all,
- no response,
- confirmed,
- declined,
- not shared,
- unassigned seating,
- checked in.

#### Add guest
Quick drawer/modal:
- name,
- phone,
- allowed party size,
- optional companion names,
- optional note.

Do not overload with every possible guest preference in V1.

### Import flow
Prototype a real import experience:
1. choose/upload spreadsheet or use seeded sample,
2. map columns if needed,
3. preview rows,
4. highlight missing/duplicate/invalid values,
5. resolve or skip,
6. confirm import,
7. show result summary.

Required prototype states:
- duplicate phone,
- missing name,
- malformed phone,
- row skipped,
- successful import.

Do not build a fake "upload succeeded" screen only.

---

## 12. Guest model for the prototype

Do not prematurely build a cross-event permanent global guest identity.

For MVP, use **InvitationParty** as the practical unit.

```ts
type InvitationParty = {
  id: string
  eventId: string
  primaryGuestName: string
  phone?: string
  maxPartySize: number
  companionNames?: string[]
  invitationStatus: 'draft' | 'ready' | 'shared' | 'opened' | 'failed'
  rsvpStatus: 'pending' | 'confirmed' | 'declined'
  confirmedPartySize?: number
  tableId?: string
  checkInStatus: 'not_arrived' | 'partial' | 'checked_in'
  checkedInCount: number
  notes?: string
}
```

This supports one person, couple/family invitation, +1 and partial attendance without forcing a complicated household CRM model into the prototype.

---

## 13. Invitation communication state

Real WhatsApp automation is not required for the UX prototype.

But UX must represent realistic communication states:
- غير مرسلة
- جاهزة للمشاركة
- تمت المشاركة
- تم الفتح
- تعذر الإرسال (simulated)

Prototype actions:
- نسخ الرابط
- مشاركة
- إعادة المحاولة
- إرسال تذكير (simulated)
- تحديد كـ "تم التواصل يدويًا"

Clearly distinguish platform-known, manually-marked and simulated states.

---

## 14. Primary journey C — guest RSVP

Use the existing guest invitation experience.

The RSVP must connect to the prototype event model.

Guest does not log in.

### RSVP inputs
- party identity from the link where available,
- attending yes/no,
- number attending bounded by max party size,
- optional companion names,
- optional short note.

Do not ask too many questions.

### After RSVP
Show:
- confirmed/declined state,
- attendee count,
- ability to edit response before event,
- event details/directions,
- QR placeholder when confirmed,
- thank-you message.

### Organizer immediately sees
- RSVP state update,
- updated confirmed headcount,
- guest leaves "needs response".

---

## 15. RSVP states and UX

Use simple RSVP states:

```text
Pending
Confirmed
Declined
```

Invitation delivery/open state is separate from RSVP.

Examples:
- Opened but no RSVP → needs attention.
- Confirmed for 3 of max 4 → confirmed headcount = 3.
- Declined → seating assignment cleared or flagged.
- RSVP edited → activity entry created.

---

## 16. Primary journey D — seating

MVP seating is intentionally simple.

Do NOT build a Canva/Figma-style floor-plan editor in this phase.

### Seating page
Tables show:
- table name/number,
- capacity,
- assigned count,
- remaining seats.

Unassigned area shows confirmed parties without table assignment.

Actions:
- create table,
- edit capacity,
- assign party,
- move party,
- unassign,
- search/filter.

Drag and drop may be used, but every action must also work without drag and drop.

Warnings:
- table over capacity,
- party does not fit,
- confirmed party still unassigned,
- declined party still assigned.

Goal: test whether organizer understands seating workflow, not build venue CAD.

---

## 17. Primary journey E — event-day check-in

This is a focused mode.

A gate employee should not need the organizer dashboard.

### Check-in screen
Large, fast, phone/tablet friendly.

Primary actions:
1. Scan QR (browser simulation is fine).
2. Search by name or phone.

Guest result shows only event-day information:
- party name,
- expected/confirmed count,
- already checked-in count,
- table,
- reception-relevant note if needed.

### Check-in action
Allow:
- full-party check-in,
- partial check-in,
- remaining members later.

Example:
Confirmed 4 → 2 arrive now → partial 2/4 → 2 later → 4/4 complete.

### Edge states
Prototype:
- QR already used,
- guest not found,
- guest declined but arrived,
- more people than confirmed,
- more people than allowed,
- no table assigned.

Do not silently fix exceptions. Show warning and require staff/organizer decision.

---

## 18. Guest event hub

After RSVP, the invitation link can progressively behave as a lightweight event hub.

Confirmed guest can access:
- invitation,
- date/time,
- countdown,
- venue/directions,
- program,
- RSVP state,
- QR,
- table when organizer chooses to reveal it.

No guest account.

Avoid gallery/gifts/vendor marketplace in this phase.

---

## 19. Event settings

Keep settings limited:
- event basics,
- date/time,
- venue/map,
- RSVP max/default behavior,
- whether table is visible to guest,
- invitation publish state,
- archive event.

Do not build enterprise settings.

---

## 20. Post-event MVP

Keep it tiny:
- final attendance count,
- invited vs confirmed vs attended summary,
- simple thank-you prototype action,
- archive event.

Advanced CRM, feedback and memories/gallery are future scope.

---

## 21. Screen inventory

Do not optimize for an exact screen count, but roughly cover:

### Platform
1. Empty/home state
2. Events list
3. Create-event type
4. Create-event essentials
5. Event created / overview

### Event workspace
6. Overview — initial setup
7. Overview — invitations sent
8. Overview — event day

### Invitation
9. Invitation summary
10–14. Existing 5-step studio
15. Published/share state
16. Guest full-screen preview

### Guests
17. Guest list
18. Add/edit guest
19. Import upload
20. Import mapping/preview
21. Import issue resolution
22. Import result

### RSVP
23. RSVP management/filter state
24. Guest invitation RSVP
25. RSVP confirmation/edit state

### Seating
26. Seating workspace
27. Create/edit table
28. Seating warning state

### Check-in
29. Check-in home/search
30. Guest result
31. Partial check-in
32. Exception state

### Settings/post-event
33. Event settings
34. Post-event summary

Also implement component states:
- loading,
- empty,
- error,
- success,
- warning,
- no results,
- disabled,
- unsaved changes.

---

## 22. UX prototype data

Ship realistic seed data.

### Event 1 — active wedding
- ~40 invitation parties,
- mixed pending/confirmed/declined,
- party sizes 1–5,
- some missing phone numbers,
- some duplicates,
- some opened/no-response,
- ~8 tables,
- several unassigned confirmed parties,
- a few partial check-ins.

### Event 2 — draft event
Used for early setup.

### Event 3 — completed event
Used for post-event state.

Do not fill UI with lorem ipsum. Use natural Arabic names and realistic data.

---

## 23. Usability testing must be built into the work

The prototype is not done when screens render.

Prepare it so an existing/target user can run these tasks without developer intervention:

### Test 1
"أنشئ مناسبة جديدة وحدد التاريخ والمكان."

### Test 2
"اختر دعوة مناسبة وعدّل الأسماء ثم اعرضها كما سيراها الضيف."

### Test 3
"أضف 20 ضيفًا من ملف، وتعامل مع مشكلة رقم مكرر."

### Test 4
"اعرف مين لسه ما ردش، وافتح بيانات ضيف منهم."

### Test 5
"وزّع ضيفًا مؤكدًا على طاولة."

### Test 6
"ضيف وصل ومعاه شخصان. سجّل دخولهم."

### Test 7
"الضيف حضر جزء من مجموعته والباقي هييجي بعدين."

Capture:
- task completion,
- time,
- wrong turns,
- hesitation,
- questions asked,
- screens where tester stops,
- qualitative feedback.

Do not coach testers unless truly blocked.

After each test round, fix journey problems before decorative polish.

---

## 24. Prototype success criteria

Prototype is successful when:
- first-time organizer creates an event without help,
- organizer understands event vs invitation vs guest list,
- Invitation Studio feels part of Doyofy,
- guest import errors are understandable/recoverable,
- RSVP state is obvious,
- confirmed headcount is not confused with number of invitations,
- seating does not require explanation,
- gate staff finds/checks in guest quickly,
- mobile flows are complete,
- RTL is correct,
- UI theme can be replaced without rewriting feature logic.

---

## 25. MVP boundary — explicitly NOT now

Do not build:
- Vendor marketplace.
- Gift registry.
- Cash gifts / نقوط.
- Real payment settlement.
- Native iOS/Android apps.
- AI assistant/autopilot.
- Complex B2B/white-label portal.
- Public API.
- Multi-country legal/compliance system.
- Persistent cross-event guest social graph.
- Advanced marketing CRM.
- Fully automated WhatsApp BSP workflow.
- Advanced visual venue/floor-plan editor.
- Real-time multi-user collaborative editing.
- Dozens of roles and granular enterprise permissions.
- Advanced analytics suite.

Leave extension points; do not build the feature.

---

## 26. UI direction for this phase

Do not force the current romantic atelier style onto operational screens.

The platform shell should be:
- calm,
- premium,
- Arabic-first,
- easy to scan,
- operational,
- not a generic admin template,
- not visually over-designed.

Visual direction is intentionally replaceable.
Prioritize spacing, hierarchy and interaction.
Use real Arabic copy.
Centralize tokens.

Invitation itself can remain cinematic and expressive.
Organizer workspace should remain calm and efficient.

---

## 27. Copy principles

Arabic copy should be short and human.

Prefer:
- "أضف الضيوف"
- "بانتظار الرد"
- "أكد الحضور"
- "لم يرد بعد"
- "غير موزع على طاولة"
- "تسجيل الدخول"

Avoid corporate jargon, technical terms visible to customer and unnecessary English.

---

## 28. Accessibility / responsive requirements

Include:
- keyboard-focus states,
- usable form labels,
- contrast-safe text,
- reduced-motion respect,
- proper RTL reading order,
- responsive tables/lists,
- comfortable touch targets,
- no critical hover-only actions.

Preserve existing invitation accessibility behavior.

---

## 29. State-management requirements

Do not build one enormous wizard state.

Suggested separation:
- event state,
- invitation-design state,
- guest-list state,
- seating state,
- check-in state.

Server-like data goes through repositories/query layer.
Transient UI state stays local.
Derived counts must be derived, not copied into multiple stores.

Example: `confirmedHeadcount` derives from confirmed invitation parties and their confirmed party size.

---

## 30. Required domain entities

At prototype level:

```text
User
Event
EventDetails
InvitationDesign
InvitationParty
RSVPResponse
Table
SeatAssignment
CheckInRecord
EventActivity
```

Do not mix unrelated concepts just because this is a prototype.

---

## 31. Activity model

Use activity timeline to make changes understandable.

Examples:
- Guest imported.
- Invitation opened.
- RSVP confirmed.
- RSVP edited.
- Guest assigned to table.
- Partial check-in recorded.

Mock repository may generate these activities.

---

## 32. Error handling

Required recovery states:
- failed guest import,
- duplicate guest,
- invalid phone,
- invitation not published,
- RSVP party size exceeds allowed,
- seating capacity exceeded,
- guest not found at check-in,
- QR already checked in,
- unsaved changes.

Avoid generic "Something went wrong" when a human-readable recovery can be shown.

---

## 33. Agent execution plan

Work in stages.

### Stage 0 — audit before changes
- Run project.
- Run existing tests.
- Map repository.
- Identify Invitation Studio boundaries.
- Identify styling/state/data coupling.
- Write `docs/PROTOTYPE_AUDIT.md`.
- Do not delete working invitation functionality.

### Stage 1 — prototype foundation
Create:
- target route structure,
- domain types,
- repository interfaces,
- mock repository and seed data,
- product shell,
- RTL app layout,
- theme tokens / UI primitives.

Deliverable: navigation between empty state, events, event overview and Invitation Studio.

### Stage 2 — event creation + invitation integration
Build:
- new-event flow,
- Event Overview setup checklist,
- Invitation Studio event integration,
- saved/published states,
- guest preview.

Deliverable: user creates event and publishes invitation design in prototype state.

### Stage 3 — guests + RSVP
Build:
- guest list,
- add/edit guest,
- import flow,
- filters,
- invitation communication states,
- RSVP wiring guest → organizer.

Deliverable: one end-to-end invite/RSVP journey.

### Stage 4 — seating
Build tables, capacity, confirmed/unassigned guests, assignment/move/unassign and warnings.

### Stage 5 — check-in
Build gate mode, search, QR simulation, partial/full check-in and exception states.

### Stage 6 — usability polish
- phone pass,
- RTL pass,
- error/empty/loading states,
- real Arabic copy,
- keyboard/accessibility pass,
- seeded test scenarios.

Do not begin aesthetic micro-polish before Stage 3 works end-to-end.

---

## 34. Required documentation generated during work

Maintain:

```text
docs/
  PROTOTYPE_AUDIT.md
  PRODUCT_MODEL.md
  ROUTES_AND_FLOWS.md
  UX_DECISIONS.md
  TEST_SCENARIOS.md
  PROTOTYPE_STATUS.md
```

`PROTOTYPE_STATUS.md` continuously shows:
- done,
- in progress,
- next,
- blocked,
- assumptions.

Do not hide unresolved decisions inside code.

---

## 35. Engineering quality

Even though this is a prototype:
- TypeScript strict mode where practical.
- No console-error-filled happy-path demo.
- Existing invitation tests remain passing unless a documented intentional change occurs.
- Add focused tests for core state rules.
- Prefer reusable feature components over copy/paste pages.
- Avoid premature general-purpose frameworks.
- Avoid huge files.
- Keep mock/production boundaries explicit.
- No secrets in source.
- Use semantic buttons/links rather than inaccessible clickable divs.

---

## 36. Decision rules for ambiguity

When a detail is not fully decided:
1. Choose simplest reversible MVP behavior.
2. Record it in `docs/UX_DECISIONS.md` as an assumption.
3. Implement behind a clear feature/domain boundary.
4. Do not invent large new scope.

Examples:
- Household ambiguity → use InvitationParty.
- WhatsApp ambiguity → simulate communication state; do not integrate BSP.
- Seating complexity → tables/capacity/assignment, not floor-plan CAD.
- Authentication ambiguity → mock prototype auth.

---

## 37. Do not do these things

- Do not replace working Invitation Studio with generic dashboard UI.
- Do not redesign every invitation asset before platform flows work.
- Do not start with vendor marketplace.
- Do not build production cloud infrastructure first.
- Do not create many screens with no connected state.
- Do not hide important states in tooltips.
- Do not make guest RSVP require signup.
- Do not use English-heavy customer UI.
- Do not treat desktop as the only real experience.
- Do not hard-code feature logic into page JSX.
- Do not make the prototype impossible to reskin.

---

## 38. Final deliverable definition

At the end, I should be able to run locally and:
1. Open Doyofy.
2. Create a wedding.
3. Enter event overview.
4. Open existing Invitation Studio from that event.
5. Choose/edit/publish a design.
6. Add/import guests.
7. Open one guest invitation link.
8. RSVP as that guest.
9. Return to organizer and see response reflected.
10. Create tables and assign confirmed guests.
11. Open check-in mode.
12. Find/scan that guest.
13. Partially or fully check them in.
14. See overview counts/activity update.
15. Repeat comfortably on a phone viewport.

All of this must work as one coherent stateful UX prototype.

Final UI does not need to be final visual identity.
Final **journeys, information architecture, domain boundaries and prototype behavior** need to be solid enough to test with real users and iterate rapidly.

---

## 39. First action

Before writing product code:
1. Read this entire document.
2. Inspect complete repository.
3. Run current tests.
4. Produce `docs/PROTOTYPE_AUDIT.md`.
5. Produce concrete implementation checklist mapped to stages above.
6. Then start Stage 1.

Do not respond with only recommendations or a hypothetical plan. Begin implementation after the audit, and keep the current Invitation Studio functional throughout.
