// Per-IP daily rate limiting for the freemium /api/convert endpoint.
// Kept OUT of route.ts: Next.js only allows HTTP handlers + segment config
// as route exports — anything else fails the build ("not a valid Route
// export field").

export const FREE_DAILY_LIMIT = 1000;
export const PAID_DAILY_LIMIT = 100000;

// In-memory per-IP daily counters. Resets on cold start — approximate on
// serverless, which is fine for a v1 abuse brake (not a billing meter).
const hits = new Map<string, { count: number; day: string }>();

export function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  return (fwd?.split(',')[0] || 'unknown').trim();
}

export function checkLimit(ip: string, limit: number): { allowed: boolean; remaining: number } {
  const day = new Date().toISOString().slice(0, 10);
  const rec = hits.get(ip);
  if (!rec || rec.day !== day) {
    hits.set(ip, { count: 1, day });
    return { allowed: true, remaining: limit - 1 };
  }
  if (rec.count >= limit) return { allowed: false, remaining: 0 };
  rec.count += 1;
  return { allowed: true, remaining: limit - rec.count };
}

// Test-only: reset counters between suites (module state is shared).
export function __resetRateLimits() {
  hits.clear();
}

export function rateHeaders(limit: number, remaining: number, tier: string) {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(remaining),
    'X-Tier': tier,
  };
}
