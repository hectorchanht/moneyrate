<!-- refreshed: 2026-07-11 -->
# Architecture

**Analysis Date:** 2026-07-11

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                   Browser (client-only app)                  │
├──────────────────┬──────────────────┬───────────────────────┤
│   Home / list    │   Chart page     │   /convert/[pair]     │
│  `src/app/       │  `src/app/       │   SEO landing (SSR/ISR)│
│   page.tsx`      │   chart/page.tsx`│  `.../convert/[pair]/  │
│  (use client)    │  (use client)    │   page.tsx` (server)  │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│      State + fetch layer (client)                            │
│  Jotai atoms `src/lib/atoms.ts` (12, localStorage-backed)    │
│  SWR + `fetchWithFallback` `src/lib/api.ts`                  │
│  Tour engine (driver.js) `src/lib/tourSteps.ts`             │
└───────┬──────────────────────────────────┬──────────────────┘
        │                                   │
        ▼                                   ▼
┌───────────────────────────┐   ┌──────────────────────────────┐
│ External rate APIs         │   │ Same-origin route handler     │
│ currency-api.pages.dev +   │   │ `src/app/api/currencyChart/   │
│ cdn.jsdelivr.net (direct   │   │  route.ts` → Yahoo Finance    │
│ browser fetch)             │   │ (chart proxy, only server code)│
└───────────────────────────┘   └──────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  Persistence: browser localStorage only (per-browser)        │
│  prefs + last-known-good rate cache `lastGood:*`             │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Home page | Fetches all rate tables, renders editable/draggable/virtualized currency list, base switching, share links, tour launch | `src/app/page.tsx` |
| Chart page | Historical rate line chart for a `?q=BASE-TARGET` pair, range presets, CSV export, pair-flip | `src/app/chart/page.tsx` |
| Convert pair page | Server-rendered SEO landing per popular currency pair (ISR, hourly) | `src/app/convert/[pair]/page.tsx` |
| Currency chart route | Server proxy to Yahoo Finance; normalizes fiat/crypto/flipped shapes | `src/app/api/currencyChart/route.ts` |
| Root layout | HTML shell, local fonts, Jotai `Provider`, `ThemeApplier`, `LanguageProvider`, service worker + Clarity injection | `src/app/layout.tsx` |
| robots / sitemap | Metadata route handlers for SEO (`/robots.txt`, `/sitemap.xml`) | `src/app/robots.ts`, `src/app/sitemap.ts` |
| error / global-error | Route-level and root-layout error boundaries | `src/app/error.tsx`, `src/app/global-error.tsx` |
| CurrencyRow | Single memoized row: flag, value, 24h change, inline math-expression edit, copy, drag, chart link | `src/components/CurrencyRow.tsx` |
| CurrencyListModal | Modal with currency-table tab + settings tab (editing, defaults, dp, language, sort, date picker, reset) | `src/components/CurrencyListModal.tsx` |
| SearchBar | Type-ahead search (code + name) with keyboard nav, adds currency to display list | `src/components/SearchBar.tsx` |
| CountryImg | Flag/crypto icon with ordered fallback chain | `src/components/CountryImg.tsx` |
| DragHandle | Draggable affordance for row reordering | `src/components/DragHandle.tsx` |
| ThemeApplier | Applies persisted theme to `<html data-theme>` (renders nothing) | `src/components/ThemeApplier.tsx` |
| ThemeToggle | Light/dark toggle button (tour anchor) | `src/components/ThemeToggle.tsx` |
| InstallButton | PWA install prompt button via `beforeinstallprompt` | `src/components/InstallButton.tsx` |
| ServiceWorkerRegister | Registers `/sw.js` in production only (renders nothing) | `src/components/ServiceWorkerRegister.tsx` |
| LanguageContext | Thin React context over `languageAtom` | `src/contexts/LanguageContext.tsx` |
| useTranslation | Active-language dictionary with per-key `tour` fallback to `en` | `src/hooks/useTranslation.ts` |
| useWindowWidth | Debounced viewport width for responsive decimal logic | `src/hooks/useWindowWidth.ts` |
| lib/atoms.ts | All global state as `atomWithStorage` Jotai atoms (12) | `src/lib/atoms.ts` |
| lib/api.ts | SWR fetchers (`fetcher`, `fetchWithFallback`) + rate URL builders | `src/lib/api.ts` |
| lib/tourSteps.ts | driver.js step builder + per-key i18n string lookup | `src/lib/tourSteps.ts` |
| lib/pairs.ts | Popular-pair list, slug parse/build, `SITE_URL` (SEO/sitemap source of truth) | `src/lib/pairs.ts` |
| lib/fns.ts | Pure utils: debounce, math eval (shunting-yard), sort, localStorage helpers, locale resolver | `src/lib/fns.ts` |
| lib/constants.ts | Default values + `Currency2country` flag map | `src/lib/constants.ts` |
| lib/types.ts | Shared types incl. branded `CurrencyCode`, `Language` union (30) | `src/lib/types.ts` |
| lib/translations.ts | Per-language string dictionaries (30 languages, incl. `tour` namespace) | `src/lib/translations.ts` |
| lib/svgs.tsx | Inline SVG icon components | `src/lib/svgs.tsx` |
| theme/tour.css | driver.js popover theming, RTL mirroring, reduced-motion overrides | `src/theme/tour.css` |

