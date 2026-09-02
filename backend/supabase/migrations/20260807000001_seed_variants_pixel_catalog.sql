-- ============================================================
-- Seed variant combinations for the Google Pixel catalog (Pixel 6 and newer)
--
-- Why: shop staff cannot reliably create variants by hand (storage, condition and
-- PTA status all have to be right before a handset can be logged). Pre-creating every
-- valid combination turns "create a record" into "find the row and add the unit".
--
-- Each seeded row lands at stock 0 / price 0 / is_active false. It stays invisible in
-- the catalog because get_model_catalog() inner-joins available product units, of which
-- a seeded row has none. As soon as the first unit is attached,
-- recalculate_variant() sets stock_count, avg_cost_price, available_colors and flips
-- is_active to true on its own — nobody has to edit the variant.
--
-- Combination rule: storage x {new, used, open_box} x {pta_approved, non_pta}
--   - refurbished is excluded: the shop does not sell it.
--   - colour is NOT a dimension; it lives in variants.available_colors and is derived
--     from product units.
--   - capacities are capped at 512GB (the shop's standard ladder). 1TB tiers exist on
--     8 Pro / 9 Pro / 9 Pro XL / 10 Pro but are not stocked.
--
-- Storage tiers verified against GSMArena and the Google Store, August 2026. Traps:
--   - Pixel 10 Pro XL has NO 128GB tier (starts at 256GB).
--   - Pixel 6a and 7a are 128GB only; 8a/9a/10a add 256GB.
--
-- Idempotent: ON CONFLICT DO NOTHING against the variants_unique_key unique index.
-- Models are resolved by brand + name, never by UUID, since prod's UUIDs differ.
-- Models absent from the target database are simply skipped by the join.
-- ============================================================

WITH storage_map(model_name, storages) AS (VALUES
  ('Pixel 6',         ARRAY[128,256]),
  ('Pixel 6 Pro',     ARRAY[128,256,512]),
  ('Pixel 6a',        ARRAY[128]),
  ('Pixel 7',         ARRAY[128,256]),
  ('Pixel 7 Pro',     ARRAY[128,256,512]),
  ('Pixel 7a',        ARRAY[128]),
  ('Pixel 8',         ARRAY[128,256]),
  ('Pixel 8 Pro',     ARRAY[128,256,512]),
  ('Pixel 9',         ARRAY[128,256]),
  ('Pixel 9 Pro',     ARRAY[128,256,512]),
  ('Pixel 9 Pro XL',  ARRAY[128,256,512]),
  ('Pixel 9a',        ARRAY[128,256]),
  ('Pixel 10',        ARRAY[128,256]),
  ('Pixel 10 Pro',    ARRAY[128,256,512]),
  ('Pixel 10 Pro XL', ARRAY[256,512]),      -- no 128GB tier
  ('Pixel 10a',       ARRAY[128,256])
)
INSERT INTO variants (model_id, storage_gb, pta_status, condition,
                      selling_price, avg_cost_price, stock_count, is_active)
SELECT m.id, s.storage_gb, p.pta_status, c.condition::product_condition, 0, 0, 0, false
FROM storage_map sm
JOIN models m ON m.name = sm.model_name
JOIN brands b ON b.id = m.brand_id AND b.name = 'Google'
CROSS JOIN LATERAL unnest(sm.storages) AS s(storage_gb)
CROSS JOIN unnest(ARRAY['new','used','open_box']) AS c(condition)
CROSS JOIN unnest(ARRAY['pta_approved','non_pta']) AS p(pta_status)
ON CONFLICT (model_id, storage_gb, pta_status, condition) DO NOTHING;

-- slug is filled by trg_variants_auto_slug; never set it here.
