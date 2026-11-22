# Account audio and invitation sound

## Audit

The account originally had profile, appearance and a demo session only (`AccountPages.tsx`). The editor's sound switch affected only the current preview (`MotionSection` in `sections.tsx`), and invitation data had no persistent audio choice. The existing engine already unlocked sound after a gesture and exposed a mute button; that behavior is retained.

## Implemented

- Account audio library: upload, optional display name, native preview, delete, account default, and revert to built-in sound.
- Maximum three local tracks of 300 KiB each. Supported MIME types are MPEG/MP3, WAV, OGG, MP4/M4A and audio WebM. Empty, oversized, unsupported or unplayable uploads produce useful errors. Browser metadata validation happens before saving.
- Bounded, validated browser persistence under a separate account preference key. Failed storage writes leave existing tracks intact and show a recovery message. Reloads and cross-tab changes refresh the list.
- The editor offers one selector: account default, a saved track, or no sound. Choices persist with invitation drafts and publication snapshots. The preview mute switch remains separate.
- `toInvitationData` carries the resolved choice to live preview and guest Studio. A custom soundtrack loops while invitation pages are open and uses the engine's master gain; muting stops it. A decode completing after mute cannot start delayed playback. No-sound suppresses cues, music and scene ambience and hides the guest sound toggle.
- Missing/deleted tracks safely use built-in sound. The sound button explains when an uploaded track is unavailable on this device.

## Round 4 (r4-audio): bigger uploads, start point, voice welcome

- **Storage split.** Metadata (name, kind, start, fade, duration) stays in localStorage (`doyofy:audio-library:v2`); bytes go through `AudioStore` (`src/domain/audio-store.ts`: `put(blob) → id`, `get(id) → Blob|null`, `delete(id)`, `scope`). IndexedDB backs it now (bytes stored as ArrayBuffer + type for older Safari); an HTTP/blob store can replace it via `setAudioStore()` without touching the library, editor or engine. v1 inline tracks migrate on first mount under the same ids; a store failure keeps v1 playing and retries.
- **Limits.** 8 MB per track, 5 tracks (music + voice), voice ≤ 60 s. Type (with extension fallback and codec parameters), size and Web Audio decode are validated; errors are dictionary keys (`audioErr*`).
- **Start point.** After upload the file is decoded (OfflineAudioContext at 8 kHz, peaks only) into a waveform; a native range is the start handle over a `dir="ltr"` timeline labelled «الزمن →», with the highlighted 30-second window and play/stop preview from the start (optional 1.5 s fade-in). Saved tracks can be re-trimmed. The engine starts at `startSec` with the fade and loops the remainder back to `startSec` (`playbackPlan`); the start is clamped so ≥ 10 s remain.
- **Voice welcome.** MediaRecorder with level meter and timer, auto-stop at 60 s, listen back, re-record, save as `kind: 'voice'`. Missing MediaRecorder or a refused/missing microphone shows a clear Arabic message. `vercel.json` Permissions-Policy is now `microphone=(self)`. In the invitation the voice plays once as the pages open, ducks music and ambience, and has its own replay/stop control (hidden when the bytes are not on the device). Muting stops it.
- **Editor.** One choice — none / built-in / my music (+ track) — and an optional voice switch. `audio.mode` gained `builtin`; resolution never leaves `default`, so a link's built-in choice cannot re-resolve to another device's default. The device-only line appears in the account and when an upload is chosen in the editor; guests elsewhere get the built-in sound and no voice, silently.
- **Tests.** Unit: store contract on fake-indexeddb and in-memory, migration, limits, trim math, peaks, engine offset/fade/loop/ducking/fallback. DOM (`tests/audio-dom.mjs`): upload → trim → save → editor select; recorder fallback and record → save → voice switch. Browser (`tests/upgrade-workflows.mjs` 03/03b): a 40 s WAV (625 KB) trimmed to 0:12 and stored in IndexedDB; Chromium fake microphone recording reaching the preview engine.

## Prototype boundary

Uploaded bytes stay in the current browser. Shared links carry a track reference and name, **not audio bytes**. The account and editor state this clearly. A hosted audio file store, account ownership rules, deletion handling, and a public signed/controlled media URL must be connected before uploaded audio can play on other guests' devices. No remote upload or cross-device soundtrack transfer is claimed.

## Validation

- TypeScript check passed during integration.
- Nine targeted audio tests passed: size/type limits, corrupt storage and deduplication, default/off/reference resolution, persisted soundtrack/silence after service reconstruction, failed cue fallback, no-sound suppression, missing upload fallback, looping custom playback with master gain/mute, and mute-before-decode cancellation.
- Full unit suite: 102/102. TypeScript and browser-runner syntax checks passed.
- Production build passed.
- CI confirmed valid WAV metadata and preview media playback. The reload check initially used an async `waitForFunction` predicate; the installed Playwright poller treats the returned Promise as truthy before its boolean resolves, so the test reloaded before the editor's 650 ms autosave. Service reconstruction and a React editor unmount/remount both retained the selection. The corrected runner polls durable browser storage, the control and visible saved status synchronously, then awaits and asserts the service value separately. After reload it requires the exact restored choice. All async predicates were removed from the new acceptance runner, including its capacity check. The tested commit and latest CI result are recorded in [PR #5](https://github.com/KareemQabil/doyofy-studio/pull/5). The engine playback lifecycle is also tested with a controlled audio context, which is not evidence of hardware speaker output.

## Browser acceptance path

1. Open `/app/account`, add a short valid audio file and verify its native preview.
2. Reload; verify the track and account default remain. Unsupported/oversized uploads must not mutate the library.
3. Open an invitation editor with `?section=motion`, select the saved track, enable preview sound, open the full preview, then tap through to invitation pages. Verify the selected track plays only after interaction and that mute immediately stops it.
4. Publish and open its personal guest link in the same browser; verify selected audio remains available. Open the link in a clean browser: invitation and RSVP must work with the built-in sound fallback.
5. Select no sound, publish and reopen; no cues/music/ambience should play and the guest sound toggle should be absent.
6. Delete the account track, then reopen a design that referred to it; built-in sound must be usable without a broken player.
