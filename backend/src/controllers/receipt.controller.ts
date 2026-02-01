import { ReceiptService } from '../services/receipt.service';
import { InputSanitizationService } from '../services/input-sanitization.service';
import {
  CreateReceiptDto,
  UpdateReceiptDto,
  ReceiptResponseDto,
  ReceiptListResponseDto,
  ReceiptFilterDto,
  ReceiptSummaryDto,
  ReceiptExportDto
} from '../dto/receipt.dto';
import { RECEIPT_CONSTRAINTS } from '../constants/validation.constants';

/**
 * Receipt Controller
 * HTTP request handling for Receipt entity
 * Routes: /api/receipts
 * Feature: F-005 Receipt Storage and Retrieval
 *
 * Security: All text inputs are sanitized to prevent XSS (F-058).
 * Customer info and notes are stored as plain text without HTML interpretation.
 */
export class ReceiptController {
  private readonly sanitizer = new InputSanitizationService();

  constructor(private readonly receiptService: ReceiptService) {}

  async getAll(filter?: ReceiptFilterDto): Promise<ReceiptListResponseDto> {
    return this.receiptService.findAll(filter);
  }

  async getById(id: string): Promise<ReceiptResponseDto> {
    const receipt = await this.receiptService.findById(id);
    if (!receipt) {
      throw new Error('Receipt not found');
    }
    return receipt;
  }

  async getByReceiptNumber(receiptNumber: string): Promise<ReceiptResponseDto> {
    const receipt = await this.receiptService.findByReceiptNumber(receiptNumber);
    if (!receipt) {
      throw new Error('Receipt not found');
    }
    return receipt;
  }

  async getByCustomerPhone(customerPhone: string): Promise<ReceiptListResponseDto> {
    return this.receiptService.findByCustomerPhone(customerPhone);
  }

  async create(dto: CreateReceiptDto): Promise<ReceiptResponseDto> {
    const sanitizedDto = this.sanitizeReceiptDto(dto);
    this.validateCreateDto(sanitizedDto);
    return this.receiptService.create(sanitizedDto);
  }

  async update(id: string, dto: UpdateReceiptDto): Promise<ReceiptResponseDto> {
    const sanitizedDto = this.sanitizeUpdateDto(dto);
    this.validateUpdateDto(sanitizedDto);
    return this.receiptService.update(id, sanitizedDto);
  }

  async delete(id: string): Promise<void> {
    return this.receiptService.delete(id);
  }

  async getSummary(filter?: ReceiptFilterDto): Promise<ReceiptSummaryDto> {
    return this.receiptService.getSummary(filter);
  }

  async exportReceipts(exportDto: ReceiptExportDto): Promise<{ data: string; contentType: string; filename: string }> {
    this.validateExportDto(exportDto);
    const data = await this.receiptService.exportReceipts(exportDto);
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = exportDto.format === 'json' ? 'json' : 'csv';
    const contentType = exportDto.format === 'json' ? 'application/json' : 'text/csv';

    return {
      data,
      contentType,
      filename: `receipts-export-${timestamp}.${extension}`
    };
  }

  private validateExportDto(dto: ReceiptExportDto): void {
    if (!dto.format || !['csv', 'json'].includes(dto.format)) {
      throw new Error('Export format must be either "csv" or "json"');
    }

    if (dto.filters?.minAmount !== undefined && dto.filters.minAmount < 0) {
      throw new Error('Minimum amount cannot be negative');
    }

    if (dto.filters?.maxAmount !== undefined && dto.filters.maxAmount < 0) {
      throw new Error('Maximum amount cannot be negative');
    }

    if (dto.filters?.minAmount !== undefined && dto.filters?.maxAmount !== undefined) {
      if (dto.filters.minAmount > dto.filters.maxAmount) {
        throw new Error('Minimum amount cannot be greater than maximum amount');
      }
    }
  }

  private sanitizeReceiptDto(dto: CreateReceiptDto): CreateReceiptDto {
    return {
      ...dto,
      customerName: dto.customerName ? this.sanitizer.sanitizeString(dto.customerName) : dto.customerName,
      customerPhone: dto.customerPhone ? this.sanitizer.sanitizeString(dto.customerPhone) : dto.customerPhone,
      customerEmail: dto.customerEmail?.trim(),
      notes: dto.notes ? this.sanitizer.sanitizeString(dto.notes) : dto.notes,
      items: dto.items.map(item => ({
        ...item,
        itemName: this.sanitizer.sanitizeString(item.itemName)
      }))
    };
  }

