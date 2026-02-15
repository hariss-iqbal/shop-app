-- DigiKhata Stock Import - Google STORE Lahore
-- Imports 29 phone items (56 rows total) from low stock report dated 10 Feb 2026
-- Skipped items: buds pro 1, tab A 9 plus, sheet front glass back cover etc, buds pro 2
-- In-stock: 19 items -> 46 rows (available), Out-of-stock: 10 items -> 10 rows (sold)

-- ============================================================
-- IMPORT PHONES FROM DIGIKHATA STOCK REPORT
-- ============================================================

INSERT INTO phones (id, brand_id, model, storage_gb, condition, cost_price, selling_price, status, pta_status, notes, purchase_date, created_at) VALUES

  -- --------------------------------------------------------
  -- Google Pixel phones
  -- --------------------------------------------------------

  -- #1: pixel 7 pro official (stock: 3, PTA approved)
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 7 Pro', NULL, 'open_box', 0, 0, 'available', 'pta_approved', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 7 Pro', NULL, 'open_box', 0, 0, 'available', 'pta_approved', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 7 Pro', NULL, 'open_box', 0, 0, 'available', 'pta_approved', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),

  -- #2: pixel 7a official (stock: 5, PTA approved)
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 7a', NULL, 'open_box', 0, 0, 'available', 'pta_approved', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 7a', NULL, 'open_box', 0, 0, 'available', 'pta_approved', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 7a', NULL, 'open_box', 0, 0, 'available', 'pta_approved', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 7a', NULL, 'open_box', 0, 0, 'available', 'pta_approved', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 7a', NULL, 'open_box', 0, 0, 'available', 'pta_approved', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),

  -- #3: PIXEL 8 official 128gb/256gb (stock: 3, all 128GB, PTA approved)
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 8', 128, 'open_box', 0, 0, 'available', 'pta_approved', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 8', 128, 'open_box', 0, 0, 'available', 'pta_approved', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 8', 128, 'open_box', 0, 0, 'available', 'pta_approved', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),

  -- #4: Pixel 9 pro XL (stock: 4)
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 9 Pro XL', NULL, 'open_box', 0, 0, 'available', 'non_pta', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 9 Pro XL', NULL, 'open_box', 0, 0, 'available', 'non_pta', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 9 Pro XL', NULL, 'open_box', 0, 0, 'available', 'non_pta', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 9 Pro XL', NULL, 'open_box', 0, 0, 'available', 'non_pta', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),

  -- #5: pixel 6 pro official (stock: 2, PTA approved)
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 6 Pro', NULL, 'open_box', 0, 0, 'available', 'pta_approved', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 6 Pro', NULL, 'open_box', 0, 0, 'available', 'pta_approved', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),

  -- #7: pixel 6 (stock: 4)
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 6', NULL, 'open_box', 0, 0, 'available', 'non_pta', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 6', NULL, 'open_box', 0, 0, 'available', 'non_pta', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 6', NULL, 'open_box', 0, 0, 'available', 'non_pta', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 6', NULL, 'open_box', 0, 0, 'available', 'non_pta', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),

  -- #8: pixel 7 official 128gb/256gb (stock: 4 -> 2x128GB + 2x256GB, PTA approved)
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 7', 128, 'open_box', 0, 0, 'available', 'pta_approved', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 7', 128, 'open_box', 0, 0, 'available', 'pta_approved', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 7', 256, 'open_box', 0, 0, 'available', 'pta_approved', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 7', 256, 'open_box', 0, 0, 'available', 'pta_approved', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),

  -- #11: Pixel 10 (stock: 0 -> sold)
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 10', NULL, 'open_box', 0, 0, 'sold', 'non_pta', 'Out of stock - imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),

  -- #12: pixel 9 pro (stock: 2)
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 9 Pro', NULL, 'open_box', 0, 0, 'available', 'non_pta', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 9 Pro', NULL, 'open_box', 0, 0, 'available', 'non_pta', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),

  -- #13: pixel 8 pro box pack (stock: 1, condition: NEW)
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 8 Pro', NULL, 'new', 0, 0, 'available', 'non_pta', 'Box pack - imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),

  -- #14: pixel 9 (stock: 3)
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 9', NULL, 'open_box', 0, 0, 'available', 'non_pta', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 9', NULL, 'open_box', 0, 0, 'available', 'non_pta', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 9', NULL, 'open_box', 0, 0, 'available', 'non_pta', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),

  -- #15: 10 pro XL (stock: 0 -> sold)
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 10 Pro XL', NULL, 'open_box', 0, 0, 'sold', 'non_pta', 'Out of stock - imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),

  -- #18: pixel 8 pro 128gb official (stock: 2, PTA approved)
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 8 Pro', 128, 'open_box', 0, 0, 'available', 'pta_approved', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 8 Pro', 128, 'open_box', 0, 0, 'available', 'pta_approved', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),

  -- #23: PIXEL 6A OFFICIAL PTA (stock: 1, PTA approved)
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 6a', NULL, 'open_box', 0, 0, 'available', 'pta_approved', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),

  -- #25: pixel fold 8 (stock: 0 -> sold)
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel Fold', NULL, 'open_box', 0, 0, 'sold', 'non_pta', 'Out of stock - imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),

  -- #29: Pixel 8 simple CPID (stock: 2, notes: CPID)
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 8', NULL, 'open_box', 0, 0, 'available', 'non_pta', 'CPID - imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 8', NULL, 'open_box', 0, 0, 'available', 'non_pta', 'CPID - imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),

  -- #30: pixel 10 pro (stock: 0 -> sold)
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 10 Pro', NULL, 'open_box', 0, 0, 'sold', 'non_pta', 'Out of stock - imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),

  -- #31: pixel 8 pro 256 official (stock: 1, PTA approved)
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 8 Pro', 256, 'open_box', 0, 0, 'available', 'pta_approved', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),

  -- #32: Pixel 7 pro non pta (stock: 4)
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 7 Pro', NULL, 'open_box', 0, 0, 'available', 'non_pta', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 7 Pro', NULL, 'open_box', 0, 0, 'available', 'non_pta', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 7 Pro', NULL, 'open_box', 0, 0, 'available', 'non_pta', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 7 Pro', NULL, 'open_box', 0, 0, 'available', 'non_pta', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),

  -- #33: pixel 9a (stock: 0 -> sold)
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Pixel 9a', NULL, 'open_box', 0, 0, 'sold', 'non_pta', 'Out of stock - imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),

  -- --------------------------------------------------------
  -- Samsung Galaxy phones
  -- --------------------------------------------------------

  -- #9: s 25 ultra (stock: 0 -> sold)
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Galaxy S25 Ultra', NULL, 'open_box', 0, 0, 'sold', 'non_pta', 'Out of stock - imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),

  -- #21: s 24 ultra (stock: 1)
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Galaxy S24 Ultra', NULL, 'open_box', 0, 0, 'available', 'non_pta', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),

  -- #26: S 22 ultra (stock: 0 -> sold)
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Galaxy S22 Ultra', NULL, 'open_box', 0, 0, 'sold', 'non_pta', 'Out of stock - imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),

  -- --------------------------------------------------------
  -- Apple iPhones
  -- --------------------------------------------------------

  -- #17: iphone 11 pro (stock: 0 -> sold)
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'iPhone 11 Pro', NULL, 'open_box', 0, 0, 'sold', 'non_pta', 'Out of stock - imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),

  -- #20: iphone 13 pro Max (stock: 0 -> sold)
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'iPhone 13 Pro Max', NULL, 'open_box', 0, 0, 'sold', 'non_pta', 'Out of stock - imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),

  -- #22: Iphone 11 (stock: 0 -> sold)
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'iPhone 11', NULL, 'open_box', 0, 0, 'sold', 'non_pta', 'Out of stock - imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),

  -- #24: iphone 13 pro (stock: 1)
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'iPhone 13 Pro', NULL, 'open_box', 0, 0, 'available', 'non_pta', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),

  -- #28: Iphone 15 pro max (stock: 1)
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'iPhone 15 Pro Max', NULL, 'open_box', 0, 0, 'available', 'non_pta', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),

  -- --------------------------------------------------------
  -- OnePlus phones
  -- --------------------------------------------------------

  -- #27: OnePlus 13t (stock: 2)
  (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'OnePlus 13T', NULL, 'open_box', 0, 0, 'available', 'non_pta', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW()),
  (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'OnePlus 13T', NULL, 'open_box', 0, 0, 'available', 'non_pta', 'Imported from DigiKhata report 10 Feb 2026', CURRENT_DATE, NOW())

ON CONFLICT DO NOTHING;
