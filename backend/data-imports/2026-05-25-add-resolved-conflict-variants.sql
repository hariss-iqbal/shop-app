-- Add the two price-conflict variants that were previously skipped by the
-- stock importer, after the owner resolved the conflicting prices.
--
-- Source: ~/Downloads/smart-cell-stock.xlsx
--
-- Resolutions provided by owner (2026-05-25):
--   * Pixel 8 128GB used/PTA: row 23 (Hazel) price corrected 78000 -> 85000,
--     so the whole group is now a single price (85000). Loads Obsidian x2 + Hazel x1.
--   * Pixel 9 128GB used/non-PTA: load rows 11-13 only (Obsidian x2, Porcelain x1,
--     Peony x1) at 125000; SKIP row 14 (Wintergreen @115000) for now.
--
-- Colors are exact GSMArena marketing names (no normalization needed).
-- Variant slug is auto-filled by trg_variants_auto_slug; variant stock_count /
-- available_colors are auto-maintained by trg_products_variant_stats.
-- One product row is created per physical unit (qty), matching the importer.

BEGIN;

-- ── Variant A: Pixel 8 / 128GB / used / PTA approved @ 85000 ──────────────────
INSERT INTO variants (model_id, storage_gb, pta_status, condition, selling_price, is_active)
VALUES ('c1816fe4-8866-4dc2-9566-bc6b9f17c0c3', 128, 'pta_approved', 'used', 85000, true);

INSERT INTO products (brand_id, model, model_id, variant_id, storage_gb, ram_gb, color,
                      condition, pta_status, cost_price, selling_price, status, product_type)
SELECT '33333333-3333-3333-3333-333333333333', m.name, m.id, v.id, 128, 8, c.color,
       'used', 'pta_approved', 0, 85000, 'available', 'phone'
FROM variants v
JOIN models m ON m.id = v.model_id
CROSS JOIN (VALUES ('Obsidian', 2), ('Hazel', 1)) AS c(color, qty)
CROSS JOIN LATERAL generate_series(1, c.qty) g
WHERE v.model_id = 'c1816fe4-8866-4dc2-9566-bc6b9f17c0c3'
  AND v.storage_gb = 128 AND v.pta_status = 'pta_approved' AND v.condition = 'used';

-- ── Variant B: Pixel 9 / 128GB / used / non-PTA @ 125000 (Wintergreen skipped) ─
INSERT INTO variants (model_id, storage_gb, pta_status, condition, selling_price, is_active)
VALUES ('28427034-db29-49da-bc2d-cb7da91686f6', 128, 'non_pta', 'used', 125000, true);

INSERT INTO products (brand_id, model, model_id, variant_id, storage_gb, ram_gb, color,
                      condition, pta_status, cost_price, selling_price, status, product_type)
SELECT '33333333-3333-3333-3333-333333333333', m.name, m.id, v.id, 128, 12, c.color,
       'used', 'non_pta', 0, 125000, 'available', 'phone'
FROM variants v
JOIN models m ON m.id = v.model_id
CROSS JOIN (VALUES ('Obsidian', 2), ('Porcelain', 1), ('Peony', 1)) AS c(color, qty)
CROSS JOIN LATERAL generate_series(1, c.qty) g
WHERE v.model_id = '28427034-db29-49da-bc2d-cb7da91686f6'
  AND v.storage_gb = 128 AND v.pta_status = 'non_pta' AND v.condition = 'used';

COMMIT;
