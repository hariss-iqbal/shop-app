-- PROD version of 2026-05-25-add-resolved-conflict-variants.sql
-- Adds the two resolved price-conflict variants to PROD so it matches local (SOT).
-- Brand/model are resolved BY NAME (prod model UUIDs differ from local), Google
-- brand id happens to match but we still look it up by name for safety.
-- Slug + stock_count + available_colors are auto-filled by prod triggers
-- (trg_variants_auto_slug, trg_products_variant_stats), one product row per unit.
--
-- Apply surgically per prod-deploy-method (session pooler, ON_ERROR_STOP, single txn).
-- NOT a migration file — never auto-runs.

BEGIN;

-- ── Variant A: Pixel 8 / 128GB / used / PTA approved @ 85000 (Obsidian x2, Hazel x1) ──
INSERT INTO variants (model_id, storage_gb, pta_status, condition, selling_price, is_active)
SELECT m.id, 128, 'pta_approved', 'used', 85000, true
FROM models m JOIN brands b ON b.id = m.brand_id
WHERE b.name = 'Google' AND m.name = 'Pixel 8';

INSERT INTO products (brand_id, model, model_id, variant_id, storage_gb, ram_gb, color,
                      condition, pta_status, cost_price, selling_price, status, product_type)
SELECT b.id, m.name, m.id, v.id, 128, 8, c.color,
       'used', 'pta_approved', 0, 85000, 'available', 'phone'
FROM variants v
JOIN models m ON m.id = v.model_id
JOIN brands b ON b.id = m.brand_id
CROSS JOIN (VALUES ('Obsidian', 2), ('Hazel', 1)) AS c(color, qty)
CROSS JOIN LATERAL generate_series(1, c.qty) g
WHERE b.name = 'Google' AND m.name = 'Pixel 8'
  AND v.storage_gb = 128 AND v.pta_status = 'pta_approved' AND v.condition = 'used';

-- ── Variant B: Pixel 9 / 128GB / used / non-PTA @ 125000 (Obsidian x2, Porcelain x1, Peony x1) ──
INSERT INTO variants (model_id, storage_gb, pta_status, condition, selling_price, is_active)
SELECT m.id, 128, 'non_pta', 'used', 125000, true
FROM models m JOIN brands b ON b.id = m.brand_id
WHERE b.name = 'Google' AND m.name = 'Pixel 9';

INSERT INTO products (brand_id, model, model_id, variant_id, storage_gb, ram_gb, color,
                      condition, pta_status, cost_price, selling_price, status, product_type)
SELECT b.id, m.name, m.id, v.id, 128, 12, c.color,
       'used', 'non_pta', 0, 125000, 'available', 'phone'
FROM variants v
JOIN models m ON m.id = v.model_id
JOIN brands b ON b.id = m.brand_id
CROSS JOIN (VALUES ('Obsidian', 2), ('Porcelain', 1), ('Peony', 1)) AS c(color, qty)
CROSS JOIN LATERAL generate_series(1, c.qty) g
WHERE b.name = 'Google' AND m.name = 'Pixel 9'
  AND v.storage_gb = 128 AND v.pta_status = 'non_pta' AND v.condition = 'used';

COMMIT;
