-- Migration: Import DigiKhata stock (Items List Report 23 Mar 26)
-- Truncates existing products and related tables, imports 31 product types
-- as individual product entries (one row per unit).

-- Truncate product-dependent tables
TRUNCATE TABLE location_inventory CASCADE;
TRUNCATE TABLE inventory_transfer_items CASCADE;
TRUNCATE TABLE inventory_transfers CASCADE;
TRUNCATE TABLE purchase_order_items CASCADE;
TRUNCATE TABLE purchase_orders CASCADE;
TRUNCATE TABLE product_images CASCADE;
TRUNCATE TABLE inventory_deduction_logs CASCADE;
TRUNCATE TABLE products CASCADE;

-- Brand IDs (from existing brands table)
-- Google:  33333333-3333-3333-3333-333333333333
-- Samsung: 22222222-2222-2222-2222-222222222222
-- Apple:   11111111-1111-1111-1111-111111111111
-- OnePlus: 44444444-4444-4444-4444-444444444444

-- Helper: generate_series creates N rows per product type

-- 1. OnePlus 13t — 2 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, pta_status, product_type, notes)
SELECT '44444444-4444-4444-4444-444444444444', 'OnePlus 13T', 'open_box', 0, 0, 'available', 'non_pta', 'phone', 'Imported from DigiKhata stock 23 Mar 2026'
FROM generate_series(1, 2);

-- 2. pixel 7a official — 4 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, pta_status, product_type, notes)
SELECT '33333333-3333-3333-3333-333333333333', 'Pixel 7a Official', 'open_box', 0, 0, 'available', 'pta_approved', 'phone', 'Imported from DigiKhata stock 23 Mar 2026'
FROM generate_series(1, 4);

-- 3. S 26 ultra — 4 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, pta_status, product_type, notes)
SELECT '22222222-2222-2222-2222-222222222222', 'S 26 Ultra', 'open_box', 0, 0, 'available', 'non_pta', 'phone', 'Imported from DigiKhata stock 23 Mar 2026'
FROM generate_series(1, 4);

-- 4. S 25 ultra — 0 pcs (create 1 placeholder)
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, pta_status, product_type, notes)
VALUES ('22222222-2222-2222-2222-222222222222', 'S 25 Ultra', 'open_box', 0, 0, 'available', 'non_pta', 'phone', 'Imported from DigiKhata stock 23 Mar 2026 — 0 in stock');

-- 5. Pixel 9 pro XL — 4 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, pta_status, product_type, notes)
SELECT '33333333-3333-3333-3333-333333333333', 'Pixel 9 Pro XL', 'open_box', 0, 0, 'available', 'non_pta', 'phone', 'Imported from DigiKhata stock 23 Mar 2026'
FROM generate_series(1, 4);

-- 6. pixel 6a cpid — 1 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, pta_status, product_type, notes)
VALUES ('33333333-3333-3333-3333-333333333333', 'Pixel 6a CPID', 'open_box', 0, 0, 'available', 'non_pta', 'phone', 'Imported from DigiKhata stock 23 Mar 2026');

-- 7. pixel 6 pro official — 0 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, pta_status, product_type, notes)
VALUES ('33333333-3333-3333-3333-333333333333', 'Pixel 6 Pro Official', 'open_box', 0, 0, 'available', 'pta_approved', 'phone', 'Imported from DigiKhata stock 23 Mar 2026 — 0 in stock');

-- 8. pixel 7 official 128gb/256gb — 2 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, pta_status, storage_gb, product_type, notes)
SELECT '33333333-3333-3333-3333-333333333333', 'Pixel 7 Official', 'open_box', 0, 0, 'available', 'pta_approved', 256, 'phone', 'Imported from DigiKhata stock 23 Mar 2026'
FROM generate_series(1, 2);

-- 9. pixel watch 1 — 2 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, product_type, notes)
SELECT '33333333-3333-3333-3333-333333333333', 'Pixel Watch 1', 'open_box', 0, 0, 'available', 'accessory', 'Imported from DigiKhata stock 23 Mar 2026'
FROM generate_series(1, 2);

-- 10. buds pro 2 — 3 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, product_type, notes)
SELECT '33333333-3333-3333-3333-333333333333', 'Buds Pro 2', 'open_box', 0, 0, 'available', 'accessory', 'Imported from DigiKhata stock 23 Mar 2026'
FROM generate_series(1, 3);

-- 11. pixel 10 pro xl — 3 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, pta_status, product_type, notes)
SELECT '33333333-3333-3333-3333-333333333333', 'Pixel 10 Pro XL', 'open_box', 0, 0, 'available', 'non_pta', 'phone', 'Imported from DigiKhata stock 23 Mar 2026'
FROM generate_series(1, 3);

-- 12. PIXEL 8 official 128gb/256gb — 3 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, pta_status, storage_gb, product_type, notes)
SELECT '33333333-3333-3333-3333-333333333333', 'Pixel 8 Official', 'open_box', 0, 0, 'available', 'pta_approved', 256, 'phone', 'Imported from DigiKhata stock 23 Mar 2026'
FROM generate_series(1, 3);

-- 13. Pixel 10 pro — 1 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, pta_status, product_type, notes)
VALUES ('33333333-3333-3333-3333-333333333333', 'Pixel 10 Pro', 'open_box', 0, 0, 'available', 'non_pta', 'phone', 'Imported from DigiKhata stock 23 Mar 2026');

-- 14. Iphone 15 pro max — 2 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, pta_status, product_type, notes)
SELECT '11111111-1111-1111-1111-111111111111', 'iPhone 15 Pro Max', 'open_box', 0, 0, 'available', 'non_pta', 'phone', 'Imported from DigiKhata stock 23 Mar 2026'
FROM generate_series(1, 2);

