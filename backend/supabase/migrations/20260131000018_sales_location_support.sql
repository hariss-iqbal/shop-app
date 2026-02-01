-- Migration: Sales Location Support
-- Feature: F-024 Multi-Location Inventory Support
-- Adds location tracking to sales and updates RPC functions for location-based inventory deduction

-- Add location_id column to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES store_locations(id) ON DELETE SET NULL;

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_sales_location_id ON sales(location_id);

-- Update complete_sale_with_inventory_deduction to support location
CREATE OR REPLACE FUNCTION complete_sale_with_inventory_deduction(
  p_phone_id UUID,
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
  v_phone RECORD;
  v_sale_id UUID;
  v_previous_status phone_status;
  v_warning TEXT;
  v_inventory_deducted BOOLEAN := FALSE;
  v_location_inventory RECORD;
BEGIN
  -- Get phone details
  SELECT id, status, cost_price, tax_rate, is_tax_inclusive, is_tax_exempt
  INTO v_phone
  FROM phones
  WHERE id = p_phone_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Phone not found',
      'phoneId', p_phone_id
    );
  END IF;

  v_previous_status := v_phone.status;

  -- Check if phone is already sold
  IF v_phone.status = 'sold' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Phone is already sold',
      'phoneId', p_phone_id,
      'previousStatus', v_previous_status
    );
  END IF;

  -- If location is provided, check and deduct from location inventory
  IF p_location_id IS NOT NULL THEN
    SELECT * INTO v_location_inventory
    FROM location_inventory
    WHERE phone_id = p_phone_id AND location_id = p_location_id
    FOR UPDATE;

    IF NOT FOUND OR v_location_inventory.quantity < 1 THEN
      -- Check if there's stock in other locations
      IF EXISTS (
        SELECT 1 FROM location_inventory
        WHERE phone_id = p_phone_id AND quantity > 0
      ) THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'No stock at this location. Stock available at other locations.',
          'phoneId', p_phone_id,
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
      WHERE phone_id = p_phone_id AND location_id = p_location_id;
      v_inventory_deducted := TRUE;
    END IF;
  END IF;

  -- Add warning for already sold status
  IF v_phone.status != 'available' THEN
    v_warning := COALESCE(v_warning || '; ', '') || 'Phone was not in available status (was: ' || v_phone.status || ')';
  END IF;

  -- Update phone status to sold
  UPDATE phones
  SET status = 'sold', updated_at = NOW()
  WHERE id = p_phone_id;

  -- Calculate tax details
  DECLARE
    v_base_price NUMERIC;
    v_tax_amount NUMERIC;
  BEGIN
    IF v_phone.is_tax_exempt THEN
      v_base_price := p_sale_price;
      v_tax_amount := 0;
    ELSIF v_phone.is_tax_inclusive THEN
      v_base_price := p_sale_price / (1 + v_phone.tax_rate / 100);
      v_tax_amount := p_sale_price - v_base_price;
    ELSE
      v_base_price := p_sale_price;
      v_tax_amount := p_sale_price * v_phone.tax_rate / 100;
    END IF;

    -- Create sale record
    INSERT INTO sales (
      phone_id, sale_date, sale_price, cost_price,
      buyer_name, buyer_phone, buyer_email, notes,
      tax_rate, tax_amount, base_price, is_tax_exempt,
      location_id
    )
    VALUES (
      p_phone_id, p_sale_date, p_sale_price, v_phone.cost_price,
      p_buyer_name, p_buyer_phone, p_buyer_email, p_notes,
      COALESCE(v_phone.tax_rate, 0), v_tax_amount, v_base_price, v_phone.is_tax_exempt,
      p_location_id
    )
    RETURNING id INTO v_sale_id;
  END;

  -- Log inventory deduction
  INSERT INTO inventory_deduction_logs (
    sale_id, phone_id, previous_status, new_status, notes
  )
  VALUES (
    v_sale_id, p_phone_id, v_previous_status, 'sold',
    CASE WHEN p_location_id IS NOT NULL THEN 'Deducted from location: ' || p_location_id::TEXT ELSE NULL END
  );

  RETURN jsonb_build_object(
    'success', true,
    'saleId', v_sale_id,
    'phoneId', p_phone_id,
    'previousStatus', v_previous_status,
    'newStatus', 'sold',
    'warning', v_warning,
    'inventoryDeducted', v_inventory_deducted,
    'locationId', p_location_id
  );
END;
$$;

