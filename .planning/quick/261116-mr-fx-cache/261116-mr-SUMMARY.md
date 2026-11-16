---
phase: quick-261116-mr
plan: 01
subsystem: api
tags: [frankfurter, caching, data-cache, performance, convert]
---

# Quick 261116-MR Summary — /api/convert provider-side rate cache

## Root cause

The route fetched Frankfurter's per-pair endpoint on every request
(`revalidate: 3600` per pair URL), so a conversion paid an upstream round
trip whenever the CDN/Data Cache was cold for that pair — for data that is
a **daily fixing**. Local per-request work (tier check, rate limit) is
negligible. Measured baseline from the VM: MoneyRate 0.8–1.9s vs
Frankfurter direct 0.7–1.05s for identical rates.

## Shipped (commit e9b5309)

- `src/lib/fxRates.ts` — full Frankfurter v2 USD-base table (~200 quotes)
  held in the Next Data Cache (`revalidate 3600`, tag `fx-rates`); pairs
  resolved in-process. USD pairs verbatim; inverses/crosses rounded to
  Frankfurter's 5-significant-figure precision (verified against the live
  per-pair endpoint: EUR/THB 37.461, EUR/USD 1.1054 — exact matches).
- Rollover: hourly revalidation bounds stale-fixing serving to ≤1h after a
  new fixing lands, and `rateDate` always reports the payload's own
  per-quote date (stalest leg for crosses) — never relabelled.
- Fallbacks unchanged: table miss → per-pair endpoint → currency-api
  mirrors (long-tail codes still resolve; unknown pairs still 404).
- Success response gains `s-maxage=3600` (browser `max-age` unchanged) —
  Vercel consumes it as the CDN TTL and serves repeats at the edge.
  Response body shape byte-identical (same keys, order, values).

## Verification

- Tests 136/136 (baseline 126 + 9 fxRates unit + 1 route table-path),
  `tsc --noEmit` clean, `next build` green.
- Vercel deployment for e9b5309: "Deployment has completed".
- Live benchmark from the VM (medians of 3, seconds; VM egress proxy adds
  a ~0.55s floor to every request, incl. static files):

  | Pair | MoneyRate warm (CDN) | MoneyRate function (CDN miss) | Frankfurter direct |
  |---|---|---|---|
  | USD/CAD | 0.80 | 0.88 | 1.08 |
  | USD/EUR | 0.84 | 0.76 | 1.04 |
  | USD/JPY | 0.69 | 0.76 | 0.99 |

  Warm MoneyRate beats going direct on every pair, and the Frankfurter
  tail (worst direct call 2.71s) disappears — worst MoneyRate call 0.98s.
