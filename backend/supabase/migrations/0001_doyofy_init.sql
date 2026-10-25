-- =====================================================================================================
-- Doyofy / ضيوفي — initial schema (Supabase Postgres 15+)
--
-- Mirrors src/domain/types.ts. The browser talks to this database ONLY through:
--   * PostgREST table endpoints, guarded by Row Level Security (organizer side, signed-in users), and
--   * SECURITY DEFINER RPC functions in `public` (public guest path + every server-authoritative write).
-- Internal helpers live in the non-exposed schema `doyofy_private`.
--
-- Status: PREPARED, NOT APPLIED to any cloud project. Smoke-tested only on a local Postgres 16 with
-- Supabase stand-ins (backend/supabase/tests/). See backend/README.md.
--
-- Conventions
--   * Every table has RLS enabled. A table with RLS and no policy for a role is closed to that role.
--   * `anon` gets NO table privileges at all; guests only reach the three public RPCs.
--   * Organizer RPCs raise errors with ERRCODE 'PT<http status>' (PostgREST turns that into the HTTP
--     status), MESSAGE = machine reason (e.g. 'already_undone') and HINT = app ErrorCode
--     (src/services/errors.ts). The client maps reason -> Arabic text.
--   * Public guest RPCs never raise for expected outcomes: they return {ok:false, code, reason, status}
--     so that the rate-limit counters written in the same transaction are committed.
-- =====================================================================================================

create extension if not exists pgcrypto with schema extensions;

create schema if not exists doyofy_private;
revoke all on schema doyofy_private from public;
-- RLS policies call doyofy_private.is_event_member(); the invoking role needs USAGE + EXECUTE.
grant usage on schema doyofy_private to authenticated;

-- -----------------------------------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------------------------------

create table public.events (
  id                      uuid primary key default gen_random_uuid(),
  owner_id                uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type                    text not null check (type in (
                            'wedding','engagement','katb_kitab','henna','birthday','graduation','newborn',
                            'family','iftar','conference','opening','corporate','other')),
  title                   text not null check (char_length(btrim(title)) between 1 and 200),
  names                   jsonb not null check (jsonb_typeof(names) = 'object'
                            and char_length(btrim(coalesce(names->>'a', ''))) between 1 and 120),
  date                    date not null,
  time                    time not null,
  time_zone               text not null default 'Asia/Riyadh' check (time_zone ~ '^[A-Za-z_]+(/[A-Za-z0-9_+-]+)*$'),
  duration_hours          numeric(4,1) not null default 5 check (duration_hours > 0 and duration_hours <= 48),
  venue                   jsonb not null check (jsonb_typeof(venue) = 'object'
                            and char_length(btrim(coalesce(venue->>'name', ''))) between 1 and 200
                            and char_length(btrim(coalesce(venue->>'city', ''))) between 1 and 120),
  slug                    text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 48),
  default_party_size      integer not null default 2 check (default_party_size between 1 and 20),
  reveal_table_to_guests  boolean not null default false,
  allow_general_link      boolean not null default false,
  check_in_prepared_at    timestamptz,
  archived_at             timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
comment on table public.events is 'Event (domain Event). Lifecycle phase is derived from the clock; archived_at is the only stored lifecycle field.';

create table public.event_members (
  event_id    uuid not null references public.events (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        text not null check (role in ('organizer', 'coordinator')),
  invited_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  primary key (event_id, user_id)
);
comment on table public.event_members is 'Per-event roles. The owner is inserted as organizer by trigger. Coordinators can do everything except archive/restore/delete/export/manage members (D-017).';

create table public.invitation_designs (
  id                 uuid primary key default gen_random_uuid(),
  event_id           uuid not null unique references public.events (id) on delete cascade,
  draft              jsonb not null check (jsonb_typeof(draft) = 'object' and octet_length(draft::text) < 200000),
  draft_revision     bigint not null default 1 check (draft_revision >= 1),
  draft_saved_at     timestamptz not null default now(),
  draft_saved_by     uuid references auth.users (id) on delete set null,
  published          jsonb check (published is null or jsonb_typeof(published) = 'object'),
  published_at       timestamptz,
  published_version  integer not null default 0 check (published_version >= 0),
  check ((published is null) = (published_at is null))
);
comment on table public.invitation_designs is 'Draft (autosaved, optimistic revision) + published snapshot guests see (D-006). Writes only through RPCs.';

create table public.invitation_design_versions (
  id            uuid primary key default gen_random_uuid(),
  design_id     uuid not null references public.invitation_designs (id) on delete cascade,
  event_id      uuid not null references public.events (id) on delete cascade,
  version       integer not null check (version >= 1),
  content       jsonb not null,
  published_at  timestamptz not null default now(),
  published_by  uuid references auth.users (id) on delete set null,
  unique (design_id, version)
);
comment on table public.invitation_design_versions is 'Immutable history of every published snapshot (recovery / audit).';

create table public.seating_tables (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 80),
  capacity    integer not null check (capacity between 1 and 60),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (event_id, id)
);

create table public.parties (
  id                       uuid primary key default gen_random_uuid(),
  event_id                 uuid not null references public.events (id) on delete cascade,
  code                     text not null check (code ~ '^[A-Z0-9]{4,8}$'),
  primary_guest_name       text not null check (char_length(btrim(primary_guest_name)) between 1 and 120),
  phone                    text check (phone is null or phone ~ '^\+[1-9][0-9]{7,14}$'),
  max_party_size           integer not null check (max_party_size between 1 and 20),
  companion_names          text[] check (companion_names is null or cardinality(companion_names) <= 20),
  notes                    text check (notes is null or char_length(notes) <= 1000),
  side                     text check (side is null or char_length(side) <= 80),
  delivery_status          text not null default 'not_shared' check (delivery_status in ('not_shared','shared','opened','failed')),
  delivery_source          text check (delivery_source is null or delivery_source in ('platform','manual','simulated')),
  delivery_at              timestamptz,
  delivery_opened_at       timestamptz,
  delivery_reminder_at     timestamptz,
  delivery_failure_reason  text check (delivery_failure_reason is null or delivery_failure_reason in ('missing_phone','invalid_phone','not_delivered')),
  rsvp_status              text not null default 'pending' check (rsvp_status in ('pending','confirmed','declined')),
  confirmed_party_size     integer check (confirmed_party_size is null or confirmed_party_size between 0 and 20),
  responded_at             timestamptz,
  guest_note               text check (guest_note is null or char_length(guest_note) <= 500),
  table_id                 uuid,
  check_in_status          text not null default 'not_arrived' check (check_in_status in ('not_arrived','partial','checked_in')),
  checked_in_count         integer not null default 0 check (checked_in_count between 0 and 200),
  source                   text not null default 'manual' check (source in ('manual','import','seed','general_link')),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (event_id, code),
  unique (event_id, id),
  check (rsvp_status = 'pending' or responded_at is not null),
  check (rsvp_status <> 'confirmed' or coalesce(confirmed_party_size, 0) >= 1),
  -- a table must belong to the same event; deleting a table unseats its parties (domain SeatingRepository.deleteTable)
  foreign key (event_id, table_id) references public.seating_tables (event_id, id) on delete set null (table_id)
);
comment on table public.parties is 'InvitationParty: one invitation for a person/couple/family. RSVP, delivery-opened and check-in fields are server-authoritative (not client-updatable).';

create table public.rsvp_responses (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references public.events (id) on delete cascade,
  party_id         uuid,
  name             text not null check (char_length(btrim(name)) between 1 and 120),
  attending        boolean not null,
  count            integer not null check (count between 0 and 20),
  companion_names  text[] check (companion_names is null or cardinality(companion_names) <= 20),
  note             text check (note is null or char_length(note) <= 500),
  channel          text not null check (channel in ('guest_link','general_link','organizer')),
  at               timestamptz not null default now(),
  resolution       text check (resolution is null or resolution in ('matched','added','dismissed')),
  resolved_at      timestamptz,
  resolved_by      uuid references auth.users (id) on delete set null,
  check (attending or count = 0),
  check (not attending or count >= 1),
  -- personal-link and organizer replies always belong to a party and need no matching
  check (channel = 'general_link' or (party_id is not null and resolution is null)),
  -- general-link matching state: waiting (no party) -> matched/added (party) | dismissed (no party)
  check (channel <> 'general_link' or (
           (resolution is null and party_id is null)
        or (resolution = 'dismissed' and party_id is null)
        or (resolution in ('matched','added') and party_id is not null))),
  foreign key (event_id, party_id) references public.parties (event_id, id) on delete cascade
);
comment on table public.rsvp_responses is 'RSVP history (current state lives on parties). General-link replies wait here until matched/added/dismissed.';

