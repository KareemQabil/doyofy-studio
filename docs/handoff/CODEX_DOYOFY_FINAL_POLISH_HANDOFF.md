# CODEX HANDOFF — DOYOFY FINAL UX/UI & PRODUCT POLISH PASS

You are taking over an existing Doyofy MVP prototype after multiple product, UX, UI, interaction, and owner-review iterations.

This is a **handoff**, not a greenfield build.

Your job is not to mechanically continue the previous designer/agent's choices.

Your job is to take the current product as raw material and push it to the highest-quality version you can reasonably produce: visually exceptional, creatively distinctive, extremely easy to understand, smooth to use, coherent from end to end, Arabic-native, RTL-native, responsive, accessible, and ready to be reviewed by the product owner as a serious product.

You have broad creative and product-design authority.

Do not constrain yourself to the current layouts, component arrangements, page compositions, interaction patterns, Warm/Sage experiment, navigation structure, wording, or prior polish decisions if you can produce something materially better.

At the same time, do not casually destroy working product behavior or erase useful product capability.

The core rule is:

> Preserve the product's intent and working capabilities. Re-think anything about the experience or presentation that prevents it from becoming excellent.

---

# 0. HOW TO TREAT THE HANDOFF

You may receive:
- the latest Doyofy build/snapshot,
- the actual source repository,
- previous prototype docs,
- screenshots,
- owner feedback,
- design-system work,
- tests,
- invitation-engine assets.

Start by determining exactly what you have.

If the handoff contains only a compiled build such as:
- `app.js`
- `ui.css`
- `styles.css`
- built chunks/assets

then treat that build as a **behavioral and visual reference**, not as the ideal place to do long-term product development.

If an actual source repository exists, work in the source repository.

Do not choose to patch a minified production bundle when maintainable source is available.

If the source is elsewhere in the workspace, locate it first.

If there is genuinely no source and only the build exists, document that clearly before making architectural changes and work in the safest maintainable way possible.

---

# 1. CURRENT PRODUCT CAPABILITY — DO NOT LOSE THIS

The current prototype already contains a substantial product.

At minimum, inspect and preserve the behavior represented by these areas/routes where present:

- Events
- Create Event
- Event Overview
- Invitation
- Template Gallery
- Invitation Editor / Invitation Design
- Invitation Preview
- Guest Invitation
- Guests
- Guest Import
- RSVP
- Seating
- Check-in
- Event Settings
- Event Summary
- Prototype / Design Review
- Event-day / gate mode
- Empty/loading/error/offline/completed states
- responsive/mobile states
- theme/reviewer tooling
- current Invitation Studio / cinematic invitation engine

Do not assume every route is already perfect or even conceptually correct.

But before changing or removing anything, understand what job it performs and where its state flows.

---

# 2. PRODUCT CONTEXT

Doyofy is an Arabic-first platform for managing an event and the guest journey.

The product should NOT feel like:
- an invitation-design demo,
- a generic admin dashboard,
- a CRM with wedding colors,
- Canva with event features attached,
- or a collection of independent utilities.

The product journey is approximately:

**Create event  
→ prepare invitation  
→ choose/customize design  
→ add guests  
→ share invitation  
→ receive RSVP  
→ organize confirmed attendance  
→ seating  
→ event-day check-in  
→ completion**

The product's power comes from connecting those stages.

The organizer should feel that Doyofy is reducing the mental load of organizing the event.

The guest should experience almost no software friction.

---

# 3. THE PRIMARY MISSION

This iteration is a **deep product-polish pass**.

Do not interpret "polish" as:
- change colors,
- round cards,
- add shadows,
- add hover animation,
- or clean CSS.

Polishment includes:

### Product clarity
Does the user understand the product model?

### Information architecture
Are things grouped where users expect them?

### Task flow
Can people complete tasks with minimal thinking?

### Interaction design
Do controls behave naturally and provide the right feedback?

### Visual design
Does it look intentional, premium and distinctive?

### Content design
Are labels and Arabic microcopy human and precise?

### Responsive design
Does mobile feel designed rather than compressed?

### State design
Are empty/error/loading/success/partial states excellent?

### Performance perception
Does the UI feel immediate and stable?

### Accessibility
Can it be used comfortably beyond mouse + desktop?

### Brand expression
Does it feel like Doyofy without becoming decorative?

---

# 4. CREATIVE FREEDOM

You are explicitly allowed to challenge prior decisions.

You may:
- change page composition,
- simplify or restructure navigation,
- merge redundant product areas,
- change hierarchy,
- change labels,
- change control patterns,
- replace a sidebar if something better works,
- replace a grid with a different browsing pattern,
- rethink the event overview,
- rethink the editor shell,
- rethink template discovery,
- simplify RSVP presentation,
- rethink how event phases change the UI,
- change typography scale,
- change spacing,
- change radius/shadow philosophy,
- change motion patterns,
- create new reusable primitives,
- remove redundant visual containers,
- remove unnecessary text,
- remove excessive badges,
- collapse secondary functionality,
- introduce contextual actions,
- change the current theme treatment,
- merge the best of existing visual directions,
- or produce a stronger visual direction entirely.

