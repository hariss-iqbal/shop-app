import { PurchaseOrderService } from '../services/purchase-order.service';
import { InputSanitizationService } from '../services/input-sanitization.service';
import { PurchaseOrderStatus, ProductCondition } from '../enums';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  PurchaseOrderResponseDto,
  PurchaseOrderListResponseDto,
  PurchaseOrderFilterDto,
  ReceivePurchaseOrderDto,
  ReceivePurchaseOrderResponseDto
} from '../dto/purchase-order.dto';
import { PURCHASE_ORDER_CONSTRAINTS, PRODUCT_CONSTRAINTS } from '../constants/validation.constants';

/**
 * PurchaseOrder Controller
 * HTTP request handling for PurchaseOrder entity
 * Routes: /api/purchase-orders
 *
 * Security: All text inputs are sanitized to prevent XSS (F-058).
 * Notes are stored as plain text without HTML interpretation.
 */
export class PurchaseOrderController {
  private readonly sanitizer = new InputSanitizationService();

  constructor(private readonly purchaseOrderService: PurchaseOrderService) {}

  async getAll(filter?: PurchaseOrderFilterDto): Promise<PurchaseOrderListResponseDto> {
    return this.purchaseOrderService.findAll(filter);
  }

  async getById(id: string): Promise<PurchaseOrderResponseDto> {
    const purchaseOrder = await this.purchaseOrderService.findById(id);
    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }
    return purchaseOrder;
  }

  async create(dto: CreatePurchaseOrderDto): Promise<PurchaseOrderResponseDto> {
    const sanitizedDto = this.sanitizeCreateDto(dto);
    this.validateCreateDto(sanitizedDto);
    return this.purchaseOrderService.create(sanitizedDto);
  }

  async update(id: string, dto: UpdatePurchaseOrderDto): Promise<PurchaseOrderResponseDto> {
    const sanitizedDto = this.sanitizeUpdateDto(dto);
    this.validateUpdateDto(sanitizedDto);
    return this.purchaseOrderService.update(id, sanitizedDto);
  }

  async markAsReceived(id: string): Promise<PurchaseOrderResponseDto> {
    return this.purchaseOrderService.markAsReceived(id);
  }

  /**
   * Receive Purchase Order with Inventory Creation (F-023)
   *
   * This endpoint handles the full receiving workflow:
   * - Validates product records match expected quantity
   * - Creates product inventory records
   * - Updates PO status to 'received'
   */
  async receiveWithInventory(id: string, dto: ReceivePurchaseOrderDto): Promise<ReceivePurchaseOrderResponseDto> {
    const sanitizedDto = this.sanitizeReceiveDto(dto);
    this.validateReceiveDto(sanitizedDto);
    return this.purchaseOrderService.receiveWithInventory(id, sanitizedDto);
  }

  async cancel(id: string): Promise<PurchaseOrderResponseDto> {
    return this.purchaseOrderService.cancel(id);
  }

  async delete(id: string): Promise<void> {
    return this.purchaseOrderService.delete(id);
  }

  private sanitizeCreateDto(dto: CreatePurchaseOrderDto): CreatePurchaseOrderDto {
    return {
      ...dto,
      notes: dto.notes ? this.sanitizer.sanitizeString(dto.notes) : dto.notes,
      items: dto.items.map(item => ({
        ...item,
        brand: this.sanitizer.sanitizeString(item.brand),
        model: this.sanitizer.sanitizeString(item.model)
      }))
    };
  }

  private sanitizeUpdateDto(dto: UpdatePurchaseOrderDto): UpdatePurchaseOrderDto {
    return {
      ...dto,
      notes: dto.notes ? this.sanitizer.sanitizeString(dto.notes) : dto.notes
    };
  }

  private sanitizeReceiveDto(dto: ReceivePurchaseOrderDto): ReceivePurchaseOrderDto {
    return {
      products: dto.products.map(product => ({
        ...product,
        brand: this.sanitizer.sanitizeString(product.brand),
        model: this.sanitizer.sanitizeString(product.model),
        color: product.color ? this.sanitizer.sanitizeString(product.color) : product.color,
        imei: product.imei ? this.sanitizer.sanitizeString(product.imei) : product.imei,
        notes: product.notes ? this.sanitizer.sanitizeString(product.notes) : product.notes
      }))
    };
  }

  private validateReceiveDto(dto: ReceivePurchaseOrderDto): void {
    if (!dto.products || dto.products.length === 0) {
      throw new Error('At least one product record is required');
    }

    const validConditions = Object.values(ProductCondition);

    for (let i = 0; i < dto.products.length; i++) {
      const product = dto.products[i];

      if (product.lineItemIndex === undefined || product.lineItemIndex < 0) {
        throw new Error(`Product record ${i + 1}: Invalid line item index`);
      }

      if (!product.brand || product.brand.trim().length === 0) {
        throw new Error(`Product record ${i + 1}: Brand is required`);
      }

      if (product.brand.length > PURCHASE_ORDER_CONSTRAINTS.ITEM_BRAND_MAX) {
        throw new Error(`Product record ${i + 1}: Brand must not exceed ${PURCHASE_ORDER_CONSTRAINTS.ITEM_BRAND_MAX} characters`);
      }

      if (!product.model || product.model.trim().length === 0) {
        throw new Error(`Product record ${i + 1}: Model is required`);
      }

      if (product.model.length > PRODUCT_CONSTRAINTS.MODEL_MAX) {
        throw new Error(`Product record ${i + 1}: Model must not exceed ${PRODUCT_CONSTRAINTS.MODEL_MAX} characters`);
      }

      if (!product.condition || !validConditions.includes(product.condition)) {
        throw new Error(`Product record ${i + 1}: Valid condition is required (new, used, open_box)`);
      }

      if (product.sellingPrice === undefined || product.sellingPrice < 0) {
        throw new Error(`Product record ${i + 1}: Selling price must be non-negative`);
      }

      if (product.color && product.color.length > PRODUCT_CONSTRAINTS.COLOR_MAX) {
        throw new Error(`Product record ${i + 1}: Color must not exceed ${PRODUCT_CONSTRAINTS.COLOR_MAX} characters`);
      }

      if (product.imei && product.imei.length > PRODUCT_CONSTRAINTS.IMEI_MAX) {
        throw new Error(`Product record ${i + 1}: IMEI must not exceed ${PRODUCT_CONSTRAINTS.IMEI_MAX} characters`);
      }

      if (product.batteryHealth !== undefined && product.batteryHealth !== null) {
        if (product.batteryHealth < PRODUCT_CONSTRAINTS.BATTERY_HEALTH_MIN || product.batteryHealth > PRODUCT_CONSTRAINTS.BATTERY_HEALTH_MAX) {
          throw new Error(`Product record ${i + 1}: Battery health must be between ${PRODUCT_CONSTRAINTS.BATTERY_HEALTH_MIN} and ${PRODUCT_CONSTRAINTS.BATTERY_HEALTH_MAX}`);
        }
      }

      if (product.notes && product.notes.length > PRODUCT_CONSTRAINTS.NOTES_MAX) {
        throw new Error(`Product record ${i + 1}: Notes must not exceed ${PRODUCT_CONSTRAINTS.NOTES_MAX} characters`);
      }
    }
  }

  private validateCreateDto(dto: CreatePurchaseOrderDto): void {
    if (!dto.supplierId) {
      throw new Error('Supplier ID is required');
    }
    if (!dto.orderDate) {
      throw new Error('Order date is required');
    }
    if (!dto.items || dto.items.length === 0) {
      throw new Error('At least one item is required');
    }
    if (dto.notes && dto.notes.length > PURCHASE_ORDER_CONSTRAINTS.NOTES_MAX) {
      throw new Error(`Notes must not exceed ${PURCHASE_ORDER_CONSTRAINTS.NOTES_MAX} characters`);
    }

    for (const item of dto.items) {
      if (!item.brand || item.brand.trim().length === 0) {
        throw new Error('Item brand is required');
      }
      if (item.brand.length > PURCHASE_ORDER_CONSTRAINTS.ITEM_BRAND_MAX) {
        throw new Error(`Item brand must not exceed ${PURCHASE_ORDER_CONSTRAINTS.ITEM_BRAND_MAX} characters`);
      }
      if (!item.model || item.model.trim().length === 0) {
        throw new Error('Item model is required');
      }
      if (item.model.length > PRODUCT_CONSTRAINTS.MODEL_MAX) {
        throw new Error(`Item model must not exceed ${PRODUCT_CONSTRAINTS.MODEL_MAX} characters`);
      }
      if (!item.quantity || item.quantity < 1) {
        throw new Error('Item quantity must be at least 1');
      }
      if (item.unitCost === undefined || item.unitCost < 0) {
        throw new Error('Item unit cost must be non-negative');
      }
    }
  }

  private validateUpdateDto(dto: UpdatePurchaseOrderDto): void {
    if (dto.notes && dto.notes.length > PURCHASE_ORDER_CONSTRAINTS.NOTES_MAX) {
      throw new Error(`Notes must not exceed ${PURCHASE_ORDER_CONSTRAINTS.NOTES_MAX} characters`);
    }
  }
}
