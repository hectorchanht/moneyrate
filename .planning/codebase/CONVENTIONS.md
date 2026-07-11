# Coding Conventions

**Analysis Date:** 2026-07-11

## Naming Patterns

**Files:**
- React components: `PascalCase.tsx` — `src/components/CurrencyRow.tsx`, `src/components/InstallButton.tsx`, `src/components/ThemeToggle.tsx`, `src/components/SearchBar.tsx`
- Co-located tests: `<Name>.test.tsx` / `<Name>.test.ts` next to the file under test — `src/components/CurrencyRow.test.tsx`, `src/lib/fns.test.ts`, `src/app/api/currencyChart/route.test.ts`
- E2E specs: `<feature>.spec.ts` under `e2e/` — `e2e/home.spec.ts`, `e2e/tour.spec.ts`
- Hooks: `use<Name>.ts` (camelCase) — `src/hooks/useTranslation.ts`, `src/hooks/useWindowWidth.ts`
- Contexts: `<Name>Context.tsx` — `src/contexts/LanguageContext.tsx`
- Library/utility modules: `camelCase.ts` — `src/lib/atoms.ts`, `src/lib/api.ts`, `src/lib/fns.ts`, `src/lib/tourSteps.ts`, `src/lib/pairs.ts`, `src/lib/types.ts`
- Next.js App Router special files: lowercase, framework-mandated — `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `global-error.tsx`, `route.ts`, `robots.ts`, `sitemap.ts`

**Functions:**
- `camelCase` for all functions and helpers: `evalMathExpression`, `getResponsiveCryptoDp`, `sortCurrencyPairs`, `getDataFromLocalStorage`, `resolveTourLocale` (`src/lib/fns.ts`); `getCurrencyRateApiUrl`, `fetchWithFallback`, `fetcher` (`src/lib/api.ts`)
- URL/string builders are prefixed with `get`: `getCurrencyRateApiUrl`, `getCurrencyRateApiUrls`, `getTourString` (`src/lib/tourSteps.ts`)
- Event handlers use `on`/`handle` prefixes: `onBaseChange`, `onCopy`, `onSelectBase`, `onValueChange` (`src/components/CurrencyRow.tsx`); `onBeforeInstall`, `onInstalled` (`src/components/InstallButton.tsx`)
- Builder/factory functions read as verbs: `buildTourSteps` (`src/lib/tourSteps.ts`)
- Boolean helpers/vars use `is` prefix: `isBase`, `isEditing`, `isFocused`

**Variables:**
- `camelCase` for locals and state: `currencyValue`, `baseCur`, `valMultiplied`, `dp2Show`, `deferred`
- Jotai atoms are suffixed with `Atom`: `baseCurAtom`, `currency2DisplayAtom`, `isEditingAtom` (`src/lib/atoms.ts`)
- Module-level constants use `UPPER_SNAKE_CASE` in newer code: `TOUR_STEP_COUNT`, `SUPPORTED_LOCALES`, `TOUR_FEATURE_STEPS` (`src/lib/tourSteps.ts`), `EXPECTED_SELECTORS`, `TOUR_KEYS`, `CJK_LOCALES` (`src/lib/tourSteps.test.ts`)
- Legacy default constants in `src/lib/constants.ts` use `PascalCase` with a `Default` prefix: `DefaultBaseCur`, `DefaultCurrency2Display`. Follow the file's existing style when adding to `constants.ts`; prefer `UPPER_SNAKE_CASE` for new module constants elsewhere (matches `tourSteps.ts`).

**Types:**
- `PascalCase`, no `I` prefix: `SearchItem`, `CurrencyRates`, `LanguageContextType`, `SortMode`, `Theme` (`src/lib/types.ts`)
- Component prop types are `<ComponentName>Props`, declared as `interface`, and exported: `export interface CurrencyRowProps` (`src/components/CurrencyRow.tsx:7`)
- Local event-shape types declared inline as `interface`: `BeforeInstallPromptEvent` (`src/components/InstallButton.tsx:5`)
- `Language` is a 30-member string-literal union (`src/lib/types.ts:10-13`) — the canonical locale type used across the tour code. Branded primitive types `CurrencyCode` and `LanguageCode` (`string & { readonly __brand: '...' }`) also exist (`src/lib/types.ts:24-26`); cast with `as CurrencyCode` at the boundary where a raw string enters the domain.

## Code Style

**Formatting:**
- No Prettier config in the repo. Style is ESLint/Next defaults plus author convention.
- Indentation: 2 spaces, consistently.
- Quotes: single quotes dominate in `.ts`/`.tsx`. Prefer single quotes for new code. (Some legacy double quotes remain, e.g. `src/lib/fns.ts:166`.)
- Semicolons: used consistently at statement ends.

**Linting:**
- `.eslintrc.json` extends `next/core-web-vitals` and `next/typescript`.
- One override: `@typescript-eslint/no-explicit-any` is turned **off** — `any` is allowed project-wide (used in `debounce` and `getDataFromLocalStorage`, `src/lib/fns.ts:4,165`). Prefer specific types for new code; reserve `any` for genuinely dynamic boundaries.
- Inline disables are used surgically where a rule fights a test shim, e.g. `// eslint-disable-next-line @next/next/no-img-element` when mocking `next/image` (`src/components/CurrencyRow.test.tsx:9`).
- Run via `npm run lint` (`next lint`).

## Import Organization

- Path alias `@/*` → `./src/*` (`tsconfig.json`). Vitest mirrors this alias in `vitest.config.ts:12-16`. Always use `@/lib/...`, `@/components/...`, `@/contexts/...`, `@/hooks/...` for cross-directory imports; reserve relative `./` for same-directory imports (e.g. a test importing its subject: `import CurrencyRow from './CurrencyRow'`).
- Observed grouping order (top to bottom), no blank lines between groups:
  1. Third-party packages (`@testing-library/react`, `jotai`, `vitest`, `react`, `driver.js`)
  2. `@/` alias imports (`@/contexts/...`, `@/lib/...`)
  3. Same-directory relative imports (`./SearchBar`)
