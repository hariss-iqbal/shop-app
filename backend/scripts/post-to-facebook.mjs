/**
 * Publish a catalog post to the SmartCell Facebook Page via the Graph API.
 *
 * This is the missing last step of generate-fb-posts.mjs: same composed text,
 * pushed to the Page instead of printed for copy-paste.
 *
 * NOTE: this needs credentials the Meta *catalog feed* does not provide. The
 * feed is a pull (Meta's crawler fetches our public CSV, unauthenticated);
 * posting is a push and needs a Page access token. See README-facebook-posting.md.
 *
 * Environment:
 *   FB_PAGE_ID            required — numeric id of the SmartCell Page
 *   FB_PAGE_ACCESS_TOKEN  required — Page token w/ pages_manage_posts, pages_read_engagement
 *   FB_GRAPH_VERSION      optional — default v21.0
 *   SUPABASE_DB_URL       optional — default local; point at prod for real stock
 *
 * Usage (safe by default — prints, posts nothing):
 *   node scripts/post-to-facebook.mjs top 5
 *
 * Verify credentials + which Page the token actually controls:
 *   node scripts/post-to-facebook.mjs --whoami
 *
 * Non-public test post (scheduled 30 min out, never auto-publishes; cancel before then):
 *   node scripts/post-to-facebook.mjs top 5 --schedule=30
 *
 * Unpublished draft (admin-only; Meta may reject for plain-text posts):
 *   node scripts/post-to-facebook.mjs top 5 --draft
 *
 * Publish publicly — the only mode customers can see:
 *   node scripts/post-to-facebook.mjs top 5 --live
 *
 * Clean up a test post:
 *   node scripts/post-to-facebook.mjs --delete=<postId>
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchRows, buildPost } from './generate-fb-posts.mjs';
import { fetchFeed, feedCard, pickItem, groupItems, groupCard } from './feed-source.mjs';

const SPEC_CACHE = resolve(dirname(fileURLToPath(import.meta.url)), 'out', 'model-specs.json');

/** Specs are optional: without the cache, posts render without spec lines. */
function loadSpecs() {
  if (!existsSync(SPEC_CACHE)) {
    console.warn(`No spec cache at ${SPEC_CACHE} — posting without specs.`);
    console.warn('Build it with: npx tsx scripts/build-spec-cache.ts\n');
    return {};
  }
  return JSON.parse(readFileSync(SPEC_CACHE, 'utf8'));
}

const GRAPH_VERSION = process.env.FB_GRAPH_VERSION || 'v21.0';
const PAGE_ID = process.env.FB_PAGE_ID;
const TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

// The whole point of the preflight: never post to the wrong Page.
const EXPECTED_PAGE_NAME = /smart\s*cell/i;

const GRAPH = (path) => `https://graph.facebook.com/${GRAPH_VERSION}/${path}`;

function requireCreds() {
  const missing = ['FB_PAGE_ID', 'FB_PAGE_ACCESS_TOKEN'].filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing required env var(s): ${missing.join(', ')}`);
    console.error('See backend/scripts/README-facebook-posting.md for how to get a Page token.');
    process.exit(1);
  }
}

async function graph(path, { method = 'GET', body } = {}) {
  const url = new URL(GRAPH(path));
  const init = { method, headers: {} };

  if (method === 'GET') {
    url.searchParams.set('access_token', TOKEN);
  } else {
    const form = new URLSearchParams({ ...body, access_token: TOKEN });
    init.body = form;
    init.headers['Content-Type'] = 'application/x-www-form-urlencoded';
  }

  const res = await fetch(url, init);
  const text = await res.text();

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Graph API returned non-JSON (HTTP ${res.status}): ${text.slice(0, 300)}`);
  }

  if (!res.ok || json.error) {
    const e = json.error || {};
    throw new Error(
      `Graph API error (HTTP ${res.status}): ${e.message || text}` +
        (e.code ? ` [code ${e.code}${e.error_subcode ? `/${e.error_subcode}` : ''}]` : '')
    );
  }
  return json;
}

