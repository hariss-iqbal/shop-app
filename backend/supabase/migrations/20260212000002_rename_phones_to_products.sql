-- Migration: Rename phones -> products, phone_images -> product_images
-- Feature: Rename Phones to Products with Product Type Support
-- Step 2 of 3: Table renames, new columns, FK renames, index renames, constraint renames, trigger renames, RLS policy recreation

-- ============================================================
-- 1. RENAME TABLES
-- ============================================================

ALTER TABLE phones RENAME TO products;
ALTER TABLE phone_images RENAME TO product_images;

-- ============================================================
-- 2. ADD PRODUCT_TYPE COLUMN + ACCESSORY COLUMNS TO PRODUCTS
-- ============================================================

-- Add product_type column (all existing rows are phones)
ALTER TABLE products ADD COLUMN product_type product_type NOT NULL DEFAULT 'phone';
CREATE INDEX idx_products_product_type ON products(product_type);

-- Accessory-specific columns (all nullable, only used for accessory product_type)
ALTER TABLE products ADD COLUMN accessory_category VARCHAR(100);
ALTER TABLE products ADD COLUMN compatible_models TEXT[];
ALTER TABLE products ADD COLUMN material VARCHAR(100);
ALTER TABLE products ADD COLUMN warranty_months INTEGER;
ALTER TABLE products ADD COLUMN weight_grams NUMERIC;
ALTER TABLE products ADD COLUMN dimensions VARCHAR(100);

-- Constraints for accessory columns
ALTER TABLE products ADD CONSTRAINT products_warranty_months_positive
  CHECK (warranty_months IS NULL OR warranty_months >= 0);
ALTER TABLE products ADD CONSTRAINT products_weight_grams_positive
  CHECK (weight_grams IS NULL OR weight_grams >= 0);

-- ============================================================
-- 3. RENAME FK COLUMNS IN DEPENDENT TABLES
-- ============================================================

-- sales: phone_id -> product_id
ALTER TABLE sales RENAME COLUMN phone_id TO product_id;

-- product_images: phone_id -> product_id
ALTER TABLE product_images RENAME COLUMN phone_id TO product_id;

-- location_inventory: phone_id -> product_id
ALTER TABLE location_inventory RENAME COLUMN phone_id TO product_id;

-- inventory_transfer_items: phone_id -> product_id
ALTER TABLE inventory_transfer_items RENAME COLUMN phone_id TO product_id;

-- inventory_deduction_logs: phone_id -> product_id
ALTER TABLE inventory_deduction_logs RENAME COLUMN phone_id TO product_id;

-- refund_items: phone_id -> product_id
ALTER TABLE refund_items RENAME COLUMN phone_id TO product_id;

-- ============================================================
-- 4. RENAME INDEXES — products table (formerly phones)
-- ============================================================

ALTER INDEX idx_phones_status RENAME TO idx_products_status;
ALTER INDEX idx_phones_brand_id RENAME TO idx_products_brand_id;
ALTER INDEX idx_phones_selling_price RENAME TO idx_products_selling_price;
ALTER INDEX idx_phones_created_at RENAME TO idx_products_created_at;
ALTER INDEX idx_phones_status_brand_id RENAME TO idx_products_status_brand_id;
ALTER INDEX idx_phones_status_created_at RENAME TO idx_products_status_created_at;

-- ============================================================
-- 5. RENAME INDEXES — product_images table (formerly phone_images)
-- ============================================================

ALTER INDEX idx_phone_images_phone_id RENAME TO idx_product_images_product_id;
ALTER INDEX idx_phone_images_phone_id_is_primary RENAME TO idx_product_images_product_id_is_primary;
ALTER INDEX idx_phone_images_phone_id_display_order RENAME TO idx_product_images_product_id_display_order;
ALTER INDEX idx_phone_images_public_id RENAME TO idx_product_images_public_id;

-- ============================================================
-- 6. RENAME INDEXES — dependent tables FK indexes
-- ============================================================

ALTER INDEX idx_sales_phone_id RENAME TO idx_sales_product_id;
ALTER INDEX idx_inventory_deduction_logs_phone_id RENAME TO idx_inventory_deduction_logs_product_id;
ALTER INDEX idx_location_inventory_phone RENAME TO idx_location_inventory_product;
ALTER INDEX idx_inventory_transfer_items_phone RENAME TO idx_inventory_transfer_items_product;
ALTER INDEX idx_refund_items_phone_id RENAME TO idx_refund_items_product_id;

-- ============================================================
-- 7. RENAME CONSTRAINTS — products table (formerly phones)
-- ============================================================

