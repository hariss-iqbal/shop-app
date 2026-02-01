import { LoyaltyTier, LoyaltyTransactionType } from '../enums';

/**
 * Loyalty Models
 * Frontend data models for loyalty points feature
 * Feature: F-022 Loyalty Points Integration
 */

// ============================================================================
// Loyalty Program Configuration
// ============================================================================

export interface LoyaltyConfig {
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

export interface UpdateLoyaltyConfigRequest {
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

// ============================================================================
// Customer Loyalty
// ============================================================================

export interface CustomerLoyalty {
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
  nextTier: LoyaltyTier | null;
  pointsToNextTier: number;
  customer?: LoyaltyCustomerInfo;
}

export interface LoyaltyCustomerInfo {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}

export interface CustomerLoyaltyListResponse {
  data: CustomerLoyalty[];
  total: number;
}

export interface EnrollCustomerRequest {
  customerId: string;
}

export interface CustomerLoyaltyProfile {
  found: boolean;
  isEnrolled: boolean;
  error?: string;
  customer?: LoyaltyCustomerInfo;
  loyalty?: CustomerLoyaltyInfo;
  transactions?: LoyaltyTransaction[];
}

export interface CustomerLoyaltyInfo {
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
}

// ============================================================================
// Loyalty Transactions
// ============================================================================

export interface LoyaltyTransaction {
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

export interface LoyaltyTransactionListResponse {
  data: LoyaltyTransaction[];
  total: number;
}

// ============================================================================
// Points Calculation
// ============================================================================

export interface CalculatePointsEarnedRequest {
  customerId: string;
  purchaseAmount: number;
}

export interface PointsEarnedResult {
  pointsToEarn: number;
  basePoints: number;
  multiplier: number;
  tier: LoyaltyTier;
  tierLabel: string;
  currentBalance: number;
  isEnabled: boolean;
  isEnrolled: boolean;
}

export interface CalculateMaxRedeemableRequest {
  customerId: string;
  purchaseAmount: number;
}

export interface MaxRedeemableResult {
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
// Points Award/Redeem
// ============================================================================

export interface AwardPointsRequest {
  customerId: string;
  saleId: string;
  purchaseAmount: number;
}

export interface AwardPointsResult {
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

export interface RedeemPointsRequest {
  customerId: string;
  saleId: string;
  pointsToRedeem: number;
}

export interface RedeemPointsResult {
  success: boolean;
  error?: string;
  pointsRedeemed: number;
  discountValue: number;
  newBalance: number;
  previousBalance: number;
  transactionId: string;
}

export interface AdjustPointsRequest {
  customerId: string;
  points: number;
  reason: string;
  transactionType?: 'adjusted' | 'bonus';
}

export interface AdjustPointsResult {
  success: boolean;
  error?: string;
  pointsAdjusted: number;
  newBalance: number;
  previousBalance: number;
  transactionId: string;
}

// ============================================================================
// Receipt Integration
// ============================================================================

export interface ReceiptLoyaltyInfo {
  isEnrolled: boolean;
  tier: LoyaltyTier | null;
  tierLabel: string | null;
  pointsEarned: number;
  pointsRedeemed: number;
  discountApplied: number;
  currentBalance: number;
  pointsToNextTier: number;
  nextTier: LoyaltyTier | null;
  nextTierLabel: string | null;
}

// ============================================================================
// Sale Integration
// ============================================================================

export interface SaleLoyaltyInfo {
  pointsEarned: number;
  pointsRedeemed: number;
  discountAmount: number;
  balanceAfter: number | null;
  tier: LoyaltyTier | null;
  tierLabel: string | null;
}

// ============================================================================
// UI Helper Types
// ============================================================================

export interface LoyaltyTierInfo {
  tier: LoyaltyTier;
  label: string;
  multiplier: number;
  threshold: number;
  color: string;
  severity: 'secondary' | 'info' | 'warn' | 'success';
  icon: string;
}

export interface LoyaltyPointsSummary {
  currentBalance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  currentTier: LoyaltyTier;
  tierLabel: string;
  nextTier: LoyaltyTier | null;
  pointsToNextTier: number;
  progressPercent: number;
}

export interface LoyaltyRedemptionPreview {
  pointsToRedeem: number;
  discountValue: number;
  remainingBalance: number;
  maxRedeemable: number;
  maxDiscount: number;
}
