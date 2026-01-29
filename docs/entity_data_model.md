# Data Model Merge - phone-shop

> **Module:** phone-shop
> **Source:** entity_data_model_raw.md + cross-module-usage.md
> **Generated:** 2026-01-28

---

## Merge Summary

| Metric | Count |
|--------|-------|
| Entities Reused (from existing codebase) | 0 |
| Entities Enriched (attributes added to existing) | 0 |
| New Entities Created | 9 |
| Enumerations (Database-Persisted) | 3 |
| Enumerations (Frontend-Only) | 3 |
| Relationships (FK) | 6 |
| Database Indexes | 7 |
| Storage Buckets | 1 |
| RLS Policy Sets | 9 tables |

**Merge Decision:** No existing codebase entities were found. All 9 entities from the raw data model are finalized as new entities. No duplicates, no enrichment required. Cross-module dependencies are documented for implementation reference.

### Cross-Module Dependencies
- M-01 Infrastructure, M-02 Auth, M-03 Database Schema, M-04 Inventory, M-05 Catalog, M-06 Procurement, M-07 Sales, M-08 Messaging, M-09 Dashboard, M-10 Layout & UI, M-11 Shared Services, M-12 SEO & PWA, M-13 Storage, M-14 Security

### Entity Ownership by Module

| Entity | Owner Module | Consuming Modules |
|--------|-------------|-------------------|
| Brand | M-04 Inventory | M-05, M-06, M-07, M-09, M-12 |
| Phone | M-04 Inventory | M-05, M-06, M-07, M-09, M-12 |
| PhoneImage | M-04 Inventory | M-05, M-12, M-13 |
| Supplier | M-06 Procurement | M-04 |
| PurchaseOrder | M-06 Procurement | M-09 |
| PurchaseOrderItem | M-06 Procurement | -- |
| Sale | M-07 Sales | M-04, M-09 |
| ContactMessage | M-08 Messaging | M-10 |
| StockAlertConfig | M-09 Dashboard | -- |

---

## 1. Entities

### 1.1 Brand

- **Status**: New
- **Owner Module**: M-04 Inventory
- **Database Table**: `brands`
- **Description**: Represents a phone manufacturer/brand. Central reference entity used across inventory, catalog, procurement, sales, and SEO modules.

#### Attributes

| Attribute | Type | Constraints | Notes |
|-----------|------|-------------|-------|
| id | UUID | PK, auto-generated | Default: `gen_random_uuid()` |
| name | VARCHAR(100) | NOT NULL, UNIQUE | Plain text, sanitized on input. Used in catalog filters, search, PO receiving, sales list, SEO meta tags, JSON-LD, CSV exports, stock alerts, phone labels |
| logo_url | TEXT | NULLABLE | Publicly accessible URL for brand logo from Supabase Storage. Displayed in catalog filters |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Auto-generated on insert |
| updated_at | TIMESTAMPTZ | NULLABLE | Auto-updated via database trigger |

#### Relationships
- **Brand -> Phone**: One-to-Many (a brand has many phones)
- Referenced by 6 modules: M-04, M-05, M-06, M-07, M-09, M-12

---

### 1.2 Phone

- **Status**: New
- **Owner Module**: M-04 Inventory
- **Database Table**: `phones`
- **Description**: Core entity representing a phone in inventory. Most cross-referenced entity in the system -- referenced by 6 modules. Tracks full phone specifications, pricing, status, and supplier linkage.

#### Attributes

