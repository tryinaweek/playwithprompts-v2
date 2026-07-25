-- Catch the AI — production schema (additive only; touches nothing from v1).
-- Deploy: supabase db push (or run in the SQL editor).

create table if not exists public.catch_challenges (
  id text primary key,
  scheduled_date date unique not null,
  format text not null check (format in ('spot_the_slip', 'real_or_robot')),
  difficulty int not null check (difficulty between 1 and 3),
  title text not null,
  payload jsonb not null,
  answer jsonb not null,
  explanation text not null,
  created_at timestamptz not null default now()
);

-- Answers must never reach the client pre-submission: no client policies at all.
-- Rows are served exclusively through the catch-daily / catch-submit edge
-- functions, which use the service-role key.
alter table public.catch_challenges enable row level security;

create table if not exists public.catch_plays (
  id uuid primary key default gen_random_uuid(),
  player_id text not null,
  user_id uuid references auth.users (id),
  challenge_id text not null references public.catch_challenges (id),
  challenge_number int not null,
  played_date date not null,
  answer jsonb not null,
  correct boolean not null,
  score int not null,
  time_ms int not null,
  created_at timestamptz not null default now(),
  unique (player_id, challenge_id)
);

alter table public.catch_plays enable row level security;

create policy "players read own plays"
  on public.catch_plays for select
  using (auth.uid() = user_id);

create table if not exists public.catch_streaks (
  player_id text primary key,
  user_id uuid references auth.users (id),
  current_streak int not null default 0,
  longest_streak int not null default 0,
  freezes_available int not null default 0,
  last_played_date date
);

alter table public.catch_streaks enable row level security;

create policy "players read own streak"
  on public.catch_streaks for select
  using (auth.uid() = user_id);

create table if not exists public.catch_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  player_id text not null,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.catch_events enable row level security;

create index if not exists catch_plays_challenge_date_idx
  on public.catch_plays (challenge_id, played_date);

create index if not exists catch_events_type_created_idx
  on public.catch_events (event_type, created_at);