-- 15. S 23 ultra — 1 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, pta_status, product_type, notes)
VALUES ('22222222-2222-2222-2222-222222222222', 'S 23 Ultra', 'open_box', 0, 0, 'available', 'non_pta', 'phone', 'Imported from DigiKhata stock 23 Mar 2026');

-- 16. iphone 12 pro max — 1 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, pta_status, product_type, notes)
VALUES ('11111111-1111-1111-1111-111111111111', 'iPhone 12 Pro Max', 'open_box', 0, 0, 'available', 'non_pta', 'phone', 'Imported from DigiKhata stock 23 Mar 2026');

-- 17. pixel 8a — 1 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, pta_status, product_type, notes)
VALUES ('33333333-3333-3333-3333-333333333333', 'Pixel 8a', 'open_box', 0, 0, 'available', 'non_pta', 'phone', 'Imported from DigiKhata stock 23 Mar 2026');

-- 18. pixel 9 pro — 1 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, pta_status, product_type, notes)
VALUES ('33333333-3333-3333-3333-333333333333', 'Pixel 9 Pro', 'open_box', 0, 0, 'available', 'non_pta', 'phone', 'Imported from DigiKhata stock 23 Mar 2026');

-- 19. Pixel 10 — 0 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, pta_status, product_type, notes)
VALUES ('33333333-3333-3333-3333-333333333333', 'Pixel 10', 'open_box', 0, 0, 'available', 'non_pta', 'phone', 'Imported from DigiKhata stock 23 Mar 2026 — 0 in stock');

-- 20. pixel 9 — 3 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, pta_status, product_type, notes)
SELECT '33333333-3333-3333-3333-333333333333', 'Pixel 9', 'open_box', 0, 0, 'available', 'non_pta', 'phone', 'Imported from DigiKhata stock 23 Mar 2026'
FROM generate_series(1, 3);

-- 21. S 22 ultra — 1 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, pta_status, product_type, notes)
VALUES ('22222222-2222-2222-2222-222222222222', 'S 22 Ultra', 'open_box', 0, 0, 'available', 'non_pta', 'phone', 'Imported from DigiKhata stock 23 Mar 2026');

-- 22. pixel 8 pro 128gb official — 2 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, pta_status, storage_gb, product_type, notes)
SELECT '33333333-3333-3333-3333-333333333333', 'Pixel 8 Pro 128GB Official', 'open_box', 0, 0, 'available', 'pta_approved', 128, 'phone', 'Imported from DigiKhata stock 23 Mar 2026'
FROM generate_series(1, 2);

-- 23. pixel 9a — 1 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, pta_status, product_type, notes)
VALUES ('33333333-3333-3333-3333-333333333333', 'Pixel 9a', 'open_box', 0, 0, 'available', 'non_pta', 'phone', 'Imported from DigiKhata stock 23 Mar 2026');

-- 24. pixel 7 pro official — 3 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, pta_status, product_type, notes)
SELECT '33333333-3333-3333-3333-333333333333', 'Pixel 7 Pro Official', 'open_box', 0, 0, 'available', 'pta_approved', 'phone', 'Imported from DigiKhata stock 23 Mar 2026'
FROM generate_series(1, 3);

-- 25. pixel 8 pro box pack — 1 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, pta_status, product_type, notes)
VALUES ('33333333-3333-3333-3333-333333333333', 'Pixel 8 Pro Box Pack', 'new', 0, 0, 'available', 'non_pta', 'phone', 'Imported from DigiKhata stock 23 Mar 2026');

-- 26. pixel 6 — 2 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, pta_status, product_type, notes)
SELECT '33333333-3333-3333-3333-333333333333', 'Pixel 6', 'open_box', 0, 0, 'available', 'non_pta', 'phone', 'Imported from DigiKhata stock 23 Mar 2026'
FROM generate_series(1, 2);

-- 27. iphone 13 pro — 1 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, pta_status, product_type, notes)
VALUES ('11111111-1111-1111-1111-111111111111', 'iPhone 13 Pro', 'open_box', 0, 0, 'available', 'non_pta', 'phone', 'Imported from DigiKhata stock 23 Mar 2026');

-- 28. Pixel 7 pro non pta — 4 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, pta_status, product_type, notes)
SELECT '33333333-3333-3333-3333-333333333333', 'Pixel 7 Pro Non-PTA', 'open_box', 0, 0, 'available', 'non_pta', 'phone', 'Imported from DigiKhata stock 23 Mar 2026'
FROM generate_series(1, 4);

-- 29. Pixel 8 simple CPID — 2 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, pta_status, product_type, notes)
SELECT '33333333-3333-3333-3333-333333333333', 'Pixel 8 Simple CPID', 'open_box', 0, 0, 'available', 'non_pta', 'phone', 'Imported from DigiKhata stock 23 Mar 2026'
FROM generate_series(1, 2);

-- 30. PIXEL 6A OFFICIAL PTA — 1 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, pta_status, product_type, notes)
VALUES ('33333333-3333-3333-3333-333333333333', 'Pixel 6a Official PTA', 'open_box', 0, 0, 'available', 'pta_approved', 'phone', 'Imported from DigiKhata stock 23 Mar 2026');

-- 31. pixel 8 pro 256 official — 1 pcs
INSERT INTO products (brand_id, model, condition, cost_price, selling_price, status, pta_status, storage_gb, product_type, notes)
VALUES ('33333333-3333-3333-3333-333333333333', 'Pixel 8 Pro 256 Official', 'open_box', 0, 0, 'available', 'pta_approved', 256, 'phone', 'Imported from DigiKhata stock 23 Mar 2026');
