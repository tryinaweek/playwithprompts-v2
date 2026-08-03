import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dumbbell, Play, Timer } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SpotTheSlip } from '@/components/SpotTheSlip';
import { RealOrRobot } from '@/components/RealOrRobot';
import { Reveal } from '@/components/Reveal';
import { PracticeMode } from '@/components/PracticeMode';
import { fetchDaily, logEvent, submitAnswer } from '@/lib/api';
import { ROUND_TIME_LIMIT_SECONDS } from '@/game/logic';
import type { ChallengeAnswer, RealOrRobotPayload, SpotTheSlipPayload, SubmitResult } from '@/types/catch';

const FORMAT_LABELS: Record<string, string> = {
  spot_the_slip: 'Spot the Slip',
  real_or_robot: 'Real or Robot',
};

export function PlayPage() {
  const queryClient = useQueryClient();
  const [started, setStarted] = useState(false);
  const [selected, setSelected] = useState<ChallengeAnswer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [practicing, setPracticing] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_TIME_LIMIT_SECONDS);
  const startedAt = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data, isLoading, isError } = useQuery({ queryKey: ['daily'], queryFn: fetchDaily });

  const activeResult = result ?? data?.result ?? null;

  const startRound = () => {
    setStarted(true);
    startedAt.current = Date.now();
    logEvent('round_started', { challengeId: data?.challenge.id });
    tickRef.current = setInterval(() => {
      if (startedAt.current) {
        const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
        setSecondsLeft(Math.max(0, ROUND_TIME_LIMIT_SECONDS - elapsed));
      }
    }, 500);
  };

  const submit = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    if (tickRef.current) clearInterval(tickRef.current);
    const timeMs = startedAt.current ? Date.now() - startedAt.current : 0;
    try {
      const res = await submitAnswer(selected, timeMs);
      setResult(res);
      void queryClient.invalidateQueries({ queryKey: ['daily'] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong — try again');
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex flex-col items-center justify-center py-32 gap-3 px-4 text-center">
          <h2 className="text-xl font-bold text-gray-900">Today's round isn't available</h2>
          <p className="text-gray-500 text-sm">Please refresh, or come back in a bit.</p>
        </div>
      </div>
    );
  }

  const { challenge } = data;
  const revealed = activeResult
    ? { answer: activeResult.answer, playerAnswer: activeResult.playerAnswer }
    : undefined;

  if (practicing) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <PracticeMode onExit={() => setPracticing(false)} />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Round bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Round #{challenge.number} · {FORMAT_LABELS[challenge.format]}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {'●'.repeat(challenge.difficulty)}
              {'○'.repeat(3 - challenge.difficulty)} difficulty
            </p>
          </div>
          {started && !activeResult && (
            <div
              className={`flex items-center gap-1.5 text-sm font-medium ${
                secondsLeft > 15 ? 'text-gray-600' : 'text-red-600'
              }`}
            >
              <Timer className="w-4 h-4" />
              {secondsLeft > 0 ? `${secondsLeft}s` : 'no speed bonus'}
            </div>
          )}
        </div>

        {/* Intro gate — timer starts when the player is ready */}
        {!started && !activeResult && (
          <div className="text-center py-12">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
              Catch the AI
              <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                if you can
              </span>
            </h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              One challenge a day. 90 seconds. Everyone gets the same one — can you spot what the AI got
              wrong?
            </p>
            <button
              onClick={startRound}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-10 py-4 text-lg font-bold rounded-full hover:opacity-90 transition-all shadow-lg inline-flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              Start today's round
            </button>
          </div>
        )}

        {/* The challenge */}
        {(started || activeResult) && (
          <div className="space-y-6">
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

            {!activeResult && (
              <button
                onClick={submit}
                disabled={!selected || submitting}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-40"
              >
                {submitting ? 'Checking…' : 'Lock in my answer'}
              </button>
            )}

            {activeResult && (
              <>
                <Reveal result={activeResult} />
                <button
                  onClick={() => setPracticing(true)}
                  className="w-full border-2 border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 py-3 px-6 rounded-xl font-medium transition-colors inline-flex items-center justify-center gap-2"
                >
                  <Dumbbell className="w-4 h-4" />
                  Keep playing — practice rounds
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
