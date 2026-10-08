import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/pairs';

export const metadata: Metadata = {
  title: 'API Docs — MoneyRate',
  description:
    'Free currency conversion API: 1,000 requests/day/IP on the free tier, 100,000/day with a $5/month paid key.',
  alternates: { canonical: '/api-docs' },
  openGraph: {
    title: 'API Docs — MoneyRate',
    description: 'Free currency conversion API: 1,000 requests/day/IP free, 100,000/day paid.',
    type: 'website',
    url: '/api-docs',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Money Rate — Fiat + Crypto Conversion' }],
  },
};

const CODE = 'font-mono text-sm bg-base-200 rounded px-2 py-1';

export default function ApiDocsPage() {
  return (
    <div className="m-auto max-w-[800px] p-4">
      <h1 className="text-2xl font-bold mb-2">MoneyRate API</h1>
      <p className="opacity-70 mb-6">
        Convert currencies over HTTP. Free for reasonable use — no signup.
      </p>

      <h2 className="text-lg font-semibold mb-2">Endpoint</h2>
      <p className={CODE}>GET /api/convert?from=USD&amp;to=HKD&amp;amount=1</p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Parameters</h2>
      <ul className="list-disc ml-6 space-y-1 text-sm">
        <li><span className={CODE}>from</span> — 2–6 letter code (required), e.g. USD, BTC</li>
        <li><span className={CODE}>to</span> — 2–6 letter code (required)</li>
        <li><span className={CODE}>amount</span> — positive number (optional, default 1)</li>
        <li><span className={CODE}>license_key</span> — paid key (optional, see below)</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Example</h2>
      <pre className="bg-base-200 rounded p-3 text-sm overflow-x-auto">
{`$ curl "${SITE_URL}/api/convert?from=USD&to=HKD&amount=100"
{
  "from": "USD",
  "to": "HKD",
  "amount": 100,
  "rate": 7.8,
  "result": 780,
  "rateDate": "2026-10-08",
  "timestamp": "2026-10-08T...",
  "tier": "free"
}`}
      </pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">Tiers</h2>
      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr><th></th><th>Free</th><th>Paid — $5/month</th></tr>
          </thead>
          <tbody>
            <tr><td>Requests</td><td>1,000 / day / IP</td><td>100,000 / day / IP</td></tr>
            <tr><td>Signup</td><td>None</td><td>License key via Gumroad</td></tr>
            <tr><td>Use</td><td>—</td><td>Append <span className={CODE}>?license_key=YOUR_KEY</span></td></tr>
          </tbody>
        </table>
      </div>

      <h2 id="paid" className="text-lg font-semibold mt-6 mb-2">Paid tier</h2>
      <p className="text-sm opacity-70 mb-2">
        The paid key is not on sale yet — the free tier covers almost everyone.
        When it launches, your Gumroad license key unlocks the paid limit;
        every response carries <span className={CODE}>X-Tier</span>,{' '}
        <span className={CODE}>X-RateLimit-Limit</span> and{' '}
        <span className={CODE}>X-RateLimit-Remaining</span> headers so you can
        watch usage. Limits are per IP, per UTC day.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Developers</h2>
      <ul className="list-disc ml-6 space-y-1 text-sm">
        <li>
          <strong>MCP server</strong> — <span className={CODE}>npx -y moneyrate-mcp</span> exposes{' '}
          <span className={CODE}>convert_currency</span> and <span className={CODE}>currency_chart</span> tools
          to Claude Desktop / Claude Code and other MCP clients. Zero dependencies, Node 18+.
        </li>
        <li>
          <strong>JS/TS SDK</strong> — <span className={CODE}>npm install moneyrate-api</span>:{' '}
          <span className={CODE}>new MoneyRate().convert(&#123;from, to, amount&#125;)</span>,{' '}
          <span className={CODE}>.chart(q)</span>. Zero runtime dependencies, typed.
        </li>
        <li>
          <strong>llms.txt</strong> — <a href="/llms.txt" className="link">/llms.txt</a> documents the API,
          tiers, MCP server and SDK for AI agents.
        </li>
      </ul>

      <p className="text-sm mt-6">
        <a href="/" className="link">&larr; Back to the converter</a>
      </p>
    </div>
  );
}
