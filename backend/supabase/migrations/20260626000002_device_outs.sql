-- Device OUT / consignment ledger.
-- A unit handed to a partner shop (external) or our other branch (internal) at
-- an agreed price. It stays ours-but-out until SOLD (they pay) or RETURNED.
-- While out, the product is status='out' so POS can't sell it.

-- New product status so out devices drop out of sellable stock --------------
ALTER TYPE public.product_status ADD VALUE IF NOT EXISTS 'out';

-- Ledger table ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.device_outs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  from_location_id uuid REFERENCES public.store_locations(id),
  destination_kind text NOT NULL CHECK (destination_kind IN ('branch','partner')),
  to_location_id   uuid REFERENCES public.store_locations(id),
  to_partner_id    uuid REFERENCES public.partner_shops(id),
  out_price        numeric NOT NULL DEFAULT 0,
  status           text NOT NULL DEFAULT 'out' CHECK (status IN ('out','sold','returned','cancelled')),
  settled_price    numeric,
  amount_received  numeric NOT NULL DEFAULT 0,
  payment_method   text,
  out_date         timestamptz NOT NULL DEFAULT now(),
  settled_at       timestamptz,
  returned_at      timestamptz,
  notes            text,
  created_by       uuid DEFAULT auth.uid(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz,
  CHECK ( (destination_kind='partner' AND to_partner_id IS NOT NULL)
       OR (destination_kind='branch'  AND to_location_id IS NOT NULL) )
);
CREATE INDEX IF NOT EXISTS idx_device_outs_status ON public.device_outs(status);
CREATE INDEX IF NOT EXISTS idx_device_outs_partner ON public.device_outs(to_partner_id);
CREATE INDEX IF NOT EXISTS idx_device_outs_product ON public.device_outs(product_id);
-- A device can only be OUT once at a time
CREATE UNIQUE INDEX IF NOT EXISTS uq_device_out_active ON public.device_outs(product_id) WHERE status='out';

ALTER TABLE public.device_outs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS device_outs_select ON public.device_outs;
CREATE POLICY device_outs_select ON public.device_outs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS device_outs_admin_write ON public.device_outs;
CREATE POLICY device_outs_admin_write ON public.device_outs FOR ALL TO authenticated
  USING (public.is_manager_or_admin()) WITH CHECK (public.is_manager_or_admin());

