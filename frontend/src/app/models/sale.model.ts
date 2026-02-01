import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentSummary, PaymentDetail } from './payment.model';

/**
 * Sale Model
 * Records a completed phone sale
 * Feature: F-018 Payment Method Integration
 */
export interface Sale {
  id: string;
  phoneId: string;
  brandName: string;
  phoneName: string;
  saleDate: string;
  salePrice: number;
  costPrice: number;
  profit: number;
  buyerName: string | null;
  buyerPhone: string | null;
  buyerEmail: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
  /** Tax rate applied to this sale */
  taxRate: number;
  /** Calculated tax amount for this sale */
  taxAmount: number;
  /** Base price before tax */
  basePrice: number | null;
  /** Whether this sale was for a tax-exempt item */
  isTaxExempt: boolean;
  /** Payment summary - Feature: F-018 */
  paymentSummary: PaymentSummary[];
  /** Whether multiple payment methods were used - Feature: F-018 */
  isSplitPayment: boolean;
  /** Primary payment method - Feature: F-018 */
  primaryPaymentMethod: PaymentMethod | null;
  /** Location where the sale occurred - Feature: F-024 */
  locationId: string | null;
  locationName: string | null;
}

export interface CreateSaleRequest {
  phoneId: string;
  saleDate: string;
  salePrice: number;
  buyerName?: string | null;
  buyerPhone?: string | null;
  buyerEmail?: string | null;
  notes?: string | null;
  /** Payment details - Feature: F-018 */
  payments?: PaymentDetail[];
  /** Location ID for multi-location inventory deduction - Feature: F-024 */
  locationId?: string | null;
}

export interface UpdateSaleRequest {
  saleDate?: string;
  salePrice?: number;
  buyerName?: string | null;
  buyerPhone?: string | null;
  buyerEmail?: string | null;
  notes?: string | null;
}

export interface SaleListResponse {
  data: Sale[];
  total: number;
}

export interface SaleFilter {
  startDate?: string;
  endDate?: string;
  brandId?: string;
  /** Filter by location - Feature: F-024 */
  locationId?: string;
}

export interface SaleSummary {
  totalSales: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  averageMargin: number;
}

export interface MarkAsSoldRequest {
  phoneId: string;
  salePrice: number;
  saleDate: string;
  buyerName?: string | null;
  buyerPhone?: string | null;
  buyerEmail?: string | null;
  notes?: string | null;
  /** Payment details - Feature: F-018 */
  payments?: PaymentDetail[];
  /** Location ID for multi-location inventory deduction - Feature: F-024 */
  locationId?: string | null;
  /** Customer ID for linking sale to customer profile - Feature: F-019 */
  customerId?: string | null;
}

/**
 * Cart Item - represents a phone item in the sales cart
 */
export interface CartItem {
  phoneId: string;
  brandName: string;
  model: string;
  storageGb: number | null;
  color: string | null;
  condition: string;
  imei: string | null;
  costPrice: number;
  sellingPrice: number;
  salePrice: number;
  taxRate: number;
  primaryImageUrl: string | null;
  /** When true, salePrice includes tax */
  isTaxInclusive: boolean;
  /** When true, item is tax exempt (0% tax) */
  isTaxExempt: boolean;
  /** Base price before tax (calculated) */
  basePrice: number;
  /** Tax amount (calculated) */
  taxAmount: number;
}

/**
 * Cart Summary - calculated totals for the cart
 * Feature: F-023 Discount and Coupon Management
 */
export interface CartSummary {
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  totalProfit: number;
  totalCost: number;
  itemCount: number;
  /** Discount amount applied - Feature: F-023 */
  discountAmount: number;
  /** Grand total after discount - Feature: F-023 */
  finalTotal: number;
}

/**
 * Customer Information for the sale
 */
export interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
}

/**
 * Applied Discount Information - for tracking discount applied to sale
 * Feature: F-023 Discount and Coupon Management
 */
export interface AppliedDiscountInfo {
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  discountAmount: number;
  couponId?: string | null;
  couponCode?: string | null;
  requiresManagerApproval: boolean;
  managerApprovedBy?: string | null;
  managerApprovalReason?: string | null;
}

/**
 * Complete Sale Transaction Request - for batch sale creation
 * Feature: F-018 Payment Method Integration
 * Feature: F-023 Discount and Coupon Management
 */
export interface CompleteSaleTransactionRequest {
  items: Array<{
    phoneId: string;
    salePrice: number;
  }>;
  customerInfo: CustomerInfo;
  saleDate: string;
  notes: string | null;
  /** Payment details - Feature: F-018 */
  payments?: PaymentDetail[];
  /** Discount information - Feature: F-023 */
  discount?: AppliedDiscountInfo | null;
  /** Location ID for multi-location inventory deduction - Feature: F-024 */
  locationId?: string | null;
}

