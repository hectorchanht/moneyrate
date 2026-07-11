# Deferred Items — 260711-r2h

Out-of-scope discoveries logged during execution (per executor SCOPE BOUNDARY rule).
These were NOT fixed because they are unrelated to this task's changes.

## Pre-existing failing test: `src/components/SearchBar.test.tsx`

- **Discovered during:** Task 2 verification (`npm run test:run`).
- **Symptom:** 6 failures, all `TypeError: _a2.setItem is not a function` originating from
  `store.set(currency2DisplayAtom, displayed)` in the test's `renderSearchBar` helper
  (`src/components/SearchBar.test.tsx:20`). The jotai `atomWithStorage` default storage's
  backing object lacks a `setItem` method in this test's environment/setup.
- **Pre-existing proof:** Checked out `HEAD~1` (commit before this task's Task 1) and ran
  `npx vitest run src/components/SearchBar.test.tsx` → identical 6 failures. The failures
  exist independently of this task's changes (which only touched `atoms.ts` by adding an
  exported constant, `CurrencyListModal.tsx` Reset handler, and a new `atoms.test.ts`).
- **Scope decision:** Out of scope — an unrelated test-environment/setup bug in a file this
  task did not target. Not fixed per the executor SCOPE BOUNDARY (do not fix unrelated
  pre-existing failures).
- **Suggested fix (for a future task):** Provide a proper `localStorage`/`createJSONStorage`
  mock for the SearchBar test (or use a jsdom environment with a working storage), or set the
  atom via a non-persisted test store. Likely a shared vitest setup fix.
