import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchWithFallback, fetcher, getCurrencyRateApiUrl, getCurrencyRateApiUrls } from './api';

describe('getCurrencyRateApiUrl', () => {
  it('builds the all-currencies URL when no base code is given', () => {
    expect(getCurrencyRateApiUrl({})).toBe(
      'https://latest.currency-api.pages.dev/v1/currencies.json'
    );
  });

  it('appends the base currency code when provided', () => {
    expect(getCurrencyRateApiUrl({ baseCurrencyCode: 'usd' })).toBe(
      'https://latest.currency-api.pages.dev/v1/currencies/usd.json'
    );
  });

  it('honors a custom date and api version', () => {
    expect(getCurrencyRateApiUrl({ date: '2024-03-06', apiVersion: 'v2' })).toBe(
      'https://2024-03-06.currency-api.pages.dev/v2/currencies.json'
    );
  });
});

describe('getCurrencyRateApiUrls', () => {
  it('returns the pages.dev primary and jsdelivr fallback', () => {
    expect(getCurrencyRateApiUrls({ baseCurrencyCode: 'usd' })).toEqual([
      'https://latest.currency-api.pages.dev/v1/currencies/usd.json',
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
    ]);
  });

  it('getCurrencyRateApiUrl stays the primary of the pair', () => {
    expect(getCurrencyRateApiUrl({})).toBe(getCurrencyRateApiUrls({})[0]);
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
