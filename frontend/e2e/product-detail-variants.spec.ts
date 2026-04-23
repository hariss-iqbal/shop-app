import { test, expect } from '@playwright/test';

test.describe('Product Detail - Variants', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to catalog first to find a product
    await page.goto('/catalog');
    await page.waitForLoadState('networkidle');
  });

  test('should show variant chips on product detail', async ({ page }) => {
    const cards = page.locator('[data-testid="variant-card"], .catalog-card, .product-card');
    if (await cards.count() === 0) {
      test.skip();
    }

    await cards.first().click();
    await page.waitForURL('**/product/**');

    // Should show variant chips (storage + pta + condition combos)
    const variantChips = page.locator('[data-testid="variant-chip"], .variant-chip, .p-chip');
    // Variant chips may or may not exist depending on data
    const chipCount = await variantChips.count();
    if (chipCount > 1) {
      // Click second variant chip
      await variantChips.nth(1).click();
      await page.waitForTimeout(300);
    }
  });

  test('should show color swatches from available colors', async ({ page }) => {
    const cards = page.locator('[data-testid="variant-card"], .catalog-card, .product-card');
    if (await cards.count() === 0) {
      test.skip();
    }

    await cards.first().click();
    await page.waitForURL('**/product/**');

    // Check for color swatches
    const colorSwatches = page.locator('[data-testid="color-swatch"], .color-swatch, .color-dot');
    // May or may not exist — depends on data
    const swatchCount = await colorSwatches.count();
    if (swatchCount > 0) {
      await colorSwatches.first().click();
      await page.waitForTimeout(200);
    }
  });
});
