# Phase 1: Guided First-Run Tour - Research

**Researched:** 2026-07-04
**Domain:** Product-tour library integration (driver.js) in a Next.js 14 App Router / React 18 client-only app; browser-language resolution; hydration-safe auto-start
**Confidence:** HIGH

## Summary

driver.js 1.6.0 (published 2026-06-25, MIT, ~1.1M weekly downloads) is a small, dependency-free, selector-based tour/spotlight library that fits this phase's requirements almost exactly out of the box: it ships a `driver()` factory with `drive()`/`destroy()`/navigation methods, per-step `element`+`popover` config, a built-in modal overlay that blocks background interaction, Escape/overlay-click/close-button dismissal gated by a single `allowClose` flag, automatic scroll-into-view and automatic popover-side flipping when the default `side` doesn't fit the viewport, and a small, well-documented set of CSS classes (`.driver-popover`, `.driver-active-element`, `.driver-overlay`, etc.) designed to be re-skinned via a plain CSS file — which is exactly the DaisyUI-token approach the UI-SPEC calls for. All of this was verified by reading the actual installed `node_modules/driver.js` v1.6.0 source (not just docs), which surfaced three corrections to assumptions embedded in the UI-SPEC/CONTEXT (see "State of the Art" below): there is no `scrollIntoViewOptions` config key or `side: 'auto'` value in this version — the equivalent behaviors are automatic and undocumented-by-name; and driver.js's popover exposes exactly one CSS custom property (`--driver-animation-duration`), so theming must happen by overriding class selectors with `oklch(var(--daisyui-token))` values directly, not by expecting driver.js to consume DaisyUI's CSS vars itself.

The trickiest integration point is the native `<dialog>` top-layer vs. driver.js's ordinary `z-index: 1000000000` stacking: browsers place `<dialog>` (when open) in a separate "top layer" that is unconditionally above every ordinary z-index-based element, no matter how large. There is no CSS fix for this — the UI-SPEC's contract (keep `#currency_list_modal` closed during step 4) is the only correct solution, and this research confirms it's necessary, not just cautious.

For D-05 (device-language resolution), the standard, verified approach is `navigator.languages` (client-only, guarded by `typeof window !== 'undefined'`) parsed with the built-in `Intl.Locale` API (ES2020+, available in all target browsers and Node 22) to extract the base language subtag, matched against the 30 keys already in `src/lib/translations.ts`, falling back to `'en'`. This requires no new dependency.

**Primary recommendation:** Add `driver.js@^1.6.0` as a direct dependency; drive the tour entirely through a small client-only module (`src/lib/tourSteps.ts` for step config + a `resolveTourLocale` pure function in `src/lib/fns.ts`), wire `driver()` init/`drive()`/`destroy()` from a `useEffect` in `page.tsx` gated on `hydrated && effectiveAll-ready && !tourSeen`, guard against React Strict-Mode double-invoke with a `useRef` flag, register `onCloseClick`/`onDestroyed`/`onDoneClick` to all set `tourSeenAtom = true`, set `disableActiveInteraction: true` + leave `allowClose: true`/default `overlayClickBehavior: 'close'`/default `allowKeyboardControl: true` to satisfy D-01/D-02/D-03 together, and style everything via a new `src/theme/tour.css` imported once in `layout.tsx` that targets driver.js's documented class names with DaisyUI `oklch(var(--token))` values.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Tour step sequencing / navigation state | Browser / Client | — | driver.js is a vanilla client-only DOM library; no SSR involvement possible or desired |
| "Seen" flag persistence | Browser / Client (localStorage via Jotai `atomWithStorage`) | — | App has no backend; matches existing `atomWithStorage` pattern for all user prefs |
| Device-language resolution | Browser / Client | — | `navigator.languages` only exists client-side; must run after mount, gated like `hydrated` |
| Tour popover visuals/theming | Browser / Client (CSS overrides) | — | driver.js renders outside React's tree directly to `document.body`; styled via a dedicated global CSS file, not component-level Tailwind classes |
| Anchor DOM attributes (`data-tour`) | Browser / Client (React components) | — | Added directly to existing JSX in `page.tsx` and child components; no new architectural layer |
| Tour trigger gating (hydration + skeleton + seen-flag) | Browser / Client (`page.tsx` `useEffect`) | — | Must sequence after existing `hydrated` state and SWR-driven skeleton-clear condition, both already client-side |

There is no CDN/Backend/Database tier involvement in this phase — 100% client tier, consistent with the rest of the app.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `driver.js` | `^1.6.0` | Spotlight/tour engine: overlay, popover, step navigation, focus management | Locked upstream decision (CONTEXT.md, PROJECT.md). Verified: MIT license, same maintainer (`kamranahmedse`) since inception, GitHub org transferred `kamranahmedse/driver.js` → `nilbuild/driver.js` (old URLs redirect, not a fork/hijack), ~1.1M weekly npm downloads, zero runtime dependencies, 92KB unpacked. [VERIFIED: npm registry + driverjs.com official docs] |

### Supporting
No additional runtime packages needed. `Intl.Locale` (native ES2020+ API, no polyfill required for Chrome/Edge/Firefox/Safari current-and-recent or Node 18+) covers the device-language resolution requirement — do not add a locale-matching library (e.g. `bcp-47-match`, `@formatjs/intl-localematcher`) for this; it would be over-engineering for a 30-item flat list match.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| driver.js | react-joyride | Heavier (React-coupled, larger bundle), already rejected upstream per STATE.md decision log — "less than react-joyride" was the explicit rationale |
| driver.js | Shepherd.js | Similar feature set but larger footprint and its own CSS framework assumptions; no re-litigation needed, driver.js is locked |
| `Intl.Locale`-based matcher | `@formatjs/intl-localematcher` (npm) | Full BCP-47 negotiation algorithm (RFC 4647), but adds a dependency for a problem solvable in ~15 lines against a fixed 30-item list; only worth it if the app later needs full Accept-Language-header-style negotiation |

