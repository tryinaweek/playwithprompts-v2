import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Email campaigns from the Command Center, via Resend.
 *
 * POST { segment, subject, body, testEmail?, replyTo? }
 *   segment: 'test' | 'all' | 'players' | 'source:<source>'
 *
 * Recipients resolve server-side (service key). Sends go out as individual
 * emails through Resend's batch endpoint (100 per call) — never a giant BCC.
 * Every blast is logged to catch_events for an audit trail. The DNS for
 * playwithprompts.com is already configured in Resend; RESEND_API_KEY must
 * be set in this project's env.
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://nbfkibomkxvqyaoakmma.supabase.co';
const FROM = 'Ramesh at Play with Prompts <hello@playwithprompts.com>';
const MAX_RECIPIENTS = 2000;

async function sb<T>(path: string, init?: RequestInit): Promise<T | null> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  try {
    const resp = await fetch(`${SUPABASE_URL}${path}`, {
      ...init,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
    if (!resp.ok) return null;
    const text = await resp.text();
    return text ? (JSON.parse(text) as T) : ({} as T);
  } catch {
    return null;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Plain text -> simple branded HTML. Paragraphs on blank lines; links clickable. */
function renderHtml(bodyText: string): string {
  const paragraphs = bodyText
    .split(/\n\s*\n/)
    .map((p) => escapeHtml(p.trim()).replace(/\n/g, '<br/>'))
    .map((p) =>
      p.replace(
        /(https?:\/\/[^\s<]+|(?:^|\s)((?:playwithprompts|rameshnuti)\.com[^\s<]*))/g,
        (m) => {
          const url = m.trim().startsWith('http') ? m.trim() : `https://${m.trim()}`;
          return ` <a href="${url}" style="color:#7c3aed;">${m.trim()}</a>`;
        }
      )
    )
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 16px 0;">${p}</p>`)
    .join('');

  return `<!doctype html><html><body style="margin:0;padding:0;background:#f8fafc;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;font-size:15px;line-height:1.6;">
    <div style="background:linear-gradient(90deg,#7c3aed,#2563eb);border-radius:12px 12px 0 0;padding:14px 20px;">
      <span style="color:#ffffff;font-weight:700;font-size:15px;">🎯 Play with Prompts</span>
    </div>
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:24px 20px;">
      ${paragraphs}
    </div>
    <p style="color:#9ca3af;font-size:12px;margin-top:16px;text-align:center;">
      You're getting this because you signed up at playwithprompts.com or rameshnuti.com.<br/>
      Don't want these? Just reply with "unsubscribe" and you're out.
    </p>
  </div></body></html>`;
}

async function resolveRecipients(segment: string, testEmail: string): Promise<string[] | { error: string }> {
  if (segment === 'test') {
    if (!EMAIL_RE.test(testEmail)) return { error: 'a valid testEmail is required for a test send' };
    return [testEmail];
  }

  if (segment === 'players' || segment === 'accounts') {
    interface AuthUser {
      id: string;
      email?: string;
    }
    const data = await sb<{ users?: AuthUser[] } | AuthUser[]>('/auth/v1/admin/users?per_page=1000');
    if (!data) return { error: 'could not read accounts' };
    const users = Array.isArray(data) ? data : (data.users ?? []);

    if (segment === 'players') {
      // Only accounts that have actually played Catch the AI.
      const plays = await sb<{ player_id: string }[]>(
        '/rest/v1/catch_plays?select=player_id&limit=100000'
      );
      if (!plays) return { error: 'could not read plays' };
      const playerIds = new Set(plays.map((p) => p.player_id));
      return [
        ...new Set(
          users
            .filter((u) => playerIds.has(u.id))
            .map((u) => u.email)
            .filter((e): e is string => !!e && EMAIL_RE.test(e))
        ),
      ];
    }
    return [...new Set(users.map((u) => u.email).filter((e): e is string => !!e && EMAIL_RE.test(e)))];
  }

  // 'all' or 'source:<x>' — THE LIST, always excluding internal test rows.
  let filter = '&source=neq.verify-test';
  if (segment.startsWith('source:')) {
    const source = segment.slice('source:'.length);
    if (!source || source.length > 64) return { error: 'invalid source segment' };
    filter = `&source=eq.${encodeURIComponent(source)}`;
  } else if (segment !== 'all') {
    return { error: 'segment must be test, all, players, accounts, or source:<name>' };
  }
  const people = await sb<{ email: string }[]>(`/rest/v1/people?select=email${filter}&limit=100000`);
  if (!people) return { error: 'could not read THE LIST' };
  return [...new Set(people.map((p) => p.email).filter((e) => EMAIL_RE.test(e)))];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const adminPw = process.env.ADMIN_PASSWORD;
  if (!adminPw) return res.status(500).json({ error: 'ADMIN_PASSWORD env var not set' });
  const password = String(req.headers['x-admin-password'] ?? '').trim();
  if (!password || password !== adminPw.trim()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return res.status(500).json({
      error:
        'RESEND_API_KEY not set — create a key at resend.com and add it to the catch-the-ai Vercel env, then redeploy.',
    });
  }

  const body = (req.body ?? {}) as {
    segment?: unknown;
    subject?: unknown;
    body?: unknown;
    testEmail?: unknown;
    replyTo?: unknown;
  };
  const segment = typeof body.segment === 'string' ? body.segment : '';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  const testEmail = typeof body.testEmail === 'string' ? body.testEmail.trim() : '';
  const replyTo =
    typeof body.replyTo === 'string' && EMAIL_RE.test(body.replyTo.trim())
      ? body.replyTo.trim()
      : undefined;

  if (!subject || subject.length > 200) return res.status(400).json({ error: 'subject required (≤200 chars)' });
  if (!text || text.length > 20000) return res.status(400).json({ error: 'body required (≤20k chars)' });

  const recipients = await resolveRecipients(segment, testEmail);
  if (!Array.isArray(recipients)) return res.status(400).json({ error: recipients.error });
  if (recipients.length === 0) return res.status(400).json({ error: 'segment resolved to 0 recipients' });
  if (recipients.length > MAX_RECIPIENTS) {
    return res.status(400).json({ error: `refusing to send to ${recipients.length} (>${MAX_RECIPIENTS})` });
  }

  const html = renderHtml(text);
  const messages = recipients.map((to) => ({
    from: FROM,
    to: [to],
    subject,
    html,
    text: `${text}\n\n—\nYou're getting this because you signed up at playwithprompts.com or rameshnuti.com. Reply "unsubscribe" to stop.`,
    ...(replyTo ? { reply_to: replyTo } : {}),
  }));

  let sent = 0;
  const failures: string[] = [];
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    try {
      const resp = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk),
      });
      if (resp.ok) {
        sent += chunk.length;
      } else {
        const detail = (await resp.text()).slice(0, 200);
        failures.push(`batch ${i / 100 + 1}: ${resp.status} ${detail}`);
      }
    } catch (err) {
      failures.push(`batch ${i / 100 + 1}: ${err instanceof Error ? err.message : 'network error'}`);
    }
    // Resend rate limit is friendly to sequential batches; brief pause anyway.
    if (i + 100 < messages.length) await new Promise((r) => setTimeout(r, 600));
  }

  // Audit trail — never blocks the response.
  void sb('/rest/v1/catch_events', {
    method: 'POST',
    body: JSON.stringify({
      event_type: 'email_blast',
      player_id: 'admin',
      meta: { segment, subject, recipients: recipients.length, sent, failures: failures.length },
    }),
  });

  return res.status(200).json({ sent, total: recipients.length, failures });
}
