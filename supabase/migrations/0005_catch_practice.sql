-- Practice mode for Catch the AI.
-- Run once in the SQL editor: https://supabase.com/dashboard/project/nbfkibomkxvqyaoakmma/sql/new
--
-- catch_challenges: the generated challenge bank. Rows include the ANSWER, so
-- there is deliberately NO anon policy — only the service_role key (server
-- env) can read it. The batch generator (scripts/generate-challenges.mjs)
-- writes it; the game's serverless functions read it.
--
-- catch_practice_plays: one row per practice round. Separate from catch_plays
-- so streaks and percentiles can never be inflated by practicing. Same anon
-- trust model as catch_plays (insert + select of opaque player ids).

create table if not exists public.catch_challenges (
  id text primary key,
  format text not null check (format in ('spot_the_slip', 'real_or_robot')),
  difficulty int not null check (difficulty between 1 and 3),
  title text not null,
  payload jsonb not null,
  answer jsonb not null,
  explanation text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.catch_challenges enable row level security;
-- No anon policies on purpose: answers live here.

create table if not exists public.catch_practice_plays (
  id bigint generated always as identity primary key,
  player_id text not null,
  challenge_id text not null,
  played_date text not null,
  correct boolean not null,
  score int not null,
  time_ms int not null,
  created_at timestamptz not null default now()
);

alter table public.catch_practice_plays enable row level security;

create policy "anon can log practice plays"
  on public.catch_practice_plays for insert
  to anon
  with check (true);

create policy "anon can read practice plays"
  on public.catch_practice_plays for select
  to anon
  using (true);

create index if not exists catch_practice_plays_player_idx
  on public.catch_practice_plays (player_id, played_date);
