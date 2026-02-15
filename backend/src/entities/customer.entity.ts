/**
 * Customer Entity
 * Stores customer contact information for enhanced service
 * Database table: customers
 * Owner Module: M-07 Sales
 * Feature: F-019 Customer Contact Management
 */
export interface Customer {
  id: string;
  phone: string;
  name: string;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CustomerInsert {
  id?: string;
  phone: string;
  name: string;
  email?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string | null;
}

export interface CustomerUpdate {
  phone?: string;
  name?: string;
  email?: string | null;
  notes?: string | null;
  updated_at?: string | null;
}

export interface CustomerWithStats extends Customer {
  totalTransactions: number;
  totalSpent: number;
  lastPurchaseDate: string | null;
}

export interface CustomerPurchaseHistoryItem {
  id: string;
  productId: string;
  saleDate: string;
  salePrice: number;
  productName: string;
  brandName: string;
}

export interface CustomerPurchaseHistory {
  found: boolean;
  customer: Customer | null;
  sales: CustomerPurchaseHistoryItem[];
  stats: {
    totalTransactions: number;
    totalSpent: number;
    lastPurchaseDate: string | null;
  };
}

export interface FindOrCreateCustomerResult {
  found: boolean;
  customer: Customer | null;
  isNew: boolean;
}
