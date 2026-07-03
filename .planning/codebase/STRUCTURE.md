# Codebase Structure

**Analysis Date:** 2026-07-03

## Directory Layout

```
moneyrate/
├── src/
│   ├── app/                     # Next.js App Router: routes, layouts, API handlers
│   │   ├── api/
│   │   │   └── currencyChart/
│   │   │       └── route.ts     # GET /api/currencyChart — proxies Yahoo Finance
│   │   ├── chart/
│   │   │   └── page.tsx         # /chart route — historical rate chart
│   │   ├── fonts/
│   │   │   ├── GeistVF.woff
│   │   │   └── GeistMonoVF.woff
│   │   ├── layout.tsx           # Root layout (html/head/body, providers, fonts)
│   │   ├── loading.tsx          # App Router loading fallback (progress bar)
│   │   └── page.tsx             # / route — main currency rate list
│   ├── components/               # Reusable React components (flat, no subfolders)
│   │   ├── CountryImg.tsx        # Flag/crypto icon with fallback chain
│   │   ├── CurrencyListModal.tsx # Modal: currency table tab + settings tab
│   │   ├── DragHandle.tsx        # Drag affordance icon for reordering
│   │   └── SearchBar.tsx         # Currency search/typeahead + add-to-list
│   ├── contexts/
│   │   └── LanguageContext.tsx   # React Context wrapper over languageAtom
│   ├── hooks/
│   │   ├── useTranslation.ts     # Returns translation dict for active language
│   │   └── useWindowWidth.ts     # Tracks window.innerWidth (responsive logic)
│   ├── lib/                      # Framework-agnostic shared code
│   │   ├── api.ts                # SWR fetcher + external API URL builders
│   │   ├── atoms.ts               # All Jotai global state atoms (localStorage-backed)
│   │   ├── constants.ts           # Default values + Currency2country flag map
│   │   ├── fns.ts                 # debounce, showASCIIArt, getDataFromLocalStorage
│   │   ├── func.ts                # Effectively empty (1 line) — unused
│   │   ├── svgs.tsx                # Inline SVG icon components
│   │   ├── translations.ts        # i18n string dictionaries (30 languages)
│   │   └── types.ts                # Shared TS types (branded CurrencyCode, etc.)
│   └── theme/
│       ├── globals.css            # Tailwind directives + DaisyUI dark theme + custom CSS
│       └── theme.ts                # Tailwind theme.extend config object
├── public/                       # Static assets served at site root
│   ├── country-flags/            # 273 SVG flag icons, named by ISO country code
│   ├── crypto-icons/              # 437 crypto icon assets (svg/png), named by ticker
│   ├── img/
│   │   └── q.svg                  # Placeholder/unknown-currency icon
│   ├── ads.txt                    # Google AdSense verification
│   ├── clarity.js                 # Microsoft Clarity analytics snippet
│   ├── site.webmanifest
│   ├── favicon.ico / favicon.svg / favicon-48x48.png / apple-touch-icon.png
│   └── web-app-manifest-192x192.png / web-app-manifest-512x512.png
├── .planning/
│   └── codebase/                  # GSD-generated codebase map docs (this directory)
├── next.config.mjs                # Next.js config (remote image patterns for coincap.io)
├── tailwind.config.ts             # Tailwind config; imports theme from src/theme/theme.ts
├── postcss.config.mjs             # PostCSS config (Tailwind + autoprefixer)
├── tsconfig.json                  # TypeScript config; path alias @/* -> ./src/*
├── .eslintrc.json                 # ESLint config (extends next/core-web-vitals presumably)
├── package.json                   # Scripts (dev/build/start/lint), deps, yarn packageManager
└── README.md
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router file-system routing root — every folder maps to a URL segment, every `page.tsx`/`route.ts`/`layout.tsx` has framework-defined meaning.
- Contains: Page components (`page.tsx`), the root layout, a loading fallback, and one API route handler.
- Key files: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/chart/page.tsx`, `src/app/api/currencyChart/route.ts`

