---
phase: 01-guided-first-run-tour
plan: 01
subsystem: ui
tags: [driver.js, jotai, i18n, tour, oklch, daisyui]

# Dependency graph
requires: []
provides:
  - "driver.js pinned as explicit dependency (^1.6.0)"
  - "tourSeenAtom (atomWithStorage<boolean>, key 'tourSeen', default false)"
  - "resolveTourLocale pure fn (src/lib/fns.ts) for device-language resolution"
  - "buildTourSteps(locale) + TOUR_STEP_COUNT + SUPPORTED_LOCALES + copy constants (src/lib/tourSteps.ts)"
  - "src/theme/tour.css DaisyUI-token popover theme, wired into layout.tsx"
affects: [01-02-anchors, 01-03-wiring]

# Tech tracking
tech-stack:
  added: [driver.js@^1.6.0]
  patterns:
    - "Pure, unit-tested locale-resolution fn using native Intl.Locale (no navigator read inside the fn)"
    - "driver.js class-selector CSS overrides using oklch(var(--daisyui-token)) instead of relying on driver.js CSS vars"
    - "Config/data module (tourSteps.ts) with named exports only, no default export"

key-files:
  created:
    - src/lib/tourSteps.ts
    - src/lib/tourSteps.test.ts
    - src/theme/tour.css
  modified:
    - package.json
    - package-lock.json
    - src/lib/atoms.ts
    - src/lib/fns.ts
    - src/lib/fns.test.ts
    - src/app/layout.tsx

key-decisions:
  - "resolveTourLocale takes navLangs as a parameter (never reads navigator itself) so it stays pure and unit-testable; the client-only navigator.languages read is deferred to Plan 03's call site"
  - "Welcome step's progressText/progress is fully suppressed (showProgress: false) and each of the 8 feature steps gets an explicit '{n} / 8' progressText, avoiding driver.js's built-in {{current}}/{{total}} which would count 9 steps including the welcome card"
  - "tour.css overrides driver.js's actual verified class names (.driver-popover-next-btn, .driver-popover-prev-btn, .driver-popover-done-btn, .driver-popover-footer-btn) confirmed against the installed driver.js 1.6.0 source/CSS, not assumed from docs alone"

requirements-completed: [TOUR-02, TOUR-06]

# Metrics
duration: 12min
completed: 2026-07-04
---

# Phase 1 Plan 1: Tour Contract Layer Summary

**driver.js pinned + persisted tourSeenAtom + tested resolveTourLocale + 9-step buildTourSteps config + DaisyUI-token popover CSS, all wired but producing zero visible behavior yet**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-04T03:05:00Z
- **Completed:** 2026-07-04T03:17:13Z
- **Tasks:** 3 completed
- **Files modified:** 8 (3 created, 5 modified, plus package-lock.json)

## Accomplishments
- `driver.js@^1.6.0` pinned as an explicit dependency in `package.json` (alphabetically between `daisyui` and `jotai`)
- `tourSeenAtom` added to `src/lib/atoms.ts` following the existing `atomWithStorage<boolean>` pattern, persists under localStorage key `tourSeen`
- `resolveTourLocale` added to `src/lib/fns.ts` — a pure, parameter-driven device-language resolver (exact match → `Intl.Locale` base-language fallback → `en`), covered by 4 new unit tests
- `src/lib/tourSteps.ts` created: `buildTourSteps(locale)` returns a centered welcome card (no `element`) plus the 8 anchored feature steps in exact UI-SPEC order/copy, each carrying a correct `"{n} / 8"` `progressText`; `TOUR_STEP_COUNT`, `SUPPORTED_LOCALES` (drift-free from `translations.ts`), `TOUR_INSTALL_FALLBACK_DESCRIPTION`, and `TOUR_DONE_BTN_TEXT` all exported; covered by 8 new unit tests
- `src/theme/tour.css` created: DaisyUI OKLCH-token overrides for driver.js's documented class selectors (verified against the installed package's actual CSS/JS output, not just docs), wired into `src/app/layout.tsx` after `globals.css` and `driver.js/dist/driver.css`

