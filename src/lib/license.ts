// Server-only: Gumroad license verification, shared by /api/convert,
// /api/license and /embed. One module-level cache per server instance.
import { checkLimit } from './rateLimit';

const LICENSE_CACHE_TTL_MS = 60 * 60 * 1000;
const LICENSE_CACHE_MAX = 5000;
const licenseCache = new Map<string, { valid: boolean; exp: number }>();

// Per-IP daily budget for Gumroad verification attempts — without this,
// random keys burn unlimited Gumroad API calls before any rate limit runs.
export const VERIFY_DAILY_LIMIT = 10;

export async function verifyGumroadLicense(key: string): Promise<boolean> {
  const token = process.env.GUMROAD_ACCESS_TOKEN;
  const permalink = process.env.GUMROAD_PRODUCT_PERMALINK;
  if (!token || !permalink || !key) return false;
  try {
    const res = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        product_permalink: permalink,
        license_key: key,
        access_token: token,
      }),
    });
    const json = await res.json();
    const p = json?.purchase;
    return json?.success === true && p?.refunded !== true && p?.chargebacked !== true;
  } catch {
    return false;
  }
}

// 'paid' only with a valid Gumroad license key; anything else falls back to
// 'free' silently. Results cached 1h/key; verification attempts are per-IP
// budgeted so junk keys can't burn the Gumroad API quota freely.
export async function resolveTier(licenseKey: string, ip: string): Promise<'free' | 'paid'> {
  if (!licenseKey) return 'free';
  const cached = licenseCache.get(licenseKey);
  if (cached && Date.now() <= cached.exp) {
    return cached.valid ? 'paid' : 'free';
  }
  const vb = checkLimit('verify:' + ip, VERIFY_DAILY_LIMIT);
  if (!vb.allowed) return 'free';
  const valid = await verifyGumroadLicense(licenseKey);
  if (licenseCache.size >= LICENSE_CACHE_MAX) licenseCache.clear();
  // set() overwrites any stale entry for this key.
  licenseCache.set(licenseKey, { valid, exp: Date.now() + LICENSE_CACHE_TTL_MS });
  return valid ? 'paid' : 'free';
}
