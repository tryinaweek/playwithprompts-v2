#!/usr/bin/env node
/**
 * Review drafted candidates and approve them into the live challenge bank.
 *
 * Usage:  npm run content:review                  (interactive, latest drafts file)
 *         npm run content:review -- --file content/drafts/2026-07-26-drafts.json
 *
 * For each candidate: y = approve, n = reject, q = stop reviewing.
 * THE RULE: if you hesitate on the answer, reject. Ambiguity kills the game.
 *
 * Approved challenges are renumbered and appended to server/seed-challenges.json.
 * Remember to deploy afterwards:  vercel deploy --prod --yes
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { validateBank } from './lib-validate.mjs';

const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');
const DRAFTS_DIR = path.join(ROOT, 'content/drafts');
const ARCHIVE_DIR = path.join(DRAFTS_DIR, 'archive');
const EPOCH_DATE = '2026-07-26';

const args = process.argv.slice(2);
const fileArg = args.indexOf('--file');
const approveAll = args.includes('--yes');
const targetArg = args.indexOf('--target');
const BANK_PATH =
  targetArg > -1 ? path.resolve(args[targetArg + 1]) : path.join(ROOT, 'server/seed-challenges.json');

let draftsPath;
if (fileArg > -1) {
  draftsPath = path.resolve(args[fileArg + 1]);
} else {
  const files = fs
    .readdirSync(DRAFTS_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();
  if (!files.length) {
    console.error('No drafts found. Run: npm run content:draft');
    process.exit(1);
  }
  draftsPath = path.join(DRAFTS_DIR, files[files.length - 1]);
}

const drafts = JSON.parse(fs.readFileSync(draftsPath, 'utf8'));
const bank = JSON.parse(fs.readFileSync(BANK_PATH, 'utf8'));

function nextId(format) {
  const prefix = format === 'spot_the_slip' ? 'slip' : 'robot';
  const max = bank
    .filter((c) => c.id.startsWith(prefix + '-'))
    .map((c) => parseInt(c.id.split('-')[1], 10) || 0)
    .reduce((a, b) => Math.max(a, b), 0);
  return `${prefix}-${String(max + 1).padStart(2, '0')}`;
}

function show(ch, i) {
  const line = '─'.repeat(70);
  console.log(`\n${line}\nCandidate ${i + 1}/${drafts.length} · ${ch.format} · difficulty ${ch.difficulty} · "${ch.title}"\n${line}`);
  console.log(`\n${ch.payload.intro}\n`);
  if (ch.format === 'spot_the_slip') {
    console.log(`ORIGINAL:\n${ch.payload.source}\n`);
    ch.payload.segments.forEach((s, idx) => {
      const mark = idx === ch.answer.segmentIndex ? '  ← THE SLIP' : '';
      console.log(`  [${idx}] ${s}${mark}`);
    });
  } else {
    for (const o of ch.payload.options) {
      const mark = o.id === ch.answer.optionId ? '  ← THE HUMAN' : '';
      console.log(`(${o.id})${mark}\n${o.text}\n`);
    }
  }
  console.log(`\nEXPLANATION: ${ch.explanation}`);
}

const rl = approveAll ? null : readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

const approved = [];
let rejectedCount = 0;

for (let i = 0; i < drafts.length; i++) {
  const ch = drafts[i];
  show(ch, i);
  let answer = 'y';
  if (!approveAll) {
    answer = (await ask('\nApprove? [y]es / [n]o / [q]uit: ')).trim().toLowerCase();
  }
  if (answer === 'q') break;
  if (answer === 'y') {
    const id = nextId(ch.format);
    bank.push({ ...ch, id });
    approved.push(id);
  } else {
    rejectedCount++;
  }
}
if (rl) rl.close();

if (approved.length) {
  const errors = validateBank(bank);
  if (errors.length) {
    console.error('\nBank validation failed — nothing written:');
    errors.forEach((e) => console.error('  - ' + e));
    process.exit(1);
  }
  fs.writeFileSync(BANK_PATH, JSON.stringify(bank, null, 2) + '\n');
}

fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
fs.renameSync(draftsPath, path.join(ARCHIVE_DIR, path.basename(draftsPath)));

const runwayEnd = new Date(Date.parse(`${EPOCH_DATE}T12:00:00Z`) + (bank.length - 1) * 86_400_000)
  .toISOString()
  .slice(0, 10);
console.log(`\nApproved ${approved.length}, rejected ${rejectedCount}.`);
console.log(`Bank now holds ${bank.length} challenges — fresh content through ${runwayEnd}, recycling after.`);
if (approved.length) {
  console.log('\nTo take the new challenges live:');
  console.log('  git add server/seed-challenges.json && git commit -m "content: weekly challenge batch"');
  console.log('  vercel deploy --prod --yes');
}
