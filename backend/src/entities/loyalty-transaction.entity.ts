import { LoyaltyTransactionType } from '../enums';

/**
 * Loyalty Transaction Entity
 * Records all loyalty points transactions (earned, redeemed, expired, adjusted, bonus)
 * Database table: loyalty_transactions
 * Owner Module: M-07 Sales
 * Feature: F-022 Loyalty Points Integration
 */
export interface LoyaltyTransaction {
  id: string;
  customer_loyalty_id: string;
  transaction_type: LoyaltyTransactionType;
  /** Points amount (positive for earned/bonus, negative for redeemed/expired) */
  points: number;
  /** Balance before this transaction */
  balance_before: number;
  /** Balance after this transaction */
  balance_after: number;
  /** Related sale ID (if applicable) */
  sale_id: string | null;
  /** Related refund ID (if applicable) */
  refund_id: string | null;
  /** Transaction description */
  description: string | null;
  /** For earned transactions: the purchase amount */
  purchase_amount: number | null;
  /** For earned transactions: the points rate used */
  points_rate: number | null;
  /** For earned transactions: the tier multiplier applied */
  tier_multiplier: number | null;
  /** For redeemed transactions: the discount value */
  redemption_value: number | null;
  /** When these points expire */
  expires_at: string | null;
  /** When these points expired (if applicable) */
  expired_at: string | null;
  created_at: string;
}

export interface LoyaltyTransactionInsert {
  id?: string;
  customer_loyalty_id: string;
  transaction_type: LoyaltyTransactionType;
  points: number;
  balance_before: number;
  balance_after: number;
  sale_id?: string | null;
  refund_id?: string | null;
  description?: string | null;
  purchase_amount?: number | null;
  points_rate?: number | null;
  tier_multiplier?: number | null;
  redemption_value?: number | null;
  expires_at?: string | null;
  expired_at?: string | null;
  created_at?: string;
}

export interface LoyaltyTransactionWithRelations extends LoyaltyTransaction {
  customer_loyalty?: {
    id: string;
    customer_id: string;
    current_tier: string;
    customer?: {
      id: string;
      name: string;
      phone: string;
    };
  };
  sale?: {
    id: string;
    sale_date: string;
    sale_price: number;
  };
}

/**
 * Response from award_loyalty_points() database function
 */
export interface AwardLoyaltyPointsResponse {
  success: boolean;
  error?: string;
  pointsAwarded: number;
  basePoints?: number;
  multiplier?: number;
  newBalance?: number;
  previousBalance?: number;
  currentTier?: string;
  previousTier?: string;
  tierChanged?: boolean;
  transactionId?: string;
}

/**
 * Response from redeem_loyalty_points() database function
 */
export interface RedeemLoyaltyPointsResponse {
  success: boolean;
  error?: string;
  pointsRedeemed?: number;
  discountValue?: number;
  newBalance?: number;
  previousBalance?: number;
  currentBalance?: number;
  pointsRequested?: number;
  transactionId?: string;
}

/**
 * Response from calculate_loyalty_points_earned() database function
 */
export interface CalculatePointsEarnedResponse {
  pointsToEarn: number;
  basePoints: number;
  multiplier: number;
  tier: string;
  currentBalance?: number;
  isEnabled: boolean;
  isEnrolled?: boolean;
}

/**
 * Response from calculate_max_redeemable_points() database function
 */
export interface CalculateMaxRedeemableResponse {
  maxRedeemablePoints: number;
  maxDiscountValue: number;
  currentBalance: number;
  redemptionRate?: number;
  minPointsToRedeem?: number;
  maxRedemptionPercent?: number;
  isEnabled: boolean;
  isEnrolled?: boolean;
  reason?: string;
}

/**
 * Response from adjust_loyalty_points() database function
 */
export interface AdjustLoyaltyPointsResponse {
  success: boolean;
  error?: string;
  pointsAdjusted?: number;
  newBalance?: number;
  previousBalance?: number;
  currentBalance?: number;
  adjustment?: number;
  transactionId?: string;
}
