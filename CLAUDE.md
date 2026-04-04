# CLAUDE.md

## Project Overview

<!-- TODO: Replace with actual project description -->
Voice Agent — AI-powered voice assistant application.

## Tech Stack

- **Language:** TypeScript (strict mode)
- **Runtime:** Node.js 20 LTS
- **Framework:** <!-- TODO: Express / Fastify / Next.js / Hono? -->
- **Database:** <!-- TODO: PostgreSQL / SQLite / Supabase? -->
- **Auth:** <!-- TODO: Clerk / NextAuth / Supabase Auth? -->
- **Testing:** Vitest + Playwright
- **Package Manager:** npm
- **Linter/Formatter:** ESLint + Prettier

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Lint + format check
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests
npm run typecheck    # tsc --noEmit
```

<!-- TODO: Add any project-specific commands (db migrate, seed, deploy) -->

## Architecture

<!-- TODO: Fill in once the project structure exists -->

```
src/
  app/           # Routes / pages
  components/    # UI components
  lib/           # Shared utilities, config
  server/        # Backend logic, API routes
  types/         # TypeScript definitions
tests/           # Tests mirroring src/
```

## Key Patterns

- Prefer named exports over default exports.
- Use `async/await`; no raw promise chains or callbacks.
- Validate inputs at API boundaries (Zod recommended).
- Use project error utilities; never swallow errors silently.
- Keep edits small and focused — don't refactor unrelated code.

## Conventions

- **Commits:** conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`).
- **Branches:** `feature/<name>`, `fix/<name>`, `chore/<name>` off `main`.
- **PRs:** one logical change per PR; include test plan.
- **Secrets:** never committed — use `.env` and `.env.example`.

## Domain Terminology

<!-- TODO: Define project-specific terms -->
- **Agent:** <!-- definition -->
- **Session:** <!-- definition -->
- **Utterance:** <!-- definition -->

## Design System
Always read `prompt-tic-tac-toe/DESIGN.md` before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.
