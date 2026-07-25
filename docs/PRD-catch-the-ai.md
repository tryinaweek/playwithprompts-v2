# PRD: Catch the AI — Play with Prompts v3

**Status:** APPROVED FOR PLANNING — build starts on explicit go-ahead only
**Branch:** `feature/catch-the-ai` (production site untouched until final swap)
**Author:** Ramesh Nuti + Claude (office-hours session, 2026-07-25)
**Supersedes:** the "AI Fluency Arena" design doc (`~/.gstack/projects/tryinaweek-playwithprompts-v2/rameshnuti-main-design-20260725-171646.md`, never approved)

---

## 1. One-liner

A free daily game, 90 seconds, same challenge for everyone on Earth: **catch what the AI got wrong.** Wordle mechanics applied to the one skill that gets more valuable as AI gets better — telling good output from bad.

## 2. Why this, why now

- Nobody visits a website to do what ChatGPT/Claude/Gemini do natively. A site survives only by offering what a chatbot structurally cannot: a **shared daily artifact**, a **neutral referee with an answer key**, **persistent identity** (streaks, percentiles), and **other people**.
- Prompting-as-a-skill is obsolete for casual users; **discernment** (spotting AI errors, judging AI output) grows in value with every model release. Model progress killed the old site; on this premise, model progress powers the new one — the game's difficulty curve is maintained for free by the AI industry.
- Precedents: Wordle (communal daily puzzle → habit), Gandalf by Lakera (1M+ players for a "beat the AI" game), Duolingo streaks (7-day-streak users retain ~2.4x), phishing-simulation training (KnowBe4, $4.6B) as the B2B endgame analog.
- The name still works: players are literally playing with the outputs of prompts — as the judge, not the student.

## 3. Goals

1. A daily habit product a non-technical person can play with zero jargon.
2. D7 return ≥20% of activated players (completed ≥1 round).
3. A shareable result card that spreads in WhatsApp groups and LinkedIn feeds.
4. A foundation that later supports the team/B2B product without rework.

## 4. Non-goals (MVP)

- No courses, lessons-as-front-door, prompt library, or games from v1/v2.
- No LLM grading of free text (the hardest, riskiest part of the abandoned Arena plan). Every challenge has a **pre-authored objective answer key**. No LLM in the serving path at all.
- No multiplayer rooms, no leagues, no monetization, no certificates in MVP.
- No replacement of the live site until explicitly finalized.

## 5. Target user

**Primary:** the non-technical professional in Ramesh's orbit (talks, WhatsApp, LinkedIn; India + US). Uses ChatGPT casually, feels vaguely behind, allergic to jargon.
**Secondary:** general daily-puzzle players (Wordle/Connections crowd) who arrive via share cards.

## 6. The game

### 6.1 Formats (rotating; MVP ships with the first two)

| Format | Challenge | Answer type |
|---|---|---|
| **Spot the Slip** | Short AI-generated summary/email/paragraph with one planted error (wrong number, inverted fact, subtle contradiction) | Tap/click the sentence or span containing the error |
| **Real or Robot** | Two artifacts (photos, reviews, paragraphs, profile bios) — one human, one AI | Pick the human one |
| **Would You Sign?** *(post-MVP)* | AI-drafted reply/clause/invoice with a trap | Tap the trap, or declare it safe |
| **Pick the Better Answer** *(post-MVP)* | Two AI answers to a real dilemma | Pick one; scored against expert key + crowd |

### 6.2 Daily round mechanics

- **One round per day, 7 days/week**, identical for all players. "Today" = the player's local calendar date (India and US each get it on their own date; content is pre-scheduled server-side by date).
- 90-second soft timer (affects score, never blocks completion).
- After answering: **the reveal** — correct answer, a 30-second plain-English explanation of *what to look for* (this is the entire educational payload; the lesson hides inside the game), today's percentile, and the share card.
- **Scoring:** 0–100 = correctness (70%) + speed bonus (30%). One attempt per day.
- **Streak:** consecutive calendar days played (played, not necessarily correct — showing up is the habit). One streak-freeze earned per 7-day week, auto-applied (Duolingo forgiveness).
- **Share card:** spoiler-free text block first (Wordle-style, works everywhere including WhatsApp):
  `Catch the AI #214 🎯 38s · ✅ · 12-day streak · Top 18% — playwithprompts.com`
  OG-image version in Step 4.

