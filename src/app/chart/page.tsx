"use client";

import { useEffect, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import useSWR from 'swr';
import { fetcher } from '../api';

const CurrencyChart = () => {
  const [q, setQ] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQ(params.get('q')?.toUpperCase() || null);
  }, []);

  const { data, error } = useSWR(q ? `/api/currencyChart?q=${q}` : null, fetcher, { keepPreviousData: true });

  if (!!error) return <div className="text-center">Error loading data</div>;
  if (!data || !q) return <progress className="progress w-full mt-[2px]"></progress>;

  return (
    <div className="w-full h-[100vh] overflow-auto pt-[20px] container mx-auto">
      <div className="flex justify-center text-[40px]">1 {q?.split('-')[0]} = ? {q?.split('-')[1]}</div>

      <ResponsiveContainer width="100%" height="70%" >
        <LineChart data={data} >
          <CartesianGrid strokeDasharray="4 2 0" />
          <XAxis dataKey="time" orientation='top' />
          <YAxis />
          <Tooltip labelStyle={{ color: 'black' }} contentStyle={{ background: 'white' }} itemStyle={{ fontWeight: '700' }} formatter={(value) => [value]} />
          <Line type="natural" dataKey="value" stroke="" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CurrencyChart;
