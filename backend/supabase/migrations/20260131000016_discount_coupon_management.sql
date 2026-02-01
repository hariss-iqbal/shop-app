-- Migration: Discount and Coupon Management
-- Feature: F-023 Discount and Coupon Management
-- Description: Apply discounts and coupons to sales transactions with validation and tracking
--
-- Acceptance Criteria:
-- - Given admin is processing sale, when 'Apply Discount' button is clicked, then options for percentage or fixed amount are displayed
-- - Given discount amount exceeds 10%, when admin applies discount, then manager approval is prompted
-- - Given customer enters coupon code 'SAVE20', when code is applied, then system validates code is active and applies 20% discount
-- - Given coupon code has usage limit of 100, when code has been used 100 times, then subsequent attempts are rejected with 'Coupon expired' message
-- - Given discount is applied, when receipt is generated, then original price, discount amount, and final price are clearly shown

-- =====================================================
-- ENUMS
-- =====================================================

-- Discount Type Enum
DO $$ BEGIN
  CREATE TYPE discount_type AS ENUM ('percentage', 'fixed_amount');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE discount_type IS 'Type of discount: percentage or fixed_amount';

-- Coupon Status Enum
DO $$ BEGIN
  CREATE TYPE coupon_status AS ENUM ('active', 'expired', 'disabled', 'depleted');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE coupon_status IS 'Status of a coupon: active, expired, disabled, or depleted';

-- =====================================================
-- TABLES
-- =====================================================

-- Discount Configuration Table (Singleton)
CREATE TABLE IF NOT EXISTS discount_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_approval_threshold DECIMAL(5,2) NOT NULL DEFAULT 10.00 CHECK (manager_approval_threshold >= 0 AND manager_approval_threshold <= 100),
  max_discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 50.00 CHECK (max_discount_percentage >= 0 AND max_discount_percentage <= 100),
  max_discount_amount DECIMAL(12,2) NOT NULL DEFAULT 10000.00 CHECK (max_discount_amount >= 0),
  discounts_enabled BOOLEAN NOT NULL DEFAULT true,
  coupons_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

COMMENT ON TABLE discount_configs IS 'Singleton configuration for discount policies. Feature: F-023';
COMMENT ON COLUMN discount_configs.manager_approval_threshold IS 'Discount percentage threshold requiring manager approval (default 10%)';
COMMENT ON COLUMN discount_configs.max_discount_percentage IS 'Maximum allowed discount percentage';
COMMENT ON COLUMN discount_configs.max_discount_amount IS 'Maximum allowed fixed discount amount';
COMMENT ON COLUMN discount_configs.discounts_enabled IS 'Whether manual discounts are enabled globally';
COMMENT ON COLUMN discount_configs.coupons_enabled IS 'Whether coupon codes are enabled globally';

-- Coupons Table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(500),
  discount_type discount_type NOT NULL,
  discount_value DECIMAL(12,2) NOT NULL CHECK (discount_value >= 0),
  min_purchase_amount DECIMAL(12,2) CHECK (min_purchase_amount IS NULL OR min_purchase_amount >= 0),
  max_discount_amount DECIMAL(12,2) CHECK (max_discount_amount IS NULL OR max_discount_amount >= 0),
  max_redemptions INTEGER CHECK (max_redemptions IS NULL OR max_redemptions >= 1),
  current_redemptions INTEGER NOT NULL DEFAULT 0 CHECK (current_redemptions >= 0),
  valid_from DATE NOT NULL,
  valid_until DATE,
  status coupon_status NOT NULL DEFAULT 'active',
  requires_manager_approval BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,

  CONSTRAINT valid_date_range CHECK (valid_until IS NULL OR valid_until >= valid_from),
  CONSTRAINT valid_percentage CHECK (
    discount_type != 'percentage' OR (discount_value >= 0 AND discount_value <= 100)
  )
);

COMMENT ON TABLE coupons IS 'Discount coupons that can be applied to sales. Feature: F-023';
COMMENT ON COLUMN coupons.code IS 'Unique coupon code (e.g., SAVE20)';
COMMENT ON COLUMN coupons.description IS 'Description of the coupon for admin reference';
COMMENT ON COLUMN coupons.discount_type IS 'Type of discount: percentage or fixed_amount';
COMMENT ON COLUMN coupons.discount_value IS 'Value of discount (percentage or fixed amount)';
COMMENT ON COLUMN coupons.min_purchase_amount IS 'Minimum purchase amount required to use this coupon';
COMMENT ON COLUMN coupons.max_discount_amount IS 'Maximum discount amount cap (for percentage discounts)';
COMMENT ON COLUMN coupons.max_redemptions IS 'Maximum number of times this coupon can be used (NULL = unlimited)';
COMMENT ON COLUMN coupons.current_redemptions IS 'Current number of times this coupon has been used';
COMMENT ON COLUMN coupons.valid_from IS 'Date from which coupon is valid';
COMMENT ON COLUMN coupons.valid_until IS 'Date until which coupon is valid (NULL = no expiry)';
COMMENT ON COLUMN coupons.status IS 'Current status of the coupon';
COMMENT ON COLUMN coupons.requires_manager_approval IS 'Whether this coupon requires manager approval to apply';

