-- Migration: Tax Calculation and Compliance
-- Feature: F-012 - Tax Calculation and Compliance
-- Automatically calculate taxes based on product tax rates and generate tax-compliant receipts

-- ============================================================
-- 1. ADD TAX FIELDS TO PHONES TABLE
-- ============================================================

-- Add tax_rate column to phones (percentage, e.g., 10.00 for 10%)
ALTER TABLE phones ADD COLUMN tax_rate DECIMAL NOT NULL DEFAULT 0;

-- Add is_tax_inclusive column (when true, selling_price includes tax)
ALTER TABLE phones ADD COLUMN is_tax_inclusive BOOLEAN NOT NULL DEFAULT false;

-- Add is_tax_exempt column (when true, item is tax exempt at 0%)
ALTER TABLE phones ADD COLUMN is_tax_exempt BOOLEAN NOT NULL DEFAULT false;

-- Add constraints for tax_rate (must be between 0 and 100)
ALTER TABLE phones ADD CONSTRAINT phones_tax_rate_range
  CHECK (tax_rate >= 0 AND tax_rate <= 100);

-- ============================================================
-- 2. ADD TAX BREAKDOWN FIELDS TO SALES TABLE
-- ============================================================

-- Add tax fields to sales table
ALTER TABLE sales ADD COLUMN tax_rate DECIMAL NOT NULL DEFAULT 0;
ALTER TABLE sales ADD COLUMN tax_amount DECIMAL NOT NULL DEFAULT 0;
ALTER TABLE sales ADD COLUMN base_price DECIMAL;
ALTER TABLE sales ADD COLUMN is_tax_exempt BOOLEAN NOT NULL DEFAULT false;

-- Add constraint for sales tax_rate
ALTER TABLE sales ADD CONSTRAINT sales_tax_rate_range
  CHECK (tax_rate >= 0 AND tax_rate <= 100);

-- ============================================================
-- 3. ADD TAX BREAKDOWN FIELDS TO RECEIPT_ITEMS TABLE
-- ============================================================

-- Add tax fields to receipt_items for per-item tax tracking
ALTER TABLE receipt_items ADD COLUMN tax_rate DECIMAL NOT NULL DEFAULT 0;
ALTER TABLE receipt_items ADD COLUMN tax_amount DECIMAL NOT NULL DEFAULT 0;
ALTER TABLE receipt_items ADD COLUMN base_price DECIMAL NOT NULL DEFAULT 0;
ALTER TABLE receipt_items ADD COLUMN is_tax_exempt BOOLEAN NOT NULL DEFAULT false;

-- Add constraint for receipt_items tax_rate
ALTER TABLE receipt_items ADD CONSTRAINT receipt_items_tax_rate_range
  CHECK (tax_rate >= 0 AND tax_rate <= 100);

-- ============================================================
-- 4. CREATE TAX BREAKDOWN TABLE FOR RECEIPTS
-- ============================================================

-- This table stores tax breakdown by rate for each receipt
-- Enables display of "Tax Breakdown by Rate" section on receipts
CREATE TABLE receipt_tax_breakdown (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  tax_rate DECIMAL NOT NULL,
  taxable_amount DECIMAL NOT NULL,
  tax_amount DECIMAL NOT NULL,
  item_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Unique constraint: one entry per tax rate per receipt
  UNIQUE(receipt_id, tax_rate)
);

-- Index for efficient lookup
CREATE INDEX idx_receipt_tax_breakdown_receipt_id ON receipt_tax_breakdown(receipt_id);

-- RLS for receipt_tax_breakdown
ALTER TABLE receipt_tax_breakdown ENABLE ROW LEVEL SECURITY;

CREATE POLICY "receipt_tax_breakdown_authenticated_select" ON receipt_tax_breakdown
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "receipt_tax_breakdown_authenticated_insert" ON receipt_tax_breakdown
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "receipt_tax_breakdown_authenticated_update" ON receipt_tax_breakdown
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "receipt_tax_breakdown_authenticated_delete" ON receipt_tax_breakdown
  FOR DELETE TO authenticated USING (true);

-- ============================================================
-- 5. CREATE TAX CALCULATION FUNCTIONS
-- ============================================================

-- Function to calculate tax from tax-inclusive price
-- Given a price that includes tax, extracts the base price and tax amount
-- Formula: base_price = price / (1 + tax_rate/100)
-- Example: $100 with 10% tax -> base = 100/1.10 = $90.91, tax = $9.09
CREATE OR REPLACE FUNCTION calculate_tax_from_inclusive_price(
  inclusive_price DECIMAL,
  tax_rate_percent DECIMAL
)
RETURNS TABLE(base_price DECIMAL, tax_amount DECIMAL) AS $$
DECLARE
  calc_base_price DECIMAL;
  calc_tax_amount DECIMAL;
BEGIN
  IF tax_rate_percent <= 0 THEN
    calc_base_price := inclusive_price;
    calc_tax_amount := 0;
  ELSE
    calc_base_price := ROUND(inclusive_price / (1 + tax_rate_percent / 100), 2);
    calc_tax_amount := ROUND(inclusive_price - calc_base_price, 2);
  END IF;

  RETURN QUERY SELECT calc_base_price, calc_tax_amount;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate tax for tax-exclusive price
