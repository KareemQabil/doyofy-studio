-- LOCAL ONLY: fixture for the two-session concurrency check in run_local.sh.
\set ON_ERROR_STOP on
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
insert into public.events (id, type, title, names, date, time, venue, slug)
values ('11111111-1111-1111-1111-111111111111', 'birthday', 'عيد ميلاد جود', '{"a":"جود"}', (now() + interval '3 days')::date, '18:00',
        '{"name":"البيت","city":"جدة"}', 'jood-concurrency');
reset role;  -- fixed id for the shell script; clients cannot choose party ids (column grant)
insert into public.parties (id, event_id, primary_guest_name, max_party_size)
values ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'عائلة السبيعي', 4);
set role authenticated;
select public.set_rsvp_by_organizer('22222222-2222-2222-2222-222222222222', true, 4);