create table public.check_ins (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references public.events (id) on delete cascade,
  party_id         uuid not null,
  count            integer not null check (count between 1 and 50),
  method           text not null check (method in ('qr','search')),
  at               timestamptz not null default now(),
  by_label         text not null default '' check (char_length(by_label) <= 80),
  by_user          uuid references auth.users (id) on delete set null,
  exceptions       text[] not null default '{}' check (exceptions <@ array[
                     'declined_arrived','pending_arrived','over_confirmed','over_allowed','no_table','already_complete']::text[]),
  acknowledged     text[] not null default '{}',
  staff_note       text check (staff_note is null or char_length(staff_note) <= 500),
  idempotency_key  text not null check (char_length(idempotency_key) between 8 and 100),
  undone_at        timestamptz,
  undone_by        uuid references auth.users (id) on delete set null,
  undo_reason      text check (undo_reason is null or char_length(undo_reason) <= 300),
  unique (event_id, idempotency_key),
  foreign key (event_id, party_id) references public.parties (event_id, id) on delete cascade
);
comment on table public.check_ins is 'Append-only gate log. Undo never deletes: it stamps undone_at/undone_by/undo_reason. Writes only through RPCs.';

create table public.event_activity (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.events (id) on delete cascade,
  kind           text not null check (kind in (
                   'event_created','event_updated','invitation_saved','invitation_published',
                   'party_added','parties_imported','party_updated','party_removed',
                   'invitation_shared','invitation_opened','invitation_failed','reminder_sent',
                   'rsvp_confirmed','rsvp_declined','rsvp_edited','rsvp_unmatched','rsvp_matched',
                   'table_created','party_seated','party_moved','party_unseated',
                   'checked_in','checked_in_partial','check_in_exception','check_in_undone','event_archived')),
  at             timestamptz not null default now(),
  actor          text not null check (actor in ('organizer','guest','gate','system')),
  actor_user_id  uuid references auth.users (id) on delete set null,
  party_id       uuid,               -- no FK: the timeline keeps entries for removed parties
  data           jsonb not null default '{}' check (jsonb_typeof(data) = 'object')
);
comment on table public.event_activity is 'Human-readable timeline (domain EventActivity). Written only by triggers/RPCs.';

-- Rate-limit buckets for the anonymous guest path. Keys are SHA-256 hashes (no raw IPs stored).
create table doyofy_private.rate_limits (
  bucket        text primary key,
  window_start  timestamptz not null default now(),
  hits          integer not null default 0
);

-- -----------------------------------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------------------------------
create index events_owner_idx            on public.events (owner_id);
create index event_members_user_idx      on public.event_members (user_id);
create index parties_event_idx           on public.parties (event_id);
create index parties_event_phone_idx     on public.parties (event_id, phone) where phone is not null;
create index parties_table_idx           on public.parties (table_id) where table_id is not null;
create index seating_tables_event_idx    on public.seating_tables (event_id, sort_order);
create index rsvp_responses_event_idx    on public.rsvp_responses (event_id, at desc);
create index rsvp_responses_party_idx    on public.rsvp_responses (party_id) where party_id is not null;
create index rsvp_unmatched_idx          on public.rsvp_responses (event_id)
  where channel = 'general_link' and resolution is null and party_id is null;
create index check_ins_event_idx         on public.check_ins (event_id, at desc);
create index check_ins_party_idx         on public.check_ins (party_id);
create index event_activity_event_idx    on public.event_activity (event_id, at desc);
create index design_versions_design_idx  on public.invitation_design_versions (design_id, version desc);
create index rate_limits_window_idx      on doyofy_private.rate_limits (window_start);

-- -----------------------------------------------------------------------------------------------------
-- Private helpers (not exposed through the API)
-- -----------------------------------------------------------------------------------------------------

-- Membership checks used by RLS. SECURITY DEFINER so the policy on event_members does not recurse.
create function doyofy_private.is_event_member(p_event_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.event_members m where m.event_id = p_event_id and m.user_id = auth.uid())
      or exists (select 1 from public.events e where e.id = p_event_id and e.owner_id = auth.uid());
$$;

create function doyofy_private.is_event_organizer(p_event_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.event_members m where m.event_id = p_event_id and m.user_id = auth.uid() and m.role = 'organizer')
      or exists (select 1 from public.events e where e.id = p_event_id and e.owner_id = auth.uid());
$$;

-- Same normalisation as src/domain/ids.ts normaliseCode().
create function doyofy_private.normalise_party_code(p_code text) returns text
language sql immutable set search_path = '' as $$
  select nullif(translate(regexp_replace(upper(btrim(coalesce(p_code, ''))), '[^A-Z0-9]', '', 'g'), 'OIL', '011'), '');
$$;

-- Unambiguous alphabet from src/domain/ids.ts. Default length 6 (31^6 ≈ 8.9e8 per event); the
-- prototype uses 5. Small modulo bias (256 mod 31) is acceptable for a non-secret-grade token that is
-- additionally rate limited.
create function doyofy_private.generate_party_code(p_event_id uuid, p_length integer default 6) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_len integer := greatest(4, least(8, p_length));
  v_code text;
  v_bytes bytea;
begin
  for attempt in 1..40 loop
    v_bytes := extensions.gen_random_bytes(v_len);
    v_code := '';
    for i in 0..v_len - 1 loop
      v_code := v_code || substr(alphabet, (get_byte(v_bytes, i) % 31) + 1, 1);
    end loop;
    if not exists (select 1 from public.parties p where p.event_id = p_event_id and p.code = v_code) then
      return v_code;
    end if;
    if attempt % 10 = 0 and v_len < 8 then v_len := v_len + 1; end if;
  end loop;
  raise exception using errcode = 'PT409', message = 'code_space_exhausted', hint = 'conflict';
end $$;

create function doyofy_private.event_start(e public.events) returns timestamptz
language sql stable set search_path = '' as $$
  select (e.date + e.time) at time zone e.time_zone;
$$;

-- canEdit in the mock: guests may change their reply until the event starts (D-014).
create function doyofy_private.rsvp_open(e public.events) returns boolean
language sql stable set search_path = '' as $$
  select e.archived_at is null and now() < doyofy_private.event_start(e);
$$;

-- GuestView.phase: 'before' | 'event_day' | 'after' (completed = 3 h after the end, src/domain/event.ts).
create function doyofy_private.guest_phase(e public.events) returns text
language sql stable set search_path = '' as $$
  select case
    when e.archived_at is not null
      or now() > doyofy_private.event_start(e) + make_interval(secs => (e.duration_hours * 3600)::double precision) + interval '3 hours'
      then 'after'
    when (now() at time zone e.time_zone)::date >= e.date then 'event_day'
    else 'before'
  end;
$$;

create function doyofy_private.raise_app(p_status integer, p_code text, p_reason text, p_detail text default null) returns void
language plpgsql set search_path = '' as $$
begin
  raise exception using errcode = 'PT' || p_status::text, message = p_reason, hint = p_code, detail = coalesce(p_detail, '');
end $$;

create function doyofy_private.require_member(p_event_id uuid) returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then perform doyofy_private.raise_app(401, 'forbidden', 'not_authenticated'); end if;
  if not doyofy_private.is_event_member(p_event_id) then perform doyofy_private.raise_app(403, 'forbidden', 'not_a_member'); end if;
end $$;

create function doyofy_private.require_organizer(p_event_id uuid) returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then perform doyofy_private.raise_app(401, 'forbidden', 'not_authenticated'); end if;
  if not doyofy_private.is_event_organizer(p_event_id) then perform doyofy_private.raise_app(403, 'forbidden', 'organizer_only'); end if;
end $$;

-- Hashed caller key. PostgREST exposes request headers as a GUC; behind Supabase the first
-- X-Forwarded-For hop is the client. UNVERIFIED on a real project (see README). Mobile carriers use
-- CGNAT, so many honest guests can share one key: limits below are deliberately generous.
create function doyofy_private.client_key() returns text
language plpgsql stable set search_path = '' as $$
declare v_headers json; v_ip text;
begin
  begin
    v_headers := nullif(current_setting('request.headers', true), '')::json;
  exception when others then v_headers := null;
  end;
  v_ip := btrim(split_part(coalesce(v_headers->>'x-forwarded-for', v_headers->>'x-real-ip', 'unknown'), ',', 1));
  return encode(extensions.digest('doyofy:' || v_ip, 'sha256'), 'hex');
