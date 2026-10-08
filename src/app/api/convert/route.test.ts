import { describe, expect, it, vi, afterEach } from 'vitest';
import { GET } from './route';
import { __resetRateLimits } from '@/lib/rateLimit';

// Mock upstream: fawazahmed0 currency-api shape for base=usd.
const usdTable = () => ({
  date: '2026-10-08',
  usd: { hkd: 7.8, eur: 0.92 },
});

const req = (qs: string, ip = '1.2.3.4') =>
  new Request(`http://localhost/api/convert${qs}`, {
    headers: { 'x-forwarded-for': ip },
  });

describe('GET /api/convert', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    __resetRateLimits();
  });

  it('returns 400 when from/to are missing', async () => {
    const res = await GET(req('?amount=1'));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/currency codes/i);
  });

  it('returns 400 when from === to', async () => {
    const res = await GET(req('?from=USD&to=usd'));
    expect(res.status).toBe(400);
  });

  it('returns 400 on a bad amount', async () => {
    const res = await GET(req('?from=USD&to=HKD&amount=-5'));
    expect(res.status).toBe(400);
  });

  it('converts and returns the documented shape', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => usdTable() }))
    );
    const res = await GET(req('?from=USD&to=HKD&amount=2'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ from: 'USD', to: 'HKD', amount: 2, rate: 7.8, result: 15.6, tier: 'free' });
    expect(res.headers.get('X-RateLimit-Limit')).toBe('1000');
    expect(res.headers.get('X-Tier')).toBe('free');
  });

  it('returns 404 for an unknown pair', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => usdTable() }))
    );
    const res = await GET(req('?from=USD&to=ZZZ'));
    expect(res.status).toBe(404);
  });

  it('429s after the free daily limit for one IP', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => usdTable() }))
    );
    const ip = '9.9.9.9';
    let last: Response | null = null;
    for (let i = 0; i < 1001; i++) last = await GET(req('?from=USD&to=HKD', ip));
    expect(last!.status).toBe(429);
    expect((await last!.json()).error).toMatch(/daily limit reached/i);
    // A different IP is unaffected.
    const other = await GET(req('?from=USD&to=HKD', '8.8.8.8'));
    expect(other.status).toBe(200);
  });
});
