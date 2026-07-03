import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const chartResult = (close: number[], timestamp: number[]) => ({
  chart: { result: [{ timestamp, indicators: { quote: [{ close }] } }] },
});

const req = (q?: string) =>
  new Request(`http://localhost/api/currencyChart${q === undefined ? '' : `?q=${q}`}`);

// Mock fetch to return a body based on which Yahoo ticker shape is requested.
const mockFetchByTicker = (bodies: Record<string, unknown>) =>
  vi.fn(async (url: string) => {
    const match = Object.keys(bodies).find((t) => url.includes(`/chart/${t}?`));
    return { ok: true, status: 200, json: async () => (match ? bodies[match] : {}) };
  });

describe('GET /api/currencyChart', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns 400 when q is missing', async () => {
    const res = await GET(req());
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/provide a query parameter/i);
  });

  it('returns 400 on a malformed q (no dash)', async () => {
    const res = await GET(req('USD'));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/invalid 'q' format/i);
  });

  it('maps fiat data and sets a cache header', async () => {
    vi.stubGlobal('fetch', mockFetchByTicker({ 'USDCAD=X': chartResult([10, 20], [1, 2]) }));

    const res = await GET(req('USD-CAD'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toContain('max-age=3600');

    const body = await res.json();
    expect(body.title).toBe('1 USD = ? CAD');
    expect(body.data).toEqual([
      { date: '01/01/1970', value: 10, timestamp: 1 },
      { date: '01/01/1970', value: 20, timestamp: 2 },
    ]);
  });

  it('inverts values when only the flipped crypto pair resolves', async () => {
    vi.stubGlobal('fetch', mockFetchByTicker({ 'CAD-USD': chartResult([4], [1]) }));

    const res = await GET(req('USD-CAD'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data[0].value).toBeCloseTo(0.25);
  });

  it('returns 404 when no ticker shape has data', async () => {
    vi.stubGlobal('fetch', mockFetchByTicker({}));

    const res = await GET(req('ABC-XYZ'));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toMatch(/no chart data available/i);
  });
});
