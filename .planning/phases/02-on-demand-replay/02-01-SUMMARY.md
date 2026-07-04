---
phase: 02-on-demand-replay
plan: 01
status: complete
requirements: [TOUR-03]
completed: 2026-07-04
---

# Plan 02-01 Summary — On-Demand Tour Replay

**Objective:** Add a persistent "?" help control that relaunches the identical Phase-1 tour from step 1, backed by an extracted reusable `startTour()`.

> Note: the executor agent completed both tasks and committed them, then hit an API certificate error during the wrap-up step, so this SUMMARY.md + the tracking updates were finalized by the orchestrator. All acceptance criteria were re-verified against the committed code.

## What was built

- **`src/lib/svgs.tsx`** — added `QuestionSvg` (question-mark-circle icon) mirroring `ShareSvg`'s signature/props-spread. Pre-existing `QuestionMarkSvg` left untouched. (commit `6ee2ec1`)
- **`src/app/page.tsx`** — extracted the tour build+configure+drive logic from the auto-start `useEffect` into ONE reusable `startTour()` (`useCallback`). Both callers route through it:
  - Auto-start effect keeps its `hydrated && !tourSeen && effectiveAll && !tourStartedRef.current` gate, then calls `startTour()` (TOUR-01/TOUR-02 preserved).
  - New persistent "?" `<button aria-label="Replay tour">` in the top action row calls `startTour()` on click, bypassing those gates (TOUR-03).
  - `startTour()` destroys+nulls any existing `tourDriverRef.current` first (no stacked overlays / leaks on rapid replay) and never writes `tourSeenAtom` (D-03). (commit `297fa1c`)

## Verification (re-checked against committed code)

- `npm run build` ✓ · `npx vitest run` → 64/64 ✓
- `grep -c 'const startTour'` == 1 · `grep -c 'driver({'` == 1 (single config, no duplication)
- `grep -c 'setTourSeen(true)'` == 3 (only the 3 driver callbacks — replay path never writes the seen flag; D-03 / TOUR-02 preserved)
- `grep -c 'useEffect(() => () =>'` == 1, auto-start effect returns no cleanup (the a818626 dep-change-teardown bug is NOT reintroduced)
- `QuestionSvg` added (1) + `QuestionMarkSvg` preserved (1); `aria-label="Replay tour"` present; `QuestionSvg` imported + rendered
- Live browser QA: performed by orchestrator (see below / VERIFICATION.md)

## Deviations

- Tasks 1 & 2 committed separately (as planned). SUMMARY + tracking written by orchestrator after the executor's post-commit API drop — no code impact.

## Requirements

- **TOUR-03** — persistent "?" control relaunches the 8-step tour from step 1, independent of the seen-flag. ✓
