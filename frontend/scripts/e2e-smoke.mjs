/**
 * Dedicated Playwright smoke test (headless) for the shop-app.
 * Logs in as admin, then visits every public + admin route, capturing:
 *   - console errors, uncaught page errors
 *   - failed/4xx/5xx REST + RPC + functions + auth calls
 *   - load time per route (flags slow/hung routes — see auth-lock freeze issue)
 *   - redirects to access-denied / pending-approval / not-found / error
 *   - a screenshot per route
 * Writes a JSON + console summary at the end.
 *
 * Run: cd frontend && node scripts/e2e-smoke.mjs
 * Env: HEADED=1 to watch, SLOWMO=ms
 */
import { chromium } from 'playwright';
import * as fs from 'fs';

const BASE = process.env.BASE || 'http://localhost:4200';
const EMAIL = 'admin@gmail.com';
const PASSWORD = 'password123';
const OUT = '/Users/haris/IdeaProjects/general-project-maker/projects/shop-app/tmp/smoke';
const SHOTS = `${OUT}/shots`;
fs.mkdirSync(SHOTS, { recursive: true });

const NAV_TIMEOUT = 30000;
const IDLE_TIMEOUT = 12000;
const SLOW_MS = 10000; // routes slower than this are flagged (auth-lock serialization symptom)

// console noise we don't care about
const IGNORE = [
  /favicon/i, /manifest\.webmanifest/i, /Download the Angular DevTools/i,
  /\[vite\]/i, /sourcemap/i, /preload/i, /net::ERR_ABORTED.*\.(png|jpg|jpeg|webp|svg|woff2?)/i,
];

