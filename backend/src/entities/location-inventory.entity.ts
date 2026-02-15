/**
 * Location Inventory Entity
 * Tracks product inventory quantities per location
 * Database table: location_inventory
 * Feature: F-024 Multi-Location Inventory Support
 */
export interface LocationInventory {
  id: string;
  product_id: string;
  location_id: string;
  quantity: number;
  min_stock_level: number | null;
  max_stock_level: number | null;
  created_at: string;
  updated_at: string | null;
}

export interface LocationInventoryInsert {
  id?: string;
  product_id: string;
  location_id: string;
  quantity?: number;
  min_stock_level?: number | null;
  max_stock_level?: number | null;
  created_at?: string;
  updated_at?: string | null;
}

export interface LocationInventoryUpdate {
  id?: string;
  product_id?: string;
  location_id?: string;
  quantity?: number;
  min_stock_level?: number | null;
  max_stock_level?: number | null;
  updated_at?: string | null;
}

export interface LocationInventoryWithRelations extends LocationInventory {
  product?: {
    id: string;
    model: string;
    status: string;
    selling_price: number;
    cost_price: number;
    condition: string;
    brand?: {
      id: string;
      name: string;
    };
  };
  location?: {
    id: string;
    name: string;
    code: string;
  };
}
