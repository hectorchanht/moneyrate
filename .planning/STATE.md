---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_plan: 4
status: milestone_complete
stopped_at: Milestone complete (Phase 3 was final phase)
last_updated: 2026-07-04T12:10:12.624Z
progress:
  total_phases: 3
  completed_phases: 3
  total_plans: 8
  completed_plans: 8
  percent: 100
---

# State: moneyrate — Onboarding Tour

**Purpose:** Project memory across sessions. Updated by `/gsd:plan-phase`, `/gsd:execute`, `/gsd:verify-phase`, `/gsd:transition`.

## Project Reference

**Core value:** A first-time visitor understands how to use moneyrate within seconds of landing — the key interactions are demonstrated, not hidden.

**Current focus:** Milestone complete

**Full requirements:** `.planning/REQUIREMENTS.md`
**Full roadmap:** `.planning/ROADMAP.md`
**Codebase map:** `.planning/codebase/`

## Current Position

Phase: 3 (Localized, Accessible, Theme-Aware Tour) — COMPLETE
Plan: 4 of 4
Current Plan: Not started
Total Plans in Phase: 4
**Phase:** 3 of 3
**Plan:** 03-04 complete (mobile-fit + RTL scoping, A11Y-02) — all 4 plans of Phase 3 done; all 3 phases of the milestone complete
**Status:** Milestone complete
**Progress:** [██████████] 100%

## Performance Metrics

| Phase | Plans | Est. Effort | Actual Effort | Variance |
|-------|-------|--------------|----------------|----------|
| 1. Guided First-Run Tour | TBD | TBD | - | - |
| 2. On-Demand Replay | TBD | TBD | - | - |
| 3. Localized, Accessible, Theme-Aware Tour | TBD | TBD | - | - |
| Phase 01 P01 | 12min | 3 tasks | 8 files |
| Phase 01 P02 | 3min | 3 tasks | 6 files |
| Phase 01 P03 | 14min | - tasks | - files |
| Phase 3 P01 | 12min | 2 tasks | 6 files |
| Phase 03 P02 | 22min | 2 tasks | 3 files |
| Phase 03 P03 | 26min | 4 tasks | 3 files |
| Phase 03 P04 | 10min | 3 tasks | 3 files |

## Accumulated Context

### Decisions

| Decision | Rationale | Phase |
|----------|-----------|-------|
| Onboarding via driver.js | Small (~5kb) vanilla, selector-based lib; matches bundle-conscious, vendored-dependency style; less overhead than react-joyride, less work than custom-built | Pre-roadmap |
| Auto first-visit + persistent "?" replay | Standard onboarding pattern: discoverability for new users, re-access for returning users | Pre-roadmap |
| Anchor exclusively on `data-tour` attributes | Existing `aria-label`/`title` attributes are i18n-translated — not stable selectors across languages | Pre-roadmap |
| Localize tour into all 30 existing languages | Consistency with the app's existing full i18n coverage; no partial-locale onboarding | Pre-roadmap |
| Home page (`/`) only | Highest-traffic entry point; `/chart` and `/convert/[pair]` explicitly deferred to v2 (TOUR-07) | Pre-roadmap |
| "Seen tour" flag as new `atomWithStorage` | Matches existing state pattern in `src/lib/atoms.ts`; must gate behind `hydrated` flag in `page.tsx` to avoid SSR/localStorage hydration mismatch | Pre-roadmap |
| 3-phase vertical-slice structure (engine+content / replay / i18n+a11y+theme) | Coarse granularity target (3-5 phases); each phase is an independently demoable, end-to-end user capability rather than a horizontal layer | Roadmap |

- [Phase 01]: resolveTourLocale takes navLangs as a parameter (never reads navigator itself) to stay pure/testable; client-only navigator.languages read deferred to Plan 03's call site
- [Phase 01]: tour.css overrides driver.js's verified real class names (next-btn, prev-btn, done-btn, footer-btn) confirmed against installed driver.js 1.6.0 source, not assumed from docs
- [Phase 01]: tour-base-row uses data-tour={isBase ? 'tour-base-row' : undefined} so exactly one row carries the attribute regardless of sort order or virtualization
- [Phase 01]: InstallButton's inner button wrapped in {deferred && (...)} rather than removing the deferred check, preserving install-prompt gating while guaranteeing the wrapper always renders
- [Phase 01]: Combined Task 1 (scaffold) and Task 2 (driver config) into a single 01-03 commit since they fill the same useEffect body and splitting would produce a non-compiling intermediate commit
- [Phase 3]: Reused getTourString's per-key en-fallback contract inside useTranslation() so i18n.tour.replayLabel type-checks and behaves correctly before 03-02 lands the remaining 29 locales
- [Phase 3]: First-load device-language default effect placed directly above the tour auto-start effect, gated on hydrated, mirroring the existing link-hydration effect shape
- [Phase 3]: Fixed en.tour.doneBtn and 8 locale doneBtn strings to comply with the UI-SPEC's own <=12-char button budget, caught by the new automated coverage test
- [Phase 03-03]: No manual focus-restore closure written for the tour — driver.js 1.6.0's built-in activeElement capture/restore proven sufficient by a keyboard-driven Playwright baseline test (verify-first)
- [Phase 03-03]: Reduced-motion detected via one-time window.matchMedia read inside startTour(), matching the existing isDarkTheme read pattern, not a subscribed listener
- [Phase 3]: Phase 3 complete (03-04): RTL scoped strictly to popover DOM node via onPopoverRender, never html/body; CSS-only [dir=rtl] footer mirror preserves DOM/tab order

### Open Todos

- None yet — planning begins with `/gsd:plan-phase 1`.

### Blockers

- None.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260711-r2h | Fix Reset button not clearing tourSeen and showDatePicker keys (tour never replays after reset) | 2026-07-11 | e10fbe1 | [260711-r2h-fix-reset-button-not-clearing-tourseen-a](./quick/260711-r2h-fix-reset-button-not-clearing-tourseen-a/) |
| 260711-rdn | Fix SearchBar.test.tsx localStorage mock (Node 25 built-in shadows jsdom; suite now 81/81 green) | 2026-07-11 | 3ca0494 | [260711-rdn-fix-searchbar-test-tsx-localstorage-mock](./quick/260711-rdn-fix-searchbar-test-tsx-localstorage-mock/) |

### Notes for Future Phases

- Only `#currencyList` has a stable id today; all other Phase 1 tour anchors (base row, amount input, search, settings modal trigger, share button, theme toggle, historical-date picker, PWA install button) need new `data-tour="..."` attributes added across `src/app/page.tsx` and relevant components (`CurrencyListModal.tsx`, `SearchBar.tsx`, etc.).
- Tests: Vitest (`*.test.tsx`) and Playwright e2e (`test:e2e`) already exist in this repo — new tour behavior (auto-start gating, replay, keyboard nav) should get coverage in kind.
- `.planning/codebase/` map is dated 2026-07-03 and has minor known drift (documents 4 components, 9 exist; omits `/convert/[pair]` route) — not relevant to tour work but noted for planners referencing that doc.

## Session Continuity

**Last session:** 2026-07-04T11:54:11.660Z
**Stopped At:** Completed 03-04-PLAN.md — Phase 3 fully executed, milestone execution complete
**Resume File:** None
**Resume with:** `/gsd:verify-phase 3`

---
*State initialized: 2026-07-04*