**`src/components/`:**
- Purpose: Shared, reusable UI components consumed by pages. Flat structure — no nesting by feature or atomic-design tiers.
- Contains: Four `.tsx` files, each a default-exported React component (plus `CountryImg.tsx` also named-exports `ImageWithFallback`).
- Key files: `src/components/CountryImg.tsx`, `src/components/CurrencyListModal.tsx`, `src/components/SearchBar.tsx`, `src/components/DragHandle.tsx`

**`src/contexts/`:**
- Purpose: React Context providers. Currently holds a single context that is a thin wrapper over a Jotai atom (kept for `useContext`-style ergonomics, notably in `useTranslation`).
- Contains: `LanguageContext.tsx` only.
- Key files: `src/contexts/LanguageContext.tsx`

**`src/hooks/`:**
- Purpose: Reusable stateful logic not tied to a specific component.
- Contains: Two hooks — one for i18n lookup, one for responsive width tracking.
- Key files: `src/hooks/useTranslation.ts`, `src/hooks/useWindowWidth.ts`

**`src/lib/`:**
- Purpose: Catch-all for framework-agnostic shared code — types, constants, pure utility functions, external API clients, and all global state (Jotai atoms).
- Contains: `api.ts`, `atoms.ts`, `constants.ts`, `fns.ts`, `func.ts` (unused), `svgs.tsx`, `translations.ts`, `types.ts`.
- Key files: `src/lib/atoms.ts` (state), `src/lib/api.ts` (data fetching), `src/lib/types.ts` (shared types)

**`src/theme/`:**
- Purpose: Tailwind/DaisyUI theming — both the CSS entry point and the JS theme-extension object consumed by `tailwind.config.ts`.
- Contains: `globals.css`, `theme.ts`.
- Key files: `src/theme/globals.css` (imported once in `src/app/layout.tsx:1`), `src/theme/theme.ts` (imported by `tailwind.config.ts`)

**`public/`:**
- Purpose: Static assets served verbatim at the site root by Next.js.
- Contains: Icon sets (`country-flags/`, `crypto-icons/`), a placeholder image (`img/q.svg`), PWA manifest/icons, and third-party scripts (`clarity.js`, `ads.txt`).
- Key files: `public/country-flags/` (273 files), `public/crypto-icons/` (437 files)

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root HTML shell, global providers (Jotai `Provider`, `LanguageProvider`), font loading.
- `src/app/page.tsx`: Home route (`/`) — main currency conversion UI.
- `src/app/chart/page.tsx`: Chart route (`/chart`) — historical rate visualization.
- `src/app/api/currencyChart/route.ts`: Only API route in the app.

**Configuration:**
- `tsconfig.json`: TypeScript compiler options; defines the `@/*` → `src/*` path alias used in every import.
- `tailwind.config.ts` + `src/theme/theme.ts`: Styling configuration (content globs, theme extension, DaisyUI plugin/themes).
- `next.config.mjs`: Next.js config — currently only configures `images.remotePatterns` for `assets.coincap.io`.
- `.eslintrc.json`: Lint rules, run via `yarn lint` / `next lint`.
- `postcss.config.mjs`: PostCSS plugin pipeline for Tailwind.

**Core Logic:**
- `src/lib/atoms.ts`: All persisted global state — the closest thing this app has to a "state management layer."
- `src/lib/api.ts`: All external API URL construction + the shared SWR `fetcher`.
- `src/app/api/currencyChart/route.ts`: Server-side data normalization logic (fiat vs. crypto vs. flipped-pair resolution).
- `src/lib/constants.ts`: Default currencies to display, default base currency, and the ISO-currency-to-country-flag map.

**Testing:**
- Not applicable — no test files, test runner, or test config exist anywhere in the repository (see `.planning/codebase/TESTING.md` if generated, otherwise treat as "no tests present").

## Naming Conventions

**Files:**
- React components: PascalCase matching the default export, e.g. `CountryImg.tsx` exports `CountryImg`, `CurrencyListModal.tsx` exports `CurrencyListModal`.
- Hooks: camelCase prefixed with `use`, e.g. `useTranslation.ts`, `useWindowWidth.ts`.
- Library/utility modules: lowercase, short, noun-based, e.g. `atoms.ts`, `constants.ts`, `types.ts`, `fns.ts`, `api.ts`.
- Route files: fixed Next.js App Router names (`page.tsx`, `layout.tsx`, `loading.tsx`, `route.ts`) — not free-form.

