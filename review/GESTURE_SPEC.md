# Gesture specification — «توقيع»

All thresholds below are copied from code (`src/domain/gestures.ts`, `src/ui/hooks/usePointerGesture.ts`) and covered by `tests/unit/gestures.test.ts` (10 gesture tests) plus the browser journey `tests/signature-journey.mjs`.

## Shared rules

- **One gesture surface per component, never the page.**
  - `usePointerGesture` binds to a single element.
  - Inputs, links and buttons inside it block the gesture, unless they opt in with `data-gesture-surface`. Deck cards opt in: they are buttons you can also drag.
  - Only the primary pointer and the primary button start a gesture. Multi-touch second pointers are ignored.
- **Axis lock.**
  - Nothing is decided until the pointer has moved 10 px (`lockAxis`).
  - If the cross-axis movement is larger, the gesture is rejected and the browser keeps the scroll. Vertical page scrolling always wins over a horizontal swipe.
  - The gesture locks only when along > across × 1.25. Pointer capture is taken only at that moment, so taps and scrolls are untouched.
- **Cancellation.**
  - These all end the gesture as *cancelled*: `pointercancel`, lost pointer capture, a disabled/busy surface mid-drag, or the axis rejection above.
  - A cancelled gesture always returns to its starting state.
  - The click that follows a completed drag is swallowed (`onClickCapture`), so a drag never also activates a card.
- **RTL meaning of "next".** Reading order runs right → left, so the next item sits to the left. All of these advance:
  - swipe left (dx < 0);
  - ArrowLeft;
  - the button labelled «البطاقة التالية»;
  - a trackpad scroll towards the left.

  The `forward` icon is Phosphor CaretLeft.
- **Reduced motion (`prefers-reduced-motion: reduce`).** Every gesture still works:
  - the state changes instantly (no rAF easing);
  - no tilt;
  - the stamp shows without rotation;
  - the envelope opens without the flap/rise.
- **Busy.** `TactileDeck disabled` adds `.is-busy`, ignores input and disables the arrows. It is used while a template is being applied.
- **Cleanup.**
  - Listeners live on component elements and are removed on unmount. This covers the wheel (deck), the pointer (tilt zone) and rAF handles (deck, tilt).
  - Nothing is added to `window` except the `matchMedia` reads.

## 1. Occasion deck and template deck (TactileDeck)

| | |
|---|---|
| Surfaces | Create step 1 «ما المناسبة؟» (`SignatureOccasions.tsx`); template gallery (`SignatureTemplateDeck.tsx`, window 2); home section 02 deck of occasion posters |
| User goal | Browse 13 occasions / 59 looks with neighbours visible; pick one |
| Affordance | Fanned cards with visible neighbours; prev/next buttons; counter `01 / 13` plus a progress rail. A one-time hint «اسحب البطاقات لتتصفّح» with a hand appears until the first interaction (localStorage `doyofy:deck-hint`, wrapped in try/catch) |
| Pointer types | mouse, pen, touch (Pointer Events); trackpad wheel |
| Axis | x |
| Threshold | lock after 10 px with along > 1.25 × across |
| Movement feedback | Live position `deckDragPosition = start − dx / step`. Every card is posed by `deckPose`: offset × spacing, scale −11 % per card, rotate 4.5° per card (clamped ±10°), the centre card lifts 10 px, far cards fade after 1.6, hidden after 2.6 |
| Bounds | Rubber band beyond the first/last card (motion × 0.28) |
| Snap | `deckRelease`: velocity × 220 ms projected ahead, rounded to a card. A drag past 22 % of a card always counts as one step |
| Velocity | At most 3 cards per fling, so a flick stays readable |
| Cancellation | Returns to the original index |
| Scroll relationship | Vertical wheel scrolls the page. Horizontal wheel/trackpad accumulates past 60 px, then steps one card with a 380 ms lock. Touch vertical pans are rejected by the axis lock |
| Keyboard | Focus stays on the active card (roving `tabIndex`). ArrowLeft = next, ArrowRight = previous, Home/End. Enter/Space activates (`onActivate`: continue with this occasion / open the look) |
| Buttons | «البطاقة السابقة» / «البطاقة التالية», disabled at the ends |
| Reduced motion | Instant moves, no easing |
| Busy | `disabled` → `.is-busy`; no input |
| Labels | Group `aria-roledescription="معرض بطاقات"` with the deck label. A polite live region announces «زفاف، 1 من 13». Cards carry `aria-current` |
| Alternative | «قائمة وبحث» toggle → the CuratedChooser radio grid with search. Same selection model, no gesture needed |
| Tests | Unit: drag direction, resistance, release, flings, cancel, poses. Browser: keyboard 01→02→01, button back, pointer swipe → 02 (`signature-journey` steps 02–03, all three widths) |

## 2. Home hero fan (A «احتفال»)

