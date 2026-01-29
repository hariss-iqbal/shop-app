# Cross-Module Dependency Analysis

> **Module:** phone-shop
> **Generated from:** entity_data_model_raw.md + 60 feature specifications
> **Total Features Analyzed:** 60 (36 must, 13 need, 11 nice-to-have)

---

## 1. Module Decomposition

The phone-shop application is decomposed into the following logical modules (domains):

| Module ID | Module Name | Description | Key Entities |
|-----------|-------------|-------------|--------------|
| M-01 | **Infrastructure** | Project scaffolding, environment config, error handling | _(none — config/setup)_ |
| M-02 | **Auth** | Authentication, session management, route guards | _(UserRole enum)_ |
| M-03 | **Database Schema** | Supabase schema, migrations, RLS, indexes | Brand, Phone, PhoneImage, Supplier, PurchaseOrder, PurchaseOrderItem, Sale, ContactMessage, StockAlertConfig |
| M-04 | **Inventory** | Phone CRUD, image management, brand management, status actions | Phone, PhoneImage, Brand |
| M-05 | **Catalog** | Public phone browsing, search, filters, sorting, pagination, detail view | Phone, PhoneImage, Brand |
| M-06 | **Procurement** | Supplier management, purchase orders, receiving workflow | Supplier, PurchaseOrder, PurchaseOrderItem |
| M-07 | **Sales** | Sales tracking, mark-as-sold workflow, export | Sale, Phone |
| M-08 | **Messaging** | Contact form, spam prevention, admin message management | ContactMessage |
| M-09 | **Dashboard** | KPI cards, charts, recent phones, stock alerts, date range filtering | _(aggregates from Phone, Sale, Brand, StockAlertConfig)_ |
| M-10 | **Layout & UI** | Public layout, admin layout, responsive design, theme toggle | _(no entities — presentational)_ |
| M-11 | **Shared Services** | Toast notifications, confirmation dialogs, loading states | _(no entities — transient UI)_ |
| M-12 | **SEO & PWA** | Meta tags, structured data (JSON-LD), PWA offline support | _(no entities — metadata)_ |
| M-13 | **Storage** | Supabase Storage bucket configuration, image optimization | PhoneImage |
| M-14 | **Security** | Input sanitization, XSS prevention, spam prevention | _(cross-cutting — affects all entities)_ |

---

## 2. Cross-Module Dependency Matrix

### 2.1 Entity-Level Dependencies

| Source Entity | Target Entity | Relationship | FK Column | Constraint | Consuming Modules | featureRefs |
|---------------|---------------|-------------|-----------|------------|-------------------|-------------|
| Phone | Brand | Many-to-One | `brand_id` | NOT NULL | M-04, M-05, M-06, M-07, M-09, M-12 | F-002, F-010, F-013–F-015, F-018, F-023, F-024, F-027, F-028, F-037, F-044–F-046, F-050, F-051, F-053, F-055 |
| Phone | Supplier | Many-to-One | `supplier_id` | NULLABLE | M-04, M-06 | F-010, F-023 |
| PhoneImage | Phone | Many-to-One | `phone_id` | NOT NULL, CASCADE DELETE | M-04, M-05, M-12, M-13 | F-002, F-011, F-013, F-018, F-037, F-043, F-055, F-057 |
| PurchaseOrder | Supplier | Many-to-One | `supplier_id` | NOT NULL, RESTRICT DELETE | M-06 | F-002, F-020–F-023 |
| PurchaseOrderItem | PurchaseOrder | Many-to-One | `purchase_order_id` | NOT NULL, CASCADE DELETE | M-06 | F-002, F-021–F-023 |
| Sale | Phone | Many-to-One | `phone_id` | NOT NULL | M-07, M-09 | F-002, F-024, F-025, F-027, F-044, F-048 |

### 2.2 Module-to-Module Dependency Map

