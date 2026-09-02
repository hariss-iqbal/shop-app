// Standalone Playwright diagnostic for the "always have to reload" symptom.
// Dev server @ http://localhost:4200, Supabase local @ 54321.
//
// KEY IDEA: navigate via IN-APP (soft) router clicks, never full page reloads —
// a full reload is exactly the user's "reload that fixes it" and would mask the bug.
// The hang lives in the long-lived Supabase client / auth-lock chain that only
// persists across SOFT navigations.
//
// Discriminates two root causes when the UI looks stuck:
//   (A) REST requests still PENDING        -> transport / auth-lock serialization stall
//   (B) REST requests already 200 but spinner stays -> render / change-detection stall
//
// Run:  node scripts/diag-hang.mjs
import { chromium } from 'playwright';

const APP = 'http://localhost:4200';
const EMAIL = 'admin@gmail.com';
const PASS = 'password123';
const HUNG_MS = 8000;
const isSb = (u) => /:54321\//.test(u) && !/^wss?:/.test(u) && !/\/realtime\//.test(u);
const shortUrl = (u) => u.replace(/^https?:\/\/[^/]+/, '').replace(/(\?.{0,38}).*/, '$1…');
const now = () => Date.now();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function instrument(page, tag) {
  const pending = new Map();
  const finished = [];
  page.on('request', (r) => { if (isSb(r.url())) pending.set(r, { url: r.url(), start: now() }); });
  const close = (r, status) => { const e = pending.get(r); if (!e) return; pending.delete(r); finished.push({ url: e.url, status, ms: now() - e.start, end: now() }); };
  page.on('response', (resp) => close(resp.request(), resp.status()));
  page.on('requestfailed', (r) => { if (isSb(r.url())) { const e = pending.get(r); if (e) { pending.delete(r); finished.push({ url: e.url, status: 'FAILED:' + (r.failure()?.errorText || '?'), ms: now() - e.start, end: now() }); } } });
  page.on('console', (m) => { const t = m.type(); if (t === 'error' || t === 'warning') console.log(`    [${tag} console.${t}] ${m.text().slice(0, 180)}`); });
  page.on('pageerror', (e) => console.log(`    [${tag} PAGEERROR] ${e.message.slice(0, 180)}`));
  return {
    pendingNow: () => [...pending.values()].map((e) => ({ url: shortUrl(e.url), ms: now() - e.start })),
    hungNow: () => [...pending.values()].filter((e) => now() - e.start > HUNG_MS).map((e) => ({ url: shortUrl(e.url), ms: now() - e.start })),
    since: (t) => finished.filter((f) => f.end >= t),
    reset: () => { finished.length = 0; },
  };
}

