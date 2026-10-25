-- LOCAL ONLY smoke test for 0001_doyofy_init.sql (run via run_local.sh, psql -v ON_ERROR_STOP=1).
-- Exercises RLS isolation, column grants, the public guest RPCs, draft revisions, publish, check-in
-- idempotency/exception acknowledgement, auditable undo, edit window, archive and rate limiting.
-- Not a substitute for testing against a real Supabase project (PostgREST, GoTrue JWTs, headers).
\set ON_ERROR_STOP on
\pset pager off
set client_min_messages = notice;

create schema t;
grant usage on schema t to anon, authenticated;
create function t.expect_error(p_sql text, p_like text) returns void language plpgsql as $$
declare v_state text; v_msg text; v_hint text; v_detail text;
begin
  begin
    execute p_sql;
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate, v_msg = message_text, v_hint = pg_exception_hint, v_detail = pg_exception_detail;
    if (v_state || ' ' || v_msg || ' ' || coalesce(v_hint, '') || ' ' || coalesce(v_detail, '')) not like p_like then
      raise exception 'expected error like "%" but got: % % %', p_like, v_state, v_msg, v_hint;
    end if;
    raise notice 'ok (expected error) %: % %', p_like, v_state, v_msg;
    return;
  end;
  raise exception 'expected error like "%" but statement succeeded: %', p_like, p_sql;
end $$;
create function t.ok(p_cond boolean, p_label text) returns void language plpgsql as $$
begin
  if not coalesce(p_cond, false) then raise exception 'FAILED: %', p_label; end if;
  raise notice 'ok: %', p_label;
end $$;
grant execute on all functions in schema t to anon, authenticated;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'outsider@example.test'),
  ('00000000-0000-0000-0000-00000000000c', 'coordinator@example.test');

select set_config('request.headers', '{"x-forwarded-for":"203.0.113.7"}', false);

-- ---------------------------------------------------------------- owner creates an event + guests
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
insert into public.events (type, title, names, date, time, venue, slug)
values ('wedding', 'زفاف سارة وأحمد', '{"a":"سارة","b":"أحمد"}', (now() + interval '20 days')::date, '20:00',
        '{"name":"قاعة الورد","city":"الرياض"}', 'sara-ahmed')
returning id as event_id \gset
select t.ok((select count(*) = 1 from public.event_members where event_id = :'event_id' and role = 'organizer'), 'owner is organizer member');
select t.expect_error($$insert into public.events (type, title, names, date, time, venue, slug) values ('wedding','x','{"a":"x"}','2030-01-01','20:00','{"name":"q","city":"c"}','sara-ahmed')$$, '23505%');
select t.expect_error($$insert into public.events (type, title, names, date, time, venue, slug, time_zone) values ('wedding','x','{"a":"x"}','2030-01-01','20:00','{"name":"q","city":"c"}','tz-bad','Mars/Base')$$, 'PT400%invalid_time_zone%');

insert into public.parties (event_id, primary_guest_name, phone, max_party_size)
values (:'event_id', '  عائلة   الدوسري ', '+966551203344', 4) returning id as party_id, code as party_code \gset
select t.ok(:'party_code' ~ '^[A-Z0-9]{6}$', 'server generated 6-char party code');
select t.ok((select primary_guest_name = 'عائلة الدوسري' from public.parties where id = :'party_id'), 'name normalised');
select t.expect_error(format($$update public.parties set rsvp_status = 'confirmed' where id = %L$$, :'party_id'), '42501%');
select t.expect_error(format($$update public.parties set checked_in_count = 9 where id = %L$$, :'party_id'), '42501%');
select t.expect_error(format($$insert into public.parties (event_id, primary_guest_name, phone, max_party_size) values (%L, 'x', '0551', 2)$$, :'event_id'), '23514%');
select t.expect_error(format($$insert into public.parties (event_id, primary_guest_name, max_party_size) values (%L, 'x', 21)$$, :'event_id'), '23514%');
select t.expect_error(format($$insert into public.parties (id, event_id, primary_guest_name, max_party_size) values (gen_random_uuid(), %L, 'x', 2)$$, :'event_id'), '42501%');
select t.expect_error(format($$insert into public.parties (event_id, primary_guest_name, max_party_size, rsvp_status) values (%L, 'x', 2, 'confirmed')$$, :'event_id'), '42501%');

