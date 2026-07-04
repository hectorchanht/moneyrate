<!-- GSD:project-start source:PROJECT.md -->
## Project

**moneyrate**

moneyrate is a client-only Next.js 14 (App Router) currency-rate app: a fast, editable list that converts one base amount into many currencies/crypto/commodities at once, with historical rates, charts, and shareable links. It runs entirely in the browser (no backend) — rates come from public APIs, all user state persists in `localStorage`. This milestone adds a **first-run onboarding tour** so new visitors discover the app's non-obvious interactions (tap a row to switch base, inline-edit the amount, search to add currencies, settings, share, theme, historical view, PWA install).

**Core Value:** A first-time visitor understands how to use moneyrate within seconds of landing — the key interactions are demonstrated, not hidden.

### Constraints

- **Tech stack**: Next.js 14 App Router, React 18, TypeScript, Jotai, SWR, DaisyUI + Tailwind — tour must fit this, client-side only (`"use client"`).
- **Library**: driver.js — chosen for small (~5kb) vanilla, selector-based footprint matching the app's bundle-conscious, vendored-dependency style.
- **Selectors**: anchor on `data-tour` attributes, never on translated `aria-label`s.
- **No backend**: "seen" state is `localStorage` only, per-browser.
- **i18n**: tour copy must be added to all 30 language dictionaries.
- **Accessibility**: keyboard-navigable and dismissible; consistent with existing a11y work (commit 7daf09d).
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript ^5 - Application code (`src/**/*.ts`, `src/**/*.tsx`), strict mode enabled (`tsconfig.json`)
- JavaScript - Plain script assets, e.g. `public/clarity.js`, `public/fns.js`
- CSS - Tailwind entry stylesheet `src/theme/globals.css`
## Runtime
- Node.js (version not pinned — no `.nvmrc` or `engines` field found in `package.json`)
- Next.js runtime (App Router), server-side API routes execute in Node.js runtime by default
- Declared: Yarn 3.6.1 via `packageManager` field in `package.json` ("yarn@3.6.1+sha512...")
- Yarn PnP artifact present: `.pnp.loader.mjs` (root)
- However, a `package-lock.json` (npm) is also present and was recently modified (per git status), and a `bun.lockb` (Bun lockfile) also exists at the repo root
- **Conflicting lockfiles detected:** `package-lock.json`, `bun.lockb`, and Yarn PnP loader coexist — indicates inconsistent package manager usage across contributors/environments. Treat with caution; confirm which lockfile is authoritative before installing dependencies.
## Frameworks
- Next.js 14.2.15 - React framework, App Router (`src/app/`), used for pages, layouts, and API routes
- React ^18 / react-dom ^18 - UI rendering library
- Tailwind CSS ^3.4.1 - Utility-first CSS framework, configured in `tailwind.config.ts`
- DaisyUI ^4.12.13 - Tailwind component library, configured as a Tailwind plugin (`tailwind.config.ts:13`), dark theme only (`tailwind.config.ts:15-19`)
- Jotai ^2.12.3 - Atomic state management, atoms with `localStorage` persistence via `atomWithStorage` (`src/lib/atoms.ts`)
- SWR ^2.2.5 - Client-side data fetching/caching hook, used in `src/app/page.tsx:24` and `src/app/chart/page.tsx:5`
- Recharts ^2.13.3 - Chart rendering, used in `src/app/chart/page.tsx`
- Lodash ^4.17.21 - Utility functions (e.g. `pick` used in `src/app/page.tsx:22`)
- Not detected — no test runner, test config, or test files found in the repository
- Next.js CLI (`next dev`, `next build`, `next start`, `next lint`) - see `package.json:6-11`
- PostCSS ^8 with `@tailwindcss/postcss` plugin config in `postcss.config.mjs`
- ESLint ^8 with `eslint-config-next` 14.2.15, config in `.eslintrc.json` (extends `next/core-web-vitals`, `next/typescript`; disables `@typescript-eslint/no-explicit-any`)
## Key Dependencies
- `next` (14.2.15) - Application framework, routing, SSR, API routes, image optimization
- `react` / `react-dom` (^18) - UI rendering
- `jotai` (^2.12.3) - Global/local state persisted to `localStorage`, core to currency list and settings persistence
- `swr` (^2.2.5) - Data fetching/caching layer for all currency rate and chart data
- `@tailwindcss/forms` (^0.5.9) - Form styling plugin for Tailwind
- `daisyui` (^4.12.13) - Component styling on top of Tailwind
- `recharts` (^2.13.3) - Chart visualization for `src/app/chart/page.tsx`
- `lodash` (^4.17.21) - General utility functions
## Configuration
- No `.env` files present in the repository (verified via filesystem listing)
- No environment variables referenced anywhere in `src/` (no `process.env` usage found)
- All configuration is static/compile-time (Next.js config, Tailwind config)
- `next.config.mjs` - Configures allowed remote image hostname `assets.coincap.io` for `next/image` (crypto icon fallback source)
- `tsconfig.json` - Strict TypeScript, path alias `@/*` → `./src/*`, Next.js TS plugin enabled
- `tailwind.config.ts` - Content globs for `src/pages`, `src/components`, `src/app`; imports shared theme from `src/theme/theme.ts`; DaisyUI dark theme only
- `postcss.config.mjs` - Tailwind CSS PostCSS plugin only
## Platform Requirements
- Node.js + Yarn 3.6.1 (per `packageManager` field) — though repo also contains npm and Bun lockfiles (see package manager note above)
- No documented Node version requirement (no `.nvmrc`, no `engines` field)
- Deployed at `https://moneyrate.lol` (per `README.md` and Open Graph-style references)
- Compatible with Vercel-style Next.js hosting (standard Next.js build/start scripts, `next/image` remote pattern usage), though no `vercel.json` or explicit deployment config found in the repo
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- React components: `PascalCase.tsx` — `src/components/CountryImg.tsx`, `src/components/CurrencyListModal.tsx`, `src/components/DragHandle.tsx`, `src/components/SearchBar.tsx`
- Next.js App Router special files: lowercase, framework-mandated — `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/loading.tsx`, `src/app/api/currencyChart/route.ts`
- Hooks: `camelCase.ts` prefixed with `use` — `src/hooks/useTranslation.ts`, `src/hooks/useWindowWidth.ts`
- Contexts: `PascalCase.tsx` suffixed with `Context` — `src/contexts/LanguageContext.tsx`
- Library/utility modules: `camelCase.ts` — `src/lib/atoms.ts`, `src/lib/api.ts`, `src/lib/constants.ts`, `src/lib/fns.ts`, `src/lib/types.ts`, `src/lib/translations.ts`, `src/lib/svgs.tsx`
- One dead file exists: `src/lib/func.ts` is completely empty (0 bytes) — do not add code here; either delete it or repurpose deliberately.
- `camelCase` throughout: `debounce`, `showASCIIArt`, `getDataFromLocalStorage` (`src/lib/fns.ts`), `getCurrencyRateApiUrl`, `getCurrencyChartApiUrl` (`src/lib/api.ts`).
- Event handlers use `on`/`handle` prefixes: `onBaseCurChange`, `handleDrop`, `handleCurrencyValueChange` in `src/app/page.tsx`; `onSelect`, `escFunction`, `clearQuery` in `src/components/SearchBar.tsx`.
- Boolean-returning helpers use `is`/custom comparator names: `areEqual` in `src/components/CountryImg.tsx`.
- `camelCase` for local variables and state: `currencyValue`, `baseCur`, `isEditing`.
- Jotai atoms are suffixed with `Atom`: `baseCurAtom`, `currency2DisplayAtom`, `isEditingAtom`, `defaultCurrencyValueDpAtom` (`src/lib/atoms.ts`).
- Constants intended as fixed defaults use `PascalCase` with a `Default` prefix: `DefaultBaseCur`, `DefaultCurrency2Display`, `DefaultCurrencyValue` (`src/lib/constants.ts`). This deviates from typical `UPPER_SNAKE_CASE` — follow the existing `PascalCase` convention for new default constants in this file, and note `Currency2country` (a large lookup object) also uses `PascalCase`.
- `PascalCase` for types and interfaces, no `I` prefix: `SearchItem`, `CurrencyRates`, `LanguageContextType`, `CurrencyCode` (`src/lib/types.ts`).
- Component prop types are named `<ComponentName>Props` and declared as `interface`: `CurrencyListModalProps`, `CurrencyListTableProps` (`src/components/CurrencyListModal.tsx`), `SearchBarProps` (`src/components/SearchBar.tsx`), `CountryImgProps` (`src/components/CountryImg.tsx`).
- Branded primitive types are used for domain identifiers: `CurrencyCode` and `LanguageCode` are `string & { readonly __brand: '...' }` (`src/lib/types.ts:20-22`). Cast with `as CurrencyCode` / `as LanguageCode` at the boundary where a raw string enters the domain (see `src/app/page.tsx:112`, `src/components/CurrencyListModal.tsx:124-127`).
- Locally-scoped types are sometimes redeclared per-file instead of imported (e.g., `CurrencyRates` is defined both in `src/lib/types.ts` and redeclared locally in `src/app/page.tsx:66-68`). Prefer importing the shared type from `src/lib/types.ts` for new code instead of redeclaring.
## Code Style
- No Prettier config present in the repo (`.prettierrc*` not found). Formatting is whatever ESLint/Next defaults produce plus manual author style.
- Indentation: 2 spaces, consistently.
- Quotes: single quotes are dominant in `.tsx`/`.ts` files (`import ... from '@/lib/atoms'`), though double quotes appear in a few places (e.g., `src/lib/fns.ts:47` uses double quotes). Prefer single quotes for new code to match majority pattern.
- Semicolons: used consistently at statement ends.
- No trailing commas convention is uniformly enforced; both styles appear.
- ESLint config: `.eslintrc.json` (root) extends `next/core-web-vitals` and `next/typescript`.
- Custom rule override: `@typescript-eslint/no-explicit-any` is turned **off**, so `any` is explicitly allowed project-wide (see `func: (...args: any[]) => void` in `src/lib/fns.ts:2`, and `getDataFromLocalStorage(name: string, defaultValue: any)` in `src/lib/fns.ts:46`). New code may use `any` but should prefer specific types where feasible since this is an explicit relaxation, not an endorsement.
- Run via `npm run lint` (`next lint`), defined in `package.json`.
## Import Organization
- `@/*` maps to `./src/*` (configured in `tsconfig.json` `compilerOptions.paths`). Always use `@/lib/...`, `@/components/...`, `@/hooks/...`, `@/contexts/...` for cross-directory imports rather than relative `../../` paths. Relative imports (`./`) are reserved for files within the same directory only.
## Error Handling
- Client data-fetching errors from SWR are checked directly from the hook's `error` field and rendered as a plain error message, not thrown: `if (err1 || err2) return <div className="text-center">Error fetching data. Please try again later.</div>;` (`src/app/page.tsx:146`). Same pattern in `src/app/chart/page.tsx:41`.
- `src/lib/fns.ts:getDataFromLocalStorage` wraps `JSON.parse` in try/catch and falls back to the raw string on parse failure — a defensive pattern to follow when parsing localStorage or other untrusted string data.
- API routes (`src/app/api/currencyChart/route.ts`) validate required query params early and return a `NextResponse.json({ error: ... })` with a user-facing message rather than throwing (`route.ts:22-24`). Note this specific route does not set an HTTP error status code on the response — new API routes should improve on this by adding `{ status: 400 }` or similar.
- Custom React context hooks throw explicit `Error`s when used outside their provider: `useLanguage` throws `new Error('useLanguage must be used within a LanguageProvider')` if context is `undefined` (`src/contexts/LanguageContext.tsx:22-24`). Follow this pattern for any new context.
- No centralized error boundary, error-tracking SDK, or global error handler exists in the codebase.
## Logging
- `console.log` is used for one-off debug/informational messages, e.g., ASCII art banner on load (`src/lib/fns.ts:showASCIIArt`, called from `src/app/page.tsx:58` and `src/app/chart/page.tsx:32`) and confirmation that a dynamically-loaded script initialized (`src/app/page.tsx:46`).
- `console.error` is used for failure paths of dynamically loaded external scripts (`src/app/page.tsx:48,54`).
- No logging exists in API routes (`src/app/api/currencyChart/route.ts`) — failures during upstream fetches are not logged.
## Comments
- Comments are used sparingly and mostly to explain non-obvious business logic or format assumptions, e.g., `// date can be YYYY-MM-DD: 2024-03-06` above `GetCurrencyRateParams` in `src/lib/api.ts:3`, and `// it is [targetCur]-[baseCur]` in `src/app/api/currencyChart/route.ts:17`.
- Commented-out code blocks are left in place rather than deleted, e.g., the "AI Stock Banner" JSX block in `src/app/page.tsx:169-185` and the mtfxgroup fetch logic in `src/app/api/currencyChart/route.ts:3-12`. Do not treat this as a pattern to emulate for new code — remove dead code instead of commenting it out; only pre-existing commented blocks remain for historical/reference reasons.
- No file-level header comments or license banners.
- Not used anywhere in the codebase. Type signatures alone document intent (interfaces/types declared directly above usage).
## Function Design
- Functions taking more than 1-2 arguments use a single destructured options object with defaults, typed via a dedicated `Params` type: `getCurrencyRateApiUrl({ baseCurrencyCode = '', date = 'latest', apiVersion = 'v1' }: GetCurrencyRateParams)` (`src/lib/api.ts:16`).
- React component props are always destructured in the function signature: `const CountryImg: React.FC<CountryImgProps> = ({ code = '', alt = '' }) => {...}` (`src/components/CountryImg.tsx:37`).
- Components with loading/error states return early with a simple conditional JSX block before the main return (`src/app/page.tsx:146-161`, `src/app/chart/page.tsx:41-55`). Follow this early-return-for-loading/error pattern for new data-fetching components rather than nesting ternaries in the main JSX return.
## Module Design
- Components: `default export` at the bottom of the file after declaration, e.g. `export default CurrencyListModal;` (`src/components/CurrencyListModal.tsx:257`), `export default DragHandle;` (`src/components/DragHandle.tsx:21`). Page components (`src/app/page.tsx`, `src/app/chart/page.tsx`) use `export default function Home()` / assign-then-export.
- Utilities, atoms, constants, and types: named exports only, no default export — `src/lib/atoms.ts`, `src/lib/constants.ts`, `src/lib/fns.ts`, `src/lib/api.ts`, `src/lib/types.ts`, `src/lib/svgs.tsx`.
- Hooks: mixed — `useTranslation` is a named export (`src/hooks/useTranslation.ts`), `useWindowWidth` is a default export (`src/hooks/useWindowWidth.ts`). No strict convention enforced; prefer named exports for new hooks for consistency with `useTranslation` and easier tree-shaking/refactor tooling.
- Not used. No `index.ts` re-export files exist anywhere under `src/`. Import directly from the specific module path (e.g., `@/lib/atoms`, `@/components/CountryImg`), not from a directory-level barrel.
- Next.js App Router `"use client"` directive is placed as the first line of files that use browser APIs, hooks, or interactivity: `src/app/page.tsx:1`, `src/app/chart/page.tsx:1`, `src/hooks/useWindowWidth.ts:1`, `src/contexts/LanguageContext.tsx:1`. API routes (`src/app/api/currencyChart/route.ts`) and `src/app/layout.tsx` are server components/route handlers and omit the directive.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## System Overview
```text
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
- No database, no backend persistence layer — all "server" state is either remote third-party APIs (rates) or browser `localStorage` (user preferences), never combined server-side.
- Global client state is centralized in a flat set of Jotai atoms (`src/lib/atoms.ts`), not React Context or Redux; Context (`LanguageContext`) is a thin adapter over one of those atoms for hook ergonomics.
- Data fetching uses SWR with `keepPreviousData: true` everywhere, meaning components render stale data during revalidation rather than resetting to loading state.
- No component library abstraction beyond DaisyUI/Tailwind utility classes — styling is inline via `className`, not CSS modules or styled-components.
- No formal service/repository layer; URL construction and fetch logic live directly in `src/lib/api.ts` and are called straight from page components with `useSWR`.
## Layers
- Purpose: Top-level screens routed by the Next.js App Router file convention.
- Location: `src/app/page.tsx`, `src/app/chart/page.tsx`, `src/app/layout.tsx`, `src/app/loading.tsx`
- Contains: Page components, data fetching via `useSWR`, event handlers, top-level layout/markup.
- Depends on: `src/components/*`, `src/hooks/*`, `src/lib/*`, `src/contexts/*`.
- Used by: Next.js router (file-system based, no manual route config).
- Purpose: Server-side proxy/normalization for data that cannot be fetched directly from the browser (or needs merging of multiple upstream shapes).
- Location: `src/app/api/currencyChart/route.ts`
- Contains: A single `GET` handler.
- Depends on: `query1.finance.yahoo.com` (external, unauthenticated).
- Used by: `src/app/chart/page.tsx` via `useSWR('/api/currencyChart?q=...')`.
- Purpose: Reusable, mostly presentational UI pieces with some local state (search query, active tab, image fallback index).
- Location: `src/components/*.tsx`
- Contains: `CountryImg.tsx` (+ exported `ImageWithFallback`), `CurrencyListModal.tsx` (+ nested `CurrencySetting`, `CurrencyListTable`), `SearchBar.tsx`, `DragHandle.tsx`.
- Depends on: `src/lib/atoms.ts`, `src/lib/constants.ts`, `src/lib/svgs.tsx`, `src/hooks/useTranslation.ts`.
- Used by: `src/app/page.tsx`.
- Purpose: Cross-cutting reusable stateful logic.
- Location: `src/hooks/*.ts`
- Contains: `useTranslation.ts` (i18n lookup), `useWindowWidth.ts` (responsive breakpoint tracking).
- Depends on: `src/contexts/LanguageContext.tsx`, `src/lib/translations.ts`.
- Used by: Components and pages.
- Purpose: Provide language state via React context API on top of the Jotai atom, for consumers preferring `useContext` ergonomics.
- Location: `src/contexts/LanguageContext.tsx`
- Contains: `LanguageProvider`, `useLanguage()`.
- Depends on: `src/lib/atoms.ts` (`languageAtom`).
- Used by: `src/app/layout.tsx` (provider), `src/hooks/useTranslation.ts` (consumer).
- Purpose: Pure functions, constants, types, and state atoms shared across the app; no React-specific lifecycle code except `atomWithStorage` calls.
- Location: `src/lib/*`
- Contains: `api.ts` (fetch + URL builders), `atoms.ts` (Jotai global state), `constants.ts` (default values, country map), `types.ts` (shared types), `svgs.tsx` (icon components), `translations.ts` (i18n strings), `fns.ts` (misc utils), `func.ts` (empty/unused).
- Depends on: External `jotai`/`jotai/utils` only.
- Used by: All other layers.
- Purpose: Tailwind/DaisyUI theming configuration and global CSS.
- Location: `src/theme/theme.ts`, `src/theme/globals.css`
- Contains: Tailwind `theme.extend` config object, global CSS with Tailwind directives.
- Depends on: `tailwindcss` types.
- Used by: `tailwind.config.ts` (root), `src/app/layout.tsx` (imports `globals.css`).
## Data Flow
### Primary Request Path (Home page rate list)
### Chart Page Flow
- All cross-component state is Jotai atoms defined in `src/lib/atoms.ts`, every one wrapped in `atomWithStorage` so state survives reloads via `localStorage` under fixed keys (`baseCur`, `currency2Display`, `currencyValue`, `isEditing`, `isDefaultCurrencyValue`, `defaultCurrencyValue`, `defaultCurrencyValueDp`, `language`).
- Local component state (search query, active modal tab, chart slider range) uses plain `useState`/`useRef` and is not persisted.
- Remote data (rate tables, chart series) is never written to atoms — it lives only in SWR's cache, keyed by request URL, with `keepPreviousData: true` to avoid UI flicker while revalidating.
## Key Abstractions
- Purpose: Represents any user preference or app state that should survive a page reload without a backend.
- Examples: `src/lib/atoms.ts`
- Pattern: `atomWithStorage<T>('storageKey', defaultValue)` from `jotai/utils`; consumed via `useAtom(...)` in components — no manual `localStorage.getItem/setItem` calls needed.
- Purpose: Distinguish plain strings that represent domain concepts (currency codes, language codes) from arbitrary strings at the type level.
- Examples: `CurrencyCode`, `LanguageCode` in `src/lib/types.ts:20-22`
- Pattern: `type X = string & { readonly __brand: 'X' }`; cast with `as CurrencyCode` at the boundary (e.g. `src/app/page.tsx:112`).
- Purpose: Handle the fact that currency codes may be fiat (has a country flag), crypto (has an SVG or PNG icon), or unknown (needs a placeholder).
- Examples: `src/components/CountryImg.tsx`
- Pattern: `ImageWithFallback` wraps `next/image`, and on `onError` advances through an ordered `fallbackSrc` array (`[png icon, placeholder]`) while the initial `src` is the flag/SVG guess.
- Purpose: Move a CORS-restricted or multi-source lookup to the server without introducing a database or persistent backend.
- Examples: `src/app/api/currencyChart/route.ts`
- Pattern: Single `GET` export, `NextResponse.json(...)` return, no other HTTP methods, no auth, no persistence.
## Entry Points
- Location: `src/app/layout.tsx`
- Triggers: Every route in the App Router; wraps all pages.
- Responsibilities: Loads local fonts (`Geist`, `GeistMono`), sets `<html data-theme="dark">`, injects favicon/manifest links and the `/clarity.js` analytics script, wraps children in Jotai `Provider` then `LanguageProvider`.
- Location: `src/app/page.tsx`
- Triggers: Root URL navigation.
- Responsibilities: Primary app screen — fetches and displays the editable currency conversion list.
- Location: `src/app/chart/page.tsx`
- Triggers: Navigating from a currency row link on the home page (`href="/chart?q=..."`, `src/app/page.tsx:226`).
- Responsibilities: Displays historical rate chart with CSV export and pair-flip control.
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
### Duplicated/dead URL-builder utilities
## Error Handling
- SWR error state is checked directly in JSX (`if (err1 || err2) return <div>Error fetching data...</div>` in `src/app/page.tsx:146`; `if (!!error) return <div>No data for {q}</div>` in `src/app/chart/page.tsx:41`).
- The Route Handler returns `NextResponse.json({ error: ... })` with default 200 status rather than a 4xx status code when the `q` param is missing (`src/app/api/currencyChart/route.ts:22-24`).
- No `try/catch` around the `Promise.all` fetches or `.json()` parsing in `src/app/api/currencyChart/route.ts:35-43` — if all three upstream calls fail or return unexpected shapes, `data?.chart?.result?.[0]` access on `undefined` `data` will throw an unhandled server error.
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
