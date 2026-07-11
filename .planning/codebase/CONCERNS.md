# Codebase Concerns

**Analysis Date:** 2026-07-11

> Context: client-only Next.js 14 currency app, no backend/DB. State persists in
> `localStorage` via Jotai `atomWithStorage`. Several concerns from the previous
> (pre-tour) codebase map have since been **fixed** and are recorded at the bottom
> so future audits don't re-flag them.

## Tech Debt

**`Home` page is a 508-line god component:**
- Issue: `src/app/page.tsx` mixes three unrelated responsibilities in one client component — SWR data fetching (3 rate tables), the entire driver.js tour orchestration (`startTour`, auto-start gate, unmount teardown, RTL/theme/reduced-motion reads), and the currency list UI (drag-drop, link hydration, conversion math). The tour logic alone is ~110 lines (`page.tsx:184-296`).
- Files: `src/app/page.tsx`
- Impact: Highest-churn, highest-risk file. Its own comments document a prior teardown bug (commit `a818626`) where a dep-keyed cleanup effect destroyed the tour milliseconds after start, permanently setting `tourSeen`. Two `eslint-disable react-hooks/exhaustive-deps` escapes (`page.tsx:146`, `page.tsx:162`) mean the linter can't catch stale-closure regressions here.
- Fix approach: Extract the tour into a dedicated hook (e.g. `src/hooks/useTour.ts`) owning the driver ref, gating effect, and unmount cleanup; extract link-hydration and conversion math into `src/lib/` pure helpers (following the existing `sortCurrencyPairs`/`getDropIndex` extraction pattern in `src/lib/fns.ts`).

**Reset key list drifted out of sync with the atom set:**
- Issue: The Settings "Reset" button hardcodes the 10 `localStorage` keys to clear (`src/components/CurrencyListModal.tsx:188-189`), but `src/lib/atoms.ts` declares **12** persisted atoms. `tourSeen` and `showDatePicker` are never cleared on reset.
- Files: `src/components/CurrencyListModal.tsx:187-193`, `src/lib/atoms.ts:16-17`
- Impact: A user who resets the app keeps `tourSeen=true`, so the onboarding tour never replays after a reset (arguably a bug — see Known Bugs). Any future atom added to `atoms.ts` will silently be excluded from reset too.
- Fix approach: Derive the key list from a single exported constant (e.g. `PERSISTED_KEYS` in `src/lib/atoms.ts` or `src/lib/constants.ts`) and iterate it in both the reset handler and any new consumer, instead of a hand-copied array.

**Magic-number mismatch in drag-drop row height:**
- Issue: Virtualized mode uses `ROW_HEIGHT = 68` (`src/app/page.tsx:38`), but the non-virtualized drop handler hardcodes a different `itemHeight = 72` (`src/app/page.tsx:365`) with the comment "Assuming each currency item has a fixed height."
- Files: `src/app/page.tsx:38`, `src/app/page.tsx:365`
- Impact: `getDropIndex` computes the insertion slot from `dropY / 72` while rows actually render nearer 68px, so drops near list boundaries can land one row off. Low severity (drag-drop is edit-mode only, capped to a valid index by `getDropIndex`), but the two constants should agree.
- Fix approach: Reference a single shared row-height constant in both places.

**Dead / leftover code:**
- Issue: `return Object.entries(curObj) || [];;` (`src/app/page.tsx:324`) has a stray double semicolon and an unreachable `|| []` (`Object.entries` never returns falsy). Commented-out dead lines remain in `src/app/layout.tsx:6` (`// import Head`), `layout.tsx:48-49` (`// const fullScreen`, `// const main`).
- Files: `src/app/page.tsx:324`, `src/app/layout.tsx:6,48-49`
- Impact: Cosmetic; no runtime effect. CLAUDE.md conventions explicitly say to delete dead code rather than comment it out.
- Fix approach: Delete the commented lines and simplify line 324 to `return Object.entries(curObj);`.

