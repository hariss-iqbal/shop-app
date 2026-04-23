-- ============================================================
-- Seed: Models, Variants & Products from Stock Management.xlsx
-- Run with: psql -f this_file.sql
-- Pixel 7 Shade excluded. Colors = official marketing names.
-- ============================================================

BEGIN;

TRUNCATE product_images, variant_images, products, variants, models CASCADE;

-- ============================================================
-- 1. MODELS (19)
-- ============================================================

INSERT INTO models (id, brand_id, name) VALUES
  ('b66597be-e513-56da-ab0f-6946c9218100', '11111111-1111-1111-1111-111111111111', 'iPhone 11 Pro'),
  ('68c0b756-64d4-54a9-8704-66cdf609bcd8', '11111111-1111-1111-1111-111111111111', 'iPhone 11 Pro Max'),
  ('02617b09-1b3d-5123-88a9-c29c8de43575', '11111111-1111-1111-1111-111111111111', 'iPhone 12 Pro Max'),
  ('4f950977-724d-548f-8d1f-a24264ccc853', '11111111-1111-1111-1111-111111111111', 'iPhone 13'),
  ('64c9dc25-2b37-548c-94a9-4f5f8b948c4d', '11111111-1111-1111-1111-111111111111', 'iPhone 13 Pro'),
  ('60567be3-4544-5909-9f56-bfaa80a636c7', '33333333-3333-3333-3333-333333333333', 'Google Pixel 6'),
  ('8515bded-9f6f-5b54-a9e7-52e47802f162', '33333333-3333-3333-3333-333333333333', 'Google Pixel 6 Pro'),
  ('3a543a0b-cfd5-58a4-b42c-f027342f57ab', '33333333-3333-3333-3333-333333333333', 'Google Pixel 6a'),
  ('f4551247-3b76-5700-98ca-7adaf7e1033b', '33333333-3333-3333-3333-333333333333', 'Google Pixel 7'),
  ('c43c386a-bf4e-5490-9f62-79c13b4caa01', '33333333-3333-3333-3333-333333333333', 'Google Pixel 7 Pro'),
  ('66383248-ca78-5558-886a-1e5f006cbd8c', '33333333-3333-3333-3333-333333333333', 'Google Pixel 7a'),
  ('50c883b8-f3f1-5bac-ba86-db621f60be6a', '33333333-3333-3333-3333-333333333333', 'Google Pixel 8'),
  ('07867cac-623a-54d3-b5f1-45296161d142', '33333333-3333-3333-3333-333333333333', 'Google Pixel 8 Pro'),
  ('337fa3d1-a52a-5ee6-81af-0c487534705c', '33333333-3333-3333-3333-333333333333', 'Google Pixel 8a'),
  ('dd5ddee9-5847-5a48-83c7-8ee17ef90772', '33333333-3333-3333-3333-333333333333', 'Google Pixel 9 Pro XL'),
  ('d4b1f622-932d-54a6-a0bb-ec1fe5537ef7', '33333333-3333-3333-3333-333333333333', 'Google Pixel 9 Pro XL 512'),
  ('56ab5066-b3e9-5ba8-a3dc-52fe5e0a8327', '33333333-3333-3333-3333-333333333333', 'Google Pixel 10'),
  ('a2f42191-ddb2-5ea7-b736-82e7d4417481', '33333333-3333-3333-3333-333333333333', 'Google Pixel 10 Pro'),
  ('5a63af17-f670-5b0e-9ae6-6aae9f13644d', '33333333-3333-3333-3333-333333333333', 'Google Pixel 10 Pro XL');

-- ============================================================
-- 2. VARIANTS (22)
-- Key: (model_id, storage_gb, pta_status, condition)
-- ============================================================

