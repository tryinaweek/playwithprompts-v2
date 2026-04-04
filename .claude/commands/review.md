# /review — Code Review

Review the current diff against the base branch for:

1. **Correctness** — logic errors, off-by-one, null/undefined risks
2. **Security** — injection, auth bypass, secret exposure, OWASP top 10
3. **Performance** — unnecessary re-renders, N+1 queries, missing indexes
4. **Style** — naming, structure, consistency with project conventions
5. **Tests** — adequate coverage, edge cases, flaky patterns

## Steps

1. Run `git diff main...HEAD` to get the full diff.
2. For each changed file, read enough surrounding context to understand intent.
3. Categorize findings as CRITICAL / HIGH / MEDIUM / LOW.
4. Output a structured review with file paths, line numbers, and suggested fixes.
5. End with a SHIP / SHIP WITH FIXES / DO NOT SHIP verdict.
