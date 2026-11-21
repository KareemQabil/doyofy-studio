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

## Prototype boundary

Uploaded bytes stay in the current browser. Shared links carry a track reference and name, **not audio bytes**. The account and editor state this clearly. A hosted audio file store, account ownership rules, deletion handling, and a public signed/controlled media URL must be connected before uploaded audio can play on other guests' devices. No remote upload or cross-device soundtrack transfer is claimed.

## Validation

- TypeScript check passed during integration.
- Eight targeted audio tests passed: size/type limits, corrupt storage and deduplication, default/off/reference resolution, failed cue fallback, no-sound suppression, missing upload fallback, looping custom playback with master gain/mute, and mute-before-decode cancellation.
- Full unit run at this point: 90/91. The single failure is the separately changing guest quota test (`general link replies wait for matching`), reported to the integration owner.
- Production build passed.
- Real browser playback remains a manual/CI acceptance check because local Chromium launch is blocked by this executor. The engine playback lifecycle is tested with a controlled audio context, which is not evidence of hardware playback.

## Browser acceptance path

1. Open `/app/account`, add a short valid audio file and verify its native preview.
2. Reload; verify the track and account default remain. Unsupported/oversized uploads must not mutate the library.
3. Open an invitation editor with `?section=motion`, select the saved track, enable preview sound, open the full preview, then tap through to invitation pages. Verify the selected track plays only after interaction and that mute immediately stops it.
4. Publish and open its personal guest link in the same browser; verify selected audio remains available. Open the link in a clean browser: invitation and RSVP must work with the built-in sound fallback.
5. Select no sound, publish and reopen; no cues/music/ambience should play and the guest sound toggle should be absent.
6. Delete the account track, then reopen a design that referred to it; built-in sound must be usable without a broken player.
