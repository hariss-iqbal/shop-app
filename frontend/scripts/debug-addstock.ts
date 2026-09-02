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
async function fillNumber(page: Page, idSel: string, value: number) {
  const input = page.locator(`${idSel} input, input${idSel}`).first();
  await input.click(); await input.press('Control+a'); await input.press('Backspace');
  await input.pressSequentially(String(value), { delay: 15 }); await input.blur();
}

(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  p.setDefaultTimeout(15000);
  const toasts: string[] = [];
  p.on('console', m => { if (m.type() === 'error') toasts.push('CONSOLE ' + m.text()); });
  await p.goto(`${BASE}/auth/login`);
  await p.locator('input[placeholder="admin@example.com"]').fill('admin@gmail.com');
  await p.locator('input[type="password"]').first().fill('password123');
  await p.getByRole('button', { name: 'Sign In' }).click();
  await p.waitForURL(/\/admin/);
  console.log('1. logged in');

  await p.goto(`${BASE}/admin/inventory/new`);
  await p.waitForLoadState('networkidle');
  const bi = p.locator('p-autocomplete#brand input, #brand input').first();
  await bi.click(); await bi.fill('Google'); await p.waitForTimeout(700);
  await p.locator('li[role="option"], .p-autocomplete-overlay li, .p-autocomplete-items li')
    .filter({ hasText: /^\s*Google\s*$/i }).first().click();
  console.log('2. brand Google selected');
  await p.waitForTimeout(900);
  await pSelect(p, 'p-select', 'Pixel 7a');
  console.log('3. model Pixel 7a selected');
  await p.waitForTimeout(1500);

  // toggle to add-existing
  const toggle = p.getByRole('button', { name: 'Add to Existing Variant' });
  console.log('4. add-existing toggle count:', await toggle.count());
  await toggle.click();
  await p.waitForTimeout(800);

  // count variant cards
  const cards = p.locator('div.border-2.cursor-pointer');
  console.log('5. variant cards:', await cards.count());
  const card = cards.filter({ hasText: /128GB/ }).filter({ hasText: 'Used' }).filter({ hasText: 'PTA Approved' }).first();
  console.log('6. matching card count:', await card.count());
  await card.click();
  console.log('7. card clicked');
  await p.waitForTimeout(600);

  // fields
  console.log('8. #color count:', await p.locator('#color').count(), '#quantity count:', await p.locator('#quantity input').count());
  await p.locator('#color').fill('Snow');
  await fillNumber(p, '#costPrice', 54000);
  await fillNumber(p, '#quantity', 4);
  await p.waitForTimeout(400);

  const state = await p.evaluate(() => {
    const q = document.querySelector('#quantity input') as HTMLInputElement | null;
    const c = document.querySelector('#costPrice input') as HTMLInputElement | null;
    const col = document.querySelector('#color') as HTMLInputElement | null;
    let addBtn: HTMLButtonElement | null = null;
    const btns = document.querySelectorAll('button[type="submit"]');
    if (btns.length) addBtn = btns[0] as HTMLButtonElement;
    return { qty: q ? q.value : null, cost: c ? c.value : null, color: col ? col.value : null,
             submitFound: !!addBtn, submitDisabled: addBtn ? addBtn.disabled : null };
  });
  console.log('9. form state:', JSON.stringify(state));
  await p.screenshot({ path: `${SHOT}/debug-addstock-before.png`, fullPage: true });

  await p.locator('button[type="submit"]').first().click();
  console.log('10. submit clicked');
  try {
    await p.waitForURL(/\/admin\/inventory$/, { timeout: 12000 });
    console.log('11. SUCCESS navigated to', p.url());
  } catch {
    console.log('11. NO NAV. url=', p.url());
    const body = await p.locator('body').innerText();
    console.log('   toasts/errors:', body.split('\n').filter(l => /error|fail|invalid|success|added|denied/i.test(l)).slice(0, 6).join(' | '));
    console.log('   console errs:', toasts.slice(0, 5).join(' | '));
    await p.screenshot({ path: `${SHOT}/debug-addstock-after.png`, fullPage: true });
  }
  await b.close();
})();
