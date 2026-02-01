-- Migration: Partial Refund Processing with Custom Return Price
-- Feature: F-010 - Partial Refund Processing with Custom Return Price
-- Process refunds for individual items from multi-item transactions with custom return prices

-- ============================================================
-- 1. ADD PARTIAL REFUND COLUMNS TO REFUNDS TABLE
-- ============================================================

-- Add column to track if refund is partial or full
ALTER TABLE refunds
ADD COLUMN IF NOT EXISTS is_partial_refund BOOLEAN NOT NULL DEFAULT false;

-- Add column to track manager approval for price overrides
ALTER TABLE refunds
ADD COLUMN IF NOT EXISTS manager_approved BOOLEAN NOT NULL DEFAULT false;

-- Add column to track manager approval timestamp
ALTER TABLE refunds
ADD COLUMN IF NOT EXISTS manager_approved_at TIMESTAMPTZ;

-- Add column to track manager approval reason
ALTER TABLE refunds
ADD COLUMN IF NOT EXISTS manager_approval_reason VARCHAR(500);

COMMENT ON COLUMN refunds.is_partial_refund IS 'True if only selected items were refunded (not the entire receipt)';
COMMENT ON COLUMN refunds.manager_approved IS 'True if manager approved custom return price higher than original';
COMMENT ON COLUMN refunds.manager_approved_at IS 'Timestamp when manager approved the custom price override';
COMMENT ON COLUMN refunds.manager_approval_reason IS 'Reason provided for manager approval of price override';

-- ============================================================
-- 2. ADD CUSTOM RETURN PRICE COLUMNS TO REFUND_ITEMS TABLE
-- ============================================================

-- Add column for original sale price (for reference)
ALTER TABLE refund_items
ADD COLUMN IF NOT EXISTS original_unit_price DECIMAL(12,2);

-- Add column to track if custom price was used
ALTER TABLE refund_items
ADD COLUMN IF NOT EXISTS is_custom_price BOOLEAN NOT NULL DEFAULT false;

-- Add column for price difference (positive = higher than original)
ALTER TABLE refund_items
ADD COLUMN IF NOT EXISTS price_difference DECIMAL(12,2) DEFAULT 0;

COMMENT ON COLUMN refund_items.original_unit_price IS 'Original sale price for reference when custom return price is used';
COMMENT ON COLUMN refund_items.is_custom_price IS 'True if return price differs from original sale price';
COMMENT ON COLUMN refund_items.price_difference IS 'Difference between return price and original price (positive = higher)';

-- ============================================================
-- 3. CREATE INDEX FOR PARTIAL REFUNDS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_refunds_is_partial ON refunds(is_partial_refund);

-- ============================================================
-- 4. CREATE FUNCTION TO CHECK RECEIPT PARTIAL REFUNDABLE
-- ============================================================

-- Check if a receipt can be partially refunded
-- Returns detailed item info for selection
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
  -- Get receipt
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

  -- Check for existing FULL refund (blocks any further refunds)
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

  -- Get list of already refunded items from partial refunds
  SELECT ARRAY_AGG(DISTINCT ri.original_sale_id)
  INTO v_already_refunded_items
  FROM refund_items ri
  INNER JOIN refunds ref ON ri.refund_id = ref.id
  WHERE ref.original_receipt_id = p_receipt_id
    AND ref.status = 'completed'
    AND ref.is_partial_refund = true
    AND ri.original_sale_id IS NOT NULL;

  -- If null, set to empty array
  IF v_already_refunded_items IS NULL THEN
    v_already_refunded_items := ARRAY[]::UUID[];
  END IF;

  -- Get existing partial refunds info
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

  -- Build items list with refund eligibility
  FOR v_item IN
    SELECT ri.*,
           s.phone_id,
           s.id as sale_id,
           p.status as phone_status,
           p.model as phone_model,
           b.name as brand_name
    FROM receipt_items ri
    LEFT JOIN sales s ON ri.sale_id = s.id
    LEFT JOIN phones p ON s.phone_id = p.id
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE ri.receipt_id = p_receipt_id
  LOOP
    v_items := v_items || jsonb_build_object(
      'id', v_item.id,
      'saleId', v_item.sale_id,
      'phoneId', v_item.phone_id,
      'itemName', v_item.item_name,
      'quantity', v_item.quantity,
      'unitPrice', v_item.unit_price,
      'total', v_item.total,
      'phoneStatus', v_item.phone_status,
      'phoneModel', v_item.phone_model,
      'brandName', v_item.brand_name,
      'canRestoreInventory', v_item.phone_id IS NOT NULL AND v_item.phone_status = 'sold',
      'alreadyRefunded', v_item.sale_id = ANY(v_already_refunded_items),
      'canRefund', NOT (v_item.sale_id = ANY(v_already_refunded_items))
    );
  END LOOP;

  -- Check if any items are available for refund
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
-- 5. CREATE FUNCTION TO PROCESS PARTIAL REFUND
-- ============================================================

