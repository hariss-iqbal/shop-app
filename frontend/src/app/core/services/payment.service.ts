import { Injectable } from '@angular/core';
import {
  PaymentMethod,
  PaymentMethodLabels,
  PaymentMethodIcons,
  PaymentMethodOptions
} from '../../enums/payment-method.enum';
import {
  PaymentDetail,
  PaymentSummary,
  PaymentFormState,
  CashChangeResponse,
  SplitPaymentValidation,
  createDefaultPaymentState,
  createDefaultPayment
} from '../../models/payment.model';
import { CurrencyService } from './currency.service';

/**
 * Payment Service
 * Handles payment method logic for sales
 * Feature: F-018 Payment Method Integration
 */
@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  constructor(private currencyService: CurrencyService) { }

  /**
   * Get all available payment methods
   */
  getPaymentMethods() {
    return PaymentMethodOptions;
  }

  /**
   * Get label for a payment method
   */
  getPaymentMethodLabel(method: PaymentMethod): string {
    return PaymentMethodLabels[method] || method;
  }

  /**
   * Get icon for a payment method
   */
  getPaymentMethodIcon(method: PaymentMethod): string {
    return PaymentMethodIcons[method] || 'pi pi-wallet';
  }

  /**
   * Create a default single payment for the given amount
   */
  createDefaultPayment(amount: number, method: PaymentMethod = PaymentMethod.CASH): PaymentDetail {
    return createDefaultPayment(amount, method);
  }

  /**
   * Create default payment state for sale form
   */
  createDefaultPaymentState(totalDue: number): PaymentFormState {
    return createDefaultPaymentState(totalDue);
  }

  /**
   * Calculate cash change
   */
  calculateCashChange(amountDue: number, cashTendered: number): CashChangeResponse {
    const changeGiven = cashTendered >= amountDue ? cashTendered - amountDue : 0;

    return {
      amountDue,
      cashTendered,
      changeGiven,
      isExact: Math.abs(cashTendered - amountDue) < 0.01,
      isInsufficient: cashTendered < amountDue
    };
  }

  /**
   * Validate split payment totals
   */
  validateSplitPayment(payments: PaymentDetail[], totalDue: number): SplitPaymentValidation {
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const difference = totalPaid - totalDue;
    const tolerance = 0.01; // Allow 1 cent tolerance for rounding

    const isValid = Math.abs(difference) <= tolerance;

    let message = '';
    if (isValid) {
      message = 'Payment amounts match total due';
    } else if (totalPaid < totalDue) {
      message = `Short by ${this.formatCurrency(Math.abs(difference))}`;
    } else {
      message = `Over by ${this.formatCurrency(difference)}`;
    }

    return {
      isValid,
      totalPaid,
      amountDue: totalDue,
      difference,
      message
    };
  }

  /**
   * Check if payments use split payment (multiple methods)
   */
  isSplitPayment(payments: PaymentDetail[]): boolean {
    return payments && payments.length > 1;
  }

  /**
   * Get the primary payment method (method with largest amount)
   */
  getPrimaryPaymentMethod(payments: PaymentDetail[]): PaymentMethod | null {
    if (!payments || payments.length === 0) {
      return null;
    }
    const sorted = [...payments].sort((a, b) => (b.amount || 0) - (a.amount || 0));
    return sorted[0].method;
  }

  /**
   * Convert payments to payment summary format
   */
  toPaymentSummary(payments: PaymentDetail[]): PaymentSummary[] {
    return payments.map(p => ({
      method: p.method,
      amount: p.amount,
      cardLastFour: p.cardLastFour ?? null,
      transactionReference: p.transactionReference ?? null,
      cashTendered: p.cashTendered ?? null,
      changeGiven: p.method === PaymentMethod.CASH && p.cashTendered && p.cashTendered > p.amount
        ? p.cashTendered - p.amount
        : null
    }));
  }

  /**
   * Validate a single payment detail
   */
  validatePayment(payment: PaymentDetail): { isValid: boolean; error?: string } {
    if (payment.amount === undefined || payment.amount < 0) {
      return { isValid: false, error: 'Amount must be a positive number' };
    }

    if (payment.method === PaymentMethod.CARD && payment.cardLastFour) {
      if (!/^\d{4}$/.test(payment.cardLastFour)) {
        return { isValid: false, error: 'Card last four must be exactly 4 digits' };
      }
    }

    return { isValid: true };
  }

  /**
   * Format payment summary for display
   */
  formatPaymentSummary(payments: PaymentSummary[]): string {
    if (!payments || payments.length === 0) {
      return 'No payment recorded';
    }

    if (payments.length === 1) {
      const p = payments[0];
      let text = `${this.getPaymentMethodLabel(p.method)}: ${this.formatCurrency(p.amount)}`;
      if (p.cardLastFour) {
        text += ` (*${p.cardLastFour})`;
      }
      return text;
    }

    return payments
      .map(p => {
        let text = `${this.getPaymentMethodLabel(p.method)}: ${this.formatCurrency(p.amount)}`;
        if (p.cardLastFour) {
          text += ` (*${p.cardLastFour})`;
        }
        return text;
      })
      .join(' + ');
  }

  /**
   * Get quick cash amounts for change calculation
   */
  getQuickCashAmounts(amountDue: number): number[] {
    const rounded = Math.ceil(amountDue);
    const amounts: number[] = [];

    // Add exact amount
    amounts.push(amountDue);

    // Add rounded amounts
    if (rounded !== amountDue) {
      amounts.push(rounded);
    }

    // Add common denominations
    const denominations = [5, 10, 20, 50, 100, 200, 500];
    for (const denom of denominations) {
      if (denom >= amountDue && !amounts.includes(denom)) {
        amounts.push(denom);
      }
    }

    // Round up to next denomination
    for (const denom of denominations) {
      const nextMultiple = Math.ceil(amountDue / denom) * denom;
      if (nextMultiple >= amountDue && !amounts.includes(nextMultiple)) {
        amounts.push(nextMultiple);
      }
    }

    return amounts.sort((a, b) => a - b).slice(0, 6);
  }

  private formatCurrency(value: number): string {
    return this.currencyService.format(value);
  }
}
