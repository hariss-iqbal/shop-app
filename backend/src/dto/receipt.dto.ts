/**
 * Receipt DTOs
 * Data Transfer Objects for Receipt entity
 * Feature: F-005 Receipt Storage and Retrieval
 */

export interface ReceiptItemDto {
  id?: string;
  saleId?: string | null;
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  /** Tax rate applied to this line item */
  taxRate?: number;
  /** Calculated tax amount for this line item */
  taxAmount?: number;
  /** Base price before tax */
  basePrice?: number;
  /** Whether this item is tax exempt */
  isTaxExempt?: boolean;
}

export interface CreateReceiptDto {
  receiptNumber: string;
  transactionDate: string;
  transactionTime: string;
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  grandTotal: number;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  notes?: string | null;
  items: ReceiptItemDto[];
}

export interface UpdateReceiptDto {
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  notes?: string | null;
}

export interface ReceiptResponseDto {
  id: string;
  receiptNumber: string;
  transactionDate: string;
  transactionTime: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  notes: string | null;
  items: ReceiptItemResponseDto[];
  createdAt: string;
  updatedAt: string | null;
}

export interface ReceiptItemResponseDto {
  id: string;
  saleId: string | null;
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  /** Tax rate applied to this line item */
  taxRate: number;
  /** Calculated tax amount for this line item */
  taxAmount: number;
  /** Base price before tax */
  basePrice: number;
  /** Whether this item is tax exempt */
  isTaxExempt: boolean;
}

export interface ReceiptListResponseDto {
  data: ReceiptResponseDto[];
  total: number;
}

export interface ReceiptFilterDto {
  receiptNumber?: string;
  customerPhone?: string;
  customerName?: string;
  customerEmail?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
  sortField?: 'transactionDate' | 'grandTotal' | 'receiptNumber' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface SavedReceiptSearchDto {
  id?: string;
  name: string;
  filters: ReceiptFilterDto;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSavedSearchDto {
  name: string;
  filters: ReceiptFilterDto;
  isDefault?: boolean;
}

export interface UpdateSavedSearchDto {
  name?: string;
  filters?: ReceiptFilterDto;
  isDefault?: boolean;
}

export interface SavedSearchListResponseDto {
  data: SavedReceiptSearchDto[];
  total: number;
}

export interface ReceiptExportDto {
  format: 'csv' | 'json';
  filters?: ReceiptFilterDto;
  includeItems?: boolean;
}

export interface ReceiptSummaryDto {
  totalReceipts: number;
  totalRevenue: number;
  averageTransactionValue: number;
}

/**
 * Tax breakdown entry for a specific tax rate on a receipt
 */
export interface ReceiptTaxBreakdownDto {
  id?: string;
  taxRate: number;
  taxableAmount: number;
  taxAmount: number;
  itemCount: number;
}

/**
 * Receipt response with tax breakdown
 */
export interface ReceiptWithTaxBreakdownResponseDto extends ReceiptResponseDto {
  taxBreakdown: ReceiptTaxBreakdownDto[];
}
