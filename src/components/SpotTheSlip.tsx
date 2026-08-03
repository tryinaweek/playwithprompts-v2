import { FileText, Hand } from 'lucide-react';
import type { ChallengeAnswer, SpotTheSlipPayload } from '@/types/catch';

interface SpotTheSlipProps {
  payload: SpotTheSlipPayload;
  selected: ChallengeAnswer | null;
  onSelect: (answer: ChallengeAnswer) => void;
  revealed?: { answer: ChallengeAnswer; playerAnswer: ChallengeAnswer };
}

/**
 * Card-game presentation: the original is a "document" card, the question is a
 * loud gradient banner, and each summary sentence is a big tappable card with
 * a press animation. Mobile-first — thumbs, not cursors.
 */
export function SpotTheSlip({ payload, selected, onSelect, revealed }: SpotTheSlipProps) {
  const selectedIndex = selected && 'segmentIndex' in selected ? selected.segmentIndex : null;
  const answerIndex = revealed && 'segmentIndex' in revealed.answer ? revealed.answer.segmentIndex : null;
  const playerIndex =
    revealed && 'segmentIndex' in revealed.playerAnswer ? revealed.playerAnswer.segmentIndex : null;

  return (
    <div className="space-y-5">
      <p className="text-gray-800 font-medium">{payload.intro}</p>

      {/* The original — styled like a paper document so it reads as evidence */}
      <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-5 shadow-sm">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 uppercase tracking-widest mb-2.5 bg-amber-100 border border-amber-200 rounded-full px-2.5 py-1">
          <FileText className="w-3.5 h-3.5" />
          The original
        </p>
        <p className="text-gray-900 leading-relaxed">{payload.source}</p>
      </div>

      {/* The question — has to be impossible to miss */}
      {!revealed && (
        <div className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3.5 shadow-md flex items-center gap-2.5">
          <Hand className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-bold leading-snug">{payload.instruction}</p>
        </div>
      )}

      <div>
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">
          The AI summary
        </p>
        <div className="space-y-2.5">
          {payload.segments.map((segment, i) => {
            let style = 'border-gray-200 bg-white hover:border-purple-400 hover:shadow-md';
            if (!revealed && selectedIndex === i)
              style = 'border-purple-500 bg-purple-50 shadow-md ring-2 ring-purple-200';
            if (revealed) {
              style = 'border-gray-200 bg-white opacity-70';
              if (i === answerIndex) style = 'border-green-500 bg-green-50 shadow-md';
              if (i === playerIndex && i !== answerIndex) style = 'border-red-400 bg-red-50 shadow-md';
            }
            return (
              <button
                key={i}
                disabled={Boolean(revealed)}
                onClick={() => onSelect({ segmentIndex: i })}
                className={`w-full text-left px-4 py-4 rounded-2xl border-2 text-[15px] leading-relaxed shadow-sm transition-all duration-150 active:scale-[0.98] disabled:cursor-default disabled:active:scale-100 ${style}`}
              >
                <span className="flex items-start gap-3">
                  <span
                    className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 transition-colors ${
                      !revealed && selectedIndex === i
                        ? 'border-purple-500 bg-purple-500'
                        : revealed && i === answerIndex
                          ? 'border-green-500 bg-green-500'
                          : revealed && i === playerIndex && i !== answerIndex
                            ? 'border-red-400 bg-red-400'
                            : 'border-gray-300 bg-white'
                    }`}
                  />
                  <span className="text-gray-900">
                    {segment}
                    {revealed && i === answerIndex && (
                      <span className="ml-2 text-green-700 font-bold whitespace-nowrap">← the slip</span>
                    )}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
