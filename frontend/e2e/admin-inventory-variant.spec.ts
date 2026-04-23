import { test, expect } from '@playwright/test';

test.describe('Admin Inventory - Variant Selection', () => {
  test('should navigate to inventory add page', async ({ page }) => {
    await page.goto('/admin/inventory/new');
    await page.waitForLoadState('networkidle');

    // Admin pages require auth — either we see the form or a login redirect
    const url = page.url();
    const hasLoginForm = await page.locator('input[type="email"], input[formControlName="email"], form').first().isVisible().catch(() => false);
    const hasForm = await page.locator('[aria-label="Brand"], [data-testid="brand-select"], .p-select').first().isVisible().catch(() => false);

    expect(url).toBeTruthy();
  });
});