```
M-01 Infrastructure ──────────────────────────────────────────────────────
  │                                                                       │
  └─► M-02 Auth (provides Supabase client to auth service)                │
  └─► M-03 Database Schema (env config for Supabase URL/key)              │
                                                                          │
M-02 Auth ─────────────────────────────────────────────────────────────    │
  │                                                                    │  │
  └─► M-10 Layout (admin layout uses auth state for user info/logout)  │  │
  └─► M-04 Inventory (route guard protects /admin/inventory/*)         │  │
  └─► M-06 Procurement (route guard protects /admin/purchase-orders/*) │  │
  └─► M-07 Sales (route guard protects /admin/sales)                   │  │
  └─► M-08 Messaging (route guard protects /admin/messages)            │  │
  └─► M-09 Dashboard (route guard protects /admin/dashboard)           │  │
  └─► M-03 Database Schema (RLS relies on auth role: anon/authenticated)  │
                                                                          │
M-03 Database Schema ────────────────────────────────────────────────────  │
  │ (provides tables, RLS, indexes, enums, triggers)                      │
  └─► ALL data modules (M-04 through M-09)                                │
                                                                          │
M-04 Inventory ──────────────────────────────────────────────────────────  │
  │                                                                       │
  ├─► M-05 Catalog (Phone + PhoneImage + Brand entities shared)           │
  ├─► M-06 Procurement (supplier_id FK on Phone; PO receiving creates     │
  │        Phone records; brand autocomplete shared)                      │
  ├─► M-07 Sales (Mark as Sold dialog triggered from inventory list;      │
  │        updates Phone.status; creates Sale record)                     │
  ├─► M-09 Dashboard (Phone aggregates for KPI cards, stock charts,       │
  │        recently added phones table, stock alerts)                     │
  ├─► M-12 SEO (Phone + Brand + PhoneImage used for meta tags, JSON-LD)  │
  └─► M-13 Storage (PhoneImage.image_url / storage_path from bucket)      │
                                                                          │
M-05 Catalog ────────────────────────────────────────────────────────────  │
  │                                                                       │
  ├─► M-04 Inventory (reads Phone, PhoneImage, Brand — same entities)     │
  ├─► M-12 SEO (catalog pages produce meta tags; detail page JSON-LD)     │
  └─► M-13 Storage (PhoneImage.image_url for display + image transforms)  │
                                                                          │
M-06 Procurement ────────────────────────────────────────────────────────  │
  │                                                                       │
  ├─► M-04 Inventory (PO receiving creates Phone records)                 │
  └─► M-09 Dashboard (stock alerts link to /admin/purchase-orders/new)    │
                                                                          │
M-07 Sales ──────────────────────────────────────────────────────────────  │
  │                                                                       │
  ├─► M-04 Inventory (Sale.phone_id FK; reads Phone for brand/model)      │
  └─► M-09 Dashboard (Sale aggregates for revenue KPI, sales chart)       │
                                                                          │
M-08 Messaging ──────────────────────────────────────────────────────────  │
  │                                                                       │
  └─► M-10 Layout (unread count badge in admin sidebar navigation)        │
                                                                          │
M-09 Dashboard ──────────────────────────────────────────────────────────  │
  │                                                                       │
  ├─► M-04 Inventory (Phone aggregates: stock count, stock value, profit) │
  ├─► M-07 Sales (Sale aggregates: total sales count, revenue chart)      │
  └─► M-06 Procurement (stock alert links to PO creation)                 │
                                                                          │
M-10 Layout & UI ────────────────────────────────────────────────────────  │
  │                                                                       │
  ├─► M-02 Auth (admin top bar shows user email, logout button)           │
  └─► M-08 Messaging (sidebar unread message count badge)                 │
                                                                          │
M-11 Shared Services ────────────────────────────────────────────────────  │
  │ (used by ALL modules)                                                 │
  ├─► M-04 through M-09 (toast notifications for CRUD feedback)           │
  └─► M-04, M-06, M-08 (confirmation dialogs for destructive actions)    │
                                                                          │
M-12 SEO & PWA ──────────────────────────────────────────────────────────  │
  │                                                                       │
  ├─► M-04 Inventory (Brand, Phone, PhoneImage for meta tags / JSON-LD)   │
  └─► M-05 Catalog (catalog/detail page meta tags)                        │
                                                                          │
M-13 Storage ────────────────────────────────────────────────────────────  │
  │                                                                       │
  └─► M-04 Inventory (PhoneImage upload/delete via Supabase Storage)      │
                                                                          │
M-14 Security ──────────────────────────────────────────────────── (cross-cutting)
  └─► ALL modules with user input (Brand, Phone, Supplier, PurchaseOrder,
      PurchaseOrderItem, Sale, ContactMessage — maxlength, sanitization)
```

