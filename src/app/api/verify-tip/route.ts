import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { checkLimit, clientIp } from '@/lib/rateLimit';

// POST /api/verify-tip  { licenseKey }
// Verifies a Gumroad tip-jar license key so tippers can hide the sponsored
// strip. Response is always { ok: boolean } (plus admin: true when the admin
// license key is used). The input is never logged and no hash detail is
// exposed to the client; fail closed on any network/API error.
const TIP_PRODUCT_PERMALINK = 'moneyrate-tip';
// Admin license key — hash-in-code (repos are public; SHA-256 of the 32-char
// key is not brute-forceable). Bypasses Gumroad entirely.
const ADMIN_KEY_SHA256 = '67d2d8519b0160af28a8d8f6c3cc97d810fda37161d2b10b1359d480c4ecad77';
const VERIFY_TIP_DAILY_LIMIT = 20;

export async function POST(request: Request) {
  let licenseKey = '';
  try {
    const body = await request.json();
    licenseKey = String(body?.licenseKey ?? '').trim();
  } catch {
    licenseKey = '';
  }
  if (!licenseKey) return NextResponse.json({ ok: false }, { status: 400 });
  if (licenseKey.length > 200) return NextResponse.json({ ok: false }, { status: 400 });

  const vb = checkLimit('verify-tip:' + clientIp(request), VERIFY_TIP_DAILY_LIMIT);
  if (!vb.allowed) return NextResponse.json({ ok: false }, { status: 429 });

  // Admin key: SHA-256 hex match, no Gumroad call.
  const digest = createHash('sha256').update(licenseKey, 'utf8').digest('hex');
  if (digest === ADMIN_KEY_SHA256) return NextResponse.json({ ok: true, admin: true });

  // Tip-jar license via Gumroad v2 licenses/verify — no access token needed.
  try {
    const res = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        product_permalink: TIP_PRODUCT_PERMALINK,
        license_key: licenseKey,
      }),
    });
    const json = await res.json();
    const p = json?.purchase;
    const valid = json?.success === true && p?.refunded !== true && p?.chargebacked !== true;
    return NextResponse.json({ ok: valid });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