| Attribute | Type | Constraints | Notes |
|-----------|------|-------------|-------|
| id | UUID | PK, auto-generated | Default: `gen_random_uuid()` |
| brand_id | UUID | FK -> Brand(id), NOT NULL | Resolves brand name for display across catalog, sales, dashboard, SEO |
| model | VARCHAR(150) | NOT NULL | Plain text, sanitized. Phone model name |
| description | TEXT | NULLABLE, maxlength 5000 | Plain text without HTML interpretation. Used in JSON-LD structured data |
| storage_gb | INTEGER | NULLABLE | Storage capacity in GB. Used in catalog filters and phone labels |
| ram_gb | INTEGER | NULLABLE | RAM in GB. Displayed on detail page and comparison view |
| color | VARCHAR(50) | NULLABLE | Plain text, sanitized. Phone color |
| condition | PhoneCondition | NOT NULL | ENUM: 'new', 'used', 'refurbished'. Drives conditional visibility of battery_health |
| battery_health | INTEGER | NULLABLE, CHECK (0-100) | Percentage. Shown only when condition is 'used' or 'refurbished' |
| imei | VARCHAR(20) | NULLABLE, UNIQUE | Plain text, sanitized. International Mobile Equipment Identity |
| cost_price | DECIMAL | NOT NULL | Purchase cost. Used in profit calculations, KPI aggregates |
| selling_price | DECIMAL | NOT NULL | Retail price. Used in catalog display, sorting, filtering, SEO, profit margin |
| status | PhoneStatus | NOT NULL | ENUM: 'available', 'sold', 'reserved'. Controls catalog visibility and dashboard KPIs |
| purchase_date | DATE | NULLABLE | Date phone was purchased/acquired |
| supplier_id | UUID | FK -> Supplier(id), NULLABLE | Optional supplier linkage. Auto-set from PO during receiving workflow |
| notes | TEXT | NULLABLE, maxlength 2000 | Plain text without HTML interpretation. Internal admin notes |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Auto-generated. Used for "Newest First" catalog sort |
| updated_at | TIMESTAMPTZ | NULLABLE | Auto-updated via database trigger |

#### Relationships
- **Phone -> Brand**: Many-to-One via `brand_id` (NOT NULL)
- **Phone -> Supplier**: Many-to-One via `supplier_id` (NULLABLE)
- **Phone -> PhoneImage**: One-to-Many (CASCADE DELETE on images when phone deleted)
- **Phone -> Sale**: One-to-Many via `Sale.phone_id`

#### Database Indexes
| Index Name | Column(s) | Purpose |
|------------|-----------|---------|
| idx_phones_status | status | Catalog filter (status='available'), stock KPI queries, RLS evaluation |
| idx_phones_brand_id | brand_id | Brand filter on catalog, brand-grouped stock queries, join optimization |
| idx_phones_selling_price | selling_price | Price sorting and price range filtering |
| idx_phones_created_at | created_at | "Newest First" default sort, recently added phones query |

---

### 1.3 PhoneImage

- **Status**: New
- **Owner Module**: M-04 Inventory
- **Database Table**: `phone_images`
- **Description**: Stores metadata for phone images uploaded to Supabase Storage. Supports multiple images per phone with ordering and primary selection.

#### Attributes

| Attribute | Type | Constraints | Notes |
|-----------|------|-------------|-------|
| id | UUID | PK, auto-generated | Default: `gen_random_uuid()` |
| phone_id | UUID | FK -> Phone(id), NOT NULL, ON DELETE CASCADE | When phone is deleted, all images are cascade-deleted |
| image_url | TEXT | NOT NULL | Publicly accessible URL from Supabase Storage (phone-images bucket). Used with image transformations for responsive srcset and WebP |
| storage_path | TEXT | NOT NULL | Internal Supabase Storage bucket path for deletion operations |
| is_primary | BOOLEAN | NOT NULL, DEFAULT false | Only one per phone. Primary image loads first in gallery, used for og:image SEO tag |
| display_order | INTEGER | NOT NULL, DEFAULT 0 | Drag-to-reorder position. Determines lazy-load order in detail gallery thumbnails |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Auto-generated on insert |

#### Relationships
- **PhoneImage -> Phone**: Many-to-One via `phone_id` (NOT NULL, CASCADE DELETE)

#### Database Indexes
| Index Name | Column(s) | Purpose |
|------------|-----------|---------|
| idx_phone_images_phone_id | phone_id | Join optimization for Phone -> PhoneImage (catalog cards, detail gallery) |

---

### 1.4 Supplier

- **Status**: New
- **Owner Module**: M-06 Procurement
- **Database Table**: `suppliers`
- **Description**: Represents a phone supplier/vendor. Referenced by purchase orders and optionally by individual phone records.

#### Attributes

| Attribute | Type | Constraints | Notes |
|-----------|------|-------------|-------|
| id | UUID | PK, auto-generated | Default: `gen_random_uuid()` |
| name | VARCHAR(200) | NOT NULL | Plain text, sanitized. Supplier business name |
| contact_person | VARCHAR(200) | NULLABLE | Plain text, sanitized. Contact person name |
| contact_email | VARCHAR(255) | NULLABLE | Plain text, sanitized. Supplier email |
| contact_phone | VARCHAR(30) | NULLABLE | Plain text, sanitized. Supplier phone number |
| address | TEXT | NULLABLE, maxlength 1000 | Plain text without HTML interpretation |
| notes | TEXT | NULLABLE, maxlength 2000 | Plain text without HTML interpretation |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Auto-generated on insert |
| updated_at | TIMESTAMPTZ | NULLABLE | Auto-updated via database trigger |

