# Codebase Concerns

**Analysis Date:** 2026-07-03

## Tech Debt

**Triple package manager confusion:**
- Issue: The repo has signals for three different package managers simultaneously: `package.json` declares `"packageManager": "yarn@3.6.1+sha512..."` (Yarn Berry / PnP), there is a `bun.lockb` binary lockfile at the repo root, and an uncommitted `package-lock.json` (npm) with 491 insertions is currently modified in the working tree along with a new untracked `.pnp.loader.mjs` file.
- Files: `package.json:34`, `/Users/laichan/code/tung/moneyrate/bun.lockb`, `/Users/laichan/code/tung/moneyrate/package-lock.json`, `/Users/laichan/code/tung/moneyrate/.pnp.loader.mjs`
- Impact: Different contributors/CI runs could install different dependency trees depending on which tool picks up first, causing "works on my machine" bugs. `.pnp.loader.mjs` is a generated Yarn PnP artifact that appears to have been committed/left in the working tree accidentally (it is not in `.gitignore`, only `.pnp.js` and `/.pnp` are ignored).
- Fix approach: Pick one package manager (npm, given the presence of `package-lock.json` in current changes, or Yarn per `packageManager` field), delete the other lockfiles (`bun.lockb`, and either `yarn.lock`/`package-lock.json`), remove `.pnp.loader.mjs`, and add `.pnp.loader.mjs`/`.pnp.cjs` to `.gitignore`.

**Dead/empty file `src/lib/func.ts`:**
- Issue: File exists with 0 bytes and is not imported anywhere.
- Files: `src/lib/func.ts`
- Impact: Confuses future contributors (`fns.ts` vs `func.ts` naming collision risk).
- Fix approach: Delete the file, or merge its intended purpose into `src/lib/fns.ts`.

**Dead code: commented-out ad banner block:**
- Issue: A ~17-line block of a promotional banner (AI Stock Predictions) is commented out directly in JSX rather than removed or feature-flagged.
- Files: `src/app/page.tsx:168-185`
- Impact: Clutters the render method; unclear if it's meant to be re-enabled. No tracking of why it was disabled.
- Fix approach: Remove if permanently retired, or move behind a feature flag/env var if it will return.

**Dead code: commented-out mtfxgroup historical data fetch:**
- Issue: 10 lines of commented-out fetch/parse logic for an alternate chart data source left in the API route.
- Files: `src/app/api/currencyChart/route.ts:3-12`
- Impact: Dead code adds noise and makes it unclear whether mtfxgroup is a fallback that should be restored.
- Fix approach: Remove, or replace with an actual fallback branch if mtfxgroup should still be used when Yahoo Finance fails.

**Dead/unused Next.js image remote pattern:**
- Issue: `next.config.mjs` whitelists `assets.coincap.io` for `next/image` remote loading, but no code references `assets.coincap.io` anywhere; all currency/flag icons are served from local `public/crypto-icons` and `public/country-flags`.
- Files: `next.config.mjs:1-13`
- Impact: Misleading configuration; suggests a remote image integration exists when it does not (git history shows icons were downloaded locally in commit `a5cdb23`, and the remote pattern was never removed).
- Fix approach: Remove the `remotePatterns` block if CoinCap remote icons are no longer used.

**No test suite exists:**
- Issue: Zero test files (`*.test.*`, `*.spec.*`) anywhere in the repo. No test runner (Jest/Vitest/Playwright) is configured in `package.json`.
- Files: N/A (absence)
- Impact: Any refactor of currency math (`src/app/page.tsx`), the chart API route (`src/app/api/currencyChart/route.ts`), or translations risks silent regressions with no automated safety net.
- Fix approach: Add Vitest + React Testing Library for unit/component tests, starting with the pure logic in `src/lib/api.ts`, `src/lib/fns.ts`, and the decimal-place/currency-value calculations in `src/app/page.tsx`.

**Hardcoded magic numbers for responsive decimal places:**
- Issue: Breakpoints (`windowWidth < 410`, `< 370`, `< 300`) and decimal place counts (4, 3, 2, default 6) are inlined directly in the render loop instead of being named constants or a lookup table.
- Files: `src/app/page.tsx:202-213`
- Impact: Hard to reason about/adjust responsive behavior; easy to introduce off-by-one errors when tweaking breakpoints.
- Fix approach: Extract to a `getCryptoDpForWidth(width: number): number` helper in `src/lib/fns.ts` with named breakpoint constants.

