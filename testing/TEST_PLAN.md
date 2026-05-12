# Shop App — Go-Live Test Plan

Minimal E2E test suite to verify all critical paths before going live.
Target: 27 tests across 5 areas.

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

## Image Focus — What to watch for

Images are the highest-risk area. These specific checks should be verified across tests 6, 13, 23–26:

- **No broken image icons** — missing images must show the placeholder, not a 404 or empty frame
- **Correct image per variant** — when switching color variants, the gallery should update to show images assigned to that color
- **Upload produces a visible result** — after uploading, the new image must appear in the gallery without a page refresh
- **Image src uses optimized format** — verify network requests use Cloudinary/optimized URLs, not raw Supabase storage paths where applicable

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
