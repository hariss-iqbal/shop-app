import { LocationInventoryService } from '../services/location-inventory.service';
import {
  AssignPhoneToLocationDto,
  UpdateLocationInventoryDto,
  LocationInventoryResponseDto,
  LocationInventoryListResponseDto,
  LocationInventoryStatsDto,
  LocationInventoryFilterDto
} from '../dto/location-inventory.dto';

/**
 * Location Inventory Controller
 * HTTP handlers for location-based inventory management
 * Feature: F-024 Multi-Location Inventory Support
 */
export class LocationInventoryController {
  constructor(
    private readonly locationInventoryService: LocationInventoryService
  ) {}

  async findByLocation(
    locationId: string,
    filter?: LocationInventoryFilterDto
  ): Promise<LocationInventoryListResponseDto> {
    if (!locationId) {
      throw new Error('Location ID is required');
    }
    return this.locationInventoryService.findByLocation(locationId, filter);
  }

  async findByPhone(phoneId: string): Promise<LocationInventoryResponseDto[]> {
    if (!phoneId) {
      throw new Error('Phone ID is required');
    }
    return this.locationInventoryService.findByPhone(phoneId);
  }

  async getQuantityAtLocation(phoneId: string, locationId: string): Promise<number> {
    if (!phoneId) {
      throw new Error('Phone ID is required');
    }
    if (!locationId) {
      throw new Error('Location ID is required');
    }
    return this.locationInventoryService.getQuantityAtLocation(phoneId, locationId);
  }

  async assignPhoneToLocation(dto: AssignPhoneToLocationDto): Promise<LocationInventoryResponseDto> {
    this.validateAssignDto(dto);
    return this.locationInventoryService.assignPhoneToLocation(dto);
  }

  async updateInventory(
    phoneId: string,
    locationId: string,
    dto: UpdateLocationInventoryDto
  ): Promise<LocationInventoryResponseDto> {
    if (!phoneId) {
      throw new Error('Phone ID is required');
    }
    if (!locationId) {
      throw new Error('Location ID is required');
    }

    this.validateUpdateDto(dto);
    return this.locationInventoryService.updateInventory(phoneId, locationId, dto);
  }

  async adjustQuantity(
    phoneId: string,
    locationId: string,
    quantityChange: number
  ): Promise<LocationInventoryResponseDto> {
    if (!phoneId) {
      throw new Error('Phone ID is required');
    }
    if (!locationId) {
      throw new Error('Location ID is required');
    }
    if (typeof quantityChange !== 'number') {
      throw new Error('Quantity change must be a number');
    }

    return this.locationInventoryService.adjustQuantity(phoneId, locationId, quantityChange);
  }

  async deductStock(phoneId: string, locationId: string, quantity: number = 1): Promise<void> {
    if (!phoneId) {
      throw new Error('Phone ID is required');
    }
    if (!locationId) {
      throw new Error('Location ID is required');
    }
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    return this.locationInventoryService.deductStock(phoneId, locationId, quantity);
  }

  async getLocationStats(locationId: string): Promise<LocationInventoryStatsDto> {
    if (!locationId) {
      throw new Error('Location ID is required');
    }
    return this.locationInventoryService.getLocationStats(locationId);
  }

  async getLowStockItems(locationId?: string): Promise<LocationInventoryResponseDto[]> {
    return this.locationInventoryService.getLowStockItems(locationId);
  }

  private validateAssignDto(dto: AssignPhoneToLocationDto): void {
    if (!dto.phoneId) {
      throw new Error('Phone ID is required');
    }
    if (!dto.locationId) {
      throw new Error('Location ID is required');
    }
    if (dto.quantity !== undefined && dto.quantity < 0) {
      throw new Error('Quantity must be non-negative');
    }
  }

  private validateUpdateDto(dto: UpdateLocationInventoryDto): void {
    if (dto.quantity !== undefined && dto.quantity < 0) {
      throw new Error('Quantity must be non-negative');
    }
    if (dto.minStockLevel !== undefined && dto.minStockLevel < 0) {
      throw new Error('Minimum stock level must be non-negative');
    }
    if (dto.maxStockLevel !== undefined && dto.minStockLevel !== undefined) {
      if (dto.maxStockLevel < dto.minStockLevel) {
        throw new Error('Maximum stock level must be greater than or equal to minimum stock level');
      }
    }
  }
}
