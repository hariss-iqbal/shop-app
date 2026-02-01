-- Receipt Storage and Retrieval Feature (F-005)
-- Permanent storage of all receipts with searchable retrieval functionality

-- Create receipts table
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number VARCHAR(50) NOT NULL UNIQUE,
  transaction_date DATE NOT NULL,
  transaction_time TIME NOT NULL,
  subtotal DECIMAL NOT NULL,
  tax_rate DECIMAL NOT NULL DEFAULT 0,
  tax_amount DECIMAL NOT NULL DEFAULT 0,
  grand_total DECIMAL NOT NULL,
  customer_name VARCHAR(200),
  customer_phone VARCHAR(30),
  customer_email VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  CONSTRAINT receipts_notes_maxlength CHECK (char_length(notes) <= 2000)
);

-- Create receipt_items table for line items
CREATE TABLE receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  item_name VARCHAR(300) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL NOT NULL,
  total DECIMAL NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT receipt_items_quantity_positive CHECK (quantity >= 1)
);

-- Performance indexes
CREATE INDEX idx_receipts_receipt_number ON receipts(receipt_number);
CREATE INDEX idx_receipts_customer_phone ON receipts(customer_phone) WHERE customer_phone IS NOT NULL;
CREATE INDEX idx_receipts_transaction_date ON receipts(transaction_date);
CREATE INDEX idx_receipts_created_at ON receipts(created_at DESC);
CREATE INDEX idx_receipt_items_receipt_id ON receipt_items(receipt_id);
CREATE INDEX idx_receipt_items_sale_id ON receipt_items(sale_id) WHERE sale_id IS NOT NULL;

-- Updated_at trigger for receipts
CREATE TRIGGER trg_receipts_updated_at
  BEFORE UPDATE ON receipts
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- RLS Policies for receipts table
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Authenticated users have full access to receipts
CREATE POLICY "receipts_authenticated_select" ON receipts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "receipts_authenticated_insert" ON receipts
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "receipts_authenticated_update" ON receipts
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "receipts_authenticated_delete" ON receipts
  FOR DELETE TO authenticated USING (true);

-- RLS Policies for receipt_items table
ALTER TABLE receipt_items ENABLE ROW LEVEL SECURITY;

-- Authenticated users have full access to receipt_items
CREATE POLICY "receipt_items_authenticated_select" ON receipt_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "receipt_items_authenticated_insert" ON receipt_items
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "receipt_items_authenticated_update" ON receipt_items
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "receipt_items_authenticated_delete" ON receipt_items
  FOR DELETE TO authenticated USING (true);

-- Add comment for documentation
COMMENT ON TABLE receipts IS 'Permanent storage of all sales receipts with customer and transaction details';
COMMENT ON TABLE receipt_items IS 'Line items for each receipt, linked to sales records';
COMMENT ON COLUMN receipts.receipt_number IS 'Unique human-readable receipt identifier (e.g., RCP-XXXX-XXXX)';
COMMENT ON COLUMN receipt_items.sale_id IS 'Optional link to sales table - allows tracing receipt item back to sale';
