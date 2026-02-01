import { DiscountType, CouponStatus } from '../enums';

/**
 * Coupon DTOs
 * Data Transfer Objects for Coupon entity
 * Feature: F-023 Discount and Coupon Management
 */

export interface CreateCouponDto {
  code: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number;
  minPurchaseAmount?: number | null;
  maxDiscountAmount?: number | null;
  maxRedemptions?: number | null;
  validFrom: string;
  validUntil?: string | null;
  requiresManagerApproval?: boolean;
}

export interface UpdateCouponDto {
  code?: string;
  description?: string | null;
  discountType?: DiscountType;
  discountValue?: number;
  minPurchaseAmount?: number | null;
  maxDiscountAmount?: number | null;
  maxRedemptions?: number | null;
  validFrom?: string;
  validUntil?: string | null;
  status?: CouponStatus;
  requiresManagerApproval?: boolean;
}

export interface CouponResponseDto {
  id: string;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  minPurchaseAmount: number | null;
  maxDiscountAmount: number | null;
  maxRedemptions: number | null;
  currentRedemptions: number;
  remainingRedemptions: number | null;
  validFrom: string;
  validUntil: string | null;
  status: CouponStatus;
  requiresManagerApproval: boolean;
  isValid: boolean;
  daysUntilExpiry: number | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CouponListResponseDto {
  data: CouponResponseDto[];
  total: number;
}

export interface CouponFilterDto {
  status?: CouponStatus;
  discountType?: DiscountType;
  code?: string;
  includeExpired?: boolean;
  validOn?: string;
}

export interface CouponSummaryDto {
  totalCoupons: number;
  activeCoupons: number;
  expiredCoupons: number;
  totalRedemptions: number;
  totalDiscountGiven: number;
}

/**
 * DTO for validating and applying a coupon to a sale
 */
export interface ValidateCouponDto {
  code: string;
  purchaseAmount: number;
}

/**
 * Response when validating a coupon
 */
export interface CouponValidationResponseDto {
  isValid: boolean;
  coupon?: CouponResponseDto;
  discountAmount?: number;
  finalPrice?: number;
  error?: string;
  requiresManagerApproval: boolean;
}

/**
 * DTO for applying a discount to a sale
 */
export interface ApplyDiscountDto {
  saleId: string;
  couponId?: string | null;
  discountType: DiscountType;
  discountValue: number;
  originalPrice: number;
  managerApprovedBy?: string | null;
  managerApprovalReason?: string | null;
}

/**
 * Response when applying a discount
 */
export interface ApplyDiscountResponseDto {
  success: boolean;
  saleId: string;
  discountId?: string;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  requiresManagerApproval: boolean;
  managerApproved: boolean;
  error?: string;
}

/**
 * DTO for the discount configuration
 */
export interface DiscountConfigResponseDto {
  id: string;
  managerApprovalThreshold: number;
  maxDiscountPercentage: number;
  maxDiscountAmount: number;
  discountsEnabled: boolean;
  couponsEnabled: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface UpdateDiscountConfigDto {
  managerApprovalThreshold?: number;
  maxDiscountPercentage?: number;
  maxDiscountAmount?: number;
  discountsEnabled?: boolean;
  couponsEnabled?: boolean;
}

/**
 * DTO for coupon redemption history
 */
export interface CouponRedemptionResponseDto {
  id: string;
  couponId: string;
  couponCode: string;
  saleId: string;
  discountAmount: number;
  redeemedBy: string | null;
  redeemedAt: string;
  saleDate: string | null;
  salePrice: number | null;
  buyerName: string | null;
}

export interface CouponRedemptionListResponseDto {
  data: CouponRedemptionResponseDto[];
  total: number;
}
