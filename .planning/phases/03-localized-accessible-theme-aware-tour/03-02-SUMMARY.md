---
phase: 03-localized-accessible-theme-aware-tour
plan: 02
subsystem: i18n
tags: [i18n, translations, vitest, localization, driver.js]

# Dependency graph
requires:
  - phase: 03-localized-accessible-theme-aware-tour (plan 01)
    provides: "translations.en.tour namespace (19 keys), getTourString(locale, key) per-string fallback helper, buildTourSteps(locale) localized"
provides:
  - "tour: {...} namespace (19 keys) authored on all 29 non-English locale objects in translations.ts, matching en.tour's key set"
  - "Automated coverage + character-budget test (tourSteps.test.ts) enforcing all-30-locale tour completeness, title/body/button length budgets, and no-emoji"
  - "I18N-01 fully satisfied: all 30 supported locales render the tour in-language"
affects: [03-03-keyboard-a11y, 03-04-mobile-rtl]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Manual Unicode code-point range check (Array.from + codePointAt) for emoji detection in tests, instead of \\p{Extended_Pictographic} or regex /u flag, because tsconfig.json has no explicit `target` and plain `tsc --noEmit` defaults to a target too old for either feature"

key-files:
  created: []
  modified:
    - src/lib/translations.ts
    - src/lib/tourSteps.test.ts
    - src/hooks/useTranslation.ts

key-decisions:
  - "Widened useTranslation()'s TourNamespace/TranslationDictionary types to string-valued (mapped types) instead of pinning to en's exact `as const` literal types, since the old type only ever type-checked while en was the sole locale with a `tour` namespace — now that all 30 do, the literal-type intersection was structurally incompatible across locales"
  - "Fixed en.tour.doneBtn (\"Got it, let's go\", 16 chars) plus 8 more locales' doneBtn values that exceeded the UI-SPEC's own <=12-char button budget once the automated test enforced it — treated as a Rule 1 bug in the authoritative source, not worked around by excluding en/those locales from the test"

patterns-established:
  - "Coverage tests over SUPPORTED_LOCALES iterate the full 30-locale set with per-locale assertions (key-set equality, length budgets, emoji absence), giving a single automated gate for any future locale-namespace rollout in this codebase"

requirements-completed: [I18N-01]

# Metrics
duration: 22min
completed: 2026-07-04
---

# Phase 3 Plan 2: Localize Tour Copy Into All 30 Languages Summary

**Authored the `tour` namespace (19 keys) natively in all 29 non-English locales — including RTL Arabic and Urdu — and locked completeness plus the UI-SPEC's character budgets with a 6-assertion Vitest coverage test over all 30 `SUPPORTED_LOCALES`.**

## Performance

- **Duration:** 22 min
- **Started:** 2026-07-04T16:40:00Z
- **Completed:** 2026-07-04T17:02:00Z
- **Tasks:** 2 completed
- **Files modified:** 3

## Accomplishments
- All 30 supported locales (`en` + 29 authored this plan) now have a complete, tone/length-matched `tour` namespace in `translations.ts` — the tour renders fully in-language for every visitor, with English reserved as a genuine per-key fallback rather than the default experience (I18N-01)
- `ar` and `ur` authored in native Arabic/Urdu script (RTL popover layout itself remains 03-04's scope)
- A single `describe('tour namespace coverage', ...)` Vitest block now enforces, for every locale: namespace presence, exact 19-key parity with `en.tour`, title length (<=40), body length (<=110 Latin / <=55 CJK for zh-TW/zh-CN/ja/ko), button label length (<=12 in any locale), and no emoji — closing the "character-budget" pitfall with an automated gate instead of manual review of ~600 strings
- Caught and fixed 9 button-label budget violations (including one in the 03-01-authored English source) that only surfaced once the automated test existed, proving the value of Task 2's gate

## Task Commits

Each task was committed atomically:

1. **Task 1: Author `tour` namespace for all 29 non-English locales** - `8cbf541` (feat)
2. **Task 2: Coverage + character-budget test over all locales** - `60f0892` (test)

## Files Created/Modified
- `src/lib/translations.ts` - Added a `tour: {...}` block (19 keys, camelCase, no emoji, no HTML/concatenation) as the third sibling after `settings` in all 29 non-English locale objects; separately fixed 9 `doneBtn` values (`en` + 8 locales) that exceeded the 12-char button budget
- `src/lib/tourSteps.test.ts` - Added `describe('tour namespace coverage', ...)` with 6 `it` blocks iterating `SUPPORTED_LOCALES`: namespace-defined check, key-set-parity check, title-budget check, body-budget check, button-budget check, no-emoji check
- `src/hooks/useTranslation.ts` - Widened `TourNamespace`/`TranslationDictionary` to mapped `string`-valued types (Rule 3 fix, see below) so `tsc --noEmit` passes now that every locale (not just `en`) supplies a `tour` namespace

## Decisions Made
- Kept `en`, `home`, and `settings` untouched everywhere except the 9 `doneBtn` budget fixes, which were required for the plan's own acceptance-gate test to pass (the plan explicitly requires the coverage test to enforce and pass the <=12-char button budget "in any locale," and `en` is one of the 30 `SUPPORTED_LOCALES` iterated by that test)
- Used manual Unicode code-point range checks for emoji detection in the test rather than `\p{Extended_Pictographic}` or the regex `/u` flag, since this repo's `tsconfig.json` has no explicit `target` and plain `tsc --noEmit` (the plan's own specified verify command) defaults to a target too old for both features

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `useTranslation()` return type no longer type-checked once all 30 locales had `tour`**
- **Found during:** Task 1 verification (`npx tsc --noEmit`)
- **Issue:** `useTranslation()`'s return type was pinned to `typeof translations.en.tour` (all-literal, via `as const`). This only ever type-checked while `en` was the sole locale with a `tour` namespace (03-01's state); once every locale in Task 1 supplied its own literal-typed `tour` block, the structural-assignability check failed because e.g. Turkish's `home.title` literal string is not assignable to English's `home.title` literal string type.
- **Fix:** Widened `TourNamespace` to a mapped type with `string` values (`{ [K in keyof typeof translations.en.tour]: string }`) and `TranslationDictionary` to `Omit<typeof translations.en, 'tour'> & { tour?: Partial<TourNamespace> }`, keeping `home`/`settings` typed exactly as `en`'s shape (call sites never narrow on those literals) while only `tour` needed widening.
- **Files modified:** `src/hooks/useTranslation.ts`
- **Verification:** `npx tsc --noEmit` — 0 errors; full `npx vitest run` — 78/78 passing; `npm run lint` — 0 warnings/errors
- **Committed in:** `8cbf541` (Task 1 commit)

