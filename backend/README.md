# Doyofy backend: prepared, not provisioned

**Status (10 October 2026):** the schema, RPCs, policies and a client adapter are prepared and tested locally. **No cloud resources exist.** No Supabase project has been created, no migration has been applied anywhere, and nothing has been deployed to Vercel. The owner decided: *prepare the backend, create nothing*.

Facts found during this pass:
- The connected Supabase organisation contains **no Doyofy project**. The only projects visible are unrelated "rafayea" projects in another person's organisation. Do not use them.
- The connected Vercel account **does not contain `doyofy-studio`**.

The app still runs on the browser-local mock (`src/services/mock`). `src/services/index.ts` was not changed.

## Architecture decision

| Layer | Choice | Why |
|---|---|---|
| Frontend | The existing static SPA (`npm run build` → `dist/`), hosted on **Vercel** with the SPA rewrites already in `vercel.json` | No server rendering is needed. The guest page and the organizer app share one bundle. |
| Data | **Supabase Postgres** with **Row Level Security** on every table | Gives per-owner/member isolation in the database itself, not in client code. |
| Server logic | **SECURITY DEFINER RPC functions** (PostgREST `/rest/v1/rpc/*`) | Everything that must be server-authoritative: guest RSVP, the edit window, allowances, publish snapshots, check-in idempotency and exception re-checks, auditable undo, matching, import. |
| Guest path | Anonymous. The guest only ever calls `get_public_invitation`, `submit_rsvp` and `submit_general_rsvp`, using the anon key | `anon` has **no table privileges**. Phones and other parties are never returned. |
| Client | `src/services/remote/*`: a ~800-line fetch adapter behind the **existing** `services/contracts.ts` interfaces | No SDK, because the npm registry is unreachable in the build sandbox. Feature code doesn't change. |
| Auth | **Supabase Auth** with one-time codes (see [Auth provider](#auth-provider)) | `auth.uid()` drives RLS. |
| Messaging | **Not built.** A WhatsApp Business provider needs a server webhook (Supabase Edge Function) | See `review/PRODUCTION_GAP_MATRIX.md`. The adapter refuses automatic sending honestly. |

The previous docs said a "NestJS API client" would replace the mock (`services/index.ts`, `PRODUCT_MODEL.md`). This pass recommends Supabase instead because it removes a custom server for the MVP. The contracts are unchanged either way.

### Files

```
backend/supabase/migrations/0001_doyofy_init.sql   schema, constraints, indexes, RLS (commented), RPCs, grants
backend/supabase/tests/00_supabase_stubs.sql        LOCAL ONLY stand-ins for auth.uid(), roles, extensions
backend/supabase/tests/01_smoke.sql                 LOCAL ONLY smoke test (RLS, grants, RPC rules)
backend/supabase/tests/02_/03_concurrency*.sql      LOCAL ONLY two-session race fixtures
backend/supabase/tests/run_local.sh                 throwaway Postgres → stubs → migration → smoke + race
src/services/remote/                                createRemoteServices(config), REST/RPC client, auth helper, mappers, error map
tests/unit/remote.test.ts                           mocked-fetch contract tests (not integration tests)
.env.example                                        variable names only
```

### Data model (matches `src/domain/types.ts`)

| Table | Domain | Notes |
|---|---|---|
| `events` | `Event` | `slug` is globally unique (`/i/<slug>`). `settings` are flattened into columns. The phase is derived; `archived_at` is stored. |
| `event_members` | roles | `organizer` / `coordinator` per event. The owner is auto-inserted as organizer. |
| `invitation_designs` | `InvitationDesign` | `draft` jsonb with `draft_revision` (optimistic concurrency), and the `published` snapshot. |
| `invitation_design_versions` | (new) | Immutable copy of every publish. |
| `parties` | `InvitationParty` | The server generates the code: 6 characters, unambiguous alphabet. RSVP, delivery-opened and check-in columns can't be updated from the client (column grants). |
| `rsvp_responses` | `RSVPResponse` | General-link matching state is enforced by CHECK constraints: waiting → matched / added / dismissed. |
| `seating_tables` | `Table` | A composite FK keeps a party's table inside the same event. |
| `check_ins` | `CheckInRecord` | `idempotency_key` is unique per event. Undo stamps `undone_at` / `undone_by` / `undo_reason` and never deletes. The rows are append-only for clients. |
| `event_activity` | `EventActivity` | Written only by triggers and RPCs. |
| `doyofy_private.rate_limits` | (new) | Hashed caller keys for the guest path. Not exposed. |

### RPC surface

| Function | Who | Enforces |
|---|---|---|
| `get_public_invitation(slug, code?)` | anon | unknown/archived → `not_found:unknown_event`; never published → `not_published`; wrong code → `not_found:unknown_code` (counted); general link off → `not_found:personal_only`; records "opened" |
| `submit_rsvp(slug, code, attending, count, companions?, note?)` | anon | allowance 1..`max_party_size`; edit window (until the event starts); archived/unpublished; row lock |
| `submit_general_rsvp(slug, name, attending, count, note?)` | anon | `allow_general_link`; `default_party_size`; at most 500 waiting replies per event |
| `save_invitation_draft(event, content, base_revision?)` | member | shape check, size cap, stale revision → 409 |
| `publish_invitation(event, expected_revision?)` | member | atomic draft→published copy plus a version row |
| `check_in_party(event?, party, count, idempotency_key, method, exceptions, note, by)` | member | replay-safe; **re-assesses exceptions on the locked row**; unacknowledged blocking exception → 409; returns server counts |
| `undo_check_in(check_in_id, reason?)` | member | auditable; double undo → 409 |
| `set_rsvp_by_organizer`, `mark_parties_shared`, `import_parties`, `match_rsvp_response`, `add_party_from_response`, `dismiss_rsvp_response` | member | see the comments in the SQL |
| `export_event_data(event)`, `anonymise_event_guests(event)` | organizer | portability and post-event data minimisation |
| `doyofy_health()` | anon | uptime probe |

Public RPCs return `{ok:false, code, reason, status}` instead of raising, so the rate-limit counters written in the same transaction are committed. Organizer RPCs raise `PT<status>` with `MESSAGE = reason` and `HINT = ErrorCode`. `src/services/remote/remoteErrors.ts` maps both forms to `AppError` with Arabic text.

## Setup steps (when the owner decides to provision)

1. **Create a Supabase project** in the owner's own organisation, not the rafayea organisation.
   - Choose the region deliberately (data residency; see the privacy note in the gap matrix).
   - Save the database password in a password manager.
2. **Apply the migration**, either way:
   - SQL editor: paste `backend/supabase/migrations/0001_doyofy_init.sql` and run it once.
   - Or with the CLI: `supabase link --project-ref <ref>` then `supabase db push`. Copy the folder to `supabase/migrations/` first, or run the CLI from `backend/`.
3. **API settings:**
   - Confirm `public` is the only exposed schema. `doyofy_private` must **not** be exposed.
   - Keep the default max rows (1000). Note that `parties` lists over 1000 need pagination (see the gap matrix).
4. **Auth** (Authentication → Providers):
   - Enable the chosen provider (below).
   - Set the Site URL to the production origin, and add the Vercel preview origins to the redirect allow-list.
   - Disable anonymous sign-ins: guests don't need accounts.
5. **Get the public values** from Project Settings → API: the project URL and the anon (or publishable) key. **Never** use the service-role / `sb_secret_` key in the frontend; `validateRemoteConfig` throws if you try.
6. **Build-time config.** The values are injected at build, and nothing reads them yet. To switch, make these changes (not applied in this pass):
   - `tools/build.mjs`, in `define`:
     ```js
     '__DOYOFY_SUPABASE_URL__': JSON.stringify(process.env.DOYOFY_SUPABASE_URL || ''),
     '__DOYOFY_SUPABASE_ANON_KEY__': JSON.stringify(process.env.DOYOFY_SUPABASE_ANON_KEY || ''),
     ```
   - `src/services/index.ts`:
     ```ts
     declare const __DOYOFY_SUPABASE_URL__: string, __DOYOFY_SUPABASE_ANON_KEY__: string;
     const remote = remoteConfigFromEnv({ DOYOFY_SUPABASE_URL: __DOYOFY_SUPABASE_URL__, DOYOFY_SUPABASE_ANON_KEY: __DOYOFY_SUPABASE_ANON_KEY__ });
     // if (remote) services = createRemoteServices({ ...remote, getAccessToken, currentUser });
     ```
     When the values are empty, the mock stays.
   - `createServices()` also returns `PrototypeControls` (latency, offline, scenario reset), which have no meaning against a real backend. Remote mode needs a no-op implementation, and the review tools must stay hidden (UI owner).
   - Set `DOYOFY_SUPABASE_URL` and `DOYOFY_SUPABASE_ANON_KEY` in Vercel → Project → Environment Variables, separately for Preview and Production. Use a separate Supabase project for preview data if real guests will be invited.
7. **Vercel:** import the repository as a new project. Leave the framework as "Other"; `vercel.json` already sets the build command (`npm run build`), the output (`dist`) and the SPA rewrites for `/app`, `/i`, `/check-in` and `/prototype`. Add the headers below with the first preview deploy, and verify them there.

### Proposed `vercel.json` headers (not applied — verify on a preview deploy first)

`app.js`, `styles.css` and `ui.css` have **unhashed** names, while the chunks are hashed. Without these headers a returning browser can combine a stale `app.js` with new chunks after a deploy.

```json
"headers": [
  { "source": "/(app.js|styles.css|ui.css|index.html)", "headers": [{ "key": "Cache-Control", "value": "no-cache" }] },
  { "source": "/chunks/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
  { "source": "/(.*)", "headers": [
    { "key": "X-Content-Type-Options", "value": "nosniff" },
    { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
    { "key": "Permissions-Policy", "value": "camera=(self), microphone=(), geolocation=()" },
    { "key": "X-Frame-Options", "value": "DENY" }
  ]}
]
```

A Content-Security-Policy needs care: `index.html` contains an inline `<script>` (router mode), WebGL and audio are used, and the page connects to `https://<ref>.supabase.co`. Draft it, then test it on a preview.

## Auth provider

The organizer app has **no sign-in screen yet**: that is a UI task. `src/services/remote/supabaseAuth.ts` provides the calls: request a code by email or SMS, verify it, refresh, and sign out.

| Option | Pros | Cons |
|---|---|---|
| **Email one-time code / magic link** (recommended for the first pilot) | No SMS cost or sender registration. Works with Supabase's built-in mailer for testing. | The built-in mailer is heavily rate-limited, so production needs custom SMTP. Saudi organizers may prefer phone. |
| **Phone OTP (SMS)** | Matches how organizers identify themselves, and matches the guest data (phones) | Needs an SMS provider account (configured in Supabase), a per-message cost, and possibly sender-ID registration for Saudi numbers (verify with the provider). |

Either way:
- Roles come from `event_members`, per event.
- `SessionService.currentUser()` is synchronous and global, so the app must hold the session and the current event role. This is a contract gap.
- Inviting a coordinator needs an invite flow (by email or phone → user id); that flow is not built.

## Verification checklist (run after provisioning)

- [ ] `select public.doyofy_health();` returns `ok: true`.
- [ ] Supabase Database → Advisors shows no security or performance warnings, or each one is explained.
- [ ] Anon key, `GET /rest/v1/parties` → 401/403 (permission denied). Same for `events`, `rsvp_responses` and `check_ins`.
- [ ] User A creates an event; user B (signed in) sees `[]` from `/rest/v1/events` and cannot PATCH A's party (0 rows).
- [ ] As A, `PATCH /rest/v1/parties?id=eq.<id>` with `{"rsvp_status":"confirmed"}` → 401/403 (column grant).
- [ ] Guest flow on a phone, over HTTPS:
  - unpublished → "not available yet";
  - publish → the personal link opens and shows "opened" to the organizer;
  - RSVP over the allowance is refused;
  - a valid RSVP updates the organizer list after a reload.
- [ ] General link: off → "personal invitation" message; on → the reply waits for matching → matching works.
- [ ] Two phones check in the same party at the same moment: one succeeds, the other gets the "state changed" message, and the count is correct.
- [ ] Airplane mode during a check-in, then reconnect and retry: no double count (same idempotency key).
- [ ] Undo shows in `check_ins.undone_at` with the user id; a second undo is refused.
- [ ] Set the event to the past → RSVP is refused with "reply period ended".
- [ ] 31 wrong codes from one network → the throttle message, while another network still works. **Confirm that `request.headers` → `x-forwarded-for` is populated on Supabase.** If it isn't, every caller shares one bucket; fix that before launch.
- [ ] `export_event_data` works for the owner and is refused for a coordinator.
- [ ] Backups: check the plan's retention and enable PITR if needed. **Test a restore** into a scratch project.

## What has been verified, and what has not

| Claim | Evidence |
|---|---|
| The migration applies cleanly; constraints, RLS, column grants, RPC rules and activity logging behave as designed | `bash backend/supabase/tests/run_local.sh` → **71 checks pass** on **local Postgres 16** with Supabase stand-ins (`auth.uid()` from a GUC, `anon` / `authenticated` roles, Supabase-like default grants). Found and fixed two real bugs during the run (array append; spurious `party_updated` on RSVP). |
| The same idempotency key sent in parallel produces one record; two gates racing on one party can't over-count | Same script: real two-session lock test on local Postgres. |
| The adapter builds the right HTTP requests and maps errors | `tests/unit/remote.test.ts`: **19 mocked-fetch contract tests**. |
| **Not verified** | Any real Supabase project. PostgREST error and status mapping (`PT4xx` → HTTP status). GoTrue request and response shapes. The `request.headers` GUC and the real client IP behind Supabase's proxy. RLS performance at scale. The Vercel build and deploy. The CORS / redirect configuration. The SMS and email providers. Realtime. The adapter has never run inside the UI. |
