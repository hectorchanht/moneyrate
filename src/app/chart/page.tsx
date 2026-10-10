"use client";

import { useEffect, useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import useSWR from 'swr';
import { showASCIIArt } from '@/lib/fns';
import { track } from '@/lib/analytics';
import { BackSvg, DownloadSvg, ReverseSvg } from '@/lib/svgs';
import { fetcher } from '@/lib/api';

// Define the type for the data items
interface DataItem {
  date: string;
  timestamp: number;
  value: number; // Add other properties as needed
}

// Define the type for the response data
interface ResponseData {
  title: string; // Add title property
  data: DataItem[]; // Existing data property
}

const CurrencyChart = () => {
  const [q, setQ] = useState<string | null>(null);
  const [startTimestamp, setStartTimestamp] = useState<number>(0);
  const [endTimestamp, setEndTimestamp] = useState<number>(0);
  const [triedReverse, setTriedReverse] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQ(params.get('q')?.toUpperCase() || null);

    showASCIIArt();
  }, []);

  const { data, error } = useSWR<ResponseData>(q ? `/api/currencyChart?q=${encodeURIComponent(q)}` : null, fetcher, { keepPreviousData: true, revalidateOnFocus: false });

  // If a pair has no data, try the reversed pair once (e.g. USD-BTC -> BTC-USD).
  useEffect(() => {
    if (error && q && !triedReverse) {
      const [target, base] = q.split('-');
      if (target && base) {
        setTriedReverse(true);
        setQ(`${base}-${target}`);
        setStartTimestamp(0);
        setEndTimestamp(0);
      }
    }
  }, [error, q, triedReverse]);

  // Reset slider bounds whenever a new dataset arrives (fixes stale bounds when `q` changes,
  // and avoids the setState-during-render anti-pattern).
  useEffect(() => {
    if (data?.data && data.data.length > 0) {
      setStartTimestamp(data.data[0].timestamp);
      setEndTimestamp(data.data[data.data.length - 1].timestamp);
    }
  }, [data]);

  const filteredData = useMemo(() => {
    return data?.data.filter((item: DataItem) => item.timestamp >= startTimestamp && item.timestamp <= endTimestamp) || [];
  }, [data?.data, startTimestamp, endTimestamp]);

  // Zoom the y-axis to the visible data range (plus a small pad) so the line
  // uses the full chart height — recharts' default YAxis domain starts at 0,
  // which squashed e.g. CAD→HKD into a thin band (seen live 2026-10-08).
  // Recomputes on filteredData so the range-slider zoom stays maximal too.
  // Dots render only for sparse ranges; with hundreds of points they merge
  // into a useless blob.
  const [yDomain, showDots] = useMemo<[[number, number], boolean]>(() => {
    const vals = filteredData.map((d: DataItem) => d.value).filter((v) => Number.isFinite(v));
    if (!vals.length) return [[0, 1], true];
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const span = hi - lo;
    const pad = span > 0 ? span * 0.08 : (Math.abs(hi) * 0.05 || 1);
    return [[lo - pad, hi + pad], vals.length < 60];
  }, [filteredData]);

  // Function to format numbers in scientific notation
  const scientificFormat = (number: number) => {
    const parts = number.toString().split('.');
    if (number === 0) return '0';
    if (parts.length > 1 && parts[1].length > 3) {
      return parseFloat(number.toFixed(3));
    }
    if (number > 0.001 && number < 1000) return number;
    return new Intl.NumberFormat('en-US', { notation: 'scientific' }).format(number);
  }

  // Y-axis ticks render with 0 decimal places (Hector 2026-10-09) when the
  // visible range reaches 10 — below that, decimals are kept so small pairs
  // (EUR→CHF ≈0.95) don't collapse into 0s and 1s. Decided from the range,
  // not per tick, so one axis never mixes "22" with "8.874" (seen live
  // 2026-10-10 — the per-tick <10 guard did exactly that). Extreme
  // magnitudes keep scientific notation either way.
  const useIntegerTicks = yDomain[1] >= 10;
  const yTickFormat = (value: number) => {
    const a = Math.abs(value);
    if (a !== 0 && (a >= 1e15 || a < 0.001)) return scientificFormat(value).toString();
    if (!useIntegerTicks) return scientificFormat(value).toString();
    return Math.round(value).toString();
  };

  // Y-axis width from the longest formatted label: the old fixed 40px clipped
  // 7-char labels like "493.432" at the viewport edge (seen live 2026-10-09).
  // ~6.2px per tabular-numeral char at 10px + 8px gutter, capped so a freak
  // value can't eat the chart.
  const yAxisWidth = useMemo(() => {
    const maxLen = filteredData.reduce((m, d) => Math.max(m, yTickFormat(d.value).length), 6);
    return Math.min(72, Math.ceil(maxLen * 6.2 + 8));
  }, [filteredData]);

  if (!!error && triedReverse) return <div className="text-center">No data for {q}</div>;
  if (!data || !q) {
    return (
      <div className="flex flex-col items-center justify-flex-start h-dvh pt-[30px]">
        <div className='flex gap-4 items-center mb-[20px] h-[32px]'>
          <div className="skeleton h-[24px] w-[24px] shrink-0 rounded-full" />
          <div className="skeleton h-[32px] w-[240px] rounded-none"></div>
          <div className="skeleton h-[24px] w-[24px] shrink-0 rounded-full" />
        </div>

        <div className="skeleton h-[20px] w-[258px] mb-[30px] rounded-none"></div>
        <div style={{ width: 'calc( 100vw - 40px )' }} className="skeleton rounded-none h-[70%]"></div>
      </div>
    );
  }

  const exportToCSV = () => {
    const csvRows = [
      ['Date', 'Timestamp', 'Value'], // Header row
      ...data?.data.map(item => [item?.date, item?.timestamp, item?.value]) // Data rows
    ];

    const csvString = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = data?.title + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Zoom the visible window to the last N years (0 = all). Data is monthly.
  const applyRange = (years: number) => {
    if (!data?.data?.length) return;
    const first = data.data[0].timestamp;
    const last = data.data[data.data.length - 1].timestamp;
    if (years === 0) {
      setStartTimestamp(first);
      setEndTimestamp(last);
      return;
    }
    const cutoff = last - years * 365 * 24 * 60 * 60;
    setStartTimestamp(Math.max(first, cutoff));
    setEndTimestamp(last);
  };
  const rangePresets = [
    { label: '1Y', years: 1 },
    { label: '5Y', years: 5 },
    { label: '10Y', years: 10 },
    { label: 'All', years: 0 },
  ];

  return (
    <div className="w-dvw h-dvh overflow-auto pt-[20px] mx-auto px-2 sm:px-1 md:px-2 text-base-content">
      {/* h-full flex-col: the chart below needs a definite-height ancestor for
          its percentage height — without this the chart collapses to 0. */}
      <div className="max-w-[800px] mx-auto h-full flex flex-col">
      {/* Header: back to converter + pair title + actions. The API title
          ("1 USD = ? CAD") reads like a bug, so the label is built from q. */}
      <div className="flex items-center gap-2 mb-2">
        <a
          href="/"
          aria-label="Back to converter"
          title="Back to converter"
          className="btn btn-ghost btn-sm btn-circle shrink-0"
        >
          <BackSvg className="size-5" />
        </a>
        <h1 className="text-xl font-semibold truncate tabular-nums">
          {q ? q.split('-').join(' → ') : 'Chart'}
        </h1>
        <div className="flex-1" />

        <button type="button" aria-label="Reverse currency pair" title="Reverse currency pair" onClick={() => {
          const parts = (q ?? '').split('-');
          track('pair_swapped', { from: parts[0] ?? '', to: parts[1] ?? '' });
          // Brief delay so the analytics beacon flushes before the redirect.
          setTimeout(() => {
            // redirect to /chart?base-target
            window.location.href = `/chart?q=${encodeURIComponent(`${parts[1]}-${parts[0]}`)}`;
          }, 300);
        }}>
          <ReverseSvg className='cursor-pointer w-[24px] h-[24px]' />
        </button>

        <button type="button" aria-label="Download CSV" title="Download CSV" onClick={exportToCSV}>
          <DownloadSvg className='cursor-pointer w-[24px] h-[24px]' />
        </button>
      </div>

      {/* Range slider for selecting start and end timestamps */}
      <div className="flex justify-center my-4">
        <input
          type="range"
          aria-label="Range start date"
          min={data?.data[0]?.timestamp}
          max={endTimestamp}
          value={startTimestamp}
          onChange={(e) => setStartTimestamp(Number(e.target.value))}
          className="slider"
        />
        <input
          type="range"
          aria-label="Range end date"
          min={startTimestamp}
          max={data?.data[data?.data.length - 1]?.timestamp}
          value={endTimestamp}
          onChange={(e) => setEndTimestamp(Number(e.target.value))}
          className="slider"
        />
      </div>

      <div className="flex justify-center gap-2 mb-4">
        {rangePresets.map(({ label, years }) => (
          <button key={label} type="button" className="btn btn-sm min-w-[52px]" onClick={() => applyRange(years)}>
            {label}
          </button>
        ))}
      </div>

      {/* Full-bleed: -mx cancels the outer container's px so the chart uses
          every pixel edge to edge (mobile px-2 / sm px-1 / md px-2). */}
      <div className="flex-1 min-h-[300px] -mx-2 sm:-mx-1 md:-mx-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={filteredData} margin={{ top: 8, right: 5, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="4 2 0" />
          {/* minTickGap keeps date labels from colliding on narrow viewports.
              The API ships dates as dd/mm/yyyy (en-GB) — ticks render them as
              dd-mm-yyyy. */}
          <XAxis dataKey="date" domain={['dataMin', 'dataMax']} minTickGap={32} tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.replace(/\//g, '-')} />
          {/* YAxis width 40 (not 56): labels are ≤6 chars, so the chart starts
              as far left as possible with minimum empty gutter. Width is
              computed from the longest formatted label (yAxisWidth) so longer
              values like "493.432" never clip at the viewport edge. */}
          <YAxis domain={yDomain} tickFormatter={(value) => yTickFormat(value)} width={yAxisWidth} tick={{ fontSize: 10 }} />
          <Tooltip labelStyle={{ color: 'black' }} contentStyle={{ background: 'white' }} itemStyle={{ fontWeight: '700', color: 'black' }} formatter={(value) => [value]} />
          <Line type="monotone" dataKey="value" stroke="currentColor" isAnimationActive={false} dot={showDots} />
        </LineChart>
      </ResponsiveContainer>
      </div>
      </div>
    </div>
  );
};

export default CurrencyChart;

