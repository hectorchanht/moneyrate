import { NextResponse } from 'next/server';
import { resolveTier } from '@/lib/license';
import { clientIp } from '@/lib/rateLimit';

// GET /api/license?key=...
// Lets the web app (Settings → Pro) verify a license key the user pastes in.
// Returns { valid: true } only for a genuine paid Gumroad license.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = (searchParams.get('key') || '').trim();
  if (!key) return NextResponse.json({ valid: false });
  const tier = await resolveTier(key, clientIp(request));
  return NextResponse.json({ valid: tier === 'paid' });
}
