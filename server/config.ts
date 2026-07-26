/**
 * Round #1 is served on this date; the seed index advances daily.
 * Shared by the local dev API (server/catch-api.ts) and the production
 * Vercel functions (api/catch/*). Override per-deploy with CATCH_EPOCH_DATE.
 */
export const EPOCH_DATE = process.env.CATCH_EPOCH_DATE ?? '2026-07-26';
