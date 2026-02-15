import { LocationInventoryRepository } from '../repositories/location-inventory.repository';
import { StoreLocationRepository } from '../repositories/store-location.repository';
import { LocationInventoryWithRelations } from '../entities/location-inventory.entity';
import {
  AssignProductToLocationDto,
  UpdateLocationInventoryDto,
  LocationInventoryResponseDto,
  LocationInventoryListResponseDto,
  LocationInventoryStatsDto,
  LocationInventoryFilterDto
} from '../dto/location-inventory.dto';

/**
 * Location Inventory Service
 * Business logic for location-based inventory management
 * Feature: F-024 Multi-Location Inventory Support
 */
export class LocationInventoryService {
  constructor(
    private readonly locationInventoryRepository: LocationInventoryRepository,
    private readonly storeLocationRepository: StoreLocationRepository
  ) {}

  async findByLocation(
    locationId: string,
    filter?: LocationInventoryFilterDto
  ): Promise<LocationInventoryListResponseDto> {
    const location = await this.storeLocationRepository.findById(locationId);
    if (!location) {
      throw new Error(`Location with id "${locationId}" not found`);
    }

    const inventory = await this.locationInventoryRepository.findByLocationId(locationId);
    const stats = await this.locationInventoryRepository.getLocationStats(locationId);

    return {
      data: inventory.map(this.toResponseDto),
      total: inventory.length,
      stats
    };
  }

  async findByProduct(productId: string): Promise<LocationInventoryResponseDto[]> {
    const inventory = await this.locationInventoryRepository.findByProductId(productId);
    return inventory.map(this.toResponseDto);
  }

  async getQuantityAtLocation(productId: string, locationId: string): Promise<number> {
    const inventory = await this.locationInventoryRepository.findByProductAndLocation(productId, locationId);
    return inventory?.quantity || 0;
  }

  async assignProductToLocation(dto: AssignProductToLocationDto): Promise<LocationInventoryResponseDto> {
    const location = await this.storeLocationRepository.findById(dto.locationId);
    if (!location) {
      throw new Error(`Location with id "${dto.locationId}" not found`);
    }

    if (!location.is_active) {
      throw new Error(`Location "${location.name}" is not active`);
    }

    const quantity = dto.quantity ?? 1;
    if (quantity < 0) {
      throw new Error('Quantity must be non-negative');
    }

    const inventory = await this.locationInventoryRepository.upsert({
      product_id: dto.productId,
      location_id: dto.locationId,
      quantity
    });

    const withRelations = await this.locationInventoryRepository.findByProductAndLocation(
      dto.productId,
      dto.locationId
    );

    return this.toResponseDto(withRelations as LocationInventoryWithRelations);
  }

  async updateInventory(
    productId: string,
    locationId: string,
    dto: UpdateLocationInventoryDto
  ): Promise<LocationInventoryResponseDto> {
    const existing = await this.locationInventoryRepository.findByProductAndLocation(productId, locationId);
    if (!existing) {
      throw new Error(`Inventory record not found for product at location`);
    }

    if (dto.quantity !== undefined && dto.quantity < 0) {
      throw new Error('Quantity must be non-negative');
    }

    if (dto.minStockLevel !== undefined && dto.minStockLevel < 0) {
      throw new Error('Minimum stock level must be non-negative');
    }

    if (dto.maxStockLevel !== undefined && dto.minStockLevel !== undefined && dto.maxStockLevel < dto.minStockLevel) {
      throw new Error('Maximum stock level must be greater than or equal to minimum stock level');
    }

    const updateData = {
      ...(dto.quantity !== undefined && { quantity: dto.quantity }),
      ...(dto.minStockLevel !== undefined && { min_stock_level: dto.minStockLevel }),
      ...(dto.maxStockLevel !== undefined && { max_stock_level: dto.maxStockLevel })
    };

    const inventory = await this.locationInventoryRepository.update(existing.id, updateData);

    const withRelations = await this.locationInventoryRepository.findByProductAndLocation(productId, locationId);
    return this.toResponseDto(withRelations as LocationInventoryWithRelations);
  }

  async adjustQuantity(
    productId: string,
    locationId: string,
    quantityChange: number
  ): Promise<LocationInventoryResponseDto> {
    const inventory = await this.locationInventoryRepository.updateQuantity(productId, locationId, quantityChange);

    const withRelations = await this.locationInventoryRepository.findByProductAndLocation(productId, locationId);
    return this.toResponseDto(withRelations as LocationInventoryWithRelations);
  }

  async deductStock(productId: string, locationId: string, quantity: number = 1): Promise<void> {
    if (quantity <= 0) {
      throw new Error('Quantity to deduct must be positive');
    }

    const currentQuantity = await this.getQuantityAtLocation(productId, locationId);
    if (currentQuantity < quantity) {
      throw new Error(`Insufficient stock at location. Available: ${currentQuantity}, Requested: ${quantity}`);
    }

    await this.locationInventoryRepository.updateQuantity(productId, locationId, -quantity);
  }

  async getLocationStats(locationId: string): Promise<LocationInventoryStatsDto> {
    return this.locationInventoryRepository.getLocationStats(locationId);
  }

  async getLowStockItems(locationId?: string): Promise<LocationInventoryResponseDto[]> {
    const inventory = await this.locationInventoryRepository.findAll({
      locationId,
      lowStockOnly: true
    });

    return inventory.map(this.toResponseDto);
  }

  private toResponseDto(inventory: LocationInventoryWithRelations): LocationInventoryResponseDto {
    return {
      id: inventory.id,
      productId: inventory.product_id,
      locationId: inventory.location_id,
      quantity: inventory.quantity,
      minStockLevel: inventory.min_stock_level,
      maxStockLevel: inventory.max_stock_level,
      createdAt: inventory.created_at,
      updatedAt: inventory.updated_at,
      product: inventory.product ? {
        id: inventory.product.id,
        model: inventory.product.model,
        status: inventory.product.status,
        sellingPrice: inventory.product.selling_price,
        costPrice: inventory.product.cost_price,
        condition: inventory.product.condition,
        brandId: inventory.product.brand?.id || '',
        brandName: inventory.product.brand?.name || ''
      } : undefined,
      location: inventory.location ? {
        id: inventory.location.id,
        name: inventory.location.name,
        code: inventory.location.code
      } : undefined
    };
  }
}
