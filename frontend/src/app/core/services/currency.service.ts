import { Injectable } from '@angular/core';
import { ShopDetailsService } from './shop-details.service';

/**
 * Currency Service
 * Provides centralized currency formatting based on ShopDetails configuration.
 * Allows easy switching between currencies (PKR, USD, EUR, etc.) via Admin > Shop Details.
 */
@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  constructor(private shopDetailsService: ShopDetailsService) { }

  /** ISO 4217 currency code (e.g., 'PKR', 'USD') */
  get code(): string {
    return this.shopDetailsService.currencyCode();
  }

  /** Currency symbol (e.g., 'Rs.', '$') */
  get symbol(): string {
    return this.shopDetailsService.currencySymbol();
  }

  /** Locale for formatting (e.g., 'en-PK', 'en-US') */
  get locale(): string {
    return this.shopDetailsService.currencyLocale();
  }

  /** Number of decimal places */
  get decimals(): number {
    return this.shopDetailsService.currencyDecimals();
  }

  /**
   * Format a number as currency using Intl.NumberFormat
   * @param value - The numeric value to format
   * @param options - Optional overrides for decimals
   * @returns Formatted currency string
   */
  format(value: number, options?: { minDecimals?: number; maxDecimals?: number }): string {
    const minDecimals = options?.minDecimals ?? this.decimals;
    const maxDecimals = options?.maxDecimals ?? this.decimals;

    return new Intl.NumberFormat(this.locale, {
      style: 'currency',
      currency: this.code,
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals
    }).format(value);
  }

  /**
   * Format using simple symbol prefix (e.g., "Rs. 1,000")
   * @param value - The numeric value to format
   * @returns Formatted string with symbol
   */
  formatSimple(value: number): string {
    const formatted = new Intl.NumberFormat(this.locale, {
      minimumFractionDigits: this.decimals,
      maximumFractionDigits: this.decimals
    }).format(value);

    return `${this.symbol} ${formatted}`;
  }

  /**
   * Get Angular CurrencyPipe format string
   * @returns Format string like '1.0-0' or '1.2-2'
   */
  getPipeFormat(): string {
    return `1.${this.decimals}-${this.decimals}`;
  }

  /**
   * Get Angular CurrencyPipe format with custom decimals
   * @param minDecimals - Minimum decimal places
   * @param maxDecimals - Maximum decimal places
   * @returns Format string
   */
  getPipeFormatCustom(minDecimals: number, maxDecimals: number): string {
    return `1.${minDecimals}-${maxDecimals}`;
  }
}
