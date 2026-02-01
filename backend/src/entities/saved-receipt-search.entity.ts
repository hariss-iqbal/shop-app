/**
 * Saved Receipt Search Entity
 * Stores frequently used search filter combinations
 * Database table: saved_receipt_searches
 * Feature: F-015 Multi-Criteria Receipt Search and Filtering
 */
export interface SavedReceiptSearch {
  id: string;
  name: string;
  filters: SavedReceiptSearchFilters;
  is_default: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface SavedReceiptSearchFilters {
  receiptNumber?: string;
  customerPhone?: string;
  customerName?: string;
  customerEmail?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SavedReceiptSearchInsert {
  id?: string;
  name: string;
  filters: SavedReceiptSearchFilters;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string | null;
}

export interface SavedReceiptSearchUpdate {
  name?: string;
  filters?: SavedReceiptSearchFilters;
  is_default?: boolean;
  updated_at?: string | null;
}
