-- Migration: Catalog images are strictly color-specific (no cross-color fallback)
--
-- Before: get_model_catalog resolved a card's image as
--   COALESCE(this-color images, generic[NULL-color] images, ANY image of the variant)
-- so a color with no image of its own borrowed another color's photo
-- (e.g. Pixel 10 Pro XL "Moonstone" showed the "Jade" image).
--
-- After: a card shows ONLY images whose color matches the card's color.
--   The only remaining fallback is WITHIN a color: if no image is marked
--   is_primary, the first image of that color (by display_order) is used as
--   primary. If a color has no images at all, primary_image_url is NULL and
--   image_urls is empty (frontend shows its placeholder) — it never borrows
--   another color's photo, and generic (no-color) images are not used either.

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
  image_urls TEXT[],
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
    -- Strictly this color's images: primary first, else first by display_order.
    (color_imgs.urls)[1] AS primary_image_url,
    COALESCE(color_imgs.urls, ARRAY[]::text[]) AS image_urls,
    v.slug,
    v.created_at AS newest_created_at
  FROM variants v
  JOIN models m ON v.model_id = m.id
  JOIN brands b ON m.brand_id = b.id
  JOIN LATERAL (
    SELECT DISTINCT p.color FROM products p
    WHERE p.variant_id = v.id AND p.status = 'available' AND p.color IS NOT NULL
  ) pc ON true
  -- Only images whose color matches this card's color (primary first, then order).
  LEFT JOIN LATERAL (
    SELECT array_agg(vi.image_url ORDER BY vi.is_primary DESC, vi.display_order ASC) AS urls
    FROM variant_images vi
    WHERE vi.variant_id = v.id
      AND vi.color IS NOT NULL
      AND lower(vi.color) = lower(pc.color)
  ) color_imgs ON true
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
