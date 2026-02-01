import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Currency Service
 * Provides centralized currency formatting based on environment configuration.
 * Allows easy switching between currencies (PKR, USD, EUR, etc.) via environment config.
 */
@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private readonly config = environment.currency;

  /** ISO 4217 currency code (e.g., 'PKR', 'USD') */
  get code(): string {
    return this.config.code;
  }

  /** Currency symbol (e.g., 'Rs.', '$') */
  get symbol(): string {
    return this.config.symbol;
  }

  /** Locale for formatting (e.g., 'en-PK', 'en-US') */
  get locale(): string {
    return this.config.locale;
  }

  /** Number of decimal places */
  get decimals(): number {
    return this.config.decimals;
  }

  /**
   * Format a number as currency using Intl.NumberFormat
   * @param value - The numeric value to format
   * @param options - Optional overrides for decimals
   * @returns Formatted currency string
   */
  format(value: number, options?: { minDecimals?: number; maxDecimals?: number }): string {
    const minDecimals = options?.minDecimals ?? this.config.decimals;
    const maxDecimals = options?.maxDecimals ?? this.config.decimals;

    return new Intl.NumberFormat(this.config.locale, {
      style: 'currency',
      currency: this.config.code,
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
    const formatted = new Intl.NumberFormat(this.config.locale, {
      minimumFractionDigits: this.config.decimals,
      maximumFractionDigits: this.config.decimals
    }).format(value);

    return `${this.config.symbol} ${formatted}`;
  }

  /**
   * Get Angular CurrencyPipe format string
   * @returns Format string like '1.0-0' or '1.2-2'
   */
  getPipeFormat(): string {
    return `1.${this.config.decimals}-${this.config.decimals}`;
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
