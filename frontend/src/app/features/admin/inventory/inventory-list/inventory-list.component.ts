import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { ImageModule } from 'primeng/image';
import { SkeletonModule } from 'primeng/skeleton';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { TagModule } from 'primeng/tag';

import { PhoneService, LazyLoadParams } from '../../../../core/services/phone.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirmation.service';
import { CsvExportService, CsvColumn } from '../../../../shared/services/csv-export.service';
import { Phone } from '../../../../models/phone.model';
import { PhoneStatus } from '../../../../enums/phone-status.enum';
import { PhoneConditionLabels } from '../../../../enums/phone-condition.enum';
import { MarkAsSoldDialogComponent } from '../mark-as-sold-dialog/mark-as-sold-dialog.component';
import { InventoryStatusActionsComponent } from '../inventory-status-actions/inventory-status-actions.component';
import { PrintLabelDialogComponent } from '../print-label-dialog/print-label-dialog.component';

@Component({
  selector: 'app-inventory-list',
  imports: [
    RouterLink,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    ImageModule,
    SkeletonModule,
    CurrencyPipe,
    DecimalPipe,
    TagModule,
    MarkAsSoldDialogComponent,
    InventoryStatusActionsComponent,
    PrintLabelDialogComponent
  ],
  templateUrl: './inventory-list.component.html'
})
export class InventoryListComponent implements OnInit {
  private phoneService = inject(PhoneService);
  private toastService = inject(ToastService);
  private confirmDialogService = inject(ConfirmDialogService);
  private csvExportService = inject(CsvExportService);
  private router = inject(Router);

  readonly PhoneStatus = PhoneStatus;

  phones = signal<Phone[]>([]);
  totalRecords = signal(0);
  loading = signal(false);
  exportLoading = signal(false);
  readonly skeletonRows = Array(5).fill({});
  bulkActionLoading = signal(false);
  selectedPhones = signal<Phone[]>([]);
  globalFilter = '';

  markAsSoldDialogVisible = signal(false);
  markAsSoldPhone = signal<Phone | null>(null);

  printLabelDialogVisible = signal(false);
  printLabelPhone = signal<Phone | null>(null);

