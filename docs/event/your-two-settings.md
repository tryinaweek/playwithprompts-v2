# Two settings only you can change (both ~2 minutes, both from a phone)

Everything else is deployed and live. These two are in dashboards I have no
access to.

---

## 1. Turn OFF email confirmation — do this before the event

**Why this is urgent:** signup currently sends a confirmation email through
Supabase's built-in mailer, which is rate limited to a couple of emails per hour
on the free tier. Tested today: the first signup went through, the next one
failed with "Error sending confirmation email." At an event with 100 people,
roughly the first two could create an account and everyone else would hit an
error.

With confirmation off, signup returns a session instantly, sends no email, has
no rate limit, and the streak attaches immediately. This is the single highest
impact thing on this list.

**Steps:**
1. https://supabase.com/dashboard/project/nbfkibomkxvqyaoakmma/auth/providers
2. Open the **Email** provider.
3. Toggle **Confirm email** OFF. Save.

**Verify it worked:** on catch.playwithprompts.com, play a round, enter a new
email + password, tap "Save my streak". You should land straight on the green
"Streak saved to ..." panel with no inbox trip.

Trade-off to know: unconfirmed addresses can be typos or fake. For a free daily
game that is the right trade — you can switch confirmation back on later, or add
a proper mail provider (Resend/SendGrid) when you want real daily emails.

---

## 2. Redirect playwithprompts.com to the game — do this when you're ready

Your DNS is proxied through Cloudflare, so this needs no access to the main
site's code or hosting.

**Steps:**
1. Cloudflare → playwithprompts.com → **Rules** → **Redirect Rules** → Create.
2. Name: `apex to catch`.
3. Condition — **be precise here**: `URI Path` **equals** `/`
   (Do NOT use "starts with" or a wildcard. A blanket rule would take the whole
   old course site down with it, including the Learn link inside the game.)
4. Then: Static redirect → `https://catch.playwithprompts.com` → **302 Found**
   (302, not 301 — a 301 gets cached hard in browsers and is painful to undo.)
5. Save.

**Result:** playwithprompts.com sends people straight into the game.
playwithprompts.com/courses, /prompts, /learn all keep working exactly as they
do today, which is what the "Learn" link in the game's nav points at.

**To undo:** disable the rule. Takes effect immediately.

---

## Optional: clean out my test rows

Run in the SQL editor whenever convenient — these are from today's verification
and would otherwise sit in your player counts:

```sql
delete from public.catch_plays
where player_id like 'anon-device-%'
   or player_id like 'smoke-%'
   or player_id like 'sub-test%'
   or player_id like 'fullmode-test%'
   or player_id in ('brand-check','dns-check','health-check','logtrigger','logtrigger2','tunnel-check','00000000-adopt-test-0000-000000000001');

delete from public.catch_events where player_id like 'sub-test%' or player_id like 'smoke-%';
```

Two test accounts also exist in Authentication → Users
(`catchtest+...@example.com`, `catchtest-uxcheck@example.com`) — delete them
there if you want a clean user list.
