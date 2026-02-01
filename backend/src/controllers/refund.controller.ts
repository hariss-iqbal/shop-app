import { RefundService } from '../services/refund.service';
import { AuditLogService } from '../services/audit-log.service';
import { InputSanitizationService } from '../services/input-sanitization.service';
import {
  ProcessFullRefundDto,
  CheckReceiptRefundableDto,
  RefundResponseDto,
  RefundListResponseDto,
  RefundFilterDto,
  ProcessRefundResponseDto,
  CheckReceiptRefundableResponseDto,
  GetRefundByReceiptResponseDto,
  RefundSummaryDto,
  ProcessPartialRefundDto,
  CheckPartialRefundableDto,
  ProcessPartialRefundResponseDto,
  CheckPartialRefundableResponseDto
} from '../dto/refund.dto';
import { SALE_CONSTRAINTS, REFUND_CONSTRAINTS } from '../constants/validation.constants';

/**
 * Refund Controller
 * HTTP request handling for Refund entity
 * Routes: /api/refunds
 *
 * Security: All text inputs are sanitized to prevent XSS (F-058).
 * Reason and notes are stored as plain text without HTML interpretation.
 *
 * Feature: F-009 Full Refund Processing
 * Feature: F-014 Audit Logging and Transaction Tracking
 */
export class RefundController {
  private readonly sanitizer = new InputSanitizationService();

  constructor(
    private readonly refundService: RefundService,
    private readonly auditLogService?: AuditLogService
  ) {}

  /**
   * Get all refunds with optional filtering
   */
  async getAll(filter?: RefundFilterDto): Promise<RefundListResponseDto> {
    return this.refundService.findAll(filter);
  }

  /**
   * Get a refund by ID
   */
  async getById(id: string): Promise<RefundResponseDto> {
    if (!id) {
      throw new Error('Refund ID is required');
    }

    const refund = await this.refundService.findById(id);
    if (!refund) {
      throw new Error('Refund not found');
    }
    return refund;
  }

  /**
   * Get a refund by refund number
   */
  async getByRefundNumber(refundNumber: string): Promise<RefundResponseDto> {
    if (!refundNumber || !refundNumber.trim()) {
      throw new Error('Refund number is required');
    }

    const refund = await this.refundService.findByRefundNumber(refundNumber);
    if (!refund) {
      throw new Error('Refund not found');
    }
    return refund;
  }

  /**
   * Process a full refund for an entire transaction
   * Creates refund record, refund items, and restores inventory
   * Feature: F-009 Full Refund Processing
   * Feature: F-014 Audit Logging
   */
  async processFullRefund(dto: ProcessFullRefundDto, approvingUserId?: string, clientIp?: string, userAgent?: string): Promise<ProcessRefundResponseDto> {
    const sanitizedDto = this.sanitizeRefundDto(dto);
    this.validateProcessRefundDto(sanitizedDto);
    const result = await this.refundService.processFullRefund(sanitizedDto);

    // Log successful refunds to audit log
    if (result.success && result.refundId && this.auditLogService) {
      try {
        await this.auditLogService.logRefund({
          eventType: 'refund_completed',
          refundId: result.refundId,
          originalReceiptId: result.originalReceiptId || dto.receiptId,
          refundNumber: result.refundNumber || '',
          originalReceiptNumber: result.originalReceiptNumber || '',
          refundAmount: result.refundAmount || 0,
          refundReason: dto.refundReason || undefined,
          approvingUserId,
          isPartial: false,
          clientIp,
          userAgent
        });
      } catch (auditError) {
        console.error('Failed to log refund audit:', auditError);
      }
    }

    return result;
  }

  /**
   * Check if a receipt can be refunded
   * Returns details about the receipt and any existing refunds
   * Feature: F-009 Full Refund Processing
   */
  async checkReceiptRefundable(dto: CheckReceiptRefundableDto): Promise<CheckReceiptRefundableResponseDto> {
    if (!dto.receiptId) {
      throw new Error('Receipt ID is required');
    }
    return this.refundService.checkReceiptRefundable(dto);
  }

  /**
   * Get refund by receipt ID
   * Feature: F-009 Full Refund Processing
   */
  async getRefundByReceipt(receiptId: string): Promise<GetRefundByReceiptResponseDto> {
    if (!receiptId) {
      throw new Error('Receipt ID is required');
    }
    return this.refundService.getRefundByReceipt(receiptId);
  }

  /**
   * Get refund summary statistics
   */
  async getSummary(filter?: RefundFilterDto): Promise<RefundSummaryDto> {
    return this.refundService.getSummary(filter);
  }

  /**
   * Get refunds by month for a given year
   */
  async getRefundsByMonth(year: number): Promise<{ month: number; count: number; amount: number }[]> {
    if (!year || year < 2000 || year > 2100) {
      throw new Error('Invalid year');
    }
    return this.refundService.getRefundsByMonth(year);
  }

  /**
   * Find all refunds for a customer by their phone number
   */
  async findByCustomerPhone(customerPhone: string): Promise<RefundListResponseDto> {
    if (!customerPhone || !customerPhone.trim()) {
      throw new Error('Phone number is required');
    }

    const sanitizedPhone = this.sanitizer.sanitizeString(customerPhone);

    if (sanitizedPhone.length > SALE_CONSTRAINTS.BUYER_PHONE_MAX) {
      throw new Error(`Phone number must not exceed ${SALE_CONSTRAINTS.BUYER_PHONE_MAX} characters`);
    }

    return this.refundService.findByCustomerPhone(sanitizedPhone);
  }

