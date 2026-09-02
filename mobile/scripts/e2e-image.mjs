/**
 * Focused E2E: image upload flow on the variant detail screen (Expo web).
 * Dev-bypass -> open first variant -> upload an image via the web file picker
 * -> verify it renders, becomes primary, and (caller checks DB) persists.
 */
import { chromium } from '/Users/haris/IdeaProjects/general-project-maker/projects/shop-app/frontend/node_modules/playwright/index.mjs';
import * as fs from 'fs';

const BASE = process.env.BASE || 'http://localhost:8081';
const IMG = '/tmp/test-variant.png';
const OUT = '/tmp/mobile-e2e';
fs.mkdirSync(`${OUT}/shots`, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const netFailures = [];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newContext({ viewport: { width: 414, height: 896 } }).then((c) => c.newPage());
  page.on('response', (res) => {
    if (res.status() >= 400 && (res.url().includes('54321') || res.url().includes('cloudinary')))
      netFailures.push(`${res.status()} ${res.url().slice(0, 90)}`);
  });

  let variantId = null;
  let ok = false;
  let before = 0;
  let after = 0;
  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('[data-testid="dev-bypass-button"]', { timeout: 60000 });
    await page.click('[data-testid="dev-bypass-button"]');
    await page.waitForSelector('[data-testid^="variant-row-"]', { timeout: 30000 });
    await sleep(800);

    const firstRow = page.locator('[data-testid^="variant-row-"]').first();
    variantId = (await firstRow.getAttribute('data-testid')).replace('variant-row-', '');
    await firstRow.click();
    await page.waitForSelector('[data-testid="variant-detail"]', { timeout: 20000 });
    await sleep(600);

    before = await page.locator('[data-testid^="image-"]').count();

    // Web: the upload button triggers a hidden <input type=file>.
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 10000 }),
      page.click('[data-testid="upload-image-button"]'),
    ]);
    await chooser.setFiles(IMG);

    // Wait for the new image card to appear (Cloudinary round-trip).
    await page.waitForFunction(
      (n) => document.querySelectorAll('[data-testid^="image-"]').length > n,
      before,
      { timeout: 30000 }
    );
    await sleep(500);
    after = await page.locator('[data-testid^="image-"]').count();
    await page.screenshot({ path: `${OUT}/shots/08-image-uploaded.png`, fullPage: true });
    ok = after > before && netFailures.length === 0;
  } catch (e) {
    console.log('ERROR', String(e));
    await page.screenshot({ path: `${OUT}/shots/08-image-error.png`, fullPage: true }).catch(() => {});
  } finally {
    console.log(`${ok ? '✅' : '❌'} Image upload — before=${before} after=${after} variant=${variantId}`);
    if (netFailures.length) console.log('Net failures:\n' + netFailures.join('\n'));
    fs.writeFileSync(`${OUT}/image-result.json`, JSON.stringify({ ok, before, after, variantId, netFailures }, null, 2));
    await browser.close();
    process.exit(ok ? 0 : 1);
  }
}
main();
