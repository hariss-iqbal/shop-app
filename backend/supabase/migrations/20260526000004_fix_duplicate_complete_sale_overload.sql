-- Fix: completing a sale failed with HTTP 400:
--   "function complete_sale_with_inventory_deduction(uuid, date, numeric, text,
--    text, text, text, uuid) is not unique ... Could not choose a best candidate"
--
-- Cause: two overloads of complete_sale_with_inventory_deduction coexist:
--   (a) 8-arg  (p_product_id ... p_location_id)                 -- canonical, created in 20260422000001
--   (b) 11-arg (... p_batch_id, p_balance, p_payment_status)    -- stale, created in 20260218000001
-- The 11-arg overload has DEFAULTs on its last 3 params, so an 8-arg call matches
-- BOTH candidates → ambiguity → exception → 400. The batch wrapper
-- complete_batch_sale_with_inventory_deduction calls the 8-arg form, so no sale
-- could be completed.
--
-- Migration 20260422000001 intended to replace the single-sale function but its
-- `DROP ... IF EXISTS (8-arg)` was a no-op (after 20260218000001 the live function
-- was the 11-arg form), leaving the stale overload behind.
--
-- All callers (sale.service markAsSold, the batch wrapper, sync-scheduler) use the
-- 8-arg signature, so drop the stale 11-arg overload to realize 0422's intent.

DROP FUNCTION IF EXISTS complete_sale_with_inventory_deduction(
  UUID, DATE, NUMERIC, TEXT, TEXT, TEXT, TEXT, UUID, UUID, NUMERIC, TEXT
);
