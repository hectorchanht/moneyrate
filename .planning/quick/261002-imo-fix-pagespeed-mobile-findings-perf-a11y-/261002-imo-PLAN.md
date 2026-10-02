---
phase: quick-261002-imo
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/CurrencyListModal.tsx
  - src/components/CurrencyRow.tsx
  - src/app/page.tsx
  - src/app/layout.tsx
  - src/lib/api.ts
  - src/theme/globals.css
  - src/theme/tour.css
  - next.config.mjs
autonomous: true
requirements: [PSI-A11Y, PSI-BP-CONSOLE, PSI-PERF, PSI-SEC-HEADERS]

must_haves:
  truths:
    - "Both settings <select>s (language and sort) have an accessible name taken from their existing visible label"
    - "24h-change text (▲/▼ %) meets 4.5:1 contrast on both the dark and light DaisyUI themes"
    - "driver.js #driver-dummy-element carries no aria-haspopup/aria-expanded/aria-controls while a tour step is shown"
    - "Loading the home page logs no 'enableDragDropTouch is not available' console.error, and touch drag-and-drop still works (the ?autoload module initializes itself)"
    - "The header row (settings/share/tour/theme buttons + search input with placeholder) renders in the loading state, so it is present in the server HTML before rate data arrives"
    - "HTML <head> preconnects to https://latest.<CURRENCY_API_HOST> with crossorigin"
    - "Production responses carry HSTS (includeSubDomains; preload), COOP same-origin, and a CSP that allows the Cloudflare Web Analytics beacon"
    - "Onboarding tour still starts, highlights all steps, and is dismissible (lint + vitest + build green)"
  artifacts:
    - path: "src/components/CurrencyListModal.tsx"
      provides: "label htmlFor/id wiring for language + sort selects"
      contains: "htmlFor"
    - path: "src/app/page.tsx"
      provides: "onHighlighted dummy-aria cleanup, simplified drag-drop loader, header-in-skeleton render"
      contains: "onHighlighted"
    - path: "src/app/layout.tsx"
      provides: "preconnect link to latest currency-api host"
      contains: "preconnect"
    - path: "next.config.mjs"
      provides: "HSTS, COOP, CF-insights CSP entries"
      contains: "Strict-Transport-Security"
  key_links:
    - from: "src/app/layout.tsx"
      to: "src/lib/api.ts CURRENCY_API_HOST"
      via: "named export import"
      pattern: "CURRENCY_API_HOST"
    - from: "next.config.mjs securityHeaders"
      to: "headers() for /:path*"
      via: "existing headers() return"
      pattern: "Cross-Origin-Opener-Policy"
---

<objective>
Fix the PageSpeed Insights mobile findings for https://moneyrate.lol across accessibility, console errors, performance, and security headers, with the smallest diffs, no new dependencies, and no regressions to the driver.js onboarding tour or i18n.

Purpose: raise A11y (87), Best Practices (92) and Perf (82, LCP 4.1s) scores. Every fix below targets a specific failing element from the findings file.
Output: edits to 8 existing files. No new files, strings, or packages.
</objective>

<execution_context>
@/Users/laichan/.claude/plugins/cache/gsd-plugin/gsd/4.5.3/workflows/execute-plan.md
@/Users/laichan/.claude/plugins/cache/gsd-plugin/gsd/4.5.3/templates/summary.md
</execution_context>

<context>
@.planning/quick/261002-imo-fix-pagespeed-mobile-findings-perf-a11y-/261002-imo-PSI-FINDINGS.md
@./CLAUDE.md (partly stale: vitest suite exists, 81 tests; e2e via Playwright in e2e/)

