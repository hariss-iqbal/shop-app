# Shop App — Go-Live Test Plan

Minimal E2E test suite to verify all critical paths before going live.
Target: 34 tests across 6 areas.

---

## 1. Authentication (4 tests)

| # | Test | What it proves |
|---|------|----------------|
| 1 | Login with valid email/password redirects to `/admin/dashboard` | Auth flow works end-to-end |
| 2 | Login with wrong password shows error message | Invalid credentials are rejected |
| 3 | Unauthenticated visit to `/admin/dashboard` redirects to login page | Admin routes are protected |
| 4 | Logout clears session and redirects to login page | Session teardown works |

---

## 2. Public Catalog (7 tests)

| # | Test | What it proves |
|---|------|----------------|
| 5 | Catalog page loads and renders at least 1 product card | Core data pipeline works |
| 6 | Each product card shows an image, title, price, and condition badge | Card layout is complete |
| 7 | Typing in search bar filters visible products by model name | Search works |
| 8 | Selecting a brand filter hides products from other brands | Brand filter works |
| 9 | Selecting a condition filter (e.g. "New") hides other conditions | Condition filter works |
| 10 | Sorting by price Low→High reorders cards correctly | Sorting works |
| 11 | Clicking a product card navigates to `/product/{slug}` | Navigation is wired up |

---

## 3. Product Detail Page (5 tests)

| # | Test | What it proves |
|---|------|----------------|
| 12 | Detail page loads and shows product title, price, condition, PTA status | Product data renders |
| 13 | At least one image is visible in the product gallery | Images are linked to products |
| 14 | Clicking a thumbnail switches the main image | Gallery navigation works |
| 15 | Selecting a different color variant updates displayed info | Variant switching works |
| 16 | Selecting a different storage variant updates displayed info | Storage variant works |

---

## 4. Admin Panel — Core Pages (6 tests)

| # | Test | What it proves |
|---|------|----------------|
| 17 | Dashboard loads without console errors | Admin shell is stable |
| 18 | Inventory list page loads and shows product rows | Inventory data loads |
| 19 | Create new product — form submits, item appears in list | CRUD create works |
| 20 | Edit existing product — change a field, save, reload confirms change | CRUD update works |
| 21 | Sales page loads and shows transaction rows | Sales data loads |
| 22 | User management page loads and shows user list | Admin-only page works |

---

## 5. Admin — Variants & Images (5 tests)

| # | Test | What it proves |
|---|------|----------------|
| 23 | Variants list page loads and shows variant rows with color chips and prices | Variant data loads correctly |
| 24 | Clicking a variant opens detail page with images, stats, and color filter | Variant detail renders |
| 25 | Variant detail shows images for the selected variant — at least 1 image loads | Variant-to-image relationship works |
| 26 | Uploading an image to a variant succeeds and the image appears in the gallery | Image upload pipeline works (Cloudinary → DB → display) |
| 27 | Setting an image as primary updates the primary badge | Primary image toggle works |

---

---

## 6. Admin — Variants Admin (7 tests, all P0/P1)

| # | Test | Priority | What it proves |
|---|------|----------|----------------|
| 28 | Search bar filters variant table by model name and clear restores full list | P0 | Search input debounce and clear button both work |
| 29 | Inline price edit in list saves new price without navigating to detail page | P0 | stopPropagation on price cell prevents row-click navigation bug |
| 30 | No duplicate rows for same [model, condition, pta, storage] tuple | P0 | DB constraint honoured; Google Pixel 7 Pro open_box 128GB is the sentinel |
| 31 | Pixel 7a renders one row per color (Charcoal/Sea/Snow = 3 rows, not 1 row + 3 chips) | P0 | Business rule: separate row per color. FAILS today (cat2) until DB schema is updated |
| 32 | Active toggle-switch flips status without navigating away | P1 | stopPropagation on toggle prevents row-click navigation |
| 33 | Image uploaded under Charcoal context does not appear when filtering to Sea | P0 | color column in variant_images enforces image isolation per color |
| 34 | Upload spinner disappears within 15s and new image appears in gallery | P0 | uploadingImage signal resets after promise settles |

