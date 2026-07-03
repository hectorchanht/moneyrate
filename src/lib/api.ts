export const fetcher = (...args: Parameters<typeof fetch>) => fetch(...args).then(res => {
  if (!res.ok) {
    // Surface non-2xx (e.g. the chart route's 400/404) as a thrown error so SWR populates `error`.
    throw new Error(`Request failed with status ${res.status}`);
  }
  return res.json();
});

// Try each URL in order, returning the first success. Used as the SWR fetcher for
// currency rates so a primary-host outage transparently fails over to the mirror.
export const fetchWithFallback = async (urls: string | string[]) => {
  const list = Array.isArray(urls) ? urls : [urls];
  let lastErr: unknown;
  for (const url of list) {
    try {
      return await fetcher(url);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error('All requests failed');
};

// Host of the fawazahmed0/currency-api pages.dev mirror; overridable per environment.
const CURRENCY_API_HOST = process.env.NEXT_PUBLIC_CURRENCY_API_HOST || 'currency-api.pages.dev';

// date can be YYYY-MM-DD: 2024-03-06
type GetCurrencyRateParams = {
  baseCurrencyCode?: '' | string;
  date?: 'latest' | string;
  apiVersion?: string;
};

// Primary (configurable pages.dev mirror) + jsdelivr fallback, per the
// fawazahmed0/currency-api documented endpoints.
export const getCurrencyRateApiUrls = ({ baseCurrencyCode = '', date = 'latest', apiVersion = 'v1' }: GetCurrencyRateParams): string[] => {
  const path = `${apiVersion}/currencies${baseCurrencyCode ? '/' + baseCurrencyCode : ''}.json`;
  return [
    `https://${date}.${CURRENCY_API_HOST}/${path}`,
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/${path}`,
  ];
}

// Back-compat single-URL helper (primary host only).
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
