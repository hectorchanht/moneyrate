# Phase 3: Localized, Accessible, Theme-Aware Tour - Research

**Researched:** 2026-07-04
**Domain:** i18n rewiring, keyboard a11y hardening, mobile CSS, and RTL for an EXISTING driver.js 1.6.0 tour (no new engine/architecture decisions)
**Confidence:** HIGH

## Summary

This is a delta phase: the tour engine, 8 anchored steps, and `startTour()` entry point already ship and work (Phases 1–2, verified in git history). Phase 3 does four narrowly-scoped things: (1) rewires the tour's locale source from `navigator.languages` to the app's `languageAtom`, and adds a first-load device-language default to that atom; (2) adds a `tour` i18n namespace to all 30 locale objects in `translations.ts` with per-string English fallback; (3) hardens keyboard a11y with `:focus-visible` rings, focus restoration, and `prefers-reduced-motion` handling; (4) fixes a fixed-width mobile popover and adds scoped RTL support for `ar`/`ur`.

The single most important finding from reading the actual installed driver.js 1.6.0 source (`node_modules/driver.js/dist/driver.js.mjs`, not just its `.d.ts` or docs) is that **driver.js already implements focus capture-and-restore on every `drive()` call**: `document.activeElement` is captured the instant `drive()` runs (before the first step highlights) and is refocused automatically when the tour is destroyed via any exit path (`onDoneClick`, `onCloseClick`, `onDestroyed`, Escape, overlay click). This is a genuine, verified engine behavior — not documented prominently on driverjs.com, but plainly present in the shipped code. It means D-07's "focus restoration" requirement is **very likely already satisfied by the engine with zero new code**, and the planner's job is to verify this in a live QA pass rather than hand-roll a `restoreFocus()` closure. This changes the shape of the D-07 implementation task significantly from what the UI-SPEC assumed.

The second key finding is that driver.js's own Tab-key focus trap (lines 316-319 of the minified source) computes its focusable-element list from `[popover.wrapper, activeElement]` via a `f(...)` helper (a focusable-elements finder) every keypress — meaning the "?" replay button, which lives outside the popover, is never part of the trap and needs no special handling beyond the plan's own focus-restore verification. Also confirmed: `allowKeyboardControl` (already `true` in the existing config) gates Escape/ArrowLeft/ArrowRight, and this is independent of the Tab-trap, which is unconditional.

**Primary recommendation:** Treat D-07's "focus restoration" as **verify-first, code-second** — write a Playwright test that asserts focus returns to the "?" button after Escape/Done/overlay-click before writing any new restoration logic; only add manual restoration if the test proves the built-in behavior insufficient (e.g., because `tourDriverRef.current?.destroy()` is called imperatively from a *second* `startTour()` invocation before the user ever interacts with the popover, which may capture the wrong `activeElement`). Everything else in this phase (i18n plumbing, CSS-only changes, RTL popover flip) is low-risk, well-precedented in this codebase's existing patterns, and should proceed as scoped in `03-CONTEXT.md`/`03-UI-SPEC.md`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Tour locale resolution | Client (React state / Jotai atom) | — | `languageAtom` is a client-only `atomWithStorage`; no server involvement in a client-only app |
| First-load device-language default | Client (one-time effect) | — | Must read `navigator.languages`, browser-only API; gated behind `hydrated` to avoid SSR mismatch |
| Tour copy (30 locales) | Client (static data module) | — | `translations.ts` is a plain TS object bundled into the client JS; no i18n server/CDN routing in this app |
| Keyboard a11y (focus rings, restoration, reduced motion) | Browser / Client CSS + DOM | — | `:focus-visible`, `prefers-reduced-motion`, and `document.activeElement` are all browser-native mechanisms; no framework layer involved |
| Mobile popover width | Browser / Client CSS | — | Pure CSS `max-width` formula; no JS breakpoint logic needed (confirmed: `useWindowWidth` hook exists but is not required for this fix) |
| RTL popover direction | Browser / Client (imperative DOM + CSS) | — | driver.js's popover is a detached DOM node appended to `document.body` outside React's tree; must be set imperatively via `onPopoverRender`, not via a React prop |

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Tour locale source (reconciles Phase-1 D-05 vs Phase-3 SC1)**
- D-01: The tour reads its locale from the app's `languageAtom` (via `useTranslation()` / `translations[language]`), the SAME source the rest of the UI uses. Single source of truth — the tour ALWAYS matches the visible chrome, and switching language in Settings changes tour copy (satisfies SC1).
- D-02: This retires the Phase-1 D-05 "device-language-first" path for the tour. `startTour()` must stop reading `navigator.languages` directly to pick tour copy; it uses the active `languageAtom` instead. `resolveTourLocale` is repurposed per D-03 (not deleted).

**LANG-01 pulled into this phase (app-wide device-language default)**
- D-03: On first load only (no stored `language` key in localStorage), default `languageAtom` to the device locale: `resolveTourLocale(navigator.languages, SUPPORTED_LOCALES, 'en')`. A stored user choice ALWAYS wins thereafter. SSR/hydration caution: do NOT compute the device default at module-eval time in `atoms.ts`. Set it on first client mount behind the existing `hydrated` flag in `page.tsx`, only when no stored value exists. Exact mechanism is Claude's discretion but MUST be hydration-safe.

**Translation storage & consumption**
- D-04: Add a `tour: {...}` namespace to each of the 30 locale objects in `src/lib/translations.ts`, parallel to `home`/`settings`. `buildTourSteps(locale)` reads `translations[locale].tour`, with per-string fallback to `translations.en.tour` for any missing key.
- D-05: Full localization surface: welcome card (title + description), all 8 feature steps (title + description each), Next/Back/Done button labels (currently hardcoded English at `src/app/page.tsx:203-205`), and `TOUR_INSTALL_FALLBACK_DESCRIPTION`. Nothing tour-facing stays hardcoded English.

**Translation authoring**
- D-06: Claude authors all 30 locales this phase — English first, then generated translations matching tone/length of existing `home`/`settings` entries. Native-speaker review is a non-blocking follow-up.