const log = (m) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`);

const PUBLIC_ROUTES = [
  ['home', '/'],
  ['catalog', '/catalog'],
  ['compare', '/compare'],
  ['contact', '/contact'],
  ['about', '/about'],
];

const ADMIN_ROUTES = [
  ['dashboard', '/admin/dashboard'],
  ['inventory-list', '/admin/inventory'],
  ['inventory-new', '/admin/inventory/new'],
  ['data-quality', '/admin/data-quality'],
  ['brands', '/admin/brands'],
  ['models', '/admin/models'],
  ['variants', '/admin/variants'],
  ['suppliers', '/admin/suppliers'],
  ['supplier-new', '/admin/suppliers/new'],
  ['purchase-orders', '/admin/purchase-orders'],
  ['purchase-order-new', '/admin/purchase-orders/new'],
  ['sales', '/admin/sales'],
  ['sales-dashboard', '/admin/sales-dashboard'],
  ['expenses', '/admin/expenses'],
  ['grand-profit', '/admin/grand-profit'],
  ['sale-new', '/admin/sales/new'],
  ['customer-lookup', '/admin/sales/customer-lookup'],
  ['customers', '/admin/customers'],
  ['receipts', '/admin/receipts'],
  ['refunds', '/admin/refunds'],
  ['messages', '/admin/messages'],
  ['storage', '/admin/storage'],
  ['receipt-sequences', '/admin/receipt-sequences'],
  ['users', '/admin/users'],
  ['permissions', '/admin/permissions'],
  ['audit-logs', '/admin/audit-logs'],
  ['loyalty-members', '/admin/loyalty/members'],
  ['loyalty-config', '/admin/loyalty/config'],
  ['coupons', '/admin/coupons'],
  ['locations', '/admin/locations'],
  ['location-inventory', '/admin/location-inventory'],
  ['inventory-transfers', '/admin/inventory-transfers'],
  ['transfer-new', '/admin/inventory-transfers/new'],
  ['legacy-data', '/admin/legacy-data'],
  ['sync-status', '/admin/sync-status'],
  ['sidebar-settings', '/admin/sidebar-settings'],
  ['shop-details', '/admin/shop-details'],
];

const results = [];
let cur = null; // current route record

function attachListeners(page) {
  page.on('console', (m) => {
    if (m.type() !== 'error' || !cur) return;
    const t = m.text();
    if (IGNORE.some((re) => re.test(t))) return;
    cur.consoleErrors.push(t.slice(0, 300));
  });
  page.on('pageerror', (e) => {
    if (cur) cur.pageErrors.push(String(e.message).slice(0, 300));
  });
  page.on('response', (resp) => {
    if (!cur) return;
    const url = resp.url();
    const status = resp.status();
    if (status < 400) return;
    if (!/\/(rest|rpc|functions|auth)\/|\/rest\/v1|supabase/i.test(url) && !url.includes('54321')) return;
    cur.httpErrors.push(`${status} ${resp.request().method()} ${url.replace(/^https?:\/\/[^/]+/, '').slice(0, 120)}`);
  });
  page.on('requestfailed', (req) => {
    if (!cur) return;
    const url = req.url();
    if (!url.includes('54321')) return;
    if (IGNORE.some((re) => re.test(url))) return;
    cur.httpErrors.push(`FAILED ${req.method()} ${url.replace(/^https?:\/\/[^/]+/, '').slice(0, 120)} (${req.failure()?.errorText})`);
  });
}

async function visit(page, name, path) {
  cur = { name, path, finalUrl: '', ms: 0, consoleErrors: [], pageErrors: [], httpErrors: [], note: '', status: 'ok' };
  const t0 = Date.now();
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
    await page.waitForLoadState('networkidle', { timeout: IDLE_TIMEOUT }).catch(() => {});
    await page.waitForTimeout(500);
  } catch (e) {
    cur.status = 'NAV_ERROR';
    cur.note = String(e.message).slice(0, 160);
  }
  cur.ms = Date.now() - t0;
  cur.finalUrl = page.url().replace(BASE, '') || '/';

  // redirect-based access signals
  if (/access-denied/.test(cur.finalUrl)) { cur.status = 'ACCESS_DENIED'; }
  else if (/pending-approval/.test(cur.finalUrl)) { cur.status = 'PENDING_APPROVAL'; }
  else if (/auth\/login/.test(cur.finalUrl) && path.startsWith('/admin')) { cur.status = 'KICKED_TO_LOGIN'; }

  // content sniff
  let body = '';
  try { body = await page.locator('body').innerText({ timeout: 4000 }); } catch {}
  const errSigns = /(Page Not Found|Something went wrong|Unexpected error|404|cannot read properties|undefined is not)/i;
  if (cur.status === 'ok' && errSigns.test(body) && body.length < 400) cur.note = 'possible error page: ' + body.replace(/\s+/g, ' ').slice(0, 120);
  cur.bodyLen = body.length;

  if (cur.ms > SLOW_MS) cur.slow = true;
  if (cur.status === 'ok' && (cur.pageErrors.length || cur.httpErrors.length)) cur.status = 'ERRORS';

  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true }).catch(() => {});
  results.push(cur);
  const flag = cur.status === 'ok' && !cur.slow && !cur.consoleErrors.length ? 'OK ' : '!! ';
  log(`${flag}${name.padEnd(22)} ${String(cur.ms).padStart(6)}ms  ${cur.status}${cur.slow ? ' SLOW' : ''}  http=${cur.httpErrors.length} pageerr=${cur.pageErrors.length} console=${cur.consoleErrors.length} -> ${cur.finalUrl}`);
}

async function login(page) {
  cur = { name: 'login', path: '/auth/login', finalUrl: '', ms: 0, consoleErrors: [], pageErrors: [], httpErrors: [], note: '', status: 'ok' };
  const t0 = Date.now();
  await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[placeholder="admin@example.com"]').fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  try {
    await page.waitForURL(/\/admin/, { timeout: 25000 });
    cur.status = 'ok';
  } catch {
    cur.status = 'LOGIN_FAILED';
    cur.note = 'did not reach /admin; url=' + page.url();
  }
  cur.ms = Date.now() - t0;
  cur.finalUrl = page.url().replace(BASE, '');
  await page.screenshot({ path: `${SHOTS}/login.png` }).catch(() => {});
  results.push(cur);
  log(`login ${cur.ms}ms ${cur.status} -> ${cur.finalUrl}`);
  return cur.status === 'ok';
}

(async () => {
  const browser = await chromium.launch({ headless: !process.env.HEADED, slowMo: Number(process.env.SLOWMO || 0) });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(NAV_TIMEOUT);
  attachListeners(page);

  try {
    log('=== PUBLIC ROUTES ===');
    for (const [n, p] of PUBLIC_ROUTES) await visit(page, n, p);

    // harvest a product slug from catalog for product-detail test
    try {
      await page.goto(`${BASE}/catalog`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(1200);
      const href = await page.locator('a[href^="/product/"]').first().getAttribute('href').catch(() => null);
      if (href) await visit(page, 'product-detail', href);
      else log('no product link found on catalog (empty catalog?)');
    } catch (e) { log('product harvest failed: ' + e.message); }

    log('=== LOGIN ===');
    const ok = await login(page);
    if (!ok) { log('LOGIN FAILED — skipping admin routes'); }
    else {
      log('=== ADMIN ROUTES ===');
      for (const [n, p] of ADMIN_ROUTES) await visit(page, n, p);
    }
  } finally {
    fs.writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));

    // summary
    const bad = results.filter((r) => r.status !== 'ok' || r.slow || r.consoleErrors.length || r.httpErrors.length || r.pageErrors.length);
    console.log('\n================ SUMMARY ================');
    console.log(`total=${results.length}  clean=${results.length - bad.length}  flagged=${bad.length}`);
    console.log(`screenshots: ${SHOTS}`);
    console.log(`results json: ${OUT}/results.json`);
    if (bad.length) {
      console.log('\n--- FLAGGED ---');
      for (const r of bad) {
        console.log(`\n• ${r.name} (${r.path}) [${r.status}]${r.slow ? ' SLOW ' + r.ms + 'ms' : ''}`);
        if (r.finalUrl && r.finalUrl !== r.path) console.log(`    redirected -> ${r.finalUrl}`);
        if (r.note) console.log(`    note: ${r.note}`);
        r.httpErrors.slice(0, 6).forEach((e) => console.log(`    http: ${e}`));
        r.pageErrors.slice(0, 4).forEach((e) => console.log(`    pageerr: ${e}`));
        r.consoleErrors.slice(0, 4).forEach((e) => console.log(`    console: ${e}`));
      }
    } else {
      console.log('\nAll routes clean. 🎉');
    }
    console.log('========================================\n');
    await browser.close();
  }
})();
