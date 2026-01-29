-- Migration: Initial Schema for phone-shop
-- Feature: F-002 - Supabase Database Schema and Migrations
-- Creates all tables, enums, indexes, triggers, and RLS policies

-- ============================================================
-- 1. SHARED TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 2. ENUM TYPES
-- ============================================================

-- Phone condition enum
CREATE TYPE phone_condition AS ENUM ('new', 'used', 'refurbished');

-- Phone status enum
CREATE TYPE phone_status AS ENUM ('available', 'sold', 'reserved');

-- Purchase order status enum
CREATE TYPE purchase_order_status AS ENUM ('pending', 'received', 'cancelled');

-- ============================================================
-- 3. TABLES (in FK dependency order)
-- ============================================================

-- 3.1 Brands table (no FK dependencies)
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- 3.2 Suppliers table (no FK dependencies)
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(200),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(30),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  CONSTRAINT suppliers_address_maxlength CHECK (char_length(address) <= 1000),
  CONSTRAINT suppliers_notes_maxlength CHECK (char_length(notes) <= 2000)
);

-- 3.3 Phones table (depends on: brands, suppliers)
CREATE TABLE phones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id),
  model VARCHAR(150) NOT NULL,
  description TEXT,
  storage_gb INTEGER,
  ram_gb INTEGER,
  color VARCHAR(50),
  condition phone_condition NOT NULL,
  battery_health INTEGER,
  imei VARCHAR(20) UNIQUE,
  cost_price DECIMAL NOT NULL,
  selling_price DECIMAL NOT NULL,
  status phone_status NOT NULL DEFAULT 'available',
  purchase_date DATE,
  supplier_id UUID REFERENCES suppliers(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  CONSTRAINT phones_description_maxlength CHECK (char_length(description) <= 5000),
  CONSTRAINT phones_notes_maxlength CHECK (char_length(notes) <= 2000),
  CONSTRAINT phones_battery_health_range CHECK (battery_health IS NULL OR (battery_health >= 0 AND battery_health <= 100))
);

-- 3.4 Phone images table (depends on: phones)
CREATE TABLE phone_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_id UUID NOT NULL REFERENCES phones(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.5 Purchase orders table (depends on: suppliers)
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number VARCHAR(50) NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  order_date DATE NOT NULL,
  total_amount DECIMAL NOT NULL,
  status purchase_order_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  CONSTRAINT purchase_orders_notes_maxlength CHECK (char_length(notes) <= 2000)
);

-- 3.6 Purchase order items table (depends on: purchase_orders)
CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(150) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT purchase_order_items_quantity_min CHECK (quantity >= 1)
);

-- 3.7 Sales table (depends on: phones)
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_id UUID NOT NULL REFERENCES phones(id),
  sale_date DATE NOT NULL,
  sale_price DECIMAL NOT NULL,
  cost_price DECIMAL NOT NULL,
  buyer_name VARCHAR(200),
  buyer_phone VARCHAR(30),
  buyer_email VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  CONSTRAINT sales_notes_maxlength CHECK (char_length(notes) <= 2000)
);

-- 3.8 Contact messages table (no FK dependencies)
CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  subject VARCHAR(300),
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT contact_messages_message_maxlength CHECK (char_length(message) <= 5000)
);

-- 3.9 Stock alert configs table (singleton, no FK dependencies)
CREATE TABLE stock_alert_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  enable_brand_zero_alert BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  CONSTRAINT stock_alert_configs_threshold_min CHECK (low_stock_threshold >= 0)
);

-- ============================================================
-- 4. INDEXES (F-057 Acceptance Criteria Compliance)
-- ============================================================
--
-- AC1: phones table - status, brand_id, selling_price, created_at
-- AC2: phone_images table - phone_id
-- AC3: sales table - sale_date
-- AC4: contact_messages table - is_read
-- AC5: RLS policy columns - N/A (role-based RLS, not per-user)
-- AC6: Index scans for catalog queries - validated via query patterns
--
-- Note: Additional composite indexes are added in
-- 20260128000004_performance_indexes.sql for query optimization
-- ============================================================

-- AC1: Phones indexes (catalog filtering, sorting, FK joins)
CREATE INDEX idx_phones_status ON phones(status);          -- Catalog filter: status='available'
CREATE INDEX idx_phones_brand_id ON phones(brand_id);      -- Brand filter, FK join optimization
CREATE INDEX idx_phones_selling_price ON phones(selling_price); -- Price sorting/filtering
CREATE INDEX idx_phones_created_at ON phones(created_at);  -- "Newest first" default sort

-- AC2: Phone images index (FK join optimization)
CREATE INDEX idx_phone_images_phone_id ON phone_images(phone_id);

-- AC3: Sales index (date range filtering, monthly aggregation)
CREATE INDEX idx_sales_sale_date ON sales(sale_date);

-- AC4: Contact messages index (unread count badge query)
CREATE INDEX idx_contact_messages_is_read ON contact_messages(is_read);

-- ============================================================
-- 5. UPDATED_AT TRIGGERS
-- ============================================================

