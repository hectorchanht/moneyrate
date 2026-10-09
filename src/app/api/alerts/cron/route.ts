import { NextResponse } from 'next/server';
import {
  decodeAlert,
  getOrCreateAudienceId,
  listContacts,
  sendEmail,
  upsertContact,
} from '@/lib/alerts-mail';

// GET /api/alerts/cron — runs daily via Vercel Cron (see vercel.json).
// Vercel sends `Authorization: Bearer $CRON_SECRET` automatically when
// CRON_SECRET is set; anything else is rejected.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY is not set.' }, { status: 503 });
  }

  const audienceId = await getOrCreateAudienceId();
  const contacts = await listContacts(audienceId);
  const active = contacts.filter((c) => !c.unsubscribed);

  let fired = 0;
  const errors: string[] = [];

  // Rates come from the same free upstream as /api/convert — no key needed.
  const rateCache = new Map<string, number>();
  async function rate(base: string, target: string): Promise<number | null> {
    const key = `${base}>${target}`;
    if (rateCache.has(key)) return rateCache.get(key)!;
    const b = base.toLowerCase();
    for (const u of [
      `https://latest.currency-api.pages.dev/v1/currencies/${b}.json`,
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${b}.json`,
    ]) {
      try {
        const res = await fetch(u, { next: { revalidate: 3600 } });
        if (!res.ok) continue;
        const json = await res.json();
        const r = json?.[b]?.[target.toLowerCase()];
        if (typeof r === 'number' && Number.isFinite(r)) {
          rateCache.set(key, r);
          return r;
        }
      } catch {
        /* try next mirror */
      }
    }
    return null;
  }

  for (const c of active) {
    const alert = decodeAlert(c.first_name || '', c.last_name || '');
    if (!alert) continue;
    try {
      const r = await rate(alert.base, alert.target);
      if (r === null) continue;
      const hit = alert.direction === 'above' ? r >= alert.targetRate : r <= alert.targetRate;
      if (!hit) continue;

      const arrow = alert.direction === 'above' ? '≥' : '≤';
      await sendEmail(
        c.email,
        `💱 1 ${alert.base} ${arrow} ${alert.targetRate} ${alert.target} — target hit`,
        `<p><strong>1 ${alert.base} = ${r} ${alert.target}</strong> — your alert
         (<strong>1 ${alert.base} ${arrow} ${alert.targetRate} ${alert.target}</strong>) just triggered.</p>
         <p><a href="https://moneyrate.lol/?base=${alert.base.toLowerCase()}&amount=1&show=${alert.base.toLowerCase()},${alert.target.toLowerCase()}">Open the converter</a></p>
         <p style="color:#888;font-size:12px">One-shot alert — this was its only firing. Set a new one anytime at
         <a href="https://moneyrate.lol">moneyrate.lol</a>.</p>`
      );
      // One-shot: mark fired so it never emails again.
      await upsertContact(audienceId, c.email, alert, true);
      fired++;
    } catch (e) {
      errors.push(`${c.email}: ${e instanceof Error ? e.message : 'failed'}`);
    }
  }

  // Keep the cron response small; per-contact errors are enough to debug.
  return NextResponse.json({ checked: active.length, fired, errors: errors.slice(0, 10) });
}

// Vercel Cron only sends GET, but be explicit that nothing else runs here.
export async function POST() {
  return NextResponse.json({ error: 'Use GET (Vercel Cron).' }, { status: 405 });
}
