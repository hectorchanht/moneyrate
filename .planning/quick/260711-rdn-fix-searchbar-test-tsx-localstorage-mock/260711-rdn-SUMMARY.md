---
phase: quick-260711-rdn
plan: 01
subsystem: test-infra
tags: [vitest, localStorage, jotai, atomWithStorage, node25, jsdom, storage-mock]

# Dependency graph
requires:
  - "vitest.config.ts (test.environment/include, no prior setupFiles)"
  - "src/lib/atoms.ts atomWithStorage default (localStorage-backed) storage"
  - "src/components/SearchBar.test.tsx (writes currency2DisplayAtom via store.set)"
provides:
  - "vitest.setup.ts in-memory Web Storage mock installed on globalThis (and window under jsdom) for localStorage and sessionStorage"
  - "setupFiles wiring so the mock runs before every test in both node and jsdom environments"
  - "Fully green test suite: 81/81 across 8/8 files"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Map-backed Storage-compatible mock (getItem/setItem/removeItem/clear/key/length), cast `as Storage` at the boundary"
    - "Object.defineProperty(globalThis, ..., { configurable: true, writable: true }) override that beats Node 25's broken built-in localStorage"
    - "beforeEach storage clear() to prevent cross-test state bleed"

key-files:
  created:
    - vitest.setup.ts
  modified:
    - vitest.config.ts

key-decisions:
  - "Fix lives in test setup, not the tests — SearchBar.test.tsx is byte-for-byte unchanged (zero git diff)"
  - "configurable: true is required so the override replaces Node 25's built-in localStorage and stays replaceable across setup runs"
  - "Two independent mock instances (separate Maps) for localStorage vs sessionStorage; also defined on window when jsdom's window !== globalThis"

requirements-completed: [QUICK-260711-rdn]

# Metrics
duration: ~4min
completed: 2026-07-11
---

# Quick 260711-rdn: Fix SearchBar.test.tsx localStorage Mock Summary

**Added `vitest.setup.ts` — a Map-backed, `Storage`-compatible in-memory mock installed on `globalThis` (and `window` under jsdom) for `localStorage`/`sessionStorage` with `configurable: true` — and wired it via `setupFiles` in `vitest.config.ts`, so jotai's `atomWithStorage` no longer resolves to Node 25's broken built-in `localStorage` on write, fixing the 6 `setItem is not a function` failures in SearchBar.test.tsx and restoring a fully green 81/81 suite without touching any test assertion.**

## Performance

- **Duration:** ~4 min
- **Tasks:** 1 completed
- **Files created:** 1 / **modified:** 1

## Accomplishments
- `vitest.setup.ts` (new): `createStorageMock()` returns a `Storage`-compatible object backed by a private `Map<string, string>` — `getItem` returns the value or `null` (never `undefined`), `setItem` coerces via `String(value)`, `removeItem`/`clear`/`key(index)` (insertion order, `null` when out of range), and a `length` getter over `map.size`; cast `as Storage` at the boundary because the DOM `Storage` index signature is not directly implementable.
- Installs two independent instances (separate Maps) for `localStorage` and `sessionStorage` via `Object.defineProperty(globalThis, name, { value, configurable: true, writable: true })`; also defines both on `window` when `window !== globalThis` so jsdom consumers reading `window.localStorage` get the mock.
- Registers a `beforeEach` hook (imported from `vitest`) that clears both storages before every test to prevent cross-test state bleed.
- `vitest.config.ts`: added `setupFiles: ['./vitest.setup.ts']` inside the `test` object; `environment: 'node'` and `include` unchanged. The setup runs in both node and jsdom environments and is harmless in node.

## Task Commits

1. **Task 1: Add in-memory Storage mock and wire it into vitest setup** — `3ca0494` (test)

Plan/docs metadata (this SUMMARY, STATE) is committed separately by the orchestrator.

## Files Created/Modified
- `vitest.setup.ts` — new in-memory Web Storage mock + `beforeEach` clear.
- `vitest.config.ts` — `setupFiles: ['./vitest.setup.ts']` wiring (2-line insert).

## Root Cause
Runtime is Node v25.9.0, which ships an experimental built-in global `localStorage` whose methods are missing (`typeof localStorage === 'object'` but `typeof localStorage.setItem === 'undefined'` without a `--localstorage-file` backing). Under vitest's jsdom environment this Node global shadowed jsdom's real storage; jotai's `atomWithStorage` default storage (`createJSONStorage(() => localStorage)`) resolved to it, and the first persisted-atom WRITE (`store.set(currency2DisplayAtom, displayed)` at SearchBar.test.tsx:20) threw `TypeError: setItem is not a function`. Other component tests passed because they never write a persisted atom.

## Deviations from Plan
None — Task 1 executed exactly as written.

## Verification (actual output)

- `npm run test:run` → **PASS, exit 0**: `Test Files 8 passed (8)`, `Tests 81 passed (81)`. SearchBar.test.tsx now `(6 tests)` passing; every previously-passing file (`api` 10, `atoms` 3, `fns` 29, `tourSteps` 20, `route` 5, `InstallButton` 2, `CurrencyRow` 6) still green — no regression. Baseline before the fix was 6 failed / 75 passed.
- `npm run lint` → **PASS**: `✔ No ESLint warnings or errors` (root `vitest.setup.ts` is covered by tsconfig `**/*.ts` under `strict: true` and passes with no implicit `any`).
- `git diff --stat src/components/SearchBar.test.tsx` → **empty** (no change to any SearchBar assertion). Only `vitest.setup.ts` (new) and `vitest.config.ts` (+2 lines) changed.

## Issues Encountered
None.

## User Setup Required
None — test-only infrastructure change; no production code, runtime surface, or external configuration touched.

## Self-Check: PASSED

- `vitest.setup.ts` present (installs the storage mock).
- `vitest.config.ts` contains `setupFiles` (grep verified).
- Commit `3ca0494` (test) verified present in `git log`.
- `src/components/SearchBar.test.tsx` has zero git diff.

---
*Quick task: 260711-rdn*
*Completed: 2026-07-11*
