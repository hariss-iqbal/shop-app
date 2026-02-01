/**
 * Payment Method Enum
 * Feature: F-018 Payment Method Integration
 * Database enum: payment_method_type
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
 * Check if a value is a valid PaymentMethod
 */
export function isValidPaymentMethod(value: string): value is PaymentMethod {
  return Object.values(PaymentMethod).includes(value as PaymentMethod);
}
