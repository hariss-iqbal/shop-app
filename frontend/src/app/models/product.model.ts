import { ProductCondition, ProductStatus, PtaStatus } from '../enums';
import { ProductType } from '../enums/product-type.enum';

/**
 * Product Model
 * Core entity representing a product in inventory
 */
export interface Product {
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
  /** Tax rate percentage (0-100). E.g., 10 for 10% tax rate */
  taxRate: number;
  /** When true, selling_price includes tax. When false, tax is added on top */
  isTaxInclusive: boolean;
  /** When true, item is tax exempt (0% tax) and clearly marked on receipts */
  isTaxExempt: boolean;
  conditionRating: number | null;
  ptaStatus: PtaStatus | null;
  productType: ProductType;
  /** Accessory-specific fields */
  accessoryCategory: string | null;
  compatibleModels: string[] | null;
  material: string | null;
  warrantyMonths: number | null;
  weightGrams: number | null;
  dimensions: string | null;
  isFeatured: boolean;
}

export interface CreateProductRequest {
  brandId: string;
  model: string;
  description?: string | null;
  storageGb?: number | null;
  ramGb?: number | null;
  color?: string | null;
  condition: ProductCondition;
  batteryHealth?: number | null;
  imei?: string | null;
  costPrice: number;
  sellingPrice: number;
  status?: ProductStatus;
  purchaseDate?: string | null;
  supplierId?: string | null;
  notes?: string | null;
  taxRate?: number;
  isTaxInclusive?: boolean;
  isTaxExempt?: boolean;
  conditionRating?: number | null;
  ptaStatus?: PtaStatus | null;
  productType?: ProductType;
  accessoryCategory?: string | null;
  compatibleModels?: string[] | null;
  material?: string | null;
  warrantyMonths?: number | null;
  weightGrams?: number | null;
  dimensions?: string | null;
  isFeatured?: boolean;
}

export interface UpdateProductRequest {
  brandId?: string;
  model?: string;
  description?: string | null;
  storageGb?: number | null;
  ramGb?: number | null;
  color?: string | null;
  condition?: ProductCondition;
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
  conditionRating?: number | null;
  ptaStatus?: PtaStatus | null;
  productType?: ProductType;
  accessoryCategory?: string | null;
  compatibleModels?: string[] | null;
  material?: string | null;
  warrantyMonths?: number | null;
  weightGrams?: number | null;
  dimensions?: string | null;
  isFeatured?: boolean;
}

export interface ProductListResponse {
  data: Product[];
  total: number;
}

export interface ProductFilter {
  brandId?: string;
  status?: ProductStatus;
  condition?: ProductCondition;
  conditions?: ProductCondition[];
  storageGb?: number;
  storageGbOptions?: number[];
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  ptaStatus?: PtaStatus;
  productType?: ProductType;
  model?: string;
}

export interface ProductSort {
  field: 'created_at' | 'selling_price' | 'model';
  direction: 'asc' | 'desc';
}

export interface ProductPagination {
  page: number;
  limit: number;
}

export interface ProductDetailImage {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface ProductDetail extends Product {
  images: ProductDetailImage[];
}

/**
 * Location inventory for a product
 * Feature: F-024 Multi-Location Inventory Support
 */
export interface ProductLocationInventory {
  locationId: string;
  locationName: string;
  locationCode: string;
  quantity: number;
  minStockLevel: number;
  maxStockLevel: number | null;
  lastRestocked: string | null;
}

/**
 * Product with location inventory data
 * Feature: F-024 Multi-Location Inventory Support
 */
export interface ProductWithInventory extends Product {
  locationInventory?: ProductLocationInventory[];
  totalStock?: number;
}
