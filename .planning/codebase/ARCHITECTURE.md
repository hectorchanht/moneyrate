<!-- refreshed: 2026-07-03 -->
# Architecture

**Analysis Date:** 2026-07-03

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App Router (Client)                │
├──────────────────────────┬────────────────────────────────────┤
│   Home page (rate list)  │   Chart page (historical rates)    │
│  `src/app/page.tsx`      │  `src/app/chart/page.tsx`          │
└──────────────┬────────────┴──────────────┬─────────────────────┘
               │                            │
               ▼                            ▼
┌─────────────────────────────┐  ┌───────────────────────────────┐
│  Presentational Components   │  │  Next.js Route Handler (BFF)  │
│  `src/components/*.tsx`      │  │ `src/app/api/currencyChart/   │
│                               │  │  route.ts`                    │
└──────────────┬────────────────┘  └──────────────┬─────────────────┘
               │                                    │
               ▼                                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Shared Client Library (`src/lib/`)         │
│  api.ts (fetch/URL builders) · atoms.ts (Jotai state)          │
│  constants.ts · types.ts · svgs.tsx · translations.ts · fns.ts │
└──────────────┬──────────────────────────────┬─────────────────┘
               │                              │
               ▼                              ▼
┌────────────────────────────┐   ┌───────────────────────────────┐
│  Browser localStorage        │   │  External REST APIs           │
│  (via jotai `atomWithStorage`)│   │  currency-api.pages.dev,      │
│                               │   │  query1.finance.yahoo.com     │
└────────────────────────────┘   └───────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Home page | Fetches all currency rates, renders the editable/draggable currency list, handles base-currency switching and value conversion | `src/app/page.tsx` |
| Chart page | Fetches and renders a historical rate line chart for a given currency pair (`?q=BASE-TARGET`), CSV export | `src/app/chart/page.tsx` |
| Currency chart route handler | Server-side proxy to Yahoo Finance chart API; normalizes fiat/crypto/flip lookups into one response shape | `src/app/api/currencyChart/route.ts` |
| Root layout | Declares HTML shell, loads local fonts, wraps app in Jotai `Provider` and `LanguageProvider`, injects Clarity analytics script | `src/app/layout.tsx` |
| Loading fallback | App Router route-level loading UI (thin progress bar) | `src/app/loading.tsx` |
| CountryImg | Renders a flag/crypto icon for a currency code with graceful fallback chain (`flag svg → crypto svg → crypto png → placeholder`) | `src/components/CountryImg.tsx` |
| CurrencyListModal | Modal dialog with two tabs: full currency table (add/remove) and settings panel (editing mode, default value, decimal places, language, reset) | `src/components/CurrencyListModal.tsx` |
| SearchBar | Type-ahead search over all available currencies/commodities/crypto, adds selection to the displayed list | `src/components/SearchBar.tsx` |
| DragHandle | Drag affordance icon enabling HTML5 drag-and-drop reordering of currency rows | `src/components/DragHandle.tsx` |
| LanguageContext | React context wrapping the `languageAtom`, exposes `useLanguage()` | `src/contexts/LanguageContext.tsx` |
| useTranslation | Hook returning the translation dictionary for the active language (fallback to `en`) | `src/hooks/useTranslation.ts` |
| useWindowWidth | Hook tracking `window.innerWidth` for responsive decimal-place logic | `src/hooks/useWindowWidth.ts` |
| lib/api.ts | Fetcher for SWR + URL builders for the currency-rate API and (legacy/unused) chart API | `src/lib/api.ts` |
| lib/atoms.ts | All global state as Jotai atoms, all persisted to `localStorage` via `atomWithStorage` | `src/lib/atoms.ts` |
| lib/constants.ts | Static default values and the `Currency2country` ISO-code-to-flag-country map | `src/lib/constants.ts` |
| lib/types.ts | Shared TypeScript types, including branded `CurrencyCode`/`LanguageCode` types | `src/lib/types.ts` |
| lib/svgs.tsx | Inline SVG icon components used throughout the UI | `src/lib/svgs.tsx` |
| lib/translations.ts | Per-language string dictionaries (30 languages) | `src/lib/translations.ts` |
| lib/fns.ts | Small standalone utilities: `debounce`, `showASCIIArt`, `getDataFromLocalStorage` | `src/lib/fns.ts` |
| theme/theme.ts | Tailwind theme extension (colors, fonts, radii) imported into `tailwind.config.ts` | `src/theme/theme.ts` |
| theme/globals.css | Global CSS incl. Tailwind directives and DaisyUI dark theme | `src/theme/globals.css` |