end $$;

-- Fixed-window counter. Returns the hit count in the current window after adding p_add.
create function doyofy_private.rate_hit(p_bucket text, p_window interval, p_add integer default 1) returns integer
language plpgsql volatile security definer set search_path = '' as $$
declare v_hits integer;
begin
  insert into doyofy_private.rate_limits as r (bucket, window_start, hits)
  values (p_bucket, now(), p_add)
  on conflict (bucket) do update
    set hits = case when r.window_start < now() - p_window then p_add else r.hits + p_add end,
        window_start = case when r.window_start < now() - p_window then now() else r.window_start end
  returning hits into v_hits;
  if random() < 0.01 then
    delete from doyofy_private.rate_limits where window_start < now() - interval '1 day';
  end if;
  return v_hits;
end $$;

create function doyofy_private.guest_error(p_code text, p_reason text, p_status integer) returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object('ok', false, 'code', p_code, 'reason', p_reason, 'status', p_status);
$$;

-- GuestView (src/services/contracts.ts). Never includes phone, notes or other parties.
create function doyofy_private.guest_view(e public.events, d public.invitation_designs, p public.parties) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'event', jsonb_build_object(
      'id', e.id, 'slug', e.slug, 'type', e.type, 'title', e.title, 'names', e.names,
      'date', to_char(e.date, 'YYYY-MM-DD'), 'time', to_char(e.time, 'HH24:MI'), 'timeZone', e.time_zone,
      'durationHours', e.duration_hours, 'venue', e.venue),
    'design', d.published,
    'party', case when p.id is null then null else jsonb_strip_nulls(jsonb_build_object(
      'code', p.code, 'name', p.primary_guest_name, 'maxPartySize', p.max_party_size, 'rsvpStatus', p.rsvp_status,
      'confirmedPartySize', p.confirmed_party_size, 'companionNames', to_jsonb(p.companion_names), 'guestNote', p.guest_note,
      'tableName', case when e.reveal_table_to_guests then (select t.name from public.seating_tables t where t.id = p.table_id) end,
      'checkedInCount', p.checked_in_count)) end,
    'canEdit', doyofy_private.rsvp_open(e),
    'maxGuests', coalesce(p.max_party_size, e.default_party_size),
    'phase', doyofy_private.guest_phase(e));
$$;

-- Server-authoritative counts returned by gate RPCs (subset of domain countParties()).
create function doyofy_private.event_counts(p_event_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'parties',          count(*),
    'confirmedParties', count(*) filter (where p.rsvp_status = 'confirmed'),
    'confirmedPeople',  coalesce(sum(case when p.rsvp_status = 'confirmed' then coalesce(p.confirmed_party_size, p.max_party_size) else 0 end), 0),
    'checkedInPeople',  coalesce(sum(p.checked_in_count), 0),
    'arrivedParties',   count(*) filter (where p.checked_in_count > 0),
    'partialParties',   count(*) filter (where p.check_in_status = 'partial'))
  from public.parties p where p.event_id = p_event_id;
$$;

create function doyofy_private.log_activity(p_event_id uuid, p_kind text, p_data jsonb default '{}', p_actor text default 'organizer', p_party_id uuid default null)
returns void language sql volatile security definer set search_path = '' as $$
  insert into public.event_activity (event_id, kind, actor, actor_user_id, party_id, data)
  values (p_event_id, p_kind, p_actor, auth.uid(), p_party_id, coalesce(jsonb_strip_nulls(p_data), '{}'::jsonb));
$$;

-- Arabic titles from src/domain/checkin.ts EXCEPTION_TEXT (activity entries are displayed verbatim).
create function doyofy_private.exception_title(p text) returns text
language sql immutable set search_path = '' as $$
  select case p
    when 'declined_arrived' then 'هذا الضيف اعتذر عن الحضور'
    when 'pending_arrived'  then 'هذا الضيف لم يؤكد حضوره'
    when 'over_confirmed'   then 'العدد أكبر مما أكدوه'
    when 'over_allowed'     then 'العدد أكبر من المسموح للدعوة'
    when 'no_table'         then 'لا توجد طاولة محددة'
    when 'already_complete' then 'تم تسجيل دخول هذه الدعوة بالكامل'
    else p end;
$$;

-- statusAfter() from src/domain/checkin.ts
create function doyofy_private.check_in_status_after(p public.parties, p_total integer) returns text
language sql immutable set search_path = '' as $$
  select case
    when p_total <= 0 then 'not_arrived'
    when p_total >= (case when p.rsvp_status = 'confirmed' then coalesce(p.confirmed_party_size, p.max_party_size) else p.max_party_size end) then 'checked_in'
    else 'partial' end;
$$;

-- assessCheckIn() exceptions from src/domain/checkin.ts, evaluated on the LOCKED current row.
create function doyofy_private.check_in_exceptions(p public.parties, p_arriving integer) returns text[]
language plpgsql immutable set search_path = '' as $$
declare
  v_confirmed integer := case when p.rsvp_status = 'confirmed' then coalesce(p.confirmed_party_size, p.max_party_size) else 0 end;
  v_expected  integer := case when p.rsvp_status = 'confirmed' then v_confirmed else p.max_party_size end;
  v_remaining integer := greatest(0, v_expected - p.checked_in_count);
  v_after     integer := p.checked_in_count + p_arriving;
  ex text[] := '{}';
begin
  if p.rsvp_status = 'declined' then ex := array_append(ex, 'declined_arrived'); end if;
  if p.rsvp_status = 'pending' then ex := array_append(ex, 'pending_arrived'); end if;
  if p.check_in_status = 'checked_in' and v_remaining = 0 then ex := array_append(ex, 'already_complete'); end if;
  if p.rsvp_status = 'confirmed' and v_after > v_confirmed and v_after <= p.max_party_size then ex := array_append(ex, 'over_confirmed'); end if;
  if v_after > p.max_party_size then ex := array_append(ex, 'over_allowed'); end if;
  if p.rsvp_status = 'confirmed' and p.table_id is null then ex := array_append(ex, 'no_table'); end if;
  return ex;
end $$;

create function doyofy_private.clean_names(p text[]) returns text[]
language sql immutable set search_path = '' as $$
  select case when p is null then null else
    nullif(array(select left(btrim(x), 80) from unnest(p) as x where btrim(coalesce(x, '')) <> '' limit 20), '{}'::text[]) end;
$$;

-- RSVP validation shared by guest + organizer paths (validateRsvp in src/domain/parties.ts).
create function doyofy_private.rsvp_problem(p_attending boolean, p_count integer, p_max integer, p_note text) returns text
language sql immutable set search_path = '' as $$
  select case
    when p_attending is null then 'attending_required'
    when p_note is not null and char_length(p_note) > 500 then 'note_too_long'
    when not p_attending then null
    when p_count is null then 'no_count'
    when p_count < 1 then 'count_too_low'
    when p_count > p_max then 'count_exceeds_allowed'
    else null end;
$$;

-- -----------------------------------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------------------------------

create function doyofy_private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;

create trigger events_touch  before update on public.events  for each row execute function doyofy_private.touch_updated_at();
create trigger parties_touch before update on public.parties for each row execute function doyofy_private.touch_updated_at();

-- New event: owner becomes organizer member; timeline entry. Time zone is validated against the server list.
create function doyofy_private.events_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.event_members (event_id, user_id, role) values (new.id, new.owner_id, 'organizer')
  on conflict (event_id, user_id) do update set role = 'organizer';
  perform doyofy_private.log_activity(new.id, 'event_created');
  return null;
end $$;
create trigger events_after_insert after insert on public.events for each row execute function doyofy_private.events_after_insert();

create function doyofy_private.events_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.time_zone is distinct from old.time_zone then
    if not exists (select 1 from pg_catalog.pg_timezone_names z where z.name = new.time_zone) then
      perform doyofy_private.raise_app(400, 'validation', 'invalid_time_zone');
    end if;
  end if;
  if tg_op = 'UPDATE' then
    if new.owner_id is distinct from old.owner_id or new.slug is distinct from old.slug or new.created_at is distinct from old.created_at then
      perform doyofy_private.raise_app(403, 'forbidden', 'immutable_field');
    end if;
    -- archive / restore is organizer-only (D-017)
    if new.archived_at is distinct from old.archived_at and auth.uid() is not null and not doyofy_private.is_event_organizer(old.id) then
      perform doyofy_private.raise_app(403, 'forbidden', 'organizer_only');
    end if;
  end if;
  return new;