ALTER TABLE products RENAME CONSTRAINT phones_description_maxlength TO products_description_maxlength;
ALTER TABLE products RENAME CONSTRAINT phones_notes_maxlength TO products_notes_maxlength;
ALTER TABLE products RENAME CONSTRAINT phones_battery_health_range TO products_battery_health_range;
ALTER TABLE products RENAME CONSTRAINT phones_tax_rate_range TO products_tax_rate_range;
ALTER TABLE products RENAME CONSTRAINT phones_condition_rating_range TO products_condition_rating_range;

-- ============================================================
-- 8. RENAME UNIQUE CONSTRAINT — location_inventory
-- ============================================================

ALTER TABLE location_inventory RENAME CONSTRAINT location_inventory_unique TO location_inventory_product_location_unique;

-- ============================================================
-- 9. RENAME TRIGGERS
-- ============================================================

ALTER TRIGGER trg_phones_updated_at ON products RENAME TO trg_products_updated_at;
ALTER TRIGGER trg_phones_sanitize ON products RENAME TO trg_products_sanitize;

-- ============================================================
-- 10. UPDATE SANITIZATION FUNCTION (rename from sanitize_phone)
-- ============================================================

-- Drop existing trigger first (will recreate with new function)
DROP TRIGGER IF EXISTS trg_products_sanitize ON products;

-- Drop old function
DROP FUNCTION IF EXISTS sanitize_phone();

-- Create new sanitization function
CREATE OR REPLACE FUNCTION sanitize_product()
RETURNS TRIGGER AS $$
BEGIN
  NEW.model := strip_html_tags(NEW.model);
  NEW.description := strip_html_tags(NEW.description);
  NEW.color := strip_html_tags(NEW.color);
  NEW.notes := strip_html_tags(NEW.notes);
  -- Sanitize accessory fields
  NEW.accessory_category := strip_html_tags(NEW.accessory_category);
  NEW.material := strip_html_tags(NEW.material);
  NEW.dimensions := strip_html_tags(NEW.dimensions);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_sanitize
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_product();

-- ============================================================
-- 11. DROP AND RECREATE RLS POLICIES — products table
-- ============================================================

-- Drop old policies (they reference old table name internally)
DROP POLICY IF EXISTS "phones_anon_select" ON products;
DROP POLICY IF EXISTS "phones_authenticated_select" ON products;
DROP POLICY IF EXISTS "phones_authenticated_insert" ON products;
DROP POLICY IF EXISTS "phones_authenticated_update" ON products;
DROP POLICY IF EXISTS "phones_authenticated_delete" ON products;

-- Recreate policies with new names
CREATE POLICY "products_anon_select" ON products
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "products_authenticated_select" ON products
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "products_authenticated_insert" ON products
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "products_authenticated_update" ON products
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "products_authenticated_delete" ON products
  FOR DELETE TO authenticated
  USING (true);

-- ============================================================
-- 12. DROP AND RECREATE RLS POLICIES — product_images table
-- ============================================================

DROP POLICY IF EXISTS "phone_images_anon_select" ON product_images;
DROP POLICY IF EXISTS "phone_images_authenticated_select" ON product_images;
DROP POLICY IF EXISTS "phone_images_authenticated_insert" ON product_images;
DROP POLICY IF EXISTS "phone_images_authenticated_update" ON product_images;
DROP POLICY IF EXISTS "phone_images_authenticated_delete" ON product_images;

CREATE POLICY "product_images_anon_select" ON product_images
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "product_images_authenticated_select" ON product_images
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "product_images_authenticated_insert" ON product_images
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "product_images_authenticated_update" ON product_images
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "product_images_authenticated_delete" ON product_images
  FOR DELETE TO authenticated
  USING (true);

-- ============================================================
-- 13. UPDATE COMMENTS
-- ============================================================

COMMENT ON TABLE products IS 'Products inventory (phones, accessories, tablets, laptops)';
COMMENT ON COLUMN products.product_type IS 'Product type discriminator: phone, accessory, tablet, laptop';
COMMENT ON COLUMN products.accessory_category IS 'Category for accessories (e.g., case, charger, earbuds)';
COMMENT ON COLUMN products.compatible_models IS 'Array of compatible device models for accessories';
COMMENT ON COLUMN products.material IS 'Material/build for accessories';
COMMENT ON COLUMN products.warranty_months IS 'Warranty period in months for accessories';
COMMENT ON COLUMN products.weight_grams IS 'Weight in grams for accessories';
COMMENT ON COLUMN products.dimensions IS 'Dimensions string for accessories (e.g., 10x5x2 cm)';

COMMENT ON TABLE product_images IS 'Product images stored in Cloudinary or Supabase Storage';
