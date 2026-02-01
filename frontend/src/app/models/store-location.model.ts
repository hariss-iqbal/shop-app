/**
 * Store Location Models
 * Frontend models for store location management
 * Feature: F-024 Multi-Location Inventory Support
 */

export interface StoreLocation {
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

export interface CreateStoreLocationRequest {
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

export interface UpdateStoreLocationRequest {
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

export interface StoreLocationListResponse {
  data: StoreLocation[];
  total: number;
}

export interface StoreLocationFilter {
  isActive?: boolean;
  search?: string;
}
