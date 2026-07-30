import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle, Flame, Snowflake, Target, XCircle } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AccountBox } from '@/components/AccountBox';
import { fetchProfile } from '@/lib/api';
import { clearPlayerId } from '@/lib/player';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/lib/useSession';

const FORMAT_LABELS: Record<string, string> = {
  spot_the_slip: 'Spot the Slip',
  real_or_robot: 'Real or Robot',
};

export function MePage() {
  const queryClient = useQueryClient();
  const session = useSession();
  const { data: profile, isLoading } = useQuery({ queryKey: ['profile'], queryFn: fetchProfile });

  const signOut = async () => {
    await supabase.auth.signOut();
    clearPlayerId();
    toast.success('Signed out — this browser is anonymous again');
    void queryClient.invalidateQueries();
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your stats</h1>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Streak', value: `${profile.streak.currentStreak}`, icon: Flame, color: 'text-orange-500' },
            { label: 'Longest', value: `${profile.streak.longestStreak}`, icon: Target, color: 'text-purple-600' },
            { label: 'Rounds', value: `${profile.roundsPlayed}`, icon: CheckCircle, color: 'text-blue-600' },
            { label: 'Accuracy', value: `${profile.accuracy}%`, icon: Target, color: 'text-green-600' },
          ].map((tile, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 text-center">
              <tile.icon className={`w-5 h-5 mx-auto mb-1 ${tile.color}`} />
              <p className="text-2xl font-bold text-gray-900">{tile.value}</p>
              <p className="text-xs text-gray-500">{tile.label}</p>
            </div>
          ))}
        </div>

        {profile.streak.freezesAvailable > 0 && (
          <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-center gap-3 text-sm text-blue-800">
            <Snowflake className="w-4 h-4 flex-shrink-0" />
            <span>
              {profile.streak.freezesAvailable} streak freeze
              {profile.streak.freezesAvailable > 1 ? 's' : ''} banked — a missed day is covered
              automatically.
            </span>
          </div>
        )}

        {/* History */}
        <h2 className="text-lg font-bold text-gray-900 mb-3">Recent rounds</h2>
        {profile.history.length === 0 ? (
          <p className="text-gray-500 text-sm mb-8">No rounds yet — play your first one today.</p>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-8">
            {profile.history.map((h, i) => (
              <div
                key={i}
                className={`px-5 py-3 flex items-center justify-between text-sm ${
                  i > 0 ? 'border-t border-gray-100' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {h.correct ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-gray-900 font-medium">#{h.challengeNumber}</span>
                  <span className="text-gray-500">{FORMAT_LABELS[h.format]}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-400">{h.date}</span>
                  <span className="font-medium text-gray-700 w-8 text-right">{h.score}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Account */}
        <h2 className="text-lg font-bold text-gray-900 mb-3">Your account</h2>
        {session.email ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-5 flex items-center justify-between gap-4">
            <p className="text-sm text-green-800">
              Signed in as <span className="font-medium">{session.email}</span>. Your streak follows
              you to any device.
            </p>
            <button
              onClick={signOut}
              className="text-sm text-gray-600 hover:text-gray-900 underline flex-shrink-0"
            >
              Sign out
            </button>
          </div>
        ) : (
          <AccountBox
            title="Save your streak"
            subtitle="Your streak lives in this browser only. Attach it to a free account and it survives a new phone, a cleared cache, or a different browser."
          />
        )}
      </div>

      <Footer />
    </div>
  );
}
