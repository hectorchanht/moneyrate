import { getCurrencyRateApiUrls } from '@/lib/api';
import { resolveTier } from '@/lib/license';

// Embeddable mini-converter for third-party sites — a standalone HTML
// document (no app layout), so it works cleanly inside an <iframe>:
//
//   <iframe src="https://moneyrate.lol/embed?base=USD&target=CAD&amount=100"
//           width="320" height="168" style="border:0"></iframe>
//
// Params: base, target (2-6 letter codes), amount (default 1).
// ?key=YOUR_LICENSE_KEY removes the "Powered by" footer (Pro white-label).

const CODE_RE = /^[a-z]{2,6}$/;
const MAX_AMOUNT = 1e15;

async function getRate(base: string, target: string): Promise<{ rate: number; date: string } | null> {
  for (const url of getCurrencyRateApiUrls({ baseCurrencyCode: base })) {
    try {
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) continue;
      const data = await res.json();
      const rate = data?.[base]?.[target];
      if (typeof rate === 'number' && Number.isFinite(rate)) {
        return { rate, date: data?.date || '' };
      }
    } catch {
      // try next mirror
    }
  }
  return null;
}

const fmt = (n: number) =>
  n.toLocaleString('en-US', { maximumFractionDigits: n < 1 ? 6 : 2, minimumFractionDigits: 2 });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let base = (searchParams.get('base') || 'usd').toLowerCase();
  let target = (searchParams.get('target') || 'cad').toLowerCase();
  let amount = parseFloat(searchParams.get('amount') || '1');
  const key = (searchParams.get('key') || '').trim();

  if (!CODE_RE.test(base)) base = 'usd';
  if (!CODE_RE.test(target) || target === base) target = base === 'usd' ? 'cad' : 'usd';
  if (!isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) amount = 1;

  const fwd = request.headers.get('x-forwarded-for');
  const ip = (fwd ? fwd.split(',')[0] : request.headers.get('x-real-ip') || 'unknown').trim();
  const pro = key ? (await resolveTier(key, ip)) === 'paid' : false;

  const r = await getRate(base, target);
  const B = base.toUpperCase();
  const T = target.toUpperCase();

  const body = r
    ? `<div class="amt">${fmt(amount)} ${B} =</div>
       <div class="res">${fmt(amount * r.rate)} ${T}</div>
       <div class="rate">1 ${B} = ${fmt(r.rate)} ${T}${r.date ? ` · ${r.date}` : ''}</div>`
    : `<div class="res">Rate unavailable</div>
       <div class="rate">${B} → ${T}</div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${B} to ${T} — MoneyRate</title>
<style>
  *{box-sizing:border-box;margin:0}
  body{font-family:system-ui,-apple-system,sans-serif;background:#1d232a;color:#e8e8e8;
       display:flex;align-items:center;justify-content:center;min-height:100vh;padding:8px}
  .card{background:#191e24;border:1px solid #2a323b;border-radius:12px;padding:14px 16px;width:100%;max-width:304px}
  .amt{font-size:13px;opacity:.65;margin-bottom:2px}
  .res{font-size:24px;font-weight:700;font-variant-numeric:tabular-nums;margin-bottom:4px}
  .rate{font-size:12px;opacity:.55}
  .brand{margin-top:10px;font-size:11px;opacity:.45;text-align:right}
  .brand a{color:inherit}
</style></head>
<body><div class="card">${body}${
    pro ? '' : `<div class="brand">Powered by <a href="https://moneyrate.lol" target="_blank" rel="noopener">moneyrate.lol</a></div>`
  }</div></body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
