-- Migration: Partial Payment & Balance Tracking
-- Allows partial payments on sales, tracks outstanding balance,
-- supports follow-up payments to clear the balance.

-- ============================================================
-- 1. CREATE payment_status_type ENUM
-- ============================================================

DO $$ BEGIN
  CREATE TYPE payment_status_type AS ENUM ('paid', 'partial_paid');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. ADD COLUMNS TO sales TABLE
-- ============================================================

ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS balance DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status payment_status_type DEFAULT 'paid',
  ADD COLUMN IF NOT EXISTS batch_id UUID;

-- Index for batch queries and filtering by payment status
CREATE INDEX IF NOT EXISTS idx_sales_batch_id ON sales(batch_id);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status);

-- ============================================================
-- 3. CREATE follow_up_payments TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS follow_up_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL DEFAULT 'cash',
  payment_summary JSONB DEFAULT '[]'::JSONB,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_follow_up_payments_batch_id ON follow_up_payments(batch_id);

-- RLS for follow_up_payments
ALTER TABLE follow_up_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read follow_up_payments"
  ON follow_up_payments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert follow_up_payments"
  ON follow_up_payments FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- 4. UPDATE complete_sale_with_inventory_deduction RPC
--    Drop old signature first, then create with new params
-- ============================================================

DROP FUNCTION IF EXISTS complete_sale_with_inventory_deduction(UUID, DATE, NUMERIC, TEXT, TEXT, TEXT, TEXT, UUID);

