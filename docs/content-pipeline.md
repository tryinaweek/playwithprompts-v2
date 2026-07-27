# Weekly content pipeline (~30 minutes)

The challenge bank is finite by design (like Wordle's word list): every question is
human-approved because one ambiguous question ruins a player's whole day. AI does
the drafting volume; you own the answer key.

## The weekly ritual

```bash
npm run content:draft          # 1. AI drafts 14 candidates (~2 min, uses Claude CLI)
npm run content:review         # 2. You approve/reject each one (y / n / q)
git add server/seed-challenges.json content && git commit -m "content: weekly batch"
vercel deploy --prod --yes     # 3. Ship them
```

**The one rule during review: if you hesitate on the answer, reject it.**
Rejecting half the batch is normal and fine.

## Details

- Drafts land in `content/drafts/` and are inert until approved — nothing reaches
  players without your y.
- The draft prompt automatically avoids topics already used in the bank.
- Approved challenges get proper ids and append to `server/seed-challenges.json`;
  reviewed draft files move to `content/drafts/archive/`.
- The review step ends by printing your runway: "fresh content through <date>,
  recycling after." Keep that date ≥2 weeks ahead of today (travel insurance).
- Drafting needs the Claude CLI signed in: if it reports an auth error, run
  `claude` once in a terminal, complete sign-in, and re-run.
- `npm run content:draft -- --count 6` for a smaller batch.

## Current state

- 30 challenges, scheduled daily from 2026-07-26 → fresh through 2026-08-24,
  then the cycle repeats from challenge #1 until new content is added.
