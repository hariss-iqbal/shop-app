import { PurchaseOrderStatus, ProductCondition } from '../enums';

/**
 * PurchaseOrder DTOs
 * Data Transfer Objects for PurchaseOrder entity
 */

export interface CreatePurchaseOrderItemDto {
  brand: string;
  model: string;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseOrderDto {
  supplierId: string;
  orderDate: string;
  notes?: string | null;
  items: CreatePurchaseOrderItemDto[];
}

export interface UpdatePurchaseOrderDto {
  supplierId?: string;
  orderDate?: string;
  notes?: string | null;
}

export interface PurchaseOrderItemResponseDto {
  id: string;
  purchaseOrderId: string;
  brand: string;
  model: string;
  quantity: number;
  unitCost: number;
  createdAt: string;
}

export interface PurchaseOrderResponseDto {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  totalAmount: number;
  status: PurchaseOrderStatus;
  notes: string | null;
  items: PurchaseOrderItemResponseDto[];
  createdAt: string;
  updatedAt: string | null;
}

export interface PurchaseOrderListResponseDto {
  data: PurchaseOrderResponseDto[];
  total: number;
}

export interface PurchaseOrderFilterDto {
  supplierId?: string;
  status?: PurchaseOrderStatus;
  startDate?: string;
  endDate?: string;
}

/**
 * Receiving Workflow DTOs
 * Used for the Purchase Order receiving process (F-023)
 */

/**
 * Represents a single product record to be created during receiving
 * Pre-filled with brand/model from PO item, admin fills in rest
 */
export interface ReceivingProductRecordDto {
  /** Index of the PO line item this product belongs to */
  lineItemIndex: number;
  /** Brand name from the PO item (pre-filled, required to resolve brand_id) */
  brand: string;
  /** Model name from the PO item (pre-filled) */
  model: string;
  /** Color of the product */
  color?: string | null;
  /** IMEI number (unique per phone) */
  imei?: string | null;
  /** Product condition */
  condition: ProductCondition;
  /** Battery health percentage (0-100), applicable for used/open box */
  batteryHealth?: number | null;
  /** Storage capacity in GB */
  storageGb?: number | null;
  /** RAM in GB */
  ramGb?: number | null;
  /** Selling price for this product */
  sellingPrice: number;
  /** Optional notes for this product */
  notes?: string | null;
}

/**
 * Request DTO for the receiving workflow
 * Contains all product records to be created when marking PO as received
 */
export interface ReceivePurchaseOrderDto {
  /** Array of product records, one for each unit in the PO */
  products: ReceivingProductRecordDto[];
}

/**
 * Response DTO for the receiving workflow
 * Returns the updated PO and count of created products
 */
export interface ReceivePurchaseOrderResponseDto {
  /** The updated purchase order with status = 'received' */
  purchaseOrder: PurchaseOrderResponseDto;
  /** Number of product records created */
  productsCreated: number;
  /** IDs of the created products */
  createdProductIds: string[];
}
