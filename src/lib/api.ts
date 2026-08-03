import type {
  ChallengeAnswer,
  DailyResponse,
  PracticeResult,
  PracticeRoundResponse,
  ProfileStats,
  SubmitResult,
} from '@/types/catch';
import { getPlayerId, localDate } from './player';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-player-id': getPlayerId(),
      ...init?.headers,
    },
  });
  if (!resp.ok) {
    const body = (await resp.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `request failed (${resp.status})`);
  }
  return (await resp.json()) as T;
}

export function fetchDaily(): Promise<DailyResponse> {
  return request<DailyResponse>(`/api/catch/daily?date=${localDate()}`);
}

export function submitAnswer(answer: ChallengeAnswer, timeMs: number): Promise<SubmitResult> {
  return request<SubmitResult>('/api/catch/submit', {
    method: 'POST',
    body: JSON.stringify({ date: localDate(), answer, timeMs }),
  });
}

export function fetchProfile(): Promise<ProfileStats> {
  return request<ProfileStats>('/api/catch/me');
}

export function fetchPracticeRound(): Promise<PracticeRoundResponse> {
  return request<PracticeRoundResponse>(`/api/catch/practice?date=${localDate()}`);
}

export function submitPracticeAnswer(
  challengeId: string,
  answer: ChallengeAnswer,
  timeMs: number
): Promise<PracticeResult> {
  return request<PracticeResult>('/api/catch/practice-submit', {
    method: 'POST',
    body: JSON.stringify({ date: localDate(), challengeId, answer, timeMs }),
  });
}

export function logEvent(type: 'round_started' | 'card_shared' | 'signup_completed', meta: Record<string, unknown> = {}): void {
  void request('/api/catch/event', { method: 'POST', body: JSON.stringify({ type, meta }) }).catch(() => {
    // analytics must never break the game
  });
}

export function subscribe(
  email: string,
  source: string
): Promise<{ ok: boolean; alreadySubscribed: boolean }> {
  return request<{ ok: boolean; alreadySubscribed: boolean }>('/api/catch/subscribe', {
    method: 'POST',
    body: JSON.stringify({ email, source }),
  });
}

export function linkAccount(accessToken: string): Promise<{ playerId: string; adopted: number }> {
  return request<{ playerId: string; adopted: number }>('/api/catch/link', {
    method: 'POST',
    body: JSON.stringify({ accessToken }),
  });
}
