import { LoyaltyTier, LoyaltyTransactionType } from '../enums';

/**
 * Loyalty DTOs
 * Data Transfer Objects for loyalty points feature
 * Feature: F-022 Loyalty Points Integration
 */

// ============================================================================
// Loyalty Program Configuration DTOs
// ============================================================================

export interface UpdateLoyaltyConfigDto {
  isEnabled?: boolean;
  pointsPerDollar?: number;
  redemptionRate?: number;
  minPointsToRedeem?: number;
  maxRedemptionPercent?: number;
  silverThreshold?: number;
  goldThreshold?: number;
  platinumThreshold?: number;
  bronzeMultiplier?: number;
  silverMultiplier?: number;
  goldMultiplier?: number;
  platinumMultiplier?: number;
  pointsExpirationDays?: number;
}

export interface LoyaltyConfigResponseDto {
  id: string | null;
  isEnabled: boolean;
  pointsPerDollar: number;
  redemptionRate: number;
  minPointsToRedeem: number;
  maxRedemptionPercent: number;
  silverThreshold: number;
  goldThreshold: number;
  platinumThreshold: number;
  bronzeMultiplier: number;
  silverMultiplier: number;
  goldMultiplier: number;
  platinumMultiplier: number;
  pointsExpirationDays: number;
  createdAt?: string;
  updatedAt?: string | null;
}

// ============================================================================
// Customer Loyalty DTOs
// ============================================================================

export interface EnrollCustomerDto {
  customerId: string;
}

export interface CustomerLoyaltyResponseDto {
  id: string;
  customerId: string;
  currentBalance: number;
  lifetimePointsEarned: number;
  lifetimePointsRedeemed: number;
  lifetimeSpend: number;
  currentTier: LoyaltyTier;
  tierLabel: string;
  tierUpdatedAt: string | null;
  enrolledAt: string;
  createdAt: string;
  updatedAt: string | null;
  /** Calculated: next tier to achieve */
  nextTier: LoyaltyTier | null;
  /** Calculated: points needed to reach next tier */
  pointsToNextTier: number;
  /** Customer info (when joined) */
  customer?: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  };
}

export interface CustomerLoyaltyListResponseDto {
  data: CustomerLoyaltyResponseDto[];
  total: number;
}

export interface CustomerLoyaltyProfileResponseDto {
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
    tierLabel: string;
    tierUpdatedAt: string | null;
    enrolledAt: string;
    nextTier: LoyaltyTier | null;
    pointsToNextTier: number;
  };
  transactions?: LoyaltyTransactionResponseDto[];
}

// ============================================================================
// Loyalty Transaction DTOs
// ============================================================================

export interface LoyaltyTransactionResponseDto {
  id: string;
  customerLoyaltyId: string;
  transactionType: LoyaltyTransactionType;
  transactionTypeLabel: string;
  points: number;
  balanceBefore: number;
  balanceAfter: number;
  saleId: string | null;
  refundId: string | null;
  description: string | null;
  purchaseAmount: number | null;
  pointsRate: number | null;
  tierMultiplier: number | null;
  redemptionValue: number | null;
  expiresAt: string | null;
  expiredAt: string | null;
  createdAt: string;
}

export interface LoyaltyTransactionListResponseDto {
  data: LoyaltyTransactionResponseDto[];
  total: number;
}

// ============================================================================
// Points Calculation DTOs
// ============================================================================

export interface CalculatePointsEarnedDto {
  customerId: string;
  purchaseAmount: number;
}

export interface PointsEarnedResponseDto {
  pointsToEarn: number;
  basePoints: number;
  multiplier: number;
  tier: LoyaltyTier;
  tierLabel: string;
  currentBalance: number;
  isEnabled: boolean;
  isEnrolled: boolean;
}

export interface CalculateMaxRedeemableDto {
  customerId: string;
  purchaseAmount: number;
}

export interface MaxRedeemableResponseDto {
  maxRedeemablePoints: number;
  maxDiscountValue: number;
  currentBalance: number;
  redemptionRate: number;
  minPointsToRedeem: number;
  maxRedemptionPercent: number;
  isEnabled: boolean;
  isEnrolled: boolean;
  reason?: string;
}

// ============================================================================
// Points Award/Redeem DTOs
// ============================================================================

export interface AwardPointsDto {
  customerId: string;
  saleId: string;
  purchaseAmount: number;
}

export interface AwardPointsResponseDto {
  success: boolean;
  error?: string;
  pointsAwarded: number;
  basePoints: number;
  multiplier: number;
  newBalance: number;
  previousBalance: number;
  currentTier: LoyaltyTier;
  tierLabel: string;
  previousTier: LoyaltyTier;
  tierChanged: boolean;
  transactionId: string;
}

export interface RedeemPointsDto {
  customerId: string;
  saleId: string;
  pointsToRedeem: number;
}

export interface RedeemPointsResponseDto {
  success: boolean;
  error?: string;
  pointsRedeemed: number;
  discountValue: number;
  newBalance: number;
  previousBalance: number;
  transactionId: string;
}

// ============================================================================
// Points Adjustment DTOs
// ============================================================================

export interface AdjustPointsDto {
  customerId: string;
  points: number;
  reason: string;
  transactionType?: 'adjusted' | 'bonus';
}

export interface AdjustPointsResponseDto {
  success: boolean;
  error?: string;
  pointsAdjusted: number;
  newBalance: number;
  previousBalance: number;
  transactionId: string;
}

// ============================================================================
// Sale Integration DTOs
// ============================================================================

export interface SaleLoyaltyInfoDto {
  /** Points earned from this sale */
  pointsEarned: number;
  /** Points redeemed during this sale */
  pointsRedeemed: number;
  /** Discount amount from points redemption */
  discountAmount: number;
  /** Customer's loyalty balance after this sale */
  balanceAfter: number | null;
  /** Customer's tier at time of sale */
  tier: LoyaltyTier | null;
  tierLabel: string | null;
}

export interface CreateSaleWithLoyaltyDto {
  /** Standard sale fields */
  phoneId: string;
  saleDate: string;
  salePrice: number;
  buyerName?: string | null;
  buyerPhone?: string | null;
  buyerEmail?: string | null;
  notes?: string | null;
  /** Loyalty points to redeem (optional) */
  pointsToRedeem?: number;
  /** Customer ID for loyalty tracking */
  customerId?: string;
}

// ============================================================================
// Receipt Display DTOs
// ============================================================================

export interface ReceiptLoyaltyInfoDto {
  /** Is customer enrolled in loyalty program */
  isEnrolled: boolean;
  /** Customer's current tier */
  tier: LoyaltyTier | null;
  tierLabel: string | null;
  /** Points earned from this transaction */
  pointsEarned: number;
  /** Points redeemed in this transaction */
  pointsRedeemed: number;
  /** Discount applied from points */
  discountApplied: number;
  /** Current balance after transaction */
  currentBalance: number;
  /** Points needed for next tier */
  pointsToNextTier: number;
  /** Next tier name */
  nextTier: LoyaltyTier | null;
  nextTierLabel: string | null;
}