CREATE TRIGGER trg_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_phones_updated_at
  BEFORE UPDATE ON phones
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_stock_alert_configs_updated_at
  BEFORE UPDATE ON stock_alert_configs
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- Feature: F-003 - Row Level Security (RLS) Policies
--
-- Design Decisions:
-- -----------------
-- 1. All policies use the TO clause to explicitly target roles (anon/authenticated)
--    rather than relying solely on auth.uid() checks for role-based access.
--
-- 2. Since this application uses role-based access (not per-user row ownership),
--    policies use USING (true) / WITH CHECK (true) for simplicity.
--    - No auth.uid() filtering is needed because all authenticated users
--      have the same admin privileges.
--    - The auth.uid() caching optimization (select auth.uid()) would only
--      be applicable if we implemented per-user row filtering.
--
-- 3. Access Control Matrix:
--    +----------------------+------+---------------+
--    | Table                | Anon | Authenticated |
--    +----------------------+------+---------------+
--    | brands               | R    | CRUD          |
--    | phones               | R    | CRUD          |
--    | phone_images         | R    | CRUD          |
--    | contact_messages     | -C-  | CRUD          |  (C=Create only for anon)
--    | suppliers            | -    | CRUD          |
--    | purchase_orders      | -    | CRUD          |
--    | purchase_order_items | -    | CRUD          |
--    | sales                | -    | CRUD          |
--    | stock_alert_configs  | -    | CRUD          |
--    +----------------------+------+---------------+
--
-- Acceptance Criteria Compliance:
-- -------------------------------
-- AC1: Anonymous SELECT on phones - phones_anon_select policy
-- AC2: Anonymous INSERT on phones denied - no anon INSERT policy
-- AC3: Anonymous INSERT on contact_messages - contact_messages_anon_insert
-- AC4: Anonymous SELECT on suppliers returns zero - no anon policy
-- AC5: Authenticated full CRUD - *_authenticated_* policies
-- AC6: TO clause specifies role - all policies use TO anon/authenticated
-- AC7: auth.uid() caching - N/A (no per-user row filtering implemented)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_alert_configs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6.1 Brands RLS Policies (Public read, authenticated write)
-- ============================================================

CREATE POLICY "brands_anon_select" ON brands
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "brands_authenticated_select" ON brands
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "brands_authenticated_insert" ON brands
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "brands_authenticated_update" ON brands
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "brands_authenticated_delete" ON brands
  FOR DELETE TO authenticated
  USING (true);

-- ============================================================
-- 6.2 Phones RLS Policies (Public read, authenticated write)
-- ============================================================

CREATE POLICY "phones_anon_select" ON phones
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "phones_authenticated_select" ON phones
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "phones_authenticated_insert" ON phones
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "phones_authenticated_update" ON phones
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "phones_authenticated_delete" ON phones
  FOR DELETE TO authenticated
  USING (true);

-- ============================================================
-- 6.3 Phone Images RLS Policies (Public read, authenticated write)
-- ============================================================

CREATE POLICY "phone_images_anon_select" ON phone_images
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "phone_images_authenticated_select" ON phone_images
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "phone_images_authenticated_insert" ON phone_images
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "phone_images_authenticated_update" ON phone_images
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "phone_images_authenticated_delete" ON phone_images
  FOR DELETE TO authenticated
  USING (true);

-- ============================================================
-- 6.4 Suppliers RLS Policies (Authenticated only)
-- ============================================================

CREATE POLICY "suppliers_authenticated_select" ON suppliers
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "suppliers_authenticated_insert" ON suppliers
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "suppliers_authenticated_update" ON suppliers
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "suppliers_authenticated_delete" ON suppliers
  FOR DELETE TO authenticated
  USING (true);

-- ============================================================
-- 6.5 Purchase Orders RLS Policies (Authenticated only)
-- ============================================================

CREATE POLICY "purchase_orders_authenticated_select" ON purchase_orders
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "purchase_orders_authenticated_insert" ON purchase_orders
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "purchase_orders_authenticated_update" ON purchase_orders
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "purchase_orders_authenticated_delete" ON purchase_orders
  FOR DELETE TO authenticated
  USING (true);

-- ============================================================
-- 6.6 Purchase Order Items RLS Policies (Authenticated only)
-- ============================================================

CREATE POLICY "purchase_order_items_authenticated_select" ON purchase_order_items
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "purchase_order_items_authenticated_insert" ON purchase_order_items
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "purchase_order_items_authenticated_update" ON purchase_order_items
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "purchase_order_items_authenticated_delete" ON purchase_order_items
  FOR DELETE TO authenticated
  USING (true);

-- ============================================================
-- 6.7 Sales RLS Policies (Authenticated only)
-- ============================================================

CREATE POLICY "sales_authenticated_select" ON sales
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "sales_authenticated_insert" ON sales
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "sales_authenticated_update" ON sales
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "sales_authenticated_delete" ON sales
  FOR DELETE TO authenticated
  USING (true);

-- ============================================================
-- 6.8 Contact Messages RLS Policies (Anonymous insert, authenticated full access)
-- ============================================================

CREATE POLICY "contact_messages_anon_insert" ON contact_messages
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "contact_messages_authenticated_select" ON contact_messages
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "contact_messages_authenticated_insert" ON contact_messages
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "contact_messages_authenticated_update" ON contact_messages
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "contact_messages_authenticated_delete" ON contact_messages
  FOR DELETE TO authenticated
  USING (true);

-- ============================================================
-- 6.9 Stock Alert Configs RLS Policies (Authenticated only)
-- ============================================================

CREATE POLICY "stock_alert_configs_authenticated_select" ON stock_alert_configs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "stock_alert_configs_authenticated_insert" ON stock_alert_configs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "stock_alert_configs_authenticated_update" ON stock_alert_configs
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "stock_alert_configs_authenticated_delete" ON stock_alert_configs
  FOR DELETE TO authenticated
  USING (true);
