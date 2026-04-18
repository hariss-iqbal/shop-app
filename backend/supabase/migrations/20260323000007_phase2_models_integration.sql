-- Phase 2: Models integration
-- 1a. Update search_available_products to include model_id/model_name from models table
-- 1b. Fix sanitize_product trigger (remove model sanitization since model is now via FK)
-- 1c. Fix get_customer_purchase_history (phones -> products, use canonical model name)

-- ============================================================
-- 1a. UPDATE search_available_products
-- ============================================================

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
  model_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  search_terms TEXT[];
BEGIN
  -- Split query into individual terms
  search_terms := string_to_array(lower(trim(search_query)), ' ');

  -- Remove empty strings
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
    m.name::TEXT AS model_name
  FROM products p
  LEFT JOIN brands b ON p.brand_id = b.id
  LEFT JOIN models m ON p.model_id = m.id
  WHERE p.status = 'available'
    AND (
      SELECT bool_and(
        lower(
          coalesce(b.name, '') || ' ' ||
          coalesce(m.name, '') || ' ' ||
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

-- ============================================================
-- 1b. FIX sanitize_product TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION sanitize_product()
RETURNS TRIGGER AS $$
BEGIN
  NEW.description := strip_html_tags(NEW.description);
  NEW.color := strip_html_tags(NEW.color);
  NEW.notes := strip_html_tags(NEW.notes);
  -- Sanitize accessory fields
  NEW.accessory_category := strip_html_tags(NEW.accessory_category);
  NEW.material := strip_html_tags(NEW.material);
  NEW.dimensions := strip_html_tags(NEW.dimensions);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1c. FIX get_customer_purchase_history
-- ============================================================

DROP FUNCTION IF EXISTS get_customer_purchase_history(UUID);

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
      'productId', s.product_id,
      'saleDate', s.sale_date,
      'salePrice', s.sale_price,
      'productName', COALESCE(m.name, p.model),
      'brandName', b.name
    ) ORDER BY s.sale_date DESC
  ) INTO v_sales
  FROM sales s
  LEFT JOIN products p ON s.product_id = p.id
  LEFT JOIN brands b ON p.brand_id = b.id
  LEFT JOIN models m ON p.model_id = m.id
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
