import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ToastService } from '../../shared/services/toast.service';
import {
  SendEmailReceiptRequest,
  SendEmailReceiptDirectRequest,
  SendEmailReceiptResponse,
  RetryEmailReceiptRequest,
  RetryEmailReceiptResponse,
  CustomerReceiptsEmailRequest,
  CustomerReceiptsEmailResponse,
  FailedEmailSend,
  buildEmailReceiptFromReceiptData
} from '../../models/email-receipt.model';
import { ReceiptData } from '../../models/sale.model';

export interface EmailSendOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

/**
 * Email Receipt Service
 * Handles sending receipts via email
 * Feature: F-021 Email Receipt Option
 */
@Injectable({
  providedIn: 'root'
})
export class EmailReceiptService {
  constructor(
    private supabase: SupabaseService,
    private toastService: ToastService
  ) { }

  /**
   * Send a receipt via email using stored receipt ID
   */
  async sendReceiptEmail(
    request: SendEmailReceiptRequest,
    options: EmailSendOptions = {}
  ): Promise<SendEmailReceiptResponse> {
    const { showSuccessToast = true, showErrorToast = true } = options;

    if (!this.isValidEmail(request.recipientEmail)) {
      const error = 'Invalid email address format';
      if (showErrorToast) {
        this.toastService.error('Invalid Email', error);
      }
      return { success: false, message: error, error, retryable: false };
    }

    try {
      const { data, error } = await this.supabase.rpc('send_receipt_email', {
        p_receipt_id: request.receiptId,
        p_recipient_email: request.recipientEmail.trim().toLowerCase(),
        p_recipient_name: request.recipientName?.trim() || null
      });

      if (error) {
        if (showErrorToast) {
          this.toastService.error('Email Failed', error.message);
        }
        return {
          success: false,
          message: 'Failed to send email',
          error: error.message,
          retryable: true
        };
      }

      if (showSuccessToast) {
        this.toastService.success(
          'Email Sent',
          `Receipt sent to ${request.recipientEmail}`
        );
      }

      return {
        success: true,
        message: 'Email sent successfully',
        messageId: data?.messageId,
        sentAt: new Date().toISOString()
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send email';
      if (showErrorToast) {
        this.toastService.error('Email Failed', errorMessage);
      }
      return {
        success: false,
        message: 'Failed to send email',
        error: errorMessage,
        retryable: true
      };
    }
  }

  /**
   * Send a receipt via email directly from receipt data
   * (without requiring a stored receipt)
   */
  async sendReceiptEmailDirect(
    request: SendEmailReceiptDirectRequest,
    options: EmailSendOptions = {}
  ): Promise<SendEmailReceiptResponse> {
    const { showSuccessToast = true, showErrorToast = true } = options;

    if (!this.isValidEmail(request.recipientEmail)) {
      const error = 'Invalid email address format';
      if (showErrorToast) {
        this.toastService.error('Invalid Email', error);
      }
      return { success: false, message: error, error, retryable: false };
    }

    try {
      const { data, error } = await this.supabase.rpc('send_receipt_email_direct', {
        p_receipt_number: request.receiptNumber,
        p_transaction_date: request.transactionDate,
        p_transaction_time: request.transactionTime,
        p_items: request.items,
        p_subtotal: request.subtotal,
        p_tax_rate: request.taxRate,
        p_tax_amount: request.taxAmount,
        p_grand_total: request.grandTotal,
        p_customer_name: request.customerName || null,
        p_customer_phone: request.customerPhone || null,
        p_recipient_email: request.recipientEmail.trim().toLowerCase(),
        p_notes: request.notes || null,
        p_payments: request.payments || null
      });

      if (error) {
        if (showErrorToast) {
          this.toastService.error('Email Failed', error.message);
        }
        return {
          success: false,
          message: 'Failed to send email',
          error: error.message,
          retryable: true
        };
      }

      if (showSuccessToast) {
        this.toastService.success(
          'Email Sent',
          `Receipt sent to ${request.recipientEmail}`
        );
      }

      return {
        success: true,
        message: 'Email sent successfully',
        messageId: data?.messageId,
        sentAt: new Date().toISOString()
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send email';
      if (showErrorToast) {
        this.toastService.error('Email Failed', errorMessage);
      }
      return {
        success: false,
        message: 'Failed to send email',
        error: errorMessage,
        retryable: true
      };
    }
  }

  /**
   * Send receipt data via email
   * Convenience method that builds the request from ReceiptData
   */
  async sendReceiptDataViaEmail(
    receiptData: ReceiptData,
    recipientEmail: string,
    options: EmailSendOptions = {}
  ): Promise<SendEmailReceiptResponse> {
    const request = buildEmailReceiptFromReceiptData(
      receiptData.receiptNumber,
      receiptData.transactionDate,
      receiptData.transactionTime,
      receiptData.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount
      })),
      receiptData.subtotal,
      receiptData.taxRate,
      receiptData.taxAmount,
      receiptData.grandTotal,
      recipientEmail,
      receiptData.customerName,
      receiptData.customerPhone,
      receiptData.notes,
      receiptData.payments
    );

