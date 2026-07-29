import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Lock, Mail } from 'lucide-react';
import { linkAccount, logEvent } from '@/lib/api';
import { setPlayerId } from '@/lib/player';
import { supabase } from '@/lib/supabase';

interface AccountBoxProps {
  title: string;
  subtitle: string;
}

type Mode = 'up' | 'in';

export function AccountBox({ title, subtitle }: AccountBoxProps) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>('up');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ email: string; adopted: number } | null>(null);
  const [confirmNeeded, setConfirmNeeded] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !email.trim() || !password) return;
    setBusy(true);
    setError('');
    setConfirmNeeded(false);
    try {
      const creds = { email: email.trim(), password };
      const { data, error: authError } =
        mode === 'in'
          ? await supabase.auth.signInWithPassword(creds)
          : await supabase.auth.signUp(creds);
      if (authError) throw authError;

      const token = data.session?.access_token;
      if (!token) {
        // Email confirmation is switched on for this project.
        setConfirmNeeded(true);
        return;
      }

      const { adopted } = await linkAccount(token);
      setPlayerId(data.session!.user.id);
      logEvent('signup_completed');
      setDone({ email: creds.email, adopted });
      void queryClient.invalidateQueries();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      if (/already registered|already exists/i.test(message)) {
        setError('That email already has an account — switch to Sign in below.');
      } else if (/confirmation email|sending|rate limit|too many/i.test(message)) {
        // Supabase's built-in mailer is throttled. Never imply the game is broken:
        // the round they just played is safe on this device either way.
        setError(
          "Sign-ups are temporarily throttled — try again in a bit. Your streak is still safe in this browser in the meantime."
        );
      } else {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5 flex items-start gap-3">
        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-green-800">
          <p className="font-medium">Streak saved to {done.email}.</p>
          <p className="mt-0.5">
            {done.adopted > 0
              ? `Your ${done.adopted} round${done.adopted > 1 ? 's' : ''} on this device came with you. `
              : ''}
            Sign in on any device to pick up where you left off.
          </p>
        </div>
      </div>
    );
  }

  if (confirmNeeded) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <p className="font-medium">Almost there — check your inbox.</p>
        <p className="mt-0.5">
          We sent a confirmation link to {email.trim()}. Click it, then come back and choose
          "Sign in" to attach your streak.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-2 mb-1">
        <Lock className="w-4 h-4 text-purple-600" />
        <p className="font-semibold text-gray-900 text-sm">{title}</p>
      </div>
      <p className="text-sm text-gray-600 mb-3">{subtitle}</p>

      <form onSubmit={submit} className="space-y-2">
        <div className="relative">
          <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-gray-200 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-purple-400"
          />
        </div>
        <input
          type="password"
          required
          minLength={6}
          autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (6+ characters)"
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400"
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-all disabled:opacity-40"
        >
          {busy ? 'Saving…' : mode === 'up' ? 'Save my streak' : 'Sign in'}
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

      <button
        onClick={() => {
          setMode(mode === 'up' ? 'in' : 'up');
          setError('');
        }}
        className="text-sm text-purple-600 hover:underline mt-3"
      >
        {mode === 'up' ? 'Already have an account? Sign in' : 'New here? Create an account'}
      </button>
    </div>
  );
}
