/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production';

// Content Security Policy.
// - script/style 'unsafe-inline': required by Next.js' inline bootstrap and recharts' inline styles.
// - 'unsafe-eval' in dev only: webpack HMR / react-refresh need it; never shipped to production.
// - connect-src: browser-side SWR hits the currency-api hosts directly; the chart route is same-origin.
// - clarity.ms: allowed for the Microsoft Clarity analytics snippet loaded from /clarity.js.
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://www.clarity.ms https://*.clarity.ms`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data:`,
  `font-src 'self'`,
  `connect-src 'self' https://*.currency-api.pages.dev https://cdn.jsdelivr.net https://*.clarity.ms`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `form-action 'self'`,
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
