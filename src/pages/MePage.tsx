import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle, Flame, Snowflake, Target, XCircle } from 'lucide-react';
import { Header } from '@/components/Header';
import { fetchProfile, linkAccount, logEvent } from '@/lib/api';
import { setPlayerId } from '@/lib/player';
import { supabase } from '@/lib/supabase';

const FORMAT_LABELS: Record<string, string> = {
  spot_the_slip: 'Spot the Slip',
  real_or_robot: 'Real or Robot',
};

export function MePage() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({ queryKey: ['profile'], queryFn: fetchProfile });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [linkedEmail, setLinkedEmail] = useState<string | null>(null);

  const signIn = async (mode: 'in' | 'up') => {
    if (!email || !password || authBusy) return;
    setAuthBusy(true);
    try {
      const { data, error } =
        mode === 'in'
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });
      if (error) throw error;
      const token = data.session?.access_token;
      if (!token) {
        toast.info('Check your email to confirm your account, then sign in here.');
        return;
      }
      const { playerId } = await linkAccount(token);
      setPlayerId(playerId);
      setLinkedEmail(email);
      logEvent('signup_completed');
      toast.success('Streak saved to your account');
      void queryClient.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setAuthBusy(false);
    }
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
            {
              label: 'Streak',
              value: `${profile.streak.currentStreak}`,
              icon: Flame,
              color: 'text-orange-500',
            },
            {
              label: 'Longest',
              value: `${profile.streak.longestStreak}`,
              icon: Target,
              color: 'text-purple-600',
            },
            {
              label: 'Rounds',
              value: `${profile.roundsPlayed}`,
              icon: CheckCircle,
              color: 'text-blue-600',
            },
            {
              label: 'Accuracy',
              value: `${profile.accuracy}%`,
              icon: Target,
              color: 'text-green-600',
            },
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

        {/* Account — linking endpoint exists in local dev only for now */}
        {!import.meta.env.DEV ? (
          <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
            Your streak lives in this browser for now. Sign-in to sync it across devices is coming
            soon.
          </div>
        ) : (
          <>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Save your streak</h2>
        {linkedEmail ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            Signed in as {linkedEmail}. Your streak follows you across devices.
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
            <p className="text-sm text-gray-600">
              Playing anonymously works fine on this device. Sign in to keep your streak if you switch
              phones.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400"
            />
            <div className="flex gap-2">
              <button
                onClick={() => signIn('in')}
                disabled={authBusy}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-40"
              >
                Sign in
              </button>
              <button
                onClick={() => signIn('up')}
                disabled={authBusy}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40"
              >
                Create account
              </button>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
