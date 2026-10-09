import { NextResponse } from 'next/server';
import { resolveTier } from '@/lib/license';
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
// Sanity cap: above this, amount * rate overflows to Infinity and the JSON
// body ships result: null. 1e15 is far beyond any real conversion.
const MAX_AMOUNT = 1e15;

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
  if (!isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    return NextResponse.json({ error: `'amount' must be a positive number up to ${MAX_AMOUNT.toLocaleString()}.` }, { status: 400 });
  }

  const ip = clientIp(request);

  // Tier: paid only with a valid Gumroad license key; invalid keys fall back
  // to free silently (friendly API, no hard error). Shared with /api/license.
  const tier = await resolveTier(licenseKey, ip);
  const limit = tier === 'paid' ? PAID_DAILY_LIMIT : FREE_DAILY_LIMIT;

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
  const result = amount * rate;
  if (!isFinite(result)) {
    return NextResponse.json(
      { error: 'Conversion overflowed — try a smaller amount.' },
      { status: 502, headers: rateHeaders(limit, remaining, tier) }
    );
  }
  return NextResponse.json(
    {
      from,
      to,
      amount,
      rate,
      result,
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
