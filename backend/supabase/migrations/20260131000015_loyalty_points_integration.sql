-- Migration: Loyalty Points Integration
-- Feature: F-022
-- Description: Award and redeem loyalty points on sales transactions to encourage customer retention
-- Acceptance Criteria:
--   - Award points based on purchase amount and configurable points rate
--   - Redeem points with configurable redemption rate (e.g., 100 points = $1)
--   - Support tier-based multipliers (e.g., Gold tier = 1.5x points)
--   - Display loyalty balance and points earned on receipts
--   - Track complete transaction history with points earned/redeemed

-- Create loyalty_tier enum for customer tier levels
DO $$ BEGIN
  CREATE TYPE loyalty_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create loyalty_transaction_type enum for tracking point transactions
DO $$ BEGIN
  CREATE TYPE loyalty_transaction_type AS ENUM ('earned', 'redeemed', 'expired', 'adjusted', 'bonus');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create loyalty_program_config table (singleton configuration)
CREATE TABLE IF NOT EXISTS loyalty_program_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  -- Points earning configuration
  points_per_dollar DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  -- Points redemption configuration
  redemption_rate DECIMAL(10,4) NOT NULL DEFAULT 0.01, -- $0.01 per point (100 points = $1)
  min_points_to_redeem INTEGER NOT NULL DEFAULT 100,
  max_redemption_percent DECIMAL(5,2) NOT NULL DEFAULT 100.00, -- Max % of purchase that can be paid with points
  -- Tier thresholds (cumulative points needed to reach tier)
  silver_threshold INTEGER NOT NULL DEFAULT 1000,
  gold_threshold INTEGER NOT NULL DEFAULT 5000,
  platinum_threshold INTEGER NOT NULL DEFAULT 10000,
  -- Tier multipliers (multiplied against base points earned)
  bronze_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  silver_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.25,
  gold_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.50,
  platinum_multiplier DECIMAL(3,2) NOT NULL DEFAULT 2.00,
  -- Points expiration (0 = never expire)
  points_expiration_days INTEGER NOT NULL DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  -- Constraints
  CONSTRAINT loyalty_config_points_per_dollar_positive CHECK (points_per_dollar >= 0),
  CONSTRAINT loyalty_config_redemption_rate_positive CHECK (redemption_rate >= 0),
  CONSTRAINT loyalty_config_min_points_positive CHECK (min_points_to_redeem >= 0),
  CONSTRAINT loyalty_config_max_redemption_range CHECK (max_redemption_percent >= 0 AND max_redemption_percent <= 100),
  CONSTRAINT loyalty_config_tier_thresholds_ascending CHECK (silver_threshold < gold_threshold AND gold_threshold < platinum_threshold),
  CONSTRAINT loyalty_config_multipliers_positive CHECK (bronze_multiplier >= 1 AND silver_multiplier >= 1 AND gold_multiplier >= 1 AND platinum_multiplier >= 1)
);

-- Create customer_loyalty table for tracking customer loyalty status
CREATE TABLE IF NOT EXISTS customer_loyalty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  -- Current points balance
  current_balance INTEGER NOT NULL DEFAULT 0,
  -- Lifetime statistics
  lifetime_points_earned INTEGER NOT NULL DEFAULT 0,
  lifetime_points_redeemed INTEGER NOT NULL DEFAULT 0,
  lifetime_spend DECIMAL(12,2) NOT NULL DEFAULT 0,
  -- Tier status
  current_tier loyalty_tier NOT NULL DEFAULT 'bronze',
  tier_updated_at TIMESTAMPTZ,
  -- Membership info
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  -- Ensure one loyalty record per customer
  CONSTRAINT customer_loyalty_unique_customer UNIQUE (customer_id),
  -- Balance cannot be negative
  CONSTRAINT customer_loyalty_balance_non_negative CHECK (current_balance >= 0),
  CONSTRAINT customer_loyalty_lifetime_earned_non_negative CHECK (lifetime_points_earned >= 0),
  CONSTRAINT customer_loyalty_lifetime_redeemed_non_negative CHECK (lifetime_points_redeemed >= 0),
  CONSTRAINT customer_loyalty_lifetime_spend_non_negative CHECK (lifetime_spend >= 0)
);

