# SmartCell Admin — Mobile App

A native mobile admin app (Expo + React Native) focused **only on the Variants
section**. Built overnight against the **local** Supabase backend. Same backend,
RPCs, and Cloudinary account as the web app — no backend changes were made.

> TL;DR: it's done and tested. `cd mobile && npm run android` (or `npm run web`)
> to see it. Email/password + a Dev-bypass button work today; **Google sign-in is
> wired but needs OAuth client IDs** (5-min config, see below).

---

## What it does

- **Login** — email/password, **Continue with Google** (wired), and a yellow
  **Dev bypass** button (DEV builds only) that signs in as `admin@gmail.com` so
  you can jump straight to the internal pages.
- **Variants list** — all 30 variants from the DB: brand/model, storage,
  condition, PTA status, price, stock count, colors, thumbnail. Search by model
  + pull-to-refresh + infinite scroll pagination. Hidden (inactive) variants are
  badged.
- **Variant detail / edit**:
  - **Change selling price** → saves to `variants` and cascades to linked phone
    `products` (same as web). Shows a "Saved" confirmation.
  - **Visibility toggle** (`is_active`).
  - **Images** — upload from the phone gallery → Cloudinary → `variant_images`;
    set primary; delete (auto-promotes the next image to primary).
  - **Add stock** — color + cost + qty → `add_stock` RPC (creates products).

Everything above was exercised by an automated end-to-end test (see Testing).

---

## Run it

```bash
cd projects/shop-app/mobile
npm install                 # if node_modules is missing (uses your normal npm)
npm run android             # Android emulator  (recommended)
npm run ios                 # iOS simulator
npm run web                 # browser (fastest; how it was auto-tested)
```

Or scan the QR from `npx expo start` with **Expo Go** on your phone.

### Backend URL per target (important)

Local Supabase runs on the host at `127.0.0.1:54321`. The app picks the right
host automatically (`src/config.ts`):

| Where the app runs        | Supabase URL it uses        |
| ------------------------- | --------------------------- |
| Expo **web** (this Mac)   | `http://localhost:54321`    |
| **Android emulator**      | `http://10.0.2.2:54321`     |
| iOS simulator             | `http://localhost:54321`    |
| **Physical phone (Expo Go)** | needs your LAN IP — see below |

