import type { VercelRequest, VercelResponse } from '@vercel/node';
import { CHALLENGES, deriveStreak, fetchPlayerPlays, isValidPlayerId } from '../_lib/game.js';
import { fetchPracticePlays } from '../_lib/practice.js';
import { emptyStreak } from '../../src/game/logic.js';
import type { HistoryEntry, ProfileStats } from '../../src/types/catch.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });
  const playerId = String(req.headers['x-player-id'] ?? '');
  if (!isValidPlayerId(playerId)) return res.status(400).json({ error: 'missing player id' });

  const [plays, practicePlays] = await Promise.all([
    fetchPlayerPlays(playerId),
    fetchPracticePlays(playerId),
  ]);
  if (!plays) {
    // Degraded mode: no shared DB yet — return an honest empty profile.
    const stats: ProfileStats = {
      roundsPlayed: 0,
      correctCount: 0,
      accuracy: 0,
      streak: emptyStreak(),
      history: [],
    };
    return res.status(200).json(stats);
  }

  const correctCount = plays.filter((p) => p.correct).length;
  const history: HistoryEntry[] = plays.slice(0, 30).map((p) => {
    const ch = CHALLENGES.find((c) => c.id === p.challenge_id);
    return {
      date: p.played_date,
      challengeNumber: p.challenge_number,
      format: ch?.format ?? 'spot_the_slip',
      correct: p.correct,
      score: p.score,
    };
  });

  const stats: ProfileStats = {
    roundsPlayed: plays.length,
    correctCount,
    accuracy: plays.length ? Math.round((correctCount / plays.length) * 100) : 0,
    streak: deriveStreak(plays.map((p) => p.played_date)),
    history,
    practiceRounds: practicePlays?.length ?? 0,
    practiceCorrect: practicePlays?.filter((p) => p.correct).length ?? 0,
  };
  return res.status(200).json(stats);
}
