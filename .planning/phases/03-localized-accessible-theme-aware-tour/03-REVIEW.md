---
phase: 03-localized-accessible-theme-aware-tour
reviewed: 2026-07-04T12:00:14Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - src/app/page.tsx
  - src/hooks/useTranslation.ts
  - src/lib/tourSteps.ts
  - src/lib/translations.ts
  - src/theme/tour.css
  - e2e/tour.spec.ts
  - src/lib/tourSteps.test.ts
  - src/lib/fns.test.ts
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 3: Code Review Report

**Reviewed:** 2026-07-04T12:00:14Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

Reviewed the localized/accessible/theme-aware driver.js tour hardening: the `tour` namespace addition across 30 locales, `getTourString`'s per-key English fallback, `useTranslation`'s widened `tour` type, the hydration-safe first-load device-language default, `startTour`'s `useCallback` wiring, `:focus-visible`/`prefers-reduced-motion`/RTL CSS, and the e2e/unit test coverage added for all of this.

The localization fallback design (`useTranslation`'s whole-object en-merge plus `getTourString`'s per-key en-merge) is sound and well-tested — `tourSteps.test.ts` verifies all 30 locales carry exactly the canonical 19-key `tour` namespace, and `fns.test.ts` covers `resolveTourLocale`'s exact/base-language/fallback resolution paths including malformed-tag defensiveness. `useCallback` dependencies for `startTour` are correct (`language` and `setTourSeen` are both listed and both actually used). The `languageAtom` write paths are all constrained to valid `Language` values (settings `<select>`, reset-to-`'en'`, device-resolved default), so despite `atomWithStorage` performing no runtime schema validation on the raw `localStorage['language']` string, every reachable code path degrades safely via the `translations.en` / `getTourString` fallback rather than crashing or rendering `undefined`.

The most significant issue found is a real, first-run-reproducible logic bug: `buildTourSteps` bakes a fixed `"{n} / 8"` progress label into each step *before* `startTour`'s DOM-presence filter runs, so on a fresh visitor (default `showDatePicker: false`), step 7's anchor (`tour-historical-date`) is silently dropped but step 8 still displays `"8 / 8"` — the progress counter skips a number and overstates how many steps were actually shown. No e2e test exercises the true default-settings auto-start path (all seed `tourSeen: true` and disable auto-start), so this gap was not caught. Also confirmed via `node_modules/driver.js/dist/driver.js.mjs` that driver.js renders `popover.title`/`popover.description` via `innerHTML`, not text — currently safe only because every string sourced through `getTourString`/`buildTourSteps` is a static translation-dictionary literal with no interpolation of runtime/user data; flagged as a latent risk for any future change that concatenates dynamic content into tour copy.

## Warnings

### WR-01: Tour progress counter becomes wrong/skips a number when an anchored step is filtered (e.g. default `showDatePicker: false`)