## Pattern Overview

**Overall:** Client-heavy Next.js 14 App Router single-purpose app ("fat client, thin server"). Nearly all pages are `"use client"` components that fetch directly from third-party public APIs via SWR. The only server-side code is a single Route Handler that proxies/normalizes an external API to work around CORS and to unify fiat/crypto response shapes.

**Key Characteristics:**
- No database, no backend persistence layer — all "server" state is either remote third-party APIs (rates) or browser `localStorage` (user preferences), never combined server-side.
- Global client state is centralized in a flat set of Jotai atoms (`src/lib/atoms.ts`), not React Context or Redux; Context (`LanguageContext`) is a thin adapter over one of those atoms for hook ergonomics.
- Data fetching uses SWR with `keepPreviousData: true` everywhere, meaning components render stale data during revalidation rather than resetting to loading state.
- No component library abstraction beyond DaisyUI/Tailwind utility classes — styling is inline via `className`, not CSS modules or styled-components.
- No formal service/repository layer; URL construction and fetch logic live directly in `src/lib/api.ts` and are called straight from page components with `useSWR`.

## Layers

**Route/Page layer:**
- Purpose: Top-level screens routed by the Next.js App Router file convention.
- Location: `src/app/page.tsx`, `src/app/chart/page.tsx`, `src/app/layout.tsx`, `src/app/loading.tsx`
- Contains: Page components, data fetching via `useSWR`, event handlers, top-level layout/markup.
- Depends on: `src/components/*`, `src/hooks/*`, `src/lib/*`, `src/contexts/*`.
- Used by: Next.js router (file-system based, no manual route config).

**API/Route Handler layer:**
- Purpose: Server-side proxy/normalization for data that cannot be fetched directly from the browser (or needs merging of multiple upstream shapes).
- Location: `src/app/api/currencyChart/route.ts`
- Contains: A single `GET` handler.
- Depends on: `query1.finance.yahoo.com` (external, unauthenticated).
- Used by: `src/app/chart/page.tsx` via `useSWR('/api/currencyChart?q=...')`.

**Component layer:**
- Purpose: Reusable, mostly presentational UI pieces with some local state (search query, active tab, image fallback index).
- Location: `src/components/*.tsx`
- Contains: `CountryImg.tsx` (+ exported `ImageWithFallback`), `CurrencyListModal.tsx` (+ nested `CurrencySetting`, `CurrencyListTable`), `SearchBar.tsx`, `DragHandle.tsx`.
- Depends on: `src/lib/atoms.ts`, `src/lib/constants.ts`, `src/lib/svgs.tsx`, `src/hooks/useTranslation.ts`.
- Used by: `src/app/page.tsx`.

**Hooks layer:**
- Purpose: Cross-cutting reusable stateful logic.
- Location: `src/hooks/*.ts`
- Contains: `useTranslation.ts` (i18n lookup), `useWindowWidth.ts` (responsive breakpoint tracking).
- Depends on: `src/contexts/LanguageContext.tsx`, `src/lib/translations.ts`.
- Used by: Components and pages.

**Context layer:**
- Purpose: Provide language state via React context API on top of the Jotai atom, for consumers preferring `useContext` ergonomics.
- Location: `src/contexts/LanguageContext.tsx`
- Contains: `LanguageProvider`, `useLanguage()`.
- Depends on: `src/lib/atoms.ts` (`languageAtom`).
- Used by: `src/app/layout.tsx` (provider), `src/hooks/useTranslation.ts` (consumer).

