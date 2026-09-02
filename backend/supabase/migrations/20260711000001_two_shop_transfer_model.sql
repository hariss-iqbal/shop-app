-- Two-shop transfer model, phase 1.
-- All stock is booked under the master shop; the second shop holds phones only
-- via branch OUTs (now: price-tagged transfers). Any approved staff member can
-- move stock to a branch and settle a branch sale (customer name + phone
-- required); partner OUTs stay manager/admin-only. products.location_id now
-- tracks the actual holder, so reports stop lying after the first move.

-- A. Hygiene: kill the ambiguous 2-arg get_device_outs overload (the 3-arg
--    version from 20260626000003 stays; same failure class as 20260526000004).
DROP FUNCTION IF EXISTS public.get_device_outs(text, uuid);

-- B. Schema (additive) --------------------------------------------------------
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS imei2 VARCHAR(20);

ALTER TABLE public.device_outs
  ADD COLUMN IF NOT EXISTS recall_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS recall_requested_by uuid,
  ADD COLUMN IF NOT EXISTS claimed_until timestamptz,
  ADD COLUMN IF NOT EXISTS claimed_by uuid;

-- C. is_staff(): like is_manager_or_admin() but admits cashiers. Requires
--    is_approved server-side: every self-signup gets role='cashier' with
--    is_approved=false (20260320000001), so without this check any fresh
--    signup could move and settle stock.
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role IN ('admin', 'manager', 'cashier')
    AND is_approved
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- D1. create_device_out v2: staff can OUT to a branch, partner OUTs stay
--     manager-only. Branch OUTs move products.location_id (holder truth).
CREATE OR REPLACE FUNCTION public.create_device_out(
  p_product_id uuid, p_destination_kind text, p_out_price numeric,
  p_to_location_id uuid DEFAULT NULL, p_to_partner_id uuid DEFAULT NULL, p_notes text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_product RECORD; v_out_id uuid;
BEGIN
  IF p_destination_kind = 'partner' THEN
    IF NOT public.is_manager_or_admin() THEN
      RETURN jsonb_build_object('success',false,'error','Not allowed: partner OUTs need admin/manager');
    END IF;
  ELSE
    IF NOT public.is_staff() THEN
      RETURN jsonb_build_object('success',false,'error','Not allowed: staff only');
    END IF;
  END IF;
  -- FOR UPDATE: serializes concurrent OUTs of the same device, so the second
  -- caller re-reads status='out' and gets the friendly error, not a 23505
  SELECT * INTO v_product FROM products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success',false,'error','Product not found'); END IF;
  IF v_product.status <> 'available' THEN
    RETURN jsonb_build_object('success',false,'error','This phone is not available anymore (status: '||v_product.status||'). It may have just been moved or sold. Pick another one.');
  END IF;
  -- friendly duplicate check instead of a raw 23505 from uq_device_out_active
  -- (also catches consignment-IN devices, whose product status is 'available')
  IF EXISTS (SELECT 1 FROM device_outs WHERE product_id = p_product_id AND status IN ('out','in_stock')) THEN
    RETURN jsonb_build_object('success',false,'error','This phone already has an active OUT/IN entry');
  END IF;
  IF p_out_price IS NULL OR p_out_price < 0 OR p_out_price > 5000000 THEN
    RETURN jsonb_build_object('success',false,'error','That price looks wrong. Enter a realistic amount.'); END IF;
  IF p_destination_kind = 'partner' AND p_to_partner_id IS NULL THEN
    RETURN jsonb_build_object('success',false,'error','Pick a partner shop'); END IF;
  IF p_destination_kind = 'branch' AND p_to_location_id IS NULL THEN
    RETURN jsonb_build_object('success',false,'error','Pick a destination branch'); END IF;
  IF p_destination_kind = 'branch' AND p_to_location_id = v_product.location_id THEN
    RETURN jsonb_build_object('success',false,'error','Device is already at that branch'); END IF;

  INSERT INTO device_outs(product_id, from_location_id, destination_kind, to_location_id,
                          to_partner_id, out_price, notes)
  VALUES (p_product_id, v_product.location_id, p_destination_kind, p_to_location_id,
          p_to_partner_id, p_out_price, p_notes)
  RETURNING id INTO v_out_id;

  IF p_destination_kind = 'branch' THEN
    UPDATE products SET status='out', location_id=p_to_location_id WHERE id = p_product_id;
  ELSE
    UPDATE products SET status='out' WHERE id = p_product_id;
  END IF;
  RETURN jsonb_build_object('success',true,'outId',v_out_id);
END $$;

-- D2. create_device_outs_bulk: N devices to one destination in one transaction,
--     per-item results (a bad device doesn't sink the rest of the batch).
CREATE OR REPLACE FUNCTION public.create_device_outs_bulk(
  p_product_ids uuid[], p_destination_kind text, p_out_price numeric,
  p_to_location_id uuid DEFAULT NULL, p_to_partner_id uuid DEFAULT NULL, p_notes text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_id uuid; v_res jsonb; v_items jsonb := '[]'::jsonb; v_ok int := 0;
BEGIN
  IF p_product_ids IS NULL OR array_length(p_product_ids, 1) IS NULL THEN
    RETURN jsonb_build_object('success',false,'error','No devices selected');
  END IF;
  FOREACH v_id IN ARRAY p_product_ids LOOP
    BEGIN
      v_res := public.create_device_out(v_id, p_destination_kind, p_out_price,
                                        p_to_location_id, p_to_partner_id, p_notes);
    EXCEPTION WHEN OTHERS THEN
      v_res := jsonb_build_object('success',false,'error',SQLERRM);
    END;
    IF COALESCE((v_res->>'success')::boolean, false) THEN v_ok := v_ok + 1; END IF;
    v_items := v_items || jsonb_build_array(jsonb_build_object('productId', v_id) || v_res);
  END LOOP;
  RETURN jsonb_build_object('success', v_ok > 0, 'okCount', v_ok,
                            'failCount', array_length(p_product_ids, 1) - v_ok, 'items', v_items);
END $$;

-- D3. settle_device_out v2: staff-gated; branch settles require customer name
--     + phone (written to the sales row); soft-claim guard.
--     DROP first: this repo has been bitten twice by CREATE OR REPLACE
--     overload duplication (20260526000004, get_device_outs above).
DROP FUNCTION IF EXISTS public.settle_device_out(uuid, numeric, numeric, text, text);
DROP FUNCTION IF EXISTS public.settle_device_out(uuid, numeric, numeric, text, text, text, text);
CREATE FUNCTION public.settle_device_out(
  p_out_id uuid, p_settled_price numeric, p_amount_received numeric,
  p_payment_method text DEFAULT NULL, p_notes text DEFAULT NULL,
  p_buyer_name text DEFAULT NULL, p_buyer_phone text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_out RECORD; v_product RECORD; v_partner text; v_sale_id uuid; v_sale_location uuid;
BEGIN
  IF NOT public.is_staff() THEN RETURN jsonb_build_object('success',false,'error','Not allowed: staff only'); END IF;
  -- FOR UPDATE: two concurrent settles (one per shop) would otherwise both
  -- pass the status check and book TWO sales rows for one device
  SELECT * INTO v_out FROM device_outs WHERE id = p_out_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success',false,'error','OUT not found'); END IF;
  IF v_out.direction <> 'out' THEN RETURN jsonb_build_object('success',false,'error','Not an OUT entry (use the consignment-IN sell action)'); END IF;
  IF v_out.status <> 'out' THEN RETURN jsonb_build_object('success',false,'error','OUT already '||v_out.status); END IF;
  IF v_out.claimed_until IS NOT NULL AND v_out.claimed_until > now()
     AND v_out.claimed_by IS DISTINCT FROM auth.uid() THEN
    RETURN jsonb_build_object('success',false,'error','This unit is claimed by another user right now');
  END IF;
  IF p_settled_price IS NULL OR p_settled_price < 0 OR p_settled_price > 5000000
     OR p_amount_received IS NULL OR p_amount_received < 0 OR p_amount_received > 5000000 THEN
    RETURN jsonb_build_object('success',false,'error','That price looks wrong. Enter a realistic amount.');
  END IF;
  IF v_out.destination_kind = 'branch'
     AND (COALESCE(trim(p_buyer_name),'') = '' OR COALESCE(trim(p_buyer_phone),'') = '') THEN
    RETURN jsonb_build_object('success',false,'error','Customer name and phone are required for a branch sale');
  END IF;
  SELECT * INTO v_product FROM products WHERE id = v_out.product_id;

  UPDATE device_outs SET status='sold', settled_price=p_settled_price,
         amount_received=p_amount_received, payment_method=p_payment_method,
         settled_at=now(), notes=COALESCE(p_notes,notes),
         recall_requested_at=NULL, recall_requested_by=NULL, claimed_until=NULL, claimed_by=NULL
   WHERE id = p_out_id;
  UPDATE products SET status='sold' WHERE id = v_out.product_id;

  -- book a real sale (feeds Grand Profit); branch sale credited to that branch
  v_sale_location := CASE WHEN v_out.destination_kind='branch' THEN v_out.to_location_id ELSE v_out.from_location_id END;
  SELECT name INTO v_partner FROM partner_shops WHERE id = v_out.to_partner_id;
  INSERT INTO sales(product_id, sale_date, sale_price, cost_price, location_id,
                    primary_payment_method, payment_status, balance, notes, created_by,
                    buyer_name, buyer_phone)
  VALUES (v_out.product_id, current_date, p_settled_price, COALESCE(v_product.cost_price,0),
          v_sale_location,
          CASE WHEN lower(COALESCE(p_payment_method,'cash')) IN ('cash','card','upi')
               THEN lower(p_payment_method)::payment_method_type ELSE 'other'::payment_method_type END,
          CASE WHEN p_amount_received >= p_settled_price THEN 'paid'::payment_status_type ELSE 'partial_paid'::payment_status_type END,
          GREATEST(p_settled_price - p_amount_received, 0),
          'Consignment sale'||COALESCE(' to '||v_partner,''), auth.uid(),
          NULLIF(trim(p_buyer_name),''), NULLIF(trim(p_buyer_phone),''))
  RETURNING id INTO v_sale_id;

  RETURN jsonb_build_object('success',true,'saleId',v_sale_id,
                            'profit', p_settled_price - COALESCE(v_product.cost_price,0));
END $$;

-- D4. return_device_out v2: staff-gated; optional IMEI suffix confirmation
--     (mobile always sends it for branch returns); branch returns move the
--     holder back to the origin shop and clear recall/claim state.
DROP FUNCTION IF EXISTS public.return_device_out(uuid);
DROP FUNCTION IF EXISTS public.return_device_out(uuid, text);
CREATE FUNCTION public.return_device_out(p_out_id uuid, p_imei_confirm text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_out RECORD; v_product RECORD; v_conf text;
BEGIN
  IF NOT public.is_staff() THEN RETURN jsonb_build_object('success',false,'error','Not allowed: staff only'); END IF;
  SELECT * INTO v_out FROM device_outs WHERE id = p_out_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success',false,'error','Consignment not found'); END IF;
  -- consignment-IN returns hand a partner's device back — that stays a
  -- manager decision (matches create_device_in / sell_device_in / pay_partner)
  IF v_out.direction = 'in' AND NOT public.is_manager_or_admin() THEN
    RETURN jsonb_build_object('success',false,'error','Not allowed: consignment-IN returns need admin/manager');
  END IF;
  -- someone else's live "customer here now" claim also blocks a return (a
  -- manager can still force it); bulk return-all skips such units per-item
  IF v_out.claimed_until IS NOT NULL AND v_out.claimed_until > now()
     AND v_out.claimed_by IS DISTINCT FROM auth.uid()
     AND NOT public.is_manager_or_admin() THEN
    RETURN jsonb_build_object('success',false,'error','This unit is claimed by another user right now');
  END IF;
  IF v_out.status NOT IN ('out','in_stock') THEN RETURN jsonb_build_object('success',false,'error','Already '||v_out.status); END IF;

  v_conf := regexp_replace(COALESCE(p_imei_confirm,''), '\s', '', 'g');
  IF v_conf <> '' THEN
    IF length(v_conf) < 5 THEN
      RETURN jsonb_build_object('success',false,'error','Enter at least the last 5 digits of the IMEI');
    END IF;
    SELECT imei, imei2 INTO v_product FROM products WHERE id = v_out.product_id;
    IF NOT ( (v_product.imei  IS NOT NULL AND right(regexp_replace(v_product.imei,  '\s', '', 'g'), length(v_conf)) = v_conf)
          OR (v_product.imei2 IS NOT NULL AND right(regexp_replace(v_product.imei2, '\s', '', 'g'), length(v_conf)) = v_conf) ) THEN
      RETURN jsonb_build_object('success',false,'error','IMEI does not match this unit');
    END IF;
  END IF;

  UPDATE device_outs SET status='returned', returned_at=now(),
         recall_requested_at=NULL, recall_requested_by=NULL, claimed_until=NULL, claimed_by=NULL
   WHERE id = p_out_id;
  IF v_out.direction='in' THEN
    UPDATE products SET status='returned' WHERE id = v_out.product_id;   -- back to the partner, out of our stock
  ELSE
    -- holder back to origin; legacy rows with NULL origin fall back to the
    -- master shop (NOT the current value — that would leave it at the branch)
    UPDATE products SET status='available',
           location_id=COALESCE(v_out.from_location_id,
             CASE WHEN v_out.destination_kind='branch'
                  THEN (SELECT id FROM store_locations WHERE is_primary ORDER BY created_at LIMIT 1) END,
             location_id)
     WHERE id = v_out.product_id;
  END IF;
  RETURN jsonb_build_object('success',true);
END $$;

-- D5. return_device_outs_bulk: the end-of-day restock path — no per-unit IMEI
--     confirmation, per-item results.
CREATE OR REPLACE FUNCTION public.return_device_outs_bulk(p_out_ids uuid[])
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_id uuid; v_res jsonb; v_items jsonb := '[]'::jsonb; v_ok int := 0;
BEGIN
  IF p_out_ids IS NULL OR array_length(p_out_ids, 1) IS NULL THEN
    RETURN jsonb_build_object('success',false,'error','Nothing selected');
  END IF;
  FOREACH v_id IN ARRAY p_out_ids LOOP
    BEGIN
      v_res := public.return_device_out(v_id);
    EXCEPTION WHEN OTHERS THEN
      v_res := jsonb_build_object('success',false,'error',SQLERRM);
    END;
    IF COALESCE((v_res->>'success')::boolean, false) THEN v_ok := v_ok + 1; END IF;
    v_items := v_items || jsonb_build_array(jsonb_build_object('outId', v_id) || v_res);
  END LOOP;
  RETURN jsonb_build_object('success', v_ok > 0, 'okCount', v_ok,
                            'failCount', array_length(p_out_ids, 1) - v_ok, 'items', v_items);
END $$;

-- D6. cancel_device_out: stays manager-gated; now also restores the holder.
CREATE OR REPLACE FUNCTION public.cancel_device_out(p_out_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_out RECORD;
BEGIN
  IF NOT public.is_manager_or_admin() THEN RETURN jsonb_build_object('success',false,'error','Not allowed: admin/manager only'); END IF;
  SELECT * INTO v_out FROM device_outs WHERE id = p_out_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success',false,'error','OUT not found'); END IF;
  IF v_out.status <> 'out' THEN RETURN jsonb_build_object('success',false,'error','OUT already '||v_out.status); END IF;
  UPDATE device_outs SET status='cancelled',
         recall_requested_at=NULL, recall_requested_by=NULL, claimed_until=NULL, claimed_by=NULL
   WHERE id = p_out_id;
  UPDATE products SET status='available',
         location_id=COALESCE(v_out.from_location_id,
           CASE WHEN v_out.destination_kind='branch'
                THEN (SELECT id FROM store_locations WHERE is_primary ORDER BY created_at LIMIT 1) END,
           location_id)
   WHERE id = v_out.product_id;
  RETURN jsonb_build_object('success',true);
END $$;

-- D7. request_return: the master side asks the holding shop to bring a unit
--     back. Acknowledge = the holder performing the return; no extra state.
CREATE OR REPLACE FUNCTION public.request_return(p_out_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_out RECORD;
BEGIN
  IF NOT public.is_staff() THEN RETURN jsonb_build_object('success',false,'error','Not allowed: staff only'); END IF;
  SELECT * INTO v_out FROM device_outs WHERE id = p_out_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success',false,'error','OUT not found'); END IF;
  IF v_out.direction <> 'out' OR v_out.destination_kind <> 'branch' OR v_out.status <> 'out' THEN
    RETURN jsonb_build_object('success',false,'error','Return can only be requested for an active branch OUT');
  END IF;
  UPDATE device_outs SET recall_requested_at=now(), recall_requested_by=auth.uid() WHERE id = p_out_id;
  RETURN jsonb_build_object('success',true);
END $$;

-- D8. Soft claim: "customer in front of me" — blocks the other shop's settle
--     until expiry or release (first confirmed claim wins).
CREATE OR REPLACE FUNCTION public.claim_device_out(p_out_id uuid, p_minutes int DEFAULT 120)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_out RECORD; v_until timestamptz;
BEGIN
  IF NOT public.is_staff() THEN RETURN jsonb_build_object('success',false,'error','Not allowed: staff only'); END IF;
  -- FOR UPDATE: first confirmed claim wins — without it two simultaneous
  -- claims both succeed and the last writer silently steals the unit
  SELECT * INTO v_out FROM device_outs WHERE id = p_out_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success',false,'error','OUT not found'); END IF;
  IF v_out.status <> 'out' THEN RETURN jsonb_build_object('success',false,'error','OUT already '||v_out.status); END IF;
  IF v_out.claimed_until IS NOT NULL AND v_out.claimed_until > now()
     AND v_out.claimed_by IS DISTINCT FROM auth.uid() THEN
    RETURN jsonb_build_object('success',false,'error','Already claimed by another user');
  END IF;
  -- clamp to [1 min, 8 h] — p_minutes is client-controlled
  v_until := now() + make_interval(mins => LEAST(GREATEST(COALESCE(p_minutes,120), 1), 480));
  UPDATE device_outs SET claimed_until=v_until, claimed_by=auth.uid() WHERE id = p_out_id;
  RETURN jsonb_build_object('success',true,'claimedUntil',v_until);
END $$;

CREATE OR REPLACE FUNCTION public.release_device_out_claim(p_out_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_out RECORD;
BEGIN
  IF NOT public.is_staff() THEN RETURN jsonb_build_object('success',false,'error','Not allowed: staff only'); END IF;
  SELECT * INTO v_out FROM device_outs WHERE id = p_out_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success',false,'error','OUT not found'); END IF;
  IF v_out.claimed_by IS NOT NULL AND v_out.claimed_by IS DISTINCT FROM auth.uid()
     AND NOT public.is_manager_or_admin() THEN
    RETURN jsonb_build_object('success',false,'error','Claimed by another user');
  END IF;
  UPDATE device_outs SET claimed_until=NULL, claimed_by=NULL WHERE id = p_out_id;
  RETURN jsonb_build_object('success',true);
END $$;

-- D9. Transfer price edit: giver side only, per the owner's rule.
CREATE OR REPLACE FUNCTION public.update_device_out_price(p_out_id uuid, p_new_price numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_out RECORD;
BEGIN
  IF NOT public.is_manager_or_admin() THEN RETURN jsonb_build_object('success',false,'error','Not allowed: admin/manager only'); END IF;
  IF p_new_price IS NULL OR p_new_price < 0 OR p_new_price > 5000000 THEN
    RETURN jsonb_build_object('success',false,'error','That price looks wrong. Enter a realistic amount.'); END IF;
  SELECT * INTO v_out FROM device_outs WHERE id = p_out_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success',false,'error','OUT not found'); END IF;
  IF v_out.status <> 'out' THEN RETURN jsonb_build_object('success',false,'error','OUT already '||v_out.status); END IF;
  UPDATE device_outs SET out_price=p_new_price WHERE id = p_out_id;
  RETURN jsonb_build_object('success',true);
END $$;

-- D10. get_product_history: the per-phone timeline every employee can see —
--      intake, every move (with destination/price/actor), and the final sale
--      (with buyer + seller). Actor emails come from auth.users, which this
--      SECURITY DEFINER function can read.
CREATE OR REPLACE FUNCTION public.get_product_history(p_product_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT CASE WHEN NOT public.is_staff() THEN '[]'::jsonb ELSE
    COALESCE((SELECT jsonb_agg(ev ORDER BY (ev->>'at')) FROM (
      -- intake: creation time; location = origin of the first move if any,
      -- else where it sits now (location_id follows the holder from here on)
      SELECT jsonb_build_object('type','intake','at',p.created_at,
        'location', COALESCE(
          (SELECT fl.name FROM device_outs d0 JOIN store_locations fl ON fl.id = d0.from_location_id
            WHERE d0.product_id = p.id ORDER BY d0.out_date LIMIT 1),
          (SELECT sl.name FROM store_locations sl WHERE sl.id = p.location_id))) AS ev
      FROM products p WHERE p.id = p_product_id
      UNION ALL
      SELECT jsonb_build_object(
        'type', CASE WHEN d.direction='in' THEN 'consignment_in' ELSE 'out' END,
        'at', d.out_date, 'destinationKind', d.destination_kind,
        'destination', COALESCE(ps.name, sl.name), 'price', d.out_price,
        'actor', u.email, 'notes', d.notes)
      FROM device_outs d
      LEFT JOIN partner_shops ps ON ps.id = d.to_partner_id
      LEFT JOIN store_locations sl ON sl.id = d.to_location_id
      LEFT JOIN auth.users u ON u.id = d.created_by
      WHERE d.product_id = p_product_id
      UNION ALL
      SELECT jsonb_build_object('type','settled','at',d.settled_at,'price',d.settled_price,
        'destination', COALESCE(ps.name, sl.name))
      FROM device_outs d
      LEFT JOIN partner_shops ps ON ps.id = d.to_partner_id
      LEFT JOIN store_locations sl ON sl.id = d.to_location_id
      WHERE d.product_id = p_product_id AND d.settled_at IS NOT NULL
      UNION ALL
      SELECT jsonb_build_object('type','returned','at',d.returned_at,
        'destination', COALESCE(ps.name, sl.name))
      FROM device_outs d
      LEFT JOIN partner_shops ps ON ps.id = d.to_partner_id
      LEFT JOIN store_locations sl ON sl.id = d.to_location_id
      WHERE d.product_id = p_product_id AND d.returned_at IS NOT NULL
      UNION ALL
      SELECT jsonb_build_object('type','cancelled','at',COALESCE(d.updated_at, d.out_date))
      FROM device_outs d
      WHERE d.product_id = p_product_id AND d.status = 'cancelled'
      UNION ALL
      SELECT jsonb_build_object('type','sold','at',COALESCE(s.created_at, s.sale_date::timestamptz),
        'price', s.sale_price, 'buyer', s.buyer_name, 'buyerPhone', s.buyer_phone,
        'location', sl.name, 'actor', u.email)
      FROM sales s
      LEFT JOIN store_locations sl ON sl.id = s.location_id
      LEFT JOIN auth.users u ON u.id = s.created_by
      WHERE s.product_id = p_product_id
    ) t), '[]'::jsonb)
  END;
$$;

-- D11. get_device_outs: same 3-arg signature, plus recall/claim passthroughs.
CREATE OR REPLACE FUNCTION public.get_device_outs(
  p_status text DEFAULT NULL, p_from_location_id uuid DEFAULT NULL, p_direction text DEFAULT NULL
) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(jsonb_agg(row ORDER BY (row->>'outDate') DESC), '[]'::jsonb) FROM (
    SELECT jsonb_build_object(
      'id', d.id, 'status', d.status, 'direction', d.direction,
      'productId', d.product_id, 'imei', p.imei, 'imei2', p.imei2,
      'model', m.name, 'brand', b.name, 'storageGb', p.storage_gb, 'color', p.color,
      'destinationKind', d.destination_kind,
      'destinationName', COALESCE(ps.name, sl.name),
      'fromLocation', fl.name,
      'outPrice', d.out_price, 'settledPrice', d.settled_price,
      'amountReceived', d.amount_received, 'amountPaidToPartner', d.amount_paid_to_partner,
      -- an active branch transfer is our own stock at our own shop — its price
      -- tag is informational, not a receivable (owner's rule); it only becomes
      -- money to collect once settled with a partial payment
      'outstanding', CASE
          WHEN d.direction='out' AND d.destination_kind='branch' AND d.status='out'
            THEN 0
          WHEN d.direction='out' AND d.status IN ('out','sold')
            THEN GREATEST(COALESCE(d.settled_price,d.out_price)-d.amount_received,0)
          WHEN d.direction='in' AND d.status='sold'
            THEN GREATEST(d.out_price-d.amount_paid_to_partner,0)
          ELSE 0 END,
      'outDate', d.out_date, 'daysOut', EXTRACT(DAY FROM now()-d.out_date)::int, 'notes', d.notes,
      'recallRequestedAt', d.recall_requested_at,
      'claimedUntil', d.claimed_until,
      'claimedBy', d.claimed_by,
      -- a 2-3 person shop wants to know WHO is holding a claimed phone
      'claimedByEmail', cu.email
    ) AS row
    FROM device_outs d
    JOIN products p ON p.id=d.product_id
    LEFT JOIN models m ON m.id=p.model_id
    LEFT JOIN brands b ON b.id=p.brand_id
    LEFT JOIN partner_shops ps ON ps.id=d.to_partner_id
    LEFT JOIN store_locations sl ON sl.id=d.to_location_id
    LEFT JOIN store_locations fl ON fl.id=d.from_location_id
    LEFT JOIN auth.users cu ON cu.id=d.claimed_by
    WHERE (p_status IS NULL OR d.status=p_status)
      AND (p_from_location_id IS NULL OR d.from_location_id=p_from_location_id)
      AND (p_direction IS NULL OR d.direction=p_direction)
  ) t;
$$;

-- E. store_locations write RLS was USING(true) for all authenticated users —
--    with the mobile "set as master" toggle being a direct table update, any
--    cashier could have re-pointed the master shop. Manager/admin only now
--    (SELECT stays open; the trigger-based single-primary rule is unchanged).
DROP POLICY IF EXISTS store_locations_auth_insert ON public.store_locations;
CREATE POLICY store_locations_auth_insert ON public.store_locations
  FOR INSERT TO authenticated
  WITH CHECK (public.is_manager_or_admin());

DROP POLICY IF EXISTS store_locations_auth_update ON public.store_locations;
CREATE POLICY store_locations_auth_update ON public.store_locations
  FOR UPDATE TO authenticated
  USING (public.is_manager_or_admin()) WITH CHECK (public.is_manager_or_admin());

DROP POLICY IF EXISTS store_locations_auth_delete ON public.store_locations;
CREATE POLICY store_locations_auth_delete ON public.store_locations
  FOR DELETE TO authenticated
  USING (public.is_manager_or_admin());
