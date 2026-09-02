/**
 * Autonomous E2E for the SmartCell Admin mobile app (Expo web target).
 *
 * Flow exercised:
 *   1. Load app -> login screen renders
 *   2. Dev-bypass sign-in (admin@gmail.com) -> variants list
 *   3. List renders N variant rows; search filters
 *   4. Open a variant -> detail renders
 *   5. Edit selling price -> Save -> "Saved" indicator
 *   6. Reload detail by id -> price persisted (in-app confirmation)
 *   7. Toggle visibility switch
 *   8. Back navigation to list
 *
 * Captures console errors, page errors, failed network calls, screenshots.
 * Emits JSON + a console summary. Exit code != 0 on any failed step.
 *
 * Run: node scripts/e2e-web.mjs   (uses Playwright from ../frontend/node_modules)
 */
import { chromium } from '/Users/haris/IdeaProjects/general-project-maker/projects/shop-app/frontend/node_modules/playwright/index.mjs';
import * as fs from 'fs';

const BASE = process.env.BASE || 'http://localhost:8081';
const OUT = '/tmp/mobile-e2e';
const SHOTS = `${OUT}/shots`;
fs.mkdirSync(SHOTS, { recursive: true });

const IGNORE = [/favicon/i, /Download the React DevTools/i, /Running application/i];

const results = [];
const consoleErrors = [];
const pageErrors = [];
const netFailures = [];

function step(name, ok, info = {}) {
  results.push({ name, ok, ...info });
  console.log(`${ok ? '✅' : '❌'} ${name}${info.detail ? ' — ' + info.detail : ''}`);
}

async function shot(page, name) {
  try {
    await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
  } catch {}
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 414, height: 896 } });
  const page = await ctx.newPage();

  page.on('console', (m) => {
    if (m.type() === 'error' && !IGNORE.some((r) => r.test(m.text()))) {
      consoleErrors.push(m.text());
    }
  });
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('response', (res) => {
    const url = res.url();
    if (res.status() >= 400 && (url.includes('54321') || url.includes('cloudinary'))) {
      netFailures.push(`${res.status()} ${res.request().method()} ${url}`);
    }
  });

  let capturedVariantId = null;
  let newPrice = null;

  try {
    // 1. Load
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('[data-testid="dev-bypass-button"]', { timeout: 60000 });
    await shot(page, '01-login');
    step('Login screen renders (dev bypass visible)', true);

    // 2. Dev bypass
    await page.click('[data-testid="dev-bypass-button"]');
    await page.waitForSelector('[data-testid="variants-list"]', { timeout: 30000 });
    await sleep(1500);
    await shot(page, '02-variants-list');
    step('Dev bypass sign-in -> variants list', true);

    // 3. Rows render
    const rowCount = await page.locator('[data-testid^="variant-row-"]').count();
    step('Variant rows render', rowCount > 0, { detail: `${rowCount} rows visible` });

    // 3b. Search filter
    await page.fill('[data-testid="search-input"]', 'Pixel');
    await sleep(1200);
    const searchCount = await page.locator('[data-testid^="variant-row-"]').count();
    await shot(page, '03-search');
    step('Search filters list', searchCount > 0, { detail: `${searchCount} rows for "Pixel"` });
    await page.fill('[data-testid="search-input"]', '');
    await sleep(800);

    // 4. Open a variant
    const firstRow = page.locator('[data-testid^="variant-row-"]').first();
    const testId = await firstRow.getAttribute('data-testid');
    capturedVariantId = testId.replace('variant-row-', '');
    await firstRow.click();
    await page.waitForSelector('[data-testid="variant-detail"]', { timeout: 20000 });
    await sleep(1000);
    await shot(page, '04-detail');
    step('Open variant detail', true, { detail: capturedVariantId });

    // 5. Edit price
    const priceInput = page.locator('[data-testid="price-input"]');
    const before = await priceInput.inputValue();
    newPrice = String((parseInt(before.replace(/[^0-9]/g, ''), 10) || 50000) + 1234);
    await priceInput.fill(newPrice);
    await page.click('[data-testid="save-price-button"]');
    await page.waitForSelector('[data-testid="price-saved"]', { timeout: 15000 });
    await shot(page, '05-price-saved');
    step('Edit + save selling price', true, { detail: `${before} -> ${newPrice}` });

    // 6. Reload detail by id to confirm persistence in-app
    await page.goto(`${BASE}/variants/${capturedVariantId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="price-input"]', { timeout: 20000 });
    await sleep(800);
    const reloaded = await page.locator('[data-testid="price-input"]').inputValue();
    const persisted = reloaded.replace(/[^0-9]/g, '') === newPrice;
    await shot(page, '06-reloaded');
    step('Price persisted after reload', persisted, { detail: `reloaded=${reloaded}` });

    // 7. Toggle visibility
    const sw = page.locator('[data-testid="active-switch"]');
    if (await sw.count()) {
      await sw.click();
      await sleep(1200);
      step('Toggle visibility switch', true);
      await sw.click(); // restore
      await sleep(800);
    } else {
      step('Toggle visibility switch', false, { detail: 'switch not found' });
    }

    // 8. Back navigation — exercise the real in-app stack: go to list, push a
    //    detail via tap, then go back. (The earlier deep-link goto replaced the
    //    stack, so we re-enter through the UI here.)
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid^="variant-row-"]', { timeout: 20000 });
    await sleep(600);
    await page.locator('[data-testid^="variant-row-"]').first().click();
    await page.waitForSelector('[data-testid="variant-detail"]', { timeout: 20000 });
    await sleep(600);
    await page.goBack();
    await sleep(1000);
    const backOk =
      (await page.locator('[data-testid="search-input"]').count()) > 0 &&
      (await page.locator('[data-testid^="variant-row-"]').count()) > 0;
    await shot(page, '07-back-to-list');
    step('Back navigation to list', backOk);
  } catch (e) {
    step('Run completed without exception', false, { detail: String(e) });
    await shot(page, 'error');
  } finally {
    step('No console errors', consoleErrors.length === 0, { detail: `${consoleErrors.length} errors` });
    step('No page errors', pageErrors.length === 0, { detail: `${pageErrors.length} errors` });
    step('No failed API calls', netFailures.length === 0, { detail: `${netFailures.length} failures` });

    const summary = {
      base: BASE,
      capturedVariantId,
      newPrice,
      results,
      consoleErrors,
      pageErrors,
      netFailures,
      passed: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
    };
    fs.writeFileSync(`${OUT}/result.json`, JSON.stringify(summary, null, 2));
    console.log('\n--- SUMMARY ---');
    console.log(`PASS ${summary.passed} / FAIL ${summary.failed}`);
    if (consoleErrors.length) console.log('Console errors:\n' + consoleErrors.slice(0, 10).join('\n'));
    if (pageErrors.length) console.log('Page errors:\n' + pageErrors.slice(0, 10).join('\n'));
    if (netFailures.length) console.log('Net failures:\n' + netFailures.slice(0, 10).join('\n'));
    console.log(`Screenshots: ${SHOTS}`);
    await browser.close();
    process.exit(summary.failed > 0 ? 1 : 0);
  }
}

main();
