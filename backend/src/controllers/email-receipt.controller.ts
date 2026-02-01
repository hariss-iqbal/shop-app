import { EmailReceiptService } from '../services/email-receipt.service';
import { InputSanitizationService } from '../services/input-sanitization.service';
import { AuditLogService } from '../services/audit-log.service';
import {
  SendEmailReceiptDto,
  SendEmailReceiptDirectDto,
  SendEmailReceiptResponseDto,
  RetryEmailReceiptDto,
  RetryEmailReceiptResponseDto,
  CustomerReceiptsEmailRequestDto,
  CustomerReceiptsEmailResponseDto
} from '../dto/email-receipt.dto';

/**
 * Email Receipt Controller
 * Handles HTTP requests for email receipt functionality
 * Feature: F-021 Email Receipt Option
 */
export class EmailReceiptController {
  private readonly sanitizer = new InputSanitizationService();

  constructor(
    private readonly emailReceiptService: EmailReceiptService,
    private readonly auditLogService?: AuditLogService
  ) {}

  /**
   * Send a receipt via email
   * POST /api/receipts/:id/email
   */
  async sendReceiptEmail(dto: SendEmailReceiptDto): Promise<SendEmailReceiptResponseDto> {
    const sanitizedDto = this.sanitizeSendEmailDto(dto);
    this.validateSendEmailDto(sanitizedDto);

    const result = await this.emailReceiptService.sendReceiptEmail(sanitizedDto);

    if (this.auditLogService && result.success) {
      await this.auditLogService.logEvent({
        event_type: 'email_receipt_sent',
        entity_type: 'receipt',
        entity_id: sanitizedDto.receiptId,
        metadata: {
          recipientEmail: sanitizedDto.recipientEmail,
          recipientName: sanitizedDto.recipientName
        }
      }).catch(err => console.error('Failed to log audit:', err));
    }

    return result;
  }

  /**
   * Send a receipt via email directly (without stored receipt)
   * POST /api/receipts/email/send-direct
   */
  async sendReceiptEmailDirect(dto: SendEmailReceiptDirectDto): Promise<SendEmailReceiptResponseDto> {
    const sanitizedDto = this.sanitizeSendEmailDirectDto(dto);
    this.validateSendEmailDirectDto(sanitizedDto);

    const result = await this.emailReceiptService.sendReceiptEmailDirect(sanitizedDto);

    if (this.auditLogService && result.success) {
      await this.auditLogService.logEvent({
        event_type: 'email_receipt_sent',
        entity_type: 'receipt',
        reference_number: sanitizedDto.receiptNumber,
        amount: sanitizedDto.grandTotal,
        metadata: {
          recipientEmail: sanitizedDto.recipientEmail,
          direct: true
        }
      }).catch(err => console.error('Failed to log audit:', err));
    }

    return result;
  }

  /**
   * Retry a failed email send
   * POST /api/receipts/email/retry
   */
  async retryFailedSend(dto: RetryEmailReceiptDto): Promise<RetryEmailReceiptResponseDto> {
    this.validateRetryDto(dto);

    const result = await this.emailReceiptService.retryFailedSend(dto);

    if (this.auditLogService && result.success) {
      await this.auditLogService.logEvent({
        event_type: 'email_receipt_retry',
        entity_type: 'receipt_send_log',
        entity_id: dto.sendLogId,
        metadata: {
          success: result.success
        }
      }).catch(err => console.error('Failed to log audit:', err));
    }

    return result;
  }

  /**
   * Send recent receipts to a customer via email
   * POST /api/customers/:id/email-receipts
   */
  async sendCustomerReceipts(dto: CustomerReceiptsEmailRequestDto): Promise<CustomerReceiptsEmailResponseDto> {
    const sanitizedDto = this.sanitizeCustomerReceiptsDto(dto);
    this.validateCustomerReceiptsDto(sanitizedDto);

    const result = await this.emailReceiptService.sendCustomerReceipts(sanitizedDto);

    if (this.auditLogService && result.success) {
      await this.auditLogService.logEvent({
        event_type: 'email_receipts_batch_sent',
        entity_type: 'customer',
        entity_id: sanitizedDto.customerId,
        metadata: {
          recipientEmail: sanitizedDto.recipientEmail,
          sentCount: result.sentCount,
          failedCount: result.failedCount
        }
      }).catch(err => console.error('Failed to log audit:', err));
    }

    return result;
  }

