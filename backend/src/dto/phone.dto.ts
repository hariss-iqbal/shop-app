import { PhoneCondition, PhoneStatus } from '../enums';

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
  batteryHealth?: number | null;
  imei?: string | null;
  costPrice: number;
  sellingPrice: number;
  status?: PhoneStatus;
  purchaseDate?: string | null;
  supplierId?: string | null;
  notes?: string | null;
}

export interface UpdatePhoneDto {
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
