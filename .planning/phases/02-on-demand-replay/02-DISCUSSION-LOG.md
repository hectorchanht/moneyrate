# Phase 2: On-Demand Replay - Discussion Log

> **Audit trail only.** Not consumed by downstream agents.

**Date:** 2026-07-04
**Phase:** 02-on-demand-replay
**Areas discussed:** Control placement & icon, Replay↔seen-flag semantics

---

## Control placement & icon

| Option | Description | Selected |
|--------|-------------|----------|
| Top bar, "?" circle icon | Question-mark-circle icon button in the existing top action row, matching sibling controls. | ✓ |
| Top bar, text "?" | Plain "?" character button, no new SVG. | |
| Floating button (corner) | Floating action button pinned to a corner; new UI pattern. | |

**User's choice:** Top bar, "?" circle icon
**Notes:** Should feel like the other top-bar icon controls, not a loud floating button.

---

## Replay ↔ seen-flag semantics

| Option | Description | Selected |
|--------|-------------|----------|
| No — replay independent | "?" relaunches regardless of seen; tourSeen untouched (stays true); auto-start never re-fires. | ✓ |
| Reset seen on replay | Replay clears tourSeen so auto-start fires again next load. | |

**User's choice:** No — replay independent (TOUR-02 semantics preserved)

## Claude's Discretion
- SVG path glyph, startTour() shape (fn/useCallback/hook), aria-label wording.

## Deferred Ideas
- 30-locale i18n of the "?" label → Phase 3. A11y/mobile hardening → Phase 3. App-wide lang detect (LANG-01) → backlog.