**Keyboard accessibility (A11Y-01)**
- D-07: Build on driver.js's built-in keyboard nav and focus trap — do NOT reimplement them. Add exactly three things:
  1. `:focus-visible` outline rings, theme-aware (`oklch(var(--p))`), on popover Next/Back/Done/close buttons AND the "?" replay button, authored in `src/theme/tour.css`.
  2. Focus restoration: on tour close/done, return focus to the "?" replay button (or the element that triggered the tour).
  3. `prefers-reduced-motion`: disable driver.js animation and `smoothScroll` when set.

**Mobile / touch (A11Y-02)**
- D-08: Guarantee all 8 popovers fit narrow (~320–375px) viewports via responsive width — cap `.driver-popover` at `max-width: min(320px, calc(100vw - 2rem))`. Keep driver.js's auto side-placement and `smoothScroll: true`. Only hand-set a per-step `side` where mobile QA shows auto-placement visibly misplacing a popover.

### Claude's Discretion
- Exact hydration-safe mechanism for the first-load device-language default (D-03).
- Exact `:focus-visible` ring width/offset and how focus restoration is wired.
- Per-language translation wording (author + generate; keep concise, ≤ current English lengths where possible for mobile fit).
- Whether any single step needs an explicit mobile `side` after QA (D-08).

### Deferred Ideas (OUT OF SCOPE)
- Tours for `/chart` and `/convert/[pair]` — TOUR-07, v2.
- Contextual/just-in-time tips beyond the linear tour — TOUR-08, v2.
- App-wide RTL layout support (`dir="rtl"` for `ar`/`ur` across the whole app) — beyond this phase; only the tour popover's RTL rendering is checked here.
- Native-speaker review of the 30 machine-authored tour translations — non-blocking follow-up.