    return this.sendReceiptEmailDirect(request, options);
  }

  /**
   * Retry a failed email send
   */
  async retryFailedSend(
    request: RetryEmailReceiptRequest,
    options: EmailSendOptions = {}
  ): Promise<RetryEmailReceiptResponse> {
    const { showSuccessToast = true, showErrorToast = true } = options;

    try {
      const { data, error } = await this.supabase.rpc('retry_email_receipt', {
        p_send_log_id: request.sendLogId
      });

      if (error) {
        if (showErrorToast) {
          this.toastService.error('Retry Failed', error.message);
        }
        return {
          success: false,
          message: 'Failed to retry email send',
          error: error.message
        };
      }

      if (data?.success) {
        if (showSuccessToast) {
          this.toastService.success('Email Sent', 'Receipt email sent successfully');
        }
        return {
          success: true,
          message: 'Email sent successfully',
          sendLog: data.sendLog
        };
      }

      if (showErrorToast) {
        this.toastService.error('Retry Failed', data?.error || 'Unknown error');
      }
      return {
        success: false,
        message: data?.message || 'Failed to retry email send',
        error: data?.error
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retry email send';
      if (showErrorToast) {
        this.toastService.error('Retry Failed', errorMessage);
      }
      return {
        success: false,
        message: 'Failed to retry email send',
        error: errorMessage
      };
    }
  }

  /**
   * Send recent receipts to a customer via email
   */
  async sendCustomerReceipts(
    request: CustomerReceiptsEmailRequest,
    options: EmailSendOptions = {}
  ): Promise<CustomerReceiptsEmailResponse> {
    const { showSuccessToast = true, showErrorToast = true } = options;

    if (!this.isValidEmail(request.recipientEmail)) {
      const error = 'Invalid email address format';
      if (showErrorToast) {
        this.toastService.error('Invalid Email', error);
      }
      return {
        success: false,
        message: error,
        sentCount: 0,
        failedCount: 0,
        results: []
      };
    }

    try {
      const { data, error } = await this.supabase.rpc('send_customer_receipts_email', {
        p_customer_id: request.customerId,
        p_recipient_email: request.recipientEmail.trim().toLowerCase(),
        p_receipt_ids: request.receiptIds || null
      });

      if (error) {
        if (showErrorToast) {
          this.toastService.error('Email Failed', error.message);
        }
        return {
          success: false,
          message: 'Failed to send customer receipts',
          sentCount: 0,
          failedCount: 0,
          results: []
        };
      }

      if (data?.success && showSuccessToast) {
        this.toastService.success(
          'Receipts Sent',
          `${data.sentCount} receipt${data.sentCount > 1 ? 's' : ''} sent to ${request.recipientEmail}`
        );
      } else if (!data?.success && showErrorToast) {
        this.toastService.error('Email Failed', data?.message || 'Failed to send receipts');
      }

      return {
        success: data?.success || false,
        message: data?.message || 'Unknown response',
        sentCount: data?.sentCount || 0,
        failedCount: data?.failedCount || 0,
        results: data?.results || []
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send customer receipts';
      if (showErrorToast) {
        this.toastService.error('Email Failed', errorMessage);
      }
      return {
        success: false,
        message: errorMessage,
        sentCount: 0,
        failedCount: 0,
        results: []
      };
    }
  }

  /**
   * Get failed email sends for a receipt
   */
  async getFailedSends(receiptId: string): Promise<FailedEmailSend[]> {
    try {
      const { data, error } = await this.supabase
        .from('receipt_send_logs')
        .select('id, recipient_email, error_message, created_at')
        .eq('receipt_id', receiptId)
        .eq('channel', 'email')
        .eq('status', 'failed')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching failed sends:', error);
        return [];
      }

      return (data || []).map(log => ({
        id: log.id,
        recipientEmail: log.recipient_email || '',
        errorMessage: log.error_message,
        createdAt: log.created_at
      }));
    } catch (err) {
      console.error('Error fetching failed sends:', err);
      return [];
    }
  }

  /**
   * Validate email address format
   */
  isValidEmail(email: string | null | undefined): boolean {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Check if email can be sent (has valid email)
   */
  canSendEmail(email: string | null | undefined): boolean {
    return this.isValidEmail(email);
  }

  /**
   * Format email for display
   */
  formatEmailDisplay(email: string): string {
    return email.trim().toLowerCase();
  }
}
