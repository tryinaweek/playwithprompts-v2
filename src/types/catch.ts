export type ChallengeFormat = 'spot_the_slip' | 'real_or_robot';

export interface SpotTheSlipPayload {
  intro: string;
  source: string;
  instruction: string;
  segments: string[];
}

export interface RealOrRobotOption {
  id: string;
  text: string;
}

export interface RealOrRobotPayload {
  intro: string;
  instruction: string;
  options: RealOrRobotOption[];
}

export type ChallengePayload = SpotTheSlipPayload | RealOrRobotPayload;

export type ChallengeAnswer = { segmentIndex: number } | { optionId: string };

export interface Challenge {
  id: string;
  format: ChallengeFormat;
  difficulty: number;
  title: string;
  payload: ChallengePayload;
  answer: ChallengeAnswer;
  explanation: string;
}

/** Challenge as served to the client — never includes answer or explanation. */
export interface PublicChallenge {
  id: string;
  number: number;
  date: string;
  format: ChallengeFormat;
  difficulty: number;
  payload: ChallengePayload;
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  freezesAvailable: number;
  lastPlayedDate: string | null;
}

export interface PercentileInfo {
  topPercent: number;
  totalPlayers: number;
  betaCohort: boolean;
  rank: number;
}

export interface SubmitResult {
  correct: boolean;
  score: number;
  timeMs: number;
  answer: ChallengeAnswer;
  playerAnswer: ChallengeAnswer;
  explanation: string;
  /** Null while the shared database is not yet provisioned (degraded mode). */
  percentile: PercentileInfo | null;
  /** Null while the shared database is not yet provisioned (degraded mode). */
  streak: StreakState | null;
  shareText: string;
}

export interface DailyResponse {
  challenge: PublicChallenge;
  alreadyPlayed: boolean;
  result: SubmitResult | null;
}

export interface HistoryEntry {
  date: string;
  challengeNumber: number;
  format: ChallengeFormat;
  correct: boolean;
  score: number;
}

export interface ProfileStats {
  roundsPlayed: number;
  correctCount: number;
  accuracy: number;
  streak: StreakState;
  history: HistoryEntry[];
}
