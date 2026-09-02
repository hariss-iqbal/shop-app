-- Per-color activation. A variant can have several colors (available_colors);
-- previously only the whole variant could be toggled (is_active), so you could
-- not hide just one color. inactive_colors holds the colors that are switched
-- off — the catalog skips them, while the variant's other colors stay live.

ALTER TABLE public.variants
  ADD COLUMN IF NOT EXISTS inactive_colors text[] NOT NULL DEFAULT '{}';

-- Catalog: drop cards for colors that are switched off for the variant.
CREATE OR REPLACE FUNCTION public.get_model_catalog(
  p_brand_ids uuid[] DEFAULT NULL::uuid[], p_conditions text[] DEFAULT NULL::text[],
  p_storage_options integer[] DEFAULT NULL::integer[], p_min_price numeric DEFAULT NULL::numeric,
  p_max_price numeric DEFAULT NULL::numeric, p_search text DEFAULT NULL::text,
  p_pta_status text DEFAULT NULL::text, p_sort_field text DEFAULT 'created_at'::text,
  p_sort_order integer DEFAULT '-1'::integer, p_limit integer DEFAULT 12, p_offset integer DEFAULT 0)
  RETURNS TABLE(variant_id uuid, model_id uuid, model_name text, brand_id uuid, brand_name text,
    storage_gb integer, pta_status text, condition text, is_box_available boolean, color text,
    selling_price numeric, avg_cost_price numeric, stock_count integer, primary_image_url text,
    image_urls text[], slug text, newest_created_at timestamp with time zone)
  LANGUAGE plpgsql STABLE AS $function$
BEGIN
  RETURN QUERY
  SELECT
    v.id AS variant_id, m.id AS model_id, m.name::text AS model_name,
    b.id AS brand_id, b.name::text AS brand_name,
    v.storage_gb, v.pta_status::text, v.condition::text,
    EXISTS (
      SELECT 1 FROM products pb
      WHERE pb.variant_id = v.id AND pb.status = 'available'
        AND pb.color = pc.color AND pb.is_box_available = true
    ) AS is_box_available,
    pc.color::text, v.selling_price, v.avg_cost_price, v.stock_count,
    (color_imgs.urls)[1] AS primary_image_url,
    COALESCE(color_imgs.urls, ARRAY[]::text[]) AS image_urls,
    v.slug, v.created_at AS newest_created_at
  FROM variants v
  JOIN models m ON v.model_id = m.id
  JOIN brands b ON m.brand_id = b.id
  JOIN LATERAL (
    SELECT DISTINCT p.color FROM products p
    WHERE p.variant_id = v.id AND p.status = 'available' AND p.color IS NOT NULL
      -- skip colors switched off for this variant
      AND NOT (lower(p.color) = ANY (SELECT lower(c) FROM unnest(v.inactive_colors) c))
  ) pc ON true
  LEFT JOIN LATERAL (
    SELECT array_agg(vi.image_url ORDER BY vi.is_primary DESC, vi.display_order ASC) AS urls
    FROM variant_images vi
    WHERE vi.variant_id = v.id AND vi.color IS NOT NULL AND lower(vi.color) = lower(pc.color)
  ) color_imgs ON true
  WHERE v.is_active = true
    AND v.slug IS NOT NULL
    AND (p_brand_ids IS NULL OR b.id = ANY(p_brand_ids))
    AND (p_conditions IS NULL OR v.condition::text = ANY(p_conditions))
    AND (p_storage_options IS NULL OR v.storage_gb = ANY(p_storage_options))
    AND (p_min_price IS NULL OR v.selling_price >= p_min_price)
    AND (p_max_price IS NULL OR v.selling_price <= p_max_price)
    AND (p_pta_status IS NULL OR v.pta_status IS NOT DISTINCT FROM p_pta_status)
    AND (p_search IS NULL OR m.name ILIKE '%' || p_search || '%' OR b.name ILIKE '%' || p_search || '%')
  ORDER BY
    CASE WHEN p_sort_field = 'selling_price' AND p_sort_order = 1 THEN v.selling_price END ASC,
    CASE WHEN p_sort_field = 'selling_price' AND p_sort_order = -1 THEN v.selling_price END DESC,
    CASE WHEN p_sort_field = 'created_at' AND p_sort_order = -1 THEN v.created_at END DESC,
    CASE WHEN p_sort_field = 'created_at' AND p_sort_order = 1 THEN v.created_at END ASC,
    CASE WHEN p_sort_field = 'model_name' AND p_sort_order = 1 THEN m.name END ASC,
    CASE WHEN p_sort_field = 'model_name' AND p_sort_order = -1 THEN m.name END DESC
  LIMIT p_limit OFFSET p_offset;
END;
$function$;

-- Variant detail: expose inactive_colors so the app can show per-color toggles.
CREATE OR REPLACE FUNCTION public.get_variant_detail(p_variant_id uuid)
  RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $function$
DECLARE v_variant RECORD; v_images JSONB;
BEGIN
  SELECT
    v.id, v.model_id, v.storage_gb, v.pta_status, v.condition,
    v.selling_price, v.avg_cost_price, v.stock_count, v.available_colors, v.inactive_colors,
    v.is_active, v.slug, v.created_at, v.updated_at,
    m.name as model_name, b.id as brand_id, b.name as brand_name
  INTO v_variant
  FROM variants v JOIN models m ON v.model_id = m.id JOIN brands b ON m.brand_id = b.id
  WHERE v.id = p_variant_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('found', false); END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', vi.id, 'imageUrl', vi.image_url, 'isPrimary', vi.is_primary,
    'displayOrder', vi.display_order, 'color', vi.color
  ) ORDER BY vi.is_primary DESC, vi.display_order ASC), '[]'::jsonb)
  INTO v_images FROM variant_images vi WHERE vi.variant_id = p_variant_id;

  RETURN jsonb_build_object(
    'found', true,
    'variant', jsonb_build_object(
      'id', v_variant.id, 'modelId', v_variant.model_id, 'modelName', v_variant.model_name,
      'brandId', v_variant.brand_id, 'brandName', v_variant.brand_name,
      'storageGb', v_variant.storage_gb, 'ptaStatus', v_variant.pta_status,
      'condition', v_variant.condition, 'sellingPrice', v_variant.selling_price,
      'avgCostPrice', v_variant.avg_cost_price, 'stockCount', v_variant.stock_count,
      'availableColors', v_variant.available_colors,
      'inactiveColors', v_variant.inactive_colors,
      'isActive', v_variant.is_active,
      'primaryImageUrl', (SELECT vi.image_url FROM variant_images vi WHERE vi.variant_id = v_variant.id AND vi.is_primary = true LIMIT 1),
      'slug', v_variant.slug, 'createdAt', v_variant.created_at, 'updatedAt', v_variant.updated_at
    ),
    'images', v_images
  );
END;
$function$;
