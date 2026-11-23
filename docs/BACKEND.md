# Backend (Vercel Functions + Vercel Blob)

A small real backend for the static SPA. It does three things:

1. **Short guest links.** `/i/<slug>/<code>` instead of the ~3 KB `?d=` payload.
2. **Replies reach the organizer.** A guest's reply, sent from any device, arrives on the organizer's device and counts like any other reply: the replies page, the counts, seating and check-in all see it.
3. **Your sounds play for guests.** Uploaded music and the recorded voice welcome play on guests' devices.

The backend starts **off**. It switches itself on once a Blob store is connected to the project, because that is what sets `BLOB_READ_WRITE_TOKEN`. While it is off, everything works as before: links are portable `?d=` links, a guest's reply stays on the guest's device (with the honest demo note), and uploads play only on the organizer's device (with the «يعمل على هذا الجهاز فقط» line).

## Turn it on (owner, in Vercel, about 2 minutes)

1. Open the project **doyofy-studio-laf2** in the Vercel dashboard → **Storage** → **Create Database** → **Blob** → **Continue**.
2. Name the store (for example `doyofy-blob`) and choose **Public** access. Uploaded audio is served from its public URL. Data files are not guessable; see Privacy below.
3. **Connect** the store to `doyofy-studio-laf2` with **all environments** ticked (Production, Preview, Development). Vercel then adds `BLOB_READ_WRITE_TOKEN` to the project.
4. **Redeploy** the latest deployment: Deployments → … → Redeploy. Environment variables only reach new deployments.

**Verify:** open `https://<your domain>/api/health`. You should see `{"backend":true}`. If you see `{"backend":false}`, the token has not reached this deployment yet: check step 3 and redeploy. Then open the app, go to a guest's drawer and wait a moment: the personal link should look like `…/i/noura-faisal-k3x9qa/66WYZ` with no `?d=`.

Optional: setting `DOYOFY_PATH_SECRET` (any long random string) keys the data paths independently of the Blob token, so rotating the token later does not orphan existing data. Set it **before** the first use. Changing it later has the same effect as rotating the token.

## How it fits together

| Piece | Where |
| --- | --- |
| One Vercel Function, Node runtime, Web `Request → Response` | `api/router.ts` |
| Rewrites `/api/<route>` → `/api/router?route=<route>`, listed before the SPA rewrites | `vercel.json` |
| Organizer device sync (snapshot push, reply pull, audio upload) | `src/services/cloud/sync.ts` |
| Public snapshot and reply merge into the mock store | `src/services/mock/cloud-bridge.ts` |
| Guest side: local store first, then the backend | `src/services/cloud/guest.ts` |
| `CloudService` contract (short paths, on/off) | `src/services/contracts.ts` |
| Local dev server: real handlers, in-memory storage | `tools/dev-api.mjs` |

The organizer's local store (the mock) stays the source of truth. The backend holds a public copy of each event and the guests' replies.

- On start, the app asks `GET /api/health`. On a static host the SPA's `index.html` comes back, which also means off.
- While the backend is on and the organizer's app is open, every change to an event sends its snapshot. Changes are debounced, and an unchanged event is never re-sent.
- Every 20 s, on window focus and when the tab becomes visible again, the app pulls new replies and merges them.
- A link is short only after that event, and that guest, reached the backend. A guest added a second ago keeps the portable link until the next sync.

### API

| Method & path | Auth | What |
| --- | --- | --- |
| `GET /api/health` | none | `{ backend: true \| false }` |
| `PUT /api/events/:slug` | owner key | Stores the public snapshot. The first write registers the key. |
| `GET /api/invite/:slug/:code` | none (the code is the capability) | The guest view for that code, including their latest reply |
| `GET /api/invite/:slug[?reply=<id>]` | none | The general-link view, plus this device's own reply when its id is given |
| `POST /api/replies/:slug/:code` | none | A personal reply. The latest one wins. |
| `POST /api/replies/:slug` | none | A general-link reply with a name. `replaces: <id>` corrects the earlier one. |
| `GET /api/replies/:slug?since=<cursor>` | owner key | New replies for the organizer's device, plus the next cursor |
| `POST /api/upload` | owner key | Vercel Blob client-upload token for `a/<slug>/<file>`: audio types only, 8 MB max |
| `DELETE /api/upload` | owner key | Removes one uploaded audio file of that event |

**Owner key.** A random 256-bit secret is generated on the organizer's device and kept in `localStorage` under `doyofy:cloud:v1`. The device sends it as `Authorization: Bearer …`, and the server stores only its SHA-256. A different key gets `401`. If the organizer clears this browser's storage, the device takes new public slugs, and links sent earlier stop updating.

**Public slug.** The event's local slug plus 6 random characters, for example `noura-faisal-k3x9qa`. Two organizers never collide, and nobody can claim a slug ahead of time. A prototype reset (a new demo seed) starts fresh slugs.