  private lastLazyLoadEvent: TableLazyLoadEvent | null = null;
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    // Initial load is triggered by the table's onLazyLoad event
  }

  async loadPhones(event: TableLazyLoadEvent): Promise<void> {
    this.lastLazyLoadEvent = event;
    this.loading.set(true);

    try {
      const params: LazyLoadParams = {
        first: event.first ?? 0,
        rows: event.rows ?? 10,
        sortField: event.sortField as string | undefined,
        sortOrder: event.sortOrder ?? undefined,
        globalFilter: this.globalFilter || undefined
      };

      const response = await this.phoneService.getPhones(params);
      this.phones.set(response.data);
      this.totalRecords.set(response.total);
    } catch (error) {
      this.toastService.error('Error', 'Failed to load phones');
      console.error('Failed to load phones:', error);
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      if (this.lastLazyLoadEvent) {
        this.loadPhones({ ...this.lastLazyLoadEvent, first: 0 });
      }
    }, 300);
  }

  clearSearch(): void {
    this.globalFilter = '';
    this.onSearch();
  }

  getConditionLabel(condition: string): string {
    return PhoneConditionLabels[condition as keyof typeof PhoneConditionLabels] || condition;
  }

  getConditionSeverity(condition: string): 'success' | 'info' | 'warn' | 'secondary' | undefined {
    const severityMap: Record<string, 'success' | 'info' | 'warn'> = {
      new: 'success',
      refurbished: 'info',
      used: 'warn'
    };
    return severityMap[condition] || 'secondary';
  }

  getMarginSeverity(margin: number): 'danger' | 'warn' | 'success' {
    if (margin < 10) return 'danger';
    if (margin <= 25) return 'warn';
    return 'success';
  }

  getMarginTooltip(margin: number): string {
    if (margin < 10) return 'Low margin - consider adjusting price';
    if (margin <= 25) return 'Moderate margin';
    return 'Good margin';
  }

  onPrintLabel(phone: Phone): void {
    this.printLabelPhone.set(phone);
    this.printLabelDialogVisible.set(true);
  }

  onEdit(phone: Phone): void {
    this.router.navigate(['/admin/inventory', phone.id, 'edit']);
  }

  onMarkAsSold(phone: Phone): void {
    this.markAsSoldPhone.set(phone);
    this.markAsSoldDialogVisible.set(true);
  }

  onStatusChanged(): void {
    this.refreshTable();
  }

  onSaleSaved(): void {
    this.selectedPhones.set([]);
    this.refreshTable();
  }

  async onDelete(phone: Phone): Promise<void> {
    const itemDetails = `${phone.brandName} ${phone.model}${phone.imei ? ' (IMEI: ' + phone.imei + ')' : ''}`;
    const confirmed = await this.confirmDialogService.confirmDelete('phone', itemDetails);

    if (confirmed) {
      try {
        await this.phoneService.deletePhone(phone.id);
        this.toastService.success('Deleted', `${phone.brandName} ${phone.model} has been deleted`);
        this.refreshTable();
      } catch (error) {
        this.toastService.error('Error', 'Failed to delete phone');
        console.error('Failed to delete phone:', error);
      }
    }
  }

  async onBulkMarkAsSold(): Promise<void> {
    const selected = this.selectedPhones();
    if (selected.length === 0) return;

    const availablePhones = selected.filter(p => p.status === PhoneStatus.AVAILABLE);
    if (availablePhones.length === 0) {
      this.toastService.warn('Warning', 'No available phones selected to mark as sold');
      return;
    }

    const confirmed = await this.confirmDialogService.confirmBulkAction(
      'Mark as Sold',
      'phone',
      availablePhones.length
    );

    if (confirmed) {
      this.bulkActionLoading.set(true);
      try {
        const ids = availablePhones.map(p => p.id);
        await this.phoneService.updatePhonesStatus(ids, PhoneStatus.SOLD);
        this.toastService.success('Success', `${availablePhones.length} phone(s) marked as sold`);
        this.selectedPhones.set([]);
        this.refreshTable();
      } catch (error) {
        this.toastService.error('Error', 'Failed to mark phones as sold');
        console.error('Failed to mark phones as sold:', error);
      } finally {
        this.bulkActionLoading.set(false);
      }
    }
  }

  async onBulkDelete(): Promise<void> {
    const selected = this.selectedPhones();
    if (selected.length === 0) return;

    const confirmed = await this.confirmDialogService.confirmBulkDelete('phone', selected.length);

    if (confirmed) {
      this.bulkActionLoading.set(true);
      try {
        const ids = selected.map(p => p.id);
        await this.phoneService.deletePhones(ids);
        this.toastService.success('Deleted', `${selected.length} phone(s) have been deleted`);
        this.selectedPhones.set([]);
        this.refreshTable();
      } catch (error) {
        this.toastService.error('Error', 'Failed to delete phones');
        console.error('Failed to delete phones:', error);
      } finally {
        this.bulkActionLoading.set(false);
      }
    }
  }

  async onExportCsv(): Promise<void> {
    this.exportLoading.set(true);

    try {
      const phones = await this.phoneService.getExportPhones(
        this.globalFilter || undefined
      );

      if (phones.length === 0) {
        this.toastService.warn('No Data', 'No phones to export');
        return;
      }

      const columns: CsvColumn<Phone>[] = [
        { header: 'Brand', field: 'brandName' },
        { header: 'Model', field: 'model' },
        { header: 'Storage (GB)', field: (p) => p.storageGb },
        { header: 'RAM (GB)', field: (p) => p.ramGb },
        { header: 'Color', field: 'color' },
        { header: 'Condition', field: (p) => PhoneConditionLabels[p.condition as keyof typeof PhoneConditionLabels] || p.condition },
        { header: 'Battery Health (%)', field: (p) => p.batteryHealth },
        { header: 'Cost Price', field: 'costPrice' },
        { header: 'Selling Price', field: 'sellingPrice' },
        { header: 'Profit Margin (%)', field: (p) => p.profitMargin },
        { header: 'Status', field: 'status' },
        { header: 'Purchase Date', field: 'purchaseDate' },
        { header: 'IMEI', field: 'imei' },
        { header: 'Notes', field: 'notes' }
      ];

      this.csvExportService.exportToCsv(phones, columns, 'inventory_export');
      this.toastService.success('Export Complete', 'Inventory data exported to CSV');
    } catch (error) {
      this.toastService.error('Error', 'Failed to export inventory data');
      console.error('Failed to export inventory data:', error);
    } finally {
      this.exportLoading.set(false);
    }
  }

  private refreshTable(): void {
    if (this.lastLazyLoadEvent) {
      this.loadPhones(this.lastLazyLoadEvent);
    }
  }
}
