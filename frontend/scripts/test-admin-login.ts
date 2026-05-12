import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized'],
  });

  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();

  // 1. Navigate to login page
  await page.goto('http://localhost:4200/auth/login');
  console.log('✅ Navigated to login page');

  // 2. Fill email
  const emailInput = page.locator('input[placeholder="admin@example.com"]');
  await emailInput.fill('admin@gmail.com');
  console.log('✅ Entered email: admin@gmail.com');

  // 3. Fill password
  const passwordInput = page.locator('input[type="password"], input[placeholder*="password" i]');
  await passwordInput.fill('password123');
  console.log('✅ Entered password');

  // 4. Click Sign In
  const signInBtn = page.getByRole('button', { name: 'Sign In' });
  await signInBtn.click();
  console.log('✅ Clicked Sign In');

  // 5. Wait for navigation — either to admin panel or an error
  await page.waitForTimeout(5000);

  const currentUrl = page.url();
  console.log(`📍 Current URL: ${currentUrl}`);

  if (currentUrl.includes('/admin')) {
    console.log('🎉 SUCCESS — Logged in and redirected to admin panel!');
  } else {
    console.log('⚠️  Not on admin panel yet. Current page may show an error or pending approval.');
    // Check for any error messages on page
    const bodyText = await page.locator('body').innerText();
    const errorLines = bodyText.split('\n').filter(l => l.toLowerCase().includes('error') || l.toLowerCase().includes('invalid') || l.toLowerCase().includes('denied')).slice(0, 5);
    if (errorLines.length) {
      console.log('Page errors found:', errorLines.join(' | '));
    }
  }

  console.log('\n📺 Browser is visible on your screen. Press Ctrl+C to close.\n');
  await new Promise(() => {});
})();
