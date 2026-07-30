import { Link } from 'react-router-dom';
import { Flame, Lightbulb, Target, Timer } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export function HowPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">How it works</h1>
        <p className="text-lg text-gray-500 mb-10">
          AI writes half of what you read now. This game trains the skill that matters: telling good
          output from bad.
        </p>

        <div className="space-y-6">
          {[
            {
              icon: Target,
              title: 'One round a day',
              text: 'Everyone on Earth gets the same challenge. Spot the error the AI slipped into a summary, or pick which text a real human wrote.',
            },
            {
              icon: Timer,
              title: '90 seconds, one attempt',
              text: 'A correct answer scores 70 points, plus up to 30 for speed. No retries — trust your eye.',
            },
            {
              icon: Flame,
              title: 'Keep your streak alive',
              text: 'Play daily to build a streak. Every 7-day week earns a streak freeze that auto-covers one missed day.',
            },
            {
              icon: Lightbulb,
              title: 'Learn from every reveal',
              text: 'Right or wrong, each round ends with the tell you should have seen — a 30-second lesson in spotting AI slips.',
            },
          ].map((item, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 mb-1">{item.title}</h2>
                <p className="text-gray-600 text-sm leading-relaxed">{item.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-5 text-sm text-gray-700">
          Free to play, every day. No account needed — sign in only if you want your streak saved across
          devices.
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-full font-bold hover:opacity-90 transition-all"
          >
            Play today's round
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
