-- ============================================================
-- Add the Google Pixel 8a model and seed its variant combinations.
--
-- Companion to 20260807000001_seed_variants_pixel_catalog.sql — the Pixel 8a was the
-- one gap in the Pixel 6-and-newer range: it was missing from `models` entirely, so the
-- catalog seed had nothing to attach to.
--
-- Seeded rows land at stock 0 / price 0 / is_active false and stay invisible in the
-- catalog until the first product unit is attached, at which point
-- recalculate_variant() populates the derived columns and activates the row.
--
-- Combination rule: storage x {new, used, open_box} x {pta_approved, non_pta}
--   - refurbished excluded: the shop does not sell it.
--   - colour is NOT a dimension (lives in variants.available_colors, derived from units).
--
-- Storage verified against GSMArena (Pixel 8a, released May 2024): 128GB and 256GB.
-- Note the a-series is not uniform — 6a and 7a are 128GB only, while 8a/9a/10a add 256GB.
-- No 1TB tier exists for this model.
--
-- Idempotent: both inserts use ON CONFLICT DO NOTHING, so re-running is safe.
-- The model is resolved by brand + name, never by UUID, since prod's UUIDs differ.
-- ============================================================

INSERT INTO models (brand_id, name)
SELECT id, 'Pixel 8a' FROM brands WHERE name = 'Google'
ON CONFLICT (brand_id, name) DO NOTHING;

WITH m AS (
  SELECT m.id FROM models m
  JOIN brands b ON b.id = m.brand_id
  WHERE b.name = 'Google' AND m.name = 'Pixel 8a'
)
INSERT INTO variants (model_id, storage_gb, pta_status, condition,
                      selling_price, avg_cost_price, stock_count, is_active)
SELECT m.id, s.storage_gb, p.pta_status, c.condition::product_condition, 0, 0, 0, false
FROM m
CROSS JOIN unnest(ARRAY[128,256]) AS s(storage_gb)
CROSS JOIN unnest(ARRAY['new','used','open_box']) AS c(condition)
CROSS JOIN unnest(ARRAY['pta_approved','non_pta']) AS p(pta_status)
ON CONFLICT (model_id, storage_gb, pta_status, condition) DO NOTHING;

-- slug is filled by trg_variants_auto_slug; never set it here.
