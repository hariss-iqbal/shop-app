-- Migration: Add created_by column to sales table
-- Tracks which user (cashier/manager/admin) created each sale record.
-- The Sales Dashboard "Sales by Cashier" widget depends on this column.

-- 1. Add the column
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Index for dashboard queries that group/filter by cashier
CREATE INDEX IF NOT EXISTS idx_sales_created_by ON sales(created_by);

-- 3. Trigger to auto-populate created_by on INSERT (for direct inserts)
CREATE OR REPLACE FUNCTION set_sales_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_sales_created_by ON sales;
CREATE TRIGGER trg_set_sales_created_by
  BEFORE INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION set_sales_created_by();

-- 4. Update the complete_sale_with_inventory_deduction RPC to set created_by
-- We re-create the function with the created_by field included in the INSERT.
CREATE OR REPLACE FUNCTION complete_sale_with_inventory_deduction(
  p_product_id UUID,
  p_sale_date DATE,
  p_sale_price NUMERIC,
  p_buyer_name TEXT DEFAULT NULL,
  p_buyer_phone TEXT DEFAULT NULL,
  p_buyer_email TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_location_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product RECORD;
  v_sale_id UUID;
  v_previous_status product_status;
  v_warning TEXT;
  v_inventory_deducted BOOLEAN := FALSE;
  v_location_inventory RECORD;
BEGIN
  -- Get product details
  SELECT id, status, cost_price, tax_rate, is_tax_inclusive, is_tax_exempt
  INTO v_product
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Product not found',
      'productId', p_product_id
    );
  END IF;

  v_previous_status := v_product.status;

  -- Check if product is already sold
  IF v_product.status = 'sold' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Product is already sold',
      'productId', p_product_id,
      'previousStatus', v_previous_status
    );
  END IF;

  -- If location is provided, check and deduct from location inventory
  IF p_location_id IS NOT NULL THEN
    SELECT * INTO v_location_inventory
    FROM location_inventory
    WHERE product_id = p_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF NOT FOUND OR v_location_inventory.quantity < 1 THEN
      -- Check if there's stock in other locations
      IF EXISTS (
        SELECT 1 FROM location_inventory
        WHERE product_id = p_product_id AND quantity > 0
      ) THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'No stock at this location. Stock available at other locations.',
          'productId', p_product_id,
          'locationId', p_location_id
        );
      ELSE
        v_warning := 'Selling from location with zero inventory';
      END IF;
    ELSE
      -- Deduct from location inventory
      UPDATE location_inventory
      SET quantity = quantity - 1,
          updated_at = NOW()
      WHERE product_id = p_product_id AND location_id = p_location_id;
      v_inventory_deducted := TRUE;
    END IF;
  END IF;

  -- Add warning for already sold status
  IF v_product.status != 'available' THEN
    v_warning := COALESCE(v_warning || '; ', '') || 'Product was not in available status (was: ' || v_product.status || ')';
  END IF;

  -- Update product status to sold
  UPDATE products
  SET status = 'sold', updated_at = NOW()
  WHERE id = p_product_id;

  -- Calculate tax details
  DECLARE
    v_base_price NUMERIC;
    v_tax_amount NUMERIC;
  BEGIN
    IF v_product.is_tax_exempt THEN
      v_base_price := p_sale_price;
      v_tax_amount := 0;
    ELSIF v_product.is_tax_inclusive THEN
      v_base_price := p_sale_price / (1 + v_product.tax_rate / 100);
      v_tax_amount := p_sale_price - v_base_price;
    ELSE
      v_base_price := p_sale_price;
      v_tax_amount := p_sale_price * v_product.tax_rate / 100;
    END IF;

    -- Create sale record (with created_by set to the calling user)
    INSERT INTO sales (
      product_id, sale_date, sale_price, cost_price,
      buyer_name, buyer_phone, buyer_email, notes,
      tax_rate, tax_amount, base_price, is_tax_exempt,
      location_id, created_by
    )
    VALUES (
      p_product_id, p_sale_date, p_sale_price, v_product.cost_price,
      p_buyer_name, p_buyer_phone, p_buyer_email, p_notes,
      COALESCE(v_product.tax_rate, 0), v_tax_amount, v_base_price, v_product.is_tax_exempt,
      p_location_id, auth.uid()
    )
    RETURNING id INTO v_sale_id;
  END;

  -- Log inventory deduction
  INSERT INTO inventory_deduction_logs (
    sale_id, product_id, previous_status, new_status, notes
  )
  VALUES (
    v_sale_id, p_product_id, v_previous_status, 'sold',
    CASE WHEN p_location_id IS NOT NULL THEN 'Deducted from location: ' || p_location_id::TEXT ELSE NULL END
  );

  RETURN jsonb_build_object(
    'success', true,
    'saleId', v_sale_id,
    'productId', p_product_id,
    'previousStatus', v_previous_status,
    'newStatus', 'sold',
    'warning', v_warning,
    'inventoryDeducted', v_inventory_deducted,
    'locationId', p_location_id
  );
END;
$$;
