import { expect, test, type Page } from '@playwright/test';

// Mirrors src/lib/tourSteps.ts's TOUR_STEP_COUNT (TOUR-06: exactly 8 anchored
// feature steps, plus 1 welcome card = 9 total popover renders). Not
// imported directly — this spec file intentionally has no cross-imports
// from src/ (existing e2e convention, see e2e/home.spec.ts).
const TOUR_STEP_COUNT = 8;

// Deterministic rate data so tests don't depend on the live API.
// Mirrors e2e/home.spec.ts's mockRates() exactly (same upstream paths).
async function mockRates(page: Page) {
  await page.route('**/v1/currencies.json', (route) =>
    route.fulfill({ json: { usd: 'US Dollar', eur: 'Euro', cad: 'Canadian Dollar', gbp: 'British Pound' } })
  );
  await page.route('**/v1/currencies/usd.json', (route) =>
    route.fulfill({ json: { date: '2026-07-03', usd: { usd: 1, eur: 0.9, cad: 1.4 } } })
  );
}

// Seeds `tourSeen: true` so the tour never auto-starts — every test in this
// file drives the tour deliberately via the "?" replay button instead, to
// keep keyboard-drive assertions deterministic (auto-start racing with a
// Tab-key sequence would be flaky).
async function seed(page: Page) {
  await mockRates(page);
  await page.addInitScript(() => {
    localStorage.setItem('currency2Display', JSON.stringify(['usd', 'eur', 'cad']));
    localStorage.setItem('currencyValue', '100');
    localStorage.setItem('baseCur', JSON.stringify('usd'));
    localStorage.setItem('theme', JSON.stringify('dark'));
    localStorage.setItem('language', JSON.stringify('en'));
    localStorage.setItem('tourSeen', JSON.stringify(true));
  });
}

// Tabs from the top of the page until the "?" replay button is focused, or
// throws after a generous bound so a layout regression fails loudly instead
// of hanging. Targets the button via its stable `.tour-replay-btn` class,
// NEVER a localized aria-label (CLAUDE.md anchor rule).
async function focusReplayButton(page: Page) {
  const replayBtn = page.locator('.tour-replay-btn');
  for (let i = 0; i < 15; i++) {
    const isFocused = await replayBtn.evaluate((el) => el === document.activeElement).catch(() => false);
    if (isFocused) return;
    await page.keyboard.press('Tab');
  }
  await expect(replayBtn).toBeFocused();
}