INSERT INTO variants (id, model_id, storage_gb, pta_status, condition, selling_price, avg_cost_price, stock_count, available_colors, is_active) VALUES
  -- Apple
  ('fce8ed7a-1b6d-5a15-9bef-ec8aaf1e3cc5', 'b66597be-e513-56da-ab0f-6946c9218100', 256, 'pta_approved', 'open_box',  65000, 38000,  1, '{"Midnight Green"}',         true),
  ('57c79124-e3da-5eba-a9a3-db00d90299c3', '68c0b756-64d4-54a9-8704-66cdf609bcd8',  64, 'pta_approved', 'open_box',  75000, 47000,  1, '{"Midnight Green"}',         true),
  ('89ee635e-dbe7-5037-9cff-750f7d4fbd41', '02617b09-1b3d-5123-88a9-c29c8de43575', 256, 'pta_approved', 'open_box', 145000, 125000, 1, '{Graphite}',                 true),
  ('4874048a-de73-54c0-a941-4cb2ff8767eb', '4f950977-724d-548f-8d1f-a24264ccc853', 128, 'non_pta',      'new',       85000, 78000,  3, '{Midnight}',                 true),
  ('6a391bf1-0789-5078-a608-b0616f68ce3c', '64c9dc25-2b37-548c-94a9-4f5f8b948c4d', 256, 'pta_approved', 'open_box', 175000, 152000, 1, '{"Sierra Blue"}',            true),

  -- Google Pixel 6
  ('15dad2a4-978d-536a-aaac-fdf79c298344', '60567be3-4544-5909-9f56-bfaa80a636c7', 256, 'pta_approved', 'open_box',  85000, 75000, 3, '{"Sorta Seafoam"}',          true),
  ('cfcd7daa-af12-51cc-b8c1-ebe240b5c216', '8515bded-9f6f-5b54-a9e7-52e47802f162', 256, 'pta_approved', 'open_box',  60000, 50000, 3, '{"Stormy Black"}',           true),
  ('d864efa6-69a1-5b66-9a66-9230af30a6a9', '3a543a0b-cfd5-58a4-b42c-f027342f57ab', 128, 'pta_approved', 'open_box',  55000, 47000, 3, '{Sage}',                     true),

  -- Google Pixel 7
  ('ed8f5f2d-47ec-5b54-bdf0-3de8b9539332', 'f4551247-3b76-5700-98ca-7adaf7e1033b', 128, 'pta_approved', 'open_box',  70000, 63000, 2, '{Snow}',                     true),
  ('63d020c9-3152-5e75-b9cf-56cc478c52a2', 'c43c386a-bf4e-5490-9f62-79c13b4caa01', 256, 'pta_approved', 'open_box',  98000, 90000, 2, '{Hazel}',                    true),
  ('d6a84313-99b4-5e98-8314-a3ac0080f6cf', 'c43c386a-bf4e-5490-9f62-79c13b4caa01', 128, 'non_pta',      'open_box',  78000, 74000, 2, '{Obsidian}',                 true),
  ('c2b09ec4-5113-5452-82bc-4b7bf4329913', '66383248-ca78-5558-886a-1e5f006cbd8c', 128, 'pta_approved', 'open_box',  60000, 54000, 15, '{"Charcoal","Sea","Snow"}',  true),

  -- Google Pixel 8
  ('05acd41d-53aa-5090-b819-0787bd3eb5ed', '50c883b8-f3f1-5bac-ba86-db621f60be6a', 128, 'pta_approved', 'open_box',  88000, 76000,  5, '{Hazel}',                    true),
  ('9aa883a2-7397-5802-9b45-aaa56631b7a8', '07867cac-623a-54d3-b5f1-45296161d142', 128, 'pta_approved', 'open_box', 128000, 122000, 5, '{Obsidian}',                 true),
  ('353c743c-09aa-5e7f-96a9-50102fa59dfe', '07867cac-623a-54d3-b5f1-45296161d142', 256, 'pta_approved', 'open_box', 138000, 132000, 1, '{Bay}',                      true),
  ('d11b7f2a-21bf-536b-8cc6-04676699cd86', '337fa3d1-a52a-5ee6-81af-0c487534705c', 128, 'non_pta',      'new',       75000, 65000,  1, '{Aloe}',                     true),

  -- Google Pixel 9
  ('ab971074-185d-540f-96c1-dbfc279f2076', 'dd5ddee9-5847-5a48-83c7-8ee17ef90772', 256, 'pta_approved', 'open_box', 200000, 185000, 3, '{"Hazel","Porcelain"}',      true),
  ('e81c74be-a364-588b-9324-e30c4eca426c', 'dd5ddee9-5847-5a48-83c7-8ee17ef90772', 128, 'non_pta',      'open_box', 160000, 135000, 1, '{Obsidian}',                 true),
  ('1c8e9b49-9123-5487-8922-a707652e348e', 'd4b1f622-932d-54a6-a0bb-ec1fe5537ef7', 512, 'pta_approved', 'open_box', 210000, 195000, 1, '{Obsidian}',                 true),

  -- Google Pixel 10
  ('f03c4683-a0fe-5d07-b20a-550a45f5a742', '56ab5066-b3e9-5ba8-a3dc-52fe5e0a8327', 128, 'non_pta',      'new',      190000, 165000, 2, '{Obsidian}',                 true),
  ('e80f54c6-7707-5cdb-a2ad-5d550702a0fa', 'a2f42191-ddb2-5ea7-b736-82e7d4417481', 128, 'non_pta',      'new',      240000, 205000, 0, '{Obsidian}',                 true),
  ('84e2b420-0163-5ca6-bf51-df0bbd2bf33c', '5a63af17-f670-5b0e-9ae6-6aae9f13644d', 256, 'non_pta',      'new',      240000, 205000, 2, '{Obsidian}',                 true);

