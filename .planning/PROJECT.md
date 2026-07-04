# moneyrate

## What This Is

moneyrate is a client-only Next.js 14 (App Router) currency-rate app: a fast, editable list that converts one base amount into many currencies/crypto/commodities at once, with historical rates, charts, and shareable links. It runs entirely in the browser (no backend) — rates come from public APIs, all user state persists in `localStorage`. This milestone adds a **first-run onboarding tour** so new visitors discover the app's non-obvious interactions (tap a row to switch base, inline-edit the amount, search to add currencies, settings, share, theme, historical view, PWA install).

## Core Value

A first-time visitor understands how to use moneyrate within seconds of landing — the key interactions are demonstrated, not hidden.

## Requirements

### Validated

<!-- Inferred from existing code (.planning/codebase/). Shipped and relied upon. -->

- ✓ Multi-currency rate list converting one base amount into many currencies at once — existing
- ✓ Tap a row to switch the base currency; inline-edit the amount — existing
- ✓ Add / remove / reorder displayed currencies (edit mode + drag-and-drop, touch-supported) — existing
- ✓ Currency search over fiat / crypto / commodities to add to the list — existing
- ✓ Historical rates by date + per-currency 24h change — existing
- ✓ Historical rate chart (`/chart`) with client-side range filter and CSV export — existing
- ✓ Per-pair SEO landing pages (`/convert/[pair]`) + sitemap/robots — existing
- ✓ Shareable link (`?base&amount&show`) with clipboard copy — existing
- ✓ Light/dark theme toggle — existing
- ✓ 30-language i18n with fallback to English — existing
- ✓ PWA: installable, service worker, last-known-good offline rate cache — existing
- ✓ Jotai `atomWithStorage` state persisted to `localStorage` — existing

### Active

<!-- This milestone: the onboarding tour. Hypotheses until shipped. -->

- [ ] Tour auto-starts on a visitor's first load, gated by a persisted "seen" flag (never auto-runs twice)
- [ ] A persistent `?`/help control lets any user replay the tour on demand
- [ ] Tour highlights ~8 anchor points: set base (tap row), edit amount, add currency (search), manage list/settings, share link, theme toggle, historical-date picker, PWA install
- [ ] Tour is skippable/dismissible at any step
- [ ] Tour works on mobile / touch and respects the app's responsive layout
- [ ] Tour copy is localized across all 30 supported languages via the existing translations system
- [ ] Tour honors the active light/dark theme

### Out of Scope

- Server-side onboarding analytics / A/B testing — app has no backend; no telemetry infra
- User accounts or cross-device "seen tour" sync — app is local-only by design
- Onboarding for the `/chart` and `/convert/[pair]` routes — home page (`/`) only for this milestone
- Rewriting existing features to add stable IDs beyond what the tour needs — minimal, tour-scoped anchors only

## Context

- **Codebase mapped:** `.planning/codebase/` (ARCHITECTURE, STRUCTURE, STACK, CONVENTIONS, TESTING, INTEGRATIONS, CONCERNS). Note: map dated 2026-07-03 has minor drift — it lists 4 components but 9 exist (`CurrencyRow`, `InstallButton`, `ThemeToggle`, `ThemeApplier`, `ServiceWorkerRegister` added since) and omits the `/convert/[pair]` route.
- **All home UI mounts in `src/app/page.tsx`.** Tour anchors: only `#currencyList` has a stable id today; other targets use `aria-label`/`title`. Many `aria-label`s are i18n-translated, so they are **not** language-stable selectors — the tour must anchor on dedicated `data-tour="..."` attributes instead.
- **State pattern:** all global state is Jotai `atomWithStorage` in `src/lib/atoms.ts`. The "seen tour" flag should follow this pattern and be gated behind the existing `hydrated` flag in `page.tsx` to avoid SSR/localStorage hydration mismatch.
- **i18n:** strings live in `src/lib/translations.ts` (30 locales), consumed via `useTranslation()`, fallback to `translations.en`.
- **Tests present:** Vitest (`*.test.tsx`) + Playwright e2e (`test:e2e`). New tour should be testable in kind.

## Constraints

- **Tech stack**: Next.js 14 App Router, React 18, TypeScript, Jotai, SWR, DaisyUI + Tailwind — tour must fit this, client-side only (`"use client"`).
- **Library**: driver.js — chosen for small (~5kb) vanilla, selector-based footprint matching the app's bundle-conscious, vendored-dependency style.
- **Selectors**: anchor on `data-tour` attributes, never on translated `aria-label`s.
- **No backend**: "seen" state is `localStorage` only, per-browser.
- **i18n**: tour copy must be added to all 30 language dictionaries.
- **Accessibility**: keyboard-navigable and dismissible; consistent with existing a11y work (commit 7daf09d).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Onboarding via driver.js | Small vanilla lib, selector-based, matches bundle-conscious style; less than react-joyride, less work than custom | — Pending |
| Auto first-visit + `?` replay | Standard pattern; discoverability for new users, re-access for returning | — Pending |
| Anchor on `data-tour` attrs | `aria-label`s are translated → not language-stable selectors | — Pending |
| Localize tour into all 30 langs | Consistency with existing full i18n coverage | — Pending |
| Home page (`/`) only | Highest-traffic entry; other routes deferred | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-04 after initialization*
