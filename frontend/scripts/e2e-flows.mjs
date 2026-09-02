/**
 * Interactive flow tests (dedicated Playwright, headless).
 * Each flow is independent and reports PASS/FAIL with captured http/console errors.
 * Run: node scripts/e2e-flows.mjs [flowName]   (no arg = all)
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4200';
const SHOTS = '/Users/haris/IdeaProjects/general-project-maker/projects/shop-app/tmp/smoke/shots';
const only = process.argv[2];

const httpErr = [];
const consoleErr = [];
function trackPage(p) {
  p.on('console', (m) => { if (m.type() === 'error' && !/favicon|vite|DevTools|ERR_ABORTED/i.test(m.text())) consoleErr.push(m.text().slice(0, 200)); });
  p.on('response', (r) => { if (r.status() >= 400 && r.url().includes('54321') && !/contact_messages/.test(r.url())) httpErr.push(`${r.status()} ${r.request().method()} ${r.url().replace(/^https?:\/\/[^/]+/, '').slice(0, 110)}`); });
}
const log = (m) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`);
function resetErr() { httpErr.length = 0; consoleErr.length = 0; }
function errSummary() { return `http=[${httpErr.join(' ; ')}] console=[${consoleErr.join(' ; ')}]`; }

async function login(page) {
  await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[placeholder="admin@example.com"]').fill('admin@gmail.com');
  await page.locator('input[type="password"]').first().fill('password123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(/\/admin/, { timeout: 25000 });
}

const results = [];
async function flow(name, fn, page) {
  if (only && only !== name) return;
  resetErr();
  log(`▶ ${name}`);
  try {
    await fn(page);
    const failed = httpErr.length > 0;
    results.push({ name, pass: !failed, detail: failed ? errSummary() : 'ok' });
    log(`${failed ? '✗ FAIL' : '✓ PASS'} ${name}  ${failed ? errSummary() : ''}`);
  } catch (e) {
    results.push({ name, pass: false, detail: `${e.message} | ${errSummary()}` });
    log(`✗ FAIL ${name}: ${e.message}  ${errSummary()}`);
    await page.screenshot({ path: `${SHOTS}/flow-fail-${name}.png`, fullPage: true }).catch(() => {});
  }
}

// ---------------- FLOWS ----------------

async function addLocation(page) {
  await page.goto(`${BASE}/admin/locations`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  const code = 'E2EBR' + Math.floor(Math.random() * 9000 + 1000);
  await page.getByRole('button', { name: 'Add Location' }).click();
  await page.locator('#code').waitFor({ state: 'visible', timeout: 8000 });
  await page.locator('#code').fill(code);
  await page.locator('#name').fill('E2E Test Branch');
  await page.locator('#address').fill('123 Test Road');
  await page.locator('#phone').fill('03001234567');
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  // wait for dialog to close + row to appear
  await page.waitForTimeout(1500);
  const row = page.locator('td', { hasText: code });
  await row.first().waitFor({ state: 'visible', timeout: 8000 });
  log(`  created location ${code}; verifying it persisted via reload`);
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('td', { hasText: code }).first().waitFor({ state: 'visible', timeout: 8000 });

  // cleanup: delete the test branch (tests delete flow too)
  const tr = page.locator('tr', { hasText: code }).first();
  await tr.getByRole('button').last().click(); // trash is last action button on non-primary rows
  // confirm dialog
  const confirm = page.getByRole('button', { name: /Yes|Delete|Confirm/i });
  if (await confirm.count()) { await confirm.first().click(); }
  await page.waitForTimeout(1200);
  log('  deleted test location (cleanup)');
  await page.screenshot({ path: `${SHOTS}/flow-addlocation.png`, fullPage: true }).catch(() => {});
}

async function addCustomer(page) {
  await page.goto(`${BASE}/admin/customers`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.getByRole('button', { name: 'Add Customer' }).first().click();
  const dlg = page.locator('.p-dialog');
  await dlg.waitFor({ state: 'visible', timeout: 8000 });
  const name = 'E2E Cust ' + Math.floor(Math.random() * 99999);
  const phone = '0300' + Math.floor(Math.random() * 9000000 + 1000000);
  await dlg.locator('input').nth(0).fill(phone); // float-label fields → target by order
  await dlg.locator('input').nth(1).fill(name);
  // wait until Create enabled (form valid)
  await page.waitForFunction(() => {
    const b = [...document.querySelectorAll('.p-dialog button')].find((x) => /Create/.test(x.textContent || ''));
    return b && !b.disabled;
  }, { timeout: 5000 });
  await dlg.locator('button', { hasText: 'Create' }).first().click();
  await page.waitForTimeout(1500);
  // verify via search
  const search = page.locator('input[placeholder*="Search"]').first();
  await search.fill(name);
  await page.waitForTimeout(1200);
  const row = page.locator('tr', { hasText: name }).first();
  await row.waitFor({ state: 'visible', timeout: 6000 });
  log(`  created customer "${name}"`);
  // cleanup: delete it (last action button = trash), confirm
  await row.locator('button').last().click();
  const confirm = page.getByRole('button', { name: /Yes|Delete|Confirm/i });
  if (await confirm.count()) await confirm.first().click();
  await page.waitForTimeout(1000);
  log('  deleted customer (cleanup)');
  await page.screenshot({ path: `${SHOTS}/flow-addcustomer.png`, fullPage: true }).catch(() => {});
}

async function createSaleOpen(page) {
  // Just open the POS/sale-create screen and confirm it renders product picker without errors.
  await page.goto(`${BASE}/admin/sales/new`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SHOTS}/flow-sale-new.png`, fullPage: true }).catch(() => {});
  const body = await page.locator('body').innerText().catch(() => '');
  if (/Something went wrong|cannot read|undefined is not/i.test(body)) throw new Error('sale-create page shows error');
}

async function completeSale(page) {
  await page.goto(`${BASE}/admin/sales/new`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
  // search a product
  const search = page.locator('input[placeholder*="Search by product"]');
  await search.waitFor({ state: 'visible', timeout: 8000 });
  await search.fill('Pixel');
  // wait for results dropdown
  const result = page.locator('div.cursor-pointer', { hasText: /Pixel/i }).first();
  await result.waitFor({ state: 'visible', timeout: 10000 });
  const productText = (await result.innerText()).replace(/\s+/g, ' ').slice(0, 60);
  await result.click();
  // an "Enter IMEI Number" dialog appears per unit — Skip (two-step: Skip → Confirm Skip)
  const skipBtn = page.locator('button', { hasText: 'Skip' });
  await skipBtn.first().waitFor({ state: 'visible', timeout: 6000 }).catch(() => {});
  if (await skipBtn.count()) {
    await skipBtn.first().click(); // turns into "Confirm Skip"
    const confirmSkip = page.locator('button', { hasText: 'Confirm Skip' });
    await confirmSkip.first().waitFor({ state: 'visible', timeout: 4000 }).catch(() => {});
    if (await confirmSkip.count()) await confirmSkip.first().click();
    log('  skipped IMEI dialog');
  }
  log(`  added to cart: ${productText}`);
  // wait for cart + payment to settle: "All items available" and Complete Sale enabled
  await page.waitForFunction(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /^\s*Complete Sale\s*$/.test(x.textContent || ''));
    return b && !b.disabled;
  }, { timeout: 12000 });
  // grab grand total for the log
  const total = await page.locator('text=Grand Total').locator('xpath=following::*[1]').innerText().catch(() => '?');
  log(`  grand total: ${total}`);
  // click page Complete Sale
  await page.locator('button', { hasText: 'Complete Sale' }).first().click();
  // accept confirm dialog (accept button also reads "Complete Sale" → last match)
  await page.waitForTimeout(700);
  await page.locator('button', { hasText: 'Complete Sale' }).last().click();
  // wait for outcome toast
  await page.waitForTimeout(3500);
  const body = (await page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ');
  await page.screenshot({ path: `${SHOTS}/flow-complete-sale.png`, fullPage: true }).catch(() => {});
  if (/Sale Failed|Failed to complete/i.test(body)) throw new Error('sale failed toast: ' + body.match(/Sale Failed[^.]*\.?/i)?.[0]);
  // success surfaces as a Sales Receipt dialog (Receipt - NNNN / PAYMENT COMPLETED)
  if (/Sale Completed|Successfully sold|PAYMENT COMPLETED|Sales Receipt|Receipt -/i.test(body)) {
    const rcpt = body.match(/Receipt - \S+/i)?.[0] || 'receipt shown';
    log(`  ✓ sale completed — ${rcpt}`);
  } else {
    throw new Error('no success receipt/toast detected; url=' + page.url());
  }
}

async function refundSale(page) {
  await page.goto(`${BASE}/admin/receipts`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(1800); // per-row refund-status badges resolve
  // Full Refund action = pi-refresh icon button inside a table row (not already refunded)
  const refundBtn = page.locator('tbody tr button:has(span.pi-refresh)').first();
  await refundBtn.waitFor({ state: 'visible', timeout: 10000 });
  await refundBtn.click();
  // process-refund-dialog
  const reason = page.locator('textarea[placeholder*="reason for refund"], input[placeholder*="reason for refund"]');
  await reason.first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
  if (await reason.count()) await reason.first().fill('E2E test refund');
  await page.locator('button', { hasText: 'Process Full Refund' }).first().click();
  await page.waitForTimeout(2800);
  const body = (await page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ');
  await page.screenshot({ path: `${SHOTS}/flow-refund.png`, fullPage: true }).catch(() => {});
  if (/Cannot Process Refund/i.test(body)) throw new Error('dialog: Cannot Process Refund');
  if (!/Refund Processed Successfully/i.test(body)) throw new Error('no refund success message; url=' + page.url());
  log('  ✓ refund processed successfully');
}

(async () => {
  const browser = await chromium.launch({ headless: !process.env.HEADED, slowMo: Number(process.env.SLOWMO || 0) });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  page.setDefaultTimeout(20000);
  trackPage(page);
  await login(page);

  await flow('add-location', addLocation, page);
  await flow('add-customer', addCustomer, page);
  await flow('create-sale-open', createSaleOpen, page);
  await flow('complete-sale', completeSale, page);
  await flow('refund-sale', refundSale, page);

  console.log('\n========= FLOW RESULTS =========');
  for (const r of results) console.log(`${r.pass ? '✓' : '✗'} ${r.name.padEnd(20)} ${r.pass ? '' : r.detail}`);
  console.log('================================');
  await browser.close();
  process.exit(results.some((r) => !r.pass) ? 1 : 0);
})();