**Shared library layer (`src/lib/`):**
- Purpose: Pure functions, constants, types, and state atoms shared across the app; no React-specific lifecycle code except `atomWithStorage` calls.
- Location: `src/lib/*`
- Contains: `api.ts` (fetch + URL builders), `atoms.ts` (Jotai global state), `constants.ts` (default values, country map), `types.ts` (shared types), `svgs.tsx` (icon components), `translations.ts` (i18n strings), `fns.ts` (misc utils), `func.ts` (empty/unused).
- Depends on: External `jotai`/`jotai/utils` only.
- Used by: All other layers.

**Theme layer:**
- Purpose: Tailwind/DaisyUI theming configuration and global CSS.
- Location: `src/theme/theme.ts`, `src/theme/globals.css`
- Contains: Tailwind `theme.extend` config object, global CSS with Tailwind directives.
- Depends on: `tailwindcss` types.
- Used by: `tailwind.config.ts` (root), `src/app/layout.tsx` (imports `globals.css`).

## Data Flow

### Primary Request Path (Home page rate list)

1. `Home` component mounts, reads persisted state from atoms (`baseCurAtom`, `currency2DisplayAtom`, `currencyValueAtom`, etc.) (`src/app/page.tsx:75-81`).
2. Two parallel SWR fetches run: all-currency name list (`getCurrencyRateApiUrl({})`) and base-currency rate table (`getCurrencyRateApiUrl({ baseCurrencyCode: baseCur })`) (`src/app/page.tsx:83-84`), hitting `https://latest.currency-api.pages.dev/v1/currencies[...] .json` (`src/lib/api.ts:16-18`).
3. `curObj` is derived via `lodash.pick` to select only the currencies the user wants displayed (`src/app/page.tsx:86-88`).
4. Each displayed row multiplies the fetched rate by `currencyValue` and formats it with a computed decimal-place count that adapts to `windowWidth` and whether the value looks "crypto-small" (`src/app/page.tsx:200-219`).
5. Clicking a non-base row calls `onBaseCurChange`, which recomputes `currencyValue` relative to the new base, then updates `baseCurAtom` (`src/app/page.tsx:98-113`).
6. Editing mode (`isEditingAtom`) enables drag handles and delete icons; dropping a dragged row reorders `currency2DisplayAtom` based on Y-coordinate math (`src/app/page.tsx:122-144`).

### Chart Page Flow

1. `CurrencyChart` reads the `q` query param (`BASE-TARGET`) from `window.location.search` on mount (`src/app/chart/page.tsx:28-33`).
2. SWR fetches `/api/currencyChart?q=...`, which hits the internal Route Handler (`src/app/chart/page.tsx:35`).
3. `src/app/api/currencyChart/route.ts` fires three parallel Yahoo Finance requests (fiat pair with `=X` suffix, raw crypto pair, and the flipped crypto pair) and picks whichever responds with valid data, flipping values (`1 / close[i]`) if the flipped pair was used (`src/app/api/currencyChart/route.ts:35-61`).
4. Client renders a `recharts` `LineChart`, with two range-slider inputs allowing the user to filter the visible timestamp window client-side (`src/app/chart/page.tsx:107-135`).
5. CSV export builds a Blob from `data.data` and triggers a browser download via a synthetic anchor click (`src/app/chart/page.tsx:74-91`).

**State Management:**
- All cross-component state is Jotai atoms defined in `src/lib/atoms.ts`, every one wrapped in `atomWithStorage` so state survives reloads via `localStorage` under fixed keys (`baseCur`, `currency2Display`, `currencyValue`, `isEditing`, `isDefaultCurrencyValue`, `defaultCurrencyValue`, `defaultCurrencyValueDp`, `language`).
- Local component state (search query, active modal tab, chart slider range) uses plain `useState`/`useRef` and is not persisted.
- Remote data (rate tables, chart series) is never written to atoms — it lives only in SWR's cache, keyed by request URL, with `keepPreviousData: true` to avoid UI flicker while revalidating.