  private sanitizeUpdateDto(dto: UpdateReceiptDto): UpdateReceiptDto {
    return {
      ...dto,
      customerName: dto.customerName ? this.sanitizer.sanitizeString(dto.customerName) : dto.customerName,
      customerPhone: dto.customerPhone ? this.sanitizer.sanitizeString(dto.customerPhone) : dto.customerPhone,
      customerEmail: dto.customerEmail?.trim(),
      notes: dto.notes ? this.sanitizer.sanitizeString(dto.notes) : dto.notes
    };
  }

  private validateCreateDto(dto: CreateReceiptDto): void {
    if (!dto.receiptNumber) {
      throw new Error('Receipt number is required');
    }
    if (dto.receiptNumber.length > RECEIPT_CONSTRAINTS.RECEIPT_NUMBER_MAX) {
      throw new Error(`Receipt number must not exceed ${RECEIPT_CONSTRAINTS.RECEIPT_NUMBER_MAX} characters`);
    }
    if (!dto.transactionDate) {
      throw new Error('Transaction date is required');
    }
    if (!dto.transactionTime) {
      throw new Error('Transaction time is required');
    }
    if (dto.subtotal === undefined || dto.subtotal < 0) {
      throw new Error('Valid subtotal is required');
    }
    if (dto.grandTotal === undefined || dto.grandTotal < 0) {
      throw new Error('Valid grand total is required');
    }
    if (!dto.items || dto.items.length === 0) {
      throw new Error('At least one item is required');
    }
    if (dto.customerName && dto.customerName.length > RECEIPT_CONSTRAINTS.CUSTOMER_NAME_MAX) {
      throw new Error(`Customer name must not exceed ${RECEIPT_CONSTRAINTS.CUSTOMER_NAME_MAX} characters`);
    }
    if (dto.customerPhone && dto.customerPhone.length > RECEIPT_CONSTRAINTS.CUSTOMER_PHONE_MAX) {
      throw new Error(`Customer phone must not exceed ${RECEIPT_CONSTRAINTS.CUSTOMER_PHONE_MAX} characters`);
    }
    if (dto.customerEmail && dto.customerEmail.length > RECEIPT_CONSTRAINTS.CUSTOMER_EMAIL_MAX) {
      throw new Error(`Customer email must not exceed ${RECEIPT_CONSTRAINTS.CUSTOMER_EMAIL_MAX} characters`);
    }
    if (dto.notes && dto.notes.length > RECEIPT_CONSTRAINTS.NOTES_MAX) {
      throw new Error(`Notes must not exceed ${RECEIPT_CONSTRAINTS.NOTES_MAX} characters`);
    }

    for (const item of dto.items) {
      if (!item.itemName) {
        throw new Error('Item name is required');
      }
      if (item.itemName.length > RECEIPT_CONSTRAINTS.ITEM_NAME_MAX) {
        throw new Error(`Item name must not exceed ${RECEIPT_CONSTRAINTS.ITEM_NAME_MAX} characters`);
      }
      if (item.quantity < 1) {
        throw new Error('Item quantity must be at least 1');
      }
      if (item.unitPrice < 0) {
        throw new Error('Item unit price cannot be negative');
      }
      if (item.total < 0) {
        throw new Error('Item total cannot be negative');
      }
    }
  }

  private validateUpdateDto(dto: UpdateReceiptDto): void {
    if (dto.customerName && dto.customerName.length > RECEIPT_CONSTRAINTS.CUSTOMER_NAME_MAX) {
      throw new Error(`Customer name must not exceed ${RECEIPT_CONSTRAINTS.CUSTOMER_NAME_MAX} characters`);
    }
    if (dto.customerPhone && dto.customerPhone.length > RECEIPT_CONSTRAINTS.CUSTOMER_PHONE_MAX) {
      throw new Error(`Customer phone must not exceed ${RECEIPT_CONSTRAINTS.CUSTOMER_PHONE_MAX} characters`);
    }
    if (dto.customerEmail && dto.customerEmail.length > RECEIPT_CONSTRAINTS.CUSTOMER_EMAIL_MAX) {
      throw new Error(`Customer email must not exceed ${RECEIPT_CONSTRAINTS.CUSTOMER_EMAIL_MAX} characters`);
    }
    if (dto.notes && dto.notes.length > RECEIPT_CONSTRAINTS.NOTES_MAX) {
      throw new Error(`Notes must not exceed ${RECEIPT_CONSTRAINTS.NOTES_MAX} characters`);
    }
  }
}
