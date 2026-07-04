// Popular currency pairs used for SEO landing pages and the sitemap.
export const POPULAR_PAIRS: [string, string][] = [
  ['usd', 'eur'], ['eur', 'usd'], ['usd', 'gbp'], ['gbp', 'usd'],
  ['usd', 'jpy'], ['usd', 'cad'], ['usd', 'aud'], ['usd', 'chf'],
  ['usd', 'cny'], ['usd', 'hkd'], ['usd', 'inr'], ['eur', 'gbp'],
  ['btc', 'usd'], ['eth', 'usd'], ['usd', 'btc'], ['xau', 'usd'],
];

// Parse a "usd-to-eur" slug into currency codes. Returns null when malformed.
export function parsePair(slug: string): { base: string; target: string } | null {
  const m = String(slug).toLowerCase().match(/^([a-z]{2,6})-to-([a-z]{2,6})$/);
  if (!m || m[1] === m[2]) return null;
  return { base: m[1], target: m[2] };
}

export const pairSlug = (base: string, target: string) => `${base}-to-${target}`;

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://moneyrate.lol';