-- coordinator membership
insert into public.event_members (event_id, user_id, role) values (:'event_id', '00000000-0000-0000-0000-00000000000c', 'coordinator');

-- ---------------------------------------------------------------- outsider sees nothing, can do nothing
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
select t.ok((select count(*) = 0 from public.events), 'outsider sees no events');
select t.ok((select count(*) = 0 from public.parties), 'outsider sees no parties');
update public.parties set primary_guest_name = 'hijack' where id = :'party_id';
select t.expect_error(format($$select public.check_in_party(null, %L, 1, 'outsider-key-1')$$, :'party_id'), 'PT403%not_a_member%');
select t.expect_error(format($$select public.save_invitation_draft(%L, '{}'::jsonb)$$, :'event_id'), 'PT403%');
select t.expect_error(format($$insert into public.parties (event_id, primary_guest_name, max_party_size) values (%L, 'x', 2)$$, :'event_id'), '42501%row-level security%');

-- ---------------------------------------------------------------- anon: no table access; unpublished invitation
reset role;
select t.ok((select primary_guest_name = 'عائلة الدوسري' from public.parties where id = :'party_id'), 'outsider update affected 0 rows');
set role anon;
select set_config('request.jwt.claim.sub', '', false);
select t.expect_error('select * from public.parties', '42501%');
select t.expect_error('select * from public.events', '42501%');
select t.expect_error(format($$select public.save_invitation_draft(%L, '{}'::jsonb)$$, :'event_id'), '42501%');
select t.ok((select public.get_public_invitation('sara-ahmed', :'party_code')->>'reason' = 'not_published'), 'unpublished -> not_published');
select t.ok((select public.get_public_invitation('nope', null)->>'reason' = 'unknown_event'), 'unknown slug -> unknown_event');
select t.ok((select (public.doyofy_health()->>'ok')::boolean), 'anon health probe');

-- ---------------------------------------------------------------- draft revisions + publish
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
\set design '{"experience":{"dimension":"3d","motion":"animated"},"cardId":"lace","sceneId":"candlelit","displayNames":{},"message":{"ar":"أهلًا","en":"Welcome"},"program":[]}'
select t.expect_error(format($$select public.publish_invitation(%L)$$, :'event_id'), 'PT409%nothing_to_publish%');
select t.expect_error(format($$select public.save_invitation_draft(%L, '{"cardId":"x"}'::jsonb)$$, :'event_id'), 'PT400%design_invalid%');
select t.ok((select (public.save_invitation_draft(:'event_id', :'design'::jsonb)).draft_revision = 1), 'first draft revision 1');
select t.ok((select (public.save_invitation_draft(:'event_id', :'design'::jsonb, 1)).draft_revision = 2), 'save on base 1 -> revision 2');
select t.expect_error(format($$select public.save_invitation_draft(%L, %L::jsonb, 1)$$, :'event_id', :'design'), 'PT409%draft_revision_conflict%');
select t.ok((select (public.publish_invitation(:'event_id')).published_version = 1), 'coordinator can publish, version 1');
select t.ok((select count(*) = 1 from public.invitation_design_versions where event_id = :'event_id'), 'version row kept');

-- ---------------------------------------------------------------- public guest path
set role anon;
select set_config('request.jwt.claim.sub', '', false);
select t.ok((select public.get_public_invitation('sara-ahmed', 'ZZZZZZ')->>'reason' = 'unknown_code'), 'wrong code -> unknown_code');
select t.ok((select public.get_public_invitation('sara-ahmed', null)->>'reason' = 'personal_only'), 'general link disabled -> personal_only');
select t.ok((select (public.get_public_invitation('Sara-Ahmed', lower(:'party_code'))->'view'->'party'->>'maxPartySize')::int = 4), 'personal link opens (case-insensitive)');
select t.ok((select public.get_public_invitation('sara-ahmed', :'party_code')->'view'->'party' ? 'phone') = false, 'guest view never exposes phone');
select t.ok((select public.submit_rsvp('sara-ahmed', :'party_code', true, 5)->>'reason' = 'count_exceeds_allowed'), 'RSVP over allowance rejected');
select t.ok((select public.submit_rsvp('sara-ahmed', :'party_code', true, 0)->>'reason' = 'count_too_low'), 'RSVP zero rejected');
select t.ok((select public.submit_rsvp('sara-ahmed', :'party_code', true, 4, array['أحمد',' '], 'نراكم')->>'ok' = 'true'), 'RSVP 4 accepted');