---

## 3. Detailed Cross-Module Dependencies

### 3.1 M-04 Inventory → M-06 Procurement

| Dependency Type | Direction | Description | Features |
|----------------|-----------|-------------|----------|
| **Data** | M-06 → M-04 | PO receiving workflow creates `Phone` records from `PurchaseOrderItem` line items. Brand/model pre-filled, cost_price from unit_cost, supplier_id from PO's supplier. | F-023 |
| **Data** | M-04 → M-06 | `Phone.supplier_id` FK references `Supplier` entity. Supplier dropdown on phone add/edit form. | F-010 |
| **Functional** | M-06 → M-04 | Receiving a PO transitions PO status to 'received' AND creates Phone records with status='available'. Atomic cross-entity operation. | F-023 |
| **Data** | M-06 → M-04 | Supplier purchase history view in supplier detail references PurchaseOrder list. | F-019 |

### 3.2 M-04 Inventory → M-07 Sales

| Dependency Type | Direction | Description | Features |
|----------------|-----------|-------------|----------|
| **Functional** | M-04 → M-07 | "Mark as Sold" dialog triggered from inventory list creates a `Sale` record and updates `Phone.status` to 'sold'. | F-025 |
| **Functional** | M-04 → M-07 | Quick action "Mark as Sold" in inventory list triggers the full sale dialog from M-07. | F-041 |
| **Data** | M-07 → M-04 | `Sale.phone_id` FK references `Phone`. Sale pre-fills `sale_price` from `Phone.selling_price`. `Sale.cost_price` captures `Phone.cost_price` at time of sale. | F-024, F-025 |
| **Data** | M-07 → M-04 | Sales list displays phone brand+model by joining Sale → Phone → Brand. | F-024 |

### 3.3 M-04 Inventory → M-05 Catalog

| Dependency Type | Direction | Description | Features |
|----------------|-----------|-------------|----------|
| **Data** | Shared | Both modules read the same `Phone`, `PhoneImage`, and `Brand` entities. Catalog shows `status='available'` phones only. | F-009, F-013–F-018 |
| **Data** | Shared | Brand entity is shared for admin brand management (M-04) and catalog filtering (M-05). | F-012, F-015 |
| **Data** | M-04 → M-05 | Changes to Phone status in admin (sold, reserved) immediately affect catalog visibility. | F-025, F-041 |

### 3.4 M-04 Inventory → M-09 Dashboard

| Dependency Type | Direction | Description | Features |
|----------------|-----------|-------------|----------|
| **Data** | M-04 → M-09 | KPI cards aggregate Phone data: stock count, stock value, potential profit from `Phone` where `status='available'`. | F-026 |
| **Data** | M-04 → M-09 | Stock-by-brand doughnut chart groups `Phone` by `Brand` via `brand_id` FK. | F-027 |
| **Data** | M-04 → M-09 | Recently added phones table queries top 5 `Phone` records by `created_at` DESC with Brand join. | F-028 |
| **Data** | M-04 → M-09 | Low stock alerts compute from `Phone` where `status='available'`, grouped by Brand, using `StockAlertConfig` thresholds. | F-050 |

### 3.5 M-07 Sales → M-09 Dashboard

