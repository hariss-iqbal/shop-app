-- Migration: Full Refund Processing
-- Feature: F-009 - Full Refund Processing
-- Process complete refunds for entire transactions, restoring inventory and generating refund receipts

-- ============================================================
-- 1. CREATE REFUND STATUS ENUM TYPE
-- ============================================================

DO $$ BEGIN
  CREATE TYPE refund_status AS ENUM ('pending', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- 2. CREATE REFUNDS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_number VARCHAR(50) NOT NULL UNIQUE,
  original_receipt_id UUID REFERENCES receipts(id) ON DELETE RESTRICT,
  refund_date DATE NOT NULL DEFAULT CURRENT_DATE,
  refund_time TIME NOT NULL DEFAULT CURRENT_TIME,
  subtotal DECIMAL(12,2) NOT NULL,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  refund_amount DECIMAL(12,2) NOT NULL,
  refund_reason VARCHAR(500),
  customer_name VARCHAR(200),
  customer_phone VARCHAR(30),
  customer_email VARCHAR(255),
  status refund_status NOT NULL DEFAULT 'completed',
  processed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  CONSTRAINT refunds_subtotal_positive CHECK (subtotal >= 0),
  CONSTRAINT refunds_refund_amount_positive CHECK (refund_amount >= 0),
  CONSTRAINT refunds_notes_maxlength CHECK (char_length(notes) <= 2000),
  CONSTRAINT refunds_reason_maxlength CHECK (char_length(refund_reason) <= 500)
);

CREATE INDEX idx_refunds_refund_number ON refunds(refund_number);
CREATE INDEX idx_refunds_original_receipt_id ON refunds(original_receipt_id);
CREATE INDEX idx_refunds_refund_date ON refunds(refund_date);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_customer_phone ON refunds(customer_phone);

COMMENT ON TABLE refunds IS 'Stores refund transactions linked to original receipts';
COMMENT ON COLUMN refunds.refund_number IS 'Unique refund reference number (e.g., REF-0001)';
COMMENT ON COLUMN refunds.original_receipt_id IS 'Links to the original receipt being refunded';
COMMENT ON COLUMN refunds.refund_amount IS 'Total refund amount (subtotal + tax)';
COMMENT ON COLUMN refunds.status IS 'Refund status: pending, completed, cancelled';

-- ============================================================
-- 3. CREATE REFUND ITEMS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS refund_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_id UUID NOT NULL REFERENCES refunds(id) ON DELETE CASCADE,
  original_sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  phone_id UUID REFERENCES phones(id) ON DELETE SET NULL,
  item_name VARCHAR(300) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  inventory_restored BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT refund_items_quantity_positive CHECK (quantity > 0),
  CONSTRAINT refund_items_item_name_maxlength CHECK (char_length(item_name) <= 300)
);

CREATE INDEX idx_refund_items_refund_id ON refund_items(refund_id);
CREATE INDEX idx_refund_items_original_sale_id ON refund_items(original_sale_id);
CREATE INDEX idx_refund_items_phone_id ON refund_items(phone_id);

COMMENT ON TABLE refund_items IS 'Line items for each refund transaction';
COMMENT ON COLUMN refund_items.original_sale_id IS 'Links to the original sale record';
COMMENT ON COLUMN refund_items.phone_id IS 'Links to the phone for inventory restoration';
COMMENT ON COLUMN refund_items.inventory_restored IS 'Whether inventory was restored for this item';

-- ============================================================
-- 4. CREATE UPDATED_AT TRIGGERS
-- ============================================================

CREATE TRIGGER trg_refunds_updated_at
  BEFORE UPDATE ON refunds
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 5. ENABLE RLS AND CREATE POLICIES
-- ============================================================

ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_items ENABLE ROW LEVEL SECURITY;

-- Refunds table policies
CREATE POLICY "refunds_authenticated_select" ON refunds
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "refunds_authenticated_insert" ON refunds
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "refunds_authenticated_update" ON refunds
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "refunds_authenticated_delete" ON refunds
  FOR DELETE TO authenticated
  USING (true);

-- Refund items table policies
CREATE POLICY "refund_items_authenticated_select" ON refund_items
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "refund_items_authenticated_insert" ON refund_items
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "refund_items_authenticated_update" ON refund_items
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "refund_items_authenticated_delete" ON refund_items
  FOR DELETE TO authenticated
  USING (true);

-- ============================================================
-- 6. CREATE FUNCTION TO GENERATE REFUND NUMBER
-- ============================================================

CREATE OR REPLACE FUNCTION generate_refund_number()
RETURNS VARCHAR(50)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
  v_number VARCHAR(50);
BEGIN
  -- Get count of existing refunds
  SELECT COUNT(*) + 1 INTO v_count FROM refunds;

  -- Generate refund number with padding
  v_number := 'REF-' || LPAD(v_count::TEXT, 6, '0');

  -- Handle duplicates by incrementing until unique
  WHILE EXISTS (SELECT 1 FROM refunds WHERE refund_number = v_number) LOOP
    v_count := v_count + 1;
    v_number := 'REF-' || LPAD(v_count::TEXT, 6, '0');
  END LOOP;

  RETURN v_number;
END;
$$;

