-- Catch the AI — email list (run in the Supabase SQL editor, same as 0001).
-- https://supabase.com/dashboard/project/nbfkibomkxvqyaoakmma/sql/new
--
-- Until this runs, addresses still get captured: the subscribe endpoint falls
-- back to catch_events with event_type='email_captured', so nothing is lost.

create table if not exists public.catch_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  player_id text,
  source text,
  created_at timestamptz not null default now()
);

alter table public.catch_subscribers enable row level security;

-- Anon may add an address but never read the list back (no select policy).
create policy "anon can subscribe"
  on public.catch_subscribers for insert
  to anon
  with check (true);

-- Read your list any time from the SQL editor or Table Editor:
--   select email, source, created_at from catch_subscribers order by created_at desc;
--
-- If any addresses landed in the fallback before this table existed:
--   select meta->>'email' as email, created_at from catch_events
--   where event_type = 'email_captured' order by created_at desc;
