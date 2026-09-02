// Public Meta (Facebook / Instagram / WhatsApp) product-catalog data feed.
//
// Serves the live SmartCell catalog as a Meta-spec CSV at a stable URL so
// Commerce Manager can fetch it on a schedule — the catalog then self-updates
// as stock changes, with no manual re-uploads.
//
// Data source: the same `get_model_catalog` RPC the public site uses (one card
// per variant×color, color-correct image, in-stock only). Mirrors the one-off
// exporter at backend/scripts/export-meta-catalog.mjs.
//
// MUST be deployed public (no JWT) so Meta's crawler can fetch it:
//   supabase functions deploy meta-catalog --no-verify-jwt
// Then point Commerce Manager → catalog → Data sources → scheduled feed at:
//   https://<project-ref>.supabase.co/functions/v1/meta-catalog

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SITE = (Deno.env.get('SITE_BASE_URL') || 'https://www.smartcell.pk').replace(/\/$/, '');
const CURRENCY = Deno.env.get('CURRENCY') || 'PKR';

// Meta accepts new | refurbished | used. We map open_box -> refurbished.
const CONDITION_MAP: Record<string, string> = { new: 'new', open_box: 'refurbished', used: 'used' };
const PTA_LABEL: Record<string, string> = { pta_approved: 'PTA Approved', non_pta: 'Non-PTA' };
const COND_LABEL: Record<string, string> = { new: 'New', open_box: 'Open Box', used: 'Used' };
const GOOGLE_CATEGORY = 'Electronics > Communications > Telephony > Mobile Phones';

const HEADERS = [
  'id', 'title', 'description', 'availability', 'condition', 'price', 'link',
  'image_link', 'additional_image_link', 'brand', 'google_product_category',
  'color', 'quantity_to_sell_on_facebook', 'custom_label_0', 'custom_label_1', 'custom_label_2',
];

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function colorSlug(color: string | null): string {
  return (color || 'default').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// deno-lint-ignore no-explicit-any
function buildRow(r: any): Record<string, string | number> {
  const storage = r.storage_gb ? `${r.storage_gb}GB` : '';
  const colorTxt = r.color ? r.color : '';
  const ptaTxt = PTA_LABEL[r.pta_status] || '';
  const condTxt = COND_LABEL[r.condition] || '';

  const titleMain = [r.brand_name, r.model_name, storage, colorTxt].filter(Boolean).join(' ');
  const titleTail = [condTxt, ptaTxt].filter(Boolean).join(', ');
  const title = (titleTail ? `${titleMain} — ${titleTail}` : titleMain).slice(0, 200);

  const condEmoji = r.condition === 'new' ? '🆕' : r.condition === 'open_box' ? '📦' : '♻️';
  const ptaLine = r.pta_status === 'pta_approved' ? '✅ PTA: Approved'
    : r.pta_status === 'non_pta' ? '🔵 PTA: Non-PTA' : '';
  // One attribute per line, Friendly emoji style — renders in WhatsApp + catalog.
  const description = [
    `📲 ${r.brand_name} ${r.model_name}`.trim(),
    storage ? `💾 Storage: ${storage}` : '',
    colorTxt ? `🎨 Colour: ${colorTxt}` : '',
    condTxt ? `${condEmoji} Condition: ${condTxt}` : '',
    ptaLine,
    '🛵 Fast delivery nationwide 🇵🇰',
    '💬 Message us to order · smartcell.pk',
  ].filter(Boolean).join('\n').slice(0, 5000);

  const images: string[] = Array.isArray(r.image_urls) ? r.image_urls.filter(Boolean) : [];
  const primary = r.primary_image_url || images[0] || '';
  const additional = images.filter((u) => u !== primary).slice(0, 10).join(',');

  const link = `${SITE}/product/${encodeURIComponent(r.slug)}${
    r.color ? `?color=${encodeURIComponent(r.color)}` : ''
  }`;

  return {
    id: `${r.slug}-${colorSlug(r.color)}`.slice(0, 100),
    title,
    description,
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

Deno.serve(async (req: Request) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data, error } = await supabase.rpc('get_model_catalog', {
      p_brand_ids: null, p_conditions: null, p_storage_options: null,
      p_min_price: null, p_max_price: null, p_search: null, p_pta_status: null,
      p_sort_field: 'created_at', p_sort_order: -1, p_limit: 1000000, p_offset: 0,
    });
    if (error) throw error;

    const lines = [HEADERS.join(',')];
    let skipped = 0;
    for (const r of data ?? []) {
      if (!r.slug) { skipped++; continue; }
      const row = buildRow(r);
      if (!row.image_link) { skipped++; continue; } // Meta rejects imageless items
      lines.push(HEADERS.map((h) => csvEscape(row[h])).join(','));
    }

    return new Response(lines.join('\n') + '\n', {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        // Let Meta (and CDNs) cache briefly; feed is regenerated each fetch.
        'Cache-Control': 'public, max-age=300',
        'X-Catalog-Exported': String(lines.length - 1),
        'X-Catalog-Skipped': String(skipped),
      },
    });
  } catch (e) {
    return new Response(`Feed error: ${e instanceof Error ? e.message : String(e)}`, { status: 500 });
  }
});