#### Relationships
- **Supplier -> PurchaseOrder**: One-to-Many (ON DELETE RESTRICT -- cannot delete supplier with existing POs)
- **Supplier -> Phone**: One-to-Many via `Phone.supplier_id` (optional reference)

---

### 1.5 PurchaseOrder

- **Status**: New
- **Owner Module**: M-06 Procurement
- **Database Table**: `purchase_orders`
- **Description**: Represents a purchase order placed with a supplier. Supports a lifecycle workflow: pending -> received (via receiving workflow) or pending -> cancelled (irreversible).

#### Attributes

| Attribute | Type | Constraints | Notes |
|-----------|------|-------------|-------|
| id | UUID | PK, auto-generated | Default: `gen_random_uuid()` |
| po_number | VARCHAR | NOT NULL, UNIQUE | Human-readable PO number (e.g., PO-0001). Displayed in list view |
| supplier_id | UUID | FK -> Supplier(id), NOT NULL, ON DELETE RESTRICT | Cannot delete supplier while POs exist |
| order_date | DATE | NOT NULL | Date the PO was placed |
| total_amount | DECIMAL | NOT NULL | Auto-calculated: sum of (quantity * unit_cost) for all line items |
| status | PurchaseOrderStatus | NOT NULL, DEFAULT 'pending' | ENUM: 'pending', 'received', 'cancelled'. Color-coded: pending=orange, received=green, cancelled=red |
| notes | TEXT | NULLABLE, maxlength 2000 | Plain text without HTML interpretation |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Auto-generated on insert |
| updated_at | TIMESTAMPTZ | NULLABLE | Auto-updated via database trigger |

#### Relationships
- **PurchaseOrder -> Supplier**: Many-to-One via `supplier_id` (NOT NULL, RESTRICT DELETE)
- **PurchaseOrder -> PurchaseOrderItem**: One-to-Many (CASCADE DELETE on items when PO deleted)

#### Status Transitions
```
[pending] --"Mark as Received"--> [received]
[pending] --"Cancel Order"------> [cancelled]
```
- `received` and `cancelled` are terminal states -- no further transitions allowed.
- Cancel is irreversible and requires confirmation dialog.

---

### 1.6 PurchaseOrderItem

- **Status**: New
- **Owner Module**: M-06 Procurement
- **Database Table**: `purchase_order_items`
- **Description**: Line item within a purchase order. Stores brand/model as text (not FK) because PO items are created before phone inventory records exist. Drives phone record generation during the receiving workflow.

#### Attributes

| Attribute | Type | Constraints | Notes |
|-----------|------|-------------|-------|
| id | UUID | PK, auto-generated | Default: `gen_random_uuid()` |
| purchase_order_id | UUID | FK -> PurchaseOrder(id), NOT NULL, ON DELETE CASCADE | Line items deleted when PO is deleted |
| brand | VARCHAR(100) | NOT NULL | Brand name as text (not FK to Brand). Pre-filled into phone forms during receiving |
| model | VARCHAR(150) | NOT NULL | Model name as text. Pre-filled into phone forms during receiving |
| quantity | INTEGER | NOT NULL, CHECK >= 1 | Number of units. Determines how many phone record forms are generated during receiving |
| unit_cost | DECIMAL | NOT NULL | Cost per unit. Maps to Phone.cost_price during receiving |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Auto-generated on insert |

#### Relationships
- **PurchaseOrderItem -> PurchaseOrder**: Many-to-One via `purchase_order_id` (NOT NULL, CASCADE DELETE)

#### Design Note
Brand and model are stored as VARCHAR text rather than FK references. This is intentional -- PO items are created before the corresponding Phone and Brand records exist in inventory. The brand text is resolved to a Brand entity during the receiving workflow.

---

### 1.7 Sale

- **Status**: New
- **Owner Module**: M-07 Sales
- **Database Table**: `sales`
- **Description**: Records a completed phone sale. Created via the "Mark as Sold" workflow. Contains denormalized cost_price to preserve profit calculation accuracy even if Phone.cost_price is later modified.

#### Attributes

