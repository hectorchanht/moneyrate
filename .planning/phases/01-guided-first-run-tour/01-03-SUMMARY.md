---
phase: 01-guided-first-run-tour
plan: 03
subsystem: ui
tags: [driver.js, jotai, tour, wiring, react-effect]

# Dependency graph
requires:
  - "src/lib/atoms.ts tourSeenAtom (Plan 01)"
  - "src/lib/fns.ts resolveTourLocale (Plan 01)"
  - "src/lib/tourSteps.ts buildTourSteps/SUPPORTED_LOCALES/TOUR_INSTALL_FALLBACK_DESCRIPTION (Plan 01)"
  - "All 8 data-tour anchors live on the DOM (Plan 02)"
provides:
  - "Running, dismissible, once-per-browser first-run tour on page.tsx"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Gated auto-start useEffect: hydrated && content-ready && !seen-flag, guarded by a useRef against React Strict Mode's dev double-invoke"
    - "Pre-filter driver.js DriveStep[] by document.querySelector before drive() to turn a hard throw into a silent step-skip"
    - "Immutable shallow-clone of a single DriveStep to swap fallback copy, rather than mutating the shared buildTourSteps() output"

key-files:
  created: []
  modified:
    - src/app/page.tsx

key-decisions:
  - "Combined Task 1 (scaffold: imports, refs, gate, cleanup) and Task 2 (driver config, filters, seen-flag wiring) into a single commit — the plan's own Task 2 action explicitly fills in the same useEffect body Task 1 scaffolds, and splitting the diff at the git-hunk level would produce a non-compiling intermediate commit (a driver({...}) call with no config object, or a config object with no steps variable in scope). Both tasks' acceptance criteria were verified together before committing (see Deviations)."
  - "onDoneClick and onCloseClick both call driverObj?.destroy() explicitly (driver.js disables default close-button behavior once any callback is registered, per RESEARCH Open Question 1), while onDestroyed is registered as a defensive, idempotent setTourSeen(true) safety net without its own destroy() call (destroy() calling itself would recurse)"
  - "Theme read for the overlay scrim is a one-time document.documentElement.getAttribute('data-theme') check at tour-init only (not a themeAtom dependency in the effect's deps array), per the RESEARCH anti-pattern warning against re-initializing driver() on every theme toggle"

requirements-completed: [TOUR-01, TOUR-04, TOUR-05]

# Metrics
duration: 14min
completed: 2026-07-04
---

# Phase 1 Plan 3: Tour Wiring Summary

**Single gated `useEffect` in page.tsx turns the Plan 01 contracts + Plan 02 anchors into a live, dismissible, once-per-browser driver.js tour — auto-starts post-hydration/post-skeleton, blocks spotlighted-element interaction, and persists `tourSeen` on every exit path**

## Performance

- **Duration:** 14 min
- **Started:** 2026-07-04T03:35:00Z
- **Completed:** 2026-07-04T03:39:37Z
- **Tasks:** 2 completed (committed together — see Decisions Made)
- **Files modified:** 1

