import type { VercelRequest, VercelResponse } from '@vercel/node';
import { deriveStreak } from '../_lib/game.js';

/**
 * Solo-founder command center: one call, the whole brand database.
 * Password-guarded (same ADMIN_PASSWORD as rameshnuti.com/admin); all reads
 * go through the service-role key, server-side only.
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://nbfkibomkxvqyaoakmma.supabase.co';

function unauthorized(req: VercelRequest, res: VercelResponse): boolean {
  const adminPw = process.env.ADMIN_PASSWORD;
  if (!adminPw) {
    res.status(500).json({ error: 'ADMIN_PASSWORD env var not set' });
    return true;
  }
  const password = String(req.headers['x-admin-password'] ?? '').trim();
  if (!password || password !== adminPw.trim()) {
    res.status(401).json({ error: 'Unauthorized' });
    return true;
  }
  return false;
}

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

async function count(table: string): Promise<number | null> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'count=exact',
        Range: '0-0',
      },
    });
    const range = resp.headers.get('content-range');
    const total = range?.split('/')[1];
    return total && total !== '*' ? Number(total) : null;
  } catch {
    return null;
  }
}

/** id -> email for linked game accounts (players who signed up). */
async function fetchAuthEmails(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  interface AuthUser {
    id: string;
    email?: string;
  }
  const data = await sb<{ users?: AuthUser[] } | AuthUser[]>(
    '/auth/v1/admin/users?per_page=1000'
  );
  const users = Array.isArray(data) ? data : (data?.users ?? []);
  for (const u of users) {
    if (u.id && u.email) map.set(u.id, u.email);
  }
  return map;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });
  if (unauthorized(req, res)) return;

  interface PlayRow {
    player_id: string;
    played_date: string;
    correct: boolean;
    score: number;
  }
  interface PersonRow {
    email: string;
    source: string;
    first_seen: string;
  }

  const [plays, practiceCount, people, authEmails, profileCount, certCount, tipCount, signupEvents] =
    await Promise.all([
      sb<PlayRow[]>(
        '/rest/v1/catch_plays?select=player_id,played_date,correct,score&order=played_date.desc&limit=10000'
      ),
      count('catch_practice_plays'),
      sb<PersonRow[]>('/rest/v1/people?select=email,source,first_seen&order=first_seen.desc&limit=10000'),
      fetchAuthEmails(),
      count('profiles'),
      count('certificates'),
      count('newsletter_subscribers'),
      count('catch_events?event_type=eq.signup_completed'),
    ]);

  // ---- Game aggregates -----------------------------------------------------
  const playRows = plays ?? [];
  const byPlayer = new Map<string, PlayRow[]>();
  for (const p of playRows) {
    byPlayer.set(p.player_id, [...(byPlayer.get(p.player_id) ?? []), p]);
  }

  const today = new Date();
  const dayKey = (offset: number) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - offset);
    return d.toISOString().slice(0, 10);
  };
  const last14 = Array.from({ length: 14 }, (_, i) => dayKey(13 - i));
  const playsByDate = last14.map((date) => ({
    date,
    plays: playRows.filter((p) => p.played_date === date).length,
    correct: playRows.filter((p) => p.played_date === date && p.correct).length,
  }));

  const sevenDays = new Set(Array.from({ length: 7 }, (_, i) => dayKey(i)));
  const activePlayers7d = new Set(
    playRows.filter((p) => sevenDays.has(p.played_date)).map((p) => p.player_id)
  ).size;

  const leaderboard = [...byPlayer.entries()]
    .map(([playerId, rows]) => {
      const streak = deriveStreak(rows.map((r) => r.played_date));
      return {
        player: authEmails.get(playerId) ?? (UUID_RE.test(playerId) ? 'account' : 'anon') + '·' + playerId.slice(0, 6),
        registered: authEmails.has(playerId),
        rounds: rows.length,
        correct: rows.filter((r) => r.correct).length,
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastPlayed: rows.map((r) => r.played_date).sort().slice(-1)[0] ?? '',
      };
    })
    .sort((a, b) => b.currentStreak - a.currentStreak || b.rounds - a.rounds)
    .slice(0, 25);

  // ---- THE LIST aggregates -------------------------------------------------
  const peopleRows = people ?? [];
  const bySource = new Map<string, number>();
  for (const p of peopleRows) {
    bySource.set(p.source, (bySource.get(p.source) ?? 0) + 1);
  }

  return res.status(200).json({
    generatedAt: new Date().toISOString(),
    list: {
      total: peopleRows.length,
      bySource: [...bySource.entries()]
        .map(([source, n]) => ({ source, n }))
        .sort((a, b) => b.n - a.n),
      latest: peopleRows.slice(0, 10),
    },
    game: {
      totalPlayers: byPlayer.size,
      registeredPlayers: [...byPlayer.keys()].filter((id) => authEmails.has(id)).length,
      signupEvents,
      activePlayers7d,
      totalPlays: playRows.length,
      practicePlays: practiceCount,
      correctRate: playRows.length
        ? Math.round((playRows.filter((p) => p.correct).length / playRows.length) * 100)
        : 0,
      playsByDate,
      streaksAtLeast3: leaderboard.filter((l) => l.currentStreak >= 3).length,
      leaderboard,
    },
    courses: {
      users: profileCount,
      certificates: certCount,
      tipSubscribers: tipCount,
    },
  });
}
