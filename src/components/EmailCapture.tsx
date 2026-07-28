import { useState } from 'react';
import { Check, Mail } from 'lucide-react';
import { subscribe } from '@/lib/api';

interface EmailCaptureProps {
  source: 'reveal' | 'stats';
  /** Headline shown above the field. */
  title: string;
  subtitle: string;
}

export function EmailCapture({ source, title, subtitle }: EmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'saving' || !email.trim()) return;
    setStatus('saving');
    try {
      const res = await subscribe(email.trim(), source);
      setStatus('done');
      setMessage(res.alreadySubscribed ? "You're already on the list." : "You're on the list.");
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong — try again.');
    }
  };

  if (status === 'done') {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5 flex items-center gap-3">
        <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
        <p className="text-sm text-green-800">{message} See you tomorrow.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-2 mb-1">
        <Mail className="w-4 h-4 text-purple-600" />
        <p className="font-semibold text-gray-900 text-sm">{title}</p>
      </div>
      <p className="text-sm text-gray-600 mb-3">{subtitle}</p>
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
          placeholder="you@example.com"
          className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400"
        />
        <button
          type="submit"
          disabled={status === 'saving'}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-all disabled:opacity-40"
        >
          {status === 'saving' ? 'Saving…' : 'Join'}
        </button>
      </form>
      {status === 'error' && <p className="text-sm text-red-600 mt-2">{message}</p>}
    </div>
  );
}
