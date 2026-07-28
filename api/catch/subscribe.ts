import type { VercelRequest, VercelResponse } from '@vercel/node';
import { insertSubscriber, isValidEmail, isValidPlayerId } from '../_lib/game.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  const playerId = String(req.headers['x-player-id'] ?? '');
  if (!isValidPlayerId(playerId)) return res.status(400).json({ error: 'missing player id' });

  const body = (req.body ?? {}) as { email?: unknown; source?: unknown };
  if (!isValidEmail(body.email)) return res.status(400).json({ error: "That doesn't look like an email" });
  const source = typeof body.source === 'string' && body.source.length <= 32 ? body.source : 'unknown';

  const outcome = await insertSubscriber(body.email, playerId, source);
  if (outcome === 'failed') return res.status(503).json({ error: 'could not save — try again later' });
  return res.status(200).json({ ok: true, alreadySubscribed: outcome === 'duplicate' });
}
