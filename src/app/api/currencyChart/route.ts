import { NextResponse } from 'next/server';


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ratepair = searchParams.get('q');

  if (!ratepair) {
    return NextResponse.json({ error: 'Please provide a query parameter "q" (e.g., /currencyChart/q=USDCAD) to get the currency data.' }); // User-friendly error message
  }


  // // mtfxgroup have less data point
  // const response = await fetch(`https://www.mtfxgroup.com/api/rates/getHistoricalData/?ratepair=${ratepair}`);
  // const data = await response.json();
  // const parse = (data: [number, number][]) => data.map(([timestamp, value]) => ({
  //   time: new Date(timestamp).toLocaleDateString(), // Format timestamp for X-axis
  //   value,
  // }));
  // data.Daily = parse(data?.DailyData);
  // data.Weekly = parse(data?.WeeklyData);
  // data.All = parse(data?.AllData);

  let data, response;

  response = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${ratepair.replace('-', '')}=X?period1=0&period2=${+ new Date()}&interval=1wk&includePrePost=true`);

  data = await response.json();


  if (!data?.chart?.result) {
    response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ratepair}?period1=0&period2=${+ new Date()}&interval=1wk&includePrePost=true`);

    data = await response.json();
  }


  const { timestamp, indicators } = data?.chart?.result?.[0];
  const { close } = indicators?.quote?.[0];

  return NextResponse.json(timestamp.map((t: number, i: number) => ({
    time: new Intl.DateTimeFormat('en-GB').format(new Date(t * 1000)), // Format timestamp to dd/mm/yyyy
    value: close[i]
  })));
} 