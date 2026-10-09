// Server-only: Resend-backed email rate alerts.
//
// Storage design (v1, no database on Vercel): Resend Audiences holds one
// contact per email. Alert params are encoded in the contact's name fields
// (first_name = base code, last_name = "TARGET|direction|targetRate") because
// Resend contacts have no custom-metadata fields. One active alert per email;
// firing sets unsubscribed=true (one-shot, same semantics as the in-app
// push alerts). Re-subscribing re-arms.
//
// Needs on Vercel: RESEND_API_KEY, CRON_SECRET, and a verified sending
// domain in Resend (DNS). The audience is auto-created on first use.

const API = 'https://api.resend.com';
const AUDIENCE_NAME = 'moneyrate-alerts';

function apiKey(): string {
  const k = process.env.RESEND_API_KEY;
  if (!k) throw new Error('RESEND_API_KEY is not set');
  return k;
}

async function resend(path: string, method: string, body?: unknown) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

export interface EmailAlert {
  base: string; // 3-letter, uppercase
  target: string; // 3-letter, uppercase
  direction: 'above' | 'below';
  targetRate: number;
}

export function encodeAlert(a: EmailAlert): { first_name: string; last_name: string } {
  return {
    first_name: a.base.toUpperCase(),
    last_name: `${a.target.toUpperCase()}|${a.direction}|${a.targetRate}`,
  };
}

export function decodeAlert(firstName: string, lastName: string): EmailAlert | null {
  // first_name holds the base code; last_name holds "TARGET|direction|rate"
  if (!/^[A-Za-z]{2,6}$/.test(firstName || '')) return null;
  const parts = String(lastName || '').split('|');
  if (parts.length !== 3) return null;
  const [target, direction, rateStr] = parts;
  const rate = parseFloat(rateStr);
  if (!/^[A-Za-z]{2,6}$/.test(target) || (direction !== 'above' && direction !== 'below') || !(rate > 0)) {
    return null;
  }
  return { base: firstName.toUpperCase(), target: target.toUpperCase(), direction: direction as 'above' | 'below', targetRate: rate };
}

export async function getOrCreateAudienceId(): Promise<string> {
  const list = await resend('/audiences', 'GET');
  const found = list.json?.data?.find?.((a: { name: string }) => a.name === AUDIENCE_NAME);
  if (found?.id) return found.id;
  const created = await resend('/audiences', 'POST', { name: AUDIENCE_NAME });
  if (!created.ok || !created.json?.id) {
    throw new Error(`Could not create Resend audience (status ${created.status})`);
  }
  return created.json.id;
}

export async function getContact(audienceId: string, email: string) {
  const r = await resend(`/audiences/${audienceId}/contacts/${encodeURIComponent(email)}`, 'GET');
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Resend contact lookup failed (status ${r.status})`);
  return r.json as { id: string; email: string; unsubscribed: boolean; first_name?: string; last_name?: string } | null;
}

export async function upsertContact(
  audienceId: string,
  email: string,
  alert: EmailAlert,
  unsubscribed: boolean
) {
  const existing = await getContact(audienceId, email);
  const { first_name, last_name } = encodeAlert(alert);
  if (existing) {
    const r = await resend(`/audiences/${audienceId}/contacts/${existing.id}`, 'PATCH', {
      first_name,
      last_name,
      unsubscribed,
    });
    if (!r.ok) throw new Error(`Resend contact update failed (status ${r.status})`);
    return r.json;
  }
  const r = await resend(`/audiences/${audienceId}/contacts`, 'POST', {
    email,
    first_name,
    last_name,
    unsubscribed,
  });
  if (!r.ok) throw new Error(`Resend contact create failed (status ${r.status}): ${JSON.stringify(r.json).slice(0, 200)}`);
  return r.json;
}

export async function listContacts(audienceId: string) {
  const out: { id: string; email: string; unsubscribed: boolean; first_name?: string; last_name?: string }[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 50; page++) {
    const q = cursor ? `?limit=100&after=${cursor}` : '?limit=100';
    const r = await resend(`/audiences/${audienceId}/contacts${q}`, 'GET');
    if (!r.ok) throw new Error(`Resend contact list failed (status ${r.status})`);
    const data = r.json?.data ?? [];
    out.push(...data);
    cursor = r.json?.pagination?.after;
    if (!cursor || data.length === 0) break;
  }
  return out;
}

export function fromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || 'MoneyRate <alerts@moneyrate.lol>';
}

export async function sendEmail(to: string, subject: string, html: string) {
  const r = await resend('/emails', 'POST', {
    from: fromEmail(),
    to: [to],
    subject,
    html,
  });
  if (!r.ok) throw new Error(`Resend send failed (status ${r.status}): ${JSON.stringify(r.json).slice(0, 200)}`);
  return r.json;
}
