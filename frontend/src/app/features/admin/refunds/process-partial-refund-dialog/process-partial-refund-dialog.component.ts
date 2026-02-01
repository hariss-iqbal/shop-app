import { Component, EventEmitter, Input, Output, inject, signal, OnChanges, SimpleChanges, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';

import { RefundService } from '../../../../core/services/refund.service';
import { ToastService } from '../../../../shared/services/toast.service';
import {
  CheckPartialRefundableResponse,
  ProcessPartialRefundResponse,
  PartialRefundableItem,
  PartialRefundItemInput,
  Refund
} from '../../../../models/refund.model';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';

interface RefundItemSelection extends PartialRefundableItem {
  selected: boolean;
  returnPrice: number;
  hasCustomPrice: boolean;
  requiresApproval: boolean;
}

@Component({
  selector: 'app-process-partial-refund-dialog',
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
    CheckboxModule,
    InputNumberModule,
    TooltipModule,
    TableModule,
    CardModule,
    DatePipe,
    AppCurrencyPipe
  ],
  templateUrl: './process-partial-refund-dialog.component.html'
})
export class ProcessPartialRefundDialogComponent implements OnChanges {
  private refundService = inject(RefundService);
  private toastService = inject(ToastService);

  @Input() visible = false;
  @Input() receiptId: string | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() refundCompleted = new EventEmitter<ProcessPartialRefundResponse>();
  @Output() printRefundReceipt = new EventEmitter<Refund>();

  checkingRefundable = signal(false);
  refundableInfo = signal<CheckPartialRefundableResponse | null>(null);
  processing = signal(false);
  refundProcessed = signal(false);
  refundResult = signal<ProcessPartialRefundResponse | null>(null);

  selectableItems = signal<RefundItemSelection[]>([]);

  refundReason = '';
  notes = '';
  managerApproved = false;
  managerApprovalReason = '';

  selectedCount = computed(() =>
    this.selectableItems().filter(i => i.selected && i.canRefund).length
  );

  hasSelectableItems = computed(() =>
    this.selectableItems().some(i => i.canRefund)
  );

  totalSelectableCount = computed(() =>
    this.selectableItems().filter(i => i.canRefund).length
  );

  allSelected = computed(() => {
    const selectable = this.selectableItems().filter(i => i.canRefund);
    return selectable.length > 0 && selectable.every(i => i.selected);
  });

  calculatedSubtotal = computed(() =>
    this.selectableItems()
      .filter(i => i.selected && i.canRefund)
      .reduce((sum, i) => sum + (i.returnPrice * i.quantity), 0)
  );

  calculatedTax = computed(() => {
    const taxRate = this.refundableInfo()?.taxRate || 0;
    return Math.round(this.calculatedSubtotal() * (taxRate / 100) * 100) / 100;
  });

  calculatedTotal = computed(() =>
    this.calculatedSubtotal() + this.calculatedTax()
  );

  requiresManagerApproval = computed(() =>
    this.selectableItems().some(i => i.selected && i.canRefund && i.requiresApproval)
  );

  itemsWithInventoryRestore = computed(() =>
    this.selectableItems().filter(i => i.selected && i.canRefund && i.canRestoreInventory).length
  );

  canProcessRefund = computed(() => {
    if (this.selectedCount() === 0) return false;
    if (this.requiresManagerApproval() && !this.managerApproved) return false;
    return true;
  });

  get dialogHeader(): string {
    if (this.checkingRefundable()) return 'Checking Receipt...';
    if (this.refundableInfo()?.canPartialRefund === false) return 'Partial Refund Not Available';
    if (this.refundProcessed()) return 'Partial Refund Complete';
    return 'Process Partial Refund';
  }

  getPriceDifference(item: RefundItemSelection): string {
    const diff = item.returnPrice - item.unitPrice;
    if (diff === 0) return '';
    const sign = diff > 0 ? '+' : '';
    return `${sign}$${Math.abs(diff).toFixed(2)}`;
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
    this.selectableItems.set([]);
    this.refundReason = '';
    this.notes = '';
    this.managerApproved = false;
    this.managerApprovalReason = '';
  }

  async checkRefundable(): Promise<void> {
    if (!this.receiptId) return;

    this.checkingRefundable.set(true);

    try {
      const result = await this.refundService.checkReceiptPartialRefundable(this.receiptId);
      this.refundableInfo.set(result);

      if (result.canPartialRefund && result.items) {
        const items: RefundItemSelection[] = result.items.map(item => ({
          ...item,
          selected: false,
          returnPrice: item.unitPrice,
          hasCustomPrice: false,
          requiresApproval: false
        }));
        this.selectableItems.set(items);
      }
    } catch (error) {
      this.toastService.error('Error', 'Failed to check receipt status');
      console.error('Failed to check receipt partial refundable:', error);
      this.onClose();
    } finally {
      this.checkingRefundable.set(false);
    }
  }

  toggleSelectAll(event: { checked?: boolean }): void {
    const items = this.selectableItems();
    const checked = event.checked ?? false;
    items.forEach(item => {
      if (item.canRefund) {
        item.selected = checked;
      }
    });
    this.selectableItems.set([...items]);
  }

  onItemSelectionChange(): void {
    this.selectableItems.set([...this.selectableItems()]);
  }

  onReturnPriceChange(item: RefundItemSelection): void {
    item.hasCustomPrice = item.returnPrice !== item.unitPrice;
    item.requiresApproval = item.returnPrice > item.unitPrice;
    this.selectableItems.set([...this.selectableItems()]);
  }

  async onProcessRefund(): Promise<void> {
    if (!this.receiptId || !this.canProcessRefund()) return;

    this.processing.set(true);

    try {
      const selectedItems = this.selectableItems().filter(i => i.selected && i.canRefund);

      const items: PartialRefundItemInput[] = selectedItems.map(item => ({
        receiptItemId: item.id,
        returnPrice: item.returnPrice
      }));

      const result = await this.refundService.processPartialRefund({
        receiptId: this.receiptId,
        items,
        refundReason: this.refundReason.trim() || null,
        notes: this.notes.trim() || null,
        managerApproved: this.managerApproved,
        managerApprovalReason: this.managerApprovalReason.trim() || null
      });

      if (result.success) {
        this.refundResult.set(result);
        this.refundProcessed.set(true);
        this.refundCompleted.emit(result);
        this.toastService.success(
          'Partial Refund Processed',
          `Refund ${result.refundNumber} completed. ${result.inventoryRestored} item(s) restored to inventory.`
        );
      } else {
        this.toastService.error('Refund Failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      this.toastService.error('Error', 'Failed to process partial refund');
      console.error('Failed to process partial refund:', error);
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
