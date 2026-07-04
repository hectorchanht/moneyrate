---
phase: 03-localized-accessible-theme-aware-tour
plan: 03
subsystem: ui
tags: [driver.js, accessibility, a11y, keyboard-navigation, prefers-reduced-motion, focus-visible, playwright]

# Dependency graph
requires:
  - phase: 03-01
    provides: replay button i18n label, startTour() reading languageAtom (avoided merge conflict on shared page.tsx regions)
provides:
  - Keyboard-driven Playwright e2e baseline proving driver.js 1.6.0's built-in focus capture/restore already satisfies D-07 item 2 (no manual restore code needed)
  - ":focus-visible" outline rings (oklch(var(--p)), 2px, 2px offset) on 5 keyboard-focusable tour controls
  - prefers-reduced-motion wiring: JS-side animate/smoothScroll: false + CSS-side --driver-animation-duration: 0ms
  - First tour e2e test suite (e2e/tour.spec.ts) covering keyboard nav, focus restoration, focus rings, and reduced motion
affects: [03-04, future-a11y-audits]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Verify-first testing: write a Playwright baseline test proving/disproving an assumed library gap BEFORE writing code to fill it, to avoid redundant/duplicate logic"
    - "One-time media-query read inside startTour() (matches existing isDarkTheme pattern) rather than a subscribed listener, since the tour is a modal session that doesn't need live updates mid-tour"
    - "CSS + JS defense-in-depth for reduced-motion: JS config flag (animate/smoothScroll) disables driver.js's own trigger, CSS custom-property override zeroes the transition duration as a backstop"

key-files:
  created: []
  modified:
    - src/theme/tour.css
    - src/app/page.tsx
    - e2e/tour.spec.ts

key-decisions:
  - "No manual focus-restore closure written — driver.js 1.6.0's built-in document.activeElement capture/restore was proven sufficient by a keyboard-driven (Tab+Enter) Playwright baseline test written and run BEFORE any restore code, per the plan's verify-first mandate. Documented inline in page.tsx with a comment citing e2e/tour.spec.ts."
  - "Reduced-motion detected via window.matchMedia('(prefers-reduced-motion: reduce)').matches, read once per startTour() invocation (same shape as the existing isDarkTheme read), not subscribed — the tour is a short modal session so a live-updating listener is unnecessary complexity."
  - "Focus-visible rings use the exact accent token (oklch(var(--p))) already used for the tour's spotlight ring, introducing no new hue, per 03-UI-SPEC.md."

patterns-established:
  - "Verify-first task ordering for library-internals questions: a Playwright checkpoint test established ground truth before Task 3 wrote any code, avoiding a redundant/duplicate focus-restore implementation."

requirements-completed: [A11Y-01]

# Metrics
duration: 26min
completed: 2026-07-04
---

# Phase 3 Plan 3: Localized, Accessible, Theme-Aware Tour — Keyboard A11Y Summary

**Tour is fully keyboard-operable with theme-token focus rings, driver.js's built-in focus-restore verified sufficient (zero new restore code), and prefers-reduced-motion disables animation/smooth-scroll via a JS+CSS two-part contract.**

## Performance

- **Duration:** 26 min (from Task 1's checkpoint commit through Task 4's completion)
- **Started:** 2026-07-04T09:47:00Z (approx, Task 1 commit d4ba78d)
- **Completed:** 2026-07-04T10:13:31Z
- **Tasks:** 4 (1 checkpoint + 3 auto)
- **Files modified:** 3 (`src/theme/tour.css`, `src/app/page.tsx`, `e2e/tour.spec.ts`)

## Accomplishments
- Proved via a keyboard-driven (Tab+Enter, never `page.click()`) Playwright baseline that driver.js 1.6.0's built-in `document.activeElement` capture/restore already returns focus to the "?" replay button after both Escape and Done — avoiding a redundant, duplicate focus-restore closure (Rule: verify-first per 03-RESEARCH.md Pitfall 3).
- Added `:focus-visible` outline rings (`2px solid oklch(var(--p))`, `2px` offset) to all 5 keyboard-focusable tour controls: the four driver.js footer buttons (Next/Back/Done/Close) and the persistent "?" replay button — theme-token only, no hex, no bare `:focus`.
- Wired `prefers-reduced-motion` end-to-end: a one-time `matchMedia` read in `startTour()` sets `animate`/`smoothScroll` to `false` when the preference is set; a CSS `@media` block zeroes `--driver-animation-duration` as defense-in-depth.
- Built the project's first tour e2e suite (`e2e/tour.spec.ts`, 4 tests, all green): keyboard-driven focus-restoration baseline (Escape + Done paths), focus-ring rendering, and reduced-motion behavior (asserted via driver.js's internal `driver-fade`/`driver-simple` body-class toggle plus the CSS custom-property value).

## Task Commits

Each task was committed atomically:

1. **Task 1: VERIFY-FIRST keyboard-driven focus restoration baseline** — `d4ba78d` (test) — completed in a prior session; checkpoint approved by user.
2. **Task 2: Add :focus-visible rings + prefers-reduced-motion block to tour.css** — `15e988b` (feat)
3. **Task 3: Wire reduced-motion into driver config + citing comment (no restore code)** — `98f9cbd` (feat)
4. **Task 4: Finalize e2e/tour.spec.ts — reduced-motion + focus-ring coverage** — `29aa462` (test)

