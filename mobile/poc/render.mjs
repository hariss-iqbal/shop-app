import { chromium } from '/Users/haris/IdeaProjects/general-project-maker/projects/shop-app/frontend/node_modules/playwright/index.mjs';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 880, height: 900 }, deviceScaleFactor: 2 });
await p.goto('file://' + process.cwd() + '/device-out-poc.html', { waitUntil: 'networkidle' });
await p.screenshot({ path: '/tmp/device-out-poc.png', fullPage: true });
await b.close();
console.log('done');
