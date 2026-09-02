-- Option A "Move color": reclassify one color's units from its current variant
-- (config = model+storage+pta+condition) into a different config, creating the
-- target config if it doesn't exist. The other colors of the source config are
-- untouched. Stock counts recompute automatically via trg_products_variant_stats
-- (it recalculates BOTH old and new variant when a product's variant_id changes).
--
-- This is the honest way to change PTA/storage/condition "for one color only":
-- the four attributes define the config, so moving the units is the correct
-- semantic rather than silently editing the shared config.

CREATE OR REPLACE FUNCTION public.move_variant_color(
  p_variant_id uuid,
  p_color text,
  p_target_storage_gb integer,
  p_target_pta text,          -- 'pta_approved' | 'non_pta' | NULL/'' (none)
  p_target_condition text     -- 'new' | 'used' | 'refurbished' | 'open_box'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $function$
DECLARE
  v_src RECORD;
  v_target_id uuid;
  v_moved integer := 0;
  v_norm_color text;
  v_pta text;
BEGIN
  -- Admin/manager only (matches the RLS lock; SECURITY DEFINER bypasses RLS).
  IF NOT public.is_manager_or_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_src FROM public.variants WHERE id = p_variant_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Source variant not found');
  END IF;

  v_norm_color := lower(trim(p_color));
  v_pta := NULLIF(trim(COALESCE(p_target_pta, '')), '');

  -- Find the target config, or create it (same model, chosen storage/pta/condition).
  SELECT id INTO v_target_id
  FROM public.variants
  WHERE model_id = v_src.model_id
    AND storage_gb IS NOT DISTINCT FROM p_target_storage_gb
    AND pta_status IS NOT DISTINCT FROM v_pta
    AND condition = p_target_condition::product_condition;

  IF v_target_id = p_variant_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Target config is identical to the current one');
  END IF;

  IF v_target_id IS NULL THEN
    INSERT INTO public.variants
      (model_id, storage_gb, pta_status, condition, selling_price, is_active, available_colors)
    VALUES
      (v_src.model_id, p_target_storage_gb, v_pta, p_target_condition::product_condition,
       v_src.selling_price, true, ARRAY[]::text[])
    RETURNING id INTO v_target_id;
  END IF;

  -- Reassign this color's units to the target config (trigger fixes stock counts).
  UPDATE public.products
     SET variant_id = v_target_id,
         storage_gb = p_target_storage_gb,
         pta_status = CASE WHEN v_pta IS NULL THEN NULL ELSE v_pta::pta_status END,
         condition  = p_target_condition::product_condition
   WHERE variant_id = p_variant_id
     AND lower(color) = v_norm_color;
  GET DIAGNOSTICS v_moved = ROW_COUNT;

  -- Drop the color from the source config's color lists.
  UPDATE public.variants
     SET available_colors = (
           SELECT COALESCE(array_agg(c), ARRAY[]::text[])
           FROM unnest(available_colors) c WHERE lower(c) <> v_norm_color),
         inactive_colors = (
           SELECT COALESCE(array_agg(c), ARRAY[]::text[])
           FROM unnest(inactive_colors) c WHERE lower(c) <> v_norm_color)
   WHERE id = p_variant_id;

  -- Add the color to the target config if it isn't already listed.
  UPDATE public.variants
     SET available_colors = CASE
           WHEN EXISTS (SELECT 1 FROM unnest(available_colors) c WHERE lower(c) = v_norm_color)
             THEN available_colors
           ELSE array_append(available_colors, trim(p_color))
         END
   WHERE id = v_target_id;

  RETURN jsonb_build_object(
    'success', true,
    'targetVariantId', v_target_id,
    'moved', v_moved
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.move_variant_color(uuid, text, integer, text, text) TO authenticated;