end $$;
create trigger events_guard before insert or update on public.events for each row execute function doyofy_private.events_guard();

create function doyofy_private.events_after_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.archived_at is not null and old.archived_at is null then
    perform doyofy_private.log_activity(new.id, 'event_archived');
  elsif (new.type, new.title, new.names, new.date, new.time, new.time_zone, new.duration_hours, new.venue,
         new.default_party_size, new.reveal_table_to_guests, new.allow_general_link)
        is distinct from
        (old.type, old.title, old.names, old.date, old.time, old.time_zone, old.duration_hours, old.venue,
         old.default_party_size, old.reveal_table_to_guests, old.allow_general_link) then
    perform doyofy_private.log_activity(new.id, 'event_updated', jsonb_build_object('what',
      case when new.venue is distinct from old.venue then 'المكان'
           when new.date is distinct from old.date or new.time is distinct from old.time then 'الموعد'
           when (new.default_party_size, new.reveal_table_to_guests, new.allow_general_link)
                is distinct from (old.default_party_size, old.reveal_table_to_guests, old.allow_general_link) then 'الإعدادات'
      end));
  end if;
  return null;
end $$;
create trigger events_after_update after update on public.events for each row execute function doyofy_private.events_after_update();

-- Party code is always generated by the server (never trusted from the client).
create function doyofy_private.parties_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.code := doyofy_private.generate_party_code(new.event_id);
  new.primary_guest_name := btrim(regexp_replace(new.primary_guest_name, '\s+', ' ', 'g'));
  new.companion_names := doyofy_private.clean_names(new.companion_names);
  return new;
end $$;
create trigger parties_before_insert before insert on public.parties for each row execute function doyofy_private.parties_before_insert();

-- Only confirmed parties can be seated (SeatingRepository.assign).
create function doyofy_private.parties_seat_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.table_id is not null and new.table_id is distinct from old.table_id and new.rsvp_status <> 'confirmed' then
    perform doyofy_private.raise_app(400, 'validation', 'seat_requires_confirmed');
  end if;
  if new.primary_guest_name is distinct from old.primary_guest_name then
    new.primary_guest_name := btrim(regexp_replace(new.primary_guest_name, '\s+', ' ', 'g'));
  end if;
  return new;
end $$;
create trigger parties_seat_guard before update on public.parties for each row execute function doyofy_private.parties_seat_guard();

-- Timeline entries for direct (PostgREST) party writes. Bulk RPCs set doyofy.bulk = 'on' and log once.
create function doyofy_private.parties_after_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_from text; v_to text;
begin
  if coalesce(current_setting('doyofy.bulk', true), '') = 'on' then return null; end if;
  if tg_op = 'INSERT' then
    perform doyofy_private.log_activity(new.event_id, 'party_added', jsonb_build_object('name', new.primary_guest_name), 'organizer', new.id);
  elsif tg_op = 'DELETE' then
    perform doyofy_private.log_activity(old.event_id, 'party_removed', jsonb_build_object('name', old.primary_guest_name), 'organizer', null);
  else
    if (new.primary_guest_name, new.phone, new.max_party_size, new.companion_names, new.notes, new.side)
       is distinct from (old.primary_guest_name, old.phone, old.max_party_size, old.companion_names, old.notes, old.side) then
      perform doyofy_private.log_activity(new.event_id, 'party_updated', jsonb_build_object('name', new.primary_guest_name), 'organizer', new.id);
    end if;
    if new.table_id is distinct from old.table_id then
      select t.name into v_from from public.seating_tables t where t.id = old.table_id;
      select t.name into v_to   from public.seating_tables t where t.id = new.table_id;
      if old.table_id is null then
        perform doyofy_private.log_activity(new.event_id, 'party_seated', jsonb_build_object('name', new.primary_guest_name, 'table', v_to), 'organizer', new.id);
      elsif new.table_id is null then
        perform doyofy_private.log_activity(new.event_id, 'party_unseated', jsonb_build_object('name', new.primary_guest_name, 'table', v_from), 'organizer', new.id);
      else
        perform doyofy_private.log_activity(new.event_id, 'party_moved', jsonb_build_object('name', new.primary_guest_name, 'table', v_to), 'organizer', new.id);
      end if;
    end if;
  end if;
  return null;
end $$;
create trigger parties_after_change after insert or update or delete on public.parties for each row execute function doyofy_private.parties_after_change();

create function doyofy_private.tables_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform doyofy_private.log_activity(new.event_id, 'table_created', jsonb_build_object('name', new.name, 'capacity', new.capacity));
  return null;
end $$;
create trigger tables_after_insert after insert on public.seating_tables for each row execute function doyofy_private.tables_after_insert();

-- -----------------------------------------------------------------------------------------------------
-- Public guest RPCs (anon + authenticated). Return envelopes; never expose phone numbers or other parties.
-- -----------------------------------------------------------------------------------------------------

-- Opens a personal (slug + code) or general (slug only) invitation. Records "opened" for personal links.
-- Outcomes: unknown slug / archived -> not_found:unknown_event · no published snapshot -> not_published ·
-- wrong code -> not_found:unknown_code (counted for brute-force throttling) · general link disabled ->
-- not_found:personal_only · throttled -> rate_limited.
create function public.get_public_invitation(p_slug text, p_code text default null, p_record_open boolean default true)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_key   text := doyofy_private.client_key();
  v_slug  text := lower(btrim(coalesce(p_slug, '')));
  v_code  text := doyofy_private.normalise_party_code(p_code);
  v_event public.events;
  v_design public.invitation_designs;
  v_party public.parties;
begin
  if doyofy_private.rate_hit('open:' || v_key, interval '10 minutes') > 600 then
    return doyofy_private.guest_error('rate_limited', 'too_many_requests', 429);
  end if;
  if v_code is not null and doyofy_private.rate_hit('badcode:' || v_key || ':' || v_slug, interval '15 minutes', 0) >= 30 then
    return doyofy_private.guest_error('rate_limited', 'too_many_wrong_codes', 429);
  end if;

  select * into v_event from public.events e where e.slug = v_slug;
  if not found or v_event.archived_at is not null then
    return doyofy_private.guest_error('not_found', 'unknown_event', 404);
  end if;
  select * into v_design from public.invitation_designs d where d.event_id = v_event.id;
  if v_design.published is null then
    return doyofy_private.guest_error('not_published', 'not_published', 404);
  end if;

  if v_code is not null then
    select * into v_party from public.parties p where p.event_id = v_event.id and p.code = v_code;
    if not found then
      perform doyofy_private.rate_hit('badcode:' || v_key || ':' || v_slug, interval '15 minutes');
      return doyofy_private.guest_error('not_found', 'unknown_code', 404);
    end if;
    if p_record_open and v_party.delivery_status <> 'opened' then
      update public.parties p
         set delivery_status = 'opened', delivery_source = 'platform', delivery_opened_at = now(),
             delivery_at = coalesce(p.delivery_at, now())
       where p.id = v_party.id
       returning * into v_party;
      perform doyofy_private.log_activity(v_event.id, 'invitation_opened', jsonb_build_object('name', v_party.primary_guest_name), 'guest', v_party.id);
    end if;
  elsif not v_event.allow_general_link then
    return doyofy_private.guest_error('not_found', 'personal_only', 404);
  end if;

  return jsonb_build_object('ok', true, 'view', doyofy_private.guest_view(v_event, v_design, v_party));
end $$;
comment on function public.get_public_invitation is 'Public: GuestApi.open(). Envelope {ok, view} or {ok:false, code, reason, status}.';

-- Personal-link RSVP. Enforces allowance (1..max_party_size), edit window (until event start),
-- archived/unpublished state, and row lock against concurrent submissions.
create function public.submit_rsvp(p_slug text, p_code text, p_attending boolean, p_count integer default null,
                                   p_companion_names text[] default null, p_note text default null)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_key   text := doyofy_private.client_key();
  v_slug  text := lower(btrim(coalesce(p_slug, '')));
  v_code  text := doyofy_private.normalise_party_code(p_code);
  v_event public.events;
  v_design public.invitation_designs;
  v_party public.parties;
  v_problem text;
  v_edited boolean;
  v_response_id uuid;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_names text[] := doyofy_private.clean_names(p_companion_names);