-- Sale Discounts Table (tracks discounts applied to sales)
CREATE TABLE IF NOT EXISTS sale_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
  discount_type discount_type NOT NULL,
  discount_value DECIMAL(12,2) NOT NULL CHECK (discount_value >= 0),
  discount_amount DECIMAL(12,2) NOT NULL CHECK (discount_amount >= 0),
  original_price DECIMAL(12,2) NOT NULL CHECK (original_price >= 0),
  final_price DECIMAL(12,2) NOT NULL CHECK (final_price >= 0),
  applied_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  manager_approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  manager_approval_reason VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_final_price CHECK (final_price <= original_price)
);

COMMENT ON TABLE sale_discounts IS 'Records discounts applied to individual sales. Feature: F-023';
COMMENT ON COLUMN sale_discounts.sale_id IS 'Reference to the sale';
COMMENT ON COLUMN sale_discounts.coupon_id IS 'Reference to the coupon used (if any)';
COMMENT ON COLUMN sale_discounts.discount_type IS 'Type of discount applied';
COMMENT ON COLUMN sale_discounts.discount_value IS 'Original discount value (percentage or fixed amount)';
COMMENT ON COLUMN sale_discounts.discount_amount IS 'Calculated discount amount in currency';
COMMENT ON COLUMN sale_discounts.original_price IS 'Original price before discount';
COMMENT ON COLUMN sale_discounts.final_price IS 'Final price after discount';
COMMENT ON COLUMN sale_discounts.applied_by IS 'User who applied the discount';
COMMENT ON COLUMN sale_discounts.manager_approved_by IS 'Manager who approved the discount (if required)';
COMMENT ON COLUMN sale_discounts.manager_approval_reason IS 'Reason provided by manager for approval';

-- Coupon Redemptions Table (audit trail)
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  discount_amount DECIMAL(12,2) NOT NULL CHECK (discount_amount >= 0),
  redeemed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_coupon_sale UNIQUE (coupon_id, sale_id)
);

