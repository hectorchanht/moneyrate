import { NextResponse } from 'next/server';
import { FRANKFURTER_API_BASE } from '@/lib/api';
import { getFrankfurterPairRate } from '@/lib/fxRates';
import { resolveTier } from '@/lib/license';
import {
  FREE_DAILY_LIMIT,
  PAID_DAILY_LIMIT,
  checkLimit,
  clientIp,
  rateHeaders,
} from '@/lib/rateLimit';

// GET /api/convert?from=USD&to=HKD&amount=1[&license_key=...]
// Freemium currency-conversion API. Server-side fetch from the same upstreams
// the site uses (Frankfurter v2 primary, fawazahmed0/currency-api fallback —
// both free, no key), so no keys leak. The success body reports which source
// answered in `source` ("frankfurter" | "currency-api").
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

  let rate: number | null = null;
  let rateDate = '';
  let source: 'frankfurter' | 'currency-api' | null = null;

  // Primary: the cached Frankfurter daily table (src/lib/fxRates.ts). The
  // rates are a daily fixing, so repeat conversions are resolved from the
  // server-side Data Cache instead of paying an upstream call per request.
  const fromTable = await getFrankfurterPairRate(from, to);
  if (fromTable) {
    rate = fromTable.rate;
    rateDate = fromTable.rateDate;
    source = 'frankfurter';
  }

  // Frankfurter per-pair endpoint: codes the table lacks, or a failed
  // table fetch.
  if (rate === null) {
    try {
      const res = await fetch(`${FRANKFURTER_API_BASE}/v2/rate/${from}/${to}`, {
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        const json = await res.json();
        if (json && typeof json.rate === 'number' && Number.isFinite(json.rate)) {
          rate = json.rate;
          rateDate = typeof json.date === 'string' ? json.date : '';
          source = 'frankfurter';
        }
      }
    } catch {
      /* fall back to currency-api */
    }
  }

  // Fallback: currency-api full table for the base (pages.dev, then jsdelivr).
  if (rate === null) {
    const base = from.toLowerCase();
    const urls = [
      `https://latest.currency-api.pages.dev/v1/currencies/${base}.json`,
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${base}.json`,
    ];
    let table: Record<string, number> | null = null;
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
    if (table && typeof table[to.toLowerCase()] === 'number') {
      rate = table[to.toLowerCase()];
      source = 'currency-api';
    }
  }

  if (rate === null) {
    return NextResponse.json(
      { error: `No rate available for ${from}→${to}.` },
      { status: 404, headers: rateHeaders(limit, remaining, tier) }
    );
  }

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
      source,
      timestamp: new Date().toISOString(),
      tier,
    },
    {
      headers: {
        ...rateHeaders(limit, remaining, tier),
        // The body is a daily fixing: shared caches (the CDN in front of
        // this function) may serve the identical URL for an hour and
        // revalidate in the background for a day, so repeat conversions
        // never reach the function at all. max-age keeps the previous
        // browser-side behaviour unchanged.
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  );
}
