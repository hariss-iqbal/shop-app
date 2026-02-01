/**
 * Coupon Redemption Entity
 * Tracks individual coupon redemptions for audit and analytics
 * Database table: coupon_redemptions
 * Feature: F-023 Discount and Coupon Management
 */
export interface CouponRedemption {
  id: string;
  coupon_id: string;
  sale_id: string;
  discount_amount: number;
  redeemed_by: string | null;
  redeemed_at: string;
}

export interface CouponRedemptionInsert {
  id?: string;
  coupon_id: string;
  sale_id: string;
  discount_amount: number;
  redeemed_by?: string | null;
  redeemed_at?: string;
}

/**
 * Coupon Redemption with related info for display
 */
export interface CouponRedemptionWithDetails extends CouponRedemption {
  coupon?: {
    id: string;
    code: string;
    discount_type: string;
    discount_value: number;
  };
  sale?: {
    id: string;
    sale_date: string;
    sale_price: number;
    buyer_name: string | null;
  };
}
