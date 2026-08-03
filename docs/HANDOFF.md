# HANDOFF — rolling status for new sessions

> Start-of-session read: this file + `ramesh-os.md` (the plan). Update this file
> at the end of any session that changes state.

Last updated: 2026-08-03

## Live state (all verified)

- **playwithprompts.com** (apex, Vercel `catch-the-ai`, team inaweeks-projects)
  = Catch the AI game + /prompts library (63 prompts). Google + email auth,
  streaks, percentiles. Header is now the brand bar (Play with Prompts ·
  Play/Prompts/Stats/Courses); catch.playwithprompts.com 308s to apex
  (2026-08-03, verified live). Old course site still at
  **www.**playwithprompts.com — origin is STILL Lovable (185.158.133.1 behind
  Cloudflare, no x-vercel headers), NOT Vercel; stale `prompt-tic-tac-toe`
  Vercel project could take over www after fresh deploy + DNS flip (pending
  Ramesh's go). Old paths (/courses, /learn, /verify/*) redirect to www via
  vercel.json.
- **rameshnuti.com** (Vercel `rameshnuti-v2`, deploys on push to main) =
  action-bar header (☰ Menu + Work with me), /work-with-me money page, /lab
  portfolio (5 verified apps; more entries welcome in `src/data/lab.ts`),
  footer sitemap. All newsletter forms capture to THE LIST before Substack.
- **THE LIST** = `public.people` in Supabase `nbfkibomkxvqyaoakmma`. Both sites
  write to it (verified). Insert-only via anon key. Migrations in
  `supabase/migrations/` (0001 game, 0002 subscribers, 0003 people).
- **Content pipeline**: `npm run content:draft` / `content:review` in the
  playwithprompts repo (drafting needs `claude` CLI re-login — expired).
  Challenge bank: 30, fresh through ~Aug 24, then recycles.

## www cutover — DONE 2026-08-03, verified live

Old course site now serves from Vercel project `prompt-tic-tac-toe` at
www.playwithprompts.com (Cloudflare www = CNAME
17110eaacaaee40b.vercel-dns-016.com, DNS only; rollback = A 185.158.133.1
Proxied). Lovable/Replit hosting RETIRED. Stripe paywall REMOVED (no paid
subs existed — confirmed by Ramesh); all courses free; nav stitched both
ways (game header: Courses → www; old site nav: Catch the AI → apex,
old game renamed Playground). Full loop verified live: apex=game,
apex/courses→307 www, catch→308 apex, www routes all 200, zero
Purchase/Subscribe strings in the shipped bundle, no console errors.
Leftover cleanup someday: Stripe edge functions still deployed on Supabase
(create-course-checkout, create-subscription-checkout, verify-course-purchase,
stripe-subscription-webhook) — harmless, nothing calls them. The extra
`_vercel` TXT (www…,7910289f…) can be deleted post-verification per Vercel,
but leaving it is fine.

## Workshops system — live 2026-08-03, two pastes pending

rameshnuti.com is multi-workshop: admin at /admin (create workshop → upload →
copy visitor link), visitor pages /workshops/<slug> (email unlock, per-slug
cookie, source tag workshop-<slug> into THE LIST) and
/workshops/<slug>/resources (that workshop's files only; any filename works).
Downloads route via /api/download → logs to Supabase workshop_downloads →
302 to Blob. Legacy /workshop/resources 307s to ai-agent-workshop; old files
migrated into workshop/ai-agent-workshop/. Registry: blob
workshop/_registry.json. Counts show "—" until Ramesh: (1) runs
supabase/migrations/0004_workshop_downloads.sql in the SQL editor,
(2) adds SUPABASE_SERVICE_ROLE_KEY env var to rameshnuti-v2 in Vercel +
redeploys.

## One brand, one login — live 2026-08-03

Game (apex) now wears www's exact header/footer (gradient logo + wordmark,
pill nav: Play/Prompts/Stats + Courses/Daily AI Tip → www; icon footer,
mobile hamburger). Supabase session moved to chunked cookies on
.playwithprompts.com in BOTH apps (adapter duplicated: game
src/lib/cookie-auth-storage.ts = old site
src/integrations/supabase/cookie-auth-storage.ts — keep in sync!), with
localStorage fallback + migration of existing sessions. Login on either site
now carries to the other on next page load. Sign-out on one site clears the
cookie; the other site stays signed in only until refresh. Ramesh to confirm
the flow with his real account.

## Practice mode + challenge bank — live 2026-08-03

Catch the AI: after the daily, "Keep playing" starts badged practice rounds
(30/day cap, separate catch_practice_plays table — streak/percentile stay
daily-only; Stats shows a practice tally). Bank = 30 seeds + catch_challenges
in Supabase (service-role read only — holds answers; anon has NO access).
Pipeline: `npm run bank:generate` (Haiku batches, offline, ~$1-2/500) then
`npm run bank:verify` (blind judge re-solves without the answer key,
deactivates disagreements — first run: 210 generated, 131 survived, 38% cut,
the pass is NOT optional). Keys: ANTHROPIC_API_KEY + SUPABASE_SERVICE_ROLE_KEY
env (local: .env.generator.local, gitignored; Vercel marks the service key
sensitive — env pull returns [SENSITIVE], never copy it between projects via
CLI). Top up the bank when unseen inventory runs low (~monthly at current
traffic). Note: repeated curl bursts against the apex trip Vercel's security
checkpoint for that client — verify via browser or space out probes.

## Open items — Ramesh

1. Send sponsor email #1 (drafts: `docs/sponsor-emails.md`); name sponsor price.
2. Name the workshop price → unblocks finishing the workshop page.
3. Replit security fixes (`docs/security-cleanup.md`) — Moved Co: 34 high vulns.
4. CSV exports into `people` (Substack, GHL/Svyam, workshop 35) via Table
   Editor import; delete my `verify-*@example.com` test rows.
5. `claude` CLI re-login on this Mac (unblocks weekly content drafting).

## Build queue — next sessions, in order

1. ~~/articles on rameshnuti.com~~ — SHIPPED 2026-08-03, verified live.
   All 8 Substack posts (live feed + seed fallback, 6h revalidate) + the
   on-site article; nav/footer say "Articles"; /writing still live. The
   old-site About page links here.
2. **Workshop page finish** (blocked on price).
3. **PWP Phase 1 product plan** — daily-3 home, tips, founder's face; then
   photo rounds ("Real or Robot: photo edition") with HIS photos only.
4. **Dashboard** — one page: Reach → List → Actives → Leads → $ (after the
   list has data).
5. Weekly rhythm: challenge-bank top-ups, first Rep cadence support.

## Standing decisions (don't relitigate without new evidence)

Game stays ungated (play first, save streak after). No fabricated numbers
anywhere, ever. Courses NOT ported as-is — rebuild later around discernment.
GHL stays for ActionEDI only. Old site parked at www until courses decision.
One new app/month max, only as a documented episode.
