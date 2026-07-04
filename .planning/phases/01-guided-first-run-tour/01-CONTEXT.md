# Phase 1: Guided First-Run Tour - Context

**Gathered:** 2026-07-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the first-run guided tour on the home page (`/`): a driver.js-powered walkthrough that auto-starts once per browser, presents a welcome card + 8 feature steps, supports forward/back navigation and dismissal, and never auto-repeats. Covers TOUR-01, TOUR-02, TOUR-04, TOUR-05, TOUR-06.

Out of scope this phase: the persistent "?" replay control (Phase 2), full 30-locale i18n + keyboard-a11y hardening + mobile/theme audit (Phase 3), and tours for `/chart` or `/convert/[pair]`.
</domain>

<decisions>
## Implementation Decisions

### Step advancement
- **D-01:** Next-button linear walkthrough. User advances via Next/Back controls; performing the highlighted action (tap a row, type an amount) is NOT required to move on. Simplest with driver.js, predictable, works where the action is awkward on mobile.

### Dismissal gestures
- **D-02:** Three dismissal paths, all set the "seen" flag and close immediately: (a) the always-visible Skip control, (b) the Escape key, (c) clicking outside the popover / on the overlay. This is driver.js's forgiving default — accept it rather than restrict it.

### Backdrop interactivity
- **D-03:** Block interaction during the tour — dimmed modal spotlight; the underlying UI is not clickable while a step is active. Pairs cleanly with D-01 (Next-button linear) and avoids tour/DOM desync.

### Tour framing
- **D-04:** Open with a centered welcome card before step 1 ("Welcome to moneyrate — quick ~30-sec tour?") giving context + an easy early exit. This is one intro popover in addition to the 8 feature steps; TOUR-06's "8 steps" still refers to the 8 anchored feature steps.

### Carried forward (locked upstream — do not re-decide)
- Engine: **driver.js** (add to `package.json` — a Plan 1 task; not yet installed).
- Anchors: dedicated `data-tour="..."` attributes ONLY, never translated `aria-label`/`title`.
- "Seen" flag: new `tourSeenAtom = atomWithStorage<boolean>('tourSeen', false)` in `src/lib/atoms.ts`, gated behind the existing `hydrated` flag in `src/app/page.tsx`.
- Colors/type/spacing/copy: per the approved UI-SPEC (DaisyUI OKLCH theme tokens, no hardcoded hex; 3 sizes / 2 weights; 4px scale).
- Edge cases: missing anchor → silent step-skip; keep `<dialog id="currency_list_modal">` closed during step 4 (native `<dialog>` top-layer vs driver.js z-index conflict); never fire over the loading skeleton or before `hydrated` flips; always wrap the conditionally-`null` `InstallButton` in a `data-tour` container + fallback copy so step count holds.

### Claude's Discretion
- Exact popover z-index value (must sit above app chrome and the native `<dialog>` top-layer where applicable).
- Precise welcome-card copy wording (English; structured for Phase 3 i18n).
- driver.js config surface (animation, smooth-scroll to offscreen anchors 5–8).
</decisions>

<specifics>
## Specific Ideas

- The tour should feel like a quick guided walkthrough, not an interactive tutorial the user has to "complete" by doing each action — hence Next-button linear + blocked backdrop.
- Welcome card sets a low-pressure tone with an explicit easy exit before diving into features.
</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design contract (this phase)
- `.planning/phases/01-guided-first-run-tour/01-UI-SPEC.md` — Approved UI design contract: exact `data-tour` anchor placements (file:line), DaisyUI token values, popover/spotlight visuals, step copy, edge cases. Authoritative for all visual/interaction detail.

### Project + scope
- `.planning/PROJECT.md` — Project context + LOCKED Key Decisions (driver.js, anchor strategy, i18n plan, home-only scope).
- `.planning/REQUIREMENTS.md` — TOUR-01/02/04/05/06 acceptance detail + Out of Scope.
- `.planning/ROADMAP.md` §"Phase 1" — Success criteria.

### Codebase map
- `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md` — App architecture + where things live. Note: map dated 2026-07-03 has minor drift (lists 4 components; 9 exist; omits `/convert/[pair]`).

No external ADRs/specs — requirements fully captured in the docs above.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/atoms.ts` — Jotai `atomWithStorage` pattern (`isEditingAtom`, `themeAtom`, …); add `tourSeenAtom` here following the `xyzAtom` naming.
- `src/app/page.tsx:113-114` — existing `hydrated` flag (`useState(false)` + `useEffect(()=>setHydrated(true),[])`); gate tour auto-start on it to avoid SSR/localStorage hydration mismatch.
- `src/app/page.tsx:262-276` — loading skeleton branch; tour must not start until real content is rendered (gate on `!isLoad1 || effectiveAll`).
- `src/lib/translations.ts` + `useTranslation()` — i18n system for tour copy (full localization is Phase 3; author strings translation-ready now).
- `themeAtom` + `<html data-theme>` — DaisyUI theme mechanism; popover reads theme tokens so it follows light/dark automatically.

### Established Patterns
- Every interactive file is `"use client"`; the tour trigger + driver.js calls live in client code (page.tsx or a dedicated client hook/component).
- Anchors on `data-tour` attributes, never `aria-label` (translated → not language-stable).
- Inline SVG icon components in `src/lib/svgs.tsx` if the welcome/help needs an icon.

### Integration Points
- `src/app/page.tsx` `Home` component — add the tour-start effect (client, gated `hydrated && !tourSeen && content-ready`), and set `tourSeen` on complete/skip.
- `data-tour` attributes to add across `src/app/page.tsx` and children `CurrencyRow.tsx`, `SearchBar.tsx`, `CurrencyListModal.tsx`, `ThemeToggle.tsx`, `InstallButton.tsx` (exact placements enumerated in the UI-SPEC).
- `package.json` — add `driver.js` dependency (Plan 1 task).
</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Replay control → Phase 2; i18n/a11y/theme/mobile hardening → Phase 3; other-route tours → v2 per REQUIREMENTS.md.)
</deferred>

---

*Phase: 01-guided-first-run-tour*
*Context gathered: 2026-07-04*
