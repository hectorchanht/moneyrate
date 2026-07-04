---
phase: 03-localized-accessible-theme-aware-tour
plan: 04
subsystem: ui
tags: [driver.js, accessibility, a11y, rtl, i18n, responsive, playwright, mobile]

# Dependency graph
requires:
  - phase: 03-01
    provides: languageAtom / language in scope for startTour(), RTL-eligible locale copy (ar/ur) plumbing
  - phase: 03-03
    provides: e2e/tour.spec.ts baseline (keyboard a11y describe block) and tour.css structure (focus-visible + reduced-motion blocks) extended rather than rewritten
provides:
  - Responsive `.driver-popover` max-width (min(320px, calc(100vw - 2rem))) so all 9 popover renders (welcome + 8 steps) fit within a 320px viewport without edge overflow
  - 44px minimum footer-button touch target (min-height + padding) clearing the WCAG 2.5.5 / iOS HIG floor
  - Popover-scoped RTL: onPopoverRender hook sets dir="rtl" on the popover node (never <html>/<body>) for ar/ur, paired with a `[dir="rtl"] .driver-popover-footer { flex-direction: row-reverse }` CSS-only visual mirror
  - Full Playwright coverage (9 tests total) for mobile-fit, touch-target, and RTL scoping, run alongside 03-03's keyboard-a11y suite
  - Live-QA-approved visual confirmation at 320/375px and for ar/ur RTL rendering
