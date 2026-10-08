/**
 * moneyrate-api — JavaScript/TypeScript client for the MoneyRate public API.
 * Read-only conversion + historical charts. https://moneyrate.lol/api-docs
 *
 * ```ts
 * import { MoneyRate } from "moneyrate-api";
 * const api = new MoneyRate();
 * const { result, rate } = await api.convert({ from: "USD", to: "EUR", amount: 100 });
 * const summary = await api.chart("USD-EUR"); // compact summary, not the full series
 * ```
 *
 * Free tier: 1,000 requests/day/IP. Paid tier (100,000/day) via a Gumroad
 * license key — pass it per call or to the constructor.
 */

export interface ConvertParams {
  from: string;
  to: string;
  amount?: number;
  /** Paid-tier Gumroad license key (optional). */
  license_key?: string;
}

export interface ConvertResult {
  from: string;
  to: string;
  amount: number;
  rate: number;
  result: number;
  rateDate: string;
  timestamp: string;
  tier: "free" | "paid";
}

export interface ChartPoint {
  date: string;
  value: number;
  timestamp: number;
}

export interface ChartSummary {
  title: string | null;
  points: number;
  first: { date: string; value: number } | null;
  last: { date: string; value: number } | null;
  min: number | null;
  max: number | null;
  /** The raw monthly series — opt in only when you really need it. */
  series?: ChartPoint[];
}

export class MoneyRateError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "MoneyRateError";
    this.status = status;
  }
}

export interface MoneyRateOptions {
  baseUrl?: string;
  /** Default paid-tier license key for every call. */
  licenseKey?: string;
  userAgent?: string;
}

export class MoneyRate {
  private readonly baseUrl: string;
  private readonly licenseKey?: string;
  private readonly userAgent: string;

  constructor(opts: MoneyRateOptions = {}) {
    this.baseUrl = (opts.baseUrl || "https://moneyrate.lol").replace(/\/$/, "");
    this.licenseKey = opts.licenseKey;
    this.userAgent = opts.userAgent || "moneyrate-api/1.0.0 (+https://moneyrate.lol)";
  }

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(this.baseUrl + path, {
      headers: { "User-Agent": this.userAgent },
    });
    const text = await res.text();
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      throw new MoneyRateError(res.status, `Non-JSON response: ${text.slice(0, 200)}`);
    }
    if (!res.ok) {
      const msg =
        typeof body === "object" && body !== null && "error" in body
          ? String((body as { error: unknown }).error)
          : `HTTP ${res.status}`;
      throw new MoneyRateError(res.status, msg);
    }
    return body as T;
  }

  /** Convert an amount using live rates. Throws MoneyRateError on 4xx/5xx. */
  async convert(params: ConvertParams): Promise<ConvertResult> {
    const { from, to, amount = 1, license_key } = params;
    if (!from || !to) throw new MoneyRateError(400, "'from' and 'to' are required");
    const p = new URLSearchParams();
    p.set("from", from.toUpperCase());
    p.set("to", to.toUpperCase());
    p.set("amount", String(amount));
    const key = license_key || this.licenseKey;
    if (key) p.set("license_key", key);
    return this.get<ConvertResult>(`/api/convert?${p.toString()}`);
  }

  /**
   * Historical monthly rates for a pair like "USD-EUR".
   * Returns a compact summary by default; pass `includeSeries: true` for the
   * full monthly series (can be hundreds of points).
   */
  async chart(q: string, includeSeries = false): Promise<ChartSummary> {
    const body = await this.get<{ title?: string; data?: ChartPoint[] }>(
      `/api/currencyChart?q=${encodeURIComponent(q.toUpperCase())}`
    );
    const data = Array.isArray(body.data) ? body.data : [];
    const values = data.map((d) => d.value).filter((v) => Number.isFinite(v));
    const first = data[0] ?? null;
    const last = data.length ? data[data.length - 1] : null;
    return {
      title: body.title ?? null,
      points: data.length,
      first: first ? { date: first.date, value: first.value } : null,
      last: last ? { date: last.date, value: last.value } : null,
      min: values.length ? Math.min(...values) : null,
      max: values.length ? Math.max(...values) : null,
      ...(includeSeries ? { series: data } : {}),
    };
  }
}