Do NOT preserve a mediocre decision simply because it is already implemented.

However:

Do not delete meaningful product capability without understanding it.

If you make a significant UX/product decision, record why.

---

# 5. DO NOT ASK FOR MICRO-APPROVAL

Operate autonomously.

Do not stop to ask:
- which radius should we use?
- should this card be 24 or 28px?
- should this button be here?
- which of two obvious reversible UI patterns should we try?

Use your judgment.

For reversible design decisions:
1. choose the strongest solution,
2. implement it,
3. test it,
4. document it if important.

Only stop for genuinely business-critical ambiguity that changes:
- commercial scope,
- legal behavior,
- irreversible data semantics,
- payment ownership,
- privacy requirements,
- destructive product policy.

---

# 6. FIRST ACTION — FULL PRODUCT AUDIT

Before broad edits, run the product.

Inspect the codebase.

Run tests.

Build a route/component/state map.

Review the experience at:
- small phone,
- normal phone,
- tablet,
- laptop,
- desktop.

Review both RTL and any mixed Arabic/English content.

Create:

`docs/CODEX_POLISH_AUDIT.md`

The audit should be practical, not academic.

For every important surface identify:
- user goal,
- visual hierarchy,
- primary action,
- friction,
- confusion,
- unnecessary decisions,
- weak composition,
- inconsistent components,
- mobile issues,
- accessibility issues,
- interaction issues,
- state gaps,
- content/microcopy problems,
- performance concerns,
- duplicated styling,
- technical coupling that makes polish hard.

Rank findings:
- P0 broken/blocking
- P1 major confusion or trust problem
- P2 friction / inconsistency
- P3 aesthetic / micro-polish

Do not spend half the project writing the audit.

Audit quickly, then implement.

---

# 7. CREATE A BASELINE

Before major changes, capture the current important screens.

Store baseline screenshots, for example:

`review-screens/codex-before/`

Include representative:
- create-event
- occasion choice
- template gallery
- editor
- events list
- overview
- guests
- import
- RSVP
- seating
- check-in
- settings
- summary
- guest invitation
- mobile equivalents

This is not for bureaucracy.

It is to prevent subjective "it feels better" claims.

At the end create:
`review-screens/codex-after/`

---

# 8. NORTH-STAR EXPERIENCE

The user should not feel like they are learning software.

They already understand real-life concepts:
- مناسبة
- دعوة
- ضيف
- حضور
- طاولة
- وصول

The UI should map naturally to those concepts.

Avoid exposing internal system concepts unless necessary.

A first-time user should usually be able to glance at a screen and understand:

1. **أنا فين؟**
2. **إيه اللي حصل؟**
3. **إيه اللي ناقص؟**
4. **إيه أهم حاجة أعملها دلوقتي؟**
5. **لو غلطت أرجع إزاي؟**

If a screen cannot answer those quickly, improve it.

---

# 9. ELIMINATE CONFUSION, NOT POWER

Do not dumb down the product by removing useful capability.

Use:
- progressive disclosure,
- contextual controls,
- smart defaults,
- prefilled values,
- phase-aware UI,
- good grouping,
- contextual secondary actions,
- concise microcopy,
- reversible actions,
- inline feedback.

Hide complexity until the user actually needs it.

---

# 10. EVENT LIFECYCLE SHOULD SHAPE THE PRODUCT

An event changes over time.

The same Overview and navigation should not give every feature equal importance forever.

Consider lifecycle states such as:

### Setup
Main needs:
- create event,
- invitation,
- guests.

### Invitation period
Main needs:
- sharing,
- responses,
- missing responses,
- headcount.

### Preparation
Main needs:
- seating,
- unresolved guest information,
- final logistics.

### Event day
Main needs:
- check-in,
- exceptions,
- arrival progress.

### Completed
Main needs:
- attendance summary,
- thank-you,
- archive.

You are free to design a better lifecycle model.

The principle matters more than these exact labels.

Make the UI adapt to what is important now.

---

# 11. NAVIGATION — RE-THINK IF NEEDED

Do not assume the current navigation is final.

Ask:
- does the user understand these sections?
- are there too many permanent destinations?
- are RSVP and Guests conceptually separate to the user or two views of the same thing?
- should check-in be permanently prominent or become event-day mode?
- are settings and summary over-promoted?
- does the sidebar feel like enterprise admin chrome?
- can navigation be lighter while remaining obvious?

You may simplify/restructure navigation.

Do not prioritize minimalism over findability.

The final navigation must be:
- clear,
- fast,
- predictable,
- RTL-native,
- mobile-native,
- visually quiet.

---

# 12. CREATE EVENT — MAKE THE FIRST MINUTE EXCELLENT

The first minute establishes product quality.

The journey should feel exciting but effortless.

Inspect the existing:
- occasion selection,
- event essentials,
- transition into template choice/editor.

Do not make it feel like onboarding software.

Make it feel like:
> "I am starting my event."

Reduce premature questions.

Use defaults.

Keep optional details optional.

Let the user reach visual value quickly.

If the current Coverflow / Rail experiment can be improved or combined into something better, do it.

You are NOT required to keep either exact experiment.

