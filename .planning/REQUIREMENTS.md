# Requirements: moneyrate — Onboarding Tour

**Defined:** 2026-07-04
**Core Value:** A first-time visitor understands how to use moneyrate within seconds — key interactions are demonstrated, not hidden.

## v1 Requirements

Requirements for the onboarding-tour milestone. Each maps to a roadmap phase.

### Onboarding Tour

- [ ] **TOUR-01**: First-time visitor sees the tour auto-start on first load of the home page (`/`)
- [x] **TOUR-02**: Tour auto-starts at most once per browser via a persisted "seen" flag; it never auto-repeats on later visits
- [ ] **TOUR-03**: User can replay the tour anytime via a persistent "?" help control
- [ ] **TOUR-04**: User can skip/dismiss the tour at any step; the overlay closes immediately and the "seen" flag is set
- [ ] **TOUR-05**: User can move forward and backward between tour steps
- [x] **TOUR-06**: Tour presents the 8 guided steps — set base (tap a row), edit amount, add currency (search), manage list/settings, share link, theme toggle, historical-date picker, PWA install — each anchored to a stable, non-translated `data-tour` target

### Localization

- [ ] **I18N-01**: Tour copy renders in the user's active language across all 30 supported locales, via the existing `translations.ts` / `useTranslation()` system (falls back to English when a string is missing)

### Accessibility & Responsiveness

- [ ] **A11Y-01**: Tour is fully keyboard-operable (advance, back, dismiss) and honors the active light/dark theme
- [ ] **A11Y-02**: Tour renders correctly on mobile / touch viewports without breaking the responsive layout

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Onboarding

- **TOUR-07**: Tour coverage for the `/chart` and `/convert/[pair]` routes
- **TOUR-08**: Contextual/just-in-time tips triggered by feature discovery (beyond the linear tour)

### Localization

- **LANG-01**: App-wide default UI language auto-detected from the device (`navigator.languages` → nearest supported locale → English), beyond the onboarding tour. New capability — own future phase.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Server-side onboarding analytics / A/B testing | App has no backend; no telemetry infra |
| Cross-device "seen tour" sync / user accounts | App is local-only by design |
| Rewriting existing features to add IDs beyond tour needs | Only minimal, tour-scoped `data-tour` anchors added |

## Traceability

Which phases cover which requirements. Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TOUR-01 | Phase 1 - Guided First-Run Tour | Pending |
| TOUR-02 | Phase 1 - Guided First-Run Tour | Complete |
| TOUR-03 | Phase 2 - On-Demand Replay | Pending |
| TOUR-04 | Phase 1 - Guided First-Run Tour | Pending |
| TOUR-05 | Phase 1 - Guided First-Run Tour | Pending |
| TOUR-06 | Phase 1 - Guided First-Run Tour | Complete |
| I18N-01 | Phase 3 - Localized, Accessible, Theme-Aware Tour | Pending |
| A11Y-01 | Phase 3 - Localized, Accessible, Theme-Aware Tour | Pending |
| A11Y-02 | Phase 3 - Localized, Accessible, Theme-Aware Tour | Pending |

**Coverage:**
- v1 requirements: 9 total
- Mapped to phases: 9/9 ✓
- Unmapped: 0

---
*Requirements defined: 2026-07-04*
*Last updated: 2026-07-04 after roadmap creation*