begin
  if doyofy_private.rate_hit('rsvp:' || v_key, interval '10 minutes') > 120 then
    return doyofy_private.guest_error('rate_limited', 'too_many_requests', 429);
  end if;
  if v_code is null then return doyofy_private.guest_error('not_found', 'unknown_code', 404); end if;
  if doyofy_private.rate_hit('badcode:' || v_key || ':' || v_slug, interval '15 minutes', 0) >= 30 then
    return doyofy_private.guest_error('rate_limited', 'too_many_wrong_codes', 429);
  end if;

  select * into v_event from public.events e where e.slug = v_slug;
  if not found or v_event.archived_at is not null then return doyofy_private.guest_error('not_found', 'unknown_event', 404); end if;
  select * into v_design from public.invitation_designs d where d.event_id = v_event.id;
  if v_design.published is null then return doyofy_private.guest_error('not_published', 'not_published', 404); end if;

  select * into v_party from public.parties p where p.event_id = v_event.id and p.code = v_code for update;
  if not found then
    perform doyofy_private.rate_hit('badcode:' || v_key || ':' || v_slug, interval '15 minutes');
    return doyofy_private.guest_error('not_found', 'unknown_code', 404);
  end if;
  if not doyofy_private.rsvp_open(v_event) then return doyofy_private.guest_error('conflict', 'rsvp_closed', 409); end if;

  v_problem := doyofy_private.rsvp_problem(p_attending, p_count, v_party.max_party_size, v_note);
  if v_problem is not null then return doyofy_private.guest_error('validation', v_problem, 400); end if;

  v_edited := v_party.rsvp_status <> 'pending';
  perform set_config('doyofy.bulk', 'on', true);   -- the RSVP entry below replaces a generic party_updated
  update public.parties p set
    rsvp_status = case when p_attending then 'confirmed' else 'declined' end,
    confirmed_party_size = case when p_attending then p_count else 0 end,
    companion_names = coalesce(v_names, p.companion_names),
    guest_note = v_note,
    responded_at = now(),
    delivery_status = 'opened',
    delivery_source = case when p.delivery_status = 'opened' then p.delivery_source else 'platform' end,
    delivery_opened_at = coalesce(p.delivery_opened_at, now())
  where p.id = v_party.id
  returning * into v_party;
  perform set_config('doyofy.bulk', 'off', true);

  insert into public.rsvp_responses (event_id, party_id, name, attending, count, companion_names, note, channel)
  values (v_event.id, v_party.id, v_party.primary_guest_name, p_attending, case when p_attending then p_count else 0 end, v_names, v_note, 'guest_link')
  returning id into v_response_id;

  perform doyofy_private.log_activity(v_event.id,
    case when v_edited then 'rsvp_edited' when p_attending then 'rsvp_confirmed' else 'rsvp_declined' end,
    jsonb_build_object('name', v_party.primary_guest_name, 'count', coalesce(p_count, 0), 'attending', p_attending), 'guest', v_party.id);

  return jsonb_build_object('ok', true, 'responseId', v_response_id, 'view', doyofy_private.guest_view(v_event, v_design, v_party));
end $$;
comment on function public.submit_rsvp is 'Public: GuestApi.submitRsvp() with a personal code.';

-- General-link RSVP (no identity). Stored as an unmatched reply for the organizer to match/add/dismiss.
create function public.submit_general_rsvp(p_slug text, p_name text, p_attending boolean, p_count integer default null, p_note text default null)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_key   text := doyofy_private.client_key();
  v_slug  text := lower(btrim(coalesce(p_slug, '')));
  v_name  text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  v_note  text := nullif(btrim(coalesce(p_note, '')), '');
  v_event public.events;
  v_design public.invitation_designs;
  v_problem text;
  v_response_id uuid;
begin
  if doyofy_private.rate_hit('general:' || v_key, interval '10 minutes') > 30 then
    return doyofy_private.guest_error('rate_limited', 'too_many_requests', 429);
  end if;
  select * into v_event from public.events e where e.slug = v_slug;
  if not found or v_event.archived_at is not null then return doyofy_private.guest_error('not_found', 'unknown_event', 404); end if;
  select * into v_design from public.invitation_designs d where d.event_id = v_event.id;
  if v_design.published is null then return doyofy_private.guest_error('not_published', 'not_published', 404); end if;
  if not v_event.allow_general_link then return doyofy_private.guest_error('not_found', 'personal_only', 404); end if;
  if not doyofy_private.rsvp_open(v_event) then return doyofy_private.guest_error('conflict', 'rsvp_closed', 409); end if;
  if v_name = '' then return doyofy_private.guest_error('validation', 'name_required', 400); end if;
  if char_length(v_name) > 120 then return doyofy_private.guest_error('validation', 'name_too_long', 400); end if;
  v_problem := doyofy_private.rsvp_problem(p_attending, p_count, v_event.default_party_size, v_note);
  if v_problem is not null then return doyofy_private.guest_error('validation', v_problem, 400); end if;
  -- spam ceiling: an event cannot accumulate unlimited unmatched replies
  if (select count(*) from public.rsvp_responses r where r.event_id = v_event.id and r.channel = 'general_link'
        and r.resolution is null and r.party_id is null) >= 500 then
    return doyofy_private.guest_error('rate_limited', 'too_many_unmatched', 429);
  end if;

  insert into public.rsvp_responses (event_id, party_id, name, attending, count, note, channel)
  values (v_event.id, null, v_name, p_attending, case when p_attending then p_count else 0 end, v_note, 'general_link')
  returning id into v_response_id;
  perform doyofy_private.log_activity(v_event.id, 'rsvp_unmatched', jsonb_build_object('name', v_name), 'guest', null);

  return jsonb_build_object('ok', true, 'responseId', v_response_id, 'view', doyofy_private.guest_view(v_event, v_design, null::public.parties));
end $$;
comment on function public.submit_general_rsvp is 'Public: GuestApi.submitRsvp() without a code (general link).';

-- -----------------------------------------------------------------------------------------------------
-- Organizer / gate RPCs (authenticated members). Raise PT4xx on failure.
-- -----------------------------------------------------------------------------------------------------

-- Autosave with optimistic concurrency: pass the revision you last saw; a stale revision is a conflict
-- (another device saved in between). NULL base revision = last write wins (first save in a session).
create function public.save_invitation_draft(p_event_id uuid, p_content jsonb, p_base_revision bigint default null)
returns public.invitation_designs language plpgsql volatile security definer set search_path = '' as $$
declare v_design public.invitation_designs;
begin
  perform doyofy_private.require_member(p_event_id);
  if p_content is null or jsonb_typeof(p_content) <> 'object'
     or not (p_content ?& array['experience','cardId','sceneId','displayNames','message','program'])
     or jsonb_typeof(p_content->'program') <> 'array' then
    perform doyofy_private.raise_app(400, 'validation', 'design_invalid');
  end if;
  select * into v_design from public.invitation_designs d where d.event_id = p_event_id for update;
  if not found then
    insert into public.invitation_designs (event_id, draft, draft_saved_by) values (p_event_id, p_content, auth.uid())
    returning * into v_design;
    return v_design;
  end if;
  if p_base_revision is not null and p_base_revision <> v_design.draft_revision then
    perform doyofy_private.raise_app(409, 'conflict', 'draft_revision_conflict', v_design.draft_revision::text);
  end if;
  update public.invitation_designs d
     set draft = p_content, draft_revision = d.draft_revision + 1, draft_saved_at = now(), draft_saved_by = auth.uid()
   where d.id = v_design.id
  returning * into v_design;
  return v_design;
end $$;

-- Copies the current draft into the published snapshot atomically and keeps a version row.
-- p_expected_revision (optional) refuses to publish a draft the organizer has not seen.
create function public.publish_invitation(p_event_id uuid, p_expected_revision bigint default null)
returns public.invitation_designs language plpgsql volatile security definer set search_path = '' as $$
declare v_design public.invitation_designs; v_first boolean;
begin
  perform doyofy_private.require_member(p_event_id);
  select * into v_design from public.invitation_designs d where d.event_id = p_event_id for update;
  if not found then perform doyofy_private.raise_app(409, 'conflict', 'nothing_to_publish'); end if;
  if p_expected_revision is not null and p_expected_revision <> v_design.draft_revision then
    perform doyofy_private.raise_app(409, 'conflict', 'draft_revision_conflict', v_design.draft_revision::text);
  end if;
  v_first := v_design.published is null;
  update public.invitation_designs d
     set published = d.draft, published_at = now(), published_version = d.published_version + 1
   where d.id = v_design.id
  returning * into v_design;
  insert into public.invitation_design_versions (design_id, event_id, version, content, published_by)
  values (v_design.id, p_event_id, v_design.published_version, v_design.published, auth.uid());
  perform doyofy_private.log_activity(p_event_id, 'invitation_published', jsonb_build_object('first', v_first));
  return v_design;
