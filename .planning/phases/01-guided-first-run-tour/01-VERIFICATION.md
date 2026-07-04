---
phase: 01-guided-first-run-tour
verified: 2026-07-04T12:00:00Z
status: human_needed
score: 12/12 must-haves verified (automated); 1 manual QA item outstanding
overrides_applied: 0
human_verification:
  - test: "Walk all four dismissal paths in a real browser (Done on step 8, Skip/close button, Escape key, overlay click) with localStorage cleared beforehand"
    expected: "After each path, in a fresh session: localStorage.getItem('tourSeen') === 'true' and the overlay closes immediately; reloading / shows no tour overlay"
    why_human: "Requires live browser interaction (keyboard focus, click targets, DOM timing) that cannot be confirmed by static analysis of driver.js's runtime event wiring; this was explicitly flagged as manual-QA-only in 01-03-PLAN.md's own acceptance criteria and was not re-performed by the executor (SUMMARY: 'the full four-path manual walkthrough is recommended before/during Phase 1 sign-off but was not re-performed here')"
  - test: "Load / on a browser/profile with zero prior localStorage state and visually confirm the tour auto-starts after the skeleton disappears, with no flash of an unstyled/mismatched popover, and that clicking the spotlighted base-currency row during its step does NOT change the base currency (disableActiveInteraction)"
    expected: "Welcome card appears centered; step 1 spotlights the base row; UI is visually blocked from interaction while a step is active"
    why_human: "Visual/interaction-timing confirmation; disableActiveInteraction:true is present in source (page.tsx:192) but its runtime click-blocking effect is a driver.js behavior best confirmed visually"
---

# Phase 1: Guided First-Run Tour Verification Report

**Phase Goal:** A first-time visitor lands on `/`, the tour auto-starts, and they can walk through all 8 key interactions (or skip out) without it ever auto-running again.
**Verified:** 2026-07-04
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | On a browser with no prior visit, loading `/` auto-starts the tour after hydration (no flash/mismatch), highlighting the first anchor | ✓ VERIFIED | `src/app/page.tsx:160-219` — effect early-returns unless `hydrated && effectiveAll && !tourSeen && !tourStartedRef.current` (line 161); `hydrated` only flips true in a post-mount `useEffect` (line 119); `effectiveAll` is the same variable gating the loading-skeleton branch (line 332), so the tour cannot start while the skeleton renders; `navigator.languages` read is guarded by `typeof navigator !== 'undefined'` (line 164) — no render-body/SSR read |
| 2 | The tour visits all 8 anchors in order, each spotlighting a dedicated `data-tour="..."` element (not a translated `aria-label`) | ✓ VERIFIED | `src/lib/tourSteps.ts:31-72` defines the 8 selectors in UI-SPEC order; cross-checked 1:1 against live DOM: `CurrencyRow.tsx:73` (`tour-base-row`, conditional on `isBase`), `CurrencyRow.tsx:97` (`tour-amount-input`), `SearchBar.tsx:97` (`tour-search`), `CurrencyListModal.tsx:248` (`tour-list-settings`), `page.tsx:360` (`tour-share`), `ThemeToggle.tsx:23` (`tour-theme-toggle`), `page.tsx:386` (`tour-historical-date`), `InstallButton.tsx:33` (`tour-install`, always-rendered wrapper). All stack alongside pre-existing `aria-label`/`title`, none replace them. `tourSteps.test.ts` asserts the exact ordered selector list and `buildTourSteps('en').length === 9` (welcome + 8) |
| 3 | The visitor can step forward and backward through the tour at will, and the current step is always visually clear | ✓ VERIFIED | `driver({ nextBtnText: 'Next', prevBtnText: 'Back', allowKeyboardControl: true, showProgress: true, ... })` (`page.tsx:187-211`); driver.js's own step engine (`node_modules/driver.js/dist/driver.js.mjs:544-554`) shows `next`/`previous` by default and only disables `previous` when there is no prior step (`disableButtons: [...a ? [] : ["previous"]]`) — confirms Back is available from step 2 onward and auto-hidden on step 1/welcome, matching D-01/TOUR-05 intent. `showProgress: true` + per-step `progressText` (`'{n} / 8'`, `tourSteps.ts:97`) makes current position visually explicit |
| 4 | Dismissing/skipping at any step immediately closes the overlay and persists a "seen" flag via a new `atomWithStorage` in `src/lib/atoms.ts`, so the tour does not auto-start on next visit/reload | ✓ VERIFIED | `src/lib/atoms.ts:16` — `export const tourSeenAtom = atomWithStorage<boolean>('tourSeen', false);` (new atom, correct key). All three exit paths in `page.tsx` call `setTourSeen(true)`: `onDoneClick` (line 201), `onCloseClick` (line 205), `onDestroyed` (line 209) — `grep -c 'setTourSeen(true)'` = 3. `allowClose: true` + `overlayClickBehavior: 'close'` (lines 189-190) enables Escape/overlay-click dismissal per driver.js defaults, funneled through the same close path that fires `onCloseClick`/`onDestroyed` |
| 5 | Reloading `/` after completing or skipping the tour shows the app with no tour overlay | ✓ VERIFIED | `tourSeenAtom` is `atomWithStorage` (persists to `localStorage['tourSeen']`); the tour-start effect's guard clause (`page.tsx:161`) checks `tourSeen` before any `driver()` call — once true and persisted, the effect returns immediately on every subsequent mount/reload |
| 6 (D-05) | Device-language resolution wired: `navigator.languages` → nearest of 30 supported locales → `en` fallback, SSR-guarded | ✓ VERIFIED | `src/lib/fns.ts:192-217` — pure `resolveTourLocale(navLangs, supported, fallback)`, no internal `navigator` read; called at `page.tsx:164` behind `typeof navigator !== 'undefined'` guard. 4 unit tests cover exact-match, base-language fallback (`Intl.Locale`), unsupported-fallback, and empty-input cases — all pass (`npx vitest run` confirms) |

