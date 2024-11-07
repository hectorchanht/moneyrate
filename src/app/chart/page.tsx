"use client";

import { useEffect, useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import useSWR from 'swr';
import { fetcher } from '../api';

// Define the type for the data items
interface DataItem {
  date: string;
  timestamp: number;
  value: number; // Add other properties as needed
}

const CurrencyChart = () => {
  const [q, setQ] = useState<string | null>(null);
  const [startTimestamp, setStartTimestamp] = useState<number>(0);
  const [endTimestamp, setEndTimestamp] = useState<number>(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQ(params.get('q')?.toUpperCase() || null);
  }, []);

  const { data, error } = useSWR(q ? `/api/currencyChart?q=${q}` : null, fetcher, { keepPreviousData: true });

  if (!!error) return <div className="text-center">Error loading data</div>;
  if (!data || !q) return <progress className="progress w-full mt-[2px]"></progress>;

  // Set default start and end timestamps based on fetched data
  if (startTimestamp === 0 && data.data.length > 0) {
    setStartTimestamp(data.data[0].timestamp);
    setEndTimestamp(data.data[data.data.length - 1].timestamp);
  }

  // Filter the data based on the selected timestamps
  const filteredData = useMemo(
    () => data.data.filter((item: DataItem) => item.timestamp >= startTimestamp && item.timestamp <= endTimestamp)
    , [data, startTimestamp, endTimestamp]
  );

  return (
    <div className="w-full h-[100vh] overflow-auto pt-[20px] container mx-auto">
      <div className="flex justify-center text-[40px]">{data?.title}</div>

      {/* Range slider for selecting start and end timestamps */}
      <div className="flex justify-center mb-4">
        <input
          type="range"
          min={data.data[0]?.timestamp}
          max={endTimestamp}
          value={startTimestamp}
          onChange={(e) => setStartTimestamp(Number(e.target.value))}
          className="slider bg-white"
        />
        <input
          type="range"
          min={startTimestamp}
          max={data.data[data.data.length - 1]?.timestamp}
          value={endTimestamp}
          onChange={(e) => setEndTimestamp(Number(e.target.value))}
          className="slider"
        />
      </div>

      <ResponsiveContainer width="100%" height="70%">
        <LineChart data={filteredData}>
          <CartesianGrid strokeDasharray="4 2 0" />
          <XAxis dataKey="date" domain={['dataMin', 'dataMax']} />
          <YAxis />
          <Tooltip labelStyle={{ color: 'black' }} contentStyle={{ background: 'white' }} itemStyle={{ fontWeight: '700', color: 'black' }} formatter={(value) => [value]} />
          <Line type="monotone" dataKey="value" stroke="white" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CurrencyChart;
