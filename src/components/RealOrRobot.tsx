import { Bot, Hand, User } from 'lucide-react';
import type { ChallengeAnswer, RealOrRobotPayload } from '@/types/catch';

interface RealOrRobotProps {
  payload: RealOrRobotPayload;
  selected: ChallengeAnswer | null;
  onSelect: (answer: ChallengeAnswer) => void;
  revealed?: { answer: ChallengeAnswer; playerAnswer: ChallengeAnswer };
}

/**
 * Card-game presentation, mobile-first. Convention: the stored answer is the
 * AI-WRITTEN option (instructions ask players to tap the AI one) — every seed
 * and generated challenge follows it, so the reveal labels derive directly.
 */
export function RealOrRobot({ payload, selected, onSelect, revealed }: RealOrRobotProps) {
  const selectedId = selected && 'optionId' in selected ? selected.optionId : null;
  const answerId = revealed && 'optionId' in revealed.answer ? revealed.answer.optionId : null;
  const playerId = revealed && 'optionId' in revealed.playerAnswer ? revealed.playerAnswer.optionId : null;

  return (
    <div className="space-y-5">
      <p className="text-gray-800 font-medium">{payload.intro}</p>

      {/* The question — has to be impossible to miss */}
      {!revealed && (
        <div className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3.5 shadow-md flex items-center gap-2.5">
          <Hand className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-bold leading-snug">{payload.instruction}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {payload.options.map((option, i) => {
          let style = 'border-gray-200 bg-white hover:border-purple-400 hover:shadow-md';
          if (!revealed && selectedId === option.id)
            style = 'border-purple-500 bg-purple-50 shadow-md ring-2 ring-purple-200';
          if (revealed) {
            style = 'border-gray-200 bg-white opacity-70';
            if (option.id === answerId) style = 'border-green-500 bg-green-50 shadow-md';
            if (option.id === playerId && option.id !== answerId)
              style = 'border-red-400 bg-red-50 shadow-md';
          }
          return (
            <button
              key={option.id}
              disabled={Boolean(revealed)}
              onClick={() => onSelect({ optionId: option.id })}
              className={`text-left rounded-2xl border-2 p-5 text-[15px] leading-relaxed shadow-sm transition-all duration-150 active:scale-[0.98] disabled:cursor-default disabled:active:scale-100 ${style}`}
            >
              <span
                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold mb-2.5 ${
                  !revealed && selectedId === option.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              {revealed && (
                <span
                  className={`ml-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                    option.id === answerId
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  {option.id === answerId ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  {option.id === answerId ? 'The AI' : 'Human'}
                </span>
              )}
              <span className="block text-gray-900">{option.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
