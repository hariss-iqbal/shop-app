import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DialogModule } from 'primeng/dialog';
import { BadgeModule } from 'primeng/badge';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { TagModule } from 'primeng/tag';
import { CheckboxModule } from 'primeng/checkbox';

import { ReceiptStorageService } from '../../../core/services/receipt-storage.service';
import { RefundService } from '../../../core/services/refund.service';
import { ReceiptService } from '../../../shared/services/receipt.service';
import { WhatsAppService } from '../../../shared/services/whatsapp.service';
import { ToastService } from '../../../shared/services/toast.service';
import { SavedReceiptSearchService } from '../../../core/services/saved-receipt-search.service';
import { SupabaseAuthService } from '../../../core/services/supabase-auth.service';
import {
  StoredReceipt,
  ReceiptFilter,
  ReceiptData,
  SavedReceiptSearch,
  ReceiptExportOptions
} from '../../../models/sale.model';
import { Refund, ProcessRefundResponse, ProcessPartialRefundResponse } from '../../../models/refund.model';
import { PrintReceiptDialogComponent } from '../sales/print-receipt-dialog/print-receipt-dialog.component';
import { ResendReceiptDialogComponent, ResendReceiptEvent } from './resend-receipt-dialog/resend-receipt-dialog.component';
import { ProcessRefundDialogComponent } from '../refunds/process-refund-dialog/process-refund-dialog.component';
import { ProcessPartialRefundDialogComponent } from '../refunds/process-partial-refund-dialog/process-partial-refund-dialog.component';
import { PrintRefundReceiptDialogComponent } from '../refunds/print-refund-receipt-dialog/print-refund-receipt-dialog.component';
import { BarcodeScannerDialogComponent } from './barcode-scanner-dialog/barcode-scanner-dialog.component';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';

interface SortOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-receipts-list',
  providers: [ConfirmationService],
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    DatePickerModule,
    SkeletonModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    DialogModule,
    BadgeModule,
    InputNumberModule,
    SelectModule,
    ConfirmDialogModule,
    DatePipe,
    TagModule,
    AppCurrencyPipe,
    MenuModule,
    CheckboxModule,
    PrintReceiptDialogComponent,
    ResendReceiptDialogComponent,
    ProcessRefundDialogComponent,
    ProcessPartialRefundDialogComponent,
    PrintRefundReceiptDialogComponent,
    BarcodeScannerDialogComponent
  ],
  templateUrl: './receipts-list.component.html'
})
export class ReceiptsListComponent implements OnInit {
  constructor(
    private receiptStorageService: ReceiptStorageService,
    private refundService: RefundService,
    private receiptService: ReceiptService,
    private whatsAppService: WhatsAppService,
    private toastService: ToastService,
    private savedSearchService: SavedReceiptSearchService,
    private confirmationService: ConfirmationService,
    public authService: SupabaseAuthService
  ) { }

  receipts = signal<StoredReceipt[]>([]);
  totalRecords = signal(0);
  loading = signal(false);
  readonly skeletonRows = Array(5).fill({});

  receiptNumberSearch = '';
  customerPhoneSearch = '';
  customerNameSearch = '';
  customerEmailSearch = '';
  startDate: Date | null = null;
  endDate: Date | null = null;
  minAmount: number | null = null;
  maxAmount: number | null = null;
  sortField: string = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';

  sortFieldOptions: SortOption[] = [
    { label: 'Date', value: 'transactionDate' },
    { label: 'Amount', value: 'grandTotal' },
    { label: 'Receipt #', value: 'receiptNumber' },
    { label: 'Created', value: 'createdAt' }
  ];

  sortOrderOptions: SortOption[] = [
    { label: 'Desc', value: 'desc' },
    { label: 'Asc', value: 'asc' }
  ];

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentPage = 1;
  private pageSize = 20;

  showReceiptDialog = signal(false);
  selectedReceiptData = signal<ReceiptData | null>(null);
  selectedReceiptId = signal<string | null>(null);

  showResendDialog = signal(false);
  selectedReceiptForResend = signal<StoredReceipt | null>(null);

  showRefundDialog = signal(false);
  selectedReceiptForRefund = signal<string | null>(null);
  receiptRefundStatus = signal<Map<string, 'full' | 'partial' | null>>(new Map());

