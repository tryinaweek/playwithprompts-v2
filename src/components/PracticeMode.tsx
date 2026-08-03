import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Dumbbell, Lightbulb } from 'lucide-react';
import { RoundTimer } from '@/components/RoundTimer';
import { SpotTheSlip } from '@/components/SpotTheSlip';
import { RealOrRobot } from '@/components/RealOrRobot';
import { fetchPracticeRound, submitPracticeAnswer } from '@/lib/api';
import { ROUND_TIME_LIMIT_SECONDS } from '@/game/logic';
import type {
  ChallengeAnswer,
  PracticeResult,
  PublicChallenge,
  RealOrRobotPayload,
  SpotTheSlipPayload,
} from '@/types/catch';

const FORMAT_LABELS: Record<string, string> = {
  spot_the_slip: 'Spot the Slip',
  real_or_robot: 'Real or Robot',
};

/**
 * Unlimited-ish extra rounds after the daily. Clearly badged Practice, keeps
 * its own session tally, and never touches the streak or percentile.
 */
export function PracticeMode({ onExit }: { onExit: () => void }) {
  const [challenge, setChallenge] = useState<PublicChallenge | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [selected, setSelected] = useState<ChallengeAnswer | null>(null);
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [doneForToday, setDoneForToday] = useState(false);
  const [tally, setTally] = useState({ played: 0, correct: 0 });
  const [secondsLeft, setSecondsLeft] = useState(ROUND_TIME_LIMIT_SECONDS);
  const startedAt = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
  };

  const loadRound = async () => {
    setLoading(true);
    setSelected(null);
    setResult(null);
    setSecondsLeft(ROUND_TIME_LIMIT_SECONDS);
    try {
      const round = await fetchPracticeRound();
      setChallenge(round.challenge);
      setRemaining(round.remainingToday);
      startedAt.current = Date.now();
      stopTimer();
      tickRef.current = setInterval(() => {
        if (startedAt.current) {
          const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
          setSecondsLeft(Math.max(0, ROUND_TIME_LIMIT_SECONDS - elapsed));
        }
      }, 500);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('limit')) {
        setDoneForToday(true);
      } else {
        toast.error(message || 'Could not load a practice round');
        onExit();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRound();
    return stopTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    if (!challenge || !selected || submitting) return;
    setSubmitting(true);
    stopTimer();
    const timeMs = startedAt.current ? Date.now() - startedAt.current : 0;
    try {
      const res = await submitPracticeAnswer(challenge.id, selected, timeMs);
      setResult(res);
      setTally((t) => ({ played: t.played + 1, correct: t.correct + (res.correct ? 1 : 0) }));
      setRemaining((r) => (r === null ? null : Math.max(0, r - 1)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong — try again');
    } finally {
      setSubmitting(false);
    }
  };

  if (doneForToday) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-2xl">🏁</p>
        <h2 className="text-xl font-bold text-gray-900">That&apos;s the practice cap for today</h2>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          Fresh rounds tomorrow — your daily streak round will be waiting too.
        </p>
        <button onClick={onExit} className="text-purple-600 font-medium text-sm hover:underline">
          Back to today&apos;s result
        </button>
      </div>
    );
  }

  if (loading || !challenge) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  const revealed = result ? { answer: result.answer, playerAnswer: result.playerAnswer } : undefined;

  return (
    <div className="space-y-6">
      {/* Practice bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-purple-500 uppercase tracking-wider inline-flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5" />
            Practice · {FORMAT_LABELS[challenge.format]}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {'●'.repeat(challenge.difficulty)}
            {'○'.repeat(3 - challenge.difficulty)} difficulty
            {tally.played > 0 && (
              <span className="ml-2 text-gray-400">
                · session {tally.correct}/{tally.played}
              </span>
            )}
          </p>
        </div>
        {!result && <RoundTimer secondsLeft={secondsLeft} />}
      </div>

      {challenge.format === 'spot_the_slip' ? (
        <SpotTheSlip
          payload={challenge.payload as SpotTheSlipPayload}
          selected={selected}
          onSelect={setSelected}
          revealed={revealed}
        />
      ) : (
        <RealOrRobot
          payload={challenge.payload as RealOrRobotPayload}
          selected={selected}
          onSelect={setSelected}
          revealed={revealed}
        />
      )}

      {!result && (
        <button
          onClick={submit}
          disabled={!selected || submitting}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-40"
        >
          {submitting ? 'Checking…' : 'Lock in my answer'}
        </button>
      )}

      {result && (
        <div className="space-y-5">
          <div
            className={`rounded-xl border p-5 ${
              result.correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}
          >
            <p className={`text-lg font-bold ${result.correct ? 'text-green-800' : 'text-red-800'}`}>
              {result.correct ? 'Caught it! 🎯' : 'The AI fooled you'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Practice round — no streak on the line.
            </p>
          </div>

          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
            <p className="text-sm font-bold text-gray-900 inline-flex items-center gap-1.5 mb-1.5">
              <Lightbulb className="w-4 h-4 text-yellow-600" />
              What to look for
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{result.explanation}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => void loadRound()}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:opacity-90 transition-all"
            >
              Next practice round
              {remaining !== null ? ` (${remaining} left today)` : ''}
            </button>
            <button
              onClick={onExit}
              className="px-6 py-3 rounded-xl font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Done for now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
