// Pure helpers for the Toolkit tools (/trip, /compare, /batch) and the
// % move push alerts. No React, no I/O except fetchPairRate — everything
// else is covered by tools.test.ts.

// Curated list for the tool pages' currency selects — dependency-free and
// fast (the full list lives on the homepage via the rates API).
export const POPULAR_CURRENCIES = [
  'USD', 'EUR', 'JPY', 'GBP', 'CAD', 'AUD', 'HKD', 'CNY', 'TWD', 'KRW',
  'SGD', 'THB', 'MYR', 'IDR', 'PHP', 'VND', 'INR', 'NZD', 'CHF', 'SEK',
  'MXN', 'BRL', 'BTC', 'ETH',
] as const;

// Parse a pasted list of amounts: lines, commas, semicolons or pipes;
// tolerates "1,000", "$100", "€ 50". A comma followed by exactly three
// Commas always separate amounts ("4,600" → 4 and 600 — Hector 2026-10-10:
// in a batch paste a comma is a delimiter, never a thousand separator).
// Splits on newlines, commas, semicolons and pipes; strips currency symbols;
// returns finite positive numbers in order.
export function parseBatchAmounts(text: string): number[] {
  const out: number[] = [];
  for (const chunk of text.split(/[\n,;|]+/)) {
    const cleaned = chunk.replace(/[^0-9.\-]/g, '');
    if (!cleaned) continue;
    const n = parseFloat(cleaned);
    if (Number.isFinite(n) && n > 0) out.push(n);
  }
  return out;
}

// Spread of a shop/bank quote vs the market rate, in %.
// Negative = their quote sits below market (you receive less foreign currency).
export function spreadPct(theirRate: number, marketRate: number): number {
  if (!(marketRate > 0)) return NaN;
  return ((theirRate - marketRate) / marketRate) * 100;
}

// Trip budget split: how much of the budget survives the card/cash FX fee.
export function tripSplit(budget: number, feePct: number): { net: number; fee: number } {
  const fee = (budget * feePct) / 100;
  return { net: budget - fee, fee };
}

// 24h % move of from→to, derived from each currency's % change vs a common
// base (the homepage's changePctByCur). chg[base] defaults to 0. Returns
// undefined when either leg is missing (e.g. no yesterday data yet).
export function crossPctChange(
  chg: Record<string, number>,
  from: string,
  to: string,
  base: string
): number | undefined {
  const cTo = to.toLowerCase() === base.toLowerCase() ? 0 : chg[to.toLowerCase()];
  const cFrom = from.toLowerCase() === base.toLowerCase() ? 0 : chg[from.toLowerCase()];
  if (typeof cTo !== 'number' || typeof cFrom !== 'number') return undefined;
  return ((1 + cTo / 100) / (1 + cFrom / 100) - 1) * 100;
}

// Single-pair rate through the app's own API (amount=1).
export async function fetchPairRate(from: string, to: string): Promise<number | undefined> {
  try {
    const res = await fetch(
      `/api/convert?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=1`
    );
    if (!res.ok) return undefined;
    const j = await res.json();
    return typeof j.rate === 'number' ? j.rate : undefined;
  } catch {
    return undefined; // offline — callers treat undefined as "not this round"
  }
}