| Dependency Type | Direction | Description | Features |
|----------------|-----------|-------------|----------|
| **Data** | M-07 → M-09 | Total sales count KPI card counts `Sale` records. | F-026 |
| **Data** | M-07 → M-09 | Sales bar chart aggregates `Sale.sale_price` by `Sale.sale_date` month. | F-027 |
| **Data** | M-07 → M-09 | Dashboard date range selector filters Sale data for KPI cards and charts. | F-048 |

### 3.6 M-08 Messaging → M-10 Layout

| Dependency Type | Direction | Description | Features |
|----------------|-----------|-------------|----------|
| **Data** | M-08 → M-10 | Unread message count badge in admin sidebar. Count computed from `ContactMessage` where `is_read=false`. | F-008, F-031 |
| **Event** | M-08 → M-10 | Supabase Realtime subscription on `contact_messages` table live-updates the sidebar badge on INSERT and UPDATE events. | F-052 |

### 3.7 M-09 Dashboard → M-06 Procurement

| Dependency Type | Direction | Description | Features |
|----------------|-----------|-------------|----------|
| **Functional** | M-09 → M-06 | Low stock alert cards include a link to `/admin/purchase-orders/new` for quick reordering. | F-050 |

### 3.8 M-02 Auth → All Admin Modules

| Dependency Type | Direction | Description | Features |
|----------------|-----------|-------------|----------|
| **Configuration** | M-02 → M-04, M-06–M-09 | Route guard (`canActivate`) checks Supabase auth session before allowing access to any `/admin/*` route. | F-005 |
| **Data** | M-02 → M-03 | RLS policies use auth role (`anon`/`authenticated`) to enforce table-level access control. | F-003 |
| **Data** | M-02 → M-10 | Admin layout top bar displays authenticated user email and provides logout button. | F-008 |

### 3.9 M-04 Inventory → M-13 Storage

| Dependency Type | Direction | Description | Features |
|----------------|-----------|-------------|----------|
| **Data** | M-04 ↔ M-13 | PhoneImage upload stores files in `phone-images` Supabase Storage bucket. `image_url` (public URL) and `storage_path` (bucket path) are persisted in PhoneImage entity. | F-011, F-040 |
| **Configuration** | M-13 → M-04 | Storage bucket policies (5MB max, JPEG/PNG/WebP only, authenticated upload, public read) govern image upload behavior. | F-040 |

### 3.10 M-05 Catalog / M-04 Inventory → M-12 SEO

| Dependency Type | Direction | Description | Features |
|----------------|-----------|-------------|----------|
| **Data** | M-04/M-05 → M-12 | Phone detail pages generate dynamic meta tags from `Brand.name`, `Phone.model`, `Phone.selling_price`, `Phone.condition`, and `PhoneImage.image_url` (primary). | F-037 |
| **Data** | M-04/M-05 → M-12 | JSON-LD structured data (schema.org Product) on detail pages uses same entity attributes plus `Phone.description`, `Phone.status` for availability mapping. | F-055 |

### 3.11 M-14 Security → All Data Modules (Cross-Cutting)

| Dependency Type | Direction | Description | Features |
|----------------|-----------|-------------|----------|
| **Configuration** | M-14 → ALL | Maxlength constraints on all VARCHAR/TEXT user-input fields across 7 entities (Brand, Phone, Supplier, PurchaseOrder, PurchaseOrderItem, Sale, ContactMessage). | F-058 |
| **Functional** | M-14 → ALL | Angular DomSanitizer for template bindings. Plain text storage without HTML interpretation for notes/message/description fields. | F-058 |
| **Functional** | M-14 → M-08 | Spam prevention (honeypot, rate limiting, reCAPTCHA) on contact form insert pathway. | F-030 |

### 3.12 M-11 Shared Services → All Modules (Cross-Cutting)

