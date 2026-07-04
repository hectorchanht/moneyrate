# Phase 3: Localized, Accessible, Theme-Aware Tour - Context

**Gathered:** 2026-07-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the existing driver.js tour (built in Phases 1–2) a first-class citizen of moneyrate's i18n, accessibility, and theming systems — not an English-only, mouse-only, light-mode-only bolt-on. Covers **I18N-01, A11Y-01, A11Y-02**, plus **LANG-01 pulled forward from v2** (see D-03).

The tour engine, 8 anchored steps, `data-tour` selectors, `tourSeenAtom`, and the reusable `startTour()` entry point are DONE and locked (Phases 1–2). This phase adds: localized copy across 30 locales, keyboard-a11y hardening, mobile popover fit, and unifies the tour's language with the app's. Theme-following is already implemented in `tour.css` (verify only, not re-decided).

Out of scope: tours for `/chart` or `/convert/[pair]` (TOUR-07, v2); contextual just-in-time tips (TOUR-08, v2); new tour steps or content.
</domain>

<decisions>
## Implementation Decisions

### Tour locale source (reconciles Phase-1 D-05 vs Phase-3 SC1)
- **D-01:** The tour reads its locale from the app's **`languageAtom`** (via `useTranslation()` / `translations[language]`), the SAME source the rest of the UI uses. Single source of truth → the tour ALWAYS matches the visible chrome, and switching language in Settings changes tour copy (satisfies SC1).
- **D-02:** This **retires the Phase-1 D-05 "device-language-first" path for the tour**. `startTour()` must stop reading `navigator.languages` directly to pick tour copy; it uses the active `languageAtom` instead. `resolveTourLocale` is repurposed per D-03 (not deleted).

### LANG-01 pulled into this phase (app-wide device-language default)
- **D-03:** On **first load only** (no stored `language` key in localStorage), default `languageAtom` to the device locale: `resolveTourLocale(navigator.languages, SUPPORTED_LOCALES, 'en')`. A stored user choice ALWAYS wins thereafter. Result: first-run app UI **and** tour both render in the visitor's device language, and a later in-Settings switch drives both together — genuinely conflict-free.
  - **SSR/hydration caution:** do NOT compute the device default at module-eval time in `atoms.ts` (server renders `'en'`, client would compute e.g. `'de'` → hydration mismatch). Set it on **first client mount behind the existing `hydrated` flag** in `page.tsx`, only when no stored value exists. Exact mechanism (one-time effect vs. `atomWithStorage` `getOnInit`) is Claude's discretion during planning, but it MUST be hydration-safe.
  - **Scope note:** LANG-01 was listed as v2 in REQUIREMENTS.md; the user explicitly pulled it into Phase 3 to eliminate the tour/app language conflict. Update traceability accordingly.

