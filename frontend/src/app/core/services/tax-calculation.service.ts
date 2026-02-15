import { Injectable } from '@angular/core';
import { TaxBreakdownEntry, CartItem, CartSummary, ReceiptItem } from '../../models/sale.model';
import { Product } from '../../models/product.model';
import { CurrencyService } from './currency.service';

/**
 * Tax calculation result for a single item
 */
export interface TaxCalculationResult {
  basePrice: number;
  taxAmount: number;
  totalPrice: number;
  taxRate: number;
  isTaxExempt: boolean;
}

/**
 * Tax calculation result for a single item with quantity details
 */
export interface ItemTaxCalculation extends TaxCalculationResult {
  unitBasePrice: number;
  unitTaxAmount: number;
  quantity: number;
}

/**
 * Complete cart tax summary
 */
export interface CartTaxSummary {
  items: ItemTaxCalculation[];
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  taxBreakdown: TaxBreakdownEntry[];
}

/**
 * Tax Calculation Service
 * Handles all tax calculations for the shop frontend
 * Feature: F-012 Tax Calculation and Compliance
 */
@Injectable({
  providedIn: 'root'
})
export class TaxCalculationService {
  constructor(private currencyService: CurrencyService) { }

  /**
   * Calculate tax for a tax-inclusive price
   * When a product price includes tax, this extracts the base price and tax amount
   * Formula: base_price = price / (1 + tax_rate/100)
   * Example: $100 with 10% tax -> base = 100/1.10 = $90.91, tax = $9.09
   */
  calculateTaxFromInclusivePrice(
    inclusivePrice: number,
    taxRatePercent: number
  ): { basePrice: number; taxAmount: number } {
    if (taxRatePercent <= 0) {
      return {
        basePrice: this.roundToTwoDecimals(inclusivePrice),
        taxAmount: 0
      };
    }

    const basePrice = inclusivePrice / (1 + taxRatePercent / 100);
    const taxAmount = inclusivePrice - basePrice;

    return {
      basePrice: this.roundToTwoDecimals(basePrice),
      taxAmount: this.roundToTwoDecimals(taxAmount)
    };
  }

  /**
   * Calculate tax for a tax-exclusive price
   * When a product price does not include tax, this calculates the tax to add
   * Formula: tax_amount = price * (tax_rate/100)
   * Example: $100 with 10% tax -> tax = $10.00, total = $110.00
   */
  calculateTaxFromExclusivePrice(
    exclusivePrice: number,
    taxRatePercent: number
  ): { taxAmount: number; totalWithTax: number } {
    if (taxRatePercent <= 0) {
      return {
        taxAmount: 0,
        totalWithTax: this.roundToTwoDecimals(exclusivePrice)
      };
    }

    const taxAmount = exclusivePrice * (taxRatePercent / 100);
    const totalWithTax = exclusivePrice + taxAmount;

    return {
      taxAmount: this.roundToTwoDecimals(taxAmount),
      totalWithTax: this.roundToTwoDecimals(totalWithTax)
    };
  }

