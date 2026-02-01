import { PaymentSummary } from './payment.model';

/**
 * Email Receipt Models
 * Feature: F-021 Email Receipt Option
 */

/**
 * Request to send a receipt via email
 */
export interface SendEmailReceiptRequest {
  receiptId: string;
  recipientEmail: string;
  recipientName?: string | null;
}

/**
 * Request to send a receipt email directly (without stored receipt)
 */
export interface SendEmailReceiptDirectRequest {
  receiptNumber: string;
  transactionDate: string;
  transactionTime: string;
  items: EmailReceiptItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  customerName?: string | null;
  customerPhone?: string | null;
  recipientEmail: string;
  notes?: string | null;
  payments?: EmailReceiptPayment[];
}

/**
 * Email receipt item
 */
export interface EmailReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxRate?: number;
  taxAmount?: number;
}

/**
 * Email receipt payment details
 */
export interface EmailReceiptPayment {
  method: string;
  amount: number;
  cardLastFour?: string | null;
  transactionReference?: string | null;
}

/**
 * Response from sending an email receipt
 */
export interface SendEmailReceiptResponse {
  success: boolean;
  message: string;
  messageId?: string;
  sentAt?: string;
  error?: string;
  retryable?: boolean;
}

/**
 * Request to retry a failed email send
 */
export interface RetryEmailReceiptRequest {
  sendLogId: string;
}

/**
 * Response from retry attempt
 */
export interface RetryEmailReceiptResponse {
  success: boolean;
  message: string;
  sendLog?: {
    id: string;
    receiptId: string;
    status: string;
    sentAt: string;
  };
  error?: string;
}

/**
 * Customer receipts email request
 */
export interface CustomerReceiptsEmailRequest {
  customerId: string;
  recipientEmail: string;
  receiptIds?: string[];
}

/**
 * Response for customer receipts email
 */
export interface CustomerReceiptsEmailResponse {
  success: boolean;
  message: string;
  sentCount: number;
  failedCount: number;
  results: Array<{
    receiptId: string;
    receiptNumber: string;
    success: boolean;
    error?: string;
  }>;
}

/**
 * Failed email send record
 */
export interface FailedEmailSend {
  id: string;
  recipientEmail: string;
  errorMessage: string | null;
  createdAt: string;
}

/**
 * Email validation result
 */
export interface EmailValidationResult {
  valid: boolean;
  email: string;
}

/**
 * Build email receipt data from receipt data
 */
export function buildEmailReceiptFromReceiptData(
  receiptNumber: string,
  transactionDate: string,
  transactionTime: string,
  items: Array<{ name: string; quantity: number; unitPrice: number; total: number; taxRate?: number; taxAmount?: number }>,
  subtotal: number,
  taxRate: number,
  taxAmount: number,
  grandTotal: number,
  recipientEmail: string,
  customerName?: string | null,
  customerPhone?: string | null,
  notes?: string | null,
  payments?: PaymentSummary[]
): SendEmailReceiptDirectRequest {
  return {
    receiptNumber,
    transactionDate,
    transactionTime,
    items: items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
      taxRate: item.taxRate,
      taxAmount: item.taxAmount
    })),
    subtotal,
    taxRate,
    taxAmount,
    grandTotal,
    customerName,
    customerPhone,
    recipientEmail,
    notes,
    payments: payments?.map(p => ({
      method: p.method,
      amount: p.amount,
      cardLastFour: p.cardLastFour,
      transactionReference: p.transactionReference
    }))
  };
}
