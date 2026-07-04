import { expect, test, type Page } from '@playwright/test';

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
});