end $$;

-- Gate check-in. Idempotent on (event, idempotency key): a replay returns the original result.
-- Exceptions are RE-COMPUTED on the locked row; every blocking exception must be in p_exceptions
-- (the staff acknowledgement), otherwise 409 exceptions_not_acknowledged (state changed under the
-- staff member, e.g. another gate just checked the same party in). 'no_table' never blocks.
create function public.check_in_party(p_event_id uuid, p_party_id uuid, p_count integer, p_idempotency_key text,
                                      p_method text default 'search', p_exceptions text[] default '{}',
                                      p_note text default null, p_by text default null)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_party public.parties;
  v_event public.events;
  v_existing public.check_ins;
  v_record public.check_ins;
  v_ex text[];
  v_blocking text[];
  v_missing text[];
  v_total integer;
  v_expected integer;
  v_status text;
begin
  if auth.uid() is null then perform doyofy_private.raise_app(401, 'forbidden', 'not_authenticated'); end if;
  if p_idempotency_key is null or char_length(p_idempotency_key) not between 8 and 100 then
    perform doyofy_private.raise_app(400, 'validation', 'idempotency_key_invalid');
  end if;
  -- lock first, so two concurrent replays of the same key serialise and the second sees the first
  select * into v_party from public.parties p where p.id = p_party_id for update;
  if not found then perform doyofy_private.raise_app(404, 'not_found', 'party_not_found'); end if;
  if p_event_id is not null and p_event_id <> v_party.event_id then perform doyofy_private.raise_app(404, 'not_found', 'party_not_found'); end if;
  perform doyofy_private.require_member(v_party.event_id);

  select * into v_existing from public.check_ins c where c.event_id = v_party.event_id and c.idempotency_key = p_idempotency_key;
  if found then
    if v_existing.party_id <> p_party_id or v_existing.count <> p_count then
      perform doyofy_private.raise_app(409, 'conflict', 'idempotency_key_reused');
    end if;
    return jsonb_build_object('party', to_jsonb(v_party), 'record', to_jsonb(v_existing),
                              'counts', doyofy_private.event_counts(v_party.event_id), 'replayed', true);
  end if;

  select * into v_event from public.events e where e.id = v_party.event_id;
  if v_event.archived_at is not null then perform doyofy_private.raise_app(409, 'conflict', 'event_archived'); end if;
  if p_count is null or p_count < 1 or p_count > 50 then perform doyofy_private.raise_app(400, 'validation', 'check_in_count_invalid'); end if;
  if p_method is null or p_method not in ('qr', 'search') then perform doyofy_private.raise_app(400, 'validation', 'check_in_method_invalid'); end if;
  if p_note is not null and char_length(p_note) > 500 then perform doyofy_private.raise_app(400, 'validation', 'note_too_long'); end if;

  v_ex := doyofy_private.check_in_exceptions(v_party, p_count);
  v_blocking := array(select x from unnest(v_ex) as x where x <> 'no_table');
  v_missing := array(select x from unnest(v_blocking) as x where not (x = any (coalesce(p_exceptions, '{}'::text[]))));
  if cardinality(v_missing) > 0 then
    perform doyofy_private.raise_app(409, 'conflict', 'exceptions_not_acknowledged', array_to_string(v_missing, ','));
  end if;

  insert into public.check_ins (event_id, party_id, count, method, by_label, by_user, exceptions, acknowledged, staff_note, idempotency_key)
  values (v_party.event_id, v_party.id, p_count, p_method, left(coalesce(p_by, ''), 80), auth.uid(), v_ex,
          coalesce(p_exceptions, '{}'::text[]), nullif(btrim(coalesce(p_note, '')), ''), p_idempotency_key)
  returning * into v_record;

  v_total := v_party.checked_in_count + p_count;
  v_status := doyofy_private.check_in_status_after(v_party, v_total);
  update public.parties p set checked_in_count = v_total, check_in_status = v_status where p.id = v_party.id
  returning * into v_party;

  v_expected := case when v_party.rsvp_status = 'confirmed' then coalesce(v_party.confirmed_party_size, v_party.max_party_size) else v_party.max_party_size end;
  if cardinality(v_blocking) > 0 then
    perform doyofy_private.log_activity(v_party.event_id, 'check_in_exception',
      jsonb_build_object('name', v_party.primary_guest_name, 'reason', doyofy_private.exception_title(v_blocking[1]), 'reasonCode', v_blocking[1]), 'gate', v_party.id);
  elsif v_status = 'partial' then
    perform doyofy_private.log_activity(v_party.event_id, 'checked_in_partial',
      jsonb_build_object('name', v_party.primary_guest_name, 'total', v_total, 'expected', v_expected), 'gate', v_party.id);
  else
    perform doyofy_private.log_activity(v_party.event_id, 'checked_in',
      jsonb_build_object('name', v_party.primary_guest_name, 'count', v_total), 'gate', v_party.id);
  end if;

  return jsonb_build_object('party', to_jsonb(v_party), 'record', to_jsonb(v_record),
                            'counts', doyofy_private.event_counts(v_party.event_id), 'replayed', false);
end $$;

-- Auditable undo: the record stays, stamped with who/when/why; the party count is recomputed.
create function public.undo_check_in(p_check_in_id uuid, p_reason text default null)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_record public.check_ins; v_party public.parties; v_total integer;
begin
  if auth.uid() is null then perform doyofy_private.raise_app(401, 'forbidden', 'not_authenticated'); end if;
  select * into v_record from public.check_ins c where c.id = p_check_in_id;
  if not found then perform doyofy_private.raise_app(404, 'not_found', 'check_in_not_found'); end if;
  perform doyofy_private.require_member(v_record.event_id);
  select * into v_party from public.parties p where p.id = v_record.party_id for update;
  select * into v_record from public.check_ins c where c.id = p_check_in_id for update;
  if v_record.undone_at is not null then perform doyofy_private.raise_app(409, 'conflict', 'already_undone'); end if;

  update public.check_ins c set undone_at = now(), undone_by = auth.uid(), undo_reason = nullif(left(btrim(coalesce(p_reason, '')), 300), '')
   where c.id = v_record.id returning * into v_record;
  v_total := greatest(0, v_party.checked_in_count - v_record.count);
  update public.parties p set checked_in_count = v_total, check_in_status = doyofy_private.check_in_status_after(v_party, v_total)
   where p.id = v_party.id returning * into v_party;
  perform doyofy_private.log_activity(v_party.event_id, 'check_in_undone', jsonb_build_object('name', v_party.primary_guest_name), 'gate', v_party.id);

  return jsonb_build_object('party', to_jsonb(v_party), 'record', to_jsonb(v_record), 'counts', doyofy_private.event_counts(v_party.event_id));
end $$;

-- Organizer records a reply received by phone etc. (RsvpRepository.setByOrganizer). No edit window.
create function public.set_rsvp_by_organizer(p_party_id uuid, p_attending boolean, p_count integer default null,
                                             p_companion_names text[] default null, p_note text default null)
returns public.parties language plpgsql volatile security definer set search_path = '' as $$
declare v_party public.parties; v_problem text; v_edited boolean; v_names text[] := doyofy_private.clean_names(p_companion_names);
        v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  select * into v_party from public.parties p where p.id = p_party_id for update;
  if not found then perform doyofy_private.raise_app(404, 'not_found', 'party_not_found'); end if;
  perform doyofy_private.require_member(v_party.event_id);
  v_problem := doyofy_private.rsvp_problem(p_attending, p_count, v_party.max_party_size, v_note);
  if v_problem is not null then perform doyofy_private.raise_app(400, 'validation', v_problem); end if;
  v_edited := v_party.rsvp_status <> 'pending';
  perform set_config('doyofy.bulk', 'on', true);
  update public.parties p set
    rsvp_status = case when p_attending then 'confirmed' else 'declined' end,
    confirmed_party_size = case when p_attending then p_count else 0 end,
    companion_names = coalesce(v_names, p.companion_names), guest_note = v_note, responded_at = now()
  where p.id = v_party.id returning * into v_party;
  perform set_config('doyofy.bulk', 'off', true);
  insert into public.rsvp_responses (event_id, party_id, name, attending, count, companion_names, note, channel)
  values (v_party.event_id, v_party.id, v_party.primary_guest_name, p_attending, case when p_attending then p_count else 0 end, v_names, v_note, 'organizer');
  perform doyofy_private.log_activity(v_party.event_id,
    case when v_edited then 'rsvp_edited' when p_attending then 'rsvp_confirmed' else 'rsvp_declined' end,
    jsonb_build_object('name', v_party.primary_guest_name, 'count', coalesce(p_count, 0), 'attending', p_attending, 'by', 'organizer'), 'organizer', v_party.id);
  return v_party;