-- Given a price without tax, calculates the tax amount
-- Formula: tax_amount = price * (tax_rate/100)
-- Example: $100 with 10% tax -> tax = $10.00
CREATE OR REPLACE FUNCTION calculate_tax_from_exclusive_price(
  exclusive_price DECIMAL,
  tax_rate_percent DECIMAL
)
RETURNS TABLE(tax_amount DECIMAL, total_with_tax DECIMAL) AS $$
DECLARE
  calc_tax_amount DECIMAL;
  calc_total DECIMAL;
BEGIN
  IF tax_rate_percent <= 0 THEN
    calc_tax_amount := 0;
    calc_total := exclusive_price;
  ELSE
    calc_tax_amount := ROUND(exclusive_price * tax_rate_percent / 100, 2);
    calc_total := exclusive_price + calc_tax_amount;
  END IF;

  RETURN QUERY SELECT calc_tax_amount, calc_total;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate item tax based on phone settings
-- Handles both tax-inclusive and tax-exclusive pricing
CREATE OR REPLACE FUNCTION calculate_item_tax(
  phone_id_param UUID,
  quantity_param INTEGER DEFAULT 1,
  override_price DECIMAL DEFAULT NULL
)
RETURNS TABLE(
  unit_price DECIMAL,
  base_price_per_unit DECIMAL,
  tax_amount_per_unit DECIMAL,
  total_base_price DECIMAL,
  total_tax_amount DECIMAL,
  total_price DECIMAL,
  tax_rate DECIMAL,
  is_tax_exempt BOOLEAN
) AS $$
DECLARE
  phone_record RECORD;
  calc_unit_price DECIMAL;
  calc_base_price DECIMAL;
  calc_tax_amount DECIMAL;
BEGIN
  -- Get phone details
  SELECT
    p.selling_price,
    p.tax_rate AS phone_tax_rate,
    p.is_tax_inclusive,
    p.is_tax_exempt AS phone_is_tax_exempt
  INTO phone_record
  FROM phones p
  WHERE p.id = phone_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Phone with id % not found', phone_id_param;
  END IF;

  -- Use override price if provided, otherwise use selling price
  calc_unit_price := COALESCE(override_price, phone_record.selling_price);

  -- Handle tax-exempt items
  IF phone_record.phone_is_tax_exempt THEN
    RETURN QUERY SELECT
      calc_unit_price,
      calc_unit_price,
      0::DECIMAL,
      (calc_unit_price * quantity_param)::DECIMAL,
      0::DECIMAL,
      (calc_unit_price * quantity_param)::DECIMAL,
      0::DECIMAL,
      true;
    RETURN;
  END IF;

  -- Calculate tax based on pricing model
  IF phone_record.is_tax_inclusive THEN
    -- Tax-inclusive: extract base price and tax from selling price
    SELECT ctfip.base_price, ctfip.tax_amount
    INTO calc_base_price, calc_tax_amount
    FROM calculate_tax_from_inclusive_price(calc_unit_price, phone_record.phone_tax_rate) ctfip;
  ELSE
    -- Tax-exclusive: selling price is base price, calculate tax on top
    calc_base_price := calc_unit_price;
    SELECT ctfep.tax_amount
    INTO calc_tax_amount
    FROM calculate_tax_from_exclusive_price(calc_unit_price, phone_record.phone_tax_rate) ctfep;
  END IF;

  RETURN QUERY SELECT
    calc_unit_price,
    calc_base_price,
    calc_tax_amount,
    ROUND(calc_base_price * quantity_param, 2),
    ROUND(calc_tax_amount * quantity_param, 2),
    ROUND((calc_base_price + calc_tax_amount) * quantity_param, 2),
    phone_record.phone_tax_rate,
    false;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- 6. COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON COLUMN phones.tax_rate IS 'Tax rate percentage (0-100). E.g., 10 for 10% tax rate';
COMMENT ON COLUMN phones.is_tax_inclusive IS 'When true, selling_price includes tax. When false, tax is added on top';
COMMENT ON COLUMN phones.is_tax_exempt IS 'When true, item is tax exempt (0% tax) and clearly marked on receipts';

COMMENT ON COLUMN sales.tax_rate IS 'Tax rate applied to this sale (captured at time of sale)';
COMMENT ON COLUMN sales.tax_amount IS 'Calculated tax amount for this sale';
COMMENT ON COLUMN sales.base_price IS 'Base price before tax (for tax-inclusive items, this is the extracted base)';
COMMENT ON COLUMN sales.is_tax_exempt IS 'Whether this sale was for a tax-exempt item';

COMMENT ON COLUMN receipt_items.tax_rate IS 'Tax rate applied to this line item';
COMMENT ON COLUMN receipt_items.tax_amount IS 'Calculated tax amount for this line item';
COMMENT ON COLUMN receipt_items.base_price IS 'Base price before tax';
COMMENT ON COLUMN receipt_items.is_tax_exempt IS 'Whether this item is tax exempt';

COMMENT ON TABLE receipt_tax_breakdown IS 'Tax breakdown by rate for each receipt - enables compliant tax reporting';
COMMENT ON FUNCTION calculate_tax_from_inclusive_price IS 'Extracts base price and tax from a tax-inclusive price';
COMMENT ON FUNCTION calculate_tax_from_exclusive_price IS 'Calculates tax amount for a tax-exclusive price';
COMMENT ON FUNCTION calculate_item_tax IS 'Calculates complete tax information for a phone item';
