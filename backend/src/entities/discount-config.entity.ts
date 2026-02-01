/**
 * Discount Configuration Entity
 * Singleton configuration for discount policies
 * Database table: discount_configs
 * Feature: F-023 Discount and Coupon Management
 */
export interface DiscountConfig {
  id: string;
  /** Discount percentage threshold requiring manager approval */
  manager_approval_threshold: number;
  /** Maximum allowed discount percentage */
  max_discount_percentage: number;
  /** Maximum allowed fixed discount amount */
  max_discount_amount: number;
  /** Whether discounts are enabled globally */
  discounts_enabled: boolean;
  /** Whether coupons are enabled globally */
  coupons_enabled: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface DiscountConfigInsert {
  id?: string;
  manager_approval_threshold?: number;
  max_discount_percentage?: number;
  max_discount_amount?: number;
  discounts_enabled?: boolean;
  coupons_enabled?: boolean;
  created_at?: string;
  updated_at?: string | null;
}

export interface DiscountConfigUpdate {
  manager_approval_threshold?: number;
  max_discount_percentage?: number;
  max_discount_amount?: number;
  discounts_enabled?: boolean;
  coupons_enabled?: boolean;
  updated_at?: string | null;
}