### Translation storage & consumption
- **D-04:** Add a **`tour: {...}` namespace to each of the 30 locale objects in `src/lib/translations.ts`**, parallel to the existing `home`/`settings`. `buildTourSteps(locale)` reads `translations[locale].tour`, with **per-string fallback to `translations.en.tour`** for any missing key (satisfies SC1's "falls back to English"). Keeps one i18n source of truth (`SUPPORTED_LOCALES` already derives from `Object.keys(translations)`).
- **D-05:** Full localization surface to move into the `tour` namespace: welcome card (title + description), all 8 feature steps (title + description each), the **Next / Back / Done button labels** (currently hardcoded English at `src/app/page.tsx:203-205` in the driver config — `nextBtnText`/`prevBtnText`/`doneBtnText`), and `TOUR_INSTALL_FALLBACK_DESCRIPTION`. Nothing tour-facing stays hardcoded English.

### Translation authoring
- **D-06:** **Claude authors all 30 locales this phase** — write the English strings first, then generate translations for every supported locale, matching the tone/length of the existing `home`/`settings` entries. Full coverage per PROJECT.md ("all 30 langs, no partial-locale onboarding") and I18N-01. Native-speaker review is a non-blocking follow-up (English fallback covers any gap).

### Keyboard accessibility (A11Y-01)
- **D-07:** Build on driver.js's built-in keyboard nav (←/→ advance/back, Esc close via `allowKeyboardControl: true`) and its focus trap — do NOT reimplement them. Add three things:
  1. **`:focus-visible` outline rings**, theme-aware (`oklch(var(--p))`), on the popover Next/Back/Done/close buttons AND the persistent "?" replay button, authored in `src/theme/tour.css`.
  2. **Focus restoration:** on tour close/done, return focus to the "?" replay button (or the element that triggered the tour) so keyboard users keep their place.
  3. **`prefers-reduced-motion`:** when set, disable driver.js animation and `smoothScroll` (clears the reduced-motion item deferred from Phase 2).

### Mobile / touch (A11Y-02)
- **D-08:** Guarantee all 8 popovers fit narrow (~320–375px) viewports via **responsive width** — cap `.driver-popover` at `max-width: min(320px, calc(100vw - 2rem))` (replacing the flat `320px`). Keep driver.js's auto side-placement and the existing `smoothScroll: true` for offscreen anchors. Only hand-set a per-step `side` where mobile QA shows auto-placement visibly misplacing a popover — no blanket per-step positioning.

### Claude's Discretion
- Exact hydration-safe mechanism for the first-load device-language default (D-03).
- Exact `:focus-visible` ring width/offset and how focus restoration is wired.
- Per-language translation wording (author + generate; keep concise, ≤ the current English lengths where possible for mobile fit).
- Whether any single step needs an explicit mobile `side` after QA (D-08).
</decisions>

<specifics>
## Specific Ideas

- The user's guiding intent: **"no conflict"** between the tour language and the app language, defaulting to the **device language**. Achieved by unifying both on `languageAtom` (D-01) and defaulting `languageAtom` to device on first run (D-03) — not by two independent language resolvers.
- Keyboard focus states and reduced-motion should feel consistent with the app's existing a11y work (commit `7daf09d`), not bolted on.
</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` §"Phase 3: Localized, Accessible, Theme-Aware Tour" — goal + 4 success criteria (SC1 i18n, SC2 keyboard, SC3 theme, SC4 mobile).
- `.planning/REQUIREMENTS.md` — I18N-01, A11Y-01, A11Y-02 acceptance detail; **LANG-01** (v2 → pulled into this phase per D-03, update traceability); Out of Scope table.
- `.planning/PROJECT.md` — Key Decisions (anchor strategy, "localize into all 30 langs", home-only scope) + Constraints (client-only, `data-tour` selectors, a11y consistent with commit `7daf09d`).

### Prior-phase contracts (reuse, do NOT rebuild)
- `.planning/phases/01-guided-first-run-tour/01-CONTEXT.md` — locked upstream decisions; **D-05 (device-first) is superseded by this phase's D-01/D-02** for tour copy.
- `.planning/phases/01-guided-first-run-tour/01-UI-SPEC.md` — authoritative visual/interaction contract: `data-tour` anchor placements (file:line), DaisyUI token values, popover/spotlight visuals, step copy, edge cases.
- `.planning/phases/01-guided-first-run-tour/01-VERIFICATION.md` — documents the teardown/`onDestroyed` bug (commit `a818626`) that must NOT regress when touching `startTour()`.
- `.planning/phases/02-on-demand-replay/02-CONTEXT.md` — `startTour()` reuse contract, replay ↔ seen-flag semantics, the "?" control (D-05 there deferred its aria-label i18n + reduced-motion to THIS phase).

### Code touchpoints (read before editing)
- `src/lib/translations.ts` — 30-locale dictionary; add `tour` namespace to each (D-04/D-05/D-06).
- `src/lib/tourSteps.ts` — `buildTourSteps(locale)`, `SUPPORTED_LOCALES`, `TOUR_STEP_COUNT`, `TOUR_INSTALL_FALLBACK_DESCRIPTION`, `TOUR_DONE_BTN_TEXT`; localize copy source here.
- `src/lib/fns.ts` — `resolveTourLocale` (pure; reused for the D-03 first-load app default).
- `src/lib/atoms.ts` — `languageAtom` (`atomWithStorage<Language>('language','en')`) → device-default on first load (D-03); `tourSeenAtom` (do not touch).
- `src/app/page.tsx` — `startTour()` (~167-227): switch tour locale to app language (D-01/D-02); move Next/Back/Done labels to i18n (D-05); wire focus restoration + reduced-motion (D-07); first-load device-default effect behind `hydrated` (D-03).
- `src/hooks/useTranslation.ts` + `src/contexts/LanguageContext.tsx` — `languageAtom` consumption path the tour must use (D-01).
- `src/theme/tour.css` — responsive popover width (D-08) + `:focus-visible` rings + reduced-motion CSS (D-07); already theme-token-driven (SC3 done).

### Testing (mirror existing kinds)
- `.planning/codebase/TESTING.md` — Vitest (`*.test.tsx`) + Playwright e2e (`test:e2e`) already present; new i18n/a11y/mobile behavior should get coverage in kind (`resolveTourLocale` unit test already exists as precedent).

No external ADRs/specs — requirements fully captured in the docs above.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Entire Phase 1–2 tour machinery** — driver config, `buildTourSteps`, `startTour()`, `tourSeenAtom`, themed `tour.css`, `resolveTourLocale`. Phase 3 localizes copy + hardens a11y/mobile + rewires the locale source; it adds no new steps.
- `translations.ts` `home`/`settings` namespace pattern — the `tour` namespace mirrors it; `useTranslation()` already returns `translations[language] || translations.en`.
- `resolveTourLocale(navLangs, supported, fallback)` — pure, unit-tested; reused verbatim to compute the first-load app-language default (D-03), just called from a new site.
- `tour.css` already follows `<html data-theme>` via `oklch(var(--token))` — SC3 (theme) is effectively met; focus-ring + responsive-width additions slot into the same file.
- The existing `hydrated` flag in `page.tsx` — the gate for the SSR-safe first-load language default (D-03), same pattern that gates tour auto-start.

### Established Patterns
- All interactive code is `"use client"`; language default effect + tour live in `page.tsx`.
- i18n via `translations.ts` + `useTranslation()`, English fallback baked into the hook.
- `data-tour` anchors only (never translated `aria-label`) — unchanged; the "?" replay button is NOT a tour step.

### Integration Points
- `translations.ts`: +`tour` block × 30 locales.
- `tourSteps.ts`: `buildTourSteps` pulls copy from `translations[locale].tour` with `en` fallback.
- `page.tsx`: locale source → app language; button labels → i18n; first-load device default (behind `hydrated`); focus restore + reduced-motion in `startTour()`/its teardown.
- `atoms.ts`: `languageAtom` first-load device default.
- `tour.css`: responsive popover width, `:focus-visible` rings, reduced-motion.

### Watch-outs
- **Do NOT reintroduce a dep-keyed `useEffect` teardown** of the driver instance (Phase-1 bug, commit `a818626`; see 01-VERIFICATION.md).
- **RTL locales:** `ar` and `ur` are among the 30. The app has no `dir="rtl"` handling today; the localized tour popover should be checked for RTL text/layout during mobile+i18n QA. Flagged as a verification risk (not a new decision) — handle within the i18n/mobile work, don't expand scope into app-wide RTL.
- Keep step count at 8 and the missing-anchor silent-skip + install-fallback logic intact when touching `startTour()`.
</code_context>

<deferred>
## Deferred Ideas

- Tours for `/chart` and `/convert/[pair]` — TOUR-07, v2.
- Contextual/just-in-time tips beyond the linear tour — TOUR-08, v2.
- App-wide RTL layout support (`dir="rtl"` for `ar`/`ur` across the whole app) — beyond this phase; only the tour popover's RTL rendering is checked here. Note for backlog if broader RTL is desired.
- Native-speaker review of the 30 machine-authored tour translations — non-blocking follow-up.

Note: **LANG-01 is NOT deferred** — it was explicitly pulled into this phase (D-03).
</deferred>

---

*Phase: 03-localized-accessible-theme-aware-tour*
*Context gathered: 2026-07-04*
