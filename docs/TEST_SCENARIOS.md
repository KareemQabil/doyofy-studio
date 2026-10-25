# Usability test scenarios (spec §23)

## Before each tester

1. Open the prototype. The tester should use the device they would really use; run at least half the sessions on a phone.
2. Bottom corner **نموذج** → choose a scenario → **إعادة الضبط**:
   - **قبل المناسبة**: the wedding "زفاف نورة وفيصل" is 9 days away. Use for tests 1–5.
   - **يوم المناسبة**: the wedding is today and some guests have arrived. Use for tests 6–7 (they also work in "before", with a banner).
3. Do not show the prototype tools to the tester. Add `?tools=off` to the URL to hide the button.

## Tasks (read aloud, in Arabic; don't coach)

| # | Task | Start | Done when | Watch for |
|---|---|---|---|---|
| 1 | «أنشئ مناسبة جديدة وحدد التاريخ والمكان.» | Events home | The overview of the new event opens | Event type choice, finding the date/time fields, the optional English names; time to create (target: under 3 min) |
| 2 | «اختر دعوة مناسبة وعدّل الأسماء ثم اعرضها كما سيراها الضيف.» | Overview of the new event | Full-screen preview is open | Finds the invitation from the checklist/next action; understands names here change the invitation only; understands saved vs published; finds the preview |
| 3 | «أضف 20 ضيفًا من ملف، وتعامل مع مشكلة رقم مكرر.» | Guests of the seeded wedding | Result screen shows the guests added | Finds import; uses the sample file (or a downloaded copy); understands the duplicate row and decides; the missing name / bad phone rows |
| 4 | «اعرف مين لسه ما ردش، وافتح بيانات ضيف منهم.» | Overview of the wedding | A pending guest's drawer is open | Path: attention item, «لم يرد بعد» filter, or الردود; does the tester notice "opened but didn't reply"? |
| 5 | «وزّع ضيفًا مؤكدًا على طاولة.» | Overview | The guest is on a table | Finds الجلوس (phone: tab bar); «اختر طاولة» vs drag; understands remaining seats and the "doesn't fit" warning |
| 6 | «ضيف وصل ومعاه شخصان. سجّل دخولهم.» (say the name: «عائلة الدوسري» — confirmed 3, not arrived yet) | Overview (event day) | Check-in confirmation shows 3 people | Finds gate mode; search vs scan; reads the count; the confirmation |
| 7 | «الضيف حضر جزء من مجموعته والباقي هييجي بعدين.» (say: «عائلة الشمري» — confirmed 4; 2 arrive now, 2 later) | Gate mode | Partial check-in recorded; later the rest | Understands "how many are entering now"; the "سيبقى N" hint; finds the same family again later (scan or search) |

### Extra probes, if time allows

- **Open a guest link as the guest** (tools → روابط الضيف), RSVP, then return to the organizer tab. Did they notice the update?
- **Turn on "محاكاة انقطاع الاتصال"** and ask the tester to add a guest. Is the error message understandable and recoverable?
- **Gate exceptions:** scan «ضيف معتذر» or «رمز استُخدم بالكامل». Does staff stop and ask?

### Owner-review tasks (UI/UX iteration — run in both themes, and with each occasion chooser)

| # | Read aloud | Start | Watch for |
|---|---|---|---|
| U1 | «أنشئ مناسبة زفاف جديدة.» | Events home | Does the chooser feel like starting a celebration? Do they find «متابعة»? Time to the gallery. |
| U2 | «شوف باقي أنواع المناسبات واختار مناسبة مختلفة.» | Events home | Coverflow: do they swipe, or look for a list? Rail: do they notice «عرض كل المناسبات»? Do the groups match their idea of the occasion? |
| U3 | «اختار قالب يعجبك واعرضه بالحجم الكامل.» | Gallery (right after U1) | Do they open the preview, or expect a tap to apply? Do the style chips help? |
| U4 | «غيّر الأسماء والتاريخ والستايل ثم اعرض الدعوة كضيف.» | Editor | Where do they look for the date? Is the shared-data notice understood? Do they find «معاينة كضيف» (phone: «معاينة» then «كضيف»)? |
| U5 | «ارجع وغير القالب من غير ما تضيع بيانات المناسبة.» | Editor | Do they find «تغيير القالب» in التصميم? Do they trust that their texts stay? |

The brief's tasks 6–8 (add guests and see who hasn't replied, seat a guest, check in a guest with companions) are T3–T6 above.

## What to capture per task

- completion: yes / with help / no;
- time;
- wrong turns: pages visited that weren't on the path;
- hesitations over 5 s, and where;
- questions the tester asked;
- the screen where they stopped;
- one sentence of qualitative feedback.

Template row: `T# | device | done | mm:ss | wrong turns | hesitations | questions | stopped at | quote`.

## After each round

Fix journey problems (navigation, wording, missing states) before visual polish (spec §23).

Log changes in `docs/UX_DECISIONS.md`. When a decision is reversed, add a row; don't delete the old one.

## Automated stand-ins

`npm run test:e2e` walks the acceptance journey of spec §38 on a desktop and a 390 px phone:
- create a wedding;
- design and publish the invitation;
- add a guest and import guests;
- the guest RSVPs in the invitation;
- the organizer sees the reply;
- seating;
- partial and full check-in;
- the overview updates.

It also checks that unresolved import rows block confirmation and that unknown codes are rejected at the gate. It doesn't replace real testers.

`node tests/usability-walk.mjs phone|desk [coverflow|rail]` runs tasks U1–U5 and T3–T7 as a first-time tester would, using only visible labels. It records whether each target was visible without scrolling, saves a screenshot per step to `qa/usability/`, and writes `log.json`. Round 0 results and fixes are in `docs/USABILITY_ROUND_0.md`. Like the E2E run, it shows that the paths exist and work. It cannot show whether people understand them.