For a **physical device**, the phone must reach this Mac over Wi-Fi. Start Expo
with the env override (this Mac's current LAN IP is `192.168.100.217`):

```bash
EXPO_PUBLIC_SUPABASE_URL=http://192.168.100.217:54321 npx expo start
```

(Same Wi-Fi network required. The IP can change between sessions — re-check with
`ipconfig getifaddr en0`.)

---

## Finish Google sign-in (≈5 min, your part)

The button + full OAuth flow are implemented (`src/auth/AuthContext.tsx`). To
turn it on you only need provider config — no app code changes:

1. **Google Cloud Console** → create OAuth client IDs (Web + Android/iOS).
2. **Supabase** → Auth → Providers → Google: paste the Web client ID + secret.
3. Add the redirect URLs:
   - Web: your site origin (already used by the web app).
   - Native: `smartcelladmin://auth-callback` (this app's scheme — already set in
     `app.json`).
4. For a production Android build, also register the SHA-1 fingerprint.

Until then, use email/password or the Dev-bypass button. The Google button will
surface a clear error if the provider isn't configured yet.

---

## Testing (what I ran overnight)

Automated headless Playwright tests against the Expo **web** target:

- `scripts/e2e-web.mjs` — full flow: login → list (rows + search + pagination) →
  open detail → **edit price + save + reload-persistence** → visibility toggle →
  back navigation. **12/12 passed**, 0 console errors, 0 failed API calls.
- `scripts/e2e-image.mjs` — picks a file → Cloudinary upload → `variant_images`
  row created + set primary. **Passed.**

Independently verified in Postgres: price write persisted **and cascaded** to
linked products; `add_stock` RPC worked (stock 3→4); uploaded image row present.
Test artifacts were cleaned up afterward (a couple of test price values remain on
local variants — harmless dev data).

Re-run anytime (with the app running on `:8081`):

```bash
npm run web          # in one terminal
node scripts/e2e-web.mjs
node scripts/e2e-image.mjs
```

Screenshots from the last run: `/tmp/mobile-e2e/shots/`.

---

## Update log (latest session)

- **List grouped by model** — each phone model shows once with its configs nested
  (no more "same phone twice" from storage/PTA/condition differences).
- **Search has a clear (✕) button.**
- **Detail edits ALL variant columns** now: price (cascades to products), storage,
  condition, PTA, colors, visibility, images, add-stock.
- **Admin access gate** — non-approved / non-admin users get an Access Denied screen.
- **Supabase client has a 15s request timeout** so a hung call can't freeze the UI.
- **Native image upload fixed** — Expo SDK 56's `fetch` rejects the legacy RN
  `{uri,name,type}` FormData part ("Unsupported FormDataPart implementation");
  native now uploads via `expo-file-system` `uploadAsync` (web still uses Blob+FormData).

### Security: admin-only catalog writes (RLS)
Migration `backend/supabase/migrations/20260624000001_admin_only_variant_writes.sql`
restricts INSERT/UPDATE/DELETE on `variants` and `variant_images` to
`is_manager_or_admin()` (SELECT stays public). Previously any authenticated user
could edit prices/images via the REST API — the app gate was UI-only. Now the
client gate (Access Denied screen) is backed by real DB enforcement.
**Applied to LOCAL only** (per project rules) — deploy to prod manually.
Verified e2e: a cashier's UPDATE returns `[]` (no-op) and image INSERT returns
`403 row-level security`, while an admin succeeds.

### Create new model + variant (with GSMArena)
The variants list has a **+ Add** button → an Add-variant screen: pick brand →
type/look-up model → storage/condition/PTA/colors/price → creates the model (if
new) and the variant (find-or-create, mirroring the web's `resolveVariant`).
- **GSMArena auto-fill** calls the same backend proxy the web uses
  (`<apiServer>/api/products/{search-models,fetch-specs}`; local api-server on
  `:3001`, reached from the emulator via `10.0.2.2:3001`). It pre-fills canonical
  name, colors, and storage options.
- ⚠️ **GSMArena is currently behind a Cloudflare Turnstile challenge**, so the
  scraper returns empty for **both web and mobile** right now. The screen detects
  this and shows a clear note; **manual entry always works**. Auto-fill returns
  automatically once GSMArena access is restored.

### Security: models + products writes are admin-only too
Migration `20260624000002_admin_only_model_product_writes.sql` extends the
admin/manager RLS lock to `models` and `products` (needed now that mobile can
create them). Safe for POS — cashier sales/refunds go through SECURITY DEFINER
RPCs that bypass RLS. **Local only**; deploy to prod manually. Verified: cashier
`models` INSERT → `403`.

### Color-specific images
The image section now lets you tag each upload with a color (chips: "All colors"
+ each available color), matching the web app's `variant_images.color`. Each image
shows its color tag.

### Native headless-emulator test
`scripts/native-e2e.py` drives the real Android UI (adb + uiautomator) on a
headless emulator against LOCAL Supabase and verifies every change in Postgres.
Last run: **16/16 PASS** — login, model grouping, search-clear, open detail,
price+cascade, storage/condition/PTA/colors, visibility toggle, **image upload
(Cloudinary URL persisted, tagged with the selected color)**, and re-open
reflects persisted values. It restores all edited data afterward.
`scripts/native-gate-e2e.py` additionally verifies a **cashier** sees the Access
Denied screen (not the variants UI) — **PASS**.

Run it:
```bash
# emulator running headless + Expo on local + reverse tunnel:
~/Library/Android/sdk/platform-tools/adb reverse tcp:8081 tcp:8081
~/Library/Android/sdk/platform-tools/adb shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081"
python3 scripts/native-e2e.py
```
> Tip: on a headless emulator, open the app via `exp://127.0.0.1:8081` (with
> `adb reverse tcp:8081`) — the auto-picked LAN IP is often unreachable.

## Multi-shop + Device OUT (consignment)

**Shops:** `products.location_id` ties each unit to a branch (`store_locations`).
Created **G-15 IT Tower** (primary) + **G-7 Fazal Tower**; the G-15 stock photo was
split in (25 units → G-15, 44 → G-7). External shops are a separate `partner_shops`
table (counterparties, balance derived). Migrations: `20260626000001` (column +
partners) and `20260626000002` (device_outs). **Local only — deploy to prod manually.**

**OUT feature (mobile):** "Out" button on the Variants header → Out Devices.
- Create OUT: pick available device → partner shop / our branch → out price.
- Detail: **Settle = SOLD** (the other shop sold it; books a real `sales` row that
  feeds Grand Profit) · **Return to stock** · Cancel.
- Partners screen: per-partner outstanding balance (+ add partner).
- While out, the device is `status='out'` so POS can't sell it.
- RPCs (all admin/manager-guarded): `create_device_out`, `settle_device_out`,
  `return_device_out`, `cancel_device_out`, `get_device_outs`, `get_partner_balances`.

**Tested:** `scripts/e2e-out.mjs` (Playwright, web target) — **12/12 PASS** incl.
create→settle(sold), create→return, and negatives (no-partner error, sold OUT has no
actions, out device hidden from the available picker). DB-verified + cleaned up.

### IN direction (consignment both ways)
The Consignment screen has an **Out / In** toggle. **IN** = a partner's device held
in our shop: sellable (flagged, excluded from owned-stock value), we owe them the IN
price once sold, returnable before sale. Migration `20260626000003` adds `direction`
to the ledger, `products.consignment_partner_id`, status `in_stock`/`returned`, and:
`create_device_in`, `sell_device_in`, `pay_partner`, `get_partner_ledger` + a trigger
that auto-marks an IN row sold when its product sells (incl. via normal POS).
**One netted balance per partner** (they-owe − we-owe) on the Partners screen.
Tested: `scripts/e2e-in.mjs` — **11/11 PASS** (take-IN→sell→margin+payable, take-IN→
return, negatives, netting). Backend smoke test also pos+neg.

**Interactive POC:** `poc/consignment-interactive.html` — a fully clickable prototype
(both directions, settle/sell/return/pay, live netting) with a scenario guide.
Open it in a browser to walk every flow end-to-end.

## Per-color visibility
A variant's `is_active` was a single switch for all its colors. Migration
`20260626000004_per_color_active` adds `variants.inactive_colors text[]`:
`get_model_catalog` now skips colors in that list (per-color cards), and
`get_variant_detail` returns `inactiveColors`. The variant detail's **Status**
section shows a master "Visible in catalog" switch **plus a per-color switch**
for each available color (`setVariantColorActive`). Turning Wintergreen off
hides only Wintergreen from the catalog; Obsidian stays live and the variant
stays active. Verified on the headless emulator: toggle Wintergreen →
`inactive_colors={Wintergreen}`, `is_active=true`, catalog returns only Obsidian.

## Per-color images (fix)
Images are tied to a color (`variant_images.color`) and the catalog
(`get_model_catalog`) already shows each color only its own image. Three fixes
made the mobile management match that and removed footguns:
1. The image color selector **defaults to the variant's first color** (was
   "All colors"/null, which produced generic images that don't appear per-color).
2. **Primary is now per-color** (`uploadVariantImage`/`setPrimaryImage` scope the
   first-image-primary and clearing to the same color) — setting one color's
   primary no longer clears another's.
3. The image strip **filters by the selected color** ("N images for Obsidian"),
   so you manage/see one color's images at a time.
Verified (web upload, DB) + headless emulator: an image uploaded for Obsidian shows
on Obsidian only, Wintergreen on Wintergreen only — no cross-color leak.

## Notes / limitations

- **Dev bypass** is auto-disabled in production builds (`__DEV__` guard in
  `src/config.ts`). It uses the real admin account, so RLS-protected writes work.
- The list shows **one row per variant** (colors as chips), rather than the web
  admin's one-row-per-color fan-out — cleaner on a phone.
- One bug found & fixed during the build: the variants query referenced a
  `variants.primary_image_url` column that doesn't actually exist in the DB; the
  thumbnail is now derived from `variant_images`.
- Android emulator / `adb` weren't installed on this machine, so deep native
  testing was done on the web target (identical Supabase/Cloudinary code paths).
  Install Android Studio to run `npm run android`, or just use Expo Go.

## Layout

```
mobile/
  App.tsx                       # providers + navigator
  src/config.ts                 # backend URLs, Cloudinary, dev-bypass
  src/lib/supabase.ts           # Supabase client (AsyncStorage session)
  src/auth/AuthContext.tsx      # email/pw, Google OAuth, dev bypass
  src/api/variants.ts           # all variant/image/stock data calls
  src/cloudinary.ts             # unsigned upload (web + native)
  src/screens/                  # Login, VariantsList, VariantDetail
  src/navigation/RootNavigator.tsx
  scripts/e2e-web.mjs, e2e-image.mjs   # autonomous tests
```
