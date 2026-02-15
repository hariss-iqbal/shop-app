import { Component, input, output, signal, computed, effect, OnInit, HostListener } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { RippleModule } from 'primeng/ripple';

import { PaymentService } from '../../../core/services/payment.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { PaymentMethod, PaymentMethodOptions } from '../../../enums/payment-method.enum';
import { PaymentDetail, SplitPaymentValidation } from '../../../models/payment.model';

/**
 * Payment Method Selector Component
 * Feature: F-018 Payment Method Integration
 * Allows selection of payment method(s) with support for split payments
 */
@Component({
  selector: 'app-payment-method-selector',
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    InputNumberModule,
    InputTextModule,
    ButtonModule,
    CardModule,
    DividerModule,
    TagModule,
    TooltipModule,
    MessageModule,
    FloatLabelModule,
    ToggleButtonModule,
    RippleModule,
    CurrencyPipe
  ],
  templateUrl: './payment-method-selector.component.html',
  styleUrls: ['./payment-method-selector.component.scss']
})
export class PaymentMethodSelectorComponent implements OnInit {

  // Inputs
  totalDue = input.required<number>();
  initialPayments = input<PaymentDetail[]>();

  // Outputs
  paymentsChange = output<PaymentDetail[]>();
  validationChange = output<SplitPaymentValidation>();

  // State
  payments = signal<PaymentDetail[]>([]);
  isSplitPayment = false;

  // Constants
  paymentMethods = PaymentMethodOptions;
  PaymentMethod = PaymentMethod;

  // Computed values
  totalPaid = computed(() => {
    return this.payments().reduce((sum, p) => sum + (p.amount || 0), 0);
  });

  remainingAmount = computed(() => {
    return Math.max(0, this.totalDue() - this.totalPaid());
  });

  totalChangeAmount = computed(() => {
    return this.payments()
      .filter(p => p.method === PaymentMethod.CASH && p.cashTendered && p.cashTendered > p.amount)
      .reduce((sum, p) => sum + (p.cashTendered! - p.amount), 0);
  });

  validation = computed<SplitPaymentValidation>(() => {
    return this.paymentService.validateSplitPayment(this.payments(), this.totalDue());
  });

  private lastTotalDue: number = 0;

  constructor(
    private paymentService: PaymentService,
    private currencyService: CurrencyService
  ) {
    // React to total due changes - use untracked to prevent infinite loops
    effect(() => {
      const total = this.totalDue();
      // Only update if total actually changed and we're in single payment mode
      if (total !== this.lastTotalDue && !this.isSplitPayment) {
        this.lastTotalDue = total;
        // Use untracked read to avoid dependency on payments signal
        const currentPayments = this.payments();
        if (currentPayments.length === 1) {
          // Schedule update outside of effect to avoid signal write during effect
          queueMicrotask(() => {
            this.payments.update(payments => {
              if (payments.length === 1 && payments[0].amount !== total) {
                const updated = [...payments];
                updated[0] = { ...updated[0], amount: total };
                return updated;
              }
              return payments;
            });
            this.emitChanges();
          });
        }
      }
    });
  }

  ngOnInit(): void {
    const initial = this.initialPayments();
    if (initial && initial.length > 0) {
      this.payments.set([...initial]);
      this.isSplitPayment = initial.length > 1;
    } else {
      this.payments.set([this.paymentService.createDefaultPayment(this.totalDue())]);
    }
    // Emit initial validation state to parent
    this.emitChanges();
  }

  onSplitToggle(): void {
    if (!this.isSplitPayment && this.payments().length > 1) {
      // Switching to single payment - combine into one
      const total = this.totalPaid();
      this.payments.set([{
        method: PaymentMethod.CASH,
        amount: total
      }]);
    }
    this.emitChanges();
  }

  addPayment(): void {
    const remaining = this.remainingAmount();
    this.payments.update(payments => [
      ...payments,
      { method: PaymentMethod.CARD, amount: remaining > 0 ? remaining : 0 }
    ]);
    this.emitChanges();
  }

  removePayment(index: number): void {
    if (this.payments().length <= 1) return;

    this.payments.update(payments => payments.filter((_, i) => i !== index));
    this.emitChanges();
  }

  onPaymentChange(): void {
    this.emitChanges();
  }

  onCashTenderedChange(index: number): void {
    this.payments.update(payments => {
      const updated = [...payments];
      const payment = updated[index];
      if (payment.cashTendered && payment.cashTendered >= payment.amount) {
        payment.changeGiven = payment.cashTendered - payment.amount;
      } else {
        payment.changeGiven = null;
      }
      return updated;
    });
    this.emitChanges();
  }

  setCashTendered(index: number, amount: number): void {
    this.payments.update(payments => {
      const updated = [...payments];
      updated[index] = {
        ...updated[index],
        cashTendered: amount,
        changeGiven: amount >= updated[index].amount ? amount - updated[index].amount : null
      };
      return updated;
    });
    this.emitChanges();
  }

  getChangeAmount(payment: PaymentDetail): number {
    if (payment.cashTendered && payment.cashTendered >= payment.amount) {
      return payment.cashTendered - payment.amount;
    }
    return 0;
  }

  getQuickCashAmounts(amount: number): number[] {
    return this.paymentService.getQuickCashAmounts(amount);
  }

  /**
   * Check if cash tendered is insufficient for the payment amount
   */
  isCashInsufficient(payment: PaymentDetail): boolean {
    return payment.method === PaymentMethod.CASH &&
           payment.cashTendered !== undefined &&
           payment.cashTendered !== null &&
           payment.cashTendered > 0 &&
           payment.cashTendered < payment.amount;
  }

  /**
   * Validate card last four digits format
   */
  isValidCardLastFour(value: string | null | undefined): boolean {
    if (!value) return true; // Empty is valid (optional field)
    return /^\d{4}$/.test(value);
  }

  /**
   * Handle card last four input - strip non-numeric characters
   */
  onCardLastFourInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    // Remove non-numeric characters
    const cleaned = input.value.replace(/\D/g, '').slice(0, 4);
    this.payments.update(payments => {
      const updated = [...payments];
      updated[index] = { ...updated[index], cardLastFour: cleaned || null };
      return updated;
    });
    input.value = cleaned;
    this.emitChanges();
  }

  formatCurrency(value: number): string {
    return this.currencyService.format(value, { minDecimals: 0, maxDecimals: 0 });
  }

  /**
   * Keyboard shortcut handler for quick actions
   * Alt+1-6 to select quick cash amounts
   */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    // Only handle if we have a single cash payment
    if (this.payments().length !== 1 || this.payments()[0].method !== PaymentMethod.CASH) {
      return;
    }

    // Alt + number keys for quick cash amounts
    if (event.altKey && event.key >= '1' && event.key <= '6') {
      const quickAmounts = this.getQuickCashAmounts(this.payments()[0].amount);
      const index = parseInt(event.key, 10) - 1;
      if (index < quickAmounts.length) {
        event.preventDefault();
        this.setCashTendered(0, quickAmounts[index]);
      }
    }
  }

  private emitChanges(): void {
    this.paymentsChange.emit(this.payments());
    this.validationChange.emit(this.validation());
  }
}
