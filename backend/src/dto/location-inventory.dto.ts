/**
 * Location Inventory DTOs
 * Data Transfer Objects for location inventory management
 * Feature: F-024 Multi-Location Inventory Support
 */

export interface AssignPhoneToLocationDto {
  phoneId: string;
  locationId: string;
  quantity?: number;
}

export interface UpdateLocationInventoryDto {
  quantity?: number;
  minStockLevel?: number | null;
  maxStockLevel?: number | null;
}

export interface LocationInventoryResponseDto {
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

export interface LocationInventoryListResponseDto {
  data: LocationInventoryResponseDto[];
  total: number;
  stats?: LocationInventoryStatsDto;
}

export interface LocationInventoryStatsDto {
  totalProducts: number;
  totalUnits: number;
  totalValue: number;
  lowStockCount: number;
}

export interface LocationInventoryFilterDto {
  locationId?: string;
  phoneId?: string;
  lowStockOnly?: boolean;
}