**Installation:**
```bash
npm install driver.js
```

**Version verification:** Confirmed via `npm view driver.js version` → `1.6.0`, `npm view driver.js time.modified` → `2026-06-25T16:41:34.194Z`. Full version history checked (`1.3.6`, `1.4.0`, `1.5.0`, `1.6.0`) — no evidence of an abandoned/yanked state. `npm view driver.js scripts.postinstall` returned nothing (no postinstall script — clean signal, not a supply-chain risk).

## Package Legitimacy Audit

slopcheck 0.6.1 was available and run directly against the registry.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `driver.js` | npm | Original project since ~2017 (kamranahmedse); current `1.6.0` published 2026-06-25 | 1,103,283/week | `github.com/nilbuild/driver.js` (transferred from `github.com/kamranahmedse/driver.js`; old URL redirects, not a rename-squat — same author `kamranahmedse.se@gmail.com` maintains both) | [OK] | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

Note on provenance: `driver.js` as a package name was already specified by the user's locked upstream decision (CONTEXT.md/PROJECT.md), not discovered by this research session via WebSearch/training data. Its registry identity, license, maintainer continuity, and lack of a postinstall script were independently verified in this session via `npm view` and cross-checked against the official `driverjs.com` docs and GitHub org history — this satisfies the bar for `[VERIFIED: npm registry]` rather than `[ASSUMED]`.

*(Note: running `slopcheck install driver.js` as part of this gate actually executed `npm install`, temporarily adding `driver.js` to `package.json`/`package-lock.json` and `node_modules`. This research session reverted `package.json`/`package-lock.json` via `git checkout` immediately after — installing the dependency for real remains a Plan 1 task, not something this research should have done as a side effect. The planner should still include an explicit "add driver.js to package.json" task.)*

## Architecture Patterns

### System Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────────┐
│  Browser: page.tsx  "Home" component (mount)                     │
│                                                                    │
│  1. useState(hydrated)+useEffect(()=>setHydrated(true))  [existing]│
│  2. useSWR x2 resolve → effectiveAll / skeleton clears    [existing]│
│  3. useAtom(tourSeenAtom)  [new, atomWithStorage]                 │
│                                                                    │
│         │  AND-gate: hydrated && !skeleton && !tourSeen           │
│         ▼                                                          │
│  4. useEffect (tour-start), guarded by useRef "started" flag       │
│         │                                                          │
│         ├──► resolveTourLocale(navigator.languages, SUPPORTED_LOCALES) │
│         │        (src/lib/fns.ts, pure fn, client-only guard)      │
│         │                                                          │
│         ▼                                                          │
│  5. driver({ steps: buildTourSteps(locale), ...config })           │
│        .drive()                                                    │
│         │                                                          │
│         │   driver.js renders DOM OUTSIDE React tree:              │
│         │   document.body → .driver-overlay (SVG mask)             │
│         │                  → .driver-popover (title/desc/footer)   │
│         │                  → .driver-active-element class on target │
│         ▼                                                          │
│  6. User: Next / Back / Skip / Esc / overlay-click                 │
│         │                                                          │
│         ├──► onNextClick/onPrevClick (default nav, D-01)           │
│         └──► onCloseClick / onDoneClick / onDestroyed              │
│                    │                                                │
│                    ▼                                                │
│              setTourSeen(true)   [atomWithStorage → localStorage]  │
│                    │                                                │
│                    ▼                                                │
│              driverObj.destroy() cleanup (unmount / step end)      │
└─────────────────────────────────────────────────────────────────┘