| Attribute | Type | Constraints | Notes |
|-----------|------|-------------|-------|
| id | UUID | PK, auto-generated | Default: `gen_random_uuid()` |
| phone_id | UUID | FK -> Phone(id), NOT NULL | References the sold phone. Used to resolve brand+model for display |
| sale_date | DATE | NOT NULL | Defaults to today in Mark as Sold dialog. Used for date range filtering and dashboard charts |
| sale_price | DECIMAL | NOT NULL | Final sale price. Pre-filled from Phone.selling_price. Aggregated for revenue KPI |
| cost_price | DECIMAL | NOT NULL | Denormalized from Phone.cost_price at time of sale. Avoids dependency on mutable Phone.cost_price |
| buyer_name | VARCHAR(200) | NULLABLE | Plain text, sanitized. Buyer/customer name |
| buyer_phone | VARCHAR(30) | NULLABLE | Plain text, sanitized. Buyer phone number |
| buyer_email | VARCHAR(255) | NULLABLE | Plain text, sanitized. Buyer email address |
| notes | TEXT | NULLABLE, maxlength 2000 | Plain text without HTML interpretation |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Auto-generated on insert |
| updated_at | TIMESTAMPTZ | NULLABLE | Auto-updated via database trigger |

#### Relationships
- **Sale -> Phone**: Many-to-One via `phone_id` (NOT NULL)

#### Database Indexes
| Index Name | Column(s) | Purpose |
|------------|-----------|---------|
| idx_sales_sale_date | sale_date | Date range filtering on sales list, dashboard charts monthly aggregation |

#### Denormalization Note
`Sale.cost_price` is intentionally denormalized -- it captures `Phone.cost_price` at the moment of sale. If the phone's cost_price is later corrected, the Sale record retains the original value used for profit calculation. This is a deliberate design decision.

---

### 1.8 ContactMessage

- **Status**: New
- **Owner Module**: M-08 Messaging
- **Database Table**: `contact_messages`
- **Description**: Stores messages submitted by public visitors via the contact form. Supports read/unread tracking with real-time badge updates in the admin sidebar.

#### Attributes

| Attribute | Type | Constraints | Notes |
|-----------|------|-------------|-------|
| id | UUID | PK, auto-generated | Default: `gen_random_uuid()` |
| name | VARCHAR(200) | NOT NULL | Plain text, sanitized. Sender name from contact form |
| email | VARCHAR(255) | NOT NULL | Plain text, sanitized. Validated for email format |
| phone | VARCHAR(30) | NULLABLE | Plain text, sanitized. Optional phone number |
| subject | VARCHAR(300) | NULLABLE | Plain text, sanitized. Optional subject line |
| message | TEXT | NOT NULL, maxlength 5000 | Plain text without HTML interpretation. Truncated to 50 chars for preview in admin table. Full text in expandable row. No script execution in admin view |
| is_read | BOOLEAN | NOT NULL, DEFAULT false | Toggled per message in admin view. Unread count drives sidebar badge. Monitored by Supabase Realtime for live badge updates |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Auto-generated. Default sort descending in admin table |

#### Relationships
- No FK relationships to other entities.
- Cross-module dependency: M-10 Layout consumes unread count for sidebar badge.

#### Database Indexes
| Index Name | Column(s) | Purpose |
|------------|-----------|---------|
| idx_contact_messages_is_read | is_read | Unread message count badge query (WHERE is_read=false) |

---

### 1.9 StockAlertConfig

- **Status**: New
- **Owner Module**: M-09 Dashboard
- **Database Table**: `stock_alert_configs`
- **Description**: Singleton configuration entity (single row) storing thresholds for dashboard stock alerts. Alerts are computed dynamically at query time -- no alert records are persisted.

#### Attributes

| Attribute | Type | Constraints | Notes |
|-----------|------|-------------|-------|
| id | UUID | PK, auto-generated | Default: `gen_random_uuid()`. Only one row exists |
| low_stock_threshold | INTEGER | NOT NULL, DEFAULT 5, CHECK >= 0 | Total available stock count below which a low-stock warning is shown |
| enable_brand_zero_alert | BOOLEAN | NOT NULL, DEFAULT true | When true, shows per-brand alert for brands with zero available stock |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Auto-generated on insert |
| updated_at | TIMESTAMPTZ | NULLABLE | Auto-updated via database trigger |

#### Relationships
- No FK relationships. Reads Phone and Brand entities at query time to compute alerts.

#### Singleton Note
This table contains exactly one row. The application should seed this row during initial setup. Alert computation queries `Phone` records where `status='available'`, grouped by `Brand` via `brand_id`, and compares counts against the configured thresholds.

---

## 2. Enumerations

### 2.1 Database-Persisted Enumerations

