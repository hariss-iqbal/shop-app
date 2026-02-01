/**
 * Payment Method Enum
 * Feature: F-018 Payment Method Integration
 */
export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  UPI = 'upi',
  OTHER = 'other'
}

/**
 * Payment method display labels
 */
export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Cash',
  [PaymentMethod.CARD]: 'Card',
  [PaymentMethod.UPI]: 'UPI',
  [PaymentMethod.OTHER]: 'Other'
};

/**
 * Payment method icons (PrimeNG icons)
 */
export const PaymentMethodIcons: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'pi pi-money-bill',
  [PaymentMethod.CARD]: 'pi pi-credit-card',
  [PaymentMethod.UPI]: 'pi pi-mobile',
  [PaymentMethod.OTHER]: 'pi pi-wallet'
};

/**
 * Payment method dropdown options for p-select
 */
export const PaymentMethodOptions = [
  { label: 'Cash', value: PaymentMethod.CASH, icon: 'pi pi-money-bill' },
  { label: 'Card', value: PaymentMethod.CARD, icon: 'pi pi-credit-card' },
  { label: 'UPI', value: PaymentMethod.UPI, icon: 'pi pi-mobile' },
  { label: 'Other', value: PaymentMethod.OTHER, icon: 'pi pi-wallet' }
];

/**
 * Check if a value is a valid PaymentMethod
 */
export function isValidPaymentMethod(value: string): value is PaymentMethod {
  return Object.values(PaymentMethod).includes(value as PaymentMethod);
}
