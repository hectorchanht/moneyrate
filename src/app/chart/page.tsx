"use client";

import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import useSWR from 'swr';
import { fetcher } from '../api';

const CurrencyChart = () => {
  const [timeframe, setTimeframe] = useState<'Daily' | 'Weekly' | 'All'>('Daily');

  if (typeof window === undefined) return null;
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q')?.toUpperCase();

  const { data, error } = useSWR(`/api/currencyChart?q=${q}`, fetcher, { keepPreviousData: true });

  if (error) return <div>Error loading data</div>;
  if (!data) return <progress className="progress w-full mt-[2px]"></progress>;

  return (
    <div className="w-full h-dvh p-[12px] bg-[black]">
      <div className="flex justify-center">{q}</div>
      <div className="flex justify-center mb-4">
        <button onClick={() => setTimeframe('Daily')} className="m-4 border p-4 rounded-full">Daily</button>
        <button onClick={() => setTimeframe('Weekly')} className="m-4 border p-4 rounded-full">Weekly</button>
        <button onClick={() => setTimeframe('All')} className="m-4 border p-4 rounded-full">All</button>
      </div>
      <ResponsiveContainer>
        <LineChart data={data[timeframe]}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Line type="natural" dataKey="value" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CurrencyChart;
