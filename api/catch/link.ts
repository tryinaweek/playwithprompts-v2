import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adoptPlays, insertEvent, isValidPlayerId, resolveUser } from '../_lib/game.js';

/**
 * Attach the current device's anonymous play history to a signed-in account.
 * The access token is verified against Supabase before anything is written,
 * so a caller can only adopt history onto their own account.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  const anonPlayerId = String(req.headers['x-player-id'] ?? '');
  if (!isValidPlayerId(anonPlayerId)) return res.status(400).json({ error: 'missing player id' });

  const body = (req.body ?? {}) as { accessToken?: unknown };
  const token = typeof body.accessToken === 'string' ? body.accessToken : '';
  if (!token) return res.status(400).json({ error: 'missing token' });

  const user = await resolveUser(token);
  if (!user) return res.status(401).json({ error: 'invalid session' });

  const adopted = await adoptPlays(anonPlayerId, user.id);
  void insertEvent('signup_completed', user.id, { adopted });

  return res.status(200).json({ playerId: user.id, adopted });
}