Locations already confirmed during planning (no exploration needed):
- Security headers/CSP: `next.config.mjs` only (`csp` array, `securityHeaders` array, `headers()` for `/:path*`). No middleware, no `public/_headers`, no vercel.json. HSTS is not set in code today, so the HSTS PSI saw comes from the host/edge (Cloudflare proxy, which also auto-injects the CF Web Analytics beacon).
- drag-drop-touch loader: `src/app/page.tsx` `useDragDropTouch` (~lines 44-85) plus the `declare global { interface DragDropTouch; interface Window { DragDropTouch?; enableDragDropTouch? } }` block. It loads `/vendor/drag-drop-touch.esm.min.js?autoload` as `type="module"`. The vendored module ends with `import.meta.url.includes("?autoload") ? p(document,document,{forceListen:!0}) : globalThis.DragDropTouch={...}; export {p as enableDragDropTouch};`. With `?autoload` it initializes itself and never sets `window.enableDragDropTouch` (that is an ESM export, not a global) or `window.DragDropTouch`. So the `onload` check always hits `console.error`, and `window.DragDropTouch?.enable()` is always a no-op.
- driver.js init: `src/app/page.tsx` ~line 224, `driver({ ..., onPopoverRender, onDoneClick, onCloseClick, onDestroyed })`. driver.js 1.6 `transferHighlight` sets `aria-haspopup="dialog"`, `aria-expanded="true"` and `aria-controls="driver-popover-content"` on the highlighted element, including the role-less `#driver-dummy-element` it creates for element-less steps. It sets them synchronously, and when `animate` is false (reduced motion) that happens AFTER the popover renders, so `onPopoverRender` is too early. The `onHighlighted` hook always fires later, inside the rAF transition callback. driver passes `undefined` as the element for dummy steps, so look the node up by id.
- Settings selects: `src/components/CurrencyListModal.tsx` ~lines 143-176. Language select is preceded by `<label className="label"><span className="label-text">{t.settings.changeLanguage}</span></label>`. Sort select is preceded by the same pattern with the hardcoded text `Sort by`, which is pre-existing English with no translation key. Checkboxes with `className="checkbox"` are at ~lines 89-113.
- 24h change: `src/components/CurrencyRow.tsx` ~line 113, `text-[10px] leading-none ${changePct >= 0 ? 'text-green-500' : 'text-red-500'}`. Themes: DaisyUI `["light","dark"]`, switched via `<html data-theme>` (ThemeApplier). There is no Tailwind `dark:` config.
- Loading state: `src/app/page.tsx` ~line 408 `if (isLoad1 && !effectiveAll) return <div ...>` with a 51px skeleton header plus 12 skeleton rows. The real header `<span className='flex gap-2 w-full items-start'>` (CurrencyListModal, share button, tour replay button, ThemeToggle, SearchBar) only exists in the main return (~lines 428-455). All of it already tolerates `effectiveAll` being undefined (`data={effectiveAll ?? {}}`).
- Rate host: `src/lib/api.ts` line 25, `const CURRENCY_API_HOST = process.env.NEXT_PUBLIC_CURRENCY_API_HOST || 'currency-api.pages.dev';` (not exported). The latest URL is `https://latest.${CURRENCY_API_HOST}/...`, fetched with plain CORS `fetch` (no credentials).
- `src/app/layout.tsx` has a `<head>` with favicon/manifest links. Global CSS order: globals.css, driver.css, tour.css.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Accessibility + console-error fixes (selects, contrast, driver dummy aria, drag-drop-touch)</name>
  <files>src/components/CurrencyListModal.tsx, src/components/CurrencyRow.tsx, src/app/page.tsx</files>
  <action>
1. select-name (CurrencyListModal.tsx): wire the existing visible labels to the selects instead of adding new strings. Add `htmlFor="settings-language"` to the label above the language select and `id="settings-language"` to that select. Do the same with `settings-sort` for the sort select. This reuses `t.settings.changeLanguage` and the existing "Sort by" text, so no translation keys are added and none of the 30 dictionaries change. Do not add an English-only aria-label.

2. color-contrast (CurrencyRow.tsx line ~113): replace the green-500/red-500 ternary with theme-aware classes through Tailwind arbitrary variants on DaisyUI's data-theme. Up: `text-green-700 [[data-theme=dark]_&]:text-green-500`. Down: `text-red-600 [[data-theme=dark]_&]:text-red-400`. Computed contrast at 10px (needs 4.5:1): on dark b1 (~#1d232a), red-400 is ~5.8 and green-500 is ~6.9. On white, red-600 is ~4.8 and green-700 is ~5.0. The current red-500 on dark is ~4.2, which is the failing case. Leave the arrow/percent markup as it is.

3. aria-allowed-attr (page.tsx driver({...}) config): add a global `onHighlighted` hook next to the existing `onPopoverRender`. In it, look up `document.getElementById('driver-dummy-element')` and, if found, remove `aria-haspopup`, `aria-expanded` and `aria-controls`. Real highlighted elements keep driver's attributes, and driver removes them itself on step change and destroy. Add a one-line comment explaining why onPopoverRender is too early (with animate:false, driver sets the attributes after the popover renders). Do not touch onDoneClick/onCloseClick/onDestroyed or the focus-restoration design notes.