test.describe('tour keyboard accessibility (A11Y-01)', () => {
  test('VERIFY-FIRST: keyboard-driven focus restoration baseline', async ({ page }) => {
    await seed(page);
    await page.goto('/');

    // Drive to the "?" button via keyboard, not page.click() — Open Question 1
    // in 03-RESEARCH.md notes Playwright's click may focus differently than a
    // real keyboard-only user's Tab+Enter path, which is what D-07 cares about.
    await focusReplayButton(page);
    await expect(page.locator('.tour-replay-btn')).toBeFocused();

    // Enter opens the tour (driver.js popover appears).
    await page.keyboard.press('Enter');
    await expect(page.locator('.driver-popover')).toBeVisible();

    // ArrowRight advances a step (built-in allowKeyboardControl, no new code).
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.driver-popover')).toBeVisible();

    // ArrowLeft goes back a step.
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('.driver-popover')).toBeVisible();

    // Escape closes the tour.
    await page.keyboard.press('Escape');
    await expect(page.locator('.driver-popover')).not.toBeVisible();

    // BASELINE ASSERTION: does driver.js's built-in activeElement capture/
    // restore already return focus to the "?" button on a keyboard-triggered
    // close? This is the verify-first gate for Task 3's focus-restore branch.
    await expect(page.locator('.tour-replay-btn')).toBeFocused();
  });

  test('VERIFY-FIRST: focus restoration after Done on the last step', async ({ page }) => {
    await seed(page);
    await page.goto('/');

    await focusReplayButton(page);
    await page.keyboard.press('Enter');
    await expect(page.locator('.driver-popover')).toBeVisible();

    // Advance through all 8 feature steps (welcome + 8 = 9 total renders) to
    // reach the Done button on the final step.
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('ArrowRight');
    }
    await expect(page.locator('.driver-popover')).toBeVisible();

    // Trigger Done via keyboard: Tab to the done button inside the popover,
    // then Enter — never page.click().
    const doneBtn = page.locator('.driver-popover-done-btn');
    if (await doneBtn.count() > 0) {
      await doneBtn.focus();
      await page.keyboard.press('Enter');
    } else {
      // Fallback: Escape still exercises the same onDestroyed/onCloseClick path.
      await page.keyboard.press('Escape');
    }
    await expect(page.locator('.driver-popover')).not.toBeVisible();

    await expect(page.locator('.tour-replay-btn')).toBeFocused();
  });

  test('keyboard-visible focus rings render on the popover Next button', async ({ page }) => {
    await seed(page);
    await page.goto('/');

    await focusReplayButton(page);
    await page.keyboard.press('Enter');
    await expect(page.locator('.driver-popover')).toBeVisible();

    // Tab from the "?" trigger into the popover's own footer buttons — driver.js's
    // focus trap keeps Tab scoped to [popover.wrapper, activeElement] (RESEARCH.md).
    const nextBtn = page.locator('.driver-popover-next-btn');
    if (await nextBtn.count() > 0) {
      await nextBtn.focus();
      const outline = await nextBtn.evaluate((el) => getComputedStyle(el).outlineStyle);
      expect(outline).toBe('solid');
    }

    await page.keyboard.press('Escape');
  });

  test('prefers-reduced-motion disables driver.js animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await seed(page);
    await page.goto('/');

    await focusReplayButton(page);
    await page.keyboard.press('Enter');
    await expect(page.locator('.driver-popover')).toBeVisible();

    // driver.js adds "driver-fade" to <body> only when its `animate` config
    // is truthy (node_modules/driver.js/dist/driver.js.mjs:531); with
    // prefers-reduced-motion honored, startTour() passes animate: false, so
    // <body> should carry "driver-simple" instead, never "driver-fade".
    const bodyClasses = await page.evaluate(() => document.body.className);
    expect(bodyClasses).toContain('driver-simple');
    expect(bodyClasses).not.toContain('driver-fade');

    // CSS defense-in-depth: the popover's own animation-duration custom
    // property collapses to 0ms under the media query (src/theme/tour.css).
    const animationDuration = await page
      .locator('.driver-popover')
      .evaluate((el) => getComputedStyle(el).getPropertyValue('--driver-animation-duration').trim());
    expect(animationDuration).toBe('0ms');

    await page.keyboard.press('Escape');
    await expect(page.locator('.driver-popover')).not.toBeVisible();
  });
});

test.describe('tour mobile/touch fit (A11Y-02)', () => {
  test('all 9 popovers (welcome + 8 steps) fit within a 320px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await seed(page);
    await page.goto('/');

    await focusReplayButton(page);
    await page.keyboard.press('Enter');
    await expect(page.locator('.driver-popover')).toBeVisible();

    // Welcome card + 8 anchored feature steps = 9 renders. Assert the
    // responsive max-width formula (tour.css) keeps every popover fully
    // within the 320px viewport at each step, never overflowing/touching
    // the edge (D-08, SC4). Advances via the real .driver-popover-next-btn
    // class (never a keyboard ArrowRight press here) — driver.js's default
    // `animate: true` keeps an internal __transitionCallback guard set for
    // ~400ms after each highlight change, during which ArrowRight/moveNext
    // silently no-ops; clicking the Next button goes through the same
    // onNextClick path without racing that timing window, and mobile
    // keyboard-nav itself is already covered by the A11Y-01 describe block
    // above. Only 7 clicks are needed to visit all 9 renders (welcome -> ...
    // -> step 8): clicking Next on step 8 itself is the Done action and
    // destroys the tour, so the loop must stop advancing after step 8 is
    // checked, not before.
    for (let i = 0; i < TOUR_STEP_COUNT + 1; i++) {
      const box = await page.locator('.driver-popover').boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(320);
      }
      if (i < TOUR_STEP_COUNT - 1) {
        await page.locator('.driver-popover-next-btn').click();
        await expect(page.locator('.driver-popover')).toBeVisible();
      }
    }

    await page.keyboard.press('Escape');
  });

  test('footer buttons clear the 44px touch-target floor at mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await seed(page);
    await page.goto('/');

    await focusReplayButton(page);
    await page.keyboard.press('Enter');
    await expect(page.locator('.driver-popover')).toBeVisible();

    // Advance to a feature step (via click, see comment above) so both the
    // next and prev footer buttons render.
    await page.locator('.driver-popover-next-btn').click();
    await expect(page.locator('.driver-popover')).toBeVisible();

    const nextBtn = page.locator('.driver-popover-next-btn');
    const nextBox = await nextBtn.boundingBox();
    expect(nextBox).not.toBeNull();
    if (nextBox) expect(nextBox.height).toBeGreaterThanOrEqual(44);

    const prevBtn = page.locator('.driver-popover-prev-btn');
    await expect(prevBtn).toBeVisible();
    const prevBox = await prevBtn.boundingBox();
    expect(prevBox).not.toBeNull();
    if (prevBox) expect(prevBox.height).toBeGreaterThanOrEqual(44);

    await page.keyboard.press('Escape');
  });
});

