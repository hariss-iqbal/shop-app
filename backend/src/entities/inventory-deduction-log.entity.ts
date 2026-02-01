import { PhoneStatus } from '../enums';

/**
 * InventoryDeductionLog Entity
 * Audit trail for all inventory deduction operations
 * Database table: inventory_deduction_logs
 * Feature: F-008 Automatic Inventory Deduction
 */
export interface InventoryDeductionLog {
  id: string;
  sale_id: string | null;
  phone_id: string;
  previous_status: PhoneStatus;
  new_status: PhoneStatus;
  deducted_at: string;
  deducted_by: string | null;
  notes: string | null;
}

export interface InventoryDeductionLogInsert {
  id?: string;
  sale_id?: string | null;
  phone_id: string;
  previous_status: PhoneStatus;
  new_status: PhoneStatus;
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
  phone?: {
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
  phoneId: string;
  previousStatus?: PhoneStatus;
  newStatus?: PhoneStatus;
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
    phoneId: string;
    previousStatus: PhoneStatus;
    newStatus: PhoneStatus;
  }>;
  warnings?: Array<{
    phoneId: string;
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
  phones: Array<{
    phoneId: string;
    model: string;
    brandName: string;
    status: PhoneStatus;
    available: boolean;
    warning?: string;
    error?: string;
  }>;
  warnings: Array<{
    phoneId: string;
    message: string;
  }>;
}

/**
 * Result from revert_sale_restore_inventory RPC
 */
export interface RevertSaleResult {
  success: boolean;
  phoneId?: string;
  previousStatus?: PhoneStatus;
  newStatus?: PhoneStatus;
  inventoryRestored: boolean;
  error?: string;
}