reset role;
select t.ok((select rsvp_status = 'confirmed' and confirmed_party_size = 4 and delivery_status = 'opened' and companion_names = array['أحمد'] from public.parties where id = :'party_id'), 'party confirmed 4, opened, companions cleaned');

-- general link
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
update public.events set allow_general_link = true where id = :'event_id';
set role anon;
select set_config('request.jwt.claim.sub', '', false);
select t.ok((select public.submit_general_rsvp('sara-ahmed', ' ', true, 1)->>'reason' = 'name_required'), 'general RSVP needs a name');
select t.ok((select public.submit_general_rsvp('sara-ahmed', 'ضيف', true, 3)->>'reason' = 'count_exceeds_allowed'), 'general RSVP limited by default party size');
select public.submit_general_rsvp('sara-ahmed', 'ضيف جديد', true, 2)->>'responseId' as response_id \gset
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
select t.ok((select party_id is null and resolution is null from public.rsvp_responses where id = :'response_id'), 'general reply waits unmatched');
select (public.add_party_from_response(:'response_id')).id as general_party_id \gset
select t.ok((select resolution = 'added' and party_id = :'general_party_id' from public.rsvp_responses where id = :'response_id'), 'general reply added as party');
select t.expect_error(format($$select public.match_rsvp_response(%L, %L)$$, :'response_id', :'party_id'), 'PT409%response_already_resolved%');

-- ---------------------------------------------------------------- seating guard
insert into public.seating_tables (event_id, name, capacity) values (:'event_id', 'طاولة 1', 10) returning id as table_id \gset
insert into public.parties (event_id, primary_guest_name, max_party_size) values (:'event_id', 'لم يرد', 2) returning id as pending_party_id \gset
select t.expect_error(format($$update public.parties set table_id = %L where id = %L$$, :'table_id', :'pending_party_id'), 'PT400%seat_requires_confirmed%');

-- ---------------------------------------------------------------- check-in: idempotency, acknowledgement, undo
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
select t.ok((select public.check_in_party(null, :'general_party_id', 1, 'gate-key-0001')->'record'->'exceptions' = '["no_table"]'::jsonb), 'no_table is recorded but does not block');
select t.ok((select public.check_in_party(null, :'pending_party_id', 1, 'gate-key-0000', 'search', array['pending_arrived'])->'party'->>'check_in_status' = 'partial'), 'pending party admitted only with acknowledgement');
update public.parties set table_id = :'table_id' where id = :'party_id';
select (public.check_in_party(:'event_id', :'party_id', 2, 'gate-key-0002', 'qr', '{}', null, 'بوابة 1')->'record'->>'id') as rec1 \gset
select t.ok((select checked_in_count = 2 and check_in_status = 'partial' from public.parties where id = :'party_id'), 'partial check-in 2/4');
select t.ok((select (public.check_in_party(:'event_id', :'party_id', 2, 'gate-key-0002')->>'replayed')::boolean), 'replay with same key is idempotent');
select t.ok((select checked_in_count = 2 from public.parties where id = :'party_id'), 'replay did not double count');
select t.expect_error(format($$select public.check_in_party(%L, %L, 3, 'gate-key-0002')$$, :'event_id', :'party_id'), 'PT409%idempotency_key_reused%');
select t.expect_error(format($$select public.check_in_party(%L, %L, 3, 'gate-key-0003')$$, :'event_id', :'party_id'), 'PT409%exceptions_not_acknowledged%over_allowed%');
select (public.check_in_party(:'event_id', :'party_id', 3, 'gate-key-0003', 'search', array['over_allowed'], 'وافق المنظم')->'counts'->>'checkedInPeople')::int as checked_people \gset
select t.ok(:checked_people = 7, 'server counts: 5 + 1 + 1 checked-in people');
select (select id from public.check_ins where idempotency_key = 'gate-key-0003') as rec2 \gset
select t.ok((select (public.undo_check_in(:'rec2', 'خطأ في العدد')->'party'->>'checked_in_count')::int = 2), 'undo restores 2');
select t.expect_error(format($$select public.undo_check_in(%L)$$, :'rec2'), 'PT409%already_undone%');
select t.ok((select undone_at is not null and undone_by is not null and undo_reason = 'خطأ في العدد' from public.check_ins where id = :'rec2'), 'undo is auditable (record kept)');
select t.expect_error(format($$delete from public.check_ins where id = %L$$, :'rec2'), '42501%');

