// Reproduce the production "stuck loading" by simulating real-world latency that
// localhost never has. Two probes:
//   PROBE 1: HANG the auth-token refresh. Every Supabase REST call calls getSession()
//            which waits on the auth lock with timeout -1 (indefinite). If a refresh
//            stalls, ALL data calls should pile up PENDING behind it -> the hang.
//            Also checks whether the 15s global fetch timeout eventually frees them.
//   PROBE 2: HANG one page's primary data request, then check if the component's
//            spinner ever clears (i.e., does the app recover, or stay stuck until reload?).
//
// Run:  node scripts/diag-slow.mjs
import { chromium } from 'playwright';

const APP = 'http://localhost:4200';
const EMAIL = 'admin@gmail.com';
const PASS = 'password123';
const isSb = (u) => /:54321\//.test(u) && !/^wss?:/.test(u) && !/\/realtime\//.test(u);
const isRefresh = (u) => /\/auth\/v1\/token/.test(u);
const shortUrl = (u) => u.replace(/^https?:\/\/[^/]+/, '').replace(/(\?.{0,32}).*/, '$1…');
const now = () => Date.now();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function instrument(page, tag) {
  const pending = new Map(); const finished = [];
  page.on('request', (r) => { if (isSb(r.url())) pending.set(r, { url: r.url(), start: now() }); });
  const close = (r, s) => { const e = pending.get(r); if (!e) return; pending.delete(r); finished.push({ url: e.url, status: s, ms: now()-e.start, end: now() }); };
  page.on('response', (resp) => close(resp.request(), resp.status()));
  page.on('requestfailed', (r) => { if (isSb(r.url())) { const e = pending.get(r); if (e){ pending.delete(r); finished.push({ url:e.url, status:'FAILED:'+(r.failure()?.errorText||'?'), ms: now()-e.start, end: now() }); } } });
  return {
    pendingNow: () => [...pending.values()].map((e)=>({url:shortUrl(e.url), ms: now()-e.start})),
    since: (t) => finished.filter(f=>f.end>=t),
    reset: () => { finished.length = 0; },
  };
}
async function login(page) {
  await page.goto(`${APP}/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[placeholder="admin@example.com"]').fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASS);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(/\/admin/, { timeout: 20000 }).catch(()=>{});
  await sleep(1200);
}
async function storedKey(page){ return page.evaluate(()=>{ for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i); if(k&&k.startsWith('sb-')&&k.endsWith('-auth-token'))return k;} return null; }); }
async function expire(page,key){ await page.evaluate((k)=>{const v=JSON.parse(localStorage.getItem(k)); v.expires_at=Math.floor(Date.now()/1000)-120; v.expires_in=0; localStorage.setItem(k,JSON.stringify(v));},key); }
async function ui(page){ return page.evaluate(()=>({spinners: document.querySelectorAll('.p-progressspinner,.p-progress-spinner,[role="progressbar"],.p-skeleton').length, rows: document.querySelectorAll('.p-datatable-tbody>tr,table tbody tr,p-card,.stat-card,.dashboard-card').length, loading: /(^|\n)\s*loading/i.test(document.body.innerText||'')})); }
async function softClick(page, route){ const l=page.locator(`a[href="${route}"]:visible`).first(); if(await l.count()) await l.click().catch(()=>{}); }

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  const net = instrument(page, 'P');

  console.log('=== login ===');
  await login(page);
  const key = await storedKey(page);
  console.log('  logged in, storage key:', key);

  // ---------------- PROBE 1: hang the refresh-token call ----------------
  console.log('\n=== PROBE 1: stall the auth-token refresh for 30s, then click around ===');
  let releaseHang;
  const hangGate = new Promise((res) => { releaseHang = res; });
  let refreshHits = 0;
  await ctx.route('**/auth/v1/token**', async (route) => {
    if (/grant_type=refresh_token/.test(route.request().url())) {
      refreshHits++;
      console.log(`  ⛔ intercepted refresh #${refreshHits} — holding it (simulating slow GoTrue)...`);
      await Promise.race([hangGate, sleep(30000)]); // hold up to 30s
      console.log('  ▶ releasing held refresh now');
    }
    await route.continue().catch(()=>{});
  });

  await expire(page, key);          // make the live client want to refresh
  net.reset();
  const t0 = now();
  // Trigger refresh + data load via a soft navigation:
  await softClick(page, '/admin/sales-dashboard');
  // Poll the pending set every 2s for 20s to watch the pile-up + 15s-timeout behaviour:
  for (let i = 1; i <= 10; i++) {
    await sleep(2000);
    const pend = net.pendingNow();
    const fin = net.since(t0);
    const refresh = fin.find(f=>isRefresh(f.url));
    console.log(`  t+${i*2}s: pending=${pend.length} [${pend.slice(0,4).map(p=>`${p.url} ${p.ms}ms`).join(', ')}${pend.length>4?` +${pend.length-4} more`:''}]`);
    if (refresh) console.log(`         refresh finished: [${refresh.status}] after ${refresh.ms}ms — data calls should now flow`);
    const u = await ui(page);
    if (i===5||i===10) console.log(`         UI spinners=${u.spinners} rows=${u.rows} loading=${u.loading} url=${page.url().replace(APP,'')}`);
  }
  console.log('  >>> releasing the held refresh to confirm recovery...');
  releaseHang();
  await sleep(4000);
  const uAfter = await ui(page);
  console.log(`  after release: pending=${net.pendingNow().length} UI spinners=${uAfter.spinners} rows=${uAfter.rows} url=${page.url().replace(APP,'')}`);
  await ctx.unroute('**/auth/v1/token**');

  // ---------------- PROBE 2: hang one page's primary data request ----------------
  console.log('\n=== PROBE 2: hang a data request (not auth); does the spinner ever clear? ===');
  let releaseData; const dataGate = new Promise((r)=>{releaseData=r;});
  let dataHits = 0;
  await ctx.route('**/rest/v1/customers**', async (route) => {
    dataHits++;
    console.log(`  ⛔ holding customers request #${dataHits} (simulating slow/stuck DB)...`);
    await Promise.race([dataGate, sleep(30000)]);
    await route.continue().catch(()=>{});
  });
  net.reset(); const t1 = now();
  await softClick(page, '/admin/customers');
  for (let i=1;i<=9;i++){
    await sleep(2000);
    const u = await ui(page);
    const pend = net.pendingNow().filter(p=>/customers/.test(p.url));
    console.log(`  t+${i*2}s: customers pending=${pend.length} (${pend.map(p=>p.ms+'ms').join(',')}) | UI spinners=${u.spinners} rows=${u.rows} loading=${u.loading}`);
  }
  console.log('  >>> releasing the held data request...');
  releaseData();
  await sleep(4000);
  const u2 = await ui(page);
  console.log(`  after release: UI spinners=${u2.spinners} rows=${u2.rows} loading=${u2.loading}`);
  console.log('  >>> now hard reload (the user workaround):');
  net.reset(); const tR=now();
  await ctx.unroute('**/rest/v1/customers**');
  await page.reload({ waitUntil:'domcontentloaded' }); await sleep(3500);
  const u3 = await ui(page);
  console.log(`  after reload: sb=${net.since(tR).length} UI spinners=${u3.spinners} rows=${u3.rows} url=${page.url().replace(APP,'')}`);

  await browser.close();
  console.log('\n=== DONE ===');
})().catch((e)=>{ console.error('FATAL', e); process.exit(1); });
