import { ProductStatus } from '../enums';

/**
 * InventoryDeductionLog Entity
 * Audit trail for all inventory deduction operations
 * Database table: inventory_deduction_logs
 * Feature: F-008 Automatic Inventory Deduction
 */
export interface InventoryDeductionLog {
  id: string;
  sale_id: string | null;
  product_id: string;
  previous_status: ProductStatus;
  new_status: ProductStatus;
  deducted_at: string;
  deducted_by: string | null;
  notes: string | null;
}

export interface InventoryDeductionLogInsert {
  id?: string;
  sale_id?: string | null;
  product_id: string;
  previous_status: ProductStatus;
  new_status: ProductStatus;
  deducted_at?: string;
  deducted_by?: string | null;
  notes?: string | null;
}

export interface InventoryDeductionLogWithRelations extends InventoryDeductionLog {
  sale?: {
    id: string;
    sale_date: string;
    sale_price: number;
  } | null;
  product?: {
    id: string;
    model: string;
    brand: {
      id: string;
      name: string;
    };
  };
}

/**
 * Result from complete_sale_with_inventory_deduction RPC
 */
export interface SaleWithInventoryDeductionResult {
  success: boolean;
  saleId?: string;
  productId: string;
  previousStatus?: ProductStatus;
  newStatus?: ProductStatus;
  warning?: string | null;
  inventoryDeducted: boolean;
  error?: string;
}

/**
 * Result from complete_batch_sale_with_inventory_deduction RPC
 */
export interface BatchSaleWithInventoryDeductionResult {
  success: boolean;
  totalItems: number;
  processedItems: number;
  sales?: Array<{
    saleId: string;
    productId: string;
    previousStatus: ProductStatus;
    newStatus: ProductStatus;
  }>;
  warnings?: Array<{
    productId: string;
    warning: string;
  }>;
  inventoryDeducted: boolean;
  error?: string;
}

/**
 * Result from check_inventory_availability RPC
 */
export interface InventoryAvailabilityResult {
  allAvailable: boolean;
  hasWarnings: boolean;
  allowOversell: boolean;
  products: Array<{
    productId: string;
    model: string;
    brandName: string;
    status: ProductStatus;
    available: boolean;
    warning?: string;
    error?: string;
  }>;
  warnings: Array<{
    productId: string;
    message: string;
  }>;
}

/**
 * Result from revert_sale_restore_inventory RPC
 */
export interface RevertSaleResult {
  success: boolean;
  productId?: string;
  previousStatus?: ProductStatus;
  newStatus?: ProductStatus;
  inventoryRestored: boolean;
  error?: string;
}