These enumerations are implemented as PostgreSQL ENUM types (or CHECK constraints) and stored in the database.

#### 2.1.1 PhoneCondition

| Value | Description |
|-------|-------------|
| new | Brand new phone. Mapped to schema.org/NewCondition in JSON-LD (F-055) |
| used | Pre-owned / used phone. Mapped to schema.org/UsedCondition in JSON-LD (F-055) |
| refurbished | Factory refurbished phone |

**Used by**: Phone.condition

#### 2.1.2 PhoneStatus

| Value | Description |
|-------|-------------|
| available | Phone is available for purchase. Default for PO receiving. Counted for stock alerts. Mapped to schema.org/InStock in JSON-LD |
| sold | Phone has been sold. Set by Mark as Sold dialog. Removes phone from public catalog |
| reserved | Phone is reserved for a customer. Set via inventory quick action |

**Used by**: Phone.status

#### 2.1.3 PurchaseOrderStatus

| Value | Description |
|-------|-------------|
| pending | Awaiting fulfillment. Default on creation. Color: orange. Actions available: Mark as Received, Cancel |
| received | Received from supplier. Color: green. Terminal state -- no further actions. Set by receiving workflow |
| cancelled | Cancelled by admin. Color: red. Terminal state -- irreversible. Set by cancel workflow with confirmation dialog |

**Used by**: PurchaseOrder.status

### 2.2 Frontend-Only Enumerations

These enumerations exist only in TypeScript application code and are NOT stored in the database.

#### 2.2.1 UserRole

| Value | Description |
|-------|-------------|
| anon | Anonymous (unauthenticated) user. Used in RLS policies |
| authenticated | Authenticated admin user with full CRUD access. Used in RLS policies |

**Purpose**: Maps to Supabase Auth roles for RLS policy evaluation.

#### 2.2.2 DashboardDateRange

| Value | Description |
|-------|-------------|
| this_month | Current calendar month |
| last_30_days | Last 30 days from today |
| this_quarter | Current calendar quarter |
| this_year | Current calendar year |
| all_time | No date filtering -- all historical data |
| custom | Admin selects custom start/end date via picker |

**Purpose**: Preset options for dashboard date range selector. Filters Sale queries at runtime.

#### 2.2.3 ThemeMode

| Value | Description |
|-------|-------------|
| light | PrimeNG light theme (default if no system preference) |
| dark | PrimeNG dark theme |

**Purpose**: Theme toggle state. Persisted in localStorage, restored on visit. Respects `prefers-color-scheme` on first visit.

---

## 3. Relationships

### 3.1 Entity Relationship Diagram (Textual)

```
Brand (1) ──────────────── (*) Phone
                                │
Phone (1) ──────────────── (*) PhoneImage
                                │
Phone (*) ──────────────── (1) Supplier [NULLABLE]
                                │
Supplier (1) ──────────── (*) PurchaseOrder
                                │
PurchaseOrder (1) ─────── (*) PurchaseOrderItem
                                │
Phone (1) ──────────────── (*) Sale
```

### 3.2 Relationship Details

| Relationship | Type | FK Column | FK Table | Constraint | Description |
|-------------|------|-----------|----------|------------|-------------|
| Brand -> Phone | One-to-Many | brand_id | phones | NOT NULL | Each phone belongs to one brand |
| Phone -> PhoneImage | One-to-Many | phone_id | phone_images | NOT NULL, CASCADE DELETE | Images deleted when phone is deleted |
| Phone -> Supplier | Many-to-One | supplier_id | phones | NULLABLE | Optional supplier reference. Auto-set from PO during receiving |
| Supplier -> PurchaseOrder | One-to-Many | supplier_id | purchase_orders | NOT NULL, RESTRICT DELETE | Cannot delete supplier with existing POs |
| PurchaseOrder -> PurchaseOrderItem | One-to-Many | purchase_order_id | purchase_order_items | NOT NULL, CASCADE DELETE | Line items deleted when PO is deleted |
| Phone -> Sale | One-to-Many | phone_id | sales | NOT NULL | Sales reference sold phone. Phone brand+model resolved via join |

---

## 4. Access Control Policies (RLS)

> All tables have Row Level Security (RLS) enabled. Policies use the Supabase `TO` clause to target `anon` or `authenticated` roles. `auth.uid()` is wrapped as `(select auth.uid())` for query caching optimization.

### 4.1 Public Tables (Anonymous Read Access)

