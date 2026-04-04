import { useNavigate } from 'react-router-dom';
import { Check, BookOpen, MessageSquare, Sparkles } from 'lucide-react';
import { Header } from '@/components/Header';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="py-20 md:py-32 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
            Learn Prompt Engineering
            <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              in 20 Minutes
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-xl mx-auto">
            Write a prompt. Get AI feedback. See how to improve.
            A free, hands-on course that actually teaches you to prompt well.
          </p>

          <ul className="max-w-sm mx-auto space-y-3 mb-10 text-left">
            {[
              '12 structured lessons across 4 modules',
              'Real AI feedback on every prompt you write',
              'Works with ChatGPT, Claude, Gemini',
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-gray-700">
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => navigate('/learn')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-10 py-4 text-lg font-bold rounded-full hover:opacity-90 transition-all shadow-lg"
          >
            Start Free Course
          </button>

          <p className="mt-4 text-gray-400 text-sm">No account required. Just start learning.</p>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: 'Read the Lesson',
                description: 'Short lessons teach one concept at a time with before/after examples.',
                color: 'from-blue-500 to-blue-600',
              },
              {
                icon: MessageSquare,
                title: 'Write a Prompt',
                description: 'Practice what you learned. Write a real prompt, not multiple choice.',
                color: 'from-purple-500 to-purple-600',
              },
              {
                icon: Sparkles,
                title: 'Get AI Feedback',
                description: 'AI scores your prompt 1-10 with specific improvements. Then try again.',
                color: 'from-pink-500 to-pink-600',
              },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div
                  className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}
                >
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-sm font-bold text-gray-400 mb-2">Step {i + 1}</div>
                <h3 className="text-lg font-bold mb-2 text-gray-900">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Start Writing Better Prompts Today</h2>
          <p className="text-white/80 mb-8 text-lg">Free. No account needed. 20 minutes to see real improvement.</p>
          <button
            onClick={() => navigate('/learn')}
            className="bg-white text-purple-700 hover:bg-gray-100 px-10 py-4 text-lg font-bold rounded-full shadow-xl transition-all"
          >
            Start Free Course
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-50 text-center text-sm text-gray-500">
        Made by Play with Prompts
      </footer>
    </div>
  );
}
