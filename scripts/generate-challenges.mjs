#!/usr/bin/env node
/**
 * Batch-generate Catch the AI challenges into the Supabase bank.
 *
 *   ANTHROPIC_API_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/generate-challenges.mjs [target-count]
 *
 * Design: generation happens OFFLINE in batches (never at play time). Haiku is
 * the cost-effective model; each request carries the format spec plus sample
 * challenges so style stays consistent, and asks for BATCH_SIZE challenges at
 * once. Every challenge is validated (schema, answer within bounds, no
 * duplicate ids or source texts vs the existing bank) before insert — invalid
 * ones are dropped and reported, never served.
 */
import fs from 'node:fs';
import path from 'node:path';

const TARGET = Number(process.argv[2] ?? 200);
const BATCH_SIZE = 25;
const MODEL = 'claude-haiku-4-5-20251001';
const SUPABASE_URL = 'https://nbfkibomkxvqyaoakmma.supabase.co';

const apiKey = process.env.ANTHROPIC_API_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!apiKey || !serviceKey) {
  console.error('ANTHROPIC_API_KEY and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const seeds = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'server/seed-challenges.json'), 'utf8')
);

async function fetchExistingBank() {
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/catch_challenges?select=id,title,payload&limit=5000`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
  );
  if (!resp.ok) throw new Error(`bank read failed (${resp.status}) — did the 0005 migration run?`);
  return resp.json();
}

function sourceTextOf(challenge) {
  const p = challenge.payload ?? {};
  if (challenge.format === 'spot_the_slip') return String(p.source ?? '');
  return (p.options ?? []).map((o) => o.text).join(' | ');
}

function validate(c, knownTexts) {
  if (!c || typeof c !== 'object') return 'not an object';
  if (!['spot_the_slip', 'real_or_robot'].includes(c.format)) return 'bad format';
  if (![1, 2, 3].includes(c.difficulty)) return 'bad difficulty';
  if (typeof c.title !== 'string' || !c.title) return 'missing title';
  if (typeof c.explanation !== 'string' || c.explanation.length < 40) return 'weak explanation';
  const p = c.payload;
  if (!p || typeof p !== 'object') return 'missing payload';
  if (c.format === 'spot_the_slip') {
    if (typeof p.intro !== 'string' || typeof p.source !== 'string' || typeof p.instruction !== 'string')
      return 'incomplete slip payload';
    if (!Array.isArray(p.segments) || p.segments.length < 3 || p.segments.length > 6)
      return 'segments must be 3-6';
    if (!p.segments.every((s) => typeof s === 'string' && s.length > 0)) return 'bad segment';
    const idx = c.answer?.segmentIndex;
    if (!Number.isInteger(idx) || idx < 0 || idx >= p.segments.length) return 'answer out of bounds';
  } else {
    if (typeof p.intro !== 'string' || typeof p.instruction !== 'string') return 'incomplete robot payload';
    if (!Array.isArray(p.options) || p.options.length < 2 || p.options.length > 4) return 'options must be 2-4';
    if (!p.options.every((o) => o && typeof o.id === 'string' && typeof o.text === 'string'))
      return 'bad option';
    const ids = new Set(p.options.map((o) => o.id));
    if (ids.size !== p.options.length) return 'duplicate option ids';
    if (!ids.has(c.answer?.optionId)) return 'answer not among options';
  }
  const text = sourceTextOf(c).toLowerCase().replace(/\s+/g, ' ').trim();
  if (knownTexts.has(text)) return 'duplicate content';
  knownTexts.add(text);
  return null;
}

function buildPrompt(samples, count) {
  return `You write challenges for "Catch the AI", a daily game where players spot AI mistakes.

Two formats:
1. "spot_the_slip": an original text (email, memo, listing, article snippet) and an AI summary split into segments. Exactly ONE segment contains a subtle factual slip vs the original (changed number, swapped name, inverted condition, invented detail). answer = {"segmentIndex": <index of the slipped segment>}.
2. "real_or_robot": 2-4 short text options; exactly one is AI-written (subtly generic/hedgy/too-smooth) and the rest are human. answer = {"optionId": "<id of the AI one>"}.

Rules:
- Everyday believable scenarios (invoices, rentals, recipes, HOA notices, job posts, sports recaps...). Vary domains widely; never reuse a scenario from the samples.
- The slip must be findable from the given text alone — no outside knowledge, nothing ambiguous.
- difficulty: 1 obvious-ish, 2 takes care, 3 subtle. Mix all three.
- explanation: 2-3 sentences: what the slip was and the general lesson for catching AI mistakes.
- Fictional names/companies only (example.com-style emails). No real people or brands.

Samples of the exact JSON shape (match it precisely):
${JSON.stringify(samples, null, 1)}

Return ONLY a JSON array of ${count} new challenge objects (no markdown fences, no commentary). Mix both formats roughly 60/40 slip/robot. Set id to "x" (ids are assigned later).`;
}

async function generateBatch(samples, count) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16000,
      messages: [{ role: 'user', content: buildPrompt(samples, count) }],
    }),
  });
  if (!resp.ok) throw new Error(`anthropic ${resp.status}: ${(await resp.text()).slice(0, 300)}`);
  const data = await resp.json();
  const text = data.content?.[0]?.text ?? '';
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('no JSON array in response');
  return JSON.parse(text.slice(start, end + 1));
}

async function insertChallenges(rows) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/catch_challenges`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates',
    },
    body: JSON.stringify(rows),
  });
  if (!resp.ok) throw new Error(`insert failed (${resp.status}): ${(await resp.text()).slice(0, 300)}`);
}

const existing = await fetchExistingBank();
console.log(`bank: ${existing.length} generated + ${seeds.length} seeds; target +${TARGET}`);

const knownTexts = new Set(
  [...seeds, ...existing].map((c) => sourceTextOf(c).toLowerCase().replace(/\s+/g, ' ').trim())
);

let added = 0;
let rejected = 0;
let batchNum = 0;
const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');

while (added < TARGET && batchNum < Math.ceil((TARGET / BATCH_SIZE) * 2)) {
  batchNum++;
  const samples = [...seeds].sort(() => Math.random() - 0.5).slice(0, 4);
  let raw;
  try {
    raw = await generateBatch(samples, BATCH_SIZE);
  } catch (err) {
    console.error(`batch ${batchNum} failed: ${err.message}`);
    continue;
  }
  const valid = [];
  for (const c of raw) {
    const problem = validate(c, knownTexts);
    if (problem) {
      rejected++;
      continue;
    }
    valid.push({
      id: `gen-${stamp}-${String(added + valid.length + 1).padStart(4, '0')}-${Math.random().toString(36).slice(2, 6)}`,
      format: c.format,
      difficulty: c.difficulty,
      title: c.title,
      payload: c.payload,
      answer: c.answer,
      explanation: c.explanation,
      active: true,
    });
  }
  if (valid.length) {
    await insertChallenges(valid);
    added += valid.length;
  }
  console.log(`batch ${batchNum}: +${valid.length} valid, ${raw.length - valid.length} rejected (total ${added}/${TARGET})`);
}

console.log(`done: ${added} added, ${rejected} rejected total`);
