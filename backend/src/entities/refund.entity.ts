/**
 * Refund Entity
 * Records refund transactions linked to original receipts
 * Database table: refunds
 * Owner Module: M-07 Sales (Feature: F-009 Full Refund Processing)
 */

export type RefundStatus = 'pending' | 'completed' | 'cancelled';

export interface Refund {
  id: string;
  refund_number: string;
  original_receipt_id: string | null;
  refund_date: string;
  refund_time: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  refund_amount: number;
  refund_reason: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  status: RefundStatus;
  processed_by: string | null;
  notes: string | null;
  is_partial_refund: boolean;
  manager_approved: boolean;
  manager_approved_at: string | null;
  manager_approval_reason: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface RefundInsert {
  id?: string;
  refund_number: string;
  original_receipt_id?: string | null;
  refund_date: string;
  refund_time: string;
  subtotal: number;
  tax_rate?: number;
  tax_amount?: number;
  refund_amount: number;
  refund_reason?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  status?: RefundStatus;
  processed_by?: string | null;
  notes?: string | null;
  is_partial_refund?: boolean;
  manager_approved?: boolean;
  manager_approved_at?: string | null;
  manager_approval_reason?: string | null;
  created_at?: string;
  updated_at?: string | null;
}

export interface RefundUpdate {
  refund_reason?: string | null;
  status?: RefundStatus;
  notes?: string | null;
  updated_at?: string | null;
}

export interface RefundWithItems extends Refund {
  items?: RefundItem[];
  original_receipt?: {
    id: string;
    receipt_number: string;
    transaction_date: string;
    grand_total: number;
  };
}

/**
 * Refund Item Entity
 * Line items for each refund transaction
 * Database table: refund_items
 */
export interface RefundItem {
  id: string;
  refund_id: string;
  original_sale_id: string | null;
  phone_id: string | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  inventory_restored: boolean;
  original_unit_price: number | null;
  is_custom_price: boolean;
  price_difference: number;
  created_at: string;
}

export interface RefundItemInsert {
  id?: string;
  refund_id: string;
  original_sale_id?: string | null;
  phone_id?: string | null;
  item_name: string;
  quantity?: number;
  unit_price: number;
  total: number;
  inventory_restored?: boolean;
  original_unit_price?: number | null;
  is_custom_price?: boolean;
  price_difference?: number;
  created_at?: string;
}

export interface RefundItemUpdate {
  item_name?: string;
  quantity?: number;
  unit_price?: number;
  total?: number;
  inventory_restored?: boolean;
}

/**
 * Result interfaces for RPC functions
 */
export interface ProcessRefundResult {
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
    phoneId: string | null;
    inventoryRestored: boolean;
  }>;
  error?: string;
}

export interface CheckReceiptRefundableResult {
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
    phoneId: string | null;
    itemName: string;
    quantity: number;
    unitPrice: number;
    total: number;
    phoneStatus: string | null;
    phoneModel: string | null;
    brandName: string | null;
    canRestoreInventory: boolean;
  }>;
}

export interface GetRefundByReceiptResult {
  found: boolean;
  receiptId: string;
  refund?: {
    id: string;
    refundNumber: string;
    originalReceiptId: string;
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
    createdAt: string;
    items: Array<{
      id: string;
      originalSaleId: string | null;
      phoneId: string | null;
      itemName: string;
      quantity: number;
      unitPrice: number;
      total: number;
      inventoryRestored: boolean;
      phoneModel: string | null;
      brandName: string | null;
    }>;
  };
}

/**
 * Partial Refund Result Interfaces
 * Feature: F-010 Partial Refund Processing with Custom Return Price
 */

export interface PartialRefundItemInput {
  receiptItemId: string;
  returnPrice: number;
}

export interface CheckPartialRefundableResult {
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
  existingPartialRefunds?: Array<{
    refundNumber: string;
    refundDate: string;
    refundAmount: number;
    itemCount: number;
  }>;
  alreadyRefundedItemCount?: number;
  items?: Array<{
    id: string;
    saleId: string | null;
    phoneId: string | null;
    itemName: string;
    quantity: number;
    unitPrice: number;
    total: number;
    phoneStatus: string | null;
    phoneModel: string | null;
    brandName: string | null;
    canRestoreInventory: boolean;
    alreadyRefunded: boolean;
    canRefund: boolean;
  }>;
}

export interface ProcessPartialRefundResult {
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
  items?: Array<{
    itemName: string;
    quantity: number;
    originalUnitPrice: number;
    returnPrice: number;
    total: number;
    phoneId: string | null;
    inventoryRestored: boolean;
    isCustomPrice: boolean;
    priceDifference: number;
  }>;
  error?: string;
}
