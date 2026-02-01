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
  [DiscountType.PERCENTAGE]: 'Percentage (%)',
  [DiscountType.FIXED_AMOUNT]: 'Fixed Amount'
};

export const DiscountTypeIcons: Record<DiscountType, string> = {
  [DiscountType.PERCENTAGE]: 'pi pi-percentage',
  [DiscountType.FIXED_AMOUNT]: 'pi pi-dollar'
};

export function isValidDiscountType(value: string): value is DiscountType {
  return Object.values(DiscountType).includes(value as DiscountType);
}

export function getDiscountTypeLabel(type: DiscountType): string {
  return DiscountTypeLabels[type] || type;
}

export function getDiscountTypeIcon(type: DiscountType): string {
  return DiscountTypeIcons[type] || 'pi pi-tag';
}

export function formatDiscountValue(type: DiscountType, value: number): string {
  if (type === DiscountType.PERCENTAGE) {
    return `${value}%`;
  }
  return `$${value.toFixed(2)}`;
}
