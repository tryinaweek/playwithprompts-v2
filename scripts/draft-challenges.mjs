#!/usr/bin/env node
/**
 * Draft new Catch the AI challenge candidates using the Claude CLI.
 *
 * Usage:  npm run content:draft            (14 candidates: 7 slips, 7 robots)
 *         npm run content:draft -- --count 6
 *
 * Output: content/drafts/<date>-drafts.json — NOTHING goes live from here.
 * Review and approve with:  npm run content:review
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { validateChallenge } from './lib-validate.mjs';

const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');
const BANK_PATH = path.join(ROOT, 'server/seed-challenges.json');
const DRAFTS_DIR = path.join(ROOT, 'content/drafts');

const countArg = process.argv.indexOf('--count');
const total = countArg > -1 ? Math.max(2, parseInt(process.argv[countArg + 1]) || 14) : 14;
const perFormat = Math.ceil(total / 2);

const bank = JSON.parse(fs.readFileSync(BANK_PATH, 'utf8'));
const usedTitles = bank.map((c) => c.title).join('; ');

const SPEC = `You are authoring candidate content for "Catch the AI", a daily game where non-technical professionals spot AI mistakes. Produce EXACTLY ${total} challenges as a single raw JSON array (no markdown fences, no commentary): ${perFormat} of format "spot_the_slip" and ${total - perFormat} of format "real_or_robot", interleaved.

HARD QUALITY RULE: every challenge must have exactly ONE defensible answer. No ambiguity, no trick questions, no subjective judgments.

Audience: non-technical professionals. Everyday/office-life topics: emails, travel, recipes, school notices, invoices, meeting notes, reviews, listings, personal-finance basics (no investment advice). Avoid politics, religion, tragedy. AVOID topics already used: ${usedTitles}.

FORMAT spot_the_slip: a short source text (3-6 sentences, shown to player) plus an AI summary split into 4-5 "segments". Exactly ONE segment contradicts the source (wrong number, inverted fact, swapped name/date, unit change, or an invented claim not in the source). The error must be objectively checkable against the shown source. Schema:
{"id":"slip-x","format":"spot_the_slip","difficulty":1,"title":"short label","payload":{"intro":"one line of context","source":"original text","instruction":"Tap the sentence in the AI summary that gets the original wrong.","segments":["s1","s2","s3","s4"]},"answer":{"segmentIndex":2},"explanation":"2-3 plain-English sentences: name the error, then the transferable tip."}

FORMAT real_or_robot: two texts (60-120 words each) of the same type; one written like a real human (specific, imperfect, concrete checkable details, one odd-but-true-feeling detail), one with classic AI tells (generic enthusiasm, balanced hedging, triads, "vibrant/nestled/seamless" vocabulary, zero specifics, perfectly parallel structure). The human one must be identifiable via specificity, never via typos. Schema:
{"id":"robot-x","format":"real_or_robot","difficulty":1,"title":"short label","payload":{"intro":"One of these two X was written by a person. The other is AI.","instruction":"Pick the one written by the human.","options":[{"id":"a","text":"..."},{"id":"b","text":"..."}]},"answer":{"optionId":"b"},"explanation":"2-3 sentences: name 1-2 concrete tells in each text, then the transferable tip."}

Difficulty spread: ~1/3 easy (1), ~1/3 medium (2), ~1/3 hard (3). Vary which segmentIndex/optionId is correct. ids: use "draft-1".."draft-${total}". Output: the raw JSON array only.`;

console.log(`Drafting ${total} candidates via Claude CLI (this takes a minute or two)...`);
let raw;
try {
  raw = execFileSync('claude', ['-p', SPEC, '--output-format', 'text'], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    timeout: 600_000,
  });
} catch (err) {
  console.error('Claude CLI failed:', err.message.split('\n')[0]);
  console.error('\nIf this mentions authentication: open a terminal, run `claude`,');
  console.error('complete the sign-in once, then re-run this script.');
  process.exit(1);
}

if (/Failed to authenticate|OAuth/i.test(raw)) {
  console.error('Claude CLI is signed out. Open a terminal, run `claude`, complete the');
  console.error('sign-in once, then re-run this script.');
  process.exit(1);
}

const start = raw.indexOf('[');
const end = raw.lastIndexOf(']');
if (start === -1 || end === -1) {
  console.error('Could not find a JSON array in the model output.');
  process.exit(1);
}

let candidates;
try {
  candidates = JSON.parse(raw.slice(start, end + 1));
} catch (err) {
  console.error('Model output was not valid JSON:', err.message);
  process.exit(1);
}

const valid = [];
const rejected = [];
candidates.forEach((ch, i) => {
  const errors = validateChallenge(ch, i);
  if (errors.length) rejected.push({ id: ch?.id ?? `#${i}`, errors });
  else valid.push(ch);
});

fs.mkdirSync(DRAFTS_DIR, { recursive: true });
const stamp = new Date().toISOString().slice(0, 10);
let outPath = path.join(DRAFTS_DIR, `${stamp}-drafts.json`);
let suffix = 2;
while (fs.existsSync(outPath)) {
  outPath = path.join(DRAFTS_DIR, `${stamp}-drafts-${suffix++}.json`);
}
fs.writeFileSync(outPath, JSON.stringify(valid, null, 2) + '\n');

console.log(`\n${valid.length} candidates passed schema validation → ${path.relative(ROOT, outPath)}`);
if (rejected.length) {
  console.log(`${rejected.length} auto-rejected (schema problems):`);
  rejected.forEach((r) => console.log(`  - ${r.id}: ${r.errors.join('; ')}`));
}
console.log('\nNext step — review and approve (nothing goes live until you do):');
console.log('  npm run content:review');
