import type { ChallengeAnswer, SpotTheSlipPayload } from '@/types/catch';

interface SpotTheSlipProps {
  payload: SpotTheSlipPayload;
  selected: ChallengeAnswer | null;
  onSelect: (answer: ChallengeAnswer) => void;
  revealed?: { answer: ChallengeAnswer; playerAnswer: ChallengeAnswer };
}

export function SpotTheSlip({ payload, selected, onSelect, revealed }: SpotTheSlipProps) {
  const selectedIndex = selected && 'segmentIndex' in selected ? selected.segmentIndex : null;
  const answerIndex = revealed && 'segmentIndex' in revealed.answer ? revealed.answer.segmentIndex : null;
  const playerIndex =
    revealed && 'segmentIndex' in revealed.playerAnswer ? revealed.playerAnswer.segmentIndex : null;

  return (
    <div className="space-y-5">
      <p className="text-gray-600">{payload.intro}</p>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">The original</p>
        <p className="text-gray-700 leading-relaxed">{payload.source}</p>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">The AI summary</p>
        {!revealed && <p className="text-sm text-gray-500 mb-3">{payload.instruction}</p>}
        <div className="space-y-2">
          {payload.segments.map((segment, i) => {
            let style = 'border-gray-200 hover:border-purple-300 hover:bg-purple-50';
            if (!revealed && selectedIndex === i) style = 'border-purple-500 bg-purple-50';
            if (revealed) {
              style = 'border-gray-200';
              if (i === answerIndex) style = 'border-green-500 bg-green-50';
              if (i === playerIndex && i !== answerIndex) style = 'border-red-400 bg-red-50';
            }
            return (
              <button
                key={i}
                disabled={Boolean(revealed)}
                onClick={() => onSelect({ segmentIndex: i })}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm leading-relaxed transition-colors disabled:cursor-default ${style}`}
              >
                {segment}
                {revealed && i === answerIndex && <span className="ml-2 text-green-600 font-medium">← the slip</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
