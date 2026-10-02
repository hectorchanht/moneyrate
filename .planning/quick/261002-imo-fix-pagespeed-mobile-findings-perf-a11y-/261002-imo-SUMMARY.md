---
phase: quick-261002-imo
plan: 01
status: complete
completed: 2026-10-02
commits: [b418f31, f5329a8, e64c397]
---

# Quick 261002-imo: PageSpeed mobile fixes Summary

Fixed the PSI mobile a11y, console-error, perf and security-header findings with edits to existing files only: no new deps, no new strings, no dictionary changes.

## Commits
- b418f31 fix: a11y labels (select htmlFor/id), theme-aware 24h-change contrast, strip aria attrs from `#driver-dummy-element` via `onHighlighted`, delete the dead drag-drop-touch `onload` handler and its global types
- f5329a8 perf: header always renders (skeleton now replaces only the row list), `export CURRENCY_API_HOST` + `<link rel=preconnect crossorigin>` to `latest.` host, `animation:none` on checked checkbox, `transition:none` on driver close button
- e64c397 feat: HSTS (`max-age=63072000; includeSubDomains; preload`), COOP `same-origin`, CSP allows `static.cloudflareinsights.com` (script-src) and `cloudflareinsights.com` (connect-src)

## Verification (actually run)
- `npm run lint`: no warnings or errors
- `npx vitest run`: 81/81 pass with `TZ=UTC`; with the local timezone 80/81 (see below)
- `npx next build`: succeeds
- `next start` probes: HTML has `<link rel="preconnect" href="https://latest.currency-api.pages.dev" crossorigin="anonymous"/>` and one `placeholder=` (header in server HTML); `curl -I` shows HSTS, COOP and the updated CSP
- Playwright `e2e/tour.spec.ts` + `e2e/home.spec.ts`: 13 pass, 1 fail (pre-existing, see below)
- Not verified: Lighthouse re-run, real-browser contrast measurement, live tour with `onHighlighted` (covered only indirectly by the passing tour e2e specs), CF beacon actually loading in production

## Deviations from Plan
None to the code. Two pre-existing failures found, left alone (logged in deferred-items.md):
- `src/app/api/currencyChart/route.test.ts` "maps fiat data" is timezone-dependent (expects 01/01/1970, gets 31/12/1969 in a negative-offset TZ); passes with `TZ=UTC`.
- `e2e/home.spec.ts` "toggles between light and dark themes" fails on base commit 9a4be05 as well: `seed()` doesn't set `tourSeen`, so the tour overlay intercepts the click.

## Deferred
- Render-blocking/unused CSS (15.8 KiB, 10.7 KiB unused): Next 14 `experimental.optimizeCss` needs `critters` (new dep).
- Legacy JS 11.9 KiB: Next 14 polyfill-module is always bundled; revisit with Next 15.
- Dated `{date}.currency-api.pages.dev` preconnect: host changes daily, layout is static.
- Nonce CSP and Trusted Types: incompatible with static rendering, Clarity and driver.js innerHTML.
- Contrast under the driver overlay: Lighthouse artifact of the active tour, not a real defect.

## Manual user actions
- Submit the domain at hstspreload.org.
- If Cloudflare edge HSTS is enabled in the dashboard, set it to match (`max-age` 2y, include subdomains, preload); it takes precedence over the app header.

## Self-Check: PASSED
Commits b418f31, f5329a8, e64c397 exist on master; modified files verified via build and probes above.
