/**
 * Populate the models table using GSM Arena API for canonical model names.
 * Run: cd backend && node ../scripts/populate_models_gsmarena.mjs
 */

import pg from 'pg';
const { Client } = pg;

const DB_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const API_URL = 'http://localhost:3001/api/products/fetch-specs';
const DELAY_MS = 2500;

const STRIP_SUFFIXES = [
  /\s+official\s+pta$/i,
  /\s+official$/i,
  /\s+non[- ]?pta$/i,
  /\s+simple\s+cpid$/i,
  /\s+cpid$/i,
  /\s+box\s+pack$/i,
  /\s+128gb\/256gb$/i,
  /\s+128gb$/i,
  /\s+256gb$/i,
  /\s+256$/i,
  /\s+pta$/i,
];

function cleanModelName(name) {
  let cleaned = name.trim();
  for (const pattern of STRIP_SUFFIXES) {
    cleaned = cleaned.replace(pattern, '').trim();
  }
  return cleaned || name.trim();
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchCanonicalName(brand, model) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand, model: cleanModelName(model) }),
    });
    const result = await response.json();
    if (result?.success && result?.data?.modelName) {
      return result.data.modelName;
    }
    return null;
  } catch (error) {
    console.error(`  [API Error] ${brand} ${model}:`, error.message);
    return null;
  }
}

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  console.log('[DB] Connected');

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

  for (let i = 0; i < products.length; i++) {
    const { brand_id, model, brand_name } = products[i];

    console.log(`[${i + 1}/${products.length}] ${brand_name} "${model}" → fetching...`);
    const canonicalName = await fetchCanonicalName(brand_name, model);
    apiHits++;

    let finalName;
    if (canonicalName) {
      finalName = canonicalName;
      console.log(`  ✓ GSM Arena: "${finalName}"`);
    } else {
      finalName = cleanModelName(model);
      fallbacks++;
      console.log(`  ✗ Fallback: "${finalName}"`);
    }

    const { rows } = await client.query(
      `INSERT INTO models (brand_id, name) VALUES ($1, $2)
       ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [brand_id, finalName]
    );
    const modelId = rows[0].id;

    const { rowCount } = await client.query(
      `UPDATE products SET model_id = $1 WHERE brand_id = $2 AND model = $3`,
      [modelId, brand_id, model]
    );
    console.log(`  → model_id=${modelId.substring(0, 8)}... (${rowCount} products)\n`);
    inserted++;

    if (i < products.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  const { rows: [{ count: nullCount }] } = await client.query(
    `SELECT count(*) FROM products WHERE model_id IS NULL`
  );
  const { rows: [{ count: modelCount }] } = await client.query(
    `SELECT count(*) FROM models`
  );

  console.log(`\n========== DONE ==========`);
  console.log(`  Models created: ${modelCount}`);
  console.log(`  Products updated: ${inserted}`);
  console.log(`  API hits: ${apiHits} (${fallbacks} fallbacks)`);
  console.log(`  NULL model_id: ${nullCount}`);

  await client.end();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
