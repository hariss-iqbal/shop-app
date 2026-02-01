/**
 * Tax Calculation Service
 * Handles all tax calculations for the phone shop
 * Feature: F-012 Tax Calculation and Compliance
 */

export interface TaxCalculationResult {
  basePrice: number;
  taxAmount: number;
  totalPrice: number;
  taxRate: number;
  isTaxExempt: boolean;
}

export interface ItemTaxCalculation extends TaxCalculationResult {
  unitBasePrice: number;
  unitTaxAmount: number;
  quantity: number;
}

export interface TaxBreakdownEntry {
  taxRate: number;
  taxableAmount: number;
  taxAmount: number;
  itemCount: number;
}

export interface CartTaxSummary {
  items: ItemTaxCalculation[];
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  taxBreakdown: TaxBreakdownEntry[];
}

/**
 * Tax Calculation Service
 * Provides tax calculation functionality for products and sales
 */
export class TaxCalculationService {
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
   * Calculate tax for a single item given phone data
   * Convenience method that takes phone properties directly
   */
  calculatePhoneTax(
    sellingPrice: number,
    taxRate: number,
    isTaxInclusive: boolean,
    isTaxExempt: boolean,
    quantity: number = 1
  ): ItemTaxCalculation {
    return this.calculateItemTax(
      sellingPrice,
      taxRate,
      isTaxInclusive,
      isTaxExempt,
      quantity
    );
  }

  /**
   * Calculate tax summary for a cart of items
   * Generates individual item calculations and aggregated tax breakdown by rate
   */
  calculateCartTax(
    items: Array<{
      unitPrice: number;
      taxRate: number;
      isTaxInclusive: boolean;
      isTaxExempt: boolean;
      quantity: number;
    }>
  ): CartTaxSummary {
    const itemCalculations: ItemTaxCalculation[] = [];
    const taxBreakdownMap = new Map<number, TaxBreakdownEntry>();

    let subtotal = 0;
    let totalTax = 0;

    for (const item of items) {
      const calc = this.calculateItemTax(
        item.unitPrice,
        item.taxRate,
        item.isTaxInclusive,
        item.isTaxExempt,
        item.quantity
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
        existing.itemCount += item.quantity;
      } else {
        taxBreakdownMap.set(rate, {
          taxRate: rate,
          taxableAmount: calc.basePrice,
          taxAmount: calc.taxAmount,
          itemCount: item.quantity
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
  formatCurrency(amount: number, currencySymbol: string = '$'): string {
    return `${currencySymbol}${amount.toFixed(2)}`;
  }

  /**
   * Generate tax breakdown summary text for receipt
   */
  generateTaxBreakdownText(taxBreakdown: TaxBreakdownEntry[]): string[] {
    return taxBreakdown.map(entry => {
      if (entry.taxRate === 0) {
        return `Tax Exempt (${entry.itemCount} item${entry.itemCount !== 1 ? 's' : ''}): $${entry.taxableAmount.toFixed(2)}`;
      }
      return `${entry.taxRate}% Tax on $${entry.taxableAmount.toFixed(2)}: $${entry.taxAmount.toFixed(2)}`;
    });
  }

  /**
   * Round a number to 2 decimal places
   * Uses banker's rounding (round half to even) for accuracy
   */
  private roundToTwoDecimals(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
