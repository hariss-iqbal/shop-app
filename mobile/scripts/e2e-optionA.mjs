/**
 * Option A E2E (Expo web target, local DB):
 *   1. Config-wide scope banners present on Price + Details.
 *   2. Per-color image upload isolation (Bay image does NOT show under Obsidian).
 *   3. Set-primary is per color (Obsidian primary unaffected by Bay).
 *   4. Delete image.
 *   5. Move color -> reclassifies only that color's units into another config;
 *      verified in the DB, then the fixture is restored.
 *
 * Fixture: Pixel 8 Pro · 128GB · Used · PTA Approved (Bay, Obsidian, Porcelain).
 */
import { chromium } from '/Users/haris/IdeaProjects/general-project-maker/projects/shop-app/frontend/node_modules/playwright/index.mjs';
import { execSync } from 'node:child_process';
import * as fs from 'fs';

const BASE = process.env.BASE || 'http://localhost:8081';
const VID = 'aa7da19f-7c4c-4b6a-b858-e445dbc60470'; // Pixel 8 Pro 128 used pta_approved
const IMG = '/tmp/optA.jpg';
const OUT = '/tmp/mobile-optA';
const DBURL = 'postgresql://postgres@127.0.0.1:54322/postgres';
fs.mkdirSync(`${OUT}/shots`, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const db = (sql) =>
  execSync(`PGPASSWORD=postgres psql "${DBURL}" -Atc ${JSON.stringify(sql)}`, { encoding: 'utf8' }).trim();

// valid jpg (tiny synthetic images get 400s from Cloudinary)
execSync(`sips -s format jpeg /Users/haris/IdeaProjects/general-project-maker/projects/shop-app/mobile/assets/icon.png --out ${IMG} >/dev/null 2>&1`);

const results = [];
const check = (name, pass, extra = '') => {
  results.push({ name, pass, extra });
  console.log(`${pass ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
};

async function main() {
  // ---- deterministic start: clear this variant's images ----
  db(`DELETE FROM variant_images WHERE variant_id='${VID}';`);
  // capture pre-state for the move test
  const modelId = db(`SELECT model_id FROM variants WHERE id='${VID}';`);
  const targetPre = db(
    `SELECT COALESCE((SELECT id::text FROM variants WHERE model_id='${modelId}' AND storage_gb=128 AND pta_status='non_pta' AND condition='used'),'NONE');`
  );

  const browser = await chromium.launch({ headless: true });
  const page = await browser
    .newContext({ viewport: { width: 414, height: 900 } })
    .then((c) => c.newPage());
  const netFail = [];
  page.on('response', (r) => {
    if (r.status() >= 400 && (r.url().includes('54321') || r.url().includes('cloudinary')))
      netFail.push(`${r.status()} ${r.url().slice(0, 80)}`);
  });

  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('[data-testid="dev-bypass-button"]', { timeout: 60000 });
    await page.click('[data-testid="dev-bypass-button"]');
    await page.waitForSelector('[data-testid="search-input"]', { timeout: 30000 });

    // navigate to the fixture variant
    await page.fill('[data-testid="search-input"]', 'Pixel 8 Pro');
    await sleep(1200);
    await page.waitForSelector(`[data-testid="variant-row-${VID}"]`, { timeout: 15000 });
    await page.click(`[data-testid="variant-row-${VID}"]`);
    await page.waitForSelector('[data-testid="variant-detail"]', { timeout: 20000 });
    await sleep(700);

    // ---- 1. scope banners ----
    const banners = await page.locator('[data-testid="scope-banner"]').count();
    check('Scope banners on config-wide sections', banners >= 2, `found ${banners}`);

    // ---- 2. per-color upload isolation ----
    const stripCount = () => page.locator('[data-testid^="image-"]').count();

    // default color chip is the first available color (Bay). Upload -> Bay.
    await page.click('[data-testid="upload-color-Bay"]').catch(() => {});
    await sleep(300);
    const bayBefore = await stripCount();
    let [ch] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 10000 }),
      page.click('[data-testid="upload-image-button"]'),
    ]);
    await ch.setFiles(IMG);
    await page.waitForFunction((n) => document.querySelectorAll('[data-testid^="image-"]').length > n, bayBefore, { timeout: 30000 });
    const bayAfter = await stripCount();
    check('Upload tagged to Bay shows in Bay strip', bayAfter === bayBefore + 1, `${bayBefore}->${bayAfter}`);

    // switch to Obsidian: Bay's image must NOT appear
    await page.click('[data-testid="upload-color-Obsidian"]');
    await sleep(400);
    const obsInit = await stripCount();
    check('Bay image hidden under Obsidian (isolation)', obsInit === 0, `Obsidian strip=${obsInit}`);

    // upload an Obsidian image
    [ch] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 10000 }),
      page.click('[data-testid="upload-image-button"]'),
    ]);
    await ch.setFiles(IMG);
    await page.waitForFunction((n) => document.querySelectorAll('[data-testid^="image-"]').length > n, obsInit, { timeout: 30000 });
    const obsAfter = await stripCount();
    check('Upload tagged to Obsidian shows in Obsidian strip', obsAfter === 1, `Obsidian strip=${obsAfter}`);

    // back to Bay: still exactly the 1 Bay image (no Obsidian leak)
    await page.click('[data-testid="upload-color-Bay"]');
    await sleep(400);
    const bayCheck = await stripCount();
    check('Obsidian image hidden under Bay (isolation both ways)', bayCheck === 1, `Bay strip=${bayCheck}`);
    await page.screenshot({ path: `${OUT}/shots/isolation.png`, fullPage: true });

    // DB: each color has its own primary
    const dbColors = db(
      `SELECT string_agg(color||':'||is_primary, ',' ORDER BY color) FROM variant_images WHERE variant_id='${VID}';`
    );
    check('DB: images color-tagged with own primary', /Bay:t/.test(dbColors) && /Obsidian:t/.test(dbColors), dbColors);

    // ---- 3. set-primary is per color ----
    // add a 2nd Bay image, then promote it; Obsidian's primary must not change
    const obsPrimaryBefore = db(`SELECT id FROM variant_images WHERE variant_id='${VID}' AND color='Obsidian' AND is_primary;`);
    [ch] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 10000 }),
      page.click('[data-testid="upload-image-button"]'),
    ]);
    await ch.setFiles(IMG);
    await page.waitForFunction(() => document.querySelectorAll('[data-testid^="image-"]').length === 2, null, { timeout: 30000 });
    await sleep(300);
    // click the "Set primary" on whichever Bay card is not primary
    const setBtn = page.locator('[data-testid^="set-primary-"]').first();
    await setBtn.click();
    await sleep(600);
    const bayPrimaries = db(`SELECT count(*) FROM variant_images WHERE variant_id='${VID}' AND color='Bay' AND is_primary;`);
    const obsPrimaryAfter = db(`SELECT id FROM variant_images WHERE variant_id='${VID}' AND color='Obsidian' AND is_primary;`);
    check('Set-primary keeps exactly one Bay primary', bayPrimaries === '1', `bay primaries=${bayPrimaries}`);
    check('Set-primary did NOT touch Obsidian primary', obsPrimaryBefore === obsPrimaryAfter && obsPrimaryAfter !== '', `obs ${obsPrimaryBefore}==${obsPrimaryAfter}`);

    // ---- 4. delete image ----
    const beforeDel = await stripCount(); // Bay strip (2)
    const delBtn = page.locator('[data-testid^="delete-image-"]').first();
    page.once('dialog', (d) => d.accept()); // web confirm()
    await delBtn.click();
    await page.waitForFunction((n) => document.querySelectorAll('[data-testid^="image-"]').length < n, beforeDel, { timeout: 15000 });
    const afterDel = await stripCount();
    check('Delete removes an image', afterDel === beforeDel - 1, `${beforeDel}->${afterDel}`);

    // ---- 5. move color ----
    const srcColorsBefore = db(`SELECT array_to_string(available_colors,',') FROM variants WHERE id='${VID}';`);
    const porcStock = db(`SELECT count(*) FROM products WHERE variant_id='${VID}' AND lower(color)='porcelain' AND status='available';`);
    const srcStockBefore = db(`SELECT stock_count FROM variants WHERE id='${VID}';`);

    await page.click('[data-testid="move-color-Porcelain"]');
    await page.waitForSelector('[data-testid="move-panel-Porcelain"]', { timeout: 5000 });
    await page.click('[data-testid="move-pta-non_pta"]');
    await page.click('[data-testid="move-condition-used"]');
    await page.click('[data-testid="move-confirm-button"]');
    await page.waitForSelector('[data-testid="move-done"]', { timeout: 15000 });
    await sleep(600);
    await page.screenshot({ path: `${OUT}/shots/moved.png`, fullPage: true });

    const srcColorsAfter = db(`SELECT array_to_string(available_colors,',') FROM variants WHERE id='${VID}';`);
    const targetId = db(
      `SELECT id FROM variants WHERE model_id='${modelId}' AND storage_gb=128 AND pta_status='non_pta' AND condition='used';`
    );
    const targetColors = targetId ? db(`SELECT array_to_string(available_colors,',') FROM variants WHERE id='${targetId}';`) : '';
    const movedProducts = targetId
      ? db(`SELECT count(*) FROM products WHERE variant_id='${targetId}' AND lower(color)='porcelain' AND pta_status='non_pta';`)
      : '0';
    const srcStockAfter = db(`SELECT stock_count FROM variants WHERE id='${VID}';`);

    check('Move: Porcelain removed from source config', !/porcelain/i.test(srcColorsAfter), `src now: ${srcColorsAfter}`);
    check('Move: target config exists with Porcelain', /porcelain/i.test(targetColors), `target: ${targetColors}`);
    check('Move: units reassigned & re-tagged non_pta', movedProducts === porcStock && porcStock !== '0', `moved=${movedProducts} expected=${porcStock}`);
    check('Move: source stock dropped by Porcelain count', Number(srcStockAfter) === Number(srcStockBefore) - Number(porcStock), `${srcStockBefore}->${srcStockAfter}`);

    // ---- restore fixture (direct SQL as superuser; the RPC's admin guard blocks psql) ----
    if (targetId) {
      db(`UPDATE products SET variant_id='${VID}', pta_status='pta_approved', condition='used', storage_gb=128 WHERE variant_id='${targetId}' AND lower(color)='porcelain';`);
      db(`UPDATE variants SET available_colors='{${srcColorsBefore}}' WHERE id='${VID}';`);
      if (targetPre === 'NONE') {
        db(`DELETE FROM variants WHERE id='${targetId}';`); // was created by the test
      } else {
        db(`UPDATE variants SET available_colors=(SELECT COALESCE(array_agg(c),'{}') FROM unnest(available_colors) c WHERE lower(c)<>'porcelain') WHERE id='${targetId}';`);
      }
    }
    db(`DELETE FROM variant_images WHERE variant_id='${VID}';`); // clean test images
    const restored = db(`SELECT array_to_string(available_colors,',') FROM variants WHERE id='${VID}';`);
    const restoredStock = db(`SELECT stock_count FROM variants WHERE id='${VID}';`);
    check('Fixture restored (colors + stock)', /porcelain/i.test(restored) && restoredStock === srcStockBefore, `${restored} stock=${restoredStock}`);
  } catch (e) {
    check('RUN', false, String(e).slice(0, 300));
    await page.screenshot({ path: `${OUT}/shots/error.png`, fullPage: true }).catch(() => {});
  } finally {
    if (netFail.length) console.log('NET FAILURES:\n' + netFail.join('\n'));
    const passed = results.filter((r) => r.pass).length;
    console.log(`\n=== ${passed}/${results.length} checks passed ===`);
    fs.writeFileSync(`${OUT}/result.json`, JSON.stringify({ results, netFail }, null, 2));
    await browser.close();
    process.exit(passed === results.length && netFail.length === 0 ? 0 : 1);
  }
}
main();
