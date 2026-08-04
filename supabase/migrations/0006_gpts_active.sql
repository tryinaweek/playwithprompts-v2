-- Curation flag for GPT Garden (rameshnuti.com/gpts).
-- Run once in the SQL editor: https://supabase.com/dashboard/project/nbfkibomkxvqyaoakmma/sql/new
-- Hidden GPTs stay in the table (admin can re-show them); the public page
-- only lists active ones.

alter table public.gpts add column if not exists active boolean not null default true;
