import { PhoneCondition, PhoneStatus, PtaStatus } from '../enums';

/**
 * Phone Model
 * Core entity representing a phone in inventory
 */
export interface Phone {
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
  /** Tax rate percentage (0-100). E.g., 10 for 10% tax rate */
  taxRate: number;
  /** When true, selling_price includes tax. When false, tax is added on top */
  isTaxInclusive: boolean;
  /** When true, item is tax exempt (0% tax) and clearly marked on receipts */
  isTaxExempt: boolean;
  conditionRating: number | null;
  ptaStatus: PtaStatus | null;
}

export interface CreatePhoneRequest {
  brandId: string;
  model: string;
  description?: string | null;
  storageGb?: number | null;
  ramGb?: number | null;
  color?: string | null;
  condition: PhoneCondition;
  batteryHealth?: number | null;
  imei?: string | null;
  costPrice: number;
  sellingPrice: number;
  status?: PhoneStatus;
  purchaseDate?: string | null;
  supplierId?: string | null;
  notes?: string | null;
  taxRate?: number;
  isTaxInclusive?: boolean;
  isTaxExempt?: boolean;
  conditionRating?: number | null;
  ptaStatus?: PtaStatus | null;
}

export interface UpdatePhoneRequest {
  brandId?: string;
  model?: string;
  description?: string | null;
  storageGb?: number | null;
  ramGb?: number | null;
  color?: string | null;
  condition?: PhoneCondition;
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
  conditionRating?: number | null;
  ptaStatus?: PtaStatus | null;
}

export interface PhoneListResponse {
  data: Phone[];
  total: number;
}

export interface PhoneFilter {
  brandId?: string;
  status?: PhoneStatus;
  condition?: PhoneCondition;
  conditions?: PhoneCondition[];
  storageGb?: number;
  storageGbOptions?: number[];
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  ptaStatus?: PtaStatus;
}

export interface PhoneSort {
  field: 'created_at' | 'selling_price' | 'model';
  direction: 'asc' | 'desc';
}

export interface PhonePagination {
  page: number;
  limit: number;
}

export interface PhoneDetailImage {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface PhoneDetail extends Phone {
  images: PhoneDetailImage[];
}

/**
 * Location inventory for a phone
 * Feature: F-024 Multi-Location Inventory Support
 */
export interface PhoneLocationInventory {
  locationId: string;
  locationName: string;
  locationCode: string;
  quantity: number;
  minStockLevel: number;
  maxStockLevel: number | null;
  lastRestocked: string | null;
}

/**
 * Phone with location inventory data
 * Feature: F-024 Multi-Location Inventory Support
 */
export interface PhoneWithInventory extends Phone {
  locationInventory?: PhoneLocationInventory[];
  totalStock?: number;
}
