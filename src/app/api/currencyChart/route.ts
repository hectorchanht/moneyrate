import { NextResponse } from 'next/server';
import {
  CHART_DAILY_LIMIT,
  checkLimit,
  clientIp,
  rateHeaders,
} from '@/lib/rateLimit';

// Accept [targetCur]-[baseCur] with 2-6 letter codes (covers fiat + crypto like BTC, USDT).
const RATEPAIR_RE = /^[A-Za-z]{2,6}-[A-Za-z]{2,6}$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ratepair = searchParams.get('q'); // it is [targetCur]-[baseCur]
  // no need to have start end as data display will be filter in front end

  if (!ratepair) {
    return NextResponse.json(
      { error: `Please provide a query parameter 'q' (e.g., /api/currencyChart?q=USD-CAD) to get the currency chart data.` },
      { status: 400 }
    ); // User-friendly error message
  }

  if (!RATEPAIR_RE.test(ratepair)) {
    return NextResponse.json(
      { error: `Invalid 'q' format. Expected [targetCur]-[baseCur], e.g. USD-CAD.` },
      { status: 400 }
    );
  }

  const
    targetCur = ratepair.split('-')[0].toUpperCase(),
    baseCur = ratepair.split('-')[1].toUpperCase();
  let data, is_flip = false;

  // Abuse brake: this proxy fans out to Yahoo (up to 3 fetches per call), so
  // it gets its own per-IP daily budget — without it anyone could burn
  // Yahoo's patience for our egress IP and kill charts for every user.
  const ip = clientIp(request);
  const { allowed, remaining } = checkLimit(ip, CHART_DAILY_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: `Chart rate limit reached (${CHART_DAILY_LIMIT} requests/day/IP). Try again tomorrow.` },
      { status: 429, headers: rateHeaders(CHART_DAILY_LIMIT, 0, 'free') }
    );
  }

  const yahooHost = process.env.YAHOO_FINANCE_HOST || 'query1.finance.yahoo.com';
  const getApiUri = (pair: string) => {
    // Yahoo expects period2 in SECONDS; +new Date() is milliseconds and only
    // works today because Yahoo clamps future timestamps.
    return `https://${yahooHost}/v8/finance/chart/${pair}?period1=0&period2=${Math.floor(Date.now() / 1000)}&interval=1mo&includePrePost=true`;
  }

  // Fetch a single ticker shape; return the parsed body only if it carries a valid result.
  const tryFetch = async (pair: string) => {
    try {
      // A User-Agent is required: UA-less requests from serverless egress get
      // empty 200 bodies from Yahoo; a browser UA returns the real payload.
      const res = await fetch(getApiUri(pair), {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; moneyrate/1.0; +https://moneyrate.lol)' },
      });
      const json = await res.json();
      return json?.chart?.result?.[0] ? json : null;
    } catch {
      return null;
    }
  };

  // Sequential fallback (fiat -> crypto -> crypto flipped). Typical fiat case = 1 external call
  // instead of always firing 3.
  data = await tryFetch(ratepair.replace('-', '') + '=X');
  if (!data) data = await tryFetch(ratepair);
  if (!data) {
    const flipped = await tryFetch(baseCur + '-' + targetCur);
    if (flipped) { data = flipped; is_flip = true; }
  }

  const result = data?.chart?.result?.[0];
  const timestamp = result?.timestamp;
  const close = result?.indicators?.quote?.[0]?.close;

  if (!result || !Array.isArray(timestamp) || !Array.isArray(close)) {
    return NextResponse.json(
      { error: `No chart data available for '${targetCur}-${baseCur}'. The pair may be unsupported or the data source is temporarily unavailable.` },
      { status: 404 }
    );
  }

  // Yahoo emits null closes for some tickers; a flipped null becomes
  // Infinity and breaks the recharts scale — drop non-finite points.
  const chartData = timestamp
    .map((t: number, i: number) => {
      const raw = close[i];
      const value = raw == null ? NaN : is_flip ? 1 / raw : raw;
      return {
        date: new Intl.DateTimeFormat('en-GB').format(new Date(t * 1000)), // Format timestamp to dd/mm/yyyy
        value,
        timestamp: t,
      };
    })
    .filter((p) => Number.isFinite(p.value));

  if (chartData.length === 0) {
    return NextResponse.json(
      { error: `No usable chart data for '${targetCur}-${baseCur}'. The data source returned only empty points.` },
      { status: 404, headers: rateHeaders(CHART_DAILY_LIMIT, remaining, 'free') }
    );
  }

  return NextResponse.json(
    { data: chartData, title: `1 ${targetCur} = ? ${baseCur}` },
    {
      headers: {
        ...rateHeaders(CHART_DAILY_LIMIT, remaining, 'free'),
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    }
  );
}
