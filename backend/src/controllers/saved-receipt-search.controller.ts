import { SavedReceiptSearchService } from '../services/saved-receipt-search.service';
import { InputSanitizationService } from '../services/input-sanitization.service';
import {
  SavedReceiptSearchDto,
  CreateSavedSearchDto,
  UpdateSavedSearchDto,
  SavedSearchListResponseDto
} from '../dto/receipt.dto';

const SAVED_SEARCH_NAME_MAX = 100;

/**
 * Saved Receipt Search Controller
 * HTTP request handling for SavedReceiptSearch entity
 * Routes: /api/saved-receipt-searches
 * Feature: F-015 Multi-Criteria Receipt Search and Filtering
 *
 * Security: All text inputs are sanitized to prevent XSS (F-058).
 */
export class SavedReceiptSearchController {
  private readonly sanitizer = new InputSanitizationService();

  constructor(private readonly service: SavedReceiptSearchService) {}

  async getAll(): Promise<SavedSearchListResponseDto> {
    return this.service.findAll();
  }

  async getById(id: string): Promise<SavedReceiptSearchDto> {
    const search = await this.service.findById(id);
    if (!search) {
      throw new Error('Saved search not found');
    }
    return search;
  }

  async getDefault(): Promise<SavedReceiptSearchDto | null> {
    return this.service.findDefault();
  }

  async create(dto: CreateSavedSearchDto): Promise<SavedReceiptSearchDto> {
    const sanitizedDto = this.sanitizeCreateDto(dto);
    this.validateCreateDto(sanitizedDto);
    return this.service.create(sanitizedDto);
  }

  async update(id: string, dto: UpdateSavedSearchDto): Promise<SavedReceiptSearchDto> {
    const sanitizedDto = this.sanitizeUpdateDto(dto);
    this.validateUpdateDto(sanitizedDto);
    return this.service.update(id, sanitizedDto);
  }

  async delete(id: string): Promise<void> {
    return this.service.delete(id);
  }

  private sanitizeCreateDto(dto: CreateSavedSearchDto): CreateSavedSearchDto {
    return {
      ...dto,
      name: this.sanitizer.sanitizeString(dto.name),
      filters: {
        ...dto.filters,
        receiptNumber: dto.filters.receiptNumber
          ? this.sanitizer.sanitizeString(dto.filters.receiptNumber)
          : dto.filters.receiptNumber,
        customerPhone: dto.filters.customerPhone
          ? this.sanitizer.sanitizeString(dto.filters.customerPhone)
          : dto.filters.customerPhone,
        customerName: dto.filters.customerName
          ? this.sanitizer.sanitizeString(dto.filters.customerName)
          : dto.filters.customerName,
        customerEmail: dto.filters.customerEmail?.trim()
      }
    };
  }

  private sanitizeUpdateDto(dto: UpdateSavedSearchDto): UpdateSavedSearchDto {
    const sanitized: UpdateSavedSearchDto = { ...dto };

    if (dto.name) {
      sanitized.name = this.sanitizer.sanitizeString(dto.name);
    }

    if (dto.filters) {
      sanitized.filters = {
        ...dto.filters,
        receiptNumber: dto.filters.receiptNumber
          ? this.sanitizer.sanitizeString(dto.filters.receiptNumber)
          : dto.filters.receiptNumber,
        customerPhone: dto.filters.customerPhone
          ? this.sanitizer.sanitizeString(dto.filters.customerPhone)
          : dto.filters.customerPhone,
        customerName: dto.filters.customerName
          ? this.sanitizer.sanitizeString(dto.filters.customerName)
          : dto.filters.customerName,
        customerEmail: dto.filters.customerEmail?.trim()
      };
    }

    return sanitized;
  }

  private validateCreateDto(dto: CreateSavedSearchDto): void {
    if (!dto.name?.trim()) {
      throw new Error('Search name is required');
    }
    if (dto.name.length > SAVED_SEARCH_NAME_MAX) {
      throw new Error(`Search name must not exceed ${SAVED_SEARCH_NAME_MAX} characters`);
    }
    this.validateFilters(dto.filters);
  }

  private validateUpdateDto(dto: UpdateSavedSearchDto): void {
    if (dto.name !== undefined) {
      if (!dto.name?.trim()) {
        throw new Error('Search name cannot be empty');
      }
      if (dto.name.length > SAVED_SEARCH_NAME_MAX) {
        throw new Error(`Search name must not exceed ${SAVED_SEARCH_NAME_MAX} characters`);
      }
    }
    if (dto.filters) {
      this.validateFilters(dto.filters);
    }
  }

  private validateFilters(filters: CreateSavedSearchDto['filters']): void {
    if (filters.minAmount !== undefined && filters.minAmount < 0) {
      throw new Error('Minimum amount cannot be negative');
    }
    if (filters.maxAmount !== undefined && filters.maxAmount < 0) {
      throw new Error('Maximum amount cannot be negative');
    }
    if (filters.minAmount !== undefined && filters.maxAmount !== undefined) {
      if (filters.minAmount > filters.maxAmount) {
        throw new Error('Minimum amount cannot be greater than maximum amount');
      }
    }
    if (filters.sortField && !['transactionDate', 'grandTotal', 'receiptNumber', 'createdAt'].includes(filters.sortField)) {
      throw new Error('Invalid sort field');
    }
    if (filters.sortOrder && !['asc', 'desc'].includes(filters.sortOrder)) {
      throw new Error('Invalid sort order');
    }
  }
}
