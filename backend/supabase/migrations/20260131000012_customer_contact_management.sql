-- Migration: Customer Contact Management
-- Feature: F-019
-- Description: Capture and manage customer contact information including phone numbers, names, and preferences

-- Enable pg_trgm extension for fuzzy name search (must be before gin index creation)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- Create index for phone number lookup (primary search field)
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Create index for name search
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers USING gin(name gin_trgm_ops);

-- Create updated_at trigger
CREATE OR REPLACE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Add customer_id foreign key to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

-- Create index for customer_id on sales for efficient history lookup
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers table
-- Anonymous users cannot access customer data (private table)
CREATE POLICY customers_anon_select ON customers FOR SELECT TO anon USING (false);

-- Authenticated users have full CRUD access
CREATE POLICY customers_auth_select ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY customers_auth_insert ON customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY customers_auth_update ON customers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY customers_auth_delete ON customers FOR DELETE TO authenticated USING (true);

-- Function to find or create customer by phone number
CREATE OR REPLACE FUNCTION find_or_create_customer(
  p_phone VARCHAR(30),
  p_name VARCHAR(200) DEFAULT NULL,
  p_email VARCHAR(255) DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_customer_id UUID;
  v_customer RECORD;
  v_is_new BOOLEAN := false;
BEGIN
  -- Clean phone number (remove non-digits for matching)
  p_phone := regexp_replace(p_phone, '[^0-9+]', '', 'g');

  -- Try to find existing customer
  SELECT * INTO v_customer FROM customers WHERE phone = p_phone;

  IF v_customer.id IS NULL THEN
    -- Create new customer if name is provided
    IF p_name IS NOT NULL AND p_name != '' THEN
      INSERT INTO customers (phone, name, email, notes)
      VALUES (p_phone, p_name, p_email, p_notes)
      RETURNING * INTO v_customer;
      v_is_new := true;
    ELSE
      -- Return null if no name provided for new customer
      RETURN jsonb_build_object(
        'found', false,
        'customer', NULL,
        'isNew', false
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'customer', jsonb_build_object(
      'id', v_customer.id,
      'phone', v_customer.phone,
      'name', v_customer.name,
      'email', v_customer.email,
      'notes', v_customer.notes,
      'createdAt', v_customer.created_at,
      'updatedAt', v_customer.updated_at
    ),
    'isNew', v_is_new
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get customer purchase history
CREATE OR REPLACE FUNCTION get_customer_purchase_history(
  p_customer_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_customer RECORD;
  v_sales JSONB;
  v_stats RECORD;
BEGIN
  -- Get customer info
  SELECT * INTO v_customer FROM customers WHERE id = p_customer_id;

  IF v_customer.id IS NULL THEN
    RETURN jsonb_build_object('found', false, 'error', 'Customer not found');
  END IF;

  -- Get all sales for this customer
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'phoneId', s.phone_id,
      'saleDate', s.sale_date,
      'salePrice', s.sale_price,
      'phoneName', p.model,
      'brandName', b.name
    ) ORDER BY s.sale_date DESC
  ) INTO v_sales
  FROM sales s
  LEFT JOIN phones p ON s.phone_id = p.id
  LEFT JOIN brands b ON p.brand_id = b.id
  WHERE s.customer_id = p_customer_id;

  -- Get summary stats
  SELECT
    COUNT(*) as total_transactions,
    COALESCE(SUM(sale_price), 0) as total_spent,
    MAX(sale_date) as last_purchase_date
  INTO v_stats
  FROM sales
  WHERE customer_id = p_customer_id;

  RETURN jsonb_build_object(
    'found', true,
    'customer', jsonb_build_object(
      'id', v_customer.id,
      'phone', v_customer.phone,
      'name', v_customer.name,
      'email', v_customer.email,
      'notes', v_customer.notes,
      'createdAt', v_customer.created_at,
      'updatedAt', v_customer.updated_at
    ),
    'sales', COALESCE(v_sales, '[]'::jsonb),
    'stats', jsonb_build_object(
      'totalTransactions', v_stats.total_transactions,
      'totalSpent', v_stats.total_spent,
      'lastPurchaseDate', v_stats.last_purchase_date
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to link existing sales to customer by phone number
CREATE OR REPLACE FUNCTION link_sales_to_customer(
  p_customer_id UUID,
  p_phone VARCHAR(30)
) RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  -- Clean phone number
  p_phone := regexp_replace(p_phone, '[^0-9+]', '', 'g');

  -- Update sales that match this phone number but don't have a customer_id
  UPDATE sales
  SET customer_id = p_customer_id
  WHERE buyer_phone ILIKE '%' || p_phone || '%'
    AND customer_id IS NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE customers IS 'Customer contact information for enhanced service - Feature F-019';
COMMENT ON COLUMN customers.phone IS 'Primary contact phone number (unique identifier for customer lookup)';
COMMENT ON COLUMN customers.name IS 'Customer full name';
COMMENT ON COLUMN customers.email IS 'Customer email address (optional)';
COMMENT ON COLUMN customers.notes IS 'Staff notes about customer preferences and special requirements';
COMMENT ON COLUMN sales.customer_id IS 'Optional link to customer profile for purchase history tracking';
