# Deferred Items — Phase 3

Out-of-scope discoveries logged during plan execution, not fixed (per executor scope-boundary rule).

## From 03-04 execution

### e2e/home.spec.ts: `toggles between light and dark themes` flakes due to tour auto-start overlay

- **Found during:** Task 3 (running the full `npx playwright test` suite to confirm no regressions from the 03-04 changes).
- **Symptom:** `home converter > toggles between light and dark themes` fails intermittently (reproduced 3/3 times when isolated) with `<svg class="driver-overlay...">` intercepting the theme-toggle button's pointer events.
- **Root cause:** `e2e/home.spec.ts`'s `seed()` helper does not set `tourSeen: true` in `localStorage` (unlike `e2e/tour.spec.ts`'s `seed()`, which does). The guided tour therefore auto-starts on page load and its overlay can still be animating/present when the theme-toggle test clicks, blocking the click.
- **Confirmed pre-existing:** Reproduced against commit `14d6530` (tip of 03-03, before any 03-04 change) via a disposable `git worktree` — same 3/3 failure rate, unrelated to this plan's tour.css/page.tsx/tour.spec.ts edits.
- **Scope boundary:** Not caused by, and not fixable within, 03-04's file set (`src/theme/tour.css`, `src/app/page.tsx` RTL hook, `e2e/tour.spec.ts`). Fixing it would mean editing `e2e/home.spec.ts`'s `seed()` to add `tourSeen: true` (or another gating change), which is out of this plan's declared `files_modified`.
- **Suggested fix (for whoever picks this up):** Add `localStorage.setItem('tourSeen', JSON.stringify(true));` to `e2e/home.spec.ts`'s `seed()`, mirroring `e2e/tour.spec.ts`'s convention, OR wait for `.driver-overlay` to detach before the theme-toggle click.
- **Not fixed by this plan.**
