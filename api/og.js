/**
 * Social link-preview renderer for /product/:slug
 *
 * The storefront is a client-side Angular SPA: every URL is rewritten to the
 * static index.html, and SeoService only fills in the real meta tags AFTER
 * Angular boots. Social crawlers (WhatsApp, Facebook, Twitter, Slack, ...) do
 * not execute JavaScript, so a shared product link previewed as the generic
 * index.html title/description with no image at all.
 *
 * vercel.json routes /product/* here ONLY for crawler user agents, so human
 * traffic keeps getting the plain static SPA with no added latency. This
 * function looks the product up server-side and returns index.html with real
 * Open Graph / Twitter tags injected at the top of <head>.
 *
 * Fail-soft by design: any lookup problem falls back to serving the untouched
 * index.html, which is exactly the pre-existing behaviour.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dgatqyxfpvocoyinpshg.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnYXRxeXhmcHZvY295aW5wc2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTYzNTQsImV4cCI6MjA4NTI5MjM1NH0.oNHOwCQ2HlllocQ0hsjVPTJD5qt-KoRZvzaQT8eWfME';

const DEFAULT_SHOP_NAME = 'Phone Shop';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Matched against the incoming User-Agent. Casing here mirrors what each bot
 * actually sends (WhatsApp/2.x, facebookexternalhit/1.1, Twitterbot/1.0, ...),
 * and must stay in sync with the `has` condition in vercel.json.
 */
const CRAWLER_REGEX =
  /facebookexternalhit|facebookcatalog|WhatsApp|Twitterbot|Slackbot|Slack-ImgProxy|LinkedInBot|Discordbot|TelegramBot|Pinterest|redditbot|Applebot|SkypeUriPreview|Viber|Line\//i;

// Mirrors ProductConditionLabels in frontend/src/app/enums/product-condition.enum.ts
const CONDITION_LABELS = {
  new: 'New',
  used: 'Used',
  open_box: 'Open Box'
};

module.exports = async (req, res) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'www.smartcell.pk';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const origin = `${proto}://${host}`;

  const query = req.query || {};
  const slug = typeof query.slug === 'string' ? query.slug : '';
  const color = typeof query.color === 'string' ? query.color : '';

  const shell = await fetchShell(origin);

  // Belt and braces: the vercel.json `has` condition should already have kept
  // real browsers away, but never hand a human a crawler-shaped response.
  if (!CRAWLER_REGEX.test(req.headers['user-agent'] || '')) {
    return sendHtml(res, shell || minimalShell(origin), 'no-store');
  }

  let preview = null;
  try {
    preview = await buildPreview(slug, color, origin);
  } catch (err) {
    console.error('[og] preview build failed for slug=%s: %s', slug, err && err.message);
  }

  if (!preview) {
    return sendHtml(res, shell || minimalShell(origin), 'public, s-maxage=60');
  }

  const tags = renderTags(preview);
  const html = shell ? injectTags(shell, tags) : minimalShell(origin, tags, preview.title);

  return sendHtml(res, html, 'public, s-maxage=600, stale-while-revalidate=86400');
};

/* ── Product lookup ── */

async function buildPreview(slug, color, origin) {
  if (!slug) return null;

  const [variantResult, shop] = await Promise.all([
    supabase('rpc/get_variant_by_slug', {
      method: 'POST',
      body: JSON.stringify({ p_slug: slug })
    }).catch(() => null),
    supabase('shop_details?select=shop_name,currency_code,currency_locale,currency_decimals&limit=1')
      .then(rows => (Array.isArray(rows) ? rows[0] : null))
      .catch(() => null)
  ]);

  const shopName = (shop && shop.shop_name) || DEFAULT_SHOP_NAME;
  const currency = {
    code: (shop && shop.currency_code) || 'PKR',
    locale: (shop && shop.currency_locale) || 'en-PK',
    decimals: shop && typeof shop.currency_decimals === 'number' ? shop.currency_decimals : 0
  };

  if (variantResult && variantResult.found) {
    return fromVariant(variantResult, slug, color, origin, shopName, currency);
  }

  // Backward compat: older shared links used the raw product UUID.
  if (UUID_REGEX.test(slug)) {
    return fromProductId(slug, origin, shopName, currency);
  }

  return null;
}