## Key Abstractions

**Atom-backed persisted state:**
- Purpose: Represents any user preference or app state that should survive a page reload without a backend.
- Examples: `src/lib/atoms.ts`
- Pattern: `atomWithStorage<T>('storageKey', defaultValue)` from `jotai/utils`; consumed via `useAtom(...)` in components — no manual `localStorage.getItem/setItem` calls needed.

**Branded primitive types:**
- Purpose: Distinguish plain strings that represent domain concepts (currency codes, language codes) from arbitrary strings at the type level.
- Examples: `CurrencyCode`, `LanguageCode` in `src/lib/types.ts:20-22`
- Pattern: `type X = string & { readonly __brand: 'X' }`; cast with `as CurrencyCode` at the boundary (e.g. `src/app/page.tsx:112`).

**Fallback image chain:**
- Purpose: Handle the fact that currency codes may be fiat (has a country flag), crypto (has an SVG or PNG icon), or unknown (needs a placeholder).
- Examples: `src/components/CountryImg.tsx`
- Pattern: `ImageWithFallback` wraps `next/image`, and on `onError` advances through an ordered `fallbackSrc` array (`[png icon, placeholder]`) while the initial `src` is the flag/SVG guess.

**Route Handler as thin external-API proxy:**
- Purpose: Move a CORS-restricted or multi-source lookup to the server without introducing a database or persistent backend.
- Examples: `src/app/api/currencyChart/route.ts`
- Pattern: Single `GET` export, `NextResponse.json(...)` return, no other HTTP methods, no auth, no persistence.

## Entry Points

**Root layout:**
- Location: `src/app/layout.tsx`
- Triggers: Every route in the App Router; wraps all pages.
- Responsibilities: Loads local fonts (`Geist`, `GeistMono`), sets `<html data-theme="dark">`, injects favicon/manifest links and the `/clarity.js` analytics script, wraps children in Jotai `Provider` then `LanguageProvider`.

**Home page (`/`):**
- Location: `src/app/page.tsx`
- Triggers: Root URL navigation.
- Responsibilities: Primary app screen — fetches and displays the editable currency conversion list.

**Chart page (`/chart?q=BASE-TARGET`):**
- Location: `src/app/chart/page.tsx`
- Triggers: Navigating from a currency row link on the home page (`href="/chart?q=..."`, `src/app/page.tsx:226`).
- Responsibilities: Displays historical rate chart with CSV export and pair-flip control.

**Currency chart API (`/api/currencyChart?q=BASE-TARGET`):**
- Location: `src/app/api/currencyChart/route.ts`
- Triggers: `useSWR` call from the chart page.
- Responsibilities: Server-side fetch/normalize of Yahoo Finance historical data.

## Architectural Constraints

- **Threading:** Single-threaded Node.js/browser execution; the only concurrency is `Promise.all` for parallel `fetch` calls in `src/app/api/currencyChart/route.ts:35-43` and the two parallel `useSWR` calls in `src/app/page.tsx:83-84`.
- **Global state:** All cross-cutting state lives in module-level Jotai atoms in `src/lib/atoms.ts`, instantiated once and shared app-wide through the single `Provider` in `src/app/layout.tsx:46`. There is no per-request isolation server-side because there is effectively no server-side state.
- **No database/persistence tier:** The app has zero backend storage; "persistence" is entirely `localStorage` on the client, scoped per-browser, not synced across devices.
- **Client/server boundary:** Almost every file with interactivity is marked `"use client"` (`src/app/page.tsx:1`, `src/app/chart/page.tsx:1`, `src/contexts/LanguageContext.tsx:1`, `src/hooks/useWindowWidth.ts:1`); only `src/app/layout.tsx` and `src/app/api/currencyChart/route.ts` run without that directive (layout is a server component that renders client children; the route handler always runs server-side).
- **Dead/unused code present:** `src/lib/func.ts` is effectively empty (1 line) and `getCurrencyChartApiUrl` in `src/lib/api.ts:21-23` targets `mtfxgroup.com`, an API that is commented out as unused in `src/app/api/currencyChart/route.ts:1-12` (replaced by the Yahoo Finance approach) — treat both as legacy leftovers, not something to depend on.