// Confirms the token really controls the Page we think it does, and that the
// token is a Page token (not a User token) with posting permission.
async function whoami() {
  const page = await graph(`${PAGE_ID}?fields=id,name,category,fan_count`);
  console.log(`Page:      ${page.name} (id ${page.id})`);
  if (page.category) console.log(`Category:  ${page.category}`);
  if (page.fan_count !== undefined) console.log(`Followers: ${page.fan_count}`);

  let tokenOk = true;
  try {
    const me = await graph('me?fields=id,name');
    const isPageToken = me.id === page.id;
    console.log(`Token is:  ${isPageToken ? 'Page token ✓' : `User token for "${me.name}" ✗ (need a Page token)`}`);
    tokenOk = isPageToken;
  } catch (e) {
    console.log(`Token identity check failed: ${e.message}`);
    tokenOk = false;
  }

  const nameOk = EXPECTED_PAGE_NAME.test(page.name);
  if (!nameOk) {
    console.error(`\n✗ Page name "${page.name}" does not look like SmartCell — refusing to treat this as the target.`);
  }
  return { page, ok: nameOk && tokenOk };
}

async function main() {
  const argv = process.argv.slice(2);
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  const positional = argv.filter((a) => !a.startsWith('--'));
  const flagValue = (name) => {
    const hit = argv.find((a) => a.startsWith(`--${name}=`));
    return hit ? hit.slice(name.length + 3) : null;
  };

  const deleteId = flagValue('delete');
  if (deleteId) {
    requireCreds();
    await graph(deleteId, { method: 'DELETE' });
    console.log(`Deleted post ${deleteId}`);
    return;
  }

  if (flags.has('--whoami')) {
    requireCreds();
    const { ok } = await whoami();
    process.exit(ok ? 0 : 1);
  }

  const mode = (positional[0] || 'all').toLowerCase();
  const arg = positional[1];

  // `feed` reads the live prod catalog feed (real prices + real photos) instead
  // of the local database, which has no images.
  let message;
  let photoUrl = null;
  let photoUrls = [];
  let sourceNote;

  // `grouped` is the shop format: one post per product, every colour's photo
  // attached, specs from the cache.
  if (mode === 'grouped') {
    const groups = groupItems(await fetchFeed());
    const specs = loadSpecs();

    if (flags.has('--list')) {
      for (const g of groups) {
        console.log(
          `${g.images.length}📷 ${g.key.split('/product/')[1]}  ${g.price}  [${g.colors.join(', ') || 'no colour'}]`
        );
      }
      console.log(`\n${groups.length} products. Post one with: … grouped <slug> --live`);
      return;
    }

    const slug = arg;
    const group = slug
      ? groups.find(g => g.key.endsWith(slug))
      : groups.find(g => g.images.length > 1) ?? groups[0];
    if (!group) throw new Error(`No product matching "${slug}". Use --list to see slugs.`);

    message = groupCard(group, specs[group.model.toUpperCase()] ?? null, {
      whatsapp: process.env.WHATSAPP || '',
    });
    photoUrls = flags.has('--no-photo') ? [] : group.images;
    sourceNote = `grouped · ${group.colors.length} colour(s) · ${photoUrls.length} photo(s)`;
  } else if (mode === 'feed') {
    // --item-json lets you post a single feed row supplied directly, for when
    // the feed host is unreachable from this machine (firewall, rate limit)
    // but graph.facebook.com is fine. Same rendering path as a fetched item.
    const itemJson = flagValue('item-json');
    if (itemJson) {
      const item = JSON.parse(itemJson);
      message = feedCard(item);
      photoUrl = flags.has('--no-photo') ? null : (item.image_link || null);
      sourceNote = `--item-json · ${item.id ?? 'unnamed'}`;
    } else {
    const items = await fetchFeed();

    if (flags.has('--list')) {
      for (const i of items) {
        console.log(`${Number(i.quantity_to_sell_on_facebook) > 0 ? '✓' : ' '} ${i.id}  ${i.price}  ${i.title}`);
      }
      console.log(`\n${items.length} items. Post one with: node scripts/post-to-facebook.mjs feed <id> --live`);
      return;
    }

    const item = pickItem(items, arg);
    message = feedCard(item);
    photoUrl = flags.has('--no-photo') ? null : (item.image_link || null);
    sourceNote = `prod feed · ${items.length} items · ${item.id}`;
    }
  } else {
    const rows = await fetchRows();
    message = buildPost(mode, rows, arg);
    sourceNote = `local DB · ${rows.length} catalog rows`;
  }

  const isLive = flags.has('--live');
  const isDraft = flags.has('--draft');
  const scheduleMin = flagValue('schedule');

  // Normalise the single- and multi-photo paths into one list.
  if (photoUrl && !photoUrls.length) photoUrls = [photoUrl];

  console.log('─'.repeat(60));
  console.log(message);
  console.log('─'.repeat(60));
  console.log(`(${message.length} chars, mode "${mode}", ${sourceNote})`);
  if (photoUrls.length) {
    photoUrls.forEach((u, i) => console.log(`photo ${i + 1}: ${u}`));
    console.log('');
  } else {
    console.log('photo: none — text-only post\n');
  }

  if (!isLive && !isDraft && !scheduleMin) {
    console.log('DRY RUN — nothing posted. Add --schedule=30 (non-public test), --draft, or --live.');
    return;
  }

  requireCreds();

  // Never post without confirming the target Page first.
  const { page, ok } = await whoami();
  if (!ok) {
    console.error('\nAborted: preflight failed. Fix the token/Page before posting.');
    process.exit(1);
  }
  console.log('');

  // Three shapes, because Meta models them differently:
  //   0 photos  → /feed with a message
  //   1 photo   → /photos with url + caption (a native single-photo post)
  //   2+ photos → each uploaded unpublished to /photos to get a media_fbid,
  //               then one /feed post attaching them all. There is no
  //               single-call multi-photo endpoint.
  let endpoint;
  let body;

  if (photoUrls.length > 1) {
    console.log(`Uploading ${photoUrls.length} photos…`);
    const mediaIds = [];
    for (const [i, url] of photoUrls.entries()) {
      const uploaded = await graph(`${page.id}/photos`, {
        method: 'POST',
        body: { url, published: 'false' },
      });
      mediaIds.push(uploaded.id);
      console.log(`  ${i + 1}/${photoUrls.length} uploaded (${uploaded.id})`);
    }

    endpoint = `${page.id}/feed`;
    body = { message };
    // attached_media is indexed keys, not a JSON array: attached_media[0]=...
    mediaIds.forEach((id, i) => {
      body[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id });
    });
  } else if (photoUrls.length === 1) {
    endpoint = `${page.id}/photos`;
    body = { url: photoUrls[0], caption: message };
  } else {
    endpoint = `${page.id}/feed`;
    body = { message };
  }

  let describe;

  if (scheduleMin) {
    const mins = Number(scheduleMin);
    if (!Number.isFinite(mins) || mins < 10 || mins > 75 * 24 * 60) {
      console.error('--schedule must be minutes from now, between 10 and 108000 (Meta\'s 10min–75day window).');
      process.exit(1);
    }
    const when = Math.floor(Date.now() / 1000) + Math.round(mins * 60);
    body.published = 'false';
    body.scheduled_publish_time = String(when);
    describe = `SCHEDULED for ${new Date(when * 1000).toISOString()} (${mins} min out) — not public yet`;
  } else if (isDraft) {
    body.published = 'false';
    describe = 'UNPUBLISHED draft — visible only to Page admins';
  } else {
    describe = 'LIVE — publicly visible on the Page';
  }

  const result = await graph(endpoint, { method: 'POST', body });
  // /photos returns {id, post_id}; the post_id is the thing you can delete or
  // read back as a feed story, so prefer it when present.
  const postId = result.post_id || result.id;

  console.log(`✓ Created: ${describe}`);
  console.log(`  post id: ${postId}`);
  console.log(`  delete:  node scripts/post-to-facebook.mjs --delete=${postId}`);

  // Read it back so success is verified, not assumed.
  try {
    const check = await graph(
      `${postId}?fields=id,created_time,is_published,scheduled_publish_time,message`
    );
    console.log(`  readback: is_published=${check.is_published}` +
      (check.scheduled_publish_time ? `, scheduled=${new Date(check.scheduled_publish_time * 1000).toISOString()}` : ''));
  } catch (e) {
    console.log(`  readback failed (post was still created): ${e.message}`);
  }
}

main().catch((e) => {
  console.error(`Failed: ${e.message}`);
  process.exit(1);
});
