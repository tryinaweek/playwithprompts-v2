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

## www cutover — ready, needs 2 clicks from Ramesh (2026-08-03)

Old course site: Stripe paywall REMOVED (no paid subs existed — confirmed),
all courses free, nav stitched (Catch the AI ↔ Playground). Repo
`prompt-tic-tac-toe/` (= github tryinaweek/playwithprompts) deployed fresh to
Vercel project `prompt-tic-tac-toe`; all routes verified 200. Live www is an
OLDER snapshot than the repo (old title), still on Lovable origin. Remaining:
1. Vercel dashboard → prompt-tic-tac-toe → Settings → Domains → add
   `www.playwithprompts.com` (CLI got 403 domain_not_owned; may ask for a TXT).
2. Cloudflare: www CNAME → `cname.vercel-dns.com`, DNS only. Rollback = restore
   A 185.158.133.1 Proxied. Then Lovable/Replit can be retired.
Leftover cleanup someday: Stripe edge functions still deployed on Supabase
(create-course-checkout, create-subscription-checkout, verify-course-purchase,
stripe-subscription-webhook) — harmless, nothing calls them.

## Open items — Ramesh

1. Send sponsor email #1 (drafts: `docs/sponsor-emails.md`); name sponsor price.
2. Name the workshop price → unblocks finishing the workshop page.
3. Replit security fixes (`docs/security-cleanup.md`) — Moved Co: 34 high vulns.
4. CSV exports into `people` (Substack, GHL/Svyam, workshop 35) via Table
   Editor import; delete my `verify-*@example.com` test rows.
5. `claude` CLI re-login on this Mac (unblocks weekly content drafting).

## Build queue — next sessions, in order

1. **/articles on rameshnuti.com** — BUILT 2026-08-03 on `feature/articles`
   branch in rameshnuti-v2 (not merged — needs Ramesh's UI approval, then
   `git checkout main && git merge feature/articles && git push` to deploy).
   Pulls all 8 posts from the startupvalue.substack.com public feed (live
   fetch + seed fallback, 6h revalidate) + the on-site article. Nav/footer
   "Writing" → "Articles". /writing still live. Preview: `npm run dev` in
   rameshnuti-v2 → localhost:3000/articles.
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