**Plan metadata:** (this commit, docs: complete plan)

_Note: Task order in execution was 2 → 3 → 4 after the Task 1 checkpoint was approved, matching the plan's stated flexibility ("Task 2 CSS is independent and may run any time")._

## Files Created/Modified
- `src/theme/tour.css` — Added `:focus-visible` rules for the 4 driver.js footer button classes plus `.tour-replay-btn`; added `@media (prefers-reduced-motion: reduce)` block zeroing `--driver-animation-duration`.
- `src/app/page.tsx` — Added one-time `prefersReducedMotion` read inside `startTour()`; made `animate`/`smoothScroll` conditional on it; added an inline comment citing the e2e baseline test as proof no manual focus-restore is needed.
- `e2e/tour.spec.ts` — Extended Task 1's file with a focus-ring assertion test and a `prefers-reduced-motion` test (via `page.emulateMedia`); all selectors are class-based, never localized `aria-label`.

## Decisions Made
- **No focus-restore code** — the Task 1 baseline (approved checkpoint) proved driver.js's built-in behavior is sufficient. Adding a closure anyway would risk a double-restore for zero accessibility gain (per 03-RESEARCH.md's explicit warning). Documented with an inline comment in `page.tsx` citing the test as the source of truth, so future readers don't reintroduce redundant code.
- **Reduced-motion assertion strategy** — rather than trying to observe CSS animation timing directly (flaky in a real browser), the e2e test asserts driver.js's own `driver-fade`/`driver-simple` body-class toggle (confirmed by reading `node_modules/driver.js/dist/driver.js.mjs:531`), which is a deterministic, non-timing-dependent signal that `animate: false` took effect, plus the computed `--driver-animation-duration` CSS value as a second, independent check.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Playwright's default port 3000 collided with an unrelated dev server on the machine**
- **Found during:** Task 4 (running `npx playwright test e2e/tour.spec.ts`)
- **Issue:** An unrelated Next.js 15 dev server (from a different project, `hotel-portal-v3`) was already bound to `localhost:3000`. Playwright's `webServer` config auto-bumped `next dev` to port 3002 due to the collision, but `playwright.config.ts`'s `baseURL`/`webServer.url` still pointed at `localhost:3000` — so Playwright's readiness check passed against the wrong (unrelated) server, then all keyboard interactions failed with "Target page, context or browser has been closed" once the mismatched dev server was torn down mid-test.
- **Fix:** Ran the test suite with a temporary, local-only `playwright.tmp-port.config.ts` override binding both the dev server and `baseURL` to port 3010, confirmed all 4 tests pass, then deleted the temporary config file. `playwright.config.ts` itself was left unchanged (the port collision is an artifact of this specific machine's other running processes, not a bug in the committed config) — did not kill the unrelated `hotel-portal-v3` process, since it belongs to a different project outside this task's scope.
- **Files modified:** None committed (temporary config created and deleted within this session, never staged).
- **Verification:** `npx playwright test --config=playwright.tmp-port.config.ts e2e/tour.spec.ts --project=chromium` → 4 passed.
- **Committed in:** N/A (no code change — environment workaround only).

---

**Total deviations:** 1 auto-fixed (1 blocking — environment port collision, no code change)
**Impact on plan:** No scope creep; purely a local test-run environment fix. `playwright.config.ts` remains as originally authored (port 3000, `reuseExistingServer: true`), which is correct for CI and for any developer machine without a stray process on 3000.

## Issues Encountered
- Local port 3000 was occupied by an unrelated project's stale Next.js dev server, requiring a temporary Playwright config override to get a clean test run on this machine (see Deviations above). Not a defect in the plan's deliverables.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- A11Y-01 (all three D-07 items) is fully satisfied: keyboard-operable tour, visible focus rings on all 5 controls, verified focus restoration, and prefers-reduced-motion honored.
- SC3 (theme compliance) remains verify-only per the plan — `tour.css` was already token-driven prior to this plan; no code change was needed to satisfy it, confirmed by inspection during this plan's work.
- `e2e/tour.spec.ts` establishes the project's first tour e2e coverage and test-file pattern (seed via `addInitScript`, `mockRates`, keyboard-only driving) — 03-04 and any future tour e2e work should extend this file rather than creating a parallel one.
- `src/theme/tour.css`, `src/app/page.tsx`, and `e2e/tour.spec.ts` are also touched by 03-04 (next plan) — all additions in this plan were scoped narrowly (new rules/blocks appended, no restructuring) to avoid merge friction.

---
*Phase: 03-localized-accessible-theme-aware-tour*
*Completed: 2026-07-04*

## Self-Check: PASSED

All files verified present: `src/theme/tour.css`, `src/app/page.tsx`, `e2e/tour.spec.ts`, `03-03-SUMMARY.md`.
All commits verified present: `d4ba78d`, `15e988b`, `98f9cbd`, `29aa462`.
