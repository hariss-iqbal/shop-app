/**
 * Receipt Entity
 * Permanent storage of sales receipts
 * Database table: receipts
 * Owner Module: M-07 Sales (Receipt Storage and Retrieval - F-005)
 */
export interface Receipt {
  id: string;
  receipt_number: string;
  transaction_date: string;
  transaction_time: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  grand_total: number;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ReceiptInsert {
  id?: string;
  receipt_number: string;
  transaction_date: string;
  transaction_time: string;
  subtotal: number;
  tax_rate?: number;
  tax_amount?: number;
  grand_total: number;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string | null;
}

export interface ReceiptUpdate {
  receipt_number?: string;
  transaction_date?: string;
  transaction_time?: string;
  subtotal?: number;
  tax_rate?: number;
  tax_amount?: number;
  grand_total?: number;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  notes?: string | null;
  updated_at?: string | null;
}

export interface ReceiptWithItems extends Receipt {
  items?: ReceiptItem[];
  tax_breakdown?: ReceiptTaxBreakdown[];
}

/**
 * Receipt Item Entity
 * Line items for each receipt
 * Database table: receipt_items
 */
export interface ReceiptItem {
  id: string;
  receipt_id: string;
  sale_id: string | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
  /** Tax rate applied to this line item */
  tax_rate: number;
  /** Calculated tax amount for this line item */
  tax_amount: number;
  /** Base price before tax */
  base_price: number;
  /** Whether this item is tax exempt */
  is_tax_exempt: boolean;
}

export interface ReceiptItemInsert {
  id?: string;
  receipt_id: string;
  sale_id?: string | null;
  item_name: string;
  quantity?: number;
  unit_price: number;
  total: number;
  created_at?: string;
  tax_rate?: number;
  tax_amount?: number;
  base_price?: number;
  is_tax_exempt?: boolean;
}

export interface ReceiptItemUpdate {
  item_name?: string;
  quantity?: number;
  unit_price?: number;
  total?: number;
  tax_rate?: number;
  tax_amount?: number;
  base_price?: number;
  is_tax_exempt?: boolean;
}

/**
 * Receipt Tax Breakdown Entity
 * Tax breakdown by rate for each receipt - enables compliant tax reporting
 * Database table: receipt_tax_breakdown
 */
export interface ReceiptTaxBreakdown {
  id: string;
  receipt_id: string;
  tax_rate: number;
  taxable_amount: number;
  tax_amount: number;
  item_count: number;
  created_at: string;
}

export interface ReceiptTaxBreakdownInsert {
  id?: string;
  receipt_id: string;
  tax_rate: number;
  taxable_amount: number;
  tax_amount: number;
  item_count?: number;
  created_at?: string;
}

export interface ReceiptTaxBreakdownUpdate {
  taxable_amount?: number;
  tax_amount?: number;
  item_count?: number;
}
