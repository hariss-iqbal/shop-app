/**
 * Email Receipt DTOs
 * Data Transfer Objects for Email Receipt functionality
 * Feature: F-021 Email Receipt Option
 */

/**
 * Request to send a receipt via email
 */
export interface SendEmailReceiptDto {
  receiptId: string;
  recipientEmail: string;
  recipientName?: string | null;
}

/**
 * Request to send a receipt email from receipt data (without stored receipt)
 */
export interface SendEmailReceiptDirectDto {
  receiptNumber: string;
  transactionDate: string;
  transactionTime: string;
  items: EmailReceiptItemDto[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  customerName?: string | null;
  customerPhone?: string | null;
  recipientEmail: string;
  notes?: string | null;
  payments?: EmailReceiptPaymentDto[];
}

/**
 * Email receipt item
 */
export interface EmailReceiptItemDto {
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
export interface EmailReceiptPaymentDto {
  method: string;
  amount: number;
  cardLastFour?: string | null;
  transactionReference?: string | null;
}

/**
 * Response from sending an email receipt
 */
export interface SendEmailReceiptResponseDto {
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
export interface RetryEmailReceiptDto {
  sendLogId: string;
}

/**
 * Response from retry attempt
 */
export interface RetryEmailReceiptResponseDto {
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
 * Email receipt template data
 */
export interface EmailReceiptTemplateDataDto {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  receiptNumber: string;
  transactionDate: string;
  transactionTime: string;
  items: EmailReceiptItemDto[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  customerName?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
  payments?: EmailReceiptPaymentDto[];
  receiptLookupUrl: string;
  year: number;
}

/**
 * Store configuration for email templates
 */
export interface StoreConfigDto {
  name: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  siteUrl: string;
}

/**
 * Email send status for tracking
 */
export type EmailSendStatusDto = 'sent' | 'failed' | 'pending' | 'retrying';

/**
 * Customer receipts request - get recent receipts for a customer
 */
export interface CustomerReceiptsEmailRequestDto {
  customerId: string;
  recipientEmail: string;
  receiptIds?: string[];
}

/**
 * Response for customer receipts email
 */
export interface CustomerReceiptsEmailResponseDto {
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
