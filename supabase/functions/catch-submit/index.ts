// Catch the AI — production edge function: score a submission server-side.
// Mirrors the local dev API in server/catch-api.ts (POST /api/catch/submit).
// Deploy: supabase functions deploy catch-submit
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-player-id',
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ROUND_TIME_LIMIT_SECONDS = 90;
const MAX_FREEZES = 3;
const BETA_COHORT_THRESHOLD = 200;

interface StreakRow {
  current_streak: number;
  longest_streak: number;
  freezes_available: number;
  last_played_date: string | null;
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
}

function computeScore(correct: boolean, timeMs: number): number {
  if (!correct) return 0;
  const clamped = Math.min(Math.max(0, timeMs / 1000), ROUND_TIME_LIMIT_SECONDS);
  return 70 + Math.round(30 * ((ROUND_TIME_LIMIT_SECONDS - clamped) / ROUND_TIME_LIMIT_SECONDS));
}

function updateStreak(prev: StreakRow, playDate: string): StreakRow {
  if (prev.last_played_date === playDate) return prev;
  let current: number;
  let freezes = prev.freezes_available;
  if (!prev.last_played_date) {
    current = 1;
  } else {
    const gap = daysBetween(prev.last_played_date, playDate);
    if (gap <= 0) return prev;
    if (gap === 1) current = prev.current_streak + 1;
    else if (gap === 2 && freezes > 0) {
      freezes -= 1;
      current = prev.current_streak + 1;
    } else current = 1;
  }
  if (current > 0 && current % 7 === 0) freezes = Math.min(MAX_FREEZES, freezes + 1);
  return {
    current_streak: current,
    longest_streak: Math.max(prev.longest_streak, current),
    freezes_available: freezes,
    last_played_date: playDate,
  };
}

function buildShareText(input: {
  number: number;
  correct: boolean;
  timeMs: number;
  currentStreak: number;
  topPercent: number;
  rank: number;
}): string {
  const secs = Math.max(1, Math.round(input.timeMs / 1000));
  const outcome = input.correct ? `✅ caught it in ${secs}s` : '❌ got fooled';
  const streakPart = input.currentStreak > 1 ? ` · ${input.currentStreak}-day streak` : '';
  const rankPart = !input.correct ? '' : input.rank === 1 ? ' · 🥇 top score' : ` · Top ${input.topPercent}%`;
  return `Catch the AI #${input.number} 🎯 ${outcome}${streakPart}${rankPart}\nplaywithprompts.com`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const respond = (status: number, data: unknown) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    if (req.method !== 'POST') return respond(405, { error: 'method not allowed' });
    const playerId = req.headers.get('x-player-id') ?? '';
    if (!playerId || playerId.length > 64) return respond(400, { error: 'missing player id' });

    const body = await req.json().catch(() => null) as
      | { date?: string; answer?: Record<string, unknown>; timeMs?: number }
      | null;
    if (!body || !DATE_RE.test(body.date ?? '')) return respond(400, { error: 'invalid date' });
    const answer = body.answer;
    const validAnswer =
      answer &&
      ((Number.isInteger(answer.segmentIndex) && (answer.segmentIndex as number) >= 0) ||
        (typeof answer.optionId === 'string' && (answer.optionId as string).length <= 10));
    if (!validAnswer) return respond(400, { error: 'invalid answer' });
    const timeMs = typeof body.timeMs === 'number' ? Math.min(Math.max(body.timeMs, 0), 600_000) : 600_000;
    const date = body.date as string;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: challenge } = await supabase
      .from('catch_challenges')
      .select('*')
      .eq('scheduled_date', date)
      .single();
    if (!challenge) return respond(404, { error: 'no challenge for this date' });

    const { data: existing } = await supabase
      .from('catch_plays')
      .select('id')
      .eq('player_id', playerId)
      .eq('challenge_id', challenge.id)
      .maybeSingle();
    if (existing) return respond(409, { error: 'already played today' });

    const key = challenge.answer as Record<string, unknown>;
    const correct =
      ('segmentIndex' in key && key.segmentIndex === answer!.segmentIndex) ||
      ('optionId' in key && key.optionId === answer!.optionId);
    const score = computeScore(correct, timeMs);

    const { count } = await supabase
      .from('catch_challenges')
      .select('id', { count: 'exact', head: true })
      .lte('scheduled_date', date);
    const number = count ?? 1;

    const { data: streakRow } = await supabase
      .from('catch_streaks')
      .select('*')
      .eq('player_id', playerId)
      .maybeSingle();
    const prev: StreakRow = streakRow ?? {
      current_streak: 0,
      longest_streak: 0,
      freezes_available: 0,
      last_played_date: null,
    };
    const next = updateStreak(prev, date);
    await supabase
      .from('catch_streaks')
      .upsert({ player_id: playerId, ...next }, { onConflict: 'player_id' });

    const { error: insertError } = await supabase.from('catch_plays').insert({
      player_id: playerId,
      challenge_id: challenge.id,
      challenge_number: number,
      played_date: date,
      answer,
      correct,
      score,
      time_ms: timeMs,
    });
    // Unique constraint is the real double-play guard under concurrency.
    if (insertError) return respond(409, { error: 'already played today' });

    await supabase.from('catch_events').insert({
      event_type: 'round_completed',
      player_id: playerId,
      meta: { challengeId: challenge.id, correct, score, timeMs },
    });

    const { data: todayScores } = await supabase
      .from('catch_plays')
      .select('score')
      .eq('challenge_id', challenge.id)
      .eq('played_date', date);
    const scores = (todayScores ?? []).map((r: { score: number }) => r.score);
    const total = Math.max(1, scores.length);
    const rank = scores.filter((s: number) => s > score).length + 1;
    const topPercent = Math.min(100, Math.max(1, Math.ceil((rank / total) * 100)));

    return respond(200, {
      correct,
      score,
      timeMs,
      answer: challenge.answer,
      playerAnswer: answer,
      explanation: challenge.explanation,
      percentile: { topPercent, totalPlayers: total, betaCohort: total < BETA_COHORT_THRESHOLD, rank },
      streak: {
        currentStreak: next.current_streak,
        longestStreak: next.longest_streak,
        freezesAvailable: next.freezes_available,
        lastPlayedDate: next.last_played_date,
      },
      shareText: buildShareText({
        number,
        correct,
        timeMs,
        currentStreak: next.current_streak,
        topPercent,
        rank,
      }),
    });
  } catch (err) {
    console.error('catch-submit error', err);
    return respond(500, { error: 'internal error' });
  }
});