- Type-only imports use `import type`: `import type { Language } from './types'` (`src/lib/tourSteps.ts:3`), `import { expect, test, type Page } from '@playwright/test'` (`e2e/home.spec.ts:1`).

## Error Handling

- **Best-effort try/catch with silent (commented) fallbacks** for browser-API calls that may be unavailable: clipboard writes (`src/components/CurrencyRow.tsx:63-69`), `localStorage` writes (`src/lib/fns.ts:178-185`), and malformed locale tags (`src/lib/fns.ts:203,213`). Each empty `catch` carries a one-line comment explaining why it's safe to swallow.
- **Pure helpers return `null` on invalid input** rather than throwing: `evalMathExpression` returns `null` for empty/invalid/non-finite input (`src/lib/fns.ts:70-144`); callers branch on the result (`src/components/CurrencyRow.tsx:57`).
- **SSR guards** precede any `window`/`localStorage` access: `if (typeof window === 'undefined' || !window || !window.localStorage) return defaultValue;` (`src/lib/fns.ts:166,179`).
- **Fetch layer throws on non-2xx** so SWR surfaces the error: `fetcher` throws `Error('... status <code>')` on `!res.ok` (`src/lib/api.ts`, verified by `src/lib/api.test.ts:81-87`); `fetchWithFallback` tries URLs in order and rejects only when all fail.
- **API routes validate params early and return a real HTTP status:** the chart route returns `400` for a missing/malformed `q` and `404` when no data resolves (confirmed by `src/app/api/currencyChart/route.test.ts:21-63`). This improves on the older "200 with error body" pattern — new route handlers should set explicit status codes.
- **Context hooks throw when used outside their provider:** `useLanguage` throws `Error('useLanguage must be used within a LanguageProvider')` (`src/contexts/LanguageContext.tsx`). Follow this for any new context.
- **App Router error boundaries exist:** `src/app/error.tsx` (route-level) and `src/app/global-error.tsx` (root) — use these rather than adding ad-hoc try/catch in render.

## Logging

**Framework:** `console` only — no logging library.

**Patterns:**
- `console.log` for one-off informational output (ASCII-art banner in `showASCIIArt`, `src/lib/fns.ts:45`).
- No logging inside route handlers or fetch fallbacks — failures propagate as thrown errors / HTTP status codes instead.

## Comments

**When to Comment:**
- Explain *why*, not *what*: non-obvious business rules (`// Base-amount field supports math expressions ...`, `src/components/CurrencyRow.tsx:52`), security constraints (`// No eval()/Function() — those are blocked by the production CSP`, `src/lib/fns.ts:68`), and the reason an error is swallowed.
- Function-level lead comments describe intent and edge behavior above exported helpers (`src/lib/fns.ts:48-49,61-62,187-191`).
- Requirement/decision IDs are referenced in comments to trace code to spec (e.g. `TOUR-06`, `D-04`, `A11Y-01`, `RESEARCH Pitfall 2`) in `src/lib/tourSteps.ts` and `e2e/tour.spec.ts`.

**JSDoc/TSDoc:**
- Not used. Plain `//` comments and TypeScript type signatures document intent. Do not introduce JSDoc block tags.

## Function Design

- **Multi-arg functions take a single destructured options object** typed by a dedicated `Params` type with defaults: `getCurrencyRateApiUrl({ baseCurrencyCode = '', date = 'latest', apiVersion = 'v1' })` (`src/lib/api.ts`).
- **Pure, side-effect-free helpers are extracted for unit testing** and documented as such: `getResponsiveCryptoDp`, `getDropIndex`, `evalMathExpression`, `resolveTourLocale` are all pulled out of render/call sites specifically so they can be tested in isolation (`src/lib/fns.ts:48-49,189-191`). Prefer this pattern — extract logic into a pure `src/lib` function rather than embedding it in a component render body.
- **React component props are destructured in the signature** with defaults where relevant (`src/components/CurrencyRow.tsx:25-41`).
- **Loading/error states return early** with a simple conditional block before the main JSX return.

## Module Design

- **Components:** `default export`. Either `export default function InstallButton() {...}` (`src/components/InstallButton.tsx:12`) or a `const` declaration exported at the bottom, optionally wrapped: `export default memo(CurrencyRow);` (`src/components/CurrencyRow.tsx:144`). Prop interfaces are `export`ed as named exports alongside the default.
- **Utilities, atoms, constants, types, tour logic:** named exports only, no default — `src/lib/fns.ts`, `src/lib/api.ts`, `src/lib/atoms.ts`, `src/lib/tourSteps.ts`, `src/lib/types.ts`.
- **Hooks:** mixed (`useTranslation` named, `useWindowWidth` default). Prefer named exports for new hooks.
- **No barrel files** — no `index.ts` re-exports anywhere under `src/`. Import directly from the specific module path.
- **`"use client"` directive** is the first line of any file using browser APIs, hooks, or interactivity (`src/components/InstallButton.tsx:1`, `src/contexts/LanguageContext.tsx:1`). Server components (`layout.tsx`) and route handlers (`route.ts`) omit it.
- **Derive, don't duplicate:** shared constants are derived from a single source of truth to avoid drift, e.g. `SUPPORTED_LOCALES = Object.keys(translations)` (`src/lib/tourSteps.ts:11`). A test enforces the derivation stays correct (`src/lib/tourSteps.test.ts:62-66`).

---

*Convention analysis: 2026-07-11*