function fromVariant(result, slug, color, origin, shopName, currency) {
  const variant = result.variant;
  const images = Array.isArray(result.images) ? result.images : [];

  return supabaseProductsForVariant(variant.id).then(products => {
    // Mirrors ProductDetailComponent.findAvailableProduct: prefer the colour
    // from the query string, otherwise the cheapest available product.
    let product = null;
    if (color) {
      product = products.find(p => (p.color || '').toLowerCase() === color.toLowerCase()) || null;
    }
    if (!product) product = products[0] || null;

    const activeColor = (product && product.color) || color || '';
    const imageUrl = pickImage(images, activeColor) || variant.primaryImageUrl;

    const brand = variant.brandName || '';
    const model = variant.modelName || '';
    const storagePart = variant.storageGb ? ` ${variant.storageGb}GB` : '';
    const condition = CONDITION_LABELS[variant.condition] || variant.condition || '';
    const price = Number((product && product.selling_price) ?? variant.sellingPrice ?? 0);

    const canonical =
      `${origin}/product/${encodeURIComponent(slug)}` +
      (activeColor ? `?color=${encodeURIComponent(activeColor)}` : '');

    return {
      title: `${brand} ${model}${storagePart}`.trim(),
      shopName,
      description: buildDescription(`${brand} ${model}`.trim(), storagePart, condition, price, currency),
      imageUrl,
      canonical,
      price,
      currency: currency.code,
      inStock: products.length > 0
    };
  });
}

async function fromProductId(id, origin, shopName, currency) {
  const rows = await supabase(
    `products?select=id,color,selling_price,condition,storage_gb,model,brand:brands!brand_id(name),phone_model:models!model_id(name),images:product_images(image_url,is_primary,display_order)&id=eq.${encodeURIComponent(id)}&limit=1`
  ).catch(() => null);

  const product = Array.isArray(rows) ? rows[0] : null;
  if (!product) return null;

  const brand = (product.brand && product.brand.name) || '';
  const model = (product.phone_model && product.phone_model.name) || product.model || '';
  const storagePart = product.storage_gb ? ` ${product.storage_gb}GB` : '';
  const condition = CONDITION_LABELS[product.condition] || product.condition || '';
  const price = Number(product.selling_price || 0);

  const productImages = Array.isArray(product.images) ? product.images : [];
  const primary =
    productImages.find(img => img.is_primary) ||
    productImages.slice().sort((a, b) => (a.display_order || 0) - (b.display_order || 0))[0];

  return {
    title: `${brand} ${model}${storagePart}`.trim(),
    shopName,
    description: buildDescription(`${brand} ${model}`.trim(), storagePart, condition, price, currency),
    imageUrl: primary ? primary.image_url : null,
    canonical: `${origin}/product/${encodeURIComponent(id)}`,
    price,
    currency: currency.code,
    inStock: true
  };
}

/**
 * Mirrors the image filtering in ProductDetailComponent.loadBySlug:
 * exact colour match first, then colour-agnostic images, then anything.
 */
function pickImage(images, activeColor) {
  const wanted = (activeColor || '').toLowerCase();
  const colorMatch = wanted ? images.filter(img => (img.color || '').toLowerCase() === wanted) : [];
  const generic = images.filter(img => !img.color);
  const pool = colorMatch.length ? colorMatch : generic.length ? generic : images;
  const primary = pool.find(img => img.isPrimary) || pool[0];
  return primary ? primary.imageUrl : null;
}

function supabaseProductsForVariant(variantId) {
  return supabase(
    `products?select=id,color,selling_price&variant_id=eq.${encodeURIComponent(variantId)}&status=eq.available&order=selling_price.asc`
  )
    .then(rows => (Array.isArray(rows) ? rows : []))
    .catch(() => []);
}

