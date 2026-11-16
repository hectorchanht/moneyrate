// Server-only: the cached Frankfurter daily rate table behind /api/convert.
//
// Frankfurter rates are a DAILY fixing — they change once per business day —
// so calling the upstream per conversion request is pure waste: the same
// answer comes back every time until the next fixing lands. This module
// fetches the full USD-base table (~200 quotes) once and lets the Next Data
// Cache hold it server-side; every pair is then resolved in-process:
//   USD->X   the published table value, verbatim
//   X->USD   1 / table[X]
//   X->Y     table[Y] / table[X]
// One cached table therefore serves every pair, and a warm conversion pays
// no upstream round trip at all. (Caching is the API provider's job —
// consumers like StealLine call this API live instead of keeping their own
// copies of the rates.)
//
// Freshness contract: the Data Cache entry revalidates hourly, which bounds
// how long yesterday's fixing can be served after a new one lands, and
// `rateDate` always reports the payload's own fixing date (per quote — the
// blended table can carry different dates per quote), never a relabelled
// "today". A stale table is therefore always honestly dated.
//
// Fallbacks stay in the route: a code missing from this table (long-tail
// currencies Frankfurter doesn't blend) or a failed table fetch falls
// through to the per-pair endpoint and then the currency-api mirrors,
// exactly as before this module existed.

import { FRANKFURTER_API_BASE } from './api';

export const FX_TABLE_REVALIDATE_SECONDS = 3600;

export type FxRateEntry = { rate: number; date: string };

export type FxTable = {
  /** Latest fixing date among the table's quotes (YYYY-MM-DD). */
  date: string;
  /** Quote code (uppercase) -> published rate vs USD + that quote's own fixing date. */
  rates: Record<string, FxRateEntry>;
};

// Frankfurter v2 publishes rates rounded to 5 significant figures (e.g.
// 0.90465, 1.1054, 37.461). Rates derived here by division are rounded the
// same way, so a table-derived answer matches the per-pair endpoint's value
// for the same pair instead of carrying float noise (37.46089647930139).
export const round5sf = (n: number): number => {
  if (!Number.isFinite(n) || n === 0) return n;
  const digits = 4 - Math.floor(Math.log10(Math.abs(n)));
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
};

type FrankfurterRateRow = { date?: unknown; base?: unknown; quote?: unknown; rate?: unknown };

// Frankfurter v2 /rates?base=USD: [{date, base, quote, rate}] -> FxTable.
// Returns null on any unusable payload so callers fall through to the
// route's existing fallback chain.
export const parseFrankfurterTable = (json: unknown): FxTable | null => {
  if (!Array.isArray(json)) return null;
  const rates: Record<string, FxRateEntry> = {};
  let date = '';
  for (const row of json as FrankfurterRateRow[]) {
    if (!row || typeof row.quote !== 'string' || !row.quote) continue;
    if (typeof row.rate !== 'number' || !Number.isFinite(row.rate) || row.rate <= 0) continue;
    const d = typeof row.date === 'string' ? row.date : '';
    rates[row.quote.toUpperCase()] = { rate: row.rate, date: d };
    if (d > date) date = d;
  }
  if (!date || !Object.keys(rates).length) return null;
  return { date, rates };
};

// The fetch carries `next.revalidate`, so on Vercel this is served from the
// shared Data Cache (one upstream call per revalidate window per region),
// not from Frankfurter, on every request but the first.
export async function fetchFrankfurterTable(): Promise<FxTable | null> {
  try {
    const res = await fetch(`${FRANKFURTER_API_BASE}/v2/rates?base=USD`, {
      next: { revalidate: FX_TABLE_REVALIDATE_SECONDS, tags: ['fx-rates'] },
    });
    if (!res.ok) return null;
    return parseFrankfurterTable(await res.json());
  } catch {
    return null;
  }
}

// Resolve a pair from the table. USD pairs return the published value
// verbatim; derived rates are rounded to Frankfurter's 5 s.f. rateDate is
// the stalest leg's own fixing date — the answer is never dated newer than
// the data behind it.
export const pairFromTable = (
  table: FxTable,
  from: string,
  to: string
): { rate: number; rateDate: string } | null => {
  const f = from.toUpperCase();
  const t = to.toUpperCase();
  if (f === 'USD' && table.rates[t]) {
    return { rate: table.rates[t].rate, rateDate: table.rates[t].date || table.date };
  }
  if (t === 'USD' && table.rates[f]) {
    return { rate: round5sf(1 / table.rates[f].rate), rateDate: table.rates[f].date || table.date };
  }
  const a = table.rates[f];
  const b = table.rates[t];
  if (a && b) {
    const rateDate = [a.date, b.date].filter(Boolean).sort()[0] || table.date;
    return { rate: round5sf(b.rate / a.rate), rateDate };
  }
  return null;
};

export async function getFrankfurterPairRate(
  from: string,
  to: string
): Promise<{ rate: number; rateDate: string } | null> {
  const table = await fetchFrankfurterTable();
  return table ? pairFromTable(table, from, to) : null;
}