end $$;

-- Organizer says they shared the link themselves (D-031: opening WhatsApp alone never marks delivery).
-- Never downgrades a platform-known 'opened'.
create function public.mark_parties_shared(p_party_ids uuid[]) returns integer
language plpgsql volatile security definer set search_path = '' as $$
declare v_event uuid; v_events integer; v_count integer; v_first text;
begin
  select count(distinct p.event_id), min(p.event_id::text)::uuid into v_events, v_event from public.parties p where p.id = any (p_party_ids);
  if v_events = 0 then perform doyofy_private.raise_app(404, 'not_found', 'party_not_found'); end if;
  if v_events > 1 then perform doyofy_private.raise_app(400, 'validation', 'mixed_events'); end if;
  perform doyofy_private.require_member(v_event);
  update public.parties p
     set delivery_status = 'shared', delivery_source = 'manual', delivery_at = now(), delivery_failure_reason = null
   where p.id = any (p_party_ids) and p.delivery_status <> 'opened';
  get diagnostics v_count = row_count;
  select p.primary_guest_name into v_first from public.parties p where p.id = p_party_ids[1];
  perform doyofy_private.log_activity(v_event, 'invitation_shared',
    jsonb_build_object('count', cardinality(p_party_ids), 'name', v_first, 'how', 'manual'), 'organizer',
    case when cardinality(p_party_ids) = 1 then p_party_ids[1] end);
  return v_count;
end $$;

-- Import boundary: the client has already reviewed rows (src/domain/import.ts); the server re-validates
-- every row through table constraints, caps the batch, generates codes, and logs ONE timeline entry.
create function public.import_parties(p_event_id uuid, p_rows jsonb, p_skipped integer default 0, p_source text default 'file')
returns setof public.parties language plpgsql volatile security definer set search_path = '' as $$
declare v_count integer;
begin
  perform doyofy_private.require_member(p_event_id);
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then perform doyofy_private.raise_app(400, 'validation', 'import_rows_invalid'); end if;
  v_count := jsonb_array_length(p_rows);
  if v_count = 0 then perform doyofy_private.raise_app(400, 'validation', 'import_empty'); end if;
  if v_count > 2000 then perform doyofy_private.raise_app(400, 'validation', 'import_too_large'); end if;
  perform set_config('doyofy.bulk', 'on', true);
  return query
    insert into public.parties (event_id, code, primary_guest_name, phone, max_party_size, companion_names, notes, side, source)
    select p_event_id, 'PENDING', r.primary_guest_name, nullif(btrim(r.phone), ''), r.max_party_size, r.companion_names,
           nullif(btrim(r.notes), ''), nullif(btrim(r.side), ''), 'import'
      from jsonb_to_recordset(p_rows) as r(primary_guest_name text, phone text, max_party_size integer,
                                           companion_names text[], notes text, side text)
    returning *;
  perform set_config('doyofy.bulk', 'off', true);
  perform doyofy_private.log_activity(p_event_id, 'parties_imported',
    jsonb_build_object('count', v_count, 'skipped', greatest(0, coalesce(p_skipped, 0)), 'source', left(coalesce(p_source, 'file'), 40)));
end $$;

-- General-link reply -> existing party (RsvpRepository.matchResponse).
create function public.match_rsvp_response(p_response_id uuid, p_party_id uuid) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare v_resp public.rsvp_responses; v_party public.parties;
begin
  select * into v_resp from public.rsvp_responses r where r.id = p_response_id for update;
  if not found then perform doyofy_private.raise_app(404, 'not_found', 'response_not_found'); end if;
  perform doyofy_private.require_member(v_resp.event_id);
  if v_resp.channel <> 'general_link' or v_resp.resolution is not null then perform doyofy_private.raise_app(409, 'conflict', 'response_already_resolved'); end if;
  select * into v_party from public.parties p where p.id = p_party_id and p.event_id = v_resp.event_id for update;
  if not found then perform doyofy_private.raise_app(404, 'not_found', 'party_not_found'); end if;
  if v_resp.attending and v_resp.count > v_party.max_party_size then
    perform doyofy_private.raise_app(400, 'validation', 'count_exceeds_allowed', v_resp.count::text || '/' || v_party.max_party_size::text);
  end if;
  update public.parties p set
    rsvp_status = case when v_resp.attending then 'confirmed' else 'declined' end,
    confirmed_party_size = case when v_resp.attending then v_resp.count else 0 end,
    guest_note = coalesce(v_resp.note, p.guest_note), responded_at = now()
  where p.id = v_party.id;
  update public.rsvp_responses r set party_id = v_party.id, resolution = 'matched', resolved_at = now(), resolved_by = auth.uid() where r.id = v_resp.id;
  perform doyofy_private.log_activity(v_resp.event_id, 'rsvp_matched', jsonb_build_object('name', v_resp.name), 'organizer', v_party.id);
end $$;

-- General-link reply -> new party (RsvpRepository.addPartyFromResponse).
create function public.add_party_from_response(p_response_id uuid) returns public.parties
language plpgsql volatile security definer set search_path = '' as $$
declare v_resp public.rsvp_responses; v_party public.parties;
begin
  select * into v_resp from public.rsvp_responses r where r.id = p_response_id for update;
  if not found then perform doyofy_private.raise_app(404, 'not_found', 'response_not_found'); end if;
  perform doyofy_private.require_member(v_resp.event_id);
  if v_resp.channel <> 'general_link' or v_resp.resolution is not null then perform doyofy_private.raise_app(409, 'conflict', 'response_already_resolved'); end if;
  insert into public.parties (event_id, code, primary_guest_name, max_party_size, delivery_status, delivery_source, delivery_at, delivery_opened_at,
                              rsvp_status, confirmed_party_size, responded_at, guest_note, source)
  values (v_resp.event_id, 'PENDING', v_resp.name, greatest(1, v_resp.count), 'opened', 'platform', v_resp.at, v_resp.at,
          case when v_resp.attending then 'confirmed' else 'declined' end,
          case when v_resp.attending then greatest(1, v_resp.count) else 0 end, v_resp.at, v_resp.note, 'general_link')
  returning * into v_party;
  update public.rsvp_responses r set party_id = v_party.id, resolution = 'added', resolved_at = now(), resolved_by = auth.uid() where r.id = v_resp.id;
  return v_party;
end $$;

create function public.dismiss_rsvp_response(p_response_id uuid) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare v_resp public.rsvp_responses;
begin
  select * into v_resp from public.rsvp_responses r where r.id = p_response_id for update;
  if not found then return; end if;
  perform doyofy_private.require_member(v_resp.event_id);
  if v_resp.channel = 'general_link' and v_resp.resolution is null then
    update public.rsvp_responses r set resolution = 'dismissed', resolved_at = now(), resolved_by = auth.uid() where r.id = v_resp.id;
  end if;
end $$;