-- Atomic function to process a partial refund with custom return prices
-- Parameters:
--   p_receipt_id: Original receipt ID
--   p_items: JSON array of items to refund with custom prices
--     [{ "receiptItemId": "uuid", "returnPrice": 100.00 }, ...]
--   p_refund_reason: Optional reason for refund
--   p_notes: Optional notes
--   p_manager_approved: Whether manager approved price override
--   p_manager_approval_reason: Reason for manager approval

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
  v_phone RECORD;
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
  -- Lock the receipt to prevent concurrent refunds
  SELECT r.*
  INTO v_receipt
  FROM receipts r
  WHERE r.id = p_receipt_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Receipt with id "%" not found', p_receipt_id;
  END IF;

  -- Check for existing full refund
  IF EXISTS (
    SELECT 1 FROM refunds
    WHERE original_receipt_id = p_receipt_id
      AND status = 'completed'
      AND is_partial_refund = false
  ) THEN
    RAISE EXCEPTION 'Receipt "%" has already been fully refunded', v_receipt.receipt_number;
  END IF;

  -- Get list of already refunded items from partial refunds
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

  -- Validate items array
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'No items selected for refund';
  END IF;

  -- Generate refund number
  v_refund_number := generate_refund_number();

  -- Create refund record (will update amounts after processing items)
  INSERT INTO refunds (
    refund_number,
    original_receipt_id,
    refund_date,
    refund_time,
    subtotal,
    tax_rate,
    tax_amount,
    refund_amount,
    refund_reason,
    customer_name,
    customer_phone,
    customer_email,
    status,
    notes,
    is_partial_refund,
    manager_approved,
    manager_approved_at,
    manager_approval_reason
  ) VALUES (
    v_refund_number,
    p_receipt_id,
    CURRENT_DATE,
    CURRENT_TIME,
    0, -- Will update after processing items
    v_receipt.tax_rate,
    0, -- Will update after processing items
    0, -- Will update after processing items
    p_refund_reason,
    v_receipt.customer_name,
    v_receipt.customer_phone,
    v_receipt.customer_email,
    'completed',
    p_notes,
    true, -- is_partial_refund
    p_manager_approved,
    CASE WHEN p_manager_approved THEN CURRENT_TIMESTAMP ELSE NULL END,
    p_manager_approval_reason
  )
  RETURNING id INTO v_refund_id;

  -- Process each selected item
  FOR v_item_input IN
    SELECT * FROM jsonb_to_recordset(p_items) AS x(
      "receiptItemId" UUID,
      "returnPrice" DECIMAL(12,2)
    )
  LOOP
    -- Get the receipt item details
    SELECT ri.*, s.phone_id, s.id as sale_id
    INTO v_receipt_item
    FROM receipt_items ri
    LEFT JOIN sales s ON ri.sale_id = s.id
    WHERE ri.id = v_item_input."receiptItemId"
      AND ri.receipt_id = p_receipt_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Receipt item "%" not found in receipt', v_item_input."receiptItemId";
    END IF;

    -- Check if item was already refunded
    IF v_receipt_item.sale_id = ANY(v_already_refunded_items) THEN
      RAISE EXCEPTION 'Item "%" has already been refunded', v_receipt_item.item_name;
    END IF;

    -- Determine return price
    v_return_price := COALESCE(v_item_input."returnPrice", v_receipt_item.unit_price);
    v_price_diff := v_return_price - v_receipt_item.unit_price;
    v_is_custom := v_return_price <> v_receipt_item.unit_price;

    -- Check if price is higher than original (requires manager approval)
    IF v_price_diff > 0 AND NOT p_manager_approved THEN
      RAISE EXCEPTION 'Return price for "%" is higher than original price. Manager approval required.', v_receipt_item.item_name;
    END IF;

    IF v_is_custom THEN
      v_has_price_override := true;
    END IF;

    -- Create refund item
    INSERT INTO refund_items (
      refund_id,
      original_sale_id,
      phone_id,
      item_name,
      quantity,
      unit_price,
      total,
      inventory_restored,
      original_unit_price,
      is_custom_price,
      price_difference
    ) VALUES (
      v_refund_id,
      v_receipt_item.sale_id,
      v_receipt_item.phone_id,
      v_receipt_item.item_name,
      v_receipt_item.quantity,
      v_return_price,
      v_return_price * v_receipt_item.quantity,
      false,
      v_receipt_item.unit_price,
      v_is_custom,
      v_price_diff
    );

    -- Update subtotal
    v_subtotal := v_subtotal + (v_return_price * v_receipt_item.quantity);

    -- Restore inventory if phone_id exists and phone is sold
    IF v_receipt_item.phone_id IS NOT NULL THEN
      SELECT id, status, model
      INTO v_phone
      FROM phones
      WHERE id = v_receipt_item.phone_id
      FOR UPDATE;

      IF FOUND AND v_phone.status = 'sold' THEN
        -- Restore phone status to available
        UPDATE phones
        SET status = 'available'
        WHERE id = v_receipt_item.phone_id;

        -- Update refund item to mark inventory restored
        UPDATE refund_items
        SET inventory_restored = true
        WHERE refund_id = v_refund_id AND phone_id = v_receipt_item.phone_id;

        -- Log the inventory restoration
        INSERT INTO inventory_deduction_logs (
          sale_id,
          phone_id,
          previous_status,
          new_status,
          notes
        ) VALUES (
          v_receipt_item.sale_id,
          v_receipt_item.phone_id,
          v_phone.status,
          'available',
          format('Inventory restored due to partial refund (refund number: %s)', v_refund_number)
        );

        v_items_restored := v_items_restored + 1;
      END IF;
    END IF;

    -- Add to refund items array for response
    v_refund_items := v_refund_items || jsonb_build_object(
      'itemName', v_receipt_item.item_name,
      'quantity', v_receipt_item.quantity,
      'originalUnitPrice', v_receipt_item.unit_price,
      'returnPrice', v_return_price,
      'total', v_return_price * v_receipt_item.quantity,
      'phoneId', v_receipt_item.phone_id,
      'inventoryRestored', v_receipt_item.phone_id IS NOT NULL AND v_phone.status = 'sold',
      'isCustomPrice', v_is_custom,
      'priceDifference', v_price_diff
    );
  END LOOP;

  -- Calculate tax and total
  v_tax_amount := ROUND(v_subtotal * (v_receipt.tax_rate / 100), 2);
  v_refund_amount := v_subtotal + v_tax_amount;

  -- Update refund record with calculated amounts
  UPDATE refunds
  SET subtotal = v_subtotal,
      tax_amount = v_tax_amount,
      refund_amount = v_refund_amount
  WHERE id = v_refund_id;

  -- Return success result
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
    -- Transaction will automatically rollback
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'originalReceiptId', p_receipt_id
    );
END;
$$;

-- ============================================================
-- 6. GRANT EXECUTE PERMISSIONS
-- ============================================================

GRANT EXECUTE ON FUNCTION check_receipt_partial_refundable TO authenticated;
GRANT EXECUTE ON FUNCTION process_partial_refund TO authenticated;