**2. [Rule 3 - Blocking] `\p{Extended_Pictographic}` / regex `/u` flag rejected by plain `tsc --noEmit`**
- **Found during:** Task 2 verification (`npx tsc --noEmit`)
- **Issue:** `tsconfig.json` has no explicit `target`, so plain `tsc --noEmit` (the plan's specified verify command) defaults to a target too old for both the Unicode property escape `\p{Extended_Pictographic}` and, separately, the regex `/u` flag itself — both produced `TS1501` errors.
- **Fix:** Replaced the regex-based emoji check with a manual `containsEmoji()` helper using `Array.from(value).some(...)` + `codePointAt(0)` against explicit code-point ranges (misc symbols/pictographs, dingbats, regional indicators) — surrogate-pair safe without requiring ES6+ regex features.
- **Files modified:** `src/lib/tourSteps.test.ts`
- **Verification:** `npx tsc --noEmit` — 0 errors; `npx vitest run src/lib/tourSteps.test.ts` — 20/20 passing
- **Committed in:** `60f0892` (Task 2 commit)

**3. [Rule 1 - Bug] 9 `doneBtn` values (including the 03-01-authored English source) exceeded the 12-char button budget**
- **Found during:** Task 2 verification (running the new coverage test against the Task 1 authored data)
- **Issue:** `en.tour.doneBtn` ("Got it, let's go", 16 chars) and 8 of the 29 locales authored in Task 1 (fr, it, pt, hi, pa, ur, vi, nl) exceeded the UI-SPEC's own stated <=12-char button-label budget — a budget violation in the authoritative English source that the automated test correctly caught rather than letting it slide as tribal knowledge.
- **Fix:** Shortened each to a terser equivalent preserving tone/register (e.g. `en`: "Got it, let's go" → "Let's go"; `fr`: "Compris, allons-y" → "Allons-y"; `vi`: "Rõ rồi, đi thôi" → "Bắt đầu"). Re-ran a standalone budget scan across all 30 locales/19 keys after the fix to confirm zero remaining violations before re-running the test.
- **Files modified:** `src/lib/translations.ts`
- **Verification:** `npx vitest run src/lib/tourSteps.test.ts` — 20/20 passing; full `npx vitest run` — 78/78 passing
- **Committed in:** `60f0892` (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (2 Rule 3 — blocking TypeScript/regex target-compatibility issues; 1 Rule 1 — pre-existing button-budget bug caught by the new test)
**Impact on plan:** All three fixes were required for the plan's own acceptance gates (`tsc --noEmit` clean, coverage test passing) to be met. No scope creep — no a11y, mobile, RTL layout, or engine changes were touched (those remain 03-03/03-04's scope). The `en.tour.doneBtn` fix touches a string 03-01 authored, but only because the plan's own Task 2 test explicitly requires <=12-char buttons "in any locale" including `en`.

## Issues Encountered
None beyond the three deviations documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 30 locales now have complete, budget-compliant `tour` copy; `buildTourSteps(locale)` / `getTourString(locale, key)` from 03-01 resolve correctly for every supported language with zero missing-key fallback in normal operation.
- Spot-checked: `buildTourSteps('ar')[1].popover.title` returns the Arabic step-1 title (`حدد عملتك الأساسية`); `de` button labels (`Weiter`/`Zurück`/`Los geht's`) all fit the 12-char budget.
- 03-03 (keyboard a11y) and 03-04 (mobile/RTL) can build directly on this fully localized copy set — 03-04's RTL visual QA for `ar`/`ur` popover layout is the next place this plan's Arabic/Urdu strings will be exercised end-to-end.
- No blockers. `npx tsc --noEmit`, `npx vitest run` (78/78), and `npm run lint` are all clean on the current tree.

---
*Phase: 03-localized-accessible-theme-aware-tour*
*Completed: 2026-07-04*

## Self-Check: PASSED

- FOUND: src/lib/translations.ts
- FOUND: src/lib/tourSteps.test.ts
- FOUND: src/hooks/useTranslation.ts
- FOUND: .planning/phases/03-localized-accessible-theme-aware-tour/03-02-SUMMARY.md
- FOUND commit: 8cbf541
- FOUND commit: 60f0892
