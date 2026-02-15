import { SupabaseClient } from '@supabase/supabase-js';
import { InventoryTransferRepository } from '../repositories/inventory-transfer.repository';
import { LocationInventoryRepository } from '../repositories/location-inventory.repository';
import { StoreLocationRepository } from '../repositories/store-location.repository';
import { InventoryTransferWithRelations, InventoryTransferItemWithProduct } from '../entities/inventory-transfer.entity';
import { InventoryTransferStatus } from '../enums';
import {
  InitiateTransferDto,
  UpdateTransferDto,
  InventoryTransferResponseDto,
  InventoryTransferItemResponseDto,
  InventoryTransferListResponseDto,
  InventoryTransferFilterDto,
  InventoryTransferSortDto,
  InventoryTransferPaginationDto,
  TransferResultDto
} from '../dto/inventory-transfer.dto';

/**
 * Inventory Transfer Service
 * Business logic for inventory transfers between locations
 * Feature: F-024 Multi-Location Inventory Support
 */
export class InventoryTransferService {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly inventoryTransferRepository: InventoryTransferRepository,
    private readonly locationInventoryRepository: LocationInventoryRepository,
    private readonly storeLocationRepository: StoreLocationRepository
  ) {}

  async findAll(
    filter?: InventoryTransferFilterDto,
    sort?: InventoryTransferSortDto,
    pagination?: InventoryTransferPaginationDto
  ): Promise<InventoryTransferListResponseDto> {
    const transfers = await this.inventoryTransferRepository.findAll({
      sourceLocationId: filter?.sourceLocationId,
      destinationLocationId: filter?.destinationLocationId,
      status: filter?.status,
      dateFrom: filter?.dateFrom,
      dateTo: filter?.dateTo,
      limit: pagination?.limit,
      offset: pagination ? (pagination.page - 1) * pagination.limit : undefined,
      orderBy: sort?.field,
      orderDirection: sort?.direction
    });

    const total = await this.inventoryTransferRepository.count({
      status: filter?.status,
      sourceLocationId: filter?.sourceLocationId,
      destinationLocationId: filter?.destinationLocationId
    });

    return {
      data: transfers.map(this.toResponseDto),
      total
    };
  }

  async findById(id: string): Promise<InventoryTransferResponseDto | null> {
    const transfer = await this.inventoryTransferRepository.findById(id);
    return transfer ? this.toResponseDto(transfer) : null;
  }

  async findByTransferNumber(transferNumber: string): Promise<InventoryTransferResponseDto | null> {
    const transfer = await this.inventoryTransferRepository.findByTransferNumber(transferNumber);
    return transfer ? this.toResponseDto(transfer) : null;
  }

  async initiateTransfer(dto: InitiateTransferDto): Promise<TransferResultDto> {
    const { data, error } = await this.supabase.rpc('initiate_inventory_transfer', {
      p_source_location_id: dto.sourceLocationId,
      p_destination_location_id: dto.destinationLocationId,
      p_items: dto.items.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        notes: item.notes || null
      })),
      p_notes: dto.notes || null
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: data.success,
      transferId: data.transferId,
      transferNumber: data.transferNumber,
      error: data.error
    };
  }

  async completeTransfer(id: string): Promise<TransferResultDto> {
    const { data, error } = await this.supabase.rpc('complete_inventory_transfer', {
      p_transfer_id: id
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: data.success,
      transferId: data.transferId,
      error: data.error
    };
  }

  async cancelTransfer(id: string): Promise<TransferResultDto> {
    const { data, error } = await this.supabase.rpc('cancel_inventory_transfer', {
      p_transfer_id: id
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: data.success,
      transferId: data.transferId,
      error: data.error
    };
  }

  async updateTransfer(id: string, dto: UpdateTransferDto): Promise<InventoryTransferResponseDto> {
    const existing = await this.inventoryTransferRepository.findById(id);
    if (!existing) {
      throw new Error(`Transfer with id "${id}" not found`);
    }

    if (existing.status !== InventoryTransferStatus.PENDING) {
      throw new Error('Can only update pending transfers');
    }

    const updateData = {
      ...(dto.notes !== undefined && { notes: dto.notes?.trim() || null })
    };

    await this.inventoryTransferRepository.update(id, updateData);
    const transfer = await this.inventoryTransferRepository.findById(id);
    return this.toResponseDto(transfer!);
  }

  async startTransit(id: string): Promise<InventoryTransferResponseDto> {
    const existing = await this.inventoryTransferRepository.findById(id);
    if (!existing) {
      throw new Error(`Transfer with id "${id}" not found`);
    }

    if (existing.status !== InventoryTransferStatus.PENDING) {
      throw new Error('Can only start transit for pending transfers');
    }

    await this.inventoryTransferRepository.update(id, { status: InventoryTransferStatus.IN_TRANSIT });
    const transfer = await this.inventoryTransferRepository.findById(id);
    return this.toResponseDto(transfer!);
  }

  async getPendingTransfersCount(locationId?: string): Promise<number> {
    return this.inventoryTransferRepository.count({
      status: InventoryTransferStatus.PENDING,
      sourceLocationId: locationId
    });
  }

  async getInTransitTransfersCount(locationId?: string): Promise<number> {
    return this.inventoryTransferRepository.count({
      status: InventoryTransferStatus.IN_TRANSIT,
      destinationLocationId: locationId
    });
  }

  private toResponseDto(transfer: InventoryTransferWithRelations): InventoryTransferResponseDto {
    return {
      id: transfer.id,
      transferNumber: transfer.transfer_number,
      sourceLocationId: transfer.source_location_id,
      destinationLocationId: transfer.destination_location_id,
      status: transfer.status,
      initiatedByUserId: transfer.initiated_by_user_id,
      completedByUserId: transfer.completed_by_user_id,
      notes: transfer.notes,
      initiatedAt: transfer.initiated_at,
      completedAt: transfer.completed_at,
      createdAt: transfer.created_at,
      updatedAt: transfer.updated_at,
      sourceLocation: transfer.source_location ? {
        id: transfer.source_location.id,
        name: transfer.source_location.name,
        code: transfer.source_location.code
      } : undefined,
      destinationLocation: transfer.destination_location ? {
        id: transfer.destination_location.id,
        name: transfer.destination_location.name,
        code: transfer.destination_location.code
      } : undefined,
      items: transfer.items?.map(this.toItemResponseDto)
    };
  }

  private toItemResponseDto(item: InventoryTransferItemWithProduct): InventoryTransferItemResponseDto {
    return {
      id: item.id,
      transferId: item.transfer_id,
      productId: item.product_id,
      quantity: item.quantity,
      notes: item.notes,
      createdAt: item.created_at,
      product: item.product ? {
        id: item.product.id,
        model: item.product.model,
        condition: item.product.condition,
        brandId: item.product.brand?.id || '',
        brandName: item.product.brand?.name || ''
      } : undefined
    };
  }
}
