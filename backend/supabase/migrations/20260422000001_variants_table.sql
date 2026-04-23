-- Migration: Variants table
-- Introduces variant-level pricing and aggregation for phones.
-- One variant per (model_id, storage_gb, pta_status, condition) — no color.
-- Selling price set once per variant. Auto-calculated avg_cost_price, stock_count, available_colors.

-- ============================================================
-- 1. CREATE variants TABLE
-- ============================================================

CREATE TABLE variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  storage_gb INTEGER,
  pta_status TEXT,
  condition product_condition NOT NULL,
  selling_price DECIMAL NOT NULL DEFAULT 0,
  avg_cost_price DECIMAL NOT NULL DEFAULT 0,
  stock_count INTEGER NOT NULL DEFAULT 0,
  available_colors TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  primary_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  CONSTRAINT variants_selling_price_nonneg CHECK (selling_price >= 0),
  CONSTRAINT variants_avg_cost_price_nonneg CHECK (avg_cost_price >= 0),
  CONSTRAINT variants_stock_count_nonneg CHECK (stock_count >= 0)
);

-- Unique constraint: one variant per (model, storage, pta, condition)
CREATE UNIQUE INDEX variants_unique_key
  ON variants (model_id, storage_gb, pta_status, condition)
  NULLS NOT DISTINCT;

-- Updated_at trigger
CREATE TRIGGER trg_variants_updated_at
  BEFORE UPDATE ON variants
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Indexes
CREATE INDEX idx_variants_model_id ON variants(model_id);
CREATE INDEX idx_variants_is_active ON variants(is_active);
CREATE INDEX idx_variants_selling_price ON variants(selling_price);
CREATE INDEX idx_variants_model_active ON variants(model_id, is_active);

-- ============================================================
-- 2. CREATE variant_images TABLE
-- ============================================================

CREATE TABLE variant_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT,
  public_id TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_variant_images_variant_id ON variant_images(variant_id);
CREATE INDEX idx_variant_images_variant_primary ON variant_images(variant_id, is_primary) WHERE is_primary = true;

-- Enable RLS
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_images ENABLE ROW LEVEL SECURITY;

-- RLS policies — same pattern as products
CREATE POLICY "variants_anon_select" ON variants
  FOR SELECT TO anon USING (true);
CREATE POLICY "variants_authenticated_select" ON variants
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "variants_authenticated_insert" ON variants
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "variants_authenticated_update" ON variants
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "variants_authenticated_delete" ON variants
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "variant_images_anon_select" ON variant_images
  FOR SELECT TO anon USING (true);
CREATE POLICY "variant_images_authenticated_select" ON variant_images
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "variant_images_authenticated_insert" ON variant_images
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "variant_images_authenticated_update" ON variant_images
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "variant_images_authenticated_delete" ON variant_images
  FOR DELETE TO authenticated USING (true);

-- ============================================================
-- 3. ADD variant_id FK TO products
-- ============================================================

ALTER TABLE products ADD COLUMN variant_id UUID REFERENCES variants(id) ON DELETE SET NULL;
CREATE INDEX idx_products_variant_id ON products(variant_id);

-- ============================================================
-- 4. AUTO-POPULATE variants FROM existing phone products
-- ============================================================

INSERT INTO variants (model_id, storage_gb, pta_status, condition, selling_price, avg_cost_price, stock_count, available_colors, is_active, primary_image_url)
SELECT
  p.model_id,
  p.storage_gb,
  p.pta_status,
  p.condition,
  COALESCE(MAX(p.selling_price), 0),
  COALESCE(AVG(p.cost_price)::DECIMAL, 0),
  COUNT(*)::INTEGER,
  array_agg(DISTINCT p.color) FILTER (WHERE p.color IS NOT NULL),
  true,
  NULL
FROM products p
WHERE p.model_id IS NOT NULL
  AND p.product_type = 'phone'
  AND p.status = 'available'
GROUP BY p.model_id, p.storage_gb, p.pta_status, p.condition;

-- ============================================================
-- 5. BACKFILL variant_id ON products
-- ============================================================

UPDATE products p
SET variant_id = v.id
FROM variants v
WHERE p.model_id IS NOT NULL
  AND p.product_type = 'phone'
  AND p.model_id IS NOT DISTINCT FROM v.model_id
  AND p.storage_gb IS NOT DISTINCT FROM v.storage_gb
  AND p.pta_status::text IS NOT DISTINCT FROM v.pta_status::text
  AND p.condition IS NOT DISTINCT FROM v.condition;

-- ============================================================
-- 6. MIGRATE images TO variant_images
-- ============================================================