| | |
|---|---|
| Surface | `SignatureHome.tsx` HeroFan |
| Goal | Show the organizer's own invitation in three looks (or labelled examples) and let them flip through |
| Affordance | Three fanned real card faces; arrows under the fan; a label «دعوتك الحالية» / «مثال: …» |
| Axis / threshold | x; `swipeStep`: ≥ 64 px, or ≥ 28 px at ≥ 0.5 px/ms; RTL left = next |
| Feedback | `--fan-drag` CSS variable moves the top card while dragging |
| Cancel | Clears `--fan-drag`; no change |
| Keyboard / buttons | Arrow buttons with labels. Clicking the top card cycles |
| Reduced motion | Instant swap |
| Tests | Unit `swipeStep`. Browser: hero renders with no horizontal scroll at 390/768/1440 |

## 3. Guest invitation reveal: seal and envelope (B «مساء»)

| | |
|---|---|
| Surface | `SealCover.tsx` on `/i/:slug(/:code)` |
| Goal | Open the invitation in a comprehensible, tactile way, or jump straight to the date and RSVP |
| Affordance | A red wax seal (logomark) on a gold envelope, captioned «اسحب الختم ↑». Primary button «افتح الدعوة»; secondary «الموعد وتأكيد الحضور مباشرة» |
| Axis / threshold | y; `sealOpens`: lift ≥ 55 % of the 140 px travel, or ≥ 20 % with an upward flick ≤ −0.6 px/ms |
| Feedback | The seal follows the finger upward. On open, the flap clip-path opens (500 ms) and the card rises (760 ms, +140 ms delay); then the invitation engine plays |
| Bounds | Downward pulls never open |
| Cancel | Seal returns |
| Keyboard | The seal is a button: Enter/Space opens. The two buttons are ordinary buttons |
| Reduced motion | Opens immediately, no flap or rise |
| No forced wait | «الموعد وتأكيد الحضور مباشرة» skips the cinematic entirely and opens GuestHub with the RSVP form |
| Labels | Seal: «افتح الدعوة — اضغط على الختم أو اسحبه للأعلى» |
| Tests | Unit `sealOpens` (long lift, flick, nudge, downward). Browser: cover renders, single-name copy without «و/&», skip-to-RSVP → confirmed, button open, reduced-motion open (`signature-journey` 09, 10, couple cover, reduced motion) |

## 4. Phone editor sheet

| | |
|---|---|
| Surface | `InvitationEditor.tsx` below 960 px |
| Goal | Edit text while still seeing the live invitation; grow the panel for long forms |
| Affordance | A handle bar at the top of the panel. Tabs that need room (المناسبة، الشكل) open it fully |
| Snap points | `SHEET_HEIGHT` peek 22 % · half 56 % · full 92 % of the viewport |
| Axis / threshold | y via `usePointerGesture` on the handle only, so the form inside scrolls normally |
| Snap | `sheetSnapPoint`: nearest stop. A fling ≥ 0.55 px/ms moves exactly one stop in its direction |
| Feedback | The panel height follows the finger (`data-dragging` disables the transition) |
| Cancel | Restores the previous stop |
| Never dismisses | There is no closed state, so edits can't be lost by a gesture. Dirty state is shown in the top bar («تعديلات لم تُحفظ بعد») and autosave keeps running |
| Keyboard | Handle focused: ArrowUp/ArrowDown step stops. Enter/Space toggles half ↔ full (`detail === 0` click) |
| Focus | Focus stays on the handle; the form keeps its own focus order |
| Reduced motion | Instant height change |
| Labels | «لوحة التعديل: بالمنتصف. اسحب أو استخدم الأسهم للأعلى والأسفل», `aria-expanded` |
| Tests | Unit `sheetSnapPoint`. Browser (390): ArrowUp → full, ArrowDown ×2 → peek (`signature-journey` 05b) |

## 5. Stationery depth (tilt)

| | |
|---|---|
| Surface | Create step 2 live card preview (`SignatureCreatePreview.tsx`, `useTilt(7)`) |
| Goal | Make the card feel like paper |
| Conditions | Only `(hover: hover) and (pointer: fine)` and mouse/pen pointers; never touch; off in reduced motion |
| Range | ±7° rotateY, ±5.6° rotateX; glare follows the pointer |
| Static version | Flat card with its normal shadow |

## 6. Success moments

| | |
|---|---|
| Publish | `SealStamp` «نُشرت دعوتك»: 1.5 s, `pointer-events: none`, beside the real banner «دعوتك جاهزة للضيوف · أضف الضيوف». The state is already saved before the stamp shows |
| RSVP sent | Same stamp in GuestHub after the reply is stored |
| Arrival | Turquoise check tile + real counts («وصل 2 من 2») + «الضيف التالي» immediately; undo available («تراجع عن التسجيل»). No confetti over staff input |
| Reduced motion | The stamp appears and fades without rotation or scale |

## Not added (deliberately)

- **Spatial pan/zoom on seating.** The seating list and table cards are clearer. A canvas would hide basic tasks.
- **Studio page swipes.** The engine's own pagination buttons are kept. Swipes there would conflict with RSVP inputs.
- **Haptics or sound on gestures.** Neither is simulated where the browser does not provide it.