**Untranslated UI strings despite 30-language i18n:**
- Issue: The app ships 30 locale dictionaries (`src/lib/translations.ts`, 1353 lines) and a per-string tour fallback, yet all error/loading/fallback UI is hardcoded English.
- Files: `src/app/page.tsx:407` ("Error fetching data. Please try again later."), `src/app/chart/page.tsx:64` ("No data for {q}"), `src/app/error.tsx:18-19`, `src/app/global-error.tsx:21-22` ("Something went wrong"), the entire `src/app/convert/[pair]/page.tsx` (all copy English-only).
- Impact: Non-English users hit English error screens; the `/convert` SEO landing pages are English-only. Inconsistent with the i18n investment and the tour's localization goal.
- Fix approach: Route these strings through `useTranslation()` / the `i18n` object (already used elsewhere in `page.tsx`). Note `error.tsx`/`global-error.tsx` render outside the `LanguageProvider`, so they can only reach the raw `language` `localStorage` key, not the context — a minimal English string may be acceptable there.

## Known Bugs

**Reset does not restore the first-run tour:**
- Symptoms: After clicking Settings → Reset, the onboarding tour does not replay on the next load.
- Files: `src/components/CurrencyListModal.tsx:188-189` (reset omits `tourSeen`), `src/app/page.tsx:289-293` (auto-start gate reads `tourSeen`)
- Trigger: Complete/dismiss the tour once (sets `tourSeen=true`), then Reset.
- Workaround: Manually replay via the "?" button (`page.tsx:444-452`), which is ungated. Or clear site data.

**Drop index can be off-by-one near list edges:**
- Symptoms: Dragging a row to the top/bottom occasionally inserts one position away from the pointer.
- Files: `src/app/page.tsx:365,371` (`itemHeight = 72` vs actual ~68px rows)
- Trigger: Reorder rows in edit mode with the pointer near a row boundary.
- Workaround: `getDropIndex` clamps to a valid range, so no crash — only imprecise placement.

## Security Considerations

