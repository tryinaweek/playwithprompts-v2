import type { VercelRequest, VercelResponse } from '@vercel/node';
import { challengeForDate, DATE_RE, isValidPlayerId, toPublic } from '../_lib/game.js';
import { pickPracticeChallenge } from '../_lib/practice.js';
import type { PracticeRoundResponse } from '../../src/types/catch.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });
  const date = String(req.query.date ?? '');
  const playerId = String(req.headers['x-player-id'] ?? '');
  if (!DATE_RE.test(date)) return res.status(400).json({ error: 'invalid date' });
  if (!isValidPlayerId(playerId)) return res.status(400).json({ error: 'missing player id' });

  const daily = challengeForDate(date);
  const pick = await pickPracticeChallenge(playerId, date, daily?.challenge.id ?? null);

  if (pick.limitReached) {
    return res.status(429).json({ error: 'practice limit reached — come back tomorrow' });
  }
  if (!pick.challenge) {
    return res.status(404).json({ error: 'no practice challenge available' });
  }

  const response: PracticeRoundResponse = {
    // number 0 / the played date mark it as practice — not part of the daily sequence.
    challenge: toPublic(pick.challenge, 0, date),
    remainingToday: pick.remainingToday,
  };
  return res.status(200).json(response);
}
