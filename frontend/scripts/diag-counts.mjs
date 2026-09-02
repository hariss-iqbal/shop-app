/** Focused: do the aborted HEAD/count requests succeed when we DON'T navigate away? */
import { chromium } from 'playwright';
const BASE = 'http://localhost:4200';
const seen = [];
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await (await b.newContext()).newPage();
  p.on('response', (r) => {
    const u = r.url();
    if (/contact_messages|rpc\/|status=eq\.available|user_roles|audit_logs/.test(u) && u.includes('54321')) {
      seen.push(`${r.status()} ${r.request().method()} ${u.replace(/^https?:\/\/[^/]+/, '').slice(0, 90)}`);
    }
  });
  p.on('requestfailed', (r) => {
    const u = r.url();
    if (/contact_messages|rpc\/|status=eq\.available|user_roles|audit_logs/.test(u) && u.includes('54321')) {
      seen.push(`FAILED ${r.method()} ${u.replace(/^https?:\/\/[^/]+/, '').slice(0, 90)} (${r.failure()?.errorText})`);
    }
  });
  await p.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded' });
  await p.locator('input[placeholder="admin@example.com"]').fill('admin@gmail.com');
  await p.locator('input[type="password"]').first().fill('password123');
  await p.getByRole('button', { name: 'Sign In' }).click();
  await p.waitForURL(/\/admin/, { timeout: 25000 });
  console.log('--- on dashboard, sitting still 12s ---');
  seen.length = 0;
  await p.goto(`${BASE}/admin/dashboard`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(12000); // DO NOT navigate away
  console.log(seen.join('\n'));
  console.log('\n--- contact_messages specifically ---');
  console.log(seen.filter((s) => /contact_messages/.test(s)).join('\n') || '(none)');
  await b.close();
})();
