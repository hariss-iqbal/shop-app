-- Migration: Automatic Inventory Deduction
-- Feature: F-008 - Automatic Inventory Deduction
-- Automatically deduct sold items from inventory when sales transaction is completed

-- ============================================================
-- 1. ADD OVERSELL CONFIGURATION TO STOCK_ALERT_CONFIGS
-- ============================================================

-- Add allow_oversell column to control whether overselling is permitted
-- When true: Shows warning but allows sale completion when stock is insufficient
-- When false: Prevents sale if any item quantity exceeds available stock
ALTER TABLE stock_alert_configs
  ADD COLUMN IF NOT EXISTS allow_oversell BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN stock_alert_configs.allow_oversell IS
  'When true, system displays warning but allows sale completion when attempting to sell more units than available. When false, sale is blocked.';

-- ============================================================
-- 2. CREATE INVENTORY DEDUCTION LOG TABLE
-- ============================================================

-- Log all inventory deduction operations for audit trail
CREATE TABLE IF NOT EXISTS inventory_deduction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  phone_id UUID NOT NULL REFERENCES phones(id),
  previous_status phone_status NOT NULL,
  new_status phone_status NOT NULL,
  deducted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deducted_by UUID,
  notes TEXT,
  CONSTRAINT inventory_deduction_logs_notes_maxlength CHECK (char_length(notes) <= 500)
);

CREATE INDEX idx_inventory_deduction_logs_sale_id ON inventory_deduction_logs(sale_id);
CREATE INDEX idx_inventory_deduction_logs_phone_id ON inventory_deduction_logs(phone_id);
CREATE INDEX idx_inventory_deduction_logs_deducted_at ON inventory_deduction_logs(deducted_at);

-- Enable RLS
ALTER TABLE inventory_deduction_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventory_deduction_logs_authenticated_select" ON inventory_deduction_logs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "inventory_deduction_logs_authenticated_insert" ON inventory_deduction_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================
-- 3. CREATE ATOMIC SALE COMPLETION FUNCTION
-- ============================================================

-- Function to complete a sale with automatic inventory deduction
-- This function performs atomic operations:
-- 1. Validates all phones are available (or shows warning if oversell allowed)
-- 2. Creates sale record
-- 3. Updates phone status to 'sold'
-- 4. Logs the inventory deduction
-- If any step fails, entire transaction is rolled back

CREATE OR REPLACE FUNCTION complete_sale_with_inventory_deduction(
  p_phone_id UUID,
  p_sale_date DATE,
  p_sale_price DECIMAL,
  p_buyer_name VARCHAR(200) DEFAULT NULL,
  p_buyer_phone VARCHAR(30) DEFAULT NULL,
  p_buyer_email VARCHAR(255) DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_phone RECORD;
  v_sale_id UUID;
  v_config RECORD;
  v_result JSONB;
  v_warning TEXT DEFAULT NULL;
BEGIN
  -- Get oversell configuration
  SELECT allow_oversell INTO v_config FROM stock_alert_configs LIMIT 1;

  -- Fetch phone with lock to prevent concurrent modifications
  SELECT id, status, cost_price, model
  INTO v_phone
  FROM phones
  WHERE id = p_phone_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Phone with id "%" not found', p_phone_id;
  END IF;

  -- Check if phone is already sold
  IF v_phone.status = 'sold' THEN
    RAISE EXCEPTION 'Phone "%" has already been sold', v_phone.model;
  END IF;

  -- Check if phone is reserved (warning but allow if oversell enabled)
  IF v_phone.status = 'reserved' THEN
    IF v_config.allow_oversell THEN
      v_warning := 'Phone was reserved but sale was completed';
    ELSE
      RAISE EXCEPTION 'Phone "%" is currently reserved and cannot be sold', v_phone.model;
    END IF;
  END IF;

  -- Check for existing sale record
  IF EXISTS (SELECT 1 FROM sales WHERE phone_id = p_phone_id) THEN
    RAISE EXCEPTION 'A sale record already exists for this phone';
  END IF;

  -- Create sale record
  INSERT INTO sales (
    phone_id,
    sale_date,
    sale_price,
    cost_price,
    buyer_name,
    buyer_phone,
    buyer_email,
    notes
  ) VALUES (
    p_phone_id,
    p_sale_date,
    p_sale_price,
    v_phone.cost_price,
    p_buyer_name,
    p_buyer_phone,
    p_buyer_email,
    p_notes
  )
  RETURNING id INTO v_sale_id;

  -- Update phone status to sold (inventory deduction)
  UPDATE phones
  SET status = 'sold'
  WHERE id = p_phone_id;

  -- Log the inventory deduction
  INSERT INTO inventory_deduction_logs (
    sale_id,
    phone_id,
    previous_status,
    new_status,
    notes
  ) VALUES (
    v_sale_id,
    p_phone_id,
    v_phone.status,
    'sold',
    CASE WHEN v_warning IS NOT NULL THEN v_warning ELSE 'Automatic inventory deduction on sale completion' END
  );

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'saleId', v_sale_id,
    'phoneId', p_phone_id,
    'previousStatus', v_phone.status,
    'newStatus', 'sold',
    'warning', v_warning,
    'inventoryDeducted', true
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Transaction will automatically rollback
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'phoneId', p_phone_id,
      'inventoryDeducted', false
    );
