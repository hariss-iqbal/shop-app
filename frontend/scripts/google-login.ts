import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized'],
  });

  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();

  // Navigate to login page
  await page.goto('http://localhost:4200/auth/login');
  console.log('✅ Navigated to login page');

  // Click "Continue with Google"
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  console.log('✅ Clicked "Continue with Google"');

  // Wait for Google sign-in page
  await page.waitForURL('**/accounts.google.com/**', { timeout: 15000 });
  console.log('✅ Google sign-in page loaded');

  // Fill email
  await page.getByRole('textbox', { name: 'Email or phone' }).fill('harisiqbal848@gmail.com');
  console.log('✅ Entered email');

  // Click Next
  await page.getByRole('button', { name: 'Next' }).click();
  console.log('✅ Clicked Next — browser is now open for you to complete login manually');

  // Keep browser open indefinitely so user can interact
  console.log('\n📺 Browser is visible on your screen. Complete the login there.');
  console.log('Press Ctrl+C in this terminal to close the browser when done.\n');

  // Wait forever until user presses Ctrl+C
  await new Promise(() => {});
})();
