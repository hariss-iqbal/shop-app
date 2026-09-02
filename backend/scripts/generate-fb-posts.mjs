/**
 * Generate ready-to-paste Facebook Page post text from the live catalog.
 *
 * Patterns (params):
 *   node scripts/generate-fb-posts.mjs all          → one post listing every in-stock phone
 *   node scripts/generate-fb-posts.mjs new  [N=8]   → latest N arrivals
 *   node scripts/generate-fb-posts.mjs top  [N=8]   → top N by price (flagships)
 *   node scripts/generate-fb-posts.mjs single [i=0] → full detailed post for one phone (index i)
 *
 * Data source: get_model_catalog RPC (same as the site/feed). Point at prod:
 *   SUPABASE_DB_URL='postgresql://...pooler...' node scripts/generate-fb-posts.mjs all
 *
 * Composition is exported (fetchRows / buildPost) so post-to-facebook.mjs can
 * publish the exact same text via the Graph API instead of copy-paste.
 */

import pg from 'pg';
import { pathToFileURL } from 'node:url';
const { Client } = pg;

const DB_URL = process.env.SUPABASE_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const WHATSAPP = process.env.WHATSAPP || '0339-4159269';

const PTA = { pta_approved: 'Official PTA', non_pta: 'Non-PTA' };
const COND = { new: 'New', open_box: 'Open Box', used: 'Used' };
const COND_EMOJI = { new: '🆕', open_box: '📦', used: '♻️' };

const priceK = (p) => `${Math.round(Number(p) / 1000)}k`;
const priceFull = (p) => `PKR ${Math.round(Number(p)).toLocaleString('en-PK')}`;

const FOOTER = `\n🛵 Delivery all over Pakistan 🇵🇰\n💬 Order on WhatsApp: ${WHATSAPP}\n🛒 smartcell.pk`;

// Compact one-line entry, e.g. "Pixel 9 · Official PTA · 256GB · Peony · Used — 250k"
function line(r) {
  const parts = [
    r.model_name,
    PTA[r.pta_status],
    r.storage_gb ? `${r.storage_gb}GB` : null,
    r.color,
    r.condition !== 'new' ? COND[r.condition] : null,
  ].filter(Boolean);
  return `• ${parts.join(' · ')} — ${priceK(r.selling_price)}`;
}

// Full detailed post for a single phone (mirrors the catalog/WhatsApp listing).
function singlePost(r) {
  return [
    `🔥 In Stock at SmartCell`,
    ``,
    `📲 ${r.brand_name} ${r.model_name}`,
    `💾 Storage: ${r.storage_gb}GB`,
    `🎨 Colour: ${r.color}`,
    `${COND_EMOJI[r.condition]} Condition: ${COND[r.condition]}`,
    `${r.pta_status === 'pta_approved' ? '✅ PTA: Approved' : '🔵 PTA: Non-PTA'}`,
    `💰 ${priceFull(r.selling_price)}`,
    FOOTER,
    ``,
    `#SmartCell #${r.brand_name} #${r.pta_status === 'pta_approved' ? 'PTAApproved' : 'NonPTA'} #MobilePhonesPakistan`,
  ].join('\n');
}

function listPost(title, items) {
  return [`📱 SmartCell — ${title} 🇵🇰`, ``, ...items.map(line), FOOTER].join('\n');
}

/**
 * The shop's standard card format — the same template the admin post dialog
 * renders (frontend/src/app/core/services/fb-post-template.service.ts). Kept in
 * sync by hand; if you change one, change the other.
 *
 * RAM has no column on `variants`, so that line degrades to storage only.
 * The stock line is dropped at 0 rather than advertising an unavailable phone.
 */
export function cardPost(r) {
  const stock = Number(r.stock_count) || 0;
  const price = Math.round(Number(r.selling_price));
  const lines = [
    String(r.model_name || '').toUpperCase(),
    r.storage_gb ? `${r.storage_gb}GB` : '',
    'NON ACTIVE',
    'OEM UNLOCKED',
    '100% ORIGINAL PHONES',
    stock > 0 ? `LAST ${stock} ${stock === 1 ? 'PIECE' : 'PIECES'} LEFT` : '',
    `${price >= 1000 ? `${Math.round(price / 1000)}K` : price} CASH`,
  ];
  return lines.filter(l => l.trim().length > 0).join('\n');
}

export async function fetchRows(dbUrl = DB_URL) {
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  try {
    const { rows } = await client.query(
      `SELECT brand_name, model_name, storage_gb, pta_status, condition, color,
              selling_price, stock_count, slug, newest_created_at
         FROM get_model_catalog(NULL,NULL,NULL,NULL,NULL,NULL,NULL,'created_at',-1,1000000,0)`
    );
    return rows;
  } finally {
    await client.end();
  }
}

// mode: all | new | top | single. Throws on an unknown mode or empty catalog.
export function buildPost(mode, rows, arg) {
  if (!rows.length) throw new Error('Catalog returned 0 rows — nothing to post.');

  if (mode === 'all') return listPost('Available Stock', rows);

  if (mode === 'new') {
    const n = Number(arg) || 8;
    const sorted = [...rows].sort((a, b) => new Date(b.newest_created_at) - new Date(a.newest_created_at));
    return listPost('New Arrivals', sorted.slice(0, n));
  }

  if (mode === 'top') {
    const n = Number(arg) || 8;
    const sorted = [...rows].sort((a, b) => Number(b.selling_price) - Number(a.selling_price));
    return listPost('Top Picks', sorted.slice(0, n));
  }

  if (mode === 'single') {
    const i = Number(arg) || 0;
    if (!rows[i]) throw new Error(`No catalog row at index ${i} (have ${rows.length}).`);
    return singlePost(rows[i]);
  }

  // `card <slug>` — the shop's standard card format for one specific phone.
  // Matched by slug (not index) so a catalog reorder can't silently post the
  // wrong phone. Colour-specific rows share a slug; the first in-stock one wins.
  if (mode === 'card') {
    if (!arg) throw new Error('card mode needs a slug, e.g. `card pixel-9-pro-xl-512gb`');
    const matches = rows.filter(r => r.slug === arg);
    if (!matches.length) throw new Error(`No catalog row with slug "${arg}".`);
    return cardPost(matches.find(r => Number(r.stock_count) > 0) ?? matches[0]);
  }

  throw new Error(`Unknown mode "${mode}". Use: all | new | top | single | card`);
}

async function main() {
  const rows = await fetchRows();
  console.log(buildPost((process.argv[2] || 'all').toLowerCase(), rows, process.argv[3]));
}

// Only run when executed directly, so importing this module has no side effects.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error('Failed:', e.message);
    process.exit(1);
  });
}
