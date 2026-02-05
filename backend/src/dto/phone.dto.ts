import { PhoneCondition, PhoneStatus, PtaStatus } from '../enums';

/**
 * Phone DTOs
 * Data Transfer Objects for Phone entity
 */

export interface CreatePhoneDto {
  brandId: string;
  model: string;
  description?: string | null;
  storageGb?: number | null;
  ramGb?: number | null;
  color?: string | null;
  condition: PhoneCondition;
  conditionRating?: number | null;
  ptaStatus?: PtaStatus | null;
  batteryHealth?: number | null;
  imei?: string | null;
  costPrice: number;
  sellingPrice: number;
  status?: PhoneStatus;
  purchaseDate?: string | null;
  supplierId?: string | null;
  notes?: string | null;
  /** Tax rate percentage (0-100). E.g., 10 for 10% tax rate */
  taxRate?: number;
  /** When true, selling_price includes tax. When false, tax is added on top */
  isTaxInclusive?: boolean;
  /** When true, item is tax exempt (0% tax) and clearly marked on receipts */
  isTaxExempt?: boolean;
}

export interface UpdatePhoneDto {
  brandId?: string;
  model?: string;
  description?: string | null;
  storageGb?: number | null;
  ramGb?: number | null;
  color?: string | null;
  condition?: PhoneCondition;
  conditionRating?: number | null;
  ptaStatus?: PtaStatus | null;
  batteryHealth?: number | null;
  imei?: string | null;
  costPrice?: number;
  sellingPrice?: number;
  status?: PhoneStatus;
  purchaseDate?: string | null;
  supplierId?: string | null;
  notes?: string | null;
  taxRate?: number;
  isTaxInclusive?: boolean;
  isTaxExempt?: boolean;
}

export interface PhoneResponseDto {
  id: string;
  brandId: string;
  brandName: string;
  brandLogoUrl: string | null;
  model: string;
  description: string | null;
  storageGb: number | null;
  ramGb: number | null;
  color: string | null;
  condition: PhoneCondition;
  conditionRating: number | null;
  ptaStatus: PtaStatus | null;
  batteryHealth: number | null;
  imei: string | null;
  costPrice: number;
  sellingPrice: number;
  profitMargin: number;
  status: PhoneStatus;
  purchaseDate: string | null;
  supplierId: string | null;
  supplierName: string | null;
  notes: string | null;
  primaryImageUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
  /** Tax rate percentage (0-100) */
  taxRate: number;
  /** When true, selling_price includes tax */
  isTaxInclusive: boolean;
  /** When true, item is tax exempt (0% tax) */
  isTaxExempt: boolean;
}

export interface PhoneListResponseDto {
  data: PhoneResponseDto[];
  total: number;
}

export interface PhoneFilterDto {
  brandId?: string;
  status?: PhoneStatus;
  condition?: PhoneCondition;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export interface PhoneSortDto {
  field: 'created_at' | 'selling_price' | 'model';
  direction: 'asc' | 'desc';
}

export interface PhonePaginationDto {
  page: number;
  limit: number;
}

export interface UpdatePhoneStatusDto {
  status: PhoneStatus;
}

export interface BulkUpdatePhoneStatusDto {
  ids: string[];
  status: PhoneStatus;
}

/**
 * Phone location inventory DTO
 * Feature: F-024 Multi-Location Inventory Support
 */
export interface PhoneLocationInventoryDto {
  locationId: string;
  locationName: string;
  locationCode: string;
  quantity: number;
  minStockLevel: number;
  maxStockLevel: number | null;
  lastRestocked: string | null;
}

/**
 * Phone response with location inventory
 * Feature: F-024 Multi-Location Inventory Support
 */
export interface PhoneWithInventoryResponseDto extends PhoneResponseDto {
  locationInventory?: PhoneLocationInventoryDto[];
  totalStock?: number;
}

/**
 * Phone filter with location support
 * Feature: F-024 Multi-Location Inventory Support
 */
export interface PhoneFilterWithLocationDto extends PhoneFilterDto {
  locationId?: string;
}

/**
 * Phone Specs Fetch DTOs
 * For fetching phone specifications from GSMArena
 */
export interface FetchPhoneSpecsRequestDto {
  brand: string;
  model: string;
}

export interface PhoneSpecSuggestion {
  ram: number[];           // RAM options in GB (e.g., [4, 6, 8])
  storage: number[];       // Storage options in GB (e.g., [64, 128, 256])
  colors: string[];        // Available color options
}

export interface FetchPhoneSpecsResponseDto {
  success: boolean;
  data?: PhoneSpecSuggestion;
  error?: string;
  source?: string;         // e.g., 'gsmarena'
  phoneUrl?: string;       // Source URL for reference
}