-- Data portability: everything stored for one event, organizer-only.
create function public.export_event_data(p_event_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform doyofy_private.require_organizer(p_event_id);
  return jsonb_build_object(
    'exportedAt', now(),
    'event',      (select to_jsonb(e) from public.events e where e.id = p_event_id),
    'members',    (select coalesce(jsonb_agg(to_jsonb(m)), '[]') from public.event_members m where m.event_id = p_event_id),
    'design',     (select to_jsonb(d) from public.invitation_designs d where d.event_id = p_event_id),
    'versions',   (select coalesce(jsonb_agg(to_jsonb(v) order by v.version), '[]') from public.invitation_design_versions v where v.event_id = p_event_id),
    'tables',     (select coalesce(jsonb_agg(to_jsonb(t) order by t.sort_order), '[]') from public.seating_tables t where t.event_id = p_event_id),
    'parties',    (select coalesce(jsonb_agg(to_jsonb(p) order by p.created_at), '[]') from public.parties p where p.event_id = p_event_id),
    'responses',  (select coalesce(jsonb_agg(to_jsonb(r) order by r.at), '[]') from public.rsvp_responses r where r.event_id = p_event_id),
    'checkIns',   (select coalesce(jsonb_agg(to_jsonb(c) order by c.at), '[]') from public.check_ins c where c.event_id = p_event_id),
    'activity',   (select coalesce(jsonb_agg(to_jsonb(a) order by a.at), '[]') from public.event_activity a where a.event_id = p_event_id));
end $$;

-- Data minimisation after an event: strips guest contact details and free text, keeps counts.
-- Organizer-only and irreversible (backups excepted — see README retention note).
create function public.anonymise_event_guests(p_event_id uuid) returns integer
language plpgsql volatile security definer set search_path = '' as $$
declare v_count integer;
begin
  perform doyofy_private.require_organizer(p_event_id);
  perform set_config('doyofy.bulk', 'on', true);
  update public.parties p set phone = null, notes = null, companion_names = null, guest_note = null where p.event_id = p_event_id;
  get diagnostics v_count = row_count;
  update public.rsvp_responses r set companion_names = null, note = null where r.event_id = p_event_id;
  update public.check_ins c set staff_note = null where c.event_id = p_event_id;
  perform set_config('doyofy.bulk', 'off', true);
  return v_count;
end $$;

-- Liveness/readiness probe for uptime monitors (anon). Touches the database, reveals no data.
create function public.doyofy_health() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('ok', true, 'schema', '0001_doyofy_init', 'at', now(),
                            'events_table', to_regclass('public.events') is not null);
$$;

-- -----------------------------------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------------------------------
alter table public.events                     enable row level security;
alter table public.event_members              enable row level security;
alter table public.invitation_designs         enable row level security;
alter table public.invitation_design_versions enable row level security;
alter table public.seating_tables             enable row level security;
alter table public.parties                    enable row level security;
alter table public.rsvp_responses             enable row level security;
alter table public.check_ins                  enable row level security;
alter table public.event_activity             enable row level security;
alter table doyofy_private.rate_limits        enable row level security;  -- no policies: definer functions only

-- events ------------------------------------------------------------------------------------------------
-- SELECT: the owner, or any member of the event. owner_id is checked directly so INSERT … RETURNING works
-- before the membership trigger's row is visible.
create policy events_select on public.events for select to authenticated
  using (owner_id = (select auth.uid()) or doyofy_private.is_event_member(id));
-- INSERT: a signed-in user can only create events they own.
create policy events_insert on public.events for insert to authenticated
  with check (owner_id = (select auth.uid()));
-- UPDATE: members may edit details/settings; immutable fields and organizer-only archive are enforced by
-- the events_guard trigger and column grants.
create policy events_update on public.events for update to authenticated
  using (doyofy_private.is_event_member(id)) with check (doyofy_private.is_event_member(id));
-- DELETE: only the owner can permanently delete an event (cascades to all guest data).
create policy events_delete on public.events for delete to authenticated
  using (owner_id = (select auth.uid()));

-- event_members ---------------------------------------------------------------------------------------
-- SELECT: members can see who else works on the event.
create policy members_select on public.event_members for select to authenticated
  using (doyofy_private.is_event_member(event_id));
-- INSERT/UPDATE: organizers manage the team. (Finding the invitee's user id needs an invite flow — see README.)
create policy members_insert on public.event_members for insert to authenticated
  with check (doyofy_private.is_event_organizer(event_id));
create policy members_update on public.event_members for update to authenticated
  using (doyofy_private.is_event_organizer(event_id)) with check (doyofy_private.is_event_organizer(event_id));
-- DELETE: organizers can remove members, but never the owner; any member can leave (remove themselves).
create policy members_delete on public.event_members for delete to authenticated
  using (
    (doyofy_private.is_event_organizer(event_id) or user_id = (select auth.uid()))
    and user_id <> (select e.owner_id from public.events e where e.id = event_id));

-- invitation_designs / versions -----------------------------------------------------------------------
-- SELECT only: members read draft + published snapshot. Writes go through save_invitation_draft /
-- publish_invitation so revisions and versions stay consistent. Guests never read this table; they get
-- the published snapshot from get_public_invitation().
create policy designs_select on public.invitation_designs for select to authenticated
  using (doyofy_private.is_event_member(event_id));
-- SELECT only: members can browse publish history.
create policy design_versions_select on public.invitation_design_versions for select to authenticated
  using (doyofy_private.is_event_member(event_id));

-- seating_tables -----------------------------------------------------------------------------------------
-- Members manage tables of their own events; WITH CHECK stops moving a table into someone else's event.
create policy tables_select on public.seating_tables for select to authenticated using (doyofy_private.is_event_member(event_id));
create policy tables_insert on public.seating_tables for insert to authenticated with check (doyofy_private.is_event_member(event_id));
create policy tables_update on public.seating_tables for update to authenticated
  using (doyofy_private.is_event_member(event_id)) with check (doyofy_private.is_event_member(event_id));
create policy tables_delete on public.seating_tables for delete to authenticated using (doyofy_private.is_event_member(event_id));

-- parties ---------------------------------------------------------------------------------------------
-- Members read and manage their event's guest list (contains guest PII: phone numbers).
-- Column grants below restrict UPDATE to identity/seating columns; RSVP, delivery and check-in state can
-- only change through RPCs.
create policy parties_select on public.parties for select to authenticated using (doyofy_private.is_event_member(event_id));
create policy parties_insert on public.parties for insert to authenticated with check (doyofy_private.is_event_member(event_id));
create policy parties_update on public.parties for update to authenticated
  using (doyofy_private.is_event_member(event_id)) with check (doyofy_private.is_event_member(event_id));
create policy parties_delete on public.parties for delete to authenticated using (doyofy_private.is_event_member(event_id));

-- rsvp_responses / check_ins / event_activity ----------------------------------------------------------
-- SELECT only for members. All writes come from SECURITY DEFINER RPCs/triggers, so history can't be forged
-- or edited from the client.
create policy responses_select on public.rsvp_responses for select to authenticated using (doyofy_private.is_event_member(event_id));
create policy check_ins_select on public.check_ins      for select to authenticated using (doyofy_private.is_event_member(event_id));
create policy activity_select  on public.event_activity for select to authenticated using (doyofy_private.is_event_member(event_id));

-- -----------------------------------------------------------------------------------------------------
-- Privileges (Supabase grants broad defaults on `public`; tighten them explicitly)
-- -----------------------------------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all tables in schema doyofy_private from public, anon, authenticated;

grant select, insert, delete on public.events to authenticated;
grant update (type, title, names, date, time, time_zone, duration_hours, venue, default_party_size,
              reveal_table_to_guests, allow_general_link, check_in_prepared_at, archived_at)
  on public.events to authenticated;

grant select, insert, update, delete on public.event_members to authenticated;
grant select on public.invitation_designs, public.invitation_design_versions to authenticated;
grant select, insert, update, delete on public.seating_tables to authenticated;

grant select, delete on public.parties to authenticated;
grant insert (event_id, primary_guest_name, phone, max_party_size, companion_names, notes, side) on public.parties to authenticated;
grant update (primary_guest_name, phone, max_party_size, companion_names, notes, side, table_id) on public.parties to authenticated;

grant select on public.rsvp_responses, public.check_ins, public.event_activity to authenticated;

-- Functions: nothing is executable unless granted below.
revoke execute on all functions in schema public from public, anon, authenticated;
revoke execute on all functions in schema doyofy_private from public, anon, authenticated;
grant execute on function doyofy_private.is_event_member(uuid), doyofy_private.is_event_organizer(uuid) to authenticated;

grant execute on function public.get_public_invitation(text, text, boolean) to anon, authenticated;
grant execute on function public.submit_rsvp(text, text, boolean, integer, text[], text) to anon, authenticated;
grant execute on function public.submit_general_rsvp(text, text, boolean, integer, text) to anon, authenticated;
grant execute on function public.doyofy_health() to anon, authenticated;

grant execute on function public.save_invitation_draft(uuid, jsonb, bigint) to authenticated;
grant execute on function public.publish_invitation(uuid, bigint) to authenticated;
grant execute on function public.check_in_party(uuid, uuid, integer, text, text, text[], text, text) to authenticated;
grant execute on function public.undo_check_in(uuid, text) to authenticated;
grant execute on function public.set_rsvp_by_organizer(uuid, boolean, integer, text[], text) to authenticated;
grant execute on function public.mark_parties_shared(uuid[]) to authenticated;
grant execute on function public.import_parties(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.match_rsvp_response(uuid, uuid) to authenticated;
grant execute on function public.add_party_from_response(uuid) to authenticated;
grant execute on function public.dismiss_rsvp_response(uuid) to authenticated;
grant execute on function public.export_event_data(uuid) to authenticated;
grant execute on function public.anonymise_event_guests(uuid) to authenticated;

-- Future objects created by this role in public must not silently become callable by anon.
alter default privileges in schema public revoke execute on functions from public, anon;
