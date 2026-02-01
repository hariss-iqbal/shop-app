import { PhoneStatus, PaymentMethod } from '../enums';
import { PaymentDetailDto, PaymentSummaryDto } from './payment.dto';

/**
 * Sale DTOs
 * Data Transfer Objects for Sale entity
 * Feature: F-018 Payment Method Integration
 */

export interface CreateSaleDto {
  phoneId: string;
  saleDate: string;
  salePrice: number;
  buyerName?: string | null;
  buyerPhone?: string | null;
  buyerEmail?: string | null;
  notes?: string | null;
  /** Payment details - Feature: F-018 */
  payments?: PaymentDetailDto[];
  /** Location ID for multi-location inventory deduction - Feature: F-024 */
  locationId?: string | null;
}

export interface UpdateSaleDto {
  saleDate?: string;
  salePrice?: number;
  buyerName?: string | null;
  buyerPhone?: string | null;
  buyerEmail?: string | null;
  notes?: string | null;
}

export interface SaleResponseDto {
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
  /** Payment details summary - Feature: F-018 */
  paymentSummary: PaymentSummaryDto[];
  /** Whether multiple payment methods were used - Feature: F-018 */
  isSplitPayment: boolean;
  /** Primary payment method - Feature: F-018 */
  primaryPaymentMethod: PaymentMethod | null;
  /** Location where the sale occurred - Feature: F-024 */
  locationId: string | null;
  locationName: string | null;
}

export interface SaleListResponseDto {
  data: SaleResponseDto[];
  total: number;
}

export interface SaleFilterDto {
  startDate?: string;
  endDate?: string;
  brandId?: string;
  /** Filter by location - Feature: F-024 */
  locationId?: string;
}

export interface SaleSummaryDto {
  totalSales: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  averageMargin: number;
}

export interface MarkAsSoldDto {
  phoneId: string;
  salePrice: number;
  saleDate: string;
  buyerName?: string | null;
  buyerPhone?: string | null;
  buyerEmail?: string | null;
  notes?: string | null;
  /** Payment details - Feature: F-018 */
  payments?: PaymentDetailDto[];
  /** Location ID for multi-location inventory deduction - Feature: F-024 */
  locationId?: string | null;
}

/**
 * Filter DTO for customer purchase history lookup
 */
export interface CustomerPurchaseHistoryFilterDto {
  buyerPhone: string;
}

/**
 * Batch sale item for completing multiple sales at once
 * Feature: F-008 Automatic Inventory Deduction
 */
export interface BatchSaleItemDto {
  phoneId: string;
  salePrice: number;
}

/**
 * Request DTO for completing a batch sale with automatic inventory deduction
 * Feature: F-008 Automatic Inventory Deduction
 * Feature: F-018 Payment Method Integration
 */
export interface CompleteBatchSaleDto {
  items: BatchSaleItemDto[];
  saleDate: string;
  buyerName?: string | null;
  buyerPhone?: string | null;
  buyerEmail?: string | null;
  notes?: string | null;
  /** Payment details for the entire transaction - Feature: F-018 */
  payments?: PaymentDetailDto[];
  /** Location ID for multi-location inventory deduction - Feature: F-024 */
  locationId?: string | null;
}

/**
 * Response DTO for sale completion with inventory deduction
 * Feature: F-008 Automatic Inventory Deduction
 */
export interface SaleWithInventoryDeductionResponseDto {
  success: boolean;
  sale?: SaleResponseDto;
  phoneId: string;
  previousStatus?: PhoneStatus;
  newStatus?: PhoneStatus;
  warning?: string | null;
  inventoryDeducted: boolean;
  error?: string;
}

/**
 * Response DTO for batch sale completion with inventory deduction
 * Feature: F-008 Automatic Inventory Deduction
 */
export interface BatchSaleWithInventoryDeductionResponseDto {
  success: boolean;
  totalItems: number;
  processedItems: number;
  sales?: SaleResponseDto[];
  warnings?: Array<{
    phoneId: string;
    warning: string;
  }>;
  inventoryDeducted: boolean;
  error?: string;
}

/**
 * Response DTO for checking inventory availability
 * Feature: F-008 Automatic Inventory Deduction
 */
export interface InventoryAvailabilityResponseDto {
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
 * Request DTO for checking inventory availability
 * Feature: F-008 Automatic Inventory Deduction
 */
export interface CheckInventoryAvailabilityDto {
  phoneIds: string[];
}
