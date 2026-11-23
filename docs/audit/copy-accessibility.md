# UX writing, language preference and accessibility audit

Date: 2026-11-21. Baseline: main bd6000a (contains v2/final).

## Baseline findings

| ID | Severity | Evidence | Impact |
| --- | --- | --- | --- |
| COPY-01 | P1 | `src/domain/account.ts` and `src/features/account/AccountPages.tsx` | Account only offered name/email/appearance; no language style selection. |
| COPY-02 | P1 | Creation, guest, template, workspace component text; `src/data/strings.js` | Arabic embedded in components; guest engine's strings were only bilingual AR/EN. No shared dictionary for Egyptian/Saudi. |
| COPY-03 | P1 | `src/features/guests/share.ts` | Outgoing messages were fixed modern Arabic regardless of account preference. |
| COPY-04 | P1 | `src/studio/markup.js`, `src/studio/Studio.js`, `src/pages/index.js` | Arabic guest experience used English accessible labels for core controls. |
| COPY-05 | P2 | `src/data/strings.js` | RSVP submit described envelope animation (“اختم وأرسل”), hiding the actual action. |
| COPY-06 | P2 | `src/pages/index.js` | “عدد الضيوف” did not clearly explain whether the person replying was counted. |
| COPY-07 | P2 | `src/features/guests/GuestsPage.tsx` | Some constructed strings bypassed existing Arabic plural helpers. |
| COPY-08 | P2 | `src/features/signature/signature.css` | One-time gesture hint animated indefinitely until interaction. |

## Implemented in this upgrade

- Typed `Dialect`, complete default dictionary and explicit Egyptian/Saudi overrides in `src/domain/copy.ts`. Unknown stored values fall back to modern Arabic.
- Reactive, independent language preference shared by `src/data/copy-preference.js` and `src/ui/copy.tsx`: `useCopy()` exposes `dialect`, `setDialect`, `t(key)`, `copy`. `currentDialect()` supports outgoing message builders. Cross-tab changes update the visible interface.
- Account has an immediate language selector, prototype role selector, appearance and audio library. Preference is not part of the demo profile object, so logging out or saving a name cannot overwrite it.
- Major creation, template, guest, delivery and account actions consume the shared dictionary through their feature owners. Outgoing invitation/reminder messages use the selected voice.
- Guest cinematic controls have Arabic accessible labels, including dynamic page and sound actions. RSVP task label is “تأكيد الرد”, with dialect variants.
- Attendance total is “إجمالي الحاضرين” with “يشملك أنت والمرافقين”. Declining hides both count and hint.
- Existing form labels, validation associations, native dialog focus handling, visible gesture alternatives and reduced-motion springs are preserved.

## Editorial decisions

Keep names, entered invitation message, program, guest names and event titles unchanged when switching interface language. Tone is localized; actions and data semantics remain stable. Use “التصميم / الخلفية / الحركة / الصوت” rather than renderer terminology. Modern Arabic remains the fallback for low-frequency explanatory text and technical/legal service notes; this is a three-voice interface, not three complete translations of every product paragraph.

The guest engine reads this device's preference when controls are rendered. Public links opened on another device default to modern Arabic; voice preference is not embedded into user-authored invitation content.

## Acceptance and verification

1. Fresh browser defaults to العربية المودرن. Egyptian and Saudi visibly change creation/task actions and outgoing messages.
2. Selection applies without reload, survives reload/navigation and remains after profile save/logout.
3. Invalid preference storage falls back to modern Arabic; blocked storage still permits in-session preference.
4. Names and authored invitation content remain unchanged.
5. Keyboard users can operate the language/role selects, template navigation and dialogs; Arabic labels describe guest controls.
6. `prefers-reduced-motion` preserves functional controls and removes automatic bounce motion.
7. Focused smoke checks passed for modern/Egyptian/Saudi engine labels, invalid/blocked storage, independent account state and quota-write fallback shared between React and engine. Repository typecheck passed after the feature owners finished their first integration.
8. Full repository typecheck, unit/DOM/browser gates are reported by the integrating agent; no claim of complete accessibility certification is made from code inspection.
