import { PaymentMethod } from '../enums';

/**
 * Payment DTOs
 * Feature: F-018 Payment Method Integration
 * Data Transfer Objects for payment method handling
 */

/**
 * Base payment detail for a single payment method
 */
export interface PaymentDetailDto {
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
 * Request DTO for creating a payment record
 */
export interface CreatePaymentDto {
  saleId: string;
  method: PaymentMethod;
  amount: number;
  cashTendered?: number | null;
  cardLastFour?: string | null;
  cardType?: string | null;
  transactionReference?: string | null;
  paymentDescription?: string | null;
}

/**
 * Response DTO for a payment record
 */
export interface PaymentResponseDto {
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
 * Payment summary for display on sales/receipts
 */
export interface PaymentSummaryDto {
  method: PaymentMethod;
  amount: number;
  cardLastFour?: string | null;
  transactionReference?: string | null;
  cashTendered?: number | null;
  changeGiven?: number | null;
}

/**
 * Request DTO for recording payments during a sale
 * Supports both single and split payments
 */
export interface RecordSalePaymentsDto {
  saleId: string;
  payments: PaymentDetailDto[];
}

/**
 * Cash payment calculation request
 */
export interface CalculateCashChangeDto {
  amountDue: number;
  cashTendered: number;
}

/**
 * Cash payment calculation response
 */
export interface CashChangeResponseDto {
  amountDue: number;
  cashTendered: number;
  changeGiven: number;
  isExact: boolean;
  isInsufficient: boolean;
}

/**
 * Split payment validation result
 */
export interface SplitPaymentValidationDto {
  isValid: boolean;
  totalPaid: number;
  amountDue: number;
  difference: number;
  message: string;
}

/**
 * Payment constraint constants
 */
export const PAYMENT_CONSTRAINTS = {
  CARD_LAST_FOUR_LENGTH: 4,
  CARD_TYPE_MAX: 50,
  TRANSACTION_REFERENCE_MAX: 100,
  PAYMENT_DESCRIPTION_MAX: 200
} as const;
