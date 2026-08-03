import { describe, expect, it } from 'vitest';
import {
  buildShareText,
  computePercentile,
  computeScore,
  daysBetween,
  emptyStreak,
  isCorrectAnswer,
  MAX_FREEZES,
  pickPracticeId,
  updateStreak,
} from '../src/game/logic';
import type { Challenge, StreakState } from '../src/types/catch';

function slipChallenge(segmentIndex: number): Challenge {
  return {
    id: 'slip-x',
    format: 'spot_the_slip',
    difficulty: 1,
    title: 't',
    payload: { intro: '', source: '', instruction: '', segments: ['a', 'b', 'c'] },
    answer: { segmentIndex },
    explanation: 'e',
  };
}

function robotChallenge(optionId: string): Challenge {
  return {
    id: 'robot-x',
    format: 'real_or_robot',
    difficulty: 1,
    title: 't',
    payload: { intro: '', instruction: '', options: [{ id: 'a', text: '' }, { id: 'b', text: '' }] },
    answer: { optionId },
    explanation: 'e',
  };
}

function streak(overrides: Partial<StreakState>): StreakState {
  return { ...emptyStreak(), ...overrides };
}

describe('isCorrectAnswer', () => {
  it('should accept the matching segment index', () => {
    expect(isCorrectAnswer(slipChallenge(2), { segmentIndex: 2 })).toBe(true);
  });
  it('should reject a different segment index', () => {
    expect(isCorrectAnswer(slipChallenge(2), { segmentIndex: 0 })).toBe(false);
  });
  it('should reject a mismatched answer shape', () => {
    expect(isCorrectAnswer(slipChallenge(2), { optionId: 'a' })).toBe(false);
  });
  it('should accept the matching option id', () => {
    expect(isCorrectAnswer(robotChallenge('b'), { optionId: 'b' })).toBe(true);
  });
});

describe('computeScore', () => {
  it('should return 0 when wrong regardless of speed', () => {
    expect(computeScore(false, 1000)).toBe(0);
  });
  it('should return 100 for an instant correct answer', () => {
    expect(computeScore(true, 0)).toBe(100);
  });
  it('should return 70 when the correct answer takes the full window or longer', () => {
    expect(computeScore(true, 90_000)).toBe(70);
    expect(computeScore(true, 300_000)).toBe(70);
  });
  it('should award a partial speed bonus mid-window', () => {
    expect(computeScore(true, 45_000)).toBe(85);
  });
});

describe('daysBetween', () => {
  it('should compute consecutive days as 1', () => {
    expect(daysBetween('2026-07-25', '2026-07-26')).toBe(1);
  });
  it('should handle month boundaries', () => {
    expect(daysBetween('2026-07-31', '2026-08-01')).toBe(1);
  });
  it('should return negative for earlier dates', () => {
    expect(daysBetween('2026-07-25', '2026-07-24')).toBe(-1);
  });
});