  private sanitizeRefundDto(dto: ProcessFullRefundDto): ProcessFullRefundDto {
    return {
      ...dto,
      refundReason: dto.refundReason ? this.sanitizer.sanitizeString(dto.refundReason) : dto.refundReason,
      notes: dto.notes ? this.sanitizer.sanitizeString(dto.notes) : dto.notes
    };
  }

  private validateProcessRefundDto(dto: ProcessFullRefundDto): void {
    if (!dto.receiptId) {
      throw new Error('Receipt ID is required');
    }
    if (dto.refundReason && dto.refundReason.length > REFUND_CONSTRAINTS.REASON_MAX) {
      throw new Error(`Refund reason must not exceed ${REFUND_CONSTRAINTS.REASON_MAX} characters`);
    }
    if (dto.notes && dto.notes.length > REFUND_CONSTRAINTS.NOTES_MAX) {
      throw new Error(`Notes must not exceed ${REFUND_CONSTRAINTS.NOTES_MAX} characters`);
    }
  }

  /**
   * Check if a receipt can be partially refunded
   * Returns detailed item info for selection
   * Feature: F-010 Partial Refund Processing
   */
  async checkReceiptPartialRefundable(dto: CheckPartialRefundableDto): Promise<CheckPartialRefundableResponseDto> {
    if (!dto.receiptId) {
      throw new Error('Receipt ID is required');
    }
    return this.refundService.checkReceiptPartialRefundable(dto);
  }

  /**
   * Process a partial refund with custom return prices
   * Creates refund record, refund items for selected items, and restores inventory
   * Feature: F-010 Partial Refund Processing
   * Feature: F-014 Audit Logging
   */
  async processPartialRefund(dto: ProcessPartialRefundDto, approvingUserId?: string, clientIp?: string, userAgent?: string): Promise<ProcessPartialRefundResponseDto> {
    const sanitizedDto = this.sanitizePartialRefundDto(dto);
    this.validatePartialRefundDto(sanitizedDto);
    const result = await this.refundService.processPartialRefund(sanitizedDto);

    // Log successful partial refunds to audit log
    if (result.success && result.refundId && this.auditLogService) {
      try {
        await this.auditLogService.logRefund({
          eventType: 'partial_refund_completed',
          refundId: result.refundId,
          originalReceiptId: result.originalReceiptId || dto.receiptId,
          refundNumber: result.refundNumber || '',
          originalReceiptNumber: result.originalReceiptNumber || '',
          refundAmount: result.refundAmount || 0,
          refundReason: dto.refundReason || undefined,
          approvingUserId,
          isPartial: true,
          clientIp,
          userAgent
        });
      } catch (auditError) {
        console.error('Failed to log partial refund audit:', auditError);
      }
    }

    return result;
  }

  /**
   * Find all partial refunds for a receipt
   * Feature: F-010 Partial Refund Processing
   */
  async findPartialRefundsByReceiptId(receiptId: string): Promise<RefundListResponseDto> {
    if (!receiptId) {
      throw new Error('Receipt ID is required');
    }
    return this.refundService.findPartialRefundsByReceiptId(receiptId);
  }

  private sanitizePartialRefundDto(dto: ProcessPartialRefundDto): ProcessPartialRefundDto {
    return {
      ...dto,
      refundReason: dto.refundReason ? this.sanitizer.sanitizeString(dto.refundReason) : dto.refundReason,
      notes: dto.notes ? this.sanitizer.sanitizeString(dto.notes) : dto.notes,
      managerApprovalReason: dto.managerApprovalReason ? this.sanitizer.sanitizeString(dto.managerApprovalReason) : dto.managerApprovalReason
    };
  }

  private validatePartialRefundDto(dto: ProcessPartialRefundDto): void {
    if (!dto.receiptId) {
      throw new Error('Receipt ID is required');
    }
    if (!dto.items || dto.items.length === 0) {
      throw new Error('At least one item must be selected for refund');
    }
    for (const item of dto.items) {
      if (!item.receiptItemId) {
        throw new Error('Receipt item ID is required for each item');
      }
      if (item.returnPrice === undefined || item.returnPrice === null) {
        throw new Error('Return price is required for each item');
      }
      if (item.returnPrice < 0) {
        throw new Error('Return price cannot be negative');
      }
    }
    if (dto.refundReason && dto.refundReason.length > REFUND_CONSTRAINTS.REASON_MAX) {
      throw new Error(`Refund reason must not exceed ${REFUND_CONSTRAINTS.REASON_MAX} characters`);
    }
    if (dto.notes && dto.notes.length > REFUND_CONSTRAINTS.NOTES_MAX) {
      throw new Error(`Notes must not exceed ${REFUND_CONSTRAINTS.NOTES_MAX} characters`);
    }
    if (dto.managerApprovalReason && dto.managerApprovalReason.length > REFUND_CONSTRAINTS.REASON_MAX) {
      throw new Error(`Manager approval reason must not exceed ${REFUND_CONSTRAINTS.REASON_MAX} characters`);
    }
  }
}