**File:** `src/app/page.tsx:196-211` (also `src/lib/tourSteps.ts:73-80`)
**Issue:** `buildTourSteps(language)` (`src/lib/tourSteps.ts:73-80`) bakes each feature step's `popover.progressText` as a fixed string (`` `${i + 1} / ${TOUR_STEP_COUNT}` ``, i.e. `"1 / 8"` … `"8 / 8"`) based on the step's *position in the full 8-step array*, before any DOM-presence check happens. `startTour` then filters `steps` by `document.querySelector(step.element)` (`src/app/page.tsx:202`) to silently drop steps whose anchor isn't currently rendered. `showDatePickerAtom` defaults to `false` (`src/lib/atoms.ts:17`), so the historical-date `<input>` (and its `data-tour="tour-historical-date"` anchor) is not in the DOM for any first-time visitor who hasn't opened Settings to enable it — this is the exact audience the auto-start tour targets. For that default-settings visitor, step 7 (`tour-historical-date`, baked as `"7 / 8"`) is filtered out, but step 8 (`tour-install`) still shows its pre-baked `"8 / 8"` label. The visible sequence becomes `"1/8, 2/8, ... 6/8, 8/8"` — jumping straight from 6 to 8, understating that only 7 of the claimed 8 steps were actually shown, and misrepresenting progress on the final (install) step. No e2e test exercises this: every test in `e2e/tour.spec.ts` seeds `tourSeen: true` and drives the tour manually via the replay button, and none of them seed/unseed `showDatePicker`, so the default-`false` case (the real first-run path) was never asserted against.
**Fix:** Recompute `progressText` from the *post-filter* index/length instead of baking it in ahead of time, e.g. compute it after filtering in `startTour`:
```ts
const filteredSteps = steps
  .filter((step) => !step.element || document.querySelector(step.element as string))
  .map((step) => { /* existing install-fallback swap */ return step; });

// Recompute progress text against the actual rendered feature-step count,
// not the pre-filter TOUR_STEP_COUNT constant.
const featureCount = filteredSteps.filter((s) => s.element).length;
let featureIndex = 0;
const renumberedSteps = filteredSteps.map((step) => {
  if (!step.element) return step; // welcome card keeps its own progressText
  featureIndex += 1;
  return { ...step, popover: { ...step.popover, progressText: `${featureIndex} / ${featureCount}` } };
});
```

### WR-02: driver.js renders `popover.title`/`popover.description` as `innerHTML`, not text — no current exploit path, but no guardrail against a future one

**File:** `src/lib/tourSteps.ts:59-80`, `src/app/page.tsx:210,235-237`
**Issue:** `node_modules/driver.js/dist/driver.js.mjs:365` sets `n.title.innerHTML = i` and `n.description.innerHTML = o` (and `n.nextButton.innerHTML`, `n.previousButton.innerHTML`, `n.progress.innerHTML` at line 363) rather than `textContent`/`innerText`. Every value currently passed through `getTourString`/`buildTourSteps` is a static string literal from `translations.ts` with no runtime interpolation, so there is no exploitable XSS today. However, nothing in `tourSteps.ts` or `page.tsx` documents this constraint or guards against it, so a future edit that concatenates any runtime value (e.g. a currency code, a URL param, a username) into a tour title/body/button string would introduce a stored/reflected-style HTML injection into the popover with no sanitization step in between.
**Fix:** Add a one-line comment at the top of `getTourString` (or `buildTourSteps`) documenting that driver.js renders these strings via `innerHTML`, and that any future dynamic content injected into tour copy MUST be HTML-escaped first (or routed through `textContent` on the rendered nodes post-hoc). Example:
```ts
// SECURITY: driver.js renders popover.title/description (and button text) via
// innerHTML, not textContent (node_modules/driver.js/dist/driver.js.mjs:363-365).
// Every value returned here MUST remain a static translation-dictionary literal;
// never interpolate runtime/user-controlled data into a tour string without
// HTML-escaping it first.
export const getTourString = (locale: Language, key: keyof TourNamespace): string => { ... }
```

### WR-03: `languageAtom` has no runtime validation against the 30 supported locales — relies entirely on fallback-by-convention, not by contract

**File:** `src/lib/atoms.ts:13`, `src/hooks/useTranslation.ts:17`, `src/lib/tourSteps.ts:29-32`
**Issue:** `languageAtom = atomWithStorage<Language>('language', 'en')` (`src/lib/atoms.ts:13`) only asserts the `Language` type at compile time; `atomWithStorage`'s underlying storage does `JSON.parse(localStorage.getItem('language'))` with no schema/enum check, so a corrupted, hand-edited, or stale `localStorage['language']` value (e.g. `"xx"`, `"null"`, an object) flows into every consumer as if it were a valid `Language`. Every current consumer happens to degrade safely (`translations[language as keyof typeof translations] || translations.en` in `useTranslation.ts:17`; `translationsWithOptionalTour[locale]?.tour?.[key] ?? translations.en.tour[key]` in `tourSteps.ts:31`; `RTL_LOCALES.has(language)` in `page.tsx:246` simply returns `false` for an unrecognized value), so there is no crash today — but this is fallback-by-accident (every call site individually happens to use `||`/`??`/`.has()` patterns that tolerate garbage) rather than a single validated boundary. A future consumer of `language` that doesn't follow the same defensive pattern (e.g. direct property access without a fallback) would break on this input.
**Fix:** Consider validating at the atom boundary once, e.g. via `atomWithStorage`'s `getOnInit`/custom storage validator (`unstable_withStorageValidator` is already exported by the installed `jotai/utils`), so `languageAtom` itself guarantees a member of `SUPPORTED_LOCALES` and every downstream consumer can rely on that invariant instead of re-deriving it. Not blocking for this phase since all current call sites are demonstrably safe, but worth tracking before more `language`-driven logic is added.

