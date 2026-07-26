# Catch the AI — production backend

Production runs as **Vercel serverless functions** (`api/catch/*`) that bundle the
challenges (answers never reach the client) and store plays/events in the shared
Supabase project (`nbfkibomkxvqyaoakmma`) via PostgREST with the anon key.

## The one setup step

Run [`migrations/0001_launch.sql`](migrations/0001_launch.sql) once in the
Supabase SQL editor:

https://supabase.com/dashboard/project/nbfkibomkxvqyaoakmma/sql/new

Paste the file, press Run. That's it.

**Until this runs, the deployed game still works** in degraded mode: rounds are
playable and scored, but percentiles ("Top 12%") and cross-player stats are
hidden because there's no shared table to aggregate. The moment the SQL runs,
the app upgrades itself — no redeploy needed.

## Notes

- Everything is additive (`catch_` prefix); nothing the live v1 site uses is touched.
- Rows hold no personal data — `player_id` is a random UUID from the player's browser.
- Known launch trade-off: the anon key can insert plays directly (bypassing the
  scoring function), so a determined cheater could fake a score. Accepted per the
  PRD anti-gaming stance; the hardening path is moving writes behind a
  service-role key in Vercel env vars later.
- The local dev server uses `server/catch-api.ts` (same API contract, JSON-file
  storage) — no Supabase needed for development.
