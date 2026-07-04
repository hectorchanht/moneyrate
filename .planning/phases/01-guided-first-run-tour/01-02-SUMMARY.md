---
phase: 01-guided-first-run-tour
plan: 02
subsystem: ui
tags: [data-tour, driver.js, anchors, dom]

# Dependency graph
requires:
  - "src/lib/tourSteps.ts buildTourSteps() 8 selector names (Plan 01)"
provides:
  - "All 8 data-tour anchor attributes live on real DOM elements matching tourSteps.ts selectors exactly"
  - "InstallButton always-rendered tour-install wrapper (early null-return removed)"
affects: [01-03-wiring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "data-tour attribute stacked alongside existing aria-label/title, never replacing"
    - "Conditional data-tour={cond ? 'value' : undefined} to guarantee exactly one DOM match regardless of list order/virtualization"
    - "Always-render wrapper pattern: move a component's early return-null into an inner conditional so an anchor wrapper element is guaranteed present"

key-files:
  created: []
  modified:
    - src/components/CurrencyRow.tsx
    - src/components/SearchBar.tsx
    - src/components/CurrencyListModal.tsx
    - src/components/ThemeToggle.tsx
    - src/components/InstallButton.tsx
    - src/app/page.tsx

key-decisions:
  - "tour-base-row uses data-tour={isBase ? 'tour-base-row' : undefined} (not a hardcoded value) so exactly one row carries the attribute at any time, independent of sort order or react-window virtualization"
  - "InstallButton's inner <button> wrapped in {deferred && (...)} instead of removing the deferred check entirely, preserving the exact same install-prompt gating behavior while guaranteeing the outer div always renders"

requirements-completed: [TOUR-06]

# Metrics
duration: 3min
completed: 2026-07-04
---

# Phase 1 Plan 2: DOM Tour Anchors Summary

**Added all 8 data-tour anchor attributes (7 static + 1 isBase-conditional) across 6 files, stacked alongside existing aria-label/title with zero behavioral change; restructured InstallButton to always render its tour-install wrapper**

## Performance

- **Duration:** 3 min
- **Started:** 2026-07-04T03:26:26Z
- **Completed:** 2026-07-04T03:29:18Z
- **Tasks:** 3 completed
- **Files modified:** 6

## Accomplishments
- `CurrencyRow.tsx`: `data-tour={isBase ? 'tour-base-row' : undefined}` on the row wrapper (exactly one match in the DOM at any time) + `data-tour="tour-amount-input"` on the base-row input
- `SearchBar.tsx`: `data-tour="tour-search"` on the search input, alongside existing `role="combobox"`/`aria-label`/`aria-controls`
- `CurrencyListModal.tsx`: `data-tour="tour-list-settings"` on the trigger button; `<dialog>` untouched (stays closed during the tour)
- `ThemeToggle.tsx`: `data-tour="tour-theme-toggle"` on the toggle button
- `page.tsx`: `data-tour="tour-share"` on the share button + `data-tour="tour-historical-date"` on the historical date input
- `InstallButton.tsx`: removed the `if (!deferred) return null;` early return; wrapper `<div data-tour="tour-install" className="w-full flex justify-center my-2 min-h-0">` now always renders, with the inner install button conditional on `{deferred && (...)}` — `beforeinstallprompt`/`appinstalled` effect unchanged
- All 8 selector names verified to exactly match `src/lib/tourSteps.ts`'s `buildTourSteps()` output (Plan 01)
- `npm run build` succeeds; full `vitest run` suite (64 tests, 7 files, including pre-existing `InstallButton.test.tsx`) passes unmodified

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the two CurrencyRow anchors (tour-base-row conditional, tour-amount-input)** - `514089c` (feat)
2. **Task 2: Add tour-search, tour-list-settings, tour-theme-toggle, and the two page.tsx anchors** - `8555003` (feat)
3. **Task 3: Restructure InstallButton so the tour-install wrapper always renders** - `3e9a96b` (feat)

**Plan metadata:** committed alongside this SUMMARY (see final commit below)

## Files Created/Modified
- `src/components/CurrencyRow.tsx` - added `data-tour` conditional attribute on row wrapper + static attribute on base-row input
- `src/components/SearchBar.tsx` - added `data-tour="tour-search"` on search input
- `src/components/CurrencyListModal.tsx` - added `data-tour="tour-list-settings"` on trigger button
- `src/components/ThemeToggle.tsx` - added `data-tour="tour-theme-toggle"` on toggle button
- `src/app/page.tsx` - added `data-tour="tour-share"` on share button, `data-tour="tour-historical-date"` on date input
- `src/components/InstallButton.tsx` - removed early return, wrapper always renders with conditional inner button

## Decisions Made
- Kept `InstallButton`'s existing `beforeinstallprompt`/`appinstalled` `useEffect` and install-prompt logic (`deferred.prompt()` → `deferred.userChoice` → `setDeferred(null)`) completely untouched — only the render/return branch changed, per plan scope.
- Did not add any tour-start wiring, imports, or fallback copy in this plan (all deferred to Plan 03) — verified via grep that no `driver`/`buildTourSteps` import was introduced in `page.tsx`.

## Deviations from Plan

None - plan executed exactly as written. All acceptance criteria grep checks and the `npm run build` gate passed on first attempt for every task.

## Issues Encountered
None. Pre-existing `InstallButton.test.tsx` asserts on button text presence/absence (not on the wrapper's null-return), so it remained valid and passed unmodified against the restructured component.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 03 (tour wiring) can now safely call `driver().drive()` against `buildTourSteps()` — every one of the 8 `[data-tour="..."]` selectors resolves to a real, focusable DOM element on a fresh first-run page load.
- `tour-base-row`'s `isBase`-conditional guarantees a single unambiguous match regardless of currency list order or virtualization threshold.
- `tour-install`'s wrapper is guaranteed present even when the PWA install prompt is unavailable, so Plan 03's step-8 fallback-copy swap (`TOUR_INSTALL_FALLBACK_DESCRIPTION` from Plan 01) has a stable anchor to target.
- No blockers.

## Self-Check: PASSED

All modified files verified present on disk with expected content; all 3 task commit hashes (`514089c`, `8555003`, `3e9a96b`) verified present in `git log`.

---
*Phase: 01-guided-first-run-tour*
*Completed: 2026-07-04*
