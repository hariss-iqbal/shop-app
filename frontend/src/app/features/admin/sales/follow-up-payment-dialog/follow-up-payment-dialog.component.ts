import { Component, input, output, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { TextareaModule } from 'primeng/textarea';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TableModule } from 'primeng/table';

import { PaymentMethodSelectorComponent } from '../../../../shared/components/payment-method-selector/payment-method-selector.component';
import { SaleService } from '../../../../core/services/sale.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { CurrencyService } from '../../../../core/services/currency.service';
import { PaymentDetail, SplitPaymentValidation, BatchPaymentHistory } from '../../../../models/payment.model';
import { Sale, ReceiptData } from '../../../../models/sale.model';
import { PrintReceiptDialogComponent } from '../print-receipt-dialog/print-receipt-dialog.component';

@Component({
  selector: 'app-follow-up-payment-dialog',
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    DividerModule,
    TagModule,
    ProgressSpinnerModule,
    MessageModule,
    TextareaModule,
    FloatLabelModule,
    TableModule,
    CurrencyPipe,
    PaymentMethodSelectorComponent,
    PrintReceiptDialogComponent
  ],
  templateUrl: './follow-up-payment-dialog.component.html'
})
export class FollowUpPaymentDialogComponent implements OnChanges {
  visible = input.required<boolean>();
  sale = input.required<Sale | null>();

  visibleChange = output<boolean>();
  paymentRecorded = output<void>();

  loading = signal(false);
  saving = signal(false);
  batchHistory = signal<BatchPaymentHistory | null>(null);

  payments: PaymentDetail[] = [];
  paymentValidation: SplitPaymentValidation = {
    isValid: false, totalPaid: 0, amountDue: 0,
    difference: 0, message: '', isFullPayment: false,
    isPartialPayment: false, balance: 0
  };
  notes = '';

  // Follow-up receipt
  showReceiptDialog = signal(false);
  followUpReceiptData = signal<ReceiptData | null>(null);

  constructor(
    private saleService: SaleService,
    private paymentService: PaymentService,
    private toastService: ToastService,
    private currencyService: CurrencyService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] || changes['sale']) {
      const currentSale = this.sale();
      if (this.visible() && currentSale?.batchId) {
        this.loadBatchHistory(currentSale.batchId);
      }
    }
  }

  get currentBalance(): number {
    return this.sale()?.balance ?? 0;
  }

  async loadBatchHistory(batchId: string): Promise<void> {
    this.loading.set(true);
    try {
      const history = await this.saleService.getBatchPaymentHistory(batchId);
      this.batchHistory.set(history);
    } catch (error) {
      console.error('Failed to load batch history:', error);
      this.toastService.error('Error', 'Failed to load payment history');
    } finally {
      this.loading.set(false);
    }
  }

  onPaymentsChange(payments: PaymentDetail[]): void {
    this.payments = payments;
  }

  onPaymentValidationChange(validation: SplitPaymentValidation): void {
    this.paymentValidation = validation;
  }

  async onRecordPayment(): Promise<void> {
    const currentSale = this.sale();
    if (!currentSale?.batchId || this.paymentValidation.totalPaid <= 0) return;

    this.saving.set(true);
    try {
      const paymentSummary = this.paymentService.toPaymentSummary(this.payments);

      const result = await this.saleService.recordFollowUpPayment({
        batchId: currentSale.batchId,
        amount: this.paymentValidation.totalPaid,
        paymentMethod: this.payments[0]?.method || 'cash',
        paymentSummary,
        notes: this.notes?.trim() || null
      });

      if (!result.success) {
        this.toastService.error('Payment Failed', result.error || 'Failed to record payment');
        return;
      }

      const newBalance = result.newBalance ?? 0;
      const isCleared = newBalance <= 0;

      this.toastService.success(
        'Payment Recorded',
        isCleared
          ? `Payment of ${this.formatCurrency(result.amountPaid ?? 0)} recorded. Balance cleared!`
          : `Payment of ${this.formatCurrency(result.amountPaid ?? 0)} recorded. Remaining: ${this.formatCurrency(newBalance)}`
      );

      // Build follow-up receipt
      this.buildFollowUpReceipt(result.amountPaid ?? 0, result.previousBalance ?? 0, newBalance, isCleared);

      this.paymentRecorded.emit();
    } catch (error) {
      console.error('Error recording follow-up payment:', error);
      this.toastService.error('Error', 'Failed to record payment');
    } finally {
      this.saving.set(false);
    }
  }

  private buildFollowUpReceipt(amountPaid: number, previousBalance: number, newBalance: number, isCleared: boolean): void {
    const currentSale = this.sale();
    if (!currentSale) return;

    const receiptData: ReceiptData = {
      receiptNumber: `FUP-${Date.now().toString(36).toUpperCase()}`,
      transactionDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      transactionTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      items: [{
        name: 'Follow-Up Payment',
        quantity: 1,
        unitPrice: amountPaid,
        total: amountPaid,
        taxRate: 0,
        taxAmount: 0,
        basePrice: amountPaid,
        isTaxExempt: true
      }],
      subtotal: amountPaid,
      taxRate: 0,
      taxAmount: 0,
      grandTotal: amountPaid,
      customerName: currentSale.buyerName,
      customerPhone: currentSale.buyerPhone,
      customerEmail: currentSale.buyerEmail,
      notes: `Follow-up payment. Previous balance: ${this.formatCurrency(previousBalance)}. New balance: ${this.formatCurrency(newBalance)}.`,
      payments: this.paymentService.toPaymentSummary(this.payments),
      balance: newBalance,
      paymentStatus: isCleared ? 'paid' : 'partial_paid'
    };

    this.followUpReceiptData.set(receiptData);
    this.showReceiptDialog.set(true);
  }

  onClose(): void {
    this.visibleChange.emit(false);
    this.notes = '';
    this.batchHistory.set(null);
  }

  onReceiptDialogClose(visible: boolean): void {
    this.showReceiptDialog.set(visible);
    if (!visible) {
      this.onClose();
    }
  }

  formatCurrency(value: number): string {
    return this.currencyService.format(value, { minDecimals: 2, maxDecimals: 2 });
  }
}