The final occasion discovery should:
- work with a small catalogue,
- scale to many event types,
- preserve emotional browsing,
- make uncommon occasions easy to find,
- work beautifully on touch,
- work with keyboard,
- behave naturally in RTL,
- never feel gimmicky.

---

# 13. OCCASION SELECTION — CREATIVE QUALITY BAR

The occasion chooser is a chance to make Doyofy memorable.

But memorable does not mean complicated.

Explore the strongest interaction and visual solution.

Could involve:
- focused browsing,
- visual rail,
- categorized discovery,
- progressive reveal,
- image-led selection,
- elegant search,
- contextual shortcuts,
- or a hybrid.

Do not force an arbitrary carousel if another interaction is clearly better.

Avoid:
- autoplay,
- hard-to-stop spinning,
- exaggerated 3D,
- game-like interaction,
- hiding all options behind sequential navigation.

Selection should feel satisfying and unmistakable.

---

# 14. TEMPLATE DISCOVERY — MAKE IT DESIRABLE

The template gallery should be one of the most visually appealing parts of the platform.

It should not look like:
- a settings panel,
- an asset manager,
- a technical matrix,
- or a flat wall of 100 combinations.

Use the existing invitation engine intelligently.

Curate complexity.

The user should choose a **beautiful starting direction**, then customize.

Consider:
- recommendations for the event type,
- curated collections,
- editorial grouping,
- style-based discovery,
- recent/favorite if genuinely useful,
- beautiful preview,
- strong visual hierarchy.

Do not overload template cards with metadata.

Artwork should lead.

The user should be able to preview freely without fear of losing work.

Back navigation should preserve context.

---

# 15. TEMPLATE PREVIEW

Make preview feel intentional.

The invitation should dominate.

The UI around it should almost disappear.

The user should understand:
- what template this is,
- how it will look,
- how to choose it,
- how to go back.

Avoid overlaid toolbars full of options.

Commitment should be explicit but lightweight.

Changing their mind later should be easy.

---

# 16. EDITOR — FLAGSHIP PRODUCT SURFACE

The invitation editor is a flagship surface.

Spend serious design attention here.

It needs to communicate:
- creative possibility,
- safety,
- immediacy,
- simplicity.

It must NOT become Canva.

The user should not manage:
- arbitrary coordinates,
- layers,
- vector tools,
- freeform resize,
- complex timeline animation,
unless the existing product explicitly depends on them.

The editor should expose meaningful human decisions:
- what does the invitation say?
- what does it look like?
- what experience does it create?
- what event information appears?

You may change the current section organization if better wording/grouping exists.

---

# 17. EDITOR — DESKTOP COMPOSITION

Do not assume the current split is perfect.

Find the composition that makes the invitation the hero and controls effortless.

Possible principles:
- preview visually dominant,
- controls compact,
- strongest changes immediately visible,
- no wasted chrome,
- no giant configuration sidebar,
- top-level actions very clear.

The user must always understand:
- saved or not?
- draft or published?
- editing or guest preview?
- where to publish?
- how to go back?
- how to change the base template?

---

# 18. EDITOR — MOBILE

Mobile is not a smaller desktop editor.

Design it deliberately.

Inspect:
- preview height,
- keyboard behavior,
- control sheet,
- nested scrolling,
- tabs,
- save/publish,
- back,
- preview mode,
- drag handle,
- safe-area behavior.

You are free to replace the current bottom-sheet composition if something materially better works.

The user should be able to edit one-handed without fighting the interface.

---

# 19. LIVE PREVIEW

Preview should feel instant.

Optimize both actual and perceived performance.

Do not restart expensive cinematic sequences for tiny text edits.

Distinguish:
- editing preview,
- full guest preview.

Transitions should preserve context.

Changing:
- name,
- date,
- style,
- card,
- setting,
- motion,
should feel responsive.

Avoid unnecessary loading flashes.

---

# 20. EVENTS LIST — PERSONAL WORKSPACE, NOT CRM

The Events area should feel like the home of the organizer's occasions.

It should not feel like rows from a management system.

Use event identity.

Possible information:
- event visual/cover,
- occasion,
- name,
- date,
- stage/status,
- one useful next action.

Remove low-value metadata.

Do not turn each event card into a mini dashboard.

---

# 21. OVERVIEW — THE PRODUCT'S BRAIN

The Overview should tell the organizer:

> "Here's where your event is, and here's what matters next."

It should NOT be a KPI dashboard.

Re-think the whole composition if needed.

Potential hierarchy:
- event identity,
- next best action,
- needs attention,
- preparation progress,
- useful numbers,
- recent activity.

Do not represent every concept using equal-sized cards.

Use composition and whitespace to establish importance.

Make it phase-aware.

---

# 22. "NEEDS ATTENTION" AS A CORE PATTERN

Doyofy can feel intelligent without AI.

Use a strong pattern for actionable exceptions:

Examples:
- invitations not shared,
- guests who opened but did not reply,
- missing phone numbers,
- confirmed guests without tables,
- over-capacity table,
- manual event-day exception.

Do not present normal work as scary errors.

Use calm language.

Each attention item should tell:
- what happened,
- why it matters if necessary,
- what to do.

