/**
 * Export a Meta (Facebook / Instagram / WhatsApp) Product Catalog feed as CSV.
 *
 * One catalog → one CSV file → powers Facebook Shop, Instagram Shop, the
 * WhatsApp Business catalog, and Advantage+ catalog ads. Upload this file in
 * Meta Commerce Manager (Catalog → Data sources → Add items → Data feed →
 * Upload file), or host it at a stable URL and let Meta re-fetch on a schedule.
 *
 * Data source: the same `get_model_catalog` RPC the public site uses, so the
 * feed always matches what customers see on smartcell.pk (active, in-stock,
 * color-correct images, one card per variant + color).
 *
 * Run (local):
 *   cd backend && node scripts/export-meta-catalog.mjs
 *
 * Run (against another DB, e.g. read-only prod):
 *   SUPABASE_DB_URL='postgresql://USER:PASS@HOST:PORT/postgres' \
 *     node scripts/export-meta-catalog.mjs
 *
 * Output: backend/scripts/out/smartcell-meta-catalog.csv (override with OUT_FILE=...)
 */

import pg from 'pg';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const { Client } = pg;

const DB_URL =
  process.env.SUPABASE_DB_URL ||
  'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

const SITE = (process.env.SITE_BASE_URL || 'https://www.smartcell.pk').replace(/\/$/, '');
const CURRENCY = process.env.CURRENCY || 'PKR';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_FILE = process.env.OUT_FILE
  ? resolve(process.env.OUT_FILE)
  : resolve(__dirname, 'out', 'smartcell-meta-catalog.csv');

// Meta accepts: new | refurbished | used. We map open_box -> refurbished.
const CONDITION_MAP = { new: 'new', open_box: 'refurbished', used: 'used' };

// Human-friendly bits for titles/descriptions.
const PTA_LABEL = { pta_approved: 'PTA Approved', non_pta: 'Non-PTA' };
const COND_LABEL = { new: 'New', open_box: 'Open Box', used: 'Used' };

// Google product taxonomy: Mobile Phones (id 267). Meta accepts the path too.
const GOOGLE_CATEGORY = 'Electronics > Communications > Telephony > Mobile Phones';

// Columns in Meta's data-feed spec order. Required by Meta: id, title,
// description, availability, condition, price, link, image_link, brand.
const HEADERS = [
  'id',
  'title',
  'description',
  'availability',
  'condition',
  'price',
  'link',
  'image_link',
  'additional_image_link',
  'brand',
  'google_product_category',
  'color',
  'quantity_to_sell_on_facebook',
  'custom_label_0', // pta status
  'custom_label_1', // condition
  'custom_label_2', // storage
];

function csvEscape(value) {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function colorSlug(color) {
  return (color || 'default')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildRow(r) {
  const storage = r.storage_gb ? `${r.storage_gb}GB` : '';
  const colorTxt = r.color ? r.color : '';
  const ptaTxt = PTA_LABEL[r.pta_status] || '';
  const condTxt = COND_LABEL[r.condition] || '';

  // Title (<=200 chars): "Apple iPhone 15 Pro 256GB Obsidian — Used, PTA Approved"
  const titleMain = [r.brand_name, r.model_name, storage, colorTxt]
    .filter(Boolean)
    .join(' ');
  const titleTail = [condTxt, ptaTxt].filter(Boolean).join(', ');
  const title = (titleTail ? `${titleMain} — ${titleTail}` : titleMain).slice(0, 200);

  // Description (required, non-empty) — one attribute per line, Friendly emoji style.
  const condEmoji = r.condition === 'new' ? '🆕' : r.condition === 'open_box' ? '📦' : '♻️';
  const ptaLine = r.pta_status === 'pta_approved' ? '✅ PTA: Approved'
    : r.pta_status === 'non_pta' ? '🔵 PTA: Non-PTA' : '';
  const description = [
    `📲 ${r.brand_name} ${r.model_name}`.trim(),
    storage ? `💾 Storage: ${storage}` : '',
    colorTxt ? `🎨 Colour: ${colorTxt}` : '',
    condTxt ? `${condEmoji} Condition: ${condTxt}` : '',
    ptaLine,
    '🛵 Fast delivery nationwide 🇵🇰',
    '💬 Message us to order · smartcell.pk',
  ].filter(Boolean).join('\n');

  const images = Array.isArray(r.image_urls) ? r.image_urls.filter(Boolean) : [];
  const primary = r.primary_image_url || images[0] || '';
  const additional = images.filter((u) => u !== primary).slice(0, 10).join(',');

  const link = `${SITE}/product/${encodeURIComponent(r.slug)}${
    r.color ? `?color=${encodeURIComponent(r.color)}` : ''
  }`;

  return {
    id: `${r.slug}-${colorSlug(r.color)}`.slice(0, 100),
    title,
    description: description.slice(0, 5000),
    availability: r.stock_count > 0 ? 'in stock' : 'out of stock',
    condition: CONDITION_MAP[r.condition] || 'used',
    price: `${Math.round(Number(r.selling_price))} ${CURRENCY}`,
    link,
    image_link: primary,
    additional_image_link: additional,
    brand: r.brand_name || '',
    google_product_category: GOOGLE_CATEGORY,
    color: colorTxt,
    quantity_to_sell_on_facebook: r.stock_count ?? 0,
    custom_label_0: ptaTxt,
    custom_label_1: condTxt,
    custom_label_2: storage,
  };
}

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  // Pull the entire catalog in one shot (huge limit, no filters).
  const { rows } = await client.query(
    `SELECT * FROM get_model_catalog(
       NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'created_at', -1, 1000000, 0
     )`
  );
  await client.end();

  const total = rows.length;
  const usable = [];
  let skippedNoImage = 0;
  let skippedNoSlug = 0;

  for (const r of rows) {
    if (!r.slug) {
      skippedNoSlug++;
      continue;
    }
    const row = buildRow(r);
    if (!row.image_link) {
      // Meta rejects items without an image_link — skip and report (no silent drop).
      // ALLOW_NO_IMAGE=1 keeps them (with a placeholder) for previewing the CSV
      // format against local/seed data that has no Cloudinary images yet.
      if (process.env.ALLOW_NO_IMAGE) {
        row.image_link = process.env.PLACEHOLDER_IMAGE || `${SITE}/assets/no-image.png`;
      } else {
        skippedNoImage++;
        continue;
      }
    }
    usable.push(row);
  }

  const lines = [HEADERS.join(',')];
  for (const row of usable) {
    lines.push(HEADERS.map((h) => csvEscape(row[h])).join(','));
  }

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, lines.join('\n') + '\n', 'utf8');

  console.log(`Meta catalog feed written: ${OUT_FILE}`);
  console.log(`  catalog rows (variant×color): ${total}`);
  console.log(`  exported:                     ${usable.length}`);
  if (skippedNoSlug) console.log(`  skipped (no slug):            ${skippedNoSlug}`);
  if (skippedNoImage) console.log(`  skipped (no image):           ${skippedNoImage}`);
}

main().catch((err) => {
  console.error('Export failed:', err.message);
  process.exit(1);
});
