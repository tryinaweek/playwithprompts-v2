/**
 * Local dev API for Catch the AI, mounted as Vite middleware.
 *
 * Mirrors the contract of the production Supabase edge functions
 * (supabase/functions/catch-daily, catch-submit): answers and explanations
 * never leave the server before a submission for that challenge exists.
 *
 * Persistence is a JSON file under .local-data/ (gitignored) so state
 * survives dev-server restarts.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Connect, Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  buildShareText,
  computePercentile,
  computeScore,
  daysBetween,
  emptyStreak,
  isCorrectAnswer,
  updateStreak,
} from '../src/game/logic';
import type {
  Challenge,
  ChallengeAnswer,
  DailyResponse,
  HistoryEntry,
  ProfileStats,
  PublicChallenge,
  StreakState,
  SubmitResult,
} from '../src/types/catch';

import { EPOCH_DATE } from './config';

const DATA_DIR = path.resolve(process.cwd(), '.local-data');
const DB_PATH = path.join(DATA_DIR, 'catch-db.json');
const SEED_PATH = path.resolve(process.cwd(), 'server/seed-challenges.json');

const SUPABASE_URL = 'https://nbfkibomkxvqyaoakmma.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZmtpYm9ta3h2cXlhb2FrbW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MjY0NjIsImV4cCI6MjA2MTAwMjQ2Mn0._d4WZD7t7_7QwRf_2lTku_9xJsiv20WqN__7_vfI_tA';

interface PlayRecord {
  challengeId: string;
  challengeNumber: number;
  date: string;
  answer: ChallengeAnswer;
  correct: boolean;
  score: number;
  timeMs: number;
  createdAt: string;
}

interface PlayerRecord {
  streak: StreakState;
  plays: Record<string, PlayRecord>;
}

interface EventRecord {
  type: string;
  playerId: string;
  meta: Record<string, unknown>;
  createdAt: string;
}

interface Db {
  players: Record<string, PlayerRecord>;
  events: EventRecord[];
}

function loadDb(): Db {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) as Db;
  } catch {
    return { players: {}, events: [] };
  }
}

function saveDb(db: Db): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function loadChallenges(): Challenge[] {
  const raw = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8')) as Challenge[];
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error('seed-challenges.json is empty');
  }
  return raw;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function challengeForDate(challenges: Challenge[], date: string): { challenge: Challenge; number: number } | null {
  const offset = daysBetween(EPOCH_DATE, date);
  if (offset < 0) return null;
  // Cycle in dev so the game never runs dry locally.
  const idx = offset % challenges.length;
  return { challenge: challenges[idx], number: offset + 1 };
}

function toPublic(challenge: Challenge, number: number, date: string): PublicChallenge {
  return {
    id: challenge.id,
    number,
    date,
    format: challenge.format,
    difficulty: challenge.difficulty,
    payload: challenge.payload,
  };
}

function getPlayer(db: Db, playerId: string): PlayerRecord {
  if (!db.players[playerId]) {
    db.players[playerId] = { streak: emptyStreak(), plays: {} };
  }
  return db.players[playerId];
}

function buildResult(
  db: Db,
  challenge: Challenge,
  number: number,
  play: PlayRecord,
  streak: StreakState
): SubmitResult {
  const key = `${play.date}:${challenge.id}`;
  const scoresToday = Object.values(db.players)
    .map((p) => p.plays[key])
    .filter((p): p is PlayRecord => Boolean(p))
    .map((p) => p.score);
  const percentile = computePercentile(scoresToday, play.score);
  return {
    correct: play.correct,
    score: play.score,
    timeMs: play.timeMs,
    answer: challenge.answer,
    playerAnswer: play.answer,
    explanation: challenge.explanation,
    percentile,
    streak,
    shareText: buildShareText({
      number,
      correct: play.correct,
      timeMs: play.timeMs,
      currentStreak: streak.currentStreak,
      topPercent: percentile.topPercent,
      rank: percentile.rank,
    }),
  };
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 100_000) reject(new Error('body too large'));
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function json(res: ServerResponse, status: number, data: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function fail(res: ServerResponse, status: number, message: string): void {
  json(res, status, { error: message });
}

function isValidAnswer(value: unknown): value is ChallengeAnswer {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (typeof v.segmentIndex === 'number' && Number.isInteger(v.segmentIndex) && v.segmentIndex >= 0) ||
    (typeof v.optionId === 'string' && v.optionId.length <= 10)
  );
}

async function resolveSupabaseUser(accessToken: string): Promise<string | null> {
  try {
    const resp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok) return null;
    const user = (await resp.json()) as { id?: string };
    return user.id ?? null;
  } catch {
    return null;
  }
}

export function catchApiPlugin(): Plugin {
  return {
    name: 'catch-api',
    configureServer(server: ViteDevServer) {
      const challenges = loadChallenges();

      const handler: Connect.NextHandleFunction = (req, res, next) => {
        void (async () => {
          const url = new URL(req.url ?? '/', 'http://localhost');
          const route = url.pathname;
          const playerId = String(req.headers['x-player-id'] ?? '');

          if (!route.startsWith('/api/catch/')) {
            next();
            return;
          }
          if (!playerId || playerId.length > 64) {
            fail(res, 400, 'missing player id');
            return;
          }

          const db = loadDb();

          if (route === '/api/catch/daily' && req.method === 'GET') {
            const date = url.searchParams.get('date') ?? '';
            if (!DATE_RE.test(date)) {
              fail(res, 400, 'invalid date');
              return;
            }
            const found = challengeForDate(challenges, date);
            if (!found) {
              fail(res, 404, 'no challenge for this date');
              return;
            }
            const player = getPlayer(db, playerId);
            const play = player.plays[`${date}:${found.challenge.id}`];
            const response: DailyResponse = {
              challenge: toPublic(found.challenge, found.number, date),
              alreadyPlayed: Boolean(play),
              result: play ? buildResult(db, found.challenge, found.number, play, player.streak) : null,
            };
            json(res, 200, response);
            return;
          }

          if (route === '/api/catch/submit' && req.method === 'POST') {
            let body: { date?: string; answer?: unknown; timeMs?: unknown };
            try {
              body = JSON.parse(await readBody(req));
            } catch {
              fail(res, 400, 'invalid json');
              return;
            }
            const date = body.date ?? '';
            if (!DATE_RE.test(date)) {
              fail(res, 400, 'invalid date');
              return;
            }
            if (!isValidAnswer(body.answer)) {
              fail(res, 400, 'invalid answer');
              return;
            }
            const timeMs = typeof body.timeMs === 'number' ? Math.min(Math.max(body.timeMs, 0), 600_000) : 600_000;
            const found = challengeForDate(challenges, date);
            if (!found) {
              fail(res, 404, 'no challenge for this date');
              return;
            }
            const player = getPlayer(db, playerId);
            const key = `${date}:${found.challenge.id}`;
            if (player.plays[key]) {
              fail(res, 409, 'already played today');
              return;
            }
            const correct = isCorrectAnswer(found.challenge, body.answer);
            const score = computeScore(correct, timeMs);
            const prevStreak = player.streak;
            player.streak = updateStreak(prevStreak, date);
            if (prevStreak.currentStreak > 1 && player.streak.currentStreak === 1) {
              db.events.push({
                type: 'streak_broken',
                playerId,
                meta: { previous: prevStreak.currentStreak },
                createdAt: new Date().toISOString(),
              });
            }
            const play: PlayRecord = {
              challengeId: found.challenge.id,
              challengeNumber: found.number,
              date,
              answer: body.answer,
              correct,
              score,
              timeMs,
              createdAt: new Date().toISOString(),
            };
            player.plays[key] = play;
            db.events.push({
              type: 'round_completed',
              playerId,
              meta: { challengeId: found.challenge.id, correct, score, timeMs },
              createdAt: new Date().toISOString(),
            });
            saveDb(db);
            json(res, 200, buildResult(db, found.challenge, found.number, play, player.streak));
            return;
          }

          if (route === '/api/catch/me' && req.method === 'GET') {
            const player = getPlayer(db, playerId);
            const plays = Object.values(player.plays).sort((a, b) => (a.date < b.date ? 1 : -1));
            const correctCount = plays.filter((p) => p.correct).length;
            const history: HistoryEntry[] = plays.slice(0, 30).map((p) => {
              const ch = challenges.find((c) => c.id === p.challengeId);
              return {
                date: p.date,
                challengeNumber: p.challengeNumber,
                format: ch?.format ?? 'spot_the_slip',
                correct: p.correct,
                score: p.score,
              };
            });
            const stats: ProfileStats = {
              roundsPlayed: plays.length,
              correctCount,
              accuracy: plays.length ? Math.round((correctCount / plays.length) * 100) : 0,
              streak: player.streak,
              history,
            };
            json(res, 200, stats);
            return;
          }

          if (route === '/api/catch/event' && req.method === 'POST') {
            let body: { type?: unknown; meta?: unknown };
            try {
              body = JSON.parse(await readBody(req));
            } catch {
              fail(res, 400, 'invalid json');
              return;
            }
            const type = typeof body.type === 'string' ? body.type : '';
            const allowed = new Set(['round_started', 'card_shared', 'signup_completed']);
            if (!allowed.has(type)) {
              fail(res, 400, 'unknown event type');
              return;
            }
            db.events.push({
              type,
              playerId,
              meta: (body.meta as Record<string, unknown>) ?? {},
              createdAt: new Date().toISOString(),
            });
            saveDb(db);
            json(res, 200, { ok: true });
            return;
          }

          if (route === '/api/catch/link' && req.method === 'POST') {
            let body: { accessToken?: unknown };
            try {
              body = JSON.parse(await readBody(req));
            } catch {
              fail(res, 400, 'invalid json');
              return;
            }
            const token = typeof body.accessToken === 'string' ? body.accessToken : '';
            if (!token) {
              fail(res, 400, 'missing token');
              return;
            }
            const uid = await resolveSupabaseUser(token);
            if (!uid) {
              fail(res, 401, 'invalid session');
              return;
            }
            // Merge the anonymous record into the account-keyed record (first link wins).
            if (playerId !== uid && db.players[playerId] && !db.players[uid]) {
              db.players[uid] = db.players[playerId];
              delete db.players[playerId];
            }
            getPlayer(db, uid);
            db.events.push({ type: 'signup_completed', playerId: uid, meta: {}, createdAt: new Date().toISOString() });
            saveDb(db);
            json(res, 200, { playerId: uid });
            return;
          }

          fail(res, 404, 'not found');
        })().catch(() => fail(res, 500, 'internal error'));
      };

      server.middlewares.use(handler);
    },
  };
}