-- ---------------------------------------------------------------- roles: archive is organizer-only; export organizer-only
select t.expect_error(format($$update public.events set archived_at = now() where id = %L$$, :'event_id'), 'PT403%organizer_only%');
select t.expect_error(format($$select public.export_event_data(%L)$$, :'event_id'), 'PT403%organizer_only%');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
select t.ok((select jsonb_array_length(public.export_event_data(:'event_id')->'parties') = 3), 'organizer export includes parties');

-- ---------------------------------------------------------------- edit window closes at event start
reset role;
update public.events set date = (now() - interval '1 day')::date where id = :'event_id';
set role anon;
select set_config('request.jwt.claim.sub', '', false);
select t.ok((select public.submit_rsvp('sara-ahmed', :'party_code', false)->>'reason' = 'rsvp_closed'), 'RSVP closed after start');
select t.ok((select (public.get_public_invitation('sara-ahmed', :'party_code')->'view'->>'canEdit')::boolean = false), 'canEdit false after start');

-- ---------------------------------------------------------------- archive hides the invitation
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
update public.events set archived_at = now() where id = :'event_id';
set role anon;
select set_config('request.jwt.claim.sub', '', false);
select t.ok((select public.get_public_invitation('sara-ahmed', :'party_code')->>'reason' = 'unknown_event'), 'archived -> unknown_event');

-- ---------------------------------------------------------------- brute-force throttling of wrong codes
select set_config('request.headers', '{"x-forwarded-for":"198.51.100.9"}', false);
select count(*) from generate_series(1, 30) g, lateral (select public.get_public_invitation('nope-slug', 'AAAA' || g) as r) x;
select t.ok((select public.get_public_invitation('nope-slug', 'BBBBBB')->>'reason' = 'unknown_event'), 'unknown event does not count as a wrong code');
reset role;
update public.events set archived_at = null where id = :'event_id';
set role anon;
select count(*) from generate_series(1, 30) g, lateral (select public.get_public_invitation('sara-ahmed', 'QQQQ' || lpad(g::text, 2, '0')) as r) x;
select t.ok((select public.get_public_invitation('sara-ahmed', :'party_code')->>'reason' = 'too_many_wrong_codes'), '30 wrong codes -> throttled (per caller + slug)');
select set_config('request.headers', '{"x-forwarded-for":"192.0.2.44"}', false);
select t.ok((select public.get_public_invitation('sara-ahmed', :'party_code')->>'ok' = 'true'), 'other caller unaffected');

-- ---------------------------------------------------------------- timeline
reset role;
select t.ok((select array_agg(distinct kind) @> array['event_created','party_added','invitation_published','invitation_opened',
  'rsvp_confirmed','rsvp_unmatched','table_created','party_seated','checked_in_partial','check_in_exception','check_in_undone',
  'event_archived','event_updated']::text[] from public.event_activity where event_id = :'event_id'), 'activity kinds recorded');
select t.ok((select count(*) = 0 from public.event_activity where kind = 'party_updated' and event_id = :'event_id'), 'server-side RSVP/check-in updates do not log party_updated');

\echo 'SMOKE TEST PASSED'