-- ============================================================
-- 3. PRODUCTS (59 units)
-- ============================================================

INSERT INTO products (brand_id, model, model_id, variant_id, storage_gb, ram_gb, color, condition, condition_rating, pta_status, cost_price, selling_price, status, notes, product_type) VALUES
  -- Pixel 10 Pro XL — Obsidian, 256GB, Non-PTA, New (2)
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 10 Pro XL', '5a63af17-f670-5b0e-9ae6-6aae9f13644d', '84e2b420-0163-5ca6-bf51-df0bbd2bf33c', 256, 16, 'Obsidian', 'new', 10, 'non_pta', 205000, 240000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 10 Pro XL', '5a63af17-f670-5b0e-9ae6-6aae9f13644d', '84e2b420-0163-5ca6-bf51-df0bbd2bf33c', 256, 16, 'Obsidian', 'new', 10, 'non_pta', 205000, 240000, 'available', NULL, 'phone'),
  -- Pixel 10 Pro — Obsidian, 128GB, Non-PTA, New (1, Sold)
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 10 Pro', 'a2f42191-ddb2-5ea7-b736-82e7d4417481', 'e80f54c6-7707-5cdb-a2ad-5d550702a0fa', 128, 16, 'Obsidian', 'new', 10, 'non_pta', 205000, 240000, 'sold', 'Sold', 'phone'),
  -- Pixel 10 — Obsidian, 128GB, Non-PTA, New (2)
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 10', '56ab5066-b3e9-5ba8-a3dc-52fe5e0a8327', 'f03c4683-a0fe-5d07-b20a-550a45f5a742', 128, 16, 'Obsidian', 'new', 10, 'non_pta', 165000, 190000, 'available', 'cpid tax paid', 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 10', '56ab5066-b3e9-5ba8-a3dc-52fe5e0a8327', 'f03c4683-a0fe-5d07-b20a-550a45f5a742', 128, 16, 'Obsidian', 'new', 10, 'non_pta', 165000, 190000, 'available', 'cpid tax paid', 'phone'),
  -- Pixel 9 Pro XL 512 — Obsidian, 512GB, PTA, Open Box (1)
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 9 Pro XL 512', 'd4b1f622-932d-54a6-a0bb-ec1fe5537ef7', '1c8e9b49-9123-5487-8922-a707652e348e', 512, 16, 'Obsidian', 'open_box', 10, 'pta_approved', 195000, 210000, 'available', NULL, 'phone'),
  -- Pixel 9 Pro XL — Porcelain, 256GB, PTA, Open Box (1, rating 8)
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 9 Pro XL', 'dd5ddee9-5847-5a48-83c7-8ee17ef90772', 'ab971074-185d-540f-96c1-dbfc279f2076', 256, 16, 'Porcelain', 'open_box', 8, 'pta_approved', 175000, 200000, 'available', NULL, 'phone'),
  -- Pixel 9 Pro XL — Obsidian, 128GB, Non-PTA, Open Box (1)
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 9 Pro XL', 'dd5ddee9-5847-5a48-83c7-8ee17ef90772', 'e81c74be-a364-588b-9324-e30c4eca426c', 128, 16, 'Obsidian', 'open_box', 9, 'non_pta', 135000, 160000, 'available', 'cpid tax paid', 'phone'),
  -- Pixel 9 Pro XL — Hazel, 256GB, PTA, Open Box (2)
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 9 Pro XL', 'dd5ddee9-5847-5a48-83c7-8ee17ef90772', 'ab971074-185d-540f-96c1-dbfc279f2076', 256, 16, 'Hazel', 'open_box', 9, 'pta_approved', 190000, 210000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 9 Pro XL', 'dd5ddee9-5847-5a48-83c7-8ee17ef90772', 'ab971074-185d-540f-96c1-dbfc279f2076', 256, 16, 'Hazel', 'open_box', 10, 'pta_approved', 195000, 210000, 'available', NULL, 'phone'),
  -- Pixel 8 Pro — Bay, 256GB, PTA, Open Box (1, rating 9)
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 8 Pro', '07867cac-623a-54d3-b5f1-45296161d142', '353c743c-09aa-5e7f-96a9-50102fa59dfe', 256, 12, 'Bay', 'open_box', 9, 'pta_approved', 132000, 138000, 'available', NULL, 'phone'),
  -- Pixel 8 Pro — Obsidian, 128GB, PTA, Open Box (5)
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 8 Pro', '07867cac-623a-54d3-b5f1-45296161d142', '9aa883a2-7397-5802-9b45-aaa56631b7a8', 128, 12, 'Obsidian', 'open_box', 10, 'pta_approved', 122000, 128000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 8 Pro', '07867cac-623a-54d3-b5f1-45296161d142', '9aa883a2-7397-5802-9b45-aaa56631b7a8', 128, 12, 'Obsidian', 'open_box', 10, 'pta_approved', 122000, 128000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 8 Pro', '07867cac-623a-54d3-b5f1-45296161d142', '9aa883a2-7397-5802-9b45-aaa56631b7a8', 128, 12, 'Obsidian', 'open_box', 10, 'pta_approved', 122000, 128000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 8 Pro', '07867cac-623a-54d3-b5f1-45296161d142', '9aa883a2-7397-5802-9b45-aaa56631b7a8', 128, 12, 'Obsidian', 'open_box', 10, 'pta_approved', 122000, 128000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 8 Pro', '07867cac-623a-54d3-b5f1-45296161d142', '9aa883a2-7397-5802-9b45-aaa56631b7a8', 128, 12, 'Obsidian', 'open_box', 10, 'pta_approved', 122000, 128000, 'available', NULL, 'phone'),
  -- Pixel 8 — Hazel, 128GB, PTA, Open Box (5)
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 8', '50c883b8-f3f1-5bac-ba86-db621f60be6a', '05acd41d-53aa-5090-b819-0787bd3eb5ed', 128, 8, 'Hazel', 'open_box', 10, 'pta_approved', 76000, 88000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 8', '50c883b8-f3f1-5bac-ba86-db621f60be6a', '05acd41d-53aa-5090-b819-0787bd3eb5ed', 128, 8, 'Hazel', 'open_box', 10, 'pta_approved', 76000, 88000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 8', '50c883b8-f3f1-5bac-ba86-db621f60be6a', '05acd41d-53aa-5090-b819-0787bd3eb5ed', 128, 8, 'Hazel', 'open_box', 10, 'pta_approved', 76000, 88000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 8', '50c883b8-f3f1-5bac-ba86-db621f60be6a', '05acd41d-53aa-5090-b819-0787bd3eb5ed', 128, 8, 'Hazel', 'open_box', 10, 'pta_approved', 76000, 88000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 8', '50c883b8-f3f1-5bac-ba86-db621f60be6a', '05acd41d-53aa-5090-b819-0787bd3eb5ed', 128, 8, 'Hazel', 'open_box', 10, 'pta_approved', 76000, 88000, 'available', NULL, 'phone'),
  -- Pixel 8a — Aloe, 128GB, Non-PTA, New (1)
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 8a', '337fa3d1-a52a-5ee6-81af-0c487534705c', 'd11b7f2a-21bf-536b-8cc6-04676699cd86', 128, 8, 'Aloe', 'new', 10, 'non_pta', 65000, 75000, 'available', NULL, 'phone'),
  -- Pixel 7 Pro — Hazel, 256GB, PTA, Open Box (2)
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 7 Pro', 'c43c386a-bf4e-5490-9f62-79c13b4caa01', '63d020c9-3152-5e75-b9cf-56cc478c52a2', 256, 12, 'Hazel', 'open_box', 10, 'pta_approved', 90000, 98000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 7 Pro', 'c43c386a-bf4e-5490-9f62-79c13b4caa01', '63d020c9-3152-5e75-b9cf-56cc478c52a2', 256, 12, 'Hazel', 'open_box', 10, 'pta_approved', 90000, 98000, 'available', NULL, 'phone'),
  -- Pixel 7 Pro — Obsidian, 128GB, Non-PTA, Open Box (2)
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 7 Pro', 'c43c386a-bf4e-5490-9f62-79c13b4caa01', 'd6a84313-99b4-5e98-8314-a3ac0080f6cf', 128, 12, 'Obsidian', 'open_box', 10, 'non_pta', 74000, 78000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 7 Pro', 'c43c386a-bf4e-5490-9f62-79c13b4caa01', 'd6a84313-99b4-5e98-8314-a3ac0080f6cf', 128, 12, 'Obsidian', 'open_box', 10, 'non_pta', 74000, 78000, 'available', NULL, 'phone'),
  -- Pixel 7 — Snow, 128GB, PTA, Open Box (2)
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 7', 'f4551247-3b76-5700-98ca-7adaf7e1033b', 'ed8f5f2d-47ec-5b54-bdf0-3de8b9539332', 128, 8, 'Snow', 'open_box', 10, 'pta_approved', 63000, 70000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 7', 'f4551247-3b76-5700-98ca-7adaf7e1033b', 'ed8f5f2d-47ec-5b54-bdf0-3de8b9539332', 128, 8, 'Snow', 'open_box', 10, 'pta_approved', 63000, 70000, 'available', NULL, 'phone'),
  -- Pixel 7a — Sea, 128GB, PTA, Open Box (6)
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 7a', '66383248-ca78-5558-886a-1e5f006cbd8c', 'c2b09ec4-5113-5452-82bc-4b7bf4329913', 128, 8, 'Sea', 'open_box', 10, 'pta_approved', 54000, 60000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 7a', '66383248-ca78-5558-886a-1e5f006cbd8c', 'c2b09ec4-5113-5452-82bc-4b7bf4329913', 128, 8, 'Sea', 'open_box', 10, 'pta_approved', 54000, 60000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 7a', '66383248-ca78-5558-886a-1e5f006cbd8c', 'c2b09ec4-5113-5452-82bc-4b7bf4329913', 128, 8, 'Sea', 'open_box', 10, 'pta_approved', 54000, 60000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 7a', '66383248-ca78-5558-886a-1e5f006cbd8c', 'c2b09ec4-5113-5452-82bc-4b7bf4329913', 128, 8, 'Sea', 'open_box', 10, 'pta_approved', 54000, 60000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 7a', '66383248-ca78-5558-886a-1e5f006cbd8c', 'c2b09ec4-5113-5452-82bc-4b7bf4329913', 128, 8, 'Sea', 'open_box', 10, 'pta_approved', 54000, 60000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 7a', '66383248-ca78-5558-886a-1e5f006cbd8c', 'c2b09ec4-5113-5452-82bc-4b7bf4329913', 128, 8, 'Sea', 'open_box', 10, 'pta_approved', 54000, 60000, 'available', NULL, 'phone'),
  -- Pixel 6 Pro — Stormy Black, 256GB, PTA, Open Box (3)
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 6 Pro', '8515bded-9f6f-5b54-a9e7-52e47802f162', 'cfcd7daa-af12-51cc-b8c1-ebe240b5c216', 256, 12, 'Stormy Black', 'open_box', 10, 'pta_approved', 50000, 60000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 6 Pro', '8515bded-9f6f-5b54-a9e7-52e47802f162', 'cfcd7daa-af12-51cc-b8c1-ebe240b5c216', 256, 12, 'Stormy Black', 'open_box', 10, 'pta_approved', 50000, 60000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 6 Pro', '8515bded-9f6f-5b54-a9e7-52e47802f162', 'cfcd7daa-af12-51cc-b8c1-ebe240b5c216', 256, 12, 'Stormy Black', 'open_box', 10, 'pta_approved', 50000, 60000, 'available', NULL, 'phone'),
  -- Pixel 6 — Sorta Seafoam, 256GB, PTA, Open Box (3)
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 6', '60567be3-4544-5909-9f56-bfaa80a636c7', '15dad2a4-978d-536a-aaac-fdf79c298344', 256, 8, 'Sorta Seafoam', 'open_box', 10, 'pta_approved', 75000, 85000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 6', '60567be3-4544-5909-9f56-bfaa80a636c7', '15dad2a4-978d-536a-aaac-fdf79c298344', 256, 8, 'Sorta Seafoam', 'open_box', 10, 'pta_approved', 75000, 85000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 6', '60567be3-4544-5909-9f56-bfaa80a636c7', '15dad2a4-978d-536a-aaac-fdf79c298344', 256, 8, 'Sorta Seafoam', 'open_box', 10, 'pta_approved', 75000, 85000, 'available', NULL, 'phone'),
  -- Pixel 6a — Sage, 128GB, PTA, Open Box (3)
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 6a', '3a543a0b-cfd5-58a4-b42c-f027342f57ab', 'd864efa6-69a1-5b66-9a66-9230af30a6a9', 128, 6, 'Sage', 'open_box', 10, 'pta_approved', 47000, 55000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 6a', '3a543a0b-cfd5-58a4-b42c-f027342f57ab', 'd864efa6-69a1-5b66-9a66-9230af30a6a9', 128, 6, 'Sage', 'open_box', 10, 'pta_approved', 47000, 55000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 6a', '3a543a0b-cfd5-58a4-b42c-f027342f57ab', 'd864efa6-69a1-5b66-9a66-9230af30a6a9', 128, 6, 'Sage', 'open_box', 10, 'pta_approved', 47000, 55000, 'available', NULL, 'phone'),
  -- iPhone 11 Pro — Midnight Green, 256GB, PTA, Open Box (1, rating 8)
  ('11111111-1111-1111-1111-111111111111', 'iPhone 11 Pro', 'b66597be-e513-56da-ab0f-6946c9218100', 'fce8ed7a-1b6d-5a15-9bef-ec8aaf1e3cc5', 256, NULL, 'Midnight Green', 'open_box', 8, 'pta_approved', 38000, 65000, 'available', NULL, 'phone'),
  -- iPhone 11 Pro Max — Midnight Green, 64GB, PTA, Open Box (1, rating 9)
  ('11111111-1111-1111-1111-111111111111', 'iPhone 11 Pro Max', '68c0b756-64d4-54a9-8704-66cdf609bcd8', '57c79124-e3da-5eba-a9a3-db00d90299c3', 64, NULL, 'Midnight Green', 'open_box', 9, 'pta_approved', 47000, 75000, 'available', NULL, 'phone'),
  -- iPhone 12 Pro Max — Graphite, 256GB, PTA, Open Box (1)
  ('11111111-1111-1111-1111-111111111111', 'iPhone 12 Pro Max', '02617b09-1b3d-5123-88a9-c29c8de43575', '89ee635e-dbe7-5037-9cff-750f7d4fbd41', 256, NULL, 'Graphite', 'open_box', 10, 'pta_approved', 125000, 145000, 'available', NULL, 'phone'),
  -- iPhone 13 Pro — Sierra Blue, 256GB, PTA, Open Box (1)
  ('11111111-1111-1111-1111-111111111111', 'iPhone 13 Pro', '64c9dc25-2b37-548c-94a9-4f5f8b948c4d', '6a391bf1-0789-5078-a608-b0616f68ce3c', 256, NULL, 'Sierra Blue', 'open_box', 10, 'pta_approved', 152000, 175000, 'available', NULL, 'phone'),
  -- iPhone 13 — Midnight, 128GB, Non-PTA, New (3)
  ('11111111-1111-1111-1111-111111111111', 'iPhone 13', '4f950977-724d-548f-8d1f-a24264ccc853', '4874048a-de73-54c0-a941-4cb2ff8767eb', 128, NULL, 'Midnight', 'new', 10, 'non_pta', 78000, 85000, 'available', NULL, 'phone'),
  ('11111111-1111-1111-1111-111111111111', 'iPhone 13', '4f950977-724d-548f-8d1f-a24264ccc853', '4874048a-de73-54c0-a941-4cb2ff8767eb', 128, NULL, 'Midnight', 'new', 10, 'non_pta', 78000, 85000, 'available', NULL, 'phone'),
  ('11111111-1111-1111-1111-111111111111', 'iPhone 13', '4f950977-724d-548f-8d1f-a24264ccc853', '4874048a-de73-54c0-a941-4cb2ff8767eb', 128, NULL, 'Midnight', 'new', 10, 'non_pta', 78000, 85000, 'available', NULL, 'phone'),
  -- Pixel 7a — Charcoal, 128GB, PTA, Open Box (2)
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 7a', '66383248-ca78-5558-886a-1e5f006cbd8c', 'c2b09ec4-5113-5452-82bc-4b7bf4329913', 128, 8, 'Charcoal', 'open_box', 10, 'pta_approved', 54000, 60000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 7a', '66383248-ca78-5558-886a-1e5f006cbd8c', 'c2b09ec4-5113-5452-82bc-4b7bf4329913', 128, 8, 'Charcoal', 'open_box', 10, 'pta_approved', 54000, 60000, 'available', NULL, 'phone'),
  -- Pixel 7a — Snow, 128GB, PTA, Open Box (7)
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 7a', '66383248-ca78-5558-886a-1e5f006cbd8c', 'c2b09ec4-5113-5452-82bc-4b7bf4329913', 128, 8, 'Snow', 'open_box', 10, 'pta_approved', 54000, 60000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 7a', '66383248-ca78-5558-886a-1e5f006cbd8c', 'c2b09ec4-5113-5452-82bc-4b7bf4329913', 128, 8, 'Snow', 'open_box', 10, 'pta_approved', 54000, 60000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 7a', '66383248-ca78-5558-886a-1e5f006cbd8c', 'c2b09ec4-5113-5452-82bc-4b7bf4329913', 128, 8, 'Snow', 'open_box', 10, 'pta_approved', 54000, 60000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 7a', '66383248-ca78-5558-886a-1e5f006cbd8c', 'c2b09ec4-5113-5452-82bc-4b7bf4329913', 128, 8, 'Snow', 'open_box', 10, 'pta_approved', 54000, 60000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 7a', '66383248-ca78-5558-886a-1e5f006cbd8c', 'c2b09ec4-5113-5452-82bc-4b7bf4329913', 128, 8, 'Snow', 'open_box', 10, 'pta_approved', 54000, 60000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 7a', '66383248-ca78-5558-886a-1e5f006cbd8c', 'c2b09ec4-5113-5452-82bc-4b7bf4329913', 128, 8, 'Snow', 'open_box', 10, 'pta_approved', 54000, 60000, 'available', NULL, 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'Google Pixel 7a', '66383248-ca78-5558-886a-1e5f006cbd8c', 'c2b09ec4-5113-5452-82bc-4b7bf4329913', 128, 8, 'Snow', 'open_box', 10, 'pta_approved', 54000, 60000, 'available', NULL, 'phone');

COMMIT;
