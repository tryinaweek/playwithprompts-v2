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

  /**
   * Google sign-in. Preferred path: OAuth needs no confirmation email, so it
   * works even while Supabase's built-in mailer is throttled. The redirect
   * returns here and useSession adopts this device's rounds onto the account.
   */
  const signInWithGoogle = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname },
    });
    if (authError) {
      setError(authError.message);
      setBusy(false);
    }
  };

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

      <button
        onClick={signInWithGoogle}
        disabled={busy}
        className="w-full border border-gray-300 bg-white text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-40 flex items-center justify-center gap-2 mb-3"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z" />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3 mb-3">
        <div className="h-px bg-gray-200 flex-1" />
        <span className="text-xs text-gray-400">or use email</span>
        <div className="h-px bg-gray-200 flex-1" />
      </div>

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
