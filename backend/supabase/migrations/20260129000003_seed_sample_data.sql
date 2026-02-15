-- Seed Brands for Phone Shop
-- Phone/image sample data removed — real inventory is in 20260211000001_import_digikhata_stock.sql

-- ============================================================
-- 1. SEED BRANDS (required by import migrations)
-- ============================================================

INSERT INTO brands (id, name, logo_url, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Apple', 'https://logo.clearbit.com/apple.com', NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Samsung', 'https://logo.clearbit.com/samsung.com', NOW()),
  ('33333333-3333-3333-3333-333333333333', 'Google', 'https://logo.clearbit.com/google.com', NOW()),
  ('44444444-4444-4444-4444-444444444444', 'OnePlus', 'https://logo.clearbit.com/oneplus.com', NOW()),
  ('55555555-5555-5555-5555-555555555555', 'Xiaomi', 'https://logo.clearbit.com/xiaomi.com', NOW())
ON CONFLICT (name) DO NOTHING;
