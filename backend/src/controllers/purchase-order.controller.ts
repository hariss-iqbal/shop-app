import { PurchaseOrderService } from '../services/purchase-order.service';
import { InputSanitizationService } from '../services/input-sanitization.service';
import { PurchaseOrderStatus, PhoneCondition } from '../enums';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  PurchaseOrderResponseDto,
  PurchaseOrderListResponseDto,
  PurchaseOrderFilterDto,
  ReceivePurchaseOrderDto,
  ReceivePurchaseOrderResponseDto
} from '../dto/purchase-order.dto';
import { PURCHASE_ORDER_CONSTRAINTS, PHONE_CONSTRAINTS } from '../constants/validation.constants';

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
   * - Validates phone records match expected quantity
   * - Creates phone inventory records
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
      phones: dto.phones.map(phone => ({
        ...phone,
        brand: this.sanitizer.sanitizeString(phone.brand),
        model: this.sanitizer.sanitizeString(phone.model),
        color: phone.color ? this.sanitizer.sanitizeString(phone.color) : phone.color,
        imei: phone.imei ? this.sanitizer.sanitizeString(phone.imei) : phone.imei,
        notes: phone.notes ? this.sanitizer.sanitizeString(phone.notes) : phone.notes
      }))
    };
  }

  private validateReceiveDto(dto: ReceivePurchaseOrderDto): void {
    if (!dto.phones || dto.phones.length === 0) {
      throw new Error('At least one phone record is required');
    }

    const validConditions = Object.values(PhoneCondition);

    for (let i = 0; i < dto.phones.length; i++) {
      const phone = dto.phones[i];

      if (phone.lineItemIndex === undefined || phone.lineItemIndex < 0) {
        throw new Error(`Phone record ${i + 1}: Invalid line item index`);
      }

      if (!phone.brand || phone.brand.trim().length === 0) {
        throw new Error(`Phone record ${i + 1}: Brand is required`);
      }

      if (phone.brand.length > PURCHASE_ORDER_CONSTRAINTS.ITEM_BRAND_MAX) {
        throw new Error(`Phone record ${i + 1}: Brand must not exceed ${PURCHASE_ORDER_CONSTRAINTS.ITEM_BRAND_MAX} characters`);
      }

      if (!phone.model || phone.model.trim().length === 0) {
        throw new Error(`Phone record ${i + 1}: Model is required`);
      }

      if (phone.model.length > PHONE_CONSTRAINTS.MODEL_MAX) {
        throw new Error(`Phone record ${i + 1}: Model must not exceed ${PHONE_CONSTRAINTS.MODEL_MAX} characters`);
      }

      if (!phone.condition || !validConditions.includes(phone.condition)) {
        throw new Error(`Phone record ${i + 1}: Valid condition is required (new, used, refurbished)`);
      }

      if (phone.sellingPrice === undefined || phone.sellingPrice < 0) {
        throw new Error(`Phone record ${i + 1}: Selling price must be non-negative`);
      }

      if (phone.color && phone.color.length > PHONE_CONSTRAINTS.COLOR_MAX) {
        throw new Error(`Phone record ${i + 1}: Color must not exceed ${PHONE_CONSTRAINTS.COLOR_MAX} characters`);
      }

      if (phone.imei && phone.imei.length > PHONE_CONSTRAINTS.IMEI_MAX) {
        throw new Error(`Phone record ${i + 1}: IMEI must not exceed ${PHONE_CONSTRAINTS.IMEI_MAX} characters`);
      }

      if (phone.batteryHealth !== undefined && phone.batteryHealth !== null) {
        if (phone.batteryHealth < PHONE_CONSTRAINTS.BATTERY_HEALTH_MIN || phone.batteryHealth > PHONE_CONSTRAINTS.BATTERY_HEALTH_MAX) {
          throw new Error(`Phone record ${i + 1}: Battery health must be between ${PHONE_CONSTRAINTS.BATTERY_HEALTH_MIN} and ${PHONE_CONSTRAINTS.BATTERY_HEALTH_MAX}`);
        }
      }

      if (phone.notes && phone.notes.length > PHONE_CONSTRAINTS.NOTES_MAX) {
        throw new Error(`Phone record ${i + 1}: Notes must not exceed ${PHONE_CONSTRAINTS.NOTES_MAX} characters`);
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
      if (item.model.length > PHONE_CONSTRAINTS.MODEL_MAX) {
        throw new Error(`Item model must not exceed ${PHONE_CONSTRAINTS.MODEL_MAX} characters`);
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
