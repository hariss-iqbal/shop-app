import { StoreLocationService } from '../services/store-location.service';
import { InputSanitizationService } from '../services/input-sanitization.service';
import {
  CreateStoreLocationDto,
  UpdateStoreLocationDto,
  StoreLocationResponseDto,
  StoreLocationListResponseDto,
  StoreLocationFilterDto,
  StoreLocationSortDto,
  StoreLocationPaginationDto
} from '../dto/store-location.dto';
import { STORE_LOCATION_CONSTRAINTS } from '../constants/validation.constants';

/**
 * Store Location Controller
 * HTTP handlers for store location management
 * Feature: F-024 Multi-Location Inventory Support
 */
export class StoreLocationController {
  constructor(
    private readonly storeLocationService: StoreLocationService,
    private readonly sanitizationService: InputSanitizationService
  ) {}

  async findAll(
    filter?: StoreLocationFilterDto,
    sort?: StoreLocationSortDto,
    pagination?: StoreLocationPaginationDto
  ): Promise<StoreLocationListResponseDto> {
    const sanitizedFilter = filter ? {
      ...filter,
      search: filter.search ? this.sanitizationService.sanitize(filter.search) : undefined
    } : undefined;

    return this.storeLocationService.findAll(sanitizedFilter, sort, pagination);
  }

  async findActive(): Promise<StoreLocationResponseDto[]> {
    return this.storeLocationService.findActive();
  }

  async findById(id: string): Promise<StoreLocationResponseDto | null> {
    return this.storeLocationService.findById(id);
  }

  async findByCode(code: string): Promise<StoreLocationResponseDto | null> {
    return this.storeLocationService.findByCode(code);
  }

  async findPrimary(): Promise<StoreLocationResponseDto | null> {
    return this.storeLocationService.findPrimary();
  }

  async create(dto: CreateStoreLocationDto): Promise<StoreLocationResponseDto> {
    this.validateCreateDto(dto);

    const sanitizedDto: CreateStoreLocationDto = {
      name: this.sanitizationService.sanitize(dto.name),
      code: this.sanitizationService.sanitize(dto.code),
      address: dto.address ? this.sanitizationService.sanitize(dto.address) : null,
      phone: dto.phone ? this.sanitizationService.sanitize(dto.phone) : null,
      email: dto.email ? this.sanitizationService.sanitize(dto.email) : null,
      isActive: dto.isActive,
      isPrimary: dto.isPrimary,
      managerUserId: dto.managerUserId,
      notes: dto.notes ? this.sanitizationService.sanitize(dto.notes) : null
    };

    return this.storeLocationService.create(sanitizedDto);
  }

  async update(id: string, dto: UpdateStoreLocationDto): Promise<StoreLocationResponseDto> {
    this.validateUpdateDto(dto);

    const sanitizedDto: UpdateStoreLocationDto = {
      ...(dto.name && { name: this.sanitizationService.sanitize(dto.name) }),
      ...(dto.code && { code: this.sanitizationService.sanitize(dto.code) }),
      ...(dto.address !== undefined && { address: dto.address ? this.sanitizationService.sanitize(dto.address) : null }),
      ...(dto.phone !== undefined && { phone: dto.phone ? this.sanitizationService.sanitize(dto.phone) : null }),
      ...(dto.email !== undefined && { email: dto.email ? this.sanitizationService.sanitize(dto.email) : null }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.isPrimary !== undefined && { isPrimary: dto.isPrimary }),
      ...(dto.managerUserId !== undefined && { managerUserId: dto.managerUserId }),
      ...(dto.notes !== undefined && { notes: dto.notes ? this.sanitizationService.sanitize(dto.notes) : null })
    };

    return this.storeLocationService.update(id, sanitizedDto);
  }

  async delete(id: string): Promise<void> {
    return this.storeLocationService.delete(id);
  }

  async setActive(id: string, isActive: boolean): Promise<StoreLocationResponseDto> {
    return this.storeLocationService.setActive(id, isActive);
  }

  async setPrimary(id: string): Promise<StoreLocationResponseDto> {
    return this.storeLocationService.setPrimary(id);
  }

  private validateCreateDto(dto: CreateStoreLocationDto): void {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('Location name is required');
    }
    if (dto.name.length > STORE_LOCATION_CONSTRAINTS.NAME_MAX) {
      throw new Error(`Location name must be at most ${STORE_LOCATION_CONSTRAINTS.NAME_MAX} characters`);
    }

    if (!dto.code || dto.code.trim().length === 0) {
      throw new Error('Location code is required');
    }
    if (dto.code.length > STORE_LOCATION_CONSTRAINTS.CODE_MAX) {
      throw new Error(`Location code must be at most ${STORE_LOCATION_CONSTRAINTS.CODE_MAX} characters`);
    }

    if (dto.address && dto.address.length > STORE_LOCATION_CONSTRAINTS.ADDRESS_MAX) {
      throw new Error(`Address must be at most ${STORE_LOCATION_CONSTRAINTS.ADDRESS_MAX} characters`);
    }

    if (dto.phone && dto.phone.length > STORE_LOCATION_CONSTRAINTS.PHONE_MAX) {
      throw new Error(`Phone must be at most ${STORE_LOCATION_CONSTRAINTS.PHONE_MAX} characters`);
    }

    if (dto.email && dto.email.length > STORE_LOCATION_CONSTRAINTS.EMAIL_MAX) {
      throw new Error(`Email must be at most ${STORE_LOCATION_CONSTRAINTS.EMAIL_MAX} characters`);
    }

    if (dto.notes && dto.notes.length > STORE_LOCATION_CONSTRAINTS.NOTES_MAX) {
      throw new Error(`Notes must be at most ${STORE_LOCATION_CONSTRAINTS.NOTES_MAX} characters`);
    }
  }

  private validateUpdateDto(dto: UpdateStoreLocationDto): void {
    if (dto.name !== undefined) {
      if (dto.name.trim().length === 0) {
        throw new Error('Location name cannot be empty');
      }
      if (dto.name.length > STORE_LOCATION_CONSTRAINTS.NAME_MAX) {
        throw new Error(`Location name must be at most ${STORE_LOCATION_CONSTRAINTS.NAME_MAX} characters`);
      }
    }

    if (dto.code !== undefined) {
      if (dto.code.trim().length === 0) {
        throw new Error('Location code cannot be empty');
      }
      if (dto.code.length > STORE_LOCATION_CONSTRAINTS.CODE_MAX) {
        throw new Error(`Location code must be at most ${STORE_LOCATION_CONSTRAINTS.CODE_MAX} characters`);
      }
    }

    if (dto.address && dto.address.length > STORE_LOCATION_CONSTRAINTS.ADDRESS_MAX) {
      throw new Error(`Address must be at most ${STORE_LOCATION_CONSTRAINTS.ADDRESS_MAX} characters`);
    }

    if (dto.phone && dto.phone.length > STORE_LOCATION_CONSTRAINTS.PHONE_MAX) {
      throw new Error(`Phone must be at most ${STORE_LOCATION_CONSTRAINTS.PHONE_MAX} characters`);
    }

    if (dto.email && dto.email.length > STORE_LOCATION_CONSTRAINTS.EMAIL_MAX) {
      throw new Error(`Email must be at most ${STORE_LOCATION_CONSTRAINTS.EMAIL_MAX} characters`);
    }

    if (dto.notes && dto.notes.length > STORE_LOCATION_CONSTRAINTS.NOTES_MAX) {
      throw new Error(`Notes must be at most ${STORE_LOCATION_CONSTRAINTS.NOTES_MAX} characters`);
    }
  }
}
