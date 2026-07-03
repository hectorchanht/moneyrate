# Testing Patterns

**Analysis Date:** 2026-07-03

## Test Framework

**Runner:**
- None configured. No test runner package (Jest, Vitest, Mocha, etc.) appears in `package.json` dependencies or devDependencies (`/Users/laichan/code/tung/moneyrate/package.json`).
- No config files exist: `jest.config.*`, `vitest.config.*`, `playwright.config.*`, and `cypress.config.*` are all absent from the repo root.

**Assertion Library:**
- Not applicable — none installed.

**Run Commands:**
```bash
# No test script exists in package.json. Available scripts are:
npm run dev      # next dev
npm run build    # next build
npm run start    # next start
npm run lint     # next lint
```
There is no `npm test` / `npm run test` script defined anywhere in `package.json`.

## Test File Organization

**Location:**
- Not applicable. A repo-wide search for `*.test.*` and `*.spec.*` (excluding `node_modules`) returned zero matches. No test files exist anywhere in this codebase.

**Naming:**
- No convention exists yet since there are no tests.

**Structure:**
```
No test directory or co-located test files present under src/.
```

## Test Structure

Not applicable — no test suites exist to reference. If tests are introduced, this codebase's stack (Next.js 14 App Router, React 18, TypeScript, Jotai, SWR) points toward **Vitest or Jest + React Testing Library** for component/unit tests, and **Playwright** for E2E, as these are the de facto standards for this stack. No existing convention dictates otherwise since none has been established.

## Mocking

Not applicable — no mocking library or patterns exist in the codebase.

**What would need mocking if tests are added:**
- `fetch` calls, since data fetching is done via the shared `fetcher` in `src/lib/api.ts:1` (`fetch(...args).then(res => res.json())`) consumed through `useSWR` in `src/app/page.tsx:83-84` and `src/app/chart/page.tsx:35`.
- `localStorage`, since Jotai atoms use `atomWithStorage` for persistence (`src/lib/atoms.ts`), and `src/lib/fns.ts:getDataFromLocalStorage` directly reads `window.localStorage`.
- `window.innerWidth` / resize events, consumed by `src/hooks/useWindowWidth.ts`.
- External script injection side effects in `useDragDropTouch` (`src/app/page.tsx:38-64`), which appends a `<script>` tag to `document.body`.
- The external upstream APIs called from the API route: `https://query1.finance.yahoo.com/...` and the currency-api.pages.dev endpoints referenced in `src/lib/api.ts:17,22` and `src/app/api/currencyChart/route.ts:32`.

## Fixtures and Factories

Not applicable — none exist. `src/lib/constants.ts` contains static reference data (`Currency2country`, a 160+ entry currency-code-to-country-code map, and `DefaultCurrency2Display`) that could serve as fixture-like data if tests are introduced, but it is production code, not test fixtures.

## Coverage

**Requirements:** None enforced. No coverage tooling or thresholds configured anywhere in the repo.

**View Coverage:**
```bash
# Not applicable — no coverage tooling installed.
```

## Test Types

**Unit Tests:** None. Pure functions that would be good unit test candidates but currently have zero coverage:
- `debounce`, `getDataFromLocalStorage` (`src/lib/fns.ts`)
- `getCurrencyRateApiUrl`, `getCurrencyChartApiUrl`, `fetcher` (`src/lib/api.ts`)
- The inline `scientificFormat` number formatter in `src/app/chart/page.tsx:64-72`
- Decimal-place selection logic (`dp2Show` calculation) in `src/app/page.tsx:215-217`

**Integration Tests:** None. The API route `src/app/api/currencyChart/route.ts` (a Next.js Route Handler making 3 parallel upstream fetches with fallback logic) has no test coverage despite non-trivial branching logic (`data_fiat` / `data_crypto` / `data_crypto_flip` fallback chain at lines 45-52).

**E2E Tests:** Not used. No Playwright/Cypress/Puppeteer dependency or config exists.

## Common Patterns

Not applicable — no existing async or error-path test patterns exist in this codebase to document. Any test suite introduced here starts from zero prior art; do not assume conventions beyond what is stated in CONVENTIONS.md for the source code itself.

## Recommendations for Introducing Tests

If a testing setup is added in a future phase:
- Prefer **Vitest** (fast, ESM-native, works well with Next.js 14's `type: "module"` setting in `package.json:5`) or Jest with `next/jest` preset.
- Add **React Testing Library** for component tests of `src/components/*.tsx`.
- Mock `fetcher` (`src/lib/api.ts`) at the module boundary rather than mocking `fetch` globally, since all data access flows through this single function.
- Prioritize test coverage for the currency math/formatting logic in `src/app/page.tsx` (decimal place selection, `onBaseCurChange` conversion math) and the fallback branching in `src/app/api/currencyChart/route.ts`, since these contain the highest-risk untested business logic.

---

*Testing analysis: 2026-07-03*
