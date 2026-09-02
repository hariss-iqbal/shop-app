/**
 * Builds a specs cache for every model in the catalog feed.
 *
 * Specs are fetched once and written to disk rather than scraped at post time:
 * posting stays fast, and a GSMArena outage or markup change can't block a post.
 * Re-run when new models are added.
 *
 * Run:
 *   FEED_FILE=~/Downloads/meta-catalog.csv npx tsx scripts/build-spec-cache.ts
 *   npx tsx scripts/build-spec-cache.ts            # fetches the feed over HTTP
 *
 * Output: scripts/out/model-specs.json  (keyed by uppercased model name)
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PhoneSpecsScraperService } from '../src/services/phone-specs-scraper.service';
// @ts-expect-error - plain JS module, no type declarations
import { fetchFeed, groupItems } from './feed-source.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_FILE = resolve(__dirname, 'out', 'model-specs.json');

interface CachedSpec {
  ram?: string;
  display?: string;
  camera?: string;
  battery?: string;
  chipset?: string;
  source?: string;
  fetchedAt: string;
}

async function main() {
  const scraper = new PhoneSpecsScraperService();
  const groups = groupItems(await fetchFeed());

  // One lookup per model, not per colour variant.
  const models = new Map<string, string>();
  for (const g of groups) if (!models.has(g.model)) models.set(g.model, g.brand);

  // Keep anything already cached, so a transient failure doesn't drop specs we
  // successfully fetched earlier.
  const cache: Record<string, CachedSpec> = existsSync(OUT_FILE)
    ? JSON.parse(readFileSync(OUT_FILE, 'utf8'))
    : {};

  let fetched = 0;
  const failed: string[] = [];

  for (const [model, brand] of models) {
    const result = await scraper.fetchSpecs(brand, model);

    if (!result.success || !result.data) {
      failed.push(`${brand} ${model}: ${result.error}`);
      continue;
    }

    const d = result.data;
    cache[model.toUpperCase()] = {
      // RAM comes back as options ([8, 12]); the highest is the one these
      // phones are actually sold as here. Flagged rather than silently picked.
      ram: d.ram?.length ? `${Math.max(...d.ram)}GB` : undefined,
      display: d.display,
      camera: d.camera,
      battery: d.battery,
      chipset: d.chipset,
      source: result.sourceUrl,
      fetchedAt: new Date().toISOString(),
    };
    fetched++;
    console.log(`✓ ${brand} ${model}`);
  }

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(cache, null, 2) + '\n', 'utf8');

  console.log(`\nwrote ${OUT_FILE}`);
  console.log(`  models in feed : ${models.size}`);
  console.log(`  fetched        : ${fetched}`);
  console.log(`  cached total   : ${Object.keys(cache).length}`);
  if (failed.length) {
    console.log(`  failed         : ${failed.length}`);
    failed.forEach(f => console.log(`    - ${f}`));
  }
}

main().catch(err => {
  console.error('Spec cache build failed:', err.message);
  process.exit(1);
});
