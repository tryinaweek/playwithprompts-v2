# Testing Rules

## Framework

- **Unit/integration:** Vitest
- **E2E:** Playwright
- **Coverage target:** 80%+ for new code

## Principles

- Every bug fix must include a regression test.
- Every new public function must have tests.
- Test behavior, not implementation — don't test private internals.
- Test names describe the behavior: `should return 404 when user not found`.

## Structure

- Mirror `src/` structure under `tests/` (or co-locate with `.test.ts` suffix).
- Use `describe` blocks matching the module/function name.
- One assertion per test when practical.

## Patterns

- Use factory functions or builders for test data — not raw object literals everywhere.
- Mock external services (APIs, databases) at the boundary — not deep internals.
- For integration tests, prefer real implementations over mocks where feasible.
- Clean up side effects in `afterEach` / `afterAll`.

## Running

```bash
npm run test              # All unit tests
npm run test -- --watch   # Watch mode
npm run test:e2e          # E2E with Playwright
npx vitest run src/lib/   # Run tests for a specific directory
```

## Anti-patterns

- No `test.skip` or `test.todo` in committed code without a linked issue.
- No `sleep()` or arbitrary timeouts — use proper async assertions.
- No snapshot tests for logic — only for serialized output (HTML, JSON schemas).
