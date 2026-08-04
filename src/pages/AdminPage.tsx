import { useState } from 'react';
import { toast } from 'sonner';
import {
  BarChart3,
  Copy,
  Download,
  ExternalLink,
  Flame,
  GraduationCap,
  Send,
  Target,
  Users,
} from 'lucide-react';
import { Header } from '@/components/Header';

/**
 * Solo-founder command center: the whole brand database on one page.
 * Game (players, streaks, plays), THE LIST (sources, latest, export), and
 * course headline numbers with a deep link to the legacy course admin.
 */

interface Stats {
  generatedAt: string;
  list: {
    total: number;
    bySource: { source: string; n: number }[];
    latest: { email: string; source: string; first_seen: string }[];
  };
  game: {
    totalPlayers: number;
    registeredPlayers: number;
    signupEvents: number | null;
    activePlayers7d: number;
    totalPlays: number;
    practicePlays: number | null;
    correctRate: number;
    playsByDate: { date: string; plays: number; correct: number }[];
    streaksAtLeast3: number;
    leaderboard: {
      player: string;
      registered: boolean;
      rounds: number;
      correct: number;
      currentStreak: number;
      longestStreak: number;
      lastPlayed: string;
    }[];
  };
  courses: {
    users: number | null;
    certificates: number | null;
    tipSubscribers: number | null;
  };
}

