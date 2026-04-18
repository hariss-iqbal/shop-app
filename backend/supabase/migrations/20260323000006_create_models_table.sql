-- Migration: Create models table
-- Normalized model names — each model belongs to a brand.
-- Products reference models via model_id FK.

-- ============================================================
-- 1. CREATE MODELS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id),
  name VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  CONSTRAINT models_brand_name_unique UNIQUE (brand_id, name)
);

-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_models_brand_id ON models(brand_id);
CREATE INDEX IF NOT EXISTS idx_models_name_trgm ON models USING gin(name gin_trgm_ops);

-- ============================================================
-- 3. TRIGGER
-- ============================================================

CREATE TRIGGER trg_models_updated_at
  BEFORE UPDATE ON models
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 4. RLS
-- ============================================================

ALTER TABLE models ENABLE ROW LEVEL SECURITY;

CREATE POLICY models_anon_select ON models FOR SELECT TO anon USING (true);
CREATE POLICY models_auth_select ON models FOR SELECT TO authenticated USING (true);
CREATE POLICY models_auth_insert ON models FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY models_auth_update ON models FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY models_auth_delete ON models FOR DELETE TO authenticated USING (true);

-- ============================================================
-- 5. COMMENTS
-- ============================================================

COMMENT ON TABLE models IS 'Normalized product models — each model belongs to a brand';
COMMENT ON COLUMN models.brand_id IS 'FK to brands table';
COMMENT ON COLUMN models.name IS 'Canonical model name from GSM Arena (e.g. Pixel 7a, Galaxy S24 Ultra)';

-- ============================================================
-- 6. ADD model_id TO PRODUCTS
-- ============================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS model_id UUID REFERENCES models(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_products_model_id ON products(model_id);
COMMENT ON COLUMN products.model_id IS 'FK to models table — populated by GSM Arena script';
