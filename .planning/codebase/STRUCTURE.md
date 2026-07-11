# Codebase Structure

**Analysis Date:** 2026-07-11

## Directory Layout

```
moneyrate/
├── src/
│   ├── app/                          # Next.js App Router routes
│   │   ├── layout.tsx                # Root layout (providers, fonts, SW, Clarity)
│   │   ├── page.tsx                  # Home — editable currency list + tour
│   │   ├── loading.tsx               # Route-level loading bar
│   │   ├── error.tsx                 # Route error boundary
│   │   ├── global-error.tsx          # Root-layout error boundary
│   │   ├── robots.ts                 # /robots.txt metadata route
│   │   ├── sitemap.ts                # /sitemap.xml metadata route
│   │   ├── fonts/                    # Local Geist woff fonts
│   │   ├── chart/
│   │   │   └── page.tsx              # Historical chart page (Recharts)
│   │   ├── convert/
│   │   │   └── [pair]/page.tsx       # SEO convert landing (server/ISR)
│   │   └── api/
│   │       └── currencyChart/
│   │           ├── route.ts          # Yahoo Finance chart proxy (only server compute)
│   │           └── route.test.ts     # Route unit tests (vitest)
│   ├── components/                   # 9 UI components (+ co-located tests)
│   │   ├── CountryImg.tsx
│   │   ├── CurrencyListModal.tsx
│   │   ├── CurrencyRow.tsx  (+ .test.tsx)
│   │   ├── DragHandle.tsx
│   │   ├── InstallButton.tsx (+ .test.tsx)
│   │   ├── SearchBar.tsx    (+ .test.tsx)
│   │   ├── ServiceWorkerRegister.tsx
│   │   ├── ThemeApplier.tsx
│   │   └── ThemeToggle.tsx
│   ├── contexts/
│   │   └── LanguageContext.tsx        # Context over languageAtom
│   ├── hooks/
│   │   ├── useTranslation.ts          # i18n dictionary lookup
│   │   └── useWindowWidth.ts          # Debounced responsive width
│   ├── lib/                          # Pure logic, state, config
│   │   ├── api.ts    (+ .test.ts)     # SWR fetchers + rate URL builders
│   │   ├── atoms.ts                   # 12 localStorage-backed Jotai atoms
│   │   ├── constants.ts               # Defaults + Currency2country map
│   │   ├── fns.ts   (+ .test.ts)      # Utils: math eval, sort, LS, locale
│   │   ├── pairs.ts                   # SEO pairs, slug helpers, SITE_URL
│   │   ├── svgs.tsx                   # Inline SVG icons
│   │   ├── tourSteps.ts (+ .test.ts)  # driver.js step builder + i18n
│   │   ├── translations.ts            # 30-language dictionaries
│   │   └── types.ts                   # Shared + branded types
│   └── theme/
│       ├── globals.css                # Tailwind directives + base CSS
│       ├── theme.ts                   # Tailwind theme.extend
│       └── tour.css                   # driver.js popover theming + RTL
├── e2e/                              # Playwright end-to-end specs
├── public/                          # Static assets
│   ├── sw.js                         # Service worker (offline)
│   ├── site.webmanifest              # PWA manifest
│   ├── vendor/                       # Vendored drag-drop-touch polyfill
│   ├── country-flags/                # Flag SVGs
│   ├── crypto-icons/                 # Crypto icon assets
│   ├── img/                          # Misc images (q.svg)
│   ├── fns.js                        # Static script asset
│   └── favicon*/apple-touch/web-app-manifest icons
├── next.config.mjs                   # CSP + security headers
├── tailwind.config.ts                # Tailwind + DaisyUI config
├── postcss.config.mjs
├── tsconfig.json                     # Strict TS, @/* → ./src/*
├── playwright.config.ts              # E2E config
├── vitest.config.ts                  # Unit test config
├── .eslintrc.json                    # next/core-web-vitals + next/typescript
├── .env.example                      # Documents optional env vars (no secrets)
└── package-lock.json                 # Active lockfile (npm)
```

## Directory Purposes

**`src/app/`:**
- Purpose: All routes and framework special files (App Router).
- Contains: Page components, layout, loading/error boundaries, metadata routes, the single API route.
- Key files: `page.tsx` (home), `layout.tsx` (providers), `api/currencyChart/route.ts` (only server compute), `convert/[pair]/page.tsx` (server SEO page).

**`src/components/`:**
- Purpose: Reusable UI, mostly presentational with local state.
- Contains: 9 `PascalCase.tsx` components; some render nothing (`ThemeApplier`, `ServiceWorkerRegister`).
- Key files: `CurrencyRow.tsx` (memoized row + math input), `CurrencyListModal.tsx` (table + settings), `SearchBar.tsx`.

**`src/hooks/`:**
- Purpose: Cross-cutting stateful logic.
- Key files: `useTranslation.ts` (named export), `useWindowWidth.ts` (default export).

**`src/contexts/`:**
- Purpose: React context adapters over atoms.
- Key files: `LanguageContext.tsx`.

**`src/lib/`:**
- Purpose: Pure functions, constants, types, atoms, i18n, tour config. No React lifecycle except `atomWithStorage` calls.
- Key files: `atoms.ts`, `api.ts`, `fns.ts`, `tourSteps.ts`, `pairs.ts`, `types.ts`, `translations.ts`.

**`src/theme/`:**
- Purpose: Styling config and global CSS.
- Key files: `globals.css`, `theme.ts`, `tour.css`.

**`e2e/`:**
- Purpose: Playwright end-to-end specs (tour keyboard/focus baselines, flows).