  /**
   * Calculate complete tax information for a product item
   * Handles both tax-inclusive and tax-exclusive pricing
   * Also handles tax-exempt items
   */
  calculateItemTax(
    unitPrice: number,
    taxRatePercent: number,
    isTaxInclusive: boolean,
    isTaxExempt: boolean,
    quantity: number = 1
  ): ItemTaxCalculation {
    // Handle tax-exempt items
    if (isTaxExempt) {
      const totalPrice = this.roundToTwoDecimals(unitPrice * quantity);
      return {
        unitBasePrice: unitPrice,
        unitTaxAmount: 0,
        basePrice: totalPrice,
        taxAmount: 0,
        totalPrice,
        taxRate: 0,
        isTaxExempt: true,
        quantity
      };
    }

    let unitBasePrice: number;
    let unitTaxAmount: number;

    if (isTaxInclusive) {
      // Tax-inclusive: extract base price and tax from unit price
      const result = this.calculateTaxFromInclusivePrice(unitPrice, taxRatePercent);
      unitBasePrice = result.basePrice;
      unitTaxAmount = result.taxAmount;
    } else {
      // Tax-exclusive: unit price is base price, calculate tax on top
      unitBasePrice = unitPrice;
      const result = this.calculateTaxFromExclusivePrice(unitPrice, taxRatePercent);
      unitTaxAmount = result.taxAmount;
    }

    const basePrice = this.roundToTwoDecimals(unitBasePrice * quantity);
    const taxAmount = this.roundToTwoDecimals(unitTaxAmount * quantity);
    const totalPrice = this.roundToTwoDecimals(basePrice + taxAmount);

    return {
      unitBasePrice,
      unitTaxAmount,
      basePrice,
      taxAmount,
      totalPrice,
      taxRate: taxRatePercent,
      isTaxExempt: false,
      quantity
    };
  }

  /**
   * Calculate tax for a product using its tax configuration
   */
  calculateProductTax(product: Product, quantity: number = 1, overridePrice?: number): ItemTaxCalculation {
    const unitPrice = overridePrice ?? product.sellingPrice;
    return this.calculateItemTax(
      unitPrice,
      product.taxRate,
      product.isTaxInclusive,
      product.isTaxExempt,
      quantity
    );
  }

  /**
   * Convert a Product to a CartItem with calculated tax
   */
  productToCartItem(product: Product, salePrice?: number): CartItem {
    const price = salePrice ?? product.sellingPrice;
    const taxCalc = this.calculateItemTax(
      price,
      product.taxRate,
      product.isTaxInclusive,
      product.isTaxExempt,
      1
    );

    return {
      productId: product.id,
      brandName: product.brandName,
      model: product.model,
      storageGb: product.storageGb,
      color: product.color,
      condition: product.condition,
      imei: product.imei,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      salePrice: price,
      taxRate: product.taxRate,
      primaryImageUrl: product.primaryImageUrl,
      isTaxInclusive: product.isTaxInclusive,
      isTaxExempt: product.isTaxExempt,
      basePrice: taxCalc.basePrice,
      taxAmount: taxCalc.taxAmount
    };
  }

  /**
   * Calculate tax summary for a cart of items
   * Generates individual item calculations and aggregated tax breakdown by rate
   */
  calculateCartTax(cartItems: CartItem[]): CartTaxSummary {
    const itemCalculations: ItemTaxCalculation[] = [];
    const taxBreakdownMap = new Map<number, TaxBreakdownEntry>();

    let subtotal = 0;
    let totalTax = 0;

    for (const item of cartItems) {
      const calc = this.calculateItemTax(
        item.salePrice,
        item.taxRate,
        item.isTaxInclusive,
        item.isTaxExempt,
        1
      );

      itemCalculations.push(calc);
      subtotal += calc.basePrice;
      totalTax += calc.taxAmount;

      // Aggregate tax breakdown by rate
      const rate = calc.isTaxExempt ? 0 : calc.taxRate;
      const existing = taxBreakdownMap.get(rate);

      if (existing) {
        existing.taxableAmount += calc.basePrice;
        existing.taxAmount += calc.taxAmount;
        existing.itemCount += 1;
      } else {
        taxBreakdownMap.set(rate, {
          taxRate: rate,
          taxableAmount: calc.basePrice,
          taxAmount: calc.taxAmount,
          itemCount: 1
        });
      }
    }

    // Convert map to sorted array (by tax rate ascending)
    const taxBreakdown = Array.from(taxBreakdownMap.values())
      .map(entry => ({
        ...entry,
        taxableAmount: this.roundToTwoDecimals(entry.taxableAmount),
        taxAmount: this.roundToTwoDecimals(entry.taxAmount)
      }))
      .sort((a, b) => a.taxRate - b.taxRate);

    return {
      items: itemCalculations,
      subtotal: this.roundToTwoDecimals(subtotal),
      totalTax: this.roundToTwoDecimals(totalTax),
      grandTotal: this.roundToTwoDecimals(subtotal + totalTax),
      taxBreakdown
    };
  }

