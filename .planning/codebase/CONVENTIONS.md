# Coding Conventions

**Analysis Date:** 2026-07-03

## Naming Patterns

**Files:**
- React components: `PascalCase.tsx` — `src/components/CountryImg.tsx`, `src/components/CurrencyListModal.tsx`, `src/components/DragHandle.tsx`, `src/components/SearchBar.tsx`
- Next.js App Router special files: lowercase, framework-mandated — `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/loading.tsx`, `src/app/api/currencyChart/route.ts`
- Hooks: `camelCase.ts` prefixed with `use` — `src/hooks/useTranslation.ts`, `src/hooks/useWindowWidth.ts`
- Contexts: `PascalCase.tsx` suffixed with `Context` — `src/contexts/LanguageContext.tsx`
- Library/utility modules: `camelCase.ts` — `src/lib/atoms.ts`, `src/lib/api.ts`, `src/lib/constants.ts`, `src/lib/fns.ts`, `src/lib/types.ts`, `src/lib/translations.ts`, `src/lib/svgs.tsx`
- One dead file exists: `src/lib/func.ts` is completely empty (0 bytes) — do not add code here; either delete it or repurpose deliberately.

**Functions:**
- `camelCase` throughout: `debounce`, `showASCIIArt`, `getDataFromLocalStorage` (`src/lib/fns.ts`), `getCurrencyRateApiUrl`, `getCurrencyChartApiUrl` (`src/lib/api.ts`).
- Event handlers use `on`/`handle` prefixes: `onBaseCurChange`, `handleDrop`, `handleCurrencyValueChange` in `src/app/page.tsx`; `onSelect`, `escFunction`, `clearQuery` in `src/components/SearchBar.tsx`.
- Boolean-returning helpers use `is`/custom comparator names: `areEqual` in `src/components/CountryImg.tsx`.

**Variables:**
- `camelCase` for local variables and state: `currencyValue`, `baseCur`, `isEditing`.
- Jotai atoms are suffixed with `Atom`: `baseCurAtom`, `currency2DisplayAtom`, `isEditingAtom`, `defaultCurrencyValueDpAtom` (`src/lib/atoms.ts`).
- Constants intended as fixed defaults use `PascalCase` with a `Default` prefix: `DefaultBaseCur`, `DefaultCurrency2Display`, `DefaultCurrencyValue` (`src/lib/constants.ts`). This deviates from typical `UPPER_SNAKE_CASE` — follow the existing `PascalCase` convention for new default constants in this file, and note `Currency2country` (a large lookup object) also uses `PascalCase`.

**Types:**
- `PascalCase` for types and interfaces, no `I` prefix: `SearchItem`, `CurrencyRates`, `LanguageContextType`, `CurrencyCode` (`src/lib/types.ts`).
- Component prop types are named `<ComponentName>Props` and declared as `interface`: `CurrencyListModalProps`, `CurrencyListTableProps` (`src/components/CurrencyListModal.tsx`), `SearchBarProps` (`src/components/SearchBar.tsx`), `CountryImgProps` (`src/components/CountryImg.tsx`).
- Branded primitive types are used for domain identifiers: `CurrencyCode` and `LanguageCode` are `string & { readonly __brand: '...' }` (`src/lib/types.ts:20-22`). Cast with `as CurrencyCode` / `as LanguageCode` at the boundary where a raw string enters the domain (see `src/app/page.tsx:112`, `src/components/CurrencyListModal.tsx:124-127`).
- Locally-scoped types are sometimes redeclared per-file instead of imported (e.g., `CurrencyRates` is defined both in `src/lib/types.ts` and redeclared locally in `src/app/page.tsx:66-68`). Prefer importing the shared type from `src/lib/types.ts` for new code instead of redeclaring.

## Code Style

**Formatting:**
- No Prettier config present in the repo (`.prettierrc*` not found). Formatting is whatever ESLint/Next defaults produce plus manual author style.
- Indentation: 2 spaces, consistently.
- Quotes: single quotes are dominant in `.tsx`/`.ts` files (`import ... from '@/lib/atoms'`), though double quotes appear in a few places (e.g., `src/lib/fns.ts:47` uses double quotes). Prefer single quotes for new code to match majority pattern.
- Semicolons: used consistently at statement ends.
- No trailing commas convention is uniformly enforced; both styles appear.

