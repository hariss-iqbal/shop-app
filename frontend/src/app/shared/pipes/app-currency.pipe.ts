import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { CurrencyService } from '../../core/services/currency.service';

/**
 * App Currency Pipe
 * Custom currency pipe that uses the configured currency from environment.
 *
 * Usage:
 *   {{ value | appCurrency }}                    - Uses default decimals from config
 *   {{ value | appCurrency:'1.2-2' }}            - Custom decimal format
 *   {{ value | appCurrency:'1.0-0':'code' }}     - Show currency code instead of symbol
 *
 * Examples with PKR config (decimals: 0):
 *   {{ 1500 | appCurrency }}          => "Rs. 1,500" or "PKR 1,500"
 *   {{ 1500.50 | appCurrency:'1.2-2' }} => "Rs. 1,500.50"
 */
@Pipe({
  name: 'appCurrency',
  standalone: true
})
export class AppCurrencyPipe implements PipeTransform {
  constructor(private currencyService: CurrencyService) { }
  private currencyPipe = new CurrencyPipe(this.currencyService.locale);

  transform(
    value: number | string | null | undefined,
    digitsInfo?: string,
    display: 'code' | 'symbol' | 'symbol-narrow' = 'symbol'
  ): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const format = digitsInfo || this.currencyService.getPipeFormat();

    return this.currencyPipe.transform(
      value,
      this.currencyService.code,
      display,
      format,
      this.currencyService.locale
    );
  }
}
