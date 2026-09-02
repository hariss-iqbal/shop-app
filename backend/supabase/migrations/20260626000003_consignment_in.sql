-- Evolve device_outs into a TWO-WAY consignment ledger (OUT + IN).
-- IN = a partner's device held in our shop: sellable (flagged), we owe them the
-- IN price once it sells, returnable before sale. One netted balance per partner.

ALTER TYPE public.product_status ADD VALUE IF NOT EXISTS 'returned';

ALTER TABLE public.device_outs
  ADD COLUMN IF NOT EXISTS direction text NOT NULL DEFAULT 'out' CHECK (direction IN ('out','in')),
  ADD COLUMN IF NOT EXISTS amount_paid_to_partner numeric NOT NULL DEFAULT 0;

ALTER TABLE public.device_outs DROP CONSTRAINT IF EXISTS device_outs_status_check;
ALTER TABLE public.device_outs ADD CONSTRAINT device_outs_status_check
  CHECK (status IN ('out','in_stock','sold','returned','cancelled'));

-- one active consignment per device (OUT-locked or IN-stock)
DROP INDEX IF EXISTS uq_device_out_active;
CREATE UNIQUE INDEX uq_device_out_active ON public.device_outs(product_id) WHERE status IN ('out','in_stock');

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS consignment_partner_id uuid REFERENCES public.partner_shops(id);
CREATE INDEX IF NOT EXISTS idx_products_consignment ON public.products(consignment_partner_id);