-- Create loyalty_transactions table for tracking point history
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_loyalty_id UUID NOT NULL REFERENCES customer_loyalty(id) ON DELETE CASCADE,
  transaction_type loyalty_transaction_type NOT NULL,
  -- Points information
  points INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  -- Related sale/refund (if applicable)
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  refund_id UUID REFERENCES refunds(id) ON DELETE SET NULL,
  -- Transaction details
  description VARCHAR(500),
  -- For earned transactions: store the calculation details
  purchase_amount DECIMAL(12,2),
  points_rate DECIMAL(10,2),
  tier_multiplier DECIMAL(3,2),
  -- For redeemed transactions: store the discount applied
  redemption_value DECIMAL(12,2),
  -- Expiration tracking
  expires_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Constraints
  CONSTRAINT loyalty_transactions_points_non_zero CHECK (points != 0),
  CONSTRAINT loyalty_transactions_description_maxlength CHECK (char_length(description) <= 500)
);

-- Add loyalty points columns to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS loyalty_points_earned INTEGER DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS loyalty_points_redeemed INTEGER DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS loyalty_discount_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_loyalty_balance_after INTEGER;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_customer_loyalty_customer_id ON customer_loyalty(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_loyalty_current_tier ON customer_loyalty(current_tier);
CREATE INDEX IF NOT EXISTS idx_customer_loyalty_enrolled_at ON customer_loyalty(enrolled_at);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer_loyalty_id ON loyalty_transactions(customer_loyalty_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_transaction_type ON loyalty_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_sale_id ON loyalty_transactions(sale_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON loyalty_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_expires_at ON loyalty_transactions(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sales_loyalty_points_earned ON sales(loyalty_points_earned) WHERE loyalty_points_earned > 0;

-- Create triggers for updated_at
CREATE OR REPLACE TRIGGER trg_loyalty_program_config_updated_at
  BEFORE UPDATE ON loyalty_program_config
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_customer_loyalty_updated_at
  BEFORE UPDATE ON customer_loyalty
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Enable RLS
ALTER TABLE loyalty_program_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loyalty_program_config (admin only, single record)
CREATE POLICY loyalty_config_anon_select ON loyalty_program_config FOR SELECT TO anon USING (false);
CREATE POLICY loyalty_config_auth_select ON loyalty_program_config FOR SELECT TO authenticated USING (true);
CREATE POLICY loyalty_config_auth_insert ON loyalty_program_config FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY loyalty_config_auth_update ON loyalty_program_config FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY loyalty_config_auth_delete ON loyalty_program_config FOR DELETE TO authenticated USING (true);

-- RLS Policies for customer_loyalty (admin only)
CREATE POLICY customer_loyalty_anon_select ON customer_loyalty FOR SELECT TO anon USING (false);
CREATE POLICY customer_loyalty_auth_select ON customer_loyalty FOR SELECT TO authenticated USING (true);
CREATE POLICY customer_loyalty_auth_insert ON customer_loyalty FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY customer_loyalty_auth_update ON customer_loyalty FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY customer_loyalty_auth_delete ON customer_loyalty FOR DELETE TO authenticated USING (true);

-- RLS Policies for loyalty_transactions (admin only)
CREATE POLICY loyalty_transactions_anon_select ON loyalty_transactions FOR SELECT TO anon USING (false);
CREATE POLICY loyalty_transactions_auth_select ON loyalty_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY loyalty_transactions_auth_insert ON loyalty_transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY loyalty_transactions_auth_update ON loyalty_transactions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY loyalty_transactions_auth_delete ON loyalty_transactions FOR DELETE TO authenticated USING (true);

-- Function to get loyalty program configuration (always returns the singleton)
CREATE OR REPLACE FUNCTION get_loyalty_config()
RETURNS JSONB AS $$
DECLARE
  v_config RECORD;
BEGIN
  SELECT * INTO v_config FROM loyalty_program_config LIMIT 1;

  IF v_config.id IS NULL THEN
    -- Return default config if none exists
    RETURN jsonb_build_object(
      'id', NULL,
      'isEnabled', false,
      'pointsPerDollar', 1.00,
      'redemptionRate', 0.01,
      'minPointsToRedeem', 100,
      'maxRedemptionPercent', 100.00,
      'silverThreshold', 1000,
      'goldThreshold', 5000,
      'platinumThreshold', 10000,
      'bronzeMultiplier', 1.00,
      'silverMultiplier', 1.25,
      'goldMultiplier', 1.50,
      'platinumMultiplier', 2.00,
      'pointsExpirationDays', 0
    );
  END IF;

  RETURN jsonb_build_object(
    'id', v_config.id,
    'isEnabled', v_config.is_enabled,
    'pointsPerDollar', v_config.points_per_dollar,
    'redemptionRate', v_config.redemption_rate,
    'minPointsToRedeem', v_config.min_points_to_redeem,
    'maxRedemptionPercent', v_config.max_redemption_percent,
    'silverThreshold', v_config.silver_threshold,
    'goldThreshold', v_config.gold_threshold,
    'platinumThreshold', v_config.platinum_threshold,
    'bronzeMultiplier', v_config.bronze_multiplier,
    'silverMultiplier', v_config.silver_multiplier,
    'goldMultiplier', v_config.gold_multiplier,
    'platinumMultiplier', v_config.platinum_multiplier,
    'pointsExpirationDays', v_config.points_expiration_days,
    'createdAt', v_config.created_at,
    'updatedAt', v_config.updated_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate tier based on lifetime points
CREATE OR REPLACE FUNCTION calculate_loyalty_tier(
  p_lifetime_points INTEGER
) RETURNS loyalty_tier AS $$
DECLARE
  v_config RECORD;
BEGIN
  SELECT * INTO v_config FROM loyalty_program_config LIMIT 1;

  IF v_config.id IS NULL THEN
    RETURN 'bronze';
  END IF;

  IF p_lifetime_points >= v_config.platinum_threshold THEN
    RETURN 'platinum';
  ELSIF p_lifetime_points >= v_config.gold_threshold THEN
    RETURN 'gold';
  ELSIF p_lifetime_points >= v_config.silver_threshold THEN
    RETURN 'silver';
  ELSE
    RETURN 'bronze';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get tier multiplier
CREATE OR REPLACE FUNCTION get_tier_multiplier(
  p_tier loyalty_tier
) RETURNS DECIMAL(3,2) AS $$
DECLARE
  v_config RECORD;
BEGIN
  SELECT * INTO v_config FROM loyalty_program_config LIMIT 1;

  IF v_config.id IS NULL THEN
    RETURN 1.00;
  END IF;

  CASE p_tier
    WHEN 'platinum' THEN RETURN v_config.platinum_multiplier;
    WHEN 'gold' THEN RETURN v_config.gold_multiplier;
    WHEN 'silver' THEN RETURN v_config.silver_multiplier;
    ELSE RETURN v_config.bronze_multiplier;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to enroll customer in loyalty program
CREATE OR REPLACE FUNCTION enroll_customer_loyalty(
  p_customer_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_loyalty RECORD;
  v_existing RECORD;
BEGIN
  -- Check if already enrolled
  SELECT * INTO v_existing FROM customer_loyalty WHERE customer_id = p_customer_id;

  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Customer is already enrolled in loyalty program',
      'loyalty', jsonb_build_object(
        'id', v_existing.id,
        'customerId', v_existing.customer_id,
        'currentBalance', v_existing.current_balance,
        'currentTier', v_existing.current_tier,
        'enrolledAt', v_existing.enrolled_at
      )
    );
  END IF;

  -- Create loyalty record
  INSERT INTO customer_loyalty (customer_id)
  VALUES (p_customer_id)
  RETURNING * INTO v_loyalty;

  RETURN jsonb_build_object(
    'success', true,
    'loyalty', jsonb_build_object(
      'id', v_loyalty.id,
      'customerId', v_loyalty.customer_id,
      'currentBalance', v_loyalty.current_balance,
      'lifetimePointsEarned', v_loyalty.lifetime_points_earned,
      'lifetimePointsRedeemed', v_loyalty.lifetime_points_redeemed,
      'lifetimeSpend', v_loyalty.lifetime_spend,
      'currentTier', v_loyalty.current_tier,
      'enrolledAt', v_loyalty.enrolled_at,
      'createdAt', v_loyalty.created_at
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate points to be earned for a purchase
CREATE OR REPLACE FUNCTION calculate_loyalty_points_earned(
  p_customer_id UUID,
  p_purchase_amount DECIMAL(12,2)
) RETURNS JSONB AS $$
DECLARE
  v_config RECORD;
  v_loyalty RECORD;
  v_base_points INTEGER;
  v_multiplier DECIMAL(3,2);
  v_total_points INTEGER;
BEGIN
  -- Get config
  SELECT * INTO v_config FROM loyalty_program_config LIMIT 1;

  IF v_config.id IS NULL OR NOT v_config.is_enabled THEN
    RETURN jsonb_build_object(
      'pointsToEarn', 0,
      'basePoints', 0,
      'multiplier', 1.00,
      'tier', 'bronze',
      'isEnabled', false
    );
  END IF;

  -- Get customer loyalty record
  SELECT * INTO v_loyalty FROM customer_loyalty WHERE customer_id = p_customer_id;

  IF v_loyalty.id IS NULL THEN
    -- Not enrolled, use base multiplier
    v_multiplier := v_config.bronze_multiplier;
    v_base_points := FLOOR(p_purchase_amount * v_config.points_per_dollar);
    v_total_points := FLOOR(v_base_points * v_multiplier);

    RETURN jsonb_build_object(
      'pointsToEarn', v_total_points,
      'basePoints', v_base_points,
      'multiplier', v_multiplier,
      'tier', 'bronze',
      'isEnabled', true,
      'isEnrolled', false
    );
  END IF;

  -- Calculate with tier multiplier
  v_multiplier := get_tier_multiplier(v_loyalty.current_tier);
  v_base_points := FLOOR(p_purchase_amount * v_config.points_per_dollar);
  v_total_points := FLOOR(v_base_points * v_multiplier);

  RETURN jsonb_build_object(
    'pointsToEarn', v_total_points,
    'basePoints', v_base_points,
    'multiplier', v_multiplier,
    'tier', v_loyalty.current_tier,
    'currentBalance', v_loyalty.current_balance,
    'isEnabled', true,
    'isEnrolled', true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate maximum points redeemable for a purchase
CREATE OR REPLACE FUNCTION calculate_max_redeemable_points(
  p_customer_id UUID,
  p_purchase_amount DECIMAL(12,2)
) RETURNS JSONB AS $$
DECLARE
  v_config RECORD;
  v_loyalty RECORD;
  v_max_discount DECIMAL(12,2);
  v_max_points_by_discount INTEGER;
  v_redeemable_points INTEGER;
  v_discount_value DECIMAL(12,2);
BEGIN
  -- Get config
  SELECT * INTO v_config FROM loyalty_program_config LIMIT 1;

  IF v_config.id IS NULL OR NOT v_config.is_enabled THEN
    RETURN jsonb_build_object(
      'maxRedeemablePoints', 0,
      'maxDiscountValue', 0,
      'currentBalance', 0,
      'isEnabled', false
    );
  END IF;

  -- Get customer loyalty record
  SELECT * INTO v_loyalty FROM customer_loyalty WHERE customer_id = p_customer_id;

  IF v_loyalty.id IS NULL OR v_loyalty.current_balance < v_config.min_points_to_redeem THEN
    RETURN jsonb_build_object(
      'maxRedeemablePoints', 0,
      'maxDiscountValue', 0,
      'currentBalance', COALESCE(v_loyalty.current_balance, 0),
      'minPointsRequired', v_config.min_points_to_redeem,
      'isEnabled', true,
      'isEnrolled', v_loyalty.id IS NOT NULL,
      'reason', CASE
        WHEN v_loyalty.id IS NULL THEN 'Not enrolled in loyalty program'
        ELSE 'Insufficient points balance'
      END
    );
  END IF;

  -- Calculate max discount based on purchase amount and max_redemption_percent
  v_max_discount := p_purchase_amount * (v_config.max_redemption_percent / 100);

  -- Calculate max points that would give this discount
  v_max_points_by_discount := FLOOR(v_max_discount / v_config.redemption_rate);

  -- The actual redeemable points is the minimum of: customer balance, max by discount
  v_redeemable_points := LEAST(v_loyalty.current_balance, v_max_points_by_discount);

  -- Round down to nearest min_points_to_redeem increment
  v_redeemable_points := (v_redeemable_points / v_config.min_points_to_redeem) * v_config.min_points_to_redeem;

  -- Calculate actual discount value
  v_discount_value := v_redeemable_points * v_config.redemption_rate;

  RETURN jsonb_build_object(
    'maxRedeemablePoints', v_redeemable_points,
    'maxDiscountValue', v_discount_value,
    'currentBalance', v_loyalty.current_balance,
    'redemptionRate', v_config.redemption_rate,
    'minPointsToRedeem', v_config.min_points_to_redeem,
    'maxRedemptionPercent', v_config.max_redemption_percent,
    'isEnabled', true,
    'isEnrolled', true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award loyalty points for a sale
CREATE OR REPLACE FUNCTION award_loyalty_points(
  p_customer_id UUID,
  p_sale_id UUID,
  p_purchase_amount DECIMAL(12,2)
) RETURNS JSONB AS $$
DECLARE
  v_config RECORD;
  v_loyalty RECORD;
  v_base_points INTEGER;
  v_multiplier DECIMAL(3,2);
  v_total_points INTEGER;
  v_new_balance INTEGER;
  v_new_lifetime_earned INTEGER;
  v_new_lifetime_spend DECIMAL(12,2);
  v_new_tier loyalty_tier;
  v_old_tier loyalty_tier;
  v_transaction_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Get config
  SELECT * INTO v_config FROM loyalty_program_config LIMIT 1;

  IF v_config.id IS NULL OR NOT v_config.is_enabled THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Loyalty program is not enabled',
      'pointsAwarded', 0
    );
  END IF;

  -- Get customer loyalty record
  SELECT * INTO v_loyalty FROM customer_loyalty WHERE customer_id = p_customer_id;

  IF v_loyalty.id IS NULL THEN
    -- Auto-enroll customer
    INSERT INTO customer_loyalty (customer_id)
    VALUES (p_customer_id)
    RETURNING * INTO v_loyalty;
  END IF;

  -- Calculate points
  v_multiplier := get_tier_multiplier(v_loyalty.current_tier);
  v_base_points := FLOOR(p_purchase_amount * v_config.points_per_dollar);
  v_total_points := FLOOR(v_base_points * v_multiplier);

  -- Calculate new balances
  v_new_balance := v_loyalty.current_balance + v_total_points;
  v_new_lifetime_earned := v_loyalty.lifetime_points_earned + v_total_points;
  v_new_lifetime_spend := v_loyalty.lifetime_spend + p_purchase_amount;

  -- Calculate new tier
  v_old_tier := v_loyalty.current_tier;
  v_new_tier := calculate_loyalty_tier(v_new_lifetime_earned);

  -- Calculate expiration if configured
  IF v_config.points_expiration_days > 0 THEN
    v_expires_at := now() + (v_config.points_expiration_days || ' days')::INTERVAL;
  END IF;

  -- Create transaction record
  INSERT INTO loyalty_transactions (
    customer_loyalty_id,
    transaction_type,
    points,
    balance_before,
    balance_after,
    sale_id,
    description,
    purchase_amount,
    points_rate,
    tier_multiplier,
    expires_at
  ) VALUES (
    v_loyalty.id,
    'earned',
    v_total_points,
    v_loyalty.current_balance,
    v_new_balance,
    p_sale_id,
    'Points earned from purchase',
    p_purchase_amount,
    v_config.points_per_dollar,
    v_multiplier,
    v_expires_at
  ) RETURNING id INTO v_transaction_id;

  -- Update loyalty record
  UPDATE customer_loyalty SET
    current_balance = v_new_balance,
    lifetime_points_earned = v_new_lifetime_earned,
    lifetime_spend = v_new_lifetime_spend,
    current_tier = v_new_tier,
    tier_updated_at = CASE WHEN v_new_tier != v_old_tier THEN now() ELSE tier_updated_at END
  WHERE id = v_loyalty.id;

  -- Update sale record with loyalty info
  UPDATE sales SET
    loyalty_points_earned = v_total_points,
    customer_loyalty_balance_after = v_new_balance
  WHERE id = p_sale_id;

  RETURN jsonb_build_object(
    'success', true,
    'pointsAwarded', v_total_points,
    'basePoints', v_base_points,
    'multiplier', v_multiplier,
    'newBalance', v_new_balance,
    'previousBalance', v_loyalty.current_balance,
    'currentTier', v_new_tier,
    'previousTier', v_old_tier,
    'tierChanged', v_new_tier != v_old_tier,
    'transactionId', v_transaction_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to redeem loyalty points for a sale
CREATE OR REPLACE FUNCTION redeem_loyalty_points(
  p_customer_id UUID,
  p_sale_id UUID,
  p_points_to_redeem INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_config RECORD;
  v_loyalty RECORD;
  v_discount_value DECIMAL(12,2);
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Get config
  SELECT * INTO v_config FROM loyalty_program_config LIMIT 1;

  IF v_config.id IS NULL OR NOT v_config.is_enabled THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Loyalty program is not enabled'
    );
  END IF;

  -- Validate points to redeem
  IF p_points_to_redeem < v_config.min_points_to_redeem THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Minimum points to redeem is ' || v_config.min_points_to_redeem
    );
  END IF;

  -- Get customer loyalty record
  SELECT * INTO v_loyalty FROM customer_loyalty WHERE customer_id = p_customer_id;

  IF v_loyalty.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Customer is not enrolled in loyalty program'
    );
  END IF;

  -- Check balance
  IF v_loyalty.current_balance < p_points_to_redeem THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient points balance',
      'currentBalance', v_loyalty.current_balance,
      'pointsRequested', p_points_to_redeem
    );
  END IF;

  -- Calculate discount value
  v_discount_value := p_points_to_redeem * v_config.redemption_rate;
  v_new_balance := v_loyalty.current_balance - p_points_to_redeem;

  -- Create transaction record
  INSERT INTO loyalty_transactions (
    customer_loyalty_id,
    transaction_type,
    points,
    balance_before,
    balance_after,
    sale_id,
    description,
    redemption_value
  ) VALUES (
    v_loyalty.id,
    'redeemed',
    -p_points_to_redeem,
    v_loyalty.current_balance,
    v_new_balance,
    p_sale_id,
    'Points redeemed for discount',
    v_discount_value
  ) RETURNING id INTO v_transaction_id;

  -- Update loyalty record
  UPDATE customer_loyalty SET
    current_balance = v_new_balance,
    lifetime_points_redeemed = lifetime_points_redeemed + p_points_to_redeem
  WHERE id = v_loyalty.id;

  -- Update sale record with redemption info
  UPDATE sales SET
    loyalty_points_redeemed = p_points_to_redeem,
    loyalty_discount_amount = v_discount_value,
    customer_loyalty_balance_after = v_new_balance
  WHERE id = p_sale_id;

  RETURN jsonb_build_object(
    'success', true,
    'pointsRedeemed', p_points_to_redeem,
    'discountValue', v_discount_value,
    'newBalance', v_new_balance,
    'previousBalance', v_loyalty.current_balance,
    'transactionId', v_transaction_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get customer loyalty profile with transaction history
CREATE OR REPLACE FUNCTION get_customer_loyalty_profile(
  p_customer_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_customer RECORD;
  v_loyalty RECORD;
  v_config RECORD;
  v_transactions JSONB;
  v_next_tier loyalty_tier;
  v_points_to_next_tier INTEGER;
BEGIN
  -- Get customer
  SELECT * INTO v_customer FROM customers WHERE id = p_customer_id;

  IF v_customer.id IS NULL THEN
    RETURN jsonb_build_object('found', false, 'error', 'Customer not found');
  END IF;

  -- Get loyalty record
  SELECT * INTO v_loyalty FROM customer_loyalty WHERE customer_id = p_customer_id;

  IF v_loyalty.id IS NULL THEN
    RETURN jsonb_build_object(
      'found', true,
      'isEnrolled', false,
      'customer', jsonb_build_object(
        'id', v_customer.id,
        'name', v_customer.name,
        'phone', v_customer.phone,
        'email', v_customer.email
      )
    );
  END IF;

  -- Get config for tier thresholds
  SELECT * INTO v_config FROM loyalty_program_config LIMIT 1;

  -- Calculate next tier and points needed
  CASE v_loyalty.current_tier
    WHEN 'bronze' THEN
      v_next_tier := 'silver';
      v_points_to_next_tier := GREATEST(0, COALESCE(v_config.silver_threshold, 1000) - v_loyalty.lifetime_points_earned);
    WHEN 'silver' THEN
      v_next_tier := 'gold';
      v_points_to_next_tier := GREATEST(0, COALESCE(v_config.gold_threshold, 5000) - v_loyalty.lifetime_points_earned);
    WHEN 'gold' THEN
      v_next_tier := 'platinum';
      v_points_to_next_tier := GREATEST(0, COALESCE(v_config.platinum_threshold, 10000) - v_loyalty.lifetime_points_earned);
    WHEN 'platinum' THEN
      v_next_tier := 'platinum';
      v_points_to_next_tier := 0;
  END CASE;

  -- Get recent transactions
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', lt.id,
      'transactionType', lt.transaction_type,
      'points', lt.points,
      'balanceBefore', lt.balance_before,
      'balanceAfter', lt.balance_after,
      'description', lt.description,
      'purchaseAmount', lt.purchase_amount,
      'redemptionValue', lt.redemption_value,
      'createdAt', lt.created_at
    ) ORDER BY lt.created_at DESC
  ) INTO v_transactions
  FROM loyalty_transactions lt
  WHERE lt.customer_loyalty_id = v_loyalty.id
  LIMIT 50;

  RETURN jsonb_build_object(
    'found', true,
    'isEnrolled', true,
    'customer', jsonb_build_object(
      'id', v_customer.id,
      'name', v_customer.name,
      'phone', v_customer.phone,
      'email', v_customer.email
    ),
    'loyalty', jsonb_build_object(
      'id', v_loyalty.id,
      'currentBalance', v_loyalty.current_balance,
      'lifetimePointsEarned', v_loyalty.lifetime_points_earned,
      'lifetimePointsRedeemed', v_loyalty.lifetime_points_redeemed,
      'lifetimeSpend', v_loyalty.lifetime_spend,
      'currentTier', v_loyalty.current_tier,
      'tierUpdatedAt', v_loyalty.tier_updated_at,
      'enrolledAt', v_loyalty.enrolled_at,
      'nextTier', v_next_tier,
      'pointsToNextTier', v_points_to_next_tier
    ),
    'transactions', COALESCE(v_transactions, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to manually adjust points (for corrections, bonuses, etc.)
CREATE OR REPLACE FUNCTION adjust_loyalty_points(
  p_customer_id UUID,
  p_points INTEGER,
  p_reason VARCHAR(500),
  p_transaction_type loyalty_transaction_type DEFAULT 'adjusted'
) RETURNS JSONB AS $$
DECLARE
  v_loyalty RECORD;
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Get customer loyalty record
  SELECT * INTO v_loyalty FROM customer_loyalty WHERE customer_id = p_customer_id;

  IF v_loyalty.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Customer is not enrolled in loyalty program'
    );
  END IF;

  -- Calculate new balance
  v_new_balance := v_loyalty.current_balance + p_points;

  -- Prevent negative balance
  IF v_new_balance < 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Adjustment would result in negative balance',
      'currentBalance', v_loyalty.current_balance,
      'adjustment', p_points
    );
  END IF;

  -- Create transaction record
  INSERT INTO loyalty_transactions (
    customer_loyalty_id,
    transaction_type,
    points,
    balance_before,
    balance_after,
    description
  ) VALUES (
    v_loyalty.id,
    p_transaction_type,
    p_points,
    v_loyalty.current_balance,
    v_new_balance,
    p_reason
  ) RETURNING id INTO v_transaction_id;

  -- Update loyalty record
  UPDATE customer_loyalty SET
    current_balance = v_new_balance,
    lifetime_points_earned = CASE WHEN p_points > 0 THEN lifetime_points_earned + p_points ELSE lifetime_points_earned END,
    lifetime_points_redeemed = CASE WHEN p_points < 0 THEN lifetime_points_redeemed + ABS(p_points) ELSE lifetime_points_redeemed END
  WHERE id = v_loyalty.id;

  RETURN jsonb_build_object(
    'success', true,
    'pointsAdjusted', p_points,
    'newBalance', v_new_balance,
    'previousBalance', v_loyalty.current_balance,
    'transactionId', v_transaction_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed default loyalty program configuration
INSERT INTO loyalty_program_config (
  is_enabled,
  points_per_dollar,
  redemption_rate,
  min_points_to_redeem,
  max_redemption_percent,
  silver_threshold,
  gold_threshold,
  platinum_threshold,
  bronze_multiplier,
  silver_multiplier,
  gold_multiplier,
  platinum_multiplier,
  points_expiration_days
) VALUES (
  true,
  1.00,
  0.01,
  100,
  100.00,
  1000,
  5000,
  10000,
  1.00,
  1.25,
  1.50,
  2.00,
  0
) ON CONFLICT DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE loyalty_program_config IS 'Singleton configuration for loyalty points program - Feature F-022';
COMMENT ON TABLE customer_loyalty IS 'Customer loyalty membership and points balance tracking - Feature F-022';
COMMENT ON TABLE loyalty_transactions IS 'Transaction history for loyalty points earned, redeemed, and adjusted - Feature F-022';

COMMENT ON COLUMN loyalty_program_config.points_per_dollar IS 'Base points earned per dollar spent';
COMMENT ON COLUMN loyalty_program_config.redemption_rate IS 'Dollar value per point when redeeming (e.g., 0.01 = $0.01 per point)';
COMMENT ON COLUMN loyalty_program_config.min_points_to_redeem IS 'Minimum points required for redemption';
COMMENT ON COLUMN loyalty_program_config.max_redemption_percent IS 'Maximum percentage of purchase that can be paid with points';

COMMENT ON COLUMN customer_loyalty.current_tier IS 'Customer tier level based on lifetime points earned';
COMMENT ON COLUMN customer_loyalty.lifetime_points_earned IS 'Total points ever earned (used for tier calculation)';

COMMENT ON COLUMN sales.loyalty_points_earned IS 'Points earned from this sale - Feature F-022';
COMMENT ON COLUMN sales.loyalty_points_redeemed IS 'Points redeemed during this sale - Feature F-022';
COMMENT ON COLUMN sales.loyalty_discount_amount IS 'Discount amount from points redemption - Feature F-022';