**Duplicated `CurrencyRates` type definition:**
- Issue: The type `{ [key: string]: number }` is defined twice under the same name `CurrencyRates` — once locally in `src/app/page.tsx:66-68` and once exported from `src/lib/types.ts:6-8`. The page-local copy shadows the shared one instead of importing it.
- Files: `src/app/page.tsx:66-68`, `src/lib/types.ts:6-8`
- Impact: Type drift risk if one definition changes without the other; unnecessary duplication.
- Fix approach: Delete the local definition in `page.tsx` and import `CurrencyRates` from `@/lib/types`.

**Unused/branded types not enforced at call sites:**
- Issue: `CurrencyCode` and `LanguageCode` are declared as branded string types (`src/lib/types.ts:20-22`) intended to prevent mixing plain strings with validated currency/language codes, but call sites freely cast with `as CurrencyCode` (`src/app/page.tsx:112`) or `as LanguageCode` (`src/components/CurrencyListModal.tsx:124`) on unvalidated user input, defeating the purpose of branding.
- Files: `src/lib/types.ts:20-22`, `src/app/page.tsx:112`, `src/components/CurrencyListModal.tsx:124`
- Impact: False sense of type safety; branded types provide no actual runtime guarantee here.
- Fix approach: Either add a runtime validator (`isValidCurrencyCode`) before casting, or drop the branding and use plain `string`/`Language` types to avoid misleading safety.

## Known Bugs

**Chart API route crashes (500) when both Yahoo Finance endpoints fail:**
- Symptoms: If none of `r_fiat`, `r_crypto`, `r_crypto_flip` return a valid `chart.result[0]` (e.g., invalid ticker, Yahoo Finance rate-limits/blocks the request, or network failure), `data` remains `undefined`. The subsequent line `const { timestamp, indicators } = data?.chart?.result?.[0];` destructures from `undefined` optional-chained to `undefined`, which is fine, but `indicators?.quote?.[0]` also resolves to `undefined`, and then `const { close } = indicators?.quote?.[0];` throws `Cannot destructure property 'close' of 'undefined' as it is undefined.` because that line does not use optional chaining before destructuring.
- Files: `src/app/api/currencyChart/route.ts:54-55`
- Trigger: Request `/api/currencyChart?q=<invalid-or-unsupported-pair>` (e.g., a currency pair not on Yahoo Finance, or when Yahoo Finance is down/rate-limiting).
- Workaround: None currently; the route returns an unhandled 500 instead of the friendly JSON error message pattern already used for the missing `q` param (line 23).

**Chart API route unguarded on malformed `q` param:**
- Symptoms: `ratepair.split('-')[0]` and `[1]` (`route.ts:27-28`) assume `q` always contains exactly one `-`. If a client passes `q=USD` (no dash), `baseCur` becomes `undefined`, and `getApiUri(baseCur + '-' + targetCur)` becomes `"undefined-USD=X"`, producing confusing downstream failures instead of a clear validation error.
- Files: `src/app/api/currencyChart/route.ts:26-28`
- Trigger: `/api/currencyChart?q=USD` or any `q` without a `-` separator.
- Workaround: None; no validation exists beyond checking `ratepair` truthiness.

**`CurrencySetting` "Reset Value" input allows `NaN` to be stored:**
- Symptoms: `setDefaultCurrencyValue(parseInt(d.target.value))` has no `isNaN` guard, unlike the decimal-places input two fields below it which does guard (`CurrencyListModal.tsx:109`). Clearing the input field or typing non-numeric text sets `defaultCurrencyValue` to `NaN`, which is then persisted to `localStorage` via `atomWithStorage` and used later in arithmetic (`setCurrencyValue(defaultCurrencyValue || 100)` in `page.tsx:100`, and `100` only kicks in for falsy `0`/`undefined`, not for `NaN`, since `NaN || 100` evaluates to `100` — but any other arithmetic path that reads `defaultCurrencyValueAtom` directly is not protected).
- Files: `src/components/CurrencyListModal.tsx:93-97`
- Trigger: Open settings, clear the "Reset Value" input, or type a non-numeric character.
- Workaround: `NaN || 100` happens to save the immediate consumer in `page.tsx:100`, but the bad `NaN` value is still persisted in `localStorage` under key `defaultCurrencyValue`.

