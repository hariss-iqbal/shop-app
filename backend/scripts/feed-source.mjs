/**
 * Reads the live Meta catalog feed as a post source.
 *
 * Why the feed and not the database: it's public (no prod credentials needed),
 * it's the same data Commerce Manager shows, and — unlike the local dev DB —
 * it carries real Cloudinary product photos.
 *
 * Feed: supabase/functions/meta-catalog/index.ts
 */

const DEFAULT_FEED_URL =
  process.env.FEED_URL ||
  'https://dgatqyxfpvocoyinpshg.supabase.co/functions/v1/meta-catalog';

/**
 * RFC4180 CSV parser. A naive split on newlines does NOT work here: the feed's
 * description column contains literal newlines inside quoted fields.
 */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }  // escaped quote
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n') {
      row.push(field); rows.push(row); row = []; field = '';
    } else if (c !== '\r') {
      field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/**
 * Reads the feed, from FEED_FILE if set, otherwise over HTTP.
 *
 * FEED_FILE exists because the feed is served through Cloudflare, which will
 * rate-limit or block a host that pulls it repeatedly — and a blocked fetch
 * shouldn't stop you posting. Save the CSV locally and point FEED_FILE at it.
 */
export async function fetchFeed(url = DEFAULT_FEED_URL) {
  let text;

  if (process.env.FEED_FILE) {
    const { readFile } = await import('node:fs/promises');
    text = await readFile(process.env.FEED_FILE, 'utf8');
  } else {
    const res = await fetch(url).catch(e => {
      throw new Error(
        `Feed fetch failed (${e.message}). If this host can't reach the feed, ` +
        `download the CSV and re-run with FEED_FILE=/path/to/meta-catalog.csv`
      );
    });
    if (!res.ok) throw new Error(`Feed fetch failed: HTTP ${res.status} from ${url}`);
    text = await res.text();
  }

  const rows = parseCsv(text);
  if (!rows.length) throw new Error('Feed returned no rows.');

  const header = rows[0];
  return rows
    .slice(1)
    .filter(r => r.length === header.length)
    .map(r => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

/** "155000 PKR" -> 155000 */
function priceNumber(price) {
  const n = Number(String(price ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? Math.round(n) : 0;
}

/**
 * Derives the bare model name from a feed title by stripping the parts the
 * template renders on their own lines.
 *
 *   "Google Pixel 9 Pro 128GB Obsidian — Used, Non-PTA"  ->  "PIXEL 9 PRO"
 *
 * Falls back to the whole title if stripping leaves nothing, so a title in an
 * unexpected shape degrades to something readable rather than empty.
 */
export function modelFromTitle(item) {
  let s = String(item.title || '').split('—')[0].trim();

  for (const part of [item.brand, item.custom_label_2, item.color]) {
    if (!part) continue;
    s = s.replace(new RegExp(`\\b${part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'ig'), ' ');
  }
  s = s.replace(/\s{2,}/g, ' ').trim();
  return (s || item.title || '').toUpperCase();
}

/**
 * The shop's card format, rendered from a feed item. Mirrors cardPost() in
 * generate-fb-posts.mjs and the admin dialog's template.
 */
const CONDITION_TEXT = { New: 'Brand New', 'Open Box': 'Open Box', Used: 'Used' };

/**
 * Caption for a grouped product.
 *
 * `specs` is an optional per-model record (see model-specs.json). Only the
 * fields present are printed, so a model missing from that file simply posts
 * without spec lines rather than printing blanks or wrong values.
 *
 * No stock line by design: stock moves and a post doesn't, so any count is a
 * promise that goes stale.
 */
export function groupCard(group, specs = null, { whatsapp = '', includeLink = true } = {}) {
  const lines = [];

  lines.push(`📱 ${[group.brand, group.model].filter(Boolean).join(' ').toUpperCase()}`);

  const memory = [group.storage, specs?.ram ? `${specs.ram} RAM` : ''].filter(Boolean).join(' · ');
  if (memory) lines.push(`💾 ${memory}`);
  if (specs?.display) lines.push(`🖥️ ${specs.display}`);
  if (specs?.camera) lines.push(`📸 ${specs.camera}`);
  if (specs?.battery) lines.push(`🔋 ${specs.battery}`);
  if (specs?.chipset) lines.push(`⚡ ${specs.chipset}`);

  lines.push('');
  if (group.colors.length) lines.push(`🎨 Available Colours: ${group.colors.join(' · ')}`);

  const state = [
    CONDITION_TEXT[group.condition] || group.condition,
    group.pta,
  ].filter(Boolean).join(' · ');
  if (state) lines.push(`📦 ${state}`);
  lines.push('🔓 OEM Unlocked · Non Active');
  lines.push('✅ 100% Original');

  lines.push('');
  lines.push(`💰 ${group.price >= 1000 ? `${Math.round(group.price / 1000)}K` : group.price} CASH`);

  lines.push('');
  lines.push('🚚 Delivery all over Pakistan 🇵🇰');
  if (whatsapp) lines.push(`💬 WhatsApp: ${whatsapp}`);
  if (includeLink && group.link) lines.push(`🛒 ${group.link}`);

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function feedCard(item, { includeLink = true } = {}) {
  const stock = Number(item.quantity_to_sell_on_facebook) || 0;
  const price = priceNumber(item.price);

  const card = [
    modelFromTitle(item),
    (item.custom_label_2 || '').toUpperCase(),
    'NON ACTIVE',
    'OEM UNLOCKED',
    '100% ORIGINAL PHONES',
    stock > 0 ? `LAST ${stock} ${stock === 1 ? 'PIECE' : 'PIECES'} LEFT` : '',
    `${price >= 1000 ? `${Math.round(price / 1000)}K` : price} CASH`,
  ].filter(l => l.trim().length > 0);

  // The product URL goes in the caption rather than as a link attachment:
  // the site serves no Open Graph tags, so a link post would render a bare card
  // with no image. In the caption it stays clickable and the photo is native.
  if (includeLink && item.link) card.push('', `🛒 ${item.link}`);

  return card.join('\n');
}

/**
 * Groups feed rows into one post per product.
 *
 * The feed emits one row per variant×colour, but colours of the same
 * model/storage/condition/PTA are one product to a customer — so they become a
 * single post listing the available colours, with one photo per colour.
 *
 * Group key is the product URL with the ?color= parameter stripped, which is
 * exactly the shop's own notion of a product.
 */
export function groupItems(items) {
  const groups = new Map();

  for (const it of items) {
    const key = (it.link || it.id || '').split('?')[0];
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        link: key,
        model: modelFromTitle(it),
        brand: it.brand || '',
        storage: it.custom_label_2 || '',
        condition: it.custom_label_1 || '',
        pta: it.custom_label_0 || '',
        price: priceNumber(it.price),
        colors: [],
        images: [],
      });
    }
    const g = groups.get(key);
    if (it.color && !g.colors.includes(it.color)) g.colors.push(it.color);
    if (it.image_link && !g.images.includes(it.image_link)) g.images.push(it.image_link);
    // Defensive: if colours of one product ever carry different prices, show the
    // lowest so the post never advertises less than the customer will be quoted.
    const p = priceNumber(it.price);
    if (p && p < g.price) g.price = p;
  }

  return [...groups.values()];
}

/** Picks one item by feed id, or the first in-stock item when id is omitted. */
export function pickItem(items, id) {
  if (id) {
    const hit = items.find(i => i.id === id);
    if (!hit) throw new Error(`No feed item with id "${id}". Run with --list to see ids.`);
    return hit;
  }
  const inStock = items.find(
    i => i.availability === 'in stock' && Number(i.quantity_to_sell_on_facebook) > 0 && i.image_link
  );
  if (!inStock) throw new Error('No in-stock feed item with an image.');
  return inStock;
}
