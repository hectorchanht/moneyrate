import { getCurrencyRateApiUrls } from '@/lib/api';
import { POPULAR_PAIRS, pairSlug, parsePair } from '@/lib/pairs';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 3600; // ISR: refresh rates hourly

// Server-side rate lookup with the same primary -> jsdelivr fallback the client uses.
async function getRate(base: string, target: string): Promise<number | null> {
  for (const url of getCurrencyRateApiUrls({ baseCurrencyCode: base })) {
    try {
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) continue;
      const data = await res.json();
      const rate = data?.[base]?.[target];
      if (typeof rate === 'number' && Number.isFinite(rate)) return rate;
    } catch {
      // try next url
    }
  }
  return null;
}

const fmt = (n: number) =>
  n.toLocaleString('en-US', { maximumFractionDigits: n < 1 ? 6 : 2, minimumFractionDigits: 2 });

export function generateStaticParams() {
  return POPULAR_PAIRS.map(([base, target]) => ({ pair: pairSlug(base, target) }));
}

export async function generateMetadata({ params }: { params: { pair: string } }): Promise<Metadata> {
  const parsed = parsePair(params.pair);
  if (!parsed) return { title: 'Currency Converter | Money Rate' };
  const B = parsed.base.toUpperCase();
  const T = parsed.target.toUpperCase();
  const rate = await getRate(parsed.base, parsed.target);
  const title = `${B} to ${T} — Convert ${B}/${T} | Money Rate`;
  const description = rate
    ? `1 ${B} = ${fmt(rate)} ${T}. Live ${B} to ${T} exchange rate, instant converter, and historical chart.`
    : `Convert ${B} to ${T} with live exchange rates, an instant converter, and a historical chart.`;
  const canonical = `/convert/${pairSlug(parsed.base, parsed.target)}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website' },
    twitter: { card: 'summary', title, description },
  };
}

export default async function ConvertPairPage({ params }: { params: { pair: string } }) {
  const parsed = parsePair(params.pair);
  if (!parsed) notFound();
  const { base, target } = parsed;
  const B = base.toUpperCase();
  const T = target.toUpperCase();
  const rate = await getRate(base, target);

  return (
    <main className="max-w-[800px] mx-auto p-4 text-base-content">
      <nav className="text-xs opacity-60 mb-4">
        <Link href="/" className="underline">Home</Link> / {B} to {T}
      </nav>

      <h1 className="text-2xl font-semibold mb-2">Convert {B} to {T}</h1>

      {rate ? (
        <>
          <p className="text-xl mb-4">1 {B} = <strong>{fmt(rate)}</strong> {T}</p>

          <table className="table w-full max-w-[360px] mb-6">
            <thead>
              <tr><th>{B}</th><th>{T}</th></tr>
            </thead>
            <tbody>
              {[1, 10, 100, 1000].map((amt) => (
                <tr key={amt}>
                  <td>{amt.toLocaleString('en-US')}</td>
                  <td>{fmt(rate * amt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p className="mb-6 opacity-70">Live rate for {B}/{T} is temporarily unavailable.</p>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href={`/?base=${base}&amount=1&show=${base},${target}`} className="btn btn-primary btn-sm">
          Open converter
        </Link>
        <Link href={`/chart?q=${B}-${T}`} className="btn btn-sm">
          View {B}/{T} chart
        </Link>
        <Link href={`/convert/${pairSlug(target, base)}`} className="btn btn-sm">
          {T} to {B}
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold opacity-70 mb-2">Popular conversions</h2>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {POPULAR_PAIRS.map(([b, t]) => (
            <li key={`${b}-${t}`}>
              <Link href={`/convert/${pairSlug(b, t)}`} className="underline opacity-80">
                {b.toUpperCase()} → {t.toUpperCase()}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
