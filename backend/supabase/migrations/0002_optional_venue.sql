-- Less data at creation (owner decision, Nov 2026): an event needs only its names and date.
-- The place is optional (added later from settings or the invitation), so venue name/city may be blank;
-- the time defaults to 8:00 PM when the client sends none.
alter table public.events drop constraint if exists events_venue_check;
alter table public.events add constraint events_venue_check check (
  jsonb_typeof(venue) = 'object'
  and char_length(btrim(coalesce(venue->>'name', ''))) <= 200
  and char_length(btrim(coalesce(venue->>'city', ''))) <= 120
);
alter table public.events alter column venue set default '{"name": "", "city": ""}'::jsonb;
alter table public.events alter column time set default '20:00';
