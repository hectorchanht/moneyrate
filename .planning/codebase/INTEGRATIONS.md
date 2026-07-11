# External Integrations

**Analysis Date:** 2026-07-11

## APIs & External Services

**Currency & crypto rates (client-side):**
- fawazahmed0/currency-api - Free public exchange-rate dataset (fiat, crypto, commodities). Fetched directly from the browser via SWR.
  - Primary host: `https://{date}.{NEXT_PUBLIC_CURRENCY_API_HOST}/...` (default `currency-api.pages.dev`), Cloudflare Pages mirror.
  - Fallback host: `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@{date}/...` (jsDelivr CDN).
  - URL builder: `getCurrencyRateApiUrls` (`src/lib/api.ts:36-42`); failover fetcher: `fetchWithFallback` (`src/lib/api.ts:11-22`) tries each URL in order and returns the first success.
  - Auth: none (public, unauthenticated).
  - Endpoints: `{version}/currencies.json` (list) and `{version}/currencies/{code}.json` (rates for a base). `date` may be `latest` or `YYYY-MM-DD` for historical rates.

**Historical price charts (server-side proxy):**
- Yahoo Finance Chart API - Historical time-series for a currency/crypto pair.
  - Host: `https://{YAHOO_FINANCE_HOST}/v8/finance/chart/{pair}` (default `query1.finance.yahoo.com`).
  - Proxied through the app's own route handler `src/app/api/currencyChart/route.ts` (called server-side, avoids browser CORS). Client hits same-origin `/api/currencyChart?q=TARGET-BASE`.
  - Auth: none. Sequential fallback tries fiat (`PAIR=X`), then crypto (`TARGET-BASE`), then flipped (`BASE-TARGET`, inverting the value) — see `route.ts:48-53`.
  - Consumers: `src/app/chart/page.tsx` and `src/app/convert/[pair]/page.tsx` via SWR.

## Data Storage

**Databases:**
- None. There is no backend database or persistence tier.

**File Storage:**
- Local filesystem / static assets only. Country flags (`public/country-flags/`), crypto icons (`public/crypto-icons/`), fonts (`src/app/fonts/*.woff`), and PWA icons are bundled and served from `public/`.

**Client persistence:**
- Browser `localStorage` - All user state (base currency, displayed currencies, amount, editing mode, decimal places, language, theme, and the tour "seen" flag). Managed via Jotai `atomWithStorage` in `src/lib/atoms.ts`. Per-browser, not synced.

**Caching:**
- SWR in-memory cache (keyed by request URL, `keepPreviousData` to avoid flicker).
- Service Worker cache (`public/sw.js`, cache name `moneyrate-v1`): navigations network-first with cached-shell fallback; same-origin static assets cache-first; currency-rate API (`*.currency-api.pages.dev`, `cdn.jsdelivr.net`) stale-while-revalidate for offline rates. Production only.
- HTTP caching: the chart route returns `Cache-Control: public, max-age=3600, stale-while-revalidate=86400` (`route.ts:74`).

## Authentication & Identity

**Auth Provider:**
- None. The app has no user accounts, login, or session concept. All state is anonymous and local to the browser.

## Monitoring & Observability

**Error Tracking:**
- None. No Sentry/error-tracking SDK. Client fetch errors are surfaced inline via SWR's `error` field; App Router error boundaries exist (`src/app/error.tsx`, `src/app/global-error.tsx`).

**Analytics:**
- Microsoft Clarity - Session analytics/heatmaps. Loaded via an inline `next/script` snippet from `https://www.clarity.ms/tag/{id}` in `src/app/layout.tsx:73-77`, gated on `NEXT_PUBLIC_CLARITY_ID` (disabled when unset). The former standalone `public/clarity.js` file is gone — the snippet is now inlined. `*.clarity.ms` is allow-listed in the CSP `script-src`/`connect-src`.

**Logs:**
- `console.*` only. ASCII-art banner and drag-drop init logs on the client (`src/app/page.tsx`, `src/lib/fns.ts`). No server-side request logging in the route handler.

## CI/CD & Deployment

**Hosting:**
- `https://moneyrate.lol` (Next.js server deployment; Vercel-compatible). No `vercel.json` or other deployment config committed.

**CI Pipeline:**
- No CI workflow files detected (no `.github/workflows/`). Playwright honors `process.env.CI` (retries, `forbidOnly`, no dev-server reuse) in `playwright.config.ts`, indicating CI is anticipated but not yet wired in-repo.

## Environment Configuration

**Public (browser-exposed, `NEXT_PUBLIC_*`):**
- `NEXT_PUBLIC_CLARITY_ID` - Microsoft Clarity project id (analytics disabled when unset).
- `NEXT_PUBLIC_CURRENCY_API_HOST` - Rate API host override (default `currency-api.pages.dev`).
- `NEXT_PUBLIC_SITE_URL` - Canonical origin for metadata/sitemap/robots (default `https://moneyrate.lol`).

**Server-only:**
- `YAHOO_FINANCE_HOST` - Chart API host override (default `query1.finance.yahoo.com`).

**Secrets location:**
- None required. `.env.example` documents all vars; every one has a source-level default. No API keys, tokens, or credentials are used anywhere. `.env*.local` is gitignored.

## Advertising

**Google AdSense:**
- `public/ads.txt` declares a Google AdSense publisher (`google.com, pub-9591354036084214, DIRECT, ...`). No `adsbygoogle`/AdSense script is present in `src/` — the declaration exists but ad units are not currently wired into the app.

## Webhooks & Callbacks

**Incoming:**
- None.

**Outgoing:**
- None. The only server endpoint is the read-only `/api/currencyChart` proxy (GET only).

## Progressive Web App

- Manifest: `public/site.webmanifest` (standalone display, maskable 192/512 icons).
- Service worker: `public/sw.js`, registered by `src/components/ServiceWorkerRegister.tsx` (production only) for offline support.
- Install prompt: `src/components/InstallButton.tsx` captures `beforeinstallprompt` and shows a custom "Install app" button (anchored `data-tour="tour-install"` for the onboarding tour).

---

*Integration audit: 2026-07-11*
