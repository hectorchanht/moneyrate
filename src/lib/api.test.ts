import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetcher, getCurrencyRateApiUrl } from './api';

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
