import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  computeScore,
  DATE_RE,
  insertEvent,
  isCorrectAnswer,
  isValidAnswer,
  isValidPlayerId,
} from '../_lib/game.js';
import { findBankChallenge, insertPracticePlay } from '../_lib/practice.js';
import type { PracticeResult } from '../../src/types/catch.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  const playerId = String(req.headers['x-player-id'] ?? '');
  if (!isValidPlayerId(playerId)) return res.status(400).json({ error: 'missing player id' });

  const body = (req.body ?? {}) as {
    date?: unknown;
    challengeId?: unknown;
    answer?: unknown;
    timeMs?: unknown;
  };
  const date = typeof body.date === 'string' ? body.date : '';
  const challengeId = typeof body.challengeId === 'string' ? body.challengeId : '';
  if (!DATE_RE.test(date)) return res.status(400).json({ error: 'invalid date' });
  if (!isValidAnswer(body.answer)) return res.status(400).json({ error: 'invalid answer' });
  const timeMs =
    typeof body.timeMs === 'number' ? Math.min(Math.max(body.timeMs, 0), 600_000) : 600_000;

  const challenge = await findBankChallenge(challengeId);
  if (!challenge) return res.status(404).json({ error: 'unknown challenge' });

  const correct = isCorrectAnswer(challenge, body.answer);
  const score = computeScore(correct, timeMs);

  // Best-effort: practice must stay playable even while the table is missing.
  void insertPracticePlay({
    player_id: playerId,
    challenge_id: challenge.id,
    played_date: date,
    correct,
    score,
    time_ms: timeMs,
  });
  void insertEvent('practice_completed', playerId, { challengeId: challenge.id, correct, score });

  const result: PracticeResult = {
    correct,
    score,
    timeMs,
    answer: challenge.answer,
    playerAnswer: body.answer,
    explanation: challenge.explanation,
  };
  return res.status(200).json(result);
}
