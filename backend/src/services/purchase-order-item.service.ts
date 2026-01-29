import { PurchaseOrderItemRepository } from '../repositories/purchase-order-item.repository';
import { PurchaseOrderRepository } from '../repositories/purchase-order.repository';
import { PurchaseOrderItem, PurchaseOrderItemInsert, PurchaseOrderItemUpdate } from '../entities/purchase-order-item.entity';
import { PurchaseOrderStatus } from '../enums';
import {
  CreatePurchaseOrderItemDto,
  UpdatePurchaseOrderItemDto,
  PurchaseOrderItemResponseDto,
  PurchaseOrderItemListResponseDto
} from '../dto/purchase-order-item.dto';

/**
 * PurchaseOrderItem Service
 * Business logic for PurchaseOrderItem entity
 * Owner Module: M-06 Procurement
 */
export class PurchaseOrderItemService {
  constructor(
    private readonly purchaseOrderItemRepository: PurchaseOrderItemRepository,
    private readonly purchaseOrderRepository: PurchaseOrderRepository
  ) {}

  async findByPurchaseOrderId(purchaseOrderId: string): Promise<PurchaseOrderItemListResponseDto> {
    const items = await this.purchaseOrderItemRepository.findByPurchaseOrderId(purchaseOrderId);
    const total = await this.purchaseOrderItemRepository.countByPurchaseOrderId(purchaseOrderId);

    return {
      data: items.map(this.toResponseDto),
      total
    };
  }

  async findById(id: string): Promise<PurchaseOrderItemResponseDto | null> {
    const item = await this.purchaseOrderItemRepository.findById(id);
    return item ? this.toResponseDto(item) : null;
  }

  async create(dto: CreatePurchaseOrderItemDto): Promise<PurchaseOrderItemResponseDto> {
    const purchaseOrder = await this.purchaseOrderRepository.findById(dto.purchaseOrderId);
    if (!purchaseOrder) {
      throw new Error(`Purchase order with id "${dto.purchaseOrderId}" not found`);
    }

    if (purchaseOrder.status !== PurchaseOrderStatus.PENDING) {
      throw new Error('Cannot add items to a purchase order that is not pending');
    }

    const itemInsert: PurchaseOrderItemInsert = {
      purchase_order_id: dto.purchaseOrderId,
      brand: dto.brand.trim(),
      model: dto.model.trim(),
      quantity: dto.quantity,
      unit_cost: dto.unitCost
    };

    const item = await this.purchaseOrderItemRepository.create(itemInsert);
    await this.updatePurchaseOrderTotal(dto.purchaseOrderId);

    return this.toResponseDto(item);
  }

  async update(id: string, dto: UpdatePurchaseOrderItemDto): Promise<PurchaseOrderItemResponseDto> {
    const existing = await this.purchaseOrderItemRepository.findById(id);
    if (!existing) {
      throw new Error(`Purchase order item with id "${id}" not found`);
    }

    const purchaseOrder = await this.purchaseOrderRepository.findById(existing.purchase_order_id);
    if (purchaseOrder && purchaseOrder.status !== PurchaseOrderStatus.PENDING) {
      throw new Error('Cannot modify items in a purchase order that is not pending');
    }

    const itemUpdate: PurchaseOrderItemUpdate = {
      ...(dto.brand && { brand: dto.brand.trim() }),
      ...(dto.model && { model: dto.model.trim() }),
      ...(dto.quantity !== undefined && { quantity: dto.quantity }),
      ...(dto.unitCost !== undefined && { unit_cost: dto.unitCost })
    };

    const item = await this.purchaseOrderItemRepository.update(id, itemUpdate);
    await this.updatePurchaseOrderTotal(existing.purchase_order_id);

    return this.toResponseDto(item);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.purchaseOrderItemRepository.findById(id);
    if (!existing) {
      throw new Error(`Purchase order item with id "${id}" not found`);
    }

    const purchaseOrder = await this.purchaseOrderRepository.findById(existing.purchase_order_id);
    if (purchaseOrder && purchaseOrder.status !== PurchaseOrderStatus.PENDING) {
      throw new Error('Cannot delete items from a purchase order that is not pending');
    }

    await this.purchaseOrderItemRepository.delete(id);
    await this.updatePurchaseOrderTotal(existing.purchase_order_id);
  }

  private async updatePurchaseOrderTotal(purchaseOrderId: string): Promise<void> {
    const items = await this.purchaseOrderItemRepository.findByPurchaseOrderId(purchaseOrderId);
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
    await this.purchaseOrderRepository.update(purchaseOrderId, { total_amount: totalAmount });
  }

  private toResponseDto(item: PurchaseOrderItem): PurchaseOrderItemResponseDto {
    return {
      id: item.id,
      purchaseOrderId: item.purchase_order_id,
      brand: item.brand,
      model: item.model,
      quantity: item.quantity,
      unitCost: item.unit_cost,
      lineTotal: item.quantity * item.unit_cost,
      createdAt: item.created_at
    };
  }
}
