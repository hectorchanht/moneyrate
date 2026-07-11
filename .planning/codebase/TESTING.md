# Testing Patterns

**Analysis Date:** 2026-07-11

> This project **has a real test suite** (an older codebase map incorrectly said "no test runner" — that is out of date). There are two layers: Vitest unit/component tests under `src/` and Playwright end-to-end tests under `e2e/`.

## Test Framework

**Unit / Component Runner:**
- Vitest `^2.1.9` — config: `vitest.config.ts`
- React support via `@vitejs/plugin-react` (`vitest.config.ts:6`)
- DOM environment: `jsdom ^29.1.1`
- Testing utilities: `@testing-library/react ^16.3.2`, `@testing-library/user-event ^14.6.1`, `@testing-library/dom ^10.4.1`

**E2E Runner:**
- Playwright `@playwright/test ^1.61.1` — config: `playwright.config.ts`
- Single project: `chromium` / `Desktop Chrome` (`playwright.config.ts:13`)

**Assertion Library:**
- Vitest's built-in `expect` (Jest-compatible matchers). `@testing-library/react` truthiness checks are common (`expect(...).toBeTruthy()`); `jest-dom` matchers are **not** installed, so assertions use `.toBeTruthy()` / `.toBeNull()` rather than `.toBeInTheDocument()`.
- Playwright's `expect` with web-first auto-retrying matchers (`toBeVisible`, `toHaveValue`, `toHaveAttribute`, `toBeFocused`).

**Run Commands:**
```bash
npm test          # vitest — watch mode (interactive)
npm run test:run  # vitest run — single pass, CI-friendly
npm run test:e2e  # playwright test — spins up `npm run dev` on :3000 automatically
```

## Test File Organization

**Location:**
- Unit/component tests are **co-located** next to the file under test (same directory, `<Name>.test.ts[x]`).
- E2E tests live in a separate top-level `e2e/` directory.

**Naming:**
- Vitest: `<Name>.test.tsx` (components), `<Name>.test.ts` (lib/routes).
- Playwright: `<feature>.spec.ts`.

**Discovery globs:**
- Vitest includes `src/**/*.{test,spec}.{ts,tsx}` (`vitest.config.ts:10`).
- Playwright `testDir: './e2e'` (`playwright.config.ts:4`).

**Current test inventory:**
```
src/components/CurrencyRow.test.tsx      # component (jsdom)
src/components/SearchBar.test.tsx        # component (jsdom, Jotai + Language providers)
src/components/InstallButton.test.tsx    # component (jsdom, window events)
src/lib/fns.test.ts                      # pure functions (node)
src/lib/api.test.ts                      # URL builders + fetch layer (node)
src/lib/tourSteps.test.ts               # tour step builder + i18n coverage (node)
src/app/api/currencyChart/route.test.ts  # route handler (node)
e2e/home.spec.ts                         # converter + SEO pair page
e2e/tour.spec.ts                         # onboarding tour keyboard a11y
```

## Test Environment Selection

**IMPORTANT — this is the project's key testing convention:**
- The Vitest default environment is **`node`** (`vitest.config.ts:9`), because most tests are pure-function/route tests that need no DOM.
- Component tests **opt into jsdom per-file** with a docblock on the very first line:
  ```ts
  // @vitest-environment jsdom
  ```
  See `src/components/CurrencyRow.test.tsx:1`, `src/components/SearchBar.test.tsx:1`, `src/components/InstallButton.test.tsx:1`.
- There is **no global setup file** (no `vitest.setup.ts`, no `setupFiles` in config). Any global stubbing is done inline per test with `vi.stubGlobal` / `Object.defineProperty`.

**When writing a new test:** default to `node`. Add the `// @vitest-environment jsdom` docblock only if the test renders React or touches `document`/`window`.

## Test Structure

**Suite Organization:**
```ts
// src/lib/api.test.ts — one describe per unit under test
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetcher } from './api';

describe('fetcher', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('throws on a non-2xx response so SWR surfaces the error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) })));
    await expect(fetcher('https://x.test')).rejects.toThrow('status 404');
  });
});
```