---

## Image Focus — What to watch for

Images are the highest-risk area. These specific checks should be verified across tests 6, 13, 23–26:

- **No broken image icons** — missing images must show the placeholder, not a 404 or empty frame
- **Correct image per variant** — when switching color variants, the gallery should update to show images assigned to that color
- **Upload produces a visible result** — after uploading, the new image must appear in the gallery without a page refresh
- **Image src uses optimized format** — verify network requests use Cloudinary/optimized URLs, not raw Supabase storage paths where applicable

---

---

## 7. Admin Deep — Business Action Tests (6 tests, testNumbers 59–64)

| # | ID | Priority | What it proves |
|---|------|----------|----------------|
| 59 | sales-create-add-product | P0 | POS search RPC returns results, cart append logic runs, grand-total updates after adding product |
| 60 | supplier-create | P1 | Supplier form submits, Supabase insert succeeds, record appears in suppliers list |
| 61 | supplier-detail-sections | P1 | Supplier detail page loads purchase orders + products sections without error |
| 62 | refund-list-loads | P1 | Refunds summary stats render, 'Process Refund' CTA routes to /admin/receipts |
| 63 | brand-create | P1 | Add Brand dialog creates brand via BrandService, row appears in table, delete cleans up |
| 64 | model-create | P1 | Add Model dialog: brand selector + GSMArena search renders results without hanging spinner |

---

## 8. Public Deep — Customer Flow Tests (5 tests, testNumbers 65–69)

| # | ID | Priority | What it proves |
|---|------|----------|----------------|
| 65 | contact-form-submit | P1 | Contact form submits to Supabase, success state renders — lead capture not broken |
| 66 | homepage-nav-to-catalog | P0 | Hero 'Shop smartphones' CTA routes to /catalog — primary conversion path works |
| 67 | homepage-brand-tab-switches | P2 | Hero brand tabs update model name and reset colors — visual merchandising intact |
| 68 | compare-page-add-product | P2 | Compare page renders empty state, Back to Catalog button routes correctly |
| 69 | catalog-clear-filters | P0 | Brand filter applies (chips appear), 'Clear all' removes chips and resets count |

---

---

## 9. Production Hazards (8 tests, testNumbers 84–91)

| # | ID | Priority | What it proves |
|---|------|----------|----------------|
| 84 | rapid-double-submit-supplier | P1 | Double-clicking Create Supplier within 50ms creates exactly 1 row — saving signal blocks second insert |
| 85 | catalog-filter-rapid-toggle | P1 | Rapidly toggling 3 filter checkboxes leaves UI and URL consistent — no stale request overwrites last result |
| 86 | inline-price-rapid-click | P1 | Double-clicking a price cell opens exactly one edit input — no nested inputs from rapid re-entry |
| 87 | catalog-back-forward | P1 | Browser back from PDP restores brand= querystring in catalog URL; forward reloads PDP cleanly |
| 88 | product-detail-deep-link | P0 | Cold deep-link to Pixel 7a PDP loads product data without prior catalog navigation |
| 89 | variant-price-edit-mid-refresh | P1 | F5 during unsaved price edit discards dirty value — original price intact, no data corruption |
| 90 | catalog-filter-deep-link | P0 | /catalog?condition=open_box applies filter from URL without checkbox interaction (shared link integrity) |
| 91 | admin-action-after-logout | P0 | Toggle variant after localStorage session cleared redirects to login or shows error — never silently succeeds |

---

## Running the Tests

```bash
cd testing
npx playwright test              # run all
npx playwright test --headed     # watch in browser
npx playwright test auth         # run by tag/file
```

## Preconditions

- Local Supabase stack is running (`supabase start`)
- Frontend dev server is running (`ng serve` on port 4200)
- Test admin account exists: `admin@gmail.com` / `password123`
- At least one product with images exists in the database