export function AdminPage() {
  const [password, setPassword] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [segment, setSegment] = useState('test');
  const [testEmail, setTestEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [sending, setSending] = useState(false);
  const [playerFilter, setPlayerFilter] = useState<'all' | 'registered'>('all');

  const login = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'x-admin-password': password },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Failed (${res.status})`);
        return;
      }
      setStats(data as Stats);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const download = async (what: 'list' | 'players') => {
    const res = await fetch(`/api/admin/export?what=${what}`, {
      headers: { 'x-admin-password': password },
    });
    if (!res.ok) {
      toast.error('Export failed');
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${what === 'list' ? 'the-list' : 'catch-players'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendEmail = async () => {
    if (!subject.trim() || !bodyText.trim()) {
      toast.error('Subject and message are required');
      return;
    }
    const isTest = segment === 'test';
    if (!isTest && !confirm(`Send "${subject.trim()}" to the "${segment}" segment? This emails real people.`)) {
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'x-admin-password': password, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segment,
          subject: subject.trim(),
          body: bodyText.trim(),
          testEmail: testEmail.trim(),
          replyTo: replyTo.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || `Send failed (${res.status})`);
        return;
      }
      const failNote = data.failures?.length ? ` (${data.failures.length} batch failures)` : '';
      toast.success(`Sent ${data.sent}/${data.total}${failNote}`);
      if (!isTest) {
        setSubject('');
        setBodyText('');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSending(false);
    }
  };

  const copyEmails = async () => {
    const res = await fetch('/api/admin/export?what=list&format=emails', {
      headers: { 'x-admin-password': password },
    });
    if (!res.ok) {
      toast.error('Could not fetch emails');
      return;
    }
    const text = await res.text();
    await navigator.clipboard.writeText(text);
    toast.success(`${text.split('\n').length} emails copied — paste into BCC`);
  };

  if (!stats) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-sm mx-auto px-4 py-24 space-y-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Command Center</h1>
          <p className="text-sm text-gray-500">The whole brand database, one page.</p>
          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-purple-400 focus:outline-none"
          />
          {error && <p className="text-red-600 text-xs font-semibold">{error}</p>}
          <button
            onClick={login}
            disabled={loading || !password}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-40"
          >
            {loading ? 'Checking…' : 'Open dashboard'}
          </button>
        </div>
      </div>
    );
  }

  const { list, game, courses } = stats;
  const maxPlays = Math.max(1, ...game.playsByDate.map((d) => d.plays));

  const card = 'rounded-2xl border-2 border-gray-100 bg-white p-5 shadow-sm';
  const label = 'text-[11px] font-bold text-gray-400 uppercase tracking-widest';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Command Center</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Live from the brand database · {new Date(stats.generatedAt).toLocaleString()}
            </p>
          </div>
          <button onClick={login} className="text-xs font-semibold text-purple-600 hover:underline">
            Refresh
          </button>
        </div>

        {/* Headline cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'THE LIST', value: list.total, icon: Users, note: 'emails owned' },
            {
              label: 'Game players',
              value: game.totalPlayers,
              icon: Target,
              note: `${game.activePlayers7d} active · 7d`,
            },
            {
              label: 'Course users',
              value: courses.users ?? '—',
              icon: GraduationCap,
              note: `${courses.certificates ?? '—'} certificates`,
            },
            {
              label: 'Streaks ≥ 3',
              value: game.streaksAtLeast3,
              icon: Flame,
              note: `${game.registeredPlayers} registered players`,
            },
          ].map((c) => (
            <div key={c.label} className={card}>
              <c.icon className="w-4 h-4 text-purple-500 mb-2" />
              <p className="text-2xl font-black text-gray-900">{c.value}</p>
              <p className={label}>{c.label}</p>
              <p className="text-[11px] text-gray-400 mt-1">{c.note}</p>
            </div>
          ))}
        </div>

        {/* Catch the AI */}
        <div className={card}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-purple-500" />
            <h2 className="font-bold text-gray-900">Catch the AI — last 14 days</h2>
            <span className="text-xs text-gray-400 ml-auto">
              {game.totalPlays} daily plays · {game.practicePlays ?? '—'} practice ·{' '}
              {game.correctRate}% caught
            </span>
          </div>
          <div className="flex items-end gap-1.5 h-28">
            {game.playsByDate.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: ${d.plays} plays, ${d.correct} correct`}>
                <div className="w-full flex flex-col justify-end" style={{ height: '88px' }}>
                  <div
                    className="w-full bg-gradient-to-t from-purple-600 to-blue-500 rounded-t"
                    style={{ height: `${(d.plays / maxPlays) * 100}%`, minHeight: d.plays > 0 ? 4 : 0 }}
                  />
                </div>
                <span className="text-[9px] text-gray-400 font-mono">{d.date.slice(8)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Streak leaderboard */}
        <div className={card}>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="font-bold text-gray-900">Players & streaks</h2>
            <div className="flex gap-1.5 ml-auto">
              {(
                [
                  { key: 'all', label: `All (${game.totalPlayers})` },
                  { key: 'registered', label: `Signed-in (${game.registeredPlayers})` },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setPlayerFilter(f.key)}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                    playerFilter === f.key
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-transparent'
                      : 'text-gray-500 bg-gray-50 border-gray-200 hover:text-gray-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          {playerFilter === 'registered' && (
            <p className="text-xs text-gray-500 mb-3">
              Players who created an account to save their streak — these are your most invested
              people.
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
                  <th className="py-2 pr-4">Player</th>
                  <th className="py-2 pr-4">Streak</th>
                  <th className="py-2 pr-4">Longest</th>
                  <th className="py-2 pr-4">Rounds</th>
                  <th className="py-2 pr-4">Caught</th>
                  <th className="py-2">Last played</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {game.leaderboard
                  .filter((p) => playerFilter === 'all' || p.registered)
                  .map((p) => (
                  <tr key={p.player} className="text-gray-700">
                    <td className="py-2 pr-4 font-medium">
                      {p.player}
                      {p.registered && (
                        <span className="ml-1.5 text-[9px] font-bold text-green-700 bg-green-50 border border-green-200 rounded px-1 py-0.5 uppercase">
                          acct
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4 font-bold text-orange-600">
                      {p.currentStreak > 0 ? `${p.currentStreak}🔥` : '—'}
                    </td>
                    <td className="py-2 pr-4">{p.longestStreak}</td>
                    <td className="py-2 pr-4">{p.rounds}</td>
                    <td className="py-2 pr-4">{p.correct}</td>
                    <td className="py-2 font-mono text-xs text-gray-500">{p.lastPlayed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* THE LIST */}
        <div className={card}>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <h2 className="font-bold text-gray-900">THE LIST</h2>
            <span className="text-xs text-gray-400">{list.total} emails, every source</span>
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => void download('list')}
                className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5 hover:bg-purple-100"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              <button
                onClick={() => void copyEmails()}
                className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5 hover:bg-purple-100"
              >
                <Copy className="w-3.5 h-3.5" /> Copy emails
              </button>
              <button
                onClick={() => void download('players')}
                className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5 hover:bg-purple-100"
              >
                <Download className="w-3.5 h-3.5" /> Players CSV
              </button>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className={`${label} mb-2`}>By source</p>
              <div className="space-y-1.5">
                {list.bySource.map((s) => (
                  <div key={s.source} className="flex items-center gap-2 text-sm">
                    <span className="font-mono text-xs text-gray-600 w-40 truncate">{s.source}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                        style={{ width: `${(s.n / list.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-700 w-8 text-right">{s.n}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className={`${label} mb-2`}>Latest signups</p>
              <div className="space-y-1">
                {list.latest.map((p) => (
                  <div key={p.email} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 truncate">{p.email}</span>
                    <span className="font-mono text-gray-400 ml-2 shrink-0">
                      {p.source} · {p.first_seen.slice(0, 10)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Send email */}
        <div className={card}>
          <div className="flex items-center gap-2 mb-1">
            <Send className="w-4 h-4 text-purple-500" />
            <h2 className="font-bold text-gray-900">Send an email</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Plain text in, branded email out (purple header, unsubscribe footer). Always test on
            yourself first.
          </p>
          <div className="grid md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                Send to
              </label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:border-purple-400 focus:outline-none"
              >
                <option value="test">🧪 Just a test address</option>
                <option value="all">THE LIST — everyone ({list.total})</option>
                <option value="players">Game players with accounts ({game.registeredPlayers})</option>
                <option value="accounts">All registered accounts (~{courses.users ?? '?'})</option>
                {list.bySource
                  .filter((s) => s.source !== 'verify-test')
                  .map((s) => (
                    <option key={s.source} value={`source:${s.source}`}>
                      Source: {s.source} ({s.n})
                    </option>
                  ))}
              </select>
            </div>
            {segment === 'test' ? (
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Test address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-purple-400 focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Reply-to (optional)
                </label>
                <input
                  type="email"
                  placeholder="replies go to hello@ unless set"
                  value={replyTo}
                  onChange={(e) => setReplyTo(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-purple-400 focus:outline-none"
                />
              </div>
            )}
          </div>
          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-3 focus:border-purple-400 focus:outline-none"
          />
          <textarea
            placeholder={'Write like a human. Blank line = new paragraph.\nLinks like playwithprompts.com become clickable.'}
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm min-h-[140px] mb-3 focus:border-purple-400 focus:outline-none"
          />
          <button
            onClick={() => void sendEmail()}
            disabled={sending}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 inline-flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Sending…' : segment === 'test' ? 'Send test' : 'Send campaign'}
          </button>
        </div>

        {/* Courses deep link */}
        <div className={`${card} flex items-center justify-between`}>
          <div>
            <h2 className="font-bold text-gray-900">Courses (legacy admin)</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {courses.users ?? '—'} users · {courses.tipSubscribers ?? '—'} tip subscribers ·{' '}
              {courses.certificates ?? '—'} certificates — manage users, prompts and emails in the
              course admin.
            </p>
          </div>
          <a
            href="https://www.playwithprompts.com/admin"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg px-3.5 py-2 inline-flex items-center gap-1.5 hover:bg-purple-100 shrink-0"
          >
            Open <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
