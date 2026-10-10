"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { BackSvg } from '@/lib/svgs';
import { POPULAR_CURRENCIES, fetchPairRate, spreadPct } from '@/lib/tools';

// Rate compare: paste the rate a money changer / bank offers you
// ("1 {from} = X {to}") and see instantly how far it sits from the market.
export default function ComparePage() {
  const t = useTranslation().tools;
  const [from, setFrom] = useState('HKD');
  const [to, setTo] = useState('JPY');
  const [their, setTheir] = useState('');
  const [result, setResult] = useState<{ market: number; spread: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const fmt = (n: number, dp = 4) =>
    n.toLocaleString('en-US', { maximumFractionDigits: dp });

  const check = async () => {
    const theirRate = parseFloat(their);
    if (!(theirRate > 0) || from === to) return;
    setLoading(true);
    const market = await fetchPairRate(from, to);
    setResult(market === undefined ? null : { market, spread: spreadPct(theirRate, market) });
    setLoading(false);
  };

  const ok = parseFloat(their) > 0 && from !== to;
  const verdict =
    result === null ? null
    : result.spread <= -0.05 ? 'good'
    : result.spread >= 0.05 ? 'bad' : 'ok';

  return (
    <main className="mx-auto max-w-xl px-3 py-4">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/" className="btn btn-ghost btn-sm btn-circle shrink-0" aria-label="Back">
          <BackSvg className="size-5" />
        </Link>
        <h1 className="text-xl font-semibold truncate">{t.compareTitle}</h1>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs opacity-70">{t.compareFrom}</span>
          <select className="select select-bordered w-full" value={from} onChange={e => setFrom(e.target.value)}>
            {POPULAR_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs opacity-70">{t.compareTo}</span>
          <select className="select select-bordered w-full" value={to} onChange={e => setTo(e.target.value)}>
            {POPULAR_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 mb-3">
        <span className="text-xs opacity-70">{t.compareTheir.replace('{from}', from).replace('{to}', to)}</span>
        <input type="number" inputMode="decimal" min="0" step="any"
          className="input input-bordered w-full tabular-nums"
          placeholder="19.5"
          value={their} onChange={e => setTheir(e.target.value)} />
      </label>

      <button type="button" className="btn btn-primary w-full mb-4" onClick={check} disabled={!ok || loading}>
        {loading ? t.compareLoading : t.compareCheck}
      </button>

      {result && (
        <div className="bg-base-200 rounded px-3 py-3">
          <div className="flex items-baseline justify-between tabular-nums">
            <span className="text-sm opacity-70">{t.compareMarket}</span>
            <span className="font-semibold">1 {from} = {fmt(result.market)} {to}</span>
          </div>
          <div className="flex items-baseline justify-between tabular-nums mt-1">
            <span className="text-sm opacity-70">{t.compareSpread}</span>
            <span className={`font-bold text-lg ${result.spread < 0 ? 'text-success' : result.spread > 0 ? 'text-error' : ''}`}>
              {result.spread >= 0 ? '+' : ''}{result.spread.toFixed(2)}%
            </span>
          </div>
          <p className="text-sm mt-2">
            {verdict === 'good' && <>✅ {t.compareGood.replace('{pct}', Math.abs(result.spread).toFixed(2))}</>}
            {verdict === 'bad' && <>⚠️ {t.compareBad.replace('{pct}', result.spread.toFixed(2))}</>}
            {verdict === 'ok' && <>➖ {t.compareOk}</>}
          </p>
          <p className="text-xs opacity-60 mt-1 tabular-nums">
            {t.comparePer1000
              .replace('{from}', from)
              .replace('{to}', to)
              .replace('{theirs}', fmt(parseFloat(their) * 1000, 2))
              .replace('{market}', fmt(result.market * 1000, 2))}
          </p>
        </div>
      )}
    </main>
  );
}