**`public/`:**
- Purpose: Static assets served from root. Includes the PWA service worker, manifest, vendored polyfill, flag/crypto icons.

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root layout, providers, fonts, SW, Clarity.
- `src/app/page.tsx`: Home page.
- `src/app/chart/page.tsx`: Chart page.
- `src/app/convert/[pair]/page.tsx`: SEO landing (server/ISR).
- `src/app/api/currencyChart/route.ts`: Chart data proxy.
- `src/app/robots.ts`, `src/app/sitemap.ts`: SEO metadata routes.

**Configuration:**
- `next.config.mjs`: CSP and security headers.
- `tailwind.config.ts` / `postcss.config.mjs`: Styling.
- `tsconfig.json`: Strict TS, `@/*` alias.
- `.eslintrc.json`: Lint rules.
- `playwright.config.ts` / `vitest.config.ts`: Test runners.
- `.env.example`: Documents optional env vars (`NEXT_PUBLIC_CLARITY_ID`, `NEXT_PUBLIC_CURRENCY_API_HOST`, `NEXT_PUBLIC_SITE_URL`, `YAHOO_FINANCE_HOST`).

**Core Logic:**
- `src/lib/atoms.ts`: Global state (12 persisted atoms).
- `src/lib/api.ts`: Fetchers + rate URL builders.
- `src/lib/fns.ts`: Pure utilities (math eval, sort, localStorage, locale resolver).
- `src/lib/tourSteps.ts`: Tour step definitions.
- `src/lib/pairs.ts`: SEO pairs + `SITE_URL`.

**Testing:**
- Unit (vitest): co-located `*.test.ts(x)` next to source (`src/lib/*.test.ts`, `src/components/*.test.tsx`, `src/app/api/currencyChart/route.test.ts`).
- E2E (playwright): `e2e/`.

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` — `CurrencyRow.tsx`, `ThemeToggle.tsx`.
- App Router special files: lowercase, framework-mandated — `page.tsx`, `layout.tsx`, `route.ts`, `error.tsx`, `robots.ts`.
- Hooks: `camelCase.ts` prefixed `use` — `useTranslation.ts`.
- Contexts: `PascalCase.tsx` suffixed `Context` — `LanguageContext.tsx`.
- Lib/utilities: `camelCase.ts` — `atoms.ts`, `tourSteps.ts`, `pairs.ts`.
- Tests: co-located, `<name>.test.ts(x)` mirroring the source file.

**Symbols:**
- Jotai atoms suffixed `Atom` — `themeAtom`, `tourSeenAtom`, `showDatePickerAtom`.
- Default constants use `PascalCase` with `Default` prefix — `DefaultBaseCur` (`src/lib/constants.ts`).
- Types/interfaces: `PascalCase`, no `I` prefix; component props are `<Name>Props` interfaces.
- Branded primitives: `CurrencyCode`, `LanguageCode` (`src/lib/types.ts`).

**Directories:**
- Lowercase, single-word feature/layer names: `components`, `hooks`, `contexts`, `lib`, `theme`, `app`.
- Dynamic route segments in brackets: `convert/[pair]`.

## Where to Add New Code

**New page/route:**
- Add a directory under `src/app/<route>/page.tsx`. Mark `"use client"` only if it uses browser APIs/hooks; keep it a server component for SEO/ISR pages (mirror `convert/[pair]/page.tsx`).

**New UI component:**
- Implementation: `src/components/<PascalCase>.tsx`, `default export` at the bottom.
- Co-located test: `src/components/<PascalCase>.test.tsx`.
- Consume state via `useAtom(...)` from `@/lib/atoms`, i18n via `useTranslation` from `@/hooks/useTranslation`.
- If it anchors a tour step, add a `data-tour="..."` attribute (never anchor on a translated `aria-label`).

**New persisted setting/state:**
- Add an `atomWithStorage<T>('key', default)` to `src/lib/atoms.ts`; add its key to the reset list in `src/components/CurrencyListModal.tsx:188` and the `lastGood`/reset teardown as appropriate.

**New pure logic:**
- Add to `src/lib/fns.ts` (or a new `src/lib/<name>.ts`) as a named export with a co-located `*.test.ts`. Keep it free of React and of direct `navigator`/`window` reads where possible (pass them in), following `resolveTourLocale`.

**New shared type:**
- `src/lib/types.ts` (named export). Import it rather than redeclaring locally.

**New icon:**
- Add an inline SVG component to `src/lib/svgs.tsx` (named export).

**New tour step / copy:**
- Selector in `TOUR_FEATURE_STEPS` (`src/lib/tourSteps.ts`); copy keys in all 30 locale `tour` namespaces in `src/lib/translations.ts` (with `en` as the mandatory fallback).

**New API route:**
- `src/app/api/<name>/route.ts` exporting `GET`/`POST`. Validate input early and return `NextResponse.json(..., { status })` with a real 4xx/5xx code (follow `currencyChart/route.ts`).

**Cross-directory imports:**
- Always use the `@/*` alias (`@/lib/...`, `@/components/...`, `@/hooks/...`). Reserve relative `./` for same-directory imports.

## Special Directories

**`public/vendor/`:**
- Purpose: Vendored `drag-drop-touch` polyfill loaded same-origin (avoids unpinned third-party script / CSP violation).
- Generated: No. Committed: Yes.

**`public/` (icons/manifest/sw):**
- Purpose: PWA assets — `sw.js`, `site.webmanifest`, favicons, `web-app-manifest-*`.
- Generated: No (hand-maintained). Committed: Yes.

**`.next/`, `test-results/`, `.history/`, `scratchpad/`:**
- Purpose: Build output / test artifacts / editor history / scratch.
- Generated: Yes. Committed: No (git-ignored) — do not add source here.

**`.planning/`:**
- Purpose: GSD workflow artifacts (phases, codebase maps).
- Committed: Yes.

---

*Structure analysis: 2026-07-11*
