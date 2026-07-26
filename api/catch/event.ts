import type { VercelRequest, VercelResponse } from '@vercel/node';
import { insertEvent, isValidPlayerId } from '../_lib/game.js';

const ALLOWED = new Set(['round_started', 'card_shared', 'signup_completed']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  const playerId = String(req.headers['x-player-id'] ?? '');
  if (!isValidPlayerId(playerId)) return res.status(400).json({ error: 'missing player id' });

  const body = (req.body ?? {}) as { type?: unknown; meta?: unknown };
  const type = typeof body.type === 'string' ? body.type : '';
  if (!ALLOWED.has(type)) return res.status(400).json({ error: 'unknown event type' });

  await insertEvent(type, playerId, (body.meta as Record<string, unknown>) ?? {});
  return res.status(200).json({ ok: true });
}
