/** Verify one admin route end-to-end: login, navigate, capture http errors + screenshot.
 * Usage: node scripts/verify-route.mjs <path> <shotname> */
import { chromium } from 'playwright';
const BASE = 'http://localhost:4200';
const path = process.argv[2] || '/admin/permissions';
const name = process.argv[3] || 'verify';
const SHOTS = '/Users/haris/IdeaProjects/general-project-maker/projects/shop-app/tmp/smoke/shots';
const httpErr = [], consoleErr = [];
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  p.on('console', (m) => { if (m.type() === 'error' && !/favicon|vite|DevTools/i.test(m.text())) consoleErr.push(m.text().slice(0, 200)); });
  p.on('response', (r) => { if (r.status() >= 400 && r.url().includes('54321')) httpErr.push(`${r.status()} ${r.request().method()} ${r.url().replace(/^https?:\/\/[^/]+/, '').slice(0, 110)}`); });
  await p.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded' });
  await p.locator('input[placeholder="admin@example.com"]').fill('admin@gmail.com');
  await p.locator('input[type="password"]').first().fill('password123');
  await p.getByRole('button', { name: 'Sign In' }).click();
  await p.waitForURL(/\/admin/, { timeout: 25000 });
  httpErr.length = 0; consoleErr.length = 0; // ignore login-phase noise
  await p.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  await p.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
  const body = (await p.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ');
  console.log('URL:', p.url());
  console.log('HTTP ERRORS:', httpErr.length ? httpErr.join(' | ') : 'none');
  console.log('CONSOLE ERRORS:', consoleErr.length ? consoleErr.join(' | ') : 'none');
  console.log('BODY SNIPPET:', body.slice(0, 400));
  await b.close();
})();
