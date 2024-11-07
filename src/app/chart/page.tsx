"use client";

import { useEffect, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import useSWR from 'swr';
import { fetcher } from '../api';

const CurrencyChart = () => {
  const [timeframe, setTimeframe] = useState<'Daily' | 'Weekly' | 'All'>('All');
  const [q, setQ] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQ(params.get('q')?.toUpperCase() || null);
  }, []);

  const { data, error } = useSWR(q ? `/api/currencyChart?q=${q}` : null, fetcher, { keepPreviousData: true });

  if (!!error) return <div className="text-center">Error loading data</div>;
  if (!data || !q) return <progress className="progress w-full mt-[2px]"></progress>;

  return (
    <div className="w-full h-[100vh] overflow-auto pt-[20px] bg-[black] container mx-auto">
      <div className="flex justify-center">{q}</div>
      <div className="flex justify-center mb-4">
        <button 
          onClick={() => setTimeframe('Daily')} 
          className={`m-4 border p-2 ${timeframe === 'Daily' ? 'bg-gray-500 text-white' : 'bg-white text-black'}`}>
          Daily
        </button>
        <button 
          onClick={() => setTimeframe('Weekly')} 
          className={`m-4 border p-2 ${timeframe === 'Weekly' ? 'bg-gray-500 text-white' : 'bg-white text-black'}`}>
          Weekly
        </button>
        <button 
          onClick={() => setTimeframe('All')} 
          className={`m-4 border p-2 ${timeframe === 'All' ? 'bg-gray-500 text-white' : 'bg-white text-black'}`}>
          All
        </button>
      </div>
      <ResponsiveContainer width="100%" height="70%" >
        <LineChart data={data[timeframe]} >
          <CartesianGrid strokeDasharray="4 2 0" />
          <XAxis dataKey="time" orientation='top' />
          <YAxis />
          <Tooltip />
          <Line type="natural" dataKey="value" stroke="" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CurrencyChart;