**`SearchBar` renders literal `0` text when query is non-empty but no matches exist... actually renders nothing incorrectly in the inverse case:**
- Symptoms: The results dropdown guard is `{matched.length && query.length ? <div>...</div> : null}` (`SearchBar.tsx:69`). When `matched.length === 0` (no results) and `query.length > 0` (user has typed something with no match), the expression evaluates to `0` (a number), and React renders the literal text `0` on screen instead of nothing.
- Files: `src/components/SearchBar.tsx:69`
- Trigger: Type any search text that matches zero currency codes/names (e.g., "zzz999").
- Workaround: None; visible stray "0" appears in the UI. Fix: use `matched.length > 0 && query.length > 0` or `Boolean(matched.length && query.length)`.

**Duplicate search matches when a currency code and name both match the query:**
- Symptoms: `matched` is built by concatenating `filteredMatches` (code matches) and `filteredMatches2` (name matches) without de-duplication (`SearchBar.tsx:17-33`). If a currency's code and translated name both contain the query substring, its code appears twice in the dropdown list.
- Files: `src/components/SearchBar.tsx:17-33`
- Trigger: Search a query that matches both a currency's code and its display name simultaneously.
- Workaround: None. Fix: dedupe with `[...new Set([...filteredMatches, ...filteredMatches2])]`.

**`handleDrop` can compute an out-of-range or negative splice index:**
- Symptoms: `itemIndex = Math.floor(dropY / itemHeight)` (`page.tsx:133`) is not clamped. Dropping above the list (`dropY` negative) yields a negative index; `Array.splice(negativeIndex, 0, item)` in JS interprets negative indices as `array.length + index`, producing an insertion position far from where the user visually dropped, or dropping below the last item computes an index beyond the array length (which `splice` clamps to append — inconsistent behavior at the two boundaries). `draggedIndex` from `indexOf` is also not checked for `-1` (would occur if `currencyItemOnDrag.current` was already removed/changed), which would insert `undefined` into the list.
- Files: `src/app/page.tsx:122-144`
- Trigger: Drag a currency row and drop near the very top/bottom edge of the `#currencyList` container, or drop after a fast state change in the display list.
- Workaround: None. Fix: clamp `itemIndex` with `Math.max(0, Math.min(itemIndex, newCurrency2Display.length - 1))` and guard `draggedIndex !== -1` before splicing.

**`localStorage.clear()` on Reset wipes unrelated app/browser storage, not just this app's keys:**
- Symptoms: The "RESET" button calls `localStorage.clear()` (`CurrencyListModal.tsx:147`), which clears **all** localStorage keys for the origin, not just the Jotai `atomWithStorage` keys used by this app (`baseCur`, `currency2Display`, `currencyValue`, etc.). If any other same-origin script/analytics tool stores data in localStorage, it is destroyed too.
- Files: `src/components/CurrencyListModal.tsx:146-153`
- Trigger: Click Settings tab → RESET button.
- Workaround: None. Fix: explicitly `localStorage.removeItem()` for each known atom key, or track a namespaced prefix and clear only matching keys.

