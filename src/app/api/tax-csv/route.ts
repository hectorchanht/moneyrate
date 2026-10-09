import { NextResponse } from 'next/server';
import { resolveTier } from '@/lib/license';
import {
  TAXCSV_DAILY_LIMIT,
  checkLimit,
  clientIp,
  rateHeaders,
} from '@/lib/rateLimit';

// GET /api/tax-csv?base=USD&year=2025[&key=...]
// Annual FX averages for tax filing — works for every country's tax year,
// not just one jurisdiction. Monthly average + annual average rows for the
// base currency against 24 majors, as a downloadable CSV.
//
// Freemium: the current year is free; historical years (2020+) need a Pro
// license key (?key=). Past-year data never changes, so it's cached
// immutably; the current year refreshes hourly.

const CODE_RE = /^[A-Za-z]{3}$/;
const MIN_YEAR = 2020;

// Major fiat targets vs the base. Yahoo tickers are {TARGET}{BASE}=X
// (e.g. EURUSD=X); we invert to get base->target.
const TARGETS = [
  'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'HKD', 'INR', 'SGD',
  'NZD', 'MXN', 'BRL', 'KRW', 'TWD', 'THB', 'MYR', 'IDR', 'PHP', 'ZAR',
  'SEK', 'NOK', 'DKK', 'AED',
];

const UA = 'Mozilla/5.0 (compatible; moneyrate/1.0; +https://moneyrate.lol)';

// Daily closes for a Yahoo ticker within [t1, t2) as [timestampSec, close][].
async function dailyCloses(ticker: string, t1: number, t2: number): Promise<[number, number][]> {
  const host = process.env.YAHOO_FINANCE_HOST || 'query1.finance.yahoo.com';
  try {
    const res = await fetch(
      `https://${host}/v8/finance/chart/${ticker}?period1=${t1}&period2=${t2}&interval=1d`,
      { headers: { 'User-Agent': UA } }
    );
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    const ts: number[] = result?.timestamp;
    const close: (number | null)[] = result?.indicators?.quote?.[0]?.close;
    if (!Array.isArray(ts) || !Array.isArray(close)) return [];
    const out: [number, number][] = [];
    for (let i = 0; i < ts.length; i++) {
      const c = close[i];
      if (typeof c === 'number' && Number.isFinite(c) && c > 0) out.push([ts[i], c]);
    }
    return out;
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const base = (searchParams.get('base') || 'USD').toUpperCase();
  const year = parseInt(searchParams.get('year') || '', 10);
  const key = (searchParams.get('key') || '').trim();
  const nowYear = new Date().getUTCFullYear();

  if (!CODE_RE.test(base)) {
    return NextResponse.json({ error: "Provide 'base' as a 3-letter code, e.g. /api/tax-csv?base=USD&year=2025." }, { status: 400 });
  }
  const y = Number.isFinite(year) ? year : nowYear;
  if (y < MIN_YEAR || y > nowYear) {
    return NextResponse.json({ error: `'year' must be between ${MIN_YEAR} and ${nowYear}.` }, { status: 400 });
  }

  const ip = clientIp(request);
  const { allowed, remaining } = checkLimit('taxcsv:' + ip, TAXCSV_DAILY_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: `Tax-CSV limit reached (${TAXCSV_DAILY_LIMIT} requests/day/IP).` },
      { status: 429, headers: rateHeaders(TAXCSV_DAILY_LIMIT, 0, 'free') }
    );
  }

  // Historical years are a Pro feature; the current year is free.
  const tier = await resolveTier(key, ip);
  if (y !== nowYear && tier !== 'paid') {
    return NextResponse.json(
      {
        error: `Historical years need a Pro license key (?key=). The current year (${nowYear}) is free.`,
        upgrade: 'https://moneyrate.lol/api-docs#pro',
      },
      { status: 402, headers: rateHeaders(TAXCSV_DAILY_LIMIT, remaining, 'free') }
    );
  }

  const t1 = Math.floor(Date.UTC(y, 0, 1) / 1000);
  const t2 = Math.floor(Date.UTC(y + 1, 0, 1) / 1000);
  const targets = TARGETS.filter((t) => t !== base);

  // One Yahoo fetch per target, in parallel. Inverted: ticker is TARGET-BASE.
  const series = await Promise.all(
    targets.map(async (t) => {
      const closes = await dailyCloses(`${t}${base}=X`, t1, t2);
      return { target: t, closes: closes.map(([ts, c]) => [ts, 1 / c] as [number, number]) };
    })
  );

  // Month index 0..11 -> closes; then averages.
  const months: string[] = Array.from({ length: 12 }, (_, m) =>
    `${y}-${String(m + 1).padStart(2, '0')}`
  );
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
  const fmt = (n: number) => (Number.isFinite(n) ? n.toPrecision(6) : '');

  const rows: string[][] = [];
  const annual: number[][] = targets.map(() => []);
  for (let m = 0; m < 12; m++) {
    const row = [months[m]];
    series.forEach(({ closes }, ci) => {
      const vals = closes.filter(([ts]) => new Date(ts * 1000).getUTCMonth() === m).map(([, c]) => c);
      annual[ci].push(...vals);
      row.push(fmt(avg(vals)));
    });
    rows.push(row);
  }
  rows.push(['Annual average', ...annual.map((vals) => fmt(avg(vals)))]);

  const header = ['Month', ...targets];
  const csv = [header, ...rows].map((r) => r.join(',')).join('\n') + '\n';

  const immutable = y !== nowYear;
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="moneyrate-${base.toLowerCase()}-${y}.csv"`,
      'Cache-Control': immutable
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=3600, stale-while-revalidate=86400',
      ...rateHeaders(TAXCSV_DAILY_LIMIT, remaining, tier),
    },
  });
}
