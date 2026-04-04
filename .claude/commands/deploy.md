# /deploy — Deploy to Environment

Pre-deploy checklist and deployment.

## Steps

1. **Pre-flight checks:**
   - Run `npm run typecheck` — must pass with zero errors.
   - Run `npm run lint` — must pass.
   - Run `npm run test` — all tests must pass.
   - Run `npm run build` — must succeed.
   - Verify working tree is clean (`git status`).

2. **Confirm target:**
   - Ask which environment: `staging` or `production`.
   - For production: require explicit user confirmation.

3. **Deploy:**
   <!-- TODO: Replace with actual deploy command -->
   - staging: `npm run deploy:staging`
   - production: `npm run deploy:production`

4. **Post-deploy:**
   - Verify the deployment is healthy (hit health check endpoint).
   - Report the deployed version/commit hash.

## Input

$ARGUMENTS — Target environment (staging | production).