| Table | Role | SELECT | INSERT | UPDATE | DELETE |
|-------|------|--------|--------|--------|--------|
| brands | anon | YES | NO | NO | NO |
| brands | authenticated | YES | YES | YES | YES |
| phones | anon | YES | NO | NO | NO |
| phones | authenticated | YES | YES | YES | YES |
| phone_images | anon | YES | NO | NO | NO |
| phone_images | authenticated | YES | YES | YES | YES |

### 4.2 Contact Messages (Anonymous Insert Access)

| Table | Role | SELECT | INSERT | UPDATE | DELETE |
|-------|------|--------|--------|--------|--------|
| contact_messages | anon | NO | YES | NO | NO |
| contact_messages | authenticated | YES | YES | YES | YES |

> Anonymous INSERT is protected by spam prevention (honeypot, rate limiting, optional reCAPTCHA v3).

### 4.3 Private Tables (Authenticated Only)

| Table | Role | SELECT | INSERT | UPDATE | DELETE |
|-------|------|--------|--------|--------|--------|
| suppliers | anon | NO | NO | NO | NO |
| suppliers | authenticated | YES | YES | YES | YES |
| purchase_orders | anon | NO | NO | NO | NO |
| purchase_orders | authenticated | YES | YES | YES | YES |
| purchase_order_items | anon | NO | NO | NO | NO |
| purchase_order_items | authenticated | YES | YES | YES | YES |
| sales | anon | NO | NO | NO | NO |
| sales | authenticated | YES | YES | YES | YES |
| stock_alert_configs | anon | NO | NO | NO | NO |
| stock_alert_configs | authenticated | YES | YES | YES | YES |

### 4.4 RLS Implementation Notes

- RLS is enabled on ALL tables.
- Policies target `anon` or `authenticated` roles via `TO` clause.
- `auth.uid()` is wrapped as `(select auth.uid())` for performance.
- Default deny: tables without explicit `anon` policy return zero rows to anonymous users.
- Auth dependency: RLS policies rely on Supabase Auth session state (M-02).

---

## 5. Database Indexes

| Index Name | Table | Column(s) | Purpose |
|------------|-------|-----------|---------|
| idx_phones_status | phones | status | Catalog filtering, stock KPI queries, RLS evaluation |
| idx_phones_brand_id | phones | brand_id | Brand filter, brand-grouped stock queries, join optimization |
| idx_phones_selling_price | phones | selling_price | Price sorting (ASC/DESC) and price range filtering |
| idx_phones_created_at | phones | created_at | "Newest First" sort, recently added phones query |
| idx_phone_images_phone_id | phone_images | phone_id | Join optimization for Phone -> PhoneImage |
| idx_sales_sale_date | sales | sale_date | Date range filtering, dashboard monthly aggregation |
| idx_contact_messages_is_read | contact_messages | is_read | Unread message count badge query |

---

## 6. Storage Bucket Configuration

### 6.1 phone-images

| Property | Value |
|----------|-------|
| Bucket Name | `phone-images` |
| Access | Public (read); Authenticated-only (upload/update/delete) |
| Max File Size | 5 MB |
| Allowed MIME Types | image/jpeg, image/png, image/webp |
| Path Structure | `phone-images/{phone_id}/{filename}` |
| Related Entity | PhoneImage (`image_url` stores public URL, `storage_path` stores bucket path) |
| Image Transformations | Supabase transforms for responsive sizing (300px thumbnails for catalog, full size for gallery) and WebP format preference |

#### Storage RLS Policies

| Operation | anon | authenticated |
|-----------|------|---------------|
| SELECT (read/download) | YES | YES |
| INSERT (upload) | NO | YES |
| UPDATE | NO | YES |
| DELETE | NO | YES |

#### Implementation Notes
- Client-side validation (file type + 5MB limit) before upload.
- Bucket-level constraints serve as server-side safety net.
- Public URL -> `PhoneImage.image_url`
- Internal path -> `PhoneImage.storage_path`

---

## 7. Database Triggers

The following `updated_at` triggers are required on tables that have the `updated_at` column:

| Table | Trigger | Function | Description |
|-------|---------|----------|-------------|
| brands | trg_brands_updated_at | set_updated_at() | Sets `updated_at = now()` on UPDATE |
| phones | trg_phones_updated_at | set_updated_at() | Sets `updated_at = now()` on UPDATE |
| suppliers | trg_suppliers_updated_at | set_updated_at() | Sets `updated_at = now()` on UPDATE |
| purchase_orders | trg_purchase_orders_updated_at | set_updated_at() | Sets `updated_at = now()` on UPDATE |
| sales | trg_sales_updated_at | set_updated_at() | Sets `updated_at = now()` on UPDATE |
| stock_alert_configs | trg_stock_alert_configs_updated_at | set_updated_at() | Sets `updated_at = now()` on UPDATE |

