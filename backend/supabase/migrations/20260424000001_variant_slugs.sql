-- ============================================================
-- Variant Slugs: Clean URLs for product detail pages
-- URL format: /product/{slug}?color={color}
-- Example: /product/samsung-galaxy-s25-ultra-256gb-new-pta-approved?color=titanium-black
-- ============================================================

-- 1. Add slug column
ALTER TABLE variants ADD COLUMN slug TEXT;

-- 1b. Add color column to variant_images
ALTER TABLE variant_images ADD COLUMN color TEXT;

-- 2. Helper function to generate the base slug from variant attributes
-- Pure string manipulation — no table queries. Collision handling is done by the trigger.
CREATE OR REPLACE FUNCTION generate_variant_slug(
  p_brand_name TEXT,
  p_model_name TEXT,
  p_storage_gb INTEGER,
  p_condition TEXT,
  p_pta_status TEXT
) RETURNS TEXT AS $$
DECLARE
  v_parts TEXT[];
  v_base TEXT;
BEGIN
  IF p_brand_name IS NOT NULL THEN
    v_parts := array_append(v_parts, lower(regexp_replace(p_brand_name, '[^a-z0-9]+', '-', 'gi')));
  END IF;
  IF p_model_name IS NOT NULL THEN
    v_parts := array_append(v_parts, lower(regexp_replace(p_model_name, '[^a-z0-9]+', '-', 'gi')));
  END IF;
  IF p_storage_gb IS NOT NULL THEN
    v_parts := array_append(v_parts, p_storage_gb || 'gb');
  END IF;
  IF p_condition IS NOT NULL THEN
    v_parts := array_append(v_parts, lower(regexp_replace(p_condition, '[^a-z0-9]+', '-', 'gi')));
  END IF;
  IF p_pta_status IS NOT NULL THEN
    v_parts := array_append(v_parts, lower(regexp_replace(p_pta_status, '[^a-z0-9]+', '-', 'gi')));
  END IF;

  v_base := trim(both '-' from array_to_string(v_parts, '-'));
  v_base := regexp_replace(v_base, '-+', '-', 'g');

  RETURN v_base;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Backfill slugs for all existing variants
-- Use a CTE with row_number to handle any collisions by appending a suffix
WITH generated AS (
  SELECT
    v2.id,
    generate_variant_slug(b.name, m.name, v2.storage_gb, v2.condition::text, v2.pta_status) AS base_slug,
    ROW_NUMBER() OVER (PARTITION BY generate_variant_slug(b.name, m.name, v2.storage_gb, v2.condition::text, v2.pta_status) ORDER BY v2.created_at) AS rn
  FROM variants v2
  JOIN models m ON v2.model_id = m.id
  JOIN brands b ON m.brand_id = b.id
)
UPDATE variants v
SET slug = CASE
    WHEN g.rn = 1 THEN g.base_slug
    ELSE g.base_slug || '-' || g.rn
  END
FROM generated g
WHERE v.id = g.id;

-- 4. Unique constraint on slug
CREATE UNIQUE INDEX variants_slug_unique ON variants (slug) WHERE slug IS NOT NULL;

-- 5. Trigger to auto-generate slug on INSERT and UPDATE
CREATE OR REPLACE FUNCTION trg_fn_variants_auto_slug()
RETURNS TRIGGER AS $$
DECLARE
  v_brand_name TEXT;
  v_model_name TEXT;
  v_base TEXT;
  v_slug TEXT;
  v_counter INTEGER := 1;
BEGIN
  -- On INSERT: always generate if slug is null
  -- On UPDATE: regenerate if any slug-defining column changed
  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NOT NULL THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.model_id IS NOT DISTINCT FROM OLD.model_id
      AND NEW.storage_gb IS NOT DISTINCT FROM OLD.storage_gb
      AND NEW.condition IS NOT DISTINCT FROM OLD.condition
      AND NEW.pta_status IS NOT DISTINCT FROM OLD.pta_status
    THEN
      RETURN NEW;
    END IF;
  END IF;

  SELECT b.name, m.name INTO v_brand_name, v_model_name
  FROM models m
  JOIN brands b ON m.brand_id = b.id
  WHERE m.id = NEW.model_id;

  v_base := generate_variant_slug(
    v_brand_name,
    v_model_name,
    NEW.storage_gb,
    NEW.condition::text,
    NEW.pta_status
  );

  v_slug := v_base;
  WHILE EXISTS (SELECT 1 FROM variants WHERE slug = v_slug AND id IS DISTINCT FROM NEW.id) LOOP
    v_counter := v_counter + 1;
    v_slug := v_base || '-' || v_counter;
  END LOOP;

  NEW.slug := v_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_variants_auto_slug
  BEFORE INSERT OR UPDATE OF model_id, storage_gb, condition, pta_status ON variants
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_variants_auto_slug();

-- 6. Update get_model_catalog to return one row per variant+color
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
    v.primary_image_url,
    v.slug,
    v.created_at AS newest_created_at
  FROM variants v
  JOIN models m ON v.model_id = m.id
  JOIN brands b ON m.brand_id = b.id
  JOIN LATERAL (
    SELECT DISTINCT p.color FROM products p
    WHERE p.variant_id = v.id AND p.status = 'available' AND p.color IS NOT NULL
  ) pc ON true
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

-- 6b. Update get_model_catalog_count to match (one row per variant+color)
DROP FUNCTION IF EXISTS get_model_catalog_count(uuid[],text[],integer[],numeric,numeric,text,text);
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
  JOIN LATERAL (
    SELECT DISTINCT p.color FROM products p
    WHERE p.variant_id = v.id AND p.status = 'available' AND p.color IS NOT NULL
  ) pc ON true
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

-- 7. New RPC: get_variant_by_slug
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
    'displayOrder', vi.display_order
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

-- 8. Update get_variant_detail to return slug
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
      'slug', v_variant.slug,
      'createdAt', v_variant.created_at,
      'updatedAt', v_variant.updated_at
    ),
    'images', v_images
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_variant_detail TO authenticated;

-- 9. Update get_model_variants to return slug
DROP FUNCTION IF EXISTS get_model_variants(uuid);
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
  primary_image_url TEXT,
  slug TEXT
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
    v.primary_image_url,
    v.slug
  FROM variants v
  WHERE v.model_id = p_model_id
    AND v.is_active = true
  ORDER BY v.selling_price ASC;
END;
$$ LANGUAGE plpgsql STABLE;
