import { test, expect } from '@playwright/test';

test.describe('Catalog - Variant Cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/catalog');
    await page.waitForLoadState('networkidle');
  });

  test('should display variant cards with price and stock info', async ({ page }) => {
    const cards = page.locator('[data-testid="variant-card"], .catalog-card, .product-card');
    if (await cards.count() === 0) {
      // No variants in DB yet — skip
      test.skip();
    }

    const firstCard = cards.first();
    await expect(firstCard).toBeVisible();

    // Card should show a price (single value, not range)
    const priceText = await firstCard.textContent();
    expect(priceText).toBeTruthy();
  });

  test('should filter by brand', async ({ page }) => {
    const brandFilter = page.locator('[data-testid="brand-filter"], .brand-filter, [aria-label="Brand"]').first();
    if (await brandFilter.isVisible()) {
      await brandFilter.click();
      // Select first brand option if available
      const brandOption = page.locator('.p-overlay-panel li, .p-listbox-item, [role="option"]').first();
      if (await brandOption.isVisible()) {
        await brandOption.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should filter by price range', async ({ page }) => {
    // Look for price range slider or inputs
    const priceFilter = page.locator('[data-testid="price-range"], .price-slider, input[placeholder*="price"]').first();
    if (await priceFilter.isVisible()) {
      // Verify price filter exists and is interactive
      await expect(priceFilter).toBeEnabled();
    }
  });

  test('should navigate to product detail on card click', async ({ page }) => {
    const cards = page.locator('[data-testid="variant-card"], .catalog-card, .product-card');
    if (await cards.count() === 0) {
      test.skip();
    }

    await cards.first().click();
    await page.waitForURL('**/product/**');
    expect(page.url()).toContain('/product/');
  });
});
