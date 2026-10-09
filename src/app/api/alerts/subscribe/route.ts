import { NextResponse } from 'next/server';
import {
  decodeAlert,
  getContact,
  getOrCreateAudienceId,
  sendEmail,
  upsertContact,
  type EmailAlert,
} from '@/lib/alerts-mail';
import { checkLimit, clientIp, rateHeaders } from '@/lib/rateLimit';

// POST /api/alerts/subscribe
// Body: { email, base, target, direction: "above"|"below", target_rate }
// One active email alert per address (v1 — the address list IS the product).
// Firing is one-shot; resubscribing re-arms.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CODE_RE = /^[A-Za-z]{2,6}$/;
const SUBSCRIBE_DAILY_LIMIT = 10;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Send a JSON body.' }, { status: 400 });
  }

  const email = String(body.email || '').trim().toLowerCase();
  const base = String(body.base || '').toUpperCase();
  const target = String(body.target || '').toUpperCase();
  const direction = String(body.direction || '');
  const targetRate = parseFloat(String(body.target_rate ?? ''));

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Provide a valid email address.' }, { status: 400 });
  }
  if (!CODE_RE.test(base) || !CODE_RE.test(target) || base === target) {
    return NextResponse.json({ error: 'Provide different 2-6 letter currency codes.' }, { status: 400 });
  }
  if (direction !== 'above' && direction !== 'below') {
    return NextResponse.json({ error: 'direction must be "above" or "below".' }, { status: 400 });
  }
  if (!(targetRate > 0) || !Number.isFinite(targetRate)) {
    return NextResponse.json({ error: 'target_rate must be a positive number.' }, { status: 400 });
  }

  const ip = clientIp(request);
  const { allowed, remaining } = checkLimit('alertsub:' + ip, SUBSCRIBE_DAILY_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many signups (${SUBSCRIBE_DAILY_LIMIT}/day/IP). Try again tomorrow.` },
      { status: 429, headers: rateHeaders(SUBSCRIBE_DAILY_LIMIT, 0, 'free') }
    );
  }

  const alert: EmailAlert = { base, target, direction, targetRate };

  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Email alerts are not configured yet. Try the in-app alerts instead.' },
        { status: 503 }
      );
    }
    const audienceId = await getOrCreateAudienceId();
    const existing = await getContact(audienceId, email);
    if (existing && !existing.unsubscribed) {
      const cur = decodeAlert(existing.first_name || '', existing.last_name || '');
      return NextResponse.json(
        {
          error: 'This email already has an active alert.',
          active: cur,
          hint: 'Wait for it to fire, or ask to be re-armed after it triggers.',
        },
        { status: 409 }
      );
    }
    await upsertContact(audienceId, email, alert, false);

    const arrow = direction === 'above' ? '≥' : '≤';
    await sendEmail(
      email,
      `Alert set: 1 ${base} ${arrow} ${targetRate} ${target}`,
      `<p>You're on the list. We'll email you once when <strong>1 ${base} ${arrow} ${targetRate} ${target}</strong>.</p>
       <p style="color:#888;font-size:12px">One-shot alert — it fires once, then stops. Set a new one anytime at <a href="https://moneyrate.lol">moneyrate.lol</a>.</p>`
    );

    return NextResponse.json(
      { ok: true, alert },
      { headers: rateHeaders(SUBSCRIBE_DAILY_LIMIT, remaining, 'free') }
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Subscription failed.' },
      { status: 502 }
    );
  }
}
