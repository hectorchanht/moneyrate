# Technology Stack

**Analysis Date:** 2026-07-03

## Languages

**Primary:**
- TypeScript ^5 - Application code (`src/**/*.ts`, `src/**/*.tsx`), strict mode enabled (`tsconfig.json`)

**Secondary:**
- JavaScript - Plain script assets, e.g. `public/clarity.js`, `public/fns.js`
- CSS - Tailwind entry stylesheet `src/theme/globals.css`

## Runtime

**Environment:**
- Node.js (version not pinned — no `.nvmrc` or `engines` field found in `package.json`)
- Next.js runtime (App Router), server-side API routes execute in Node.js runtime by default

**Package Manager:**
- Declared: Yarn 3.6.1 via `packageManager` field in `package.json` ("yarn@3.6.1+sha512...")
- Yarn PnP artifact present: `.pnp.loader.mjs` (root)
- However, a `package-lock.json` (npm) is also present and was recently modified (per git status), and a `bun.lockb` (Bun lockfile) also exists at the repo root
- **Conflicting lockfiles detected:** `package-lock.json`, `bun.lockb`, and Yarn PnP loader coexist — indicates inconsistent package manager usage across contributors/environments. Treat with caution; confirm which lockfile is authoritative before installing dependencies.

## Frameworks

**Core:**
- Next.js 14.2.15 - React framework, App Router (`src/app/`), used for pages, layouts, and API routes
- React ^18 / react-dom ^18 - UI rendering library
- Tailwind CSS ^3.4.1 - Utility-first CSS framework, configured in `tailwind.config.ts`
- DaisyUI ^4.12.13 - Tailwind component library, configured as a Tailwind plugin (`tailwind.config.ts:13`), dark theme only (`tailwind.config.ts:15-19`)

**State Management:**
- Jotai ^2.12.3 - Atomic state management, atoms with `localStorage` persistence via `atomWithStorage` (`src/lib/atoms.ts`)

**Data Fetching:**
- SWR ^2.2.5 - Client-side data fetching/caching hook, used in `src/app/page.tsx:24` and `src/app/chart/page.tsx:5`

**Charting:**
- Recharts ^2.13.3 - Chart rendering, used in `src/app/chart/page.tsx`

**Utilities:**
- Lodash ^4.17.21 - Utility functions (e.g. `pick` used in `src/app/page.tsx:22`)

**Testing:**
- Not detected — no test runner, test config, or test files found in the repository

**Build/Dev:**
- Next.js CLI (`next dev`, `next build`, `next start`, `next lint`) - see `package.json:6-11`
- PostCSS ^8 with `@tailwindcss/postcss` plugin config in `postcss.config.mjs`
- ESLint ^8 with `eslint-config-next` 14.2.15, config in `.eslintrc.json` (extends `next/core-web-vitals`, `next/typescript`; disables `@typescript-eslint/no-explicit-any`)

## Key Dependencies

**Critical:**
- `next` (14.2.15) - Application framework, routing, SSR, API routes, image optimization
- `react` / `react-dom` (^18) - UI rendering
- `jotai` (^2.12.3) - Global/local state persisted to `localStorage`, core to currency list and settings persistence
- `swr` (^2.2.5) - Data fetching/caching layer for all currency rate and chart data

**Infrastructure:**
- `@tailwindcss/forms` (^0.5.9) - Form styling plugin for Tailwind
- `daisyui` (^4.12.13) - Component styling on top of Tailwind
- `recharts` (^2.13.3) - Chart visualization for `src/app/chart/page.tsx`
- `lodash` (^4.17.21) - General utility functions

## Configuration

**Environment:**
- No `.env` files present in the repository (verified via filesystem listing)
- No environment variables referenced anywhere in `src/` (no `process.env` usage found)
- All configuration is static/compile-time (Next.js config, Tailwind config)

**Build:**
- `next.config.mjs` - Configures allowed remote image hostname `assets.coincap.io` for `next/image` (crypto icon fallback source)
- `tsconfig.json` - Strict TypeScript, path alias `@/*` → `./src/*`, Next.js TS plugin enabled
- `tailwind.config.ts` - Content globs for `src/pages`, `src/components`, `src/app`; imports shared theme from `src/theme/theme.ts`; DaisyUI dark theme only
- `postcss.config.mjs` - Tailwind CSS PostCSS plugin only

## Platform Requirements

**Development:**
- Node.js + Yarn 3.6.1 (per `packageManager` field) — though repo also contains npm and Bun lockfiles (see package manager note above)
- No documented Node version requirement (no `.nvmrc`, no `engines` field)

**Production:**
- Deployed at `https://moneyrate.lol` (per `README.md` and Open Graph-style references)
- Compatible with Vercel-style Next.js hosting (standard Next.js build/start scripts, `next/image` remote pattern usage), though no `vercel.json` or explicit deployment config found in the repo

---

*Stack analysis: 2026-07-03*
