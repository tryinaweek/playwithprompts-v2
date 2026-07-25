import { Bot, User } from 'lucide-react';
import type { ChallengeAnswer, RealOrRobotPayload } from '@/types/catch';

interface RealOrRobotProps {
  payload: RealOrRobotPayload;
  selected: ChallengeAnswer | null;
  onSelect: (answer: ChallengeAnswer) => void;
  revealed?: { answer: ChallengeAnswer; playerAnswer: ChallengeAnswer };
}

export function RealOrRobot({ payload, selected, onSelect, revealed }: RealOrRobotProps) {
  const selectedId = selected && 'optionId' in selected ? selected.optionId : null;
  const answerId = revealed && 'optionId' in revealed.answer ? revealed.answer.optionId : null;
  const playerId = revealed && 'optionId' in revealed.playerAnswer ? revealed.playerAnswer.optionId : null;

  return (
    <div className="space-y-5">
      <p className="text-gray-600">{payload.intro}</p>
      {!revealed && <p className="text-sm text-gray-500">{payload.instruction}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {payload.options.map((option) => {
          let style = 'border-gray-200 hover:border-purple-300 hover:bg-purple-50';
          if (!revealed && selectedId === option.id) style = 'border-purple-500 bg-purple-50';
          if (revealed) {
            style = 'border-gray-200';
            if (option.id === answerId) style = 'border-green-500 bg-green-50';
            if (option.id === playerId && option.id !== answerId) style = 'border-red-400 bg-red-50';
          }
          return (
            <button
              key={option.id}
              disabled={Boolean(revealed)}
              onClick={() => onSelect({ optionId: option.id })}
              className={`text-left rounded-xl border p-5 text-sm leading-relaxed transition-colors disabled:cursor-default ${style}`}
            >
              {revealed && (
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold mb-2 ${
                    option.id === answerId ? 'text-green-700' : 'text-gray-500'
                  }`}
                >
                  {option.id === answerId ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  {option.id === answerId ? 'Human' : 'AI'}
                </span>
              )}
              <span className="block text-gray-700">{option.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