---

# 23. GUESTS — INFORMATION DENSITY WITH CLARITY

This is operational.

Do not over-minimalize it.

The user needs to scan quickly.

Clarify distinct dimensions:

### Invitation state
Was it shared/opened?

### RSVP state
Did they confirm/decline/not answer?

### Attendance state
Did they arrive?

These must never blur together.

Use text and structure, not only colored pills.

Avoid badge explosion.

---

# 24. GUEST LIST — DESKTOP

Review:
- column relevance,
- alignment,
- row density,
- scanning,
- hover,
- selection,
- batch actions,
- filters,
- search,
- empty results,
- sorting if present.

Do not display every possible field.

Secondary information belongs in details.

Keep important guest actions accessible without creating an action wall.

---

# 25. GUEST LIST — MOBILE

Design for actual use.

Do not make users horizontally scroll a desktop table if avoidable.

Use:
- stacked rows/cards,
- clear guest identity,
- party size,
- primary status,
- contextual action,
- quick search/filter.

Do not turn each mobile guest into a huge card requiring endless scrolling.

Find the right density.

---

# 26. GUEST DETAILS

Make guest details a contextual mini-workspace.

Prioritize:
1. who,
2. how many,
3. current response,
4. current event-day state,
5. contextually useful action.

History and manual/advanced actions can follow.

Do not show:
edit / delete / send / retry / copy / seat / check-in / WhatsApp / override
all at equal visual weight.

---

# 27. GUEST IMPORT — BUILD TRUST

Import is risky emotionally.

Users are afraid of messing up their guest list.

The flow should communicate safety.

Before commit:
- how many rows are ready,
- how many need review,
- what will be skipped,
- what will change.

Use plain Arabic.

Allow recovery.

Do not make it feel like a developer CSV importer.

If column mapping is needed, make it visual and understandable.

If automatic mapping works, do not expose mapping unnecessarily.

---

# 28. RSVP

Re-think where RSVP lives in the organizer experience.

Do not keep a separate top-level RSVP area just because it was previously built if Guests can express the same mental model more naturally.

You may:
- integrate RSVP into guest views,
- retain a focused responses view,
- create phase-specific filters,
- or find a better solution.

Preserve capabilities.

Simplify concepts.

---

# 29. GUEST INVITATION EXPERIENCE

Do not ignore the guest side during product polish.

Review the full guest journey:
- opening,
- navigation,
- date,
- venue,
- program,
- RSVP,
- confirmation,
- QR/event info,
- replay/sound where relevant.

The guest should not need an account.

It should feel:
- elegant,
- personal,
- fast,
- accessible,
- culturally natural.

The cinematic invitation can be expressive.

But functionality must remain clear.

Do not let animation delay RSVP or critical information unnecessarily.

---

# 30. SEATING

Seating should answer:

> "Who still needs a place, and where can I put them?"

Do not make it a CAD tool.

Review:
- table layout/list,
- capacity,
- available seats,
- unassigned confirmed guests,
- moving parties,
- warnings,
- partial fit,
- declined guests accidentally assigned.

The interaction can be creative, but must remain safer and clearer than a spreadsheet.

Drag-and-drop may exist, but every action should have an accessible alternative.

---

# 31. CHECK-IN — EVENT DAY MODE

This is a different context.

The operator may be:
- standing,
- rushed,
- on a phone/tablet,
- under poor connectivity,
- dealing with guests in front of them.

Optimize for speed.

Primary flow:
**search/scan → verify → check in**

Keep important info large:
- guest/party name,
- expected count,
- already arrived,
- table,
- warning.

Use large touch targets.

Do not require understanding the organizer dashboard.

Handle:
- partial arrival,
- already checked-in,
- guest not found,
- extra companion,
- declined guest arriving,
- table missing.

Exceptions must be calm and explicit.

---

# 32. SETTINGS

Do not use Settings as a dumping ground.

Group meaningful settings.

Hide rare/advanced options until needed.

Separate destructive actions visually.

Make event-level settings understandable in normal language.

---

# 33. COMPLETED EVENT / SUMMARY

Completion should feel like closure, not analytics.

Show useful outcome:
- invited,
- confirmed,
- attended,
- simple final state,
- thank-you next step,
- archive.

Use emotion carefully.

The screen may feel slightly celebratory, but not gimmicky.

---

# 34. ARABIC CONTENT DESIGN

Run a full Arabic copy pass.

The interface should sound like a well-designed Arabic product, not translated software.

Prefer short, human labels.

Use verbs.

Examples of the style:
- أضف الضيوف
- اختر القالب
- معاينة الدعوة
- أكد الحضور
- بانتظار الرد
- وزّع على طاولة
- تسجيل الدخول
- يحتاج مراجعة

Avoid overuse of:
- إدارة
- معالجة
- تنفيذ
- configuration-style nouns
when simpler language exists.

Avoid unnecessary English in customer-facing UI.

Mixed Latin data such as phone numbers and URLs should display correctly.

---

# 35. TERMINOLOGY CONSISTENCY

Create/maintain one vocabulary source.

A concept must not have three labels across the app.