-- Update complete_batch_sale_with_inventory_deduction to support location
CREATE OR REPLACE FUNCTION complete_batch_sale_with_inventory_deduction(
  p_items JSONB,
  p_sale_date DATE,
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
  v_item RECORD;
  v_result JSONB;
  v_sales JSONB := '[]'::JSONB;
  v_warnings JSONB := '[]'::JSONB;
  v_processed INTEGER := 0;
  v_total INTEGER;
  v_all_success BOOLEAN := TRUE;
  v_inventory_deducted BOOLEAN := FALSE;
BEGIN
  v_total := jsonb_array_length(p_items);

  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    "phoneId" UUID,
    "salePrice" NUMERIC
  )
  LOOP
    v_result := complete_sale_with_inventory_deduction(
      v_item."phoneId",
      p_sale_date,
      v_item."salePrice",
      p_buyer_name,
      p_buyer_phone,
      p_buyer_email,
      p_notes,
      p_location_id
    );

    IF (v_result->>'success')::BOOLEAN THEN
      v_processed := v_processed + 1;
      v_sales := v_sales || jsonb_build_array(jsonb_build_object(
        'saleId', v_result->>'saleId',
        'phoneId', v_item."phoneId"
      ));
      IF v_result->>'inventoryDeducted' = 'true' THEN
        v_inventory_deducted := TRUE;
      END IF;
      IF v_result->>'warning' IS NOT NULL THEN
        v_warnings := v_warnings || jsonb_build_array(jsonb_build_object(
          'phoneId', v_item."phoneId",
          'warning', v_result->>'warning'
        ));
      END IF;
    ELSE
      v_all_success := FALSE;
      RETURN jsonb_build_object(
        'success', false,
        'error', v_result->>'error',
        'totalItems', v_total,
        'processedItems', v_processed,
        'inventoryDeducted', v_inventory_deducted
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', v_all_success,
    'totalItems', v_total,
    'processedItems', v_processed,
    'sales', v_sales,
    'warnings', CASE WHEN jsonb_array_length(v_warnings) > 0 THEN v_warnings ELSE NULL END,
    'inventoryDeducted', v_inventory_deducted,
    'locationId', p_location_id
  );
END;
$$;

-- Function to get inventory for a phone across all locations
CREATE OR REPLACE FUNCTION get_phone_location_inventory(p_phone_id UUID)
RETURNS TABLE (
  location_id UUID,
  location_name TEXT,
  location_code VARCHAR(20),
  quantity INTEGER,
  min_stock_level INTEGER,
  max_stock_level INTEGER,
  last_restocked TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    li.location_id,
    sl.name AS location_name,
    sl.code AS location_code,
    li.quantity,
    li.min_stock_level,
    li.max_stock_level,
    li.last_restocked
  FROM location_inventory li
  JOIN store_locations sl ON sl.id = li.location_id
  WHERE li.phone_id = p_phone_id
    AND sl.is_active = TRUE
  ORDER BY sl.is_primary DESC, sl.name;
END;
$$;

-- Function to check inventory availability at a specific location
CREATE OR REPLACE FUNCTION check_location_inventory_availability(
  p_phone_ids UUID[],
  p_location_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_phone_id UUID;
  v_phone RECORD;
  v_inventory RECORD;
  v_phones JSONB := '[]'::JSONB;
  v_warnings JSONB := '[]'::JSONB;
  v_all_available BOOLEAN := TRUE;
  v_has_warnings BOOLEAN := FALSE;
BEGIN
  FOREACH v_phone_id IN ARRAY p_phone_ids
  LOOP
    SELECT p.id, p.model, p.status, b.name AS brand_name
    INTO v_phone
    FROM phones p
    JOIN brands b ON b.id = p.brand_id
    WHERE p.id = v_phone_id;

    IF NOT FOUND THEN
      v_all_available := FALSE;
      v_phones := v_phones || jsonb_build_array(jsonb_build_object(
        'phoneId', v_phone_id,
        'available', false,
        'error', 'Phone not found'
      ));
      CONTINUE;
    END IF;

    SELECT * INTO v_inventory
    FROM location_inventory
    WHERE phone_id = v_phone_id AND location_id = p_location_id;

    IF NOT FOUND OR v_inventory.quantity < 1 THEN
      v_all_available := FALSE;
      v_has_warnings := TRUE;
      v_phones := v_phones || jsonb_build_array(jsonb_build_object(
        'phoneId', v_phone_id,
        'model', v_phone.model,
        'brandName', v_phone.brand_name,
        'status', v_phone.status,
        'available', false,
        'warning', 'No stock at this location'
      ));
      v_warnings := v_warnings || jsonb_build_array(jsonb_build_object(
        'phoneId', v_phone_id,
        'message', 'No stock at this location'
      ));
    ELSE
      v_phones := v_phones || jsonb_build_array(jsonb_build_object(
        'phoneId', v_phone_id,
        'model', v_phone.model,
        'brandName', v_phone.brand_name,
        'status', v_phone.status,
        'available', true,
        'quantity', v_inventory.quantity
      ));
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'allAvailable', v_all_available,
    'hasWarnings', v_has_warnings,
    'locationId', p_location_id,
    'phones', v_phones,
    'warnings', CASE WHEN jsonb_array_length(v_warnings) > 0 THEN v_warnings ELSE NULL END
  );
END;
$$;

-- Add comments
COMMENT ON COLUMN sales.location_id IS 'Location where the sale occurred - Feature: F-024';
-- Note: Function comments skipped - functions have multiple overloaded versions
COMMENT ON FUNCTION get_phone_location_inventory IS 'Get inventory levels for a phone across all active locations - Feature: F-024';
COMMENT ON FUNCTION check_location_inventory_availability IS 'Check inventory availability at a specific location - Feature: F-024';
