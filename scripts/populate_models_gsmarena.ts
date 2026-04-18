/**
 * Populate the models table using GSM Arena API for canonical model names.
 *
 * Prerequisites:
 *   1. Local Supabase running (postgresql://postgres:postgres@127.0.0.1:54322/postgres)
 *   2. API server running: cd backend && npm run api-server
 *
 * Run: cd backend && npx ts-node --skip-project ../scripts/populate_models_gsmarena.ts
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Client } = require('pg');

const DB_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const API_URL = 'http://localhost:3001/api/products/fetch-specs';
const DELAY_MS = 2500; // 2.5s between API calls

// Suffixes to strip when GSM Arena doesn't return a name
const STRIP_SUFFIXES = [
  /\s+official$/i,
  /\s+non[- ]?pta$/i,
  /\s+cpid$/i,
  /\s+simple\s+cpid$/i,
  /\s+box\s+pack$/i,
  /\s+128gb\/256gb$/i,
  /\s+128gb$/i,
  /\s+256gb$/i,
  /\s+256$/i,
  /\s+pta$/i,
  /\s+official\s+pta$/i,
];

function cleanModelName(name: string): string {
  let cleaned = name.trim();
  for (const pattern of STRIP_SUFFIXES) {
    cleaned = cleaned.replace(pattern, '').trim();
  }
  return cleaned || name.trim();
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchCanonicalName(brand: string, model: string): Promise<string | null> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand, model: cleanModelName(model) }),
    });
    const result = await response.json() as any;
    if (result?.success && result?.data?.modelName) {
      return result.data.modelName as string;
    }
    return null;
  } catch (error) {
    console.error(`  [API Error] ${brand} ${model}:`, (error as Error).message);
    return null;
  }
}

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  console.log('[DB] Connected');

  // Get distinct models from products
  const { rows: products } = await client.query(`
    SELECT DISTINCT p.brand_id, p.model, b.name as brand_name
    FROM products p
    JOIN brands b ON p.brand_id = b.id
    ORDER BY b.name, p.model
  `);

  console.log(`[Models] Found ${products.length} distinct product models\n`);

  let inserted = 0;
  let apiHits = 0;
  let fallbacks = 0;

  for (const product of products) {
    const { brand_id, model, brand_name } = product;

    // Try GSM Arena API
    console.log(`[${brand_name}] "${model}" → fetching from GSM Arena...`);
    const canonicalName = await fetchCanonicalName(brand_name, model);
    apiHits++;

    let finalName: string;
    if (canonicalName) {
      finalName = canonicalName;
      console.log(`  ✓ GSM Arena: "${finalName}"`);
    } else {
      finalName = cleanModelName(model);
      fallbacks++;
      console.log(`  ✗ API failed, using cleaned name: "${finalName}"`);
    }

    // Insert into models table
    const { rows } = await client.query(
      `INSERT INTO models (brand_id, name) VALUES ($1, $2)
       ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [brand_id, finalName]
    );
    const modelId = rows[0].id;

    // Update products with this model_id
    const { rowCount } = await client.query(
      `UPDATE products SET model_id = $1 WHERE brand_id = $2 AND model = $3`,
      [modelId, brand_id, model]
    );
    console.log(`  → model_id=${modelId.substring(0, 8)}... (${rowCount} products updated)`);
    inserted++;

    // Rate limit
    if (apiHits < products.length) {
      await sleep(DELAY_MS);
    }
  }

  // Verify
  const { rows: [{ count: nullCount }] } = await client.query(
    `SELECT count(*) FROM products WHERE model_id IS NULL`
  );
  const { rows: [{ count: modelCount }] } = await client.query(
    `SELECT count(*) FROM models`
  );

  console.log(`\n[Done]`);
  console.log(`  Models inserted: ${modelCount}`);
  console.log(`  Products updated: ${inserted}`);
  console.log(`  API hits: ${apiHits} (${fallbacks} fallbacks)`);
  console.log(`  Products with NULL model_id: ${nullCount}`);

  if (parseInt(nullCount) > 0) {
    console.warn(`\n⚠️  WARNING: ${nullCount} products still have NULL model_id!`);
  }

  await client.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