## Pattern Overview

**Overall:** Client-only SPA on Next.js App Router with a thin server surface (one route handler + a few server-rendered SEO pages). No database, no auth, no backend session state.

**Key Characteristics:**
- Global client state is a flat set of Jotai `atomWithStorage` atoms (`src/lib/atoms.ts`), each persisted to `localStorage` under a fixed key. React Context (`LanguageContext`) is a thin ergonomic adapter over one atom.
- Remote rate data lives only in SWR's cache (keyed by request URL, `keepPreviousData: true`, `revalidateOnFocus: false`), never written into atoms. Successful responses are additionally mirrored to `localStorage` under `lastGood:*` keys for offline/API-outage fallback.
- Data fetching resilience is layered: `fetchWithFallback` tries the primary `currency-api.pages.dev` host, then the jsdelivr mirror, then the `lastGood:*` cache.
- The only server-side compute is `src/app/api/currencyChart/route.ts` (CORS/multi-shape proxy to Yahoo Finance) and the server-rendered `/convert/[pair]` SEO pages (ISR, `revalidate = 3600`).
- Styling is DaisyUI + Tailwind utility classes inline via `className`; theme is a runtime `data-theme` attribute toggled between `light`/`dark`.
- The onboarding tour is a detached, imperative driver.js overlay driven from `page.tsx` — it lives outside React's tree and is managed via refs, not render state.

## Layers

**Routing / Pages:**
- Purpose: Top-level screens routed by App Router file convention.
- Location: `src/app/page.tsx`, `src/app/chart/page.tsx`, `src/app/convert/[pair]/page.tsx`, `src/app/layout.tsx`, `src/app/loading.tsx`, `src/app/error.tsx`, `src/app/global-error.tsx`
- Contains: Page components, SWR data fetching, event handlers, error boundaries. `page.tsx` and `chart/page.tsx` are `"use client"`; `convert/[pair]/page.tsx` is a server component.
- Depends on: `src/components/*`, `src/hooks/*`, `src/lib/*`, `src/contexts/*`.
- Used by: Next.js file-system router.

**Metadata routes:**
- Purpose: SEO surface — `robots.txt`, `sitemap.xml`.
- Location: `src/app/robots.ts`, `src/app/sitemap.ts`
- Depends on: `src/lib/pairs.ts` (`SITE_URL`, `POPULAR_PAIRS`, `pairSlug`).

**API route handler:**
- Purpose: Server-side proxy/normalization for data the browser can't fetch cross-origin.
- Location: `src/app/api/currencyChart/route.ts`
- Contains: A single `GET` handler with input validation, sequential fiat→crypto→flipped fallback, and `Cache-Control` headers.
- Depends on: Yahoo Finance (`query1.finance.yahoo.com`, host overridable via `YAHOO_FINANCE_HOST`).
- Used by: `src/app/chart/page.tsx` via `useSWR('/api/currencyChart?q=...')`.

**Components:**
- Purpose: Reusable, mostly presentational UI with local state.
- Location: `src/components/*.tsx` (9 components).
- Depends on: `src/lib/atoms.ts`, `src/lib/svgs.tsx`, `src/lib/fns.ts`, `src/hooks/useTranslation.ts`.
- Used by: `src/app/page.tsx` (primary consumer) and `src/app/layout.tsx` (`ThemeApplier`, `ServiceWorkerRegister`).

**Hooks:**
- Purpose: Cross-cutting reusable stateful logic.
- Location: `src/hooks/useTranslation.ts` (i18n lookup), `src/hooks/useWindowWidth.ts` (debounced responsive width).
- Depends on: `src/contexts/LanguageContext.tsx`, `src/lib/translations.ts`, `src/lib/fns.ts`.

