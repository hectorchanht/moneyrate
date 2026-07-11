# Technology Stack

**Analysis Date:** 2026-07-11

## Languages

**Primary:**
- TypeScript `^5` (resolved `5.6.3`) - All application code (`src/**/*.ts`, `src/**/*.tsx`). Strict mode enabled, `moduleResolution: "bundler"`, path alias `@/*` → `./src/*` (`tsconfig.json`).

**Secondary:**
- JavaScript - Vanilla browser assets in `public/`: service worker (`public/sw.js`), ASCII-art banner helper (`public/fns.js`), vendored touch-drag polyfill (`public/vendor/drag-drop-touch.esm.min.js`).
- CSS - Tailwind entry stylesheet (`src/theme/globals.css`), tour overrides (`src/theme/tour.css`), plus the vendored `driver.js/dist/driver.css` imported in `src/app/layout.tsx:2`.

## Runtime

**Environment:**
- Node.js (version not pinned — no `.nvmrc` and no `engines` field in `package.json`). `@types/node@^20` is installed as a dev dependency, implying Node 20 as the development target.
- Next.js 14.2.15 runtime (App Router). The single API route (`src/app/api/currencyChart/route.ts`) runs in the default Node.js runtime; `robots.ts` and `sitemap.ts` are build-time metadata routes.
- Browser runtime is the real execution target — the app is client-only (`"use client"` on all interactive files); user state lives in `localStorage`.

**Package Manager:**
- npm — `package-lock.json` (`lockfileVersion: 3`) is the sole, authoritative lockfile.
- Lockfile: present (`package-lock.json`, ~295 KB).
- The previously-reported lockfile conflict is resolved: no `yarn.lock`, no `bun.lockb`, and no Yarn PnP artifacts (`.pnp.cjs` / `.pnp.loader.mjs`) exist on disk. `bun.lockb` and `.pnp*` are now listed in `.gitignore`. Scripts invoke `npm run dev` (e.g. `playwright.config.ts:15`), confirming npm.

## Frameworks

**Core:**
- Next.js `14.2.15` - React framework, App Router (`src/app/`). Provides pages, layouts, the currency-chart API route, metadata routes (`robots.ts`, `sitemap.ts`), local font loading (`next/font/local`), `next/script`, and security headers (`next.config.mjs`).
- React `^18` / react-dom `^18` (resolved `18.3.1`) - UI rendering.
- Tailwind CSS `^3.4.1` (resolved `3.4.14`) - Utility-first CSS, configured in `tailwind.config.ts`, theme extension in `src/theme/theme.ts`.
- DaisyUI `^4.12.13` (resolved `4.12.24`) - Tailwind component plugin. **Now configured with both `light` and `dark` themes** (`tailwind.config.ts:16`) — a change from the previously dark-only setup; theme is applied dynamically via `src/components/ThemeApplier.tsx` and toggled via `src/components/ThemeToggle.tsx`.
- Jotai `^2.12.3` (resolved `2.17.0`) - Atomic state management with `localStorage` persistence via `atomWithStorage` (`src/lib/atoms.ts`). Wrapped once by `<Provider>` in `src/app/layout.tsx:65`.
- SWR `^2.2.5` (resolved `2.3.8`) - Client-side data fetching/caching (`src/app/page.tsx`, `src/app/chart/page.tsx`, `src/app/convert/[pair]/page.tsx`).

**Testing:**
- Vitest `^2.1.9` - Unit/component test runner. Config `vitest.config.ts` (React plugin, default `node` environment, component tests opt into `jsdom` via a `@vitest-environment jsdom` docblock; include glob `src/**/*.{test,spec}.{ts,tsx}`).
- @testing-library/react `^16.3.2`, @testing-library/dom `^10.4.1`, @testing-library/user-event `^14.6.1` - Component testing utilities.
- jsdom `^29.1.1` (resolved `29.1.1`) - DOM environment for component tests.
- @vitejs/plugin-react `^4.7.0` - JSX/React transform for Vitest.
- Playwright `@playwright/test@^1.61.1` - End-to-end tests in `e2e/` (`e2e/home.spec.ts`, `e2e/tour.spec.ts`). Config `playwright.config.ts` (Chromium only, `baseURL http://localhost:3000`, auto-starts `npm run dev`).

**Build/Dev:**
- Next.js CLI - `next dev`, `next build`, `next start`, `next lint` (`package.json:7-10`).
- PostCSS `^8` with the `tailwindcss` plugin (`postcss.config.mjs`).
- ESLint `^8` with `eslint-config-next@14.2.15`, config `.eslintrc.json` (extends `next/core-web-vitals`, `next/typescript`; disables `@typescript-eslint/no-explicit-any`).