-- ============================================================
-- 7. CREATE FUNCTION TO PROCESS FULL REFUND
-- ============================================================

-- Atomic function to process a full refund
-- 1. Validates the receipt exists and has no prior refunds
-- 2. Creates refund record linked to original receipt
-- 3. Creates refund items from original receipt items
-- 4. Restores inventory (phone status to 'available')
-- 5. Logs inventory changes
-- If any step fails, entire transaction is rolled back

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
  v_phone RECORD;
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

  -- Check for existing refunds
  IF v_receipt.existing_refunds > 0 THEN
    RAISE EXCEPTION 'Receipt "%" has already been refunded', v_receipt.receipt_number;
  END IF;

  -- Generate refund number
  v_refund_number := generate_refund_number();

  -- Create refund record
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
    notes
  ) VALUES (
    v_refund_number,
    p_receipt_id,
    CURRENT_DATE,
    CURRENT_TIME,
    v_receipt.subtotal,
    v_receipt.tax_rate,
    v_receipt.tax_amount,
    v_receipt.grand_total,
    p_refund_reason,
    v_receipt.customer_name,
    v_receipt.customer_phone,
    v_receipt.customer_email,
    'completed',
    p_notes
  )
  RETURNING id INTO v_refund_id;

  -- Process each receipt item
  FOR v_item IN
    SELECT ri.*, s.phone_id
    FROM receipt_items ri
    LEFT JOIN sales s ON ri.sale_id = s.id
    WHERE ri.receipt_id = p_receipt_id
  LOOP
    -- Create refund item
    INSERT INTO refund_items (
      refund_id,
      original_sale_id,
      phone_id,
      item_name,
      quantity,
      unit_price,
      total,
      inventory_restored
    ) VALUES (
      v_refund_id,
      v_item.sale_id,
      v_item.phone_id,
      v_item.item_name,
      v_item.quantity,
      v_item.unit_price,
      v_item.total,
      false
    );

    -- Restore inventory if phone_id exists
    IF v_item.phone_id IS NOT NULL THEN
      -- Get phone with lock
      SELECT id, status, model
      INTO v_phone
      FROM phones
      WHERE id = v_item.phone_id
      FOR UPDATE;

      IF FOUND AND v_phone.status = 'sold' THEN
        -- Restore phone status to available
        UPDATE phones
        SET status = 'available'
        WHERE id = v_item.phone_id;

        -- Update refund item to mark inventory restored
        UPDATE refund_items
        SET inventory_restored = true
        WHERE refund_id = v_refund_id AND phone_id = v_item.phone_id;

        -- Log the inventory restoration
        INSERT INTO inventory_deduction_logs (
          sale_id,
          phone_id,
          previous_status,
          new_status,
          notes
        ) VALUES (
          v_item.sale_id,
          v_item.phone_id,
          v_phone.status,
          'available',
          format('Inventory restored due to full refund (refund number: %s)', v_refund_number)
        );

        v_items_restored := v_items_restored + 1;
      END IF;
    END IF;

    -- Add to refund items array for response
    v_refund_items := v_refund_items || jsonb_build_object(
      'itemName', v_item.item_name,
      'quantity', v_item.quantity,
      'unitPrice', v_item.unit_price,
      'total', v_item.total,
      'phoneId', v_item.phone_id,
      'inventoryRestored', v_item.phone_id IS NOT NULL AND v_phone.status = 'sold'
    );
  END LOOP;

  -- Return success result
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
    -- Transaction will automatically rollback
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'originalReceiptId', p_receipt_id
    );
END;
$$;

-- ============================================================
-- 8. CREATE FUNCTION TO CHECK IF RECEIPT CAN BE REFUNDED
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
  -- Get receipt with items
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

  -- Check for existing refunds
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

  -- Build items list
  FOR v_item IN
    SELECT ri.*,
           s.phone_id,
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
      'canRestoreInventory', v_item.phone_id IS NOT NULL AND v_item.phone_status = 'sold'
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
-- 9. CREATE FUNCTION TO GET REFUND BY RECEIPT
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
  -- Get refund for receipt
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

  -- Get refund items
  FOR v_item IN
    SELECT ri.*,
           p.model as phone_model,
           b.name as brand_name
    FROM refund_items ri
    LEFT JOIN phones p ON ri.phone_id = p.id
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE ri.refund_id = v_refund.id
  LOOP
    v_items := v_items || jsonb_build_object(
      'id', v_item.id,
      'originalSaleId', v_item.original_sale_id,
      'phoneId', v_item.phone_id,
      'itemName', v_item.item_name,
      'quantity', v_item.quantity,
      'unitPrice', v_item.unit_price,
      'total', v_item.total,
      'inventoryRestored', v_item.inventory_restored,
      'phoneModel', v_item.phone_model,
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
-- 10. GRANT EXECUTE PERMISSIONS
-- ============================================================

GRANT EXECUTE ON FUNCTION generate_refund_number TO authenticated;
GRANT EXECUTE ON FUNCTION process_full_refund TO authenticated;
GRANT EXECUTE ON FUNCTION check_receipt_refundable TO authenticated;
GRANT EXECUTE ON FUNCTION get_refund_by_receipt TO authenticated;