Pay particular attention to:
- مشاركة / إرسال
- دعوة / تصميم / قالب
- ضيف / دعوة جماعية / مجموعة
- مؤكد
- الحضور
- الوصول
- نشر
- حفظ
- مسودة
- طاولة
- مرافق

Fix wording before adding help text.

---

# 36. TYPOGRAPHY

The current handoff includes modern Arabic font assets such as:
- IBM Plex Sans Arabic
- Readex Pro

Use typography intentionally.

You are free to adjust font pairing if another locally available/licensed choice is better.

Do not depend on external fonts if local assets exist.

Build a controlled hierarchy:
- display
- page title
- section
- body
- label
- metadata
- annotation

Arabic line height needs care.

Do not make operational body text tiny to create a "luxury" look.

Readability wins.

---

# 37. BRAND IDENTITY

Known Doyofy brand inputs include:
- Gold `#C7A661`
- Ivory `#F2EAD9`
- Beige `#E4D5B4`
- Red `#BC4749`
- Turquoise `#2EB7B7`
- Charcoal `#262626`

These are identity inputs, not a command to use all six everywhere.

Use the logo and palette intelligently.

The product should feel branded through:
- proportions,
- typography,
- accents,
- art direction,
- tone,
- visual consistency,

not through painting every component gold.

If the existing Warm/Sage themes are useful, evolve them.

If a stronger unified theme or mix is better, create it.

Do not feel trapped by the A/B experiment.

---

# 38. VISUAL DIRECTION — AIM HIGH

The UI should feel:
- modern,
- editorial where appropriate,
- calm,
- premium,
- warm,
- sophisticated,
- human,
- unmistakably intentional.

It may contain moments of creativity and delight.

But it must never become:
- decoration-first,
- difficult to scan,
- over-animated,
- fashion-concept UI that fails operational tasks.

The final product should still look excellent with all animations paused.

---

# 39. COMPOSITION

Audit every page for:
- hierarchy,
- balance,
- whitespace,
- rhythm,
- alignment,
- density,
- focal point,
- width,
- section transitions.

Do not solve every section with a rectangle card.

Use:
- space,
- typography,
- dividers,
- tonal surfaces,
- grouping,
- layout,

before adding borders.

Avoid "card soup".

---

# 40. GEOMETRY

Normalize visual geometry.

Review:
- border radius,
- button shapes,
- inputs,
- cards,
- sheets,
- dialogs,
- thumbnails,
- pills.

Do not let every component invent its own radius.

At the same time, do not mechanically apply one radius to everything.

Create a coherent family.

---

# 41. COLOR

Use color for:
- hierarchy,
- selection,
- state,
- identity,
- attention.

Do not use color as decoration without purpose.

Semantic states should be understandable with text/icons too.

"Declined" is not the same as "system error".

"Needs attention" is not always "danger".

Use nuanced state colors.

---

# 42. SHADOW / DEPTH

Use depth intentionally.

Avoid shadow everywhere.

Strong shadows should be reserved for:
- overlays,
- editor preview art,
- meaningful elevated surfaces.

Normal page sections should rely more on spacing and tonal separation.

---

# 43. ICONS

Use one coherent icon language.

Normalize:
- size,
- stroke,
- alignment,
- RTL direction.

Icons should support labels, not force users to interpret cryptic symbols.

---

# 44. BUTTONS / ACTION HIERARCHY

Standardize action hierarchy.

A screen should rarely have multiple equally prominent primary buttons.

Use:
- Primary
- Secondary
- Tertiary / text
- Destructive

Context determines prominence.

Polish:
- hover,
- focus,
- pressed,
- disabled,
- loading,
- success where useful.

Avoid giant pills everywhere just because a theme used them.

Use shape intentionally.

---

# 45. FORMS

Forms are a major part of perceived quality.

Audit:
- labels,
- placeholder use,
- required/optional,
- helper text,
- grouping,
- validation,
- date/time controls,
- select controls,
- phone numbers,
- keyboard order,
- input method on mobile.

Do not put instructions in placeholders that disappear while typing.

Errors should be local and actionable.

On submit, focus the first relevant error.

---

# 46. FILTERS / SEARCH

Filters should not dominate the page.

Show the filters people actually use.

Progressively reveal advanced filters.

Preserve active filters clearly.

Empty result states should explain how to recover.

Search should feel immediate.

---

# 47. TABLES / DATA LISTS

Tables are allowed when they are the best tool.

Do not eliminate tables purely for aesthetics.

Polish:
- density,
- row scanning,
- sticky headers if useful,
- status hierarchy,
- selected/hover state,
- responsive behavior,
- action placement.

Avoid horizontal overflow on phones when a better mobile layout exists.

---

# 48. MODALS / SHEETS / DRAWERS

Unify overlay behavior.

Review:
- when to use dialog,
- when to use sheet,
- when to use page,
- focus trapping,
- escape/back,
- scroll,
- mobile full-height behavior.

Do not open a modal inside a modal unless unavoidable.

Maintain context.

---

# 49. EMPTY STATES

Every meaningful empty state should:
- explain what is missing,
- show why the area matters only if necessary,
- offer a clear next action.

Do not use:
"لا توجد بيانات"