## Key Dependencies

**Critical:**
- `next` (14.2.15) - Framework, routing, API route, metadata routes, font loading, security headers.
- `react` / `react-dom` (^18) - UI rendering.
- `jotai` (^2.12.3) - Global state persisted to `localStorage`; core to the currency list, settings, and tour "seen" flag.
- `swr` (^2.2.5) - Data fetching/caching for all rate and chart data.
- `driver.js` (^1.6.0, resolved `1.6.0`) - First-run onboarding tour engine (~5 KB, vanilla, selector-based). Steps built in `src/lib/tourSteps.ts`; CSS imported in `src/app/layout.tsx:2`; overrides in `src/theme/tour.css`. Anchored on `data-tour` attributes (never on translated `aria-label`s).
- `recharts` (^2.13.3, resolved `2.15.4`) - Historical rate line chart (`src/app/chart/page.tsx`).
- `react-window` (^1.8.11) - List virtualization for the currency table (`src/app/page.tsx`).

**Infrastructure:**
- `@tailwindcss/forms` (^0.5.9) - Form-element styling plugin.
- `daisyui` (^4.12.13) - Component styling.
- `lodash` (^4.17.21, resolved `4.17.23`) - Utility functions (e.g. `pick`).

**Vendored (not via npm):**
- `drag-drop-touch` polyfill - Vendored to `public/vendor/drag-drop-touch.esm.min.js` and loaded same-origin as an ES-module `<script>` from `src/app/page.tsx:59-74` (enables HTML5 drag-and-drop reordering on touch devices). Kept local to satisfy the CSP `script-src 'self'` and the project's vendored-dependency style.

## Configuration

**Environment:**
- `.env.example` present (documents defaults; copy to `.env.local`). `.env*.local` is gitignored. **No secrets are required** — every value has a safe fallback baked into source.
- `NEXT_PUBLIC_CLARITY_ID` - Microsoft Clarity analytics project id. Analytics is disabled when unset (`src/app/layout.tsx:47,73`).
- `NEXT_PUBLIC_CURRENCY_API_HOST` - Currency-rate API host, default `currency-api.pages.dev` (`src/lib/api.ts:25`). Changing it requires updating `connect-src` in the CSP.
- `YAHOO_FINANCE_HOST` - Server-side chart API host, default `query1.finance.yahoo.com` (`src/app/api/currencyChart/route.ts:30`).
- `NEXT_PUBLIC_SITE_URL` - Canonical origin, default `https://moneyrate.lol`; used for `metadataBase`, `sitemap.xml`, `robots.txt` (`src/lib/pairs.ts:18`, `src/app/layout.tsx:26`).

**Build:**
- `next.config.mjs` - Defines a strict Content-Security-Policy and security headers (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy`) applied to all routes via `headers()`. `'unsafe-eval'` is dev-only. `connect-src` allow-lists `*.currency-api.pages.dev`, `cdn.jsdelivr.net`, and `*.clarity.ms`. Note: no `next/image` remote patterns block remains — icons are served from `public/` (`img-src 'self' data:`).
- `tsconfig.json` - Strict TypeScript, `@/*` path alias, Next.js TS plugin.
- `tailwind.config.ts` - Content globs for `src/pages`, `src/components`, `src/app`; imports `src/theme/theme.ts`; DaisyUI `light` + `dark` themes.
- `postcss.config.mjs` - Tailwind PostCSS plugin only.
- `vitest.config.ts`, `playwright.config.ts` - Test configuration (see Testing above).

## Platform Requirements

**Development:**
- Node.js (assume 20.x per `@types/node`) + npm.
- Install: `npm install`. Dev: `npm run dev` (`http://localhost:3000`).
- Test: `npm test` / `npm run test:run` (Vitest); `npm run test:e2e` (Playwright — installs/uses Chromium, auto-starts the dev server).

**Production:**
- Standard Next.js server (`next build` + `next start`). Deployed at `https://moneyrate.lol`.
- Vercel-compatible (standard scripts; no `vercel.json` present). Requires a Node.js server runtime because of the `/api/currencyChart` route handler and the security-header middleware in `next.config.mjs` — this is not a pure static export.
- Service worker (`public/sw.js`) registers **only** in production (`src/components/ServiceWorkerRegister.tsx:9`), providing offline support and PWA installability.

---

*Stack analysis: 2026-07-11*