### 6.3 Accounts and identity

- **Try-before-signup:** today's round is playable anonymously (localStorage guard, server rate-limit by IP). Signup (existing Supabase auth — the 189 accounts carry over) is required to: keep a streak, see history, appear in percentiles beyond today.
- **Profile (MVP):** streak, rounds played, accuracy, best category. The rolling "Slop Radar" skill score is Phase 2 — it needs weeks of data to mean anything.

## 7. Content pipeline (the real operational core)

A challenge = `{format, artifact(s), answer key, explanation, difficulty tag, scheduled date}`.

- **Authoring:** AI-assisted generation script drafts candidates (planting a flaw with known ground truth is automatable); founder reviews, edits, approves. Target: batch-author weekly in one sitting.
- **Quality bar:** every challenge must have exactly one defensible answer. Ambiguity is the #1 way this game dies. Rule: if the founder hesitates on the answer during review, the challenge is rejected.
- **Buffer:** ≥14 days of approved challenges scheduled ahead at all times (speaking-travel insurance).
- **Storage:** challenges live in a Supabase table, managed via a simple admin page (auth-gated to founder) or, for MVP week one, seeded via SQL/script — admin UI can wait.
- **Launch stock:** 30 approved challenges before beta (≈2 weeks buffer + 2 weeks runway).

## 8. Architecture

**Base:** the v2 root app on this branch (Vite + React 19 + TS + Tailwind 4 + Supabase). v2's course pages are removed on this branch; `lesson-parser`, course routes, and course config go away. Existing Supabase project is reused **additively** — nothing v1 depends on is altered, so the live site is unaffected throughout.

### 8.1 Data model (new tables, RLS on)

- `catch_challenges` — id, scheduled_date (unique), format, payload jsonb (artifacts, options), answer jsonb, explanation text, difficulty. **RLS: no direct client SELECT** (answers must never reach the client pre-submission); served only via edge function.
- `catch_plays` — id, user_id (nullable for anon), challenge_id, answer jsonb, correct bool, time_ms, score int, created_at. Unique (user_id, challenge_id). RLS: users read own rows.
- `catch_streaks` — user_id, current_streak, longest_streak, freezes_available, last_played_date. Updated by edge function.

### 8.2 Edge functions (no LLM anywhere)

- `catch-daily` — returns today's challenge payload **without** answer/explanation, plus the player's play-state.
- `catch-submit` — validates one-play-per-day (per user, per IP for anon), scores server-side, updates streak, returns answer + explanation + score + today's percentile (computed from `catch_plays` aggregates).
- Existing v1 functions (`send-newsletter-email` etc.) reused later for the weekly recap email; not MVP.

### 8.3 Analytics (ships with the loop — gates are unmeasurable without it)

Events: `round_started`, `round_completed`, `card_shared` (copy/share button pressed), `signup_completed`, `streak_broken`. Stored in a `catch_events` table (simplest thing that works; no third-party analytics needed at this scale). Definition fixed now: **D7 return = completes a round on any of days 5–9 after first round.**

### 8.4 Deployment isolation

- Branch auto-deploys to a **Vercel preview URL** — testing happens there.
- Production domain keeps serving the current site until the final swap (Section 10).
- One shared-infrastructure rule for the whole build: **additive changes only** to the Supabase project (new tables/functions prefixed `catch_`/`catch-`); never modify v1 tables, functions, or auth config.

## 9. Step-by-step build plan

**Step 0 — Validate manually (5 days, zero code, strongly recommended before Step 1).**
Post one "Spot the Slip" screenshot to WhatsApp each morning for 5 weekdays; crown the first correct answer each evening. Gates: ≥20 day-1 players, ≥30% still playing day 5. Side-product: the 5 challenges + audience reactions become the first seeded content and difficulty calibration.