**Contexts:**
- Purpose: Provide language state via `useContext` ergonomics over the Jotai atom.
- Location: `src/contexts/LanguageContext.tsx`.
- Used by: `src/app/layout.tsx` (provider), `src/hooks/useTranslation.ts` (consumer).

**Lib (pure/shared):**
- Purpose: Pure functions, constants, types, atoms, tour config, i18n dictionaries.
- Location: `src/lib/*` (`api.ts`, `atoms.ts`, `constants.ts`, `fns.ts`, `pairs.ts`, `svgs.tsx`, `tourSteps.ts`, `translations.ts`, `types.ts`).
- Depends on: External `jotai`/`jotai/utils`, `driver.js` types only.
- Used by: All other layers.

**Theme:**
- Purpose: Tailwind/DaisyUI config, global CSS, tour popover styling.
- Location: `src/theme/theme.ts`, `src/theme/globals.css`, `src/theme/tour.css`.
- Used by: `tailwind.config.ts` (root), `src/app/layout.tsx` (imports all three CSS files).

## Data Flow

### Primary Request Path (Home rate list)

1. `RootLayout` mounts the Jotai `Provider`, `ThemeApplier`, `LanguageProvider`, `ServiceWorkerRegister` (`src/app/layout.tsx:51-80`).
2. `Home` reads persisted atoms via `useAtom` and issues parallel `useSWR` calls through `getCurrencyRateApiUrls` + `fetchWithFallback` (`src/app/page.tsx:115-125`).
3. Successful responses are mirrored to `localStorage` (`lastGood:currencies`, `lastGood:rates:{base}`) for outage fallback (`src/app/page.tsx:133-135`).
4. `effectiveAll` / `effectiveBaseCur` resolve to live SWR data or the `lastGood:*` cache after hydration (`src/app/page.tsx:179-182,298-301`).
5. Displayed pairs are computed (`pick` + 24h change vs yesterday), sorted (`sortCurrencyPairs`), and rendered as `CurrencyRow`s — virtualized via `react-window` `FixedSizeList` when `rows.length > 40` and not editing (`src/app/page.tsx:379-498`).
6. On first run (hydrated, real data present, `!tourSeen`), the driver.js tour auto-starts (`src/app/page.tsx:289-293`).

### Chart Flow

1. `chart/page.tsx` reads `?q=BASE-TARGET` from the URL, calls `useSWR('/api/currencyChart?q=...')` (`src/app/chart/page.tsx:29-36`).
2. Route handler validates `q`, fetches Yahoo Finance sequentially (fiat → crypto → flipped), normalizes to `{date,value,timestamp}[]` (`src/app/api/currencyChart/route.ts:36-70`).
3. On error the page retries the reversed pair once, then renders the Recharts `LineChart` with range presets and CSV export (`src/app/chart/page.tsx:39-49,179-187`).

### SEO / Convert Flow

1. `generateStaticParams` pre-renders `POPULAR_PAIRS` at build; `generateMetadata` fetches the live rate server-side for title/description (`src/app/convert/[pair]/page.tsx:28-50`).
2. `ConvertPairPage` server-fetches the rate (ISR, `revalidate = 3600`), renders a conversion table and deep-links into `/`, `/chart`, and the reverse pair (`src/app/convert/[pair]/page.tsx:52-116`).

### Tour Flow (driver.js)

1. `buildTourSteps(language)` produces a welcome card + 8 anchored feature steps keyed to `data-tour` selectors (`src/lib/tourSteps.ts:57-83`).
2. `startTour` in `page.tsx` filters steps whose anchor is absent from the DOM, reads theme + reduced-motion once, configures RTL via `onPopoverRender`, and holds the driver instance in a ref (`src/app/page.tsx:189-284`).
3. Exit paths (`onDoneClick`/`onCloseClick`/`onDestroyed`) set `tourSeenAtom`; teardown happens only on genuine unmount or the next `startTour` call (`src/app/page.tsx:257-296`).

**State Management:**
- Persisted cross-component state: 12 `atomWithStorage` atoms (`baseCur`, `currency2Display`, `currencyValue`, `isEditing`, `isDefaultCurrencyValue`, `defaultCurrencyValue`, `defaultCurrencyValueDp`, `language`, `sortMode`, `theme`, `tourSeen`, `showDatePicker`) in `src/lib/atoms.ts`.
- Session-only local state uses `useState`/`useRef` (search query, chart slider range, historical date, tour driver ref) and is not persisted.
- Remote data lives only in SWR cache + `lastGood:*` localStorage mirror.