**Directories:**
- Lowercase, plural for collections of similar things: `components/`, `hooks/`, `contexts/`.
- Lowercase, singular for conceptual groupings: `lib/`, `theme/`, `app/`.
- Route segments under `src/app/` are lowercase and match the URL path exactly (`chart/` → `/chart`, `api/currencyChart/` → `/api/currencyChart`).

**Import style:**
- All internal imports use the `@/` path alias (e.g. `import CountryImg from '@/components/CountryImg'`) rather than relative paths, except for same-directory imports (`import CountryImg from './CountryImg'` inside `src/components/CurrencyListModal.tsx:15`).

**Atom naming:**
- Jotai atoms are suffixed with `Atom` and named after the value they hold, e.g. `baseCurAtom`, `currency2DisplayAtom`, `isEditingAtom` (`src/lib/atoms.ts`).

## Where to Add New Code

**New page/route:**
- Add a new folder under `src/app/<route-name>/page.tsx` following the existing pattern in `src/app/chart/page.tsx` (top-of-file `"use client"` if it needs interactivity/hooks, `useSWR` for data fetching, `showASCIIArt()` call on mount if consistency with existing pages is desired).

**New API route:**
- Add `src/app/api/<name>/route.ts` exporting a `GET`/`POST`/etc. function returning `NextResponse.json(...)`, following the shape of `src/app/api/currencyChart/route.ts`.

**New shared component:**
- Add to `src/components/<ComponentName>.tsx` as a default export, flat (no subfolders currently exist). Co-locate tightly-related sub-components in the same file if they are not reused elsewhere (see `CurrencySetting` and `CurrencyListTable` living inside `src/components/CurrencyListModal.tsx`).

**New global/persisted state:**
- Add an `atomWithStorage<T>('key', default)` export to `src/lib/atoms.ts`, following the existing naming convention (`xyzAtom`). Import the default value from `src/lib/constants.ts` if it needs to be reused (e.g. for a "reset" action).

**New hook:**
- Add `src/hooks/use<Name>.ts`, add `'use client'` at the top if it touches `window`/DOM (see `src/hooks/useWindowWidth.ts:1`).

**New shared type:**
- Add to `src/lib/types.ts`. Use the branded-string pattern (`type X = string & { readonly __brand: 'X' }`) for domain-specific string identifiers, consistent with `CurrencyCode`/`LanguageCode`.

**New translation strings:**
- Add the key to every language block in `src/lib/translations.ts`; `useTranslation()` falls back to `translations.en` if a language is missing a key/dictionary, so partial rollout is tolerated but should be avoided for consistency.

**New icon:**
- Add an inline SVG component to `src/lib/svgs.tsx` following the `({ ...props }) => <svg ... {...props}>...</svg>` pattern, so callers can pass `className`/`onClick` directly.

**Static assets (flags/crypto icons):**
- Add SVG/PNG files to `public/country-flags/` or `public/crypto-icons/`, named by the exact code used in `Currency2country` (`src/lib/constants.ts`) or the raw currency ticker respectively — `CountryImg.tsx` derives the path directly from the code string.

## Special Directories

**`.next/`:**
- Purpose: Next.js build output/cache.
- Generated: Yes.
- Committed: No (in `.gitignore`).

**`.history/`:**
- Purpose: VS Code "Local History" extension snapshots of edited files.
- Generated: Yes (by editor tooling, not the build).
- Committed: No (in `.gitignore`).

**`.planning/`:**
- Purpose: GSD workflow planning artifacts, including this codebase map (`.planning/codebase/`).
- Generated: Yes (by GSD tooling).
- Committed: Depends on project convention — check `.gitignore` before assuming.

**`public/country-flags/` and `public/crypto-icons/`:**
- Purpose: Static icon assets referenced by filename convention from `src/components/CountryImg.tsx` and `src/lib/constants.ts`.
- Generated: No — manually curated asset sets (273 and 437 files respectively).
- Committed: Yes.

**`src/app/fonts/`:**
- Purpose: Local variable font files (`.woff`) loaded via `next/font/local` in `src/app/layout.tsx:8-17`.
- Generated: No.
- Committed: Yes.

---

*Structure analysis: 2026-07-03*
