import { PurchaseOrderRepository } from '../repositories/purchase-order.repository';
import { PurchaseOrderItemRepository } from '../repositories/purchase-order-item.repository';
import { ProductRepository } from '../repositories/product.repository';
import { BrandRepository } from '../repositories/brand.repository';
import { PurchaseOrder, PurchaseOrderInsert, PurchaseOrderUpdate, PurchaseOrderWithRelations } from '../entities/purchase-order.entity';
import { PurchaseOrderItemInsert } from '../entities/purchase-order-item.entity';
import { ProductInsert } from '../entities/product.entity';
import { PurchaseOrderStatus, ProductStatus } from '../enums';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  PurchaseOrderResponseDto,
  PurchaseOrderListResponseDto,
  PurchaseOrderItemResponseDto,
  PurchaseOrderFilterDto,
  ReceivePurchaseOrderDto,
  ReceivePurchaseOrderResponseDto
} from '../dto/purchase-order.dto';

/**
 * PurchaseOrder Service
 * Business logic for PurchaseOrder entity
 * Owner Module: M-06 Procurement
 */
export class PurchaseOrderService {
  constructor(
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly purchaseOrderItemRepository: PurchaseOrderItemRepository,
    private readonly productRepository: ProductRepository,
    private readonly brandRepository: BrandRepository
  ) {}

  async findAll(filter?: PurchaseOrderFilterDto): Promise<PurchaseOrderListResponseDto> {
    const purchaseOrders = await this.purchaseOrderRepository.findAll({
      supplierId: filter?.supplierId,
      status: filter?.status,
      startDate: filter?.startDate,
      endDate: filter?.endDate
    });

    const total = await this.purchaseOrderRepository.count(filter?.status);

    return {
      data: purchaseOrders.map(this.toResponseDto),
      total
    };
  }

  async findById(id: string): Promise<PurchaseOrderResponseDto | null> {
    const purchaseOrder = await this.purchaseOrderRepository.findById(id);
    return purchaseOrder ? this.toResponseDto(purchaseOrder) : null;
  }

  async create(dto: CreatePurchaseOrderDto): Promise<PurchaseOrderResponseDto> {
    const poNumber = await this.purchaseOrderRepository.getNextPoNumber();
    const totalAmount = dto.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

    const poInsert: PurchaseOrderInsert = {
      po_number: poNumber,
      supplier_id: dto.supplierId,
      order_date: dto.orderDate,
      total_amount: totalAmount,
      status: PurchaseOrderStatus.PENDING,
      notes: dto.notes?.trim() || null
    };

    const purchaseOrder = await this.purchaseOrderRepository.create(poInsert);

    for (const item of dto.items) {
      const itemInsert: PurchaseOrderItemInsert = {
        purchase_order_id: purchaseOrder.id,
        brand: item.brand.trim(),
        model: item.model.trim(),
        quantity: item.quantity,
        unit_cost: item.unitCost
      };
      await this.purchaseOrderItemRepository.create(itemInsert);
    }

    const poWithRelations = await this.purchaseOrderRepository.findById(purchaseOrder.id);
    return this.toResponseDto(poWithRelations!);
  }

  async update(id: string, dto: UpdatePurchaseOrderDto): Promise<PurchaseOrderResponseDto> {
    const existing = await this.purchaseOrderRepository.findById(id);
    if (!existing) {
      throw new Error(`Purchase order with id "${id}" not found`);
    }

    if (existing.status !== PurchaseOrderStatus.PENDING) {
      throw new Error('Cannot modify a purchase order that is not pending');
    }

    const poUpdate: PurchaseOrderUpdate = {
      ...(dto.supplierId && { supplier_id: dto.supplierId }),
      ...(dto.orderDate && { order_date: dto.orderDate }),
      ...(dto.notes !== undefined && { notes: dto.notes?.trim() || null })
    };

    await this.purchaseOrderRepository.update(id, poUpdate);
    const poWithRelations = await this.purchaseOrderRepository.findById(id);
    return this.toResponseDto(poWithRelations!);
  }

  /**
   * Mark as Received - Simple status transition (legacy)
   * @deprecated Use receiveWithInventory for full receiving workflow
   */
  async markAsReceived(id: string): Promise<PurchaseOrderResponseDto> {
    const existing = await this.purchaseOrderRepository.findById(id);
    if (!existing) {
      throw new Error(`Purchase order with id "${id}" not found`);
    }

    if (existing.status !== PurchaseOrderStatus.PENDING) {
      throw new Error('Only pending purchase orders can be marked as received');
    }

    await this.purchaseOrderRepository.update(id, { status: PurchaseOrderStatus.RECEIVED });
    const poWithRelations = await this.purchaseOrderRepository.findById(id);
    return this.toResponseDto(poWithRelations!);
  }

