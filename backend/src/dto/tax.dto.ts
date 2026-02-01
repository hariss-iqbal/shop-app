/**
 * Tax DTOs
 * Data Transfer Objects for Tax Calculation and Compliance
 * Feature: F-012 Tax Calculation and Compliance
 */

/**
 * Tax calculation result for a single item
 */
export interface TaxCalculationResultDto {
  basePrice: number;
  taxAmount: number;
  totalPrice: number;
  taxRate: number;
  isTaxExempt: boolean;
}

/**
 * Tax calculation result for a single item with quantity details
 */
export interface ItemTaxCalculationDto extends TaxCalculationResultDto {
  unitBasePrice: number;
  unitTaxAmount: number;
  quantity: number;
}

/**
 * Tax breakdown entry for a specific tax rate
 */
export interface TaxBreakdownEntryDto {
  taxRate: number;
  taxableAmount: number;
  taxAmount: number;
  itemCount: number;
}

/**
 * Complete tax summary for a cart or transaction
 */
export interface CartTaxSummaryDto {
  items: ItemTaxCalculationDto[];
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  taxBreakdown: TaxBreakdownEntryDto[];
}

/**
 * Request to calculate tax for a single phone item
 */
export interface CalculatePhoneTaxRequestDto {
  phoneId: string;
  overridePrice?: number;
  quantity?: number;
}

/**
 * Response for phone tax calculation
 */
export interface CalculatePhoneTaxResponseDto {
  phoneId: string;
  phoneName: string;
  brandName: string;
  unitPrice: number;
  unitBasePrice: number;
  unitTaxAmount: number;
  totalBasePrice: number;
  totalTaxAmount: number;
  totalPrice: number;
  taxRate: number;
  isTaxInclusive: boolean;
  isTaxExempt: boolean;
  quantity: number;
}

/**
 * Request to calculate tax for multiple items (cart)
 */
export interface CalculateCartTaxRequestDto {
  items: Array<{
    phoneId: string;
    overridePrice?: number;
    quantity?: number;
  }>;
}

/**
 * Cart item with tax calculation details
 */
export interface CartItemWithTaxDto {
  phoneId: string;
  phoneName: string;
  brandName: string;
  unitPrice: number;
  unitBasePrice: number;
  unitTaxAmount: number;
  totalBasePrice: number;
  totalTaxAmount: number;
  totalPrice: number;
  taxRate: number;
  isTaxInclusive: boolean;
  isTaxExempt: boolean;
  quantity: number;
}

/**
 * Response for cart tax calculation
 */
export interface CalculateCartTaxResponseDto {
  items: CartItemWithTaxDto[];
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  taxBreakdown: TaxBreakdownEntryDto[];
}

/**
 * Tax configuration for a phone product
 */
export interface PhoneTaxConfigDto {
  taxRate: number;
  isTaxInclusive: boolean;
  isTaxExempt: boolean;
}

/**
 * Request to update phone tax configuration
 */
export interface UpdatePhoneTaxConfigDto {
  taxRate?: number;
  isTaxInclusive?: boolean;
  isTaxExempt?: boolean;
}

/**
 * Tax-inclusive price extraction result
 * Used when product price includes tax and we need to show base + tax separately
 */
export interface TaxInclusiveBreakdownDto {
  inclusivePrice: number;
  basePrice: number;
  taxAmount: number;
  taxRate: number;
}

/**
 * Tax-exclusive price calculation result
 * Used when product price excludes tax and we need to calculate total with tax
 */
export interface TaxExclusiveCalculationDto {
  exclusivePrice: number;
  taxAmount: number;
  totalWithTax: number;
  taxRate: number;
}
