---
phase: quick-260711-r2h
plan: 01
subsystem: state
tags: [localStorage, reset, atoms, drift-guard, onboarding-tour]

# Dependency graph
requires:
  - "src/lib/atoms.ts atomWithStorage keys (12 persisted atoms)"
  - "src/components/CurrencyListModal.tsx settings Reset handler"
provides:
  - "PERSISTED_ATOM_KEYS single source of truth for all persisted localStorage keys"
  - "Reset handler clears all 12 keys (incl. tourSeen, showDatePicker) so the onboarding tour replays"
  - "Drift-guard unit test that fails if a new atom is added without updating the constant"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single exported literal (`as const`) as the source of truth for storage keys, consumed by the Reset handler"
    - "Source-parsing drift-guard test: regex-extract atomWithStorage keys from atoms.ts and deep-equal against the exported constant"

key-files:
  created:
    - src/lib/atoms.test.ts
  modified:
    - src/lib/atoms.ts
    - src/components/CurrencyListModal.tsx

key-decisions:
  - "PERSISTED_ATOM_KEYS declared as a fixed `as const` literal (not derived at runtime from the atom objects, since atomWithStorage does not expose its key) — correctness guaranteed by the drift-guard test instead"
  - "Reset keeps its scoped removeItem loop (no localStorage.clear()) so unrelated same-origin keys stay untouched (threat T-r2h-01 accept disposition preserved)"

requirements-completed: [QUICK-260711-r2h]

# Metrics
duration: 3min
completed: 2026-07-11
---

# Quick 260711-r2h: Fix Reset Not Clearing tourSeen Summary

**Introduced `PERSISTED_ATOM_KEYS` as the single source of truth in `atoms.ts` and rewired the settings Reset handler to iterate it, so all 12 persisted keys are cleared on Reset — fixing `tourSeen`/`showDatePicker` surviving Reset (the onboarding tour now replays) — plus a source-parsing drift-guard test that fails if a future atom is added without updating the constant.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-07-11T11:33:00Z
- **Completed:** 2026-07-11T11:36:00Z
- **Tasks:** 2 completed
- **Files created:** 1 / **modified:** 2

## Accomplishments
- `src/lib/atoms.ts`: added `export const PERSISTED_ATOM_KEYS = [...] as const` listing all 12 storage keys in declaration order (`baseCur` … `tourSeen`, `showDatePicker`), preceded by a comment stating it MUST stay in sync with the `atomWithStorage` calls and that a test enforces it.
- `src/components/CurrencyListModal.tsx`: added `PERSISTED_ATOM_KEYS` to the existing block import from `@/lib/atoms` (no second import statement); replaced the hardcoded 10-element key array + `.forEach(...)` in the Reset `onClick` with `PERSISTED_ATOM_KEYS.forEach((key) => localStorage.removeItem(key));`. The scoped-removal comment and the subsequent `setCurrency2Display(DefaultCurrency2Display)` / `setLanguage('en')` / `setSortMode('custom')` / `window.location.reload()` calls are unchanged.
- `src/lib/atoms.test.ts` (new): reads the `atoms.ts` source via `fileURLToPath(new URL('./atoms.ts', import.meta.url))`, regex-extracts every `atomWithStorage<...>('<key>'` key, and asserts (1) parsed keys deep-equal `[...PERSISTED_ATOM_KEYS]` (same values, same order), (2) `tourSeen` and `showDatePicker` are covered, (3) 12 unique entries.
- Verified the guard actually fails on drift: temporarily injecting an unsynced `atomWithStorage('driftKey', ...)` produced `expected [ Array(13) ] to deeply equal [ Array(12) ]`; the file was restored and the test passes again (3/3).

## Task Commits

1. **Task 1: Add PERSISTED_ATOM_KEYS and consume it in the Reset handler** — `b2e365c` (fix)
2. **Task 2: Add drift-guard unit test for PERSISTED_ATOM_KEYS** — `e10fbe1` (test)

Plan/docs metadata (this SUMMARY, STATE) is committed separately by the orchestrator.

## Files Created/Modified
- `src/lib/atoms.ts` — added `PERSISTED_ATOM_KEYS` exported constant (source of truth).
- `src/components/CurrencyListModal.tsx` — Reset handler now iterates `PERSISTED_ATOM_KEYS`.
- `src/lib/atoms.test.ts` — new drift-guard test (3 tests).

## Decisions Made
- Constant is a fixed literal rather than runtime-derived because `atomWithStorage` does not surface its storage key; the drift-guard test is what keeps it honest.
- Left the Reset scoped-removal approach intact (no `localStorage.clear()`), preserving the accepted threat disposition T-r2h-01.

## Deviations from Plan

None for the planned work — both tasks executed as written. TDD note (Task 2 is `tdd="true"`): a natural RED phase was not applicable because the guarded implementation (`PERSISTED_ATOM_KEYS`) is created by Task 1 and must exist before a drift-guard can reference it. Instead, the "must be able to fail" intent was demonstrated by temporarily injecting an unsynced atom (test failed as expected) and then reverting (test passed). Task 2 is committed as `test(...)`.

## Deferred Issues (out of scope)

- **`src/components/SearchBar.test.tsx` — 6 pre-existing failures** (`TypeError: _a2.setItem is not a function` at `store.set(currency2DisplayAtom, ...)`). Confirmed pre-existing by reproducing the identical 6 failures at `HEAD~1` (before this task's Task 1). Unrelated to this task (a SearchBar test-environment/storage-mock bug), so per the executor SCOPE BOUNDARY it was **not** fixed. Logged to `deferred-items.md` in this task directory with a suggested fix.

## Verification (actual output)

- `npm run lint` → **PASS**: `✔ No ESLint warnings or errors`.
- `npm run test:run` → **7 of 8 test files pass, 75/81 tests pass**. All work-in-scope is green: the new `src/lib/atoms.test.ts` passes (3/3) and every previously-passing file (`api`, `fns`, `route`, `tourSteps`, `InstallButton`, `CurrencyRow`) still passes. The only failing file is the pre-existing, out-of-scope `src/components/SearchBar.test.tsx` (6 failures, documented above). This task did not introduce or regress any test failure.

## Issues Encountered
Discovered the pre-existing SearchBar test failures during full-suite verification; investigated, confirmed pre-existing at `HEAD~1`, and scoped out (see Deferred Issues).

## User Setup Required
None — client-side change only, no external configuration.

## Manual Sanity (optional)
In a browser where the tour was completed (`tourSeen` present in localStorage), pressing Reset in settings now removes both `tourSeen` and `showDatePicker`; after the reload, the home-page auto-start gate (`if (!hydrated || tourSeen || ...) return`) sees `tourSeen` absent and the onboarding tour replays.

## Self-Check: PASSED

- `src/lib/atoms.ts` present, exports `PERSISTED_ATOM_KEYS` (grep verified).
- `src/components/CurrencyListModal.tsx` present, uses `PERSISTED_ATOM_KEYS.forEach` (grep verified).
- `src/lib/atoms.test.ts` present and passing (3/3).
- Commit hashes `b2e365c` (fix) and `e10fbe1` (test) verified present in `git log`.

---
*Quick task: 260711-r2h*
*Completed: 2026-07-11*