Anchors queried live via CSS selector at each step transition:
  [data-tour="tour-base-row"]        (CurrencyRow.tsx, conditional on isBase)
  [data-tour="tour-amount-input"]    (CurrencyRow.tsx, base row's <input>)
  [data-tour="tour-search"]          (SearchBar.tsx)
  [data-tour="tour-list-settings"]   (CurrencyListModal.tsx trigger button)
  [data-tour="tour-share"]           (page.tsx share button)
  [data-tour="tour-theme-toggle"]    (ThemeToggle.tsx)
  [data-tour="tour-historical-date"] (page.tsx date input)
  [data-tour="tour-install"]         (InstallButton.tsx wrapper div, always-present)
```

### Recommended Project Structure
```
src/
├── lib/
│   ├── atoms.ts          # + tourSeenAtom = atomWithStorage<boolean>('tourSeen', false)
│   ├── fns.ts            # + resolveTourLocale(navLangs, supported, fallback) pure fn
│   └── tourSteps.ts       # NEW: step copy + data-tour selectors + driver.js DriveStep[] builder
├── theme/
│   └── tour.css           # NEW: driver.js class overrides using oklch(var(--daisyui-token))
├── app/
│   ├── layout.tsx         # + import '@/theme/tour.css' (once, alongside globals.css)
│   └── page.tsx           # + tour-start useEffect, + data-tour attrs on share/date-input
└── components/
    ├── CurrencyRow.tsx        # + data-tour="tour-base-row" / "tour-amount-input"
    ├── SearchBar.tsx          # + data-tour="tour-search"
    ├── CurrencyListModal.tsx  # + data-tour="tour-list-settings"
    ├── ThemeToggle.tsx        # + data-tour="tour-theme-toggle"
    └── InstallButton.tsx      # + always-rendered wrapper div with data-tour="tour-install"
```

### Pattern 1: Client-only driver() lifecycle in a React effect
**What:** Initialize `driver()` once per tour-start, call `.drive()`, and always `.destroy()` on unmount or when the tour naturally ends — driver.js is not React-aware and will leak DOM nodes/listeners if not explicitly destroyed.
**When to use:** Any time a driver.js tour is started from a React component.
**Example:**
```typescript
// Source: driverjs.com/docs/api + driverjs.com/docs/configuration (verified against
// node_modules/driver.js/dist/driver.js.mjs v1.6.0 source)
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const tourStartedRef = useRef(false); // guards React StrictMode double-invoke in dev

useEffect(() => {
  if (!hydrated || tourSeen || !effectiveAll || tourStartedRef.current) return;
  tourStartedRef.current = true;

  const locale = resolveTourLocale(
    typeof navigator !== 'undefined' ? navigator.languages : [],
    SUPPORTED_LOCALES,
    'en'
  );

  const driverObj = driver({
    allowClose: true,               // D-02: overlay-click + Esc + close-btn all gated by this one flag
    overlayClickBehavior: 'close',  // default; explicit for clarity
    allowKeyboardControl: true,     // default; enables Escape + arrow-key nav
    disableActiveInteraction: true, // D-03: block clicking the spotlighted element itself too
    smoothScroll: true,             // steps 5-8 may be offscreen
    stagePadding: 4,
    showProgress: true,
    progressText: '{{current}} / 8', // driver.js excludes the welcome step from {{total}} only if
                                      // it is NOT included in `steps` — see Pitfall 2 below
    steps: buildTourSteps(locale),
    onCloseClick: (_el, _step, { driver: d }) => { setTourSeen(true); d.destroy(); },
    onDestroyed: () => { setTourSeen(true); },
  });

  driverObj.drive();

  return () => driverObj.destroy();
}, [hydrated, tourSeen, effectiveAll]);
```

### Pattern 2: Centered "welcome" step with no `element`
**What:** Omitting `element` on the first `DriveStep` produces a centered modal-style popover (driver.js internally treats it as `side: 'over'`) — exactly D-04's requirement.
**When to use:** The single welcome-card step before the 8 anchored steps.
**Example:**
```typescript
// Source: driverjs.com/docs/configuration ("Centered Modal" section) — verified: source shows
// `s === "over"` branch in the popover-positioning function centers via 50% viewport math.
{
  popover: {
    title: 'Welcome to moneyrate',
    description: 'A quick ~30-second tour of the essentials?',
    showButtons: ['next', 'close'], // no "previous" on the first/welcome step
  },
}
```

### Pattern 3: Skip missing anchors silently (edge-case contract)
**What:** Before calling `.drive()`/advancing to a step, verify `document.querySelector('[data-tour="..."]')` resolves; if null, remove that step from the array passed to `driver()` (do NOT let driver.js throw or show an empty popover).
**When to use:** Every step, per the UI-SPEC's "silent step-skip" edge case (relevant mainly for a hypothetical virtualized-list scenario in Phase 1, and defensively for `tour-install` when the anchor div is present but empty).
**Example:**
```typescript
// Pre-filter step list before driver({ steps }) — driver.js has no built-in "skip if
// missing" behavior; if element is null/unresolvable it will throw at drive-time, not
// skip gracefully. Filtering the array up front is the only verified-safe approach.
const steps = buildTourSteps(locale).filter(
  (step) => !step.element || document.querySelector(step.element as string)
);
```
**Confidence:** MEDIUM — driver.js's behavior when `element` resolves to `null` at `drive()`-time is not explicitly documented; source inspection shows `getElementFromStep` accepts `Element | string | (() => Element)` but no null-safe fallback is visible in the reachable minified code paths without deeper static analysis. Filtering before passing to `driver()` sidesteps this entirely and is the safer, verified-by-construction approach — recommend this over relying on undocumented internal null-handling.

### Anti-Patterns to Avoid
- **Re-initializing `driver()` on every theme toggle:** The UI-SPEC explicitly calls for CSS-only theme reactivity (`oklch(var(--token))` in a stylesheet) specifically so the popover doesn't need to be torn down and recreated when `themeAtom` flips — driver.js has no live "update colors" API, only `setConfig()` for behavioral config, not injected CSS values.
- **Selecting anchors by `aria-label`:** Locked decision (D-anchor rule) — `aria-label`s are translated per the 30-locale i18n system and are not selector-stable. Every anchor must carry a dedicated `data-tour` attribute.
- **Opening `<dialog id="currency_list_modal">` programmatically during step 4:** Confirmed via research (see Pitfall 1) that native `<dialog>`'s top-layer sits unconditionally above any z-index-based element including driver.js's popover — there is no CSS override that fixes this while the dialog is open. The modal must stay closed for the whole of step 4.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Spotlight overlay + popover positioning + auto-flip-if-offscreen | Custom SVG-mask overlay + manual `getBoundingClientRect` positioning math | driver.js's built-in overlay/popover engine | driver.js already solves cutout-mask rendering, edge-avoidance flipping, and arrow placement — reimplementing this is exactly the "custom solution is worse" case the locked decision (driver.js) was chosen to avoid |
| Focus trapping inside the popover while it's open | Custom `Tab`/`Shift+Tab` cycling logic | driver.js's built-in focus-trap (confirmed in source: a dedicated `Tab`-key handler cycles focus between the popover and the active element) | Already implemented and tested upstream; hand-rolling risks subtle a11y regressions Phase 3 would then have to fix twice |
| Locale-tag parsing (`en-US` → `en`, malformed tag handling) | Manual string-splitting on `-` | `new Intl.Locale(tag).language` | Native `Intl.Locale` correctly parses BCP-47 tags including script/region/variant subtags and throws predictably on malformed input (catchable), which naive `.split('-')[0]` does not handle for tags like `zh-Hant-TW` |

**Key insight:** driver.js's value in this phase is almost entirely "don't hand-roll a spotlight tour engine" — the remaining custom code (locale resolution, step-config data, hydration gating) is intentionally thin, matching the app's existing "pure functions in `lib/`, thin client wiring in `page.tsx`" convention.

## Common Pitfalls

### Pitfall 1: Native `<dialog>` top-layer defeats any z-index strategy
**What goes wrong:** If `#currency_list_modal` is open (even momentarily) while driver.js's step-4 popover is trying to render, the native dialog's browser-managed "top layer" renders above the popover regardless of the popover's `z-index: 1000000000`, because the top layer is a separate stacking mechanism that ignores ordinary z-index entirely.
**Why it happens:** Per the CSS Positioned Layout spec (and Chrome DevRel's own explainer), `<dialog>` (and `::backdrop`), `:fullscreen`, and popover-API elements are promoted to a dedicated top layer that exists outside normal document stacking-context rules — "z-index has no effect in the top layer."
**How to avoid:** Never call `modal.showModal()` during step 4; the UI-SPEC's contract (keep the dialog closed throughout step 4, and simply let the user's manual open/close during that step be a no-op for tour progression) is correct and should not be revisited.
**Warning signs:** If the plan ever includes "auto-open the settings modal to demo it," that is out of scope and will visually break — flag it in verification if it appears.

### Pitfall 2: `showProgress`/`progressText` counts ALL steps, including the welcome step, unless explicitly excluded
**What goes wrong:** UI-SPEC requires "n / 8" (8 = the anchored feature steps only, excluding the welcome card per D-04's explicit clarification). If the welcome step is included in the same `steps` array passed to `driver()`, driver.js's built-in `{{current}}`/`{{total}}` progress-text placeholders will report against 9 total steps, not 8, unless the welcome step's popover explicitly omits `showProgress`/overrides `progressText` for that step only.
**Why it happens:** driver.js computes `progressText` per-step from the full `steps` array length; there's no built-in concept of "excluded from count."
**How to avoid:** Set `showProgress: false` (or omit progress entirely) on the welcome step's own `popover` config (step-level config overrides tour-level config, confirmed in source: `t.popover?.showProgress ?? r("showProgress")` pattern used throughout), and either (a) compute a custom progress string per anchored step manually (`${index}/8` where index is 1-based within the 8 anchored steps only, not the array index which would be off-by-one due to the welcome step), or (b) do not rely on the built-in `{{current}}/{{total}}` template at all and instead pass a fully custom `progressText` string per step.
**Warning signs:** QA sees "1 / 9" through "9 / 9" instead of "1 / 8" through "8 / 8".

### Pitfall 3: React Strict Mode double-invokes the tour-start effect in dev
**What goes wrong:** Next.js dev mode runs React 18 Strict Mode by default, which double-invokes effects (mount → cleanup → mount) to surface missing-cleanup bugs. Without a guard, `driver().drive()` would fire twice, potentially leaving two overlays or double-firing the "seen" flag write.
**Why it happens:** Standard React 18 Strict Mode behavior, not driver.js-specific — same class of bug the UI-SPEC's own "State Contract" section calls out.
**How to avoid:** Guard with a `useRef` flag (`tourStartedRef.current`) checked and set synchronously inside the effect before calling `.drive()`, as shown in Pattern 1 above. This is a dev-only concern (production doesn't double-invoke) but must still be handled since `next dev` is the primary local dev/test loop.
**Warning signs:** Two overlays flash in dev, or `tourSeenAtom` gets written to `true` immediately even without user interaction (from the Strict-Mode-cleanup-triggered `destroy()` call firing `onDestroyed`).

### Pitfall 4: `onDestroyed` fires on EVERY destroy path, including the Strict-Mode cleanup unmount
**What goes wrong:** If `onDestroyed` unconditionally sets `tourSeenAtom = true`, then the Strict-Mode double-invoke's synthetic unmount (which calls the effect's cleanup function, which calls `driverObj.destroy()`) would falsely mark the tour as "seen" before the user ever saw it, in dev.
**Why it happens:** `onDestroyed` cannot distinguish "user dismissed the tour" from "React tore down and is about to remount" from "component genuinely unmounted (route change)."
**How to avoid:** Only set `tourSeenAtom = true` from the explicit user-driven paths — `onCloseClick`, `onDoneClick` (last step), and `onDestroyed` fired as a RESULT of one of those (all three route through the same underlying close path per source inspection: `allowClose`-gated). Do NOT set it from the `useEffect` cleanup function's `driverObj.destroy()` call itself — that path exists purely for React-lifecycle hygiene (route change, Strict Mode remount), not user dismissal. In practice: call `.destroy()` in cleanup WITHOUT relying on its `onDestroyed` side effect to write state — set `tourSeenAtom` explicitly and only inside `onCloseClick`/`onDoneClick`, and treat `onDestroyed` as a redundant safety net at most (or omit it and rely solely on the two click handlers, since driver.js's own default `onCloseClick` behavior already calls `destroy()` — meaning `onDestroyed` firing from a genuine user action will always be preceded by one of the click handlers we already instrument).
**Warning signs:** Tour never fires a second time in dev after the first hot-reload, even though the user never explicitly dismissed it.

### Pitfall 5: `disableActiveInteraction` defaults to `false` — the highlighted element is NOT blocked by default
**What goes wrong:** D-03 requires blocking ALL interaction during the tour, but driver.js's default overlay only blocks the dimmed background (`pointer-events: none` on everything except `.driver-active-element` and `.driver-popover`) — the spotlighted element itself remains fully clickable unless `disableActiveInteraction: true` is explicitly set.
**Why it happens:** driver.js's default assumption (verified in source: `disableActiveInteraction: !1` i.e. `false`) is that many tours WANT the user to interact with the highlighted element (a "do this action to continue" pattern) — which is the opposite of this phase's D-01 (Next-button linear, no action required).
**How to avoid:** Set `disableActiveInteraction: true` at the tour-level config (applies to all steps unless a step overrides it).
**Warning signs:** During manual QA, clicking the highlighted currency row during step 1 actually changes the base currency mid-tour, desyncing the tour's assumed state from the actual UI state — exactly the "tour/DOM desync" D-03's rationale warns against.

### Pitfall 6: `navigator.languages` access during SSR throws / must be client-gated
**What goes wrong:** `navigator` does not exist in the Node.js SSR render pass; accessing `navigator.languages` unconditionally at module scope or during the server render would throw `ReferenceError: navigator is not defined`.
**Why it happens:** Standard Next.js App Router client/server boundary — this file lives in a `"use client"` component, but the component function body still runs once during the initial (non-interactive) SSR pass for the HTML shell.
**How to avoid:** Only read `navigator.languages` inside a `useEffect` (which never runs during SSR) or behind an explicit `typeof navigator !== 'undefined'` guard — consistent with the existing `hydrated` pattern already used for `localStorage` reads in `page.tsx`. Do not read it during the render body.
**Warning signs:** Next.js build/SSR error, or a hydration mismatch warning if the guard is inconsistent between server and first client render.

## Code Examples

### Device-language resolution (verified working algorithm)
```typescript
// Source: MDN Intl.Locale + Navigator.languages docs, verified by direct execution
// (Node 22.22.0) against the app's actual 30-locale list from src/lib/translations.ts.
// Recommended location: src/lib/fns.ts (alongside other pure, unit-testable helpers).
import type { Language } from '@/lib/types';

const SUPPORTED_LOCALES: Language[] = [
  'en', 'zh-TW', 'zh-CN', 'ja', 'ko', 'fr', 'de', 'es', 'it', 'pt',
  'ru', 'ar', 'hi', 'bn', 'pa', 'ur', 'vi', 'th', 'id', 'ms',
  'nl', 'sv', 'no', 'da', 'fi', 'pl', 'ro', 'sk', 'sl', 'tr',
];

export const resolveTourLocale = (
  navLangs: readonly string[],
  supported: readonly Language[] = SUPPORTED_LOCALES,
  fallback: Language = 'en'
): Language => {
  const supportedSet = new Set<string>(supported);
  const baseMap = new Map<string, Language>(); // base language subtag -> first matching supported tag
  for (const tag of supported) {
    try {
      const base = new Intl.Locale(tag).language;
      if (!baseMap.has(base)) baseMap.set(base, tag);
    } catch {
      // malformed tag in the supported list itself — skip defensively
    }
  }
  for (const raw of navLangs) {
    if (supportedSet.has(raw)) return raw as Language; // exact match, e.g. 'zh-TW'
    try {
      const base = new Intl.Locale(raw).language;
      const match = baseMap.get(base);
      if (match) return match;
    } catch {
      // malformed navigator.languages entry — skip and try the next candidate
    }
  }
  return fallback;
};

// Usage (client-only, e.g. inside the tour-start useEffect):
// const locale = resolveTourLocale(typeof navigator !== 'undefined' ? navigator.languages : []);
```
Verified test runs: `['en-US','en']` → `'en'`; `['zh-HK','zh']` → `'zh-TW'` (script/region judgment call — flagged in Assumptions Log); `['fr-CA']` → `'fr'`; `['xx-YY']` (unrecognized) → `'en'` fallback.

### `data-tour` attribute pattern (matches existing `aria-label` co-location style)
```typescript
// Source: UI-SPEC anchor map, applied per the codebase's existing pattern of stacking
// multiple attributes on one element (see SearchBar.tsx:94 aria-label + role + aria-controls).
// Example: src/components/ThemeToggle.tsx
<button
  type="button"
  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
  title="Toggle light/dark theme"
  aria-label="Toggle light/dark theme"
  data-tour="tour-theme-toggle"
  className="h-[52px] w-[30px] shrink-0 flex items-center justify-center"
>
```

### InstallButton always-present anchor wrapper (edge case)
```typescript
// Source: UI-SPEC edge-case contract — InstallButton.tsx currently returns `null` outright
// when !deferred (src/components/InstallButton.tsx:30). Must wrap unconditionally instead.
export default function InstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  // ...existing effect...

  return (
    <div data-tour="tour-install" className="w-full flex justify-center my-2 min-h-0">
      {deferred && (
        <button type="button" className="btn btn-sm btn-primary" onClick={/* ... */}>
          Install app
        </button>
      )}
    </div>
  );
}
```

## State of the Art

| Old Approach (assumed in CONTEXT/UI-SPEC) | Actual driver.js 1.6.0 Behavior (verified from source) | When Changed | Impact |
|--------------------------------------------|----------------------------------------------------------|--------------|--------|
| `scrollIntoViewOptions: { block: 'center' }` as an explicit config key | No such config key exists in v1.6.0. Auto-scroll-into-view is unconditional and built-in whenever the target isn't already fully in the viewport, using `block: 'center'` (or `'start'` if the element is taller than the viewport) automatically; `smoothScroll` only toggles `behavior: 'smooth'` vs `'auto'` | N/A — this was never a real v1.x option; UI-SPEC's phrasing was describing desired *behavior*, not an actual API surface | None — the desired behavior is already the default; the plan should NOT add a nonexistent config key, just set `smoothScroll: true` |
| `side: 'auto'` as an explicit value | `side` accepts only `'top' \| 'right' \| 'bottom' \| 'left'` (default `'bottom'`); automatic viewport-edge-avoidance flipping happens internally regardless of the chosen `side`, falling back to a centered placement if no side fits | N/A — same as above, describes behavior not a literal string value | None functionally — just don't set `side: 'auto'` literally (TypeScript would reject it); omit `side` (defaults to `'bottom'`, auto-flips as needed) or set explicit sides matching the UI-SPEC's per-step layout intent |
| `overlayColor` expected to accept `oklch(var(--b1))` CSS var syntax | `overlayColor` is applied via inline `style.fill` on an SVG `<path>` element (`a.style.fill = r("overlayColor") \|\| "rgb(0,0,0)"`) — accepts any valid CSS color string (`rgba()`, named colors, hex) but is set via JS at runtime, not read as a CSS custom property | N/A | UI-SPEC's own answer (hardcode `rgba(0,0,0,0.65)`/`rgba(0,0,0,0.45)`, switched by reading `themeAtom` at init time) is already correct and matches this constraint — no change needed, just confirms the reasoning |
| driver.js theming via CSS custom properties (implied by "read DaisyUI OKLCH theme tokens") | driver.js exposes exactly **one** CSS custom property: `--driver-animation-duration`. All popover colors are hardcoded hex in the shipped stylesheet (`#2d2d2d`, `#fff`, `#ccc`, etc.) | N/A | Confirms the UI-SPEC's own instruction is correct: theming must happen via a dedicated override stylesheet using DaisyUI's `oklch(var(--token))` values applied to driver.js's documented class selectors (`.driver-popover`, `.driver-popover-title`, etc.), not by expecting driver.js to consume CSS vars natively |

**Deprecated/outdated:** None relevant — driver.js 0.x had a substantially different, jQuery-influenced API (documented at `driverjs.com/docs/migrating-from-0x`); this project has no legacy driver.js usage to migrate, so the 0.x→1.x migration guide is not applicable, only confirms 1.x is the current, actively maintained major version.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `zh-HK` (Hong Kong) should map to `zh-TW` (Traditional Chinese) rather than `zh-CN` in the locale resolver, since `Intl.Locale('zh-HK').language` returns `'zh'` and the base-map's first-inserted `zh` entry is whichever of `zh-TW`/`zh-CN` appears first in `SUPPORTED_LOCALES` (currently `zh-TW`, matching translations.ts key order) | Code Examples / device-language resolution | Low — Phase 1 ships English copy only regardless of resolved locale (per D-05's explicit scope note), so this has zero user-visible effect until Phase 3 wires actual translated tour strings. Flag for confirmation before Phase 3 implements the visible mapping. |
| A2 | driver.js's `onCloseClick`/`onDoneClick`/`onDestroyed` all ultimately gate through the same `allowClose`-checked close path, meaning setting `tourSeenAtom = true` inside `onCloseClick` and `onDoneClick` alone (without also relying on `onDestroyed`) is sufficient to cover all three D-02 dismissal gestures (Skip, Escape, overlay-click) | Common Pitfalls (Pitfall 4) | Medium — based on minified-source tracing that was only partially conclusive (variable names collide across closures in the bundled build); if wrong, one of the three dismissal paths could close the tour without setting the seen flag, causing it to auto-restart on the next page load. **Mitigation already built into the recommended pattern:** register `onCloseClick` (fires for close-btn AND, per docs, is the same handler invoked for keyboard/overlay dismissal since those all funnel through the same internal "close" trigger) — but the plan should include a manual test step (press Escape, click overlay, click Skip — verify `localStorage.tourSeen === 'true'` after each) before relying on this in production. |
| A3 | `Intl.Locale` requires no polyfill for this project's actual target browsers | Standard Stack / Code Examples | Low — `Intl.Locale` has been in Baseline-widely-available browsers since 2021 (Chrome 74+, Firefox 75+, Safari 14+); the app has no documented minimum-browser-support requirement in CLAUDE.md/PROJECT.md, and the existing codebase already uses other modern APIs (`navigator.clipboard`, `beforeinstallprompt`) without polyfills, suggesting evergreen-browser support is already the implicit baseline. |

