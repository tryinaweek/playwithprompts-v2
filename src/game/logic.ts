import type { Challenge, ChallengeAnswer, PercentileInfo, StreakState } from '@/types/catch';

export const ROUND_TIME_LIMIT_SECONDS = 90;
export const MAX_FREEZES = 3;
export const BETA_COHORT_THRESHOLD = 200;

export function isCorrectAnswer(challenge: Challenge, playerAnswer: ChallengeAnswer): boolean {
  if ('segmentIndex' in challenge.answer) {
    return 'segmentIndex' in playerAnswer && playerAnswer.segmentIndex === challenge.answer.segmentIndex;
  }
  return 'optionId' in playerAnswer && playerAnswer.optionId === challenge.answer.optionId;
}

/** Score = 70 for correctness + up to 30 speed bonus inside the 90s window. Wrong = 0. */
export function computeScore(correct: boolean, timeMs: number): number {
  if (!correct) return 0;
  const seconds = Math.max(0, timeMs / 1000);
  const clamped = Math.min(seconds, ROUND_TIME_LIMIT_SECONDS);
  const bonus = Math.round(30 * ((ROUND_TIME_LIMIT_SECONDS - clamped) / ROUND_TIME_LIMIT_SECONDS));
  return 70 + bonus;
}

/** Days between two YYYY-MM-DD dates (b - a), interpreting both as UTC noon to dodge DST. */
export function daysBetween(a: string, b: string): number {
  const toUtc = (d: string) => Date.parse(`${d}T12:00:00Z`);
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000);
}

export function emptyStreak(): StreakState {
  return { currentStreak: 0, longestStreak: 0, freezesAvailable: 0, lastPlayedDate: null };
}

/**
 * Streak counts consecutive days played. A single missed day is auto-covered by a
 * freeze when one is available. One freeze is earned per 7 consecutive days, capped.
 */
export function updateStreak(prev: StreakState, playDate: string): StreakState {
  if (prev.lastPlayedDate === playDate) return prev;

  let current: number;
  let freezes = prev.freezesAvailable;

  if (!prev.lastPlayedDate) {
    current = 1;
  } else {
    const gap = daysBetween(prev.lastPlayedDate, playDate);
    if (gap <= 0) return prev;
    if (gap === 1) {
      current = prev.currentStreak + 1;
    } else if (gap === 2 && freezes > 0) {
      freezes -= 1;
      current = prev.currentStreak + 1;
    } else {
      current = 1;
    }
  }

  if (current > 0 && current % 7 === 0) {
    freezes = Math.min(MAX_FREEZES, freezes + 1);
  }

  return {
    currentStreak: current,
    longestStreak: Math.max(prev.longestStreak, current),
    freezesAvailable: freezes,
    lastPlayedDate: playDate,
  };
}

/** `scores` includes the player's own score. */
export function computePercentile(scores: number[], myScore: number): PercentileInfo {
  const total = Math.max(1, scores.length);
  const strictlyHigher = scores.filter((s) => s > myScore).length;
  const rank = strictlyHigher + 1;
  const topPercent = Math.min(100, Math.max(1, Math.ceil((rank / total) * 100)));
  return { topPercent, totalPlayers: total, betaCohort: total < BETA_COHORT_THRESHOLD, rank };
}

export interface ShareTextInput {
  number: number;
  correct: boolean;
  timeMs: number;
  currentStreak: number;
  topPercent: number;
  rank: number;
}

export function buildShareText(input: ShareTextInput): string {
  const secs = Math.max(1, Math.round(input.timeMs / 1000));
  const outcome = input.correct ? `✅ caught it in ${secs}s` : '❌ got fooled';
  const streakPart = input.currentStreak > 1 ? ` · ${input.currentStreak}-day streak` : '';
  const rankPart = !input.correct ? '' : input.rank === 1 ? ' · 🥇 top score' : ` · Top ${input.topPercent}%`;
  return `Catch the AI #${input.number} 🎯 ${outcome}${streakPart}${rankPart}\nplaywithprompts.com`;
}
