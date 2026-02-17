import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { SkeletonModule } from 'primeng/skeleton';

import { SaleService } from '../../../../core/services/sale.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { CsvExportService, CsvColumn } from '../../../../shared/services/csv-export.service';
import { ReceiptService } from '../../../../shared/services/receipt.service';
import { WhatsAppService } from '../../../../shared/services/whatsapp.service';
import { Sale, SaleFilter, SaleSummary, ReceiptData } from '../../../../models/sale.model';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { PrintReceiptDialogComponent } from '../print-receipt-dialog/print-receipt-dialog.component';
import { FollowUpPaymentDialogComponent } from '../follow-up-payment-dialog/follow-up-payment-dialog.component';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-sales-list',
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
    DatePipe,
    DecimalPipe,
    AppCurrencyPipe,
    PrintReceiptDialogComponent,
    FollowUpPaymentDialogComponent,
    SelectModule
  ],
  templateUrl: './sales-list.component.html'
})
export class SalesListComponent implements OnInit {
  constructor(
    private saleService: SaleService,
    private toastService: ToastService,
    private csvExportService: CsvExportService,
    private receiptService: ReceiptService,
    private whatsAppService: WhatsAppService,
    private router: Router
  ) { }

  sales = signal<Sale[]>([]);
  summary = signal<SaleSummary | null>(null);
  loading = signal(false);
  readonly skeletonRows = Array(5).fill({});

  startDate: Date | null = null;
  endDate: Date | null = null;
  paymentStatusFilter: string | null = null;

  paymentStatusOptions = [
    { label: 'All', value: null },
    { label: 'Paid', value: 'paid' },
    { label: 'Partial Paid', value: 'partial_paid' }
  ];

  showReceiptDialog = signal(false);
  selectedReceiptData = signal<ReceiptData | null>(null);
  selectedSaleId = signal<string | null>(null);

  // Follow-up payment dialog
  showFollowUpDialog = signal(false);
  selectedFollowUpSale = signal<Sale | null>(null);

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);

    try {
      const filter = this.buildFilter();
      const [salesResponse, summaryResponse] = await Promise.all([
        this.saleService.getSales(filter),
        this.saleService.getSummary(filter)
      ]);
      this.sales.set(salesResponse.data);
      this.summary.set(summaryResponse);
    } catch (error) {
      this.toastService.error('Error', 'Failed to load sales data');
      console.error('Failed to load sales data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  onDateFilterChange(): void {
    this.loadData();
  }

  hasActiveFilters(): boolean {
    return this.startDate !== null || this.endDate !== null || this.paymentStatusFilter !== null;
  }

  clearFilters(): void {
    this.startDate = null;
    this.endDate = null;
    this.paymentStatusFilter = null;
    this.loadData();
  }

  onPaymentStatusFilterChange(): void {
    this.loadData();
  }

  onRecordFollowUpPayment(sale: Sale): void {
    this.selectedFollowUpSale.set(sale);
    this.showFollowUpDialog.set(true);
  }

  onFollowUpPaymentRecorded(): void {
    this.showFollowUpDialog.set(false);
    this.selectedFollowUpSale.set(null);
    this.loadData();
  }

  onViewProduct(sale: Sale): void {
    this.router.navigate(['/admin/inventory', sale.productId, 'edit']);
  }

  onPrintReceipt(sale: Sale): void {
    const receiptData = this.receiptService.buildReceiptDataFromSale(sale);
    this.selectedReceiptData.set(receiptData);
    this.selectedSaleId.set(sale.id);
    this.showReceiptDialog.set(true);
  }

  onDownloadPdf(sale: Sale): void {
    const receiptData = this.receiptService.buildReceiptDataFromSale(sale);
    this.receiptService.generatePdf(receiptData);
  }

  onExportCsv(): void {
    const columns: CsvColumn<Sale>[] = [
      { header: 'Brand', field: 'brandName' },
      { header: 'Model', field: 'productName' },
      { header: 'Sale Price', field: 'salePrice' },
      { header: 'Cost Price', field: 'costPrice' },
      { header: 'Profit', field: 'profit' },
      { header: 'Buyer Name', field: 'buyerName' },
      { header: 'Buyer Email', field: 'buyerEmail' },
      { header: 'Sale Date', field: 'saleDate' }
    ];

    this.csvExportService.exportToCsv(this.sales(), columns, 'sales_export');
    const message = this.hasActiveFilters()
      ? `${this.sales().length} filtered sales records exported to CSV`
      : `${this.sales().length} sales records exported to CSV`;
    this.toastService.success('Export Complete', message);
  }

  private buildFilter(): SaleFilter {
    const filter: SaleFilter = {};

    if (this.startDate) {
      filter.startDate = this.formatDate(this.startDate);
    }

    if (this.endDate) {
      filter.endDate = this.formatDate(this.endDate);
    }

    if (this.paymentStatusFilter) {
      filter.paymentStatus = this.paymentStatusFilter as 'paid' | 'partial_paid';
    }

    return filter;
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

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
