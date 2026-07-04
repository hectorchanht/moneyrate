# Phase 1: Guided First-Run Tour - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-04
**Phase:** 01-guided-first-run-tour
**Areas discussed:** Step advancement, Dismissal gestures, Backdrop interactivity, Tour framing

---

## Step advancement

| Option | Description | Selected |
|--------|-------------|----------|
| Next-button linear | User advances via Next/Back; performing the action not required. Simplest with driver.js. | ✓ |
| Auto-advance on action | Doing the highlighted action advances; Next as fallback. More engaging, fragile (detect 8 actions). | |
| You decide | Leave to planner/executor discretion. | |

**User's choice:** Next-button linear
**Notes:** Tour is a quick guided walkthrough, not an interactive tutorial to "complete."

---

## Dismissal gestures

| Option | Description | Selected |
|--------|-------------|----------|
| Skip + Esc + click-outside | All three close it (driver.js default). Skip always visible. | ✓ |
| Skip + Esc only | Click-outside does not dismiss — avoids accidental mobile close. | |
| Skip button only | Explicit dismissal only. | |

**User's choice:** Skip + Esc + click-outside
**Notes:** All paths set the "seen" flag and close immediately.

---

## Backdrop interactivity

| Option | Description | Selected |
|--------|-------------|----------|
| Block interaction | Dimmed modal spotlight; underlying UI not clickable during a step. | ✓ |
| Allow live interaction | User can use the highlighted control mid-tour. Pairs with auto-advance; desync risk. | |

**User's choice:** Block interaction
**Notes:** Pairs cleanly with Next-button linear (D-01).

---

## Tour framing

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, welcome card | Centered intro before step 1 + easy early exit. 1 intro popover + 8 feature steps. | ✓ |
| No, dive into step 1 | Start directly on set-base-currency anchor. | |

**User's choice:** Yes, welcome card
**Notes:** "8 steps" (TOUR-06) still means the 8 anchored feature steps; the welcome card is additional.

---

## Claude's Discretion

- Exact popover z-index value (above app chrome + native `<dialog>` top-layer where applicable).
- Precise welcome-card English copy (structured for Phase 3 i18n).
- driver.js config surface (animation, smooth-scroll to offscreen anchors 5–8).

## Deferred Ideas

None — discussion stayed within phase scope. Replay → Phase 2; i18n/a11y/theme/mobile hardening → Phase 3; other-route tours → v2.
