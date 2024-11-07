import { NextResponse } from 'next/server';

// // mtfxgroup have less data point so it get replaced
// const response = await fetch(`https://www.mtfxgroup.com/api/rates/getHistoricalData/?ratepair=${ratepair}`);
// const data = await response.json();
// const parse = (data: [number, number][]) => data.map(([timestamp, value]) => ({
//   time: new Date(timestamp).toLocaleDateString(), // Format timestamp for X-axis
//   value,
// }));
// data.Daily = parse(data?.DailyData);
// data.Weekly = parse(data?.WeeklyData);
// data.All = parse(data?.AllData);


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ratepair = searchParams.get('q');
  // const start = searchParams.get('start') ?? 1;
  // const end = searchParams.get('end') ?? + new Date();
  // no need to have start end as data display will be filter in front end

  if (!ratepair) {
    return NextResponse.json({ error: `Please provide a query parameter 'q' (e.g., /currencyChart/q=USD-CAD) to get the currency chart data.` }); // User-friendly error message
  }

  let
    targetCur = ratepair?.split('-')[0].toUpperCase(),
    baseCur = ratepair?.split('-')[1].toUpperCase(),
    data,
    is_flip = false;

  const [r_fiat, r_crypto, r_crypto_usd, r_crypto_flip] = await Promise.all([
    fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${ratepair.replace('-', '')}=X?period1=0&period2=${+ new Date()}&interval=1mo&includePrePost=true`),
    fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ratepair}?period1=0&period2=${+ new Date()}&interval=1mo&includePrePost=true`),
    fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${targetCur + '-' + 'USD'}?period1=0&period2=${+ new Date()}&interval=1mo&includePrePost=true`),
    fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${baseCur + '-' + targetCur}?period1=0&period2=${+ new Date()}&interval=1mo&includePrePost=true`),
  ]);

  const [data_fiat, data_crypto, data_crypto_usd, data_crypto_flip] = await Promise.all([
    r_fiat.json(), r_crypto.json(), r_crypto_usd.json(), r_crypto_flip.json(),
  ]);

  if (data_fiat?.chart?.result?.[0]) {
    data = data_fiat;
  } else if (data_crypto?.chart?.result?.[0]) {
    data = data_crypto;
  } else if (data_crypto_usd?.chart?.result?.[0]) {
    data = data_crypto_usd;
    baseCur = 'USD'
  } else if (data_crypto_flip?.chart?.result?.[0]) {
    data = data_crypto_flip;
    is_flip = true;
  }

  const { timestamp, indicators } = data?.chart?.result?.[0];
  const { close } = indicators?.quote?.[0];

  const chartData = timestamp.map((t: number, i: number) => ({
    date: new Intl.DateTimeFormat('en-GB').format(new Date(t * 1000)), // Format timestamp to dd/mm/yyyy
    value: is_flip ? (1 / close[i]) : close[i],
    timestamp: t,
  }));

  return NextResponse.json({ data: chartData, title: `1 ${targetCur} = ? ${baseCur}` });
} 