affects: [future-a11y-audits, any-future-tour-locale-additions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Popover-scoped dir attribute via onPopoverRender (idempotent per-step write to popoverDom.wrapper.dir), never touching document.documentElement/body — keeps RTL contained to a detached DOM node"
    - "CSS-only visual mirroring ([dir=rtl] flex-direction: row-reverse) for RTL footer order, leaving DOM/tab order and Next/Prev handlers untouched — text direction and interaction order are decoupled"
    - "Click-based Playwright step advancement (.driver-popover-next-btn) instead of ArrowRight when testing mobile/RTL flows, to avoid racing driver.js's internal ~400ms animate:true transition guard"

key-files:
  created: []
  modified:
    - src/theme/tour.css
    - src/app/page.tsx
    - e2e/tour.spec.ts

key-decisions:
  - "RTL is applied only to the popover DOM node (popoverDom.wrapper.dir), never <html>/<body> — keeps the RTL contract scoped exactly as specified, verified by an explicit e2e assertion that html/body never carry dir=rtl"
  - "Footer button reordering for RTL is CSS-only (flex-direction: row-reverse); no DOM reordering or Next/Prev handler swap, preserving logical tab order regardless of visual direction"
  - "Playwright step advancement uses .driver-popover-next-btn clicks rather than ArrowRight in the new mobile/RTL describe blocks, since driver.js's default animate:true holds an internal transition guard for ~400ms post-highlight-change during which arrow-key navigation silently no-ops; keyboard nav itself remains covered by the pre-existing A11Y-01 describe block"

patterns-established:
  - "RTL scoping pattern: any future per-locale visual mirroring should follow the same onPopoverRender (JS) + [dir=rtl] scoped selector (CSS) split, never a top-level dir mutation"

requirements-completed: [A11Y-02]

# Metrics
duration: 10min (Task 1 commit 22bb716 to Task 3 commit 32a92e6) + live QA checkpoint (approved in a follow-up session)
completed: 2026-07-04
---

# Phase 3 Plan 4: Localized, Accessible, Theme-Aware Tour — Mobile/RTL Fit Summary

**Tour popovers now fit 320-375px viewports with 44px touch targets, and render popover-scoped RTL (dir + mirrored footer) for Arabic/Urdu without ever flipping app-wide direction — approved via live mobile-device and RTL visual QA.**

## Performance

- **Duration:** ~10 min for Tasks 1-3 (22bb716 at 19:31:47+08:00 through 32a92e6 at 19:41:53+08:00), plus a separate live-QA checkpoint session for Task 4 (approved)
- **Started:** 2026-07-04T19:31:47+08:00 (Task 1 commit)
- **Completed:** 2026-07-04 (checkpoint approval)
- **Tasks:** 4 (3 auto + 1 checkpoint:human-verify)
- **Files modified:** 3 (`src/theme/tour.css`, `src/app/page.tsx`, `e2e/tour.spec.ts`) + 1 tracking file (`deferred-items.md`, out-of-scope log only)

## Accomplishments
- Replaced the flat `max-width: 320px` on `.driver-popover` with `min(320px, calc(100vw - 2rem))` — desktop behavior unchanged, narrow viewports get a 16px-per-side margin matching the app's `p-4` gutter; verified all 9 popover renders (welcome + 8 steps) stay within a 320px viewport bounding box.
- Extended `.driver-popover-footer-btn` with `min-height: 44px` and `padding: 0 16px`, clearing driver.js's shipped ~23-25px default and the WCAG 2.5.5 / iOS HIG 44px touch-target floor — verified via Playwright `boundingBox()` on both Next and Prev buttons at 375px width.
- Added a scoped `[dir="rtl"] .driver-popover-footer { flex-direction: row-reverse; }` rule — visual-only footer mirror, arrow-position rules (physical direction) and DOM/tab order left untouched.
- Added `RTL_LOCALES` module-scope constant (`ar`, `ur`) and an `onPopoverRender` hook in the driver.js config that writes `popoverDom.wrapper.dir` from a fixed `'rtl'`/`'ltr'` string chosen by `Set.has` membership (never the raw stored locale value) — scoped to the popover node only, never `<html>`/`<body>`.
- Extended `e2e/tour.spec.ts` with 5 new tests (9 total in the file, all green): 320px viewport-fit across all 9 popover renders, 44px touch-target height at 375px, `dir="rtl"` + footer `flex-direction: row-reverse` for both `ar` and `ur`, and an explicit assertion that `<html>`/`<body>` never carry `dir="rtl"`.
- Live visual QA (Task 4 checkpoint) approved: 320px/375px popover fit confirmed with no clipping across all 8 steps (no per-step `side` override needed — D-08 finding: none required), footer buttons comfortably tappable, Arabic tour copy renders RTL with mirrored footer and localized replay-button aria-label, app chrome outside the popover stays LTR.

## Task Commits

Each task was committed atomically:

1. **Task 1: Responsive width + 44px touch target + [dir=rtl] footer mirror in tour.css** — `22bb716` (feat)
2. **Task 2: Add onPopoverRender RTL hook + RTL_LOCALES constant in page.tsx** — `9dd9295` (feat)
3. **Task 3: Mobile-fit + touch-target + RTL Playwright assertions** — `32a92e6` (test)
4. **Task 4: Live mobile + RTL visual QA (320/375px, ar/ur)** — checkpoint, approved (no code commit; QA-only gate)

**Plan metadata:** (this commit, docs: complete plan)

## Files Created/Modified
- `src/theme/tour.css` — Replaced flat `max-width: 320px` with `min(320px, calc(100vw - 2rem))`; added `min-height: 44px` + `padding: 0 16px` to `.driver-popover-footer-btn`; added `[dir="rtl"] .driver-popover-footer { flex-direction: row-reverse; }`. 03-03's `:focus-visible` and reduced-motion blocks untouched.
- `src/app/page.tsx` — Added `const RTL_LOCALES = new Set<Language>(['ar', 'ur']);` at module scope; added `onPopoverRender` key to the `driver({...})` config writing `popoverDom.wrapper.dir` idempotently per step.
- `e2e/tour.spec.ts` — Added `tour mobile/touch fit (A11Y-02)` describe block (2 tests: viewport-fit, touch-target height) and `tour RTL (ar/ur, scoped to popover)` describe block (3 tests: ar dir+mirror, ur dir+mirror, app-wide-dir-not-set).
- `.planning/phases/03-localized-accessible-theme-aware-tour/deferred-items.md` — Logged (not fixed) a pre-existing, out-of-scope `e2e/home.spec.ts` flake unrelated to this plan's file set.

## Decisions Made
- RTL dir is written only to the popover's own DOM node via `onPopoverRender`, never to `document.documentElement`/`document.body` — enforced both by code review and an explicit Playwright assertion, satisfying the RTL Contract's "scoped to popover, not app-wide" requirement.
- Footer button visual reordering for RTL uses CSS `flex-direction: row-reverse` only; no DOM node reordering and no swap of `nextBtnText`/`prevBtnText` handlers, so keyboard tab order stays logical regardless of text direction (Pitfall 6 avoided).
- Playwright step-advancement in the new mobile/RTL tests clicks `.driver-popover-next-btn` directly rather than sending `ArrowRight`, because driver.js's default `animate: true` holds an internal `__transitionCallback` guard for ~400ms after each highlight change during which arrow-key navigation silently no-ops. Keyboard-driven navigation itself remains verified by the pre-existing A11Y-01 describe block from 03-03, so coverage is not lost — this is a test-authoring choice, not a product behavior change.
- No per-step `side` override was needed for any of the 8 tour steps at 320/375px (D-08 finding, confirmed via live QA) — the responsive `max-width` formula alone was sufficient to prevent clipping.

## Deviations from Plan

### Auto-fixed Issues

None — Tasks 1-3 were implemented exactly as specified in the plan's `<action>` blocks, with values (44px, `min(320px, calc(100vw - 2rem))`) matching the plan's prescribed CSS verbatim.

### Out-of-Scope Discoveries (logged, not fixed)

**1. [Scope boundary] Pre-existing `e2e/home.spec.ts` flake unrelated to 03-04's files**
- **Found during:** Task 3, while running the full Playwright suite to confirm no regressions from 03-04's changes.
- **Issue:** `home converter > toggles between light and dark themes` fails intermittently (reproduced 3/3 times when isolated in a disposable worktree) because `e2e/home.spec.ts`'s `seed()` helper does not set `tourSeen: true`, so the tour's overlay can still be present/animating when the theme-toggle test clicks — the `<svg class="driver-overlay...">` intercepts the pointer event.
- **Confirmed pre-existing:** Reproduced against commit `14d6530` (tip of 03-03, before any 03-04 change) — not caused by this plan's `tour.css`/`page.tsx`/`tour.spec.ts` edits.
- **Action taken:** Logged to `.planning/phases/03-localized-accessible-theme-aware-tour/deferred-items.md` with a suggested fix (add `tourSeen: true` to `e2e/home.spec.ts`'s `seed()`). Not fixed — outside this plan's declared `files_modified` (`src/theme/tour.css`, `src/app/page.tsx`, `e2e/tour.spec.ts`), per the scope-boundary rule.

### Environment Workaround (no code change)

**2. [Rule 3 - Blocking, environment only] Local port 3000 collision during e2e verification runs**
- **Found during:** Post-implementation verification of this finalization pass (re-running `npx playwright test e2e/tour.spec.ts` to confirm the approved state before writing this summary), and also noted during the prior executor's 03-03 session for the same file.
- **Issue:** `playwright.config.ts`'s `baseURL`/`webServer.url` point at `localhost:3000`, but this machine has an unrelated process already bound to port 3000, which would cause Playwright's readiness check to hit the wrong server.
- **Fix:** Ran the suite with a temporary, uncommitted `playwright.tmp-port.config.ts` binding `webServer`/`baseURL` to `localhost:3011`, confirmed all 9 tour tests pass, then deleted the temporary file. `playwright.config.ts` itself was left unchanged — this is a per-machine artifact, not a defect in the committed config.
- **Files modified:** None committed (temporary config created and deleted within this session, never staged, mirrors the identical workaround documented in 03-03-SUMMARY.md).
- **Verification:** `npx playwright test --config=playwright.tmp-port.config.ts e2e/tour.spec.ts --project=chromium` → 9 passed.
- **Committed in:** N/A — no code change.

---

**Total deviations:** 0 auto-fixed code changes; 1 out-of-scope discovery logged (not fixed); 1 environment-only workaround (no code change)
**Impact on plan:** No scope creep. Plan executed exactly as written for all 3 auto tasks; the checkpoint task passed live QA with zero follow-up findings (no `side` overrides needed).

## Issues Encountered
- Local port 3000 occupied by an unrelated process on this machine, requiring a temporary Playwright config override for e2e verification (see Deviations above) — not a defect in the deliverables, same pattern already documented in 03-03-SUMMARY.md for this machine.

## User Setup Required
None — no external service configuration required.

## Verification Evidence

- `npx tsc --noEmit` — clean, no errors.
- `npx playwright test e2e/tour.spec.ts --project=chromium` — **9/9 passed**:
  - `tour keyboard accessibility (A11Y-01)` (4 tests, from 03-03, unaffected): focus restoration (Escape + Done paths), focus rings, reduced-motion.
  - `tour mobile/touch fit (A11Y-02)` (2 tests, new): all 9 popover renders fit within a 320px viewport; footer buttons clear the 44px touch-target floor at 375px.
  - `tour RTL (ar/ur, scoped to popover)` (3 tests, new): `dir="rtl"` + mirrored footer for `ar`; same for `ur`; app-wide `dir` never set to `rtl`.
- Live mobile/RTL visual QA (Task 4 checkpoint, human-verify, **APPROVED**): confirmed at 320px and 375px that welcome + all 8 anchored popovers fit fully on-screen with no clipping (no per-step `side` override needed, D-08 finding: none), footer buttons measure >=44px, spotlight ring renders correctly; for Arabic (`ar`) confirmed popover `dir="rtl"`, footer visually mirrored (`row-reverse`), Arabic tour copy rendered, localized replay-button `aria-label` ("إعادة الجولة"), and `<html>`/app chrome remained LTR (popover-only scope).

## Next Phase Readiness
- A11Y-02 fully satisfied: responsive fit, 44px touch targets, and popover-scoped RTL are implemented, e2e-covered, and live-QA-approved.
- This completes all 4 plans of Phase 3 (03-01 i18n plumbing, 03-02 30-language localization, 03-03 keyboard a11y, 03-04 mobile/RTL fit) — Phase 3 is fully executed.
- All v1 requirements (TOUR-01 through TOUR-06, I18N-01, A11Y-01, A11Y-02, LANG-01) are now complete per `.planning/REQUIREMENTS.md`.
- `/gsd:verify-phase 3` (or equivalent milestone verification) is the natural next step — no further execution plans are queued in this phase's roadmap.

---
*Phase: 03-localized-accessible-theme-aware-tour*
*Completed: 2026-07-04*

## Self-Check: PASSED

All files verified present: `src/theme/tour.css` (contains `min(320px, calc(100vw - 2rem))`, `min-height: 44px`, `[dir="rtl"] .driver-popover-footer`), `src/app/page.tsx` (contains `RTL_LOCALES`, `onPopoverRender`), `e2e/tour.spec.ts` (contains `boundingBox`, `setViewportSize`, RTL `dir` assertions), `.planning/phases/03-localized-accessible-theme-aware-tour/deferred-items.md`.
All commits verified present: `22bb716`, `9dd9295`, `32a92e6` (confirmed via `git log --oneline --grep=03-04`).
`npx tsc --noEmit` clean. `npx playwright test e2e/tour.spec.ts` — 9/9 passed (re-verified during this finalization pass via temporary port-3011 config, deleted after use, no committed change).
