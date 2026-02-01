import { SaleService } from '../services/sale.service';
import { AuditLogService } from '../services/audit-log.service';
import { InputSanitizationService } from '../services/input-sanitization.service';
import {
  CreateSaleDto,
  UpdateSaleDto,
  SaleResponseDto,
  SaleListResponseDto,
  SaleFilterDto,
  SaleSummaryDto,
  MarkAsSoldDto,
  CompleteBatchSaleDto,
  SaleWithInventoryDeductionResponseDto,
  BatchSaleWithInventoryDeductionResponseDto,
  InventoryAvailabilityResponseDto,
  CheckInventoryAvailabilityDto
} from '../dto/sale.dto';
import { SALE_CONSTRAINTS } from '../constants/validation.constants';

/**
 * Sale Controller
 * HTTP request handling for Sale entity
 * Routes: /api/sales
 *
 * Security: All text inputs are sanitized to prevent XSS (F-058).
 * Buyer info and notes are stored as plain text without HTML interpretation.
 *
 * Feature: F-008 Automatic Inventory Deduction
 * Feature: F-014 Audit Logging and Transaction Tracking
 */
export class SaleController {
  private readonly sanitizer = new InputSanitizationService();

  constructor(
    private readonly saleService: SaleService,
    private readonly auditLogService?: AuditLogService
  ) {}

  async getAll(filter?: SaleFilterDto): Promise<SaleListResponseDto> {
    return this.saleService.findAll(filter);
  }

  async getById(id: string): Promise<SaleResponseDto> {
    const sale = await this.saleService.findById(id);
    if (!sale) {
      throw new Error('Sale not found');
    }
    return sale;
  }

  /**
   * Create a sale with automatic inventory deduction
   * Feature: F-008 Automatic Inventory Deduction
   * Feature: F-014 Audit Logging
   */
  async create(dto: CreateSaleDto, clientIp?: string, userAgent?: string): Promise<SaleWithInventoryDeductionResponseDto> {
    const sanitizedDto = this.sanitizeSaleDto(dto);
    this.validateCreateDto(sanitizedDto);
    const result = await this.saleService.create(sanitizedDto);

    // Log successful sales to audit log
    if (result.success && result.sale && this.auditLogService) {
      try {
        await this.auditLogService.logSale({
          eventType: 'sale_created',
          saleId: result.sale.id,
          phoneId: dto.phoneId,
          amount: result.sale.salePrice,
          buyerName: result.sale.buyerName || undefined,
          buyerPhone: result.sale.buyerPhone || undefined,
          itemsSold: 1,
          clientIp,
          userAgent
        });
      } catch (auditError) {
        // Log audit failures but don't fail the sale
        console.error('Failed to log sale audit:', auditError);
      }
    }

    return result;
  }

  async update(id: string, dto: UpdateSaleDto): Promise<SaleResponseDto> {
    const sanitizedDto = this.sanitizeSaleDto(dto);
    this.validateUpdateDto(sanitizedDto);
    return this.saleService.update(id, sanitizedDto);
  }

  /**
   * Mark a phone as sold with automatic inventory deduction
   * Feature: F-008 Automatic Inventory Deduction
   * Feature: F-014 Audit Logging
   */
  async markAsSold(dto: MarkAsSoldDto, clientIp?: string, userAgent?: string): Promise<SaleWithInventoryDeductionResponseDto> {
    const sanitizedDto = this.sanitizeSaleDto(dto);
    this.validateMarkAsSoldDto(sanitizedDto as MarkAsSoldDto);
    const result = await this.saleService.markAsSold(sanitizedDto as MarkAsSoldDto);

    // Log successful sales to audit log
    if (result.success && result.sale && this.auditLogService) {
      try {
        await this.auditLogService.logSale({
          eventType: 'sale_created',
          saleId: result.sale.id,
          phoneId: dto.phoneId,
          amount: result.sale.salePrice,
          buyerName: result.sale.buyerName || undefined,
          buyerPhone: result.sale.buyerPhone || undefined,
          itemsSold: 1,
          clientIp,
          userAgent
        });
      } catch (auditError) {
        console.error('Failed to log sale audit:', auditError);
      }
    }

    return result;
  }

