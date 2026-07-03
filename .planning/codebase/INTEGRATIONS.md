# External Integrations

**Analysis Date:** 2026-07-03

## APIs & External Services

**Currency Exchange Rates:**
- Fawaz Ahmed Currency API (community-maintained, `currency-api.pages.dev`) - Primary source for latest and historical fiat/crypto exchange rates
  - SDK/Client: raw `fetch` via `fetcher` helper (`src/lib/api.ts:1`)
  - URL builder: `getCurrencyRateApiUrl` (`src/lib/api.ts:16-18`) — pattern: `https://{date}.currency-api.pages.dev/{apiVersion}/currencies{/baseCurrencyCode}.json`
  - Auth: None (public, unauthenticated JSON API)
  - Consumed in: `src/app/page.tsx:83-84` via `useSWR`

**Currency Chart Data (legacy/unused path):**
- MTFX Group rate API (`www.mtfxgroup.com`) - Chart data endpoint, URL builder still present but appears superseded by Yahoo Finance
  - Builder: `getCurrencyChartApiUrl` (`src/lib/api.ts:21-23`)
  - Referenced (commented out) in `src/app/api/currencyChart/route.ts:4-12` — old implementation retained as a comment, not active code
  - Auth: None

**Currency Chart Data (active):**
- Yahoo Finance API (`query1.finance.yahoo.com`) - Historical chart/price data for fiat pairs and crypto pairs
  - Used server-side in the Next.js API route `src/app/api/currencyChart/route.ts:32` (function `getApiUri`)
  - Fetches three variants in parallel (fiat FX pair with `=X` suffix, direct crypto pair, and flipped crypto pair) to handle both fiat and crypto rate pairs (`src/app/api/currencyChart/route.ts:35-39`)
  - Auth: None (unauthenticated public endpoint)
  - No API key or rate-limit handling implemented

**Currency/Crypto Icon Images:**
- CoinCap asset CDN (`assets.coincap.io`) - Remote image source allowlisted for crypto icons
  - Configured in `next.config.mjs:4-11` (`images.remotePatterns`, hostname `assets.coincap.io`, path `/assets/icons/**`)
  - Consumption site not directly found in `src/` — likely used as a fallback pattern alongside local `public/crypto-icons/*` assets referenced in `src/components/CountryImg.tsx:52`

**Drag & Drop Touch Polyfill:**
- `drag-drop-touch-js.github.io` - Third-party JS polyfill loaded dynamically at runtime for mobile drag-and-drop support
  - Loaded via injected `<script>` tag in `src/app/page.tsx:41` (`useDragDropTouch` hook, `src/app/page.tsx:38-64`)
  - Not an npm dependency; fetched directly from GitHub Pages at runtime

**Related Product Link:**
- `https://aimystock.moneyrate.lol/` - Outbound link to a sibling product, referenced in `src/app/page.tsx:170` (not an API integration, just a hyperlink)

## Data Storage

**Databases:**
- None. No database client, ORM, or connection configuration found anywhere in the codebase.

**File Storage:**
- Local filesystem only (static assets in `public/`, e.g. `public/country-flags/`, `public/crypto-icons/`, `public/img/`)

**Caching:**
- SWR in-memory client-side cache (`swr` package) — used for all data fetching, with `keepPreviousData: true` (`src/app/page.tsx:83-84`, `src/app/chart/page.tsx:35`)
- No server-side or distributed cache (e.g. Redis) detected

**Client-side Persistence:**
- Browser `localStorage` via Jotai's `atomWithStorage`, for all user preferences and app state: base currency, displayed currencies, currency input value, editing mode, decimal places, language (`src/lib/atoms.ts:6-13`)

## Authentication & Identity

**Auth Provider:**
- None. No authentication, session management, or identity provider integration found. The application has no user accounts or login flow.

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry, Bugsnag, or similar error tracking SDK found)

**Analytics:**
- Microsoft Clarity - Session recording / behavioral analytics
  - Loaded via `public/clarity.js`, injected in `src/app/layout.tsx:41` (`<script src="/clarity.js" async />`)
  - Project ID embedded directly in the script: `p077apilbh`
  - Loads external script from `https://www.clarity.ms/tag/{id}` at runtime

**Advertising:**
- Google AdSense - Publisher verification only
  - `public/ads.txt` declares: `google.com, pub-9591354036084214, DIRECT, f08c47fec0942fa0`
  - No AdSense script tags or ad units found currently wired into React components (verification file only)

**Logs:**
- `console.log` / `console.error` used ad hoc for client-side debugging (e.g. `src/app/page.tsx:46-54` drag-drop-touch load/error handling)
- No structured logging or log aggregation service

## CI/CD & Deployment

**Hosting:**
- Inferred: Vercel-compatible Next.js hosting (standard `next build`/`next start` scripts; no `vercel.json` present, no other IaC/deploy config found)
- Production domain: `https://moneyrate.lol` (per `README.md`)

**CI Pipeline:**
- None detected — no `.github/workflows/`, no other CI config files found in the repository

## Environment Configuration

**Required env vars:**
- None. No `.env` files exist and no `process.env` references were found anywhere in `src/`. All external endpoints and IDs (Clarity project ID, AdSense publisher ID, CoinCap hostname) are hardcoded directly in source/public files.

**Secrets location:**
- Not applicable — no secrets or credentials are used by this application (all integrated APIs are public/unauthenticated).

## Webhooks & Callbacks

**Incoming:**
- None. The only server-side route, `src/app/api/currencyChart/route.ts`, is a `GET` endpoint that proxies/aggregates public third-party chart data; it does not receive webhooks.

**Outgoing:**
- None.

---

*Integration audit: 2026-07-03*