CREATE OR REPLACE FUNCTION complete_sale_with_inventory_deduction(
  p_product_id UUID,
  p_sale_date DATE,
  p_sale_price NUMERIC,
  p_buyer_name TEXT DEFAULT NULL,
  p_buyer_phone TEXT DEFAULT NULL,
  p_buyer_email TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_location_id UUID DEFAULT NULL,
  p_batch_id UUID DEFAULT NULL,
  p_balance NUMERIC DEFAULT 0,
  p_payment_status TEXT DEFAULT 'paid'
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
  v_payment_status payment_status_type;
BEGIN
  -- Cast payment status
  v_payment_status := p_payment_status::payment_status_type;

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

    -- Create sale record with partial payment fields
    INSERT INTO sales (
      product_id, sale_date, sale_price, cost_price,
      buyer_name, buyer_phone, buyer_email, notes,
      tax_rate, tax_amount, base_price, is_tax_exempt,
      location_id, created_by,
      batch_id, balance, payment_status
    )
    VALUES (
      p_product_id, p_sale_date, p_sale_price, v_product.cost_price,
      p_buyer_name, p_buyer_phone, p_buyer_email, p_notes,
      COALESCE(v_product.tax_rate, 0), v_tax_amount, v_base_price, v_product.is_tax_exempt,
      p_location_id, auth.uid(),
      p_batch_id, COALESCE(p_balance, 0), v_payment_status
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
    'locationId', p_location_id,
    'batchId', p_batch_id,
    'balance', COALESCE(p_balance, 0),
    'paymentStatus', p_payment_status
  );
END;
$$;

-- ============================================================
-- 5. UPDATE complete_batch_sale_with_inventory_deduction RPC
--    Drop old signature first, then create with new params
-- ============================================================

DROP FUNCTION IF EXISTS complete_batch_sale_with_inventory_deduction(JSONB, DATE, TEXT, TEXT, TEXT, TEXT, UUID);

CREATE OR REPLACE FUNCTION complete_batch_sale_with_inventory_deduction(
  p_items JSONB,
  p_sale_date DATE,
  p_buyer_name TEXT DEFAULT NULL,
  p_buyer_phone TEXT DEFAULT NULL,
  p_buyer_email TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_location_id UUID DEFAULT NULL,
  p_total_paid NUMERIC DEFAULT NULL,
  p_grand_total NUMERIC DEFAULT NULL
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
  v_batch_id UUID;
  v_balance NUMERIC := 0;
  v_payment_status TEXT := 'paid';
  v_calculated_grand_total NUMERIC := 0;
BEGIN
  v_total := jsonb_array_length(p_items);

  -- Generate batch_id for grouping
  v_batch_id := gen_random_uuid();

  -- Calculate grand total from items if not provided
  IF p_grand_total IS NOT NULL THEN
    v_calculated_grand_total := p_grand_total;
  ELSE
    SELECT COALESCE(SUM(("salePrice")::NUMERIC), 0)
    INTO v_calculated_grand_total
    FROM jsonb_to_recordset(p_items) AS x("productId" UUID, "salePrice" NUMERIC);
  END IF;

  -- Calculate balance and payment status
  IF p_total_paid IS NOT NULL AND p_total_paid < v_calculated_grand_total THEN
    v_balance := v_calculated_grand_total - p_total_paid;
    v_payment_status := 'partial_paid';
  ELSE
    v_balance := 0;
    v_payment_status := 'paid';
  END IF;

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
      p_location_id,
      v_batch_id,
      v_balance,
      v_payment_status
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
    'locationId', p_location_id,
    'batchId', v_batch_id,
    'balance', v_balance,
    'paymentStatus', v_payment_status
  );
END;
$$;

-- ============================================================
-- 6. NEW RPC: record_follow_up_payment
--    Takes batch_id + amount, updates balance on all batch sales,
--    inserts into follow_up_payments
-- ============================================================

CREATE OR REPLACE FUNCTION record_follow_up_payment(
  p_batch_id UUID,
  p_amount NUMERIC,
  p_payment_method TEXT DEFAULT 'cash',
  p_payment_summary JSONB DEFAULT '[]'::JSONB,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
  v_new_status payment_status_type;
  v_payment_id UUID;
  v_affected_rows INTEGER;
BEGIN
  -- Get current balance from any sale in the batch
  SELECT balance INTO v_current_balance
  FROM sales
  WHERE batch_id = p_batch_id
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No sales found for this batch'
    );
  END IF;

  IF v_current_balance <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'This batch has no outstanding balance'
    );
  END IF;

  IF p_amount <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Payment amount must be greater than zero'
    );
  END IF;

  -- Calculate new balance (don't go below 0)
  v_new_balance := GREATEST(v_current_balance - p_amount, 0);

  -- Determine new payment status
  IF v_new_balance <= 0 THEN
    v_new_status := 'paid';
  ELSE
    v_new_status := 'partial_paid';
  END IF;

  -- Update all sales in the batch
  UPDATE sales
  SET balance = v_new_balance,
      payment_status = v_new_status,
      updated_at = NOW()
  WHERE batch_id = p_batch_id;

  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;

  -- Record the follow-up payment
  INSERT INTO follow_up_payments (
    batch_id, amount, payment_method, payment_summary, notes, created_by
  )
  VALUES (
    p_batch_id, p_amount, p_payment_method, p_payment_summary, p_notes, auth.uid()
  )
  RETURNING id INTO v_payment_id;

  RETURN jsonb_build_object(
    'success', true,
    'paymentId', v_payment_id,
    'batchId', p_batch_id,
    'amountPaid', p_amount,
    'previousBalance', v_current_balance,
    'newBalance', v_new_balance,
    'paymentStatus', v_new_status::TEXT,
    'salesUpdated', v_affected_rows
  );
END;
$$;

-- ============================================================
-- 7. NEW RPC: get_batch_payment_history
--    Returns batch summary with follow-up payment history
-- ============================================================

CREATE OR REPLACE FUNCTION get_batch_payment_history(
  p_batch_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_batch_info RECORD;
  v_follow_ups JSONB;
  v_sales JSONB;
  v_total_paid_followups NUMERIC;
BEGIN
  -- Get batch summary from the first sale
  SELECT
    batch_id,
    balance,
    payment_status::TEXT as payment_status,
    buyer_name,
    buyer_phone,
    sale_date
  INTO v_batch_info
  FROM sales
  WHERE batch_id = p_batch_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Batch not found'
    );
  END IF;

  -- Get all sales in the batch
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'saleId', s.id,
    'productName', p.model,
    'brandName', b.name,
    'salePrice', s.sale_price
  )), '[]'::JSONB)
  INTO v_sales
  FROM sales s
  LEFT JOIN products p ON s.product_id = p.id
  LEFT JOIN brands b ON p.brand_id = b.id
  WHERE s.batch_id = p_batch_id;

  -- Get grand total
  DECLARE
    v_grand_total NUMERIC;
  BEGIN
    SELECT COALESCE(SUM(sale_price), 0)
    INTO v_grand_total
    FROM sales
    WHERE batch_id = p_batch_id;

    -- Get follow-up payments
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', fp.id,
      'amount', fp.amount,
      'paymentMethod', fp.payment_method,
      'paymentSummary', fp.payment_summary,
      'notes', fp.notes,
      'createdAt', fp.created_at
    ) ORDER BY fp.created_at ASC), '[]'::JSONB)
    INTO v_follow_ups
    FROM follow_up_payments fp
    WHERE fp.batch_id = p_batch_id;

    -- Calculate total follow-up payments
    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_paid_followups
    FROM follow_up_payments
    WHERE batch_id = p_batch_id;

    RETURN jsonb_build_object(
      'success', true,
      'batchId', p_batch_id,
      'grandTotal', v_grand_total,
      'currentBalance', v_batch_info.balance,
      'paymentStatus', v_batch_info.payment_status,
      'totalFollowUpPayments', v_total_paid_followups,
      'initialPayment', v_grand_total - v_batch_info.balance - v_total_paid_followups,
      'buyerName', v_batch_info.buyer_name,
      'buyerPhone', v_batch_info.buyer_phone,
      'saleDate', v_batch_info.sale_date,
      'sales', v_sales,
      'followUpPayments', v_follow_ups
    );
  END;
END;
$$;

-- ============================================================
-- 8. GRANT PERMISSIONS
-- ============================================================

GRANT EXECUTE ON FUNCTION complete_sale_with_inventory_deduction(UUID, DATE, NUMERIC, TEXT, TEXT, TEXT, TEXT, UUID, UUID, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_batch_sale_with_inventory_deduction(JSONB, DATE, TEXT, TEXT, TEXT, TEXT, UUID, NUMERIC, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION record_follow_up_payment(UUID, NUMERIC, TEXT, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_batch_payment_history(UUID) TO authenticated;
