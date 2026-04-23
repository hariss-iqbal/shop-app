-- Model-level catalog grouping RPC
-- Returns one row per model with aggregated info for the catalog page

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
  model_id UUID,
  model_name TEXT,
  brand_id UUID,
  brand_name TEXT,
  min_price NUMERIC,
  max_price NUMERIC,
  available_colors TEXT[],
  storage_options INTEGER[],
  stock_count BIGINT,
  primary_image_url TEXT,
  conditions TEXT[],
  newest_created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id AS model_id,
    m.name::text AS model_name,
    b.id AS brand_id,
    b.name::text AS brand_name,
    MIN(p.selling_price) AS min_price,
    MAX(p.selling_price) AS max_price,
    array_agg(DISTINCT p.color::text) FILTER (WHERE p.color IS NOT NULL) AS available_colors,
    array_agg(DISTINCT p.storage_gb) FILTER (WHERE p.storage_gb IS NOT NULL) AS storage_options,
    COUNT(p.id)::BIGINT AS stock_count,
    (SELECT pi.image_url FROM product_images pi
     JOIN products pp ON pp.id = pi.product_id
     WHERE pp.model_id = m.id AND pi.is_primary = true
     LIMIT 1) AS primary_image_url,
    array_agg(DISTINCT p.condition::text) AS conditions,
    MAX(p.created_at) AS newest_created_at
  FROM models m
  JOIN brands b ON m.brand_id = b.id
  JOIN products p ON p.model_id = m.id
  WHERE p.status = 'available'
    AND (p_brand_ids IS NULL OR p.brand_id = ANY(p_brand_ids))
    AND (p_conditions IS NULL OR p.condition::text = ANY(p_conditions))
    AND (p_storage_options IS NULL OR p.storage_gb = ANY(p_storage_options))
    AND (p_min_price IS NULL OR p.selling_price >= p_min_price)
    AND (p_max_price IS NULL OR p.selling_price <= p_max_price)
    AND (p_pta_status IS NULL OR p.pta_status::text = p_pta_status)
    AND (
      p_search IS NULL OR
      m.name ILIKE '%' || p_search || '%' OR
      b.name ILIKE '%' || p_search || '%'
    )
  GROUP BY m.id, m.name, b.id, b.name
  ORDER BY
    CASE WHEN p_sort_field = 'selling_price' AND p_sort_order = 1 THEN MIN(p.selling_price) END ASC,
    CASE WHEN p_sort_field = 'selling_price' AND p_sort_order = -1 THEN MIN(p.selling_price) END DESC,
    CASE WHEN p_sort_field = 'created_at' AND p_sort_order = -1 THEN MAX(p.created_at) END DESC,
    CASE WHEN p_sort_field = 'created_at' AND p_sort_order = 1 THEN MAX(p.created_at) END ASC,
    CASE WHEN p_sort_field = 'model_name' AND p_sort_order = 1 THEN m.name END ASC,
    CASE WHEN p_sort_field = 'model_name' AND p_sort_order = -1 THEN m.name END DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Count function for pagination
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
  SELECT COUNT(DISTINCT m.id) INTO result
  FROM models m
  JOIN products p ON p.model_id = m.id
  WHERE p.status = 'available'
    AND (p_brand_ids IS NULL OR p.brand_id = ANY(p_brand_ids))
    AND (p_conditions IS NULL OR p.condition::text = ANY(p_conditions))
    AND (p_storage_options IS NULL OR p.storage_gb = ANY(p_storage_options))
    AND (p_min_price IS NULL OR p.selling_price >= p_min_price)
    AND (p_max_price IS NULL OR p.selling_price <= p_max_price)
    AND (p_pta_status IS NULL OR p.pta_status::text = p_pta_status)
    AND (
      p_search IS NULL OR
      m.name ILIKE '%' || p_search || '%' OR
      (SELECT b.name FROM brands b WHERE b.id = m.brand_id) ILIKE '%' || p_search || '%'
    );
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get all variants for a specific model (for product detail page)
CREATE OR REPLACE FUNCTION get_model_variants(
  p_model_id UUID
)
RETURNS TABLE (
  id UUID,
  model TEXT,
  storage_gb INTEGER,
  ram_gb INTEGER,
  color TEXT,
  condition TEXT,
  selling_price NUMERIC,
  pta_status TEXT,
  battery_health INTEGER,
  primary_image_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.model::text,
    p.storage_gb,
    p.ram_gb,
    p.color::text,
    p.condition::text,
    p.selling_price,
    p.pta_status::text,
    p.battery_health,
    (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) AS primary_image_url
  FROM products p
  WHERE p.model_id = p_model_id
    AND p.status = 'available'
  ORDER BY p.selling_price ASC;
END;
$$ LANGUAGE plpgsql STABLE;
