import { NextResponse } from 'next/server';
import {
  FREE_DAILY_LIMIT,
  PAID_DAILY_LIMIT,
  checkLimit,
  clientIp,
  rateHeaders,
} from '@/lib/rateLimit';

// GET /api/convert?from=USD&to=HKD&amount=1[&license_key=...]
// Freemium currency-conversion API. Server-side fetch from the same upstream
// the site uses (fawazahmed0/currency-api — free, no key), so no keys leak.
//
// Tiers:
//   free: 1,000 req/day/IP (no key needed)
//   paid: 100,000 req/day/IP — $5/mo Gumroad product; pass ?license_key=...
//         verified via Gumroad's license API (needs GUMROAD_ACCESS_TOKEN +
//         GUMROAD_PRODUCT_PERMALINK env vars; paid tier is inert until set).

const CODE_RE = /^[A-Za-z]{2,6}$/;

async function verifyGumroadLicense(key: string): Promise<boolean> {
  const token = process.env.GUMROAD_ACCESS_TOKEN;
  const permalink = process.env.GUMROAD_PRODUCT_PERMALINK;
  if (!token || !permalink || !key) return false;
  try {
    const res = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        product_permalink: permalink,
        license_key: key,
        access_token: token,
      }),
    });
    const json = await res.json();
    const p = json?.purchase;
    return json?.success === true && p?.refunded !== true && p?.chargebacked !== true;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = (searchParams.get('from') || '').toUpperCase();
  const to = (searchParams.get('to') || '').toUpperCase();
  const amount = parseFloat(searchParams.get('amount') || '1');
  const licenseKey = searchParams.get('license_key') || '';

  if (!CODE_RE.test(from) || !CODE_RE.test(to)) {
    return NextResponse.json(
      { error: "Provide 'from' and 'to' as 2-6 letter currency codes, e.g. /api/convert?from=USD&to=HKD&amount=1." },
      { status: 400 }
    );
  }
  if (from === to) {
    return NextResponse.json({ error: "'from' and 'to' must differ." }, { status: 400 });
  }
  if (!isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "'amount' must be a positive number." }, { status: 400 });
  }

  // Tier: paid only with a valid Gumroad license key; invalid keys fall back
  // to free silently (friendly API, no hard error).
  let tier: 'free' | 'paid' = 'free';
  if (licenseKey && (await verifyGumroadLicense(licenseKey))) tier = 'paid';
  const limit = tier === 'paid' ? PAID_DAILY_LIMIT : FREE_DAILY_LIMIT;

  const ip = clientIp(request);
  const { allowed, remaining } = checkLimit(ip, limit);
  if (!allowed) {
    return NextResponse.json(
      {
        error: `Daily limit reached (${limit.toLocaleString()} req/day/IP on the ${tier} tier).`,
        upgrade: 'https://moneyrate.lol/api-docs#paid',
      },
      { status: 429, headers: rateHeaders(limit, 0, tier) }
    );
  }

  const base = from.toLowerCase();
  const urls = [
    `https://latest.currency-api.pages.dev/v1/currencies/${base}.json`,
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${base}.json`,
  ];
  let table: Record<string, number> | null = null;
  let rateDate = '';
  for (const u of urls) {
    try {
      const res = await fetch(u, { next: { revalidate: 3600 } });
      if (!res.ok) continue;
      const json = await res.json();
      if (json && typeof json[base] === 'object') {
        table = json[base];
        rateDate = json.date || '';
        break;
      }
    } catch {
      /* try next mirror */
    }
  }

  if (!table || typeof table[to.toLowerCase()] !== 'number') {
    return NextResponse.json(
      { error: `No rate available for ${from}→${to}.` },
      { status: 404, headers: rateHeaders(limit, remaining, tier) }
    );
  }

  const rate = table[to.toLowerCase()];
  return NextResponse.json(
    {
      from,
      to,
      amount,
      rate,
      result: amount * rate,
      rateDate,
      timestamp: new Date().toISOString(),
      tier,
    },
    {
      headers: {
        ...rateHeaders(limit, remaining, tier),
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    }
  );
}