when:
"لم تضف ضيوفًا بعد. ابدأ باسم واحد أو ارفع قائمتك."
is better.

Keep it concise.

---

# 50. LOADING STATES

Avoid blank screens and full-screen spinners for normal navigation.

Use:
- stable skeletons,
- local loading,
- optimistic UI where safe,
- preserved layout.

Heavy invitation/3D assets can have a specialized loading treatment.

No layout jumping.

---

# 51. SUCCESS FEEDBACK

Prefer inline state change over toast.

Examples:
- copy → `تم النسخ`
- save → `تم الحفظ`
- guest assigned → visibly moved
- RSVP updated → status changes in place.

Use toast for:
- cross-context confirmation,
- failures with no obvious local anchor,
- truly global events.

Do not create toast spam.

---

# 52. ERRORS

Humanize errors.

Do not say:
"An error occurred."

Say what the user can do.

Examples:
- invalid phone
- duplicate guest
- import issue
- failed save
- invitation not published
- QR already used
- capacity issue.

Never trap the user.

---

# 53. CONFIRMATIONS

Do not confirm reversible, harmless actions.

Confirm:
- delete,
- archive,
- destructive reset,
- event-wide irreversible changes,
- meaningful exception override.

Reduce modal fatigue.

---

# 54. INTERACTION DESIGN

Interaction quality is part of the visual identity.

Every interactive component should feel:
- immediate,
- tactile,
- predictable,
- restrained.

Define:
- idle
- hover
- focus
- pressed
- selected
- disabled
- loading
- success
- error

where applicable.

Do not add motion merely because CSS makes it easy.

---

# 55. MOTION

Use motion to explain:
- selection,
- open/close,
- hierarchy,
- movement,
- state update,
- continuity.

Avoid:
- autoplay UI,
- bouncing,
- exaggerated spring motion,
- parallax everywhere,
- constant decorative loops,
- random hover lift on every card.

Operational UI should be fast.

The cinematic invitation is allowed to be expressive.

Respect reduced motion.

---

# 56. HOVERS

Desktop hover should communicate affordance.

Good:
- subtle tonal shift,
- subtle border,
- slight image zoom within clipped card,
- clear action reveal.

Bad:
- 10px card lift,
- giant scale,
- glow everywhere,
- animated gradients on all controls.

Selected state must remain stronger than hover.

---

# 57. FOCUS

Keyboard focus must be visible and beautiful.

Do not remove outlines without replacement.

Audit full keyboard navigation through:
- create event,
- template gallery,
- editor,
- guests,
- seating,
- check-in.

Make RTL direction predictable.

---

# 58. RESPONSIVE DESIGN

Do not stop at "no horizontal overflow".

Design actual compositions for:
- ~360 phone,
- ~390 phone,
- ~430 phone,
- tablet,
- laptop,
- desktop,
- wide desktop.

Review every core journey on phone.

Mobile should not feel secondary.

---

# 59. RTL — VISUAL, NOT TECHNICAL ONLY

Audit:
- visual reading order,
- sidebar/nav placement,
- back/forward icons,
- chevrons,
- carousels,
- pagination,
- drawers,
- editor panel,
- sheets,
- form alignment,
- mixed Arabic/English,
- numbers,
- dates,
- phone numbers,
- URLs.

Use logical CSS properties where possible.

Arabic must feel like the original design language.

---

# 60. ACCESSIBILITY

Maintain and improve:
- semantic controls,
- keyboard support,
- labels,
- focus,
- color contrast,
- screen-reader names,
- reduced motion,
- touch target size,
- non-hover alternatives.

Do not sacrifice accessibility for visual minimalism.

---

# 61. PERFORMANCE IS PART OF POLISH

A beautiful UI that stutters is not polished.

Audit:
- unnecessary re-renders,
- hidden 3D mounting,
- image loading,
- template preview loading,
- animation cost,
- layout shift,
- giant DOM,
- large blocking bundles where practical,
- scroll performance.

Lazy-load heavy preview/3D work.

Do not prematurely rewrite architecture for micro-optimization.

Fix real/perceived bottlenecks.

---

# 62. DESIGN SYSTEM — CLEAN IT, DON'T ACCUMULATE IT

The current build already has:
- theme tokens,
- spacing tokens,
- type tokens,
- radius,
- motion tokens,
- shared controls,
- theme scopes.

Evolve the system.

Do not create a second parallel design system beside it.

Refactor:
- repeated patterns,
- obsolete variants,
- duplicate CSS,
- one-off colors,
- one-off radius,
- page-specific button styles.

Aim for:
- semantic tokens,
- primitives,
- composed feature components.

The product should remain easy to reskin.

---

# 63. DO NOT TURN POLISH INTO A CSS PATCH PILE

If the source has weak structure, fix structure where necessary.

Do not append 3,000 lines of overrides at the bottom of CSS.

When replacing an old pattern:
- migrate usages,
- remove obsolete styling where safe.

Maintainability matters because UI will continue changing after owner feedback.

---

# 64. TESTING

Before each broad refactor:
- understand tests.

After:
- run tests,
- typecheck,
- verify key flows.