## Accomplishments
- `src/app/page.tsx` imports `driver`/`Driver` from `driver.js`, `buildTourSteps`/`SUPPORTED_LOCALES`/`TOUR_INSTALL_FALLBACK_DESCRIPTION` from `@/lib/tourSteps`, `resolveTourLocale` from `@/lib/fns`, and `tourSeenAtom` from `@/lib/atoms`
- A single tour-start `useEffect` (placed after the `effectiveAll` memo, both in scope) auto-starts the tour exactly once when `hydrated === true && effectiveAll` is truthy `&& tourSeen === false`, guarded by `tourStartedRef` against React Strict Mode's dev double-invoke
- Device locale resolved client-only via `resolveTourLocale(typeof navigator !== 'undefined' ? navigator.languages : [], SUPPORTED_LOCALES, 'en')` — no `navigator` read in the render body
- Missing-anchor steps are silently dropped via a `document.querySelector` pre-filter before `driver({ steps })` (welcome step, which has no `element`, is always kept)
- The `tour-install` step's `description` is immutably swapped to `TOUR_INSTALL_FALLBACK_DESCRIPTION` when `[data-tour="tour-install"] button` is absent — step 8 is never dropped, keeping the "n / 8" counter consistent
- `driver()` configured with `disableActiveInteraction: true` (D-03, blocks clicking the spotlighted currency row), `allowClose: true` + `overlayClickBehavior: 'close'` + `allowKeyboardControl: true` (D-02, covers Skip/Escape/overlay-click), `smoothScroll: true`, `stagePadding: 4`, `showProgress: true`, theme-aware `overlayColor` (`rgba(0,0,0,0.65)` dark / `rgba(0,0,0,0.45)` light, read once from `document.documentElement.getAttribute('data-theme')` at init, never re-initialized on theme toggle), and `nextBtnText`/`prevBtnText`/`doneBtnText` matching the Copywriting Contract
- `setTourSeen(true)` fires from `onDoneClick`, `onCloseClick` (both also explicitly call `driverObj.destroy()`, since registering either callback disables driver.js's default close behavior), and `onDestroyed` (defensive, idempotent safety net)
- The effect returns a cleanup that calls `driverObj?.destroy()` on unmount, mirroring the existing `useDragDropTouch` external-library-lifecycle pattern
- No `#currency_list_modal.showModal()` call was added anywhere — the modal stays closed throughout the tour per the native-`<dialog>` top-layer constraint
- `npm run build` succeeds; `npx vitest run` passes all 64 existing tests unmodified; `npm run lint` reports only the expected `setTourSeen` exhaustive-deps warning (intentionally excluded from the deps array per the plan — `setTourSeen` from Jotai's `useAtom` is referentially stable)
- Manual smoke check: `next dev` serves `/` with HTTP 200, SSR renders the loading skeleton with no `navigator`/hydration errors, dev server compiles cleanly with no runtime console errors

## Task Commits

Both tasks were committed together as one atomic commit (see Deviations from Plan for rationale):

1. **Task 1 (scaffold: imports, refs, gate, locale resolution, cleanup) + Task 2 (driver config, missing-anchor filter, install fallback, seen-flag wiring)** - `ba9b56e` (feat)

**Plan metadata:** committed alongside this SUMMARY (see final commit below)

## Files Created/Modified
- `src/app/page.tsx` - added tour contract imports; `tourStartedRef` ref and `tourSeenAtom` read/write; a gated `useEffect` that resolves locale, builds/filters/fallback-swaps the step list, initializes and drives `driver()` with the D-01/D-02/D-03-locked config, sets `tourSeen=true` on every dismissal path, and destroys the instance on unmount

## Decisions Made
- Combined the two plan tasks into a single commit because they fill in the same `useEffect` body — Task 2's action explicitly "fills in the tour-start effect body added in Task 1"; splitting the diff would require staging a `driver({...})` call with no config object (Task 1 alone) or a config object referencing `steps`/`locale` locals with no scaffold declaring them (Task 2 alone), neither of which compiles. All of both tasks' acceptance-criteria greps and the shared `npm run build`/`npx vitest run` gates were verified together before the single commit.
- `onCloseClick` and `onDoneClick` explicitly call `driverObj?.destroy()` rather than relying on driver.js's own default close behavior, per RESEARCH Open Question 1's finding that registering any callback disables the library's default button behavior.
- Kept `onDestroyed` as a defensive, idempotent `setTourSeen(true)` per RESEARCH Pitfall 4/Open Question 1 — the guidance's accepted, low-severity, dev-only risk (a Strict-Mode remount's synthetic unmount could theoretically mark the tour "seen" without user interaction) was judged worth taking in exchange for certainty that no real dismissal path (Escape/overlay-click) is missed.

## Deviations from Plan

### Auto-fixed Issues

None — no Rule 1/2/3 bugs, missing functionality, or blocking issues were found during implementation. driver.js's actual TypeScript definitions (`node_modules/driver.js/dist/driver.js.d.ts`) were read directly to confirm the exact `Config`/`DriveStep`/`DriverHook` shapes before writing the effect, matching the plan's config keys exactly (no keys needed correction).

### Process Deviation (documented, not a Rule 1-4 case)

**Combined Task 1 + Task 2 into one commit.** The plan's own task descriptions make Task 2 a direct continuation of Task 1's scaffold within the identical `useEffect` — see Decisions Made above. This is a granularity accommodation to keep every commit independently buildable and testable, not a scope change: both tasks' full acceptance-criteria grep suites and the `npm run build`/`npx vitest run` gates were run and passed before the single commit was made.

## Issues Encountered
None. All automated verification greps from both tasks passed on the first attempt; `npm run build`, `npx vitest run` (64/64), and `npm run lint` (1 expected warning only) all succeeded.

## User Setup Required
None — no external service configuration required. The one manual-QA acceptance criterion in the plan (walking all four dismissal paths — Done, Skip/close, Escape, overlay-click — in `next dev` and confirming `localStorage.tourSeen === 'true'` after each) is flagged in the plan itself as manual/QA-only per RESEARCH Assumption A2/Open Question 1, which static analysis could not fully confirm. A dev-server smoke test (HTTP 200, clean SSR, no console errors) was performed as part of this plan's execution; the full four-path manual walkthrough is recommended before/during Phase 1 sign-off but was not re-performed here since it requires live browser interaction beyond headless verification.

## Next Phase Readiness
- Phase 1's success criteria (auto-start once, forward/back nav, all four dismissal paths set `tourSeen`, spotlighted element non-interactive, settings dialog never auto-opened, missing anchors silently skipped, install fallback copy) are now implemented as described in this plan's `<success_criteria>` and `<verification>` blocks.
- Phase 2 (on-demand replay) can call `driver({ steps: ... }).drive()` again from a new persistent "?" control, reusing `buildTourSteps`/`resolveTourLocale`/the missing-anchor filter pattern established here — note the reserved `tour-replay`/`tour-help` `data-tour` names (UI-SPEC) are still unused, ready for Phase 2.
- Phase 3 (localized, accessible, theme-aware tour) can now localize `buildTourSteps(locale)`'s currently-English-only copy since `locale` is already threaded end-to-end from `resolveTourLocale` through to `driver()`.
- No blockers.

## Known Stubs
None. No hardcoded empty values, placeholder text, or unwired data sources were introduced — the tour is fully wired end-to-end (contracts → anchors → live driver() instance).

## Threat Flags
None. This plan introduces no new network endpoints, auth paths, or schema changes; all threats identified in the plan's own `<threat_model>` (tampering with the `tourSeen` localStorage flag, tour-copy injection, missing-selector DoS, `navigator.languages` spoofing) were mitigated exactly as specified (static plain-text copy only, pre-filter before `driver()`, `typeof navigator` guard, `resolveTourLocale`'s existing malformed-tag fallback).

## Self-Check: PASSED

All modified files verified present on disk with expected content (`src/app/page.tsx` contains `driver(`, `tourStartedRef`, `setTourSeen(true)` x3, `disableActiveInteraction: true`, `allowClose: true`, `TOUR_INSTALL_FALLBACK_DESCRIPTION`); commit hash `ba9b56e` verified present in `git log`.

---
*Phase: 01-guided-first-run-tour*
*Completed: 2026-07-04*
