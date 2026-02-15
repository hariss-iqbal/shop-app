import { ProductCondition, ProductStatus, ProductType, PtaStatus } from '../enums';

/**
 * Product DTOs
 * Data Transfer Objects for Product entity
 */

export interface CreateProductDto {
  brandId: string;
  model: string;
  description?: string | null;
  storageGb?: number | null;
  ramGb?: number | null;
  color?: string | null;
  condition: ProductCondition;
  conditionRating?: number | null;
  ptaStatus?: PtaStatus | null;
  batteryHealth?: number | null;
  imei?: string | null;
  costPrice: number;
  sellingPrice: number;
  status?: ProductStatus;
  purchaseDate?: string | null;
  supplierId?: string | null;
  notes?: string | null;
  /** Tax rate percentage (0-100). E.g., 10 for 10% tax rate */
  taxRate?: number;
  /** When true, selling_price includes tax. When false, tax is added on top */
  isTaxInclusive?: boolean;
  /** When true, item is tax exempt (0% tax) and clearly marked on receipts */
  isTaxExempt?: boolean;
  productType?: ProductType;
  accessoryCategory?: string | null;
  compatibleModels?: string[] | null;
  material?: string | null;
  warrantyMonths?: number | null;
  weightGrams?: number | null;
  dimensions?: string | null;
}

export interface UpdateProductDto {
  brandId?: string;
  model?: string;
  description?: string | null;
  storageGb?: number | null;
  ramGb?: number | null;
  color?: string | null;
  condition?: ProductCondition;
  conditionRating?: number | null;
  ptaStatus?: PtaStatus | null;
  batteryHealth?: number | null;
  imei?: string | null;
  costPrice?: number;
  sellingPrice?: number;
  status?: ProductStatus;
  purchaseDate?: string | null;
  supplierId?: string | null;
  notes?: string | null;
  taxRate?: number;
  isTaxInclusive?: boolean;
  isTaxExempt?: boolean;
  productType?: ProductType;
  accessoryCategory?: string | null;
  compatibleModels?: string[] | null;
  material?: string | null;
  warrantyMonths?: number | null;
  weightGrams?: number | null;
  dimensions?: string | null;
}

export interface ProductResponseDto {
  id: string;
  brandId: string;
  brandName: string;
  brandLogoUrl: string | null;
  model: string;
  description: string | null;
  storageGb: number | null;
  ramGb: number | null;
  color: string | null;
  condition: ProductCondition;
  conditionRating: number | null;
  ptaStatus: PtaStatus | null;
  batteryHealth: number | null;
  imei: string | null;
  costPrice: number;
  sellingPrice: number;
  profitMargin: number;
  status: ProductStatus;
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
  productType?: ProductType;
  accessoryCategory?: string | null;
  compatibleModels?: string[] | null;
  material?: string | null;
  warrantyMonths?: number | null;
  weightGrams?: number | null;
  dimensions?: string | null;
}

export interface ProductListResponseDto {
  data: ProductResponseDto[];
  total: number;
}

export interface ProductFilterDto {
  brandId?: string;
  status?: ProductStatus;
  condition?: ProductCondition;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  productType?: ProductType;
}

export interface ProductSortDto {
  field: 'created_at' | 'selling_price' | 'model';
  direction: 'asc' | 'desc';
}

export interface ProductPaginationDto {
  page: number;
  limit: number;
}

export interface UpdateProductStatusDto {
  status: ProductStatus;
}

export interface BulkUpdateProductStatusDto {
  ids: string[];
  status: ProductStatus;
}

/**
 * Product location inventory DTO
 * Feature: F-024 Multi-Location Inventory Support
 */
export interface ProductLocationInventoryDto {
  locationId: string;
  locationName: string;
  locationCode: string;
  quantity: number;
  minStockLevel: number;
  maxStockLevel: number | null;
  lastRestocked: string | null;
}

/**
 * Product response with location inventory
 * Feature: F-024 Multi-Location Inventory Support
 */
export interface ProductWithInventoryResponseDto extends ProductResponseDto {
  locationInventory?: ProductLocationInventoryDto[];
  totalStock?: number;
}

/**
 * Product filter with location support
 * Feature: F-024 Multi-Location Inventory Support
 */
export interface ProductFilterWithLocationDto extends ProductFilterDto {
  locationId?: string;
}

/**
 * Product Specs Fetch DTOs
 * For fetching product specifications from GSMArena
 */
export interface FetchProductSpecsRequestDto {
  brand: string;
  model: string;
}

export interface ProductSpecSuggestion {
  ram: number[];           // RAM options in GB (e.g., [4, 6, 8])
  storage: number[];       // Storage options in GB (e.g., [64, 128, 256])
  colors: string[];        // Available color options
  modelName?: string;      // Canonical model name from GSMArena (brand prefix stripped)
}

export interface FetchProductSpecsResponseDto {
  success: boolean;
  data?: ProductSpecSuggestion;
  error?: string;
  source?: string;         // e.g., 'gsmarena'
  sourceUrl?: string;      // Source URL for reference
}