describe('updateStreak', () => {
  it('should start a streak at 1 on first play', () => {
    const s = updateStreak(emptyStreak(), '2026-07-25');
    expect(s.currentStreak).toBe(1);
    expect(s.longestStreak).toBe(1);
  });

  it('should increment on consecutive days', () => {
    const prev = streak({ currentStreak: 3, longestStreak: 3, lastPlayedDate: '2026-07-25' });
    expect(updateStreak(prev, '2026-07-26').currentStreak).toBe(4);
  });

  it('should not change on a same-day repeat', () => {
    const prev = streak({ currentStreak: 3, longestStreak: 3, lastPlayedDate: '2026-07-25' });
    expect(updateStreak(prev, '2026-07-25')).toEqual(prev);
  });

  it('should reset to 1 after a missed day with no freeze', () => {
    const prev = streak({ currentStreak: 5, longestStreak: 5, lastPlayedDate: '2026-07-25' });
    const s = updateStreak(prev, '2026-07-27');
    expect(s.currentStreak).toBe(1);
    expect(s.longestStreak).toBe(5);
  });

  it('should consume a freeze to cover exactly one missed day', () => {
    const prev = streak({
      currentStreak: 5,
      longestStreak: 5,
      freezesAvailable: 1,
      lastPlayedDate: '2026-07-25',
    });
    const s = updateStreak(prev, '2026-07-27');
    expect(s.currentStreak).toBe(6);
    expect(s.freezesAvailable).toBe(0);
  });

  it('should not cover two missed days with a freeze', () => {
    const prev = streak({
      currentStreak: 5,
      longestStreak: 5,
      freezesAvailable: 1,
      lastPlayedDate: '2026-07-25',
    });
    expect(updateStreak(prev, '2026-07-28').currentStreak).toBe(1);
  });

  it('should earn a freeze every 7 consecutive days, capped', () => {
    let s = emptyStreak();
    let date = new Date(Date.UTC(2026, 0, 1));
    for (let i = 0; i < 22; i++) {
      s = updateStreak(s, date.toISOString().slice(0, 10));
      date = new Date(date.getTime() + 86_400_000);
    }
    expect(s.currentStreak).toBe(22);
    expect(s.freezesAvailable).toBe(Math.min(3, MAX_FREEZES));
  });
});

describe('computePercentile', () => {
  it('should give the sole player rank 1 in a beta cohort', () => {
    const p = computePercentile([85], 85);
    expect(p.rank).toBe(1);
    expect(p.betaCohort).toBe(true);
  });

  it('should give the best of ten rank 1 and mid-field a proportional percentile', () => {
    const scores = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95];
    expect(computePercentile(scores, 95).rank).toBe(1);
    expect(computePercentile(scores, 50).topPercent).toBe(60);
  });

  it('should mark cohorts of 200+ as non-beta', () => {
    const scores = Array.from({ length: 200 }, (_, i) => i % 100);
    expect(computePercentile(scores, 50).betaCohort).toBe(false);
  });
});

describe('buildShareText', () => {
  it('should include round number, time, streak, and rank when correct', () => {
    const text = buildShareText({ number: 214, correct: true, timeMs: 38_000, currentStreak: 12, topPercent: 18, rank: 40 });
    expect(text).toContain('#214');
    expect(text).toContain('38s');
    expect(text).toContain('12-day streak');
    expect(text).toContain('Top 18%');
    expect(text).toContain('playwithprompts.com');
  });

  it('should show a top-score medal for rank 1 instead of a percentage', () => {
    const text = buildShareText({ number: 3, correct: true, timeMs: 20_000, currentStreak: 2, topPercent: 1, rank: 1 });
    expect(text).toContain('🥇 top score');
    expect(text).not.toContain('Top 1%');
  });

  it('should omit rank and streak when fooled on day one', () => {
    const text = buildShareText({ number: 1, correct: false, timeMs: 10_000, currentStreak: 1, topPercent: 100, rank: 2 });
    expect(text).toContain('got fooled');
    expect(text).not.toContain('Top');
    expect(text).not.toContain('streak');
  });
});

describe('pickPracticeId', () => {
  const bank = ['a', 'b', 'c', 'd'];

  it('should prefer challenges the player has not seen', () => {
    const id = pickPracticeId(bank, new Set(['a', 'b']), new Set(), 0);
    expect(['c', 'd']).toContain(id);
  });

  it('should never serve an excluded challenge, even when everything is seen', () => {
    const id = pickPracticeId(bank, new Set(bank), new Set(['a']), 0.99);
    expect(id).not.toBe('a');
    expect(id).not.toBeNull();
  });

  it('should allow repeats once the bank is exhausted', () => {
    const id = pickPracticeId(bank, new Set(bank), new Set(), 0);
    expect(bank).toContain(id);
  });

  it('should return null when every challenge is excluded', () => {
    expect(pickPracticeId(['a'], new Set(), new Set(['a']), 0)).toBeNull();
  });
});
