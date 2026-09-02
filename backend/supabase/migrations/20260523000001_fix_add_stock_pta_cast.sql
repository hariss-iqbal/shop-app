-- ============================================================
-- Fix: add_stock RPC failed for every call because it inserted
-- variants.pta_status (TEXT) into products.pta_status (enum pta_status)
-- without a cast:
--   ERROR: column "pta_status" is of type pta_status but expression is of type text
-- This broke the "Add stock to existing variant" flow entirely.
-- Fix: cast v_variant.pta_status::pta_status in the INSERT.
-- (Function body otherwise identical to 20260422000001_variants_table.sql.)
-- ============================================================

CREATE OR REPLACE FUNCTION add_stock(
  p_variant_id UUID,
  p_color TEXT,
  p_cost_price NUMERIC,
  p_quantity INTEGER DEFAULT 1,
  p_supplier_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_purchase_date DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_variant RECORD;
  v_created_ids UUID[] := '{}';
  v_i INTEGER;
  v_product_id UUID;
BEGIN
  SELECT v.*, m.name as model_name, m.brand_id
  INTO v_variant
  FROM variants v JOIN models m ON v.model_id = m.id
  WHERE v.id = p_variant_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Variant not found');
  END IF;

  FOR v_i IN 1..p_quantity LOOP
    INSERT INTO products (
      brand_id, model, model_id, storage_gb, condition,
      pta_status, color, cost_price, selling_price,
      status, supplier_id, notes, purchase_date,
      product_type, variant_id
    ) VALUES (
      v_variant.brand_id,
      v_variant.model_name,
      v_variant.model_id,
      v_variant.storage_gb,
      v_variant.condition,
      v_variant.pta_status::pta_status,   -- FIX: cast TEXT -> enum
      p_color,
      p_cost_price,
      v_variant.selling_price,
      'available',
      p_supplier_id,
      p_notes,
      p_purchase_date,
      'phone',
      p_variant_id
    )
    RETURNING id INTO v_product_id;

    v_created_ids := array_append(v_created_ids, v_product_id);
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'variantId', p_variant_id,
    'productsCreated', p_quantity,
    'productIds', v_created_ids
  );
END;
$$;

GRANT EXECUTE ON FUNCTION add_stock TO authenticated;
