-- LOCAL ONLY: assertions after the parallel sessions in run_local.sh have finished.
\set ON_ERROR_STOP on
select t.ok((select count(*) = 1 from public.check_ins where party_id = '22222222-2222-2222-2222-222222222222' and idempotency_key = 'conc-key-0001'), 'parallel replays of one key -> one record');
select t.ok((select checked_in_count = 4 from public.parties where id = '22222222-2222-2222-2222-222222222222'), 'two gates racing for 4 people -> count stays 4');
\echo 'CONCURRENCY CHECK PASSED'