| Dependency Type | Direction | Description | Features |
|----------------|-----------|-------------|----------|
| **Functional** | M-11 → ALL | Toast notification service (PrimeNG Toast) consumed by every module for CRUD feedback, error messages, and system notifications. | F-033 |
| **Functional** | M-11 → M-04, M-06, M-08 | Confirmation dialogs (PrimeNG ConfirmDialog) for destructive actions: Phone delete, Supplier delete, ContactMessage delete, PO cancel. | F-034 |
| **Functional** | M-11 → ALL | Loading state indicators (spinners, skeletons) used across all data-fetching components. | F-035 |

---

## 4. Critical Cross-Module Workflows

### 4.1 Purchase Order Receiving Workflow (F-023)
**Modules involved:** M-06 (Procurement) → M-04 (Inventory)
**Flow:**
1. Admin clicks "Mark as Received" on a pending PO (M-06)
2. For each `PurchaseOrderItem`, N phone record forms are generated (quantity=N)
3. Admin fills per-unit details: color, IMEI, condition, battery_health, selling_price, storage_gb, ram_gb
4. On confirmation:
   - `PurchaseOrder.status` → 'received' (M-06)
   - N `Phone` records created with `status='available'`, `supplier_id` from PO, `cost_price` from `unit_cost` (M-04)
   - `Brand` resolved from PO line item brand text (M-04)
5. Dashboard stock counts update (M-09)

**Cross-module impact:** This is the most complex cross-module workflow. It atomically bridges procurement and inventory, creating multiple Phone records from PO line items.

### 4.2 Mark as Sold Workflow (F-025, F-041)
**Modules involved:** M-04 (Inventory) → M-07 (Sales) → M-09 (Dashboard)
**Flow:**
1. Admin triggers "Mark as Sold" from inventory list (M-04)
2. Sale dialog opens with `sale_price` pre-filled from `Phone.selling_price` (M-07)
3. Admin enters buyer info and confirms
4. On confirmation:
   - `Sale` record created with `cost_price` captured from `Phone.cost_price` (M-07)
   - `Phone.status` → 'sold' (M-04)
   - Phone disappears from public catalog (M-05)
   - Dashboard KPIs update (M-09)

### 4.3 Contact Message Lifecycle (F-029, F-031, F-052)
**Modules involved:** M-05/Public → M-08 (Messaging) → M-10 (Layout)
**Flow:**
1. Public visitor submits contact form (M-08, anonymous INSERT via RLS)
2. Spam prevention layers validate submission (M-14)
3. `ContactMessage` created with `is_read=false` (M-08)
4. Supabase Realtime fires INSERT event (M-08)
5. Admin sidebar badge increments (M-10)
6. Admin reads/manages messages, toggles is_read (M-08)
7. Sidebar badge updates in real-time (M-10)

---

## 5. Shared Entity Usage Summary

### 5.1 Phone Entity — Most Cross-Referenced

| Consuming Module | Access Type | Purpose | Features |
|-----------------|-------------|---------|----------|
| M-04 Inventory | CRUD | Full phone management, image upload, status changes | F-009, F-010, F-011, F-041 |
| M-05 Catalog | READ | Public browsing, search, filter, detail view (status='available' only) | F-013–F-018 |
| M-06 Procurement | CREATE | PO receiving creates Phone records | F-023 |
| M-07 Sales | READ + UPDATE | Sale references Phone; Mark as Sold updates status | F-024, F-025 |
| M-09 Dashboard | READ (aggregate) | Stock KPIs, stock-by-brand chart, recently added table, stock alerts | F-026–F-028, F-050 |
| M-12 SEO | READ | Meta tags and JSON-LD from phone attributes | F-037, F-055 |

### 5.2 Brand Entity — Widely Referenced

| Consuming Module | Access Type | Purpose | Features |
|-----------------|-------------|---------|----------|
| M-04 Inventory | CRUD | Brand management, phone form autocomplete | F-012 |
| M-05 Catalog | READ | Brand filter dropdown, phone cards, detail page | F-013–F-015, F-018 |
| M-06 Procurement | READ | Brand referenced in PO receiving for phone creation | F-023 |
| M-07 Sales | READ | Brand name in sales list (via Phone → Brand FK) | F-024 |
| M-09 Dashboard | READ (aggregate) | Stock-by-brand chart, per-brand stock alerts | F-027, F-050 |
| M-12 SEO | READ | Brand name in meta tags and JSON-LD | F-037, F-055 |