## Key Abstractions

**Persisted atom (`atomWithStorage`):**
- Purpose: Any preference/state that must survive reload without a backend.
- Examples: `src/lib/atoms.ts`
- Pattern: `atomWithStorage<T>('storageKey', default)`, consumed via `useAtom`/`useAtomValue`; no manual `localStorage.getItem/setItem` in components.

**Layered fetch fallback:**
- Purpose: Survive a primary-host outage transparently.
- Examples: `fetchWithFallback` (`src/lib/api.ts:11-22`), consumed with a URL array from `getCurrencyRateApiUrls` (`src/lib/api.ts:36-42`).
- Pattern: Try each URL in order; on total failure, callers fall back to the `lastGood:*` localStorage cache.

**Branded domain types:**
- Purpose: Distinguish currency/language strings from arbitrary strings at the type level.
- Examples: `CurrencyCode`, `LanguageCode` (`src/lib/types.ts:24-26`); `Language` union of 30 tags (`src/lib/types.ts:10-13`).
- Pattern: `type X = string & { readonly __brand: 'X' }`; cast `as CurrencyCode` at the boundary (`src/app/page.tsx:143`).

**Detached imperative tour:**
- Purpose: Guide first-run users without embedding overlay UI in React's tree.
- Examples: `startTour` + refs (`src/app/page.tsx:94-95,189-296`), step builder (`src/lib/tourSteps.ts`).
- Pattern: driver.js instance held in `tourDriverRef`; anchored via `data-tour` attributes (never translated `aria-label`s); torn down only on unmount.

**Safe math evaluator:**
- Purpose: Let the amount input accept expressions (`5+3*2`) under a CSP that blocks `eval`/`Function`.
- Examples: `evalMathExpression` shunting-yard parser (`src/lib/fns.ts:70-144`), used by `CurrencyRow` (`src/components/CurrencyRow.tsx:54-58`).

## Entry Points

**Root layout:**
- Location: `src/app/layout.tsx`
- Triggers: Every route.
- Responsibilities: HTML shell, local fonts, imports `globals.css` + `driver.js` CSS + `tour.css`, wraps children in Jotai `Provider` → `ThemeApplier` → `LanguageProvider`, mounts `ServiceWorkerRegister`, conditionally injects Clarity when `NEXT_PUBLIC_CLARITY_ID` is set.

**Home page:**
- Location: `src/app/page.tsx`
- Triggers: Root URL (also hydrates state from `?base=&amount=&show=` share links).
- Responsibilities: Primary editable conversion list, share, theme, tour.

**Chart page:**
- Location: `src/app/chart/page.tsx`
- Triggers: Row links (`/chart?q=...`) and `/convert/[pair]` chart CTA.

**Convert pair page:**
- Location: `src/app/convert/[pair]/page.tsx`
- Triggers: SEO crawl / direct navigation to `/convert/usd-to-eur`. Server-rendered with ISR.

**Chart route handler:**
- Location: `src/app/api/currencyChart/route.ts`
- Triggers: `useSWR` from the chart page.

**Metadata routes:**
- Location: `src/app/robots.ts`, `src/app/sitemap.ts` — served as `/robots.txt`, `/sitemap.xml`.

## Architectural Constraints

- **Threading:** Single-threaded browser/Node execution. Concurrency is limited to parallel `useSWR` calls in `src/app/page.tsx:115-125` and sequential (not parallel) fallback fetches in the chart route (`src/app/api/currencyChart/route.ts:48-53`).
- **Global state:** All cross-cutting state is module-level Jotai atoms in `src/lib/atoms.ts`, instantiated once under the single `Provider` in `src/app/layout.tsx:65`. No server-side per-request state exists.
- **No database/persistence tier:** "Persistence" is `localStorage` only, scoped per-browser, not synced across devices. Rate outage fallback also relies on `localStorage` (`lastGood:*` keys).
- **Client/server boundary:** Interactive files are `"use client"` (`page.tsx`, `chart/page.tsx`, all `src/components/*` except type-only, `LanguageContext.tsx`, `useWindowWidth.ts`). Server-only: `layout.tsx`, `convert/[pair]/page.tsx`, `api/currencyChart/route.ts`, `robots.ts`, `sitemap.ts`.
- **Hydration discipline:** localStorage-derived values must not read at module-eval or first render — `page.tsx` gates all such reads behind a `hydrated` flag set in a mount effect (`src/app/page.tsx:129-130`) to avoid SSR/CSR mismatches. `ThemeToggle` and `ThemeApplier` use the same `mounted`/effect pattern.
- **CSP forbids `eval`:** `next.config.mjs` ships a strict CSP (no `unsafe-eval` in production), so the amount input's math support uses a hand-written shunting-yard parser, never `eval()`/`Function()` (`src/lib/fns.ts:67-144`).
- **RTL scope:** Only `ar`/`ur` are RTL; `dir` is applied to the tour popover node only, never to `<html>`/`<body>` (`src/app/page.tsx:42,245-247`).
- **Dead/legacy code:** `getCurrencyRateApiUrl` is a back-compat single-URL helper superseded by `getCurrencyRateApiUrls` (`src/lib/api.ts:44-45`). `public/fns.js` and `public/img/q.svg` are static assets, not part of the module graph.