**Step 1 — Scaffold (days 1–2).**
Strip course pages/routes/config from the branch. New routes: `/` (today's round), `/how` (30-second explainer), `/me` (profile). Keep DESIGN.md system (colors/typography) but lift its anti-gamification rules — streaks and percentiles are now the product; update DESIGN.md accordingly on this branch.

**Step 2 — Core loop (days 3–7).**
`catch_challenges` + `catch_plays` schema, `catch-daily` + `catch-submit` functions, Spot the Slip + Real or Robot UIs (mobile-first — WhatsApp traffic is phones), reveal screen with explanation, localStorage anonymous play, text share card. Seed 14 challenges.

**Step 3 — Accounts, streaks, percentiles (days 8–10).**
Supabase auth wired (Google + email, as v1 had), `catch_streaks` + freeze logic, `/me` profile, daily percentile in the reveal.

**Step 4 — Polish + instrumentation (days 11–14).**
`catch_events` tracking, OG share image, empty/error/loading states, streak-at-risk copy on return visits, content stock to 30, founder QA pass on every challenge.

**Step 5 — Private beta (week 3+).**
Email + WhatsApp to all 189 existing users ("we turned the site into a game — 90 seconds, bet you can't catch it") pointing at the preview URL. Run ≥2 weeks. **Gate to further build: D7 ≥20% of activated players.** Below 8%: stop and rethink. Between: one iteration cycle on format/difficulty/reveal quality, then re-measure.

**Step 6 — Only after the gate passes:** weekly leaderboard (consistency-ranked, score secondary), formats 3–4, Slop Radar rolling score, weekly recap email, then the production swap (Section 10). B2B/credential/Pro per the monetization roadmap (Section 12) — all post-habit.

## 10. Production swap checklist (executed only on explicit "finalize")

1. Fake counters on the live site removed (do this immediately regardless — it's a trust issue, independent of the rebuild).
2. Stripe audit: confirm zero active v1 subscriptions, or refund/migrate.
3. Redirect map: v1 routes (`/courses/*`, `/games`, `/prompts`, `/daily-ai-tip`) → new home with a one-line "we've become a game" note.
4. Point production domain at the new build; keep v1 deployable for 30 days as rollback.
5. Announcement to the full list + LinkedIn post.

## 11. Risks

| Risk | Mitigation |
|---|---|
| Ambiguous challenges (game-killer #1) | Single-defensible-answer rule; founder hesitation = rejection; Step 0 calibrates difficulty on real people |
| Answer leakage/cheating | Answers never sent to client pre-submission; same-day answer secrecy; accept that determined cheaters exist (they're still playing) |
| Cold-start percentiles look silly at 20 players | Show "beta cohort" label under ~200 daily players |
| Founder content ops during travel | 14-day buffer is a hard rule; generation script keeps authoring to ~1 sitting/week |
| Nobody shares | Step 0 tests this for free in WhatsApp before any code exists |
| 7-day cadence too demanding for authoring | Fallback lever: weekend rounds become "best of the week" replays — halves weekend authoring at zero product cost |

## 12. Monetization roadmap (future, in unlock order — none in MVP)

1. **Team discernment drills (B2B, the spine):** same rounds, company-domain scenarios, private leaderboard, manager report; phishing-training analog; sold off keynotes (audience plays live → team pilot). EU AI Act Article 4 "AI literacy" obligation is the compliance tailwind.
2. **Verified credential:** paid, LinkedIn-shareable Slop Radar score once it means something.
3. **Consumer Pro (~$5–10/mo):** archive, extra rounds, streak insurance, skill breakdown.
4. **Sponsored rounds:** "Today's round presented by ___" (newsletter economics).
5. **Schools/media literacy** and (only with explicit transparency) aggregate judgment data.

## 13. Open questions

1. Score/brand name for the skill rating ("Slop Radar" is a working title — fun, but check it against the founder's professional-audience tone).
2. Weekend cadence: full 7-day fresh content vs. weekend replays (decide after Step 0 shows authoring cost).
3. Whether Step 0 runs before Step 1 or in parallel (recommendation: before — it's 5 days and de-risks everything).
4. Keep or drop v1's daily-tip email list as a secondary channel for the weekly recap.

## 14. Success criteria recap

- Step 0: ≥20 day-1 players, ≥30% day-5 retention, ≥30 gradeable audience reactions collected.
- MVP beta: ≥100 players complete ≥1 round in first month; D7 ≥20% of activated.
- Post-gate: ≥25% of weekly actives holding a 5+ day streak; share-button rate ≥15% of completed rounds.
- Always: zero fabricated numbers anywhere on the site.
