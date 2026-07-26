import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  buildShareTextNullable,
  challengeForDate,
  computeScore,
  DATE_RE,
  deriveStreak,
  fetchChallengePlays,
  fetchPlayerPlays,
  insertEvent,
  insertPlay,
  isCorrectAnswer,
  isValidAnswer,
  isValidPlayerId,
  percentileFrom,
} from '../_lib/game.js';
import type { SubmitResult } from '../../src/types/catch.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  const playerId = String(req.headers['x-player-id'] ?? '');
  if (!isValidPlayerId(playerId)) return res.status(400).json({ error: 'missing player id' });

  const body = (req.body ?? {}) as { date?: unknown; answer?: unknown; timeMs?: unknown };
  const date = typeof body.date === 'string' ? body.date : '';
  if (!DATE_RE.test(date)) return res.status(400).json({ error: 'invalid date' });
  if (!isValidAnswer(body.answer)) return res.status(400).json({ error: 'invalid answer' });
  const timeMs =
    typeof body.timeMs === 'number' ? Math.min(Math.max(body.timeMs, 0), 600_000) : 600_000;

  const found = challengeForDate(date);
  if (!found) return res.status(404).json({ error: 'no challenge for this date' });

  const correct = isCorrectAnswer(found.challenge, body.answer);
  const score = computeScore(correct, timeMs);

  const inserted = await insertPlay({
    player_id: playerId,
    challenge_id: found.challenge.id,
    challenge_number: found.number,
    played_date: date,
    answer: body.answer,
    correct,
    score,
    time_ms: timeMs,
  });
  if (inserted === 'duplicate') return res.status(409).json({ error: 'already played today' });

  let streak = null;
  let percentile = null;
  if (inserted === 'ok') {
    void insertEvent('round_completed', playerId, {
      challengeId: found.challenge.id,
      correct,
      score,
      timeMs,
    });
    const [playerPlays, challengePlays] = await Promise.all([
      fetchPlayerPlays(playerId),
      fetchChallengePlays(found.challenge.id, date),
    ]);
    if (playerPlays) {
      const dates = playerPlays.map((p) => p.played_date);
      const prev = deriveStreak(dates.filter((d) => d !== date));
      streak = deriveStreak(dates);
      if (prev.currentStreak > 1 && streak.currentStreak === 1) {
        void insertEvent('streak_broken', playerId, { previous: prev.currentStreak });
      }
    }
    percentile = percentileFrom(challengePlays, score);
  }

  const result: SubmitResult = {
    correct,
    score,
    timeMs,
    answer: found.challenge.answer,
    playerAnswer: body.answer,
    explanation: found.challenge.explanation,
    percentile,
    streak,
    shareText: buildShareTextNullable({ number: found.number, correct, timeMs, streak, percentile }),
  };
  return res.status(200).json(result);
}
