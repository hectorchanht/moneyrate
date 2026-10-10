"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { BackSvg, XSvg } from '@/lib/svgs';
import { POPULAR_CURRENCIES, fetchPairRate, parseBatchAmounts } from '@/lib/tools';

// Batch convert: paste a pile of amounts (invoice lines, receipts — one per
// line, commas fine), convert them all at once, get the list + the total.
// Every comma separates ("4,600" → 4 and 600); the parse is shown as
// removable tags so the interpretation is visible — tap × to drop one.
export default function BatchPage() {
  const t = useTranslation().tools;
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('HKD');
  const [text, setText] = useState('');
  const [dropped, setDropped] = useState<Set<number>>(new Set());
  const [rows, setRows] = useState<{ amount: number; converted: number }[] | null>(null);
  const [loading, setLoading] = useState(false);

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { maximumFractionDigits: 2 });

  const parsed = parseBatchAmounts(text);
  const amounts = parsed.filter((_, i) => !dropped.has(i));

  const onText = (v: string) => {
    setText(v);
    setDropped(new Set());
  };

  const convert = async () => {
    if (amounts.length === 0 || from === to) return;
    setLoading(true);
    const rate = await fetchPairRate(from, to);
    setRows(rate === undefined ? null : amounts.map(a => ({ amount: a, converted: a * rate })));
    setLoading(false);
  };

  const total = rows?.reduce((s, r) => s + r.converted, 0) ?? 0;
  const totalIn = rows?.reduce((s, r) => s + r.amount, 0) ?? 0;

  return (
    <main className="mx-auto max-w-xl px-3 py-4">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/" className="btn btn-ghost btn-sm btn-circle shrink-0" aria-label="Back">
          <BackSvg className="size-5" />
        </Link>
        <h1 className="text-xl font-semibold truncate">{t.batchTitle}</h1>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs opacity-70">{t.batchFrom}</span>
          <select className="select select-bordered w-full" value={from} onChange={e => setFrom(e.target.value)}>
            {POPULAR_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs opacity-70">{t.batchTo}</span>
          <select className="select select-bordered w-full" value={to} onChange={e => setTo(e.target.value)}>
            {POPULAR_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 mb-2">
        <span className="text-xs opacity-70">{t.batchAmounts.replace('{n}', String(amounts.length))}</span>
        <textarea
          className="textarea textarea-bordered w-full h-32 tabular-nums"
          placeholder={t.batchPlaceholder}
          value={text} onChange={e => onText(e.target.value)}
        />
      </label>

      {parsed.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {parsed.map((a, i) => dropped.has(i) ? null : (
            <span key={i} className="badge badge-lg gap-1 tabular-nums py-3 pl-3">
              {fmt(a)}
              <button
                type="button"
                aria-label={t.batchRemoveAmount.replace('{n}', fmt(a))}
                className="btn btn-ghost btn-xs btn-circle"
                onClick={() => setDropped(prev => { const next = new Set(prev); next.add(i); return next; })}
              >
                <XSvg className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <button type="button" className="btn btn-primary w-full mb-4"
        onClick={convert} disabled={amounts.length === 0 || from === to || loading}>
        {loading ? t.batchLoading : t.batchConvert}
      </button>

      {rows && (
        rows.length === 0 ? (
          <p className="text-sm opacity-60">{t.batchNoRates}</p>
        ) : (
          <>
            <ul className="flex flex-col gap-1 mb-3 max-h-96 overflow-y-auto">
              {rows.map((r, i) => (
                <li key={i} className="flex items-baseline justify-between bg-base-200 rounded px-3 py-1.5 tabular-nums text-sm">
                  <span className="opacity-70">{fmt(r.amount)} {from}</span>
                  <span className="font-semibold">{fmt(r.converted)} {to}</span>
                </li>
              ))}
            </ul>
            <div className="bg-base-300 rounded px-3 py-2 flex items-baseline justify-between tabular-nums">
              <span className="text-sm font-semibold">{t.batchTotal}</span>
              <span>
                <span className="text-xs opacity-60 mr-2">{fmt(totalIn)} {from} =</span>
                <span className="text-lg font-bold">{fmt(total)} {to}</span>
              </span>
            </div>
          </>
        )
      )}
    </main>
  );
}
