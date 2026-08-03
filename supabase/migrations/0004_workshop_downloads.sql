-- Workshop download tracking for rameshnuti.com/admin.
-- Run once in the SQL editor: https://supabase.com/dashboard/project/nbfkibomkxvqyaoakmma/sql/new
--
-- Every file download on a /workshops/<slug>/resources page inserts one row
-- via the public anon key. Same trust model as public.people: the public can
-- only write, never read — the admin dashboard reads counts back with the
-- service_role key, which lives only in Vercel server env.

create table if not exists public.workshop_downloads (
  id bigint generated always as identity primary key,
  workshop text not null,
  filename text not null,
  created_at timestamptz not null default now()
);

alter table public.workshop_downloads enable row level security;

-- Public key may log a download, never read the log back.
create policy "anon can log downloads"
  on public.workshop_downloads for insert
  to anon
  with check (true);

create index if not exists workshop_downloads_workshop_idx
  on public.workshop_downloads (workshop, filename);
