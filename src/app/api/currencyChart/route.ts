import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ratepair = searchParams.get('q');

  if (!ratepair) {
    return NextResponse.json({ error: 'Please provide a query parameter "q" (e.g., /currencyChart/q=USDCAD) to get the currency data.' }); // User-friendly error message
  }

  const response = await fetch(`https://www.mtfxgroup.com/api/rates/getHistoricalData/?ratepair=${ratepair}`);
  const data = await response.json();

  const parse = (data: [number, number][]) => data.map(([timestamp, value]) => ({
    time: new Date(timestamp).toLocaleDateString(), // Format timestamp for X-axis
    value,
  }));

  data.Daily = parse(data?.DailyData);
  data.Weekly = parse(data?.WeeklyData);
  data.All = parse(data?.AllData);

  return NextResponse.json(data);
} 