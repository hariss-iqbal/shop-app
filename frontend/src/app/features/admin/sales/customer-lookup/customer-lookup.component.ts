import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DividerModule } from 'primeng/divider';

import { SaleService } from '../../../../core/services/sale.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ReceiptService } from '../../../../shared/services/receipt.service';
import { WhatsAppService } from '../../../../shared/services/whatsapp.service';
import { Sale, CustomerPurchaseHistory, ReceiptData } from '../../../../models/sale.model';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { PrintReceiptDialogComponent } from '../print-receipt-dialog/print-receipt-dialog.component';

@Component({
  selector: 'app-customer-lookup',
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    TagModule,
    TooltipModule,
    SkeletonModule,
    IconFieldModule,
    InputIconModule,
    DividerModule,
    DatePipe,
    AppCurrencyPipe,
    PrintReceiptDialogComponent
  ],
  templateUrl: './customer-lookup.component.html'
})
export class CustomerLookupComponent implements OnInit {
  constructor(
    private saleService: SaleService,
    private toastService: ToastService,
    private receiptService: ReceiptService,
    private whatsAppService: WhatsAppService,
    private route: ActivatedRoute
  ) { }

  phoneNumber = '';
  searching = signal(false);
  hasSearched = signal(false);
  customerHistory = signal<CustomerPurchaseHistory | null>(null);
  readonly skeletonRows = Array(5).fill({});

  showReceiptDialog = signal(false);
  selectedReceiptData = signal<ReceiptData | null>(null);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['phone']) {
        this.phoneNumber = params['phone'];
        this.onSearch();
      }
    });
  }

  async onSearch(): Promise<void> {
    if (!this.phoneNumber.trim()) {
      return;
    }

    this.searching.set(true);
    this.hasSearched.set(true);

    try {
      const result = await this.saleService.findByBuyerPhone(this.phoneNumber.trim());
      this.customerHistory.set(result);

      if (result.totalTransactions === 0) {
        this.toastService.info('No Results', `No transactions found for "${this.phoneNumber}"`);
      } else {
        this.toastService.success(
          'Search Complete',
          `Found ${result.totalTransactions} transaction(s)`
        );
      }
    } catch (error) {
      this.toastService.error('Error', 'Failed to search customer history');
      console.error('Failed to search customer history:', error);
      this.customerHistory.set(null);
    } finally {
      this.searching.set(false);
    }
  }

  onClear(): void {
    this.phoneNumber = '';
    this.hasSearched.set(false);
    this.customerHistory.set(null);
  }

  /**
   * Generate receipt number for display
   * Uses sale ID to ensure consistency with receipt service
   */
  getReceiptNumber(sale: Sale): string {
    return `RCP-${sale.id.substring(0, 8).toUpperCase()}`;
  }

  /**
   * Calculate average spend per transaction
   */
  getAverageSpend(): number {
    const history = this.customerHistory();
    if (!history || history.totalTransactions === 0) return 0;
    return history.totalSpent / history.totalTransactions;
  }

  /**
   * Get the date of the most recent transaction
   */
  getLastPurchaseDate(): string | null {
    const history = this.customerHistory();
    if (!history || history.transactions.length === 0) return null;
    // Transactions are sorted by date descending, so first is most recent
    return history.transactions[0].saleDate;
  }

  onPrintReceipt(sale: Sale): void {
    const receiptData = this.receiptService.buildReceiptDataFromSale(sale);
    this.selectedReceiptData.set(receiptData);
    this.showReceiptDialog.set(true);
  }

  onDownloadPdf(sale: Sale): void {
    const receiptData = this.receiptService.buildReceiptDataFromSale(sale);
    this.receiptService.generatePdf(receiptData);
  }

  onViewReceipt(sale: Sale): void {
    const receiptData = this.receiptService.buildReceiptDataFromSale(sale);
    this.selectedReceiptData.set(receiptData);
    this.showReceiptDialog.set(true);
  }

  canSendWhatsApp(sale: Sale): boolean {
    return this.whatsAppService.canSendWhatsApp(sale.buyerPhone);
  }

  onSendWhatsApp(sale: Sale): void {
    if (!sale.buyerPhone) return;

    const receiptData = this.receiptService.buildReceiptDataFromSale(sale);
    this.whatsAppService.sendReceiptViaWhatsApp(receiptData, sale.buyerPhone);
  }

  onWhatsAppSent(event: { phoneNumber: string; receiptNumber: string }): void {
    this.toastService.success(
      'WhatsApp Receipt',
      `Receipt ${event.receiptNumber} sent to ${this.whatsAppService.formatPhoneDisplay(event.phoneNumber)}`
    );
  }
}
