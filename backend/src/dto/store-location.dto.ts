/**
 * Store Location DTOs
 * Data Transfer Objects for store location management
 * Feature: F-024 Multi-Location Inventory Support
 */

export interface CreateStoreLocationDto {
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive?: boolean;
  isPrimary?: boolean;
  managerUserId?: string | null;
  notes?: string | null;
}

export interface UpdateStoreLocationDto {
  name?: string;
  code?: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive?: boolean;
  isPrimary?: boolean;
  managerUserId?: string | null;
  notes?: string | null;
}

export interface StoreLocationResponseDto {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  isPrimary: boolean;
  managerUserId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface StoreLocationListResponseDto {
  data: StoreLocationResponseDto[];
  total: number;
}

export interface StoreLocationFilterDto {
  isActive?: boolean;
  search?: string;
}

export interface StoreLocationSortDto {
  field: 'name' | 'code' | 'created_at';
  direction: 'asc' | 'desc';
}

export interface StoreLocationPaginationDto {
  page: number;
  limit: number;
}