**CSP requires `'unsafe-inline'` for scripts and styles:**
- Risk: `script-src` and `style-src` both allow `'unsafe-inline'` (`next.config.mjs:14-15`), which weakens the XSS protection a strict CSP would provide.
- Files: `next.config.mjs`
- Current mitigation: Necessary and documented — Next.js' inline bootstrap and recharts' inline styles require it; `'unsafe-eval'` is correctly dev-only. Other headers are strong (`frame-ancestors 'none'`, `object-src 'none'`, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`). No `dangerouslySetInnerHTML` anywhere in `src/`.
- Recommendations: Migrate to nonce-based `script-src` when the app can adopt Next's nonce support; low priority given no user-generated HTML is rendered.

**Real production analytics ID committed in `.env.example`:**
- Risk: `.env.example` ships a live Microsoft Clarity project id (`NEXT_PUBLIC_CLARITY_ID=p077apilbh`) rather than a placeholder.
- Files: `.env.example`
- Current mitigation: This is a public, client-side analytics id (exposed in the browser anyway via `layout.tsx:73-77`) — not a secret. No credential leak.
- Recommendations: Replace with a placeholder (e.g. `your-clarity-id`) so forks don't inadvertently report into the production Clarity project. No `.env` / secret files are present in the repo (verified).

## Performance Bottlenecks

**Home page fetches three full rate tables on load:**
- Problem: `src/app/page.tsx` fires three SWR requests: all-currency names table (`getCurrencyRateApiUrls({})`, large), latest rates for the base (`page.tsx:115`), and yesterday's rates for the 24h-change column (`page.tsx:125`).
- Files: `src/app/page.tsx:115-125`
- Cause: The all-currencies table is a big JSON payload fetched purely for display names; the yesterday fetch doubles the base-rate traffic.
- Improvement path: Already partly mitigated (`keepPreviousData`, `revalidateOnFocus: false`, `localStorage` last-known-good cache, service-worker stale-while-revalidate). Consider lazy-loading the names table or caching it more aggressively (it changes rarely). Skip the yesterday fetch until the change column is actually visible.

## Fragile Areas

**Touch drag-drop depends on a runtime-injected vendored polyfill:**
- Files: `src/app/page.tsx:56-84` (script injection), `public/vendor/drag-drop-touch.esm.min.js`
- Why fragile: Reordering on touch devices requires `enableDragDropTouch()` from a `<script>` appended to `document.body` at mount. If the file 404s or fails to init, the failure is `console.error`-only (`page.tsx:68,74`) and touch reordering silently degrades with no user feedback.
- Safe modification: Keep the vendored file same-origin (it already is — removes the earlier unpinned-third-party-script/SRI risk). Don't rename it without updating the hardcoded path `page.tsx:61`.
- Test coverage: No unit or e2e coverage of the touch drag-drop path.

**Service worker uses a static cache version:**
- Files: `public/sw.js:6` (`CACHE = 'moneyrate-v1'`)
- Why fragile: Next `_next/static/*` chunks are content-hashed so cache-first is safe, but non-hashed public assets (`country-flags/`, `crypto-icons/`, `vendor/`, `img/`) and the app-shell HTML are cache-first and only purged when the `v1` constant is manually bumped. A deploy that changes a flag/icon or the shell without bumping the version serves stale assets until the next version bump.
- Safe modification: Bump `CACHE` on any change to non-hashed cached assets; the `activate` handler already deletes all non-current caches (`sw.js:15-21`).
- Test coverage: None.

## Scaling Limits

**Not a primary concern — client-only, no backend state.** The only server-executed code is the `/api/currencyChart` route handler and the `/convert/[pair]` ISR pages. `/convert` pre-renders only `POPULAR_PAIRS` via `generateStaticParams` (`src/app/convert/[pair]/page.tsx:28-30`) with hourly `revalidate`; arbitrary pairs render on-demand. No per-user or per-request state to scale.

## Dependencies at Risk

**Yahoo Finance chart API (unofficial, unauthenticated):**
- Risk: `src/app/api/currencyChart/route.ts:30-32` proxies `query1.finance.yahoo.com/v8/finance/chart/*`, an undocumented endpoint with no stability contract, subject to shape changes, rate-limiting, or server-IP blocking.
- Impact: All historical charts (`/chart`) break if Yahoo changes or blocks it. Isolated to the chart feature — the core converter is unaffected.
- Migration plan: The route now degrades gracefully (returns `404` with a user-facing message, wraps fetches in try/catch — `route.ts:36-64`). Host is overridable via `YAHOO_FINANCE_HOST`. If Yahoo becomes unreliable, swap to another OHLC provider behind the same `/api/currencyChart` contract.

**`fawazahmed0/currency-api` (free, community-maintained rate source):**
- Risk: The app's core rate data comes from a community-maintained free API (`currency-api.pages.dev` primary, `cdn.jsdelivr.net` mirror — `src/lib/api.ts:24,42-46`). No SLA.
- Impact: Rate freshness/availability depends on a volunteer project.
- Migration plan: Well-mitigated already — `fetchWithFallback` tries the pages.dev mirror then jsdelivr (`src/lib/api.ts:11-23`), primary host is overridable via `NEXT_PUBLIC_CURRENCY_API_HOST`, and `localStorage` last-known-good caching (`page.tsx:132-135`) plus the service worker keep stale rates working offline. Remember to update `connect-src` in `next.config.mjs` CSP if the host changes.

## Missing Critical Features

**No CI pipeline despite a full test suite:**
- Problem: The project has Vitest unit tests (7 files) and Playwright e2e (`e2e/home.spec.ts`, `e2e/tour.spec.ts`), and `playwright.config.ts` gates `retries`/`forbidOnly` on `process.env.CI` — but there is no `.github/workflows/` (no `.github` directory at all).
- Blocks: Tests only run when a developer remembers to run them locally; regressions (e.g. the reset-atom drift, i18n gaps) aren't caught automatically before merge.
- Fix approach: Add a CI workflow running `npm run lint`, `npm run test:run`, and `npm run test:e2e`.

## Test Coverage Gaps

**Only 3 of 9 components have unit tests:**
- What's not tested: `CurrencyListModal.tsx` (300 lines — includes the settings panel and the reset logic that already carries a drift bug), `CountryImg.tsx`, `DragHandle.tsx`, `ServiceWorkerRegister.tsx`, `ThemeApplier.tsx`, `ThemeToggle.tsx`. Tested: `CurrencyRow`, `InstallButton`, `SearchBar`.
- Files: `src/components/*.tsx`
- Risk: The reset flow, currency add/remove, and theme application can regress unnoticed.
- Priority: Medium (High for `CurrencyListModal` given the known reset bug).

**Main `Home` page logic has no unit tests:**
- What's not tested: `onBaseCurChange` conversion math (`page.tsx:331-346`), `handleDrop` reordering (`page.tsx:356-376`), tour gating/teardown. Only the tour's rendered behavior is exercised via `e2e/tour.spec.ts`.
- Files: `src/app/page.tsx`
- Risk: The app's core conversion arithmetic and its most bug-prone file are e2e-only, so unit-level regressions surface late (or only in a browser).
- Priority: High.

**Pure library and page modules untested:**
- What's not tested: `src/lib/pairs.ts` (`parsePair`, `pairSlug`, `POPULAR_PAIRS` — trivially unit-testable pure functions feeding SEO routes), `src/app/chart/page.tsx`, `src/app/convert/[pair]/page.tsx`, `src/lib/atoms.ts`, `src/lib/constants.ts`, `src/hooks/useTranslation.ts`, `src/contexts/LanguageContext.tsx`.
- Files: as listed above.
- Risk: `parsePair` bugs would silently 404 valid `/convert` pages; a malformed locale in `translations.ts` would break `useTranslation` fallback.
- Priority: Medium.

## Resolved Since Previous Map (do not re-flag)

The following concerns from the earlier (pre-tour) CLAUDE.md / codebase map have been **fixed** in the current tree — verified 2026-07-11:

- **Conflicting lockfiles:** `bun.lockb`, `.pnp.cjs`, `.pnp.loader.mjs`, and `yarn.lock` are gone; only `package-lock.json` remains and `bun.lockb`/PnP artifacts are `.gitignore`d. `package.json` declares npm scripts only.
- **Dead `src/lib/func.ts`:** Deleted (no longer exists).
- **Unused `getCurrencyChartApiUrl` (mtfxgroup):** Removed. `src/lib/api.ts` now exposes `getCurrencyRateApiUrls` with a documented primary→jsdelivr fallback.
- **Chart route returned 200 on bad input / no try-catch:** Fixed — `src/app/api/currencyChart/route.ts` validates `q` with a regex, returns `400`/`404` with messages, wraps upstream fetches in try/catch (`route.ts:36-44`), and sends cache headers.
- **SWR fetcher swallowed non-2xx:** Fixed — `fetcher` now throws on non-`ok` so SWR populates `error` (`src/lib/api.ts:1-8`).
- **Commented-out "AI Stock Banner" JSX in `page.tsx`:** Removed.
- **No error boundary:** Added `src/app/error.tsx` and `src/app/global-error.tsx`.
- **No tests:** Vitest + Playwright suites now exist (7 unit test files, 2 e2e specs).
- **New driver.js tour code (`src/lib/tourSteps.ts`, `src/theme/tour.css`):** Reviewed — no concerns. Well-documented, per-string i18n fallback avoids whole-object drop, selectors anchor on `data-tour` (not translated labels) per CLAUDE.md, a11y handled (focus-visible rings, 44px touch targets, `prefers-reduced-motion`, RTL scoped to the popover only).

---

*Concerns audit: 2026-07-11*
