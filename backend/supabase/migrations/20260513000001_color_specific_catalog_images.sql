-- Migration: Color-specific catalog images
-- Fixes: catalog cards for same variant but different colors all showing the same image
-- Root cause: get_model_catalog used variants.primary_image_url (single URL per variant)
-- Fix: pick images from variant_images where color matches the catalog card's color

-- ============================================================
-- 1. Update get_model_catalog — color-aware image selection
-- ============================================================

DROP FUNCTION IF EXISTS get_model_catalog;
DROP FUNCTION IF EXISTS get_model_catalog(uuid[],text[],integer[],numeric,numeric,text,text,text,integer,integer,integer);

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
  color TEXT,
  selling_price NUMERIC,
  avg_cost_price NUMERIC,
  stock_count INTEGER,
  primary_image_url TEXT,
  slug TEXT,
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
    pc.color::text,
    v.selling_price,
    v.avg_cost_price,
    v.stock_count,
    COALESCE(color_img.image_url, generic_img.image_url, v.primary_image_url) AS primary_image_url,
    v.slug,
    v.created_at AS newest_created_at
  FROM variants v
  JOIN models m ON v.model_id = m.id
  JOIN brands b ON m.brand_id = b.id
  JOIN LATERAL (
    SELECT DISTINCT p.color FROM products p
    WHERE p.variant_id = v.id AND p.status = 'available' AND p.color IS NOT NULL
  ) pc ON true
  -- Color-specific primary image
  LEFT JOIN LATERAL (
    SELECT vi.image_url FROM variant_images vi
    WHERE vi.variant_id = v.id
      AND vi.color IS NOT NULL
      AND lower(vi.color) = lower(pc.color)
      AND vi.is_primary = true
    LIMIT 1
  ) color_img ON true
  -- Generic (no color) primary image as fallback
  LEFT JOIN LATERAL (
    SELECT vi.image_url FROM variant_images vi
    WHERE vi.variant_id = v.id
      AND vi.color IS NULL
      AND vi.is_primary = true
    LIMIT 1
  ) generic_img ON true
  WHERE v.is_active = true
    AND v.slug IS NOT NULL
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

-- ============================================================
-- 2. Update get_variant_by_slug — return image color field
-- ============================================================

DROP FUNCTION IF EXISTS get_variant_by_slug(TEXT);

CREATE OR REPLACE FUNCTION get_variant_by_slug(
  p_slug TEXT
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
    v.is_active, v.primary_image_url, v.slug, v.created_at, v.updated_at,
    m.name as model_name, b.id as brand_id, b.name as brand_name
  INTO v_variant
  FROM variants v
  JOIN models m ON v.model_id = m.id
  JOIN brands b ON m.brand_id = b.id
  WHERE v.slug = p_slug;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', vi.id,
    'imageUrl', vi.image_url,
    'isPrimary', vi.is_primary,
    'displayOrder', vi.display_order,
    'color', vi.color
  ) ORDER BY vi.is_primary DESC, vi.display_order ASC), '[]'::jsonb)
  INTO v_images
  FROM variant_images vi
  WHERE vi.variant_id = v_variant.id;

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
      'slug', v_variant.slug,
      'createdAt', v_variant.created_at,
      'updatedAt', v_variant.updated_at
    ),
    'images', v_images
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_variant_by_slug TO authenticated;
GRANT EXECUTE ON FUNCTION get_variant_by_slug TO anon;

-- ============================================================
-- 3. Update get_variant_detail — return image color field
-- ============================================================

DROP FUNCTION IF EXISTS get_variant_detail(UUID);

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
    v.is_active, v.primary_image_url, v.slug, v.created_at, v.updated_at,
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
    'displayOrder', vi.display_order,
    'color', vi.color
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
      'slug', v_variant.slug,
      'createdAt', v_variant.created_at,
      'updatedAt', v_variant.updated_at
    ),
    'images', v_images
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_variant_detail TO authenticated;