**Patterns:**
- Vitest globals are **imported explicitly** (`import { describe, expect, it, vi } from 'vitest'`) — `globals: true` is NOT set in config, so every test file imports what it uses.
- Prefer `it(...)`; use `describe(...)` to group by the function/component under test. Test names read as behavior sentences ("adds the first result on Enter", "returns 400 when q is missing").
- Component teardown: `afterEach(() => cleanup())` from `@testing-library/react` in every jsdom test. Some also `vi.clearAllMocks()` (`src/components/CurrencyRow.test.tsx:27-30`).
- Global/stub teardown: `afterEach(() => vi.unstubAllGlobals())` whenever a test uses `vi.stubGlobal` (`src/lib/api.test.ts`, `src/lib/fns.test.ts`, `route.test.ts`).
- Timer teardown: `afterEach(() => vi.useRealTimers())` when using fake timers (`src/lib/fns.test.ts:91`).

## Mocking

**Framework:** Vitest's `vi` (`vi.mock`, `vi.fn`, `vi.stubGlobal`, `vi.useFakeTimers`, `vi.unstubAllGlobals`).

**Module mock — `next/image` (required for any component using it):**
```ts
// next/image needs the Next runtime; render a plain <img> in tests.
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: unknown; alt?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === 'string' ? src : ''} alt={alt ?? ''} />
  ),
}));
```
See `src/components/CurrencyRow.test.tsx:7-12` and `src/components/SearchBar.test.tsx:11-16`.

**Global `fetch` stubbing (network is never hit in unit tests):**
```ts
const fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ v: 1 }) }));
vi.stubGlobal('fetch', fetchMock);
// ...assert on fetchMock.mock.calls / call count
```
Sequenced responses use `.mockResolvedValueOnce(...)` chaining (`src/lib/api.test.ts:49-53`). The route test builds a URL-aware fetch that returns different bodies per Yahoo ticker shape (`src/app/api/currencyChart/route.test.ts:12-16`).

**Browser API stubbing (inline, per test):**
- `localStorage`: a plain object with `getItem`/`setItem` is installed via `vi.stubGlobal('window', ...)` + `vi.stubGlobal('localStorage', ...)` (`src/lib/fns.test.ts:123-129`).
- `navigator.clipboard`: `Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })` (`src/components/CurrencyRow.test.tsx:71-72`).
- DOM events: constructed and dispatched manually — a synthetic `beforeinstallprompt` event with `prompt`/`userChoice` fired via `fireEvent(window, evt)` (`src/components/InstallButton.test.tsx:8-17`).

**Callback mocks:** `vi.fn()` for all component prop callbacks (`onSelectBase`, `onValueChange`, etc.), asserted with `toHaveBeenCalledWith` / `toHaveBeenLastCalledWith` (`src/components/CurrencyRow.test.tsx:21-24,44,58`).

**Providers in component tests:** state-dependent components are wrapped in a fresh Jotai store per render, seeded before assertions:
```ts
const store = createStore();
store.set(currency2DisplayAtom, displayed);
render(
  <Provider store={store}>
    <LanguageProvider>
      <SearchBar data={data} />
    </LanguageProvider>
  </Provider>
);
```
See `src/components/SearchBar.test.tsx:18-29`. The store is returned from the render helper so tests can assert on final atom state (`store.get(currency2DisplayAtom)`).

**What to Mock:**
- `next/image` (no Next runtime in Vitest).
- `fetch` and all network access.
- Browser APIs unavailable in jsdom/node (`localStorage`, `navigator.clipboard`, PWA install events).

**What NOT to Mock:**
- Pure functions under test (`evalMathExpression`, `sortCurrencyPairs`, `resolveTourLocale`) — exercised directly with real inputs.
- Jotai atoms — use a real `createStore()` and set/get real state rather than mocking the store.
- The route handler's own logic — only its `fetch` dependency is stubbed; `GET` is imported and called directly (`src/app/api/currencyChart/route.test.ts:2,22`).

## Fixtures and Factories