DROP TRIGGER IF EXISTS trg_device_outs_updated_at ON public.device_outs;
CREATE TRIGGER trg_device_outs_updated_at BEFORE UPDATE ON public.device_outs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- create_device_out: reserve a device and record the OUT -----------------------
CREATE OR REPLACE FUNCTION public.create_device_out(
  p_product_id uuid, p_destination_kind text, p_out_price numeric,
  p_to_location_id uuid DEFAULT NULL, p_to_partner_id uuid DEFAULT NULL, p_notes text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_product RECORD; v_out_id uuid;
BEGIN
  IF NOT public.is_manager_or_admin() THEN RETURN jsonb_build_object('success',false,'error','Not allowed: admin/manager only'); END IF;
  SELECT * INTO v_product FROM products WHERE id = p_product_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success',false,'error','Product not found'); END IF;
  IF v_product.status <> 'available' THEN
    RETURN jsonb_build_object('success',false,'error','Device is not available (status: '||v_product.status||')');
  END IF;
  IF p_destination_kind = 'partner' AND p_to_partner_id IS NULL THEN
    RETURN jsonb_build_object('success',false,'error','Pick a partner shop'); END IF;
  IF p_destination_kind = 'branch' AND p_to_location_id IS NULL THEN
    RETURN jsonb_build_object('success',false,'error','Pick a destination branch'); END IF;

  INSERT INTO device_outs(product_id, from_location_id, destination_kind, to_location_id,
                          to_partner_id, out_price, notes)
  VALUES (p_product_id, v_product.location_id, p_destination_kind, p_to_location_id,
          p_to_partner_id, p_out_price, p_notes)
  RETURNING id INTO v_out_id;

  UPDATE products SET status='out' WHERE id = p_product_id;
  RETURN jsonb_build_object('success',true,'outId',v_out_id);
END $$;

-- settle_device_out: they paid -> mark sold, book the sale --------------------
CREATE OR REPLACE FUNCTION public.settle_device_out(
  p_out_id uuid, p_settled_price numeric, p_amount_received numeric,
  p_payment_method text DEFAULT NULL, p_notes text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_out RECORD; v_product RECORD; v_partner text; v_sale_id uuid; v_sale_location uuid;
BEGIN
  IF NOT public.is_manager_or_admin() THEN RETURN jsonb_build_object('success',false,'error','Not allowed: admin/manager only'); END IF;
  SELECT * INTO v_out FROM device_outs WHERE id = p_out_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success',false,'error','OUT not found'); END IF;
  IF v_out.status <> 'out' THEN RETURN jsonb_build_object('success',false,'error','OUT already '||v_out.status); END IF;
  SELECT * INTO v_product FROM products WHERE id = v_out.product_id;

  UPDATE device_outs SET status='sold', settled_price=p_settled_price,
         amount_received=p_amount_received, payment_method=p_payment_method,
         settled_at=now(), notes=COALESCE(p_notes,notes)
   WHERE id = p_out_id;
  UPDATE products SET status='sold' WHERE id = v_out.product_id;

  -- book a real sale (feeds Grand Profit); branch sale credited to that branch
  v_sale_location := CASE WHEN v_out.destination_kind='branch' THEN v_out.to_location_id ELSE v_out.from_location_id END;
  SELECT name INTO v_partner FROM partner_shops WHERE id = v_out.to_partner_id;
  INSERT INTO sales(product_id, sale_date, sale_price, cost_price, location_id,
                    primary_payment_method, payment_status, balance, notes, created_by)
  VALUES (v_out.product_id, current_date, p_settled_price, COALESCE(v_product.cost_price,0),
          v_sale_location,
          CASE WHEN lower(COALESCE(p_payment_method,'cash')) IN ('cash','card','upi')
               THEN lower(p_payment_method)::payment_method_type ELSE 'other'::payment_method_type END,
          CASE WHEN p_amount_received >= p_settled_price THEN 'paid'::payment_status_type ELSE 'partial_paid'::payment_status_type END,
          GREATEST(p_settled_price - p_amount_received, 0),
          'Consignment sale'||COALESCE(' to '||v_partner,''), auth.uid())
  RETURNING id INTO v_sale_id;

  RETURN jsonb_build_object('success',true,'saleId',v_sale_id,
                            'profit', p_settled_price - COALESCE(v_product.cost_price,0));
END $$;

-- return_device_out: came back -> stock again ---------------------------------
CREATE OR REPLACE FUNCTION public.return_device_out(p_out_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_out RECORD;
BEGIN
  IF NOT public.is_manager_or_admin() THEN RETURN jsonb_build_object('success',false,'error','Not allowed: admin/manager only'); END IF;
  SELECT * INTO v_out FROM device_outs WHERE id = p_out_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success',false,'error','OUT not found'); END IF;
  IF v_out.status <> 'out' THEN RETURN jsonb_build_object('success',false,'error','OUT already '||v_out.status); END IF;
  UPDATE device_outs SET status='returned', returned_at=now() WHERE id = p_out_id;
  UPDATE products SET status='available' WHERE id = v_out.product_id;
  RETURN jsonb_build_object('success',true);
END $$;

CREATE OR REPLACE FUNCTION public.cancel_device_out(p_out_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_out RECORD;
BEGIN
  IF NOT public.is_manager_or_admin() THEN RETURN jsonb_build_object('success',false,'error','Not allowed: admin/manager only'); END IF;
  SELECT * INTO v_out FROM device_outs WHERE id = p_out_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success',false,'error','OUT not found'); END IF;
  IF v_out.status <> 'out' THEN RETURN jsonb_build_object('success',false,'error','OUT already '||v_out.status); END IF;
  UPDATE device_outs SET status='cancelled' WHERE id = p_out_id;
  UPDATE products SET status='available' WHERE id = v_out.product_id;
  RETURN jsonb_build_object('success',true);
END $$;

-- get_device_outs: list for the mobile UI -------------------------------------
CREATE OR REPLACE FUNCTION public.get_device_outs(
  p_status text DEFAULT NULL, p_from_location_id uuid DEFAULT NULL
) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(jsonb_agg(row ORDER BY (row->>'outDate') DESC), '[]'::jsonb) FROM (
    SELECT jsonb_build_object(
      'id', d.id, 'status', d.status,
      'productId', d.product_id, 'imei', p.imei,
      'model', m.name, 'brand', b.name, 'storageGb', p.storage_gb, 'color', p.color,
      'destinationKind', d.destination_kind,
      'destinationName', COALESCE(ps.name, sl.name),
      'fromLocation', fl.name,
      'outPrice', d.out_price, 'settledPrice', d.settled_price, 'amountReceived', d.amount_received,
      'outstanding', CASE WHEN d.status IN ('out','sold')
                          THEN GREATEST(COALESCE(d.settled_price, d.out_price) - d.amount_received, 0) ELSE 0 END,
      'outDate', d.out_date,
      'daysOut', EXTRACT(DAY FROM now() - d.out_date)::int,
      'notes', d.notes
    ) AS row
    FROM device_outs d
    JOIN products p ON p.id = d.product_id
    LEFT JOIN models m ON m.id = p.model_id
    LEFT JOIN brands b ON b.id = p.brand_id
    LEFT JOIN partner_shops ps ON ps.id = d.to_partner_id
    LEFT JOIN store_locations sl ON sl.id = d.to_location_id
    LEFT JOIN store_locations fl ON fl.id = d.from_location_id
    WHERE (p_status IS NULL OR d.status = p_status)
      AND (p_from_location_id IS NULL OR d.from_location_id = p_from_location_id)
  ) t;
$$;

-- get_partner_balances: who holds our devices / owes us -----------------------
CREATE OR REPLACE FUNCTION public.get_partner_balances()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(jsonb_agg(row ORDER BY (row->>'outstanding')::numeric DESC), '[]'::jsonb) FROM (
    SELECT jsonb_build_object(
      'id', ps.id, 'name', ps.name, 'phone', ps.phone, 'isActive', ps.is_active,
      'outCount', COUNT(d.id) FILTER (WHERE d.status='out'),
      'outstanding', COALESCE(SUM(CASE WHEN d.status IN ('out','sold')
                       THEN GREATEST(COALESCE(d.settled_price, d.out_price) - d.amount_received,0) ELSE 0 END),0)
    ) AS row
    FROM partner_shops ps
    LEFT JOIN device_outs d ON d.to_partner_id = ps.id
    GROUP BY ps.id, ps.name, ps.phone, ps.is_active
  ) t;
$$;