## Open Questions

1. **Exact wording/order for `onCloseClick` vs relying on driver.js's default close behavior**
   - What we know: Docs state "By default, the `onCloseClick` callback calls `driverObj.destroy()`" and "When you configure these callbacks, the default functionality of the buttons will be disabled" — meaning if the plan registers a custom `onCloseClick`, it MUST manually call `driver.destroy()` itself (shown in Pattern 1's example) or the popover will not actually close.
   - What's unclear: Whether Escape-key and overlay-click dismissal (which do NOT go through `onCloseClick` per the button-specific docs, but through the separate `allowClose`/`overlayClickBehavior` mechanism traced in source) also need their own explicit state-setting, or whether they're covered by a single `onDestroyed` hook that fires regardless of dismissal path.
   - Recommendation: The planner should specify a task to register BOTH `onCloseClick` (button) AND a defensive `onDestroyed` that also sets `tourSeenAtom = true` (idempotent — setting an already-`true` atom is harmless), rather than relying on only one hook. This trades a small risk of Pitfall 4 (Strict-Mode double-invoke false-positive) for certainty that no real dismissal path is missed; the Strict-Mode risk is dev-only and low-severity (worst case: tour doesn't show once in local dev after a hot-reload, easily noticed and non-blocking).

2. **Whether `driver.js/dist/driver.css` should be imported globally in `layout.tsx` or lazy-loaded alongside the tour-start code**
   - What we know: UI-SPEC says "imported once in `src/app/layout.tsx` or lazily alongside the tour init" — leaves it as an open choice.
   - What's unclear: Next.js App Router CSS-import behavior for a client-only conditional feature; importing in `layout.tsx` means the ~2-3KB CSS ships on every page load (including for returning visitors who'll never see the tour again), whereas dynamic `import()` alongside the driver.js JS module would defer it.
   - Recommendation: Given the library is already tiny (92KB unpacked, and CSS is a small fraction of that) and DaisyUI/Tailwind's own global CSS is already loaded on every page regardless, importing both `driver.js/dist/driver.css` and the new `src/theme/tour.css` override file statically in `layout.tsx` is simpler and avoids a dynamic-import code-splitting edge case with SSR; the bundle-size cost is negligible relative to the existing app. This is Claude's Discretion per CONTEXT.md ("driver.js config surface") — recommend static import, but flag as a planner decision point, not a re-litigation of a locked choice.

## Project Constraints (from CLAUDE.md)

- **Tech stack lock:** Next.js 14 App Router, React 18, TypeScript, Jotai, SWR, DaisyUI + Tailwind — tour must fit this; client-side only (`"use client"`). Confirmed compatible: driver.js has zero framework dependencies and works as plain DOM manipulation inside any `"use client"` component.
- **Library lock:** driver.js only — not yet in `package.json`, must be added as a Plan 1 task (`npm install driver.js`, per the project's `package-lock.json`/npm convention — note CLAUDE.md's STACK.md section flags conflicting lockfiles (`package-lock.json`, `bun.lockb`, Yarn PnP artifacts coexist); use `npm` since `package-lock.json` was the most recently modified per that doc, and this research's `npm view`/`slopcheck` calls both operated via npm without incident).
- **Selector lock:** `data-tour` attributes only, never translated `aria-label`/`title` — every anchor in this research's Code Examples section follows this.
- **No backend:** "seen" state is `localStorage`-only, via `atomWithStorage`, per-browser — `tourSeenAtom` follows the exact existing pattern (`export const tourSeenAtom = atomWithStorage<boolean>('tourSeen', false);` in `src/lib/atoms.ts`).
- **i18n scaffold-not-full:** Tour copy must be added in a translation-ready shape now (Phase 1), but full 30-language dictionary entries are Phase 3's job (I18N-01) — this research's recommendation to hardcode English strings in `src/lib/tourSteps.ts` (not inline in `page.tsx`, and not yet inside `translations.ts`) matches this.
- **Accessibility groundwork:** "keyboard-navigable and dismissible; consistent with existing a11y work (commit 7daf09d)" — Phase 1 gets this mostly for free from driver.js's default `allowKeyboardControl: true` and built-in focus-trap; full A11Y-01 hardening (explicit ARIA live regions, etc.) is explicitly Phase 3 scope per REQUIREMENTS.md, so Phase 1 should not attempt to build custom ARIA announcements beyond what driver.js provides by default.
- **GSD workflow enforcement:** All file-changing work must go through `/gsd-execute-phase` or equivalent GSD entry points, not direct ad-hoc edits — applies to the planner/executor, not this research step (this research made no lasting repo changes; the one incidental `npm install` side-effect from the slopcheck gate was reverted).
- **Code style:** 2-space indent, single quotes, `@/` path-alias imports (not relative, except same-directory), named exports for `lib/` modules (no default export) — `src/lib/tourSteps.ts` and the `resolveTourLocale` addition to `src/lib/fns.ts` should follow this exactly, matching the file's existing style shown in Code Examples above.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TOUR-01 | First-time visitor sees the tour auto-start on first load of the home page (`/`) | Pattern 1 (tour-start `useEffect` gated on `hydrated && !tourSeen && effectiveAll`) + Pitfall 6 (SSR/navigator guard) directly implement this. |
| TOUR-02 | Tour auto-starts at most once per browser via a persisted "seen" flag; never auto-repeats | `tourSeenAtom = atomWithStorage<boolean>('tourSeen', false)` (State Contract, matches locked pattern) + Pitfall 3/4 (Strict-Mode guard, correct hook wiring so the flag is set on every real dismissal path but not on incidental React remounts). |
| TOUR-04 | User can skip/dismiss the tour at any step; overlay closes immediately and "seen" flag is set | `allowClose: true` (default) + `onCloseClick`/`onDestroyed` wiring in Pattern 1; Open Question 1 covers the exact hook-registration risk; Pitfall 4 covers the false-positive risk to avoid. |
| TOUR-05 | User can move forward and backward between tour steps | driver.js's built-in `showButtons: ['next','previous','close']` default + `moveNext()`/`movePrevious()` API (confirmed in API Reference research) — no custom nav logic needed. |
| TOUR-06 | Tour presents the 8 guided steps, each anchored to a stable, non-translated `data-tour` target | Anchor Map (System Architecture Diagram) + Code Examples (`data-tour` attribute pattern, `InstallButton` always-present wrapper) directly enumerate all 8 anchors per the UI-SPEC's file:line locations; Pitfall 2 covers the "8, not 9" progress-count correctness requirement. |
</phase_requirements>

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Local dev/build, `npm install` | Yes | v22.22.0 (verified via `node --version`) | — |
| npm | Package install | Yes | present (used successfully by slopcheck's `npm install driver.js` test run) | — |
| `driver.js` package | Tour engine | Not yet installed (confirmed absent from current `package.json`) | Target `^1.6.0` | None needed — this is the Plan 1 install task itself, not a missing external tool |
| `Intl.Locale` (native JS API) | Device-language resolution | Yes (Node 22.22.0 confirmed; Baseline-widely-available in browsers since 2021) | Native, no package | None needed |
| slopcheck (dev tool, not shipped) | Package legitimacy verification (this research session only) | Yes, v0.6.1 | — | — |

**Missing dependencies with no fallback:** none — `driver.js` itself is the one "missing" item, and installing it is an explicit Plan 1 task, not a blocker.

**Missing dependencies with fallback:** none applicable.

## Sources

### Primary (HIGH confidence)
- `driverjs.com/docs/configuration` — full config option list (`allowClose`, `overlayClickBehavior`, `animate`, `smoothScroll`, `overlayColor`, `stagePadding`, `disableActiveInteraction`, `popoverClass`, lifecycle hooks, `DriveStep` shape, centered-modal-via-no-`element` behavior)
- `driverjs.com/docs/api` — full method reference (`driver()`, `drive()`, `destroy()`, `moveNext()`/`movePrevious()`/`moveTo()`, `hasNextStep()`/`hasPreviousStep()`, `isActive()`, `refresh()`, `setConfig()`/`setSteps()`, `getState()`, `highlight()`)
- `driverjs.com/docs/buttons` — `showButtons`, `nextBtnText`/`prevBtnText`/`doneBtnText`, `onNextClick`/`onPrevClick`/`onCloseClick`/`onDoneClick` semantics, "default functionality disabled when callback configured" warning
- `driverjs.com/docs/theming` — full CSS class enumeration (`.driver-popover`, `.driver-popover-title`, `.driver-active-element`, `.driver-overlay`, `.driver-active`, `.driver-fade`/`.driver-simple`, `popoverClass` usage, `onPopoverRender` escape hatch)
- `driverjs.com/docs/styling-overlay` — `overlayColor`/`overlayOpacity` confirmation
- Direct inspection of installed package source: `node_modules/driver.js/dist/driver.js.mjs` (v1.6.0) and `node_modules/driver.js/dist/driver.css` — used to verify (a) `allowKeyboardControl` defaults to `true` and gates Escape/arrow-key handling, (b) Escape/overlay-click/close-button all route through the `allowClose`-gated close path, (c) `disableActiveInteraction` defaults to `false`, (d) exactly one CSS custom property (`--driver-animation-duration`) exists, (e) default `z-index: 1000000000` on `.driver-popover`, (f) no `scrollIntoViewOptions` config key exists — scroll-to-center is unconditional/automatic, (g) default `side: 'bottom'`/`align: 'start'` with automatic viewport-edge-avoidance flip logic, no literal `'auto'` value
- `npm view driver.js` (version, time.modified, repository.url, homepage, maintainers, author, license, scripts, scripts.postinstall, dist.unpackedSize) — direct registry query, 2026-07-04
- `slopcheck install driver.js` (v0.6.1) — [OK] verdict, direct registry+heuristic check, 2026-07-04
- Chrome for Developers, "Meet the top layer" (developer.chrome.com/blog/what-is-the-top-layer) — authoritative source confirming native `<dialog>`'s top-layer stacking is independent of and supersedes ordinary z-index
- MDN `Navigator.languages`, `Intl.Locale` — API shape and browser-support baseline confirmation
- Direct execution of the candidate `resolveTourLocale` algorithm in Node 22.22.0 against the app's actual 30-locale list (extracted from `src/lib/translations.ts` via a verification script) — confirmed working for exact match, base-language fallback, and unsupported-tag fallback cases

### Secondary (MEDIUM confidence)
- WebSearch cross-referencing GitHub org history (`kamranahmedse/driver.js` → `nilbuild/driver.js` transfer, URLs redirect, same maintainer) — corroborated by `npm view driver.js maintainers`/`author` showing consistent identity across the transfer
- WebSearch on React 18 Strict Mode double-invoke behavior (react.dev, multiple community sources) — standard, well-established React behavior, not driver.js-specific

### Tertiary (LOW confidence)
- Minified-source tracing of the exact internal function wiring for `onCloseClick`/escape/overlay-click convergence (Open Question 1, Assumption A2) — the bundled/minified build's variable-name collisions across closures made full static tracing inconclusive; recommendation is to verify by manual QA rather than trust the trace alone

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — driver.js is a locked upstream decision; version/legitimacy independently re-verified via `npm view` + slopcheck + official docs, not just training-data recall
- Architecture: HIGH — every architectural claim (client-only tier, CSS-override theming, native-dialog top-layer conflict, anchor placement) is either directly sourced from official docs or confirmed by reading the actual installed package source
- Pitfalls: HIGH for Pitfalls 1, 2, 3, 5, 6 (all confirmed via source inspection or authoritative external docs); MEDIUM for Pitfall 4 / Open Question 1 / Assumption A2 (the exact internal hook-convergence behavior for all three dismissal gestures could not be fully confirmed via static analysis of the minified bundle — flagged explicitly for manual QA in the plan)

**Research date:** 2026-07-04
**Valid until:** 30 days (driver.js is a stable, infrequently-breaking-change library; re-verify `npm view driver.js version` before Phase 2/3 execution in case a new major version ships)
