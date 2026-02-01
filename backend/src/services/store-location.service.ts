import { StoreLocationRepository } from '../repositories/store-location.repository';
import { StoreLocation, StoreLocationInsert } from '../entities/store-location.entity';
import {
  CreateStoreLocationDto,
  UpdateStoreLocationDto,
  StoreLocationResponseDto,
  StoreLocationListResponseDto,
  StoreLocationFilterDto,
  StoreLocationSortDto,
  StoreLocationPaginationDto
} from '../dto/store-location.dto';

/**
 * Store Location Service
 * Business logic for store location management
 * Feature: F-024 Multi-Location Inventory Support
 */
export class StoreLocationService {
  constructor(private readonly storeLocationRepository: StoreLocationRepository) {}

  async findAll(
    filter?: StoreLocationFilterDto,
    sort?: StoreLocationSortDto,
    pagination?: StoreLocationPaginationDto
  ): Promise<StoreLocationListResponseDto> {
    let locations = await this.storeLocationRepository.findAll({
      isActive: filter?.isActive,
      limit: pagination?.limit,
      offset: pagination ? (pagination.page - 1) * pagination.limit : undefined,
      orderBy: sort?.field,
      orderDirection: sort?.direction
    });

    if (filter?.search) {
      locations = await this.storeLocationRepository.search(filter.search, filter.isActive);
    }

    const total = await this.storeLocationRepository.count(filter?.isActive);

    return {
      data: locations.map(this.toResponseDto),
      total
    };
  }

  async findActive(): Promise<StoreLocationResponseDto[]> {
    const locations = await this.storeLocationRepository.findAll({ isActive: true });
    return locations.map(this.toResponseDto);
  }

  async findById(id: string): Promise<StoreLocationResponseDto | null> {
    const location = await this.storeLocationRepository.findById(id);
    return location ? this.toResponseDto(location) : null;
  }

  async findByCode(code: string): Promise<StoreLocationResponseDto | null> {
    const location = await this.storeLocationRepository.findByCode(code);
    return location ? this.toResponseDto(location) : null;
  }

  async findPrimary(): Promise<StoreLocationResponseDto | null> {
    const location = await this.storeLocationRepository.findPrimary();
    return location ? this.toResponseDto(location) : null;
  }

  async create(dto: CreateStoreLocationDto): Promise<StoreLocationResponseDto> {
    const existingCode = await this.storeLocationRepository.findByCode(dto.code.toUpperCase());
    if (existingCode) {
      throw new Error(`Location with code "${dto.code}" already exists`);
    }

    const locationInsert: StoreLocationInsert = {
      name: dto.name.trim(),
      code: dto.code.toUpperCase().trim(),
      address: dto.address?.trim() || null,
      phone: dto.phone?.trim() || null,
      email: dto.email?.trim() || null,
      is_active: dto.isActive ?? true,
      is_primary: dto.isPrimary ?? false,
      manager_user_id: dto.managerUserId || null,
      notes: dto.notes?.trim() || null
    };

    const location = await this.storeLocationRepository.create(locationInsert);
    return this.toResponseDto(location);
  }

  async update(id: string, dto: UpdateStoreLocationDto): Promise<StoreLocationResponseDto> {
    const existing = await this.storeLocationRepository.findById(id);
    if (!existing) {
      throw new Error(`Location with id "${id}" not found`);
    }

    if (dto.code && dto.code.toUpperCase() !== existing.code) {
      const existingCode = await this.storeLocationRepository.findByCode(dto.code.toUpperCase());
      if (existingCode) {
        throw new Error(`Location with code "${dto.code}" already exists`);
      }
    }

    const locationUpdate = {
      ...(dto.name && { name: dto.name.trim() }),
      ...(dto.code && { code: dto.code.toUpperCase().trim() }),
      ...(dto.address !== undefined && { address: dto.address?.trim() || null }),
      ...(dto.phone !== undefined && { phone: dto.phone?.trim() || null }),
      ...(dto.email !== undefined && { email: dto.email?.trim() || null }),
      ...(dto.isActive !== undefined && { is_active: dto.isActive }),
      ...(dto.isPrimary !== undefined && { is_primary: dto.isPrimary }),
      ...(dto.managerUserId !== undefined && { manager_user_id: dto.managerUserId }),
      ...(dto.notes !== undefined && { notes: dto.notes?.trim() || null })
    };

    const location = await this.storeLocationRepository.update(id, locationUpdate);
    return this.toResponseDto(location);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.storeLocationRepository.findById(id);
    if (!existing) {
      throw new Error(`Location with id "${id}" not found`);
    }

    if (existing.is_primary) {
      throw new Error('Cannot delete the primary location');
    }

    await this.storeLocationRepository.delete(id);
  }

  async setActive(id: string, isActive: boolean): Promise<StoreLocationResponseDto> {
    return this.update(id, { isActive });
  }

  async setPrimary(id: string): Promise<StoreLocationResponseDto> {
    return this.update(id, { isPrimary: true });
  }

  private toResponseDto(location: StoreLocation): StoreLocationResponseDto {
    return {
      id: location.id,
      name: location.name,
      code: location.code,
      address: location.address,
      phone: location.phone,
      email: location.email,
      isActive: location.is_active,
      isPrimary: location.is_primary,
      managerUserId: location.manager_user_id,
      notes: location.notes,
      createdAt: location.created_at,
      updatedAt: location.updated_at
    };
  }
}
