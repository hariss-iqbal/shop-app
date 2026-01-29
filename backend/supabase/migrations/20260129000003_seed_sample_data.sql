-- Seed Sample Data for Phone Shop
-- Adds sample brands, phones, and images for development/demo

-- ============================================================
-- 1. SEED BRANDS
-- ============================================================

INSERT INTO brands (id, name, logo_url, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Apple', 'https://logo.clearbit.com/apple.com', NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Samsung', 'https://logo.clearbit.com/samsung.com', NOW()),
  ('33333333-3333-3333-3333-333333333333', 'Google', 'https://logo.clearbit.com/google.com', NOW()),
  ('44444444-4444-4444-4444-444444444444', 'OnePlus', 'https://logo.clearbit.com/oneplus.com', NOW()),
  ('55555555-5555-5555-5555-555555555555', 'Xiaomi', 'https://logo.clearbit.com/xiaomi.com', NOW())
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. SEED PHONES
-- ============================================================

INSERT INTO phones (id, brand_id, model, description, storage_gb, ram_gb, color, condition, battery_health, cost_price, selling_price, status, purchase_date, created_at) VALUES
  -- Apple iPhones
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001', '11111111-1111-1111-1111-111111111111', 'iPhone 15 Pro Max', 'Latest iPhone with titanium design, A17 Pro chip, and advanced camera system', 256, 8, 'Natural Titanium', 'new', NULL, 999.99, 1199.99, 'available', CURRENT_DATE - INTERVAL '30 days', NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002', '11111111-1111-1111-1111-111111111111', 'iPhone 15 Pro', 'Powerful iPhone with A17 Pro chip and professional camera system', 256, 8, 'Blue Titanium', 'new', NULL, 849.99, 999.99, 'available', CURRENT_DATE - INTERVAL '25 days', NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0003', '11111111-1111-1111-1111-111111111111', 'iPhone 14 Pro Max', 'Excellent condition with Dynamic Island and 48MP camera', 128, 6, 'Deep Purple', 'used', 92, 699.99, 849.99, 'available', CURRENT_DATE - INTERVAL '60 days', NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0004', '11111111-1111-1111-1111-111111111111', 'iPhone 13', 'Great budget iPhone in excellent condition', 128, 4, 'Midnight', 'refurbished', 88, 449.99, 549.99, 'available', CURRENT_DATE - INTERVAL '90 days', NOW()),

  -- Samsung Galaxy
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0001', '22222222-2222-2222-2222-222222222222', 'Galaxy S24 Ultra', 'Premium Android flagship with S Pen and AI features', 512, 12, 'Titanium Gray', 'new', NULL, 999.99, 1199.99, 'available', CURRENT_DATE - INTERVAL '20 days', NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0002', '22222222-2222-2222-2222-222222222222', 'Galaxy S24+', 'Great value flagship with excellent display', 256, 8, 'Cobalt Violet', 'new', NULL, 749.99, 899.99, 'available', CURRENT_DATE - INTERVAL '18 days', NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0003', '22222222-2222-2222-2222-222222222222', 'Galaxy Z Fold 5', 'Innovative foldable phone in like-new condition', 256, 12, 'Phantom Black', 'used', 95, 1499.99, 1699.99, 'available', CURRENT_DATE - INTERVAL '45 days', NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0004', '22222222-2222-2222-2222-222222222222', 'Galaxy A54', 'Great mid-range option with solid specs', 128, 6, 'Awesome Graphite', 'new', NULL, 349.99, 449.99, 'available', CURRENT_DATE - INTERVAL '15 days', NOW()),

  -- Google Pixel
  ('cccccccc-cccc-cccc-cccc-cccccccc0001', '33333333-3333-3333-3333-333333333333', 'Pixel 8 Pro', 'Google flagship with excellent AI camera', 256, 12, 'Obsidian', 'new', NULL, 799.99, 999.99, 'available', CURRENT_DATE - INTERVAL '22 days', NOW()),
  ('cccccccc-cccc-cccc-cccc-cccccccc0002', '33333333-3333-3333-3333-333333333333', 'Pixel 8', 'Compact flagship with great camera', 128, 8, 'Haze', 'new', NULL, 599.99, 699.99, 'available', CURRENT_DATE - INTERVAL '19 days', NOW()),
  ('cccccccc-cccc-cccc-cccc-cccccccc0003', '33333333-3333-3333-3333-333333333333', 'Pixel 7 Pro', 'Excellent condition with amazing camera', 128, 12, 'Lemongrass', 'used', 90, 649.99, 749.99, 'available', CURRENT_DATE - INTERVAL '75 days', NOW()),

  -- OnePlus
  ('dddddddd-dddd-dddd-dddd-dddddddd0001', '44444444-4444-4444-4444-444444444444', 'OnePlus 12', 'Flagship killer with Hasselblad camera', 256, 12, 'Flowy Emerald', 'new', NULL, 699.99, 799.99, 'available', CURRENT_DATE - INTERVAL '17 days', NOW()),
  ('dddddddd-dddd-dddd-dddd-dddddddd0002', '44444444-4444-4444-4444-444444444444', 'OnePlus 11', 'Great value flagship in excellent condition', 256, 12, 'Eternal Green', 'used', 93, 549.99, 649.99, 'available', CURRENT_DATE - INTERVAL '50 days', NOW()),
  ('dddddddd-dddd-dddd-dddd-dddddddd0003', '44444444-4444-4444-4444-444444444444', 'OnePlus Nord CE 4', 'Budget-friendly with solid performance', 256, 8, 'Celadon Marble', 'new', NULL, 299.99, 399.99, 'available', CURRENT_DATE - INTERVAL '12 days', NOW()),

  -- Xiaomi
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeee0001', '55555555-5555-5555-5555-555555555555', 'Xiaomi 14 Ultra', 'Premium flagship with Leica camera', 512, 16, 'Black', 'new', NULL, 999.99, 1099.99, 'available', CURRENT_DATE - INTERVAL '14 days', NOW()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeee0002', '55555555-5555-5555-5555-555555555555', 'Xiaomi 13T Pro', 'Great value flagship with fast charging', 256, 12, 'Alpine Blue', 'new', NULL, 549.99, 649.99, 'available', CURRENT_DATE - INTERVAL '10 days', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. SEED PHONE IMAGES
-- Using placeholder images from Unsplash
-- ============================================================