  /**
   * Receive Purchase Order with Inventory Creation (F-023)
   *
   * This workflow:
   * 1. Validates the PO is pending and has correct number of product records
   * 2. Resolves brand names to brand IDs (creates brands if they don't exist)
   * 3. Creates individual product records for each unit with status='available'
   * 4. Sets product's cost_price from PO item's unit_cost
   * 5. Sets product's supplier_id from PO's supplier
   * 6. Updates PO status to 'received'
   *
   * @param id - Purchase Order ID
   * @param dto - Receiving data with product records
   * @returns Updated PO and list of created product IDs
   */
  async receiveWithInventory(id: string, dto: ReceivePurchaseOrderDto): Promise<ReceivePurchaseOrderResponseDto> {
    const existing = await this.purchaseOrderRepository.findById(id);
    if (!existing) {
      throw new Error(`Purchase order with id "${id}" not found`);
    }

    if (existing.status !== PurchaseOrderStatus.PENDING) {
      throw new Error('Only pending purchase orders can be marked as received');
    }

    const items = existing.items || [];
    const expectedProductCount = items.reduce((sum, item) => sum + item.quantity, 0);

    if (dto.products.length !== expectedProductCount) {
      throw new Error(
        `Expected ${expectedProductCount} product records but received ${dto.products.length}. ` +
        `All items must be received at once.`
      );
    }

    const brandCache = new Map<string, string>();

    const productInserts: ProductInsert[] = [];

    for (const productRecord of dto.products) {
      const item = items[productRecord.lineItemIndex];
      if (!item) {
        throw new Error(`Invalid line item index: ${productRecord.lineItemIndex}`);
      }

      let brandId = brandCache.get(productRecord.brand.toLowerCase());
      if (!brandId) {
        let brand = await this.brandRepository.findByName(productRecord.brand);
        if (!brand) {
          brand = await this.brandRepository.create({ name: productRecord.brand.trim() });
        }
        brandId = brand.id;
        brandCache.set(productRecord.brand.toLowerCase(), brandId);
      }

      if (productRecord.imei) {
        const existingProduct = await this.productRepository.findByImei(productRecord.imei);
        if (existingProduct) {
          throw new Error(`Product with IMEI "${productRecord.imei}" already exists`);
        }
      }

      const productInsert: ProductInsert = {
        brand_id: brandId,
        model: productRecord.model.trim(),
        color: productRecord.color?.trim() || null,
        imei: productRecord.imei?.trim() || null,
        condition: productRecord.condition,
        battery_health: productRecord.batteryHealth || null,
        storage_gb: productRecord.storageGb || null,
        ram_gb: productRecord.ramGb || null,
        cost_price: item.unit_cost,
        selling_price: productRecord.sellingPrice,
        status: ProductStatus.AVAILABLE,
        supplier_id: existing.supplier_id,
        purchase_date: existing.order_date,
        notes: productRecord.notes?.trim() || null
      };

      productInserts.push(productInsert);
    }

    const createdProducts = await this.productRepository.createMany(productInserts);
    const createdProductIds = createdProducts.map(product => product.id);

    await this.purchaseOrderRepository.update(id, { status: PurchaseOrderStatus.RECEIVED });

    const poWithRelations = await this.purchaseOrderRepository.findById(id);

    return {
      purchaseOrder: this.toResponseDto(poWithRelations!),
      productsCreated: createdProducts.length,
      createdProductIds
    };
  }

  async cancel(id: string): Promise<PurchaseOrderResponseDto> {
    const existing = await this.purchaseOrderRepository.findById(id);
    if (!existing) {
      throw new Error(`Purchase order with id "${id}" not found`);
    }

    if (existing.status !== PurchaseOrderStatus.PENDING) {
      throw new Error('Only pending purchase orders can be cancelled');
    }

    await this.purchaseOrderRepository.update(id, { status: PurchaseOrderStatus.CANCELLED });
    const poWithRelations = await this.purchaseOrderRepository.findById(id);
    return this.toResponseDto(poWithRelations!);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.purchaseOrderRepository.findById(id);
    if (!existing) {
      throw new Error(`Purchase order with id "${id}" not found`);
    }

    if (existing.status === PurchaseOrderStatus.RECEIVED) {
      throw new Error('Cannot delete a received purchase order');
    }

    await this.purchaseOrderRepository.delete(id);
  }

  private toResponseDto(po: PurchaseOrderWithRelations): PurchaseOrderResponseDto {
    return {
      id: po.id,
      poNumber: po.po_number,
      supplierId: po.supplier_id,
      supplierName: po.supplier?.name || '',
      orderDate: po.order_date,
      totalAmount: po.total_amount,
      status: po.status,
      notes: po.notes,
      items: (po.items || []).map(item => this.toItemResponseDto(item, po.id)),
      createdAt: po.created_at,
      updatedAt: po.updated_at
    };
  }

  private toItemResponseDto(item: any, purchaseOrderId: string): PurchaseOrderItemResponseDto {
    return {
      id: item.id,
      purchaseOrderId,
      brand: item.brand,
      model: item.model,
      quantity: item.quantity,
      unitCost: item.unit_cost,
      createdAt: item.created_at
    };
  }
}
