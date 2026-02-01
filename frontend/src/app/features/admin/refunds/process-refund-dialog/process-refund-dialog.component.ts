import { Component, EventEmitter, Input, Output, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';

import { RefundService } from '../../../../core/services/refund.service';
import { ToastService } from '../../../../shared/services/toast.service';
import {
  CheckReceiptRefundableResponse,
  ProcessRefundResponse,
  Refund
} from '../../../../models/refund.model';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-process-refund-dialog',
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    TextareaModule,
    TagModule,
    DividerModule,
    ProgressSpinnerModule,
    MessageModule,
    DatePipe,
    AppCurrencyPipe
  ],
  templateUrl: './process-refund-dialog.component.html'
})
export class ProcessRefundDialogComponent implements OnChanges {
  private refundService = inject(RefundService);
  private toastService = inject(ToastService);

  @Input() visible = false;
  @Input() receiptId: string | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() refundCompleted = new EventEmitter<ProcessRefundResponse>();
  @Output() printRefundReceipt = new EventEmitter<Refund>();

  checkingRefundable = signal(false);
  refundableInfo = signal<CheckReceiptRefundableResponse | null>(null);
  processing = signal(false);
  refundProcessed = signal(false);
  refundResult = signal<ProcessRefundResponse | null>(null);

  refundReason = '';
  notes = '';

  get dialogHeader(): string {
    if (this.checkingRefundable()) return 'Checking Receipt...';
    if (this.refundableInfo()?.canRefund === false) return 'Refund Not Available';
    if (this.refundProcessed()) return 'Refund Complete';
    return 'Process Full Refund';
  }

  get itemsWithInventoryRestore(): number {
    return this.refundableInfo()?.items?.filter(i => i.canRestoreInventory).length || 0;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.receiptId) {
      this.resetState();
      this.checkRefundable();
    }
  }

  private resetState(): void {
    this.checkingRefundable.set(false);
    this.refundableInfo.set(null);
    this.processing.set(false);
    this.refundProcessed.set(false);
    this.refundResult.set(null);
    this.refundReason = '';
    this.notes = '';
  }

  async checkRefundable(): Promise<void> {
    if (!this.receiptId) return;

    this.checkingRefundable.set(true);

    try {
      const result = await this.refundService.checkReceiptRefundable(this.receiptId);
      this.refundableInfo.set(result);
    } catch (error) {
      this.toastService.error('Error', 'Failed to check receipt status');
      console.error('Failed to check receipt refundable:', error);
      this.onClose();
    } finally {
      this.checkingRefundable.set(false);
    }
  }

  async onProcessRefund(): Promise<void> {
    if (!this.receiptId) return;

    this.processing.set(true);

    try {
      const result = await this.refundService.processFullRefund({
        receiptId: this.receiptId,
        refundReason: this.refundReason.trim() || null,
        notes: this.notes.trim() || null
      });

      if (result.success) {
        this.refundResult.set(result);
        this.refundProcessed.set(true);
        this.refundCompleted.emit(result);
        this.toastService.success(
          'Refund Processed',
          `Refund ${result.refundNumber} completed. ${result.inventoryRestored} item(s) restored to inventory.`
        );
      } else {
        this.toastService.error('Refund Failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      this.toastService.error('Error', 'Failed to process refund');
      console.error('Failed to process refund:', error);
    } finally {
      this.processing.set(false);
    }
  }

  async onPrintRefund(): Promise<void> {
    if (!this.refundResult()?.refundId) return;

    try {
      const refund = await this.refundService.getRefundById(this.refundResult()!.refundId!);
      if (refund) {
        this.printRefundReceipt.emit(refund);
      }
    } catch (error) {
      this.toastService.error('Error', 'Failed to load refund for printing');
      console.error('Failed to load refund:', error);
    }
  }

  onVisibleChange(visible: boolean): void {
    this.visibleChange.emit(visible);
  }

  onClose(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
