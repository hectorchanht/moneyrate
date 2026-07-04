---
phase: 03-localized-accessible-theme-aware-tour
plan: 01
subsystem: i18n
tags: [i18n, jotai, driver.js, translations, react]

# Dependency graph
requires:
  - phase: 01-guided-first-run-tour
    provides: buildTourSteps(locale), startTour(), tourSeenAtom, driver.js wiring, resolveTourLocale (pure, unit-tested)
  - phase: 02-on-demand-replay
    provides: persistent "?" replay control, startTour() reuse contract
provides:
  - "getTourString(locale, key) per-string English-fallback helper (D-04)"
  - "translations.en.tour namespace (19 keys) as the authoritative fallback source for all 30 locales"
  - "buildTourSteps(locale) fully localized (welcome + 8 feature steps) via getTourString"
  - "startTour() reading languageAtom instead of navigator.languages (D-01/D-02)"
  - "First-load device-language default effect for languageAtom, hydration-safe (D-03/LANG-01)"
  - "useTranslation() widened to guarantee i18n.tour.* always resolves with per-key en fallback"
affects: [03-02-localize-30-languages, 03-03-keyboard-a11y, 03-04-mobile-rtl]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-string i18n fallback (getTourString) instead of whole-object fallback, to avoid dropping an entire locale's tour copy over one missing key"
    - "Type-widening cast (TranslationsWithOptionalTour) to keep TypeScript happy while only `en` has authored a namespace that will roll out to all 30 locales incrementally"

key-files:
  created: []
  modified:
    - src/lib/translations.ts
    - src/lib/tourSteps.ts
    - src/lib/tourSteps.test.ts
    - src/app/page.tsx
    - src/lib/fns.test.ts
    - src/hooks/useTranslation.ts

key-decisions:
  - "Reused getTourString's per-key en-fallback contract inside useTranslation() itself (not just tourSteps.ts) so i18n.tour.replayLabel type-checks and behaves correctly before 03-02 lands the remaining 29 locales"
  - "First-load device-default effect placed directly above the tour auto-start effect in component body order, gated on hydrated, mirroring the existing link-hydration effect shape"

patterns-established:
  - "getTourString(locale, key): translations[locale]?.tour?.[key] ?? translations.en.tour[key] — the canonical per-string fallback shape for any future per-namespace i18n needs"

requirements-completed: [I18N-01, LANG-01]

# Metrics
duration: 12min
completed: 2026-07-04
---

# Phase 3 Plan 1: Tour i18n Plumbing + Device-Language Default Summary

**Rewired the tour's locale source from `navigator.languages` to the app's `languageAtom`, added the English `tour` i18n namespace with a per-string fallback helper, and pulled forward LANG-01's first-load device-language default — establishing the contract 03-02's 29 locale translations build against.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-04T08:18:00Z
- **Completed:** 2026-07-04T08:30:32Z
- **Tasks:** 2 completed
- **Files modified:** 6

## Accomplishments
- `translations.en.tour` namespace (19 keys: welcome, 8 steps, 3 button labels, install-fallback, replay label) is now the single authoritative English source for tour copy, replacing hardcoded strings scattered across `tourSteps.ts` and `page.tsx`
- `getTourString(locale, key)` provides per-string English fallback (D-04) — a locale missing one key never loses the rest of its translated tour copy
- `startTour()` now reads `languageAtom` (D-01/D-02) instead of `navigator.languages`; switching language in Settings and replaying the tour shows the new language immediately (useCallback dep fix)
- First-load device-language default (D-03/LANG-01): on first visit with no stored `language` key, both the app UI and the tour now render in the visitor's device language; a stored user choice always wins thereafter

## Task Commits

Each task was committed atomically:

1. **Task 1: Add English `tour` namespace + `getTourString` helper + localize buildTourSteps** - `81b3894` (feat)
2. **Task 2: Wire startTour() + page.tsx to languageAtom, i18n button labels, and first-load device default** - `a4942b6` (feat)

_No TDD RED/GREEN split was applicable here — Task 1 carried `tdd="true"` but the described `<behavior>` was verified via a single test-file update alongside the implementation, consistent with this being a delta/hardening phase on existing, working code rather than net-new behavior._