/**
 * Receipt Item - represents a single line item on the receipt
 */
export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  /** Tax rate applied to this item */
  taxRate: number;
  /** Calculated tax amount for this item */
  taxAmount: number;
  /** Base price before tax */
  basePrice: number;
  /** Whether this item is tax exempt */
  isTaxExempt: boolean;
}

/**
 * Receipt Data - all data needed to generate a thermal receipt
 * Feature: F-018 Payment Method Integration
 * Feature: F-022 Loyalty Points Integration
 * Feature: F-023 Discount and Coupon Management
 */
export interface ReceiptData {
  receiptNumber: string;
  transactionDate: string;
  transactionTime: string;
  items: ReceiptItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  notes: string | null;
  /** Tax breakdown by rate for compliant receipts */
  taxBreakdown?: TaxBreakdownEntry[];
  /** Payment details - Feature: F-018 */
  payments?: PaymentSummary[];
  /** Discount information - Feature: F-023 */
  discount?: {
    discountType: 'percentage' | 'fixed_amount';
    discountValue: number;
    discountAmount: number;
    couponCode?: string | null;
  } | null;
  /** Original price before discount - Feature: F-023 */
  originalTotal?: number;
  /** Final total after discount - Feature: F-023 */
  finalTotal?: number;
  /** Loyalty points information - Feature: F-022 */
  loyalty?: {
    /** Points earned from this purchase */
    pointsEarned: number;
    /** Points redeemed as discount */
    pointsRedeemed: number;
    /** Discount value from redeemed points */
    redemptionDiscount: number;
    /** Customer's balance after this transaction */
    balanceAfter: number;
    /** Customer's loyalty tier */
    tier: string;
    /** Tier multiplier applied */
    tierMultiplier: number;
  } | null;
}

/**
 * Tax Breakdown Entry - tax amounts grouped by rate
 * Feature: F-012 Tax Calculation and Compliance
 */
export interface TaxBreakdownEntry {
  taxRate: number;
  taxableAmount: number;
  taxAmount: number;
  itemCount: number;
}

/**
 * Store Configuration for receipt header
 */
export interface StoreConfig {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId?: string;
}

/**
 * WhatsApp Receipt Message - formatted receipt for WhatsApp sharing
 */
export interface WhatsAppReceiptMessage {
  message: string;
  receiptNumber: string;
  customerPhone: string | null;
  grandTotal: number;
  itemCount: number;
}

/**
 * WhatsApp Send Result - response from WhatsApp send attempt
 * Feature: F-004 WhatsApp Receipt Integration
 */
export interface WhatsAppSendResult {
  success: boolean;
  error?: string;
  sentAt?: Date;
  phoneNumber?: string;
  /** The wa.me link for manual fallback if popup is blocked */
  whatsappLink?: string;
}

/**
 * Stored Receipt - persisted receipt from database
 * Feature: F-005 Receipt Storage and Retrieval
 * Feature: F-018 Payment Method Integration
 */
export interface StoredReceipt {
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
  items: StoredReceiptItem[];
  createdAt: string;
  updatedAt: string | null;
  /** Tax breakdown by rate */
  taxBreakdown?: StoredReceiptTaxBreakdown[];
  /** Payment details - Feature: F-018 */
  paymentSummary?: PaymentSummary[];
}

/**
 * Stored Receipt Item - line item from persisted receipt
 */
export interface StoredReceiptItem {
  id: string;
  saleId: string | null;
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  /** Tax rate applied to this item */
  taxRate: number;
  /** Calculated tax amount */
  taxAmount: number;
  /** Base price before tax */
  basePrice: number;
  /** Whether item is tax exempt */
  isTaxExempt: boolean;
}

/**
 * Stored Receipt Tax Breakdown - persisted tax breakdown by rate
 * Feature: F-012 Tax Calculation and Compliance
 */
export interface StoredReceiptTaxBreakdown {
  id: string;
  receiptId: string;
  taxRate: number;
  taxableAmount: number;
  taxAmount: number;
  itemCount: number;
}

/**
 * Create Receipt Request - payload for creating a stored receipt
 */
export interface CreateReceiptRequest {
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
  items: CreateReceiptItemRequest[];
}

/**
 * Create Receipt Item Request - payload for receipt line item
 */
export interface CreateReceiptItemRequest {
  saleId?: string | null;
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxRate?: number;
  taxAmount?: number;
  basePrice?: number;
  isTaxExempt?: boolean;
}

/**
 * Receipt List Response - paginated list of stored receipts
 */
export interface ReceiptListResponse {
  data: StoredReceipt[];
  total: number;
}

