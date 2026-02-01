import { PaymentMethod } from '../enums';

/**
 * Sale Payment Entity
 * Records payment details for a sale
 * Database table: sale_payments
 * Feature: F-018 Payment Method Integration
 */
export interface SalePayment {
  id: string;
  sale_id: string;
  payment_method: PaymentMethod;
  amount: number;
  cash_tendered: number | null;
  change_given: number | null;
  card_last_four: string | null;
  card_type: string | null;
  transaction_reference: string | null;
  payment_description: string | null;
  created_at: string;
}

export interface SalePaymentInsert {
  id?: string;
  sale_id: string;
  payment_method: PaymentMethod;
  amount: number;
  cash_tendered?: number | null;
  change_given?: number | null;
  card_last_four?: string | null;
  card_type?: string | null;
  transaction_reference?: string | null;
  payment_description?: string | null;
  created_at?: string;
}

export interface SalePaymentUpdate {
  payment_method?: PaymentMethod;
  amount?: number;
  cash_tendered?: number | null;
  change_given?: number | null;
  card_last_four?: string | null;
  card_type?: string | null;
  transaction_reference?: string | null;
  payment_description?: string | null;
}

/**
 * Receipt Payment Entity
 * Stores payment details on receipts
 * Database table: receipt_payments
 */
export interface ReceiptPayment {
  id: string;
  receipt_id: string;
  payment_method: PaymentMethod;
  amount: number;
  cash_tendered: number | null;
  change_given: number | null;
  card_last_four: string | null;
  card_type: string | null;
  transaction_reference: string | null;
  payment_description: string | null;
  created_at: string;
}

export interface ReceiptPaymentInsert {
  id?: string;
  receipt_id: string;
  payment_method: PaymentMethod;
  amount: number;
  cash_tendered?: number | null;
  change_given?: number | null;
  card_last_four?: string | null;
  card_type?: string | null;
  transaction_reference?: string | null;
  payment_description?: string | null;
  created_at?: string;
}

/**
 * Payment summary stored in JSONB on sales/receipts tables
 */
export interface PaymentSummaryJson {
  method: PaymentMethod;
  amount: number;
  cardLastFour?: string | null;
  transactionReference?: string | null;
  cashTendered?: number | null;
  changeGiven?: number | null;
}
