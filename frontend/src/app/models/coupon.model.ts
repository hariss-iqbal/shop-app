import { DiscountType, CouponStatus } from '../enums';

/**
 * Coupon Model
 * Represents a discount coupon
 * Feature: F-023 Discount and Coupon Management
 */
export interface Coupon {
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

export interface CreateCouponRequest {
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

export interface UpdateCouponRequest {
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

export interface CouponListResponse {
  data: Coupon[];
  total: number;
}

export interface CouponFilter {
  status?: CouponStatus;
  discountType?: DiscountType;
  code?: string;
  includeExpired?: boolean;
  validOn?: string;
}

export interface CouponSummary {
  totalCoupons: number;
  activeCoupons: number;
  expiredCoupons: number;
  totalRedemptions: number;
  totalDiscountGiven: number;
}

/**
 * Request to validate a coupon code
 */
export interface ValidateCouponRequest {
  code: string;
  purchaseAmount: number;
}

/**
 * Response from coupon validation
 */
export interface CouponValidationResponse {
  isValid: boolean;
  coupon?: Coupon;
  discountAmount?: number;
  finalPrice?: number;
  error?: string;
  requiresManagerApproval: boolean;
}

/**
 * Request to apply a discount to a sale
 */
export interface ApplyDiscountRequest {
  saleId: string;
  couponId?: string | null;
  discountType: DiscountType;
  discountValue: number;
  originalPrice: number;
  managerApprovedBy?: string | null;
  managerApprovalReason?: string | null;
}

/**
 * Response from discount application
 */
export interface ApplyDiscountResponse {
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
 * Discount Configuration
 */
export interface DiscountConfig {
  id: string;
  managerApprovalThreshold: number;
  maxDiscountPercentage: number;
  maxDiscountAmount: number;
  discountsEnabled: boolean;
  couponsEnabled: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface UpdateDiscountConfigRequest {
  managerApprovalThreshold?: number;
  maxDiscountPercentage?: number;
  maxDiscountAmount?: number;
  discountsEnabled?: boolean;
  couponsEnabled?: boolean;
}

/**
 * Coupon Redemption Record
 */
export interface CouponRedemption {
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

export interface CouponRedemptionListResponse {
  data: CouponRedemption[];
  total: number;
}

/**
 * Sale Discount Record (applied to a sale)
 */
export interface SaleDiscount {
  id: string;
  saleId: string;
  couponId: string | null;
  couponCode: string | null;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  originalPrice: number;
  finalPrice: number;
  appliedBy: string | null;
  managerApprovedBy: string | null;
  managerApprovalReason: string | null;
  createdAt: string;
}

/**
 * Discount Application Panel State
 */
export interface DiscountPanelState {
  isOpen: boolean;
  mode: 'coupon' | 'manual';
  couponCode: string;
  discountType: DiscountType;
  discountValue: number;
  isValidating: boolean;
  validationResult: CouponValidationResponse | null;
  requiresApproval: boolean;
  approvalReason: string;
}

/**
 * Manager Approval Request
 */
export interface ManagerApprovalRequest {
  saleId: string;
  discountType: DiscountType;
  discountValue: number;
  discountPercentage: number;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  couponId?: string | null;
}
