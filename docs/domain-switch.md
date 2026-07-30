# Making the game the front door of playwithprompts.com

The merged app is live and proven at **https://catch.playwithprompts.com** —
game at `/`, prompt library at `/prompts`, stats at `/me`, one login across all
of it. This document is the domain move, which is deliberately separate so you
can do it when you're ready and undo it in a minute.

Do the steps in order. Nothing is destroyed at any point.

---

## Step 1 — Give the old site its own address first

Do this **before** anything else, so nothing is ever unreachable.

1. Cloudflare → playwithprompts.com → **DNS**.
2. Find the existing record for the apex (`playwithprompts.com`). Note its
   type and target — that target is the old site's origin.
3. Add a new record with the **same type and same target**, named `old`.
   Keep the proxy setting identical to the apex record.
4. Check https://old.playwithprompts.com loads the current course site.

Once that works, the old site has a permanent home and the apex is free.

## Step 2 — Point the game's Footer link at it

One-line change on my side once Step 1 is confirmed: `LEARN_URL` in
`src/components/Footer.tsx` moves from `playwithprompts.com/courses` to
`old.playwithprompts.com/courses`. Tell me when Step 1 is done and I'll ship it.

(Until then the footer's "Courses" link still works, because the apex still
serves the old site.)

## Step 3 — Attach the apex to the game

```bash
vercel domains add playwithprompts.com
vercel domains add www.playwithprompts.com
```

The `_vercel` TXT record you added for the subdomain should already cover this,
so it ought to verify instantly. If Vercel asks for a new TXT value, add it in
Cloudflare exactly as shown and re-run.

Then in Cloudflare DNS, point the apex at Vercel:
- Apex `playwithprompts.com` → **A** → `76.76.21.21`, proxy **off** (grey cloud)
- `www` → **CNAME** → `cname.vercel-dns.com`, proxy **off**

SSL issues automatically within a few minutes.

## Step 4 — Verify

- https://playwithprompts.com → the game
- https://playwithprompts.com/prompts → the library
- https://old.playwithprompts.com → the old course site
- Sign in, then move between Play / Prompts / Stats — you stay signed in
- catch.playwithprompts.com keeps working (same app, both addresses)

## Rollback

Put the apex DNS record back to what Step 1 recorded. Effective in minutes.
This is why Step 1 says to write the original target down.

---

## One thing to decide later, not now

The 189 existing accounts live in the same Supabase project, so they can sign in
to the game today with their existing password. But their old **course
progress** and any **certificates** are rendered by the old site only. Parking
it at `old.` keeps all of that reachable. When you redesign the courses, that's
the moment to decide what carries forward.
