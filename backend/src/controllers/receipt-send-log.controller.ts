import { ReceiptSendLogService } from '../services/receipt-send-log.service';
import { InputSanitizationService } from '../services/input-sanitization.service';
import {
  CreateReceiptSendLogDto,
  UpdateReceiptSendLogDto,
  ReceiptSendLogResponseDto,
  ReceiptSendLogListResponseDto,
  ReceiptSendLogFilterDto,
  ResendReceiptDto,
  ResendReceiptResponseDto
} from '../dto/receipt-send-log.dto';

/**
 * Receipt Send Log Controller
 * HTTP request handling for ReceiptSendLog entity
 * Routes: /api/receipt-send-logs
 * Feature: F-007 Receipt Resend Capability
 *
 * Security: All text inputs are sanitized to prevent XSS (F-058).
 */
export class ReceiptSendLogController {
  private readonly sanitizer = new InputSanitizationService();

  constructor(private readonly sendLogService: ReceiptSendLogService) {}

  async getAll(filter?: ReceiptSendLogFilterDto): Promise<ReceiptSendLogListResponseDto> {
    return this.sendLogService.findAll(filter);
  }

  async getById(id: string): Promise<ReceiptSendLogResponseDto> {
    const log = await this.sendLogService.findById(id);
    if (!log) {
      throw new Error('Send log not found');
    }
    return log;
  }

  async getByReceiptId(receiptId: string): Promise<ReceiptSendLogListResponseDto> {
    return this.sendLogService.findByReceiptId(receiptId);
  }

  async create(dto: CreateReceiptSendLogDto): Promise<ReceiptSendLogResponseDto> {
    const sanitizedDto = this.sanitizeCreateDto(dto);
    this.validateCreateDto(sanitizedDto);
    return this.sendLogService.create(sanitizedDto);
  }

  async update(id: string, dto: UpdateReceiptSendLogDto): Promise<ReceiptSendLogResponseDto> {
    const sanitizedDto = this.sanitizeUpdateDto(dto);
    return this.sendLogService.update(id, sanitizedDto);
  }

  async delete(id: string): Promise<void> {
    return this.sendLogService.delete(id);
  }

  async resend(dto: ResendReceiptDto): Promise<ResendReceiptResponseDto> {
    const sanitizedDto = this.sanitizeResendDto(dto);
    this.validateResendDto(sanitizedDto);
    return this.sendLogService.logResend(sanitizedDto);
  }

  async getLastSend(receiptId: string): Promise<ReceiptSendLogResponseDto | null> {
    return this.sendLogService.getLastSendForReceipt(receiptId);
  }

  private sanitizeCreateDto(dto: CreateReceiptSendLogDto): CreateReceiptSendLogDto {
    return {
      ...dto,
      recipientPhone: dto.recipientPhone ? this.sanitizer.sanitizeString(dto.recipientPhone) : dto.recipientPhone,
      recipientEmail: dto.recipientEmail?.trim(),
      errorMessage: dto.errorMessage ? this.sanitizer.sanitizeString(dto.errorMessage) : dto.errorMessage
    };
  }

  private sanitizeUpdateDto(dto: UpdateReceiptSendLogDto): UpdateReceiptSendLogDto {
    return {
      ...dto,
      errorMessage: dto.errorMessage ? this.sanitizer.sanitizeString(dto.errorMessage) : dto.errorMessage
    };
  }

  private sanitizeResendDto(dto: ResendReceiptDto): ResendReceiptDto {
    return {
      ...dto,
      recipientPhone: dto.recipientPhone ? this.sanitizer.sanitizeString(dto.recipientPhone) : dto.recipientPhone,
      recipientEmail: dto.recipientEmail?.trim()
    };
  }

  private validateCreateDto(dto: CreateReceiptSendLogDto): void {
    if (!dto.receiptId) {
      throw new Error('Receipt ID is required');
    }
    if (!dto.channel) {
      throw new Error('Channel is required');
    }
    if (!['whatsapp', 'email', 'sms'].includes(dto.channel)) {
      throw new Error('Invalid channel. Must be one of: whatsapp, email, sms');
    }
    if (dto.channel === 'whatsapp' && !dto.recipientPhone) {
      throw new Error('Recipient phone is required for WhatsApp channel');
    }
    if (dto.channel === 'email' && !dto.recipientEmail) {
      throw new Error('Recipient email is required for email channel');
    }
  }

  private validateResendDto(dto: ResendReceiptDto): void {
    if (!dto.receiptId) {
      throw new Error('Receipt ID is required');
    }
    if (!dto.channel) {
      throw new Error('Channel is required');
    }
    if (!['whatsapp', 'email', 'sms'].includes(dto.channel)) {
      throw new Error('Invalid channel. Must be one of: whatsapp, email, sms');
    }
    if (dto.channel === 'whatsapp' && !dto.recipientPhone) {
      throw new Error('Recipient phone is required for WhatsApp resend');
    }
    if (dto.channel === 'email' && !dto.recipientEmail) {
      throw new Error('Recipient email is required for email resend');
    }
  }
}
