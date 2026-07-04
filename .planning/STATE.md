---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_plan: 2
status: executing
stopped_at: Completed 03-01-PLAN.md
last_updated: "2026-07-04T08:33:40.246Z"
progress:
  total_phases: 3
  completed_phases: 2
  total_plans: 8
  completed_plans: 5
  percent: 63
---

# State: moneyrate — Onboarding Tour

**Purpose:** Project memory across sessions. Updated by `/gsd:plan-phase`, `/gsd:execute`, `/gsd:verify-phase`, `/gsd:transition`.

## Project Reference

**Core value:** A first-time visitor understands how to use moneyrate within seconds of landing — the key interactions are demonstrated, not hidden.

**Current focus:** Phase 3 — Localized, Accessible, Theme-Aware Tour

**Full requirements:** `.planning/REQUIREMENTS.md`
**Full roadmap:** `.planning/ROADMAP.md`
**Codebase map:** `.planning/codebase/`

## Current Position

Phase: 3 (Localized, Accessible, Theme-Aware Tour) — EXECUTING
Plan: 2 of 4
Current Plan: 2
Total Plans in Phase: 4
**Phase:** 1 of 3 — Guided First-Run Tour
**Plan:** 01-03 complete (tour wiring) — all 3 plans of Phase 1 done
**Status:** Ready to execute
**Progress:** [██████░░░░] 63%

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

### Open Todos

- None yet — planning begins with `/gsd:plan-phase 1`.

### Blockers

- None.

### Notes for Future Phases

- Only `#currencyList` has a stable id today; all other Phase 1 tour anchors (base row, amount input, search, settings modal trigger, share button, theme toggle, historical-date picker, PWA install button) need new `data-tour="..."` attributes added across `src/app/page.tsx` and relevant components (`CurrencyListModal.tsx`, `SearchBar.tsx`, etc.).
- Tests: Vitest (`*.test.tsx`) and Playwright e2e (`test:e2e`) already exist in this repo — new tour behavior (auto-start gating, replay, keyboard nav) should get coverage in kind.
- `.planning/codebase/` map is dated 2026-07-03 and has minor known drift (documents 4 components, 9 exist; omits `/convert/[pair]` route) — not relevant to tour work but noted for planners referencing that doc.

## Session Continuity

**Last session:** 2026-07-04T08:33:40.240Z
**Stopped At:** Completed 03-01-PLAN.md
**Resume File:** None
**Resume with:** `/gsd:verify-phase 1`

---
*State initialized: 2026-07-04*