## Anti-Patterns

### Business logic embedded directly in page component render body

**What happens:** `src/app/page.tsx` computes decimal-place logic, drag-and-drop index math, and currency-value recalculation inline inside the component function (e.g. `src/app/page.tsx:200-219` decimal-place branching, `src/app/page.tsx:122-144` drop-index math).
**Why it's wrong:** Makes the 260+ line page component the single place all business rules live, hard to unit test in isolation from rendering, and increases risk of subtle bugs on every UI tweak (the repo history shows several "bugfix input, dp and ui" style commits).
**Do this instead:** Extract pure functions (e.g. `computeDecimalPlaces(value, windowWidth, isEditing)`, `computeDropIndex(dropY, itemHeight)`) into `src/lib/fns.ts` or a new `src/lib/currency.ts`, and unit test them independently of React.

### Duplicated/dead URL-builder utilities

**What happens:** `src/lib/api.ts` exports both `getCurrencyRateApiUrl` (actively used) and `getCurrencyChartApiUrl` (targets `mtfxgroup.com`, not called anywhere; the real chart route uses Yahoo Finance directly inside the route handler).
**Why it's wrong:** Future maintainers may assume `getCurrencyChartApiUrl` is the live chart data source and modify it with no effect, or worse, wire it back in without realizing it was superseded.
**Do this instead:** Remove `getCurrencyChartApiUrl` and the commented-out `mtfxgroup` block in `src/app/api/currencyChart/route.ts:3-12`, or explicitly document why it is kept.

## Error Handling

**Strategy:** Minimal, UI-level only. There is no centralized error boundary, no logging service, and API route errors are returned as `200 OK` JSON payloads with an `error` field rather than proper HTTP error statuses.

**Patterns:**
- SWR error state is checked directly in JSX (`if (err1 || err2) return <div>Error fetching data...</div>` in `src/app/page.tsx:146`; `if (!!error) return <div>No data for {q}</div>` in `src/app/chart/page.tsx:41`).
- The Route Handler returns `NextResponse.json({ error: ... })` with default 200 status rather than a 4xx status code when the `q` param is missing (`src/app/api/currencyChart/route.ts:22-24`).
- No `try/catch` around the `Promise.all` fetches or `.json()` parsing in `src/app/api/currencyChart/route.ts:35-43` — if all three upstream calls fail or return unexpected shapes, `data?.chart?.result?.[0]` access on `undefined` `data` will throw an unhandled server error.

## Cross-Cutting Concerns

**Logging:** `console.log`/`console.error` only, used for debugging (`src/lib/fns.ts:43` ASCII art banner, `src/app/page.tsx:46-55` drag-drop-touch script load errors). No structured logging or remote log aggregation.

**Validation:** None beyond basic presence checks (e.g., `if (!ratepair)` in `src/app/api/currencyChart/route.ts:22`). No schema validation (e.g., zod) anywhere in the codebase.

**Authentication:** None. The app has no user accounts, sessions, or auth-gated routes; all data is public market data and local-only preferences.

**Internationalization:** `src/lib/translations.ts` provides per-language dictionaries for 30 locales, consumed through `useTranslation()` (`src/hooks/useTranslation.ts`); the active language itself is stored in `languageAtom` (`src/lib/atoms.ts:13`) and exposed via `LanguageContext` (`src/contexts/LanguageContext.tsx`).

---

*Architecture analysis: 2026-07-03*