  /**
   * Complete a batch sale with automatic inventory deduction
   * All items are processed atomically - all succeed or all fail
   * Feature: F-008 Automatic Inventory Deduction
   * Feature: F-014 Audit Logging
   */
  async completeBatchSale(dto: CompleteBatchSaleDto, clientIp?: string, userAgent?: string): Promise<BatchSaleWithInventoryDeductionResponseDto> {
    const sanitizedDto = this.sanitizeBatchSaleDto(dto);
    this.validateBatchSaleDto(sanitizedDto);
    const result = await this.saleService.completeBatchSale(sanitizedDto);

    // Log successful batch sales to audit log
    if (result.success && result.sales && result.sales.length > 0 && this.auditLogService) {
      try {
        // Calculate total amount
        const totalAmount = result.sales.reduce((sum, sale) => sum + sale.salePrice, 0);

        // Log each sale in the batch
        for (const sale of result.sales) {
          await this.auditLogService.logSale({
            eventType: 'batch_sale_completed',
            saleId: sale.id,
            phoneId: sale.phoneId,
            amount: sale.salePrice,
            buyerName: sale.buyerName || undefined,
            buyerPhone: sale.buyerPhone || undefined,
            itemsSold: result.sales.length,
            clientIp,
            userAgent
          });
        }
      } catch (auditError) {
        console.error('Failed to log batch sale audit:', auditError);
      }
    }

    return result;
  }

  /**
   * Check inventory availability before completing a sale
   * Feature: F-008 Automatic Inventory Deduction
   */
  async checkInventoryAvailability(dto: CheckInventoryAvailabilityDto): Promise<InventoryAvailabilityResponseDto> {
    if (!dto.phoneIds || dto.phoneIds.length === 0) {
      throw new Error('At least one phone ID is required');
    }
    return this.saleService.checkInventoryAvailability(dto);
  }

  /**
   * Delete a sale and restore inventory
   * Feature: F-008 Automatic Inventory Deduction
   */
  async delete(id: string): Promise<{ success: boolean; inventoryRestored: boolean; error?: string }> {
    return this.saleService.delete(id);
  }

  async getSummary(filter?: SaleFilterDto): Promise<SaleSummaryDto> {
    return this.saleService.getSummary(filter);
  }

  async getSalesByMonth(year: number): Promise<{ month: number; count: number; revenue: number }[]> {
    if (!year || year < 2000 || year > 2100) {
      throw new Error('Invalid year');
    }
    return this.saleService.getSalesByMonth(year);
  }

  /**
   * Find all sales for a customer by their phone number
   * Returns purchase history sorted by date with most recent first
   */
  async findByBuyerPhone(buyerPhone: string): Promise<SaleListResponseDto> {
    if (!buyerPhone || !buyerPhone.trim()) {
      throw new Error('Phone number is required');
    }

    const sanitizedPhone = this.sanitizer.sanitizeString(buyerPhone);

    if (sanitizedPhone.length > SALE_CONSTRAINTS.BUYER_PHONE_MAX) {
      throw new Error(`Phone number must not exceed ${SALE_CONSTRAINTS.BUYER_PHONE_MAX} characters`);
    }

    return this.saleService.findByBuyerPhone(sanitizedPhone);
  }

  private sanitizeSaleDto<T extends Partial<CreateSaleDto & MarkAsSoldDto>>(dto: T): T {
    return {
      ...dto,
      buyerName: dto.buyerName ? this.sanitizer.sanitizeString(dto.buyerName) : dto.buyerName,
      buyerPhone: dto.buyerPhone ? this.sanitizer.sanitizeString(dto.buyerPhone) : dto.buyerPhone,
      buyerEmail: dto.buyerEmail?.trim(),
      notes: dto.notes ? this.sanitizer.sanitizeString(dto.notes) : dto.notes
    };
  }

  private sanitizeBatchSaleDto(dto: CompleteBatchSaleDto): CompleteBatchSaleDto {
    return {
      ...dto,
      buyerName: dto.buyerName ? this.sanitizer.sanitizeString(dto.buyerName) : dto.buyerName,
      buyerPhone: dto.buyerPhone ? this.sanitizer.sanitizeString(dto.buyerPhone) : dto.buyerPhone,
      buyerEmail: dto.buyerEmail?.trim(),
      notes: dto.notes ? this.sanitizer.sanitizeString(dto.notes) : dto.notes
    };
  }

  private validateCreateDto(dto: CreateSaleDto): void {
    if (!dto.phoneId) {
      throw new Error('Phone ID is required');
    }
    if (!dto.saleDate) {
      throw new Error('Sale date is required');
    }
    if (dto.salePrice === undefined || dto.salePrice < 0) {
      throw new Error('Valid sale price is required');
    }
    if (dto.buyerName && dto.buyerName.length > SALE_CONSTRAINTS.BUYER_NAME_MAX) {
      throw new Error(`Buyer name must not exceed ${SALE_CONSTRAINTS.BUYER_NAME_MAX} characters`);
    }
    if (dto.buyerPhone && dto.buyerPhone.length > SALE_CONSTRAINTS.BUYER_PHONE_MAX) {
      throw new Error(`Buyer phone must not exceed ${SALE_CONSTRAINTS.BUYER_PHONE_MAX} characters`);
    }
    if (dto.buyerEmail && dto.buyerEmail.length > SALE_CONSTRAINTS.BUYER_EMAIL_MAX) {
      throw new Error(`Buyer email must not exceed ${SALE_CONSTRAINTS.BUYER_EMAIL_MAX} characters`);
    }
    if (dto.notes && dto.notes.length > SALE_CONSTRAINTS.NOTES_MAX) {
      throw new Error(`Notes must not exceed ${SALE_CONSTRAINTS.NOTES_MAX} characters`);
    }
  }

