-- Migration: Variant-level catalog grouping
-- Groups products by (model_id, storage_gb, color, pta_status, condition)
-- Each group = one catalog card. A change in any of those 5 attributes creates a separate card.

-- ============================================================
-- 1. Replace get_model_catalog with variant-level grouping
-- ============================================================

DROP FUNCTION IF EXISTS get_model_catalog;

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
  storage_gb INTEGER,
  color TEXT,
  pta_status TEXT,
  condition TEXT,
  min_price NUMERIC,
  max_price NUMERIC,
  stock_count BIGINT,
  primary_image_url TEXT,
  newest_created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH variant_groups AS (
    SELECT
      m.id AS model_id,
      m.name AS model_name,
      b.id AS brand_id,
      b.name AS brand_name,
      p.storage_gb,
      p.color,
      p.pta_status,
      p.condition,
      MIN(p.selling_price) AS min_price,
      MAX(p.selling_price) AS max_price,
      COUNT(p.id)::BIGINT AS stock_count,
      MIN(p.id::text)::uuid AS representative_product_id,
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
    GROUP BY m.id, m.name, b.id, b.name, p.storage_gb, p.color, p.pta_status, p.condition
  )
  SELECT
    vg.model_id,
    vg.model_name::text,
    vg.brand_id,
    vg.brand_name::text,
    vg.storage_gb,
    vg.color::text,
    vg.pta_status::text,
    vg.condition::text,
    vg.min_price,
    vg.max_price,
    vg.stock_count,
    img.image_url AS primary_image_url,
    vg.newest_created_at
  FROM variant_groups vg
  LEFT JOIN LATERAL (
    SELECT pi.image_url FROM product_images pi
    WHERE pi.product_id = vg.representative_product_id AND pi.is_primary = true
    LIMIT 1
  ) img ON true
  ORDER BY
    CASE WHEN p_sort_field = 'selling_price' AND p_sort_order = 1 THEN vg.min_price END ASC,
    CASE WHEN p_sort_field = 'selling_price' AND p_sort_order = -1 THEN vg.min_price END DESC,
    CASE WHEN p_sort_field = 'created_at' AND p_sort_order = -1 THEN vg.newest_created_at END DESC,
    CASE WHEN p_sort_field = 'created_at' AND p_sort_order = 1 THEN vg.newest_created_at END ASC,
    CASE WHEN p_sort_field = 'model_name' AND p_sort_order = 1 THEN vg.model_name END ASC,
    CASE WHEN p_sort_field = 'model_name' AND p_sort_order = -1 THEN vg.model_name END DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- 2. Replace get_model_catalog_count with variant-level counting
-- ============================================================

DROP FUNCTION IF EXISTS get_model_catalog_count;

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
  FROM (
    SELECT 1
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
      )
    GROUP BY m.id, p.storage_gb, p.color, p.pta_status, p.condition
  ) sub;
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;