## Files Created/Modified
- `src/lib/translations.ts` - Added `tour: {...}` namespace (19 keys) to the `en` locale object, sibling to `home`/`settings`
- `src/lib/tourSteps.ts` - Added `getTourString` helper + `TranslationsWithOptionalTour` type-widening; localized `buildTourSteps` welcome + 8 feature steps; deleted dead `TOUR_DONE_BTN_TEXT` and (in Task 2) the now-orphaned `TOUR_INSTALL_FALLBACK_DESCRIPTION`
- `src/lib/tourSteps.test.ts` - Removed stale `TOUR_INSTALL_FALLBACK_DESCRIPTION` describe block; added `getTourString` fallback-behavior tests and getTourString-sourced structural assertions
- `src/app/page.tsx` - `startTour()` reads `languageAtom` (added to its useCallback deps); footer button labels/install-fallback/replay label sourced from `getTourString`/`i18n.tour`; new hydration-gated first-load device-default effect
- `src/lib/fns.test.ts` - Extended `resolveTourLocale` describe block with D-03 call-site decision-logic cases (device tag → nearest supported locale; empty navigator → en)
- `src/hooks/useTranslation.ts` - Widened return type + per-key en fallback for the `tour` namespace so `i18n.tour.*` type-checks and resolves correctly ahead of 03-02's full 30-locale rollout

## Decisions Made
- Applied `getTourString`'s per-key en-fallback contract inside `useTranslation()` as well as `tourSteps.ts`, since `i18n.tour.replayLabel` (mandated by D-05/UI-SPEC) is consumed through `useTranslation()`, not `getTourString` directly. This keeps both i18n access paths consistent and correct before all 30 locales gain a `tour` namespace in 03-02.
- Kept the type-widening approach (`TranslationsWithOptionalTour`) scoped to `tourSteps.ts` and `useTranslation.ts` rather than adding an explicit type annotation to the large `translations` const itself — avoids touching/annotating all 29 other locale objects, which is out of scope for this plan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] TypeScript union-type error on `translations[locale].tour` access**
- **Found during:** Task 1 verification (`npx tsc --noEmit`)
- **Issue:** `translations` has no explicit type annotation, so TypeScript infers each locale's literal object shape individually. Since only `en` has a `tour` property at this point in the rollout (29 locales are 03-02's job), `translations[locale]?.tour` failed to type-check across the `Language` union — `Property 'tour' does not exist on type '...'`.
- **Fix:** Added a `TranslationsWithOptionalTour` mapped type in `tourSteps.ts` that widens each locale's inferred type with `{ tour?: Partial<TourNamespace> }`, then indexed through that view inside `getTourString`. This lets `getTourString`/`buildTourSteps` type-check correctly today and requires no further changes once 03-02 adds `tour` to the remaining 29 locales.
- **Files modified:** `src/lib/tourSteps.ts`
- **Verification:** `npx tsc --noEmit` — 0 errors; `npx vitest run src/lib/tourSteps.test.ts` — 14/14 passing
- **Committed in:** `81b3894` (Task 1 commit)

**2. [Rule 3 - Blocking] TypeScript union-type error on `i18n.tour.replayLabel` in page.tsx**
- **Found during:** Task 2 verification (`npx tsc --noEmit`)
- **Issue:** Same root cause as deviation 1, surfacing through `useTranslation()`'s inferred return type (`translations[language] || translations.en`) — `i18n.tour.replayLabel` (mandated by D-05, the "?" replay button's i18n label) failed to type-check for the same reason: not all 30 locales have `tour` yet.
- **Fix:** Widened `useTranslation()`'s return type with the same `Partial<TourNamespace>` pattern, and made the hook itself apply the per-key English fallback for `tour` (`{ ...translations.en.tour, ...dict.tour }`) so `i18n.tour.*` both type-checks and behaves correctly (per-string fallback, not whole-object) ahead of 03-02.
- **Files modified:** `src/hooks/useTranslation.ts`
- **Verification:** `npx tsc --noEmit` — 0 errors; full `npx vitest run` — 72/72 passing; `npm run lint` — 0 warnings/errors
- **Committed in:** `a4942b6` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 3 — blocking TypeScript errors caused by the intentional single-locale rollout sequencing across this plan and 03-02)
**Impact on plan:** Both fixes were required for the build to compile and for `i18n.tour.replayLabel`/`getTourString` to behave correctly; no scope creep — no locale content, no a11y/mobile/RTL work was touched (that remains 03-02/03-03/03-04's scope).

## Issues Encountered
None beyond the two Rule 3 fixes documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `en.tour` namespace and `getTourString`/`useTranslation()` contracts are now the fixed target 03-02's 29 locale translations must match (same 19 keys, camelCase, no emoji).
- `startTour()` and `page.tsx` are fully rewired to `languageAtom`; 03-03 (keyboard a11y) and 03-04 (mobile/RTL) can build directly on top of the current `startTour()`/driver config without needing to touch the locale-source wiring again.
- No blockers. `npx tsc --noEmit`, `npx vitest run` (72/72), and `npm run lint` are all clean on the current tree.

---
*Phase: 03-localized-accessible-theme-aware-tour*
*Completed: 2026-07-04*