  /**
   * Calculate cart summary from cart items
   */
  calculateCartSummary(cartItems: CartItem[]): CartSummary {
    const taxSummary = this.calculateCartTax(cartItems);

    let totalCost = 0;
    for (const item of cartItems) {
      totalCost += item.costPrice;
    }

    return {
      subtotal: taxSummary.subtotal,
      taxAmount: taxSummary.totalTax,
      grandTotal: taxSummary.grandTotal,
      totalProfit: this.roundToTwoDecimals(taxSummary.subtotal - totalCost),
      totalCost: this.roundToTwoDecimals(totalCost),
      itemCount: cartItems.length,
      discountAmount: 0,
      finalTotal: taxSummary.grandTotal
    };
  }

  /**
   * Convert cart items to receipt items with tax information
   */
  cartItemsToReceiptItems(cartItems: CartItem[]): ReceiptItem[] {
    return cartItems.map(item => {
      const taxCalc = this.calculateItemTax(
        item.salePrice,
        item.taxRate,
        item.isTaxInclusive,
        item.isTaxExempt,
        1
      );

      return {
        name: `${item.brandName} ${item.model}${item.storageGb ? ` ${item.storageGb}GB` : ''}`,
        quantity: 1,
        unitPrice: item.salePrice,
        total: taxCalc.totalPrice,
        taxRate: item.taxRate,
        taxAmount: taxCalc.taxAmount,
        basePrice: taxCalc.basePrice,
        isTaxExempt: item.isTaxExempt
      };
    });
  }

  /**
   * Generate tax breakdown for receipt
   */
  generateTaxBreakdown(cartItems: CartItem[]): TaxBreakdownEntry[] {
    const taxSummary = this.calculateCartTax(cartItems);
    return taxSummary.taxBreakdown;
  }

  /**
   * Format tax rate for display (e.g., "10%" or "Tax Exempt")
   */
  formatTaxRate(taxRate: number, isTaxExempt: boolean): string {
    if (isTaxExempt) {
      return 'Tax Exempt';
    }
    if (taxRate === 0) {
      return '0%';
    }
    return `${taxRate}%`;
  }

  /**
   * Format currency amount for display
   */
  formatCurrency(amount: number, currencySymbol?: string): string {
    const symbol = currencySymbol ?? this.currencyService.symbol;
    return `${symbol}${amount.toFixed(2)}`;
  }

  /**
   * Generate tax breakdown summary text for receipt
   */
  generateTaxBreakdownText(taxBreakdown: TaxBreakdownEntry[]): string[] {
    return taxBreakdown.map(entry => {
      if (entry.taxRate === 0) {
        return `Tax Exempt (${entry.itemCount} item${entry.itemCount !== 1 ? 's' : ''}): ${this.formatCurrency(entry.taxableAmount)}`;
      }
      return `${entry.taxRate}% Tax on ${this.formatCurrency(entry.taxableAmount)}: ${this.formatCurrency(entry.taxAmount)}`;
    });
  }

  /**
   * Check if a product has tax configured
   */
  hasTaxConfigured(product: Product): boolean {
    return product.taxRate > 0 || product.isTaxExempt;
  }

  /**
   * Get display label for tax status
   */
  getTaxStatusLabel(product: Product): string {
    if (product.isTaxExempt) {
      return 'Tax Exempt';
    }
    if (product.taxRate === 0) {
      return 'No Tax';
    }
    const inclusiveLabel = product.isTaxInclusive ? ' (incl.)' : '';
    return `${product.taxRate}% Tax${inclusiveLabel}`;
  }

  /**
   * Round a number to 2 decimal places
   */
  private roundToTwoDecimals(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
