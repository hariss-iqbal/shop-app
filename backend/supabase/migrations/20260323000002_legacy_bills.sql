-- Migration: Legacy Bills from DigiKhata
-- Imports historical bills parsed from DigiKhata PDF bill report.
-- Flat searchable table linked to customers via customer_id FK.

-- ============================================================
-- 1. CREATE legacy_bills TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS legacy_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- DigiKhata identifiers
  row_num INTEGER,
  bill_num INTEGER NOT NULL,
  bill_date DATE NOT NULL,

  -- Customer info
  customer_name VARCHAR(200),
  phone VARCHAR(30),
  phone_missing BOOLEAN DEFAULT false,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- Product info
  brand VARCHAR(50),
  primary_product VARCHAR(200),
  all_products TEXT,
  qty INTEGER DEFAULT 1,
  amount INTEGER,

  -- Product details
  storage VARCHAR(20),
  imei VARCHAR(50),
  condition_notes TEXT,

  -- Raw / audit data
  raw_details TEXT,
  severity VARCHAR(10) DEFAULT 'OK',
  doubt_reasons TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_legacy_bills_bill_num ON legacy_bills(bill_num);
CREATE INDEX IF NOT EXISTS idx_legacy_bills_bill_date ON legacy_bills(bill_date);
CREATE INDEX IF NOT EXISTS idx_legacy_bills_customer_id ON legacy_bills(customer_id);
CREATE INDEX IF NOT EXISTS idx_legacy_bills_brand ON legacy_bills(brand);
CREATE INDEX IF NOT EXISTS idx_legacy_bills_severity ON legacy_bills(severity);

-- GIN trigram indexes for fuzzy text search
CREATE INDEX IF NOT EXISTS idx_legacy_bills_customer_name_trgm
  ON legacy_bills USING gin(customer_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_legacy_bills_raw_details_trgm
  ON legacy_bills USING gin(raw_details gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_legacy_bills_primary_product_trgm
  ON legacy_bills USING gin(primary_product gin_trgm_ops);

-- ============================================================
-- 3. TRIGGER for updated_at
-- ============================================================

CREATE OR REPLACE TRIGGER trg_legacy_bills_updated_at
  BEFORE UPDATE ON legacy_bills
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE legacy_bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY legacy_bills_anon_select ON legacy_bills FOR SELECT TO anon USING (false);
CREATE POLICY legacy_bills_auth_select ON legacy_bills FOR SELECT TO authenticated USING (true);
CREATE POLICY legacy_bills_auth_insert ON legacy_bills FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY legacy_bills_auth_update ON legacy_bills FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY legacy_bills_auth_delete ON legacy_bills FOR DELETE TO authenticated USING (true);

-- ============================================================
-- 5. COMMENTS
-- ============================================================

COMMENT ON TABLE legacy_bills IS 'Historical bills imported from DigiKhata PDF bill report';
COMMENT ON COLUMN legacy_bills.row_num IS 'Original row number from DigiKhata report';
COMMENT ON COLUMN legacy_bills.bill_num IS 'DigiKhata bill number';
COMMENT ON COLUMN legacy_bills.bill_date IS 'Sale date parsed from DigiKhata format';
COMMENT ON COLUMN legacy_bills.customer_name IS 'Customer name as recorded in DigiKhata';
COMMENT ON COLUMN legacy_bills.phone IS 'Customer phone normalized to 03xx format or 0000-xxx placeholder';
COMMENT ON COLUMN legacy_bills.phone_missing IS 'TRUE if phone number was not found in contacts';
COMMENT ON COLUMN legacy_bills.customer_id IS 'FK to customers table (linked during import)';
COMMENT ON COLUMN legacy_bills.brand IS 'Product brand: Google, Samsung, OnePlus, Accessory';
COMMENT ON COLUMN legacy_bills.primary_product IS 'Primary product sold';
COMMENT ON COLUMN legacy_bills.all_products IS 'All products in the bill separated by semicolons';
COMMENT ON COLUMN legacy_bills.qty IS 'Total quantity of items in the bill';
COMMENT ON COLUMN legacy_bills.amount IS 'Sale price in PKR';
COMMENT ON COLUMN legacy_bills.storage IS 'Storage capacity if applicable';
COMMENT ON COLUMN legacy_bills.imei IS 'IMEI number if recorded';
COMMENT ON COLUMN legacy_bills.condition_notes IS 'Condition and notes extracted from bill details';
COMMENT ON COLUMN legacy_bills.raw_details IS 'Original unprocessed text from DigiKhata PDF';
COMMENT ON COLUMN legacy_bills.severity IS 'Parsing confidence: OK, INFO, WARNING, ERROR';
COMMENT ON COLUMN legacy_bills.doubt_reasons IS 'Reasons for parsing uncertainty';
