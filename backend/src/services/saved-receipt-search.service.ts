import { SavedReceiptSearchRepository } from '../repositories/saved-receipt-search.repository';
import { SavedReceiptSearch, SavedReceiptSearchInsert, SavedReceiptSearchUpdate } from '../entities/saved-receipt-search.entity';
import {
  SavedReceiptSearchDto,
  CreateSavedSearchDto,
  UpdateSavedSearchDto,
  SavedSearchListResponseDto
} from '../dto/receipt.dto';

/**
 * Saved Receipt Search Service
 * Business logic for SavedReceiptSearch entity
 * Feature: F-015 Multi-Criteria Receipt Search and Filtering
 */
export class SavedReceiptSearchService {
  constructor(private readonly repository: SavedReceiptSearchRepository) {}

  async findAll(): Promise<SavedSearchListResponseDto> {
    const searches = await this.repository.findAll();
    const total = await this.repository.count();

    return {
      data: searches.map(this.toResponseDto),
      total
    };
  }

  async findById(id: string): Promise<SavedReceiptSearchDto | null> {
    const search = await this.repository.findById(id);
    return search ? this.toResponseDto(search) : null;
  }

  async findDefault(): Promise<SavedReceiptSearchDto | null> {
    const search = await this.repository.findDefault();
    return search ? this.toResponseDto(search) : null;
  }

  async create(dto: CreateSavedSearchDto): Promise<SavedReceiptSearchDto> {
    const existing = await this.repository.findByName(dto.name);
    if (existing) {
      throw new Error(`A saved search with the name "${dto.name}" already exists`);
    }

    if (dto.isDefault) {
      await this.repository.clearDefault();
    }

    const insert: SavedReceiptSearchInsert = {
      name: dto.name.trim(),
      filters: dto.filters,
      is_default: dto.isDefault || false
    };

    const created = await this.repository.create(insert);
    return this.toResponseDto(created);
  }

  async update(id: string, dto: UpdateSavedSearchDto): Promise<SavedReceiptSearchDto> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error(`Saved search with id "${id}" not found`);
    }

    if (dto.name && dto.name !== existing.name) {
      const nameConflict = await this.repository.findByName(dto.name);
      if (nameConflict) {
        throw new Error(`A saved search with the name "${dto.name}" already exists`);
      }
    }

    if (dto.isDefault && !existing.is_default) {
      await this.repository.clearDefault();
    }

    const update: SavedReceiptSearchUpdate = {};
    if (dto.name !== undefined) update.name = dto.name.trim();
    if (dto.filters !== undefined) update.filters = dto.filters;
    if (dto.isDefault !== undefined) update.is_default = dto.isDefault;

    const updated = await this.repository.update(id, update);
    return this.toResponseDto(updated);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error(`Saved search with id "${id}" not found`);
    }

    await this.repository.delete(id);
  }

  private toResponseDto(search: SavedReceiptSearch): SavedReceiptSearchDto {
    return {
      id: search.id,
      name: search.name,
      filters: {
        receiptNumber: search.filters.receiptNumber,
        customerPhone: search.filters.customerPhone,
        customerName: search.filters.customerName,
        customerEmail: search.filters.customerEmail,
        startDate: search.filters.startDate,
        endDate: search.filters.endDate,
        minAmount: search.filters.minAmount,
        maxAmount: search.filters.maxAmount,
        sortField: search.filters.sortField as 'transactionDate' | 'grandTotal' | 'receiptNumber' | 'createdAt' | undefined,
        sortOrder: search.filters.sortOrder
      },
      isDefault: search.is_default,
      createdAt: search.created_at,
      updatedAt: search.updated_at || undefined
    };
  }
}
