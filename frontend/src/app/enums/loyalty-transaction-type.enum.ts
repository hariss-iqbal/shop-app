/**
 * Loyalty Transaction Type Enum
 * Represents types of loyalty point transactions
 * Feature: F-022 Loyalty Points Integration
 */
export enum LoyaltyTransactionType {
  EARNED = 'earned',
  REDEEMED = 'redeemed',
  EXPIRED = 'expired',
  ADJUSTED = 'adjusted',
  BONUS = 'bonus'
}

/**
 * Human-readable labels for transaction types
 */
export const LoyaltyTransactionTypeLabels: Record<LoyaltyTransactionType, string> = {
  [LoyaltyTransactionType.EARNED]: 'Points Earned',
  [LoyaltyTransactionType.REDEEMED]: 'Points Redeemed',
  [LoyaltyTransactionType.EXPIRED]: 'Points Expired',
  [LoyaltyTransactionType.ADJUSTED]: 'Points Adjusted',
  [LoyaltyTransactionType.BONUS]: 'Bonus Points'
};

/**
 * Severity for PrimeNG Tag component
 */
export const LoyaltyTransactionTypeSeverity: Record<LoyaltyTransactionType, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
  [LoyaltyTransactionType.EARNED]: 'success',
  [LoyaltyTransactionType.REDEEMED]: 'info',
  [LoyaltyTransactionType.EXPIRED]: 'danger',
  [LoyaltyTransactionType.ADJUSTED]: 'warn',
  [LoyaltyTransactionType.BONUS]: 'success'
};

/**
 * Icons for transaction types
 */
export const LoyaltyTransactionTypeIcons: Record<LoyaltyTransactionType, string> = {
  [LoyaltyTransactionType.EARNED]: 'pi pi-plus-circle',
  [LoyaltyTransactionType.REDEEMED]: 'pi pi-minus-circle',
  [LoyaltyTransactionType.EXPIRED]: 'pi pi-clock',
  [LoyaltyTransactionType.ADJUSTED]: 'pi pi-pencil',
  [LoyaltyTransactionType.BONUS]: 'pi pi-gift'
};

/**
 * Type guard for LoyaltyTransactionType
 */
export function isValidLoyaltyTransactionType(value: string): value is LoyaltyTransactionType {
  return Object.values(LoyaltyTransactionType).includes(value as LoyaltyTransactionType);
}

/**
 * Get transaction type display name
 */
export function getLoyaltyTransactionTypeLabel(type: LoyaltyTransactionType | string | null): string {
  if (!type) return '';
  return LoyaltyTransactionTypeLabels[type as LoyaltyTransactionType] || type;
}

/**
 * Get transaction type severity for PrimeNG components
 */
export function getLoyaltyTransactionTypeSeverity(type: LoyaltyTransactionType | string | null): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
  if (!type) return 'secondary';
  return LoyaltyTransactionTypeSeverity[type as LoyaltyTransactionType] || 'secondary';
}

/**
 * Get transaction type icon
 */
export function getLoyaltyTransactionTypeIcon(type: LoyaltyTransactionType | string | null): string {
  if (!type) return 'pi pi-circle';
  return LoyaltyTransactionTypeIcons[type as LoyaltyTransactionType] || 'pi pi-circle';
}
