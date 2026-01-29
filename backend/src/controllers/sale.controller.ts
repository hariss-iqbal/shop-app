import { SaleService } from '../services/sale.service';
import { InputSanitizationService } from '../services/input-sanitization.service';
import {
  CreateSaleDto,
  UpdateSaleDto,
  SaleResponseDto,
  SaleListResponseDto,
  SaleFilterDto,
  SaleSummaryDto,
  MarkAsSoldDto
} from '../dto/sale.dto';
import { SALE_CONSTRAINTS } from '../constants/validation.constants';

/**
 * Sale Controller
 * HTTP request handling for Sale entity
 * Routes: /api/sales
 *
 * Security: All text inputs are sanitized to prevent XSS (F-058).
 * Buyer info and notes are stored as plain text without HTML interpretation.
 */
export class SaleController {
  private readonly sanitizer = new InputSanitizationService();

  constructor(private readonly saleService: SaleService) {}

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

  async create(dto: CreateSaleDto): Promise<SaleResponseDto> {
    const sanitizedDto = this.sanitizeSaleDto(dto);
    this.validateCreateDto(sanitizedDto);
    return this.saleService.create(sanitizedDto);
  }

  async update(id: string, dto: UpdateSaleDto): Promise<SaleResponseDto> {
    const sanitizedDto = this.sanitizeSaleDto(dto);
    this.validateUpdateDto(sanitizedDto);
    return this.saleService.update(id, sanitizedDto);
  }

  async markAsSold(dto: MarkAsSoldDto): Promise<SaleResponseDto> {
    const sanitizedDto = this.sanitizeSaleDto(dto);
    this.validateMarkAsSoldDto(sanitizedDto as MarkAsSoldDto);
    return this.saleService.markAsSold(sanitizedDto as MarkAsSoldDto);
  }

  async delete(id: string): Promise<void> {
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

  private sanitizeSaleDto<T extends Partial<CreateSaleDto & MarkAsSoldDto>>(dto: T): T {
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
