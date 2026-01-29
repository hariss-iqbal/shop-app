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
  template: `
    <div class="grid">
      <div class="col-12 flex flex-column sm:flex-row sm:align-items-center sm:justify-content-between gap-3 mb-4">
        <div>
          <h1 class="text-3xl font-bold m-0 mb-2">Inventory</h1>
          <p class="text-color-secondary m-0">
            Manage your phone inventory, track stock, and update product details
          </p>
        </div>
        <div class="flex flex-column sm:flex-row gap-2">
          <p-button
            label="Export to CSV"
            icon="pi pi-download"
            severity="secondary"
            [outlined]="true"
            [loading]="exportLoading()"
            [disabled]="loading()"
            (onClick)="onExportCsv()"
            styleClass="w-full sm:w-auto"
          />
          <p-button label="Add Phone" icon="pi pi-plus" routerLink="/admin/inventory/new" styleClass="w-full sm:w-auto" />
        </div>
      </div>

      <div class="col-12">
        <p-card>
          <div class="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3 mb-4">
            <div class="flex align-items-center gap-2 flex-wrap">
              @if (selectedPhones().length > 0) {
                <p-button
                  label="Mark as Sold"
                  icon="pi pi-check"
                  severity="success"
                  size="small"
                  [loading]="bulkActionLoading()"
                  (onClick)="onBulkMarkAsSold()"
                />
                <p-button
                  label="Delete Selected"
                  icon="pi pi-trash"
                  severity="danger"
                  size="small"
                  [loading]="bulkActionLoading()"
                  (onClick)="onBulkDelete()"
                />
                <p-tag severity="info" [value]="selectedPhones().length + ' selected'" styleClass="ml-2" />
              }
            </div>
            <div class="flex align-items-center gap-2">
              <p-iconfield>
                <p-inputicon styleClass="pi pi-search" />
                <input
                  pInputText
                  type="text"
                  placeholder="Search by brand or model..."
                  [(ngModel)]="globalFilter"
                  (input)="onSearch()"
                  (keydown.escape)="clearSearch()"
                  class="w-full md:w-20rem"
                  aria-label="Search phones"
                />
              </p-iconfield>
              @if (globalFilter) {
                <p-button
                  icon="pi pi-times"
                  [rounded]="true"
                  [text]="true"
                  severity="secondary"
                  size="small"
                  pTooltip="Clear search"
                  tooltipPosition="top"
                  (onClick)="clearSearch()"
                  aria-label="Clear search"
                />
              }
            </div>
          </div>

          <p-table
            #dt
            [value]="phones()"
            [lazy]="true"
            [paginator]="true"
            [rows]="10"
            [totalRecords]="totalRecords()"
            [loading]="loading()"
            [rowsPerPageOptions]="[10, 25, 50]"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} phones"
            [(selection)]="selectedPhones"
            [rowHover]="true"
            dataKey="id"
            (onLazyLoad)="loadPhones($event)"
            [globalFilterFields]="['brandName', 'model']"
            styleClass="p-datatable-sm"
            [scrollable]="true"
            scrollDirection="horizontal"
            [tableStyle]="{ 'min-width': '60rem' }"
          >
            <ng-template #header>
              <tr>
                <th style="width: 3rem">
                  <p-tableHeaderCheckbox />
                </th>
                <th style="width: 5rem">Image</th>
                <th pSortableColumn="brandName">
                  Brand
                  <p-sortIcon field="brandName" />
                </th>
                <th pSortableColumn="model">
                  Model
                  <p-sortIcon field="model" />
                </th>
                <th pSortableColumn="storageGb">
                  Storage
                  <p-sortIcon field="storageGb" />
                </th>
                <th pSortableColumn="condition">
                  Condition
                  <p-sortIcon field="condition" />
                </th>
                <th pSortableColumn="costPrice">
                  Cost Price
                  <p-sortIcon field="costPrice" />
                </th>
                <th pSortableColumn="sellingPrice">
                  Selling Price
                  <p-sortIcon field="sellingPrice" />
                </th>
                <th pSortableColumn="profitMargin">
                  Margin
                  <i
                    class="pi pi-info-circle text-xs text-color-secondary ml-1 cursor-help"
                    pTooltip="Profit margin: Red (<10%), Yellow (10-25%), Green (>25%)"
                    tooltipPosition="top"
                  ></i>
                  <p-sortIcon field="profitMargin" />
                </th>
                <th pSortableColumn="status">
                  Status
                  <p-sortIcon field="status" />
                </th>
                <th style="width: 9rem" alignFrozen="right" pFrozenColumn [frozen]="true">Actions</th>
              </tr>
            </ng-template>

            <ng-template #body let-phone>
              <tr>
                <td>
                  <p-tableCheckbox [value]="phone" />
                </td>
                <td>
                  @if (phone.primaryImageUrl) {
                    <p-image
                      [src]="phone.primaryImageUrl"
                      [alt]="phone.model"
                      width="50"
                      [preview]="true"
                      imageClass="border-round"
                    />
                  } @else {
                    <div class="flex align-items-center justify-content-center bg-surface-100 border-round" style="width: 50px; height: 50px;">
                      <i class="pi pi-image text-color-secondary"></i>
                    </div>
                  }
                </td>
                <td>
                  <div class="flex align-items-center gap-2">
                    @if (phone.brandLogoUrl) {
                      <img [src]="phone.brandLogoUrl" [alt]="phone.brandName" width="20" height="20" class="border-round" />
                    }
                    <span class="font-medium">{{ phone.brandName }}</span>
                  </div>
                </td>
                <td>{{ phone.model }}</td>
                <td>
                  @if (phone.storageGb) {
                    {{ phone.storageGb }} GB
                  } @else {
                    <span class="text-color-secondary">-</span>
                  }
                </td>
                <td>
                  <p-tag
                    [value]="getConditionLabel(phone.condition)"
                    [severity]="getConditionSeverity(phone.condition)"
                  />
                </td>
                <td>{{ phone.costPrice | currency }}</td>
                <td>{{ phone.sellingPrice | currency }}</td>
                <td>
                  <p-tag
                    [value]="(phone.profitMargin | number:'1.1-1') + '%'"
                    [severity]="getMarginSeverity(phone.profitMargin)"
                    [pTooltip]="getMarginTooltip(phone.profitMargin)"
                    tooltipPosition="top"
                  />
                </td>
                <td>
                  <app-inventory-status-actions
                    [phone]="phone"
                    (statusChanged)="onStatusChanged()"
                    (markAsSoldRequested)="onMarkAsSold($event)"
                    (printLabelRequested)="onPrintLabel($event)"
                  />
                </td>
                <td alignFrozen="right" pFrozenColumn [frozen]="true">
                  <div class="flex align-items-center gap-1">
                    <p-button
                      icon="pi pi-print"
                      [rounded]="true"
                      [text]="true"
                      severity="secondary"
                      size="small"
                      pTooltip="Print Label"
                      tooltipPosition="top"
                      (onClick)="onPrintLabel(phone)"
                    />
                    <p-button
                      icon="pi pi-pencil"
                      [rounded]="true"
                      [text]="true"
                      severity="info"
                      size="small"
                      pTooltip="Edit"
                      tooltipPosition="top"
                      (onClick)="onEdit(phone)"
                    />
                    <p-button
                      icon="pi pi-trash"
                      [rounded]="true"
                      [text]="true"
                      severity="danger"
                      size="small"
                      pTooltip="Delete"
                      tooltipPosition="top"
                      (onClick)="onDelete(phone)"
                    />
                  </div>
                </td>
              </tr>
            </ng-template>

            <ng-template #emptymessage>
              <tr>
                <td colspan="11" class="text-center p-4">
                  <div class="flex flex-column align-items-center gap-3">
                    <i class="pi pi-inbox text-4xl text-color-secondary"></i>
                    <span class="text-color-secondary">No phones found</span>
                    <p-button
                      label="Add Your First Phone"
                      icon="pi pi-plus"
                      routerLink="/admin/inventory/new"
                    />
                  </div>
                </td>
              </tr>
            </ng-template>

            <ng-template #loadingbody>
              @for (_ of skeletonRows; track $index) {
                <tr>
                  <td><p-skeleton width="1.5rem" height="1.5rem" /></td>
                  <td><p-skeleton width="50px" height="50px" borderRadius="0.5rem" /></td>
                  <td><p-skeleton width="60%" /></td>
                  <td><p-skeleton width="70%" /></td>
                  <td><p-skeleton width="50%" /></td>
                  <td><p-skeleton width="4rem" height="1.5rem" borderRadius="1rem" /></td>
                  <td><p-skeleton width="60%" /></td>
                  <td><p-skeleton width="60%" /></td>
                  <td><p-skeleton width="4rem" height="1.5rem" borderRadius="1rem" /></td>
                  <td>
                    <div class="flex align-items-center gap-2">
                      <p-skeleton width="4rem" height="1.5rem" borderRadius="1rem" />
                      <p-skeleton shape="circle" size="1.5rem" />
                    </div>
                  </td>
                  <td alignFrozen="right" pFrozenColumn [frozen]="true">
                    <div class="flex gap-1">
                      <p-skeleton shape="circle" size="2rem" />
                      <p-skeleton shape="circle" size="2rem" />
                      <p-skeleton shape="circle" size="2rem" />
                    </div>
                  </td>
                </tr>
              }
            </ng-template>
          </p-table>
        </p-card>
      </div>
    </div>

    <app-mark-as-sold-dialog
      [phone]="markAsSoldPhone()"
      [visible]="markAsSoldDialogVisible()"
      (visibleChange)="markAsSoldDialogVisible.set($event)"
      (saleSaved)="onSaleSaved()"
    />

    <app-print-label-dialog
      [phone]="printLabelPhone()"
      [visible]="printLabelDialogVisible()"
      (visibleChange)="printLabelDialogVisible.set($event)"
    />
  `
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
