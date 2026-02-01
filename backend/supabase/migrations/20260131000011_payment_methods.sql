-- Migration: Payment Method Integration
-- Feature: F-018 Payment Method Integration
-- Description: Support multiple payment methods including cash, card, digital wallets, and split payments

-- Create payment method enum type
DO $$ BEGIN
    CREATE TYPE payment_method_type AS ENUM ('cash', 'card', 'upi', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create sale_payments table for storing payment details per sale
-- Supports split payments (multiple payment methods for a single sale)
CREATE TABLE IF NOT EXISTS sale_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    payment_method payment_method_type NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    -- For cash payments
    cash_tendered DECIMAL(12,2),
    change_given DECIMAL(12,2),
    -- For card payments
    card_last_four VARCHAR(4),
    card_type VARCHAR(50),
    -- For UPI/digital wallet payments
    transaction_reference VARCHAR(100),
    -- For 'other' payment method
    payment_description VARCHAR(200),
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT cash_fields_check CHECK (
        payment_method != 'cash' OR (
            (cash_tendered IS NULL OR cash_tendered >= amount) AND
            (change_given IS NULL OR change_given >= 0)
        )
    ),
    CONSTRAINT card_fields_check CHECK (
        payment_method != 'card' OR (
            card_last_four IS NULL OR LENGTH(card_last_four) = 4
        )
    )
);

-- Create index for efficient lookup by sale_id
CREATE INDEX IF NOT EXISTS idx_sale_payments_sale_id ON sale_payments(sale_id);

-- Create index for payment method analysis
CREATE INDEX IF NOT EXISTS idx_sale_payments_method ON sale_payments(payment_method);

-- Enable RLS on sale_payments
ALTER TABLE sale_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for sale_payments (authenticated access only)
CREATE POLICY "sale_payments_select_authenticated" ON sale_payments
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "sale_payments_insert_authenticated" ON sale_payments
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "sale_payments_update_authenticated" ON sale_payments
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "sale_payments_delete_authenticated" ON sale_payments
    FOR DELETE TO authenticated
    USING (true);

-- Add payment summary columns to sales table for quick access
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_summary JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS is_split_payment BOOLEAN DEFAULT false;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS primary_payment_method payment_method_type;

-- Create index for filtering by payment method
CREATE INDEX IF NOT EXISTS idx_sales_primary_payment_method ON sales(primary_payment_method);

-- Function to calculate change for cash payments
CREATE OR REPLACE FUNCTION calculate_cash_change(
    p_cash_tendered DECIMAL,
    p_amount_due DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    IF p_cash_tendered IS NULL OR p_cash_tendered < p_amount_due THEN
        RETURN 0;
    END IF;
    RETURN p_cash_tendered - p_amount_due;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update sales payment summary after payment changes
CREATE OR REPLACE FUNCTION update_sales_payment_summary()
RETURNS TRIGGER AS $$
DECLARE
    v_payment_count INTEGER;
    v_primary_method payment_method_type;
    v_payment_summary JSONB;
BEGIN
    -- Get payment summary for this sale
    SELECT
        COUNT(*),
        (SELECT payment_method FROM sale_payments WHERE sale_id = COALESCE(NEW.sale_id, OLD.sale_id) ORDER BY amount DESC LIMIT 1),
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'method', payment_method,
                    'amount', amount,
                    'cardLastFour', card_last_four,
                    'transactionReference', transaction_reference
                )
            ),
            '[]'::jsonb
        )
    INTO v_payment_count, v_primary_method, v_payment_summary
    FROM sale_payments
    WHERE sale_id = COALESCE(NEW.sale_id, OLD.sale_id);

    -- Update the sales table
    UPDATE sales
    SET
        payment_summary = v_payment_summary,
        is_split_payment = v_payment_count > 1,
        primary_payment_method = v_primary_method
    WHERE id = COALESCE(NEW.sale_id, OLD.sale_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update payment summary on sale_payments changes
DROP TRIGGER IF EXISTS trg_update_sales_payment_summary ON sale_payments;
CREATE TRIGGER trg_update_sales_payment_summary
    AFTER INSERT OR UPDATE OR DELETE ON sale_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_sales_payment_summary();

-- Add payment_summary column to receipts table
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS payment_summary JSONB DEFAULT '[]'::jsonb;

-- Create receipt_payments table for storing payment details on receipts
CREATE TABLE IF NOT EXISTS receipt_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    payment_method payment_method_type NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    cash_tendered DECIMAL(12,2),
    change_given DECIMAL(12,2),
    card_last_four VARCHAR(4),
    card_type VARCHAR(50),
    transaction_reference VARCHAR(100),
    payment_description VARCHAR(200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for efficient lookup by receipt_id
CREATE INDEX IF NOT EXISTS idx_receipt_payments_receipt_id ON receipt_payments(receipt_id);

-- Enable RLS on receipt_payments
ALTER TABLE receipt_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for receipt_payments
CREATE POLICY "receipt_payments_select_authenticated" ON receipt_payments
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "receipt_payments_insert_authenticated" ON receipt_payments
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "receipt_payments_update_authenticated" ON receipt_payments
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "receipt_payments_delete_authenticated" ON receipt_payments
    FOR DELETE TO authenticated
    USING (true);

-- Function to update receipt payment summary after payment changes
CREATE OR REPLACE FUNCTION update_receipt_payment_summary()
RETURNS TRIGGER AS $$
DECLARE
    v_payment_summary JSONB;
BEGIN
    SELECT
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'method', payment_method,
                    'amount', amount,
                    'cashTendered', cash_tendered,
                    'changeGiven', change_given,
                    'cardLastFour', card_last_four,
                    'transactionReference', transaction_reference
                )
            ),
            '[]'::jsonb
        )
    INTO v_payment_summary
    FROM receipt_payments
    WHERE receipt_id = COALESCE(NEW.receipt_id, OLD.receipt_id);

    UPDATE receipts
    SET payment_summary = v_payment_summary
    WHERE id = COALESCE(NEW.receipt_id, OLD.receipt_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update payment summary on receipt_payments changes
DROP TRIGGER IF EXISTS trg_update_receipt_payment_summary ON receipt_payments;
CREATE TRIGGER trg_update_receipt_payment_summary
    AFTER INSERT OR UPDATE OR DELETE ON receipt_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_receipt_payment_summary();

-- Grant execute permission on the calculate_cash_change function
GRANT EXECUTE ON FUNCTION calculate_cash_change(DECIMAL, DECIMAL) TO authenticated;

COMMENT ON TABLE sale_payments IS 'Payment details for each sale, supports split payments across multiple methods';
COMMENT ON TABLE receipt_payments IS 'Payment details stored on receipts for display purposes';
COMMENT ON COLUMN sale_payments.payment_method IS 'Payment method: cash, card, upi, or other';
COMMENT ON COLUMN sale_payments.cash_tendered IS 'For cash payments: amount given by customer';
COMMENT ON COLUMN sale_payments.change_given IS 'For cash payments: change returned to customer';
COMMENT ON COLUMN sale_payments.card_last_four IS 'For card payments: last 4 digits of card number';
COMMENT ON COLUMN sale_payments.transaction_reference IS 'For UPI/digital: transaction ID or reference number';
COMMENT ON COLUMN sales.is_split_payment IS 'True if sale was paid using multiple payment methods';
COMMENT ON COLUMN sales.primary_payment_method IS 'The payment method used for the largest amount';