### 5.3 Sale Entity — Analytics Hub

| Consuming Module | Access Type | Purpose | Features |
|-----------------|-------------|---------|----------|
| M-07 Sales | CRUD | Sales tracking, mark-as-sold, CSV export | F-024, F-025, F-044 |
| M-09 Dashboard | READ (aggregate) | Total sales KPI, revenue chart, date-filtered analytics | F-026, F-027, F-048 |

### 5.4 Supplier Entity — Procurement Anchor

| Consuming Module | Access Type | Purpose | Features |
|-----------------|-------------|---------|----------|
| M-06 Procurement | CRUD | Supplier management, PO supplier selection | F-019–F-023 |
| M-04 Inventory | READ | Supplier dropdown on phone form | F-010 |

### 5.5 ContactMessage Entity — Messaging + Layout Bridge

| Consuming Module | Access Type | Purpose | Features |
|-----------------|-------------|---------|----------|
| M-08 Messaging | CRUD | Contact form submit, admin message management | F-029, F-031 |
| M-10 Layout | READ (aggregate) | Unread count badge in admin sidebar | F-008, F-031 |
| M-08 → M-10 | EVENT | Supabase Realtime subscription for live badge updates | F-052 |

---

## 6. External System Dependencies

| External System | Dependency Type | Consuming Modules | Purpose | Features |
|----------------|----------------|-------------------|---------|----------|
| **Supabase Auth** | Configuration / Data | M-02 (Auth), M-03 (RLS) | Email/password authentication, session management, role-based RLS | F-004, F-005, F-003 |
| **Supabase Database (PostgreSQL)** | Data | M-03, M-04–M-09 | All entity persistence, RLS policies, indexes, triggers, ENUMs | F-002, F-003, F-057 |
| **Supabase Storage** | Data | M-13, M-04 | Phone image upload/download, bucket policies | F-011, F-040, F-043 |
| **Supabase Realtime** | Event | M-08 → M-10 | Live unread message count badge updates | F-052 |
| **PrimeNG / PrimeFlex** | Configuration | M-10, M-11, ALL UI | UI component library, responsive grid, theming | F-001, F-007–F-009, F-033–F-036 |
| **Chart.js (via PrimeNG Chart)** | Functional | M-09 | Dashboard charts (sales bar, stock doughnut) | F-027 |
| **Google Maps** | Functional | M-08 (Contact page) | Embedded map showing shop location | F-039 |
| **Google reCAPTCHA v3** | Functional | M-14 (Security) | Optional invisible bot detection for contact form | F-030 |
| **WhatsApp (wa.me)** | Functional | M-05 (Catalog), M-08 (Contact) | WhatsApp inquiry button on phone detail, WhatsApp button on contact page | F-018, F-029 |
| **Angular PWA (@angular/pwa)** | Configuration | M-12 | Service worker, web manifest, offline support | F-049 |

---

## 7. Dependency Risk Assessment

### 7.1 High Coupling Areas

| Risk | Modules | Description | Mitigation |
|------|---------|-------------|------------|
| **Phone entity over-coupling** | M-04, M-05, M-06, M-07, M-09, M-12 | Phone is referenced by 6 modules. Schema changes have wide blast radius. | Use a PhoneService abstraction layer; all modules consume Phone data through a shared service. Avoid direct Supabase client calls from components. |
| **PO Receiving atomicity** | M-06 ↔ M-04 | PO receiving creates multiple Phone records + updates PO status. Partial failure risks data inconsistency. | Implement as a Supabase database function (RPC) or use client-side transaction with rollback on failure. |
| **Mark as Sold atomicity** | M-04 ↔ M-07 | Creates Sale record AND updates Phone status. Must be atomic. | Same as above — use Supabase RPC or sequential operations with error handling and rollback. |
| **Sidebar badge coupling** | M-08 ↔ M-10 | Admin layout sidebar depends on ContactMessage unread count. Tight coupling between layout and messaging. | Use a shared MessageCountService (Angular injectable) that M-08 updates and M-10 observes via signals/BehaviorSubject. |

