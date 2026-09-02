/**
 * Playwright E2E for the Device-OUT (consignment) feature on the Expo web target.
 * Scenarios — positive AND negative — with DB verification via psql:
 *   POS1  create OUT to a partner -> settle (SOLD) -> sale booked, device sold
 *   POS2  create OUT -> RETURN -> device back to available
 *   NEG1  create OUT with no partner selected -> client error
 *   NEG2  a SOLD out shows no actions (can't settle twice from UI)
 *   NEG3  an OUT'd device disappears from the "available" device picker
 * Cleans up all test rows afterward.
 */
import { chromium } from '/Users/haris/IdeaProjects/general-project-maker/projects/shop-app/frontend/node_modules/playwright/index.mjs';
import { execSync } from 'node:child_process';
import * as fs from 'fs';

const BASE = process.env.BASE || 'http://localhost:8081';
const PSQL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const OUT = '/tmp/out-e2e';
fs.mkdirSync(`${OUT}/shots`, { recursive: true });
const db = (q) => execSync(`psql "${PSQL}" -tAc "${q.replace(/"/g, '\\"')}"`).toString().trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${detail ? ' — ' + detail : ''}`);
};

async function main() {
  // snapshot existing device_outs so we can clean up only what we create
  const before = db(`select coalesce(string_agg(id::text,','),'') from device_outs`).split(',').filter(Boolean);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newContext({ viewport: { width: 420, height: 900 } }).then((c) => c.newPage());
  const shot = (n) => page.screenshot({ path: `${OUT}/shots/${n}.png` }).catch(() => {});
  page.on('dialog', (d) => d.accept()); // auto-accept confirm() for return/cancel

  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('[data-testid="dev-bypass-button"]', { timeout: 60000 });
    await page.click('[data-testid="dev-bypass-button"]');
    await page.waitForSelector('[data-testid="nav-outs-button"]', { timeout: 30000 });
    await page.click('[data-testid="nav-outs-button"]');
    await page.waitForSelector('[data-testid="out-list"]', { timeout: 20000 });
    check('Open Out Devices list', true);

    // ---- POS1: create OUT to partner, then settle (SOLD) ----
    await page.click('[data-testid="create-out-fab"]');
    await page.waitForSelector('[data-testid="create-out"]', { timeout: 15000 });
    await page.fill('[data-testid="device-search"]', 'Pixel');
    await page.waitForSelector('[data-testid^="device-pick-"]', { timeout: 15000 });
    // capture chosen product id
    const pickId = await page.locator('[data-testid^="device-pick-"]').first().getAttribute('data-testid');
    const productId = pickId.replace('device-pick-', '');
    await page.locator('[data-testid^="device-pick-"]').first().click();
    await sleep(400);

    // NEG1: submit with no partner selected
    await page.click('[data-testid="create-out-submit"]');
    await sleep(600);
    const neg1 = (await page.locator('[data-testid="create-out-error"]').count()) > 0;
    check('NEG1 create without partner -> error', neg1,
      neg1 ? await page.locator('[data-testid="create-out-error"]').innerText() : 'no error shown');

    // now pick a partner + price and submit
    await page.locator('[data-testid^="partner-"]').first().click();
    await page.fill('[data-testid="out-price-input"]', '165000');
    await shot('01-create');
    await page.click('[data-testid="create-out-submit"]');
    await page.waitForSelector('[data-testid="out-detail"]', { timeout: 15000 });
    check('POS1 create OUT -> detail', true, `product ${productId.slice(0, 8)}`);
    check('Device locked to status=out in DB', db(`select status from products where id='${productId}'`) === 'out');

    // settle (SOLD)
    await page.click('[data-testid="settle-toggle"]');
    await page.waitForSelector('[data-testid="settle-submit"]', { timeout: 10000 });
    await page.fill('[data-testid="settle-price"]', '160000');
    await page.fill('[data-testid="settle-received"]', '160000');
    await page.click('[data-testid="settle-method-cash"]');
    await page.click('[data-testid="settle-submit"]');
    await page.waitForSelector('[data-testid="out-done"]', { timeout: 15000 });
    await shot('02-settled');
    const soldStatus = db(`select status from products where id='${productId}'`);
    const saleRow = db(`select sale_price||'|'||payment_status from sales where product_id='${productId}' order by created_at desc limit 1`);
    check('POS1 settle -> device SOLD in DB', soldStatus === 'sold', `status=${soldStatus}`);
    check('POS1 settle -> sale booked (feeds Grand Profit)', saleRow.startsWith('160000'), `sale=${saleRow}`);
    const outRow = db(`select status from device_outs where product_id='${productId}' order by created_at desc limit 1`);
    check('POS1 OUT marked sold', outRow === 'sold', `out=${outRow}`);

    // NEG2: a sold OUT shows no settle action
    const noSettle = (await page.locator('[data-testid="settle-toggle"]').count()) === 0
      && (await page.locator('[data-testid="return-btn"]').count()) === 0;
    check('NEG2 sold OUT has no further actions', noSettle);

    // ---- POS2: create another OUT, then RETURN ----
    await page.goto(BASE + '/outs/new', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="create-out"]', { timeout: 15000 });
    await page.fill('[data-testid="device-search"]', 'Pixel');
    await page.waitForSelector('[data-testid^="device-pick-"]', { timeout: 15000 });
    const pick2 = await page.locator('[data-testid^="device-pick-"]').first().getAttribute('data-testid');
    const productId2 = pick2.replace('device-pick-', '');
    await page.locator('[data-testid^="device-pick-"]').first().click();
    await sleep(300);

    // NEG3: the device we just OUT'd in POS1 must NOT appear as available
    const availIds = await page.locator('[data-testid^="device-pick-"]').evaluateAll((els) =>
      els.map((e) => e.getAttribute('data-testid').replace('device-pick-', ''))
    );
    check('NEG3 sold/out device gone from available picker', !availIds.includes(productId));

    await page.locator('[data-testid^="partner-"]').first().click();
    await page.fill('[data-testid="out-price-input"]', '90000');
    await page.click('[data-testid="create-out-submit"]');
    await page.waitForSelector('[data-testid="out-detail"]', { timeout: 15000 });
    check('Device2 locked to out', db(`select status from products where id='${productId2}'`) === 'out');
    await page.click('[data-testid="return-btn"]');
    await page.waitForSelector('[data-testid="out-done"]', { timeout: 15000 });
    await shot('03-returned');
    const ret = db(`select status from products where id='${productId2}'`);
    const retOut = db(`select status from device_outs where product_id='${productId2}' order by created_at desc limit 1`);
    check('POS2 return -> device AVAILABLE again', ret === 'available', `status=${ret}`);
    check('POS2 OUT marked returned', retOut === 'returned', `out=${retOut}`);
  } catch (e) {
    check('run completed without exception', false, String(e).slice(0, 200));
    await shot('error');
  } finally {
    // cleanup: remove device_outs we created + their sales, reset products
    const after = db(`select coalesce(string_agg(id::text,','),'') from device_outs`).split(',').filter(Boolean);
    const created = after.filter((id) => !before.includes(id));
    if (created.length) {
      const ids = created.map((i) => `'${i}'`).join(',');
      const prods = db(`select coalesce(string_agg(distinct product_id::text,','),'') from device_outs where id in (${ids})`);
      if (prods) {
        const pids = prods.split(',').map((i) => `'${i}'`).join(',');
        db(`delete from sales where product_id in (${pids})`);
        db(`delete from device_outs where id in (${ids})`);
        db(`update products set status='available' where id in (${pids})`);
      }
      console.log(`cleaned up ${created.length} test OUT(s)`);
    }
    const pass = results.filter((r) => r.ok).length;
    const fail = results.filter((r) => !r.ok).length;
    console.log(`\n=== OUT E2E: PASS ${pass} / FAIL ${fail} ===`);
    fs.writeFileSync(`${OUT}/result.json`, JSON.stringify(results, null, 2));
    await browser.close();
    process.exit(fail ? 1 : 0);
  }
}
main();
