/**
 * Payment Method Enum
 * Feature: F-018 Payment Method Integration
 */
export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer'
}

/**
 * Payment method display labels
 */
export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Cash',
  [PaymentMethod.CARD]: 'Card',
  [PaymentMethod.BANK_TRANSFER]: 'Bank Transfer'
};

/**
 * Payment method icons (PrimeNG icons)
 */
export const PaymentMethodIcons: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'pi pi-money-bill',
  [PaymentMethod.CARD]: 'pi pi-credit-card',
  [PaymentMethod.BANK_TRANSFER]: 'pi pi-building'
};

/**
 * Payment method dropdown options for p-select
 */
export const PaymentMethodOptions = [
  { label: 'Cash', value: PaymentMethod.CASH, icon: 'pi pi-money-bill' },
  { label: 'Card', value: PaymentMethod.CARD, icon: 'pi pi-credit-card' },
  { label: 'Bank Transfer', value: PaymentMethod.BANK_TRANSFER, icon: 'pi pi-building' }
];

/**
 * Check if a value is a valid PaymentMethod
 */
export function isValidPaymentMethod(value: string): value is PaymentMethod {
  return Object.values(PaymentMethod).includes(value as PaymentMethod);
}
