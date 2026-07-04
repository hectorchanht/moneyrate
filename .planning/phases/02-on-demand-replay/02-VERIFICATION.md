---
phase: 02-on-demand-replay
verified: 2026-07-04
status: passed
requirements: [TOUR-03]
score: 3/3 success criteria verified live + all plan guards pass
live_browser_verification:
  performed: 2026-07-04
  result: passed
  server: next dev (fresh .next after executor's build clobbered it)
  confirmed:
    - "Criterion 1: with tourSeen='true', loading / does NOT auto-start the tour, but the persistent '?' (aria-label=\"Replay tour\") button IS visible in the top action row"
    - "Criterion 2: clicking '?' launches the identical tour from step 1 — welcome card 'Welcome to moneyrate', then Next -> 'Set your base currency' with progress '1 / 8' spotlighting [data-tour=\"tour-base-row\"]"
    - "Criterion 3: replaying never writes tourSeen — it stays 'true' before/during/after a replay; after dismissing the replay and reloading, the tour does NOT auto-start (TOUR-02 preserved)"
    - "D-04 no overlay stacking: rapid re-clicks of '?' while the tour is open leave exactly ONE .driver-popover (startTour() self-destroys the prior instance first)"
    - "Dismiss (close button) removes the overlay immediately and body.driver-active clears"
  screenshot: "top action row shows the new '?' icon between the share and theme controls"
static_guards:
  - "grep -c 'const startTour' == 1 and grep -c 'driver({' == 1 (single reusable launcher, no duplicated config — D-04)"
  - "grep -c 'setTourSeen(true)' == 3 (only the 3 driver callbacks; the replay path never writes the seen flag — D-03)"
  - "grep -c 'useEffect(() => () =>' == 1 and the auto-start effect returns no cleanup (the commit-a818626 dep-change-teardown bug is NOT reintroduced)"
  - "QuestionSvg added to svgs.tsx (1) and QuestionMarkSvg preserved (1); QuestionSvg imported + rendered in page.tsx"
  - "npm run build succeeds; npx vitest run -> 64/64 pass; only src/lib/svgs.tsx and src/app/page.tsx changed (translations.ts untouched)"
notes: "Executor completed + committed both tasks (6ee2ec1, 297fa1c) then hit an API certificate error during wrap-up; SUMMARY.md + tracking + this verification were finalized by the orchestrator and re-checked against the committed code + a live browser session."
---

# Phase 2: On-Demand Replay — Verification Report

**Phase Goal:** A visitor who already dismissed or completed the tour (or wants a refresher) can relaunch the identical guided walkthrough at any time.

## Result: PASSED

All 3 ROADMAP success criteria for Phase 2 were confirmed in a live `next dev` browser session, and all plan-level regression guards pass against the committed code.

| Success Criterion | Status | Evidence |
|-------------------|--------|----------|
| 1. Persistent "?" control visible regardless of seen state | ✓ | `button[aria-label="Replay tour"]` present with `tourSeen='true'`; no auto-start |
| 2. "?" launches the same 8-step tour from step 1 | ✓ | welcome card → Next → "Set your base currency" 1/8, `tour-base-row` spotlit |
| 3. Replay doesn't reset/corrupt the seen-flag | ✓ | `tourSeen` stays `'true'`; reload after replay → no auto-start |

## Regression protection

The Phase-1 teardown defect (commit `a818626`) is explicitly guarded: the auto-start effect returns no cleanup and there is exactly one mount-only `useEffect(() => () => …, [])`. Rapid "?" re-clicks never stack overlays because `startTour()` destroys the prior driver instance first.

## Requirement

- **TOUR-03** — Complete ✓