### 7.2 Circular Dependencies

No circular module dependencies detected. All dependency arrows are acyclic:
- M-06 → M-04 (receiving creates phones)
- M-04 → M-07 (mark as sold creates sale)
- M-07 → M-09 (sale data for dashboard)
- M-04 → M-09 (phone data for dashboard)
- M-08 → M-10 (unread count for sidebar)

### 7.3 Data Consistency Concerns

| Concern | Entities | Description |
|---------|----------|-------------|
| Sale.cost_price denormalization | Sale, Phone | `Sale.cost_price` is copied from `Phone.cost_price` at time of sale to avoid dependency on mutable Phone.cost_price. This is intentional denormalization — if Phone.cost_price changes after sale, the Sale record retains the original value. |
| PurchaseOrderItem text brand/model | PurchaseOrderItem, Brand, Phone | PO line items store brand and model as VARCHAR text (not FK references). This means PO items don't enforce referential integrity to Brand or Phone tables. This is by design — POs are created before phones exist. |
| Phone.status side effects | Phone, Sale, Catalog visibility | Changing Phone.status to 'sold' has side effects: creates Sale record (F-025), removes from public catalog (F-013), updates dashboard KPIs (F-026). Status changes must be coordinated. |

---

## 8. Feature-to-Module Mapping

