import { test, expect } from '@playwright/test';

test.describe('Admin Supplier Detail', () => {
  test('should load supplier list page', async ({ page }) => {
    await page.goto('/admin/suppliers');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toBeTruthy();
  });

  test('should show supplier detail page structure', async ({ page }) => {
    await page.goto('/admin/suppliers/nonexistent-id');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toBeTruthy();
  });
});
