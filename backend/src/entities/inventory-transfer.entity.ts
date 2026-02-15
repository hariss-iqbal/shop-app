import { InventoryTransferStatus } from '../enums';

/**
 * Inventory Transfer Entity
 * Represents a stock transfer between locations
 * Database table: inventory_transfers
 * Feature: F-024 Multi-Location Inventory Support
 */
export interface InventoryTransfer {
  id: string;
  transfer_number: string;
  source_location_id: string;
  destination_location_id: string;
  status: InventoryTransferStatus;
  initiated_by_user_id: string | null;
  completed_by_user_id: string | null;
  notes: string | null;
  initiated_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface InventoryTransferInsert {
  id?: string;
  transfer_number?: string;
  source_location_id: string;
  destination_location_id: string;
  status?: InventoryTransferStatus;
  initiated_by_user_id?: string | null;
  completed_by_user_id?: string | null;
  notes?: string | null;
  initiated_at?: string;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string | null;
}

export interface InventoryTransferUpdate {
  id?: string;
  status?: InventoryTransferStatus;
  completed_by_user_id?: string | null;
  notes?: string | null;
  completed_at?: string | null;
  updated_at?: string | null;
}

export interface InventoryTransferWithRelations extends InventoryTransfer {
  source_location?: {
    id: string;
    name: string;
    code: string;
  };
  destination_location?: {
    id: string;
    name: string;
    code: string;
  };
  items?: InventoryTransferItemWithProduct[];
}

export interface InventoryTransferItem {
  id: string;
  transfer_id: string;
  product_id: string;
  quantity: number;
  notes: string | null;
  created_at: string;
}

export interface InventoryTransferItemInsert {
  id?: string;
  transfer_id: string;
  product_id: string;
  quantity: number;
  notes?: string | null;
  created_at?: string;
}

export interface InventoryTransferItemWithProduct extends InventoryTransferItem {
  product?: {
    id: string;
    model: string;
    condition: string;
    brand?: {
      id: string;
      name: string;
    };
  };
}