Do not make screenshots perfect while behavior silently regresses.

Add focused tests for important changed interaction/state logic.

Do not test pure visual values exhaustively.

---

# 65. MANUAL PRODUCT WALKTHROUGH

Perform full manual walkthroughs.

Organizer:
1. create event
2. choose occasion
3. enter essentials
4. choose template
5. preview
6. customize
7. publish
8. add/import guests
9. inspect responses
10. seat confirmed guests
11. open check-in
12. check in a party
13. view completed state

Guest:
1. open invitation
2. consume details
3. RSVP
4. edit response if supported
5. view event details/QR
6. reach event-day state

Gate:
1. search/scan
2. verify
3. partial check-in
4. full check-in
5. handle exception.

Walk these on desktop AND mobile.

---

# 66. USABILITY THINKING

Where real user testing is available, use it.

If you cannot actually recruit humans from this environment:
- do not fabricate user-test results,
- prepare the prototype and test script,
- perform expert walkthrough,
- clearly label assumptions,
- document what should be validated with real people.

Do not claim "zero confusion" based only on automated tests.

---

# 67. HEURISTIC CHECK

Use product judgment, not an academic report.

Check:
- system-status visibility,
- real-world language,
- user control,
- consistency,
- error prevention,
- recognition over recall,
- efficiency,
- minimalism,
- error recovery.

Turn findings into implementation.

---

# 68. OWNER REVIEW EXPERIENCE

The product owner needs to review the full MVP.

Improve/create a clean reviewer entry such as:
`/prototype/design-review`

It should not look like developer tooling.

It can provide organized shortcuts to:
- Create Event
- Occasion discovery
- Gallery
- Editor
- Events
- Overview
- Guests
- Import
- RSVP
- Seating
- Check-in
- Settings
- Summary
- Guest experience
- important states

If theme/experiment switches remain useful, keep them discreet.

Do not let internal debug controls dominate.

---

# 69. OWNER REVIEW PACK

At the end, create a coherent screenshot set.

Use consistent data so comparisons make sense.

Desktop screenshots:
- create/occasion
- gallery
- editor
- events
- overview
- guests
- import review
- seating
- check-in
- summary

Mobile:
- occasion
- gallery
- editor
- overview
- guests
- check-in
- guest invitation

Store under:
`review-screens/codex-final/`

If there are multiple meaningful themes, show them only where comparison adds value.

Do not duplicate 100 screenshots.

---

# 70. OWNER REVIEW GUIDE

Create:
`docs/OWNER_REVIEW_GUIDE.md`

Ask questions that produce actionable feedback.

Do not ask only:
"رأيك إيه؟"

Cover:
- clarity
- brand feel
- first impression
- navigation
- create-event flow
- occasion choice
- templates
- editor
- overview
- guest management
- event-day flow
- mobile
- preferred visual direction
- anything that still feels generic/confusing/heavy.

Keep the guide concise enough that the owner actually uses it.

---

# 71. FINAL VISUAL QA

Do a last manual visual pass.

Look for:
- 1–2px alignment issues,
- inconsistent radii,
- mismatched button heights,
- clipped Arabic,
- poor wrapping,
- weak empty space,
- too much empty space,
- awkward sticky elements,
- scrollbar issues,
- hover clipping,
- sheet overlap,
- mobile keyboard issues,
- focus ring clipping,
- inconsistent shadows,
- inconsistent icon alignment,
- different typography for same role,
- unexpected color tokens.

This final 10% matters.

---

# 72. DO NOT MISS SYSTEM STATES

Audit at least:

- default
- hover
- focus
- active
- selected
- disabled
- loading
- empty
- no results
- success
- warning
- error
- offline
- partial
- completed
- unsaved
- saved
- draft
- published
- unpublished changes

Not every component needs every state.

But every product concept that can enter a state must have a deliberate presentation.

---

# 73. DO NOT FORGET REALISTIC DATA

Polish with real-looking Arabic data.

Do not optimize UI using lorem ipsum or one-row tables.

Use enough data to expose:
- long names,
- multiple statuses,
- large guest lists,
- different party sizes,
- long venue names,
- missing phone,
- unassigned seating,
- partial check-in.

Beautiful empty demo data often hides bad product design.

---

# 74. DO NOT OVER-POLISH LOW-VALUE THINGS

Do not waste the iteration on:
- splash animation,
- custom cursor,
- elaborate logo animation,
- decorative loading screen,
- animated charts,
- confetti,
- marketing landing page,
- custom illustration system,
unless the core product is already excellent and these are genuinely valuable.

Spend effort where users make decisions and do work.

---

# 75. OUT OF SCOPE UNLESS ALREADY NEEDED TO PRESERVE CURRENT BEHAVIOR

This handoff is about finishing the current MVP experience, not expanding business scope.

Do not independently start:
- marketplace,
- gift registry,
- payments,
- new B2B portal,
- native mobile app,
- full AI assistant,
- advanced venue CAD,
- production WhatsApp integration,
- production cloud migration,
- large backend rewrite,

unless those are already part of the actual source/task you were given and necessary for existing functionality.

If you identify future opportunities, document them separately.

Do not build them during this polish pass.

