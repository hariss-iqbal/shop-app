-- Restrict catalog/inventory writes (models + products) to admins/managers,
-- consistent with the variants/variant_images lock in 20260624000001.
--
-- Safe for POS: cashier sales/refunds/transfers all go through SECURITY DEFINER
-- RPCs (complete_sale_with_inventory_deduction, process_full_refund,
-- revert_sale_restore_inventory, ...) which bypass RLS. Direct products/models
-- writes are admin/manager inventory tasks. SELECT stays open.

-- models --------------------------------------------------------------------
DROP POLICY IF EXISTS models_auth_insert ON public.models;
DROP POLICY IF EXISTS models_auth_update ON public.models;
DROP POLICY IF EXISTS models_auth_delete ON public.models;

CREATE POLICY models_admin_insert ON public.models
  FOR INSERT TO authenticated WITH CHECK (public.is_manager_or_admin());
CREATE POLICY models_admin_update ON public.models
  FOR UPDATE TO authenticated USING (public.is_manager_or_admin()) WITH CHECK (public.is_manager_or_admin());
CREATE POLICY models_admin_delete ON public.models
  FOR DELETE TO authenticated USING (public.is_manager_or_admin());

-- products ------------------------------------------------------------------
DROP POLICY IF EXISTS products_authenticated_insert ON public.products;
DROP POLICY IF EXISTS products_authenticated_update ON public.products;
DROP POLICY IF EXISTS products_authenticated_delete ON public.products;

CREATE POLICY products_admin_insert ON public.products
  FOR INSERT TO authenticated WITH CHECK (public.is_manager_or_admin());
CREATE POLICY products_admin_update ON public.products
  FOR UPDATE TO authenticated USING (public.is_manager_or_admin()) WITH CHECK (public.is_manager_or_admin());
CREATE POLICY products_admin_delete ON public.products
  FOR DELETE TO authenticated USING (public.is_manager_or_admin());
