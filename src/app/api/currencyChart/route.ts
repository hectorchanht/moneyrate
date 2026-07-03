import { NextResponse } from 'next/server';

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

  const getApiUri = (pair: string) => {
    return `https://query1.finance.yahoo.com/v8/finance/chart/${pair}?period1=0&period2=${+new Date()}&interval=1mo&includePrePost=true`;
  }

  // Fetch a single ticker shape; return the parsed body only if it carries a valid result.
  const tryFetch = async (pair: string) => {
    try {
      const res = await fetch(getApiUri(pair));
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

  const chartData = timestamp.map((t: number, i: number) => ({
    date: new Intl.DateTimeFormat('en-GB').format(new Date(t * 1000)), // Format timestamp to dd/mm/yyyy
    value: is_flip ? (1 / close[i]) : close[i],
    timestamp: t,
  }));

  return NextResponse.json(
    { data: chartData, title: `1 ${targetCur} = ? ${baseCur}` },
    { headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' } }
  );
}