async function login(page) {
  await page.goto(`${APP}/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[placeholder="admin@example.com"]').fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASS);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(/\/admin/, { timeout: 20000 }).catch(() => {});
  await sleep(1200);
  return page.url();
}

async function readStoredSession(page) {
  return page.evaluate(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
        try { return { key: k, val: JSON.parse(localStorage.getItem(k)) }; } catch { return { key: k, val: localStorage.getItem(k) }; }
      }
    }
    return null;
  });
}

async function uiState(page) {
  return page.evaluate(() => {
    const spinners = document.querySelectorAll('.p-progressspinner, .p-progress-spinner, [role="progressbar"], .p-skeleton, .loading-spinner').length;
    const rows = document.querySelectorAll('.p-datatable-tbody > tr, table tbody tr, p-card, .product-card, .stat-card, .dashboard-card').length;
    const bodyTxt = (document.body.innerText || '');
    const loadingText = /(^|\n)\s*loading\b/i.test(bodyTxt);
    return { spinners, rows, loadingText, url: location.href };
  });
}

// SOFT navigation: click the in-app router link, wait for URL + network quiet.
async function softVisit(net, page, route, label) {
  const t0 = now();
  const link = page.locator(`a[href="${route}"]:visible`).first();
  const cnt = await link.count();
  if (cnt === 0) { console.log(`\n▶ ${label} (${route})  ⚠️ no visible nav link found — skipping`); return null; }
  await link.click().catch((e) => console.log(`   click err: ${e.message.slice(0,80)}`));
  await page.waitForURL((u) => u.pathname.startsWith(route.split('?')[0]), { timeout: 8000 }).catch(() => {});
  let quietAt = null; const deadline = now() + 20000;
  while (now() < deadline) { await sleep(400); if (net.pendingNow().length === 0) { quietAt = now(); break; } }
  const ui = await uiState(page);
  const fin = net.since(t0);
  const hung = net.hungNow();
  const pend = net.pendingNow();
  console.log(`\n▶ ${label}  (${route})`);
  console.log(`   sb finished: ${fin.length} | slowest: ${[...fin].sort((a,b)=>b.ms-a.ms).slice(0,3).map(f=>`${shortUrl(f.url)} ${f.ms}ms[${f.status}]`).join(', ')||'—'}`);
  console.log(`   net quiet: ${quietAt?((quietAt-t0)+'ms'):'NEVER(>20s)'} | pending: ${pend.length} | HUNG: ${hung.length}`);
  console.log(`   UI: spinners=${ui.spinners} dataRows=${ui.rows} loadingText=${ui.loadingText} | url=${shortUrl(ui.url)}`);
  if (pend.length) console.log(`   🔴 CAUSE A: still PENDING -> ${pend.map(p=>`${p.url} ${p.ms}ms`).join(', ')}`);
  if (!pend.length && (ui.spinners>0||ui.loadingText) && fin.some(f=>String(f.status).startsWith('2')))
    console.log(`   🔴 CAUSE B: requests done 200 but spinner/loading still on -> render/change-detection stall`);
  return { quietAt: quietAt?quietAt-t0:null, hung, pend, ui, fin };
}

async function expireStored(page, key) {
  await page.evaluate((k) => { const v = JSON.parse(localStorage.getItem(k)); v.expires_at = Math.floor(Date.now()/1000) - 120; v.expires_in = 0; localStorage.setItem(k, JSON.stringify(v)); }, key);
}
async function setVisibility(page, st) {
  await page.evaluate((s) => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => s }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => s === 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); if (s==='visible'){ window.dispatchEvent(new Event('focus')); } }, st);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });

  const a = await ctx.newPage();
  const netA = instrument(a, 'A');
  console.log('=== STEP 1: login (Tab A) ===');
  console.log('  URL after login:', await login(a));
  const stored = await readStoredSession(a);
  if (!stored) { console.log('  ❌ no supabase session in storage — login failed, aborting'); await browser.close(); return; }
  console.log('  storage key:', stored.key, '| expires_at:', stored.val?.expires_at, '| has refresh_token:', !!stored.val?.refresh_token);

  console.log('\n=== STEP 2: baseline SOFT navigation (long-lived client) ===');
  netA.reset();
  for (const [route, label] of [['/admin/dashboard','Dashboard'],['/admin/inventory','Inventory'],['/admin/customers','Customers'],['/admin/sales','Sales'],['/admin/inventory','Inventory again']]) {
    netA.reset();
    await softVisit(netA, a, route, label);
  }

  console.log('\n=== STEP 3: idle->expire->return->click (the real user pattern) ===');
  await expireStored(a, stored.key);
  await setVisibility(a, 'hidden'); await sleep(1000);
  console.log('  (token marked expired while backgrounded; now returning to tab)');
  netA.reset();
  await setVisibility(a, 'visible'); await sleep(500);
  await softVisit(netA, a, '/admin/sales-dashboard', 'Sales Dashboard (right after returning, token expired)');
  await softVisit(netA, a, '/admin/customers', 'Customers (next click)');

  console.log('\n=== STEP 4: Tab B opens (multi-tab, shared session) ===');
  const b = await ctx.newPage();
  const netB = instrument(b, 'B');
  await b.goto(`${APP}/admin/dashboard`, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  await softVisit(netB, b, '/admin/inventory', 'Tab B inventory');

  console.log('\n=== STEP 5: MULTI-TAB rotation race (rotate on A, then act on B past 10s reuse) ===');
  await expireStored(a, stored.key);
  netA.reset(); netB.reset();
  await a.bringToFront(); await setVisibility(a, 'visible'); await sleep(3000);
  console.log('  Tab A refresh attempt:', netA.since(0).filter(f=>/auth\/v1\/token/.test(f.url)).map(f=>`[${f.status}]`).join(',')||'(no token call seen)');
  const afterA = await readStoredSession(a);
  console.log('  storage expires_at after A:', afterA?.val?.expires_at, '(was', stored.val?.expires_at, ')');
  console.log('  >>> waiting 12s to pass refresh_token_reuse_interval=10 ...');
  await sleep(12000);
  await b.bringToFront(); await setVisibility(b, 'visible'); await sleep(300);
  await softVisit(netB, b, '/admin/sales', 'Tab B click AFTER A rotated + 12s');
  console.log('  Tab B url:', b.url());

  console.log('\n=== STEP 6: does a hard RELOAD fix Tab B instantly? ===');
  const tR = now(); netB.reset();
  await b.reload({ waitUntil: 'domcontentloaded' });
  await sleep(4500);
  const uiR = await uiState(b);
  console.log(`  reload: sb finished=${netB.since(tR).length} pending=${netB.pendingNow().length} spinners=${uiR.spinners} dataRows=${uiR.rows} url=${shortUrl(uiR.url)}`);

  await browser.close();
  console.log('\n=== DONE ===');
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
