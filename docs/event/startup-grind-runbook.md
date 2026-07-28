# Startup Grind (July 29) — Catch the AI live launch runbook

**Live URL:** https://catch.playwithprompts.com
**QR slide asset:** `docs/event/qr-catch-the-ai.png`
**The round the room will get on the 29th:** #4 — "Real or Robot: hotel reviews" (two reviews, pick the human — a two-tap A/B built for a live crowd).

## Before the event (checklist)

- [x] `supabase/migrations/0001_launch.sql` — DONE. Percentiles and streaks are live.
- [ ] Run `supabase/migrations/0002_subscribers.sql` in the same SQL editor:
      https://supabase.com/dashboard/project/nbfkibomkxvqyaoakmma/sql/new
      This gives emails a dedicated table with real duplicate protection.
      Without it addresses are still captured (they fall back into
      `catch_events`), so this is a nice-to-have, not a blocker.
- [ ] Optional cleanup of test rows:
      `delete from catch_plays where player_id like 'fullmode-test%';`

## Reading your email list after the event

In the SQL editor:
```sql
select email, source, created_at from catch_subscribers order by created_at desc;
-- plus any captured before 0002 ran:
select meta->>'email' as email, created_at from catch_events
where event_type = 'email_captured' order by created_at desc;
```
This list is the single most valuable thing you take home from the 29th —
it is how these people hear from you on the 30th.
- [ ] Test on your own phone the morning of: scan the QR, play the round.
- [ ] Put the QR on your closing slide AND keep it up during Q&A.

## The live moment (5 minutes, at the end of your workshop)

1. **Setup line:** "AI now writes half of what you read. Here's a 60-second test
   of whether it can fool this room."
2. **Show the QR.** "Scan, hit Start, you have 90 seconds."
3. **While they play:** nothing. Let the room go quiet. The silence is the demo.
4. **The reveal, from your own phone:** play it live on screen, pick the answer,
   and read the room stat out loud: "___% of this room got fooled by a hotel
   review." (With the SQL step done, everyone's reveal screen shows the same
   live percentile.)
5. **The kicker:** "That was round 4. There's a new one every day — same
   challenge for everyone on Earth. Keep your streak alive longer than the
   person next to you."
6. **Close:** "It's free, it's 90 seconds a day. Drop your email on the results
   screen and I'll send you tomorrow's — that's the whole ask."
   (The email box sits right under the share card, so point at it while the
   room is still on that screen. This is what turns a room into a list.)

## After the talk

- Post the same QR + one line on LinkedIn and WhatsApp that evening — attendees
  who share their result cards do the rest.
- Analytics to watch (in Supabase → Table Editor → catch_events / catch_plays):
  distinct players on the 29th, then how many of those same player_ids appear on
  the 30th and 31st. That D1/D2 return of a cold conference crowd is your first
  real retention data — the number the whole v3 thesis rides on.

## If something breaks

- The game degrades gracefully: if the database is unreachable, rounds still
  play and score; only percentiles/streaks hide. There is no failure mode where
  the room sees an error page from a bad DB — the static app and challenge
  data are served by Vercel's CDN.
- Emergency contact with the code: the `feature/catch-the-ai` branch; redeploy
  with `vercel deploy --prod --yes` from the repo root.