  /**
   * Get failed email sends for a receipt
   * GET /api/receipts/:id/email/failed
   */
  async getFailedSends(receiptId: string): Promise<Array<{
    id: string;
    recipientEmail: string;
    errorMessage: string | null;
    createdAt: string;
  }>> {
    if (!receiptId || receiptId.trim() === '') {
      throw new Error('Receipt ID is required');
    }

    return this.emailReceiptService.getFailedSendsForReceipt(receiptId.trim());
  }

  /**
   * Validate email address format
   * GET /api/receipts/email/validate
   */
  validateEmailAddress(email: string): { valid: boolean; email: string } {
    const trimmedEmail = email?.trim() || '';
    return {
      valid: this.emailReceiptService.isValidEmail(trimmedEmail),
      email: trimmedEmail
    };
  }

  private sanitizeSendEmailDto(dto: SendEmailReceiptDto): SendEmailReceiptDto {
    return {
      receiptId: dto.receiptId?.trim() || '',
      recipientEmail: dto.recipientEmail?.trim().toLowerCase() || '',
      recipientName: dto.recipientName ? this.sanitizer.sanitizeString(dto.recipientName.trim()) : null
    };
  }

  private sanitizeSendEmailDirectDto(dto: SendEmailReceiptDirectDto): SendEmailReceiptDirectDto {
    return {
      receiptNumber: dto.receiptNumber?.trim() || '',
      transactionDate: dto.transactionDate?.trim() || '',
      transactionTime: dto.transactionTime?.trim() || '',
      items: (dto.items || []).map(item => ({
        name: this.sanitizer.sanitizeString(item.name?.trim() || ''),
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        total: item.total || 0,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount
      })),
      subtotal: dto.subtotal || 0,
      taxRate: dto.taxRate || 0,
      taxAmount: dto.taxAmount || 0,
      grandTotal: dto.grandTotal || 0,
      customerName: dto.customerName ? this.sanitizer.sanitizeString(dto.customerName.trim()) : null,
      customerPhone: dto.customerPhone ? dto.customerPhone.trim() : null,
      recipientEmail: dto.recipientEmail?.trim().toLowerCase() || '',
      notes: dto.notes ? this.sanitizer.sanitizeString(dto.notes.trim()) : null,
      payments: dto.payments?.map(payment => ({
        method: payment.method || '',
        amount: payment.amount || 0,
        cardLastFour: payment.cardLastFour?.trim() || null,
        transactionReference: payment.transactionReference?.trim() || null
      }))
    };
  }

  private sanitizeCustomerReceiptsDto(dto: CustomerReceiptsEmailRequestDto): CustomerReceiptsEmailRequestDto {
    return {
      customerId: dto.customerId?.trim() || '',
      recipientEmail: dto.recipientEmail?.trim().toLowerCase() || '',
      receiptIds: dto.receiptIds?.map(id => id.trim()).filter(id => id !== '')
    };
  }

  private validateSendEmailDto(dto: SendEmailReceiptDto): void {
    if (!dto.receiptId) {
      throw new Error('Receipt ID is required');
    }
    if (!dto.recipientEmail) {
      throw new Error('Recipient email is required');
    }
    if (!this.emailReceiptService.isValidEmail(dto.recipientEmail)) {
      throw new Error('Invalid email address format');
    }
  }

  private validateSendEmailDirectDto(dto: SendEmailReceiptDirectDto): void {
    if (!dto.receiptNumber) {
      throw new Error('Receipt number is required');
    }
    if (!dto.transactionDate) {
      throw new Error('Transaction date is required');
    }
    if (!dto.transactionTime) {
      throw new Error('Transaction time is required');
    }
    if (!dto.items || dto.items.length === 0) {
      throw new Error('At least one item is required');
    }
    if (dto.grandTotal <= 0) {
      throw new Error('Grand total must be greater than zero');
    }
    if (!dto.recipientEmail) {
      throw new Error('Recipient email is required');
    }
    if (!this.emailReceiptService.isValidEmail(dto.recipientEmail)) {
      throw new Error('Invalid email address format');
    }
  }

  private validateRetryDto(dto: RetryEmailReceiptDto): void {
    if (!dto.sendLogId || dto.sendLogId.trim() === '') {
      throw new Error('Send log ID is required');
    }
  }

  private validateCustomerReceiptsDto(dto: CustomerReceiptsEmailRequestDto): void {
    if (!dto.customerId) {
      throw new Error('Customer ID is required');
    }
    if (!dto.recipientEmail) {
      throw new Error('Recipient email is required');
    }
    if (!this.emailReceiptService.isValidEmail(dto.recipientEmail)) {
      throw new Error('Invalid email address format');
    }
  }
}