/**
 * Receipt Filter - filter options for receipt search
 * Feature: F-015 Multi-Criteria Receipt Search and Filtering
 */
export interface ReceiptFilter {
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

/**
 * Saved Receipt Search - stores frequently used search filter combinations
 * Feature: F-015 Multi-Criteria Receipt Search and Filtering
 */
export interface SavedReceiptSearch {
  id: string;
  name: string;
  filters: ReceiptFilter;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateSavedSearchRequest {
  name: string;
  filters: ReceiptFilter;
  isDefault?: boolean;
}

export interface UpdateSavedSearchRequest {
  name?: string;
  filters?: ReceiptFilter;
  isDefault?: boolean;
}

export interface SavedSearchListResponse {
  data: SavedReceiptSearch[];
  total: number;
}

/**
 * Receipt Export Options
 * Feature: F-015 Multi-Criteria Receipt Search and Filtering
 */
export interface ReceiptExportOptions {
  format: 'csv' | 'json';
  filters?: ReceiptFilter;
  includeItems?: boolean;
}

export interface ReceiptExportResponse {
  data: string;
  contentType: string;
  filename: string;
}

/**
 * Customer Purchase History - represents a customer's transaction summary
 * Feature: F-006 Customer Purchase History Lookup
 */
export interface CustomerPurchaseHistory {
  customerPhone: string;
  customerName: string | null;
  customerEmail: string | null;
  totalTransactions: number;
  totalSpent: number;
  transactions: Sale[];
}

/**
 * Customer History Search Request
 */
export interface CustomerHistorySearchRequest {
  buyerPhone: string;
}

/**
 * Receipt Send Log - tracks receipt send/resend operations
 * Feature: F-007 Receipt Resend Capability
 */
export type SendChannel = 'whatsapp' | 'email' | 'sms';
export type SendStatus = 'sent' | 'failed' | 'pending';

export interface ReceiptSendLog {
  id: string;
  receiptId: string;
  channel: SendChannel;
  recipientPhone: string | null;
  recipientEmail: string | null;
  status: SendStatus;
  errorMessage: string | null;
  sentAt: string;
  createdAt: string;
  receipt?: {
    receiptNumber: string;
    grandTotal: number;
    customerName: string | null;
  };
}

export interface CreateReceiptSendLogRequest {
  receiptId: string;
  channel: SendChannel;
  recipientPhone?: string | null;
  recipientEmail?: string | null;
  status?: SendStatus;
  errorMessage?: string | null;
}

export interface ReceiptSendLogListResponse {
  data: ReceiptSendLog[];
  total: number;
}

export interface ResendReceiptRequest {
  receiptId: string;
  channel: SendChannel;
  recipientPhone?: string;
  recipientEmail?: string;
}

export interface ResendReceiptResponse {
  success: boolean;
  message: string;
  sendLog?: ReceiptSendLog;
  error?: string;
}

/**
 * Phone Status - inventory status
 * Feature: F-008 Automatic Inventory Deduction
 */
export type PhoneStatus = 'available' | 'sold' | 'reserved';

/**
 * Inventory Availability Check Result
 * Feature: F-008 Automatic Inventory Deduction
 */
export interface InventoryAvailabilityResult {
  allAvailable: boolean;
  hasWarnings: boolean;
  allowOversell: boolean;
  phones: Array<{
    phoneId: string;
    model: string;
    brandName: string;
    status: PhoneStatus;
    available: boolean;
    warning?: string;
    error?: string;
  }>;
  warnings: Array<{
    phoneId: string;
    message: string;
  }>;
}

/**
 * Sale with Inventory Deduction Response
 * Feature: F-008 Automatic Inventory Deduction
 */
export interface SaleWithInventoryDeductionResponse {
  success: boolean;
  sale?: Sale;
  phoneId: string;
  previousStatus?: PhoneStatus;
  newStatus?: PhoneStatus;
  warning?: string | null;
  inventoryDeducted: boolean;
  error?: string;
}

/**
 * Batch Sale with Inventory Deduction Response
 * Feature: F-008 Automatic Inventory Deduction
 */
export interface BatchSaleWithInventoryDeductionResponse {
  success: boolean;
  totalItems: number;
  processedItems: number;
  sales?: Sale[];
  warnings?: Array<{
    phoneId: string;
    warning: string;
  }>;
  inventoryDeducted: boolean;
  error?: string;
}

/**
 * Inventory Deduction Log - audit trail entry
 * Feature: F-008 Automatic Inventory Deduction
 */
export interface InventoryDeductionLog {
  id: string;
  saleId: string | null;
  phoneId: string;
  previousStatus: PhoneStatus;
  newStatus: PhoneStatus;
  deductedAt: string;
  deductedBy: string | null;
  notes: string | null;
}
