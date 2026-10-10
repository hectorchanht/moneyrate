"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { BackSvg } from '@/lib/svgs';
import { POPULAR_CURRENCIES, fetchPairRate, tripSplit } from '@/lib/tools';

// Trip budget planner: enter one budget in your home currency, see what it
// becomes in each destination — with and without the card/cash FX fee.
export default function TripPage() {
  const t = useTranslation().tools;
  const [budget, setBudget] = useState('1000');
  const [home, setHome] = useState('USD');
  const [fee, setFee] = useState('2.5');
  const [dests, setDests] = useState<string[]>(['JPY', 'EUR', 'GBP', 'CAD']);
  const [rows, setRows] = useState<{ code: string; amount: number; net: number; feeCost: number }[] | null>(null);
  const [loading, setLoading] = useState(false);

  const toggle = (c: string) =>
    setDests(d => (d.includes(c) ? d.filter(x => x !== c) : [...d, c]));

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { maximumFractionDigits: 2 });

  const calc = async () => {
    const b = parseFloat(budget);
    const f = parseFloat(fee);
    if (!(b > 0) || dests.length === 0) return;
    setLoading(true);
    const out: { code: string; amount: number; net: number; feeCost: number }[] = [];
    for (const d of dests) {
      if (d === home) continue;
      const rate = await fetchPairRate(home, d);
      if (rate === undefined) continue;
      const amount = b * rate;
      const { net, fee: feeCost } = tripSplit(amount, Number.isFinite(f) ? Math.max(0, f) : 0);
      out.push({ code: d, amount, net, feeCost });
    }
    setRows(out);
    setLoading(false);
  };

  const ok = parseFloat(budget) > 0 && dests.length > 0;

  return (
    <main className="mx-auto max-w-xl px-3 py-4">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/" className="btn btn-ghost btn-sm btn-circle shrink-0" aria-label="Back">
          <BackSvg className="size-5" />
        </Link>
        <h1 className="text-xl font-semibold truncate">{t.tripTitle}</h1>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs opacity-70">{t.tripBudget}</span>
          <input type="number" inputMode="decimal" min="0" step="any"
            className="input input-bordered w-full tabular-nums"
            value={budget} onChange={e => setBudget(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs opacity-70">{t.tripHome}</span>
          <select className="select select-bordered w-full" value={home} onChange={e => setHome(e.target.value)}>
            {POPULAR_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs opacity-70">{t.tripFee}</span>
          <input type="number" inputMode="decimal" min="0" step="any"
            className="input input-bordered w-full tabular-nums"
            value={fee} onChange={e => setFee(e.target.value)} />
        </label>
      </div>

      <p className="text-xs opacity-70 mb-1">{t.tripDests}</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {POPULAR_CURRENCIES.filter(c => c !== home).map(c => (
          <button
            key={c} type="button"
            onClick={() => toggle(c)}
            aria-pressed={dests.includes(c)}
            className={`btn btn-xs ${dests.includes(c) ? 'btn-primary' : 'btn-ghost border border-base-300'}`}
          >
            {c}
          </button>
        ))}
      </div>

      <button type="button" className="btn btn-primary w-full mb-4" onClick={calc} disabled={!ok || loading}>
        {loading ? t.tripLoading : t.tripCalc}
      </button>

      {rows && (
        rows.length === 0 ? (
          <p className="text-sm opacity-60">{t.tripNoRates}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map(r => (
              <li key={r.code} className="bg-base-200 rounded px-3 py-2">
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold">{r.code}</span>
                  <span className="text-lg font-bold tabular-nums">{fmt(r.net)}</span>
                </div>
                <div className="flex items-baseline justify-between text-xs opacity-60 tabular-nums">
                  <span>{t.tripBeforeFee}: {fmt(r.amount)}</span>
                  <span>{t.tripFeeCost}: {fmt(r.feeCost)}</span>
                </div>
              </li>
            ))}
          </ul>
        )
      )}
    </main>
  );
}
