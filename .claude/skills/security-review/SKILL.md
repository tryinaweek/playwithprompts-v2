# Security Review Skill

## Description

Performs a security-focused review of code changes. Checks for OWASP Top 10 vulnerabilities, secret exposure, auth bypass, and unsafe patterns.

## When to Use

- Before merging PRs that touch auth, user input, API endpoints, or sensitive data.
- After writing code that handles file uploads, external API calls, or database queries.
- Proactively on any code that processes untrusted input.

## Checklist

### Input Validation
- [ ] All user input validated and sanitized at API boundaries.
- [ ] No raw SQL — parameterized queries or ORM only.
- [ ] No `eval()`, `Function()`, or dynamic code execution with user input.
- [ ] File uploads: type-checked, size-limited, stored outside webroot.

### Authentication & Authorization
- [ ] Auth checks on every protected endpoint.
- [ ] No auth logic in client-side code only.
- [ ] Session tokens are HttpOnly, Secure, SameSite.
- [ ] Password hashing uses bcrypt/scrypt/argon2 — never MD5/SHA1.

### Secrets
- [ ] No hardcoded API keys, tokens, or passwords.
- [ ] Secrets loaded from environment variables only.
- [ ] `.env` files in `.gitignore`.
- [ ] No secrets in logs or error messages.

### Headers & Transport
- [ ] HTTPS enforced.
- [ ] CORS configured to specific origins — not `*` in production.
- [ ] Security headers set: CSP, X-Frame-Options, X-Content-Type-Options.

### Dependencies
- [ ] No known vulnerabilities (`npm audit`).
- [ ] Lock file committed.
- [ ] No wildcard version ranges in production deps.

## Output

Structured findings with severity (CRITICAL/HIGH/MEDIUM/LOW), file path, line number, and remediation steps.
