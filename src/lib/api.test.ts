import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchWithFallback,
  fetcher,
  getCurrencyRateApiUrl,
  getCurrencyRateApiUrls,
  normalizeFrankfurterCurrencies,
  normalizeFrankfurterRates,
} from './api';

describe('getCurrencyRateApiUrl', () => {
  it('builds the Frankfurter all-currencies URL when no base code is given', () => {
    expect(getCurrencyRateApiUrl({})).toBe(
      'https://api.frankfurter.dev/v2/currencies'
    );
  });

  it('builds the Frankfurter rates URL with an uppercased base when provided', () => {
    expect(getCurrencyRateApiUrl({ baseCurrencyCode: 'usd' })).toBe(
      'https://api.frankfurter.dev/v2/rates?base=USD'
    );
  });

  it('adds the date param for a dated Frankfurter rates URL', () => {
    expect(getCurrencyRateApiUrl({ baseCurrencyCode: 'usd', date: '2024-03-06' })).toBe(
      'https://api.frankfurter.dev/v2/rates?base=USD&date=2024-03-06'
    );
  });
});

describe('getCurrencyRateApiUrls', () => {
  it('returns Frankfurter primary, then pages.dev and jsdelivr fallbacks for a base table', () => {
    expect(getCurrencyRateApiUrls({ baseCurrencyCode: 'usd' })).toEqual([
      'https://api.frankfurter.dev/v2/rates?base=USD',
      'https://latest.currency-api.pages.dev/v1/currencies/usd.json',
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
    ]);
  });

  it('returns Frankfurter currencies primary with currency-api fallbacks for the all-currencies list', () => {
    expect(getCurrencyRateApiUrls({})).toEqual([
      'https://api.frankfurter.dev/v2/currencies',
      'https://latest.currency-api.pages.dev/v1/currencies.json',
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.json',
    ]);
  });

  it('honors a custom date and api version in the currency-api fallbacks', () => {
    expect(getCurrencyRateApiUrls({ baseCurrencyCode: 'usd', date: '2024-03-06', apiVersion: 'v2' })).toEqual([
      'https://api.frankfurter.dev/v2/rates?base=USD&date=2024-03-06',
      'https://2024-03-06.currency-api.pages.dev/v2/currencies/usd.json',
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@2024-03-06/v2/currencies/usd.json',
    ]);
  });

  it('getCurrencyRateApiUrl stays the primary of the list', () => {
    expect(getCurrencyRateApiUrl({})).toBe(getCurrencyRateApiUrls({})[0]);
    expect(getCurrencyRateApiUrl({ baseCurrencyCode: 'usd' })).toBe(
      getCurrencyRateApiUrls({ baseCurrencyCode: 'usd' })[0]
    );
  });
});

