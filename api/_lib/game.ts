/**
 * Shared logic for the production Vercel functions (api/catch/*).
 *
 * Storage is Supabase (catch_plays / catch_events via PostgREST, anon key).
 * If the tables don't exist yet (HTTP 404 / code 42P01), every helper degrades
 * gracefully: the game stays fully playable, percentile and streak come back
 * null, and the client hides those lines. Challenges ship inside the function
 * bundle — answers never live client-side.
 */
import challengesJson from '../../server/seed-challenges.json' with { type: 'json' };
import { EPOCH_DATE } from '../../server/config.js';
import {
  computePercentile,
  computeScore,
  daysBetween,
  emptyStreak,
  isCorrectAnswer,
  updateStreak,
} from '../../src/game/logic.js';
import type {
  Challenge,
  ChallengeAnswer,
  PercentileInfo,
  PublicChallenge,
  StreakState,
} from '../../src/types/catch';

export const CHALLENGES = challengesJson as unknown as Challenge[];
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://nbfkibomkxvqyaoakmma.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZmtpYm9ta3h2cXlhb2FrbW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MjY0NjIsImV4cCI6MjA2MTAwMjQ2Mn0._d4WZD7t7_7QwRf_2lTku_9xJsiv20WqN__7_vfI_tA';

export { computeScore, isCorrectAnswer };

export function challengeForDate(date: string): { challenge: Challenge; number: number } | null {
  const offset = daysBetween(EPOCH_DATE, date);
  if (offset < 0) return null;
  return { challenge: CHALLENGES[offset % CHALLENGES.length], number: offset + 1 };
}

export function toPublic(challenge: Challenge, number: number, date: string): PublicChallenge {
  return {
    id: challenge.id,
    number,
    date,
    format: challenge.format,
    difficulty: challenge.difficulty,
    payload: challenge.payload,
  };
}

export function isValidAnswer(value: unknown): value is ChallengeAnswer {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (typeof v.segmentIndex === 'number' && Number.isInteger(v.segmentIndex) && v.segmentIndex >= 0) ||
    (typeof v.optionId === 'string' && (v.optionId as string).length <= 10)
  );
}

export function isValidPlayerId(id: string): boolean {
  return id.length > 0 && id.length <= 64;
}

// ---------------------------------------------------------------------------
// Supabase REST (degrades to null when tables are missing or requests fail)
// ---------------------------------------------------------------------------

interface RestResult<T> {
  ok: boolean;
  status: number;
  degraded: boolean;
  data: T | null;
  errorCode?: string;
}

async function rest<T>(path: string, init?: RequestInit): Promise<RestResult<T>> {
  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
    const text = await resp.text();
    const data = text ? (JSON.parse(text) as T & { code?: string }) : null;
    const errorCode = data && typeof data === 'object' && 'code' in data ? String(data.code) : undefined;
    const degraded = resp.status === 404 && errorCode === '42P01';
    return { ok: resp.ok, status: resp.status, degraded, data: resp.ok ? (data as T) : null, errorCode };
  } catch {
    return { ok: false, status: 0, degraded: true, data: null };
  }
}

export interface PlayRow {
  player_id: string;
  challenge_id: string;
  challenge_number: number;
  played_date: string;
  answer: ChallengeAnswer;
  correct: boolean;
  score: number;
  time_ms: number;
}

/** All plays for a given challenge on a given date, or null when degraded. */
export async function fetchChallengePlays(challengeId: string, date: string): Promise<PlayRow[] | null> {
  const r = await rest<PlayRow[]>(
    `catch_plays?challenge_id=eq.${encodeURIComponent(challengeId)}&played_date=eq.${date}&select=player_id,challenge_id,challenge_number,played_date,answer,correct,score,time_ms`
  );
  return r.ok ? r.data : null;
}

/** All plays for a player (newest first), or null when degraded. */
export async function fetchPlayerPlays(playerId: string): Promise<PlayRow[] | null> {
  const r = await rest<PlayRow[]>(
    `catch_plays?player_id=eq.${encodeURIComponent(playerId)}&select=player_id,challenge_id,challenge_number,played_date,answer,correct,score,time_ms&order=played_date.desc&limit=400`
  );
  return r.ok ? r.data : null;
}

