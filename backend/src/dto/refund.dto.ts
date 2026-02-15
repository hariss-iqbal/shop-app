import { RefundStatus } from '../entities/refund.entity';

/**
 * Refund DTOs
 * Data Transfer Objects for Refund entity
 * Feature: F-009 Full Refund Processing
 */

/**
 * Request DTO for processing a full refund
 */
export interface ProcessFullRefundDto {
  receiptId: string;
  refundReason?: string | null;
  notes?: string | null;
}

/**
 * Request DTO for checking if a receipt can be refunded
 */
export interface CheckReceiptRefundableDto {
  receiptId: string;
}

/**
 * Response DTO for a refund item
 */
export interface RefundItemResponseDto {
  id: string;
  originalSaleId: string | null;
  productId: string | null;
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  inventoryRestored: boolean;
  originalUnitPrice?: number | null;
  isCustomPrice?: boolean;
  priceDifference?: number;
  productModel?: string | null;
  brandName?: string | null;
}

/**
 * Response DTO for a refund
 */
export interface RefundResponseDto {
  id: string;
  refundNumber: string;
  originalReceiptId: string | null;
  originalReceiptNumber?: string | null;
  refundDate: string;
  refundTime: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  refundAmount: number;
  refundReason: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  status: RefundStatus;
  notes: string | null;
  isPartialRefund: boolean;
  managerApproved: boolean;
  managerApprovedAt: string | null;
  managerApprovalReason: string | null;
  items: RefundItemResponseDto[];
  itemCount: number;
  inventoryRestoredCount: number;
  hasCustomPrices: boolean;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * Response DTO for a refund list
 */
export interface RefundListResponseDto {
  data: RefundResponseDto[];
  total: number;
}

/**
 * Filter DTO for querying refunds
 */
export interface RefundFilterDto {
  startDate?: string;
  endDate?: string;
  status?: RefundStatus;
  customerPhone?: string;
  refundNumber?: string;
  page?: number;
  limit?: number;
}

/**
 * Response DTO for processing a full refund
 */
export interface ProcessRefundResponseDto {
  success: boolean;
  refundId?: string;
  refundNumber?: string;
  originalReceiptId?: string;
  originalReceiptNumber?: string;
  refundAmount?: number;
  itemsRefunded?: number;
  inventoryRestored?: number;
  items?: Array<{
    itemName: string;
    quantity: number;
    unitPrice: number;
    total: number;
    productId: string | null;
    inventoryRestored: boolean;
  }>;
  error?: string;
}

/**
 * Response DTO for checking if receipt can be refunded
 */
export interface CheckReceiptRefundableResponseDto {
  canRefund: boolean;
  reason?: string;
  receiptId: string;
  receiptNumber?: string;
  transactionDate?: string;
  transactionTime?: string;
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  grandTotal?: number;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  existingRefundId?: string;
  existingRefundNumber?: string;
  items?: Array<{
    id: string;
    saleId: string | null;
    productId: string | null;
    itemName: string;
    quantity: number;
    unitPrice: number;
    total: number;
    productStatus: string | null;
    productModel: string | null;
    brandName: string | null;
    canRestoreInventory: boolean;
  }>;
}

/**
 * Response DTO for getting refund by receipt
 */
export interface GetRefundByReceiptResponseDto {
  found: boolean;
  receiptId: string;
  refund?: RefundResponseDto;
}

/**
 * Refund summary statistics DTO
 */
export interface RefundSummaryDto {
  totalRefunds: number;
  totalRefundAmount: number;
  totalItemsRefunded: number;
  totalInventoryRestored: number;
}

/**
 * Partial Refund DTOs
 * Feature: F-010 Partial Refund Processing with Custom Return Price
 */

/**
 * Item input for partial refund with custom return price
 */
export interface PartialRefundItemInputDto {
  receiptItemId: string;
  returnPrice: number;
}

/**
 * Request DTO for processing a partial refund
 */
export interface ProcessPartialRefundDto {
  receiptId: string;
  items: PartialRefundItemInputDto[];
  refundReason?: string | null;
  notes?: string | null;
  managerApproved?: boolean;
  managerApprovalReason?: string | null;
}

/**
 * Request DTO for checking if a receipt can be partially refunded
 */
export interface CheckPartialRefundableDto {
  receiptId: string;
}

/**
 * Partial refund item in response
 */
export interface PartialRefundItemResponseDto {
  id?: string;
  originalSaleId: string | null;
  productId: string | null;
  itemName: string;
  quantity: number;
  originalUnitPrice: number;
  returnPrice: number;
  total: number;
  inventoryRestored: boolean;
  isCustomPrice: boolean;
  priceDifference: number;
  productModel?: string | null;
  brandName?: string | null;
}

/**
 * Response DTO for processing a partial refund
 */
export interface ProcessPartialRefundResponseDto {
  success: boolean;
  refundId?: string;
  refundNumber?: string;
  originalReceiptId?: string;
  originalReceiptNumber?: string;
  isPartialRefund?: boolean;
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  refundAmount?: number;
  itemsRefunded?: number;
  inventoryRestored?: number;
  hasCustomPrices?: boolean;
  managerApproved?: boolean;
  items?: PartialRefundItemResponseDto[];
  error?: string;
}

/**
 * Receipt item available for partial refund
 */
export interface PartialRefundableItemDto {
  id: string;
  saleId: string | null;
  productId: string | null;
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  productStatus: string | null;
  productModel: string | null;
  brandName: string | null;
  canRestoreInventory: boolean;
  alreadyRefunded: boolean;
  canRefund: boolean;
}

/**
 * Existing partial refund info
 */
export interface ExistingPartialRefundDto {
  refundNumber: string;
  refundDate: string;
  refundAmount: number;
  itemCount: number;
}

/**
 * Response DTO for checking if receipt can be partially refunded
 */
export interface CheckPartialRefundableResponseDto {
  canPartialRefund: boolean;
  reason?: string;
  receiptId: string;
  receiptNumber?: string;
  transactionDate?: string;
  transactionTime?: string;
  originalSubtotal?: number;
  taxRate?: number;
  originalTaxAmount?: number;
  originalGrandTotal?: number;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  existingRefundId?: string;
  existingRefundNumber?: string;
  existingPartialRefunds?: ExistingPartialRefundDto[];
  alreadyRefundedItemCount?: number;
  items?: PartialRefundableItemDto[];
}