  showPartialRefundDialog = signal(false);
  selectedReceiptForPartialRefund = signal<string | null>(null);

  showPrintRefundDialog = signal(false);
  refundToPrint = signal<Refund | null>(null);

  savedSearches = signal<SavedReceiptSearch[]>([]);
  activeSearchId = signal<string | null>(null);

  showSaveSearchDialog = false;
  newSearchName = '';
  newSearchIsDefault = false;

  showManageSavedSearchesDialog = false;

  showBarcodeScannerDialog = signal(false);

  ngOnInit(): void {
    this.initializeWithDefaultSearch();
  }

  /**
   * Initializes the component by loading saved searches and applying the default if one exists.
   * Feature: F-015 Multi-Criteria Receipt Search and Filtering
   */
  private async initializeWithDefaultSearch(): Promise<void> {
    try {
      // Load saved searches first
      await this.loadSavedSearches();

      // Check for and apply default saved search
      const defaultSearch = await this.savedSearchService.getDefaultSavedSearch();
      if (defaultSearch) {
        this.applySearchFilters(defaultSearch);
      }

      // Load data (with default filters applied if any)
      await this.loadData();
    } catch (error) {
      console.error('Failed to initialize with default search:', error);
      // Still try to load data even if default search fails
      await this.loadData();
    }
  }

  async loadSavedSearches(): Promise<void> {
    try {
      const response = await this.savedSearchService.getSavedSearches();
      this.savedSearches.set(response.data);
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    }
  }

  /**
   * Applies filter values from a saved search without triggering data reload.
   * Used for initial load with default search.
   */
  private applySearchFilters(search: SavedReceiptSearch): void {
    this.receiptNumberSearch = search.filters.receiptNumber || '';
    this.customerPhoneSearch = search.filters.customerPhone || '';
    this.customerNameSearch = search.filters.customerName || '';
    this.customerEmailSearch = search.filters.customerEmail || '';
    this.startDate = search.filters.startDate ? new Date(search.filters.startDate) : null;
    this.endDate = search.filters.endDate ? new Date(search.filters.endDate) : null;
    this.minAmount = search.filters.minAmount ?? null;
    this.maxAmount = search.filters.maxAmount ?? null;
    this.sortField = search.filters.sortField || 'createdAt';
    this.sortOrder = search.filters.sortOrder || 'desc';
    this.activeSearchId.set(search.id);
  }