| Feature | Module(s) | Cross-Module? | Dependencies |
|---------|-----------|---------------|--------------|
| F-001 | M-01 | No | — |
| F-002 | M-03 | No | — |
| F-003 | M-03, M-02 | Yes | M-02 Auth → M-03 RLS |
| F-004 | M-02 | No | — |
| F-005 | M-02 | Yes | M-02 → M-04, M-06–M-09 (guards) |
| F-006 | M-01, M-10 | Yes | M-10 Layout, M-02 Auth guard, references M-04–M-09 routes |
| F-007 | M-10 | No | — |
| F-008 | M-10 | Yes | M-02 Auth (user info), M-08 Messaging (unread count) |
| F-009 | M-04 | Yes | M-04 reads Brand (M-04 shared), PhoneImage (M-04/M-13) |
| F-010 | M-04 | Yes | M-04 reads Supplier (M-06), Brand (M-04 shared) |
| F-011 | M-04, M-13 | Yes | M-04 ↔ M-13 (Storage bucket) |
| F-012 | M-04 | No | — |
| F-013 | M-05 | Yes | M-05 reads Phone, PhoneImage, Brand (M-04 entities) |
| F-014 | M-05 | Yes | M-05 reads Brand.name, Phone.model (M-04 entities) |
| F-015 | M-05 | Yes | M-05 reads Brand (M-04 entity) for filter |
| F-016 | M-05 | No | Phone entity only |
| F-017 | M-05 | No | Phone entity only |
| F-018 | M-05 | Yes | M-05 reads Phone, PhoneImage, Brand (M-04 entities) |
| F-019 | M-06 | Yes | M-06 references PurchaseOrder (purchase history) |
| F-020 | M-06 | No | — |
| F-021 | M-06 | No | — |
| F-022 | M-06 | No | — |
| F-023 | M-06 → M-04 | **Yes (Critical)** | PO receiving creates Phone records (M-04) |
| F-024 | M-07 | Yes | M-07 reads Phone + Brand (M-04 entities) |
| F-025 | M-04 → M-07 | **Yes (Critical)** | Creates Sale (M-07), updates Phone.status (M-04) |
| F-026 | M-09 | Yes | Aggregates Phone (M-04) and Sale (M-07) |
| F-027 | M-09 | Yes | Aggregates Sale (M-07), Phone + Brand (M-04) |
| F-028 | M-09 | Yes | Reads Phone + Brand (M-04) |
| F-029 | M-08 | No | — |
| F-030 | M-14, M-08 | Yes | M-14 guards M-08 contact form |
| F-031 | M-08 | Yes | M-08 → M-10 (unread badge) |
| F-032 | M-10 | No | — |
| F-033 | M-11 | Yes (cross-cutting) | Used by all modules |
| F-034 | M-11 | Yes (cross-cutting) | Used by M-04, M-06, M-08 |
| F-035 | M-11 | Yes (cross-cutting) | Used by all modules |
| F-036 | M-10 | No | — |
| F-037 | M-12 | Yes | M-12 reads Phone, Brand, PhoneImage (M-04) |
| F-038 | M-01, M-11 | Yes | Error handler uses toast (M-11), redirects to login (M-02) |
| F-039 | M-08 | No | External: Google Maps |
| F-040 | M-13 | Yes | M-13 ↔ M-04 (PhoneImage entity) |
| F-041 | M-04 | Yes | Quick "Mark as Sold" triggers M-07 dialog |
| F-042 | M-10 | No (cross-cutting CSS/accessibility) | — |
| F-043 | M-13, M-05 | Yes | M-13 storage transforms → M-05 catalog images |
| F-044 | M-07 | Yes | M-07 reads Brand (M-04), exports Sale data |
| F-045 | M-04 | Yes | M-04 reads Brand, exports Phone data |
| F-046 | M-05 | Yes | URL state references Brand, PhoneCondition (M-04) |
| F-047 | M-06 | No | — |
| F-048 | M-09 | Yes | M-09 filters Sale (M-07) data by date range |
| F-049 | M-12 | No | External: @angular/pwa |
| F-050 | M-09 | Yes | M-09 reads Phone + Brand (M-04), links to M-06 PO creation |
| F-051 | M-04 | Yes | M-04 reads Brand for print label |
| F-052 | M-08 → M-10 | **Yes (Event)** | Realtime event from M-08 → M-10 sidebar |
| F-053 | M-05 | Yes | M-05 reads Phone, Brand (M-04 entities) |
| F-054 | M-04 | No | Phone entity only |
| F-055 | M-12 | Yes | M-12 reads Phone, Brand, PhoneImage (M-04) |
| F-056 | M-10 | No | External: PrimeNG theming |
| F-057 | M-03 | No | — |
| F-058 | M-14 | Yes (cross-cutting) | Affects all entities across all modules |
| F-059 | M-10 | No | — |
| F-060 | M-01 | No | — |

---

## 9. Summary Statistics

| Metric | Count |
|--------|-------|
| Total modules identified | 14 |
| Total entity-level FK relationships | 6 |
| Features with cross-module dependencies | 38 / 60 (63%) |
| Features without cross-module dependencies | 22 / 60 (37%) |
| Critical cross-module workflows | 3 (PO Receiving, Mark as Sold, Contact Message Lifecycle) |
| External system dependencies | 10 |
| High coupling risk areas | 4 |
| Circular dependencies | 0 |

### Most Connected Modules (by inbound + outbound dependencies)
1. **M-04 Inventory** — 8 connections (M-05, M-06, M-07, M-09, M-10, M-12, M-13, M-14)
2. **M-09 Dashboard** — 5 connections (M-04, M-06, M-07, M-11, M-14)
3. **M-05 Catalog** — 5 connections (M-04, M-12, M-13, M-11, M-14)
4. **M-02 Auth** — 7 outbound connections (guards all admin modules + RLS + layout)

### Most Referenced Entities
1. **Phone** — referenced by 6 modules (M-04, M-05, M-06, M-07, M-09, M-12)
2. **Brand** — referenced by 6 modules (M-04, M-05, M-06, M-07, M-09, M-12)
3. **PhoneImage** — referenced by 4 modules (M-04, M-05, M-12, M-13)
4. **Sale** — referenced by 3 modules (M-07, M-09, M-04)
5. **ContactMessage** — referenced by 3 modules (M-08, M-10, M-14)
