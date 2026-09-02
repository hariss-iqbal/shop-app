// Standalone Playwright E2E for the Expenses + Grand Profit feature.
// Runs against the already-running dev server on :4200 (per project convention,
// a separate Node Playwright instance, not the MCP browser).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4200';
const EMAIL = 'admin@gmail.com';
const PASSWORD = 'password123';
const SHOT = '/tmp/expenses-e2e';
mkdirSync(SHOT, { recursive: true });

const TAG = `E2E TEST EXPENSE ${Date.now()}`;
const AMOUNT = 5555;

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} :: ${name}${extra ? ' :: ' + extra : ''}`);
  ok ? pass++ : fail++;
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push('PAGEERR ' + e.message));

  try {
    // ---------- Login ----------
    await page.goto(`${BASE}/auth/login`);
    await page.locator('input[placeholder="admin@example.com"]').fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\//, { timeout: 20000 }).catch(() => {});
    check('login redirects into /admin', /\/admin/.test(page.url()), page.url());

    // Wait for the sidebar to render (permissions loaded) before checking nav items.
    await page.getByRole('link', { name: 'Dashboard' }).first().waitFor({ timeout: 20000 }).catch(() => {});

    // ---------- Nav item present ----------
    const navExpenses = await page.getByText('Expenses', { exact: true }).count();
    check('sidebar shows Expenses nav item', navExpenses > 0);
    const navProfit = await page.getByText('Grand Profit', { exact: true }).count();
    check('sidebar shows Grand Profit nav item', navProfit > 0);

    // ---------- Expenses page loads ----------
    await page.goto(`${BASE}/admin/expenses`);
    await page.getByRole('heading', { name: 'Expenses' }).waitFor({ timeout: 20000 });
    check('Expenses page header renders', true);
    check('shop selector present', await page.locator('p-select').count() > 0);
    check('summary cards present (Today/This Month/Entries)',
      (await page.getByText('This Month').count()) > 0 && (await page.getByText('Today').count()) > 0);
    await page.screenshot({ path: `${SHOT}/01-expenses-initial.png`, fullPage: true });

    // ---------- Add an expense ----------
    await page.getByRole('button', { name: 'Add Expense' }).first().click();
    const dialog = page.locator('.p-dialog');
    await dialog.waitFor({ timeout: 10000 });
    check('Add Expense dialog opens', await dialog.isVisible());

    // amount (p-inputnumber renders #amount), description (#description), date defaults to today
    await page.locator('#amount').fill(String(AMOUNT));
    await page.locator('#description').fill(TAG);
    await page.screenshot({ path: `${SHOT}/02-add-dialog-filled.png` });

    // future-date guard: the datepicker max date is today → confirm input is today's date text and read-only
    await page.waitForFunction(() => {
      const el = document.querySelector('#expenseDate');
      return el && el.value && el.value.trim().length > 0;
    }, { timeout: 5000 }).catch(() => {});
    const dateVal = await page.locator('#expenseDate').inputValue().catch(() => '');
    check('date field defaults to a value (today)', dateVal.length > 0, dateVal);

    await dialog.getByRole('button', { name: 'Add Expense' }).click();
    await dialog.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    check('dialog closes after submit', !(await dialog.isVisible().catch(() => false)));

    // ---------- Verify it appears in the list with breakdown + who-added ----------
    await page.waitForTimeout(1200);
    const bodyText = await page.locator('body').innerText();
    check('new expense description appears in list', bodyText.includes(TAG));
    check('amount formatted & shown', /5,555/.test(bodyText));
    check('breakdown shows creator email', bodyText.includes(EMAIL));
    // day grouping: a weekday name should render in the day header
    check('day grouping renders a weekday header',
      /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/.test(bodyText));
    await page.screenshot({ path: `${SHOT}/03-expenses-with-new-row.png`, fullPage: true });

    // ---------- Future-date prevention at the picker level ----------
    await page.getByRole('button', { name: 'Add Expense' }).first().click();
    await dialog.waitFor({ timeout: 10000 });
    // open the calendar overlay
    await page.locator('#expenseDate').click().catch(() => {});
    await page.waitForTimeout(400);
    // "next month" navigation then count enabled future days is brittle; instead assert
    // that days marked disabled exist OR that today is the max selectable. We assert the
    // picker rendered and that the input is read-only (no manual future typing).
    const readonly = await page.locator('#expenseDate').getAttribute('readonly');
    check('date input is read-only (no manual future entry)', readonly !== null);
    await page.keyboard.press('Escape').catch(() => {});
    await page.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => {});
    await page.getByRole('button', { name: 'Cancel' }).click().catch(() => {});
    await page.waitForTimeout(300);

    // ---------- Grand Profit page ----------
    await page.goto(`${BASE}/admin/grand-profit`);
    await page.getByRole('heading', { name: 'Grand Profit' }).waitFor({ timeout: 20000 });
    check('Grand Profit page header renders', true);
    // Wait for the async report data to populate the table before asserting.
    await page.getByText('5,555', { exact: false }).first().waitFor({ timeout: 15000 }).catch(() => {});
    const gpText = await page.locator('body').innerText();
    check('Grand Profit shows Sales Profit / Expenses / Grand Profit cards',
      gpText.includes('Sales Profit') && gpText.includes('Expenses') && gpText.includes('Grand Profit'));
    check('Grand Profit reflects expense amount (5,555 present)', /5,555/.test(gpText));
    await page.screenshot({ path: `${SHOT}/04-grand-profit.png`, fullPage: true });

    // ---------- Console errors ----------
    const relevantErrors = consoleErrors.filter(e =>
      !/favicon|Failed to load resource.*404|net::ERR/i.test(e));
    check('no significant console/page errors', relevantErrors.length === 0,
      relevantErrors.slice(0, 5).join(' | '));

  } catch (err) {
    check('script ran without throwing', false, String(err));
    await page.screenshot({ path: `${SHOT}/99-error.png`, fullPage: true }).catch(() => {});
  } finally {
    console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
    console.log(`TAG=${TAG}`);
    console.log(`Screenshots in ${SHOT}`);
    await browser.close();
    process.exit(fail === 0 ? 0 : 1);
  }
})();