**Chart range-slider state mutation during render:**
- Symptoms: `if (startTimestamp === 0 && data?.data.length > 0) { setStartTimestamp(...); setEndTimestamp(...); }` (`chart/page.tsx:58-61`) calls `setState` directly in the function body during render (not inside `useEffect`), which is a React anti-pattern. It happens to work because it only fires once (guarded by `startTimestamp === 0`) and triggers a synchronous re-render, but it is fragile: if `data.data` is ever empty on first load then later repopulated with fresh data at a different range (e.g., user changes `q`), the guard `startTimestamp === 0` no longer holds (it's already been set from a previous query), so the slider range silently keeps the stale bounds from the previous currency pair.
- Files: `src/app/chart/page.tsx:58-61`
- Trigger: Navigate on the chart page from one `q` (e.g., `USD-CAD`) to a different `q` without a full page reload (e.g., clicking the Reverse button, which does a full `window.location.href` reload today — but any future SPA-style navigation would hit this).
- Workaround: Currently masked because `ReverseSvg` triggers a hard navigation (`window.location.href`, `chart/page.tsx:99`) rather than client-side routing. Fix: reset `startTimestamp`/`endTimestamp` in a `useEffect` keyed on `q`.

**`showASCIIArt()` re-appended script and dangling reference in cleanup:**
- Symptoms: `useDragDropTouch` (`page.tsx:38-64`) appends a `<script>` tag to `document.body` on mount and removes it on unmount, but if the component re-mounts quickly (e.g., React Strict Mode double-invoke in development, or fast route transitions), duplicate script tags can be briefly appended before the first cleanup runs, each firing `enableDragDropTouch()` and logging duplicate console messages.
- Files: `src/app/page.tsx:38-64`
- Trigger: React 18 Strict Mode in development (mounts effects twice); noticeable via duplicate `"drag-drop-touch initialized via custom hook."` console logs.
- Workaround: Harmless in practice (idempotent polyfill init) but indicates the effect isn't guarded against double-invocation.

## Security Considerations

**Third-party script loaded without Subresource Integrity (SRI):**
- Risk: `useDragDropTouch` dynamically injects `<script src="https://drag-drop-touch-js.github.io/dragdroptouch/dist/drag-drop-touch.esm.min.js?autoload">` (`page.tsx:41`) with no `integrity` attribute and no pinned version (URL points at `dist/` on the default branch, not a tagged release). If the upstream GitHub Pages content is compromised or changed, arbitrary JS runs in the user's browser with full page privileges.
- Files: `src/app/page.tsx:40-56`
- Current mitigation: None.
- Recommendations: Self-host the polyfill from `public/`, or pin to a specific tagged version and add an `integrity` hash + `crossorigin="anonymous"`.

**Third-party analytics script loaded from local path with no visible source:**
- Risk: `<script src="/clarity.js" async />` (`src/app/layout.tsx:41`) is loaded on every page. The file lives in `public/clarity.js` (Microsoft Clarity analytics) — its contents were not inspected here per policy, but any third-party analytics snippet embedded on every route has access to full DOM/user interaction data (page content, currency amounts users type, IP-derived approximate location). No Content-Security-Policy is configured anywhere in the app to constrain what such scripts can do or exfiltrate.
- Files: `src/app/layout.tsx:41`, `public/clarity.js`
- Current mitigation: None (no CSP headers found in `next.config.mjs` or middleware).
- Recommendations: Add a `Content-Security-Policy` header via `next.config.mjs` headers() or middleware to restrict script/connect sources, and document what Clarity collects for privacy compliance (GDPR/CCPA) since this is a public-facing site.

**No input validation on server API route query parameters:**
- Risk: `src/app/api/currencyChart/route.ts:17-28` takes the `q` query param directly from the URL and interpolates it into outbound fetch URLs (`getApiUri(ratepair.replace('-', '') + '=X')`, etc.) without allow-listing characters or currency codes. While this doesn't directly enable SSRF against internal infrastructure (the base URL `query1.finance.yahoo.com` is hardcoded), an attacker-controlled path segment is concatenated into the URL unescaped, which could allow URL path manipulation (e.g., `q=..%2f..%2fsome-path` or injecting extra query params) depending on how Next.js/fetch normalize it.
- Files: `src/app/api/currencyChart/route.ts:26-39`
- Current mitigation: None beyond a truthiness check on `ratepair`.
- Recommendations: Validate `q` against a strict pattern (e.g., `^[A-Za-z]{3,6}-[A-Za-z]{3,6}$`) before use, and reject/400 on mismatch instead of proceeding.

**No rate limiting on `/api/currencyChart`:**
- Risk: The route makes 3 outbound fetches to Yahoo Finance per request (`route.ts:35-39`) with no caching, no rate limiting, and no auth. A malicious actor could script repeated requests with varying `q` values to hammer Yahoo Finance's API through this server as a proxy, potentially getting the deploying IP rate-limited/blocked by Yahoo, or running up serverless invocation costs.
- Files: `src/app/api/currencyChart/route.ts:15-63`
- Current mitigation: None.
- Recommendations: Add caching (e.g., `Cache-Control` headers or an edge cache/KV store keyed by `ratepair` + day) since chart data (interval `1mo`) does not need to be re-fetched from Yahoo on every request, and consider basic IP-based rate limiting.

## Performance Bottlenecks

**Chart API fires 3 parallel external requests on every load, always:**
- Problem: `route.ts:35-39` always fetches all three variants (`fiat=X`, `crypto` direct, `crypto` flipped) in parallel even though only one will typically be used, wasting 2/3 of the Yahoo Finance API calls and adding unnecessary latency/load on every single chart page visit.
- Files: `src/app/api/currencyChart/route.ts:35-43`
- Cause: The route doesn't know ahead of time whether the pair is fiat or crypto, so it guesses by trying all three shapes rather than sequential fallback (`fiat` → if fails, `crypto` → if fails, `crypto_flip`).
- Improvement path: Fetch `r_fiat` first; only fetch `r_crypto`/`r_crypto_flip` if the fiat result lacks `chart.result[0]`, cutting typical-case external calls from 3 to 1.

**No caching layer for either currency-rate or chart API calls:**
- Problem: Every page load re-fetches the full currency rate table (`getCurrencyRateApiUrl({})`, `page.tsx:84`) and the base-currency-specific table (`page.tsx:83`) from `currency-api.pages.dev`, and every chart page load re-fetches from Yahoo Finance — with only SWR's in-memory `keepPreviousData` and default revalidate-on-focus behavior. There's no `revalidateOnFocus: false`, no `dedupingInterval` tuning, and no `Cache-Control`/`stale-while-revalidate` response headers set on the Next.js API route (`route.ts`).
- Files: `src/app/page.tsx:83-84`, `src/app/chart/page.tsx:35`, `src/app/api/currencyChart/route.ts:63`
- Cause: Default SWR config revalidates on window focus and reconnect; combined with no HTTP caching, this means switching tabs back to the app re-fetches both large currency datasets even though exchange rates only update daily.
- Improvement path: Set `revalidateOnFocus: false` for these SWR hooks (rates don't change intra-session), and add `Cache-Control: public, max-age=3600, stale-while-revalidate=86400` to the `NextResponse.json` in `route.ts:63`.

**Full currency-rate object fetched even though only displayed currencies are used:**
- Problem: `data4All` fetches the entire currency name map (`getCurrencyRateApiUrl({})`) and `data4BaseCur` fetches every exchange rate for the base currency against **all** currencies in existence (`page.tsx:83`), but `curObj` then `pick()`s only the ~13 currencies the user actually displays (`page.tsx:86-88`). The full payload (hundreds of currencies) is downloaded and parsed on every load/base-currency change regardless.
- Files: `src/app/page.tsx:83-88`
- Cause: The upstream `currency-api.pages.dev` API does not support filtering by currency subset in the request itself, so full payload transfer may be unavoidable given the current API — but no memoized/local caching of the unfiltered response across base-currency switches exists beyond SWR's key-based cache (each `baseCur` change is a distinct cache key, so switching base currency re-fetches the full set again even if visited before in the same session, though SWR will cache it if switched back).
- Improvement path: If achievable, consider fetching only the "latest.json" full table once and computing cross-rates client-side (`rate(A→B) = rate(USD→B) / rate(USD→A)`) instead of re-querying a new base-currency-specific endpoint on every `onBaseCurChange`, cutting network calls roughly in half.

**`useWindowWidth` resize handler is not debounced/throttled:**
- Problem: `window.addEventListener('resize', handleResize)` (`useWindowWidth.ts:18`) fires a state update on every single `resize` event, which browsers can dispatch many times per second during a drag-resize of the window, causing the entire `Home` component tree (which maps over up to a dozen+ currency rows) to re-render on every pixel of resize.
- Files: `src/hooks/useWindowWidth.ts:9-23`
- Cause: No debounce/throttle wrapper around `setWindowWidth`, despite a `debounce` utility already existing in the codebase (`src/lib/fns.ts:2-10`) that is never used anywhere.
- Improvement path: Wrap `handleResize` with the existing `debounce` helper from `src/lib/fns.ts`, e.g., `const handleResize = debounce(() => setWindowWidth(window.innerWidth), 150)`.

**Inline computation of decimal-place logic runs per row on every render:**
- Problem: The `cryptoDp`/`dp2Show`/`val2Show` calculation block (`page.tsx:200-219`) re-executes `toLocaleString` and several conditionals for every currency row on every render of `Home`, including renders triggered by unrelated state changes (e.g., toggling `isEditing`), since none of this is memoized per-row.
- Files: `src/app/page.tsx:200-219`
- Cause: The `.map()` callback body is not extracted into a memoized child component; the entire list re-renders when any atom in `Home` changes.
- Improvement path: Extract each row into a `memo`-wrapped `CurrencyRow` component (similar to the existing `CountryImg` pattern at `src/components/CountryImg.tsx:59-65`) keyed by `cur`, receiving only the props it needs.

## Fragile Areas

**`src/app/page.tsx` — core conversion logic is a single 262-line client component:**
- Files: `src/app/page.tsx`
- Why fragile: Drag-and-drop reordering, currency value math, responsive decimal-place logic, SWR data fetching, and rendering are all interleaved in one component with no unit tests. Any change to one concern (e.g., adjusting decimal-place breakpoints) risks breaking another (e.g., drag-and-drop index math) because there's no separation of concerns or test coverage to catch regressions.
- Safe modification: Extract pure logic (decimal-place selection, `onBaseCurChange` recompute, drop-index calculation) into testable functions in `src/lib/fns.ts` before modifying; add unit tests for those functions first.
- Test coverage: None (0 test files in the repo).

**`src/app/api/currencyChart/route.ts` — data source has an undocumented "guess and check" fallback with no error surface:**
- Files: `src/app/api/currencyChart/route.ts:29-55`
- Why fragile: The logic silently tries three different Yahoo Finance ticker formats and picks whichever responds with valid data, with no logging of which path was taken or why the others failed. If Yahoo Finance changes its response shape or symbol conventions, this fails with an unhandled crash (see Known Bugs) rather than a clear diagnostic.
- Safe modification: Add explicit logging of which branch (`fiat`/`crypto`/`crypto_flip`) was selected and why the others were rejected before making further changes; add the `undefined`-safe destructure guard described in Known Bugs first.
- Test coverage: None; also difficult to test today since the route makes live calls to Yahoo Finance without any fetch abstraction/mocking seam.

**localStorage-backed Jotai atoms have no schema versioning or migration path:**
- Files: `src/lib/atoms.ts:1-13`
- Why fragile: All persisted state (`baseCur`, `currency2Display`, `currencyValue`, `defaultCurrencyValueDp`, `language`, etc.) is stored via `atomWithStorage` with raw keys and no version field. If the shape of any stored value changes in a future release (e.g., `currency2Display` changes from `string[]` to an object array), existing users' `localStorage` will contain incompatible data with no migration, likely causing runtime errors on `pick()`/`.map()`/`.filter()` calls that assume the current shape.
- Safe modification: Before changing any atom's stored shape, add a migration step that reads the old shape and transforms it, or version the storage key (e.g., `currency2Display_v2`).
- Test coverage: None.

**`Currency2country` mapping is a manually maintained hardcoded object with duplicate values:**
- Files: `src/lib/constants.ts:5-163`
- Why fragile: 150+ manually maintained currency-to-country-code mappings with no test verifying every code resolves to an actual flag SVG file in `public/country-flags/`. Multiple currency codes intentionally map to the same country flag (e.g., `"CNY"`, `"RMB"`, `"CNH"` all map to `"cn"` — lines 32-34), which is correct by design, but there's no automated check that new entries added later stay in sync with the actual files present in `public/country-flags/` (273 files) or that codes referenced elsewhere (e.g., `DefaultCurrency2Display` including `"xau"`, `"btc"`, `"eth"` in `constants.ts:2`) which aren't fiat currencies at all resolve correctly through the `crypto-icons` fallback path in `CountryImg.tsx:38-44`.
- Safe modification: Add a build-time or test-time check that every key in `Currency2country` has a corresponding file in `public/country-flags/`, and that every code in `DefaultCurrency2Display` resolves to *some* valid image (flag or crypto icon).
- Test coverage: None.

## Scaling Limits

**Client-side `pick()` over full rate table on every base-currency change:**
- Current capacity: Fine at current usage (single-user client-side app, ~13 displayed currencies out of the full rate table).
- Limit: If `DefaultCurrency2Display`/`currency2Display` grows very large (e.g., user adds 100+ currencies via the settings table in `CurrencyListModal.tsx`), the `.map()` over `currencyRatesPairs2Display` (`page.tsx:200`) renders that many unmemoized rows per render with no virtualization, which will degrade UI responsiveness on lower-end devices.
- Scaling path: Add list virtualization (e.g., `react-window`) if the displayed-currency count is expected to grow significantly, and memoize row components as noted in Performance Bottlenecks.

## Dependencies at Risk

**Hard dependency on unauthenticated third-party currency-rate API with no SLA:**
- Risk: `src/lib/api.ts:16-18` hardcodes `https://${date}.currency-api.pages.dev/...` (the `fawazahmed0/currency-api` public mirror hosted on Cloudflare Pages) as the sole source of truth for all exchange rate data, with no API key, no fallback provider, and no timeout/retry logic. If this free community-run service goes down, changes its response schema, or is deprecated, the entire app's core feature (currency conversion) breaks with only a generic "Error fetching data" message (`page.tsx:146`).
- Impact: Total loss of core functionality; no graceful degradation (e.g., no cached last-known-good rates shown to the user).
- Migration plan: Add a secondary rate provider as fallback, or cache the last successful response (e.g., in `localStorage`) to show stale-but-functional data when the primary API is unreachable.

**Hard dependency on Yahoo Finance's undocumented/unofficial chart API:**
- Risk: `src/app/api/currencyChart/route.ts:32` calls `query1.finance.yahoo.com/v8/finance/chart/...`, which is an unofficial, unauthenticated, and undocumented Yahoo endpoint frequently used by open-source finance tools. Yahoo has a history of changing or blocking this endpoint (rate limiting by IP, requiring cookies/crumbs) without notice.
- Impact: The entire `/chart` page (a headline feature per `README.md:10`, "Interactive Charts") could stop working with no warning.
- Migration plan: Monitor for Yahoo API changes; consider a dedicated financial data provider with an SLA (e.g., exchangerate.host, Alpha Vantage) as a fallback source for the chart feature.

**Externally-hosted, unpinned third-party polyfill script:**
- Risk: `drag-drop-touch-js.github.io` hosting for the mobile drag-and-drop polyfill (`page.tsx:41`) is a GitHub Pages site outside the control of this project; already flagged under Security Considerations for lack of SRI, it's also a single point of failure — if that GitHub Pages site is down, mobile drag-and-drop silently fails to initialize (only a `console.error`, no user-facing fallback UI).
- Impact: Mobile users lose the ability to reorder/delete currencies via drag-and-drop with no visible error.
- Migration plan: Vendor the polyfill into `public/` and serve it from the same origin.

## Missing Critical Features

**No error boundary or global error UI:**
- Problem: There is no `error.tsx` or `global-error.tsx` in `src/app/` (checked: only `layout.tsx`, `loading.tsx`, `page.tsx`, and `chart/page.tsx` exist). Any unhandled render-time exception (e.g., the chart API destructure crash described above) will produce Next.js's default unstyled error screen rather than the app's themed fallback.
- Blocks: Graceful degradation/error recovery UX for both `/` and `/chart` routes.

**No environment variable configuration for API endpoints:**
- Problem: Both external API base URLs (`currency-api.pages.dev` in `src/lib/api.ts:17`, and `query1.finance.yahoo.com` in `src/app/api/currencyChart/route.ts:32`) are hardcoded string literals rather than sourced from environment variables.
- Blocks: Easily switching providers per environment (staging/prod), or swapping in a mock API for local development/testing.

## Test Coverage Gaps

**Everything is untested — 0% coverage:**
- What's not tested: All business logic, including currency value recalculation on base-currency switch (`src/app/page.tsx:98-113`), decimal-place selection (`src/app/page.tsx:202-219`), drag-and-drop reorder index math (`src/app/page.tsx:122-144`), the chart API's fiat/crypto/flip fallback logic (`src/app/api/currencyChart/route.ts:29-55`), search matching/deduplication (`src/components/SearchBar.tsx:17-33`), and the `Currency2country` mapping completeness.
- Files: entire `src/` tree.
- Risk: Any bug fix or feature addition (the user's stated goal) has no regression safety net; manual QA is the only verification method.
- Priority: High — recommend adding tests for `src/lib/fns.ts` and the chart API route's fallback branches first, since those are the most bug-prone areas identified above.

---

*Concerns audit: 2026-07-03*
