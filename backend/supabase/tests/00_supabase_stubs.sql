-- LOCAL ONLY. Minimal stand-ins for the pieces of a Supabase project the migration depends on, so the
-- migration can be smoke-tested on plain Postgres (see run_local.sh). Never run this on a real project.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;
create schema extensions;
create table auth.users (id uuid primary key default gen_random_uuid(), email text);

-- Same definition shape as Supabase's auth.uid(): the JWT "sub" claim exposed by PostgREST.
create function auth.uid() returns uuid language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
                  (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid
$$;

grant usage on schema auth, extensions, public to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated;

-- Supabase grants these defaults on `public`; the migration must explicitly tighten them.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