-- create_device_in: take a partner's device into our sellable stock -----------
CREATE OR REPLACE FUNCTION public.create_device_in(
  p_partner_id uuid, p_brand_id uuid, p_model_name text, p_in_price numeric,
  p_storage_gb int DEFAULT NULL, p_color text DEFAULT NULL, p_imei text DEFAULT NULL,
  p_sell_price numeric DEFAULT NULL, p_location_id uuid DEFAULT NULL,
  p_condition text DEFAULT 'used', p_notes text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_model_id uuid; v_variant_id uuid; v_product_id uuid; v_out_id uuid; v_loc uuid;
BEGIN
  IF NOT public.is_manager_or_admin() THEN RETURN jsonb_build_object('success',false,'error','Not allowed: admin/manager only'); END IF;
  IF p_partner_id IS NULL THEN RETURN jsonb_build_object('success',false,'error','Pick a partner shop'); END IF;
  IF p_brand_id IS NULL OR COALESCE(trim(p_model_name),'')='' THEN RETURN jsonb_build_object('success',false,'error','Enter brand + model'); END IF;
  v_loc := COALESCE(p_location_id, (SELECT id FROM store_locations WHERE is_primary ORDER BY created_at LIMIT 1));

  SELECT id INTO v_model_id FROM models WHERE brand_id=p_brand_id AND lower(name)=lower(trim(p_model_name)) LIMIT 1;
  IF v_model_id IS NULL THEN INSERT INTO models(brand_id,name) VALUES(p_brand_id,trim(p_model_name)) RETURNING id INTO v_model_id; END IF;

  SELECT id INTO v_variant_id FROM variants
   WHERE model_id=v_model_id AND COALESCE(storage_gb,-1)=COALESCE(p_storage_gb,-1)
     AND condition=p_condition::product_condition AND pta_status IS NULL LIMIT 1;
  IF v_variant_id IS NULL THEN
    INSERT INTO variants(model_id, storage_gb, condition, selling_price, available_colors, is_active)
    VALUES (v_model_id, p_storage_gb, p_condition::product_condition, COALESCE(p_sell_price,p_in_price),
            CASE WHEN p_color IS NULL THEN '{}'::text[] ELSE ARRAY[p_color] END, true)
    RETURNING id INTO v_variant_id;
  END IF;

  INSERT INTO products(brand_id, model, model_id, storage_gb, color, condition, imei,
                       cost_price, selling_price, status, product_type, variant_id,
                       location_id, consignment_partner_id, notes)
  VALUES (p_brand_id, trim(p_model_name), v_model_id, p_storage_gb, p_color, p_condition::product_condition, p_imei,
          p_in_price, COALESCE(p_sell_price,p_in_price), 'available', 'phone', v_variant_id,
          v_loc, p_partner_id, p_notes)
  RETURNING id INTO v_product_id;

  INSERT INTO device_outs(product_id, from_location_id, direction, destination_kind, to_partner_id, out_price, status, notes)
  VALUES (v_product_id, v_loc, 'in', 'partner', p_partner_id, p_in_price, 'in_stock', p_notes)
  RETURNING id INTO v_out_id;

  RETURN jsonb_build_object('success',true,'outId',v_out_id,'productId',v_product_id);
END $$;

-- when a consignment-IN product is sold (POS or the sell action), mark its row --
CREATE OR REPLACE FUNCTION public.trg_consignment_in_on_sale() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE device_outs SET status='sold', settled_price=NEW.sale_price, settled_at=now()
   WHERE product_id=NEW.product_id AND direction='in' AND status='in_stock';
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_sales_consignment_in ON public.sales;
CREATE TRIGGER trg_sales_consignment_in AFTER INSERT ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.trg_consignment_in_on_sale();

-- sell_device_in: sell it from the consignment screen (books sale + payable) ---
CREATE OR REPLACE FUNCTION public.sell_device_in(
  p_out_id uuid, p_sale_price numeric, p_payment_method text DEFAULT NULL, p_notes text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_out RECORD; v_partner text; v_sale_id uuid;
BEGIN
  IF NOT public.is_manager_or_admin() THEN RETURN jsonb_build_object('success',false,'error','Not allowed: admin/manager only'); END IF;
  SELECT * INTO v_out FROM device_outs WHERE id=p_out_id AND direction='in';
  IF NOT FOUND THEN RETURN jsonb_build_object('success',false,'error','IN consignment not found'); END IF;
  IF v_out.status <> 'in_stock' THEN RETURN jsonb_build_object('success',false,'error','Already '||v_out.status); END IF;
  SELECT name INTO v_partner FROM partner_shops WHERE id=v_out.to_partner_id;
  -- cost = IN price, so margin = our price - in price; trigger marks the row sold
  INSERT INTO sales(product_id, sale_date, sale_price, cost_price, location_id, primary_payment_method, payment_status, balance, notes, created_by)
  VALUES (v_out.product_id, current_date, p_sale_price, v_out.out_price, v_out.from_location_id,
          CASE WHEN lower(COALESCE(p_payment_method,'cash')) IN ('cash','card','upi') THEN lower(p_payment_method)::payment_method_type ELSE 'other'::payment_method_type END,
          'paid'::payment_status_type, 0, 'Consignment-in sale (from '||COALESCE(v_partner,'?')||')', auth.uid())
  RETURNING id INTO v_sale_id;
  UPDATE products SET status='sold' WHERE id=v_out.product_id;
  RETURN jsonb_build_object('success',true,'saleId',v_sale_id,'profit', p_sale_price - v_out.out_price, 'weOwe', v_out.out_price);
END $$;

-- pay_partner: settle what WE owe (applies to oldest sold IN rows) -------------
CREATE OR REPLACE FUNCTION public.pay_partner(p_partner_id uuid, p_amount numeric, p_method text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_rem numeric := p_amount; v_row RECORD; v_owe numeric;
BEGIN
  IF NOT public.is_manager_or_admin() THEN RETURN jsonb_build_object('success',false,'error','Not allowed: admin/manager only'); END IF;
  FOR v_row IN SELECT * FROM device_outs WHERE to_partner_id=p_partner_id AND direction='in'
                AND status='sold' AND amount_paid_to_partner < out_price ORDER BY settled_at LOOP
    EXIT WHEN v_rem <= 0;
    v_owe := v_row.out_price - v_row.amount_paid_to_partner;
    IF v_rem >= v_owe THEN
      UPDATE device_outs SET amount_paid_to_partner = out_price WHERE id=v_row.id; v_rem := v_rem - v_owe;
    ELSE
      UPDATE device_outs SET amount_paid_to_partner = amount_paid_to_partner + v_rem WHERE id=v_row.id; v_rem := 0;
    END IF;
  END LOOP;
  RETURN jsonb_build_object('success',true,'applied', p_amount - v_rem, 'unapplied', v_rem);
END $$;

-- return_device_out: OUT -> back to our stock; IN -> back to partner (hidden) --
CREATE OR REPLACE FUNCTION public.return_device_out(p_out_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_out RECORD;
BEGIN
  IF NOT public.is_manager_or_admin() THEN RETURN jsonb_build_object('success',false,'error','Not allowed: admin/manager only'); END IF;
  SELECT * INTO v_out FROM device_outs WHERE id = p_out_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success',false,'error','Consignment not found'); END IF;
  IF v_out.status NOT IN ('out','in_stock') THEN RETURN jsonb_build_object('success',false,'error','Already '||v_out.status); END IF;
  UPDATE device_outs SET status='returned', returned_at=now() WHERE id = p_out_id;
  IF v_out.direction='in' THEN
    UPDATE products SET status='returned' WHERE id = v_out.product_id;   -- back to the partner, out of our stock
  ELSE
    UPDATE products SET status='available' WHERE id = v_out.product_id;  -- back into our stock
  END IF;
  RETURN jsonb_build_object('success',true);
END $$;

-- netted partner balances: (they owe us) - (we owe them) ----------------------
CREATE OR REPLACE FUNCTION public.get_partner_balances()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(jsonb_agg(row ORDER BY abs((row->>'net')::numeric) DESC), '[]'::jsonb) FROM (
    SELECT jsonb_build_object(
      'id', ps.id, 'name', ps.name, 'phone', ps.phone, 'isActive', ps.is_active,
      'outCount', COUNT(*) FILTER (WHERE d.direction='out' AND d.status='out'),
      'inCount',  COUNT(*) FILTER (WHERE d.direction='in'  AND d.status='in_stock'),
      'receivable', COALESCE(SUM(CASE WHEN d.direction='out' AND d.status IN ('out','sold')
                       THEN GREATEST(COALESCE(d.settled_price,d.out_price)-d.amount_received,0) ELSE 0 END),0),
      'payable', COALESCE(SUM(CASE WHEN d.direction='in' AND d.status='sold'
                       THEN GREATEST(d.out_price-d.amount_paid_to_partner,0) ELSE 0 END),0),
      'net', COALESCE(SUM(CASE WHEN d.direction='out' AND d.status IN ('out','sold')
                       THEN GREATEST(COALESCE(d.settled_price,d.out_price)-d.amount_received,0)
                     WHEN d.direction='in' AND d.status='sold'
                       THEN -GREATEST(d.out_price-d.amount_paid_to_partner,0) ELSE 0 END),0)
    ) AS row
    FROM partner_shops ps LEFT JOIN device_outs d ON d.to_partner_id = ps.id
    GROUP BY ps.id, ps.name, ps.phone, ps.is_active
  ) t;
$$;

-- get_device_outs: now direction-aware ---------------------------------------
CREATE OR REPLACE FUNCTION public.get_device_outs(
  p_status text DEFAULT NULL, p_from_location_id uuid DEFAULT NULL, p_direction text DEFAULT NULL
) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(jsonb_agg(row ORDER BY (row->>'outDate') DESC), '[]'::jsonb) FROM (
    SELECT jsonb_build_object(
      'id', d.id, 'status', d.status, 'direction', d.direction,
      'productId', d.product_id, 'imei', p.imei,
      'model', m.name, 'brand', b.name, 'storageGb', p.storage_gb, 'color', p.color,
      'destinationKind', d.destination_kind,
      'destinationName', COALESCE(ps.name, sl.name),
      'fromLocation', fl.name,
      'outPrice', d.out_price, 'settledPrice', d.settled_price,
      'amountReceived', d.amount_received, 'amountPaidToPartner', d.amount_paid_to_partner,
      'outstanding', CASE
          WHEN d.direction='out' AND d.status IN ('out','sold')
            THEN GREATEST(COALESCE(d.settled_price,d.out_price)-d.amount_received,0)
          WHEN d.direction='in' AND d.status='sold'
            THEN GREATEST(d.out_price-d.amount_paid_to_partner,0)
          ELSE 0 END,
      'outDate', d.out_date, 'daysOut', EXTRACT(DAY FROM now()-d.out_date)::int, 'notes', d.notes
    ) AS row
    FROM device_outs d
    JOIN products p ON p.id=d.product_id
    LEFT JOIN models m ON m.id=p.model_id
    LEFT JOIN brands b ON b.id=p.brand_id
    LEFT JOIN partner_shops ps ON ps.id=d.to_partner_id
    LEFT JOIN store_locations sl ON sl.id=d.to_location_id
    LEFT JOIN store_locations fl ON fl.id=d.from_location_id
    WHERE (p_status IS NULL OR d.status=p_status)
      AND (p_from_location_id IS NULL OR d.from_location_id=p_from_location_id)
      AND (p_direction IS NULL OR d.direction=p_direction)
  ) t;
$$;

-- full two-way ledger for one partner (the "khata" statement) ------------------
CREATE OR REPLACE FUNCTION public.get_partner_ledger(p_partner_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT jsonb_build_object(
    'partner', (SELECT jsonb_build_object('id',id,'name',name,'phone',phone) FROM partner_shops WHERE id=p_partner_id),
    'net', COALESCE((SELECT SUM(CASE
              WHEN d.direction='out' AND d.status IN ('out','sold') THEN GREATEST(COALESCE(d.settled_price,d.out_price)-d.amount_received,0)
              WHEN d.direction='in'  AND d.status='sold' THEN -GREATEST(d.out_price-d.amount_paid_to_partner,0) ELSE 0 END)
            FROM device_outs d WHERE d.to_partner_id=p_partner_id),0),
    'rows', COALESCE((SELECT jsonb_agg(jsonb_build_object(
              'id', d.id, 'direction', d.direction, 'status', d.status,
              'model', m.name, 'outPrice', d.out_price, 'settledPrice', d.settled_price,
              'amountReceived', d.amount_received, 'amountPaidToPartner', d.amount_paid_to_partner,
              'date', d.out_date) ORDER BY d.out_date DESC)
            FROM device_outs d JOIN products p ON p.id=d.product_id LEFT JOIN models m ON m.id=p.model_id
            WHERE d.to_partner_id=p_partner_id), '[]'::jsonb)
  );
$$;
