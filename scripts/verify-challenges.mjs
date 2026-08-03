#!/usr/bin/env node
/**
 * Adversarial verification for generated challenges.
 *
 *   ANTHROPIC_API_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/verify-challenges.mjs
 *
 * Every generated (gen-*) active challenge is re-solved BLIND — the judge
 * sees the puzzle without the stored answer and picks its own. If the judge's
 * pick disagrees with the stored answer, the challenge is deactivated: either
 * the answer key is wrong (the failure this catches) or the round is too
 * ambiguous to be fair. Precision beats bank size.
 */

const MODEL = 'claude-haiku-4-5-20251001';
const SUPABASE_URL = 'https://nbfkibomkxvqyaoakmma.supabase.co';
const JUDGE_BATCH = 10;

const apiKey = process.env.ANTHROPIC_API_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!apiKey || !serviceKey) {
  console.error('ANTHROPIC_API_KEY and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const sb = (path, init) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

const resp = await sb('catch_challenges?active=eq.true&id=like.gen-*&select=id,format,payload,answer&limit=5000');
if (!resp.ok) throw new Error(`bank read failed (${resp.status})`);
const challenges = await resp.json();
console.log(`verifying ${challenges.length} generated challenges, batches of ${JUDGE_BATCH}`);

function puzzleFor(c) {
  if (c.format === 'spot_the_slip') {
    return {
      id: c.id,
      task: 'Which segment (0-based index) contradicts the original text? Answer with the index.',
      original: c.payload.source,
      segments: c.payload.segments,
    };
  }
  return {
    id: c.id,
    task: 'Exactly one option was written by an AI (generic, hedgy, too smooth); the rest are human. Which option id is the AI one?',
    options: c.payload.options,
  };
}

async function judgeBatch(batch) {
  const prompt = `You are judging puzzles from a "spot the AI mistake" game. Solve each one on its merits.

${JSON.stringify(batch.map(puzzleFor), null, 1)}

Return ONLY a JSON array like [{"id": "...", "segmentIndex": 2} or {"id": "...", "optionId": "b"}] — one entry per puzzle, no commentary. If a puzzle seems ambiguous or has no clearly correct answer, add "ambiguous": true to its entry.`;
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!r.ok) throw new Error(`anthropic ${r.status}`);
  const data = await r.json();
  const text = data.content?.[0]?.text ?? '';
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  return JSON.parse(text.slice(start, end + 1));
}

let agreed = 0;
const failed = [];

for (let i = 0; i < challenges.length; i += JUDGE_BATCH) {
  const batch = challenges.slice(i, i + JUDGE_BATCH);
  let verdicts;
  try {
    verdicts = await judgeBatch(batch);
  } catch (err) {
    console.error(`judge batch at ${i} failed (${err.message}) — challenges kept for a later pass`);
    continue;
  }
  for (const c of batch) {
    const v = verdicts.find((x) => x.id === c.id);
    const ok =
      v &&
      !v.ambiguous &&
      (c.format === 'spot_the_slip'
        ? v.segmentIndex === c.answer.segmentIndex
        : v.optionId === c.answer.optionId);
    if (ok) agreed++;
    else failed.push(c.id);
  }
  console.log(`${Math.min(i + JUDGE_BATCH, challenges.length)}/${challenges.length} judged — ${agreed} agreed, ${failed.length} flagged`);
}

if (failed.length) {
  for (let i = 0; i < failed.length; i += 50) {
    const ids = failed.slice(i, i + 50).map((id) => `"${id}"`).join(',');
    const r = await sb(`catch_challenges?id=in.(${ids})`, {
      method: 'PATCH',
      body: JSON.stringify({ active: false }),
    });
    if (!r.ok) throw new Error(`deactivate failed (${r.status})`);
  }
}
console.log(`done: ${agreed} verified active, ${failed.length} deactivated`);
