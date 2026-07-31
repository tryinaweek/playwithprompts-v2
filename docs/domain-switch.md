# Making the game the front door of playwithprompts.com

The merged app is live and proven at **https://catch.playwithprompts.com** —
game at `/`, prompt library at `/prompts`, stats at `/me`, one login across all
of it. This document is the domain move, which is deliberately separate so you
can do it when you're ready and undo it in a minute.

Do the steps in order. Nothing is destroyed at any point.

---

## The values, confirmed from the live DNS (2026-07-30)

**Old site origin: `185.158.133.1`** — this is the apex A record's target, sitting
behind Cloudflare's proxy. It is both the value the `old` record needs and the
**rollback value** for the apex.

Current records on the zone:

| Name | Type | Content | Proxy |
|------|------|---------|-------|
| `catch` | A | 76.76.21.21 | DNS only ← the game, working |
| apex | A | 185.158.133.1 | Proxied ← old site |
| `www` | A | 185.158.133.1 | Proxied ← old site |
| `send` | MX / TXT | amazonses | DNS only ← email, do not touch |
| `default._domainkey`, `resend._domainkey`, `_dmarc` | TXT | — | email auth, do not touch |
| `_vercel` | TXT | vc-domain-verify=catch… | keep, and add two more |

Nothing in the email rows (`send`, `_dmarc`, `*._domainkey`) is affected by any
step here — leave them alone.

## Step 1 — Give the old site its own address first

Do this **before** anything else, so nothing is ever unreachable.

1. Cloudflare → playwithprompts.com → **DNS** → **Add record**:
   - Type **A**, Name `old`, Content **185.158.133.1**, Proxy **Proxied**
     (matching the apex row exactly)
2. Check https://old.playwithprompts.com loads the current course site.

Once that works, the old site has a permanent home and the apex is free.

## Step 2 — Point the game's Footer link at it

One-line change on my side once Step 1 is confirmed: `LEARN_URL` in
`src/components/Footer.tsx` moves from `playwithprompts.com/courses` to
`old.playwithprompts.com/courses`. Tell me when Step 1 is done and I'll ship it.

(Until then the footer's "Courses" link still works, because the apex still
serves the old site.)

## Step 3 — Prove the domain is yours (TXT records)

Both `playwithprompts.com` and `www.playwithprompts.com` are already registered
to the project on my side; they're waiting on proof of ownership, because the
apex is claimed by your other Vercel account.

In Cloudflare → DNS, add **two** TXT records. Cloudflare allows several records
sharing the `_vercel` name, so leave the existing one alone.

| Type | Name    | Content |
|------|---------|---------|
| TXT  | `_vercel` | `vc-domain-verify=playwithprompts.com,b23612aa824e70188d86` |
| TXT  | `_vercel` | `vc-domain-verify=www.playwithprompts.com,7d0456235cde260f3979` |

Then tell me — I run the verification from here and confirm.

**Nothing changes for visitors at this step.** Traffic still goes wherever DNS
points it, which is still the old site.

## Step 4 — Flip the apex to the game

Only after Steps 1 and 3 are done. In Cloudflare → DNS:

- `playwithprompts.com` → **A** → `76.76.21.21` → proxy **off** (grey cloud)
- `www` → **CNAME** → `cname.vercel-dns.com` → proxy **off**

The grey cloud matters: Cloudflare's proxy interferes with Vercel's certificate
issuing. SSL comes up automatically within a few minutes.

## Step 5 — Verify

- https://playwithprompts.com → the game
- https://playwithprompts.com/prompts → the library
- https://old.playwithprompts.com → the old course site
- Sign in, then move between Play / Prompts / Stats — you stay signed in
- catch.playwithprompts.com keeps working (same app, both addresses)

---

## The 2-minute alternative, if you'd rather not touch DNS

A Cloudflare **Redirect Rule** gets the game in front of people today with no
verification, no apex change, and nothing to roll back:

- Rules → Redirect Rules → Create
- When: `URI Path` **equals** `/`  ← equals, not "starts with"
- Then: static redirect → `https://catch.playwithprompts.com` → **302**

Someone typing playwithprompts.com lands in the game; every other old URL keeps
working untouched. The only difference from the full switch is the address bar
reads catch.playwithprompts.com afterwards. Fully reversible by disabling the
rule.

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
