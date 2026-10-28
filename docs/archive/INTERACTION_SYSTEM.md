# Current override — final polish, 10 October 2026

This section supersedes the historical descriptions below. The historical QA table belongs to the previous checkpoint, not this version.

- The direct visual catalogue is the default. Its 13 radios use one Tab stop, RTL arrow selection, Home/End, checked state, search and categories. Old choosers remain review options.
- The gallery initially shows six actual templates; Show more reveals the rest. Posters are loaded near the viewport, cached with a bounded cache, and do not mount a WebGL studio. Preview applies nothing until confirmed.
- Desktop editor starts its real preview at the card. Text/card/scene update in place; changing experience, sound or retry rebuilds the studio. Explicit replay remains available. Phone editing uses a still poster; live preview mounts only in preview mode.
- Autosaves are serialized. A revision is clean only after its snapshot is saved; rapid edits coalesce to the latest. Closing, template change and guest preview flush the queue. Errors stay inline with retry. Publishing waits for draft saving and blocks while event details are unsaved.
- After publish a success banner links to guests. Published state has a useful “إلى الضيوف” action. Event data still has its own explicit save.
- Guest list and replies share view tabs. Advanced filters remain available; URL search survives filtering/drawer navigation. Delivery, reply and arrival remain distinct.
- Opening WhatsApp or copying a link asks for manual confirmation and does not change delivery. Simulation controls are secondary and explicitly labelled.
- A child edit/reply/delete dialog replaces the guest drawer; it does not stack on it. Cleanup closes a removed dialog, removes scroll lock only when no open dialog remains, and restores connected prior focus. Dangerous confirmation focuses cancel.
- Familiar headers can skip the import mapping screen; “تعديل الأعمدة” restores it. Review and duplicate decisions always precede mutation.
- Guest date/RSVP shortcut works without cinematic playback. General replies explicitly await matching and have no premature personal QR promise.
- Reception statistics appear on event day / after or when arrivals already exist; otherwise preparation leads. Partial arrivals are counted by people, not fully arrived invitation rows.
- Existing reduced-motion tokens, visible focus, mobile safe areas, native choices and inline feedback are retained. No claim of fresh visual/device verification: see `PROTOTYPE_STATUS.md`.

---

# Interaction system

*Motion and feedback rules for the organizer product (the invitation keeps its own cinematic motion).*

Every interaction answers one of these questions:
- Did the system notice my action?
- What changed?
- What is selected?
- Where did this come from or go?
- What should I do next?

If an animation answers none of them, it is removed.

## Timing and easing (tokens)

| Token | Value | Use |
|---|---|---|
| `--dur-instant` | 100 ms | press acknowledgement |
| `--dur-fast` | 160 ms | hover, focus, small state |
| `--dur` | 220 ms | component transitions, indicator moves, check marks |
| `--dur-slow` | 280 ms | sheets, dialogs, drawers |
| `--dur-layout` | 360 ms | carousel settle (coverflow scale/opacity) |
| `--ease-out` | `cubic-bezier(.22,.8,.24,1)` | entering, settling |
| `--ease-in-out` | `cubic-bezier(.65,0,.35,1)` | colour/state changes |

`prefers-reduced-motion` sets every duration to 0 and turns off press-scaling and hover zoom (`--press-scale: 1`, `--hover-zoom: 1`). The coverflow drops its scaling and smooth scrolling, and template posters never animate.

## State ladder (the same everywhere)

| State | Treatment |
|---|---|
| Default | Calm. No hover animation on surfaces that aren't interactive. |
| Hover (fine pointers only) | Art zooms inside its clipped frame (×1.025), or a tonal background shift; template posters fade in an «معاينة» pill and their setting starts moving. The grid never moves. |
| Focus | Two rings: a 2 px surface gap and a 2 px ink outline (`--c-focus`). Always **clearer than hover**, and visible in both themes and on dark gate screens. |
| Pressed | 0.98 scale plus a darker tone (`--c-primary-pressed`). Never combined with shadow jumps. |
| Selected | Stronger than hover: a ring in `--c-selected` **and** a check badge that scales in (0.6 → 1, 220 ms). Never colour alone. |
| Disabled | 50 % opacity, no pointer feedback. |
| Loading | Inline spinner in the button; layout is kept. Skeletons for known layouts. |

## Priority surfaces

