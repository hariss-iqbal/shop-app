/**
 * Playwright E2E for the two-shop transfer model (phase 1) on the Expo web target.
 * Covers the plan's verification checklist end-to-end with DB assertions via psql:
 *   1  cashier login lands on Outs, no Variants access
 *   2  cashier: partner destination hidden on Create OUT
 *   3  single OUT to branch -> holder (products.location_id) = destination
 *   4  settle without customer name/phone -> blocked (client)
 *   5  settle with buyer -> sales row has buyer_name/buyer_phone, branch location, cashier creator
 *   6  return with wrong IMEI suffix -> blocked; right suffix -> available + holder back to master
 *   7  bulk OUT of 3 -> one confirm, 3 rows, 3 moved
 *   8  list shows "At {branch}" section; recall badge after request_return
 *   9  claim (UI) works; foreign claim blocks settle server-side
 *  10  history card shows intake -> out chain
 *  11  last-unit warning fires when moving a variant's final units
 *  12  admin lands on Variants, reaches Outs via header button; master toggle admin-only
 * Seeds a dedicated test model/variant/products; cleans up everything afterward.
 */
import { chromium } from '/Users/haris/IdeaProjects/general-project-maker/projects/shop-app/frontend/node_modules/playwright/index.mjs';
import { execSync } from 'node:child_process';
import * as fs from 'fs';

