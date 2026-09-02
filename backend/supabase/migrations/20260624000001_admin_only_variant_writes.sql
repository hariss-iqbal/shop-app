-- Restrict catalog writes (variants + variant_images) to admins/managers.
--
-- Previously these tables allowed ANY authenticated user to INSERT/UPDATE/DELETE
-- (policies used USING/WITH CHECK = true), so the mobile/web "admin only" gate
-- was UI-only and bypassable via the REST API. SELECT stays public (anon +
-- authenticated) so the storefront/catalog keeps working.
--
-- is_manager_or_admin() is SECURITY DEFINER and checks user_roles for the
-- current auth.uid(), matching the app's access gate (admin OR manager).

-- variants ------------------------------------------------------------------
DROP POLICY IF EXISTS variants_authenticated_insert ON public.variants;
DROP POLICY IF EXISTS variants_authenticated_update ON public.variants;
DROP POLICY IF EXISTS variants_authenticated_delete ON public.variants;

CREATE POLICY variants_admin_insert ON public.variants
  FOR INSERT TO authenticated
  WITH CHECK (public.is_manager_or_admin());

CREATE POLICY variants_admin_update ON public.variants
  FOR UPDATE TO authenticated
  USING (public.is_manager_or_admin())
  WITH CHECK (public.is_manager_or_admin());

CREATE POLICY variants_admin_delete ON public.variants
  FOR DELETE TO authenticated
  USING (public.is_manager_or_admin());

-- variant_images ------------------------------------------------------------
DROP POLICY IF EXISTS variant_images_authenticated_insert ON public.variant_images;
DROP POLICY IF EXISTS variant_images_authenticated_update ON public.variant_images;
DROP POLICY IF EXISTS variant_images_authenticated_delete ON public.variant_images;

CREATE POLICY variant_images_admin_insert ON public.variant_images
  FOR INSERT TO authenticated
  WITH CHECK (public.is_manager_or_admin());

CREATE POLICY variant_images_admin_update ON public.variant_images
  FOR UPDATE TO authenticated
  USING (public.is_manager_or_admin())
  WITH CHECK (public.is_manager_or_admin());

CREATE POLICY variant_images_admin_delete ON public.variant_images
  FOR DELETE TO authenticated
  USING (public.is_manager_or_admin());
