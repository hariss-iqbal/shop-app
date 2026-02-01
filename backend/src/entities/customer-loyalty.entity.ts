import { LoyaltyTier } from '../enums';

/**
 * Customer Loyalty Entity
 * Tracks customer loyalty membership and points balance
 * Database table: customer_loyalty
 * Owner Module: M-07 Sales
 * Feature: F-022 Loyalty Points Integration
 */
export interface CustomerLoyalty {
  id: string;
  customer_id: string;
  /** Current available points balance */
  current_balance: number;
  /** Total points ever earned (used for tier calculation) */
  lifetime_points_earned: number;
  /** Total points ever redeemed */
  lifetime_points_redeemed: number;
  /** Total amount spent by customer */
  lifetime_spend: number;
  /** Current tier level based on lifetime points earned */
  current_tier: LoyaltyTier;
  /** When the tier was last changed */
  tier_updated_at: string | null;
  /** When customer enrolled in loyalty program */
  enrolled_at: string;
  created_at: string;
  updated_at: string | null;
}

export interface CustomerLoyaltyInsert {
  id?: string;
  customer_id: string;
  current_balance?: number;
  lifetime_points_earned?: number;
  lifetime_points_redeemed?: number;
  lifetime_spend?: number;
  current_tier?: LoyaltyTier;
  tier_updated_at?: string | null;
  enrolled_at?: string;
  created_at?: string;
  updated_at?: string | null;
}

export interface CustomerLoyaltyUpdate {
  current_balance?: number;
  lifetime_points_earned?: number;
  lifetime_points_redeemed?: number;
  lifetime_spend?: number;
  current_tier?: LoyaltyTier;
  tier_updated_at?: string | null;
  updated_at?: string | null;
}

export interface CustomerLoyaltyWithCustomer extends CustomerLoyalty {
  customer?: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  };
}

/**
 * Response from enroll_customer_loyalty() database function
 */
export interface EnrollCustomerLoyaltyResponse {
  success: boolean;
  error?: string;
  loyalty?: {
    id: string;
    customerId: string;
    currentBalance: number;
    lifetimePointsEarned?: number;
    lifetimePointsRedeemed?: number;
    lifetimeSpend?: number;
    currentTier: LoyaltyTier;
    enrolledAt: string;
    createdAt?: string;
  };
}

/**
 * Response from get_customer_loyalty_profile() database function
 */
export interface CustomerLoyaltyProfileResponse {
  found: boolean;
  isEnrolled: boolean;
  error?: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  };
  loyalty?: {
    id: string;
    currentBalance: number;
    lifetimePointsEarned: number;
    lifetimePointsRedeemed: number;
    lifetimeSpend: number;
    currentTier: LoyaltyTier;
    tierUpdatedAt: string | null;
    enrolledAt: string;
    nextTier: LoyaltyTier;
    pointsToNextTier: number;
  };
  transactions?: LoyaltyTransactionSummary[];
}

export interface LoyaltyTransactionSummary {
  id: string;
  transactionType: string;
  points: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
  purchaseAmount: number | null;
  redemptionValue: number | null;
  createdAt: string;
}
