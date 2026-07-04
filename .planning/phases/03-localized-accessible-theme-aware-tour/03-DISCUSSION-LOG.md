# Phase 3: Localized, Accessible, Theme-Aware Tour - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-04
**Phase:** 3-Localized, Accessible, Theme-Aware Tour
**Areas discussed:** Locale source, Translation production, Keyboard a11y depth, Mobile popover

---

## Locale source (conflict reconciliation)

Flagged before discussion: Phase-1 D-05 locked device-language-first (`navigator.languages`) for the tour; Phase-3 SC1 wants the app language toggle (`languageAtom` via `useTranslation`) to drive tour copy. Direct conflict.

**Round 1 — which source drives the tour?**

| Option | Description | Selected |
|--------|-------------|----------|
| App language wins | Tour reads languageAtom; single source; matches chrome; retires D-05 | |
| Hybrid: app-choice else device | languageAtom if set, else navigator.languages | |
| Device wins (keep D-05) | Tour stays device-driven; fails SC1 after a switch | ✓ (with caveat) |

**User's choice:** "3 and the app language should be default to device language so there is no conflict."
**Notes:** User's real goal is *no conflict*, unified on device language. Claude pointed out (a) true no-conflict needs a single source of truth — tour must read the same source as the app; and (b) "app defaults to device language" = LANG-01, explicitly deferred to v2. Reframed into a scope question.

**Round 2 — pull LANG-01 into this phase?**

| Option | Description | Selected |
|--------|-------------|----------|
| Pull LANG-01 in now | First load defaults languageAtom to device locale; tour reads languageAtom | ✓ |
| Keep LANG-01 deferred | Tour reads languageAtom; app stays English-by-default | |

**User's choice:** Pull LANG-01 in now.
**Notes:** Resolution → tour reads `languageAtom` (D-01/D-02); `languageAtom` defaults to device locale on first load only, stored choice wins (D-03). Unifies both, satisfies SC1, matches the user's device-default intent. Hydration-safe first-load default required.

---

## Translation production

**Round 1 — storage/structure**

| Option | Description | Selected |
|--------|-------------|----------|
| `tour` namespace in translations.ts | Parallel to home/settings; per-string en fallback; one source of truth | ✓ |
| Separate tourTranslations.ts | Isolated file keyed by locale | |
| You decide | Claude picks during planning | |

**User's choice:** `tour` namespace in translations.ts.

**Round 2 — authoring approach**

| Option | Description | Selected |
|--------|-------------|----------|
| Claude translates all 30 now | Author English, generate all 30 locales this phase | ✓ |
| English + top locales, rest fall back | Subset properly translated, rest English fallback | |
| English only now, translate later | Plumbing + English only | |

**User's choice:** Claude translates all 30 now.
**Notes:** Matches PROJECT.md "all 30, no partial onboarding" + I18N-01. Native-speaker review is a non-blocking follow-up.

---

## Keyboard a11y depth

| Option | Description | Selected |
|--------|-------------|----------|
| Standard: rings + focus restore + reduced-motion | Focus-visible rings, restore focus to "?" on close, prefers-reduced-motion disables animation/smoothScroll | ✓ |
| Minimal: focus rings only | Rings only; trust driver.js otherwise | |
| Full: + explicit focus mgmt + ARIA audit | Initial focus per step, ARIA/live-region audit, trap verification | |

**User's choice:** Standard.
**Notes:** Builds on driver.js built-ins (keyboard nav + focus trap); clears the reduced-motion item deferred from Phase 2.

---

## Mobile popover

| Option | Description | Selected |
|--------|-------------|----------|
| Responsive width + trust auto-place | max-width min(320px, calc(100vw - 2rem)); driver.js auto-placement + smoothScroll; per-step side only if QA needs it | ✓ |
| Explicit per-step side/align | Hand-set placement for all 8 steps | |
| Force centered popovers on mobile | Element-independent centered popovers below a breakpoint | |

**User's choice:** Responsive width + trust auto-place.

---

## Claude's Discretion

- Hydration-safe mechanism for the first-load device-language default (D-03).
- `:focus-visible` ring width/offset and focus-restoration wiring.
- Per-language translation wording (concise, ≤ current English lengths for mobile fit).
- Any single step's explicit mobile `side` if QA shows misplacement.

## Deferred Ideas

- Tours for `/chart` and `/convert/[pair]` — TOUR-07, v2.
- Contextual/just-in-time tips — TOUR-08, v2.
- App-wide RTL (`dir="rtl"` for ar/ur) — beyond this phase; only tour popover RTL checked in QA.
- Native-speaker review of the 30 machine-authored translations — non-blocking follow-up.

**LANG-01 is NOT deferred** — pulled into this phase (D-03).
