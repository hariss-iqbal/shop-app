import { TestBed } from '@angular/core/testing';
import { EmailReceiptService } from './email-receipt.service';
import { SupabaseService } from './supabase.service';
import { ToastService } from '../../shared/services/toast.service';
import {
  SendEmailReceiptRequest,
  SendEmailReceiptDirectRequest,
  RetryEmailReceiptRequest,
  CustomerReceiptsEmailRequest
} from '../../models/email-receipt.model';
import { ReceiptData } from '../../models/sale.model';
import { PaymentMethod } from '../../enums/payment-method.enum';

/**
 * Unit Tests for EmailReceiptService
 * Feature: F-021 Email Receipt Option
 */
describe('EmailReceiptService', () => {
  let service: EmailReceiptService;
  let supabaseServiceSpy: jasmine.SpyObj<SupabaseService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  const mockRpcResponse = (data: unknown, error: Error | null = null) => {
    return Promise.resolve({ data, error });
  };

  const mockFromResponse = (data: unknown[], error: Error | null = null) => {
    return {
      select: jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            eq: jasmine.createSpy('eq').and.returnValue({
              order: jasmine.createSpy('order').and.returnValue(
                Promise.resolve({ data, error })
              )
            })
          })
        })
      })
    };
  };

  beforeEach(() => {
    const supabaseSpy = jasmine.createSpyObj('SupabaseService', ['rpc', 'from']);
    const toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    TestBed.configureTestingModule({
      providers: [
        EmailReceiptService,
        { provide: SupabaseService, useValue: supabaseSpy },
        { provide: ToastService, useValue: toastSpy }
      ]
    });

    service = TestBed.inject(EmailReceiptService);
    supabaseServiceSpy = TestBed.inject(SupabaseService) as jasmine.SpyObj<SupabaseService>;
    toastServiceSpy = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(service.isValidEmail('test@example.com')).toBeTrue();
      expect(service.isValidEmail('user.name@domain.org')).toBeTrue();
      expect(service.isValidEmail('user+tag@example.co.uk')).toBeTrue();
    });

    it('should return false for invalid email addresses', () => {
      expect(service.isValidEmail('')).toBeFalse();
      expect(service.isValidEmail('invalid')).toBeFalse();
      expect(service.isValidEmail('invalid@')).toBeFalse();
      expect(service.isValidEmail('@domain.com')).toBeFalse();
      expect(service.isValidEmail('test@domain')).toBeFalse();
      expect(service.isValidEmail('test @example.com')).toBeFalse();
    });

    it('should return false for null or undefined', () => {
      expect(service.isValidEmail(null)).toBeFalse();
      expect(service.isValidEmail(undefined)).toBeFalse();
    });

    it('should trim whitespace before validating', () => {
      expect(service.isValidEmail('  test@example.com  ')).toBeTrue();
    });
  });

  describe('canSendEmail', () => {
    it('should return true for valid email', () => {
      expect(service.canSendEmail('test@example.com')).toBeTrue();
    });

    it('should return false for invalid email', () => {
      expect(service.canSendEmail('invalid')).toBeFalse();
      expect(service.canSendEmail(null)).toBeFalse();
    });
  });

  describe('formatEmailDisplay', () => {
    it('should trim and lowercase email', () => {
      expect(service.formatEmailDisplay('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
    });
  });

  describe('sendReceiptEmail', () => {
    const validRequest: SendEmailReceiptRequest = {
      receiptId: 'receipt-123',
      recipientEmail: 'customer@example.com',
      recipientName: 'John Doe'
    };

    it('should return error for invalid email address', async () => {
      const result = await service.sendReceiptEmail({
        ...validRequest,
        recipientEmail: 'invalid'
      });

      expect(result.success).toBeFalse();
      expect(result.message).toBe('Invalid email address format');
      expect(result.retryable).toBeFalse();
      expect(toastServiceSpy.error).toHaveBeenCalled();
    });

    it('should not show error toast when showErrorToast is false', async () => {
      const result = await service.sendReceiptEmail(
        { ...validRequest, recipientEmail: 'invalid' },
        { showErrorToast: false }
      );

      expect(result.success).toBeFalse();
      expect(toastServiceSpy.error).not.toHaveBeenCalled();
    });

    it('should call RPC with correct parameters', async () => {
      supabaseServiceSpy.rpc.and.returnValue(
        mockRpcResponse({ messageId: 'msg-123' }) as any
      );

      await service.sendReceiptEmail(validRequest);

      expect(supabaseServiceSpy.rpc).toHaveBeenCalledWith('send_receipt_email', {
        p_receipt_id: validRequest.receiptId,
        p_recipient_email: validRequest.recipientEmail.trim().toLowerCase(),
        p_recipient_name: validRequest.recipientName?.trim() || null
      });
    });

    it('should return success response on successful send', async () => {
      supabaseServiceSpy.rpc.and.returnValue(
        mockRpcResponse({ messageId: 'msg-123' }) as any
      );

      const result = await service.sendReceiptEmail(validRequest);

      expect(result.success).toBeTrue();
      expect(result.message).toBe('Email sent successfully');
      expect(result.messageId).toBe('msg-123');
      expect(result.sentAt).toBeDefined();
    });

    it('should show success toast when showSuccessToast is true', async () => {
      supabaseServiceSpy.rpc.and.returnValue(
        mockRpcResponse({ messageId: 'msg-123' }) as any
      );

      await service.sendReceiptEmail(validRequest, { showSuccessToast: true });

      expect(toastServiceSpy.success).toHaveBeenCalledWith(
        'Email Sent',
        `Receipt sent to ${validRequest.recipientEmail}`
      );
    });

    it('should not show success toast when showSuccessToast is false', async () => {
      supabaseServiceSpy.rpc.and.returnValue(
        mockRpcResponse({ messageId: 'msg-123' }) as any
      );

      await service.sendReceiptEmail(validRequest, { showSuccessToast: false });

      expect(toastServiceSpy.success).not.toHaveBeenCalled();
    });

    it('should handle RPC error', async () => {
      const rpcError = new Error('Database error');
      supabaseServiceSpy.rpc.and.returnValue(
        mockRpcResponse(null, rpcError) as any
      );

      const result = await service.sendReceiptEmail(validRequest);

      expect(result.success).toBeFalse();
      expect(result.error).toBe('Database error');
      expect(result.retryable).toBeTrue();
    });

    it('should handle exceptions', async () => {
      supabaseServiceSpy.rpc.and.throwError('Network error');

      const result = await service.sendReceiptEmail(validRequest);

      expect(result.success).toBeFalse();
      expect(result.retryable).toBeTrue();
    });
  });

  describe('sendReceiptEmailDirect', () => {
    const validDirectRequest: SendEmailReceiptDirectRequest = {
      receiptNumber: 'REC-001',
      transactionDate: '2026-01-31',
      transactionTime: '10:30:00',
      items: [
        { name: 'iPhone 15 Pro', quantity: 1, unitPrice: 999, total: 999 }
      ],
      subtotal: 999,
      taxRate: 8.5,
      taxAmount: 84.92,
      grandTotal: 1083.92,
      recipientEmail: 'customer@example.com',
      customerName: 'John Doe'
    };

    it('should return error for invalid email', async () => {
      const result = await service.sendReceiptEmailDirect({
        ...validDirectRequest,
        recipientEmail: 'invalid'
      });

      expect(result.success).toBeFalse();
      expect(result.retryable).toBeFalse();
    });

    it('should call RPC with correct parameters', async () => {
      supabaseServiceSpy.rpc.and.returnValue(
        mockRpcResponse({ messageId: 'msg-direct-123' }) as any
      );

      await service.sendReceiptEmailDirect(validDirectRequest);

      expect(supabaseServiceSpy.rpc).toHaveBeenCalledWith('send_receipt_email_direct', {
        p_receipt_number: validDirectRequest.receiptNumber,
        p_transaction_date: validDirectRequest.transactionDate,
        p_transaction_time: validDirectRequest.transactionTime,
        p_items: validDirectRequest.items,
        p_subtotal: validDirectRequest.subtotal,
        p_tax_rate: validDirectRequest.taxRate,
        p_tax_amount: validDirectRequest.taxAmount,
        p_grand_total: validDirectRequest.grandTotal,
        p_customer_name: validDirectRequest.customerName || null,
        p_customer_phone: validDirectRequest.customerPhone || null,
        p_recipient_email: validDirectRequest.recipientEmail.trim().toLowerCase(),
        p_notes: validDirectRequest.notes || null,
        p_payments: validDirectRequest.payments || null
      });
    });

    it('should return success response', async () => {
      supabaseServiceSpy.rpc.and.returnValue(
        mockRpcResponse({ messageId: 'msg-direct-123' }) as any
      );

      const result = await service.sendReceiptEmailDirect(validDirectRequest);

      expect(result.success).toBeTrue();
      expect(result.messageId).toBe('msg-direct-123');
    });
  });

  describe('sendReceiptDataViaEmail', () => {
    const mockReceiptData: ReceiptData = {
      receiptNumber: 'REC-001',
      transactionDate: '2026-01-31',
      transactionTime: '10:30:00',
      items: [
        {
          name: 'iPhone 15 Pro',
          quantity: 1,
          unitPrice: 999,
          total: 999,
          taxRate: 8.5,
          taxAmount: 84.92,
          basePrice: 921.20,
          isTaxExempt: false
        }
      ],
      subtotal: 999,
      taxRate: 8.5,
      taxAmount: 84.92,
      grandTotal: 1083.92,
      customerName: 'John Doe',
      customerPhone: '+1234567890',
      customerEmail: 'john@example.com',
      notes: null
    };

    it('should convert ReceiptData to direct request and send', async () => {
      supabaseServiceSpy.rpc.and.returnValue(
        mockRpcResponse({ messageId: 'msg-123' }) as any
      );

      const result = await service.sendReceiptDataViaEmail(
        mockReceiptData,
        'customer@example.com'
      );

      expect(supabaseServiceSpy.rpc).toHaveBeenCalledWith(
        'send_receipt_email_direct',
        jasmine.objectContaining({
          p_receipt_number: mockReceiptData.receiptNumber,
          p_recipient_email: 'customer@example.com'
        })
      );
      expect(result.success).toBeTrue();
    });

    it('should include payment information if available', async () => {
      const receiptWithPayments: ReceiptData = {
        ...mockReceiptData,
        payments: [
          {
            method: PaymentMethod.CASH,
            amount: 1083.92,
            cashTendered: 1100,
            changeGiven: 16.08
          }
        ]
      };

      supabaseServiceSpy.rpc.and.returnValue(
        mockRpcResponse({ messageId: 'msg-123' }) as any
      );

      await service.sendReceiptDataViaEmail(
        receiptWithPayments,
        'customer@example.com'
      );

      expect(supabaseServiceSpy.rpc).toHaveBeenCalledWith(
        'send_receipt_email_direct',
        jasmine.objectContaining({
          p_payments: jasmine.arrayContaining([
            jasmine.objectContaining({
              method: PaymentMethod.CASH,
              amount: 1083.92
            })
          ])
        })
      );
    });
  });

  describe('retryFailedSend', () => {
    const retryRequest: RetryEmailReceiptRequest = {
      sendLogId: 'log-123'
    };

    it('should call RPC with correct parameters', async () => {
      supabaseServiceSpy.rpc.and.returnValue(
        mockRpcResponse({ success: true, sendLog: { id: 'log-123', status: 'sent' } }) as any
      );

      await service.retryFailedSend(retryRequest);

      expect(supabaseServiceSpy.rpc).toHaveBeenCalledWith('retry_email_receipt', {
        p_send_log_id: retryRequest.sendLogId
      });
    });

    it('should return success on successful retry', async () => {
      supabaseServiceSpy.rpc.and.returnValue(
        mockRpcResponse({
          success: true,
          sendLog: { id: 'log-123', status: 'sent' }
        }) as any
      );

      const result = await service.retryFailedSend(retryRequest);

      expect(result.success).toBeTrue();
      expect(result.sendLog).toBeDefined();
    });

    it('should show success toast on successful retry', async () => {
      supabaseServiceSpy.rpc.and.returnValue(
        mockRpcResponse({
          success: true,
          sendLog: { id: 'log-123', status: 'sent' }
        }) as any
      );

      await service.retryFailedSend(retryRequest, { showSuccessToast: true });

      expect(toastServiceSpy.success).toHaveBeenCalledWith(
        'Email Sent',
        'Receipt email sent successfully'
      );
    });

    it('should handle RPC error', async () => {
      supabaseServiceSpy.rpc.and.returnValue(
        mockRpcResponse(null, new Error('Database error')) as any
      );

      const result = await service.retryFailedSend(retryRequest);

      expect(result.success).toBeFalse();
      expect(result.error).toBe('Database error');
    });

    it('should handle unsuccessful retry response', async () => {
      supabaseServiceSpy.rpc.and.returnValue(
        mockRpcResponse({
          success: false,
          error: 'Receipt not found'
        }) as any
      );

      const result = await service.retryFailedSend(retryRequest);

      expect(result.success).toBeFalse();
      expect(result.error).toBe('Receipt not found');
    });
  });

  describe('sendCustomerReceipts', () => {
    const customerRequest: CustomerReceiptsEmailRequest = {
      customerId: 'customer-123',
      recipientEmail: 'customer@example.com'
    };

    it('should return error for invalid email', async () => {
      const result = await service.sendCustomerReceipts({
        ...customerRequest,
        recipientEmail: 'invalid'
      });

      expect(result.success).toBeFalse();
      expect(result.sentCount).toBe(0);
    });

    it('should call RPC with correct parameters', async () => {
      supabaseServiceSpy.rpc.and.returnValue(
        mockRpcResponse({
          success: true,
          sentCount: 3,
          failedCount: 0,
          results: []
        }) as any
      );

      await service.sendCustomerReceipts(customerRequest);

      expect(supabaseServiceSpy.rpc).toHaveBeenCalledWith('send_customer_receipts_email', {
        p_customer_id: customerRequest.customerId,
        p_recipient_email: customerRequest.recipientEmail.trim().toLowerCase(),
        p_receipt_ids: null
      });
    });

    it('should pass receipt IDs when provided', async () => {
      const requestWithIds: CustomerReceiptsEmailRequest = {
        ...customerRequest,
        receiptIds: ['receipt-1', 'receipt-2']
      };

      supabaseServiceSpy.rpc.and.returnValue(
        mockRpcResponse({ success: true, sentCount: 2, failedCount: 0, results: [] }) as any
      );

      await service.sendCustomerReceipts(requestWithIds);

      expect(supabaseServiceSpy.rpc).toHaveBeenCalledWith('send_customer_receipts_email', {
        p_customer_id: requestWithIds.customerId,
        p_recipient_email: requestWithIds.recipientEmail.trim().toLowerCase(),
        p_receipt_ids: requestWithIds.receiptIds
      });
    });

    it('should return success response with counts', async () => {
      supabaseServiceSpy.rpc.and.returnValue(
        mockRpcResponse({
          success: true,
          sentCount: 5,
          failedCount: 1,
          message: '5 receipts sent',
          results: [
            { receiptId: 'r1', receiptNumber: 'REC-001', success: true },
            { receiptId: 'r2', receiptNumber: 'REC-002', success: false, error: 'Failed' }
          ]
        }) as any
      );

      const result = await service.sendCustomerReceipts(customerRequest);

      expect(result.success).toBeTrue();
      expect(result.sentCount).toBe(5);
      expect(result.failedCount).toBe(1);
      expect(result.results.length).toBe(2);
    });

    it('should show success toast with correct pluralization', async () => {
      supabaseServiceSpy.rpc.and.returnValue(
        mockRpcResponse({
          success: true,
          sentCount: 3,
          failedCount: 0,
          results: []
        }) as any
      );

      await service.sendCustomerReceipts(customerRequest, { showSuccessToast: true });

      expect(toastServiceSpy.success).toHaveBeenCalledWith(
        'Receipts Sent',
        `3 receipts sent to ${customerRequest.recipientEmail}`
      );
    });

    it('should show singular form for single receipt', async () => {
      supabaseServiceSpy.rpc.and.returnValue(
        mockRpcResponse({
          success: true,
          sentCount: 1,
          failedCount: 0,
          results: []
        }) as any
      );

      await service.sendCustomerReceipts(customerRequest, { showSuccessToast: true });

      expect(toastServiceSpy.success).toHaveBeenCalledWith(
        'Receipts Sent',
        `1 receipt sent to ${customerRequest.recipientEmail}`
      );
    });
  });

  describe('getFailedSends', () => {
    it('should query failed email sends from receipt_send_logs', async () => {
      const mockFromObj = mockFromResponse([
        { id: 'log-1', recipient_email: 'a@b.com', error_message: 'Failed', created_at: '2026-01-31T10:00:00Z' },
        { id: 'log-2', recipient_email: 'c@d.com', error_message: 'Timeout', created_at: '2026-01-31T11:00:00Z' }
      ]);
      supabaseServiceSpy.from.and.returnValue(mockFromObj as any);

      const result = await service.getFailedSends('receipt-123');

      expect(supabaseServiceSpy.from).toHaveBeenCalledWith('receipt_send_logs');
      expect(result.length).toBe(2);
      expect(result[0].recipientEmail).toBe('a@b.com');
      expect(result[0].errorMessage).toBe('Failed');
    });

    it('should return empty array on error', async () => {
      const mockFromObj = mockFromResponse([], new Error('Query failed'));
      supabaseServiceSpy.from.and.returnValue(mockFromObj as any);

      const result = await service.getFailedSends('receipt-123');

      expect(result).toEqual([]);
    });

    it('should handle null data gracefully', async () => {
      const mockFromObj = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            eq: jasmine.createSpy('eq').and.returnValue({
              eq: jasmine.createSpy('eq').and.returnValue({
                order: jasmine.createSpy('order').and.returnValue(
                  Promise.resolve({ data: null, error: null })
                )
              })
            })
          })
        })
      };
      supabaseServiceSpy.from.and.returnValue(mockFromObj as any);

      const result = await service.getFailedSends('receipt-123');

      expect(result).toEqual([]);
    });
  });

  describe('EmailSendOptions', () => {
    it('should default to showing toasts', async () => {
      supabaseServiceSpy.rpc.and.returnValue(
        mockRpcResponse({ messageId: 'msg-123' }) as any
      );

      await service.sendReceiptEmail({
        receiptId: 'r1',
        recipientEmail: 'test@example.com'
      });

      // With default options, success toast should be shown
      expect(toastServiceSpy.success).toHaveBeenCalled();
    });

    it('should respect showSuccessToast: false', async () => {
      supabaseServiceSpy.rpc.and.returnValue(
        mockRpcResponse({ messageId: 'msg-123' }) as any
      );

      await service.sendReceiptEmail(
        { receiptId: 'r1', recipientEmail: 'test@example.com' },
        { showSuccessToast: false }
      );

      expect(toastServiceSpy.success).not.toHaveBeenCalled();
    });

    it('should respect showErrorToast: false on validation error', async () => {
      await service.sendReceiptEmail(
        { receiptId: 'r1', recipientEmail: 'invalid' },
        { showErrorToast: false }
      );

      expect(toastServiceSpy.error).not.toHaveBeenCalled();
    });
  });
});