### Data model (Blob pathnames)

`k` = the first 32 hex characters of HMAC-SHA-256(secret, slug), where the secret is `DOYOFY_PATH_SECRET` if set, otherwise the Blob token.

```
e/<k>/owner.json                     { hash: sha256(owner key), at }        written once (allowOverwrite: false)
e/<k>/s/<epoch-ms>-<rand>.json       the event snapshot; the newest wins, the last 2 are kept
e/<k>/r/c-<CODE>/<epoch-ms>-<rand>.json      a personal reply; the newest wins, older ones are deleted
e/<k>/r/g-<replyId>/<epoch-ms>-<rand>.json   a general-link reply (the id is 20 random characters)
a/<slug>/<trackId>-<random>.<ext>    uploaded audio (public, immutable, 1-year cache)
```

Objects are never overwritten. Every write is a new pathname, and readers take the newest from a listing, so the Blob CDN can never serve a stale snapshot or reply.

**Snapshot:**

- `event`: id, public slug, type, title, names, date, time, time zone, duration, venue.
- `startsAt` / `endsAt`.
- `design`: the latest saved design, including the sound choice. When uploaded, it also carries `trackUrl`, `trackStart`, `trackFade` and `voiceUrl`.
- `dialect`: the organizer's voice.
- `experience`: the active meal options, the dietary question and the wishlist.
- `general`: `{ allowed, maxGuests }`.
- `guests[]`: `{ code, name, max, status, count?, companions?, note?, meals?, dietary?, table? (only when tables are revealed), checkedIn?, at? }`.
- `archived?`.

The guests' digits follow the card face, so they come with `cardId`.

**Reply:** `{ id, code | null, name, attending, count, companionNames?, note?, meals?, dietary?, experienceRevision?, at (server time) }`.

## Privacy

- The snapshot never contains phone numbers, organizer notes, sections (`side`), delivery history, other guests' data or account data. The client builds it field by field (`eventSnapshot`), and the server rebuilds the same whitelist again (`readSnapshot`). Anything else the client sends is dropped. Tests check both sides.
- A guest's view contains only that guest's entry. A general-link view contains no guest entries.
- Data pathnames are HMACs keyed by a server secret, and data URLs are never returned. Knowing the public store host (from an audio URL) does not reveal where any event's data lives. Listing needs the token.
- No secret is ever sent in a response. No CORS headers are sent, so other sites cannot read the API, and writes a browser marks as cross-site are refused (`403`).
- Inputs are JSON only (`415` otherwise) with size caps: snapshot 512 KB, reply 16 KB, 2000 guests.
  - Every field is validated, with string lengths, integer ranges, the allowance (1…max when attending, 0 when not), active meal options only, known dietary needs only, and companions capped at the party size.
  - Replies close at the event's start (`409`).
  - A naive per-instance rate limit applies: 12 replies per code, or per IP on the general link, in 10 minutes (`429`).
- Audio: only `audio/*` types, at most 8 MB, only under the event's own `a/<slug>/` path and only with the owner key. The guest's engine fetches only URLs on `*.public.blob.vercel-storage.com`. Deleting a track in the account also deletes the uploaded copy.

### CSP (vercel.json)

The policy is unchanged except for:

- `connect-src`: adds `https://*.public.blob.vercel-storage.com` (the engine fetches audio bytes) and `https://vercel.com` (the Blob client-upload API, `vercel.com/api/blob`).
- `media-src`: adds `https://*.public.blob.vercel-storage.com`.

A wildcard host-source (`https://*.example.com`) is valid CSP syntax.

## Running it locally

```
npm run build
node tools/dev-api.mjs 4841     # dist/ + the real handlers over in-memory storage → http://localhost:4841
node tests/backend-e2e.mjs      # organizer syncs → fresh guest opens the short link → replies → organizer sees it
```

Audio upload answers `501` on the dev server, because it needs Vercel Blob's client-upload handshake. Unit tests (`tests/unit/backend.test.ts`) cover the handlers against the in-memory storage: owner key, privacy, reply validation, cursors, upload checks, the merge, the sync loop and the fallbacks.

## Limits and notes

- This is a prototype backend. There are no accounts: the owner key is the organizer's identity, per device. A second organizer device would get its own slugs. Moving the key to another device is a later step.
- Opened/delivered status from guests' devices is not reported back yet. Only replies are.
- The rate limit lives in memory per function instance, as a courtesy against accidents, not a security boundary.
- If the project ever connects Blob through OIDC only (`BLOB_STORE_ID` without `BLOB_READ_WRITE_TOKEN`), the backend stays off. Add a read-write token, or adapt `fromEnv()` in `api/router.ts` together with `DOYOFY_PATH_SECRET`.
