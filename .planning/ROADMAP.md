# Roadmap: moneyrate — Onboarding Tour

**Mode:** mvp (Vertical MVP)
**Granularity:** coarse
**Core Value:** A first-time visitor understands how to use moneyrate within seconds of landing — the key interactions are demonstrated, not hidden.

## Phases

- [x] **Phase 1: Guided First-Run Tour** - A first-time visitor automatically sees a full 8-step guided tour of the home page, navigable and dismissible, that never repeats uninvited. (completed 2026-07-04)
- [x] **Phase 2: On-Demand Replay** - Any visitor can reopen the same tour at any time via a persistent help control. (completed 2026-07-04)
- [ ] **Phase 3: Localized, Accessible, Theme-Aware Tour** - The tour reads correctly in the visitor's language, is fully keyboard-operable, honors light/dark theme, and works on mobile/touch.

## Phase Details

### Phase 1: Guided First-Run Tour
**Goal**: A first-time visitor lands on `/`, the tour auto-starts, and they can walk through all 8 key interactions (or skip out) without it ever auto-running again.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: TOUR-01, TOUR-02, TOUR-04, TOUR-05, TOUR-06
**Success Criteria** (what must be TRUE):
  1. On a browser with no prior visit, loading `/` auto-starts the tour after hydration (no flash/mismatch), highlighting the first anchor.
  2. The tour visits all 8 anchors in order — set base (tap row), edit amount, add currency (search), manage list/settings, share link, theme toggle, historical-date picker, PWA install — each spotlighting a dedicated `data-tour="..."` element (not a translated `aria-label`).
  3. The visitor can step forward and backward through the tour at will, and the current step is always visually clear.
  4. Dismissing/skipping at any step immediately closes the overlay and persists a "seen" flag (via a new `atomWithStorage` in `src/lib/atoms.ts`) so the tour does not auto-start on the next visit or reload.
  5. Reloading `/` after completing or skipping the tour shows the app with no tour overlay.
**Plans**: TBD
**UI hint**: yes

### Phase 2: On-Demand Replay
**Goal**: A visitor who already dismissed or completed the tour (or wants a refresher) can relaunch the identical guided walkthrough at any time.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: TOUR-03
**Success Criteria** (what must be TRUE):
  1. A persistent "?" help control is visible on the home page regardless of "seen" state.
  2. Clicking/tapping the "?" control launches the same 8-step tour from Phase 1, starting at step 1, with full forward/back/skip behavior intact.
  3. Replaying the tour does not reset or corrupt the persisted "seen" flag's original semantics (it remains "seen" for auto-start purposes before and after a manual replay).
**Plans**: 1 plan
Plans:
- [x] 02-01-PLAN.md — Add `QuestionSvg` + extract a reusable `startTour()`; wire a persistent "?" replay button that relaunches the Phase-1 tour independent of the seen-flag
**UI hint**: yes

### Phase 3: Localized, Accessible, Theme-Aware Tour
**Goal**: The tour is a first-class citizen of moneyrate's existing i18n, accessibility, and theming systems — not an English-only, mouse-only, light-mode-only bolt-on.
**Mode:** mvp
**Depends on**: Phase 1, Phase 2
**Requirements**: I18N-01, A11Y-01, A11Y-02
**Success Criteria** (what must be TRUE):
  1. Switching the app's active language changes all tour step titles/body copy accordingly, for all 30 supported locales, via `useTranslation()`/`translations.ts`, falling back to English for any missing string.
  2. A visitor can operate the entire tour — advance, go back, dismiss — using only the keyboard, with visible focus states throughout.
  3. The tour's popover/overlay styling follows the app's active light or dark theme (no unstyled or wrong-theme flash).
  4. On a mobile/touch viewport, all 8 tour steps render fully on-screen, remain tappable, and do not break or overflow the existing responsive layout.
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Guided First-Run Tour | 3/3 | Complete   | 2026-07-04 |
| 2. On-Demand Replay | 1/1 | Complete   | 2026-07-04 |
| 3. Localized, Accessible, Theme-Aware Tour | 0/? | Not started | - |

---
*Roadmap created: 2026-07-04*
