/**
 * Coupon Status Enum
 * Represents the status of a coupon
 * Feature: F-023 Discount and Coupon Management
 */
export enum CouponStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  DISABLED = 'disabled',
  DEPLETED = 'depleted'
}

export const CouponStatusLabels: Record<CouponStatus, string> = {
  [CouponStatus.ACTIVE]: 'Active',
  [CouponStatus.EXPIRED]: 'Expired',
  [CouponStatus.DISABLED]: 'Disabled',
  [CouponStatus.DEPLETED]: 'Depleted'
};

export const CouponStatusSeverity: Record<CouponStatus, string> = {
  [CouponStatus.ACTIVE]: 'success',
  [CouponStatus.EXPIRED]: 'danger',
  [CouponStatus.DISABLED]: 'secondary',
  [CouponStatus.DEPLETED]: 'warning'
};

export function isValidCouponStatus(value: string): value is CouponStatus {
  return Object.values(CouponStatus).includes(value as CouponStatus);
}

export function getCouponStatusLabel(status: CouponStatus): string {
  return CouponStatusLabels[status] || status;
}