4. Console error (page.tsx useDragDropTouch): the `?autoload` module initializes itself (see context), so delete the whole `script.onload` handler, including its console.log, console.error and `window.DragDropTouch?.enable()`. Keep `script.onerror`, `showASCIIArt()` and the cleanup. Delete the now-unused `declare global` block (DragDropTouch interface plus the Window augmentation) after grepping `src/` to confirm nothing else references `enableDragDropTouch` or `window.DragDropTouch`. Keep the vendored module and the `?autoload` query unchanged.
  </action>
  <verify>
    <automated>cd /Users/laichan/code/tung/moneyrate && npm run lint && npx vitest run && grep -c 'htmlFor="settings-' src/components/CurrencyListModal.tsx && ! grep -n "enableDragDropTouch is not available" src/app/page.tsx && grep -n "onHighlighted" src/app/page.tsx && ! grep -n "text-red-500" src/components/CurrencyRow.tsx</automated>
  </verify>
  <done>Both selects are labelled through htmlFor/id (grep count 2). The CurrencyRow change classes are theme-aware and the red-500 class is gone. The onHighlighted hook strips the three aria attributes from #driver-dummy-element. The drag-drop onload handler and its unused global types are gone. Lint and all vitest tests pass.</done>
</task>

<task type="auto">
  <name>Task 2: Performance (header renders during loading for LCP, preconnect, composited animations)</name>
  <files>src/app/page.tsx, src/app/layout.tsx, src/lib/api.ts, src/theme/globals.css, src/theme/tour.css</files>
  <action>
1. LCP render delay (page.tsx): the LCP element is the search input placeholder, and it only appears once rate data loads because the `isLoad1 && !effectiveAll` early return replaces the whole page with skeletons. Delete that early return. In its place, compute `const showSkeleton = isLoad1 && !effectiveAll;`. In the main return, keep the header span exactly as it is (it is always rendered, so its React position never changes and SearchBar state and focus survive data arrival). Replace only the list region (the `shouldVirtualize ? FixedSizeList : #currencyList` ternary) with the existing 12 skeleton rows when `showSkeleton` is true. Move the same row markup unchanged and drop the old 51px header skeleton plus its `<br />`. Leave the `(err1 || err2) && !effectiveBaseCur` error early return as it is. The tour auto-start is already gated on `effectiveAll`, so it still waits for real rows.

2. Preconnect (api.ts + layout.tsx): change `const CURRENCY_API_HOST` to `export const CURRENCY_API_HOST` (named export, matching lib conventions). In layout.tsx `<head>`, import it and add `<link rel="preconnect" href={`https://latest.${CURRENCY_API_HOST}`} crossOrigin="anonymous" />`. crossOrigin is required because the request is a CORS fetch, so a preconnect without it would be wasted. Skip the dated `{yesterday}.` host: its name changes daily, layout is statically rendered (the date would go stale), and its fetch starts in the same tick as the latest one once JS runs.

3. Non-composited animations (CSS only): in globals.css add a rule that sets `animation: none` on `.checkbox:checked, .checkbox[aria-checked="true"]`. This removes DaisyUI's `checkmark` background-position keyframe; the checked state still renders, it just stops animating. In tour.css add `.driver-popover-close-btn { transition: none; }`. Both files load after the DaisyUI/driver CSS, so these overrides win.
  </action>
  <verify>
    <automated>cd /Users/laichan/code/tung/moneyrate && npm run lint && npx vitest run && npx next build && { npx next start -p 3123 >/dev/null 2>&1 & PID=$!; } && sleep 6 && curl -s http://localhost:3123/ | grep -o 'rel="preconnect"[^>]*currency-api[^>]*' && curl -s http://localhost:3123/ | grep -c 'placeholder=' ; kill $PID 2>/dev/null</automated>
  </verify>
  <done>The build succeeds. The server HTML contains a preconnect link to latest.currency-api.pages.dev and an input with a placeholder (the header renders before data). The skeleton now only replaces the row list. The checkbox and close-button animation overrides are in place. Lint and vitest pass.</done>
</task>

<task type="auto">
  <name>Task 3: Security headers (CF beacon CSP, HSTS, COOP) in next.config.mjs</name>
  <files>next.config.mjs</files>
  <action>
1. CSP console error: append `https://static.cloudflareinsights.com` to `script-src` and `https://cloudflareinsights.com` to `connect-src`. Cloudflare's proxy injects the beacon, and in-code allowlisting is cheaper than a dashboard change. Add `static.cloudflareinsights.com` to the existing CSP comment block so future readers know why it is there.

