-- Search available products with multi-term matching across brand, model, storage, color, and IMEI
-- Each search term must match somewhere in the combined searchable text

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
  brand_logo_url TEXT
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
    b.logo_url AS brand_logo_url
  FROM products p
  LEFT JOIN brands b ON p.brand_id = b.id
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
