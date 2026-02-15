-- Migration: Update RPC Functions for Products Rename
-- Feature: Rename Phones to Products with Product Type Support
-- Step 3 of 3: Drop and recreate all RPC functions that reference phones/phone_id

-- ============================================================
-- 1. DROP EXISTING FUNCTIONS
-- ============================================================

DROP FUNCTION IF EXISTS complete_sale_with_inventory_deduction(UUID, DATE, NUMERIC, TEXT, TEXT, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS complete_sale_with_inventory_deduction(UUID, DATE, DECIMAL, VARCHAR, VARCHAR, VARCHAR, TEXT);
DROP FUNCTION IF EXISTS complete_batch_sale_with_inventory_deduction(JSONB, DATE, TEXT, TEXT, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS complete_batch_sale_with_inventory_deduction(JSONB, DATE, VARCHAR, VARCHAR, VARCHAR, TEXT);
DROP FUNCTION IF EXISTS check_inventory_availability(UUID[]);
DROP FUNCTION IF EXISTS revert_sale_restore_inventory(UUID);
DROP FUNCTION IF EXISTS process_full_refund(UUID, VARCHAR, TEXT);
DROP FUNCTION IF EXISTS check_receipt_refundable(UUID);
DROP FUNCTION IF EXISTS check_receipt_partial_refundable(UUID);
DROP FUNCTION IF EXISTS process_partial_refund(UUID, JSONB, VARCHAR, TEXT, BOOLEAN, VARCHAR);
DROP FUNCTION IF EXISTS calculate_item_tax(UUID, INTEGER, DECIMAL);
DROP FUNCTION IF EXISTS initiate_inventory_transfer(UUID, UUID, JSONB, TEXT);
DROP FUNCTION IF EXISTS complete_inventory_transfer(UUID);
DROP FUNCTION IF EXISTS get_location_inventory(UUID);
DROP FUNCTION IF EXISTS assign_phone_to_location(UUID, UUID, INTEGER);
DROP FUNCTION IF EXISTS get_phone_location_inventory(UUID);
DROP FUNCTION IF EXISTS check_location_inventory_availability(UUID[], UUID);
DROP FUNCTION IF EXISTS log_sale_audit(audit_event_type, UUID, UUID, DECIMAL, VARCHAR, VARCHAR, INTEGER, INET, TEXT);
DROP FUNCTION IF EXISTS log_inventory_audit(audit_event_type, UUID, VARCHAR, VARCHAR, UUID, UUID, TEXT, INET, TEXT);

-- ============================================================
-- 2. RECREATE: complete_sale_with_inventory_deduction
-- ============================================================

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

    -- Create sale record
    INSERT INTO sales (
      product_id, sale_date, sale_price, cost_price,
      buyer_name, buyer_phone, buyer_email, notes,
      tax_rate, tax_amount, base_price, is_tax_exempt,
      location_id
    )
    VALUES (
      p_product_id, p_sale_date, p_sale_price, v_product.cost_price,
      p_buyer_name, p_buyer_phone, p_buyer_email, p_notes,
      COALESCE(v_product.tax_rate, 0), v_tax_amount, v_base_price, v_product.is_tax_exempt,
      p_location_id
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

-- ============================================================
-- 3. RECREATE: complete_batch_sale_with_inventory_deduction
-- ============================================================

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
    "productId" UUID,
    "salePrice" NUMERIC
  )
  LOOP
    v_result := complete_sale_with_inventory_deduction(
      v_item."productId",
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
        'productId', v_item."productId"
      ));
      IF v_result->>'inventoryDeducted' = 'true' THEN
        v_inventory_deducted := TRUE;
      END IF;
      IF v_result->>'warning' IS NOT NULL THEN
        v_warnings := v_warnings || jsonb_build_array(jsonb_build_object(
          'productId', v_item."productId",
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

-- ============================================================
-- 4. RECREATE: check_inventory_availability
-- ============================================================

CREATE OR REPLACE FUNCTION check_inventory_availability(
  p_product_ids UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_config RECORD;
  v_results JSONB := '[]'::JSONB;
  v_product RECORD;
  v_warnings JSONB := '[]'::JSONB;
  v_all_available BOOLEAN := true;
  v_has_warnings BOOLEAN := false;
BEGIN
  -- Get oversell configuration
  SELECT allow_oversell INTO v_config FROM stock_alert_configs LIMIT 1;

  -- Check each product
  FOR v_product IN
    SELECT p.id, p.status, p.model, b.name as brand_name
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE p.id = ANY(p_product_ids)
  LOOP
    IF v_product.status = 'sold' THEN
      v_all_available := false;
      v_results := v_results || jsonb_build_object(
        'productId', v_product.id,
        'model', v_product.model,
        'brandName', v_product.brand_name,
        'status', v_product.status,
        'available', false,
        'error', 'Product has already been sold'
      );
    ELSIF v_product.status = 'reserved' THEN
      v_has_warnings := true;
      IF NOT v_config.allow_oversell THEN
        v_all_available := false;
      END IF;
      v_results := v_results || jsonb_build_object(
        'productId', v_product.id,
        'model', v_product.model,
        'brandName', v_product.brand_name,
        'status', v_product.status,
        'available', v_config.allow_oversell,
        'warning', 'Product is currently reserved'
      );
      v_warnings := v_warnings || jsonb_build_object(
        'productId', v_product.id,
        'message', format('Product "%s" is currently reserved', v_product.model)
      );
    ELSE
      v_results := v_results || jsonb_build_object(
        'productId', v_product.id,
        'model', v_product.model,
        'brandName', v_product.brand_name,
        'status', v_product.status,
        'available', true
      );
    END IF;
  END LOOP;

  -- Check for products not found
  IF array_length(p_product_ids, 1) != jsonb_array_length(v_results) THEN
    v_all_available := false;
  END IF;

  RETURN jsonb_build_object(
    'allAvailable', v_all_available,
    'hasWarnings', v_has_warnings,
    'allowOversell', v_config.allow_oversell,
    'products', v_results,
    'warnings', v_warnings
  );
END;
$$;

-- ============================================================
-- 5. RECREATE: revert_sale_restore_inventory
-- ============================================================

CREATE OR REPLACE FUNCTION revert_sale_restore_inventory(
  p_sale_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale RECORD;
  v_product RECORD;
BEGIN
  -- Get sale with lock
  SELECT id, product_id
  INTO v_sale
  FROM sales
  WHERE id = p_sale_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sale with id "%" not found', p_sale_id;
  END IF;

  -- Get product
  SELECT id, status, model
  INTO v_product
  FROM products
  WHERE id = v_sale.product_id
  FOR UPDATE;

  -- Delete the sale
  DELETE FROM sales WHERE id = p_sale_id;

  -- Restore product status to available
  UPDATE products
  SET status = 'available'
  WHERE id = v_sale.product_id;

  -- Log the inventory restoration
  INSERT INTO inventory_deduction_logs (
    sale_id,
    product_id,
    previous_status,
    new_status,
    notes
  ) VALUES (
    NULL,
    v_sale.product_id,
    v_product.status,
    'available',
    format('Inventory restored due to sale deletion (original sale id: %s)', p_sale_id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'productId', v_sale.product_id,
    'previousStatus', v_product.status,
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
-- 6. RECREATE: process_full_refund
-- ============================================================

CREATE OR REPLACE FUNCTION process_full_refund(
  p_receipt_id UUID,
  p_refund_reason VARCHAR(500) DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_receipt RECORD;
  v_refund_id UUID;
  v_refund_number VARCHAR(50);
  v_item RECORD;
  v_product RECORD;
  v_items_restored INTEGER := 0;
  v_refund_items JSONB := '[]'::JSONB;
BEGIN
  -- Lock the receipt to prevent concurrent refunds
  SELECT r.*,
         (SELECT COUNT(*) FROM refunds ref WHERE ref.original_receipt_id = r.id AND ref.status = 'completed') as existing_refunds
  INTO v_receipt
  FROM receipts r
  WHERE r.id = p_receipt_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Receipt with id "%" not found', p_receipt_id;
  END IF;

  IF v_receipt.existing_refunds > 0 THEN
    RAISE EXCEPTION 'Receipt "%" has already been refunded', v_receipt.receipt_number;
  END IF;

  v_refund_number := generate_refund_number();

  INSERT INTO refunds (
    refund_number, original_receipt_id, refund_date, refund_time,
    subtotal, tax_rate, tax_amount, refund_amount, refund_reason,
    customer_name, customer_phone, customer_email, status, notes
  ) VALUES (
    v_refund_number, p_receipt_id, CURRENT_DATE, CURRENT_TIME,
    v_receipt.subtotal, v_receipt.tax_rate, v_receipt.tax_amount,
    v_receipt.grand_total, p_refund_reason, v_receipt.customer_name,
    v_receipt.customer_phone, v_receipt.customer_email, 'completed', p_notes
  )
  RETURNING id INTO v_refund_id;

  FOR v_item IN
    SELECT ri.*, s.product_id
    FROM receipt_items ri
    LEFT JOIN sales s ON ri.sale_id = s.id
    WHERE ri.receipt_id = p_receipt_id
  LOOP
    INSERT INTO refund_items (
      refund_id, original_sale_id, product_id, item_name,
      quantity, unit_price, total, inventory_restored
    ) VALUES (
      v_refund_id, v_item.sale_id, v_item.product_id,
      v_item.item_name, v_item.quantity, v_item.unit_price,
      v_item.total, false
    );

    IF v_item.product_id IS NOT NULL THEN
      SELECT id, status, model
      INTO v_product
      FROM products
      WHERE id = v_item.product_id
      FOR UPDATE;

      IF FOUND AND v_product.status = 'sold' THEN
        UPDATE products
        SET status = 'available'
        WHERE id = v_item.product_id;

        UPDATE refund_items
        SET inventory_restored = true
        WHERE refund_id = v_refund_id AND product_id = v_item.product_id;

        INSERT INTO inventory_deduction_logs (
          sale_id, product_id, previous_status, new_status, notes
        ) VALUES (
          v_item.sale_id, v_item.product_id, v_product.status, 'available',
          format('Inventory restored due to full refund (refund number: %s)', v_refund_number)
        );

        v_items_restored := v_items_restored + 1;
      END IF;
    END IF;

    v_refund_items := v_refund_items || jsonb_build_object(
      'itemName', v_item.item_name,
      'quantity', v_item.quantity,
      'unitPrice', v_item.unit_price,
      'total', v_item.total,
      'productId', v_item.product_id,
      'inventoryRestored', v_item.product_id IS NOT NULL AND v_product.status = 'sold'
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'refundId', v_refund_id,
    'refundNumber', v_refund_number,
    'originalReceiptId', p_receipt_id,
    'originalReceiptNumber', v_receipt.receipt_number,
    'refundAmount', v_receipt.grand_total,
    'itemsRefunded', jsonb_array_length(v_refund_items),
    'inventoryRestored', v_items_restored,
    'items', v_refund_items
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'originalReceiptId', p_receipt_id
    );
END;
$$;

-- ============================================================
-- 7. RECREATE: check_receipt_refundable
-- ============================================================

CREATE OR REPLACE FUNCTION check_receipt_refundable(
  p_receipt_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_receipt RECORD;
  v_existing_refund RECORD;
  v_items JSONB := '[]'::JSONB;
  v_item RECORD;
BEGIN
  SELECT r.*
  INTO v_receipt
  FROM receipts r
  WHERE r.id = p_receipt_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'canRefund', false,
      'reason', 'Receipt not found',
      'receiptId', p_receipt_id
    );
  END IF;

  SELECT ref.*
  INTO v_existing_refund
  FROM refunds ref
  WHERE ref.original_receipt_id = p_receipt_id
    AND ref.status = 'completed'
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'canRefund', false,
      'reason', format('Receipt has already been refunded (Refund #%s)', v_existing_refund.refund_number),
      'receiptId', p_receipt_id,
      'receiptNumber', v_receipt.receipt_number,
      'existingRefundId', v_existing_refund.id,
      'existingRefundNumber', v_existing_refund.refund_number
    );
  END IF;

  FOR v_item IN
    SELECT ri.*,
           s.product_id,
           p.status as product_status,
           p.model as product_model,
           b.name as brand_name
    FROM receipt_items ri
    LEFT JOIN sales s ON ri.sale_id = s.id
    LEFT JOIN products p ON s.product_id = p.id
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE ri.receipt_id = p_receipt_id
  LOOP
    v_items := v_items || jsonb_build_object(
      'id', v_item.id,
      'saleId', v_item.sale_id,
      'productId', v_item.product_id,
      'itemName', v_item.item_name,
      'quantity', v_item.quantity,
      'unitPrice', v_item.unit_price,
      'total', v_item.total,
      'productStatus', v_item.product_status,
      'productModel', v_item.product_model,
      'brandName', v_item.brand_name,
      'canRestoreInventory', v_item.product_id IS NOT NULL AND v_item.product_status = 'sold'
    );
  END LOOP;

  RETURN jsonb_build_object(
    'canRefund', true,
    'receiptId', p_receipt_id,
    'receiptNumber', v_receipt.receipt_number,
    'transactionDate', v_receipt.transaction_date,
    'transactionTime', v_receipt.transaction_time,
    'subtotal', v_receipt.subtotal,
    'taxRate', v_receipt.tax_rate,
    'taxAmount', v_receipt.tax_amount,
    'grandTotal', v_receipt.grand_total,
    'customerName', v_receipt.customer_name,
    'customerPhone', v_receipt.customer_phone,
    'customerEmail', v_receipt.customer_email,
    'items', v_items
  );
END;
$$;

-- ============================================================
-- 8. RECREATE: check_receipt_partial_refundable
-- ============================================================

CREATE OR REPLACE FUNCTION check_receipt_partial_refundable(
  p_receipt_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_receipt RECORD;
  v_existing_full_refund RECORD;
  v_existing_partial_refunds JSONB;
  v_items JSONB := '[]'::JSONB;
  v_item RECORD;
  v_already_refunded_items UUID[];
BEGIN
  SELECT r.*
  INTO v_receipt
  FROM receipts r
  WHERE r.id = p_receipt_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'canPartialRefund', false,
      'reason', 'Receipt not found',
      'receiptId', p_receipt_id
    );
  END IF;

  SELECT ref.*
  INTO v_existing_full_refund
  FROM refunds ref
  WHERE ref.original_receipt_id = p_receipt_id
    AND ref.status = 'completed'
    AND ref.is_partial_refund = false
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'canPartialRefund', false,
      'reason', format('Receipt has already been fully refunded (Refund #%s)', v_existing_full_refund.refund_number),
      'receiptId', p_receipt_id,
      'receiptNumber', v_receipt.receipt_number,
      'existingRefundId', v_existing_full_refund.id,
      'existingRefundNumber', v_existing_full_refund.refund_number
    );
  END IF;

  SELECT ARRAY_AGG(DISTINCT ri.original_sale_id)
  INTO v_already_refunded_items
  FROM refund_items ri
  INNER JOIN refunds ref ON ri.refund_id = ref.id
  WHERE ref.original_receipt_id = p_receipt_id
    AND ref.status = 'completed'
    AND ref.is_partial_refund = true
    AND ri.original_sale_id IS NOT NULL;

  IF v_already_refunded_items IS NULL THEN
    v_already_refunded_items := ARRAY[]::UUID[];
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'refundNumber', ref.refund_number,
    'refundDate', ref.refund_date,
    'refundAmount', ref.refund_amount,
    'itemCount', (SELECT COUNT(*) FROM refund_items WHERE refund_id = ref.id)
  )), '[]'::jsonb)
  INTO v_existing_partial_refunds
  FROM refunds ref
  WHERE ref.original_receipt_id = p_receipt_id
    AND ref.status = 'completed'
    AND ref.is_partial_refund = true;

  FOR v_item IN
    SELECT ri.*,
           s.product_id,
           s.id as sale_id,
           p.status as product_status,
           p.model as product_model,
           b.name as brand_name
    FROM receipt_items ri
    LEFT JOIN sales s ON ri.sale_id = s.id
    LEFT JOIN products p ON s.product_id = p.id
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE ri.receipt_id = p_receipt_id
  LOOP
    v_items := v_items || jsonb_build_object(
      'id', v_item.id,
      'saleId', v_item.sale_id,
      'productId', v_item.product_id,
      'itemName', v_item.item_name,
      'quantity', v_item.quantity,
      'unitPrice', v_item.unit_price,
      'total', v_item.total,
      'productStatus', v_item.product_status,
      'productModel', v_item.product_model,
      'brandName', v_item.brand_name,
      'canRestoreInventory', v_item.product_id IS NOT NULL AND v_item.product_status = 'sold',
      'alreadyRefunded', v_item.sale_id = ANY(v_already_refunded_items),
      'canRefund', NOT (v_item.sale_id = ANY(v_already_refunded_items))
    );
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_items) elem
    WHERE (elem->>'canRefund')::boolean = true
  ) THEN
    RETURN jsonb_build_object(
      'canPartialRefund', false,
      'reason', 'All items from this receipt have already been refunded',
      'receiptId', p_receipt_id,
      'receiptNumber', v_receipt.receipt_number,
      'existingPartialRefunds', v_existing_partial_refunds
    );
  END IF;

  RETURN jsonb_build_object(
    'canPartialRefund', true,
    'receiptId', p_receipt_id,
    'receiptNumber', v_receipt.receipt_number,
    'transactionDate', v_receipt.transaction_date,
    'transactionTime', v_receipt.transaction_time,
    'originalSubtotal', v_receipt.subtotal,
    'taxRate', v_receipt.tax_rate,
    'originalTaxAmount', v_receipt.tax_amount,
    'originalGrandTotal', v_receipt.grand_total,
    'customerName', v_receipt.customer_name,
    'customerPhone', v_receipt.customer_phone,
    'customerEmail', v_receipt.customer_email,
    'items', v_items,
    'existingPartialRefunds', v_existing_partial_refunds,
    'alreadyRefundedItemCount', array_length(v_already_refunded_items, 1)
  );
END;
$$;

-- ============================================================
-- 9. RECREATE: process_partial_refund
-- ============================================================

CREATE OR REPLACE FUNCTION process_partial_refund(
  p_receipt_id UUID,
  p_items JSONB,
  p_refund_reason VARCHAR(500) DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_manager_approved BOOLEAN DEFAULT false,
  p_manager_approval_reason VARCHAR(500) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_receipt RECORD;
  v_refund_id UUID;
  v_refund_number VARCHAR(50);
  v_item_input RECORD;
  v_receipt_item RECORD;
  v_product RECORD;
  v_items_restored INTEGER := 0;
  v_refund_items JSONB := '[]'::JSONB;
  v_subtotal DECIMAL(12,2) := 0;
  v_tax_amount DECIMAL(12,2) := 0;
  v_refund_amount DECIMAL(12,2) := 0;
  v_has_price_override BOOLEAN := false;
  v_return_price DECIMAL(12,2);
  v_price_diff DECIMAL(12,2);
  v_is_custom BOOLEAN;
  v_already_refunded_items UUID[];
BEGIN
  SELECT r.*
  INTO v_receipt
  FROM receipts r
  WHERE r.id = p_receipt_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Receipt with id "%" not found', p_receipt_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM refunds
    WHERE original_receipt_id = p_receipt_id
      AND status = 'completed'
      AND is_partial_refund = false
  ) THEN
    RAISE EXCEPTION 'Receipt "%" has already been fully refunded', v_receipt.receipt_number;
  END IF;

  SELECT ARRAY_AGG(DISTINCT ri.original_sale_id)
  INTO v_already_refunded_items
  FROM refund_items ri
  INNER JOIN refunds ref ON ri.refund_id = ref.id
  WHERE ref.original_receipt_id = p_receipt_id
    AND ref.status = 'completed'
    AND ref.is_partial_refund = true
    AND ri.original_sale_id IS NOT NULL;

  IF v_already_refunded_items IS NULL THEN
    v_already_refunded_items := ARRAY[]::UUID[];
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'No items selected for refund';
  END IF;

  v_refund_number := generate_refund_number();

  INSERT INTO refunds (
    refund_number, original_receipt_id, refund_date, refund_time,
    subtotal, tax_rate, tax_amount, refund_amount, refund_reason,
    customer_name, customer_phone, customer_email, status, notes,
    is_partial_refund, manager_approved, manager_approved_at, manager_approval_reason
  ) VALUES (
    v_refund_number, p_receipt_id, CURRENT_DATE, CURRENT_TIME,
    0, v_receipt.tax_rate, 0, 0, p_refund_reason,
    v_receipt.customer_name, v_receipt.customer_phone, v_receipt.customer_email,
    'completed', p_notes, true, p_manager_approved,
    CASE WHEN p_manager_approved THEN CURRENT_TIMESTAMP ELSE NULL END,
    p_manager_approval_reason
  )
  RETURNING id INTO v_refund_id;

  FOR v_item_input IN
    SELECT * FROM jsonb_to_recordset(p_items) AS x(
      "receiptItemId" UUID,
      "returnPrice" DECIMAL(12,2)
    )
  LOOP
    SELECT ri.*, s.product_id, s.id as sale_id
    INTO v_receipt_item
    FROM receipt_items ri
    LEFT JOIN sales s ON ri.sale_id = s.id
    WHERE ri.id = v_item_input."receiptItemId"
      AND ri.receipt_id = p_receipt_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Receipt item "%" not found in receipt', v_item_input."receiptItemId";
    END IF;

    IF v_receipt_item.sale_id = ANY(v_already_refunded_items) THEN
      RAISE EXCEPTION 'Item "%" has already been refunded', v_receipt_item.item_name;
    END IF;

    v_return_price := COALESCE(v_item_input."returnPrice", v_receipt_item.unit_price);
    v_price_diff := v_return_price - v_receipt_item.unit_price;
    v_is_custom := v_return_price <> v_receipt_item.unit_price;

    IF v_price_diff > 0 AND NOT p_manager_approved THEN
      RAISE EXCEPTION 'Return price for "%" is higher than original price. Manager approval required.', v_receipt_item.item_name;
    END IF;

    IF v_is_custom THEN
      v_has_price_override := true;
    END IF;

    INSERT INTO refund_items (
      refund_id, original_sale_id, product_id, item_name,
      quantity, unit_price, total, inventory_restored,
      original_unit_price, is_custom_price, price_difference
    ) VALUES (
      v_refund_id, v_receipt_item.sale_id, v_receipt_item.product_id,
      v_receipt_item.item_name, v_receipt_item.quantity, v_return_price,
      v_return_price * v_receipt_item.quantity, false,
      v_receipt_item.unit_price, v_is_custom, v_price_diff
    );

    v_subtotal := v_subtotal + (v_return_price * v_receipt_item.quantity);

    IF v_receipt_item.product_id IS NOT NULL THEN
      SELECT id, status, model
      INTO v_product
      FROM products
      WHERE id = v_receipt_item.product_id
      FOR UPDATE;

      IF FOUND AND v_product.status = 'sold' THEN
        UPDATE products
        SET status = 'available'
        WHERE id = v_receipt_item.product_id;

        UPDATE refund_items
        SET inventory_restored = true
        WHERE refund_id = v_refund_id AND product_id = v_receipt_item.product_id;

        INSERT INTO inventory_deduction_logs (
          sale_id, product_id, previous_status, new_status, notes
        ) VALUES (
          v_receipt_item.sale_id, v_receipt_item.product_id, v_product.status, 'available',
          format('Inventory restored due to partial refund (refund number: %s)', v_refund_number)
        );

        v_items_restored := v_items_restored + 1;
      END IF;
    END IF;

    v_refund_items := v_refund_items || jsonb_build_object(
      'itemName', v_receipt_item.item_name,
      'quantity', v_receipt_item.quantity,
      'originalUnitPrice', v_receipt_item.unit_price,
      'returnPrice', v_return_price,
      'total', v_return_price * v_receipt_item.quantity,
      'productId', v_receipt_item.product_id,
      'inventoryRestored', v_receipt_item.product_id IS NOT NULL AND v_product.status = 'sold',
      'isCustomPrice', v_is_custom,
      'priceDifference', v_price_diff
    );
  END LOOP;

  v_tax_amount := ROUND(v_subtotal * (v_receipt.tax_rate / 100), 2);
  v_refund_amount := v_subtotal + v_tax_amount;

  UPDATE refunds
  SET subtotal = v_subtotal,
      tax_amount = v_tax_amount,
      refund_amount = v_refund_amount
  WHERE id = v_refund_id;

  RETURN jsonb_build_object(
    'success', true,
    'refundId', v_refund_id,
    'refundNumber', v_refund_number,
    'originalReceiptId', p_receipt_id,
    'originalReceiptNumber', v_receipt.receipt_number,
    'isPartialRefund', true,
    'subtotal', v_subtotal,
    'taxRate', v_receipt.tax_rate,
    'taxAmount', v_tax_amount,
    'refundAmount', v_refund_amount,
    'itemsRefunded', jsonb_array_length(v_refund_items),
    'inventoryRestored', v_items_restored,
    'hasCustomPrices', v_has_price_override,
    'managerApproved', p_manager_approved,
    'items', v_refund_items
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'originalReceiptId', p_receipt_id
    );
END;
$$;

-- ============================================================
-- 10. RECREATE: calculate_item_tax
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_item_tax(
  product_id_param UUID,
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
  product_record RECORD;
  calc_unit_price DECIMAL;
  calc_base_price DECIMAL;
  calc_tax_amount DECIMAL;
BEGIN
  SELECT
    p.selling_price,
    p.tax_rate AS product_tax_rate,
    p.is_tax_inclusive,
    p.is_tax_exempt AS product_is_tax_exempt
  INTO product_record
  FROM products p
  WHERE p.id = product_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product with id % not found', product_id_param;
  END IF;

  calc_unit_price := COALESCE(override_price, product_record.selling_price);

  IF product_record.product_is_tax_exempt THEN
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

  IF product_record.is_tax_inclusive THEN
    SELECT ctfip.base_price, ctfip.tax_amount
    INTO calc_base_price, calc_tax_amount
    FROM calculate_tax_from_inclusive_price(calc_unit_price, product_record.product_tax_rate) ctfip;
  ELSE
    calc_base_price := calc_unit_price;
    SELECT ctfep.tax_amount
    INTO calc_tax_amount
    FROM calculate_tax_from_exclusive_price(calc_unit_price, product_record.product_tax_rate) ctfep;
  END IF;

  RETURN QUERY SELECT
    calc_unit_price,
    calc_base_price,
    calc_tax_amount,
    ROUND(calc_base_price * quantity_param, 2),
    ROUND(calc_tax_amount * quantity_param, 2),
    ROUND((calc_base_price + calc_tax_amount) * quantity_param, 2),
    product_record.product_tax_rate,
    false;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- 11. RECREATE: initiate_inventory_transfer
-- ============================================================

CREATE OR REPLACE FUNCTION initiate_inventory_transfer(
  p_source_location_id UUID,
  p_destination_location_id UUID,
  p_items JSONB,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_transfer_id UUID;
  v_transfer_number VARCHAR(50);
  v_item JSONB;
  v_product_id UUID;
  v_quantity INTEGER;
  v_current_quantity INTEGER;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF p_source_location_id = p_destination_location_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Source and destination locations must be different');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM store_locations WHERE id = p_source_location_id AND is_active = true) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Source location not found or inactive');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM store_locations WHERE id = p_destination_location_id AND is_active = true) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Destination location not found or inactive');
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;

    SELECT COALESCE(quantity, 0) INTO v_current_quantity
    FROM location_inventory
    WHERE product_id = v_product_id AND location_id = p_source_location_id;

    IF v_current_quantity < v_quantity THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Insufficient quantity for product ' || v_product_id || '. Available: ' || v_current_quantity || ', Requested: ' || v_quantity
      );
    END IF;
  END LOOP;

  v_transfer_number := generate_transfer_number();

  INSERT INTO inventory_transfers (
    transfer_number, source_location_id, destination_location_id,
    status, initiated_by_user_id, notes
  ) VALUES (
    v_transfer_number, p_source_location_id, p_destination_location_id,
    'pending', v_user_id, p_notes
  ) RETURNING id INTO v_transfer_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;

    INSERT INTO inventory_transfer_items (
      transfer_id, product_id, quantity, notes
    ) VALUES (
      v_transfer_id, v_product_id, v_quantity, v_item->>'notes'
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'transferId', v_transfer_id,
    'transferNumber', v_transfer_number
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 12. RECREATE: complete_inventory_transfer
-- ============================================================

CREATE OR REPLACE FUNCTION complete_inventory_transfer(
  p_transfer_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_transfer RECORD;
  v_item RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  SELECT * INTO v_transfer FROM inventory_transfers WHERE id = p_transfer_id;

  IF v_transfer.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transfer not found');
  END IF;

  IF v_transfer.status != 'pending' AND v_transfer.status != 'in_transit' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transfer cannot be completed. Current status: ' || v_transfer.status);
  END IF;

  FOR v_item IN SELECT * FROM inventory_transfer_items WHERE transfer_id = p_transfer_id
  LOOP
    UPDATE location_inventory
    SET quantity = quantity - v_item.quantity
    WHERE product_id = v_item.product_id AND location_id = v_transfer.source_location_id;

    INSERT INTO location_inventory (product_id, location_id, quantity)
    VALUES (v_item.product_id, v_transfer.destination_location_id, v_item.quantity)
    ON CONFLICT (product_id, location_id)
    DO UPDATE SET quantity = location_inventory.quantity + EXCLUDED.quantity;
  END LOOP;

  UPDATE inventory_transfers
  SET
    status = 'completed',
    completed_by_user_id = v_user_id,
    completed_at = now()
  WHERE id = p_transfer_id;

  RETURN jsonb_build_object(
    'success', true,
    'transferId', p_transfer_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 13. RECREATE: get_location_inventory
-- ============================================================

CREATE OR REPLACE FUNCTION get_location_inventory(
  p_location_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_location RECORD;
  v_inventory JSONB;
  v_stats RECORD;
BEGIN
  SELECT * INTO v_location FROM store_locations WHERE id = p_location_id;

  IF v_location.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Location not found');
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', li.id,
      'productId', li.product_id,
      'quantity', li.quantity,
      'minStockLevel', li.min_stock_level,
      'maxStockLevel', li.max_stock_level,
      'product', jsonb_build_object(
        'id', p.id,
        'model', p.model,
        'status', p.status,
        'sellingPrice', p.selling_price,
        'costPrice', p.cost_price,
        'condition', p.condition,
        'productType', p.product_type,
        'brandName', b.name,
        'brandId', b.id
      )
    )
  ) INTO v_inventory
  FROM location_inventory li
  JOIN products p ON li.product_id = p.id
  LEFT JOIN brands b ON p.brand_id = b.id
  WHERE li.location_id = p_location_id AND li.quantity > 0;

  SELECT
    COUNT(DISTINCT li.product_id) as total_products,
    COALESCE(SUM(li.quantity), 0) as total_units,
    COALESCE(SUM(li.quantity * p.selling_price), 0) as total_value,
    COUNT(DISTINCT CASE WHEN li.quantity <= li.min_stock_level THEN li.product_id END) as low_stock_count
  INTO v_stats
  FROM location_inventory li
  JOIN products p ON li.product_id = p.id
  WHERE li.location_id = p_location_id AND li.quantity > 0;

  RETURN jsonb_build_object(
    'success', true,
    'location', jsonb_build_object(
      'id', v_location.id,
      'name', v_location.name,
      'code', v_location.code,
      'address', v_location.address
    ),
    'inventory', COALESCE(v_inventory, '[]'::jsonb),
    'stats', jsonb_build_object(
      'totalProducts', v_stats.total_products,
      'totalUnits', v_stats.total_units,
      'totalValue', v_stats.total_value,
      'lowStockCount', v_stats.low_stock_count
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 14. RECREATE: assign_product_to_location (renamed from assign_phone_to_location)
-- ============================================================

CREATE OR REPLACE FUNCTION assign_product_to_location(
  p_product_id UUID,
  p_location_id UUID,
  p_quantity INTEGER DEFAULT 1
) RETURNS JSONB AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM store_locations WHERE id = p_location_id AND is_active = true) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Location not found or inactive');
  END IF;

  INSERT INTO location_inventory (product_id, location_id, quantity)
  VALUES (p_product_id, p_location_id, p_quantity)
  ON CONFLICT (product_id, location_id)
  DO UPDATE SET quantity = location_inventory.quantity + EXCLUDED.quantity;

  RETURN jsonb_build_object('success', true, 'productId', p_product_id, 'locationId', p_location_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 15. RECREATE: get_product_location_inventory (renamed from get_phone_location_inventory)
-- ============================================================

CREATE OR REPLACE FUNCTION get_product_location_inventory(p_product_id UUID)
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
  WHERE li.product_id = p_product_id
    AND sl.is_active = TRUE
  ORDER BY sl.is_primary DESC, sl.name;
END;
$$;

-- ============================================================
-- 16. RECREATE: check_location_inventory_availability
-- ============================================================

CREATE OR REPLACE FUNCTION check_location_inventory_availability(
  p_product_ids UUID[],
  p_location_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id UUID;
  v_product RECORD;
  v_inventory RECORD;
  v_products JSONB := '[]'::JSONB;
  v_warnings JSONB := '[]'::JSONB;
  v_all_available BOOLEAN := TRUE;
  v_has_warnings BOOLEAN := FALSE;
BEGIN
  FOREACH v_product_id IN ARRAY p_product_ids
  LOOP
    SELECT p.id, p.model, p.status, b.name AS brand_name
    INTO v_product
    FROM products p
    JOIN brands b ON b.id = p.brand_id
    WHERE p.id = v_product_id;

    IF NOT FOUND THEN
      v_all_available := FALSE;
      v_products := v_products || jsonb_build_array(jsonb_build_object(
        'productId', v_product_id,
        'available', false,
        'error', 'Product not found'
      ));
      CONTINUE;
    END IF;

    SELECT * INTO v_inventory
    FROM location_inventory
    WHERE product_id = v_product_id AND location_id = p_location_id;

    IF NOT FOUND OR v_inventory.quantity < 1 THEN
      v_all_available := FALSE;
      v_has_warnings := TRUE;
      v_products := v_products || jsonb_build_array(jsonb_build_object(
        'productId', v_product_id,
        'model', v_product.model,
        'brandName', v_product.brand_name,
        'status', v_product.status,
        'available', false,
        'warning', 'No stock at this location'
      ));
      v_warnings := v_warnings || jsonb_build_array(jsonb_build_object(
        'productId', v_product_id,
        'message', 'No stock at this location'
      ));
    ELSE
      v_products := v_products || jsonb_build_array(jsonb_build_object(
        'productId', v_product_id,
        'model', v_product.model,
        'brandName', v_product.brand_name,
        'status', v_product.status,
        'available', true,
        'quantity', v_inventory.quantity
      ));
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'allAvailable', v_all_available,
    'hasWarnings', v_has_warnings,
    'locationId', p_location_id,
    'products', v_products,
    'warnings', CASE WHEN jsonb_array_length(v_warnings) > 0 THEN v_warnings ELSE NULL END
  );
END;
$$;

-- ============================================================
-- 17. RECREATE: log_sale_audit
-- ============================================================

CREATE OR REPLACE FUNCTION log_sale_audit(
  p_event_type audit_event_type,
  p_sale_id UUID,
  p_product_id UUID,
  p_amount DECIMAL,
  p_buyer_name VARCHAR DEFAULT NULL,
  p_buyer_phone VARCHAR DEFAULT NULL,
  p_items_sold INTEGER DEFAULT 1,
  p_client_ip INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
BEGIN
  RETURN create_audit_log(
    p_event_type := p_event_type,
    p_entity_type := 'sale',
    p_entity_id := p_sale_id,
    p_amount := p_amount,
    p_metadata := jsonb_build_object(
      'productId', p_product_id,
      'buyerName', p_buyer_name,
      'buyerPhone', p_buyer_phone,
      'itemsSold', p_items_sold
    ),
    p_client_ip := p_client_ip,
    p_user_agent := p_user_agent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 18. RECREATE: log_inventory_audit
-- ============================================================

CREATE OR REPLACE FUNCTION log_inventory_audit(
  p_event_type audit_event_type,
  p_product_id UUID,
  p_previous_status VARCHAR,
  p_new_status VARCHAR,
  p_sale_id UUID DEFAULT NULL,
  p_refund_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_client_ip INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
BEGIN
  RETURN create_audit_log(
    p_event_type := p_event_type,
    p_entity_type := 'product',
    p_entity_id := p_product_id,
    p_transaction_id := COALESCE(p_sale_id, p_refund_id),
    p_previous_state := jsonb_build_object('status', p_previous_status),
    p_new_state := jsonb_build_object('status', p_new_status),
    p_changes := jsonb_build_object(
      'status', jsonb_build_object(
        'from', p_previous_status,
        'to', p_new_status
      )
    ),
    p_notes := p_notes,
    p_metadata := jsonb_build_object(
      'saleId', p_sale_id,
      'refundId', p_refund_id
    ),
    p_client_ip := p_client_ip,
    p_user_agent := p_user_agent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 19. RECREATE: get_refund_by_receipt (updated column references)
-- ============================================================

CREATE OR REPLACE FUNCTION get_refund_by_receipt(
  p_receipt_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_refund RECORD;
  v_items JSONB := '[]'::JSONB;
  v_item RECORD;
BEGIN
  SELECT *
  INTO v_refund
  FROM refunds
  WHERE original_receipt_id = p_receipt_id
    AND status = 'completed'
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'found', false,
      'receiptId', p_receipt_id
    );
  END IF;

  FOR v_item IN
    SELECT ri.*,
           p.model as product_model,
           b.name as brand_name
    FROM refund_items ri
    LEFT JOIN products p ON ri.product_id = p.id
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE ri.refund_id = v_refund.id
  LOOP
    v_items := v_items || jsonb_build_object(
      'id', v_item.id,
      'originalSaleId', v_item.original_sale_id,
      'productId', v_item.product_id,
      'itemName', v_item.item_name,
      'quantity', v_item.quantity,
      'unitPrice', v_item.unit_price,
      'total', v_item.total,
      'inventoryRestored', v_item.inventory_restored,
      'productModel', v_item.product_model,
      'brandName', v_item.brand_name
    );
  END LOOP;

  RETURN jsonb_build_object(
    'found', true,
    'refund', jsonb_build_object(
      'id', v_refund.id,
      'refundNumber', v_refund.refund_number,
      'originalReceiptId', v_refund.original_receipt_id,
      'refundDate', v_refund.refund_date,
      'refundTime', v_refund.refund_time,
      'subtotal', v_refund.subtotal,
      'taxRate', v_refund.tax_rate,
      'taxAmount', v_refund.tax_amount,
      'refundAmount', v_refund.refund_amount,
      'refundReason', v_refund.refund_reason,
      'customerName', v_refund.customer_name,
      'customerPhone', v_refund.customer_phone,
      'customerEmail', v_refund.customer_email,
      'status', v_refund.status,
      'notes', v_refund.notes,
      'createdAt', v_refund.created_at,
      'items', v_items
    )
  );
END;
$$;

-- ============================================================
-- 20. GRANT EXECUTE PERMISSIONS
-- ============================================================

GRANT EXECUTE ON FUNCTION complete_sale_with_inventory_deduction TO authenticated;
GRANT EXECUTE ON FUNCTION complete_batch_sale_with_inventory_deduction TO authenticated;
GRANT EXECUTE ON FUNCTION check_inventory_availability TO authenticated;
GRANT EXECUTE ON FUNCTION revert_sale_restore_inventory TO authenticated;
GRANT EXECUTE ON FUNCTION process_full_refund TO authenticated;
GRANT EXECUTE ON FUNCTION check_receipt_refundable TO authenticated;
GRANT EXECUTE ON FUNCTION check_receipt_partial_refundable TO authenticated;
GRANT EXECUTE ON FUNCTION process_partial_refund TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_item_tax TO authenticated;
GRANT EXECUTE ON FUNCTION initiate_inventory_transfer TO authenticated;
GRANT EXECUTE ON FUNCTION complete_inventory_transfer TO authenticated;
GRANT EXECUTE ON FUNCTION get_location_inventory TO authenticated;
GRANT EXECUTE ON FUNCTION assign_product_to_location TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_location_inventory TO authenticated;
GRANT EXECUTE ON FUNCTION check_location_inventory_availability TO authenticated;
GRANT EXECUTE ON FUNCTION log_sale_audit TO authenticated;
GRANT EXECUTE ON FUNCTION log_inventory_audit TO authenticated;
GRANT EXECUTE ON FUNCTION get_refund_by_receipt TO authenticated;

-- ============================================================
-- 21. UPDATE COMMENTS
-- ============================================================

COMMENT ON FUNCTION calculate_item_tax IS 'Calculates complete tax information for a product item';
COMMENT ON FUNCTION assign_product_to_location IS 'Assign a product to a location inventory (create or increment quantity)';
COMMENT ON FUNCTION get_product_location_inventory IS 'Get inventory levels for a product across all active locations';
COMMENT ON FUNCTION check_location_inventory_availability IS 'Check inventory availability at a specific location for given products';
