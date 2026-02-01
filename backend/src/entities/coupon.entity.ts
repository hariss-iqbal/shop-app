import { DiscountType, CouponStatus } from '../enums';

/**
 * Coupon Entity
 * Represents a discount coupon that can be applied to sales
 * Database table: coupons
 * Feature: F-023 Discount and Coupon Management
 */
export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  min_purchase_amount: number | null;
  max_discount_amount: number | null;
  max_redemptions: number | null;
  current_redemptions: number;
  valid_from: string;
  valid_until: string | null;
  status: CouponStatus;
  requires_manager_approval: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CouponInsert {
  id?: string;
  code: string;
  description?: string | null;
  discount_type: DiscountType;
  discount_value: number;
  min_purchase_amount?: number | null;
  max_discount_amount?: number | null;
  max_redemptions?: number | null;
  current_redemptions?: number;
  valid_from: string;
  valid_until?: string | null;
  status?: CouponStatus;
  requires_manager_approval?: boolean;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string | null;
}

export interface CouponUpdate {
  code?: string;
  description?: string | null;
  discount_type?: DiscountType;
  discount_value?: number;
  min_purchase_amount?: number | null;
  max_discount_amount?: number | null;
  max_redemptions?: number | null;
  current_redemptions?: number;
  valid_from?: string;
  valid_until?: string | null;
  status?: CouponStatus;
  requires_manager_approval?: boolean;
  updated_at?: string | null;
}

/**
 * Coupon with computed properties for display
 */
export interface CouponWithStats extends Coupon {
  remaining_redemptions: number | null;
  is_valid: boolean;
  days_until_expiry: number | null;
}
