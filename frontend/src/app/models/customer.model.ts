/**
 * Customer Model
 * Customer contact information for enhanced service
 * Feature: F-019 Customer Contact Management
 */
export interface Customer {
  id: string;
  phone: string;
  name: string;
  email: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CustomerWithStats extends Customer {
  totalTransactions: number;
  totalSpent: number;
  lastPurchaseDate: string | null;
}

export interface CustomerListResponse {
  data: CustomerWithStats[];
  total: number;
}

export interface CustomerFilter {
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateCustomerRequest {
  phone: string;
  name: string;
  email?: string | null;
  notes?: string | null;
}

export interface UpdateCustomerRequest {
  phone?: string;
  name?: string;
  email?: string | null;
  notes?: string | null;
}

export interface CustomerSaleHistoryItem {
  id: string;
  phoneId: string;
  saleDate: string;
  salePrice: number;
  phoneName: string;
  brandName: string;
}

export interface CustomerProfile {
  customer: Customer;
  sales: CustomerSaleHistoryItem[];
  stats: {
    totalTransactions: number;
    totalSpent: number;
    lastPurchaseDate: string | null;
  };
}

export interface FindOrCreateCustomerRequest {
  phone: string;
  name?: string | null;
  email?: string | null;
  notes?: string | null;
}

export interface FindOrCreateCustomerResponse {
  found: boolean;
  customer: Customer | null;
  isNew: boolean;
}

export interface LinkSalesToCustomerResponse {
  linkedCount: number;
  customerId: string;
}

/**
 * Customer validation constraints
 */
export const CUSTOMER_VALIDATION = {
  PHONE_MAX: 30,
  NAME_MAX: 200,
  EMAIL_MAX: 255,
  NOTES_MAX: 2000
} as const;
