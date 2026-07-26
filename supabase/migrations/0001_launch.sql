-- Catch the AI — launch schema (run once in the Supabase SQL editor).
-- Dashboard: https://supabase.com/dashboard/project/nbfkibomkxvqyaoakmma/sql/new
--
-- Additive only: touches nothing the v1 site uses. Challenges are NOT stored
-- here (they ship inside the Vercel functions with their answers), so nothing
-- secret lives in these tables. The anon key may insert plays/events and read
-- plays; rows contain no personal data (player_id is a random UUID).

create table if not exists public.catch_plays (
  id uuid primary key default gen_random_uuid(),
  player_id text not null,
  challenge_id text not null,
  challenge_number int not null,
  played_date date not null,
  answer jsonb not null,
  correct boolean not null,
  score int not null check (score between 0 and 100),
  time_ms int not null check (time_ms between 0 and 600000),
  created_at timestamptz not null default now(),
  unique (player_id, challenge_id)
);

alter table public.catch_plays enable row level security;

create policy "anon can record plays"
  on public.catch_plays for insert
  to anon
  with check (true);

create policy "anyone can read plays"
  on public.catch_plays for select
  to anon, authenticated
  using (true);

create table if not exists public.catch_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  player_id text not null,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.catch_events enable row level security;

create policy "anon can record events"
  on public.catch_events for insert
  to anon
  with check (true);

create index if not exists catch_plays_challenge_date_idx
  on public.catch_plays (challenge_id, played_date);

create index if not exists catch_plays_player_idx
  on public.catch_plays (player_id, played_date desc);

create index if not exists catch_events_type_created_idx
  on public.catch_events (event_type, created_at);
