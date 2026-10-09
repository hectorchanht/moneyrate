// Popular currency pairs used for SEO landing pages and the sitemap.
// Expanded 2026-10-08: every major fiat vs USD (both directions) + key
// crosses + crypto — each pair page carries the affiliate strip, so
// long-tail "X to Y" searches monetize directly.
export const POPULAR_PAIRS: [string, string][] = [
  // USD vs majors (both directions)
  ['usd', 'eur'], ['eur', 'usd'],
  ['usd', 'gbp'], ['gbp', 'usd'],
  ['usd', 'jpy'], ['jpy', 'usd'],
  ['usd', 'cad'], ['cad', 'usd'],
  ['usd', 'aud'], ['aud', 'usd'],
  ['usd', 'chf'], ['chf', 'usd'],
  ['usd', 'cny'], ['cny', 'usd'],
  ['usd', 'hkd'], ['hkd', 'usd'],
  ['usd', 'inr'], ['inr', 'usd'],
  ['usd', 'sgd'], ['sgd', 'usd'],
  ['usd', 'nzd'], ['nzd', 'usd'],
  ['usd', 'mxn'], ['mxn', 'usd'],
  // USD vs rest (both directions)
  ['usd', 'brl'], ['brl', 'usd'],
  ['usd', 'krw'], ['krw', 'usd'],
  ['usd', 'twd'], ['twd', 'usd'],
  ['usd', 'thb'], ['thb', 'usd'],
  ['usd', 'myr'], ['myr', 'usd'],
  ['usd', 'idr'], ['idr', 'usd'],
  ['usd', 'php'], ['php', 'usd'],
  ['usd', 'vnd'], ['vnd', 'usd'],
  ['usd', 'zar'], ['zar', 'usd'],
  ['usd', 'aed'], ['aed', 'usd'],
  ['usd', 'sar'], ['sar', 'usd'],
  ['usd', 'sek'], ['sek', 'usd'],
  ['usd', 'nok'], ['nok', 'usd'],
  ['usd', 'dkk'], ['dkk', 'usd'],
  ['usd', 'pln'], ['pln', 'usd'],
  ['usd', 'czk'], ['czk', 'usd'],
  ['usd', 'huf'], ['huf', 'usd'],
  ['usd', 'ils'], ['ils', 'usd'],
  ['usd', 'try'], ['try', 'usd'],
  ['usd', 'ars'], ['ars', 'usd'],
  ['usd', 'clp'], ['clp', 'usd'],
  ['usd', 'cop'], ['cop', 'usd'],
  ['usd', 'pen'], ['pen', 'usd'],
  ['usd', 'egp'], ['egp', 'usd'],
  ['usd', 'ngn'], ['ngn', 'usd'],
  // Key crosses
  ['eur', 'gbp'], ['gbp', 'eur'],
  ['eur', 'jpy'], ['jpy', 'eur'],
  ['eur', 'chf'], ['chf', 'eur'],
  ['eur', 'cad'], ['cad', 'eur'],
  ['gbp', 'jpy'], ['jpy', 'gbp'],
  ['eur', 'hkd'], ['hkd', 'eur'],
  ['gbp', 'hkd'], ['hkd', 'gbp'],
  // Crypto
  ['btc', 'usd'], ['usd', 'btc'],
  ['eth', 'usd'], ['usd', 'eth'],
  ['btc', 'eur'], ['eth', 'eur'],
  // Metals
  ['xau', 'usd'], ['xag', 'usd'],
];

// Parse a "usd-to-eur" slug into currency codes. Returns null when malformed.
export function parsePair(slug: string): { base: string; target: string } | null {
  const m = String(slug).toLowerCase().match(/^([a-z]{2,6})-to-([a-z]{2,6})$/);
  if (!m || m[1] === m[2]) return null;
  return { base: m[1], target: m[2] };
}

export const pairSlug = (base: string, target: string) => `${base}-to-${target}`;

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://moneyrate.lol';