## Task Commits

Each task was committed atomically:

1. **Task 1: Pin driver.js, add tourSeenAtom, add resolveTourLocale with unit tests** - `2cfa699` (feat)
2. **Task 2: Author tourSteps.ts (welcome + 8 anchored steps) with unit test and progress-count correctness** - `722de40` (feat)
3. **Task 3: Create tour.css (DaisyUI-token popover theme) and wire CSS imports into layout.tsx** - `d300691` (feat)

**Plan metadata:** committed alongside this SUMMARY (see final commit below)

## Files Created/Modified
- `package.json` / `package-lock.json` - `driver.js: ^1.6.0` added to `dependencies`
- `src/lib/atoms.ts` - added `tourSeenAtom = atomWithStorage<boolean>('tourSeen', false)`
- `src/lib/fns.ts` - added `resolveTourLocale(navLangs, supported, fallback)` pure fn
- `src/lib/fns.test.ts` - added 4 `resolveTourLocale` test cases
- `src/lib/tourSteps.ts` - new: `buildTourSteps`, `TOUR_STEP_COUNT`, `SUPPORTED_LOCALES`, `TOUR_INSTALL_FALLBACK_DESCRIPTION`, `TOUR_DONE_BTN_TEXT`
- `src/lib/tourSteps.test.ts` - new: 8 tests covering step count, welcome-step shape, selector order, progress-text correctness
- `src/theme/tour.css` - new: DaisyUI-token driver.js class overrides
- `src/app/layout.tsx` - added static imports for `driver.js/dist/driver.css` and `@/theme/tour.css`

## Decisions Made
- Confirmed driver.js's real button/arrow class names (`.driver-popover-next-btn`, `.driver-popover-prev-btn`, `.driver-popover-done-btn`, `.driver-popover-footer-btn`, `.driver-popover-arrow-side-*`) by grepping the installed `node_modules/driver.js/dist/driver.js.mjs` and `driver.css` directly, rather than trusting the docs/PATTERNS.md excerpt alone — this caught that the generic `.driver-popover-footer button` selector used in the pattern excerpt wouldn't reliably override driven-added inline classes as cleanly as targeting the specific `-next-btn`/`-prev-btn`/`-done-btn` classes.
- `buildTourSteps` accepts `locale: Language` and threads it through (assigned to a no-op `void locale;`) without branching on it yet, per D-05's Phase 1 scope note (English only; Phase 3/I18N-01 wires actual localized copy).

## Deviations from Plan

None - plan executed exactly as written. The only refinement beyond the plan's literal code excerpts was verifying driver.js's actual CSS class names against the installed package source (see Decisions Made) before finalizing `tour.css` — this is a verification step within Task 3's own read_first/action scope, not a new deviation category.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 02 (anchors) can now add `data-tour="..."` attributes to `CurrencyRow.tsx`, `SearchBar.tsx`, `CurrencyListModal.tsx`, `ThemeToggle.tsx`, `page.tsx`, and `InstallButton.tsx` targeting the exact 8 selectors already referenced by `buildTourSteps`.
- Plan 03 (wiring) can import `tourSeenAtom`, `resolveTourLocale`, and `buildTourSteps`/`TOUR_STEP_COUNT` directly — all contracts are stable, tested, and typed against the installed `driver.js` `DriveStep`/`Config` types.
- No visible behavior yet — this plan intentionally produces zero UI change (contract layer only), confirmed by `npm run build` succeeding with no new runtime code paths exercised.
- No blockers.

## Self-Check: PASSED

All created/modified files verified present on disk; all 4 task/summary commit hashes (`2cfa699`, `722de40`, `d300691`, `a14af8b`) verified present in `git log`.

---
*Phase: 01-guided-first-run-tour*
*Completed: 2026-07-04*
