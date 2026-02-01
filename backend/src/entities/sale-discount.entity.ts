import { DiscountType } from '../enums';

/**
 * Sale Discount Entity
 * Records discounts applied to individual sales
 * Database table: sale_discounts
 * Feature: F-023 Discount and Coupon Management
 */
export interface SaleDiscount {
  id: string;
  sale_id: string;
  coupon_id: string | null;
  discount_type: DiscountType;
  discount_value: number;
  discount_amount: number;
  original_price: number;
  final_price: number;
  applied_by: string | null;
  manager_approved_by: string | null;
  manager_approval_reason: string | null;
  created_at: string;
}

export interface SaleDiscountInsert {
  id?: string;
  sale_id: string;
  coupon_id?: string | null;
  discount_type: DiscountType;
  discount_value: number;
  discount_amount: number;
  original_price: number;
  final_price: number;
  applied_by?: string | null;
  manager_approved_by?: string | null;
  manager_approval_reason?: string | null;
  created_at?: string;
}

export interface SaleDiscountUpdate {
  manager_approved_by?: string | null;
  manager_approval_reason?: string | null;
}

/**
 * Sale Discount with related coupon info for display
 */
export interface SaleDiscountWithCoupon extends SaleDiscount {
  coupon?: {
    id: string;
    code: string;
    description: string | null;
  } | null;
}
