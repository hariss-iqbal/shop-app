# Posting to the SmartCell Facebook Page

## Why the working catalog doesn't help here

The catalog feed and Page posting are **different directions of traffic**, and only
one of them involves credentials:

| | Catalog feed (working today) | Page posting (this script) |
|---|---|---|
| Direction | Meta **pulls** from us | We **push** to Meta |
| Auth | None — public CSV URL | Page access token required |
| Endpoint | `functions/v1/meta-catalog` (ours) | `graph.facebook.com/{page-id}/feed` (Meta's) |
| Grants posting rights? | **No** | — |

`supabase/functions/meta-catalog/index.ts` has no token, no app id, and makes no
Graph API call. Meta's crawler fetches an anonymous URL on a schedule. Nothing in
that flow ever authenticates *as* the Page, which is why products appear in the
Page's shop but nothing can write a post. The Meta Pixel in `frontend/src/index.html`
(id `1888423905552768`) is likewise read-only telemetry — it grants nothing.

So posting needs genuinely new credentials. There is nothing to reuse.

## Getting a Page access token

You need `FB_PAGE_ID` and `FB_PAGE_ACCESS_TOKEN` (scopes: `pages_manage_posts`,
`pages_read_engagement`, `pages_show_list`).

**Quick route — short-lived token, fine for testing (~1–2 hours):**

1. Open [Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. Pick your existing Meta app (the same one the WhatsApp bot uses is fine).
3. "Get Token" → **Get User Access Token** → tick `pages_manage_posts`,
   `pages_read_engagement`, `pages_show_list` → Generate.
4. Run `GET /me/accounts`. Find SmartCell in the response — note its `id`
   (that's `FB_PAGE_ID`) and its `access_token` (that's `FB_PAGE_ACCESS_TOKEN`).
   The Page token from this call, *not* the User token from step 3.

**Durable route — permanent token, for anything scheduled or automated:**

Business Manager → System Users → your system user → Add Assets (the SmartCell
Page, with Manage Page permission) → Generate Token with the same scopes.

Because you own the Page, no Meta app review is needed. Review is only required
for apps posting to Pages owned by other people.

## Running it

```bash
cd backend
export FB_PAGE_ID='...'
export FB_PAGE_ACCESS_TOKEN='...'
export SUPABASE_DB_URL='postgresql://...pooler...'   # else it reads the local DB

# 1. Confirm the token controls the SmartCell Page (posts nothing)
node scripts/post-to-facebook.mjs --whoami

# 2. See the exact text (posts nothing — this is the default)
node scripts/post-to-facebook.mjs top 5

# 3. Non-public test post
node scripts/post-to-facebook.mjs top 5 --schedule=30

# 4. Remove it
node scripts/post-to-facebook.mjs --delete=<postId>
```

Every posting run does a preflight that aborts unless the token resolves to a Page
whose name matches `/smart\s*cell/i`, so a wrong token fails closed instead of
posting to someone else's Page.

## "Private" posts — what's actually possible

Facebook **Pages have no private/friends-only audience**. That setting exists on
personal profiles, not Pages. A Page post is either public or not yet published.
The two non-public options:

- `--schedule=30` → `published=false` + `scheduled_publish_time`. Reliable and
  well-supported. It sits in Meta Business Suite → Planner and goes public at the
  scheduled time **unless deleted first**. Use a comfortable window and delete after
  checking.
- `--draft` → `published=false` with no schedule. Never auto-publishes, but Meta
  has become inconsistent about accepting this for plain-text Page posts and may
  reject it. Try it; fall back to `--schedule`.

`--schedule` is the safer test: guaranteed to work, guaranteed non-public *now*.
Its only cost is that you must delete it before the timer runs out.

## Not covered

- **Images.** Text-only for now. Photos need the two-phase unpublished-upload flow
  (`/photos` with `published=false`, then `/feed` with `attached_media`).
- **Instagram.** Separate Content Publishing API (`/{ig-user-id}/media` →
  `media_publish`), needs an IG Business account linked to the Page.
- **Groups.** Meta removed API publishing to Groups. Permanently manual.
