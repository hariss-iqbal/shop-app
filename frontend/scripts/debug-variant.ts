import { chromium, Page } from 'playwright';
const SHOT = '/Users/haris/IdeaProjects/general-project-maker/projects/shop-app/tmp/stock-compare/shots';
const BASE = 'http://localhost:4200';

async function pSelect(page: Page, sel: string, text: string) {
  await page.locator(sel).first().click();
  const panel = page.locator('.p-select-overlay, .p-dropdown-panel').last();
  await panel.waitFor({ state: 'visible', timeout: 8000 });
  const f = panel.locator('input.p-select-filter, input.p-dropdown-filter');
  if (await f.count()) await f.first().fill(text);
  await panel.getByRole('option', { name: text, exact: true }).first().click();
}

(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  p.setDefaultTimeout(20000);
  await p.goto(`${BASE}/auth/login`);
  await p.locator('input[placeholder="admin@example.com"]').fill('admin@gmail.com');
  await p.locator('input[type="password"]').first().fill('password123');
  await p.getByRole('button', { name: 'Sign In' }).click();
  await p.waitForURL(/\/admin/);

  await p.goto(`${BASE}/admin/inventory/new`);
  await p.waitForLoadState('networkidle');
  // brand
  const bi = p.locator('p-autocomplete#brand input, #brand input').first();
  await bi.click(); await bi.fill('Google'); await p.waitForTimeout(700);
  await p.locator('li[role="option"], .p-autocomplete-overlay li, .p-autocomplete-items li')
    .filter({ hasText: /^\s*Google\s*$/i }).first().click();
  await p.waitForTimeout(800);
  await pSelect(p, 'p-select', 'Pixel 10 Pro XL');
  await p.waitForTimeout(1200);
  await p.getByRole('button', { name: 'Fetch Info' }).click();
  await p.getByRole('button', { name: 'Moonstone', exact: true }).first().waitFor({ state: 'visible', timeout: 30000 });
  await p.getByRole('button', { name: '256GB', exact: true }).first().click();
  await p.getByRole('button', { name: 'Moonstone', exact: true }).first().click();
  await p.getByRole('button', { name: 'New', exact: true }).first().click();
  await p.getByRole('button', { name: 'Non PTA', exact: true }).first().click();

  // try several inputNumber fill strategies on cost, report after each
  const cost = p.locator('#costPrice input').first();
  const sell = p.locator('#sellingPrice input').first();

  async function report(tag: string) {
    const data = await p.evaluate(() => {
      const costEl = document.querySelector('#costPrice input') as HTMLInputElement | null;
      const sellEl = document.querySelector('#sellingPrice input') as HTMLInputElement | null;
      let addBtn: HTMLButtonElement | null = null;
      const btns = document.querySelectorAll('button');
      for (let i = 0; i < btns.length; i++) {
        if ((btns[i].textContent || '').trim().indexOf('Add Product') === 0) { addBtn = btns[i] as HTMLButtonElement; break; }
      }
      return {
        cost: costEl ? costEl.value : null,
        sell: sellEl ? sellEl.value : null,
        addBtnFound: !!addBtn,
        addBtnDisabled: addBtn ? addBtn.disabled : null,
        addBtnText: addBtn ? (addBtn.textContent || '').trim() : null,
      };
    });
    console.log(tag, JSON.stringify(data));
  }

  // Strategy 1: pressSequentially
  await cost.click(); await cost.press('Control+a'); await cost.press('Backspace');
  await cost.pressSequentially('205000', { delay: 20 }); await cost.blur();
  await sell.click(); await sell.press('Control+a'); await sell.press('Backspace');
  await sell.pressSequentially('240000', { delay: 20 }); await sell.blur();
  await p.waitForTimeout(500);
  await report('S1-pressSeq');

  // Strategy 2: fill()
  await cost.fill('205000'); await sell.fill('240000'); await p.waitForTimeout(500);
  await report('S2-fill');

  // Strategy 3: type via keyboard
  await cost.click(); await p.keyboard.press('Control+a'); await p.keyboard.type('205000');
  await sell.click(); await p.keyboard.press('Control+a'); await p.keyboard.type('240000');
  await p.keyboard.press('Tab'); await p.waitForTimeout(500);
  await report('S3-keyboard');

  await p.screenshot({ path: `${SHOT}/debug-variant.png`, fullPage: true });
  await b.close();
})();
