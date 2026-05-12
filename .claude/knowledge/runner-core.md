# Runner Core Knowledge — Shop App E2E

Loaded by every e2e-runner before executing a playbook. Contains selectors, timing patterns, and interaction strategies for PrimeNG + Angular 20 + Supabase.

---

## Authentication Login Sequence

All admin playbooks include `requiresAuth: true`. The runner must execute these steps before the playbook's own steps:

1. `browser_navigate` to `/auth/login`
2. Wait for form: `browser_wait_for` text `Sign in`
3. `browser_type` into `#email` — the email value from run-config.json
4. `browser_type` into `#password` — the password value from run-config.json
5. `browser_click` the `Sign In` button (use snapshot to find it — it's a `p-button` with label "Sign In")
6. `browser_wait_for` text `Dashboard` or URL contains `/admin` — timeout 10s

**Login form selectors:**
- Email input: `#email` (p-inputText inside p-iconfield)
- Password input: `#password` (p-password renders as input inside wrapper)
- Submit button: Find via snapshot — `button` with text "Sign In" (disabled until form valid)
- Error message: `p-message[severity="error"]`
- Google button: `button.google-signin-btn`

---

## PrimeNG Component Interaction Patterns

| Component | Selector Pattern | Notes |
|-----------|-----------------|-------|
| `p-button` | Use snapshot to find by label text | Always use `browser_snapshot` first to get ref |
| `p-inputText` | `input#id` or `input[placeholder="..."]` | Standard HTML input, type directly |
| `p-password` | `input#password` | Renders as regular input inside wrapper |
| `p-select` | Click to open overlay, then click option | Use snapshot refs; overlay appears as new elements |
| `p-table` | `p-table` for table, `p-table tbody tr` for rows | Lazy-loaded; wait for rows before asserting count |
| `p-fileUpload` | Click triggers file chooser | Use `browser_file_upload` after clicking |
| `p-tag` | `p-tag` | Read severity and value via text content |
| `p-skeleton` | `p-skeleton` | Presence = loading state; absence = data loaded |
| `p-card` | `p-card` | Standard card wrapper |
| `p-dialog` | Overlay; close with X or Escape | Check `role="dialog"` in snapshot |
| `p-message` | `p-message[severity="error"]` | Error messages shown after form submission failures |
| `p-paginator` | `.p-paginator` | Page navigation buttons |
| `p-chip` | Use snapshot to find by text | Color chips in variant list |

**Key rule**: Always take a `browser_snapshot` before clicking. Use the `ref=eXX` values from the snapshot for `browser_click` targets. Do NOT guess selectors — snapshots are authoritative.

---

## Catalog Page Selectors

- Page container: `.catalog-wrap`
- Product grid: `.cat-product-grid`
- Product card: `.cat-product-grid .card` (each card is clickable)
- Card image: `.card-media img`
- Card brand: `.card-brand`
- Card name: `.card-name`
- Card price: `.card-price .price-amount`
- Card condition pill: `.cond-pill`
- Card PTA seal: `.pta-seal`
- Card spec rows: `.card-spec-rows`
- Empty state: `.cat-empty`
- Filter sidebar: `.filters`
- Filter chips (active): `.filter-chips .filter-chip`
- Filter close button: `.filter-close-btn`
- Price range inputs: `.price-input`
- Pagination: `.pager`
- Sort dropdown: Use snapshot — it's a `p-select` component
- Search input: Use snapshot — `p-inputText` with placeholder containing "search"
- Breadcrumbs: `.crumbs`

---

## Product Detail Page Selectors

- Page container: `.pdp`
- Gallery main image: `.gallery-main .main-img`
- Gallery thumbnails: `.gallery-thumbs .gthumb`
- Gallery fullscreen overlay: `.fs-overlay`
- Gallery fullscreen image: `.fs-image`
- Fullscreen close: `.fs-close`
- Fullscreen arrows: `.fs-arrow`
- Image arrows (in-page): `.img-arrow`
- Image counter: `.img-counter`
- Image loader: `.img-loader`
- Variant color swatches: `.csw` or use snapshot
- Variant dots: `.dot`
- Condition badge: Look for text with condition value
- PTA badge: Look for text with PTA status
- Buy/WhatsApp button: `.btn-buy`
- Back to catalog: `.btn-back` or link with text "Back"

---

## Admin Panel Selectors

- Admin sidebar: Navigation links with `routerLink` attributes
- Dashboard: Look for stat cards / overview widgets
- Inventory table: `p-table` on inventory page
- Inventory form: Standard form inputs — use snapshot
- Variant list: `p-table` with search input
- Variant detail: Stats cards + image gallery
- Image upload: `p-fileUpload` — click then use `browser_file_upload`
- User management: `p-table` with user rows
- Sales list: `p-table` with transaction rows

**Admin navigation**: Use sidebar links found via snapshot. The sidebar is always present on admin pages.

---

## Timing Patterns

| Scenario | Wait Strategy | Timeout |
|----------|--------------|---------|
| Catalog data loads | Wait for `.card` elements to appear | 10s |
| Auth redirect | Wait for URL to contain `/admin` | 10s |
| Product detail images | Wait for `.main-img[src]` to be non-empty | 8s |
| PrimeNG table data | Wait for `p-table tbody tr` rows | 10s |
| PrimeNG dropdown open | Wait for overlay panel to appear | 3s |
| Image upload complete | Wait for new `img` in gallery area | 15s |
| Route navigation | Wait for URL change or text on page | 5s |
| Skeleton loading | Wait for `p-skeleton` to disappear | 8s |

**General rule**: Prefer `browser_wait_for` with text content over CSS selectors when possible — it's more resilient to markup changes.

---

## Image Validation Script

Use `browser_evaluate` with this JS to check for broken images:

```javascript
(() => {
  const imgs = document.querySelectorAll('img');
  let broken = 0, loaded = 0;
  const details = [];
  for (const img of imgs) {
    if (img.offsetWidth === 0 && img.offsetHeight === 0) continue; // skip hidden
    const isBroken = img.complete && img.naturalWidth === 0;
    if (isBroken) broken++;
    else if (img.complete) loaded++;
    if (details.length < 10) {
      details.push({ src: img.src?.substring(0, 100), broken: isBroken });
    }
  }
  return { total: loaded + broken, broken, loaded, details };
})()
```

Assert that `broken === 0` for image validation steps.

---

## Retry Strategy

Before declaring a step failure:
1. Take a snapshot to check current page state
2. If skeleton/loading indicators present, wait 3s and retry
3. Try alternative selectors from snapshot (role-based, label-based, text-based)
4. Check console for errors that explain the failure
5. If a PrimeNG overlay is blocking, press Escape to dismiss it
6. Only after 2 retries, record failure and stop

---

## Error Indicators

- `p-message[severity="error"]` — form validation error
- Console errors containing `TypeError` or `Null` — likely cat2 (app bug)
- Console errors containing `404` or `500` — could be cat2 or cat3
- Page shows "404" heading — wrong route (cat1) or missing component (cat2)
- Page redirects to login when it shouldn't — session expired (re-login needed)
- No data shown but no errors — likely cat0 (missing seed data)
