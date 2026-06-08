/**
 * UI loader: drives the real admin app to load the normalized stock dataset.
 * Phase A: create models via /admin/models (GSMArena dialog).
 * Phase B: per variant -> create-new (createProduct) for unit 1, add-to-existing (add_stock) for the rest.
 *
 * Env: LIMIT_MODELS, LIMIT_VARIANTS (default all), HEADED=1, SLOWMO=ms
 * Run: cd frontend && npx ts-node scripts/load-stock-ui.ts   (or node via tsx)
 */
import { chromium, Page, Locator } from 'playwright';
import * as fs from 'fs';

const BASE = 'http://localhost:4200';
const DS = '/Users/haris/IdeaProjects/general-project-maker/projects/shop-app/tmp/stock-compare/dataset_norm.json';
const SHOT_DIR = '/Users/haris/IdeaProjects/general-project-maker/projects/shop-app/tmp/stock-compare/shots';
const EMAIL = 'admin@gmail.com', PASSWORD = 'password123';

const COND_LABEL: Record<string, string> = { new: 'New', used: 'Used', open_box: 'Open Box' };
const PTA_LABEL: Record<string, string> = { pta_approved: 'PTA Approved', non_pta: 'Non PTA' };

interface Row { color: string; ram_gb: number | null; cost_price: number; condition_rating: number | null; qty: number; }
interface Variant {
  brand: string; model: string; orig_model: string; storage_gb: number | null;
  pta_status: string; condition: string; selling_price: number; gsm_storage: number[]; gsm_ram: number[]; rows: Row[];
}

const ds = JSON.parse(fs.readFileSync(DS, 'utf8'));
const variants: Variant[] = ds.variants;
const models: [string, string][] = ds.models;
const LIMIT_MODELS = Number(process.env.LIMIT_MODELS || models.length);
const LIMIT_VARIANTS = Number(process.env.LIMIT_VARIANTS || variants.length);