END;
$$;

-- ============================================================
-- 4. CREATE BATCH SALE COMPLETION FUNCTION
-- ============================================================

-- Function to complete multiple sales in a single atomic transaction
-- Used for cart checkout with multiple items
-- All items must succeed or entire transaction rolls back

CREATE OR REPLACE FUNCTION complete_batch_sale_with_inventory_deduction(
  p_items JSONB,
  p_sale_date DATE,
  p_buyer_name VARCHAR(200) DEFAULT NULL,
  p_buyer_phone VARCHAR(30) DEFAULT NULL,
  p_buyer_email VARCHAR(255) DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item JSONB;
  v_phone RECORD;
  v_sale_id UUID;
  v_config RECORD;
  v_results JSONB := '[]'::JSONB;
  v_warnings JSONB := '[]'::JSONB;
  v_phone_ids UUID[];
  v_total_items INT;
  v_processed INT := 0;
BEGIN
  -- Get oversell configuration
  SELECT allow_oversell INTO v_config FROM stock_alert_configs LIMIT 1;

  -- Get total items count
  v_total_items := jsonb_array_length(p_items);

  IF v_total_items = 0 THEN
    RAISE EXCEPTION 'No items provided for sale';
  END IF;

  -- First pass: Validate all phones and lock them
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_phone_ids := array_append(v_phone_ids, (v_item->>'phoneId')::UUID);
  END LOOP;

  -- Lock all phones in a consistent order to prevent deadlocks
  FOR v_phone IN
    SELECT p.id, p.status, p.cost_price, p.model
    FROM phones p
    WHERE p.id = ANY(v_phone_ids)
    ORDER BY p.id
    FOR UPDATE
  LOOP
    -- Check if phone is already sold
    IF v_phone.status = 'sold' THEN
      RAISE EXCEPTION 'Phone "%" has already been sold', v_phone.model;
    END IF;

    -- Check for existing sale record
    IF EXISTS (SELECT 1 FROM sales WHERE phone_id = v_phone.id) THEN
      RAISE EXCEPTION 'A sale record already exists for phone "%"', v_phone.model;
    END IF;

    -- Check reserved status
    IF v_phone.status = 'reserved' THEN
      IF NOT v_config.allow_oversell THEN
        RAISE EXCEPTION 'Phone "%" is currently reserved and cannot be sold', v_phone.model;
      ELSE
        v_warnings := v_warnings || jsonb_build_object(
          'phoneId', v_phone.id,
          'warning', 'Phone was reserved but sale was completed'
        );
      END IF;
    END IF;
  END LOOP;

  -- Verify all requested phones were found
  IF array_length(v_phone_ids, 1) != (SELECT COUNT(*) FROM phones WHERE id = ANY(v_phone_ids)) THEN
    RAISE EXCEPTION 'One or more phones not found';
  END IF;

  -- Second pass: Create sales and update inventory
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Get phone data
    SELECT id, status, cost_price, model
    INTO v_phone
    FROM phones
    WHERE id = (v_item->>'phoneId')::UUID;

    -- Create sale record
    INSERT INTO sales (
      phone_id,
      sale_date,
      sale_price,
      cost_price,
      buyer_name,
      buyer_phone,
      buyer_email,
      notes
    ) VALUES (
      (v_item->>'phoneId')::UUID,
      p_sale_date,
      (v_item->>'salePrice')::DECIMAL,
      v_phone.cost_price,
      p_buyer_name,
      p_buyer_phone,
      p_buyer_email,
      p_notes
    )
    RETURNING id INTO v_sale_id;

    -- Update phone status to sold
    UPDATE phones
    SET status = 'sold'
    WHERE id = (v_item->>'phoneId')::UUID;

    -- Log the inventory deduction
    INSERT INTO inventory_deduction_logs (
      sale_id,
      phone_id,
      previous_status,
      new_status,
      notes
    ) VALUES (
      v_sale_id,
      (v_item->>'phoneId')::UUID,
      v_phone.status,
      'sold',
      'Automatic inventory deduction on batch sale completion'
    );

    -- Add to results
    v_results := v_results || jsonb_build_object(
      'saleId', v_sale_id,
      'phoneId', v_item->>'phoneId',
      'previousStatus', v_phone.status,
      'newStatus', 'sold'
    );

    v_processed := v_processed + 1;
  END LOOP;

  -- Return success result
  RETURN jsonb_build_object(
    'success', true,
    'totalItems', v_total_items,
    'processedItems', v_processed,
    'sales', v_results,
    'warnings', v_warnings,
    'inventoryDeducted', true
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Transaction will automatically rollback
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'totalItems', v_total_items,
      'processedItems', v_processed,
      'inventoryDeducted', false
    );
END;
$$;

-- ============================================================
-- 5. CREATE INVENTORY AVAILABILITY CHECK FUNCTION
-- ============================================================

-- Function to check phone availability before sale
-- Returns availability status and any warnings

CREATE OR REPLACE FUNCTION check_inventory_availability(
  p_phone_ids UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_config RECORD;
  v_results JSONB := '[]'::JSONB;
  v_phone RECORD;
  v_warnings JSONB := '[]'::JSONB;
  v_all_available BOOLEAN := true;
  v_has_warnings BOOLEAN := false;
BEGIN
  -- Get oversell configuration
  SELECT allow_oversell INTO v_config FROM stock_alert_configs LIMIT 1;

  -- Check each phone
  FOR v_phone IN
    SELECT p.id, p.status, p.model, b.name as brand_name
    FROM phones p
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE p.id = ANY(p_phone_ids)
  LOOP
    IF v_phone.status = 'sold' THEN
      v_all_available := false;
      v_results := v_results || jsonb_build_object(
        'phoneId', v_phone.id,
        'model', v_phone.model,
        'brandName', v_phone.brand_name,
        'status', v_phone.status,
        'available', false,
        'error', 'Phone has already been sold'
      );
    ELSIF v_phone.status = 'reserved' THEN
      v_has_warnings := true;
      IF NOT v_config.allow_oversell THEN
        v_all_available := false;
      END IF;
      v_results := v_results || jsonb_build_object(
        'phoneId', v_phone.id,
        'model', v_phone.model,
        'brandName', v_phone.brand_name,
        'status', v_phone.status,
        'available', v_config.allow_oversell,
        'warning', 'Phone is currently reserved'
      );
      v_warnings := v_warnings || jsonb_build_object(
        'phoneId', v_phone.id,
        'message', format('Phone "%s" is currently reserved', v_phone.model)
      );
    ELSE
      v_results := v_results || jsonb_build_object(
        'phoneId', v_phone.id,
        'model', v_phone.model,
        'brandName', v_phone.brand_name,
        'status', v_phone.status,
        'available', true
      );
    END IF;
  END LOOP;

  -- Check for phones not found
  IF array_length(p_phone_ids, 1) != jsonb_array_length(v_results) THEN
    v_all_available := false;
  END IF;

  RETURN jsonb_build_object(
    'allAvailable', v_all_available,
    'hasWarnings', v_has_warnings,
    'allowOversell', v_config.allow_oversell,
    'phones', v_results,
    'warnings', v_warnings
  );
END;
$$;

-- ============================================================
-- 6. CREATE FUNCTION TO REVERT SALE (RESTORE INVENTORY)
-- ============================================================

-- Function to delete a sale and restore phone to available status
-- Used when sale is cancelled/deleted

CREATE OR REPLACE FUNCTION revert_sale_restore_inventory(
  p_sale_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale RECORD;
  v_phone RECORD;
BEGIN
  -- Get sale with lock
  SELECT id, phone_id
  INTO v_sale
  FROM sales
  WHERE id = p_sale_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sale with id "%" not found', p_sale_id;
  END IF;

  -- Get phone
  SELECT id, status, model
  INTO v_phone
  FROM phones
  WHERE id = v_sale.phone_id
  FOR UPDATE;

  -- Delete the sale
  DELETE FROM sales WHERE id = p_sale_id;

  -- Restore phone status to available
  UPDATE phones
  SET status = 'available'
  WHERE id = v_sale.phone_id;

  -- Log the inventory restoration
  INSERT INTO inventory_deduction_logs (
    sale_id,
    phone_id,
    previous_status,
    new_status,
    notes
  ) VALUES (
    NULL, -- sale_id is NULL because sale was deleted
    v_sale.phone_id,
    v_phone.status,
    'available',
    format('Inventory restored due to sale deletion (original sale id: %s)', p_sale_id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'phoneId', v_sale.phone_id,
    'previousStatus', v_phone.status,
    'newStatus', 'available',
    'inventoryRestored', true
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'inventoryRestored', false
    );
END;
$$;

-- ============================================================
-- 7. GRANT EXECUTE PERMISSIONS
-- ============================================================

GRANT EXECUTE ON FUNCTION complete_sale_with_inventory_deduction TO authenticated;
GRANT EXECUTE ON FUNCTION complete_batch_sale_with_inventory_deduction TO authenticated;
GRANT EXECUTE ON FUNCTION check_inventory_availability TO authenticated;
GRANT EXECUTE ON FUNCTION revert_sale_restore_inventory TO authenticated;
