// Verifies proactive token refresh on tab focus fires a /auth/v1/token refresh
// WITHOUT any user click (i.e. before the user's first data call).
// (Run with PROACTIVE_REFRESH_LEAD temporarily widened.)
import { chromium } from 'playwright';
const APP = 'http://localhost:4200';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
  const p = await ctx.newPage();
  let refreshOnFocus = 0;
  await p.goto(`${APP}/auth/login`, { waitUntil: 'domcontentloaded' });
  await p.locator('input[placeholder="admin@example.com"]').fill('admin@gmail.com');
  await p.locator('input[type="password"]').first().fill('password123');
  await p.getByRole('button', { name: 'Sign In' }).click();
  await p.waitForURL(/\/admin/, { timeout: 20000 }).catch(() => {});
  await sleep(2000);
  // start counting refresh calls only AFTER login settles
  p.on('request', (r) => { if (/\/auth\/v1\/token\?grant_type=refresh_token/.test(r.url())) refreshOnFocus++; });
  console.log('logged in; now simulate background -> foreground with NO click');
  await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await sleep(800);
  const before = refreshOnFocus;
  await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('focus')); });
  await sleep(2500); // NO navigation / NO click
  console.log(`refresh-token calls triggered by focus alone: ${refreshOnFocus - before}`);
  console.log(refreshOnFocus - before > 0 ? '✅ PROACTIVE REFRESH FIRED ON FOCUS (before any click)' : '❌ no proactive refresh');
  await b.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