2. Add to `securityHeaders`: `{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }` and `{ key: 'Cross-Origin-Opener-Policy', value: 'same-origin' }`. COOP same-origin is safe: the app opens no cross-origin popups and uses no window.opener or OAuth. Add a one-line comment noting that Cloudflare edge HSTS, if enabled in the dashboard, takes precedence and must be set to match, and that submitting to hstspreload.org is a manual follow-up.

3. Do NOT implement nonce CSP or Trusted Types (deferred, see output). A nonce needs middleware plus per-request dynamic rendering of every page, which cancels the static optimization of this client-only app. Next's inline bootstrap scripts change per build, so hashes are not viable either. Trusted Types would break Clarity's injected script and driver.js's innerHTML popover rendering.
  </action>
  <verify>
    <automated>cd /Users/laichan/code/tung/moneyrate && npx next build && { npx next start -p 3124 >/dev/null 2>&1 & PID=$!; } && sleep 6 && curl -sI http://localhost:3124/ | grep -iE 'strict-transport-security: max-age=63072000; includeSubDomains; preload|cross-origin-opener-policy: same-origin|content-security-policy:.*static\.cloudflareinsights\.com.*connect-src[^;]*cloudflareinsights\.com' ; kill $PID 2>/dev/null</automated>
  </verify>
  <done>`curl -I` against `next start` shows all three: HSTS with includeSubDomains and preload, COOP same-origin, and a CSP whose script-src includes static.cloudflareinsights.com and whose connect-src includes cloudflareinsights.com. The build succeeds.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| browser -> third-party scripts | Clarity and the Cloudflare beacon run with page privileges under the CSP allowlist |
| browser -> currency-api hosts | Rate JSON fetched cross-origin via connect-src |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-261002-01 | Tampering | next.config.mjs script-src | accept | Allowing static.cloudflareinsights.com widens script-src by one Cloudflare-owned host that already proxies the site, so any compromise there already owns the response |
| T-261002-02 | Spoofing | Transport | mitigate | HSTS max-age=2y with includeSubDomains and preload, per Task 3 |
| T-261002-03 | Info disclosure | Cross-window | mitigate | COOP same-origin isolates the browsing context group, per Task 3 |
| T-261002-04 | Tampering | script-src 'unsafe-inline' | accept (deferred) | Nonce/hash CSP is incompatible with static rendering and per-build inline bootstrap. Revisit if the app moves to dynamic rendering |
| T-261002-SC | Tampering | package installs | n/a | No packages added |
</threat_model>

<verification>
- `npm run lint`, `npx vitest run` (81+ tests), and `npx next build` are all green.
- The headers and the preconnect/placeholder probes in Task 2 and Task 3 pass against `next start`.
- Optional, if feasible: `npx playwright test e2e/tour.spec.ts` stays green, confirming the tour is not regressed by the onHighlighted hook or the loading-render change.
- Optional, if feasible: `npx lighthouse http://localhost:3123 --form-factor=mobile --only-categories=accessibility,best-practices --quiet --chrome-flags=--headless` shows no select-name, aria-allowed-attr or console-error audits failing. Run it with the tour seen (`localStorage.tourSeen=true`) to avoid overlay-induced contrast noise.
</verification>

<success_criteria>
- Accessibility: select-name and color-contrast (24h change) are resolved in both themes, and the driver dummy element has no disallowed aria attributes.
- Console: no drag-drop-touch error, and the CF beacon is not blocked by CSP.
- Performance: the header and search placeholder are in the server HTML (LCP no longer waits on rate data), latest-host preconnect is present, and the two non-composited animations are removed.
- Headers: HSTS (includeSubDomains; preload) and COOP same-origin are present, and the existing CSP and other headers are intact.
- The tour still works, and no translation dictionaries changed.
</success_criteria>

<output>
Create `.planning/quick/261002-imo-fix-pagespeed-mobile-findings-perf-a11y-/261002-imo-SUMMARY.md` when done. List these as deferred:
- Render-blocking and unused CSS (15.8 KiB, 10.7 KiB unused): Next 14 `experimental.optimizeCss` needs the `critters` dependency, and no new deps are allowed.
- Legacy JS 11.9 KiB: Next 14's built-in polyfill-module is always bundled, and browserslist does not remove it. Revisit with a Next 15 upgrade.
- Dated `{date}.currency-api.pages.dev` preconnect: the host changes daily and the layout is static.
- Nonce CSP and Trusted Types: incompatible with static rendering, Clarity, and driver.js innerHTML.
- Contrast under the driver overlay: Lighthouse artifact of the active tour, not a real defect.
- Manual follow-ups: hstspreload.org submission, and making Cloudflare edge HSTS match if it is enabled.
</output>