  async loadData(): Promise<void> {
    this.loading.set(true);

    try {
      const filter = this.buildFilter();
      const response = await this.receiptStorageService.getReceipts(filter);
      this.receipts.set(response.data);
      this.totalRecords.set(response.total);

      await this.checkRefundStatuses(response.data);
    } catch (error) {
      this.toastService.error('Error', 'Failed to load receipts');
      console.error('Failed to load receipts:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private async checkRefundStatuses(receipts: StoredReceipt[]): Promise<void> {
    const statusMap = new Map<string, 'full' | 'partial' | null>();

    for (const receipt of receipts) {
      try {
        const fullRefundResult = await this.refundService.getRefundByReceipt(receipt.id);
        if (fullRefundResult.found && fullRefundResult.refund && !fullRefundResult.refund.isPartialRefund) {
          statusMap.set(receipt.id, 'full');
          continue;
        }

        const partialRefunds = await this.refundService.findPartialRefundsByReceiptId(receipt.id);
        if (partialRefunds.total > 0) {
          statusMap.set(receipt.id, 'partial');
        } else {
          statusMap.set(receipt.id, null);
        }
      } catch {
        statusMap.set(receipt.id, null);
      }
    }

    this.receiptRefundStatus.set(statusMap);
  }

  onSearchChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.activeSearchId.set(null);
      this.loadData();
    }, 300);
  }

  onDateFilterChange(): void {
    this.currentPage = 1;
    this.activeSearchId.set(null);
    this.loadData();
  }

  onAmountFilterChange(): void {
    this.currentPage = 1;
    this.activeSearchId.set(null);
    this.loadData();
  }

  onSortChange(): void {
    this.currentPage = 1;
    this.loadData();
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    this.currentPage = Math.floor((event.first ?? 0) / (event.rows ?? this.pageSize)) + 1;
    this.pageSize = event.rows ?? this.pageSize;
    this.loadData();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.receiptNumberSearch ||
      this.customerPhoneSearch ||
      this.customerNameSearch ||
      this.customerEmailSearch ||
      this.startDate ||
      this.endDate ||
      this.minAmount !== null ||
      this.maxAmount !== null
    );
  }

  clearFilters(): void {
    this.receiptNumberSearch = '';
    this.customerPhoneSearch = '';
    this.customerNameSearch = '';
    this.customerEmailSearch = '';
    this.startDate = null;
    this.endDate = null;
    this.minAmount = null;
    this.maxAmount = null;
    this.sortField = 'createdAt';
    this.sortOrder = 'desc';
    this.currentPage = 1;
    this.activeSearchId.set(null);
    this.loadData();
  }

  onApplySavedSearch(search: SavedReceiptSearch): void {
    this.applySearchFilters(search);
    this.currentPage = 1;
    this.loadData();
  }

  onShowSaveSearchDialog(): void {
    this.newSearchName = '';
    this.newSearchIsDefault = false;
    this.showSaveSearchDialog = true;
  }

  async onSaveSearch(): Promise<void> {
    if (!this.newSearchName.trim()) {
      this.toastService.error('Error', 'Search name is required');
      return;
    }

    try {
      const search = await this.savedSearchService.createSavedSearch({
        name: this.newSearchName.trim(),
        filters: this.buildFilterForSave(),
        isDefault: this.newSearchIsDefault
      });

      this.toastService.success('Success', `Search "${search.name}" saved`);
      this.showSaveSearchDialog = false;
      this.activeSearchId.set(search.id);
      await this.loadSavedSearches();
    } catch (error) {
      this.toastService.error('Error', 'Failed to save search');
      console.error('Failed to save search:', error);
    }
  }

  onDeleteSavedSearch(search: SavedReceiptSearch): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the saved search "${search.name}"?`,
      header: 'Delete Saved Search',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await this.savedSearchService.deleteSavedSearch(search.id);
          this.toastService.success('Success', `Search "${search.name}" deleted`);
          if (this.activeSearchId() === search.id) {
            this.activeSearchId.set(null);
          }
          await this.loadSavedSearches();
        } catch (error) {
          this.toastService.error('Error', 'Failed to delete saved search');
          console.error('Failed to delete saved search:', error);
        }
      }
    });
  }

  async onExportCsv(): Promise<void> {
    try {
      const options: ReceiptExportOptions = {
        format: 'csv',
        filters: this.buildFilter(),
        includeItems: true
      };

      await this.receiptStorageService.exportReceipts(options);
      this.toastService.success('Export Complete', 'Receipts exported to CSV');
    } catch (error) {
      this.toastService.error('Error', 'Failed to export receipts');
      console.error('Failed to export receipts:', error);
    }
  }

  onResendReceipt(receipt: StoredReceipt): void {
    this.selectedReceiptForResend.set(receipt);
    this.showResendDialog.set(true);
  }

  onResendComplete(event: ResendReceiptEvent): void {
    if (event.success) {
      this.loadData();
    }
  }

  canSendWhatsApp(receipt: StoredReceipt): boolean {
    return this.whatsAppService.canSendWhatsApp(receipt.customerPhone);
  }

  onViewReceipt(receipt: StoredReceipt): void {
    const receiptData = this.receiptStorageService.convertToReceiptData(receipt);
    this.selectedReceiptData.set(receiptData);
    this.selectedReceiptId.set(receipt.id);
    this.showReceiptDialog.set(true);
  }

  onPrintReceipt(receipt: StoredReceipt): void {
    const receiptData = this.receiptStorageService.convertToReceiptData(receipt);
    this.selectedReceiptData.set(receiptData);
    this.selectedReceiptId.set(receipt.id);
    this.showReceiptDialog.set(true);
  }

  onDownloadPdf(receipt: StoredReceipt): void {
    const receiptData = this.receiptStorageService.convertToReceiptData(receipt);
    this.receiptService.generatePdf(receiptData);
  }

  onWhatsAppSent(event: { phoneNumber: string; receiptNumber: string }): void {
    this.toastService.success(
      'WhatsApp Receipt',
      `Receipt ${event.receiptNumber} sent to ${this.whatsAppService.formatPhoneDisplay(event.phoneNumber)}`
    );
  }

  onProcessRefund(receipt: StoredReceipt): void {
    this.selectedReceiptForRefund.set(receipt.id);
    this.showRefundDialog.set(true);
  }

  onRefundCompleted(result: ProcessRefundResponse): void {
    if (result.success && result.refundId) {
      const currentStatus = this.receiptRefundStatus();
      const receiptId = this.selectedReceiptForRefund();
      if (receiptId) {
        currentStatus.set(receiptId, 'full');
        this.receiptRefundStatus.set(new Map(currentStatus));
      }
    }
  }

  onProcessPartialRefund(receipt: StoredReceipt): void {
    this.selectedReceiptForPartialRefund.set(receipt.id);
    this.showPartialRefundDialog.set(true);
  }

  onPartialRefundCompleted(result: ProcessPartialRefundResponse): void {
    if (result.success && result.refundId) {
      const currentStatus = this.receiptRefundStatus();
      const receiptId = this.selectedReceiptForPartialRefund();
      if (receiptId) {
        currentStatus.set(receiptId, 'partial');
        this.receiptRefundStatus.set(new Map(currentStatus));
      }
    }
  }

  onPrintRefundReceipt(refund: Refund): void {
    this.refundToPrint.set(refund);
    this.showPrintRefundDialog.set(true);
  }

  async onBarcodeReceiptSelected(receiptId: string): Promise<void> {
    const receipt = this.receipts().find(r => r.id === receiptId);
    if (receipt) {
      this.onViewReceipt(receipt);
    } else {
      try {
        const response = await this.receiptStorageService.getReceiptById(receiptId);
        if (response) {
          this.onViewReceipt(response);
        } else {
          this.toastService.error('Error', 'Receipt not found');
        }
      } catch (error) {
        this.toastService.error('Error', 'Failed to load receipt');
        console.error('Failed to load receipt:', error);
      }
    }
  }

  formatTime(time: string): string {
    if (!time) return '-';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  private buildFilter(): ReceiptFilter {
    const filter: ReceiptFilter = {
      page: this.currentPage,
      limit: this.pageSize,
      sortField: this.sortField as ReceiptFilter['sortField'],
      sortOrder: this.sortOrder
    };

    if (this.receiptNumberSearch.trim()) {
      filter.receiptNumber = this.receiptNumberSearch.trim();
    }

    if (this.customerPhoneSearch.trim()) {
      filter.customerPhone = this.customerPhoneSearch.trim();
    }

    if (this.customerNameSearch.trim()) {
      filter.customerName = this.customerNameSearch.trim();
    }

    if (this.customerEmailSearch.trim()) {
      filter.customerEmail = this.customerEmailSearch.trim();
    }

    if (this.startDate) {
      filter.startDate = this.formatDate(this.startDate);
    }

    if (this.endDate) {
      filter.endDate = this.formatDate(this.endDate);
    }

    if (this.minAmount !== null) {
      filter.minAmount = this.minAmount;
    }

    if (this.maxAmount !== null) {
      filter.maxAmount = this.maxAmount;
    }

    return filter;
  }

  private buildFilterForSave(): ReceiptFilter {
    const filter: ReceiptFilter = {};

    if (this.receiptNumberSearch.trim()) {
      filter.receiptNumber = this.receiptNumberSearch.trim();
    }

    if (this.customerPhoneSearch.trim()) {
      filter.customerPhone = this.customerPhoneSearch.trim();
    }

    if (this.customerNameSearch.trim()) {
      filter.customerName = this.customerNameSearch.trim();
    }

    if (this.customerEmailSearch.trim()) {
      filter.customerEmail = this.customerEmailSearch.trim();
    }

    if (this.startDate) {
      filter.startDate = this.formatDate(this.startDate);
    }

    if (this.endDate) {
      filter.endDate = this.formatDate(this.endDate);
    }

    if (this.minAmount !== null) {
      filter.minAmount = this.minAmount;
    }

    if (this.maxAmount !== null) {
      filter.maxAmount = this.maxAmount;
    }

    if (this.sortField !== 'createdAt') {
      filter.sortField = this.sortField as ReceiptFilter['sortField'];
    }

    if (this.sortOrder !== 'desc') {
      filter.sortOrder = this.sortOrder;
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
