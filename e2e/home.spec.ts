import { expect, test, type Page } from '@playwright/test';

// Deterministic rate data so tests don't depend on the live API.
// Both the pages.dev mirror and the jsdelivr fallback end in these paths.
async function mockRates(page: Page) {
  await page.route('**/v1/currencies.json', (route) =>
    route.fulfill({ json: { usd: 'US Dollar', eur: 'Euro', cad: 'Canadian Dollar', gbp: 'British Pound' } })
  );
  await page.route('**/v1/currencies/usd.json', (route) =>
    route.fulfill({ json: { date: '2026-07-03', usd: { usd: 1, eur: 0.9, cad: 1.4 } } })
  );
}

async function seed(page: Page) {
  await mockRates(page);
  await page.addInitScript(() => {
    localStorage.setItem('currency2Display', JSON.stringify(['usd', 'eur', 'cad']));
    localStorage.setItem('currencyValue', '100');
    localStorage.setItem('baseCur', JSON.stringify('usd'));
    localStorage.setItem('theme', JSON.stringify('dark'));
  });
}

test.describe('home converter', () => {
  test('converts the base amount to displayed currencies', async ({ page }) => {
    await seed(page);
    await page.goto('/');

    await expect(page.getByRole('textbox', { name: /USD amount/i })).toHaveValue('100');
    // 100 USD * 0.9 = 90.00 EUR, * 1.4 = 140.00 CAD
    await expect(page.getByText('90.00')).toBeVisible();
    await expect(page.getByText('140.00')).toBeVisible();
  });

  test('evaluates a math expression in the amount field', async ({ page }) => {
    await seed(page);
    await page.goto('/');

    await page.getByRole('textbox', { name: /USD amount/i }).fill('10*5'); // 50 USD
    await expect(page.getByText('45.00')).toBeVisible(); // 50 * 0.9 EUR
  });

  test('toggles between light and dark themes', async ({ page }) => {
    await seed(page);
    await page.goto('/');

    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await page.getByRole('button', { name: /toggle light\/dark theme/i }).click();
    await expect(html).toHaveAttribute('data-theme', 'light');
  });

    test('surfaces a not-yet-displayed currency in search results', async ({ page }) => {
    await seed(page);
    await page.goto('/');

    // GBP is in the names map but not in the displayed list, so it should appear.
    await page.getByRole('combobox', { name: /search currencies/i }).fill('gbp');
    await expect(page.getByRole('option', { name: /GBP/i })).toBeVisible();
  });
});

test.describe('SEO pair page', () => {
  test('renders the heading and SEO title', async ({ page }) => {
    await page.goto('/convert/usd-to-eur');
    await expect(page).toHaveTitle(/USD to EUR/);
    await expect(page.getByRole('heading', { name: /Convert USD to EUR/i })).toBeVisible();
  });
});
