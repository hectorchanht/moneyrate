# Phase 2: On-Demand Replay - Context

**Gathered:** 2026-07-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a persistent **"?" help control** to the home page (`/`) that relaunches the identical Phase-1 guided tour from step 1, at any time, regardless of whether the tour has been seen. Requirement TOUR-03. Reuses the Phase-1 tour engine (driver.js, `buildTourSteps`, `tour.css`) — no new tour content or steps.

Out of scope: full 30-locale i18n of the control's label + keyboard-a11y/theme/mobile hardening (Phase 3, I18N-01/A11Y-01/A11Y-02). Phase 1 (the tour itself) is complete.
</domain>

<decisions>
## Implementation Decisions

### Control placement & icon
- **D-01:** Place the replay control in the existing top action row in `src/app/page.tsx` (the `<span className="flex gap-2 w-full items-start">` at ~line 283 holding `CurrencyListModal`, the share button, `ThemeToggle`, `SearchBar`). It is always visible regardless of `tourSeen` state.
- **D-02:** Use a **question-mark-circle icon** button. Add a new inline SVG component (e.g. `QuestionSvg`) to `src/lib/svgs.tsx` following the existing pattern (e.g. `ShareSvg`). Match the sizing/hit-area of the sibling icon buttons (the share button is `h-[52px] w-[30px]` flex-centered — mirror that).

### Replay ↔ seen-flag semantics
- **D-03:** Replay is **independent** of auto-start. Clicking "?" relaunches the tour regardless of `tourSeen`, and does **NOT** modify `tourSeenAtom` (it stays `true` once set). The auto-start effect remains gated on `!tourSeen`, so first-run auto-start still never re-fires after the tour has been seen (TOUR-02 preserved). Completing/dismissing a replay sets `tourSeen` again (harmless — already true).

### Refactor for reuse
- **D-04:** Extract the tour build+configure+drive logic currently inline in the auto-start `useEffect` (`src/app/page.tsx` ~165–227) into a single reusable `startTour()` (plain function or small hook) called by BOTH the auto-start effect and the "?" `onClick`. Requirements:
  - Before starting, destroy any existing instance held in `tourDriverRef` so a replay never stacks two overlays / leaks the previous driver.
  - Reuse `buildTourSteps`, `resolveTourLocale`, `SUPPORTED_LOCALES`, `TOUR_INSTALL_FALLBACK_DESCRIPTION`, the same missing-anchor filter, and the same driver config (D-01..D-03 from Phase 1: `disableActiveInteraction`, `allowClose`, Next-button linear, `doneBtnText`, theme-aware `overlayColor`).
  - The auto-start path keeps its `tourStartedRef` + `hydrated && !tourSeen && effectiveAll` gate; the "?" path bypasses those gates (explicit user intent) but still routes through the same `startTour()`.
  - Keep the mount-only unmount cleanup that destroys `tourDriverRef.current` (do NOT reintroduce a dep-change teardown — that was the Phase-1 bug fixed in commit `a818626`).

### Accessibility (minimal for this phase)
- **D-05:** The "?" button is a real `<button>` with an English `aria-label` (e.g. "Replay tour") and `title`. Full 30-locale localization of that label is deferred to Phase 3 (I18N-01). The control is NOT itself a tour step (no `data-tour` anchor).

### Claude's Discretion
- Exact SVG path for the question-mark-circle glyph.
- Whether `startTour()` is a standalone function inside the component, a `useCallback`, or a tiny `useTourController` hook — pick what keeps `page.tsx` cleanest.
- Exact aria-label/title English wording.
</decisions>

<specifics>
## Specific Ideas

- The "?" should feel like the other top-bar icon controls (same visual weight, hover), not a loud floating button.
- Replay should start from the welcome card (step 1 of the flow), identical to first-run.
</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Tour engine (Phase 1 — reuse, do not rebuild)
- `src/app/page.tsx` §tour-start `useEffect` (~165–227) + mount-only cleanup (~228) — the logic to extract into `startTour()`.
- `src/lib/tourSteps.ts` — `buildTourSteps`, `TOUR_STEP_COUNT`, `SUPPORTED_LOCALES`, `TOUR_INSTALL_FALLBACK_DESCRIPTION`.
- `src/lib/atoms.ts` — `tourSeenAtom` (do not reset on replay).
- `src/lib/fns.ts` — `resolveTourLocale`.
- `src/theme/tour.css` — popover theming (already imported in layout).
- `.planning/phases/01-guided-first-run-tour/01-UI-SPEC.md` — tour visual/interaction contract (still authoritative).
- `.planning/phases/01-guided-first-run-tour/01-VERIFICATION.md` — documents the teardown bug + fix that must NOT regress.

### Phase scope
- `.planning/ROADMAP.md` §"Phase 2: On-Demand Replay" — goal + 3 success criteria.
- `.planning/REQUIREMENTS.md` — TOUR-03.

No external ADRs/specs.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- The entire Phase-1 tour machinery (driver config, step builder, locale resolver, seen-flag atom, themed CSS) — Phase 2 only adds a second entry point + a button.
- `src/lib/svgs.tsx` inline-SVG component pattern (`ShareSvg` etc.) for the new `QuestionSvg`.
- The share button JSX in `page.tsx:285-296` is the closest structural analog for the new icon button (aria-label + title + sizing).

### Established Patterns
- Top-bar controls are icon buttons in one flex row; new control joins that row.
- `"use client"` — the button + onClick live in the client `page.tsx`.

### Integration Points
- `src/app/page.tsx`: extract `startTour()`; add the "?" `<button onClick={startTour}>` to the top action row; wire the auto-start effect to call `startTour()`.
- `src/lib/svgs.tsx`: add `QuestionSvg`.
</code_context>

<deferred>
## Deferred Ideas

- 30-locale i18n of the "?" aria-label/title → Phase 3 (I18N-01).
- Keyboard-focus/reduced-motion/mobile hardening of the control → Phase 3 (A11Y-01/02).
- App-wide device-language auto-detect (LANG-01) → backlog (unrelated to this phase).
</deferred>

---

*Phase: 02-on-demand-replay*
*Context gathered: 2026-07-04*
