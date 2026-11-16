export const fetcher = (...args: Parameters<typeof fetch>) => fetch(...args).then(res => {
  if (!res.ok) {
    // Surface non-2xx (e.g. the chart route's 400/404) as a thrown error so SWR populates `error`.
    throw new Error(`Request failed with status ${res.status}`);
  }
  return res.json();
});

// --- Frankfurter (primary rate source) -------------------------------------
// https://api.frankfurter.dev — free, no key. v2 blends official rates from
// 100+ central-bank / institutional providers (fiat + crypto + metals).
// NOTE: frankfurter.app 301s to frankfurter.dev; never code to .app.
// v1 is ECB-only (30 currencies, no TWD/BTC/ETH/XAU) — do not use it here.
export const FRANKFURTER_API_BASE = 'https://api.frankfurter.dev';

export const isFrankfurterUrl = (url: string) => url.startsWith(`${FRANKFURTER_API_BASE}/`);

type FrankfurterCurrencyRow = { iso_code?: unknown; name?: unknown };
type FrankfurterRateRow = { date?: unknown; base?: unknown; quote?: unknown; rate?: unknown };

// Frankfurter v2 /currencies: [{iso_code, name, ...}] -> currency-api shape {code: name}.
export const normalizeFrankfurterCurrencies = (json: unknown): CurrencyRate4All | null => {
  if (!Array.isArray(json)) return null;
  const out: CurrencyRate4All = {};
  for (const row of json as FrankfurterCurrencyRow[]) {
    if (row && typeof row.iso_code === 'string' && row.iso_code && typeof row.name === 'string' && row.name) {
      out[row.iso_code.toLowerCase()] = row.name;
    }
  }
  return Object.keys(out).length ? out : null;
};

// Frankfurter v2 /rates: [{date, base, quote, rate}] -> currency-api table
// shape {date, [base]: {[quote]: rate}}. Per-quote dates can differ in the
// blended response, so the table date is the latest date among usable rows.
export const normalizeFrankfurterRates = (json: unknown): CurrencyRate4BaseCur | null => {
  if (!Array.isArray(json)) return null;
  let base = '';
  let date = '';
  const table: Record<string, number> = {};
  for (const row of json as FrankfurterRateRow[]) {
    if (!row || typeof row.quote !== 'string' || !row.quote) continue;
    if (typeof row.rate !== 'number' || !Number.isFinite(row.rate)) continue;
    if (typeof row.base === 'string' && row.base) base = row.base.toLowerCase();
    if (typeof row.date === 'string' && row.date > date) date = row.date;
    table[row.quote.toLowerCase()] = row.rate;
  }
  if (!base || !date || !Object.keys(table).length) return null;
  return { date, [base]: table };
};

// Normalize a response body for `url` into the currency-api shapes the UI
// consumes. Frankfurter payloads are transformed; an unusable Frankfurter
// payload returns null so callers fall through to the next source.
// currency-api (and any other) responses pass through unchanged.
export const normalizeRateResponse = (url: string, json: unknown): unknown => {
  if (!isFrankfurterUrl(url)) return json;
  return url.includes('/v2/currencies')
    ? normalizeFrankfurterCurrencies(json)
    : normalizeFrankfurterRates(json);
};

// Try each URL in order, returning the first success. Used as the SWR fetcher for
// currency rates so a primary-source outage (or unusable payload) transparently
// fails over to the next source.
// Return type stays Promise<any>: callers (SWR in page.tsx) parameterize the
// shape themselves, as they did when this returned res.json() directly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchWithFallback = async (urls: string | string[]): Promise<any> => {
  const list = Array.isArray(urls) ? urls : [urls];
  let lastErr: unknown;
  for (const url of list) {
    try {
      const json = await fetcher(url);
      const normalized = normalizeRateResponse(url, json);
      if (normalized == null) throw new Error(`Unusable response from ${url}`);
      return normalized;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error('All requests failed');
};

// Host of the fawazahmed0/currency-api pages.dev mirror; overridable per environment.
export const CURRENCY_API_HOST = process.env.NEXT_PUBLIC_CURRENCY_API_HOST || 'currency-api.pages.dev';

// date can be YYYY-MM-DD: 2024-03-06
type GetCurrencyRateParams = {
  baseCurrencyCode?: '' | string;
  date?: 'latest' | string;
  apiVersion?: string;
};

// Source order: Frankfurter v2 (primary) -> currency-api pages.dev ->
// currency-api jsdelivr. The Frankfurter URL comes first; fetchWithFallback
// normalizes its payload into the currency-api shape (see above), so callers
// see one shape regardless of which source answered.
//   base table, latest: /v2/rates?base=USD
//   base table, dated:  /v2/rates?base=USD&date=YYYY-MM-DD
//   all currencies:     /v2/currencies
export const getCurrencyRateApiUrls = ({ baseCurrencyCode = '', date = 'latest', apiVersion = 'v1' }: GetCurrencyRateParams): string[] => {
  const frankfurterUrl = baseCurrencyCode
    ? `${FRANKFURTER_API_BASE}/v2/rates?base=${baseCurrencyCode.toUpperCase()}${date !== 'latest' ? `&date=${date}` : ''}`
    : `${FRANKFURTER_API_BASE}/v2/currencies`;
  const path = `${apiVersion}/currencies${baseCurrencyCode ? '/' + baseCurrencyCode : ''}.json`;
  return [
    frankfurterUrl,
    `https://${date}.${CURRENCY_API_HOST}/${path}`,
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/${path}`,
  ];
}

// Back-compat single-URL helper (primary source only).
export const getCurrencyRateApiUrl = (params: GetCurrencyRateParams) => getCurrencyRateApiUrls(params)[0];

export type CurrencyRate4All = {
  [key: string]: string;
}

export type CurrencyRate4BaseCur = {
  date: string;
  [currency: string]: {
    [key: string]: number;
  } | string; // Allow string for the 'date' property
};