## Anti-Patterns

### Business logic concentrated in the Home render body

**What happens:** `src/app/page.tsx` (~500 lines) holds fetching, share-link hydration, device-locale defaulting, 24h-change math, sort, drag-drop, virtualization decisions, and the entire tour lifecycle in one component.
**Why it's wrong:** Hard to test in isolation and easy to introduce effect-dependency bugs (see the extensive teardown-timing comments around `src/app/page.tsx:270-296`).
**Do this instead:** Continue the existing extraction trend — pure logic already lives in `src/lib/fns.ts` (`getResponsiveCryptoDp`, `getDropIndex`, `evalMathExpression`, `sortCurrencyPairs`, `resolveTourLocale`) with unit tests. Push new logic there or into a hook rather than the render body.

### Redeclared shared types

**What happens:** `CurrencyRates` is defined in `src/lib/types.ts:6-8` yet redeclared locally in `src/app/page.tsx:86-88`.
**Why it's wrong:** Two sources of truth for one shape drift over time.
**Do this instead:** Import the shared type from `src/lib/types.ts` for new code.

## Error Handling

**Strategy:** Fail soft on the client, explicit status codes on the server, framework error boundaries as backstop.

**Patterns:**
- SWR errors are checked in JSX and only shown when no cached fallback exists: `if ((err1 || err2) && !effectiveBaseCur) return <div>Error fetching data…</div>` (`src/app/page.tsx:407`); `if (!!error && triedReverse) return <div>No data for {q}</div>` (`src/app/chart/page.tsx:64`).
- `fetcher` throws on non-2xx so SWR populates `error` (`src/lib/api.ts:1-7`); `fetchWithFallback` swallows per-URL failures and rethrows only if all fail (`src/lib/api.ts:11-22`).
- The chart route returns proper `{ status: 400 }` / `{ status: 404 }` on bad input / no data, and wraps each upstream fetch in try/catch (`src/app/api/currencyChart/route.ts:11-23,36-64`).
- Route-level `error.tsx` and root `global-error.tsx` boundaries catch render-time throws and offer a `reset()` retry (`src/app/error.tsx`, `src/app/global-error.tsx`).
- Context misuse throws explicitly: `useLanguage` throws outside its provider (`src/contexts/LanguageContext.tsx:22-24`).
- localStorage reads/writes are wrapped in try/catch and degrade to best-effort (`src/lib/fns.ts:165-185`).

## Cross-Cutting Concerns

**Logging:** `console.error` in error boundaries and script-load failures (`src/app/error.tsx:13`, `src/app/page.tsx:67,74`); `console.log` for the ASCII banner and polyfill init. No logging in the chart route or a tracking SDK; Microsoft Clarity is the only analytics, injected client-side.

**Validation:** Server input validated with a regex in the chart route (`RATEPAIR_RE`, `src/app/api/currencyChart/route.ts:4`); slug validation in `parsePair` (`src/lib/pairs.ts:10-14`). Client trusts atom/localStorage values and defends around parsing.

**Authentication:** None — no accounts, no backend session.

**Security headers:** Strict CSP + `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` applied to all routes in `next.config.mjs:24-35`.

**i18n:** `useTranslation` returns the active-language dictionary with a per-key `tour` fallback to `en` (`src/hooks/useTranslation.ts:15-22`); tour strings resolve via `getTourString` (`src/lib/tourSteps.ts:29-32`). Device locale seeds the default language on first load via `resolveTourLocale` (`src/app/page.tsx:157-163`).

**Theme:** Persisted `themeAtom` applied to `<html data-theme>` by `ThemeApplier` on every route (`src/components/ThemeApplier.tsx`).

---

*Architecture analysis: 2026-07-11*