### Occasion chooser — A · Coverflow
- **Native horizontal scrolling with `scroll-snap`:** the browser's own momentum, so it is never hard to stop and always lands centred on a card. Swipe, trackpad and shift+wheel work. There is no scroll-jacking: vertical wheel is not converted.
- The focused card is full size; neighbours are at 0.86 scale and 50–78 % opacity. There is no rotation and no autoplay.
- Arrows sit beside the position counter («3 / 13 — group»), not on top of the art. A dots row shows progress.
- Keyboard: the track is a `listbox` with `aria-activedescendant`. RTL ← moves to the next occasion, → to the previous; Home and End jump to the ends; Enter confirms.
- Tapping a side card brings it to the centre. Tapping the centred card confirms.
- The focused card **is** the selection: ring plus check, and the footer reads «اخترت: …».

### Occasion chooser — B · Editorial Rail
- Native horizontal scrolling with proximity snap. Cards are radios: a ring plus check when selected.
- «عرض كل المناسبات» opens the grouped gallery: a modal on desktop, a bottom sheet on phones (280 ms).
- Choosing in the gallery closes it and returns focus to the chosen card on the rail. If the occasion wasn't on the rail, it is placed first, so the choice stays visible in context.

### Template gallery
- Posters zoom inside their frame on hover, and the paused setting comes alive (petals float, candles flicker). This happens only with a fine pointer and motion allowed.
- A tile opens the **preview dialog**. Focus is trapped (native `<dialog>`); Escape and «رجوع» close it. The gallery's scroll position is untouched because the dialog sits on top of the page.
- In the preview, ←/→ step through the templates in the gallery's order, and the live invitation plays its real opening. «أعد العرض» replays it on request.
- «استخدم هذا القالب» shows a spinner while saving, then opens the editor. It is committed but reversible: «تغيير القالب» in the editor comes back here, and texts are never lost.

### Editor
- **Live preview:** text edits update the invitation **in place** (220 ms debounce) without replaying the opening. Card and setting swap in place. Only an experience change (2D/3D, animated/static) rebuilds the preview, as the engine requires.
- **Autosave:** «تعديلات لم تُحفظ بعد» → «جارٍ الحفظ…» → «تم الحفظ», shown inline in the bar. There are no toasts for routine saves; a failed save shows «تعذر الحفظ» with a retry button.
- **Publish state:**
  - shown as a dot and label: «مسودة لم تُنشر» (amber), «منشورة» (green), «منشورة · تعديلات غير منشورة» (teal);
  - the publish button says what it will do: «انشر الدعوة» or «انشر التعديلات»;
  - when everything is published it reads «منشورة» and is disabled.
- **Sections** are tabs with a moving indicator. Switching is instant, with a 220 ms fade-in of the panel. The URL keeps the section (`?section=`) when going to the guest preview and back.
- **Event data:** a separate, explicit save («احفظ بيانات المناسبة»). The preview shows edits instantly, before they are saved. The save row sticks to the bottom of the panel, so it is always reachable. An inline «تم الحفظ» confirms the save.
- **Phone:**
  - preview-first: «تعديل» shows an instant poster of the invitation above a bottom sheet;
  - the sheet has a drag handle and two snap points (half, full). A tap toggles; a drag of 48 px or more snaps. It **never closes by accident**;
  - «معاينة» hides the sheet and plays the real invitation full height. «كضيف» opens the full guest preview;
  - the publish button sits in the bottom dock.
- **Preview as guest:** a full-screen page whose top bar reads «معاينة — هكذا يراها الضيف. لن يُسجل أي رد.» «إغلاق المعاينة» returns to the same editor section.

## Feedback channel

Inline first: saved state in the bar, «تم الحفظ» next to the event save, the selection check, «اخترت: …» in the footer. Toasts are only for cross-page outcomes (published → «أضف الضيوف») and failures.

## QA of the interaction states (this iteration)

Checked by the scripted walkthrough and screenshots on desktop (1366/1440) and phone (390), in both themes:

| State | Coverflow | Rail + sheet | Gallery | Preview | Editor |
|---|---|---|---|---|---|
| hover / press | ✓ | ✓ | ✓ | n/a | ✓ |
| focus (keyboard) | ✓ listbox + arrows | ✓ radios | ✓ tiles | ✓ trapped | ✓ tabs |
| selected | ✓ ring + check | ✓ ring + check | ✓ current template ring + label | n/a | ✓ ring + check |
| loading | n/a | n/a | ✓ poster skeleton | ✓ spinner on use | ✓ saving |
| success | ✓ footer | ✓ footer | n/a | ✓ → editor | ✓ saved / published |
| error | n/a | n/a | ✓ banner | ✓ banner | ✓ retry, publish banner |
| reduced motion | ✓ no scale/smooth | ✓ | ✓ no hover motion | ✓ | ✓ |

Not verified on real devices yet: swipe feel on iOS Safari, momentum on Android Chrome, and the drag handle with real thumbs.