  private validateMarkAsSoldDto(dto: MarkAsSoldDto): void {
    if (!dto.phoneId) {
      throw new Error('Phone ID is required');
    }
    if (!dto.saleDate) {
      throw new Error('Sale date is required');
    }
    if (dto.salePrice === undefined || dto.salePrice < 0) {
      throw new Error('Valid sale price is required');
    }
    if (dto.buyerName && dto.buyerName.length > SALE_CONSTRAINTS.BUYER_NAME_MAX) {
      throw new Error(`Buyer name must not exceed ${SALE_CONSTRAINTS.BUYER_NAME_MAX} characters`);
    }
    if (dto.buyerPhone && dto.buyerPhone.length > SALE_CONSTRAINTS.BUYER_PHONE_MAX) {
      throw new Error(`Buyer phone must not exceed ${SALE_CONSTRAINTS.BUYER_PHONE_MAX} characters`);
    }
    if (dto.buyerEmail && dto.buyerEmail.length > SALE_CONSTRAINTS.BUYER_EMAIL_MAX) {
      throw new Error(`Buyer email must not exceed ${SALE_CONSTRAINTS.BUYER_EMAIL_MAX} characters`);
    }
    if (dto.notes && dto.notes.length > SALE_CONSTRAINTS.NOTES_MAX) {
      throw new Error(`Notes must not exceed ${SALE_CONSTRAINTS.NOTES_MAX} characters`);
    }
  }

  private validateBatchSaleDto(dto: CompleteBatchSaleDto): void {
    if (!dto.items || dto.items.length === 0) {
      throw new Error('At least one item is required');
    }
    if (!dto.saleDate) {
      throw new Error('Sale date is required');
    }
    for (const item of dto.items) {
      if (!item.phoneId) {
        throw new Error('Phone ID is required for each item');
      }
      if (item.salePrice === undefined || item.salePrice < 0) {
        throw new Error('Valid sale price is required for each item');
      }
    }
    if (dto.buyerName && dto.buyerName.length > SALE_CONSTRAINTS.BUYER_NAME_MAX) {
      throw new Error(`Buyer name must not exceed ${SALE_CONSTRAINTS.BUYER_NAME_MAX} characters`);
    }
    if (dto.buyerPhone && dto.buyerPhone.length > SALE_CONSTRAINTS.BUYER_PHONE_MAX) {
      throw new Error(`Buyer phone must not exceed ${SALE_CONSTRAINTS.BUYER_PHONE_MAX} characters`);
    }
    if (dto.buyerEmail && dto.buyerEmail.length > SALE_CONSTRAINTS.BUYER_EMAIL_MAX) {
      throw new Error(`Buyer email must not exceed ${SALE_CONSTRAINTS.BUYER_EMAIL_MAX} characters`);
    }
    if (dto.notes && dto.notes.length > SALE_CONSTRAINTS.NOTES_MAX) {
      throw new Error(`Notes must not exceed ${SALE_CONSTRAINTS.NOTES_MAX} characters`);
    }
  }

  private validateUpdateDto(dto: UpdateSaleDto): void {
    if (dto.salePrice !== undefined && dto.salePrice < 0) {
      throw new Error('Sale price cannot be negative');
    }
    if (dto.buyerName && dto.buyerName.length > SALE_CONSTRAINTS.BUYER_NAME_MAX) {
      throw new Error(`Buyer name must not exceed ${SALE_CONSTRAINTS.BUYER_NAME_MAX} characters`);
    }
    if (dto.buyerPhone && dto.buyerPhone.length > SALE_CONSTRAINTS.BUYER_PHONE_MAX) {
      throw new Error(`Buyer phone must not exceed ${SALE_CONSTRAINTS.BUYER_PHONE_MAX} characters`);
    }
    if (dto.buyerEmail && dto.buyerEmail.length > SALE_CONSTRAINTS.BUYER_EMAIL_MAX) {
      throw new Error(`Buyer email must not exceed ${SALE_CONSTRAINTS.BUYER_EMAIL_MAX} characters`);
    }
    if (dto.notes && dto.notes.length > SALE_CONSTRAINTS.NOTES_MAX) {
      throw new Error(`Notes must not exceed ${SALE_CONSTRAINTS.NOTES_MAX} characters`);
    }
  }
}