Note: LANG-01 is NOT deferred — it was explicitly pulled into this phase (D-03).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| I18N-01 | Tour copy renders in the user's active language across all 30 supported locales, via `translations.ts`/`useTranslation()`, falls back to English when a string is missing | §Standard Stack (i18n namespace pattern), §Architecture Patterns Pattern 1 (per-string fallback helper), §Code Examples (getTourString), §Common Pitfalls 1 & 2 |
| A11Y-01 | Tour is fully keyboard-operable (advance, back, dismiss) and honors the active light/dark theme | §Common Pitfalls 3 (driver.js's built-in focus trap/restore — verify before rebuilding), §Code Examples (focus-visible CSS, reduced-motion), §Architecture Patterns Pattern 2 |
| A11Y-02 | Tour renders correctly on mobile/touch viewports without breaking responsive layout | §Common Pitfalls 4 (touch target floor), §Code Examples (responsive max-width), §Mobile section evidence from driver.css defaults |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Client-only Next.js 14 App Router, React 18, TypeScript, Jotai, SWR, DaisyUI + Tailwind — all tour code must remain `"use client"`.
- driver.js is the locked tour engine (already installed, `^1.6.0`) — no engine swap, no new tour library.
- Anchors: `data-tour` attributes ONLY, never translated `aria-label`s — this phase must not introduce any new selector based on translated text (e.g. do not select the "?" button by its localized `aria-label`/`title`).
- No backend — "seen" state (`tourSeenAtom`) and language (`languageAtom`) are `localStorage`-only via `atomWithStorage`, unchanged mechanism this phase.
- i18n: tour copy must be added to all 30 language dictionaries in `src/lib/translations.ts` — no partial-locale onboarding.
- Accessibility: keyboard-navigable and dismissible, consistent with existing a11y work (commit `7daf09d`, which used bare `focus:outline` on `CurrencyRow.tsx:107` — note this phase's new UI-SPEC-mandated pattern is `:focus-visible`, a stricter/more modern convention than that prior commit; this is an intentional improvement, not a regression, and should not be "fixed" backward to match the older pattern).
- TypeScript strict mode; single quotes; 2-space indent; `@/*` path alias for cross-directory imports; named exports for lib/utility modules (no default export for `translations.ts`, `atoms.ts`, `fns.ts`, `tourSteps.ts`).
- `@typescript-eslint/no-explicit-any` is off project-wide — not needed for this phase's typed `Language`/`DriveStep` work regardless.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| driver.js | 1.6.0 (installed — confirmed via `node_modules/driver.js/package.json` and `package.json`) [VERIFIED: npm registry via local install inspection] | Tour engine — unchanged this phase | Already locked, already installed, no engine research needed |
| jotai | ^2.12.3 (installed) [VERIFIED: package.json] | `languageAtom`, `tourSeenAtom` via `atomWithStorage` | Existing state layer, unchanged mechanism |

### Supporting
No new libraries are required for this phase. All four workstreams (i18n namespace, focus-visible CSS, reduced-motion CSS, RTL popover flip) are achievable with existing dependencies plus native browser CSS/DOM APIs (`:focus-visible`, `prefers-reduced-motion` media query, `Intl.Locale`, `document.activeElement`, driver.js's `onPopoverRender` hook).

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual focus-restore closure (`restoreFocus()`) | Rely on driver.js's built-in `document.activeElement` capture-and-restore (verified in source, see Common Pitfalls) | Manual closure is redundant work and risks double-restoring focus (fires twice, second call is a no-op but adds unnecessary code) if the built-in behavior already satisfies D-07 — verify via Playwright test first |
| `atomWithStorage`'s `getOnInit` option for the D-03 device default | A one-time `useEffect` gated on `hydrated`, checking `getDataFromLocalStorage('language', null) === null` | `getOnInit` (confirmed via `node_modules/jotai/vanilla/utils/atomWithStorage.d.ts`) only controls *whether* the atom reads from storage on init vs. deferring to a later subscribe — it has no hook for computing an alternate default value from `navigator.languages`. It is the wrong primitive for D-03; the UI-SPEC's own recommended effect-based approach is correct and is the only viable option here |
| Setting `dir="rtl"` on `<html>`/`<body>` | Setting `dir="rtl"` only on `.driver-popover` via `onPopoverRender` | App-wide `dir` would satisfy RTL more completely but is explicitly out of scope (deferred) — the popover is a detached DOM node outside React's tree, so scoping to it requires the imperative hook regardless |

**Installation:**
No new packages required. Existing `driver.js@^1.6.0` and `jotai@^2.12.3` cover 100% of this phase's technical surface.

**Version verification:** `npm view driver.js version` was not run because the package is already installed and its exact version was confirmed directly from `node_modules/driver.js/package.json` (`"version": "1.6.0"`), which is the authoritative source of truth for what ships in this build — more reliable than a registry query for confirming installed behavior.

## Package Legitimacy Audit

Not applicable — this phase installs no new external packages. All work uses driver.js 1.6.0 and jotai 2.12.3, both already present in `package.json`/`node_modules` and locked by prior phases.

## Architecture Patterns

### System Architecture Diagram

```
navigator.languages (browser, read once)
        │
        ▼
┌───────────────────────────┐        stored?        ┌──────────────────┐
│ resolveTourLocale()        │──── first-load only ─▶│ languageAtom      │◀── Settings UI
│ (pure fn, src/lib/fns.ts) │   (gated: hydrated &&  │ atomWithStorage   │    (existing,
└───────────────────────────┘    no stored 'language'│ 'language','en')  │     unchanged)
                                  key)                └─────────┬────────┘
                                                                  │ read
                                                                  ▼
                                                        ┌───────────────────┐
                                                        │ useTranslation()   │
                                                        │ translations[lang] │
                                                        └─────────┬──────────┘
                                                                  │ (Home component
                                                                  │  reads languageAtom
                                                                  │  directly for tour)
                                                                  ▼
                                                        ┌───────────────────────┐
                                                        │ startTour(language)    │
                                                        │ src/app/page.tsx       │
                                                        └─────────┬──────────────┘
                                                                  │ calls
                                                                  ▼
                                                        ┌───────────────────────┐
                                                        │ buildTourSteps(locale) │
                                                        │ src/lib/tourSteps.ts   │
                                                        │  reads translations    │
                                                        │  [locale].tour.*, per- │
                                                        │  string en fallback    │
                                                        │  (getTourString)       │
                                                        └─────────┬──────────────┘
                                                                  │ DriveStep[]
                                                                  ▼
                                                        ┌───────────────────────┐
                                                        │ driver({ steps, ... }) │
                                                        │  .drive()              │
                                                        │  - captures            │
                                                        │    activeElement       │
                                                        │    (built-in)          │
                                                        │  - onPopoverRender:    │
                                                        │    set dir="rtl" if    │
                                                        │    ar/ur (imperative,  │
                                                        │    scoped to popover)  │
                                                        └─────────┬──────────────┘
                                                                  │ renders detached
                                                                  │ DOM node on
                                                                  │ document.body
                                                                  ▼
                                                        ┌───────────────────────┐
                                                        │ .driver-popover (CSS)  │
                                                        │  tour.css:             │
                                                        │  - max-width formula   │
                                                        │  - :focus-visible ring │
                                                        │  - prefers-reduced-    │
                                                        │    motion block        │
                                                        │  - [dir=rtl] footer    │
                                                        │    flex-reverse        │
                                                        └───────────────────────┘
                                                                  │ on destroy
                                                                  ▼
                                                        driver.js restores focus to
                                                        captured activeElement
                                                        (built-in, verify not rebuild)
```

### Recommended Project Structure
No new files. All changes land in existing files per the UI-SPEC's Component Inventory table:
```
src/
├── lib/
│   ├── translations.ts   # + tour: {...} × 30 locale objects (D-04/05/06)
│   ├── tourSteps.ts       # buildTourSteps reads translations[locale].tour + getTourString helper
│   └── atoms.ts           # languageAtom unchanged mechanism; default now set via effect, not here
├── app/
│   └── page.tsx           # startTour() locale param; new first-load-default effect; reduced-motion + RTL wiring
└── theme/
    └── tour.css           # responsive max-width, :focus-visible rules, reduced-motion block, [dir=rtl] rule
```

### Pattern 1: Per-string i18n fallback helper (`getTourString`)
**What:** A small helper that looks up one key in the active locale's `tour` namespace, falling back to `en` only for that specific key — not swapping the whole object.
**When to use:** Every call site in `buildTourSteps` and every button-label/aria-label lookup in `page.tsx`.
**Example:**
```typescript
// src/lib/tourSteps.ts — new helper, pattern matches existing useTranslation()
// fallback-to-en convention (src/hooks/useTranslation.ts:6)
import { translations } from './translations';
import type { Language } from './types';

type TourNamespace = typeof translations.en.tour;

export const getTourString = (locale: Language, key: keyof TourNamespace): string => {
  const localeDict = translations[locale]?.tour as Partial<TourNamespace> | undefined;
  return localeDict?.[key] ?? translations.en.tour[key];
};
```
This mirrors the existing `useTranslation()` whole-object fallback (`translations[language] || translations.en`, `src/hooks/useTranslation.ts:6`) but operates per-key as D-04/UI-SPEC's fallback mechanism requires, since a locale may have the `tour` object present but missing one new key (e.g. added in a future phase) without falling back entirely.

### Pattern 2: Reading `languageAtom` directly in a non-hook callback (`startTour`)
**What:** `startTour` is a `useCallback` in a client component; it currently computes `locale` internally via `resolveTourLocale(navigator.languages, ...)`. Per D-01/D-02, it must read `languageAtom`'s current value instead.
**When to use:** Since `page.tsx`'s `Home` component already has `useAtom` calls for other atoms in its render body, the cleanest approach is to destructure `languageAtom` at the top of `Home` (same as `baseCurAtom`, `tourSeenAtom`, etc.) and close over it in `startTour`'s `useCallback` dependency array — exactly the pattern already used for `setTourSeen`.
**Example:**
```typescript
// src/app/page.tsx — inside Home(), alongside existing useAtom calls
const [language] = useAtom(languageAtom);
// ...
const startTour = useCallback(() => {
  tourDriverRef.current?.destroy(); tourDriverRef.current = null;

  // D-01/D-02: locale now comes from the app's single source of truth,
  // not navigator.languages (that read moves to the D-03 first-load-default effect).
  const steps = buildTourSteps(language);
  // ...
}, [language, setTourSeen /* + other closed-over deps */]);
```
Note the `useCallback` dependency array MUST include `language` now — omitting it would let `startTour` close over a stale locale if the user switches language in Settings between renders. Verify this doesn't reintroduce the Phase-1 `a818626` teardown bug: the dependency-array change affects when a *new* `startTour` function identity is created, not when the driver instance is torn down (teardown only happens inside `startTour`'s own body and the unmount-only cleanup effect at `page.tsx:239`) — safe.

### Pattern 3: Imperative `dir="rtl"` scoped to the detached popover node
**What:** driver.js appends `.driver-popover` to `document.body`, outside the React tree, so React props/context cannot reach it. The only way to set `dir` on it is imperatively.
**When to use:** Once, inside the driver config's `onPopoverRender` hook, checked against the current locale.
**Example:**
```typescript
// src/app/page.tsx — inside the driver({...}) config object
const RTL_LOCALES: ReadonlySet<Language> = new Set(['ar', 'ur']);

const driverObj: Driver = driver({
  // ...existing config...
  onPopoverRender: (popoverDom) => {
    // popoverDom.wrapper is the real `.driver-popover` element (confirmed via
    // node_modules/driver.js/dist/driver.js.d.ts PopoverDOM type).
    popoverDom.wrapper.dir = RTL_LOCALES.has(language) ? 'rtl' : 'ltr';
  },
  // ...
});
```
Source: `PopoverDOM` type confirmed directly in `node_modules/driver.js/dist/driver.js.d.ts:111-122` — `wrapper: HTMLElement` is the exact `.driver-popover` node. `onPopoverRender` signature confirmed in the same file, lines 28-32 (top-level `Config`) and 100-104 (per-step `Popover`).

### Anti-Patterns to Avoid
- **Reimplementing driver.js's Tab-focus trap or Escape/Arrow key handling:** Confirmed present and correct in the installed 1.6.0 source (`driver.js.mjs` lines 316-322). D-07 explicitly forbids rebuilding this — do not add a custom `keydown` listener for these keys.
- **Assuming manual focus-restoration is needed without testing first:** driver.js already captures `document.activeElement` at `drive()`-time and restores it at destroy-time (see Common Pitfalls). Writing a redundant `restoreFocus()` closure is extra surface area for a subtle double-restore bug if not carefully guarded.
- **Computing the device-language default in `atoms.ts` at module scope:** Confirmed no `atomWithStorage` option supports this safely — `getOnInit` does not accept a computed fallback and cannot read `navigator` at module-eval time without an SSR/CSR mismatch (Next.js renders `atoms.ts` module code identically on server and client; `navigator` doesn't exist server-side).
- **Selecting the "?" replay button or driver.js buttons by translated `aria-label`/`title` text in tests or CSS:** Violates the project's `data-tour`-only anchor rule (CLAUDE.md) and would break the moment the string is localized in this very phase. Use driver.js's real class names (`.driver-popover-next-btn`, etc., already confirmed in Phase 1's research per `01-CONTEXT.md`'s STATE.md note) or a stable `className`/`data-*` hook for the "?" button, never its `aria-label`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Keyboard step navigation (Escape/←/→) | Custom `keydown` listener + step-index state machine | driver.js's built-in `allowKeyboardControl` (already `true` in config) | Confirmed present and correct in installed source; D-07 explicitly forbids rebuilding |
| Tab focus trap inside popover | Custom `focusin`/`Tab` interception | driver.js's built-in trap (source lines 316-319, computes focusable list from `[popover.wrapper, activeElement]` on every Tab keypress) | Already correct; rebuilding risks a worse, buggier trap than the shipped one |
| Focus restoration to trigger element | Manual `document.activeElement` capture in a `useRef` + `.focus()` in three exit callbacks | driver.js's built-in capture (`v("__activeOnDestroyed", document.activeElement)` at `drive()`-time) + restore (`i && i.focus()` at destroy-time) | Verified present in source; adding a second, redundant capture/restore mechanism risks double-firing focus events. Verify with a test before adding any manual code |
| Per-string i18n fallback (missing translation key) | Hand-written `??` chains repeated at every popover copy call site | A single `getTourString(locale, key)` helper (Pattern 1) | D-04 explicitly requires this exact shape ("a small helper... rather than repeated inline `??` chains") |
| RTL text detection | A third-party `rtl-detect`/`is-rtl` package | A 2-element `Set(['ar', 'ur'])` literal, since the RTL locale set is fixed and small (confirmed: exactly `ar` at `translations.ts:222` and `ur` at `translations.ts:302`, no other RTL scripts among the 30 supported locales) | Adding a dependency for a 2-item lookup is unjustified; `Intl.Locale`-based script detection would be more "correct" in theory but is unnecessary complexity for a closed, known locale list |

**Key insight:** The overwhelming majority of the "hard problems" this phase might appear to require (keyboard nav, focus trap, focus restoration) are already solved inside the exact driver.js version already installed. The research risk in this phase is not technical difficulty — it's the risk of *unknowingly re-implementing* library internals that already work, adding complexity and potential regressions for zero net accessibility gain. Confirm via a live test before writing new focus-management code.

## Common Pitfalls

### Pitfall 1: `useCallback` staleness after switching `startTour`'s locale source
**What goes wrong:** If `language` is read via `useAtom(languageAtom)` but not added to `startTour`'s `useCallback` dependency array, the tour will keep using whatever locale was active the first time `startTour` was created, even after the user changes language in Settings and clicks "?" to replay.
**Why it happens:** `useCallback([...deps])` only recreates the function when a listed dependency changes; a closed-over atom value not listed becomes stale.
**How to avoid:** Add `language` to `startTour`'s dependency array (Pattern 2). This is safe because the tour is documented as blocked-modal (D-03 from Phase 1: backdrop interaction is blocked during the tour) — language cannot change *mid-tour*, so a stale closure would only matter between tour sessions, which the dependency array already handles correctly once added.
**Warning signs:** A Playwright/manual test where you switch language in Settings, then click "?" and see the tour still in the previous language.

### Pitfall 2: Whole-object vs. per-string fallback confusion
**What goes wrong:** If `buildTourSteps` uses the same whole-object fallback pattern as `useTranslation()` (`translations[locale] || translations.en`), a locale missing only `step8FallbackBody` (for example) would silently lose ALL of its other correctly-translated tour strings, not just the one missing key — directly violating D-04's "per-string fallback" requirement and I18N-01's fallback acceptance criterion.
**Why it happens:** The existing `useTranslation()` hook (`src/hooks/useTranslation.ts:6`) uses `||` at the whole-dictionary level, which is the "obvious" pattern to copy from this codebase — but D-04 explicitly calls for finer granularity for the new `tour` namespace.
**How to avoid:** Use the `getTourString(locale, key)` helper (Pattern 1) for every individual string lookup inside `buildTourSteps`, never a blanket `translations[locale].tour || translations.en.tour`.
**Warning signs:** Code review sees `translations[locale]?.tour || translations.en.tour` instead of per-key `??`.

### Pitfall 3: Assuming D-07's "focus restoration" needs new code without verifying driver.js's built-in behavior first
**What goes wrong:** Time is spent implementing a `restoreFocus()` closure (capturing `document.activeElement` in a ref before `driverObj.drive()`, calling `.focus()` in `onDoneClick`/`onCloseClick`/`onDestroyed`) that duplicates logic the engine already performs, potentially causing a double-focus-event or masking whether the built-in behavior actually already satisfies A11Y-01.
**Why it happens:** The UI-SPEC's "Focus restoration" section (written before this research pass) assumed no built-in mechanism exists and specified building one from scratch. Reading the actual minified source (`driver.js.mjs`) reveals `v("__activeOnDestroyed", document.activeElement)` is set inside `h()` (the step-render function invoked by `drive(e=0){ m(), h(e) }`) and `i && i.focus()` fires inside `g()` (the destroy function) using that captured value — i.e., driver.js already does exactly what D-07 asks for, natively, on every `drive()`/destroy() cycle.
**How to avoid:** Before writing new focus-management code, write a Playwright test: click the "?" button, wait for the popover, press Escape (or click Done), then assert `document.activeElement` is the "?" button. Run this test against the CURRENT code (pre-Phase-3 changes) to establish a baseline. If it already passes, D-07 item 2 requires zero new code — just document/verify it in the phase's verification artifact. If it fails (e.g., the "?" button's `onClick` handler runs some intermediate async work that shifts focus before `drive()` captures it, or `driverObj.drive()` is called after a `tourDriverRef.current?.destroy()` on a *previous* instance in a way that changes what's focused at capture-time), then add the minimal necessary correction, informed by exactly which case failed.
**Warning signs:** Planner writes a task titled "implement focus restoration" without a preceding verification task — this inverts the correct order for this specific pitfall.

### Pitfall 4: 44px touch-target floor on driver.js's default footer buttons
**What goes wrong:** driver.js's own shipped CSS (`driver.css`) sets `.driver-popover-footer-btn { padding: 3px 7px; font: 12px/1.3 }` — this is the *un-themed* base the project's `tour.css` overrides layer on top of (`font-size: 14px; font-weight: 600` at `tour.css:44-49`, no explicit `min-height`). Combined, the rendered button height may land well under the 44px WCAG 2.5.5 / iOS HIG floor the UI-SPEC calls out, especially on mobile where padding isn't independently increased.
**Why it happens:** `tour.css` only overrides `font-size`/`font-weight`/`border`, not `padding`/`min-height`, for `.driver-popover-footer-btn` — the driver.css base padding (`3px 7px`) remains in effect, so total button height is roughly font line-height (14 × 1.2 ≈ 17px) + 2×3px padding + border ≈ 23-25px, well under 44px.
**How to avoid:** Add `min-height: 44px` (and likely `padding: 0 12px` or similar to keep proportions sane) to `.driver-popover-footer-btn` in `tour.css` as part of the D-08 touch-target work, exactly as the UI-SPEC anticipates ("if the rendered button... falls under 44px tall... add `min-height: 44px`"). Measure with browser devtools or a Playwright bounding-box assertion before deciding this is/isn't needed — don't guess.
**Warning signs:** Playwright `boundingBox()` on `.driver-popover-next-btn` returns `height < 44`.

### Pitfall 5: `onPopoverRender` fires on EVERY step transition, not once per tour
**What goes wrong:** Because `onPopoverRender` is called from inside `h()` (the per-step render function, confirmed by the call chain: `drive(e) → h(e) → ... → D(n, {...})` where `D` is `onPopoverRender`), setting `popoverDom.wrapper.dir = ...` inside it runs 9 times per tour session (once per welcome + 8 steps), not once. This is fine functionally (idempotent — same value written repeatedly) but means any additional one-time setup mistakenly placed in this hook (e.g., adding an event listener) would leak 9 listeners per tour run without cleanup.
**Why it happens:** The hook name ("render") suggests a mount-once semantic but it is actually invoked on every popover re-render, i.e., every step change, since driver.js tears down and rebuilds parts of the popover DOM per step (confirmed: `B({...})` inside `h()` calls the popover-build function `$` which calls this hook, per source line ~394-400).
**How to avoid:** Keep `onPopoverRender`'s body limited to idempotent DOM attribute/class writes (like `dir` and any RTL footer class toggle) — never add `addEventListener` or other non-idempotent side effects inside it without a corresponding removal.
**Warning signs:** Memory profiling shows growing listener counts across tour replays; or, less severely, no functional bug at all if the body stays idempotent (which is exactly what D-01's RTL contract calls for).

### Pitfall 6: RTL footer button visual order vs. DOM/tab order divergence is intentional, but easy to over-correct
**What goes wrong:** A well-intentioned implementer, on seeing `flex-direction: row-reverse` visually flip Next left / Back right for `ar`/`ur`, might also try to reorder the underlying DOM nodes or swap `nextBtnText`/`prevBtnText` handlers to "match," breaking keyboard Tab order (which should stay logical: Back before Next in document order) and/or silently swapping which button triggers which driver.js action.
**Why it happens:** Natural instinct to make DOM order match visual order once RTL is introduced.
**How to avoid:** Per the UI-SPEC's explicit RTL Contract table: "Do not reorder the underlying DOM/tab order... only the visual flex order flips." The CSS-only `flex-direction: row-reverse` on `.driver-popover-footer` is sufficient and correct; do not touch `nextBtnText`/`prevBtnText`/button click handlers for RTL.
**Warning signs:** A diff that touches `onNextClick`/`onPrevClick` wiring "for RTL support" — this is out of scope and likely wrong.

### Pitfall 7: `translations.ts` `tour` namespace character budget is easy to blow past for CJK/German
**What goes wrong:** The UI-SPEC's Typography section sets strict per-locale character budgets (≤40 chars/title, ≤110 Latin / ≤55 CJK glyphs/body, ≤12 chars/button label) specifically because German tends to run 30-40% longer than English for the same meaning, and CJK glyphs are visually ~2x Latin width at the same font-size. Authoring all 30 locales without checking these budgets risks popover overflow/wrapping regressions that only show up in specific languages during QA.
**Why it happens:** It's straightforward to translate accurately but easy to ignore length constraints when generating 30 locales × 11 strings (welcome ×2, 8 steps ×2, 3 buttons, 1 fallback body, 1 aria-label ≈ 21 strings/locale) = ~630 strings.
**How to avoid:** After authoring, run a simple length-check script (e.g., a Vitest test iterating `Object.keys(translations)` and asserting `translations[locale].tour.stepXTitle.length <= <budget>` with CJK locales checked against the tighter budget) rather than relying on manual review of 630 strings. This is a good candidate for the phase's own test coverage (see Validation section below), not just visual QA.
**Warning signs:** A German or Finnish button label wraps to two lines in the 288px mobile popover width.

## Code Examples

Verified patterns based on the installed driver.js 1.6.0 source and this codebase's existing conventions:

### 1. `:focus-visible` rings (D-07 item 1) — confirmed selectors from existing `tour.css`
```css
/* Source: src/theme/tour.css:44-71 (existing selectors, confirmed present) +
   03-UI-SPEC.md §Keyboard Accessibility Contract */
.driver-popover-next-btn:focus-visible,
.driver-popover-prev-btn:focus-visible,
.driver-popover-done-btn:focus-visible,
.driver-popover-close-btn:focus-visible {
  outline: 2px solid oklch(var(--p));
  outline-offset: 2px;
}

/* "?" replay button — add a stable class in page.tsx alongside its existing
   classes (do NOT select by aria-label/title, per CLAUDE.md anchor rule) */
.tour-replay-btn:focus-visible {
  outline: 2px solid oklch(var(--p));
  outline-offset: 2px;
}
```

### 2. `prefers-reduced-motion` (D-07 item 3) — two-part contract confirmed against driver.js's actual config surface
```css
/* Source: node_modules/driver.js/dist/driver.js.mjs line 531 confirms
   `--driver-animation-duration` is set from the `duration` config key (default
   400ms) and only applied when `animate` truthy triggers the `driver-fade`
   class; this CSS override works regardless of the JS flag as defense-in-depth. */
@media (prefers-reduced-motion: reduce) {
  .driver-popover {
    --driver-animation-duration: 0ms;
  }
}
```
```typescript
// src/app/page.tsx — inside startTour(), alongside the existing one-time
// isDarkTheme read at line 191 (same pattern: read once per drive() call)
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const driverObj: Driver = driver({
  // ...
  animate: !prefersReducedMotion,     // driver.js Config.animate, default true when omitted
  smoothScroll: !prefersReducedMotion, // currently hardcoded `true` at page.tsx:199
  // ...
});
```
Confirmed via `node_modules/driver.js/dist/driver.js.d.ts:7` — `animate?: boolean` is a real, documented top-level `Config` key (not previously set in this codebase's config object, meaning driver.js's own default of `true` currently applies unconditionally).

### 3. Responsive popover max-width (D-08)
```css
/* Source: 03-UI-SPEC.md §Mobile / Touch Contract — replaces flat 320px at
   src/theme/tour.css:16 */
.driver-popover {
  max-width: min(320px, calc(100vw - 2rem));
}
```

### 4. Touch target floor for footer buttons (Pitfall 4)
```css
/* Source: driver.css's shipped `.driver-popover-footer-btn { padding: 3px 7px }`
   base (node_modules/driver.js/dist/driver.css) combines with tour.css's
   font-size:14px override to fall short of the 44px WCAG 2.5.5 floor —
   verify via boundingBox() before/after adding this rule. */
.driver-popover-footer-btn {
  min-height: 44px;
  padding: 0 16px;
}
```

### 5. `getTourString` per-key fallback helper (D-04, Pattern 1)
```typescript
// src/lib/tourSteps.ts
import { translations } from './translations';
import type { Language } from './types';

type TourNamespace = typeof translations.en.tour;

export const getTourString = (locale: Language, key: keyof TourNamespace): string => {
  const localeTour = translations[locale]?.tour as Partial<TourNamespace> | undefined;
  return localeTour?.[key] ?? translations.en.tour[key];
};
```

### 6. RTL scoped to the detached popover node (RTL Contract)
```typescript
// src/app/page.tsx — inside the driver({...}) config
// Source: node_modules/driver.js/dist/driver.js.d.ts:28-32 (Config.onPopoverRender)
//         and :111-122 (PopoverDOM.wrapper is the real .driver-popover element)
const RTL_LOCALES = new Set<Language>(['ar', 'ur']);

onPopoverRender: (popoverDom) => {
  popoverDom.wrapper.dir = RTL_LOCALES.has(language) ? 'rtl' : 'ltr';
},
```
```css
/* src/theme/tour.css — scoped footer mirror, does not touch DOM/tab order */
[dir="rtl"] .driver-popover-footer {
  flex-direction: row-reverse;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Tour locale from `navigator.languages` (Phase 1 D-05) | Tour locale from `languageAtom` (this phase D-01/D-02) | This phase | Single source of truth; Settings-driven language switch now also drives tour copy |
| Bare `:focus` outlines (commit `7daf09d`, `CurrencyRow.tsx:107`) | `:focus-visible` for all new tour focus rings | This phase (new elements only; `CurrencyRow.tsx` itself is out of scope, not retrofitted) | Keyboard-only focus indication, no ring on mouse/touch clicks — a stricter, more modern pattern than the prior commit established, applied prospectively |
| Flat `max-width: 320px` on `.driver-popover` | `max-width: min(320px, calc(100vw - 2rem))` | This phase | Popover no longer risks overflow/edge-touching below ~352px viewport width |

**Deprecated/outdated:** None — this is a pure hardening/localization pass on a recently-built (Phase 1-2, same milestone) feature; nothing here predates or needs to catch up to an external ecosystem shift.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | driver.js's built-in `document.activeElement` capture/restore (confirmed present in the 1.6.0 source) fully satisfies D-07's "focus restoration" requirement without new code | Summary, Pitfall 3, Don't Hand-Roll | If the built-in behavior has an edge case (e.g., the "?" button's own click handler shifts focus asynchronously before `drive()` captures `activeElement`, or a second `startTour()` call's `destroy()` interferes with the next capture), a planner who skips the verification task and assumes "nothing to build" would ship an A11Y-01 regression. Mitigated by recommending a verify-first Playwright test as the first task, not skipping the check entirely |
| A2 | Exactly `ar` and `ur` are the only RTL-scripted locales among the 30 supported (no Hebrew, Farsi, etc.) | User Constraints, Don't Hand-Roll, Code Examples | Low risk — directly confirmed by reading `src/lib/types.ts`'s `Language` union (30 explicit tags) and grepping `translations.ts` for all 30 top-level keys; this is a closed, enumerable list, not an inference |
| A3 | Character-length translation budgets in `03-UI-SPEC.md` (≤40 chars title, ≤110/55 body, ≤12 button) are achievable for all 30 locales without semantic compromise | Pitfall 7 | Medium risk for a few notoriously verbose target languages (German compound nouns, Finnish agglutination) — if a literal translation blows the budget, the translator (Claude, per D-06) may need to paraphrase more tersely than a professional translator would prefer; flagged in D-06 as a non-blocking follow-up (native-speaker review) so this is an accepted, already-scoped risk, not a new one |

**Note:** All package/library version claims (driver.js 1.6.0, jotai 2.12.3) are `[VERIFIED]` via direct `node_modules` and `package.json` inspection, not assumed from training data or unverified web search — see Sources.

## Open Questions

1. **Does driver.js's built-in focus-restore correctly handle the "?" button's own click-triggered focus?**
   - What we know: `document.activeElement` is captured inside `h(0)` which runs synchronously as part of `drive()`. Clicking the "?" button with a mouse does NOT normally leave it as `document.activeElement` in all browsers (some browsers only focus buttons on click in certain OS/browser combos — historically Safari/macOS does not focus buttons on click, per longstanding browser behavioral differences), whereas clicking it with a keyboard (Enter/Space after Tab) reliably does.
   - What's unclear: Whether, on Safari/macOS specifically, clicking "?" with a mouse leaves `document.body` (not the button) as `activeElement`, meaning driver.js's restore would send focus to `document.body`, not back to the "?" button, technically satisfying "keyboard users keep their place" (D-07's actual concern, since mouse users don't need focus restoration) but worth confirming explicitly doesn't regress for keyboard-triggered replay.
   - Recommendation: The verify-first Playwright test (Pitfall 3) should specifically drive the "?" button via keyboard (Tab + Enter), not `page.click()` (which Playwright may focus differently than a real mouse click) to test the actual keyboard-user path D-07 cares about.

2. **Will the `tour` namespace's ~21 strings × 30 locales materially increase the client JS bundle size in a way worth measuring?**
   - What we know: `translations.ts` is already 603 lines for 2 namespaces (`home`, `settings`) × 30 locales; adding a third namespace with more strings per locale (~11 title/body pairs vs. the current 5-9 keys) will roughly double the file's size.
   - What's unclear: Whether this project has any bundle-size budget/CI check that would flag this (none found in `package.json` scripts or config files during this research).
   - Recommendation: Not a blocker — the app is already a single-page client bundle with no lazy-loading of i18n data; note as a non-issue unless a bundle-analyzer step is added later.

## Environment Availability

Not applicable — this phase has no external tool/service/runtime dependencies beyond what's already installed (driver.js, jotai, both confirmed present in `node_modules`). No new CLI tools, databases, or services are introduced.

## Validation Architecture

Skipped — `.planning/config.json` sets `workflow.nyquist_validation: false` explicitly.

However, since the repo has an existing, working test suite that directly precedents this phase's needs, note the following for the planner's own task-level test planning (not a formal Nyquist section, just carried-forward fact-finding):

- **Vitest** (`npm run test` / `test:run`), config at `vitest.config.ts` — default `environment: 'node'`, opt into `jsdom` via `// @vitest-environment jsdom` docblock (confirmed pattern in `src/components/InstallButton.test.tsx:1`).
- **`resolveTourLocale`** already has full unit test coverage in `src/lib/fns.test.ts:178-194` (4 cases: exact match, base-language fallback, no-match fallback, empty-input fallback) — this is the precedent for testing the NEW D-03 first-load-default logic and the D-01/D-02 locale-source switch; extend this file or add a sibling test for the new call site, don't duplicate `resolveTourLocale`'s own logic tests.
- **`buildTourSteps`** already has structural tests in `src/lib/tourSteps.test.ts` (step count, selector order, progress text) called with `buildTourSteps('en')` — extending this file to assert per-locale `tour` namespace lookups (e.g., `buildTourSteps('ar')[1].popover?.title` equals the Arabic string) is the natural extension point for I18N-01 coverage.
- **Playwright e2e** (`npm run test:e2e`), single spec file `e2e/home.spec.ts` today, seeds `localStorage` via `page.addInitScript` before `page.goto('/')` — this is the established pattern for a NEW tour-focused e2e spec (e.g., `e2e/tour.spec.ts`) that seeds `language` and `tourSeen` keys to test locale-driven copy, keyboard nav, and focus restoration live in a real browser (jsdom cannot exercise `:focus-visible`, `prefers-reduced-motion` media queries, or real Tab-key focus movement — these need Playwright, not Vitest+jsdom).
- No existing Playwright test exercises the tour at all yet (Phase 1/2 tests are absent from `e2e/home.spec.ts`) — this phase is a natural point to add the first tour e2e coverage, particularly since A11Y-01's keyboard/focus claims are unverifiable in jsdom.

## Security Domain

No `security_enforcement` key is set in `.planning/config.json` (absent = enabled per protocol), so this section is included for completeness, though the phase's actual security surface is minimal.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | App has no authentication anywhere (client-only, no backend) |
| V3 Session Management | No | No sessions; `localStorage` atoms are the only client-side state |
| V4 Access Control | No | No access-control surface; single-user local app |
| V5 Input Validation | No new surface | This phase adds no new user-input parsing — all 30 locale strings are author-generated static data (Claude-authored, D-06), not user-submitted input. `getTourString`'s lookup is a typed object-key access, not a dynamic/injectable string operation |
| V6 Cryptography | No | Not applicable — no crypto operations in this phase or app |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| XSS via translated string injection | Tampering / Elevation of Privilege | Not applicable here — driver.js's `popover.title`/`popover.description` are set as `innerText` in the shipped source (confirmed: `n.innerText = "Popover Title"` pattern at `driver.js.mjs:410` for the default; the codebase's own Phase 1 rule already forbids "embedded HTML" in tour copy, per `03-UI-SPEC.md`'s Copywriting Contract — all 30 locale strings this phase adds are plain text, consistent with this existing constraint) |
| Locale-key prototype pollution (`translations[userInput]`) | Tampering | Not applicable — `locale`/`language` values are always drawn from the closed `Language` union type (30 literal string values) via `languageAtom`, never from raw unvalidated user input; TypeScript's `Language` type plus `SUPPORTED_LOCALES` (`Object.keys(translations)`) constrain the domain at compile time |

## Sources

### Primary (HIGH confidence)
- `node_modules/driver.js/dist/driver.js.d.ts` (installed 1.6.0) — full `Config`, `Driver`, `DriveStep`, `Popover`, `PopoverDOM`, `State` type surface, read directly, not from docs
- `node_modules/driver.js/dist/driver.js.mjs` (installed 1.6.0, minified source) — confirmed keyboard trap (lines 316-322), focus capture/restore (lines 402, 543, 571-595), `drive()`/destroy lifecycle (lines 530-601), `animate`/`duration`/`smoothScroll` config wiring (lines 5-11, 277, 531)
- `node_modules/driver.js/dist/driver.css` (installed 1.6.0, shipped base styles) — confirmed `.driver-popover-footer-btn` base padding/font, `.driver-popover-footer` flex layout
- `node_modules/jotai/vanilla/utils/atomWithStorage.d.ts` (installed 2.x) — confirmed `getOnInit` option's actual scope (init-read toggle only, not a computed-default hook)
- `package.json` — confirmed `driver.js: ^1.6.0`, `jotai: ^2.12.3` as declared deps
- Direct repo reads: `src/app/page.tsx`, `src/lib/tourSteps.ts`, `src/lib/fns.ts`, `src/lib/atoms.ts`, `src/lib/types.ts`, `src/lib/translations.ts`, `src/hooks/useTranslation.ts`, `src/contexts/LanguageContext.tsx`, `src/theme/tour.css`, `src/app/layout.tsx`, `src/components/CurrencyRow.tsx`, existing test files (`fns.test.ts`, `tourSteps.test.ts`, `InstallButton.test.tsx`, `e2e/home.spec.ts`), `vitest.config.ts`

### Secondary (MEDIUM confidence)
- [Styling Popover - Driver.js](https://driverjs.com/docs/styling-popover) — confirms `onPopoverRender` is documented, public API (cross-checked against the installed `.d.ts`, which matches)
- [GitHub Issue #503 - onPopoverRender not being called](https://github.com/kamranahmedse/driver.js/issues/503) — background on hook timing edge cases
- [GitHub Issue #434 - Accessibility testing issues](https://github.com/kamranahmedse/driver.js/issues/434) — confirms `onPopoverRender` is the established community workaround for a11y gaps (aria-label, role); also flags an unresolved duplicate-banner-landmark issue from the popover's `<header>` title element, which is out of this phase's explicit D-07 scope (three items only) but worth flagging to the planner as a known upstream limitation, not something to silently "fix" as scope creep

### Tertiary (LOW confidence)
- None — all claims in this document are either verified directly against installed source/`node_modules`, cross-checked against official docs, or explicitly logged in the Assumptions table above.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries, both existing deps' exact behavior confirmed via direct source inspection, not documentation alone
- Architecture: HIGH — all integration points (locale source, i18n fallback, RTL hook, focus lifecycle) confirmed against actual installed driver.js 1.6.0 source code, not just its public docs/types
- Pitfalls: HIGH — the most consequential pitfall (driver.js's built-in focus capture/restore) was discovered by reading the actual shipped minified source, not inferred or assumed; RTL/mobile/i18n pitfalls are directly derived from the locked UI-SPEC cross-referenced against real file:line evidence

**Research date:** 2026-07-04
**Valid until:** 30 days (stable dependency versions, no fast-moving ecosystem risk — driver.js and jotai are both mature, low-churn libraries; re-verify if `package.json` versions change before planning executes)