**Test data:** inline literals and small local factory helpers — no shared fixtures directory.
```ts
// Shared default props spread per test, overriding only what matters (CurrencyRow.test.tsx:14-25)
const baseProps = { currencyValue: 100, baseCur: 'USD', isEditing: false, /* ...callbacks: vi.fn() */ };
render(<CurrencyRow {...baseProps} cur="EUR" val={0.9} name="Euro" />);

// Factory functions build request/response shapes (route.test.ts:4-9)
const chartResult = (close: number[], timestamp: number[]) => ({ chart: { result: [{ timestamp, indicators: { quote: [{ close }] } }] } });
const req = (q?: string) => new Request(`http://localhost/api/currencyChart${q === undefined ? '' : `?q=${q}`}`);
```

**E2E fixtures:** deterministic API responses are mocked at the network layer with `page.route(...)`, and `localStorage` is seeded via `page.addInitScript(...)` before navigation:
```ts
async function mockRates(page: Page) {
  await page.route('**/v1/currencies.json', (route) => route.fulfill({ json: { usd: 'US Dollar', eur: 'Euro', /* ... */ } }));
  await page.route('**/v1/currencies/usd.json', (route) => route.fulfill({ json: { date: '2026-07-03', usd: { usd: 1, eur: 0.9, cad: 1.4 } } }));
}
async function seed(page: Page) {
  await mockRates(page);
  await page.addInitScript(() => { localStorage.setItem('currency2Display', JSON.stringify(['usd', 'eur', 'cad'])); /* ... */ });
}
```
See `e2e/home.spec.ts:5-22` and `e2e/tour.spec.ts:11-34`. E2E specs intentionally **do not import from `src/`** — constants like `TOUR_STEP_COUNT` are re-declared locally with a comment noting the mirror (`e2e/tour.spec.ts:2-7`).

## Coverage

**Requirements:** None enforced. No coverage thresholds in `vitest.config.ts`; `@vitest/coverage-*` is not installed.

**Directory:** `/coverage` and `/test-results`, `/playwright-report`, `/blob-report` are git-ignored (`.gitignore`).

**View Coverage:**
```bash
# Coverage provider is not currently installed. To enable:
#   npm i -D @vitest/coverage-v8 && npx vitest run --coverage
```

## Test Types

**Unit Tests (node env):**
- Pure functions (`src/lib/fns.test.ts`), URL builders + fetch fallback layer (`src/lib/api.test.ts`), and i18n/tour-step construction (`src/lib/tourSteps.test.ts`).
- Data-driven loops over all 30 locales enforce i18n contracts — key-set parity, title/body length budgets (Latin ≤110 / CJK ≤55 glyphs), no-emoji, and drift-free locale count (`src/lib/tourSteps.test.ts:145-211`). Use this pattern when adding locale-wide invariants.

**Component Tests (jsdom env):**
- Render + interact via `@testing-library/user-event` (`user.click`, `user.type`, `user.keyboard`) and assert on visible text / roles.
- Query by accessible role wherever possible: `getByRole('textbox')`, `getByRole('combobox')`, `getByRole('button', { name: /copy eur value/i })`.

**Integration Tests:**
- The API route handler test (`src/app/api/currencyChart/route.test.ts`) imports `GET` and drives it with real `Request` objects and a stubbed `fetch` — closest thing to an integration test in the unit layer.

**E2E Tests:**
- Playwright (`e2e/`). `home.spec.ts` covers conversion math, math-expression input, theme toggle, search, and the SEO `/convert/[pair]` route. `tour.spec.ts` covers keyboard-only onboarding-tour accessibility (Tab to `.tour-replay-btn`, Enter/Arrow/Escape driving driver.js, focus restoration).
- **Selector rule (from CLAUDE.md):** target stable hooks — `data-tour` attributes and `.tour-replay-btn` class — **never** localized `aria-label`s, since copy is translated across 30 languages.

## Common Patterns

**Async Testing (user-event / promises):**
```ts
const user = userEvent.setup();
await user.type(screen.getByRole('combobox'), 'eur');
expect(screen.getByText('EUR')).toBeTruthy();

// promise-returning subjects
await expect(fetchWithFallback([...])).resolves.toEqual({ v: 1 });
await expect(fetcher('https://x.test')).rejects.toThrow('status 404');
```

**Error / status testing (route handler):**
```ts
const res = await GET(req());            // no q param
expect(res.status).toBe(400);
expect((await res.json()).error).toMatch(/provide a query parameter/i);
```

**Fake timers (debounce):**
```ts
vi.useFakeTimers();
const debounced = debounce(fn, 150);
debounced(); debounced(); debounced();
vi.advanceTimersByTime(150);
expect(fn).toHaveBeenCalledTimes(1);   // coalesced
// afterEach(() => vi.useRealTimers());
```

**Regression tests are labeled:** comments tie an assertion to the bug it guards (`// Regression: the \`matched.length && ...\` guard used to render a literal "0".`, `src/components/SearchBar.test.tsx:41`). Playwright a11y checks are labeled `VERIFY-FIRST:` to mark baseline-behavior gates (`e2e/tour.spec.ts:51`).

---

*Testing analysis: 2026-07-11*
