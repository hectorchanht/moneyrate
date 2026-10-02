# PSI mobile findings: moneyrate.lol (captured 2026-10-02, Lighthouse 13.5, Moto G Power, Slow 4G)

Scores: Perf 82 · A11y 87 · Best Practices 92 · SEO 100
Metrics: FCP 2.0s · LCP 4.1s · TBT 0ms · CLS 0 · SI 4.9s

Note: the onboarding tour (driver.js) was **active** during the Lighthouse run (`body.driver-active`). Several findings come from the tour overlay.

## Performance
- **LCP breakdown:** TTFB 0ms, **element render delay 2,340ms**. LCP element is the input placeholder text ("fiat 💸 (usd) | crypto 📈 (btc)"), so the page doesn't render until JS hydrates or the rate data arrives.
- **Render-blocking:** `/_next/static/css/4c1a110d870c7225.css` (15.8 KiB, 310ms). Critical path 502ms.
- **Preconnect candidates** (est 300ms LCP each, none preconnected now): `https://latest.currency-api.pages.dev`, `https://{date}.currency-api.pages.dev` (dated host; date changes daily).
- **Legacy JS 11.9 KiB** in `chunks/117-*.js`: polyfills for Array.prototype.at/flat/flatMap, Object.fromEntries, Object.hasOwn, String.prototype.trimStart/trimEnd (Next 14 default polyfills; browserslist may help).
- **Unused CSS:** 10.7 KiB of 14.3 KiB.
- **Non-composited animations:**
  - `input.checkbox` (settings form-control) uses DaisyUI `checkmark` animation on `background-position-y`
  - driver.js `.driver-popover-close-btn` transitions `color`

## Accessibility
- **aria-allowed-attr:** `div#driver-dummy-element` (driver.js) has `aria-haspopup="dialog" aria-expanded="true" aria-controls="driver-popover-content"` on a role-less div.
- **select-name:** two `<select class="select select-bordered w-full mt-2">` with no label: the language picker and the sort picker ("Custom (drag order) / Name (A–Z) / Value / 24h change").
- **color-contrast:** `div.text-[10px] leading-none text-red-500` (24h change, e.g. "▼ 2.78%") fails on the dark background (and under the driver overlay).

## Best Practices
- **Console errors:**
  1. `enableDragDropTouch is not available on window.` from chunks/117 (code logs console.error when the drag-drop-touch polyfill isn't loaded).
  2. CSP blocks `https://static.cloudflareinsights.com/beacon.min.js/...` (Cloudflare Web Analytics is auto-injected). Current CSP: `script-src 'self' 'unsafe-inline' https://www.clarity.ms https://*.clarity.ms`. Either allow `static.cloudflareinsights.com` (+ connect-src `cloudflareinsights.com`) or disable CF Web Analytics injection.
- **Security headers (unscored):**
  - CSP: `'unsafe-inline'` + host allowlist in script-src (High). Nonce-based CSP needs dynamic rendering, which conflicts with static/client-only hosting, so evaluate it and don't force it.
  - HSTS: missing `includeSubDomains` and `preload`.
  - COOP: no header. Add `Cross-Origin-Opener-Policy: same-origin`.
  - Trusted Types: none (High). Likely out of scope given third-party scripts.
