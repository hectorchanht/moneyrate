import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { MoneyRate, MoneyRateError } from "../src/index";

const CONVERT = { from: "USD", to: "EUR", amount: 2, rate: 0.9, result: 1.8, rateDate: "2026-10-08", timestamp: "t", tier: "free" };
const CHART = {
  title: "1 USD = ? EUR",
  data: [
    { date: "01/01/2024", value: 0.9, timestamp: 1704067200 },
    { date: "01/02/2024", value: 0.92, timestamp: 1706745600 },
    { date: "01/03/2024", value: 0.88, timestamp: 1709251200 },
  ],
};

function stubFetch(body: unknown, status = 200) {
  return vi.fn(async (_url: string | URL | Request) => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  }));
}

describe("MoneyRate", () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it("convert() builds the query and returns the result", async () => {
    const fetch = stubFetch(CONVERT);
    vi.stubGlobal("fetch", fetch);
    const api = new MoneyRate({ baseUrl: "http://x" });
    const r = await api.convert({ from: "usd", to: "eur", amount: 2 });
    expect(r.result).toBe(1.8);
    expect(r.tier).toBe("free");
    const url = String(fetch.mock.calls[0][0]);
    expect(url).toContain("/api/convert?");
    expect(url).toContain("from=USD");
    expect(url).toContain("to=EUR");
    expect(url).toContain("amount=2");
  });

  it("convert() attaches the license key (per-call wins over constructor)", async () => {
    const fetch = stubFetch({ ...CONVERT, tier: "paid" });
    vi.stubGlobal("fetch", fetch);
    const api = new MoneyRate({ baseUrl: "http://x", licenseKey: "ctor-key" });
    await api.convert({ from: "USD", to: "EUR", license_key: "call-key" });
    expect(String(fetch.mock.calls[0][0])).toContain("license_key=call-key");
  });

  it("convert() throws MoneyRateError with the API message on 4xx", async () => {
    vi.stubGlobal("fetch", stubFetch({ error: "No rate available for XXX→USD." }, 404));
    const api = new MoneyRate({ baseUrl: "http://x" });
    await expect(api.convert({ from: "XXX", to: "USD" })).rejects.toMatchObject({
      name: "MoneyRateError",
      status: 404,
    });
  });

  it("chart() returns a compact summary, not the full series", async () => {
    vi.stubGlobal("fetch", stubFetch(CHART));
    const api = new MoneyRate({ baseUrl: "http://x" });
    const s = await api.chart("USD-EUR");
    expect(s.points).toBe(3);
    expect(s.min).toBe(0.88);
    expect(s.max).toBe(0.92);
    expect(s.first).toEqual({ date: "01/01/2024", value: 0.9 });
    expect(s.last).toEqual({ date: "01/03/2024", value: 0.88 });
    expect(s.series).toBeUndefined();
  });

  it("chart() includes the series when asked", async () => {
    vi.stubGlobal("fetch", stubFetch(CHART));
    const api = new MoneyRate({ baseUrl: "http://x" });
    const s = await api.chart("USD-EUR", true);
    expect(s.series).toHaveLength(3);
  });
});
