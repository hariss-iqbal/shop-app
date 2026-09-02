-- Multi-shop foundation:
--  (1) products.location_id  — which of OUR branches a unit physically sits in
--      (one IMEI = one row, so a single FK is the right model for unit stock;
--      the dormant quantity-based location_inventory stays legacy/unused).
--  (2) partner_shops          — EXTERNAL shops we consign ("OUT") devices to.
--      Counterparties, not branches — separate from store_locations. Balance is
--      derived from the OUT ledger, so no stored credit limit/balance.
-- Writes are admin/manager-only, consistent with variants/models/products.

-- (1) products -> shop -------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.store_locations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_products_location ON public.products(location_id);

-- (2) external partner shops -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.partner_shops (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  contact_person text,
  phone          text,
  address        text,
  notes          text,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz
);

ALTER TABLE public.partner_shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS partner_shops_select ON public.partner_shops;
CREATE POLICY partner_shops_select ON public.partner_shops
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS partner_shops_admin_insert ON public.partner_shops;
CREATE POLICY partner_shops_admin_insert ON public.partner_shops
  FOR INSERT TO authenticated WITH CHECK (public.is_manager_or_admin());
DROP POLICY IF EXISTS partner_shops_admin_update ON public.partner_shops;
CREATE POLICY partner_shops_admin_update ON public.partner_shops
  FOR UPDATE TO authenticated USING (public.is_manager_or_admin()) WITH CHECK (public.is_manager_or_admin());
DROP POLICY IF EXISTS partner_shops_admin_delete ON public.partner_shops;
CREATE POLICY partner_shops_admin_delete ON public.partner_shops
  FOR DELETE TO authenticated USING (public.is_manager_or_admin());

DROP TRIGGER IF EXISTS trg_partner_shops_updated_at ON public.partner_shops;
CREATE TRIGGER trg_partner_shops_updated_at BEFORE UPDATE ON public.partner_shops
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
