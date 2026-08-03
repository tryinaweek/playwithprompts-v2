/**
 * Practice mode: unlimited-ish extra rounds served from the challenge bank.
 *
 * The bank = the 30 bundled seed challenges + rows in catch_challenges
 * (batch-generated offline with scripts/generate-challenges.mjs — no LLM ever
 * runs at play time). catch_challenges holds answers, so it is readable ONLY
 * with SUPABASE_SERVICE_ROLE_KEY (server env); without the key the bank
 * degrades to the seeds and practice still works.
 *
 * Practice plays land in catch_practice_plays — a separate table so streaks
 * and percentiles (daily-only, catch_plays) can never be inflated by
 * practicing. Rate limit: PRACTICE_DAILY_LIMIT rounds per player per day,
 * unenforceable (null) while that table is missing.
 */
import { pickPracticeId } from '../../src/game/logic.js';
import type { Challenge, ChallengeAnswer } from '../../src/types/catch.js';
import { CHALLENGES } from './game.js';

export const PRACTICE_DAILY_LIMIT = 30;

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://nbfkibomkxvqyaoakmma.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZmtpYm9ta3h2cXlhb2FrbW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MjY0NjIsImV4cCI6MjA2MTAwMjQ2Mn0._d4WZD7t7_7QwRf_2lTku_9xJsiv20WqN__7_vfI_tA';

interface BankRow {
  id: string;
  format: Challenge['format'];
  difficulty: number;
  title: string;
  payload: Challenge['payload'];
  answer: ChallengeAnswer;
  explanation: string;
}

async function supabaseRest<T>(
  path: string,
  key: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: T | null }> {
  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
    const text = await resp.text();
    return { ok: resp.ok, status: resp.status, data: text ? (JSON.parse(text) as T) : null };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

/** Seed challenges + generated bank (seeds win on id collision). */
export async function loadBank(): Promise<Challenge[]> {
  const byId = new Map<string, Challenge>();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) {
    const r = await supabaseRest<BankRow[]>(
      'catch_challenges?active=eq.true&select=id,format,difficulty,title,payload,answer,explanation&limit=5000',
      serviceKey
    );
    if (r.ok && Array.isArray(r.data)) {
      for (const row of r.data) byId.set(row.id, row as Challenge);
    }
  }
  for (const c of CHALLENGES) byId.set(c.id, c);
  return [...byId.values()];
}

export interface PracticePlayRow {
  player_id: string;
  challenge_id: string;
  played_date: string;
  correct: boolean;
  score: number;
  time_ms: number;
}

/** All practice plays for a player, or null while the table is missing. */
export async function fetchPracticePlays(playerId: string): Promise<PracticePlayRow[] | null> {
  const r = await supabaseRest<PracticePlayRow[]>(
    `catch_practice_plays?player_id=eq.${encodeURIComponent(playerId)}&select=player_id,challenge_id,played_date,correct,score,time_ms&order=id.desc&limit=2000`,
    SUPABASE_ANON_KEY
  );
  return r.ok && Array.isArray(r.data) ? r.data : null;
}

export async function insertPracticePlay(row: PracticePlayRow): Promise<boolean> {
  const r = await supabaseRest('catch_practice_plays', SUPABASE_ANON_KEY, {
    method: 'POST',
    body: JSON.stringify(row),
  });
  return r.ok;
}

export interface PracticePick {
  challenge: Challenge | null;
  remainingToday: number | null;
  limitReached: boolean;
}

export async function pickPracticeChallenge(
  playerId: string,
  date: string,
  dailyChallengeId: string | null
): Promise<PracticePick> {
  const [bank, plays] = await Promise.all([loadBank(), fetchPracticePlays(playerId)]);

  let remainingToday: number | null = null;
  if (plays) {
    const playedToday = plays.filter((p) => p.played_date === date).length;
    remainingToday = Math.max(0, PRACTICE_DAILY_LIMIT - playedToday);
    if (remainingToday === 0) return { challenge: null, remainingToday: 0, limitReached: true };
  }

  const seen = new Set((plays ?? []).map((p) => p.challenge_id));
  const exclude = new Set(dailyChallengeId ? [dailyChallengeId] : []);
  const id = pickPracticeId(bank.map((c) => c.id), seen, exclude, Math.random());
  const challenge = bank.find((c) => c.id === id) ?? null;
  return { challenge, remainingToday, limitReached: false };
}

export async function findBankChallenge(id: string): Promise<Challenge | null> {
  if (!id || id.length > 64) return null;
  const bank = await loadBank();
  return bank.find((c) => c.id === id) ?? null;
}