---

# 76. DOCUMENTATION

Maintain only useful docs.

Create/update:

`docs/CODEX_POLISH_AUDIT.md`
`docs/UX_DECISIONS.md`
`docs/UX_LANGUAGE.md`
`docs/INTERACTION_SYSTEM.md`
`docs/OWNER_REVIEW_GUIDE.md`
`docs/PROTOTYPE_STATUS.md`

At the end:
`docs/CODEX_FINAL_POLISH_SUMMARY.md`

Summary should state:
- what you inherited,
- biggest problems found,
- major design/product decisions,
- what changed,
- what was intentionally preserved,
- remaining known issues,
- what still needs real-user validation,
- exact run/test/review instructions.

Do not write documentation instead of doing work.

---

# 77. IMPLEMENTATION STRATEGY — USE YOUR JUDGMENT

Do not follow a rigid arbitrary sequence if the codebase suggests a better one.

A reasonable approach could be:

1. Audit + baseline
2. Design-system cleanup
3. Global shell/navigation
4. First-run create flow
5. Gallery/editor
6. Events/overview
7. Guests/import/RSVP
8. Seating/check-in
9. Settings/summary
10. Guest experience
11. Responsive/RTL/accessibility
12. Motion/state polish
13. Performance
14. final regression/visual QA
15. owner review pack

But reorganize the work if dependencies make another sequence better.

The outcome matters more than following this order.

---

# 78. BE BOLD WHERE IT IMPROVES THE PRODUCT

Do not merely normalize padding.

If a page is fundamentally mediocre:
redesign it.

If navigation is fundamentally confusing:
restructure it.

If a label is wrong:
rename it.

If the editor composition is not great:
recompose it.

If a previous experiment is clearly inferior:
replace it.

If the product feels too dashboard-like:
solve the root cause.

If a clever interaction can remove three controls:
consider it.

Creativity is encouraged.

Novelty for novelty's sake is not.

---

# 79. RESTRAINT IS PART OF CREATIVITY

A truly polished product knows what not to show.

Do not equate "creative" with:
- more motion,
- more effects,
- more cards,
- more gradients,
- more custom controls.

Some of the best improvements may be:
- remove a box,
- change one sentence,
- change the order,
- choose a better default,
- hide a secondary action,
- make a state automatic,
- reveal context at the right moment.

Use judgment.

---

# 80. FINAL ACCEPTANCE — PRODUCT

A first-time organizer should be able to:

- create an event,
- choose a suitable occasion,
- reach visual value quickly,
- choose/preview a template,
- customize the invitation,
- understand save/publish state,
- add/import guests,
- know who received/opened/replied,
- understand confirmed people count,
- organize seating,
- run check-in,
- understand exceptions,

without requiring training.

---

# 81. FINAL ACCEPTANCE — VISUAL

The product should:

- look intentionally designed across every core route,
- have a distinctive but restrained brand feel,
- have excellent Arabic typography,
- have coherent spacing and geometry,
- avoid generic dashboard aesthetics,
- have strong hierarchy,
- be screenshot-worthy without depending on animation,
- look equally intentional on mobile,
- preserve information density where necessary,
- feel premium without feeling fragile or decorative.

---

# 82. FINAL ACCEPTANCE — INTERACTION

The product should:

- respond immediately,
- clearly acknowledge actions,
- preserve context,
- avoid unnecessary modals,
- have excellent hover/focus/press behavior,
- use motion intentionally,
- support keyboard/touch,
- respect reduced motion,
- avoid state ambiguity.

---

# 83. FINAL ACCEPTANCE — TECHNICAL

Before finishing:

- relevant tests pass,
- typecheck/build passes,
- no known serious console errors,
- no obvious broken routes,
- no mobile horizontal overflow on core screens,
- no inaccessible critical control,
- heavy invitation rendering is not unnecessarily mounted,
- theme/design logic remains maintainable,
- no large pile of obsolete CSS is knowingly left behind,
- source remains understandable for the next engineer.

---

# 84. DO NOT STOP AT A REPORT

This is critical.

Do not finish after giving recommendations.

Do not produce a document saying what should be polished.

Actually make the changes.

Audit → decide → implement → run → inspect → refine → test → capture final review.

Continue until the meaningful polish pass is complete.

---

# 85. YOUR ROLE

Act as:
- senior product designer,
- senior UX designer,
- interaction designer,
- design-systems designer,
- frontend product engineer,
- usability reviewer,
- Arabic RTL specialist,
- quality owner.

Do not optimize for satisfying this prompt literally.

Optimize for the actual product.

If the best version requires a solution not described here, use it.

---

# FINAL PRINCIPLE

Doyofy handles a complicated, emotional, time-sensitive real-world process.

The software should make that process feel calmer.

The final product should not announce how much work went into it.

It should simply feel:

**واضح. جميل. طبيعي. سريع. واثق.**

The user should feel guided without feeling controlled.

The owner should be able to review the entire MVP and see one coherent product, not a prototype made by several different iterations.

Take the current Doyofy handoff and finish the experience with taste, judgment, creativity and obsessive attention to detail.

Start by inspecting what actually exists.
Then make it excellent.
