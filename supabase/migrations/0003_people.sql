-- THE LIST — one table for every email across the whole brand.
-- Run once in the SQL editor: https://supabase.com/dashboard/project/nbfkibomkxvqyaoakmma/sql/new
--
-- Sources land tagged so you always know where someone came from:
--   newsletter (rameshnuti.com) | game (playwithprompts) | workshop | event |
--   import-substack | import-ghl | import-svyam | lab

create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  source text not null default 'unknown',
  tags text[] not null default '{}',
  first_seen timestamptz not null default now(),
  notes text
);

alter table public.people enable row level security;

-- Public key may add a person, never read the list back.
create policy "anon can subscribe"
  on public.people for insert
  to anon
  with check (true);

-- Fold in everything the game has already captured.
insert into public.people (email, source, first_seen)
select email, coalesce('game-' || source, 'game'), created_at
from public.catch_subscribers
on conflict (email) do nothing;

insert into public.people (email, source, first_seen)
select meta->>'email', 'game-' || coalesce(meta->>'source', 'reveal'), created_at
from public.catch_events
where event_type = 'email_captured' and meta->>'email' is not null
on conflict (email) do nothing;

-- Registered accounts count too (game + old site both authenticate here).
insert into public.people (email, source, first_seen)
select email, 'account', created_at
from auth.users
where email is not null
on conflict (email) do nothing;

-- CSV imports (Substack, GHL/Svyam, workshop list): Table Editor -> people ->
-- Insert -> Import data from CSV. Map the email column; set source to
-- import-substack / import-ghl / import-workshop respectively.