### Shared Trigger Function

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 8. Critical Cross-Module Workflows

### 8.1 Purchase Order Receiving (M-06 -> M-04)

**Modules**: M-06 Procurement -> M-04 Inventory -> M-09 Dashboard

1. Admin clicks "Mark as Received" on a pending PO (M-06)
2. For each PurchaseOrderItem with quantity=N, N phone record forms are generated
3. Admin enters per-unit details: color, IMEI, condition, battery_health, selling_price, storage_gb, ram_gb
4. On confirmation (atomic operation):
   - `PurchaseOrder.status` -> 'received'
   - N `Phone` records created with `status='available'`, `supplier_id` from PO's supplier, `cost_price` from item's `unit_cost`
   - Brand resolved from PO line item text
5. Dashboard stock counts update (M-09)

**Atomicity requirement**: Use Supabase RPC (database function) or client-side transaction with rollback on failure.

### 8.2 Mark as Sold (M-04 -> M-07)

**Modules**: M-04 Inventory -> M-07 Sales -> M-05 Catalog -> M-09 Dashboard

1. Admin triggers "Mark as Sold" from inventory list (M-04)
2. Sale dialog opens with `sale_price` pre-filled from `Phone.selling_price` (M-07)
3. Admin enters buyer info, confirms
4. On confirmation (atomic operation):
   - `Sale` record created with `cost_price` from `Phone.cost_price`
   - `Phone.status` -> 'sold'
   - Phone disappears from public catalog (M-05)
   - Dashboard KPIs update (M-09)

**Atomicity requirement**: Use Supabase RPC or sequential operations with error handling and rollback.

### 8.3 Contact Message Lifecycle (Public -> M-08 -> M-10)

1. Public visitor submits contact form (anonymous INSERT via RLS)
2. Spam prevention validates (honeypot, rate limiting, optional reCAPTCHA)
3. `ContactMessage` created with `is_read=false`
4. Supabase Realtime fires INSERT event
5. Admin sidebar badge increments (M-10)
6. Admin reads/manages messages, toggles `is_read` (M-08)
7. Sidebar badge updates in real-time via Realtime subscription (M-10)

---

## 9. Data Consistency Concerns

| Concern | Entities | Description | Mitigation |
|---------|----------|-------------|------------|
| Sale.cost_price denormalization | Sale, Phone | `Sale.cost_price` is copied from `Phone.cost_price` at sale time. If Phone.cost_price changes after sale, Sale retains original value | Intentional design -- ensures profit calculations remain historically accurate |
| PurchaseOrderItem text brand/model | PurchaseOrderItem, Brand, Phone | PO line items store brand/model as VARCHAR text, not FK references | By design -- POs are created before phones exist in inventory |
| Phone.status side effects | Phone, Sale, Catalog | Changing Phone.status to 'sold' has cascading side effects (Sale creation, catalog removal, KPI updates) | Status changes must be coordinated through atomic workflows |
| Phone entity over-coupling | 6 modules | Phone is referenced by M-04, M-05, M-06, M-07, M-09, M-12 | Use a shared PhoneService abstraction layer. All modules consume Phone data through this service |

---

## 10. Implementation Notes

### 10.1 Technology Stack Context

- **Database**: Supabase (PostgreSQL)
- **Backend**: Supabase (serverless -- RLS, Storage, Realtime, Auth)
- **Frontend**: Angular with PrimeNG components and PrimeFlex CSS
- **Auth**: Supabase Auth (email/password, session management)

### 10.2 Migration Order

Database migrations should be executed in this order to respect FK dependencies:

1. Create shared function: `set_updated_at()` trigger function
2. Create enums: `PhoneCondition`, `PhoneStatus`, `PurchaseOrderStatus`
3. Create table: `brands` (no FK dependencies)
4. Create table: `suppliers` (no FK dependencies)
5. Create table: `phones` (depends on: brands, suppliers)
6. Create table: `phone_images` (depends on: phones)
7. Create table: `purchase_orders` (depends on: suppliers)
8. Create table: `purchase_order_items` (depends on: purchase_orders)
9. Create table: `sales` (depends on: phones)
10. Create table: `contact_messages` (no FK dependencies)
11. Create table: `stock_alert_configs` (no FK dependencies)
12. Create indexes on all tables
13. Enable RLS and create policies on all tables
14. Create `updated_at` triggers on applicable tables
15. Configure `phone-images` storage bucket and policies
16. Seed `stock_alert_configs` with default row

