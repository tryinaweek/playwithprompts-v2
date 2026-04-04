# /fix-issue — Fix a Bug or Issue

Given a bug report or issue description, investigate and fix it.

## Steps

1. **Reproduce** — Understand the expected vs actual behavior.
2. **Investigate** — Search the codebase for the relevant code paths. Read error logs if available.
3. **Root cause** — Identify the root cause before writing any fix. No band-aids.
4. **Plan** — Propose the fix with specific files and changes. Wait for confirmation on non-trivial fixes.
5. **Implement** — Write the minimal fix. Don't refactor unrelated code.
6. **Test** — Add or update tests that cover the bug. Run the test suite.
7. **Verify** — Confirm the fix resolves the issue and doesn't break anything else.

## Input

$ARGUMENTS — Issue description, error message, or GitHub issue URL.