/** Insert a play. Returns 'ok' | 'duplicate' | 'degraded'. */
export async function insertPlay(row: PlayRow): Promise<'ok' | 'duplicate' | 'degraded'> {
  const r = await rest('catch_plays', { method: 'POST', body: JSON.stringify(row) });
  if (r.ok) return 'ok';
  if (r.status === 409 || r.errorCode === '23505') return 'duplicate';
  return 'degraded';
}

export async function insertEvent(type: string, playerId: string, meta: Record<string, unknown>): Promise<void> {
  await rest('catch_events', {
    method: 'POST',
    body: JSON.stringify({ event_type: type, player_id: playerId, meta }),
  });
}

/** Verify a Supabase access token; returns the account id + email, or null. */
export async function resolveUser(accessToken: string): Promise<{ id: string; email: string } | null> {
  try {
    const resp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok) return null;
    const user = (await resp.json()) as { id?: string; email?: string };
    return user.id ? { id: user.id, email: user.email ?? '' } : null;
  } catch {
    return null;
  }
}

/**
 * Copy a device's anonymous plays onto the account so a streak survives
 * sign-in and follows the player to any device. Duplicates are ignored, so
 * re-linking the same device is harmless.
 */
export async function adoptPlays(anonPlayerId: string, userId: string): Promise<number> {
  if (!anonPlayerId || anonPlayerId === userId) return 0;
  const plays = await fetchPlayerPlays(anonPlayerId);
  if (!plays || plays.length === 0) return 0;
  let adopted = 0;
  for (const p of plays) {
    const outcome = await insertPlay({ ...p, player_id: userId });
    if (outcome === 'ok') adopted++;
  }
  return adopted;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 254 && EMAIL_RE.test(value);
}

/**
 * Store a subscriber. Writes to catch_subscribers; if that table isn't
 * provisioned yet, falls back to catch_events so an address is never lost.
 * Returns 'ok' | 'duplicate' | 'failed'.
 */
export async function insertSubscriber(
  email: string,
  playerId: string,
  source: string
): Promise<'ok' | 'duplicate' | 'failed'> {
  const normalized = email.trim().toLowerCase();
  const r = await rest('catch_subscribers', {
    method: 'POST',
    body: JSON.stringify({ email: normalized, player_id: playerId, source }),
  });
  if (r.ok) return 'ok';
  if (r.status === 409 || r.errorCode === '23505') return 'duplicate';

  const fallback = await rest('catch_events', {
    method: 'POST',
    body: JSON.stringify({
      event_type: 'email_captured',
      player_id: playerId,
      meta: { email: normalized, source },
    }),
  });
  return fallback.ok ? 'ok' : 'failed';
}

// ---------------------------------------------------------------------------
// Derived state
// ---------------------------------------------------------------------------

/** Fold a player's play dates (any order) into a streak state. */
export function deriveStreak(playDates: string[]): StreakState {
  const unique = [...new Set(playDates)].sort();
  let s = emptyStreak();
  for (const d of unique) s = updateStreak(s, d);
  return s;
}

export function buildShareTextNullable(input: {
  number: number;
  correct: boolean;
  timeMs: number;
  streak: StreakState | null;
  percentile: PercentileInfo | null;
}): string {
  const secs = Math.max(1, Math.round(input.timeMs / 1000));
  const outcome = input.correct ? `✅ caught it in ${secs}s` : '❌ got fooled';
  const streakPart =
    input.streak && input.streak.currentStreak > 1 ? ` · ${input.streak.currentStreak}-day streak` : '';
  const rankPart = !input.correct
    ? ''
    : !input.percentile
      ? ''
      : input.percentile.rank === 1
        ? ' · 🥇 top score'
        : ` · Top ${input.percentile.topPercent}%`;
  return `Catch the AI #${input.number} 🎯 ${outcome}${streakPart}${rankPart}\nplaywithprompts.com`;
}

export function percentileFrom(plays: PlayRow[] | null, myScore: number): PercentileInfo | null {
  if (!plays) return null;
  return computePercentile(plays.map((p) => p.score), myScore);
}
