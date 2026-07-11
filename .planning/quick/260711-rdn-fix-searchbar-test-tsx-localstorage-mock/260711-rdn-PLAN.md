---
phase: quick-260711-rdn
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [vitest.setup.ts, vitest.config.ts]
autonomous: true
requirements: [QUICK-260711-rdn]

must_haves:
  truths:
    - "SearchBar.test.tsx's 6 tests all pass (no more `setItem is not a function`)"
    - "Full suite is green: 81/81 tests across 8/8 files"
    - "No previously-passing test regresses"
    - "npm run lint is clean"
  artifacts:
    - path: "vitest.setup.ts"
      provides: "In-memory Web Storage mock installed on globalThis for both node and jsdom test environments"
      contains: "localStorage"
    - path: "vitest.config.ts"
      provides: "setupFiles wiring so the storage mock runs before every test"
      contains: "setupFiles"
  key_links:
    - from: "vitest.config.ts"
      to: "vitest.setup.ts"
      via: "test.setupFiles array"
      pattern: "setupFiles.*vitest\\.setup"
    - from: "vitest.setup.ts"
      to: "globalThis.localStorage"
      via: "Object.defineProperty override that beats Node 25's broken built-in"
      pattern: "defineProperty\\(globalThis"
---

<objective>
Fix the 6 failing SearchBar.test.tsx tests caused by Node 25's broken built-in `localStorage` global shadowing jsdom's real storage. jotai's `atomWithStorage` resolves its default storage to that broken global; on the first persisted-atom WRITE (`store.set(currency2DisplayAtom, ...)`) it calls `setItem`, which does not exist, throwing `TypeError: _a2.setItem is not a function`.

Purpose: Restore a fully green test suite (currently 75/81) without weakening any SearchBar assertions. The fix is a working in-memory storage mock installed globally in test setup, not a change to the tests.
Output: New `vitest.setup.ts` (Storage-compatible in-memory mock) wired into `vitest.config.ts` via `setupFiles`.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/quick/260711-rdn-fix-searchbar-test-tsx-localstorage-mock/260711-rdn-PLAN.md

<root_cause>
- Runtime is Node v25.9.0, which ships an experimental built-in global `localStorage`. `typeof localStorage` is `object`, but `typeof localStorage.setItem` is `undefined` (broken stub without a `--localstorage-file` backing path).
- Under vitest's jsdom environment this Node global shadows jsdom's real localStorage. jotai's `atomWithStorage` default storage (`createJSONStorage(() => localStorage)`) resolves to this object; on write it calls `setItem` → throws.
- Trigger is a storage WRITE: `store.set(currency2DisplayAtom, displayed)` at src/components/SearchBar.test.tsx:20. Other component tests pass because they never write a persisted atom.
- vitest.config.ts currently has NO `setupFiles` — nothing installs a working localStorage.
</root_cause>

<interfaces>
<!-- Executor needs no codebase exploration. Key facts extracted below. -->

vitest.config.ts (current — only `test.environment` and `test.include` are set, NO setupFiles):
```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
});
```

Persisted atoms use jotai `atomWithStorage` with default (localStorage-backed) storage — src/lib/atoms.ts. `currency2DisplayAtom` is `atomWithStorage<string[]>('currency2Display', ...)`. Any `store.set(...)` on these writes through `localStorage.setItem`.

tsconfig include is `["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]` — a root-level `vitest.setup.ts` IS covered by TypeScript/lint. `strict: true` is enabled; the mock must be fully typed (no implicit `any`).
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add in-memory Storage mock and wire it into vitest setup</name>
  <files>vitest.setup.ts, vitest.config.ts</files>
  <action>
Create `vitest.setup.ts` at repo root. Implement a factory `createStorageMock()` that returns a `Storage`-compatible object backed by a private `Map<string, string>`:
- `getItem(key: string): string | null` — return the mapped value or `null` when absent (Web Storage returns null, never undefined).
- `setItem(key: string, value: string): void` — coerce value to string via `String(value)` and store it.
- `removeItem(key: string): void` — delete the key.
- `clear(): void` — empty the map.
- `key(index: number): string | null` — return the nth key by insertion order or `null` if out of range.
- `length` — a getter returning the map size.
Type the returned object as `Storage` (cast the assembled object with `as Storage` at the boundary since the index signature of the DOM `Storage` type is not directly implementable). Follow project conventions: single quotes, 2-space indent, TypeScript, no fenced surprises.

Install TWO independent instances (separate state) onto the global for `localStorage` and `sessionStorage` using `Object.defineProperty(globalThis, 'localStorage', { value: <mock>, configurable: true, writable: true })` and the same for `sessionStorage`. `configurable: true` is required so the override beats Node 25's non-configurable-feeling built-in and stays replaceable. If `typeof window !== 'undefined'` and `window !== globalThis`, also `Object.defineProperty` both storages onto `window` so jsdom consumers that read `window.localStorage` get the mock too.

Import `beforeEach` from 'vitest' and register a hook that calls `localStorage.clear()` and `sessionStorage.clear()` before each test to prevent cross-test state bleed.

Then edit `vitest.config.ts`: add `setupFiles: ['./vitest.setup.ts']` inside the `test` object (keep `environment: 'node'` and the existing `include`). The setup file runs in both node and jsdom environments and is harmless in node.
  </action>
  <verify>
    <automated>npm run test:run 2>&1 | tail -20; echo "EXIT=${PIPESTATUS[0]}"</automated>
  </verify>
  <done>`vitest.setup.ts` exists exporting/installing the storage mock; `vitest.config.ts` has `setupFiles: ['./vitest.setup.ts']`; `npm run test:run` exits 0 with all 8 test files and 81 tests passing (SearchBar's 6 included).</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| (none new) | Test-only infrastructure. No production code, runtime surface, or untrusted-input path is added or modified. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-quick-01 | Tampering | vitest.setup.ts global override | accept | Override affects the test process only; no bundled/shipped code changes. `configurable: true` keeps it replaceable, no global lock-in. |
| T-quick-SC | Tampering | npm/pip/cargo installs | accept | No new packages installed — vitest 2.1.9 and all deps already present in package.json. No package legitimacy gate required. |
</threat_model>

<verification>
- `npm run test:run` is FULLY GREEN: 81/81 tests, 8/8 files. Confirm SearchBar's 6 tests pass and no previously-passing test (CurrencyRow, InstallButton, atoms drift-guard, etc.) regressed.
- `npm run lint` is clean (root-level `vitest.setup.ts` is covered by tsconfig `**/*.ts` and must pass strict-mode typing with no implicit `any`).
- SearchBar assertions are unchanged — the diff touches only `vitest.setup.ts` (new) and `vitest.config.ts` (setupFiles line). `git diff --stat` shows no change to `src/components/SearchBar.test.tsx`.
</verification>

<success_criteria>
- `npm run test:run` exits 0 with 81 passing tests across 8 files.
- `npm run lint` exits 0 with no errors.
- No SearchBar assertion was weakened or deleted; only test infrastructure (setup + config) changed.
</success_criteria>

<output>
Create `.planning/quick/260711-rdn-fix-searchbar-test-tsx-localstorage-mock/260711-rdn-SUMMARY.md` when done.
</output>