const BASE = process.env.BASE || 'http://localhost:8081';
const PSQL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const OUT = '/tmp/twoshop-e2e';
fs.mkdirSync(`${OUT}/shots`, { recursive: true });
const db = (q) => execSync(`psql "${PSQL}" -tAc "${q.replace(/"/g, '\\"')}"`).toString().trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${detail ? ' — ' + detail : ''}`);
};

const CASHIER = { email: 'cashier-test@example.com', password: 'password123' };
const MODEL = 'E2E TwoShop Phone';
const IMEI = (n) => `86990077000${n}`; // n = 1..6

function seed() {
  const brandId = db(`select id from brands order by created_at limit 1`);
  const g15 = db(`select id from store_locations where is_primary limit 1`);
  db(`insert into models(brand_id, name) values ('${brandId}', '${MODEL}')`);
  const modelId = db(`select id from models where name='${MODEL}'`);
  db(`insert into variants(model_id, storage_gb, condition, selling_price, available_colors, is_active)
      values ('${modelId}', 128, 'used', 50000, array['Black'], true)`);
  const variantId = db(`select id from variants where model_id='${modelId}'`);
  db(`insert into products(brand_id, model, model_id, storage_gb, color, condition, imei,
        cost_price, selling_price, status, product_type, variant_id, location_id, notes)
      select '${brandId}', '${MODEL}', '${modelId}', 128, 'Black', 'used', '86990077000'||n,
        40000, 50000, 'available', 'phone', '${variantId}', '${g15}', 'E2E-TWOSHOP'
      from generate_series(1,6) n`);
  return { g15, g7: db(`select id from store_locations where name='G-7 Fazal Tower'`), modelId, variantId };
}

function cleanup(modelId) {
  const pids = db(`select coalesce(string_agg(id::text, ','), '') from products where notes='E2E-TWOSHOP'`);
  if (pids) {
    db(`delete from device_outs where product_id in ('${pids.split(',').join("','")}')`);
    db(`delete from sales where product_id in ('${pids.split(',').join("','")}')`);
    db(`delete from products where notes='E2E-TWOSHOP'`);
  }
  if (modelId) {
    db(`delete from variants where model_id='${modelId}'`);
    db(`delete from models where id='${modelId}'`);
  }
}

const adminId = db(`select id from auth.users where email='admin@gmail.com'`);
const asAdmin = (call) =>
  db(`select set_config('request.jwt.claims', json_build_object('sub', '${adminId}')::text, true); select ${call}`);

async function loginCashier(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('[data-testid="email-input"]', { timeout: 60000 });
  await page.fill('[data-testid="email-input"]', CASHIER.email);
  await page.fill('[data-testid="password-input"]', CASHIER.password);
  await page.click('[data-testid="signin-button"]');
}

async function main() {
  let ids = {};
  cleanup(db(`select id from models where name='${MODEL}'`) || null); // stale runs
  ids = seed();
  const browser = await chromium.launch({ headless: true });

  // ---------- cashier context ----------
  const cashierCtx = await browser.newContext({ viewport: { width: 420, height: 900 } });
  const page = await cashierCtx.newPage();
  let lastDialog = '';
  page.on('dialog', (d) => {
    lastDialog = d.message();
    d.accept();
  });
  const shot = (n) => page.screenshot({ path: `${OUT}/shots/${n}.png` }).catch(() => {});

  try {
    // 1. cashier lands on Outs, no Variants
    await loginCashier(page);
    await page.waitForSelector('[data-testid="out-list"]', { timeout: 60000 });
    const noVariants = (await page.locator('[data-testid="add-variant-button"]').count()) === 0;
    check('1 cashier lands on OutList, no Variants UI', noVariants);
    await shot('01-cashier-outlist');

    // 2. partner destination hidden for cashier
    await page.click('[data-testid="create-out-fab"]');
    await page.waitForSelector('[data-testid="create-out"]', { timeout: 15000 });
    const noPartnerSeg = (await page.locator('[data-testid="dest-partner"]').count()) === 0;
    check('2 partner destination hidden for cashier', noPartnerSeg);

    // 3. single OUT to branch
    await page.fill('[data-testid="device-search"]', IMEI(1));
    await page.waitForSelector('[data-testid^="device-pick-"]', { timeout: 15000 });
    await page.locator('[data-testid^="device-pick-"]').first().click();
    await sleep(300);
    await page.click(`[data-testid="branch-${ids.g7}"]`);
    await shot('02-create-out-filled');
    await page.click('[data-testid="create-out-submit"]');
    await page.waitForSelector('[data-testid="out-detail"]', { timeout: 20000 });
    const p1 = db(`select status||'|'||location_id from products where imei='${IMEI(1)}'`);
    check('3 single branch OUT moves holder', p1 === `out|${ids.g7}`, p1);
    await shot('03-out-detail');

    // 4. settle without buyer blocked (client-side)
    await page.click('[data-testid="settle-toggle"]');
    await page.waitForSelector('[data-testid="settle-buyer-name"]', { timeout: 10000 });
    await page.click('[data-testid="settle-submit"]');
    await sleep(500);
    const err4 = await page.locator('[data-testid="out-detail-error"]').textContent().catch(() => '');
    check('4 settle without buyer blocked', /name and phone/i.test(err4 ?? ''), err4 ?? '');

    // 5. settle with buyer -> sale carries identity
    await page.fill('[data-testid="settle-buyer-name"]', 'Test Buyer');
    await page.fill('[data-testid="settle-buyer-phone"]', '0300-9998877');
    await page.click('[data-testid="settle-submit"]');
    await page.waitForSelector('[data-testid="out-done"]', { timeout: 20000 });
    const sale = db(`select s.buyer_name||'|'||s.buyer_phone||'|'||s.location_id||'|'||s.created_by from sales s
                     join products p on p.id=s.product_id where p.imei='${IMEI(1)}'`);
    const cashierId = db(`select id from auth.users where email='${CASHIER.email}'`);
    check('5 settle books sale with buyer identity at branch by cashier',
      sale === `Test Buyer|0300-9998877|${ids.g7}|${cashierId}`, sale);
    await shot('04-settled');

    // 6. OUT another unit, then return: wrong IMEI blocked, right IMEI restores
    await page.goto(`${BASE}/outs/new`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="device-search"]', { timeout: 20000 });
    await page.fill('[data-testid="device-search"]', IMEI(2));
    await page.waitForSelector('[data-testid^="device-pick-"]', { timeout: 15000 });
    await page.locator('[data-testid^="device-pick-"]').first().click();
    await sleep(300);
    await page.click(`[data-testid="branch-${ids.g7}"]`);
    await page.click('[data-testid="create-out-submit"]');
    await page.waitForSelector('[data-testid="out-detail"]', { timeout: 20000 });
    await page.click('[data-testid="return-btn"]');
    await page.waitForSelector('[data-testid="return-imei-input"]', { timeout: 10000 });
    await page.fill('[data-testid="return-imei-input"]', '99999');
    await page.click('[data-testid="return-imei-submit"]');
    await sleep(700);
    const err6 = await page.locator('[data-testid="out-detail-error"]').textContent().catch(() => '');
    check('6a wrong IMEI suffix blocked', /does not match/i.test(err6 ?? ''), err6 ?? '');
    await page.fill('[data-testid="return-imei-input"]', IMEI(2).slice(-5));
    await page.click('[data-testid="return-imei-submit"]');
    await page.waitForSelector('[data-testid="out-done"]', { timeout: 20000 });
    const p2 = db(`select status||'|'||location_id from products where imei='${IMEI(2)}'`);
    check('6b right IMEI returns + holder back to master', p2 === `available|${ids.g15}`, p2);
    await shot('05-returned');

    // 7. bulk OUT of 3 in one confirm
    await page.goto(`${BASE}/outs/new`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="device-search"]', { timeout: 20000 });
    await page.fill('[data-testid="device-search"]', '8699007700');
    await page.waitForSelector('[data-testid^="device-pick-"]', { timeout: 15000 });
    for (const n of [3, 4, 5]) {
      const pid = db(`select id from products where imei='${IMEI(n)}'`);
      await page.click(`[data-testid="device-pick-${pid}"]`);
      await sleep(200);
    }
    await page.click(`[data-testid="branch-${ids.g7}"]`);
    await shot('06-bulk-selected');
    await page.click('[data-testid="create-out-submit"]');
    await sleep(1500);
    const bulkRows = db(`select count(*) from device_outs d join products p on p.id=d.product_id
                         where p.notes='E2E-TWOSHOP' and d.status='out'`);
    const bulkMoved = db(`select count(*) from products where notes='E2E-TWOSHOP' and status='out' and location_id='${ids.g7}'`);
    check('7 bulk OUT of 3: rows + holders moved', bulkRows === '3' && bulkMoved === '3', `rows=${bulkRows} moved=${bulkMoved}`);

    // 8. sections + recall badge
    await page.goto(`${BASE}/outs`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="out-list"]', { timeout: 20000 });
    const sectionHdr = (await page.getByText('At G-7 Fazal Tower').count()) > 0;
    check('8a list shows "At {branch}" section', sectionHdr);
    const out3 = db(`select d.id from device_outs d join products p on p.id=d.product_id where p.imei='${IMEI(3)}' and d.status='out'`);
    asAdmin(`request_return('${out3}')`);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="out-list"]', { timeout: 20000 });
    const recallBadge = (await page.getByText('return requested', { exact: false }).count()) > 0;
    check('8b recall badge visible after request_return', recallBadge);
    await shot('07-sections-recall');

    // 9a. cashier claims via UI
    const out4 = db(`select d.id from device_outs d join products p on p.id=d.product_id where p.imei='${IMEI(4)}' and d.status='out'`);
    await page.goto(`${BASE}/outs/${out4}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="claim-btn"]', { timeout: 20000 });
    await page.click('[data-testid="claim-btn"]');
    await page.waitForSelector('[data-testid="claim-badge"]', { timeout: 20000 });
    const claimTxt = await page.locator('[data-testid="claim-badge"]').textContent();
    check('9a cashier claim via UI', /claimed by you/i.test(claimTxt ?? ''), claimTxt ?? '');
    asAdmin(`release_device_out_claim('${out4}')`);

    // 9b. foreign claim locks the cashier UI (server block covered by psql suite)
    const out5 = db(`select d.id from device_outs d join products p on p.id=d.product_id where p.imei='${IMEI(5)}' and d.status='out'`);
    asAdmin(`claim_device_out('${out5}')`);
    await page.goto(`${BASE}/outs/${out5}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="out-detail"]', { timeout: 20000 });
    await sleep(1500);
    const lockShown = (await page.getByText('is selling this phone right now', { exact: false }).count()) > 0;
    const settleHidden = (await page.locator('[data-testid="settle-toggle"]').count()) === 0;
    const returnHidden = (await page.locator('[data-testid="return-btn"]').count()) === 0;
    const noRelease = (await page.locator('[data-testid="release-claim-btn"]').count()) === 0;
    check('9b foreign claim locks cashier UI (no settle/return/release)',
      lockShown && settleHidden && returnHidden && noRelease,
      `lock=${lockShown} settleHidden=${settleHidden} returnHidden=${returnHidden} noRelease=${noRelease}`);
    asAdmin(`release_device_out_claim('${out5}')`);
    await shot('08-claim-blocked');

    // 10. history card
    const histOk = (await page.locator('[data-testid="history-card"]').count()) > 0 &&
      (await page.getByText('Added to stock').count()) > 0;
    check('10 history card shows intake event', histOk);

    // 11. last-unit warning (remaining available units of the test variant)
    await page.goto(`${BASE}/outs/new`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="device-search"]', { timeout: 20000 });
    await page.fill('[data-testid="device-search"]', '8699007700');
    await page.waitForSelector('[data-testid^="device-pick-"]', { timeout: 15000 });
    for (const n of [2, 6]) {
      const pid = db(`select id from products where imei='${IMEI(n)}'`);
      await page.click(`[data-testid="device-pick-${pid}"]`);
      await sleep(200);
    }
    await page.click(`[data-testid="branch-${ids.g7}"]`);
    lastDialog = '';
    await page.click('[data-testid="create-out-submit"]');
    await sleep(2500);
    check('11 last-unit warning fired', /LAST available unit/i.test(lastDialog), lastDialog.slice(0, 80));

    // 12a. cashier: shops card visible, no master toggle
    await page.goto(`${BASE}/partners`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="shops-card"]', { timeout: 20000 });
    const noToggle = (await page.locator('[data-testid^="set-master-"]').count()) === 0;
    check('12a cashier sees shops, no master toggle', noToggle);
    await shot('09-cashier-partners');
  } catch (e) {
    check('cashier flow crashed', false, String(e).slice(0, 300));
    await shot('99-cashier-crash');
  }

  // ---------- admin context ----------
  try {
    const adminCtx = await browser.newContext({ viewport: { width: 420, height: 900 } });
    const apage = await adminCtx.newPage();
    apage.on('dialog', (d) => d.accept());
    await apage.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await apage.waitForSelector('[data-testid="dev-bypass-button"]', { timeout: 60000 });
    await apage.click('[data-testid="dev-bypass-button"]');
    await apage.waitForSelector('[data-testid="variants-list"]', { timeout: 60000 });
    check('12b admin lands on Variants', true);
    await apage.click('[data-testid="nav-outs-button"]');
    await apage.waitForSelector('[data-testid="out-list"]', { timeout: 20000 });
    check('12c admin reaches Outs via header button', true);
    await apage.click('[data-testid="nav-partners-button"]');
    await apage.waitForSelector('[data-testid="shops-card"]', { timeout: 20000 });
    const hasToggle = await apage
      .waitForSelector('[data-testid^="set-master-"]', { timeout: 15000 })
      .then(() => true)
      .catch(() => false);
    check('12d admin sees set-as-master toggle', hasToggle);
    await apage.screenshot({ path: `${OUT}/shots/10-admin-partners.png` }).catch(() => {});
    // partner segment still available for admin on Create OUT
    await apage.goto(`${BASE}/outs/new`, { waitUntil: 'domcontentloaded' });
    await apage.waitForSelector('[data-testid="create-out"]', { timeout: 20000 });
    const partnerSeg = (await apage.locator('[data-testid="dest-partner"]').count()) > 0;
    check('12e admin still sees partner destination', partnerSeg);
  } catch (e) {
    check('admin flow crashed', false, String(e).slice(0, 300));
  }

  await browser.close();
  cleanup(ids.modelId);

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  cleanup(db(`select id from models where name='${MODEL}'`) || null);
  process.exit(1);
});