INSERT INTO phone_images (id, phone_id, image_url, storage_path, is_primary, display_order, created_at) VALUES
  -- iPhone 15 Pro Max
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&h=400&fit=crop', '/phones/iphone-15-pro-max-1.jpg', true, 1, NOW()),
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001', 'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=600&h=400&fit=crop', '/phones/iphone-15-pro-max-2.jpg', false, 2, NOW()),

  -- iPhone 15 Pro
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002', 'https://images.unsplash.com/photo-1696446700465-384f5be9a3d5?w=600&h=400&fit=crop', '/phones/iphone-15-pro-1.jpg', true, 1, NOW()),
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&h=400&fit=crop', '/phones/iphone-15-pro-2.jpg', false, 2, NOW()),

  -- iPhone 14 Pro Max
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0003', 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=600&h=400&fit=crop', '/phones/iphone-14-pro-max-1.jpg', true, 1, NOW()),
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0003', 'https://images.unsplash.com/photo-1663499478441-2a1c0d23674c?w=600&h=400&fit=crop', '/phones/iphone-14-pro-max-2.jpg', false, 2, NOW()),

  -- iPhone 13
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0004', 'https://images.unsplash.com/photo-1632631423063-4b3a06989b98?w=600&h=400&fit=crop', '/phones/iphone-13-1.jpg', true, 1, NOW()),

  -- Galaxy S24 Ultra
  (gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0001', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&h=400&fit=crop', '/phones/galaxy-s24-ultra-1.jpg', true, 1, NOW()),
  (gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0001', 'https://images.unsplash.com/photo-1610044659486-81c2c8bed8c7?w=600&h=400&fit=crop', '/phones/galaxy-s24-ultra-2.jpg', false, 2, NOW()),

  -- Galaxy S24+
  (gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0002', 'https://images.unsplash.com/photo-1698259447837-81769b3587b2?w=600&h=400&fit=crop', '/phones/galaxy-s24-plus-1.jpg', true, 1, NOW()),
  (gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0002', 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=600&h=400&fit=crop', '/phones/galaxy-s24-plus-2.jpg', false, 2, NOW()),

  -- Galaxy Z Fold 5
  (gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0003', 'https://images.unsplash.com/photo-1598327105666-5b89351aff60?w=600&h=400&fit=crop', '/phones/galaxy-z-fold5-1.jpg', true, 1, NOW()),
  (gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0003', 'https://images.unsplash.com/photo-1609252925148-b0f1b515e111?w=600&h=400&fit=crop', '/phones/galaxy-z-fold5-2.jpg', false, 2, NOW()),

  -- Galaxy A54
  (gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0004', 'https://images.unsplash.com/photo-1592899677712-a5a4c28e3f91?w=600&h=400&fit=crop', '/phones/galaxy-a54-1.jpg', true, 1, NOW()),

  -- Pixel 8 Pro
  (gen_random_uuid(), 'cccccccc-cccc-cccc-cccc-cccccccc0001', 'https://images.unsplash.com/photo-1698967769428-a9f279eb3f53?w=600&h=400&fit=crop', '/phones/pixel-8-pro-1.jpg', true, 1, NOW()),
  (gen_random_uuid(), 'cccccccc-cccc-cccc-cccc-cccccccc0001', 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&h=400&fit=crop', '/phones/pixel-8-pro-2.jpg', false, 2, NOW()),

  -- Pixel 8
  (gen_random_uuid(), 'cccccccc-cccc-cccc-cccc-cccccccc0002', 'https://images.unsplash.com/photo-1598327105666-5b89351aff60?w=600&h=400&fit=crop', '/phones/pixel-8-1.jpg', true, 1, NOW()),
  (gen_random_uuid(), 'cccccccc-cccc-cccc-cccc-cccccccc0002', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&h=400&fit=crop', '/phones/pixel-8-2.jpg', false, 2, NOW()),

  -- Pixel 7 Pro
  (gen_random_uuid(), 'cccccccc-cccc-cccc-cccc-cccccccc0003', 'https://images.unsplash.com/photo-1663499478441-2a1c0d23674c?w=600&h=400&fit=crop', '/phones/pixel-7-pro-1.jpg', true, 1, NOW()),
  (gen_random_uuid(), 'cccccccc-cccc-cccc-cccc-cccccccc0003', 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=600&h=400&fit=crop', '/phones/pixel-7-pro-2.jpg', false, 2, NOW()),

  -- OnePlus 12
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-dddddddd0001', 'https://images.unsplash.com/photo-1706197672824-622e9f53f02d?w=600&h=400&fit=crop', '/phones/oneplus-12-1.jpg', true, 1, NOW()),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-dddddddd0001', 'https://images.unsplash.com/photo-1705766599524-a3d6a56f4b38?w=600&h=400&fit=crop', '/phones/oneplus-12-2.jpg', false, 2, NOW()),

  -- OnePlus 11
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-dddddddd0002', 'https://images.unsplash.com/photo-1677825408952-4782e8256610?w=600&h=400&fit=crop', '/phones/oneplus-11-1.jpg', true, 1, NOW()),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-dddddddd0002', 'https://images.unsplash.com/photo-1688649692404-5f1959c8ac91?w=600&h=400&fit=crop', '/phones/oneplus-11-2.jpg', false, 2, NOW()),

  -- OnePlus Nord CE 4
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-dddddddd0003', 'https://images.unsplash.com/photo-1598327105666-5b89351aff60?w=600&h=400&fit=crop', '/phones/oneplus-nord-ce4-1.jpg', true, 1, NOW()),

  -- Xiaomi 14 Ultra
  (gen_random_uuid(), 'eeeeeeee-eeee-eeee-eeee-eeeeeeee0001', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=400&fit=crop', '/phones/xiaomi-14-ultra-1.jpg', true, 1, NOW()),
  (gen_random_uuid(), 'eeeeeeee-eeee-eeee-eeee-eeeeeeee0001', 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d7?w=600&h=400&fit=crop', '/phones/xiaomi-14-ultra-2.jpg', false, 2, NOW()),

  -- Xiaomi 13T Pro
  (gen_random_uuid(), 'eeeeeeee-eeee-eeee-eeee-eeeeeeee0002', 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&h=400&fit=crop', '/phones/xiaomi-13t-pro-1.jpg', true, 1, NOW()),
  (gen_random_uuid(), 'eeeeeeee-eeee-eeee-eeee-eeeeeeee0002', 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&h=400&fit=crop', '/phones/xiaomi-13t-pro-2.jpg', false, 2, NOW())
ON CONFLICT DO NOTHING;