### 10.3 Angular Service Architecture

To mitigate the high coupling risk around the Phone entity, implement a shared service layer:

| Service | Module | Entities Managed | Consuming Modules |
|---------|--------|-----------------|-------------------|
| BrandService | M-04 | Brand | M-04, M-05, M-06, M-09, M-12 |
| PhoneService | M-04 | Phone, PhoneImage | M-04, M-05, M-06, M-07, M-09, M-12 |
| SupplierService | M-06 | Supplier | M-04, M-06 |
| PurchaseOrderService | M-06 | PurchaseOrder, PurchaseOrderItem | M-06, M-09 |
| SaleService | M-07 | Sale | M-04, M-07, M-09 |
| ContactMessageService | M-08 | ContactMessage | M-08, M-10 |
| StockAlertConfigService | M-09 | StockAlertConfig | M-09 |
| MessageCountService | Shared | -- (reads ContactMessage.is_read) | M-08, M-10 |

### 10.4 Supabase Realtime Subscriptions

| Table | Events | Consumer | Purpose |
|-------|--------|----------|---------|
| contact_messages | INSERT, UPDATE | M-10 Layout (sidebar) | Live unread message count badge |

Subscription lifecycle: established on admin login, cleaned up on logout, auto-reconnect on network interruption.

### 10.5 Security (Cross-Cutting - M-14)

All user-input fields across all 9 entities enforce:
- `maxlength` constraints at both Angular form validation and PostgreSQL levels
- Plain text storage -- no HTML interpretation for notes, description, message, address fields
- Angular DomSanitizer for template bindings (no `bypassSecurityTrust*` unless documented)
- Contact form spam prevention: honeypot, client-side rate limiting, optional reCAPTCHA v3

### 10.6 External System Dependencies

| System | Purpose | Consuming Modules |
|--------|---------|-------------------|
| Supabase Auth | Email/password auth, sessions, role-based RLS | M-02, M-03 |
| Supabase Database (PostgreSQL) | All entity persistence, RLS, indexes, triggers, enums | M-03, M-04--M-09 |
| Supabase Storage | Phone image upload/download, bucket policies | M-04, M-13 |
| Supabase Realtime | Live unread message badge updates | M-08, M-10 |
| PrimeNG / PrimeFlex | UI components, responsive grid, theming | M-10, M-11, all UI |
| Chart.js (via PrimeNG Chart) | Dashboard charts (sales bar, stock doughnut) | M-09 |
| Google Maps | Embedded map on contact page | M-08 |
| Google reCAPTCHA v3 | Optional bot detection for contact form | M-14 |
| WhatsApp (wa.me) | Inquiry button on phone detail and contact pages | M-05, M-08 |
| Angular PWA (@angular/pwa) | Service worker, web manifest, offline support | M-12 |

---

## 11. Feature-to-Entity Traceability

| Entity | Feature References |
|--------|--------------------|
| Brand | F-002, F-003, F-009, F-010, F-012, F-013, F-014, F-015, F-018, F-024, F-027, F-028, F-037, F-044, F-045, F-046, F-050, F-051, F-053, F-055, F-058 |
| Phone | F-002, F-003, F-009, F-010, F-013, F-014, F-015, F-016, F-017, F-018, F-023, F-024, F-025, F-026, F-027, F-028, F-034, F-037, F-041, F-044, F-045, F-046, F-050, F-051, F-053, F-054, F-055, F-057, F-058 |
| PhoneImage | F-002, F-003, F-009, F-011, F-013, F-018, F-037, F-040, F-043, F-055, F-057 |
| Supplier | F-002, F-003, F-010, F-019, F-020, F-021, F-022, F-023, F-034, F-058 |
| PurchaseOrder | F-002, F-003, F-020, F-021, F-022, F-023, F-034, F-047, F-058 |
| PurchaseOrderItem | F-002, F-003, F-021, F-022, F-023, F-058 |
| Sale | F-002, F-003, F-024, F-025, F-026, F-027, F-044, F-048, F-057, F-058 |
| ContactMessage | F-002, F-003, F-029, F-030, F-031, F-034, F-052, F-057, F-058 |
| StockAlertConfig | F-050 |
