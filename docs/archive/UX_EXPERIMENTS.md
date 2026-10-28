# UX experiments (prototype A/B)

Both experiments run on **one** component system and **one** data set, so feedback isolates the variable under test. Switch them in the prototype tools (bottom corner, «نموذج»), on `/prototype/design-review`, or with a link parameter:

```
?theme=warm | ?theme=sage
?chooser=coverflow | ?chooser=rail
```

Settings persist per browser (prototype settings). Nothing in feature code branches on the theme. The chooser variant is the only feature-level switch, and it is read in one place (`CreateEvent`).

---

## E1 · Visual direction: Warm Editorial (A) vs Soft Sage (B)

| | A · Warm Editorial | B · Soft Sage |
|---|---|---|
| Foundation | ivory canvas, sand surfaces | warm off-white, stone and muted sage |
| Actions | warm charcoal ink pills | deep sage pills |
| Accent | brand gold in small details (logo, selection, art) | sage; gold only in the logo/art |
| Feeling aimed at | refined, editorial, hospitality | modern, calm, lifestyle |

**What we are testing.** Which direction the owner and organizers see as Doyofy, premium without the wedding-luxury cliché, and still calm enough for operational screens.

**Feedback should answer:**
1. Which one feels like *your* product? Which feels like a template?
2. On the gallery and editor, does the UI step back enough for the invitation art to lead?
3. On operational screens (guests, check-in), is either too soft or low-contrast to work fast?
4. Is the gold (A) or the sage (B) the stronger brand cue next to the double-line logomark?

**Measured so far.** Both themes pass the contrast audit: 104/104 screen × viewport × theme combinations clean.

**Winner:** *(pending owner review)*

---

## E2 · Occasion selection: Coverflow (A) vs Editorial Rail (B)

Same catalogue in both: 13 occasions in 5 groups (زواج واحتفالات · شخصية · عائلية وموسمية · أعمال · أخرى), popular first, with the same cards, names and copy.

| | A · Focused Coverflow | B · Editorial Rail + all occasions |
|---|---|---|
| First view | one occasion centred, neighbours peeking | six popular occasions on a rail |
| Browsing | swipe / arrows / keyboard, one at a time | scroll the rail, or «عرض كل المناسبات» → grouped gallery |
| Selection | the centred card is the choice | tap a card; picked ones from the gallery join the rail |
| Strength | emotional, one decision at a time, big art | fast access to any type, scales to many more |
| Risk | finding a non-popular type is sequential | less "moment", more like a menu |

**Measured in the scripted walkthrough** (`node tests/usability-walk.mjs <vp> <variant>`):

| Task | Coverflow (desktop) | Editorial Rail (phone) |
|---|---|---|
| U1 create a wedding | 0 extra actions: the wedding is centred and pre-selected | 1 tap on the wedding card |
| U2 find «مولود» | **7 taps** on «المناسبة التالية» (or 7 swipes) | 2 taps: «عرض كل المناسبات» → «مولود» |

The walkthrough is a script, not a person. It shows the shape of each interaction, not how it feels.

**What we are testing.** Whether people enjoy browsing (A), or need to find (B), and how each holds up as the catalogue grows past 13.

**Feedback should answer:**
1. With A, do people swipe through happily, or look for "all types"?
2. With B, do people notice «عرض كل المناسبات»? Do the groups match how they think of their occasion?
3. Which one makes the first minute feel more like starting a celebration?
4. Should a hybrid ship: coverflow for popular types plus an «كل المناسبات» link?

**Winner:** *(pending owner review)*

---

## Not A/B-tested (single proposal for review)

| Area | Proposal | Question for review |
|---|---|---|
| Template gallery | Image-first grid of 13 curated presets with real renders and the event's names. Suited presets come first (lead tile), and one chip row filters by style. | Enough choice? Do the style chips match how people describe what they want? |
| Template preview | The real invitation plays in a dialog/sheet; nothing is applied until «استخدم هذا القالب». | Is "preview, then use" clear, or do people expect a tap to apply? |
| Editor | Four sections: المحتوى · التصميم · الحركة والصوت · تفاصيل المناسبة. Live preview on desktop; on phones, a poster plus bottom sheet, with «معاينة» for the live view. | Is it understood within 30 seconds? Does putting the event date in the editor (with the shared-data notice) confuse anyone? |
| Phone editor sheet | Half/full snap; the Design tab needs a scroll inside the half sheet to see all cards. | Should the Design tab open the sheet to full height automatically? |