**Linting:**
- ESLint config: `.eslintrc.json` (root) extends `next/core-web-vitals` and `next/typescript`.
- Custom rule override: `@typescript-eslint/no-explicit-any` is turned **off**, so `any` is explicitly allowed project-wide (see `func: (...args: any[]) => void` in `src/lib/fns.ts:2`, and `getDataFromLocalStorage(name: string, defaultValue: any)` in `src/lib/fns.ts:46`). New code may use `any` but should prefer specific types where feasible since this is an explicit relaxation, not an endorsement.
- Run via `npm run lint` (`next lint`), defined in `package.json`.

## Import Organization

**Order:**
Imports are generally grouped in this order (not enforced by tooling, but consistently observed):
1. External packages (`react`, `next/image`, `jotai`, `lodash`, `swr`, `recharts`)
2. Internal absolute imports via the `@/` alias (`@/components/...`, `@/lib/...`, `@/hooks/...`, `@/contexts/...`)
3. Relative imports for same-directory siblings (e.g., `import CountryImg from './CountryImg';` in `src/components/CurrencyListModal.tsx:15`)

Example from `src/app/page.tsx:1-24`:
```typescript
"use client";

import CountryImg from '@/components/CountryImg';
import CurrencyListModal from '@/components/CurrencyListModal';
import DragHandle from '@/components/DragHandle';
import SearchBar from '@/components/SearchBar';
import useWindowWidth from '@/hooks/useWindowWidth';
import { CurrencyRate4All, CurrencyRate4BaseCur, fetcher, getCurrencyRateApiUrl } from '@/lib/api';
import { baseCurAtom, currency2DisplayAtom, ... } from '@/lib/atoms';
import { useAtom } from 'jotai';
import { pick } from 'lodash';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import useSWR from 'swr';
```
Named imports from the same module are alphabetized within multi-line import blocks.

**Path Aliases:**
- `@/*` maps to `./src/*` (configured in `tsconfig.json` `compilerOptions.paths`). Always use `@/lib/...`, `@/components/...`, `@/hooks/...`, `@/contexts/...` for cross-directory imports rather than relative `../../` paths. Relative imports (`./`) are reserved for files within the same directory only.

## Error Handling

**Patterns:**
- Client data-fetching errors from SWR are checked directly from the hook's `error` field and rendered as a plain error message, not thrown: `if (err1 || err2) return <div className="text-center">Error fetching data. Please try again later.</div>;` (`src/app/page.tsx:146`). Same pattern in `src/app/chart/page.tsx:41`.
- `src/lib/fns.ts:getDataFromLocalStorage` wraps `JSON.parse` in try/catch and falls back to the raw string on parse failure — a defensive pattern to follow when parsing localStorage or other untrusted string data.
- API routes (`src/app/api/currencyChart/route.ts`) validate required query params early and return a `NextResponse.json({ error: ... })` with a user-facing message rather than throwing (`route.ts:22-24`). Note this specific route does not set an HTTP error status code on the response — new API routes should improve on this by adding `{ status: 400 }` or similar.
- Custom React context hooks throw explicit `Error`s when used outside their provider: `useLanguage` throws `new Error('useLanguage must be used within a LanguageProvider')` if context is `undefined` (`src/contexts/LanguageContext.tsx:22-24`). Follow this pattern for any new context.
- No centralized error boundary, error-tracking SDK, or global error handler exists in the codebase.

## Logging

**Framework:** Plain `console.log` / `console.error`. No structured logging library.

**Patterns:**
- `console.log` is used for one-off debug/informational messages, e.g., ASCII art banner on load (`src/lib/fns.ts:showASCIIArt`, called from `src/app/page.tsx:58` and `src/app/chart/page.tsx:32`) and confirmation that a dynamically-loaded script initialized (`src/app/page.tsx:46`).
- `console.error` is used for failure paths of dynamically loaded external scripts (`src/app/page.tsx:48,54`).
- No logging exists in API routes (`src/app/api/currencyChart/route.ts`) — failures during upstream fetches are not logged.

