import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Flame, Lightbulb, Share2, Trophy } from 'lucide-react';
import { logEvent } from '@/lib/api';
import { msUntilNextRound } from '@/lib/player';
import type { SubmitResult } from '@/types/catch';

function formatCountdown(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

export function Reveal({ result }: { result: SubmitResult }) {
  const [countdown, setCountdown] = useState(() => formatCountdown(msUntilNextRound()));

  useEffect(() => {
    const timer = setInterval(() => setCountdown(formatCountdown(msUntilNextRound())), 30_000);
    return () => clearInterval(timer);
  }, []);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(result.shareText);
      toast.success('Result copied — paste it anywhere');
    } catch {
      toast.error('Could not copy — long-press the card text to copy it');
    }
    logEvent('card_shared');
  };

  return (
    <div className="space-y-5">
      {/* Outcome banner */}
      <div
        className={`rounded-xl border p-5 ${
          result.correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
        }`}
      >
        <p className={`text-lg font-bold ${result.correct ? 'text-green-800' : 'text-red-800'}`}>
          {result.correct ? `You caught it! +${result.score} points` : 'The AI fooled you today'}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
          {result.correct && (
            <span className="inline-flex items-center gap-1">
              <Trophy className="w-4 h-4 text-amber-500" />
              {result.percentile.rank === 1 ? 'Top score today' : `Top ${result.percentile.topPercent}%`}
              {result.percentile.betaCohort && ' (beta cohort)'}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Flame className="w-4 h-4 text-orange-500" />
            {result.streak.currentStreak}-day streak
            {result.streak.freezesAvailable > 0 && ` · ${result.streak.freezesAvailable} freeze${result.streak.freezesAvailable > 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {/* What to look for */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <p className="font-semibold text-gray-900 text-sm">What to look for</p>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{result.explanation}</p>
      </div>

      {/* Share card */}
      <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-5">
        <pre className="font-mono text-sm text-gray-800 whitespace-pre-wrap mb-3">{result.shareText}</pre>
        <button
          onClick={share}
          className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          Copy my result
        </button>
      </div>

      <div className="text-center text-sm text-gray-500 space-y-2 pt-2">
        <p>Next round in {countdown}</p>
        <p>
          <Link to="/me" className="text-purple-600 hover:underline">
            See your stats →
          </Link>
        </p>
      </div>
    </div>
  );
}
