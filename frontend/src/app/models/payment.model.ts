import { PaymentMethod } from '../enums/payment-method.enum';

/**
 * Payment Models
 * Feature: F-018 Payment Method Integration
 */

/**
 * Payment detail for a single payment method
 */
export interface PaymentDetail {
  method: PaymentMethod;
  amount: number;
  /** For cash payments: amount tendered by customer */
  cashTendered?: number | null;
  /** For cash payments: change returned to customer (calculated) */
  changeGiven?: number | null;
  /** For card payments: last 4 digits of card */
  cardLastFour?: string | null;
  /** For card payments: card type (Visa, Mastercard, etc.) */
  cardType?: string | null;
  /** For UPI/digital: transaction reference number */
  transactionReference?: string | null;
  /** For 'other' payment method: description */
  paymentDescription?: string | null;
}

/**
 * Payment summary for display on sales/receipts
 */
export interface PaymentSummary {
  method: PaymentMethod;
  amount: number;
  cardLastFour?: string | null;
  transactionReference?: string | null;
  cashTendered?: number | null;
  changeGiven?: number | null;
}

/**
 * Request to record payments for a sale
 */
export interface RecordPaymentsRequest {
  saleId: string;
  payments: PaymentDetail[];
}

/**
 * Response for a payment record
 */
export interface PaymentResponse {
  id: string;
  saleId: string;
  method: PaymentMethod;
  amount: number;
  cashTendered: number | null;
  changeGiven: number | null;
  cardLastFour: string | null;
  cardType: string | null;
  transactionReference: string | null;
  paymentDescription: string | null;
  createdAt: string;
}

/**
 * Cash change calculation request
 */
export interface CashChangeRequest {
  amountDue: number;
  cashTendered: number;
}

/**
 * Cash change calculation response
 */
export interface CashChangeResponse {
  amountDue: number;
  cashTendered: number;
  changeGiven: number;
  isExact: boolean;
  isInsufficient: boolean;
}

/**
 * Split payment validation result
 */
export interface SplitPaymentValidation {
  isValid: boolean;
  totalPaid: number;
  amountDue: number;
  difference: number;
  message: string;
}

/**
 * Payment method option for dropdowns
 */
export interface PaymentMethodOption {
  label: string;
  value: PaymentMethod;
  icon: string;
}

/**
 * Payment state for the sale creation form
 */
export interface PaymentFormState {
  payments: PaymentDetail[];
  isSplitPayment: boolean;
  totalPaid: number;
  remainingAmount: number;
  changeAmount: number;
  isValid: boolean;
  validationMessage: string;
}

/**
 * Default payment state
 */
export function createDefaultPaymentState(totalDue: number): PaymentFormState {
  return {
    payments: [{
      method: PaymentMethod.CASH,
      amount: totalDue
    }],
    isSplitPayment: false,
    totalPaid: totalDue,
    remainingAmount: 0,
    changeAmount: 0,
    isValid: true,
    validationMessage: ''
  };
}

/**
 * Create a default single payment
 */
export function createDefaultPayment(amount: number, method: PaymentMethod = PaymentMethod.CASH): PaymentDetail {
  return {
    method,
    amount
  };
}
