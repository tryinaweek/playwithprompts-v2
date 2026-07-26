import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  buildShareTextNullable,
  challengeForDate,
  DATE_RE,
  deriveStreak,
  fetchChallengePlays,
  fetchPlayerPlays,
  isValidPlayerId,
  percentileFrom,
  toPublic,
} from '../_lib/game.js';
import type { DailyResponse, SubmitResult } from '../../src/types/catch.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });
  const date = String(req.query.date ?? '');
  const playerId = String(req.headers['x-player-id'] ?? '');
  if (!DATE_RE.test(date)) return res.status(400).json({ error: 'invalid date' });
  if (!isValidPlayerId(playerId)) return res.status(400).json({ error: 'missing player id' });

  const found = challengeForDate(date);
  if (!found) return res.status(404).json({ error: 'no challenge for this date' });

  const plays = await fetchChallengePlays(found.challenge.id, date);
  const myPlay = plays?.find((p) => p.player_id === playerId && p.played_date === date) ?? null;

  let result: SubmitResult | null = null;
  if (myPlay) {
    const playerPlays = await fetchPlayerPlays(playerId);
    const streak = playerPlays ? deriveStreak(playerPlays.map((p) => p.played_date)) : null;
    const percentile = percentileFrom(plays, myPlay.score);
    result = {
      correct: myPlay.correct,
      score: myPlay.score,
      timeMs: myPlay.time_ms,
      answer: found.challenge.answer,
      playerAnswer: myPlay.answer,
      explanation: found.challenge.explanation,
      percentile,
      streak,
      shareText: buildShareTextNullable({
        number: found.number,
        correct: myPlay.correct,
        timeMs: myPlay.time_ms,
        streak,
        percentile,
      }),
    };
  }

  const response: DailyResponse = {
    challenge: toPublic(found.challenge, found.number, date),
    alreadyPlayed: Boolean(myPlay),
    result,
  };
  return res.status(200).json(response);
}
