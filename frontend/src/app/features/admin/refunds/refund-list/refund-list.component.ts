import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';

import { RefundService } from '../../../../core/services/refund.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Refund, RefundFilter, RefundSummary } from '../../../../models/refund.model';
import { PrintRefundReceiptDialogComponent } from '../print-refund-receipt-dialog/print-refund-receipt-dialog.component';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-refund-list',
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    TooltipModule,
    DatePickerModule,
    SkeletonModule,
    DialogModule,
    DatePipe,
    AppCurrencyPipe,
    PrintRefundReceiptDialogComponent
  ],
  templateUrl: './refund-list.component.html'
})
export class RefundListComponent implements OnInit {
  private refundService = inject(RefundService);
  private toastService = inject(ToastService);

  refunds = signal<Refund[]>([]);
  summary = signal<RefundSummary | null>(null);
  loading = signal(false);
  readonly skeletonRows = Array(5).fill({});

  startDate: Date | null = null;
  endDate: Date | null = null;

  showDetailsDialog = false;
  selectedRefund = signal<Refund | null>(null);

  showPrintDialog = signal(false);
  printRefund = signal<Refund | null>(null);

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);

    try {
      const filter = this.buildFilter();
      const [refundsResponse, summaryResponse] = await Promise.all([
        this.refundService.getRefunds(filter),
        this.refundService.getSummary(filter)
      ]);
      this.refunds.set(refundsResponse.data);
      this.summary.set(summaryResponse);
    } catch (error) {
      this.toastService.error('Error', 'Failed to load refunds data');
      console.error('Failed to load refunds data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  onDateFilterChange(): void {
    this.loadData();
  }

  hasActiveFilters(): boolean {
    return this.startDate !== null || this.endDate !== null;
  }

  clearFilters(): void {
    this.startDate = null;
    this.endDate = null;
    this.loadData();
  }

  onViewDetails(refund: Refund): void {
    this.selectedRefund.set(refund);
    this.showDetailsDialog = true;
  }

  onPrintRefund(refund: Refund): void {
    this.printRefund.set(refund);
    this.showPrintDialog.set(true);
  }

  private buildFilter(): RefundFilter {
    const filter: RefundFilter = {};

    if (this.startDate) {
      filter.startDate = this.formatDate(this.startDate);
    }

    if (this.endDate) {
      filter.endDate = this.formatDate(this.endDate);
    }

    return filter;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
