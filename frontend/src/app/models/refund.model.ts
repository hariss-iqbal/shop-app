/**
 * Refund Model
 * Records refund transactions linked to original receipts
 * Feature: F-009 Full Refund Processing
 */

export type RefundStatus = 'pending' | 'completed' | 'cancelled';

/**
 * Refund Item - represents a single line item in a refund
 */
export interface RefundItem {
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
 * Refund - represents a refund transaction
 */
export interface Refund {
  id: string;
  refundNumber: string;
  originalReceiptId: string | null;
  originalReceiptNumber: string | null;
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
  items: RefundItem[];
  itemCount: number;
  inventoryRestoredCount: number;
  hasCustomPrices: boolean;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * Refund list response
 */
export interface RefundListResponse {
  data: Refund[];
  total: number;
}

/**
 * Filter options for refund search
 */
export interface RefundFilter {
  startDate?: string;
  endDate?: string;
  status?: RefundStatus;
  customerPhone?: string;
  refundNumber?: string;
  page?: number;
  limit?: number;
}

/**
 * Request to process a full refund
 */
export interface ProcessFullRefundRequest {
  receiptId: string;
  refundReason?: string | null;
  notes?: string | null;
}

/**
 * Response from processing a full refund
 */
export interface ProcessRefundResponse {
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
 * Receipt item for refund preview
 */
export interface ReceiptItemForRefund {
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
}

/**
 * Response for checking if a receipt can be refunded
 */
export interface CheckReceiptRefundableResponse {
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
  items?: ReceiptItemForRefund[];
}

/**
 * Response for getting refund by receipt
 */
export interface GetRefundByReceiptResponse {
  found: boolean;
  receiptId: string;
  refund?: Refund;
}

/**
 * Refund summary statistics
 */
export interface RefundSummary {
  totalRefunds: number;
  totalRefundAmount: number;
  totalItemsRefunded: number;
  totalInventoryRestored: number;
}

/**
 * Refund receipt data for printing/PDF
 */
export interface RefundReceiptData {
  refundNumber: string;
  originalReceiptNumber: string | null;
  refundDate: string;
  refundTime: string;
  items: RefundItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  refundAmount: number;
  refundReason: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  notes: string | null;
  isPartialRefund?: boolean;
  managerApproved?: boolean;
  hasCustomPrices?: boolean;
}

/**
 * Partial Refund Types
 * Feature: F-010 Partial Refund Processing with Custom Return Price
 */

/**
 * Item input for partial refund with custom return price
 */
export interface PartialRefundItemInput {
  receiptItemId: string;
  returnPrice: number;
}

/**
 * Request to process a partial refund
 */
export interface ProcessPartialRefundRequest {
  receiptId: string;
  items: PartialRefundItemInput[];
  refundReason?: string | null;
  notes?: string | null;
  managerApproved?: boolean;
  managerApprovalReason?: string | null;
}

/**
 * Partial refund item in response
 */
export interface PartialRefundItemResponse {
  itemName: string;
  quantity: number;
  originalUnitPrice: number;
  returnPrice: number;
  total: number;
  productId: string | null;
  inventoryRestored: boolean;
  isCustomPrice: boolean;
  priceDifference: number;
}

/**
 * Response from processing a partial refund
 */
export interface ProcessPartialRefundResponse {
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
  items?: PartialRefundItemResponse[];
  error?: string;
}

/**
 * Receipt item available for partial refund
 */
export interface PartialRefundableItem {
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
export interface ExistingPartialRefund {
  refundNumber: string;
  refundDate: string;
  refundAmount: number;
  itemCount: number;
}

/**
 * Response for checking if receipt can be partially refunded
 */
export interface CheckPartialRefundableResponse {
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
  existingPartialRefunds?: ExistingPartialRefund[];
  alreadyRefundedItemCount?: number;
  items?: PartialRefundableItem[];
}
