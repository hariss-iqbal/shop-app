-- Migration: Add variant reference to purchase order items
-- Allows PO items to link to specific variants for structured receiving

DO $$ BEGIN
  ALTER TABLE purchase_order_items
    ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES variants(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS storage_gb INTEGER;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS pta_status pta_status;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS condition product_condition;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS color VARCHAR(50);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_variant_id ON purchase_order_items(variant_id);
