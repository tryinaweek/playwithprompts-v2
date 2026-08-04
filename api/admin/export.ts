import type { VercelRequest, VercelResponse } from '@vercel/node';
import { deriveStreak } from '../_lib/game.js';

/**
 * CSV / plain-email exports for the command center.
 *   /api/admin/export?what=list            → THE LIST as CSV
 *   /api/admin/export?what=list&format=emails → newline-separated emails (for BCC)
 *   /api/admin/export?what=players         → game players as CSV
 * Password-guarded; service-role reads, server-side only.
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://nbfkibomkxvqyaoakmma.supabase.co';

async function sb<T>(path: string): Promise<T | null> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  try {
    const resp = await fetch(`${SUPABASE_URL}${path}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!resp.ok) return null;
    return (await resp.json()) as T;
  } catch {
    return null;
  }
}

function csvCell(value: unknown): string {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers.join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });

  const adminPw = process.env.ADMIN_PASSWORD;
  if (!adminPw) return res.status(500).json({ error: 'ADMIN_PASSWORD env var not set' });
  const password = String(req.headers['x-admin-password'] ?? '').trim();
  if (!password || password !== adminPw.trim()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const what = String(req.query.what ?? '');
  const format = String(req.query.format ?? 'csv');
  const stamp = new Date().toISOString().slice(0, 10);

  if (what === 'list') {
    const people = await sb<{ email: string; source: string; first_seen: string; name: string | null }[]>(
      '/rest/v1/people?select=email,name,source,first_seen&order=first_seen.desc&limit=100000'
    );
    if (!people) return res.status(502).json({ error: 'could not read people' });

    if (format === 'emails') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(people.map((p) => p.email).join('\n'));
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="the-list-${stamp}.csv"`);
    return res
      .status(200)
      .send(
        toCsv(
          ['email', 'name', 'source', 'first_seen'],
          people.map((p) => [p.email, p.name, p.source, p.first_seen])
        )
      );
  }

  if (what === 'players') {
    interface PlayRow {
      player_id: string;
      played_date: string;
      correct: boolean;
    }
    interface AuthUser {
      id: string;
      email?: string;
    }
    const [plays, authData] = await Promise.all([
      sb<PlayRow[]>('/rest/v1/catch_plays?select=player_id,played_date,correct&limit=100000'),
      sb<{ users?: AuthUser[] } | AuthUser[]>('/auth/v1/admin/users?per_page=1000'),
    ]);
    if (!plays) return res.status(502).json({ error: 'could not read plays' });
    const users = Array.isArray(authData) ? authData : (authData?.users ?? []);
    const emails = new Map(users.filter((u) => u.email).map((u) => [u.id, u.email as string]));

    const byPlayer = new Map<string, PlayRow[]>();
    for (const p of plays) byPlayer.set(p.player_id, [...(byPlayer.get(p.player_id) ?? []), p]);

    const rows = [...byPlayer.entries()].map(([id, list]) => {
      const streak = deriveStreak(list.map((r) => r.played_date));
      return [
        emails.get(id) ?? '',
        id,
        list.length,
        list.filter((r) => r.correct).length,
        streak.currentStreak,
        streak.longestStreak,
        list.map((r) => r.played_date).sort().slice(-1)[0] ?? '',
      ];
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="catch-players-${stamp}.csv"`);
    return res
      .status(200)
      .send(
        toCsv(
          ['email', 'player_id', 'rounds', 'correct', 'current_streak', 'longest_streak', 'last_played'],
          rows
        )
      );
  }

  return res.status(400).json({ error: 'what must be list or players' });
}