COMMENT ON TABLE coupon_redemptions IS 'Tracks individual coupon redemptions for audit and analytics. Feature: F-023';
COMMENT ON COLUMN coupon_redemptions.coupon_id IS 'Reference to the redeemed coupon';
COMMENT ON COLUMN coupon_redemptions.sale_id IS 'Reference to the sale where coupon was used';
COMMENT ON COLUMN coupon_redemptions.discount_amount IS 'Discount amount applied in this redemption';
COMMENT ON COLUMN coupon_redemptions.redeemed_by IS 'User who redeemed the coupon';
COMMENT ON COLUMN coupon_redemptions.redeemed_at IS 'Timestamp of redemption';

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_from ON coupons(valid_from);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_until ON coupons(valid_until);
CREATE INDEX IF NOT EXISTS idx_sale_discounts_sale_id ON sale_discounts(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_discounts_coupon_id ON sale_discounts(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon_id ON coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_sale_id ON coupon_redemptions(sale_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_redeemed_at ON coupon_redemptions(redeemed_at);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated_at trigger for discount_configs
CREATE OR REPLACE TRIGGER trg_discount_configs_updated_at
  BEFORE UPDATE ON discount_configs
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Updated_at trigger for coupons
CREATE OR REPLACE TRIGGER trg_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE discount_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Discount Configs: Authenticated users can read and update
DROP POLICY IF EXISTS "discount_configs_select_authenticated" ON discount_configs;
CREATE POLICY "discount_configs_select_authenticated" ON discount_configs
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "discount_configs_update_authenticated" ON discount_configs;
CREATE POLICY "discount_configs_update_authenticated" ON discount_configs
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Coupons: Authenticated users have full access
DROP POLICY IF EXISTS "coupons_select_authenticated" ON coupons;
CREATE POLICY "coupons_select_authenticated" ON coupons
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "coupons_insert_authenticated" ON coupons;
CREATE POLICY "coupons_insert_authenticated" ON coupons
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "coupons_update_authenticated" ON coupons;
CREATE POLICY "coupons_update_authenticated" ON coupons
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "coupons_delete_authenticated" ON coupons;
CREATE POLICY "coupons_delete_authenticated" ON coupons
  FOR DELETE TO authenticated USING (true);

-- Sale Discounts: Authenticated users have full access
DROP POLICY IF EXISTS "sale_discounts_select_authenticated" ON sale_discounts;
CREATE POLICY "sale_discounts_select_authenticated" ON sale_discounts
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "sale_discounts_insert_authenticated" ON sale_discounts;
CREATE POLICY "sale_discounts_insert_authenticated" ON sale_discounts
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "sale_discounts_update_authenticated" ON sale_discounts;
CREATE POLICY "sale_discounts_update_authenticated" ON sale_discounts
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "sale_discounts_delete_authenticated" ON sale_discounts;
CREATE POLICY "sale_discounts_delete_authenticated" ON sale_discounts
  FOR DELETE TO authenticated USING (true);

-- Coupon Redemptions: Authenticated users have full access
DROP POLICY IF EXISTS "coupon_redemptions_select_authenticated" ON coupon_redemptions;
CREATE POLICY "coupon_redemptions_select_authenticated" ON coupon_redemptions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "coupon_redemptions_insert_authenticated" ON coupon_redemptions;
CREATE POLICY "coupon_redemptions_insert_authenticated" ON coupon_redemptions
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "coupon_redemptions_delete_authenticated" ON coupon_redemptions;
CREATE POLICY "coupon_redemptions_delete_authenticated" ON coupon_redemptions
  FOR DELETE TO authenticated USING (true);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to validate a coupon code
CREATE OR REPLACE FUNCTION validate_coupon(
  p_coupon_code VARCHAR,
  p_purchase_amount DECIMAL(12,2)
) RETURNS JSONB AS $$
DECLARE
  v_coupon RECORD;
  v_config RECORD;
  v_discount_amount DECIMAL(12,2);
  v_final_price DECIMAL(12,2);
BEGIN
  -- Get discount config
  SELECT * INTO v_config FROM discount_configs LIMIT 1;

  -- Check if coupons are enabled
  IF v_config IS NULL OR NOT v_config.coupons_enabled THEN
    RETURN jsonb_build_object(
      'isValid', false,
      'error', 'Coupons are currently disabled',
      'requiresManagerApproval', false
    );
  END IF;

  -- Find the coupon
  SELECT * INTO v_coupon FROM coupons
  WHERE UPPER(code) = UPPER(p_coupon_code);

  IF v_coupon IS NULL THEN
    RETURN jsonb_build_object(
      'isValid', false,
      'error', 'Invalid coupon code',
      'requiresManagerApproval', false
    );
  END IF;

  -- Check status
  IF v_coupon.status != 'active' THEN
    IF v_coupon.status = 'depleted' THEN
      RETURN jsonb_build_object(
        'isValid', false,
        'error', 'Coupon expired',
        'requiresManagerApproval', false
      );
    ELSE
      RETURN jsonb_build_object(
        'isValid', false,
        'error', 'Coupon is ' || v_coupon.status,
        'requiresManagerApproval', false
      );
    END IF;
  END IF;

  -- Check validity dates
  IF v_coupon.valid_from > CURRENT_DATE THEN
    RETURN jsonb_build_object(
      'isValid', false,
      'error', 'Coupon is not yet valid',
      'requiresManagerApproval', false
    );
  END IF;

  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < CURRENT_DATE THEN
    RETURN jsonb_build_object(
      'isValid', false,
      'error', 'Coupon has expired',
      'requiresManagerApproval', false
    );
  END IF;

  -- Check redemption limit
  IF v_coupon.max_redemptions IS NOT NULL AND v_coupon.current_redemptions >= v_coupon.max_redemptions THEN
    RETURN jsonb_build_object(
      'isValid', false,
      'error', 'Coupon expired',
      'requiresManagerApproval', false
    );
  END IF;

  -- Check minimum purchase amount
  IF v_coupon.min_purchase_amount IS NOT NULL AND p_purchase_amount < v_coupon.min_purchase_amount THEN
    RETURN jsonb_build_object(
      'isValid', false,
      'error', 'Minimum purchase amount of ' || v_coupon.min_purchase_amount || ' required',
      'requiresManagerApproval', false
    );
  END IF;

  -- Calculate discount amount
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount_amount := p_purchase_amount * (v_coupon.discount_value / 100);
    -- Apply max discount cap if set
    IF v_coupon.max_discount_amount IS NOT NULL AND v_discount_amount > v_coupon.max_discount_amount THEN
      v_discount_amount := v_coupon.max_discount_amount;
    END IF;
  ELSE
    v_discount_amount := LEAST(v_coupon.discount_value, p_purchase_amount);
  END IF;

  v_final_price := p_purchase_amount - v_discount_amount;

  RETURN jsonb_build_object(
    'isValid', true,
    'couponId', v_coupon.id,
    'code', v_coupon.code,
    'description', v_coupon.description,
    'discountType', v_coupon.discount_type::text,
    'discountValue', v_coupon.discount_value,
    'discountAmount', v_discount_amount,
    'finalPrice', v_final_price,
    'requiresManagerApproval', v_coupon.requires_manager_approval,
    'remainingRedemptions', CASE
      WHEN v_coupon.max_redemptions IS NULL THEN NULL
      ELSE v_coupon.max_redemptions - v_coupon.current_redemptions
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_coupon IS 'Validates a coupon code and returns discount details. Feature: F-023';

-- Function to apply a discount to a sale
CREATE OR REPLACE FUNCTION apply_discount_to_sale(
  p_sale_id UUID,
  p_coupon_id UUID,
  p_discount_type discount_type,
  p_discount_value DECIMAL(12,2),
  p_original_price DECIMAL(12,2),
  p_applied_by UUID DEFAULT NULL,
  p_manager_approved_by UUID DEFAULT NULL,
  p_manager_approval_reason VARCHAR(500) DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_discount_amount DECIMAL(12,2);
  v_final_price DECIMAL(12,2);
  v_config RECORD;
  v_coupon RECORD;
  v_discount_id UUID;
  v_requires_approval BOOLEAN := false;
  v_discount_percentage DECIMAL(5,2);
BEGIN
  -- Get discount config
  SELECT * INTO v_config FROM discount_configs LIMIT 1;

  -- Check if discounts are enabled
  IF v_config IS NOT NULL AND NOT v_config.discounts_enabled THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Discounts are currently disabled',
      'requiresManagerApproval', false
    );
  END IF;

  -- Calculate discount amount
  IF p_discount_type = 'percentage' THEN
    -- Check max percentage
    IF v_config IS NOT NULL AND p_discount_value > v_config.max_discount_percentage THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Discount percentage exceeds maximum allowed (' || v_config.max_discount_percentage || '%)',
        'requiresManagerApproval', false
      );
    END IF;

    v_discount_amount := p_original_price * (p_discount_value / 100);
    v_discount_percentage := p_discount_value;
  ELSE
    -- Check max amount
    IF v_config IS NOT NULL AND p_discount_value > v_config.max_discount_amount THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Discount amount exceeds maximum allowed (' || v_config.max_discount_amount || ')',
        'requiresManagerApproval', false
      );
    END IF;

    v_discount_amount := LEAST(p_discount_value, p_original_price);
    v_discount_percentage := (v_discount_amount / p_original_price) * 100;
  END IF;

  v_final_price := p_original_price - v_discount_amount;

  -- Check if manager approval is required
  IF v_config IS NOT NULL AND v_discount_percentage > v_config.manager_approval_threshold THEN
    v_requires_approval := true;
  END IF;

  -- If coupon is provided, check if it requires approval
  IF p_coupon_id IS NOT NULL THEN
    SELECT * INTO v_coupon FROM coupons WHERE id = p_coupon_id;
    IF v_coupon IS NOT NULL AND v_coupon.requires_manager_approval THEN
      v_requires_approval := true;
    END IF;
  END IF;

  -- If approval required but not provided, return error
  IF v_requires_approval AND p_manager_approved_by IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'requiresManagerApproval', true,
      'discountPercentage', v_discount_percentage,
      'threshold', v_config.manager_approval_threshold,
      'discountAmount', v_discount_amount,
      'finalPrice', v_final_price,
      'error', 'Discount exceeds ' || v_config.manager_approval_threshold || '%. Manager approval required.'
    );
  END IF;

  -- Create sale discount record
  INSERT INTO sale_discounts (
    sale_id,
    coupon_id,
    discount_type,
    discount_value,
    discount_amount,
    original_price,
    final_price,
    applied_by,
    manager_approved_by,
    manager_approval_reason
  ) VALUES (
    p_sale_id,
    p_coupon_id,
    p_discount_type,
    p_discount_value,
    v_discount_amount,
    p_original_price,
    v_final_price,
    p_applied_by,
    p_manager_approved_by,
    p_manager_approval_reason
  ) RETURNING id INTO v_discount_id;

  -- If coupon was used, create redemption record and increment counter
  IF p_coupon_id IS NOT NULL THEN
    INSERT INTO coupon_redemptions (
      coupon_id,
      sale_id,
      discount_amount,
      redeemed_by
    ) VALUES (
      p_coupon_id,
      p_sale_id,
      v_discount_amount,
      p_applied_by
    );

    -- Increment coupon redemption count
    UPDATE coupons
    SET current_redemptions = current_redemptions + 1,
        status = CASE
          WHEN max_redemptions IS NOT NULL AND current_redemptions + 1 >= max_redemptions THEN 'depleted'::coupon_status
          ELSE status
        END
    WHERE id = p_coupon_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'discountId', v_discount_id,
    'saleId', p_sale_id,
    'originalPrice', p_original_price,
    'discountAmount', v_discount_amount,
    'finalPrice', v_final_price,
    'requiresManagerApproval', false,
    'managerApproved', p_manager_approved_by IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION apply_discount_to_sale IS 'Applies a discount to a sale with validation and tracking. Feature: F-023';

-- Function to get coupon statistics
CREATE OR REPLACE FUNCTION get_coupon_statistics(
  p_coupon_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF p_coupon_id IS NOT NULL THEN
    -- Get stats for specific coupon
    SELECT jsonb_build_object(
      'couponId', c.id,
      'code', c.code,
      'totalRedemptions', c.current_redemptions,
      'remainingRedemptions', CASE WHEN c.max_redemptions IS NULL THEN NULL ELSE c.max_redemptions - c.current_redemptions END,
      'totalDiscountGiven', COALESCE(SUM(cr.discount_amount), 0),
      'averageDiscount', COALESCE(AVG(cr.discount_amount), 0),
      'lastRedemption', MAX(cr.redeemed_at)
    )
    INTO v_result
    FROM coupons c
    LEFT JOIN coupon_redemptions cr ON c.id = cr.coupon_id
    WHERE c.id = p_coupon_id
    GROUP BY c.id, c.code, c.current_redemptions, c.max_redemptions;
  ELSE
    -- Get overall stats
    SELECT jsonb_build_object(
      'totalCoupons', (SELECT COUNT(*) FROM coupons),
      'activeCoupons', (SELECT COUNT(*) FROM coupons WHERE status = 'active'),
      'expiredCoupons', (SELECT COUNT(*) FROM coupons WHERE status = 'expired'),
      'depletedCoupons', (SELECT COUNT(*) FROM coupons WHERE status = 'depleted'),
      'disabledCoupons', (SELECT COUNT(*) FROM coupons WHERE status = 'disabled'),
      'totalRedemptions', (SELECT COALESCE(SUM(current_redemptions), 0) FROM coupons),
      'totalDiscountGiven', (SELECT COALESCE(SUM(discount_amount), 0) FROM coupon_redemptions)
    )
    INTO v_result;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_coupon_statistics IS 'Returns coupon usage statistics. Feature: F-023';

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert default discount configuration if not exists
INSERT INTO discount_configs (
  manager_approval_threshold,
  max_discount_percentage,
  max_discount_amount,
  discounts_enabled,
  coupons_enabled
)
SELECT
  10.00,  -- 10% threshold for manager approval
  50.00,  -- Max 50% discount
  10000.00,  -- Max $10,000 fixed discount
  true,
  true
WHERE NOT EXISTS (SELECT 1 FROM discount_configs LIMIT 1);

-- Insert sample coupons for testing
INSERT INTO coupons (code, description, discount_type, discount_value, max_redemptions, valid_from, valid_until, status)
SELECT * FROM (VALUES
  ('SAVE20', '20% off your purchase', 'percentage'::discount_type, 20.00, 100, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 'active'::coupon_status),
  ('FLAT50', '$50 off orders over $200', 'fixed_amount'::discount_type, 50.00, NULL, CURRENT_DATE, NULL, 'active'::coupon_status),
  ('WELCOME10', '10% off for new customers', 'percentage'::discount_type, 10.00, 500, CURRENT_DATE, CURRENT_DATE + INTERVAL '6 months', 'active'::coupon_status)
) AS v(code, description, discount_type, discount_value, max_redemptions, valid_from, valid_until, status)
WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE code IN ('SAVE20', 'FLAT50', 'WELCOME10'));

-- Update sample coupons to set min_purchase_amount for FLAT50
UPDATE coupons
SET min_purchase_amount = 200.00
WHERE code = 'FLAT50' AND min_purchase_amount IS NULL;
