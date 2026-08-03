import { Timer } from 'lucide-react';

/**
 * Big, phase-colored countdown pill: calm gray → amber under 30s → pulsing
 * red under 15s. The old thin text version was invisible on phones.
 */
export function RoundTimer({ secondsLeft }: { secondsLeft: number }) {
  const phase =
    secondsLeft > 30
      ? 'border-gray-300 bg-gray-100 text-gray-800'
      : secondsLeft > 15
        ? 'border-amber-300 bg-amber-100 text-amber-800'
        : 'border-red-300 bg-red-100 text-red-700 animate-pulse';

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-base font-bold tabular-nums shadow-sm ${phase}`}
    >
      <Timer className="w-5 h-5" />
      {secondsLeft > 0 ? `${secondsLeft}s` : 'no bonus'}
    </div>
  );
}
