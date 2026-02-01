/**
 * Customer DTOs
 * Data Transfer Objects for Customer entity
 * Feature: F-019 Customer Contact Management
 */

export interface CreateCustomerDto {
  phone: string;
  name: string;
  email?: string | null;
  notes?: string | null;
}

export interface UpdateCustomerDto {
  phone?: string;
  name?: string;
  email?: string | null;
  notes?: string | null;
}

export interface CustomerResponseDto {
  id: string;
  phone: string;
  name: string;
  email: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CustomerWithStatsResponseDto extends CustomerResponseDto {
  totalTransactions: number;
  totalSpent: number;
  lastPurchaseDate: string | null;
}

export interface CustomerListResponseDto {
  data: CustomerWithStatsResponseDto[];
  total: number;
}

export interface CustomerFilterDto {
  search?: string;
  page?: number;
  limit?: number;
}

export interface CustomerPurchaseHistoryItemDto {
  id: string;
  phoneId: string;
  saleDate: string;
  salePrice: number;
  phoneName: string;
  brandName: string;
}

export interface CustomerPurchaseHistoryResponseDto {
  customer: CustomerResponseDto;
  sales: CustomerPurchaseHistoryItemDto[];
  stats: {
    totalTransactions: number;
    totalSpent: number;
    lastPurchaseDate: string | null;
  };
}

export interface FindOrCreateCustomerDto {
  phone: string;
  name?: string | null;
  email?: string | null;
  notes?: string | null;
}

export interface FindOrCreateCustomerResponseDto {
  found: boolean;
  customer: CustomerResponseDto | null;
  isNew: boolean;
}

export interface LookupCustomerByPhoneDto {
  phone: string;
}

export interface LinkSalesToCustomerResponseDto {
  linkedCount: number;
  customerId: string;
}
