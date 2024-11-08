"use client";

import { useEffect, useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import useSWR from 'swr';
import { fetcher } from '../api';
import { DownloadSvg, ReverseSvg } from '../svgs';

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQ(params.get('q')?.toUpperCase() || null);
  }, []);

  const { data, error } = useSWR<ResponseData>(q ? `/api/currencyChart?q=${q}` : null, fetcher, { keepPreviousData: true });

  const filteredData = useMemo(() => {
    return data?.data.filter((item: DataItem) => item.timestamp >= startTimestamp && item.timestamp <= endTimestamp) || [];
  }, [data?.data, startTimestamp, endTimestamp]);

  if (!!error) return <div className="text-center">No data for {q}</div>;
  if (!data || !q) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-[20px]">
        <div className='flex gap-4 items-center mb-[20px]'>
          <div className="skeleton h-[24px] w-[24px] shrink-0 rounded-full" />
          <div className="skeleton h-[32px] w-[266px] rounded-none"></div>
          <div className="skeleton h-[24px] w-[24px] shrink-0 rounded-full" />
        </div>

        <div className="skeleton h-[20px] w-[266px] mb-[20px] rounded-none"></div>
        <div style={{ height: 'calc( 70vh - 120px )' }} className="skeleton w-[90vw] rounded-none"></div>
      </div>
    );
  }

  // Set default start and end timestamps based on fetched data
  if (startTimestamp === 0 && data?.data.length > 0) {
    setStartTimestamp(data?.data[0].timestamp);
    setEndTimestamp(data?.data[data?.data.length - 1].timestamp);
  }

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

  return (
    <div className="w-dvw h-dvh overflow-auto pt-[20px] mx-auto px-4 sm:px-1 md:px-2">
      <div className="flex justify-center text-[32px] gap-4 items-center">

        <ReverseSvg className='cursor-pointer w-[24px] h-[24px]' onClick={() => {
          // redirect to /chart?base-target
          window.location.href = `/chart?q=${q.split('-')[1]}-${q.split('-')[0]}`;
        }} />

        {data?.title}

        <DownloadSvg className='cursor-pointer w-[24px] h-[24px]' onClick={exportToCSV} />
      </div>

      {/* Range slider for selecting start and end timestamps */}
      <div className="flex justify-center my-4">
        <input
          type="range"
          min={data?.data[0]?.timestamp}
          max={endTimestamp}
          value={startTimestamp}
          onChange={(e) => setStartTimestamp(Number(e.target.value))}
          className="slider bg-white"
        />
        <input
          type="range"
          min={startTimestamp}
          max={data?.data[data?.data.length - 1]?.timestamp}
          value={endTimestamp}
          onChange={(e) => setEndTimestamp(Number(e.target.value))}
          className="slider"
        />
      </div>

      <ResponsiveContainer width="100%" height="70%">
        <LineChart data={filteredData}>
          <CartesianGrid strokeDasharray="4 2 0" />
          <XAxis dataKey="date" domain={['dataMin', 'dataMax']} />
          <YAxis tickFormatter={(value) => scientificFormat(value).toString()} />
          <Tooltip labelStyle={{ color: 'black' }} contentStyle={{ background: 'white' }} itemStyle={{ fontWeight: '700', color: 'black' }} formatter={(value) => [value]} />
          <Line type="monotone" dataKey="value" stroke="white" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CurrencyChart;