## Info

### IN-01: First-load device-default effect and tour auto-start effect share `hydrated` as their only synchronization signal

**File:** `src/app/page.tsx:157-163,289-293`
**Issue:** The device-language-default effect (`setLanguage(...)`) and the tour auto-start effect both gate on `hydrated` and run in the same commit once it flips to `true`. `setLanguage` triggers a Jotai state update that doesn't synchronously mutate the `language` variable already closed over by the `startTour` `useCallback` built during *this* render pass — so if `effectiveAll` were already truthy in the very same tick `hydrated` becomes `true` (not currently possible since `effectiveAll` depends on an SWR fetch or a post-hydration localStorage read, both of which take at least one more tick), the auto-start effect could theoretically call `startTour()` with the pre-device-default `language` value. Current data-fetching timing makes this practically unreachable, but the two effects have no explicit ordering guarantee beyond "declared in this file order, so they run in this order in the same commit" — a comment noting the dependency would help future maintainers who reorder effects.
**Fix:** Optional: add a short comment on the auto-start effect noting it must stay declared after the device-default effect, or make the dependency explicit by having the auto-start effect also gate on a "language resolved" flag rather than relying on effect declaration order.

### IN-02: `startTour`'s DOM-presence pre-filter can silently reduce the effective tour to fewer than the "8 required steps" (TOUR-06) with no logging/telemetry

**File:** `src/app/page.tsx:198-211`
**Issue:** Beyond the progress-numbering bug (WR-01), the filter itself means TOUR-06's "exactly 8 guided steps" requirement is not actually guaranteed at runtime — it is only true when every one of the 8 anchors happens to be present in the DOM. There's no dev-mode warning or telemetry hook to catch drift if a future markup change removes/renames a `data-tour` anchor (e.g. a typo in a `data-tour` string) — the tour would silently show fewer steps with no error surfaced anywhere.
**Fix:** Consider a `console.warn` (dev-only, matching this codebase's existing `console.error`-on-failure convention in `src/app/page.tsx:68,74`) when a step is filtered out, so a broken/renamed anchor is discoverable during development instead of silently degrading the tour in production.

### IN-03: Reset-to-defaults button clears `language`/`sortMode`/etc. from localStorage but not `tourSeen`

**File:** `src/components/CurrencyListModal.tsx:186-196`
**Issue:** The Settings "Reset" handler removes a fixed list of persisted keys (`baseCur`, `currency2Display`, `currencyValue`, `isEditing`, `isDefaultCurrencyValue`, `defaultCurrencyValue`, `defaultCurrencyValueDp`, `language`, `sortMode`, `theme`) and reloads the page, but `tourSeen` is not in that list. This isn't a regression introduced by this phase (the key list and reset button predate the tour work) and isn't in this phase's explicit contract, but since Phase 3 is the first time `tourSeen`/the tour's replay semantics have been under review, it's worth flagging: a user who hits "Reset" to get a clean slate will not see the first-run tour again, which may be surprising given every other preference is wiped.
**Fix:** Optional, low priority: add `'tourSeen'` to the reset key list if the intent of "Reset" is a full clean-slate experience.

---

_Reviewed: 2026-07-04T12:00:14Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