describe('normalizeFrankfurterCurrencies', () => {
  it('maps the v2 currencies array to the {code: name} shape, lowercasing codes', () => {
    expect(
      normalizeFrankfurterCurrencies([
        { iso_code: 'USD', name: 'United States Dollar', symbol: '$', type: 'currency' },
        { iso_code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$', type: 'currency' },
        { iso_code: 'BTC', name: 'Bitcoin', symbol: '₿', type: 'crypto' },
      ])
    ).toEqual({
      usd: 'United States Dollar',
      twd: 'New Taiwan Dollar',
      btc: 'Bitcoin',
    });
  });

  it('skips rows without a usable code or name', () => {
    expect(
      normalizeFrankfurterCurrencies([
        { iso_code: 'USD', name: 'United States Dollar' },
        { iso_code: 'XXX' },
        { name: 'No code' },
        null,
        'junk',
      ])
    ).toEqual({ usd: 'United States Dollar' });
  });

  it('returns null for non-array or empty payloads', () => {
    expect(normalizeFrankfurterCurrencies({ usd: 'United States Dollar' })).toBeNull();
    expect(normalizeFrankfurterCurrencies([])).toBeNull();
    expect(normalizeFrankfurterCurrencies(null)).toBeNull();
  });
});

describe('normalizeFrankfurterRates', () => {
  it('maps the v2 rates array to the {date, [base]: {quote: rate}} table shape', () => {
    expect(
      normalizeFrankfurterRates([
        { date: '2026-11-16', base: 'USD', quote: 'CAD', rate: 1.4243 },
        { date: '2026-11-16', base: 'USD', quote: 'EUR', rate: 0.90379 },
      ])
    ).toEqual({
      date: '2026-11-16',
      usd: { cad: 1.4243, eur: 0.90379 },
    });
  });

  it('uses the latest per-quote date in the blended response as the table date', () => {
    expect(
      normalizeFrankfurterRates([
        { date: '2026-11-15', base: 'USD', quote: 'BTC', rate: 0.000014853 },
        { date: '2026-11-16', base: 'USD', quote: 'CAD', rate: 1.4243 },
        { date: '2026-11-13', base: 'USD', quote: 'CHF', rate: 0.83661 },
      ])
    ).toEqual({
      date: '2026-11-16',
      usd: { btc: 0.000014853, cad: 1.4243, chf: 0.83661 },
    });
  });

  it('skips rows without a finite numeric rate', () => {
    expect(
      normalizeFrankfurterRates([
        { date: '2026-11-16', base: 'USD', quote: 'CAD', rate: 1.4243 },
        { date: '2026-11-16', base: 'USD', quote: 'EUR', rate: '0.90' },
        { date: '2026-11-16', base: 'USD', quote: 'JPY', rate: NaN },
        null,
      ])
    ).toEqual({ date: '2026-11-16', usd: { cad: 1.4243 } });
  });

  it('returns null for error payloads and empty arrays', () => {
    expect(normalizeFrankfurterRates({ status: 422, message: 'invalid currency: ZZZ' })).toBeNull();
    expect(normalizeFrankfurterRates([])).toBeNull();
    expect(normalizeFrankfurterRates(null)).toBeNull();
  });
});

describe('fetchWithFallback', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns the first success without calling later urls', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ v: 1 }) }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchWithFallback(['https://a.test', 'https://b.test'])).resolves.toEqual({ v: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to the next url when the first fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ from: 'fallback' }) });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchWithFallback(['https://a.test', 'https://b.test'])).resolves.toEqual({
      from: 'fallback',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rejects when every url fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }))
    );
    await expect(fetchWithFallback(['https://a.test', 'https://b.test'])).rejects.toThrow();
  });

  it('normalizes a Frankfurter rates array into the table shape', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => [
        { date: '2026-11-15', base: 'USD', quote: 'BTC', rate: 0.000014853 },
        { date: '2026-11-16', base: 'USD', quote: 'CAD', rate: 1.4243 },
      ],
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchWithFallback([
        'https://api.frankfurter.dev/v2/rates?base=USD',
        'https://latest.currency-api.pages.dev/v1/currencies/usd.json',
      ])
    ).resolves.toEqual({
      date: '2026-11-16',
      usd: { btc: 0.000014853, cad: 1.4243 },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('normalizes a Frankfurter currencies array into the name map', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => [
          { iso_code: 'USD', name: 'United States Dollar' },
          { iso_code: 'TWD', name: 'New Taiwan Dollar' },
        ],
      }))
    );

    await expect(
      fetchWithFallback([
        'https://api.frankfurter.dev/v2/currencies',
        'https://latest.currency-api.pages.dev/v1/currencies.json',
      ])
    ).resolves.toEqual({ usd: 'United States Dollar', twd: 'New Taiwan Dollar' });
  });

  it('falls through to currency-api when Frankfurter returns an unusable payload', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 422, message: 'invalid currency: ZZZ' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ date: '2026-11-16', usd: { cad: 1.4274 } }),
      });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchWithFallback([
        'https://api.frankfurter.dev/v2/rates?base=USD',
        'https://latest.currency-api.pages.dev/v1/currencies/usd.json',
      ])
    ).resolves.toEqual({ date: '2026-11-16', usd: { cad: 1.4274 } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('passes currency-api responses through unchanged', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ date: '2026-11-16', usd: { cad: 1.4274 } }),
      }))
    );

    await expect(
      fetchWithFallback(['https://latest.currency-api.pages.dev/v1/currencies/usd.json'])
    ).resolves.toEqual({ date: '2026-11-16', usd: { cad: 1.4274 } });
  });
});

describe('fetcher', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns parsed JSON on a 2xx response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ hello: 'world' }) }))
    );
    await expect(fetcher('https://x.test')).resolves.toEqual({ hello: 'world' });
  });

  it('throws on a non-2xx response so SWR surfaces the error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 404, json: async () => ({ error: 'nope' }) }))
    );
    await expect(fetcher('https://x.test')).rejects.toThrow('status 404');
  });
});
