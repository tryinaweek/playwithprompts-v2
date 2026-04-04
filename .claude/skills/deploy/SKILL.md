# Deploy Skill

## Description

Manages deployment workflows including pre-flight validation, environment targeting, and post-deploy verification.

## When to Use

- When the user says "deploy", "ship", "push to staging/production".
- After a feature branch is merged and ready for release.

## Environments

<!-- TODO: Replace with actual infrastructure -->

| Environment | URL | Deploy Command |
|-------------|-----|----------------|
| staging | `https://staging.voiceagent.example.com` | `npm run deploy:staging` |
| production | `https://voiceagent.example.com` | `npm run deploy:production` |

## Pre-flight Checklist

1. Working tree is clean.
2. On the correct branch (`main` for production).
3. `npm run typecheck` passes.
4. `npm run lint` passes.
5. `npm run test` passes.
6. `npm run build` succeeds.
7. No CRITICAL security findings from security review.

## Deploy Process

<!-- TODO: Replace with actual deploy steps -->

1. Run pre-flight checklist.
2. Confirm target environment with user.
3. For production: require explicit "yes" confirmation.
4. Execute deploy command.
5. Wait for deployment to complete.
6. Hit health check endpoint to verify.
7. Report deployed version and status.

## Rollback

<!-- TODO: Define rollback procedure -->

- staging: redeploy previous commit.
- production: revert merge commit and redeploy, or use platform rollback.

## Post-deploy

- Verify health check: `GET /api/health`
- Check error rate in monitoring dashboard.
- Notify team in relevant channel.