**Score:** 6/6 truths verified (all Roadmap Success Criteria + D-05 device-language decision)

### Deferred Items (correctly out of scope this phase)

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Full 30-locale tour copy (I18N-01) | Phase 3 | `tourSteps.ts:79-81` — `buildTourSteps(locale)` accepts and threads `locale` but returns English regardless (`void locale;`); ROADMAP Phase 3 success criterion 1: "Switching the app's active language changes all tour step titles/body copy... for all 30 supported locales" |
| 2 | Full keyboard-a11y audit + visible focus states | Phase 3 | ROADMAP Phase 3 success criterion 2; Phase 1 only enables `allowKeyboardControl: true` (driver.js default keyboard nav), not a full audit |
| 3 | Mobile/touch viewport hardening | Phase 3 | ROADMAP Phase 3 success criterion 4 |
| 4 | Persistent "?" replay control (TOUR-03) | Phase 2 | ROADMAP Phase 2 goal; `01-CONTEXT.md` reserves `tour-replay`/`tour-help` `data-tour` names, unused in Phase 1 as designed |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` | `driver.js` pinned as explicit dependency | ✓ VERIFIED | `"driver.js": "^1.6.0"` present, line 17, alphabetically placed |
| `src/lib/atoms.ts` | `tourSeenAtom` (atomWithStorage boolean, key `'tourSeen'`, default false) | ✓ VERIFIED | Line 16, exact shape |
| `src/lib/fns.ts` | `resolveTourLocale` pure function | ✓ VERIFIED | Lines 192-217, no `navigator` read inside |
| `src/lib/tourSteps.ts` | `buildTourSteps(locale)` + `TOUR_STEP_COUNT` + step copy with `data-tour` selectors | ✓ VERIFIED | Lines 7, 31-72, 79-102; 8 unit tests pass |
| `src/theme/tour.css` | driver.js class overrides using `oklch(var(--token))` | ✓ VERIFIED | 96 lines, `.driver-popover*` classes all use `oklch(var(--` tokens, zero hardcoded hex on popover surface/text/accent, no `@tailwind` directive |
| `src/app/layout.tsx` | static CSS imports for driver.js and tour.css | ✓ VERIFIED | Lines 1-3: `globals.css` → `driver.js/dist/driver.css` → `@/theme/tour.css`, correct order |
| `src/components/CurrencyRow.tsx` | `tour-base-row` (conditional isBase) + `tour-amount-input` | ✓ VERIFIED | Lines 73, 97 |
| `src/components/SearchBar.tsx` | `tour-search` | ✓ VERIFIED | Line 97 |
| `src/components/CurrencyListModal.tsx` | `tour-list-settings`; `<dialog>` untouched | ✓ VERIFIED | Line 248; `showModal()` (line 238) only bound to the button's own `onClick`, never called from the tour effect (`grep -c showModal src/app/page.tsx` = 0) |
| `src/components/ThemeToggle.tsx` | `tour-theme-toggle` | ✓ VERIFIED | Line 23 |
| `src/components/InstallButton.tsx` | always-rendered `tour-install` wrapper (early null-return removed) | ✓ VERIFIED | Wrapper `<div data-tour="tour-install">` unconditional; `if (!deferred) return null` no longer present; inner `<button>` now conditional on `{deferred && (...)}` |
| `src/app/page.tsx` | tour-start effect (gate, guard, locale, filter, driver config, seen-flag, cleanup) | ✓ VERIFIED | Lines 160-219, all sub-behaviors present (see Key Link table) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `tourSteps.ts` | `translations.ts` | `SUPPORTED_LOCALES = Object.keys(translations)` | ✓ WIRED | `tourSteps.ts:11`; test confirms length 30 |
| `layout.tsx` | `tour.css` | static import after `driver.css`/`globals.css` | ✓ WIRED | Correct order, lines 1-3 |
| `page.tsx` tour effect | `tourSteps.ts buildTourSteps` | `buildTourSteps(resolveTourLocale(...))` | ✓ WIRED | Line 164-166 |
| `page.tsx` tour effect | `atoms.ts tourSeenAtom` | `setTourSeen(true)` in `onDoneClick`/`onCloseClick`/`onDestroyed` | ✓ WIRED | 3 call sites confirmed |
| `page.tsx` tour effect | live DOM anchors | `document.querySelector(step.element)` pre-filter | ✓ WIRED | Lines 171-181; missing anchors silently dropped, welcome step (no `element`) always kept, install step never dropped (fallback description swap instead) |
| `page.tsx` tour effect | `driver.js` | `driver({...}).drive()` + `.destroy()` on unmount | ✓ WIRED | Lines 187-218; cleanup returns `driverObj?.destroy()` |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| driver.js `previous` button auto-disables on first/welcome step only | `grep -n "disableButtons: \[...a ? \[\] : \[\"previous\"\]\]" node_modules/driver.js/dist/driver.js.mjs` | Found at line 554 | ✓ PASS |
| No `showModal()` call from tour code (settings dialog never auto-opens) | `grep -c showModal src/app/page.tsx` | `0` | ✓ PASS |
| `setTourSeen(true)` fires on all 3 documented exit paths | `grep -c 'setTourSeen(true)' src/app/page.tsx` | `3` | ✓ PASS |
| `driver.js` pinned | `grep -n '"driver.js"' package.json` | `"driver.js": "^1.6.0"` | ✓ PASS |
| Production build succeeds | `npm run build` | Compiled successfully, 24/24 static pages generated, only a pre-acknowledged `exhaustive-deps` ESLint warning (intentional, `setTourSeen` is referentially stable) | ✓ PASS |
| Full test suite passes | `npx vitest run` | `7 files, 64 tests passed` (matches SUMMARY claim exactly) | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| TOUR-01 | 01-03 | First-time visitor sees tour auto-start on first load of `/` | ✓ SATISFIED | `page.tsx:160-219` gated effect |
| TOUR-02 | 01-01 | Tour auto-starts at most once per browser via persisted "seen" flag | ✓ SATISFIED | `tourSeenAtom` (atoms.ts:16) + gate at page.tsx:161 |
| TOUR-04 | 01-03 | Skip/dismiss at any step closes overlay immediately + sets "seen" flag | ✓ SATISFIED | `onDoneClick`/`onCloseClick`/`onDestroyed` all call `setTourSeen(true)`; `allowClose`/`overlayClickBehavior` cover Escape/overlay-click |
| TOUR-05 | 01-03 | User can move forward and backward between tour steps | ✓ SATISFIED | driver.js default Next/Back footer buttons + `allowKeyboardControl: true` |
| TOUR-06 | 01-01, 01-02 | 8 guided steps, each anchored to a stable non-translated `data-tour` target | ✓ SATISFIED | 8/8 selectors defined (tourSteps.ts) and live on DOM (5 components + page.tsx), all stacked alongside existing aria-labels, none translated |

No orphaned requirements — REQUIREMENTS.md maps only TOUR-01/02/04/05/06 to Phase 1, all five accounted for above.

### Anti-Patterns Found

None. Scanned all 11 phase-modified files (`page.tsx`, `tourSteps.ts`, `atoms.ts`, `fns.ts`, `tour.css`, `layout.tsx`, and the 5 anchor components) for `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER` and placeholder/stub language — zero matches.

### Human Verification Required

### 1. Four-path dismissal walkthrough (localStorage persistence)

**Test:** Clear `localStorage`, load `/` in a real browser, and in four separate fresh sessions: (a) walk to step 8 and click "Got it, let's go"; (b) click the Skip/close control at any step; (c) press Escape; (d) click the dimmed overlay outside the popover.
**Expected:** Each path closes the overlay immediately; `localStorage.getItem('tourSeen') === 'true'` after each; reloading `/` afterward shows no tour overlay.
**Why human:** This is a runtime/DOM-timing behavior of driver.js's internal event wiring (Escape/overlay-click funnel through `allowClose`/`overlayClickBehavior` into the registered callbacks) that cannot be fully confirmed by static source inspection alone. The plan itself (`01-03-PLAN.md` line 223) flags this exact check as "Manual QA... could not be fully confirmed by static analysis," and the SUMMARY explicitly states it was not re-performed by the executor.

### 2. Visual auto-start + blocked-interaction confirmation

**Test:** On a browser/profile with no prior visit, load `/` and observe: the tour auto-starts only after the skeleton disappears (no flash of an unstyled popover or FOUC), the welcome card appears centered, and clicking the spotlighted base-currency row during its step does not change the selected base currency.
**Expected:** No visual flash/mismatch; base currency unchanged when the spotlighted row is clicked during its step.
**Why human:** Visual timing and click-blocking behavior (`disableActiveInteraction: true`) are runtime/visual properties; the source flag is present and correctly configured (`page.tsx:192`) but its live effect is best confirmed by eye.

### Gaps Summary

No automated gaps found. Every Roadmap Success Criterion, every PLAN must-have truth/artifact/key-link, and both locked decisions in scope (D-01 through D-05) are backed by direct code evidence — not merely SUMMARY claims. `npm run build` and the full `npx vitest run` (64/64 tests) were independently re-run during this verification and passed, matching the SUMMARY's reported numbers exactly. The only outstanding items are two manual/visual QA checks that the phase's own plan explicitly could not verify via static analysis and explicitly deferred to human sign-off — this is a `human_needed` classification, not a gap in the implementation.

---

_Verified: 2026-07-04_
_Verifier: Claude (gsd-verifier)_
