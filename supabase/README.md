# Catch the AI — production backend (not yet deployed)

The local dev API in [`server/catch-api.ts`](../server/catch-api.ts) is the source-of-truth
contract; these artifacts mirror it for the shared Supabase project
(`nbfkibomkxvqyaoakmma`). Everything here is **additive** — prefixed `catch_` /
`catch-` — and touches nothing the live v1 site depends on.

## Deploy steps (when moving off the local dev API)

1. `supabase link --project-ref nbfkibomkxvqyaoakmma`
2. Run `migrations/0001_catch_tables.sql` (via `supabase db push` or the SQL editor).
3. Seed challenges: insert rows from `server/seed-challenges.json`, assigning
   `scheduled_date` sequentially from launch day (the local API computes dates from
   `EPOCH_DATE`; production stores them explicitly).
4. `supabase functions deploy catch-daily catch-submit`
5. Point the client at the functions: swap the fetch base in `src/lib/api.ts`
   from `/api/catch/*` to `${SUPABASE_URL}/functions/v1/catch-*`.

## Contract notes

- Challenge answers/explanations are never exposed to clients pre-submission:
  `catch_challenges` has RLS enabled with **no** client policies; only the
  service-role edge functions read it.
- One play per player per challenge is enforced by a unique constraint (the
  409 path), not just the pre-check — safe under concurrent submits.
- `catch-daily`'s `result` for already-played visitors is intentionally null in
  this first production cut; the client keeps the local reveal state. A
  `catch-result` read function (or extending catch-daily) is the follow-up when
  cross-device replay of the reveal matters (post-auth linking).
