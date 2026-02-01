/**
 * Location Inventory Models
 * Frontend models for location-based inventory management
 * Feature: F-024 Multi-Location Inventory Support
 */

export interface LocationInventory {
  id: string;
  phoneId: string;
  locationId: string;
  quantity: number;
  minStockLevel: number | null;
  maxStockLevel: number | null;
  createdAt: string;
  updatedAt: string | null;
  phone?: {
    id: string;
    model: string;
    status: string;
    sellingPrice: number;
    costPrice: number;
    condition: string;
    brandId: string;
    brandName: string;
  };
  location?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface AssignPhoneToLocationRequest {
  phoneId: string;
  locationId: string;
  quantity?: number;
}

export interface UpdateLocationInventoryRequest {
  quantity?: number;
  minStockLevel?: number | null;
  maxStockLevel?: number | null;
}

export interface LocationInventoryListResponse {
  data: LocationInventory[];
  total: number;
  stats?: LocationInventoryStats;
}

export interface LocationInventoryStats {
  totalProducts: number;
  totalUnits: number;
  totalValue: number;
  lowStockCount: number;
}

export interface LocationInventoryFilter {
  locationId?: string;
  phoneId?: string;
  lowStockOnly?: boolean;
}
