/**
 * PurchaseOrderItem DTOs
 * Data Transfer Objects for PurchaseOrderItem entity
 */

export interface CreatePurchaseOrderItemDto {
  purchaseOrderId: string;
  brand: string;
  model: string;
  quantity: number;
  unitCost: number;
}

export interface UpdatePurchaseOrderItemDto {
  brand?: string;
  model?: string;
  quantity?: number;
  unitCost?: number;
}

export interface PurchaseOrderItemResponseDto {
  id: string;
  purchaseOrderId: string;
  brand: string;
  model: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
  createdAt: string;
}

export interface PurchaseOrderItemListResponseDto {
  data: PurchaseOrderItemResponseDto[];
  total: number;
}
