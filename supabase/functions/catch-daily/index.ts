// Catch the AI — production edge function: serve today's challenge WITHOUT the answer.
// Mirrors the local dev API in server/catch-api.ts (GET /api/catch/daily).
// Deploy: supabase functions deploy catch-daily
// Env: uses SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (provided by the platform).
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-player-id',
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const respond = (status: number, data: unknown) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const url = new URL(req.url);
    const date = url.searchParams.get('date') ?? '';
    const playerId = req.headers.get('x-player-id') ?? '';
    if (!DATE_RE.test(date)) return respond(400, { error: 'invalid date' });
    if (!playerId || playerId.length > 64) return respond(400, { error: 'missing player id' });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: challenge, error } = await supabase
      .from('catch_challenges')
      .select('id, scheduled_date, format, difficulty, payload')
      .eq('scheduled_date', date)
      .single();
    if (error || !challenge) return respond(404, { error: 'no challenge for this date' });

    const { count } = await supabase
      .from('catch_challenges')
      .select('id', { count: 'exact', head: true })
      .lte('scheduled_date', date);

    const { data: play } = await supabase
      .from('catch_plays')
      .select('id')
      .eq('player_id', playerId)
      .eq('challenge_id', challenge.id)
      .maybeSingle();

    // The already-played result payload is fetched via catch-submit's sibling
    // logic on the client's next submit attempt; for simplicity the client
    // calls catch-daily and, when alreadyPlayed, re-requests the stored result
    // from catch-submit with a replay flag (idempotent read path).
    return respond(200, {
      challenge: {
        id: challenge.id,
        number: count ?? 1,
        date,
        format: challenge.format,
        difficulty: challenge.difficulty,
        payload: challenge.payload,
      },
      alreadyPlayed: Boolean(play),
      result: null,
    });
  } catch (err) {
    console.error('catch-daily error', err);
    return respond(500, { error: 'internal error' });
  }
});