-- For each variant, pick images from the first matching product (avoid duplicates)
INSERT INTO variant_images (variant_id, image_url, storage_path, public_id, is_primary, display_order)
SELECT
  v.id,
  pi.image_url,
  pi.storage_path,
  pi.public_id,
  pi.is_primary,
  pi.display_order
FROM variants v
JOIN LATERAL (
  SELECT p.id FROM products p
  WHERE p.variant_id = v.id
  ORDER BY p.created_at ASC
  LIMIT 1
) first_prod ON true
JOIN product_images pi ON pi.product_id = first_prod.id;

-- Set primary_image_url on variants from their primary variant_image
UPDATE variants v
SET primary_image_url = vi.image_url
FROM variant_images vi
WHERE vi.variant_id = v.id AND vi.is_primary = true;

-- ============================================================
-- 7. TRIGGER FOR AUTO-UPDATING variant stats
-- ============================================================

CREATE OR REPLACE FUNCTION recalculate_variant(p_variant_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE variants
  SET
    avg_cost_price = COALESCE((
      SELECT AVG(cost_price)::DECIMAL FROM products
      WHERE variant_id = p_variant_id AND status = 'available'
    ), 0),
    stock_count = COALESCE((
      SELECT COUNT(*)::INTEGER FROM products
      WHERE variant_id = p_variant_id AND status = 'available'
    ), 0),
    available_colors = COALESCE((
      SELECT array_agg(DISTINCT color) FILTER (WHERE color IS NOT NULL)
      FROM products WHERE variant_id = p_variant_id AND status = 'available'
    ), '{}'),
    is_active = EXISTS (
      SELECT 1 FROM products WHERE variant_id = p_variant_id AND status = 'available'
    ),
    updated_at = now()
  WHERE id = p_variant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function: handles INSERT/UPDATE/DELETE on products
CREATE OR REPLACE FUNCTION trg_fn_products_variant_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_old_variant UUID;
  v_new_variant UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_old_variant := OLD.variant_id;
    IF v_old_variant IS NOT NULL THEN
      PERFORM recalculate_variant(v_old_variant);
    END IF;
    RETURN OLD;
  END IF;

  v_old_variant := COALESCE(OLD.variant_id, NULL);
  v_new_variant := COALESCE(NEW.variant_id, NULL);

  IF TG_OP = 'UPDATE' AND v_old_variant IS DISTINCT FROM v_new_variant THEN
    IF v_old_variant IS NOT NULL THEN
      PERFORM recalculate_variant(v_old_variant);
    END IF;
    IF v_new_variant IS NOT NULL THEN
      PERFORM recalculate_variant(v_new_variant);
    END IF;
  ELSE
    IF v_new_variant IS NOT NULL THEN
      PERFORM recalculate_variant(v_new_variant);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: fires after insert or update of key columns
CREATE TRIGGER trg_products_variant_stats
  AFTER INSERT OR UPDATE OF variant_id, status, cost_price, color ON products
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_products_variant_stats();

-- Trigger: fires after delete
CREATE TRIGGER trg_products_variant_stats_delete
  AFTER DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_products_variant_stats();

-- ============================================================
-- 8. REPLACE catalog RPC functions
-- ============================================================

-- Drop existing catalog functions
DROP FUNCTION IF EXISTS get_model_catalog;
DROP FUNCTION IF EXISTS get_model_catalog_count;

-- New get_model_catalog: queries variants table directly
CREATE OR REPLACE FUNCTION get_model_catalog(
  p_brand_ids UUID[] DEFAULT NULL,
  p_conditions TEXT[] DEFAULT NULL,
  p_storage_options INTEGER[] DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_pta_status TEXT DEFAULT NULL,
  p_sort_field TEXT DEFAULT 'created_at',
  p_sort_order INTEGER DEFAULT -1,
  p_limit INTEGER DEFAULT 12,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  variant_id UUID,
  model_id UUID,
  model_name TEXT,
  brand_id UUID,
  brand_name TEXT,
  storage_gb INTEGER,
  pta_status TEXT,
  condition TEXT,
  selling_price NUMERIC,
  avg_cost_price NUMERIC,
  stock_count INTEGER,
  available_colors TEXT[],
  primary_image_url TEXT,
  newest_created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id AS variant_id,
    m.id AS model_id,
    m.name::text AS model_name,
    b.id AS brand_id,
    b.name::text AS brand_name,
    v.storage_gb,
    v.pta_status::text,
    v.condition::text,
    v.selling_price,
    v.avg_cost_price,
    v.stock_count,
    v.available_colors,
    v.primary_image_url,
    v.created_at AS newest_created_at
  FROM variants v
  JOIN models m ON v.model_id = m.id
  JOIN brands b ON m.brand_id = b.id
  WHERE v.is_active = true
    AND (p_brand_ids IS NULL OR b.id = ANY(p_brand_ids))
    AND (p_conditions IS NULL OR v.condition::text = ANY(p_conditions))
    AND (p_storage_options IS NULL OR v.storage_gb = ANY(p_storage_options))
    AND (p_min_price IS NULL OR v.selling_price >= p_min_price)
    AND (p_max_price IS NULL OR v.selling_price <= p_max_price)
    AND (p_pta_status IS NULL OR v.pta_status IS NOT DISTINCT FROM p_pta_status)
    AND (
      p_search IS NULL OR
      m.name ILIKE '%' || p_search || '%' OR
      b.name ILIKE '%' || p_search || '%'
    )
  ORDER BY
    CASE WHEN p_sort_field = 'selling_price' AND p_sort_order = 1 THEN v.selling_price END ASC,
    CASE WHEN p_sort_field = 'selling_price' AND p_sort_order = -1 THEN v.selling_price END DESC,
    CASE WHEN p_sort_field = 'created_at' AND p_sort_order = -1 THEN v.created_at END DESC,
    CASE WHEN p_sort_field = 'created_at' AND p_sort_order = 1 THEN v.created_at END ASC,
    CASE WHEN p_sort_field = 'model_name' AND p_sort_order = 1 THEN m.name END ASC,
    CASE WHEN p_sort_field = 'model_name' AND p_sort_order = -1 THEN m.name END DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- New get_model_catalog_count: counts from variants
CREATE OR REPLACE FUNCTION get_model_catalog_count(
  p_brand_ids UUID[] DEFAULT NULL,
  p_conditions TEXT[] DEFAULT NULL,
  p_storage_options INTEGER[] DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_pta_status TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  result BIGINT;
BEGIN
  SELECT COUNT(*) INTO result
  FROM variants v
  JOIN models m ON v.model_id = m.id
  JOIN brands b ON m.brand_id = b.id
  WHERE v.is_active = true
    AND (p_brand_ids IS NULL OR b.id = ANY(p_brand_ids))
    AND (p_conditions IS NULL OR v.condition::text = ANY(p_conditions))
    AND (p_storage_options IS NULL OR v.storage_gb = ANY(p_storage_options))
    AND (p_min_price IS NULL OR v.selling_price >= p_min_price)
    AND (p_max_price IS NULL OR v.selling_price <= p_max_price)
    AND (p_pta_status IS NULL OR v.pta_status IS NOT DISTINCT FROM p_pta_status)
    AND (
      p_search IS NULL OR
      m.name ILIKE '%' || p_search || '%' OR
      b.name ILIKE '%' || p_search || '%'
    );
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- 9. REPLACE get_model_variants
-- ============================================================

DROP FUNCTION IF EXISTS get_model_variants;

CREATE OR REPLACE FUNCTION get_model_variants(
  p_model_id UUID
)
RETURNS TABLE (
  id UUID,
  storage_gb INTEGER,
  pta_status TEXT,
  condition TEXT,
  selling_price NUMERIC,
  avg_cost_price NUMERIC,
  stock_count INTEGER,
  available_colors TEXT[],
  primary_image_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.storage_gb,
    v.pta_status::text,
    v.condition::text,
    v.selling_price,
    v.avg_cost_price,
    v.stock_count,
    v.available_colors,
    v.primary_image_url
  FROM variants v
  WHERE v.model_id = p_model_id
    AND v.is_active = true
  ORDER BY v.selling_price ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- 10. UPDATE sale RPC functions — add variant info
-- ============================================================

-- Update search_available_products to include variant data
DROP FUNCTION IF EXISTS search_available_products(TEXT, INT);

CREATE OR REPLACE FUNCTION search_available_products(
  search_query TEXT,
  result_limit INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  brand_id UUID,
  model TEXT,
  storage_gb INT,
  color TEXT,
  imei TEXT,
  selling_price NUMERIC,
  cost_price NUMERIC,
  condition TEXT,
  status TEXT,
  tax_rate NUMERIC,
  is_tax_inclusive BOOLEAN,
  is_tax_exempt BOOLEAN,
  product_type TEXT,
  created_at TIMESTAMPTZ,
  brand_name TEXT,
  brand_logo_url TEXT,
  model_id UUID,
  model_name TEXT,
  variant_id UUID,
  variant_selling_price NUMERIC,
  variant_avg_cost_price NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  search_terms TEXT[];
BEGIN
  search_terms := string_to_array(lower(trim(search_query)), ' ');
  search_terms := array_remove(search_terms, '');

  RETURN QUERY
  SELECT
    p.id,
    p.brand_id,
    p.model::TEXT,
    p.storage_gb,
    p.color::TEXT,
    p.imei::TEXT,
    p.selling_price,
    p.cost_price,
    p.condition::TEXT,
    p.status::TEXT,
    p.tax_rate,
    p.is_tax_inclusive,
    p.is_tax_exempt,
    p.product_type::TEXT,
    p.created_at,
    b.name::TEXT AS brand_name,
    b.logo_url AS brand_logo_url,
    p.model_id,
    m.name::TEXT AS model_name,
    v.id AS variant_id,
    v.selling_price AS variant_selling_price,
    v.avg_cost_price AS variant_avg_cost_price
  FROM products p
  LEFT JOIN brands b ON p.brand_id = b.id
  LEFT JOIN models m ON p.model_id = m.id
  LEFT JOIN variants v ON p.variant_id = v.id
  WHERE p.status = 'available'
    AND (
      SELECT bool_and(
        lower(
          coalesce(b.name, '') || ' ' ||
          coalesce(p.model, '') || ' ' ||
          coalesce(p.storage_gb::text, '') || 'gb ' ||
          coalesce(p.color, '') || ' ' ||
          coalesce(p.imei, '')
        ) ~* ('\m' || t)
      )
      FROM unnest(search_terms) AS t
    )
  ORDER BY p.created_at DESC
  LIMIT result_limit;
END;
$$;

-- Update complete_sale_with_inventory_deduction to include floor price warning
DROP FUNCTION IF EXISTS complete_sale_with_inventory_deduction(UUID, DATE, NUMERIC, TEXT, TEXT, TEXT, TEXT, UUID);

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
  v_variant RECORD;
BEGIN
  SELECT id, status, cost_price, tax_rate, is_tax_inclusive, is_tax_exempt, variant_id
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

  IF v_product.status = 'sold' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Product is already sold',
      'productId', p_product_id,
      'previousStatus', v_previous_status
    );
  END IF;

  -- Floor price check: warn if sale_price < variant avg_cost_price
  IF v_product.variant_id IS NOT NULL THEN
    SELECT avg_cost_price, selling_price INTO v_variant
    FROM variants WHERE id = v_product.variant_id;

    IF v_variant.avg_cost_price > 0 AND p_sale_price < v_variant.avg_cost_price THEN
      v_warning := COALESCE(v_warning || '; ', '') ||
        'Sale price (' || p_sale_price || ') is below average cost price (' || v_variant.avg_cost_price || ')';
    END IF;
  END IF;

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
        v_warning := COALESCE(v_warning || '; ', '') || 'Selling from location with zero inventory';
      END IF;
    ELSE
      UPDATE location_inventory
      SET quantity = quantity - 1, updated_at = NOW()
      WHERE product_id = p_product_id AND location_id = p_location_id;
      v_inventory_deducted := TRUE;
    END IF;
  END IF;

  IF v_product.status != 'available' THEN
    v_warning := COALESCE(v_warning || '; ', '') || 'Product was not in available status (was: ' || v_product.status || ')';
  END IF;

  UPDATE products SET status = 'sold', updated_at = NOW() WHERE id = p_product_id;

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

    INSERT INTO sales (
      product_id, sale_date, sale_price, cost_price,
      buyer_name, buyer_phone, buyer_email, notes,
      tax_rate, tax_amount, base_price, is_tax_exempt,
      location_id
    ) VALUES (
      p_product_id, p_sale_date, p_sale_price, v_product.cost_price,
      p_buyer_name, p_buyer_phone, p_buyer_email, p_notes,
      COALESCE(v_product.tax_rate, 0), v_tax_amount, v_base_price, v_product.is_tax_exempt,
      p_location_id
    )
    RETURNING id INTO v_sale_id;
  END;

  INSERT INTO inventory_deduction_logs (
    sale_id, product_id, previous_status, new_status, notes
  ) VALUES (
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

-- Update complete_batch_sale_with_inventory_deduction (floor price warnings)
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
  v_floor_warning TEXT;
  v_variant RECORD;
BEGIN
  v_total := jsonb_array_length(p_items);

  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    "productId" UUID,
    "salePrice" NUMERIC
  )
  LOOP
    -- Check floor price for this item
    v_floor_warning := NULL;
    SELECT v.avg_cost_price INTO v_variant
    FROM products p JOIN variants v ON p.variant_id = v.id
    WHERE p.id = v_item."productId";

    IF v_variant.avg_cost_price > 0 AND v_item."salePrice" < v_variant.avg_cost_price THEN
      v_floor_warning := 'Sale price (' || v_item."salePrice" || ') is below average cost price (' || v_variant.avg_cost_price || ')';
    END IF;

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
      -- Merge floor price warning with other warnings from the single-sale RPC
      IF v_floor_warning IS NOT NULL OR v_result->>'warning' IS NOT NULL THEN
        v_warnings := v_warnings || jsonb_build_array(jsonb_build_object(
          'productId', v_item."productId",
          'warning', CONCAT_WS('; ', v_floor_warning, v_result->>'warning')
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
-- 11. GRANT EXECUTE PERMISSIONS
-- ============================================================

GRANT EXECUTE ON FUNCTION complete_sale_with_inventory_deduction(UUID, DATE, NUMERIC, TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_batch_sale_with_inventory_deduction TO authenticated;
GRANT EXECUTE ON FUNCTION search_available_products TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_variant TO authenticated;

-- ============================================================
-- 12. HELPER: add_stock RPC for streamlined stock addition
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
  v_model RECORD;
  v_brand_id UUID;
  v_created_ids UUID[] := '{}';
  v_i INTEGER;
  v_product_id UUID;
BEGIN
  -- Fetch variant details
  SELECT v.*, m.name as model_name, m.brand_id
  INTO v_variant
  FROM variants v JOIN models m ON v.model_id = m.id
  WHERE v.id = p_variant_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Variant not found');
  END IF;

  -- Create N product rows
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
      v_variant.pta_status,
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

  -- Trigger auto-recalculates variant stats
  RETURN jsonb_build_object(
    'success', true,
    'variantId', p_variant_id,
    'productsCreated', p_quantity,
    'productIds', v_created_ids
  );
END;
$$;

GRANT EXECUTE ON FUNCTION add_stock TO authenticated;

-- ============================================================
-- 13. HELPER: get_variant_detail RPC
-- ============================================================

CREATE OR REPLACE FUNCTION get_variant_detail(
  p_variant_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_variant RECORD;
  v_images JSONB;
BEGIN
  SELECT
    v.id, v.model_id, v.storage_gb, v.pta_status, v.condition,
    v.selling_price, v.avg_cost_price, v.stock_count, v.available_colors,
    v.is_active, v.primary_image_url, v.created_at, v.updated_at,
    m.name as model_name, b.id as brand_id, b.name as brand_name
  INTO v_variant
  FROM variants v
  JOIN models m ON v.model_id = m.id
  JOIN brands b ON m.brand_id = b.id
  WHERE v.id = p_variant_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', vi.id,
    'imageUrl', vi.image_url,
    'isPrimary', vi.is_primary,
    'displayOrder', vi.display_order
  ) ORDER BY vi.is_primary DESC, vi.display_order ASC), '[]'::jsonb)
  INTO v_images
  FROM variant_images vi
  WHERE vi.variant_id = p_variant_id;

  RETURN jsonb_build_object(
    'found', true,
    'variant', jsonb_build_object(
      'id', v_variant.id,
      'modelId', v_variant.model_id,
      'modelName', v_variant.model_name,
      'brandId', v_variant.brand_id,
      'brandName', v_variant.brand_name,
      'storageGb', v_variant.storage_gb,
      'ptaStatus', v_variant.pta_status,
      'condition', v_variant.condition,
      'sellingPrice', v_variant.selling_price,
      'avgCostPrice', v_variant.avg_cost_price,
      'stockCount', v_variant.stock_count,
      'availableColors', v_variant.available_colors,
      'isActive', v_variant.is_active,
      'primaryImageUrl', v_variant.primary_image_url,
      'createdAt', v_variant.created_at,
      'updatedAt', v_variant.updated_at
    ),
    'images', v_images
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_variant_detail TO authenticated;

-- ============================================================
-- 14. HELPER: get_model_variants_for_admin
-- ============================================================

CREATE OR REPLACE FUNCTION get_model_variants_for_admin(
  p_model_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_variants JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', v.id,
    'storageGb', v.storage_gb,
    'ptaStatus', v.pta_status,
    'condition', v.condition,
    'sellingPrice', v.selling_price,
    'avgCostPrice', v.avg_cost_price,
    'stockCount', v.stock_count,
    'availableColors', v.available_colors,
    'isActive', v.is_active,
    'primaryImageUrl', v.primary_image_url
  ) ORDER BY v.selling_price ASC), '[]'::jsonb)
  INTO v_variants
  FROM variants v
  WHERE v.model_id = p_model_id;

  RETURN jsonb_build_object(
    'success', true,
    'variants', v_variants
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_model_variants_for_admin TO authenticated;
