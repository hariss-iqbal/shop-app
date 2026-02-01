import { ReceiptSendLogRepository } from '../repositories/receipt-send-log.repository';
import { ReceiptRepository } from '../repositories/receipt.repository';
import {
  ReceiptSendLog,
  ReceiptSendLogInsert,
  ReceiptSendLogWithReceipt
} from '../entities/receipt-send-log.entity';
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
 * Receipt Send Log Service
 * Business logic for ReceiptSendLog entity
 * Feature: F-007 Receipt Resend Capability
 */
export class ReceiptSendLogService {
  constructor(
    private readonly sendLogRepository: ReceiptSendLogRepository,
    private readonly receiptRepository: ReceiptRepository
  ) {}

  async findAll(filter?: ReceiptSendLogFilterDto): Promise<ReceiptSendLogListResponseDto> {
    const limit = filter?.limit || 20;
    const page = filter?.page || 1;
    const offset = (page - 1) * limit;

    const logs = await this.sendLogRepository.findAll({
      receiptId: filter?.receiptId,
      channel: filter?.channel,
      startDate: filter?.startDate,
      endDate: filter?.endDate,
      limit,
      offset
    });

    const total = await this.sendLogRepository.count({
      receiptId: filter?.receiptId,
      channel: filter?.channel,
      startDate: filter?.startDate,
      endDate: filter?.endDate
    });

    return {
      data: logs.map(this.toResponseDto),
      total
    };
  }

  async findById(id: string): Promise<ReceiptSendLogResponseDto | null> {
    const log = await this.sendLogRepository.findById(id);
    return log ? this.toResponseDto(log) : null;
  }

  async findByReceiptId(receiptId: string): Promise<ReceiptSendLogListResponseDto> {
    const logs = await this.sendLogRepository.findByReceiptId(receiptId);

    return {
      data: logs.map(log => this.toResponseDto(log)),
      total: logs.length
    };
  }

  async create(dto: CreateReceiptSendLogDto): Promise<ReceiptSendLogResponseDto> {
    const receipt = await this.receiptRepository.findById(dto.receiptId);
    if (!receipt) {
      throw new Error(`Receipt with id "${dto.receiptId}" not found`);
    }

    const logInsert: ReceiptSendLogInsert = {
      receipt_id: dto.receiptId,
      channel: dto.channel,
      recipient_phone: dto.recipientPhone?.trim() || null,
      recipient_email: dto.recipientEmail?.trim() || null,
      status: dto.status || 'sent',
      error_message: dto.errorMessage?.trim() || null
    };

    const log = await this.sendLogRepository.create(logInsert);
    return this.toResponseDto(log);
  }

  async update(id: string, dto: UpdateReceiptSendLogDto): Promise<ReceiptSendLogResponseDto> {
    const existing = await this.sendLogRepository.findById(id);
    if (!existing) {
      throw new Error(`Send log with id "${id}" not found`);
    }

    const updated = await this.sendLogRepository.update(id, {
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.errorMessage !== undefined && { error_message: dto.errorMessage?.trim() || null })
    });

    return this.toResponseDto(updated);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.sendLogRepository.findById(id);
    if (!existing) {
      throw new Error(`Send log with id "${id}" not found`);
    }

    await this.sendLogRepository.delete(id);
  }

  async logResend(dto: ResendReceiptDto): Promise<ResendReceiptResponseDto> {
    const receipt = await this.receiptRepository.findById(dto.receiptId);
    if (!receipt) {
      return {
        success: false,
        message: 'Receipt not found',
        error: `Receipt with id "${dto.receiptId}" not found`
      };
    }

    try {
      const logInsert: ReceiptSendLogInsert = {
        receipt_id: dto.receiptId,
        channel: dto.channel,
        recipient_phone: dto.recipientPhone?.trim() || null,
        recipient_email: dto.recipientEmail?.trim() || null,
        status: 'sent'
      };

      const log = await this.sendLogRepository.create(logInsert);

      return {
        success: true,
        message: 'Receipt resent successfully',
        sendLog: this.toResponseDto(log)
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      const logInsert: ReceiptSendLogInsert = {
        receipt_id: dto.receiptId,
        channel: dto.channel,
        recipient_phone: dto.recipientPhone?.trim() || null,
        recipient_email: dto.recipientEmail?.trim() || null,
        status: 'failed',
        error_message: errorMessage
      };

      await this.sendLogRepository.create(logInsert);

      return {
        success: false,
        message: 'Failed to resend receipt',
        error: errorMessage
      };
    }
  }

  async getLastSendForReceipt(receiptId: string): Promise<ReceiptSendLogResponseDto | null> {
    const log = await this.sendLogRepository.getLastSendForReceipt(receiptId);
    return log ? this.toResponseDto(log) : null;
  }

  private toResponseDto(log: ReceiptSendLog | ReceiptSendLogWithReceipt): ReceiptSendLogResponseDto {
    const withReceipt = log as ReceiptSendLogWithReceipt;

    return {
      id: log.id,
      receiptId: log.receipt_id,
      channel: log.channel,
      recipientPhone: log.recipient_phone,
      recipientEmail: log.recipient_email,
      status: log.status,
      errorMessage: log.error_message,
      sentAt: log.sent_at,
      createdAt: log.created_at,
      ...(withReceipt.receipt && {
        receipt: {
          receiptNumber: withReceipt.receipt.receipt_number,
          grandTotal: withReceipt.receipt.grand_total,
          customerName: withReceipt.receipt.customer_name
        }
      })
    };
  }
}
