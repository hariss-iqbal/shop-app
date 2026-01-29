import { PurchaseOrderItemService } from '../services/purchase-order-item.service';
import {
  CreatePurchaseOrderItemDto,
  UpdatePurchaseOrderItemDto,
  PurchaseOrderItemResponseDto,
  PurchaseOrderItemListResponseDto
} from '../dto/purchase-order-item.dto';

/**
 * PurchaseOrderItem Controller
 * HTTP request handling for PurchaseOrderItem entity
 * Routes: /api/purchase-orders/:poId/items
 */
export class PurchaseOrderItemController {
  constructor(private readonly purchaseOrderItemService: PurchaseOrderItemService) {}

  async getByPurchaseOrderId(purchaseOrderId: string): Promise<PurchaseOrderItemListResponseDto> {
    return this.purchaseOrderItemService.findByPurchaseOrderId(purchaseOrderId);
  }

  async getById(id: string): Promise<PurchaseOrderItemResponseDto> {
    const item = await this.purchaseOrderItemService.findById(id);
    if (!item) {
      throw new Error('Purchase order item not found');
    }
    return item;
  }

  async create(dto: CreatePurchaseOrderItemDto): Promise<PurchaseOrderItemResponseDto> {
    this.validateCreateDto(dto);
    return this.purchaseOrderItemService.create(dto);
  }

  async update(id: string, dto: UpdatePurchaseOrderItemDto): Promise<PurchaseOrderItemResponseDto> {
    this.validateUpdateDto(dto);
    return this.purchaseOrderItemService.update(id, dto);
  }

  async delete(id: string): Promise<void> {
    return this.purchaseOrderItemService.delete(id);
  }

  private validateCreateDto(dto: CreatePurchaseOrderItemDto): void {
    if (!dto.purchaseOrderId) {
      throw new Error('Purchase order ID is required');
    }
    if (!dto.brand || dto.brand.trim().length === 0) {
      throw new Error('Brand is required');
    }
    if (dto.brand.length > 100) {
      throw new Error('Brand must not exceed 100 characters');
    }
    if (!dto.model || dto.model.trim().length === 0) {
      throw new Error('Model is required');
    }
    if (dto.model.length > 150) {
      throw new Error('Model must not exceed 150 characters');
    }
    if (!dto.quantity || dto.quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }
    if (dto.unitCost === undefined || dto.unitCost < 0) {
      throw new Error('Unit cost must be non-negative');
    }
  }

  private validateUpdateDto(dto: UpdatePurchaseOrderItemDto): void {
    if (dto.brand !== undefined) {
      if (dto.brand.trim().length === 0) {
        throw new Error('Brand cannot be empty');
      }
      if (dto.brand.length > 100) {
        throw new Error('Brand must not exceed 100 characters');
      }
    }
    if (dto.model !== undefined) {
      if (dto.model.trim().length === 0) {
        throw new Error('Model cannot be empty');
      }
      if (dto.model.length > 150) {
        throw new Error('Model must not exceed 150 characters');
      }
    }
    if (dto.quantity !== undefined && dto.quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }
    if (dto.unitCost !== undefined && dto.unitCost < 0) {
      throw new Error('Unit cost must be non-negative');
    }
  }
}
