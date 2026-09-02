/**
 * Playwright E2E for the IN consignment direction (Expo web) + DB verification.
 *   POS1  Take a device IN -> SELL -> device sold, sale booked (margin), we owe the partner
 *   POS2  Take a device IN -> RETURN -> device 'returned' (out of our stock)
 *   NEG1  Take-IN with no partner -> client error
 *   NEG2  a SOLD IN shows no further actions
 *   NET   partner balance nets the new payable
 * Cleans up all test rows (products/variants/models/device_outs/sales).
 */
import { chromium } from '/Users/haris/IdeaProjects/general-project-maker/projects/shop-app/frontend/node_modules/playwright/index.mjs';
import { execSync } from 'node:child_process';

const BASE = process.env.BASE || 'http://localhost:8081';
const PSQL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const db = (q) => execSync(`psql "${PSQL}" -tAc "${q.replace(/"/g, '\\"')}"`).toString().trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SELLM = 'ZZ IN Sell Phone', RETM = 'ZZ IN Return Phone';
const results = [];
const check = (n, ok, d = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} | ${n}${d ? ' — ' + d : ''}`); };

function cleanup() {
  for (const m of [SELLM, RETM]) {
    db(`delete from sales where product_id in (select p.id from products p join models mo on mo.id=p.model_id where mo.name='${m}')`);
    db(`delete from device_outs where product_id in (select p.id from products p join models mo on mo.id=p.model_id where mo.name='${m}')`);
    db(`delete from products where model_id in (select id from models where name='${m}')`);
    db(`delete from variants where model_id in (select id from models where name='${m}')`);
    db(`delete from models where name='${m}'`);
  }
}

async function main() {
  cleanup();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newContext({ viewport: { width: 420, height: 900 } }).then((c) => c.newPage());
  page.on('dialog', (d) => d.accept());
  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('[data-testid="dev-bypass-button"]', { timeout: 60000 });
    await page.click('[data-testid="dev-bypass-button"]');
    await page.waitForSelector('[data-testid="nav-outs-button"]', { timeout: 30000 });
    await page.click('[data-testid="nav-outs-button"]');
    await page.waitForSelector('[data-testid="dir-in"]', { timeout: 20000 });
    await page.click('[data-testid="dir-in"]');
    await sleep(500);
    check('Switch to IN tab', true);

    // ---- POS1: Take IN -> Sell ----
    await page.click('[data-testid="create-in-fab"]');
    await page.waitForSelector('[data-testid="create-in"]', { timeout: 15000 });

    // NEG1: submit with nothing selected
    await page.click('[data-testid="create-in-submit"]');
    await sleep(400);
    check('NEG1 take-IN with no partner -> error',
      (await page.locator('[data-testid="create-in-error"]').count()) > 0);

    await page.locator('[data-testid^="in-partner-"]').first().click();
    await page.locator('[data-testid^="in-brand-"]').first().click();
    await page.fill('[data-testid="in-model-input"]', SELLM);
    await page.fill('[data-testid="in-storage-input"]', '256');
    await page.fill('[data-testid="in-price-input"]', '100000');
    await page.fill('[data-testid="in-sell-input"]', '120000');
    await page.click('[data-testid="create-in-submit"]');
    await page.waitForSelector('[data-testid="in-detail"]', { timeout: 15000 });
    check('POS1 Take IN -> detail', true);
    const inRow = db(`select d.direction||'|'||d.status from device_outs d join products p on p.id=d.product_id join models m on m.id=p.model_id where m.name='${SELLM}' limit 1`);
    const prodFlag = db(`select status||'|'||(consignment_partner_id is not null) from products p join models m on m.id=p.model_id where m.name='${SELLM}' limit 1`);
    check('IN row created (direction=in, in_stock)', inRow === 'in|in_stock', inRow);
    check('Product sellable + flagged consignment', prodFlag === 'available|true', prodFlag);

    await page.click('[data-testid="in-sell-toggle"]');
    await page.waitForSelector('[data-testid="in-sell-submit"]', { timeout: 10000 });
    await page.fill('[data-testid="in-sell-price"]', '120000');
    await page.click('[data-testid="in-sell-method-cash"]');
    await page.click('[data-testid="in-sell-submit"]');
    await page.waitForSelector('[data-testid="in-done"]', { timeout: 15000 });
    const sold = db(`select status from products p join models m on m.id=p.model_id where m.name='${SELLM}' limit 1`);
    const sale = db(`select s.sale_price||'|'||s.cost_price||'|'||(s.sale_price-s.cost_price) from sales s join products p on p.id=s.product_id join models m on m.id=p.model_id where m.name='${SELLM}' limit 1`);
    const rowSold = db(`select d.status from device_outs d join products p on p.id=d.product_id join models m on m.id=p.model_id where m.name='${SELLM}' limit 1`);
    check('POS1 sell -> product sold', sold === 'sold', sold);
    check('POS1 sell -> sale booked, margin = price - IN price', sale === '120000|100000|20000', sale);
    check('POS1 IN row -> sold (via trigger)', rowSold === 'sold', rowSold);
    check('NEG2 sold IN has no sell action', (await page.locator('[data-testid="in-sell-toggle"]').count()) === 0);

    // NET: the partner now has a payable; net should drop by 100000 vs before
    const partnerId = db(`select d.to_partner_id from device_outs d join products p on p.id=d.product_id join models m on m.id=p.model_id where m.name='${SELLM}' limit 1`);
    const payable = db(`select coalesce(sum(out_price-amount_paid_to_partner),0) from device_outs where to_partner_id='${partnerId}' and direction='in' and status='sold'`);
    check('NET partner payable reflects the IN sale', Number(payable) >= 100000, `payable=${payable}`);

    // ---- POS2: Take IN -> Return ----
    await page.goto(BASE + '/in/new', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="create-in"]', { timeout: 15000 });
    await page.locator('[data-testid^="in-partner-"]').first().click();
    await page.locator('[data-testid^="in-brand-"]').first().click();
    await page.fill('[data-testid="in-model-input"]', RETM);
    await page.fill('[data-testid="in-price-input"]', '50000');
    await page.click('[data-testid="create-in-submit"]');
    await page.waitForSelector('[data-testid="in-detail"]', { timeout: 15000 });
    await page.click('[data-testid="in-return-btn"]');
    await page.waitForSelector('[data-testid="in-done"]', { timeout: 15000 });
    const ret = db(`select p.status||'|'||d.status from products p join device_outs d on d.product_id=p.id join models m on m.id=p.model_id where m.name='${RETM}' limit 1`);
    check('POS2 return -> product returned, row returned', ret === 'returned|returned', ret);
  } catch (e) {
    check('run completed without exception', false, String(e).slice(0, 200));
    await page.screenshot({ path: '/tmp/in-e2e-error.png' }).catch(() => {});
  } finally {
    cleanup();
    const pass = results.filter(Boolean).length, fail = results.filter((r) => !r).length;
    console.log(`\n=== IN E2E: PASS ${pass} / FAIL ${fail} ===`);
    await browser.close();
    process.exit(fail ? 1 : 0);
  }
}
main();
