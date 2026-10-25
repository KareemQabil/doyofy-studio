#!/usr/bin/env bash
# LOCAL ONLY: applies the migration to a throwaway Postgres cluster with Supabase stand-ins and runs
# the smoke test. Needs Postgres 15+ server binaries (initdb/pg_ctl/psql). Creates nothing in the cloud.
#   bash backend/supabase/tests/run_local.sh
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
MIGRATION="$HERE/../migrations/0001_doyofy_init.sql"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
[ -x "$PGBIN/initdb" ] || PGBIN="$(dirname "$(command -v initdb)")"
WORK="$(mktemp -d)"
RUN=()
if [ "$(id -u)" = "0" ]; then chown postgres "$WORK"; RUN=(runuser -u postgres --); fi
cleanup() { "${RUN[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT
"${RUN[@]}" "$PGBIN/initdb" -D "$WORK/data" -U postgres -A trust >/dev/null
"${RUN[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -o "-k $WORK -c listen_addresses=''" -l "$WORK/log" -w start >/dev/null
PSQL=("${RUN[@]}" "$PGBIN/psql" -h "$WORK" -U postgres -d postgres -v ON_ERROR_STOP=1 -q)
"${PSQL[@]}" -f "$HERE/00_supabase_stubs.sql"
"${PSQL[@]}" -f "$MIGRATION"
"${PSQL[@]}" -f "$HERE/01_smoke.sql" 2>&1 | grep -E "ok:|ok \(|PASSED|ERROR|FAILED" || { echo "smoke test failed"; exit 1; }

# Concurrency: session A holds the party lock for 2 s; B replays A's idempotency key (must wait, then
# replay), C is a second gate admitting the same 4 people with another key (must get 409 because the
# re-assessed exceptions were not acknowledged).
"${PSQL[@]}" -f "$HERE/02_concurrency_setup.sql" >/dev/null
GATE="set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);"
CALL="select public.check_in_party(null, '22222222-2222-2222-2222-222222222222', 4"
"${PSQL[@]}" -c "begin; $GATE $CALL, 'conc-key-0001')->>'replayed'; select pg_sleep(2); commit;" > "$WORK/a.out" 2>&1 &
sleep 0.5
"${PSQL[@]}" -tA -c "$GATE $CALL, 'conc-key-0001')->>'replayed';" > "$WORK/b.out" 2>&1 &
"${PSQL[@]}" -tA -c "$GATE $CALL, 'conc-key-0002')->>'replayed';" > "$WORK/c.out" 2>&1 || true &
wait
grep -q '^true$' "$WORK/b.out" && echo "ok: concurrent replay waited for the lock and returned replayed=true" || { echo "FAILED replay:"; cat "$WORK/b.out"; exit 1; }
grep -q 'exceptions_not_acknowledged' "$WORK/c.out" && echo "ok: racing second gate rejected (exceptions_not_acknowledged)" || { echo "FAILED race:"; cat "$WORK/c.out"; exit 1; }
"${PSQL[@]}" -f "$HERE/03_concurrency_check.sql" 2>&1 | grep -E "ok:|PASSED|ERROR|FAILED" || { echo "concurrency check failed"; exit 1; }
