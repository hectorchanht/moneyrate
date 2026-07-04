---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: "Roadmap approved, awaiting `/gsd:plan-phase 1`"
last_updated: "2026-07-04T02:06:10.098Z"
progress:
  total_phases: 3
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# State: moneyrate — Onboarding Tour

**Purpose:** Project memory across sessions. Updated by `/gsd:plan-phase`, `/gsd:execute`, `/gsd:verify-phase`, `/gsd:transition`.

## Project Reference

**Core value:** A first-time visitor understands how to use moneyrate within seconds of landing — the key interactions are demonstrated, not hidden.

**Current focus:** Phase 1 — Guided First-Run Tour (not yet planned).

**Full requirements:** `.planning/REQUIREMENTS.md`
**Full roadmap:** `.planning/ROADMAP.md`
**Codebase map:** `.planning/codebase/`

## Current Position

**Phase:** 1 of 3 — Guided First-Run Tour
**Plan:** Not yet planned
**Status:** Roadmap approved, awaiting `/gsd:plan-phase 1`
**Progress:** [ ] 0% — phases: 0/3 complete

## Performance Metrics

| Phase | Plans | Est. Effort | Actual Effort | Variance |
|-------|-------|--------------|----------------|----------|
| 1. Guided First-Run Tour | TBD | TBD | - | - |
| 2. On-Demand Replay | TBD | TBD | - | - |
| 3. Localized, Accessible, Theme-Aware Tour | TBD | TBD | - | - |

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

### Open Todos

- None yet — planning begins with `/gsd:plan-phase 1`.

### Blockers

- None.

### Notes for Future Phases

- Only `#currencyList` has a stable id today; all other Phase 1 tour anchors (base row, amount input, search, settings modal trigger, share button, theme toggle, historical-date picker, PWA install button) need new `data-tour="..."` attributes added across `src/app/page.tsx` and relevant components (`CurrencyListModal.tsx`, `SearchBar.tsx`, etc.).
- Tests: Vitest (`*.test.tsx`) and Playwright e2e (`test:e2e`) already exist in this repo — new tour behavior (auto-start gating, replay, keyboard nav) should get coverage in kind.
- `.planning/codebase/` map is dated 2026-07-03 and has minor known drift (documents 4 components, 9 exist; omits `/convert/[pair]` route) — not relevant to tour work but noted for planners referencing that doc.

## Session Continuity

**Last session ended:** 2026-07-04 — roadmap created and approved for planning.
**Resume with:** `/gsd:plan-phase 1`

---
*State initialized: 2026-07-04*