## Comments

**When to Comment:**
- Comments are used sparingly and mostly to explain non-obvious business logic or format assumptions, e.g., `// date can be YYYY-MM-DD: 2024-03-06` above `GetCurrencyRateParams` in `src/lib/api.ts:3`, and `// it is [targetCur]-[baseCur]` in `src/app/api/currencyChart/route.ts:17`.
- Commented-out code blocks are left in place rather than deleted, e.g., the "AI Stock Banner" JSX block in `src/app/page.tsx:169-185` and the mtfxgroup fetch logic in `src/app/api/currencyChart/route.ts:3-12`. Do not treat this as a pattern to emulate for new code — remove dead code instead of commenting it out; only pre-existing commented blocks remain for historical/reference reasons.
- No file-level header comments or license banners.

**JSDoc/TSDoc:**
- Not used anywhere in the codebase. Type signatures alone document intent (interfaces/types declared directly above usage).

## Function Design

**Size:** No enforced limit. Component render functions can be large and contain significant inline logic (e.g., `Home` in `src/app/page.tsx` is ~190 lines including JSX, and `CurrencyChart` in `src/app/chart/page.tsx` is ~115 lines). Prefer extracting inline computation into `useMemo`/helper functions when a component's body exceeds ~100 lines, consistent with existing use of `useMemo` for derived values (`curObj`, `currencyRatesPairs2Display` in `src/app/page.tsx:86-92`).

**Parameters:**
- Functions taking more than 1-2 arguments use a single destructured options object with defaults, typed via a dedicated `Params` type: `getCurrencyRateApiUrl({ baseCurrencyCode = '', date = 'latest', apiVersion = 'v1' }: GetCurrencyRateParams)` (`src/lib/api.ts:16`).
- React component props are always destructured in the function signature: `const CountryImg: React.FC<CountryImgProps> = ({ code = '', alt = '' }) => {...}` (`src/components/CountryImg.tsx:37`).

**Return Values:**
- Components with loading/error states return early with a simple conditional JSX block before the main return (`src/app/page.tsx:146-161`, `src/app/chart/page.tsx:41-55`). Follow this early-return-for-loading/error pattern for new data-fetching components rather than nesting ternaries in the main JSX return.

## Module Design

**Exports:**
- Components: `default export` at the bottom of the file after declaration, e.g. `export default CurrencyListModal;` (`src/components/CurrencyListModal.tsx:257`), `export default DragHandle;` (`src/components/DragHandle.tsx:21`). Page components (`src/app/page.tsx`, `src/app/chart/page.tsx`) use `export default function Home()` / assign-then-export.
- Utilities, atoms, constants, and types: named exports only, no default export — `src/lib/atoms.ts`, `src/lib/constants.ts`, `src/lib/fns.ts`, `src/lib/api.ts`, `src/lib/types.ts`, `src/lib/svgs.tsx`.
- Hooks: mixed — `useTranslation` is a named export (`src/hooks/useTranslation.ts`), `useWindowWidth` is a default export (`src/hooks/useWindowWidth.ts`). No strict convention enforced; prefer named exports for new hooks for consistency with `useTranslation` and easier tree-shaking/refactor tooling.

**Barrel Files:**
- Not used. No `index.ts` re-export files exist anywhere under `src/`. Import directly from the specific module path (e.g., `@/lib/atoms`, `@/components/CountryImg`), not from a directory-level barrel.

**Client/Server Boundary:**
- Next.js App Router `"use client"` directive is placed as the first line of files that use browser APIs, hooks, or interactivity: `src/app/page.tsx:1`, `src/app/chart/page.tsx:1`, `src/hooks/useWindowWidth.ts:1`, `src/contexts/LanguageContext.tsx:1`. API routes (`src/app/api/currencyChart/route.ts`) and `src/app/layout.tsx` are server components/route handlers and omit the directive.

---

*Convention analysis: 2026-07-03*