async function supabase(path, init) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        ...((init && init.headers) || {})
      }
    });
    if (!response.ok) throw new Error(`supabase ${response.status} on ${path}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

/* ── HTML ── */

// Mirrors ProductDetailComponent.updateSeoTags so previews read the same as the page.
function buildDescription(productName, storagePart, condition, price, currency) {
  const formatted = formatPrice(price, currency);
  return `Buy ${productName}${storagePart} - ${condition} condition for ${formatted}. Browse specs, images, and inquire via WhatsApp.`;
}

function formatPrice(value, currency) {
  try {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals
    }).format(value);
  } catch {
    return `${currency.code} ${value}`;
  }
}

/**
 * Ask Cloudinary for a 1200x630 JPEG. Social crawlers will not resize for us,
 * and WhatsApp in particular rejects images it considers too large, so serving
 * the full-resolution original is what keeps thumbnails from rendering.
 */
function toOgImage(url) {
  if (!url) return null;
  if (!url.includes('res.cloudinary.com')) return url;
  return url.replace('/image/upload/', '/image/upload/w_1200,h_630,c_pad,b_auto,f_jpg,q_auto/');
}

function renderTags(preview) {
  const fullTitle = `${preview.title} | ${preview.shopName}`;
  const image = toOgImage(preview.imageUrl);

  const tags = [
    `<title>${esc(fullTitle)}</title>`,
    meta('name', 'description', preview.description),
    `<link rel="canonical" href="${esc(preview.canonical)}">`,
    meta('property', 'og:type', 'product'),
    meta('property', 'og:site_name', preview.shopName),
    meta('property', 'og:title', fullTitle),
    meta('property', 'og:description', preview.description),
    meta('property', 'og:url', preview.canonical),
    meta('name', 'twitter:title', fullTitle),
    meta('name', 'twitter:description', preview.description),
    meta('name', 'twitter:card', image ? 'summary_large_image' : 'summary')
  ];

  if (image) {
    tags.push(
      meta('property', 'og:image', image),
      meta('property', 'og:image:secure_url', image),
      meta('property', 'og:image:type', 'image/jpeg'),
      meta('property', 'og:image:width', '1200'),
      meta('property', 'og:image:height', '630'),
      meta('property', 'og:image:alt', preview.title),
      meta('name', 'twitter:image', image)
    );
  }

  if (preview.price > 0) {
    tags.push(
      meta('property', 'product:price:amount', String(preview.price)),
      meta('property', 'product:price:currency', preview.currency),
      meta('property', 'product:availability', preview.inStock ? 'in stock' : 'out of stock')
    );
  }

  return tags.join('\n  ');
}

function meta(attr, key, content) {
  return `<meta ${attr}="${key}" content="${esc(content)}">`;
}

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Strip the static placeholders index.html ships with, then put the
 * product-specific tags first in <head> so crawlers that only read the first
 * few KB of the document still find them.
 */
function injectTags(html, tags) {
  const stripped = html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name="description"[^>]*>/i, '')
    .replace(/<meta\s+(?:property|name)="(?:og|twitter|product):[^"]*"[^>]*>/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>/i, '');

  return stripped.replace(/<head([^>]*)>/i, (match, attrs) => `<head${attrs}>\n  ${tags}`);
}

async function fetchShell(origin) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      const response = await fetch(`${origin}/index.html`, { signal: controller.signal });
      if (!response.ok) return null;
      return await response.text();
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return null;
  }
}

function minimalShell(origin, tags, title) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <base href="/">
${tags ? `  ${tags}` : `  <title>${esc(title || DEFAULT_SHOP_NAME)}</title>`}
</head>
<body>
  <p><a href="${esc(origin)}">Continue to the store</a></p>
</body>
</html>`;
}

function sendHtml(res, html, cacheControl) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', cacheControl);
  // Which response a /product/* URL gets depends on the User-Agent (see the
  // `has` condition in vercel.json). Without this, a shared cache could serve a
  // crawler-shaped response to a human, or vice versa.
  res.setHeader('Vary', 'User-Agent');
  res.end(html);
}