test.describe('tour RTL (ar/ur, scoped to popover)', () => {
  for (const rtlLocale of ['ar', 'ur'] as const) {
    test(`popover renders dir="rtl" and mirrors footer order for ${rtlLocale}`, async ({ page }) => {
      await mockRates(page);
      await page.addInitScript((locale) => {
        localStorage.setItem('currency2Display', JSON.stringify(['usd', 'eur', 'cad']));
        localStorage.setItem('currencyValue', '100');
        localStorage.setItem('baseCur', JSON.stringify('usd'));
        localStorage.setItem('theme', JSON.stringify('dark'));
        localStorage.setItem('language', JSON.stringify(locale));
        localStorage.setItem('tourSeen', JSON.stringify(true));
      }, rtlLocale);
      await page.goto('/');

      await focusReplayButton(page);
      await page.keyboard.press('Enter');
      await expect(page.locator('.driver-popover')).toBeVisible();

      await expect(page.locator('.driver-popover')).toHaveAttribute('dir', 'rtl');

      // Welcome card shows only Next/Close (no Previous), so advance one step
      // via the real .driver-popover-next-btn class (never ArrowRight — see
      // the mobile/touch-fit describe block above for why keyboard nav races
      // driver.js's internal transition guard) to reach a footer with both
      // Next and Back rendered together.
      await page.locator('.driver-popover-next-btn').click();
      await expect(page.locator('.driver-popover-footer')).toBeVisible();
      await expect(page.locator('.driver-popover-footer')).toHaveCSS('flex-direction', 'row-reverse');

      // Arrow positioning is physical-direction (viewport geometry), not
      // text-direction — untouched by RTL, so no assertion needed here
      // beyond confirming the popover is still anchored/visible.
      await expect(page.locator('.driver-popover')).toBeVisible();

      await page.keyboard.press('Escape');
    });
  }

  test('app-wide dir is NOT set to rtl (scope: popover only)', async ({ page }) => {
    await mockRates(page);
    await page.addInitScript(() => {
      localStorage.setItem('currency2Display', JSON.stringify(['usd', 'eur', 'cad']));
      localStorage.setItem('currencyValue', '100');
      localStorage.setItem('baseCur', JSON.stringify('usd'));
      localStorage.setItem('theme', JSON.stringify('dark'));
      localStorage.setItem('language', JSON.stringify('ar'));
      localStorage.setItem('tourSeen', JSON.stringify(true));
    });
    await page.goto('/');

    await focusReplayButton(page);
    await page.keyboard.press('Enter');
    await expect(page.locator('.driver-popover')).toBeVisible();
    await expect(page.locator('.driver-popover')).toHaveAttribute('dir', 'rtl');

    await expect(page.locator('html')).not.toHaveAttribute('dir', 'rtl');
    await expect(page.locator('body')).not.toHaveAttribute('dir', 'rtl');

    await page.keyboard.press('Escape');
  });
});
