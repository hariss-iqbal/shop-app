/**
 * Discount Type Enum
 * Represents the type of discount applied to a sale
 * Feature: F-023 Discount and Coupon Management
 */
export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount'
}

export const DiscountTypeLabels: Record<DiscountType, string> = {
  [DiscountType.PERCENTAGE]: 'Percentage',
  [DiscountType.FIXED_AMOUNT]: 'Fixed Amount'
};

export function isValidDiscountType(value: string): value is DiscountType {
  return Object.values(DiscountType).includes(value as DiscountType);
}

export function getDiscountTypeLabel(type: DiscountType): string {
  return DiscountTypeLabels[type] || type;
}