fs.mkdirSync(SHOT_DIR, { recursive: true });
const log = (m: string) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`);

async function shot(page: Page, name: string) {
  try { await page.screenshot({ path: `${SHOT_DIR}/${name}.png`, fullPage: true }); } catch { /* ignore */ }
}

async function login(page: Page) {
  await page.goto(`${BASE}/auth/login`);
  await page.locator('input[placeholder="admin@example.com"]').fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(/\/admin/, { timeout: 20000 });
  log('logged in');
}

/** PrimeNG p-select: open by clicking, optional filter type, click option by exact text. */
async function pSelect(page: Page, containerSel: string, optionText: string) {
  const box = page.locator(containerSel);
  await box.click();
  const panel = page.locator('.p-select-overlay, .p-dropdown-panel').last();
  await panel.waitFor({ state: 'visible', timeout: 8000 });
  const filter = panel.locator('input.p-select-filter, input.p-dropdown-filter');
  if (await filter.count()) await filter.first().fill(optionText);
  await panel.getByRole('option', { name: optionText, exact: true }).first().click();
}

/** PrimeNG p-autocomplete brand: type then click suggestion li. */
async function pAutocompleteBrand(page: Page, brand: string) {
  const input = page.locator('p-autocomplete#brand input, #brand input').first();
  await input.click();
  await input.fill(brand);
  await page.waitForTimeout(700);
  // suggestion items appear in an overlay list
  const item = page.locator('.p-autocomplete-overlay li, .p-autocomplete-items li, li[role="option"]')
    .filter({ hasText: new RegExp(`^\\s*${brand}\\s*$`, 'i') }).first();
  await item.waitFor({ state: 'visible', timeout: 8000 });
  await item.click();
}

/** Click a PrimeNG p-button chip by its visible label (exact). */
async function chip(page: Page, label: string) {
  const btn = page.getByRole('button', { name: label, exact: true });
  await btn.first().waitFor({ state: 'visible', timeout: 15000 });
  await btn.first().click();
}

/** Wait until the submit button is enabled (form valid); throw with a hint otherwise. */
async function waitAddProductEnabled(page: Page) {
  try {
    await page.waitForFunction(() => {
      const b = Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').trim().startsWith('Add Product'));
      return !!b && !(b as HTMLButtonElement).disabled;
    }, { timeout: 8000 });
  } catch {
    const profit = await page.locator('text=Profit Margin').locator('xpath=..').innerText().catch(() => '');
    throw new Error(`Add Product stayed disabled (form invalid). Profit box="${profit.replace(/\n/g, ' ')}"`);
  }
}

async function fillNumber(page: Page, idSel: string, value: number) {
  // p-inputNumber needs real keystrokes to update the Angular model; .fill() leaves it null.
  // selectText() reliably selects existing content (incl. spinner default like "1") so typing replaces it.
  const input = page.locator(`${idSel} input, input${idSel}`).first();
  await input.click();
  await input.selectText();
  await input.pressSequentially(String(value), { delay: 15 });
  await input.blur();
}

// ---------------- Phase A: models ----------------
async function createModel(page: Page, brand: string, gsmName: string, searchQuery: string) {
  await page.goto(`${BASE}/admin/models`);
  await page.getByRole('button', { name: 'Add Model' }).click();
  await pSelect(page, 'p-select#newModelBrand, #newModelBrand', brand);
  const search = page.locator('#modelSearch');
  await search.waitFor({ state: 'visible', timeout: 8000 });
  await search.fill(searchQuery);
  await page.getByRole('button', { name: 'Search' }).click();
  // match the result whose name ENDS with the exact model name ("GooglePixel 8" not "...8 Pro")
  const esc = gsmName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const row = page.locator('div.cursor-pointer').filter({ hasText: new RegExp(esc + '\\s*$') }).first();
  await row.waitFor({ state: 'visible', timeout: 25000 });
  await row.click();
  // confirm selection took (preview appears) then save
  await page.getByText('Will be saved as').waitFor({ state: 'visible', timeout: 8000 });
  const saveBtn = page.getByRole('button', { name: 'Save' });
  await saveBtn.click();
  // dialog closes -> "Add Model" trigger button visible again
  await page.getByRole('button', { name: 'Add Model' }).waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(400);
}

// ---------------- Phase B: variants + stock ----------------
async function selectBrandModel(page: Page, brand: string, model: string) {
  await page.goto(`${BASE}/admin/inventory/new`);
  await page.waitForLoadState('networkidle');
  await pAutocompleteBrand(page, brand);
  await page.waitForTimeout(800); // models load
  await pSelect(page, 'p-select', model); // model dropdown (first p-select on page now)
  await page.waitForTimeout(1200); // variants load
}

async function createNewVariant(page: Page, v: Variant, r: Row) {
  await selectBrandModel(page, v.brand, v.model);
  // ensure create-new mode if toggle present
  const toggleNew = page.getByRole('button', { name: 'Create New Variant' });
  if (await toggleNew.count()) { try { await toggleNew.click(); } catch { /* ignore */ } }
  // Fetch Info to get GSMArena chips (colors/storage/ram); wait for the color chip to render
  await page.getByRole('button', { name: 'Fetch Info' }).click();
  await page.getByRole('button', { name: r.color, exact: true }).first().waitFor({ state: 'visible', timeout: 30000 });
  if (v.storage_gb) await chip(page, `${v.storage_gb}GB`);
  if (r.ram_gb) { try { await chip(page, `${r.ram_gb}GB`); } catch { /* maybe auto-applied/single */ } }
  await chip(page, r.color);
  await chip(page, COND_LABEL[v.condition]);
  if (r.condition_rating) { try { await chip(page, String(r.condition_rating)); } catch { /* default 10 */ } }
  await chip(page, PTA_LABEL[v.pta_status]);
  await fillNumber(page, '#costPrice', r.cost_price);
  await fillNumber(page, '#sellingPrice', v.selling_price);
  await waitAddProductEnabled(page);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(/\/admin\/inventory$/, { timeout: 20000 });
}

async function addStock(page: Page, v: Variant, color: string, cost: number, qty: number) {
  await selectBrandModel(page, v.brand, v.model);
  await page.getByRole('button', { name: 'Add to Existing Variant' }).click();
  await page.waitForTimeout(600);
  // pick the variant card matching storage + condition + pta
  const card = page.locator('div.border-2.cursor-pointer').filter({
    hasText: new RegExp(`${v.storage_gb}GB`),
  }).filter({ hasText: COND_LABEL[v.condition] }).filter({ hasText: PTA_LABEL[v.pta_status] }).first();
  await card.waitFor({ state: 'visible', timeout: 8000 });
  await card.click();
  await page.waitForTimeout(500);
  await page.locator('#color').fill(color);
  await fillNumber(page, '#costPrice', cost);
  await fillNumber(page, '#quantity', qty);
  await waitAddProductEnabled(page);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(/\/admin\/inventory$/, { timeout: 20000 });
}

(async () => {
  const browser = await chromium.launch({ headless: !process.env.HEADED, slowMo: Number(process.env.SLOWMO || 0) });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  let ok = 0, fail = 0;
  try {
    await login(page);

    log(`PHASE A: creating ${Math.min(LIMIT_MODELS, models.length)} models`);
    for (const [brand, gsmName] of models.slice(0, LIMIT_MODELS)) {
      const v = variants.find(x => x.brand === brand && x.model === gsmName);
      const query = v ? v.orig_model : gsmName;
      try { await createModel(page, brand, gsmName, query); log(`  + model ${brand} / ${gsmName}`); ok++; }
      catch (e) { fail++; log(`  ! FAIL model ${brand}/${gsmName}: ${(e as Error).message}`); await shot(page, `model-${gsmName}`.replace(/\W+/g, '_')); }
    }

    log(`PHASE B: ${Math.min(LIMIT_VARIANTS, variants.length)} variants`);
    for (const v of variants.slice(0, LIMIT_VARIANTS)) {
      const tag = `${v.brand} ${v.model} ${v.storage_gb}GB ${v.condition}/${v.pta_status}`;
      try {
        // unit 1 via create-new
        await createNewVariant(page, v, v.rows[0]);
        log(`  + variant ${tag} (1st unit ${v.rows[0].color})`);
        ok++;
        // first row remaining qty
        if (v.rows[0].qty > 1) {
          await addStock(page, v, v.rows[0].color, v.rows[0].cost_price, v.rows[0].qty - 1);
          log(`    + stock ${v.rows[0].color} x${v.rows[0].qty - 1}`);
        }
        // subsequent rows
        for (const r of v.rows.slice(1)) {
          await addStock(page, v, r.color, r.cost_price, r.qty);
          log(`    + stock ${r.color} x${r.qty}`);
        }
      } catch (e) {
        fail++; log(`  ! FAIL variant ${tag}: ${(e as Error).message}`);
        await shot(page, `var-${tag}`.replace(/\W+/g, '_'));
      }
    }
  } finally {
    log(`DONE ok=${ok} fail=${fail}`);
    await browser.close();
  }
})();
